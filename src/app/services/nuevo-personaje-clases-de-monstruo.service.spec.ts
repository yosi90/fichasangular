import { NuevoPersonajeService } from './nuevo-personaje.service';
import { PersonajeService } from './personaje.service';
import { Clase } from '../interfaces/clase';
import { Raza } from '../interfaces/raza';
import { normalizeClase } from './clase.service';
import { normalizeRazaApi } from './utils/raza-mapper';
import {
    baseApi,
    claseDeMonstruoApi,
    ENGENDRO_VAMPIRICO,
    MOMIA,
    NECROFAGO,
    razaDeMonstruoSobreApi,
    TablaClaseDeMonstruo,
} from 'src/testing/clases-de-monstruo-api';
import { claseDeMonstruoConEspecialesApi, conIdsDeRolDev, RAZAS_LIBRIS_MORTIS_API } from 'src/testing/clases-de-monstruo-especiales-api';
import { HabilidadBasicaDetalle } from '../interfaces/habilidad';
import { textoClasePersonaje } from '../components/detalles/ficha/personaje';

/**
 * La creación con una clase de monstruo muerto viviente de *Libris Mortis* (fase 5.2 del roadmap `ACTIVO_razas-mutadas`;
 * estudio, apartado 3.4): la clase obligada desde el 1.er nivel y hasta terminarla; los PG, los puntos de habilidad, las
 * dotes y la armadura natural por la tabla de la clase; los PX. Con los datos del contrato simulados
 * (`src/testing/clases-de-monstruo-api.ts`): aún no hay datos de las cinco clases en `rol_dev`.
 */

/** Un guerrero del Manual del jugador (d10, 2 puntos, dote a 1.º y cada 2), con la forma de `GET /clases`. */
function guerreroApi(): Record<string, any> {
    const base = claseDeMonstruoApi({ ...ENGENDRO_VAMPIRICO, id: 9, nombre: 'Guerrero', mutacion: { Id: 0, Nombre: '' } });
    return {
        ...base,
        Tipo_dado: { Id: 4, Nombre: 'd10' },
        Puntos_habilidad: { Id: 1, Valor: 2 },
        Nivel_max_claseo: 20,
        Progresion_obligatoria: false,
        Sin_penalizacion_multiclase: false,
        Mutacion: null,
        Desglose_niveles: Array.from({ length: 20 }, (_, i) => ({
            ...base['Desglose_niveles'][0],
            Nivel: i + 1,
            Ataque_base: `+${i + 1}`,
            Dg: true,
            Dote: null,
            Armadura_natural: 0,
        })),
    };
}

const CARACTERISTICAS = { Fuerza: 14, Destreza: 12, Constitucion: 13, Inteligencia: 10, Sabiduria: 11, Carisma: 9 };

interface Creacion {
    svc: NuevoPersonajeService;
    claseMonstruo: Clase;
    guerrero: Clase;
}

function crear(tabla: TablaClaseDeMonstruo, raza: Raza, base: Raza | null): Creacion {
    const svc = new NuevoPersonajeService();
    const claseMonstruo = normalizeClase(claseDeMonstruoApi(tabla));
    const guerrero = normalizeClase(guerreroApi());
    svc.setCatalogoClases([claseMonstruo, guerrero]);
    expect(svc.seleccionarRaza(raza, base)).toBeTrue();
    svc.aplicarCaracteristicasGeneradas(CARACTERISTICAS);
    return { svc, claseMonstruo, guerrero };
}

/** Aplica `veces` niveles de la clase y devuelve los puntos de habilidad de cada uno. */
function subir(svc: NuevoPersonajeService, clase: Clase, veces: number): number[] {
    const puntos: number[] = [];
    for (let i = 0; i < veces; i++) {
        const resultado = svc.aplicarSiguienteNivelClase(clase);
        expect(resultado.aplicado).withContext(`${clase.Nombre} ${i + 1}: ${resultado.razon ?? ''}`).toBeTrue();
        svc.registrarDotesPendientesPorProgresion(`${clase.Nombre} nivel ${i + 1}`);
        svc.iniciarDistribucionHabilidadesPorClase(clase);
        puntos.push(svc.EstadoFlujo.habilidades.puntosTotales);
    }
    return puntos;
}

function dotesDeNivel(svc: NuevoPersonajeService): number[] {
    return svc.getDotesPendientes().filter((dote) => dote.fuente === 'nivel').map((dote) => Number(dote.nivelProgresion));
}

function engendroSobre(base: 'gnoll' | 'humano' | 'enano', cambios: Record<string, any> = {}): { raza: Raza; base: Raza; } {
    const baseRaw = baseApi(base);
    return {
        raza: normalizeRazaApi(razaDeMonstruoSobreApi(ENGENDRO_VAMPIRICO, baseRaw, { Fuerza: 2, Carisma: 2 }, cambios)),
        base: normalizeRazaApi(baseRaw),
    };
}

describe('NuevoPersonajeService (clases de monstruo de Libris Mortis)', () => {
    it('lee la tabla por nivel, la mutación y las dos marcas de la clase (contrato de la fase 1)', () => {
        const clase = normalizeClase(claseDeMonstruoApi(ENGENDRO_VAMPIRICO));

        expect(clase.Mutacion).toEqual({ Id: 801, Nombre: 'Engendro vampírico' });
        expect(clase.Progresion_obligatoria).toBeTrue();
        expect(clase.Sin_penalizacion_multiclase).toBeTrue();
        expect(clase.Desglose_niveles.map((fila) => fila.Dg)).toEqual([true, false, true, false, true, false, true, false]);
        expect(clase.Desglose_niveles.map((fila) => fila.Dote)).toEqual([true, false, false, false, false, true, false, false]);
        expect(clase.Desglose_niveles.map((fila) => fila.Armadura_natural)).toEqual([0, 1, 1, 2, 2, 2, 3, 3]);
    });

    it('una clase sin tabla (y la caché, que no escribe los null) da lo de siempre', () => {
        const raw = guerreroApi();
        delete raw['Mutacion'];
        raw['Desglose_niveles'].forEach((fila: Record<string, any>) => { delete fila['Dote']; delete fila['Dg']; delete fila['Armadura_natural']; });

        const clase = normalizeClase(raw);

        expect(clase.Mutacion).toBeNull();
        expect(clase.Progresion_obligatoria).toBeFalse();
        expect(clase.Desglose_niveles[0]).toEqual(jasmine.objectContaining({ Dg: true, Dote: null, Armadura_natural: 0 }));
    });

    describe('qué clases se pueden elegir', () => {
        it('una raza que no es la mutación no puede tomar la clase de monstruo', () => {
            const svc = new NuevoPersonajeService();
            const engendro = normalizeClase(claseDeMonstruoApi(ENGENDRO_VAMPIRICO));
            const guerrero = normalizeClase(guerreroApi());
            svc.setCatalogoClases([engendro, guerrero]);
            svc.seleccionarRaza(normalizeRazaApi(baseApi('humano')));

            const evaluacion = svc.evaluarClaseParaSeleccion(engendro);
            expect(evaluacion.estado).toBe('blocked_failed');
            expect(evaluacion.razones).toEqual(['«Engendro vampírico» solo la puede tomar un personaje de la raza «Engendro vampírico».']);
            expect(svc.evaluarClaseParaSeleccion(guerrero).estado).toBe('eligible');
            expect(svc.claseObligadaActual()).toBeNull();
        });

        it('el engendro vampírico humano empieza con su clase y no toma otra hasta terminarla (8 niveles)', () => {
            const { raza, base } = engendroSobre('humano');
            const { svc, claseMonstruo, guerrero } = crear(ENGENDRO_VAMPIRICO, raza, base);

            expect(svc.claseDeMonstruoDeRaza(raza.Id)?.Nombre).toBe('Engendro vampírico');
            expect(svc.evaluarClaseParaSeleccion(claseMonstruo).estado).toBe('eligible');
            expect(svc.evaluarClaseParaSeleccion(guerrero).razones)
                .toEqual(['Un personaje de la raza «Engendro vampírico» empieza con su clase, «Engendro vampírico», desde el 1.er nivel.']);
            expect(svc.claseObligadaActual()?.clase.Id).toBe(901);

            subir(svc, claseMonstruo, 1);
            expect(svc.evaluarClaseParaSeleccion(guerrero).razones)
                .toEqual(['Hay que terminar «Engendro vampírico» (8 niveles) antes de tomar otra clase.']);
            expect(svc.aplicarSiguienteNivelClase(guerrero).aplicado).toBeFalse();

            subir(svc, claseMonstruo, 7);
            expect(svc.evaluarClaseParaSeleccion(guerrero).estado).toBe('eligible');
            expect(svc.evaluarClaseParaSeleccion(claseMonstruo).razones).toEqual(['Nivel máximo alcanzado para esta clase']);
            expect(svc.claseObligadaActual()).toBeNull();
        });
    });

    describe('humano engendro vampírico 8 (Libris Mortis, tabla 2-3)', () => {
        let creacion: Creacion;
        let puntos: number[];

        beforeEach(() => {
            // Una base con armadura natural +1 (en la combinación, la de la base): la de la clase se apila con ella.
            const { raza, base } = engendroSobre('humano', { ant: 1 });
            creacion = crear(ENGENDRO_VAMPIRICO, raza, base);
            puntos = subir(creacion.svc, creacion.claseMonstruo, 8);
        });

        it('sin Constitución, 4 DG de d12: el primero al máximo y tres tiradas', () => {
            const svc = creacion.svc;
            expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
            const tiradas = spyOn<any>(svc, 'randomInt').and.returnValues(5, 6, 7);

            const vida = svc.calcularVidaFinalAleatoria();

            expect(tiradas).toHaveBeenCalledTimes(3);
            expect(vida.maximo).toBe(48);
            expect(vida.total).toBe(12 + 5 + 6 + 7);
            expect(vida.detalle.nivelesClase).toBe(4);
        });

        it('puntos de habilidad solo en los niveles con DG: (4 + Int) × 4 y los 4 del humano a 1.º; 4 + 1 a 3.º, 5.º y 7.º', () => {
            expect(puntos).toEqual([20, 0, 5, 0, 5, 0, 5, 0]);
        });

        it('dotes a 1.º y 6.º de su tabla (no a 3.º), y la del humano aparte', () => {
            expect(dotesDeNivel(creacion.svc)).toEqual([1, 6]);
        });

        it('la armadura natural de su tabla a 8.º (+3, no la suma de las filas) más la de la raza', () => {
            expect(creacion.svc.PersonajeCreacion.Armadura_natural).toBe(3 + 1);
        });

        it('el nivel de personaje sigue siendo 8 (NEP y aumentos a 4.º y 8.º); los DG de los prerrequisitos, 4', () => {
            const svc = creacion.svc as any;
            expect(svc.getNivelEfectivoParaAumentos()).toBe(8);
            expect(creacion.svc.PersonajeCreacion.NEP).toBe(8);
            expect(svc.resolverDgTotalActual()).toBe(4);
        });

        it('«Tu personaje» distingue sus DG: el desglose lleva 4 DG a 8.º («Engendro vampírico 8 (4 DG)»)', () => {
            const entrada = (creacion.svc.PersonajeCreacion.desgloseClases ?? [])[0];
            expect(entrada?.Nivel).toBe(8);
            expect(entrada?.Dgs).toBe(4);
            expect(textoClasePersonaje(entrada!)).toContain('4 DG');
        });

        it('engendro 8 / guerrero 1: la dote del 9.º nivel de personaje, 5 DG y sin penalización de PX', () => {
            const svc = creacion.svc;
            expect(svc.penalizacionExperiencia(creacion.guerrero).porcentaje).toBe(0);
            const puntosGuerrero = subir(svc, creacion.guerrero, 1);

            expect(dotesDeNivel(svc)).toEqual([1, 6, 9]);
            expect(puntosGuerrero).toEqual([2 + 1]);
            expect((svc as any).resolverDgTotalActual()).toBe(5);
            spyOn<any>(svc, 'randomInt').and.returnValue(1);
            expect(svc.calcularVidaFinalAleatoria().maximo).toBe(48 + 10);
            expect(svc.PersonajeCreacion.Penalizacion_experiencia?.porcentaje).toBe(0);
        });
    });

    it('sin la marca, el engendro 8 / guerrero 1 sí penalizaría la multiclase (el gnoll: su predilecta es el explorador)', () => {
        const { raza, base } = engendroSobre('gnoll');
        const conMarca = crear(ENGENDRO_VAMPIRICO, raza, base);
        subir(conMarca.svc, conMarca.claseMonstruo, 8);
        expect(conMarca.svc.penalizacionExperiencia(conMarca.guerrero).porcentaje).toBe(0);

        const sinMarca = { ...conMarca.claseMonstruo, Sin_penalizacion_multiclase: false };
        conMarca.svc.setCatalogoClases([sinMarca, conMarca.guerrero]);
        expect(conMarca.svc.penalizacionExperiencia(conMarca.guerrero).porcentaje).toBe(20);
    });

    it('gnoll engendro vampírico 1: los 2 DG raciales (d8) y uno de la clase (d12); la dote de su tabla en el 3.er nivel de personaje', () => {
        const { raza, base } = engendroSobre('gnoll');
        const { svc, claseMonstruo } = crear(ENGENDRO_VAMPIRICO, raza, base);
        subir(svc, claseMonstruo, 1);

        expect(dotesDeNivel(svc)).toEqual([3]);
        expect((svc as any).resolverDgTotalActual()).toBe(3);
        spyOn<any>(svc, 'randomInt').and.returnValue(1);
        expect(svc.calcularVidaFinalAleatoria().maximo).toBe(8 + 8 + 12);
        // Gnoll: 2 DG + ajuste +1 + 1 nivel de la clase.
        expect(svc.PersonajeCreacion.NEP).toBe(4);
    });

    it('enano momia 13 / guerrero 1: 8 DG de la momia, dotes a 1.º, 4.º y 10.º, AN +10 y 10 pies (Libris Mortis, tabla 2-5)', () => {
        const baseRaw = baseApi('enano');
        // La combinación de la momia: Fue +2, Int −4 y «10 pies menos que la raza base» (el enano, de 20 a 10).
        const raza = normalizeRazaApi(razaDeMonstruoSobreApi(MOMIA, baseRaw, { Fuerza: 2, Inteligencia: -4 }, { co: 10 }));
        const { svc, claseMonstruo, guerrero } = crear(MOMIA, raza, normalizeRazaApi(baseRaw));
        const puntos = subir(svc, claseMonstruo, 13);
        subir(svc, guerrero, 1);

        expect(puntos.filter((valor) => valor > 0).length).toBe(8);
        expect(dotesDeNivel(svc)).toEqual([1, 4, 10]);
        expect(svc.PersonajeCreacion.Armadura_natural).toBe(10);
        expect(svc.PersonajeCreacion.Correr).toBe(10);
        expect((svc as any).resolverDgTotalActual()).toBe(9);
        expect((svc as any).getNivelEfectivoParaAumentos()).toBe(14);
        spyOn<any>(svc, 'randomInt').and.returnValue(1);
        expect(svc.calcularVidaFinalAleatoria().maximo).toBe(8 * 12 + 10);
    });
});

/**
 * Los huecos de la creación que dejaron los datos de las clases de monstruo (2026-11-07, `bugs.md` del roadmap): con los
 * especiales por nivel que da `GET /clases/{id}` de `rol_dev` y las razas combinadas reales (sobre el humano), las
 * habilidades que mejora una aptitud, su reducción del daño y sus armas naturales.
 */
describe('NuevoPersonajeService (clases de monstruo: habilidades, RD y armas naturales de sus aptitudes)', () => {
    // Las siete habilidades del engendro vampírico (Libris Mortis, pág. 36), con sus ids de `rol_dev`.
    const SIETE = [[5, 'Averiguar intenciones'], [6, 'Avistar'], [7, 'Buscar'], [13, 'Engañar'], [16, 'Esconderse'],
        [17, 'Escuchar'], [26, 'Moverse sigilosamente']] as const;
    const catalogoHabilidades: HabilidadBasicaDetalle[] = SIETE.map(([id, nombre]) => ({
        Id_habilidad: id, Nombre: nombre, Id_caracteristica: 5, Caracteristica: 'Sabiduría', Descripcion: '',
        Soporta_extra: false, Entrenada: false, Extras: [],
    }));

    function crearLibris(tabla: TablaClaseDeMonstruo, idClase: number, raza: 'engendroSobreHumano' | 'momiaSobreHumano' | 'necrofagoSobreHumano'): Creacion {
        const svc = new NuevoPersonajeService();
        const claseMonstruo = normalizeClase(claseDeMonstruoConEspecialesApi(conIdsDeRolDev(tabla, idClase, RAZAS_LIBRIS_MORTIS_API[raza]['i'])));
        const guerrero = normalizeClase(guerreroApi());
        svc.setCatalogoClases([claseMonstruo, guerrero]);
        svc.setCatalogoHabilidades(catalogoHabilidades);
        expect(svc.seleccionarRaza(normalizeRazaApi(JSON.parse(JSON.stringify(RAZAS_LIBRIS_MORTIS_API[raza]))),
            normalizeRazaApi(JSON.parse(JSON.stringify(RAZAS_LIBRIS_MORTIS_API.humano))))).toBeTrue();
        svc.aplicarCaracteristicasGeneradas(CARACTERISTICAS);
        return { svc, claseMonstruo, guerrero };
    }

    const habilidad = (svc: NuevoPersonajeService, nombre: string) =>
        svc.PersonajeCreacion.Habilidades.find((h) => h.Nombre === nombre && !h.Custom);
    const rds = (svc: NuevoPersonajeService) => svc.PersonajeCreacion.Rds.map((rd) => `${rd.Modificador} (${rd.Origen})`);

    it('el humano engendro vampírico 4 tiene +4 a sus siete habilidades: +2 de su raza y +2 de la clase, una vez', () => {
        const { svc, claseMonstruo, guerrero } = crearLibris(ENGENDRO_VAMPIRICO, 482, 'engendroSobreHumano');
        subir(svc, claseMonstruo, 3);
        // Antes de 4.º, solo el +2 racial (pág. 36: «bonificador de habilidad +2» a 1.er nivel).
        expect(SIETE.map(([, nombre]) => habilidad(svc, nombre)?.Rangos_varios)).toEqual([2, 2, 2, 2, 2, 2, 2]);

        subir(svc, claseMonstruo, 1);
        expect(SIETE.map(([, nombre]) => habilidad(svc, nombre)?.Rangos_varios)).toEqual([4, 4, 4, 4, 4, 4, 4]);
        expect(habilidad(svc, 'Avistar')?.Varios).toBe('Engendro vampírico +2, Bonificador de habilidad (Engendro vampírico) +2');

        // A 8.º y con otro nivel de guerrero, ni se repite ni se apila al recalcular.
        subir(svc, claseMonstruo, 4);
        subir(svc, guerrero, 1);
        svc.recalcularEfectosVentajas();
        expect(habilidad(svc, 'Avistar')?.Rangos_varios).toBe(4);
        // Las demás habilidades no cambian.
        expect(svc.PersonajeCreacion.Habilidades.filter((h) => !SIETE.some(([id]) => id === h.Id)).every((h) => !h.Rangos_varios)).toBeTrue();
    });

    it('su reducción del daño 5/plateada llega a 8.º, con el nombre de la aptitud (y la guarda la creación)', () => {
        const { svc, claseMonstruo } = crearLibris(ENGENDRO_VAMPIRICO, 482, 'engendroSobreHumano');
        subir(svc, claseMonstruo, 7);
        expect(rds(svc)).toEqual([]);

        subir(svc, claseMonstruo, 1);
        expect(rds(svc)).toEqual(['5/plateada (Reducción del daño (Engendro vampírico))']);
        svc.recalcularEfectosVentajas();
        expect(rds(svc)).toEqual(['5/plateada (Reducción del daño (Engendro vampírico))']);
    });

    it('lo guarda la creación: los rangos varios y la RD van en el cuerpo de POST /personajes/add', () => {
        const { svc, claseMonstruo } = crearLibris(ENGENDRO_VAMPIRICO, 482, 'engendroSobreHumano');
        subir(svc, claseMonstruo, 8);
        const vacio = new Map<string, number>();
        const colecciones = (new PersonajeService({ currentUser: null } as any, {} as any) as any).construirPayloadColecciones(
            svc.PersonajeCreacion,
            { clases: vacio, dominios: vacio, idiomas: vacio, ventajas: vacio, escuelas: vacio, disciplinas: vacio });

        expect(colecciones.rd).toEqual([{ rd: '5/plateada', origen: 'Reducción del daño (Engendro vampírico)' }]);
        const avistar = colecciones.habilidades.base.find((h: any) => h.idHabilidad === 6);
        expect(avistar).toEqual(jasmine.objectContaining({
            rangosVarios: 4, modVarios: 'Engendro vampírico +2, Bonificador de habilidad (Engendro vampírico) +2' }));
    });

    it('la momia: una sola RD, la de su nivel (2/- a 4.º, 5/- a 13.º; Libris Mortis, pág. 38)', () => {
        const { svc, claseMonstruo } = crearLibris(MOMIA, 485, 'momiaSobreHumano');
        subir(svc, claseMonstruo, 1);
        expect(rds(svc)).toEqual([]);
        subir(svc, claseMonstruo, 3);
        expect(rds(svc)).toEqual(['2/- (Reducción del daño (Momia))']);
        subir(svc, claseMonstruo, 9);
        expect(rds(svc)).toEqual(['5/- (Reducción del daño (Momia))']);
        // Sobre el humano (30'), 20': la API combina la velocidad con su mínimo de 10'.
        expect(svc.PersonajeCreacion.Correr).toBe(20);
    });

    it('el necrófago 2.º tiene mordisco y dos garras: tres armas naturales y puede tomar Ataque múltiple', () => {
        const ataqueMultiple: any = {
            Id: 49, Nombre: 'Ataque múltiple', Descripcion: '', Beneficio: '', Normal: '', Especial: '',
            Manual: { Id: 47, Nombre: 'Manual de monstruos 1', Pagina: 303 }, Tipos: [{ Id: 1, Nombre: 'General', Usado: 1 }],
            Repetible: 0, Repetible_distinto_extra: 0, Repetible_comb: 0, Comp_arma: 0, Oficial: true,
            Extras_soportados: { Extra_arma: 0, Extra_armadura_armaduras: 0, Extra_armadura_escudos: 0, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0 },
            Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] },
            Modificadores: {},
            Prerrequisitos: { armas_naturales: [{ Cantidad: 3, Opcional: 0, Frase: 'Tres armas naturales o más' }] },
        };
        const estado = (svc: NuevoPersonajeService) => {
            svc.setCatalogoDotes([ataqueMultiple]);
            (svc as any).dotesPendientes = [{ id: 1, fuente: 'nivel', origen: 'Nivel 3', tipoPermitido: null, estado: 'pendiente' }];
            return svc.obtenerCandidatosDotePendiente(1).find((candidato) => candidato.dote.Id === 49)?.evaluacion?.estado;
        };
        const { svc, claseMonstruo } = crearLibris(NECROFAGO, 486, 'necrofagoSobreHumano');
        subir(svc, claseMonstruo, 1);
        // El mordisco de la raza mutada y el de la clase son uno.
        expect(estado(svc)).toBe('blocked_failed');
        subir(svc, claseMonstruo, 1);
        expect(estado(svc)).toBe('eligible');
        // Con el daño de su nivel: a 7.º, mordisco 1d8 y garras 1d4.
        subir(svc, claseMonstruo, 5);
        expect((svc as any).armasNaturalesDeAptitudes().map((arma: any) => `${arma.Cantidad} ${arma.Arma_natural} ${arma.Dano}`))
            .toEqual(['1 Mordisco 1d8', '2 Garra 1d4']);
    });
});
