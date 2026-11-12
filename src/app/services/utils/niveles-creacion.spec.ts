import { apuntarEleccion, construirNivelesCreacion, NivelTomado, ordenCuadra } from './niveles-creacion';

describe('niveles-creacion (el orden de los niveles del alta)', () => {
    const clases = [{ id: 8, nombre: 'Hechicero', nivel: 2 }, { id: 9, nombre: 'Mago', nivel: 1 }];
    const orden = [{ idClase: 8, nivelClase: 1 }, { idClase: 9, nivelClase: 1 }, { idClase: 8, nivelClase: 2 }];

    it('sin orden, o con uno que no cuadra con las clases (un borrador de antes), no se manda', () => {
        expect(construirNivelesCreacion({ orden: [], clases })).toBeNull();
        expect(construirNivelesCreacion({ orden: undefined, clases })).toBeNull();
        expect(ordenCuadra([{ idClase: 8, nivelClase: 1 }, { idClase: 9, nivelClase: 1 }], clases)).toBeFalse();
        expect(ordenCuadra([{ idClase: 8, nivelClase: 2 }, { idClase: 8, nivelClase: 1 }, { idClase: 9, nivelClase: 1 }], clases)).toBeFalse();
        expect(ordenCuadra(orden, clases)).toBeTrue();
    });

    it('cada nivel con la tirada de su DG: el k-ésimo DG de una clase es su k-ésimo nivel', () => {
        const niveles = construirNivelesCreacion({
            orden,
            clases,
            dados: [
                { origen: 'clase', idClase: 8, caras: 4, resultado: 4, maximizado: true },
                { origen: 'clase', idClase: 8, caras: 4, resultado: 1, maximizado: false },
                { origen: 'clase', idClase: 9, caras: 4, resultado: 3, maximizado: false },
            ],
        });
        expect(niveles?.map((n) => [n.idClase, n.nivelClase, n.pg])).toEqual([
            [8, 1, { tirada: 4, maximo: true }],
            [9, 1, { tirada: 3, maximo: false }],
            [8, 2, { tirada: 1, maximo: false }],
        ]);
    });

    it('una clase con niveles sin DG (las de monstruo) se queda sin tirada', () => {
        const niveles = construirNivelesCreacion({
            orden: [{ idClase: 300, nivelClase: 1 }, { idClase: 300, nivelClase: 2 }],
            clases: [{ id: 300, nombre: 'Engendro vampírico', nivel: 2 }],
            dados: [{ origen: 'clase', idClase: 300, caras: 12, resultado: 12, maximizado: true }],
        });
        expect(niveles?.map((n) => n.pg)).toEqual([undefined, undefined]);
    });

    it('cada nivel lleva las elecciones que se apuntaron en él, y los aumentos de lanzador el suyo', () => {
        const conElecciones: NivelTomado[] = orden.map((n) => ({ ...n }));
        expect(apuntarEleccion(conElecciones, { idClase: 9, nivelClase: 1 }, { tipo: 'dote', idElemento: 2, idExtra: 5, origen: 'Mago nivel 1' })).toBeTrue();
        apuntarEleccion(conElecciones, { idClase: 9, nivelClase: 1 }, { tipo: 'conjuro', idElemento: 60, idExtra: 9 });
        apuntarEleccion(conElecciones, { idClase: 8, nivelClase: 2 }, { tipo: 'incremento', idElemento: 4, valor: 1 });
        // Lo que no es de ningún nivel de clase (una dote de los DG raciales) no se apunta.
        expect(apuntarEleccion(conElecciones, null, { tipo: 'dote', idElemento: 3 })).toBeFalse();
        expect(apuntarEleccion(conElecciones, { idClase: 8, nivelClase: 5 }, { tipo: 'dote', idElemento: 3 })).toBeFalse();

        const niveles = construirNivelesCreacion({
            orden: conElecciones,
            clases,
            aumentosLanzador: [{ idClaseAplicada: 8, nivelClaseAplicado: 1, indiceAumento: 1, idClaseObjetivo: 9 }],
        });
        expect(niveles?.[0].elecciones).toEqual([{ tipo: 'aumento_lanzador', idElemento: 9, valor: 1 }]);
        expect(niveles?.[1].elecciones).toEqual([
            { tipo: 'dote', idElemento: 2, idExtra: 5, origen: 'Mago nivel 1' },
            { tipo: 'conjuro', idElemento: 60, idExtra: 9 },
        ]);
        expect(niveles?.[2].elecciones).toEqual([{ tipo: 'incremento', idElemento: 4, valor: 1 }]);
        // Las elecciones del orden no cambian al construir (se copian).
        expect(conElecciones[0].elecciones).toBeUndefined();
    });
});
