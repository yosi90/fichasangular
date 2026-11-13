import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { cambiosDeLaPlantilla, esPlantillaAdquirible, fichaDeLaPlantilla, puntosGolpeTrasPlantilla } from './adquirir-plantilla';

// Adquirir una plantilla con el personaje ya creado (roadmap de sesiones, fase 7). Los casos son los del dictamen del
// máster de Rol (roadmap, «Adquirir una plantilla»).

function guerrero(niveles: number, puntosGolpe: number, tirada = 6, con = 14): PersonajeCreateRequestDto {
    return {
        personaje: { nombre: 'Tordek', idRaza: 1, idAlineamiento: 1, idTipoCriatura: 1, puntosGolpe, tipo: 'pj' } as any,
        caracteristicas: {
            fuerza: { valor: 16 }, destreza: { valor: 13 }, constitucion: { valor: con }, inteligencia: { valor: 10 },
            sabiduria: { valor: 12 }, carisma: { valor: 8 },
        } as any,
        tamano: { idTamano: 3 } as any,
        modificadores: {} as any,
        colecciones: { clases: [{ idClase: 7, nivel: niveles }], plantillas: [], dotes: [{ idDote: 1, idExtra: 0, origen: 'Nivel 1' }] } as any,
        niveles: Array.from({ length: niveles }, (_, i) => ({ idClase: 7, nivelClase: i + 1, pg: { tirada: i === 0 ? 10 : tirada, maximo: i === 0 }, elecciones: [] })),
    } as PersonajeCreateRequestDto;
}

describe('adquirir una plantilla (sesiones, fase 7)', () => {
    it('se adquieren las adquiridas, no las heredadas ni la de relleno', () => {
        expect(esPlantillaAdquirible({ Id: 8, Nacimiento: false })).toBeTrue();
        expect(esPlantillaAdquirible({ Id: 6, Nacimiento: true })).toBeFalse();
        expect(esPlantillaAdquirible({ Id: 0, Nacimiento: false })).toBeFalse();
    });

    it('un guerrero 6 con Con 14 que se vuelve vampiro: todos sus DG a d12 sin Constitución, 52 → 47 PG (el dictamen)', () => {
        const pg = puntosGolpeTrasPlantilla({
            entrada: guerrero(6, 52), dgsAntes: 6, modConAntes: 2, modConDespues: 0,
            carasClaseAntes: () => 10, carasClaseDespues: () => 12, carasRacialAntes: 8, carasRacialDespues: 12,
            tiradasNuevas: [], modConNuevos: 0,
        });
        expect(pg).toEqual({ total: 47, nuevos: 0, cambio: -5, exacto: true });
    });

    it('un guerrero 5 que se vuelve licántropo lobo infectado: 2d8 nuevos con la Con de su forma animal, sin máximo', () => {
        const pg = puntosGolpeTrasPlantilla({
            entrada: guerrero(5, 44), dgsAntes: 5, modConAntes: 2, modConDespues: 2,
            carasClaseAntes: () => 10, carasClaseDespues: () => 10, carasRacialAntes: 8, carasRacialDespues: 8,
            tiradasNuevas: [5, 3], modConNuevos: 4,
        });
        expect(pg).toEqual({ total: 60, nuevos: 16, cambio: 0, exacto: true });
    });

    it('los DG sin tirada guardada, con la media del cambio y avisando de que es aproximado', () => {
        const entrada = guerrero(2, 18);
        entrada.niveles = entrada.niveles!.map((n) => ({ ...n, pg: { tirada: null, maximo: false } })) as any;
        const pg = puntosGolpeTrasPlantilla({
            entrada, dgsAntes: 3, modConAntes: 2, modConDespues: 0,
            carasClaseAntes: () => 10, carasClaseDespues: () => 12, carasRacialAntes: 8, carasRacialDespues: 12,
            tiradasNuevas: [], modConNuevos: 0,
        });
        // Cada nivel: +1 por el dado y −2 por la Con; el DG racial: +2 y −2.
        expect(pg).toEqual({ total: 16, nuevos: 0, cambio: -2, exacto: false });
    });

    it('la ficha que se manda: la entrada con la plantilla, lo que cambia el motor y el alineamiento que fija', () => {
        const entrada = guerrero(6, 52);
        const antes = guerrero(6, 52);
        const despues = guerrero(6, 52);
        despues.personaje.idTipoCriatura = 12;
        (despues.caracteristicas as any).fuerza.valor = 22;
        (despues.colecciones as any).dotes = [...(despues.colecciones as any).dotes, { idDote: 5, idExtra: 0, origen: 'Vampiro' }];
        (despues.colecciones as any).plantillas = [{ idPlantilla: 8 }];
        const ficha = fichaDeLaPlantilla({ entrada, antes, despues, idPlantilla: 8, puntosGolpe: 47, idAlineamiento: 9 });
        expect(ficha.colecciones?.plantillas).toEqual([{ idPlantilla: 8 }]);
        expect([ficha.personaje.idTipoCriatura, ficha.personaje.idAlineamiento, ficha.personaje.puntosGolpe]).toEqual([12, 9, 47]);
        expect((ficha.caracteristicas as any).fuerza.valor).toBe(22);
        expect((ficha.colecciones as any).dotes.map((d: any) => d.idDote)).toEqual([1, 5]);
        expect(ficha.colecciones?.clases).toEqual([{ idClase: 7, nivel: 6 }]);
        expect(ficha.niveles!.length).toBe(6);
        // Sin plantilla que fije el alineamiento, el de siempre.
        expect(fichaDeLaPlantilla({ entrada, antes, despues: antes, idPlantilla: 9, puntosGolpe: 52, idAlineamiento: null }).personaje.idAlineamiento).toBe(1);
    });

    it('el resumen: el NEP que sube, los PX que no cambian, lo que cambia y la clase que deja de admitir su alineamiento', () => {
        const pj = (cambios: Record<string, unknown>) => ({
            Tipo_criatura: { Nombre: 'Humanoide' }, Alineamiento: 'Legal bueno', Fuerza: 16, Destreza: 13, Constitucion: 14,
            Inteligencia: 10, Sabiduria: 12, Carisma: 8, Vida: 52, Ataque_base: '+6/+1', Armadura_natural: 0, Correr: 30,
            DotesContextuales: [], ...cambios,
        }) as any;
        const filas = cambiosDeLaPlantilla({
            antes: pj({}),
            despues: pj({ Tipo_criatura: { Nombre: 'Muerto viviente' }, Alineamiento: 'Caótico maligno', Fuerza: 22, Constitucion_perdida: true,
                Armadura_natural: 6, DotesContextuales: [{ Dote: { Nombre: 'Alerta' }, Contexto: { Extra: 'No aplica' } }] }),
            plantilla: { Nombre: 'Vampiro', Ajuste_nivel: 8 } as any,
            pg: { total: 47, nuevos: 0, cambio: -5, exacto: true },
            tiradas: [],
            experiencia: { px: 15000, nivel: 6 } as any,
            nepDespues: 14,
            exClases: [{ nombre: 'Paladín', razones: ['Requiere legal bueno'] }],
        });
        const fila = (que: string) => filas.find((f) => f.que === que);
        expect(fila('NEP')).toEqual(jasmine.objectContaining({ antes: '6', ahora: '14', porque: 'ajuste de nivel +8' }));
        expect(fila('PX')?.porque).toBe('No cambian: sube a nivel 15 con 105.000 PX');
        expect([fila('Tipo')?.ahora, fila('Alineamiento')?.ahora, fila('Fuerza')?.ahora, fila('Constitución')?.ahora])
            .toEqual(['Muerto viviente', 'Caótico maligno', '22', 'Sin ella']);
        expect(fila('Puntos de golpe')).toEqual(jasmine.objectContaining({ antes: '52', ahora: '47' }));
        expect(fila('Dotes')?.ahora).toBe('Alerta');
        expect(fila('Paladín')).toEqual(jasmine.objectContaining({ aviso: true, ahora: 'Requiere legal bueno' }));
    });
});
