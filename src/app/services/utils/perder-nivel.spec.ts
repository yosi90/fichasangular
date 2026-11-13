import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import {
    caracteristicaMasAlta, fichaConConstitucionPerdida, fichaSinElNivel, indiceDelNivelQueSePierde, marcarDotesSinPrerrequisitos,
    puntoMedioDelNivel, pxTrasPerder, pxTrasPerderExperiencia,
} from './perder-nivel';

/*
 * Perder un nivel (roadmap de sesiones, fase 7, segunda tanda): los casos del dictamen del máster de Rol (en el roadmap,
 * «Perder un nivel»), con la regla de la Guía del DM, pág. 295.
 */

const GUERRERO = 7;
const HECHICERO = 8;
const MAGO = 9;

function tabla(base: number[], fort: number[]): any[] {
    return base.map((ab, i) => ({ Nivel: i + 1, Ataque_base: `+${ab}`, Salvaciones: { Fortaleza: `+${fort[i]}`, Reflejos: '+0', Voluntad: '+0' }, Dotes: [], Especiales: [] }));
}

const claseGuerrero: any = {
    Id: GUERRERO, Nombre: 'Guerrero', Puntos_habilidad: { Id: 1, Valor: 2 }, Conjuros: {},
    Desglose_niveles: tabla([1, 2, 3, 4, 5], [2, 3, 3, 4, 4]),
};

function caracteristicas(con: number, int = 10): any {
    const c = (valor: number) => ({ valor, minimo: 0, perdido: false });
    return { fuerza: c(16), destreza: c(12), constitucion: c(con), inteligencia: c(int), sabiduria: c(10), carisma: c(8) };
}

function claseos(nivel: number): any[] {
    // Lo que apunta la creación: un modificador por nivel que sube la salvación, con su origen.
    const fort = [2, 3, 3, 4, 4];
    return Array.from({ length: nivel }, (_, i) => ({ valor: fort[i] - (i > 0 ? fort[i - 1] : 0), origen: `Guerrero nivel ${i + 1}` }))
        .filter((m) => m.valor !== 0);
}

function guerrero(niveles: any[], extra: Partial<PersonajeCreateRequestDto> = {}): PersonajeCreateRequestDto {
    return {
        personaje: { nombre: 'Prueba', ataqueBase: `+${niveles.length}`, puntosGolpe: 45 } as any,
        caracteristicas: caracteristicas(14),
        tamano: { idTamano: 5, origen: 'Web' },
        modificadores: { salvaciones: { fortaleza: { claseos: claseos(niveles.length), varios: [] }, reflejos: { claseos: [], varios: [] }, voluntad: { claseos: [], varios: [] } } } as any,
        colecciones: {
            clases: [{ idClase: GUERRERO, nivel: niveles.length }],
            dotes: [{ idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 30, idExtra: 0, origen: 'Guerrero nivel 4' }],
            especiales: [], idiomas: [], dominios: [], conjurosConocidos: [],
            habilidades: { base: [{ idHabilidad: 40, idExtra: 0, clasea: true, rangos: 8 }, { idHabilidad: 41, idExtra: 0, clasea: true, rangos: 3 }], custom: [] },
        } as any,
        niveles,
        ...extra,
    } as PersonajeCreateRequestDto;
}

function nivel(n: number, tirada: number, elecciones: any[] = [], extra: any = {}): any {
    return { idClase: GUERRERO, nivelClase: n, pg: { tirada, maximo: n === 1 }, elecciones, ordenConocido: true, ...extra };
}

describe('perder-nivel (fase 7, segunda tanda)', () => {
    it('los PX quedan a la mitad del nivel nuevo, o en los suyos si ya son menos (MJ pág. 171; GDM pág. 295)', () => {
        expect(puntoMedioDelNivel(1)).toBe(500);
        expect(puntoMedioDelNivel(4)).toBe(8000);
        expect(pxTrasPerder(12000, 4)).toBe(8000);
        // El enano licántropo con NEP 9 y 10.000 PX: el punto medio de 8 serían 32.000; no le regala PX.
        expect(pxTrasPerder(10000, 8)).toBe(10000);
    });

    it('el humano guerrero 5 que vuelve a la vida: guerrero 4, PG 45 → 35 y sin los rangos de su 5.º nivel', () => {
        const entrada = guerrero([nivel(1, 10), nivel(2, 6), nivel(3, 7), nivel(4, 4, [{ tipo: 'dote', idElemento: 30, idExtra: 0, origen: 'Guerrero nivel 4' }]),
            nivel(5, 8, [{ tipo: 'rangos', idElemento: 40, idExtra: 0, valor: 2 }, { tipo: 'rangos', idElemento: 41, idExtra: 0, valor: 1 }])]);
        const r = fichaSinElNivel({ entrada, indice: 4, clase: claseGuerrero, caras: 10, dgsAntes: 5 });
        expect((r.ficha.colecciones as any).clases).toEqual([{ idClase: GUERRERO, nivel: 4 }]);
        expect(r.ficha.niveles!.length).toBe(4);
        expect(r.pg).toEqual({ antes: 45, despues: 35, exacto: true });
        expect(r.ataqueBase).toEqual({ antes: '+5', despues: '+4' });
        expect((r.ficha.colecciones as any).habilidades.base.map((h: any) => h.rangos)).toEqual([6, 2]);
        // Su dote de 4.º nivel no es de este nivel: se queda.
        expect((r.ficha.colecciones as any).dotes.length).toBe(2);
        expect(r.quitado.incremento).toBeNull();
    });

    it('el guerrero 4 con un nivel negativo permanente pierde el incremento de Con, la dote de ese nivel y su PG retroactivo', () => {
        const entrada = guerrero([nivel(1, 10), nivel(2, 6), nivel(3, 7),
            nivel(4, 4, [{ tipo: 'incremento', idElemento: 3, valor: 1 }, { tipo: 'dote', idElemento: 30, idExtra: 0, origen: 'Guerrero nivel 4' }])]);
        entrada.personaje.puntosGolpe = 35;
        const r = fichaSinElNivel({ entrada, indice: 3, clase: claseGuerrero, caras: 10, dgsAntes: 4 });
        expect(r.ficha.caracteristicas.constitucion.valor).toBe(13);
        expect(r.quitado.incremento).toBe(3);
        expect((r.ficha.colecciones as any).dotes).toEqual([{ idDote: 1, idExtra: 0, origen: 'Nivel 1' }]);
        // 11 + 7 + 8 (Con +1): −1 en cada uno de los 3 DG que le quedan.
        expect(r.pg.despues).toBe(26);
        // La Fortaleza de su 4.º nivel de guerrero (+1) se va con él.
        expect((r.ficha.modificadores as any).salvaciones.fortaleza.claseos.map((m: any) => m.origen))
            .toEqual(['Guerrero nivel 1', 'Guerrero nivel 2']);
        expect(r.salvaciones.fortaleza).toBe(1);
    });

    it('el hechicero que cambió un conjuro en ese nivel vuelve a conocer el olvidado', () => {
        const clase: any = { Id: HECHICERO, Nombre: 'Hechicero', Puntos_habilidad: { Valor: 2 }, Conjuros: {}, Desglose_niveles: tabla([0, 1, 1, 2], [0, 0, 1, 1]) };
        const entrada = guerrero([
            { idClase: HECHICERO, nivelClase: 1, pg: { tirada: 4, maximo: true }, elecciones: [], ordenConocido: true },
            { idClase: HECHICERO, nivelClase: 2, pg: { tirada: 3, maximo: false }, elecciones: [
                { tipo: 'conjuro_olvidado', idElemento: 25, idExtra: HECHICERO, valor: 26 }, { tipo: 'conjuro', idElemento: 60, idExtra: HECHICERO }] },
        ]);
        (entrada.colecciones as any).clases = [{ idClase: HECHICERO, nivel: 2 }];
        (entrada.colecciones as any).conjurosConocidos = [{ idConjuro: 26, idClase: HECHICERO }, { idConjuro: 60, idClase: HECHICERO }, { idConjuro: 17, idClase: HECHICERO }];
        const r = fichaSinElNivel({ entrada, indice: 1, clase, caras: 4, dgsAntes: 2 });
        expect((r.ficha.colecciones as any).conjurosConocidos.map((c: any) => c.idConjuro).sort()).toEqual([17, 25]);
        expect(r.quitado.vuelven).toEqual([{ idConjuro: 25, idClase: HECHICERO }]);
    });

    it('el mago conserva lo que escribió en su libro', () => {
        const clase: any = { Id: MAGO, Nombre: 'Mago', Puntos_habilidad: { Valor: 2 }, Conjuros: { Libro: { Gratis_por_nivel: 2 } }, Desglose_niveles: tabla([0, 1], [0, 0]) };
        const entrada = guerrero([{ idClase: MAGO, nivelClase: 1, pg: { tirada: 4, maximo: true }, elecciones: [] },
            { idClase: MAGO, nivelClase: 2, pg: { tirada: 2, maximo: false }, elecciones: [{ tipo: 'conjuro', idElemento: 60, idExtra: MAGO }] }]);
        (entrada.colecciones as any).clases = [{ idClase: MAGO, nivel: 2 }];
        (entrada.colecciones as any).conjurosConocidos = [{ idConjuro: 60, idClase: MAGO }];
        const r = fichaSinElNivel({ entrada, indice: 1, clase, caras: 4, dgsAntes: 2 });
        expect((r.ficha.colecciones as any).conjurosConocidos).toEqual([{ idConjuro: 60, idClase: MAGO }]);
    });

    it('sin el orden de sus niveles: elige la clase el jugador y se quita lo de la Guía del DM (la característica más alta, los rangos más altos, la media del dado)', () => {
        const sin = (n: number) => ({ idClase: GUERRERO, nivelClase: n, pg: { tirada: null, maximo: false }, elecciones: [], ordenConocido: false });
        const entrada = guerrero([sin(1), sin(2), sin(3), sin(4)]);
        entrada.personaje.puntosGolpe = 35;
        expect(indiceDelNivelQueSePierde(entrada.niveles, GUERRERO)).toBe(3);
        expect(indiceDelNivelQueSePierde(entrada.niveles, 99)).toBeNull();
        expect(caracteristicaMasAlta(entrada)).toBe(1);
        const r = fichaSinElNivel({ entrada, indice: 3, clase: claseGuerrero, caras: 10, dgsAntes: 4 });
        // El 4.º DG da incremento: la Fuerza (16), la más alta.
        expect(r.ficha.caracteristicas.fuerza.valor).toBe(15);
        // 2 puntos de guerrero + Int 10: de la habilidad con más rangos.
        expect((r.ficha.colecciones as any).habilidades.base.map((h: any) => h.rangos)).toEqual([6, 3]);
        // La media del d10 (6) + Con 2.
        expect(r.pg).toEqual({ antes: 35, despues: 27, exacto: false });
        expect(r.avisos.length).toBeGreaterThan(0);
    });

    it('con un solo DG, al volver a la vida, el drow mago 1 pierde 2 de Constitución (12 → 10) y 1 PG', () => {
        const entrada = guerrero([{ idClase: MAGO, nivelClase: 1, pg: { tirada: 4, maximo: true }, elecciones: [] }], { caracteristicas: caracteristicas(12) });
        entrada.personaje.puntosGolpe = 5;
        const con = fichaConConstitucionPerdida(entrada, 1)!;
        expect([con.antes, con.despues, con.pg.antes, con.pg.despues]).toEqual([12, 10, 5, 4]);
        expect(con.ficha.caracteristicas.constitucion.valor).toBe(10);
        // Con 2 no se le puede devolver la vida.
        expect(fichaConConstitucionPerdida(guerrero([], { caracteristicas: caracteristicas(2) }), 1)).toBeNull();
    });
});

describe('perder-nivel: perder PX y las dotes sin sus prerrequisitos', () => {
    it('perder PX que bajan un nivel: los que le quedan, sin punto medio (el familiar del hechicero 3, MJ pág. 45)', () => {
        // El hechicero 3 con 3.230 PX pierde 300: vuelve a 2.º con 2.930.
        expect(pxTrasPerderExperiencia(3230, 300)).toEqual({ px: 2930, bajaNivel: true });
        // 200 no le bajan del 3.º (3.000): son PX gastados.
        expect(pxTrasPerderExperiencia(3230, 200)).toEqual({ px: 3030, bajaNivel: false });
        // Nunca por debajo de 0; con 0, el siguiente de una pérdida que baja varios (lo comprueba la API).
        expect(pxTrasPerderExperiencia(500, 9000).px).toBe(0);
        expect(pxTrasPerderExperiencia(5000, 0)).toEqual({ px: 5000, bajaNivel: true });
    });

    it('marca las dotes que se quedan sin un prerrequisito y quita la marca a las que ya lo cumplen', () => {
        const ficha = {
            personaje: {}, colecciones: { dotes: [
                { idDote: 5, idExtra: 0, origen: 'Guerrero nivel 2' },
                { idDote: 9, idExtra: 3, origen: 'Nivel 3', sinPrerrequisitos: true },
            ] },
        } as unknown as PersonajeCreateRequestDto;
        const marcada = marcarDotesSinPrerrequisitos(ficha, [{ idDote: 5, idExtra: 0 }], [{ idDote: 9, idExtra: 3 }]);
        expect((marcada.colecciones as any).dotes).toEqual([
            { idDote: 5, idExtra: 0, origen: 'Guerrero nivel 2', sinPrerrequisitos: true },
            { idDote: 9, idExtra: 3, origen: 'Nivel 3' },
        ]);
        // La ficha de partida no cambia.
        expect((ficha.colecciones as any).dotes[1].sinPrerrequisitos).toBeTrue();
    });
});
