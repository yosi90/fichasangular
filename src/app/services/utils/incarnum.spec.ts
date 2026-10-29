import { Clase } from 'src/app/interfaces/clase';
import { Dote } from 'src/app/interfaces/dote';
import { FormacionIncarnumDto, PersonajeIncarnum } from 'src/app/interfaces/incarnum';
import { fusionApi, moldeadoEncarnadoApi } from 'src/testing/incarnum';
import {
    calcularIncarnumBorrador,
    capacidadBasica,
    capacidadesDeFormacion,
    cumplePrerrequisitoIncarnum,
    EntradaIncarnumBorrador,
    fusionesMoldeables,
    incarnumParaPrerrequisitos,
    validarFormacionIncarnum,
} from './incarnum';
import { normalizarCapacidadEsencia, normalizarClaseMoldeado, normalizarDoteIncarnum, normalizarFusion } from './incarnum-mapper';

const TABLA = [
    { Capacidad: 1, Incremento_cada: null, Nivel_maximo: 5, Nivel_minimo: 1 },
    { Capacidad: 2, Incremento_cada: null, Nivel_maximo: 11, Nivel_minimo: 6 },
    { Capacidad: 3, Incremento_cada: null, Nivel_maximo: 17, Nivel_minimo: 12 },
    { Capacidad: 4, Incremento_cada: null, Nivel_maximo: 20, Nivel_minimo: 18 },
    { Capacidad: 7, Incremento_cada: 10, Nivel_maximo: null, Nivel_minimo: 51 },
].map(normalizarCapacidadEsencia);

function encarnado(): Clase {
    return { Id: 405, Nombre: 'Encarnado', Moldeado: normalizarClaseMoldeado(moldeadoEncarnadoApi()) } as Clase;
}

function dote(id: number, nombre: string, incarnum: Record<string, unknown> | null, extras: Partial<Dote> = {}): Dote {
    return { Id: id, Nombre: nombre, Incarnum: normalizarDoteIncarnum(incarnum), Cuenta_como: [], ...extras } as Dote;
}

const DUREZA_AZUR = dote(1087, 'Dureza azur', { Esencia_reserva: 1, Receptaculo: true });
const ESENCIA_ADICIONAL = dote(1090, 'Esencia adicional', { Esencia_reserva: 1, Esencia_reserva_moldeador: 2 });
const CAPACIDAD_FUSION = dote(1102, 'Capacidad de fusión ampliada', { Capacidad: { Bono: 1, Ambito: 'fusiones', Tope_constitucion: true } });
const ABRIR_CHAKRA = dote(1116, 'Abrir chakra menor', { Abre_chakra: true }, {
    Extras_soportados: { Extra_arma: 0, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0, Extra_chakra: 1 },
    Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [], Chakras: [{ Id: 37, Nombre: 'Brazos' }] },
} as Partial<Dote>);
const MOLDEAR_FUSION = dote(1123, 'Moldear fusión', { Divisor_nivel_moldeador: 2 }, {
    Extras_soportados: { Extra_arma: 0, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0, Extra_fusion: 1 },
    Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [], Fusiones: [{ Id: 284, Nombre: 'Yelmo de cristal' }] },
} as Partial<Dote>);

function entrada(cambios: Partial<EntradaIncarnumBorrador> = {}): EntradaIncarnumBorrador {
    return {
        clases: [{ clase: encarnado(), nombre: 'Encarnado', nivel: 5 }],
        dotes: [{ dote: DUREZA_AZUR, idExtra: 0 }],
        raciales: [{ id: 224, nombre: 'Esencia (azurín)', esencia: { Reserva: 1, Receptaculo: false } }],
        especiales: [],
        puntuaciones: { fuerza: 10, destreza: 12, constitucion: 14, inteligencia: 10, sabiduria: 15, carisma: 13 },
        nivelPersonaje: 5,
        capacidad: TABLA,
        ...cambios,
    };
}

describe('incarnum (reglas de la creación)', () => {
    it('la capacidad básica sale de la tabla, también en el tramo épico sin tope', () => {
        expect(capacidadBasica(1, TABLA)).toBe(1);
        expect(capacidadBasica(6, TABLA)).toBe(2);
        expect(capacidadBasica(20, TABLA)).toBe(4);
        expect(capacidadBasica(51, TABLA)).toBe(7);
        expect(capacidadBasica(72, TABLA)).toBe(9);
        expect(capacidadBasica(5, [])).toBe(0);
    });

    it('el bloque del borrador: reserva con su desglose, fusiones a la vez, vínculos, chakras abiertos, capacidad y CD', () => {
        const bloque = calcularIncarnumBorrador(entrada())!;
        expect(bloque.reserva.total).toBe(7);
        expect(bloque.reserva.desglose).toEqual([
            { tipo: 'clase', origen: 'Encarnado', valor: 5 },
            { tipo: 'dote', origen: 'Dureza azur', valor: 1 },
            { tipo: 'racial', origen: 'Esencia (azurín)', valor: 1 },
        ]);
        const clase = bloque.clases[0];
        expect(clase.fusionesMaximas).toBe(4);
        expect(clase.vinculos).toBe(1);
        expect(clase.chakrasAbiertos.map((c) => c.nombre)).toEqual(['Corona', 'Pies', 'Manos']);
        expect(clase.capacidadFusiones).toBe(2);
        expect(clase.cd).toEqual({ base: 12, caracteristica: 'Sabiduría', modificador: 2 });
        expect(bloque.receptaculos).toEqual([{ tipo: 'dote', id: 1087, nombre: 'Dureza azur', capacidad: 1, esencia: 0 }]);
        expect(bloque.puedeMoldear).toBeTrue();
    });

    it('las fusiones a la vez no pasan de la Constitución − 10; sin clase moldeadora ni nada de incarnum, `null`', () => {
        expect(calcularIncarnumBorrador(entrada({ puntuaciones: { constitucion: 12, sabiduria: 10 } }))!.clases[0].fusionesMaximas).toBe(2);
        expect(calcularIncarnumBorrador(entrada({ clases: [], dotes: [], raciales: [] }))).toBeNull();
    });

    it('Esencia adicional suma más si ya moldea; las dotes de capacidad llevan el tope de la Constitución', () => {
        const bloque = calcularIncarnumBorrador(entrada({ dotes: [{ dote: ESENCIA_ADICIONAL, idExtra: 0 }, { dote: CAPACIDAD_FUSION, idExtra: 0 }] }))!;
        expect(bloque.reserva.desglose.find((p) => p.origen === 'Esencia adicional')?.valor).toBe(2);
        expect(bloque.capacidad.modificadores).toEqual([{ origen: 'Capacidad de fusión ampliada', ambito: 'fusiones', bono: 1 }]);
        const sinMoldear = calcularIncarnumBorrador(entrada({ clases: [], dotes: [{ dote: ESENCIA_ADICIONAL, idExtra: 0 }] }))!;
        expect(sinMoldear.reserva.desglose.find((p) => p.origen === 'Esencia adicional')?.valor).toBe(1);
    });

    it('Abrir chakra y Moldear fusión: el chakra y la fusión elegidos, con el nivel de moldeador de la dote', () => {
        const bloque = calcularIncarnumBorrador(entrada({
            clases: [],
            nivelPersonaje: 7,
            dotes: [{ dote: ABRIR_CHAKRA, idExtra: 37 }, { dote: MOLDEAR_FUSION, idExtra: 284 }],
        }))!;
        expect(bloque.chakrasDeDotes).toEqual([jasmine.objectContaining({ chakra: jasmine.objectContaining({ id: 37, nombre: 'Brazos' }) })]);
        expect(bloque.fusionesDeDotes[0]).toEqual(jasmine.objectContaining({ nivelMoldeador: 3 }));
        expect(bloque.puedeMoldear).toBeTrue();
    });

    it('los prerrequisitos de incarnum se miran con el bloque', () => {
        const numeros = incarnumParaPrerrequisitos(calcularIncarnumBorrador(entrada()));
        expect(numeros).toEqual({ reserva: 7, nivelMoldeador: 5, fusiones: 4, vinculos: 1, chakrasVinculables: [34, 35, 36] });
        expect(cumplePrerrequisitoIncarnum('esencia_minima', { Cantidad: 1 }, numeros, 0)).toBeTrue();
        expect(cumplePrerrequisitoIncarnum('esencia_minima', { Cantidad: 8 }, numeros, 0)).toBeFalse();
        expect(cumplePrerrequisitoIncarnum('sin_esencia', {}, numeros, 0)).toBeFalse();
        expect(cumplePrerrequisitoIncarnum('nivel_moldeador', { Nivel: 5 }, numeros, 0)).toBeTrue();
        expect(cumplePrerrequisitoIncarnum('fusiones_minimas', { Cantidad: 5 }, numeros, 0)).toBeFalse();
        expect(cumplePrerrequisitoIncarnum('vinculos_minimos', { Cantidad: 1 }, numeros, 0)).toBeTrue();
        expect(cumplePrerrequisitoIncarnum('vinculo_chakra', { Id_chakra: 42 }, numeros, 0)).toBeFalse();
        expect(cumplePrerrequisitoIncarnum('vinculo_chakra', { Id_chakra: 34 }, numeros, 0)).toBeTrue();
        expect(cumplePrerrequisitoIncarnum('sin_lanzador_arcano', {}, numeros, 3)).toBeFalse();
        expect(cumplePrerrequisitoIncarnum('caracteristica', {}, numeros, 0)).toBeNull();
        expect(cumplePrerrequisitoIncarnum('sin_esencia', {}, incarnumParaPrerrequisitos(null), 0)).toBeTrue();
    });

    describe('las fusiones que puede moldear y la formación de partida', () => {
        const yelmo = normalizarFusion(fusionApi());
        const maligna = normalizarFusion(fusionApi({
            Id: 290, Nombre: 'Guanteletes de la guerra de sangre',
            Descriptores: [{ Id: 9, Nombre: 'Maligno', Actitud: { Id: 5, Nombre: 'Maligno' } }],
            Chakras: [{ Id: 36, Nombre: 'Manos', Ocupa: true, Vinculo: true }],
        }));
        const sandalias = normalizarFusion(fusionApi({ Id: 283, Nombre: 'Sandalias cerúleas', Descriptores: [], Chakras: [
            { Id: 35, Nombre: 'Pies', Ocupa: true, Vinculo: true },
        ] }));
        const brazales = normalizarFusion(fusionApi({ Id: 270, Nombre: 'Brazales', Descriptores: [], Chakras: [
            { Id: 37, Nombre: 'Brazos', Ocupa: true, Vinculo: true },
        ] }));
        const fusiones = [yelmo, maligna, sandalias, brazales];
        const neutralBueno = { actitudes: [2, 4], descriptoresSinAlineamiento: [] };
        let bloque: PersonajeIncarnum;

        beforeEach(() => bloque = calcularIncarnumBorrador(entrada({ fusiones }))!);

        const formacion = (fusionesFormacion: FormacionIncarnumDto['fusiones'], receptaculos: FormacionIncarnumDto['receptaculos'] = []): FormacionIncarnumDto =>
            ({ fusiones: fusionesFormacion, receptaculos });

        it('el límite de alineamiento de la lista: fuera las de un descriptor que no comparte, salvo con una dote que lo permite', () => {
            expect(fusionesMoldeables(405, true, fusiones, neutralBueno).map((f) => f.Id)).toEqual([284, 283, 270]);
            expect(fusionesMoldeables(405, false, fusiones, neutralBueno).length).toBe(4);
            expect(fusionesMoldeables(405, true, fusiones, { actitudes: [2, 4], descriptoresSinAlineamiento: [9] }).length).toBe(4);
        });

        it('una formación válida no da fallo', () => {
            const valida = formacion([
                { idFusion: 284, idClase: 405, idChakra: 34, idChakraVinculo: 34, esencia: 2 },
                { idFusion: 283, idClase: 405, idChakra: 35, esencia: 1 },
            ], [{ tipo: 'dote', id: 1087, esencia: 1 }]);
            expect(validarFormacionIncarnum(valida, bloque, fusiones, neutralBueno)).toBeNull();
        });

        it('da los mismos códigos y campos que la API', () => {
            const codigo = (f: FormacionIncarnumDto) => validarFormacionIncarnum(f, bloque, fusiones, neutralBueno)?.code ?? null;
            const campo = (f: FormacionIncarnumDto) => validarFormacionIncarnum(f, bloque, fusiones, neutralBueno)?.field ?? null;
            expect(codigo(formacion([{ idFusion: 999, idClase: 405, idChakra: 34, esencia: 0 }]))).toBe('fusion_no_encontrada');
            expect(codigo(formacion([{ idFusion: 284, idClase: 405, idChakra: 34, esencia: 0 }, { idFusion: 284, idClase: 405, idChakra: 35, esencia: 0 }]))).toBe('fusion_repetida');
            expect(codigo(formacion([{ idFusion: 284, idClase: 406, idChakra: 34, esencia: 0 }]))).toBe('clase_sin_moldeado');
            expect(codigo(formacion([{ idFusion: 284, idChakra: 34, esencia: 0 }]))).toBe('fusion_fuera_de_lista');
            expect(codigo(formacion([{ idFusion: 290, idClase: 405, idChakra: 36, esencia: 0 }]))).toBe('fusion_no_alineada');
            expect(codigo(formacion([{ idFusion: 284, idClase: 405, idChakra: 35, esencia: 0 }]))).toBe('chakra_no_valido');
            expect(campo(formacion([{ idFusion: 284, idClase: 405, idChakra: 35, esencia: 0 }]))).toBe('incarnum.fusiones[0].idChakra');
            expect(codigo(formacion([{ idFusion: 270, idClase: 405, idChakra: 37, idChakraVinculo: 37, esencia: 0 }]))).toBe('chakra_cerrado');
            expect(codigo(formacion([
                { idFusion: 284, idClase: 405, idChakra: 34, idChakraVinculo: 34, esencia: 0 },
                { idFusion: 283, idClase: 405, idChakra: 35, idChakraVinculo: 35, esencia: 0 },
            ]))).toBe('demasiados_vinculos');
            expect(codigo(formacion([{ idFusion: 284, idClase: 405, idChakra: 34, esencia: 3 }]))).toBe('capacidad_superada');
            expect(codigo(formacion([], [{ tipo: 'dote', id: 1, esencia: 1 }]))).toBe('receptaculo_no_valido');
            expect(codigo(formacion([], [{ tipo: 'dote', id: 1087, esencia: 1 }, { tipo: 'dote', id: 1087, esencia: 0 }]))).toBe('receptaculo_repetido');
            expect(codigo(formacion([], [{ tipo: 'dote', id: 1087, esencia: 2 }]))).toBe('capacidad_superada');
        });

        it('más fusiones que las que deja la clase, y más esencia que la reserva', () => {
            const pocas = calcularIncarnumBorrador(entrada({ fusiones, puntuaciones: { constitucion: 11, sabiduria: 15 } }))!;
            expect(validarFormacionIncarnum(formacion([
                { idFusion: 284, idClase: 405, idChakra: 34, esencia: 0 },
                { idFusion: 283, idClase: 405, idChakra: 35, esencia: 0 },
            ]), pocas, fusiones, neutralBueno)?.code).toBe('demasiadas_fusiones');
            const sinReserva = { ...bloque, reserva: { total: 1, desglose: [] } };
            expect(validarFormacionIncarnum(formacion([
                { idFusion: 284, idClase: 405, idChakra: 34, esencia: 1 },
                { idFusion: 283, idClase: 405, idChakra: 35, esencia: 1 },
            ]), sinReserva, fusiones, neutralBueno)?.code).toBe('esencia_insuficiente');
        });

        it('la dote de capacidad de una sola fusión sube la de una fusión, no la de todas', () => {
            const conDote = calcularIncarnumBorrador(entrada({ fusiones, dotes: [{ dote: CAPACIDAD_FUSION, idExtra: 0 }] }))!;
            const dos = [{ idClase: 405, esencia: 3 }, { idClase: 405, esencia: 3 }];
            expect(capacidadesDeFormacion(conDote, [{ idClase: 405, esencia: 3 }]).extra).toEqual([1]);
            expect(capacidadesDeFormacion(conDote, dos).extra).toBeNull();
        });
    });
});
