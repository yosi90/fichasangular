import { construirNivelesCreacion, ordenCuadra } from './niveles-creacion';

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

    it('las dotes, los conjuros y los aumentos de lanzador van al nivel que dice su origen', () => {
        const niveles = construirNivelesCreacion({
            orden,
            clases,
            dotes: [
                { idDote: 1, idExtra: 0, origen: 'Dote adicional por nivel 3' },
                { idDote: 2, idExtra: 5, origen: 'Mago nivel 1' },
                { idDote: 3, origen: 'Humano' },
            ],
            conjuros: [
                { idConjuro: 60, idClase: 9, origen: 'Mago nivel 1 (clase)' },
                { idConjuro: 60, idClase: 8, origen: 'Hechicero nivel 2 (clase)' },
                { idConjuro: 61, idClase: 9, origen: 'Mago: copiado al libro', copiado: true },
            ],
            aumentosLanzador: [{ idClaseAplicada: 8, nivelClaseAplicado: 1, indiceAumento: 1, idClaseObjetivo: 9 }],
            dgsAntesDeLasClases: 0,
        });
        expect(niveles?.[0].elecciones).toEqual([{ tipo: 'aumento_lanzador', idElemento: 9, valor: 1 }]);
        expect(niveles?.[1].elecciones).toEqual([
            { tipo: 'dote', idElemento: 2, idExtra: 5, origen: 'Mago nivel 1' },
            { tipo: 'conjuro', idElemento: 60, idExtra: 9, origen: 'Mago nivel 1 (clase)' },
        ]);
        expect(niveles?.[2].elecciones).toEqual([
            { tipo: 'dote', idElemento: 1, idExtra: 0, origen: 'Dote adicional por nivel 3' },
            { tipo: 'conjuro', idElemento: 60, idExtra: 8, origen: 'Hechicero nivel 2 (clase)' },
        ]);
    });

    it('la dote «por nivel N» cuenta los DG de antes de las clases (los raciales y los de plantilla)', () => {
        const niveles = construirNivelesCreacion({
            orden,
            clases,
            dotes: [{ idDote: 1, origen: 'Dote adicional por nivel 3' }, { idDote: 2, origen: 'Dote adicional por nivel 1' }],
            dgsAntesDeLasClases: 2,
        });
        expect(niveles?.map((n) => (n.elecciones ?? []).map((e) => e.idElemento))).toEqual([[1], [], []]);
    });
});
