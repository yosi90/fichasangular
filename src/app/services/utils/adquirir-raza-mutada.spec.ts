import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { Raza } from 'src/app/interfaces/raza';
import { NACIDO_DEL_INFIERNO_SOBRE_HUMANO_API, PROLE_SOBRE_API, RAZAS_API } from 'src/testing/razas-mutadas-api';
import { ENTRADA_ENANO_CLERIGO_1 } from 'src/testing/subida-nivel-api';
import {
    cambiosDeLaMutacion, esRazaMutadaAdquirible, fichaDeLaMutacion, loQuePierdeEnSuHueco, nepTrasLaMutacion, pagaLosPuntos,
    puntosDevueltos, quitaDgRaciales, tipoQueNoCumpleLaMutacion,
} from './adquirir-raza-mutada';
import { normalizeRazaApi } from './raza-mapper';

// Adquirir una raza mutada con el personaje ya creado (sesiones, fase 7): lo que no necesita el motor. Las razas, de los
// datos de `rol_dev` (`src/testing/razas-mutadas-api.ts`); la ficha, la de la subida (`src/testing/subida-nivel-api.ts`).

const PROLE = normalizeRazaApi(RAZAS_API['21']);
const NACIDO = normalizeRazaApi(NACIDO_DEL_INFIERNO_SOBRE_HUMANO_API);
const DROW = normalizeRazaApi(RAZAS_API['308']);
const MEDIANO = normalizeRazaApi(RAZAS_API['5']);
const PROLE_SOBRE_MEDIANO = normalizeRazaApi(PROLE_SOBRE_API['5']);
const TIPOS = [
    { Clave: 'tipo_criatura', Dato: 'tipo_criatura', Comparador: 'es' },
    { Clave: 'tipo_criatura_prohibido', Dato: 'tipo_criatura', Comparador: 'no_es' },
    { Clave: 'caracteristica', Dato: 'caracteristica', Comparador: 'minimo' },
];

function entrada(): PersonajeCreateRequestDto {
    return JSON.parse(JSON.stringify(ENTRADA_ENANO_CLERIGO_1));
}

describe('Adquirir una raza mutada (la utilidad)', () => {
    it('se ofrecen las mutadas sin momento («después de crear» o cualquiera): la prole y el nacido del Infierno; no una de nacimiento', () => {
        expect(esRazaMutadaAdquirible(PROLE)).toBeTrue();
        expect(esRazaMutadaAdquirible(NACIDO)).toBeTrue();
        expect(esRazaMutadaAdquirible(MEDIANO)).toBeFalse();
        // Una variante elemental: pide su momento («Se adquiere al crear el personaje»).
        const elemental = { ...PROLE, Prerrequisitos: { ...PROLE.Prerrequisitos, momento: [{
            Id: 90, Tipo: 'momento', Sujeto: 'creacion', Id_referencia: 1, Referencia: 'Al crear el personaje', Cantidad: null, Texto: null,
            Opcional: 0, Frase: 'Se adquiere al crear el personaje',
        }] } } as Raza;
        expect(esRazaMutadaAdquirible(elemental)).toBeFalse();
    });

    it('el tipo se compara con el del personaje, con sus plantillas: un humano semicelestial (ajeno) no hace el Rito', () => {
        const humanoide = PROLE.Prerrequisitos['tipo_criatura'][0].Id_referencia!;
        expect(tipoQueNoCumpleLaMutacion(PROLE, TIPOS, humanoide)).toEqual([]);
        expect(tipoQueNoCumpleLaMutacion(PROLE, TIPOS, humanoide + 1)).toEqual(['Criatura de tipo humanoide']);
        // Sin el modelo de los tipos no se compara nada (lo comprueba la API al guardar).
        expect(tipoQueNoCumpleLaMutacion(PROLE, [], humanoide + 1)).toEqual([]);
        // Uno prohibido y un grupo «uno de estos».
        const conGrupo = { Prerrequisitos: {
            tipo_criatura_prohibido: [{ ...PROLE.Prerrequisitos['tipo_criatura'][0], Tipo: 'tipo_criatura_prohibido', Id_referencia: 9, Frase: 'No ser de tipo muerto viviente' }],
            tipo_criatura: [1, 2].map((id) => ({ ...PROLE.Prerrequisitos['tipo_criatura'][0], Id_referencia: id, Opcional: 1, Frase: `Tipo ${id}` })),
        } } as unknown as Raza;
        expect(tipoQueNoCumpleLaMutacion(conGrupo, TIPOS, 2)).toEqual([]);
        expect(tipoQueNoCumpleLaMutacion(conGrupo, TIPOS, 9)).toEqual(['No ser de tipo muerto viviente', 'Tipo 1 o Tipo 2']);
    });

    it('el nacido del Infierno baja el NEP: pierde el ajuste de la base (el drow, +2) y los PX no cambian', () => {
        expect(DROW.Ajuste_nivel).toBeGreaterThan(0);
        const sobreDrow = { ...NACIDO, Ajuste_nivel: 0 } as Raza;
        expect(nepTrasLaMutacion(5, DROW, sobreDrow, 3)).toBe(5 - DROW.Ajuste_nivel);
        // La prole conserva el ajuste y los DG de la base: el mismo NEP.
        expect(nepTrasLaMutacion(4, MEDIANO, PROLE_SOBRE_MEDIANO, 4)).toBe(4);
    });

    it('perder un DG racial aún no se puede: el nacido del Infierno sobre una base con DG', () => {
        const conDg = { ...MEDIANO, Dgs_adicionales: { ...MEDIANO.Dgs_adicionales, Cantidad: 2 } } as Raza;
        expect(quitaDgRaciales(conDg, NACIDO)).toBeTrue();
        expect(quitaDgRaciales(MEDIANO, PROLE_SOBRE_MEDIANO)).toBeFalse();
    });

    it('lo que pierde en su hueco sale de los datos de las dos razas: la dote y los puntos extra del humano', () => {
        const humano = { ...MEDIANO, Dotes_adicionales: 1, Puntos_habilidad_extra_primer_nivel: 4, Puntos_habilidad_extra_por_nivel: 1 } as Raza;
        expect(loQuePierdeEnSuHueco(humano, PROLE, 5)).toEqual({ dotes: 1, puntos: 8 });
        expect(loQuePierdeEnSuHueco(humano, { ...PROLE, Dotes_adicionales: 1 } as Raza, 1)).toEqual({ dotes: 0, puntos: 4 });
        expect(loQuePierdeEnSuHueco(MEDIANO, PROLE_SOBRE_MEDIANO, 3)).toEqual({ dotes: 0, puntos: 0 });
    });

    it('cada rango, por lo que costó: 1 de clase y 2 transclásea, sin un rango de más', () => {
        expect(puntosDevueltos([{ rangos: 2, coste: 1 }, { rangos: 1, coste: 2 }])).toBe(4);
        expect(pagaLosPuntos([{ rangos: 4, coste: 1 }], 5)).toBeFalse();
        expect(pagaLosPuntos([{ rangos: 5, coste: 1 }], 5)).toBeTrue();
        // Con un punto por pagar y solo transclásea, se paga con uno de 2.
        expect(pagaLosPuntos([{ rangos: 2, coste: 1 }, { rangos: 2, coste: 2 }], 5)).toBeTrue();
        expect(pagaLosPuntos([{ rangos: 7, coste: 1 }], 5)).toBeFalse();
    });

    it('la ficha que se manda: los ajustes nuevos, la raza mutada y su base, sin la dote del humano y con el Dracónico', () => {
        const e = entrada();
        e.colecciones = { ...e.colecciones, dotes: [{ idDote: 50, idExtra: 0, origen: 'Clérigo nivel 1' }, { idDote: 51, idExtra: 0, origen: 'Enano' }] };
        e.decisionesHomebrew = [{ tipo: 'requisitos_dote', idElemento: 51 }];
        const antes = entrada();
        antes.colecciones = { ...antes.colecciones, dotes: [...e.colecciones.dotes!], idiomas: [{ idIdioma: 1, origen: 'Enano' }] };
        const despues: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(antes));
        despues.personaje.idRaza = 21;
        despues.caracteristicas.constitucion.valor += 2;
        despues.caracteristicas.destreza.valor -= 2;
        despues.colecciones!.dotes = [{ idDote: 50, idExtra: 0, origen: 'Clérigo nivel 1' }];
        despues.colecciones!.idiomas = [{ idIdioma: 1, origen: 'Enano' }, { idIdioma: 7, origen: 'Prole de Bahamut' }];
        const ficha = fichaDeLaMutacion({ entrada: e, antes, despues, idRaza: 21, idRazaBase: 3, puntosGolpe: 14 });
        expect([ficha.personaje.idRaza, ficha.personaje.idRazaBase]).toEqual([21, 3]);
        expect(ficha.caracteristicas.constitucion.valor).toBe(e.caracteristicas.constitucion.valor + 2);
        expect(ficha.caracteristicas.destreza.valor).toBe(e.caracteristicas.destreza.valor - 2);
        expect(ficha.colecciones?.dotes).toEqual([{ idDote: 50, idExtra: 0, origen: 'Clérigo nivel 1' }]);
        expect(ficha.decisionesHomebrew).toEqual([]);
        expect(ficha.colecciones?.idiomas).toContain(jasmine.objectContaining({ idIdioma: 7 }));
        expect(ficha.personaje.puntosGolpe).toBe(14);
        // Lo que no se cambia se queda como estaba: la edad, la deidad, el alineamiento y los niveles.
        expect([ficha.personaje.edad, ficha.personaje.deidad, ficha.personaje.idAlineamiento]).toEqual([e.personaje.edad, e.personaje.deidad, e.personaje.idAlineamiento]);
        expect(ficha.niveles).toEqual(e.niveles!);
    });

    it('«Lo que cambia»: la raza y su base, el NEP que baja (puede subir antes), las características y los avisos', () => {
        const pj = (cambios: Partial<Personaje>) => ({ Constitucion: 14, Destreza: 12, Fuerza: 10, Inteligencia: 10, Sabiduria: 10, Carisma: 10,
            Vida: 20, Edad: 30, Alineamiento: 'Caótico neutral', Raciales: [], Idiomas: [{ Nombre: 'Común' }], DotesContextuales: [],
            Tipo_criatura: { Nombre: 'Humanoide' }, ...cambios } as unknown as Personaje);
        const filas = cambiosDeLaMutacion({
            antes: pj({}), despues: pj({ Constitucion: 16, Destreza: 10, Idiomas: [{ Nombre: 'Común' }, { Nombre: 'Dracónico' }] } as any),
            anterior: DROW, combinada: { ...PROLE, Ajuste_nivel: 0 } as Raza,
            experiencia: { px: 10000, nivel: 7, pxNivelActual: 0, pxSiguienteNivel: 0, puedeSubir: false, nivelesPorSubir: 0, sesionAbierta: null } as any,
            nepDespues: 5, pg: { total: 24, delNivel: 0, retroactivo: 4, exacto: true },
            dotesPerdidas: ['Alerta'], rangosQuitados: [{ nombre: 'Avistar', rangos: 2 }], dotesCambiadas: [{ antes: 'Esquiva', ahora: null }],
            exClases: [{ nombre: 'Paladín', razones: ['Requiere humano'] }], alineamientoExigido: 'Legal bueno',
        });
        const fila = (que: string) => filas.find((f) => f.que === que);
        expect(fila('Raza')).toEqual(jasmine.objectContaining({ antes: DROW.Nombre, ahora: PROLE.Nombre }));
        expect(fila('NEP')).toEqual(jasmine.objectContaining({ antes: '7', ahora: '5' }));
        expect(fila('PX')?.porque).toContain('puede subir antes');
        expect(fila('Constitución')).toEqual(jasmine.objectContaining({ antes: '14', ahora: '16' }));
        expect(fila('Destreza')).toEqual(jasmine.objectContaining({ antes: '12', ahora: '10' }));
        expect(fila('Idiomas')?.ahora).toBe('Dracónico');
        expect(fila('Puntos de golpe')?.ahora).toBe('24');
        expect(fila('Dotes')?.antes).toBe('Alerta');
        expect(fila('Rangos')?.antes).toBe('Avistar −2');
        expect(fila('Dote')).toEqual(jasmine.objectContaining({ antes: 'Esquiva', ahora: '—' }));
        expect(fila('Alineamiento')).toEqual(jasmine.objectContaining({ aviso: true }));
        expect(fila('Alineamiento')?.porque).toContain('Cambio de alineamiento');
        expect(fila('Ex paladín')).toEqual(jasmine.objectContaining({ aviso: true }));
    });
});
