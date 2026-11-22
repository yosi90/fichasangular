import { normalizeClase } from '../clase.service';
import {
    AVISO_NO_VERIFICABLE, ContextoRequisitosSustitucion, ajustarAtaqueBase, ajustarCifras, competenciasQueQuita, conjurosConocidosDelNivel,
    dadoDelNivel, detalleConSustituciones, evaluarRequisitosDeSustitucion, habilidadesDelJuego, listadoConSustituciones,
    nivelDeSustitucion, opcionesDeSustitucion, puntosHabilidadDelNivel, sustitucionDelNivel, sustitucionesDeLaClase,
    textoNivelesSustitucion, opcionesDelSelectorDeNivel, idDeLaClaveDelSelector, vistaDeLosJuegos, CLAVE_NIVEL_ESTANDAR,
    conValorPorNivelesDelJuego, especialesDeSusSustituciones, multiplicarCifra,
} from './niveles-sustitucion';
import {
    ID_DOTE_ADICIONAL, ID_ENEMIGO_PREDILECTO, ID_FIRMEZA_ENANA, ID_FURIA, ID_FURIA_DE_LA_MONTANA, ID_GRUPO_HACHAS,
    ID_RAZA_ENANO, ID_RAZA_HUMANO, ID_SENTIDO_TRAMPAS, barbaroConSustitucionApi, exploradorConSustitucionApi,
    guerreroConSustitucionApi,
} from 'src/testing/sustituciones-api';

const guerrero = normalizeClase(guerreroConSustitucionApi());
const barbaro = normalizeClase(barbaroConSustitucionApi());
const explorador = normalizeClase(exploradorConSustitucionApi());

const ids = (filas: Array<{ Especial: Record<string, any>; }> | undefined) => (filas ?? []).map((f) => f.Especial['Id']);

function contexto(idRaza: number, nombre: string): ContextoRequisitosSustitucion {
    return {
        identidad: { razas: [{ id: idRaza, nombre }], tiposCriatura: [{ id: 1, nombre: 'Humanoide' }], subtipos: [] },
        alineamientoBasicoId: 1, genero: 'Macho', deidad: null, habilidades: [], tiposDeDote: [],
        escuelaEspecialista: null,
    };
}

describe('niveles-sustitucion (R8, primera tanda)', () => {
    it('el mapper lee los juegos de la clase y sus niveles', () => {
        const juego = guerrero.Sustituciones![0];
        expect(juego.Titulo).toBe('Niveles de sustitución racial del guerrero enano');
        expect(juego.Tipo_dado?.Nombre).toBe('d12');
        expect(juego.Puntos_habilidad).toBeNull();
        expect(juego.Niveles.map((n) => n.Id)).toEqual([11, 12]);
        expect(juego.Niveles[0].Quita[0].Alcance).toBe('nivel');
        // Una clase de una caché de antes (sin `Sustituciones`): ninguno.
        expect(normalizeClase({ Id: 1, Nombre: 'Mago' }).Sustituciones).toEqual([]);
    });

    it('ofrece en cada nivel de la clase el de cada juego que lo tiene', () => {
        expect(opcionesDeSustitucion(guerrero, 1).map((o) => o.nivel.Id)).toEqual([11]);
        expect(opcionesDeSustitucion(guerrero, 3)).toEqual([]);
        expect(nivelDeSustitucion(guerrero, 12)?.juego.Nombre).toBe('Guerrero enano');
        expect(nivelDeSustitucion(guerrero, 99)).toBeNull();
    });

    it('lee los tomados del orden de niveles y no admite uno de otro nivel', () => {
        const orden = [{ idClase: 3, nivelClase: 1, idNivelSustitucion: 11 }, { idClase: 7, nivelClase: 1 }, { idClase: 3, nivelClase: 2, idNivelSustitucion: null }];
        const tomados = sustitucionesDeLaClase(orden, 3);
        expect(tomados).toEqual([{ nivelClase: 1, idNivelSustitucion: 11 }]);
        expect(sustitucionDelNivel(guerrero, tomados, 1)?.nivel.Id).toBe(11);
        expect(sustitucionDelNivel(guerrero, tomados, 2)).toBeNull();
        // El 2.º del juego en el nivel 1 de la clase no cuadra: se ignora.
        expect(sustitucionDelNivel(guerrero, [{ nivelClase: 1, idNivelSustitucion: 12 }], 1)).toBeNull();
    });

    it('el enano guerrero 1 de sustitución: su DG, sus rasgos y sin la dote adicional que quita', () => {
        const tomados = [{ nivelClase: 1, idNivelSustitucion: 11 }];
        const n1 = detalleConSustituciones(guerrero, 1, tomados)!;
        expect(ids(n1.Especiales)).toEqual([ID_FIRMEZA_ENANA]);
        // El 2.º estándar sigue con su dote adicional (la quita es solo de su nivel).
        expect(ids(detalleConSustituciones(guerrero, 2, tomados)!.Especiales)).toEqual([ID_DOTE_ADICIONAL]);
        expect(dadoDelNivel(guerrero, sustitucionDelNivel(guerrero, tomados, 1))).toBe('d12');
        expect(dadoDelNivel(guerrero, null)).toBe('d10');
        // Sin `Puntos_habilidad` en el juego, los de la clase.
        expect(puntosHabilidadDelNivel(guerrero, sustitucionDelNivel(guerrero, tomados, 1))).toBe(2);
        // La tabla de la clase no cambia.
        expect(ids(guerrero.Desglose_niveles[0].Especiales)).toEqual([ID_DOTE_ADICIONAL]);
        // Sin tomados, la fila tal cual.
        expect(ids(detalleConSustituciones(guerrero, 1, [])!.Especiales)).toEqual([ID_DOTE_ADICIONAL]);
    });

    it('una quita «desde» quita la aptitud en su nivel y en todos los siguientes; con su sustituto, con el mismo extra', () => {
        const tomados = [{ nivelClase: 1, idNivelSustitucion: 21 }];
        // En su nivel, la que da el nivel (sin repetirla).
        expect(ids(detalleConSustituciones(barbaro, 1, tomados)!.Especiales)).toEqual([ID_FURIA_DE_LA_MONTANA]);
        const n4 = detalleConSustituciones(barbaro, 4, tomados)!.Especiales;
        expect(ids(n4)).toEqual([ID_FURIA_DE_LA_MONTANA]);
        expect(n4[0].Extra).toBe('2/día');
        // Sin sustituto, se quita sin más.
        const sinSustituto = JSON.parse(JSON.stringify(barbaro));
        sinSustituto.Sustituciones[0].Niveles[0].Quita[0].Sustituto = null;
        expect(ids(detalleConSustituciones(sinSustituto, 4, tomados)!.Especiales)).toEqual([]);
        expect(puntosHabilidadDelNivel(barbaro, sustitucionDelNivel(barbaro, tomados, 1))).toBe(6);
    });

    it('una quita «retrasa»: pierde la de su nivel y cada una da el extra de la anterior', () => {
        const tomados = [{ nivelClase: 3, idNivelSustitucion: 23 }];
        expect(ids(detalleConSustituciones(barbaro, 3, tomados)!.Especiales)).toEqual([]);
        const n6 = detalleConSustituciones(barbaro, 6, tomados)!.Especiales.find((e) => e.Especial['Id'] === ID_SENTIDO_TRAMPAS)!;
        expect(n6.Extra).toBe('+1');
        const n9 = detalleConSustituciones(barbaro, 9, tomados)!.Especiales.find((e) => e.Especial['Id'] === ID_SENTIDO_TRAMPAS)!;
        expect(n9.Extra).toBe('+2');
        expect(n9.Id_extra).toBe(2);
    });

    it('los ajustes del ataque base valen desde su nivel', () => {
        const tomados = [{ nivelClase: 3, idNivelSustitucion: 23 }];
        expect(detalleConSustituciones(barbaro, 2, tomados)!.Ataque_base).toBe('+2');
        expect(detalleConSustituciones(barbaro, 3, tomados)!.Ataque_base).toBe('+2');
        // Con sus ataques adicionales de nuevo (`textoAtaqueBase`): +5 no da un segundo ataque.
        expect(detalleConSustituciones(barbaro, 6, tomados)!.Ataque_base).toBe('+5');
        expect(ajustarAtaqueBase('+10/+5', 1)).toBe('+11/+6/+1');
        expect(ajustarAtaqueBase('+0', -1)).toBe('-1');
        expect(ajustarCifras('+0', -1)).toBe('-1');
        expect(ajustarCifras('+2', 0)).toBe('+2');
    });

    it('una quita «aplaza» mueve la aptitud a su nivel nuevo', () => {
        const tomados = [{ nivelClase: 10, idNivelSustitucion: 31 }];
        const n10 = ids(detalleConSustituciones(explorador, 10, tomados)!.Especiales);
        expect(n10).not.toContain(ID_ENEMIGO_PREDILECTO);
        expect(n10.length).toBe(1);
        const n15 = ids(detalleConSustituciones(explorador, 15, tomados)!.Especiales);
        expect(n15.filter((id) => id === ID_ENEMIGO_PREDILECTO).length).toBe(2);
        expect(ids(detalleConSustituciones(explorador, 5, tomados)!.Especiales)).toEqual([ID_ENEMIGO_PREDILECTO]);
    });

    it('los conjuros que entran y salen de la lista desde su nivel', () => {
        const tomados = [{ nivelClase: 10, idNivelSustitucion: 31 }];
        const lista = explorador.Conjuros.Listado;
        expect(listadoConSustituciones(explorador, lista, tomados, 9).map((c) => c.Id)).toEqual([300]);
        expect(listadoConSustituciones(explorador, lista, tomados, 10).map((c) => c.Id)).toEqual([301]);
        expect(conjurosConocidosDelNivel(sustitucionDelNivel(explorador, tomados, 10))).toEqual([]);
    });

    it('las competencias de la clase que no gana', () => {
        const tomados = [{ nivelClase: 1, idNivelSustitucion: 11 }];
        expect(Array.from(competenciasQueQuita(guerrero, tomados, 'Grupos_arma'))).toEqual([ID_GRUPO_HACHAS]);
        expect(Array.from(competenciasQueQuita(guerrero, tomados, 'Armaduras'))).toEqual([]);
        expect(Array.from(competenciasQueQuita(guerrero, [], 'Grupos_arma'))).toEqual([]);
    });

    it('las habilidades de clase que añade y quita el juego', () => {
        const { anade, quita } = habilidadesDelJuego(guerrero.Sustituciones![0]);
        expect(anade).toEqual([{ Id_habilidad: 21, Habilidad: 'Saber', Id_extra: 4, Extra: 'Dungeons' }]);
        expect(quita).toEqual([{ Id_habilidad: 10, Habilidad: 'Trepar', Id_extra: -1, Extra: '' }]);
    });

    it('un humano guerrero no cumple el juego del enano; el enano sí', () => {
        const juego = guerrero.Sustituciones![0];
        const humano = evaluarRequisitosDeSustitucion(juego, 1, contexto(ID_RAZA_HUMANO, 'Humano'));
        expect(humano.cumple).toBeFalse();
        expect(humano.motivos).toEqual(['No cumple: Enano']);
        expect(evaluarRequisitosDeSustitucion(juego, 1, contexto(ID_RAZA_ENANO, 'Enano')).cumple).toBeTrue();
    });

    it('lo que la web no puede comprobar se deja elegir con el aviso (D6)', () => {
        const r = evaluarRequisitosDeSustitucion(barbaro.Sustituciones![0], 1, contexto(ID_RAZA_ENANO, 'Enano'));
        expect(r.cumple).toBeTrue();
        expect(r.avisos).toEqual([`Haber vivido en las montañas: ${AVISO_NO_VERIFICABLE.charAt(0).toLowerCase()}${AVISO_NO_VERIFICABLE.slice(1)}.`]);
    });

    it('la ficha: «sustitución: guerrero enano 1.º y 2.º»', () => {
        expect(textoNivelesSustitucion([
            { nivelClase: 2, sustitucion: { id: 1, nombre: 'Guerrero enano' } },
            { nivelClase: 1, sustitucion: { id: 1, nombre: 'Guerrero enano' } },
        ])).toBe('sustitución: guerrero enano 1.º y 2.º');
        expect(textoNivelesSustitucion([])).toBe('');
    });

    it('el selector del nivel: el estándar primero y el de sustitución, bloqueado con su motivo si no lo cumple', () => {
        const juego = guerrero.Sustituciones![0];
        const opcion = { juego, nivel: juego.Niveles[0], sinAplicar: [] };
        const humano = opcionesDelSelectorDeNivel(guerrero, 1, [{ ...opcion, ...evaluarRequisitosDeSustitucion(juego, 1, contexto(ID_RAZA_HUMANO, 'Humano')) }]);
        expect(humano.map((o) => o.clave)).toEqual([CLAVE_NIVEL_ESTANDAR, 'sustitucion:11']);
        expect(humano[0].nombre).toBe('Guerrero 1 (nivel estándar)');
        expect(humano[1].nombre).toBe('Niveles de sustitución racial del guerrero enano (1.º)');
        expect(humano[1].bloqueada).toBeTrue();
        expect(humano[1].motivo).toBe('No cumple: Enano');
        expect(humano[1].extra).toContain('DG d12');
        expect(humano[1].extra).toContain('En lugar de: Dote adicional y Hachas');
        const enano = opcionesDelSelectorDeNivel(guerrero, 1, [{ ...opcion, ...evaluarRequisitosDeSustitucion(juego, 1, contexto(ID_RAZA_ENANO, 'Enano')) }]);
        expect(enano[1].bloqueada).toBeUndefined();
        expect(idDeLaClaveDelSelector('sustitucion:11')).toBe(11);
        expect(idDeLaClaveDelSelector(CLAVE_NIVEL_ESTANDAR)).toBeNull();
    });

    it('el detalle de la clase enseña cada juego con sus requisitos y lo que gana y pierde cada nivel', () => {
        const [vista] = vistaDeLosJuegos(barbaro);
        expect(vista.titulo).toBe('Niveles de sustitución racial del bárbaro de la montaña');
        expect(vista.requisitos).toEqual(['Enano', 'Haber vivido en las montañas']);
        expect(vista.datos).toEqual(['Puntos de habilidad: 6 + mod. de Int por nivel']);
        expect(vista.niveles.map((n) => [n.nivel, n.gana, n.enLugarDe])).toEqual([
            ['1.º', 'Furia de la montaña', 'Furia, desde este nivel (pasa a Furia de la montaña)'],
            ['3.º', '', 'Sentido de las trampas, un paso más tarde'],
        ]);
        expect(vistaDeLosJuegos(explorador)[0].niveles[0].enLugarDe).toBe('Enemigo predilecto, que pasa al 15.º y Enmarañar (fuera de su lista)');
    });

    describe('Por_nivel_del_juego (la fila una vez, con su valor por los niveles del juego)', () => {
        const especial = (extra: string, datos: Record<string, any> = {}) => ({
            Especial: { Id: 909, Nombre: 'Perspicacia arcana', ...datos }, Nivel: 1, Id_extra: null, Extra: extra, Opcional: 0, Id_interno: 0,
            Id_especial_requerido: 0, Id_dote_requerida: 0, Por_nivel_del_juego: true, Extra_del_juego: false,
        });
        function conPerspicacia(extra: string, datos: Record<string, any> = {}) {
            const raw = guerreroConSustitucionApi();
            raw.Sustituciones[0].Niveles[0].Especiales.push(especial(extra, datos));
            // Un juego que la repitiera en su 2.º nivel: va una vez, la del primero.
            raw.Sustituciones[0].Niveles[1].Especiales.push({ ...especial(extra, datos), Nivel: 2 });
            return normalizeClase(raw);
        }

        it('multiplica la primera cifra de su extra', () => {
            expect(multiplicarCifra('+2', 3)).toBe('+6');
            expect(multiplicarCifra('2/día', 2)).toBe('4/día');
            expect(multiplicarCifra('-1', 2)).toBe('-2');
            expect(multiplicarCifra('fuego', 2)).toBeNull();
        });

        it('con el extra «+2»: +2 con un nivel del juego y +4 con dos, en la fila de su primer nivel', () => {
            const clase = conPerspicacia('+2');
            const uno = [{ nivelClase: 1, idNivelSustitucion: 11 }];
            const dos = [...uno, { nivelClase: 2, idNivelSustitucion: 12 }];
            const fila = (tomados: any[], n: number) => detalleConSustituciones(clase, n, tomados)!.Especiales.filter((e) => e.Especial['Id'] === 909);
            expect(fila(uno, 1).map((e) => e.Extra)).toEqual(['+2']);
            expect(fila(dos, 1).map((e) => e.Extra)).toEqual(['+4']);
            expect(fila(dos, 2)).toEqual([]);
            expect(especialesDeSusSustituciones(clase, dos).filter((e) => e.Especial['Id'] === 909).map((e) => e.Extra)).toEqual(['+4']);
        });

        it('sin extra con cifra: sus modificadores y los rangos de sus habilidades', () => {
            const base = especial('', { Modificadores: { Fuerza: 2, Ca: 1 }, Habilidades: [{ Id_habilidad: 21, Rangos: 2 }] }) as any;
            const tres = conValorPorNivelesDelJuego(base, 3);
            expect(tres.Especial['Modificadores']).toEqual({ Fuerza: 6, Ca: 3 });
            expect(tres.Especial['Habilidades'][0].Rangos).toBe(6);
            expect(conValorPorNivelesDelJuego(base, 1)).toBe(base);
        });
    });
});
