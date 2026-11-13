import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { CambiosCorreccion, fichaDeLaCorreccion } from './correccion-ficha';

/*
 * La ficha que manda la corrección (fase 6 de las sesiones): la `entrada` con lo corregido. Lo que sale del motor (las
 * puntuaciones, los PG) va como diferencia sobre lo guardado; lo que se quita sale también de las elecciones de su nivel.
 */
describe('fichaDeLaCorreccion (la corrección de la ficha, fase 6)', () => {
    const entrada = (): PersonajeCreateRequestDto => ({
        personaje: { nombre: 'Brunilda', puntosGolpe: 12, idRaza: 3 } as any,
        caracteristicas: {
            fuerza: { valor: 15, minimo: 0, perdido: false },
            destreza: { valor: 12, minimo: 0, perdido: false },
            constitucion: { valor: 0, minimo: 0, perdido: true },
            inteligencia: { valor: 10, minimo: 0, perdido: false },
            sabiduria: { valor: 10, minimo: 0, perdido: false },
            carisma: { valor: 8, minimo: 0, perdido: false },
        } as any,
        tamano: { idTamano: 3 } as any,
        colecciones: {
            dotes: [
                { idDote: 2, idExtra: 0, origen: 'Dote de nivel 1' },
                { idDote: 9, idExtra: 4, origen: 'Guerrero nivel 2' },
            ],
            idiomas: [{ idIdioma: 1, origen: 'Raza' }, { idIdioma: 5, origen: 'Inteligencia' }],
            conjurosConocidos: [
                { idConjuro: 60, idClase: 8, origen: 'Hechicero nivel 1' },
                { idConjuro: 60, idClase: 8, copiado: true },
            ],
        } as any,
        niveles: [
            { idClase: 7, nivelClase: 1, elecciones: [{ tipo: 'dote', idElemento: 2, idExtra: 0 }, { tipo: 'idioma', idElemento: 5 }] },
            { idClase: 7, nivelClase: 2, elecciones: [{ tipo: 'dote', idElemento: 9, idExtra: 4 }] },
        ],
        decisionesHomebrew: [{ tipo: 'alineamiento_raza', idElemento: 3 }],
    });
    const sinCambios = (): CambiosCorreccion => ({
        caracteristicas: {}, puntosGolpe: null, dotesQuitadas: [], dotesMantenidas: [], idiomasQuitados: [], conjurosQuitados: [],
    });

    it('sin cambios, la misma entrada (y no la toca)', () => {
        const original = entrada();
        expect(fichaDeLaCorreccion(original, sinCambios())).toEqual(entrada());
        expect(original).toEqual(entrada());
    });

    it('las puntuaciones como diferencia sobre lo guardado (una perdida no cambia) y los PG del motor', () => {
        const ficha = fichaDeLaCorreccion(entrada(), { ...sinCambios(), caracteristicas: { Fuerza: 2, Constitucion: 1 }, puntosGolpe: 14 });
        expect((ficha.caracteristicas as any).fuerza.valor).toBe(17);
        expect((ficha.caracteristicas as any).constitucion.valor).toBe(0);
        expect(ficha.personaje.puntosGolpe).toBe(14);
    });

    it('lo que se quita sale de la ficha y de la elección de su nivel; los copiados al libro se quedan', () => {
        const ficha = fichaDeLaCorreccion(entrada(), {
            ...sinCambios(),
            dotesQuitadas: [{ idDote: 9, idExtra: 4, origen: 'Guerrero nivel 2' }],
            idiomasQuitados: [5],
            conjurosQuitados: [{ idConjuro: 60, idClase: 8 }],
        });
        expect((ficha.colecciones as any).dotes).toEqual([{ idDote: 2, idExtra: 0, origen: 'Dote de nivel 1' }]);
        expect((ficha.colecciones as any).idiomas).toEqual([{ idIdioma: 1, origen: 'Raza' }]);
        expect((ficha.colecciones as any).conjurosConocidos).toEqual([{ idConjuro: 60, idClase: 8, copiado: true }]);
        expect(ficha.niveles![0].elecciones).toEqual([{ tipo: 'dote', idElemento: 2, idExtra: 0 }]);
        expect(ficha.niveles![1].elecciones).toEqual([]);
    });

    it('una dote que se mantiene sin sus prerrequisitos es una decisión homebrew; si luego se quita, la decisión también', () => {
        const mantenida = fichaDeLaCorreccion(entrada(), { ...sinCambios(), dotesMantenidas: [9] });
        expect(mantenida.decisionesHomebrew).toEqual([{ tipo: 'alineamiento_raza', idElemento: 3 }, { tipo: 'requisitos_dote', idElemento: 9 }]);
        const quitada = fichaDeLaCorreccion(mantenida, { ...sinCambios(), dotesQuitadas: [{ idDote: 9, idExtra: 4, origen: 'Guerrero nivel 2' }] });
        expect(quitada.decisionesHomebrew).toEqual([{ tipo: 'alineamiento_raza', idElemento: 3 }]);
    });

    it('otra dote en el hueco de la quitada: con su mismo origen, en la ficha y en la elección de su nivel', () => {
        const ficha = fichaDeLaCorreccion(entrada(), {
            ...sinCambios(),
            dotesQuitadas: [{ idDote: 9, idExtra: 4, origen: 'Guerrero nivel 2' }],
            dotesNuevas: [{ idDote: 12, idExtra: 0, origen: 'Guerrero nivel 2', indiceNivel: 1 }],
        });
        expect((ficha.colecciones as any).dotes).toEqual([
            { idDote: 2, idExtra: 0, origen: 'Dote de nivel 1' }, { idDote: 12, idExtra: 0, origen: 'Guerrero nivel 2' }]);
        expect(ficha.niveles![1].elecciones).toEqual([{ tipo: 'dote', idElemento: 12, idExtra: 0, origen: 'Guerrero nivel 2' }]);
    });

    it('el alineamiento, la deidad, la edad, la altura, el peso y las tiradas de PG (no la del máximo)', () => {
        const base = entrada();
        base.niveles![0].pg = { tirada: null, maximo: true };
        base.niveles![1].pg = { tirada: 4, maximo: false };
        const ficha = fichaDeLaCorreccion(base, {
            ...sinCambios(),
            personaje: { idAlineamiento: 4, deidad: 7, edad: 30, altura: 1.8, peso: 80 },
            tiradasPg: { 0: 6, 1: 9 },
        });
        expect(ficha.personaje).toEqual(jasmine.objectContaining({ idAlineamiento: 4, deidad: 7, edad: 30, altura: 1.8, peso: 80 }));
        expect(ficha.niveles![0].pg).toEqual({ tirada: null, maximo: true });
        expect(ficha.niveles![1].pg).toEqual({ tirada: 9, maximo: false });
    });

    it('los rangos repartidos otra vez: la diferencia del motor en cada habilidad y los rangos de cada nivel', () => {
        const base = entrada();
        (base.colecciones as any).habilidades = { base: [{ idHabilidad: 2, rangos: 5, clasea: true }, { idHabilidad: 3, rangos: 2 }], custom: [] };
        base.niveles![0].elecciones!.push({ tipo: 'rangos', idElemento: 2, valor: 4 });
        const cuerpo = (rangos: Array<[number, number]>) => ({ colecciones: { habilidades: {
            base: rangos.map(([idHabilidad, r]) => ({ idHabilidad, rangos: r })), custom: [] } } } as any);
        const ficha = fichaDeLaCorreccion(base, {
            ...sinCambios(),
            rangos: {
                antes: cuerpo([[2, 5], [3, 2]]),
                despues: cuerpo([[2, 3], [3, 4], [6, 1]]),
                porNivel: [[{ tipo: 'rangos', idElemento: 2, valor: 2 }, { tipo: 'rangos', idElemento: 3, valor: 4 }], [{ tipo: 'rangos', idElemento: 6, valor: 1 }]],
            },
        });
        expect((ficha.colecciones as any).habilidades.base).toEqual([
            { idHabilidad: 2, rangos: 3, clasea: true }, { idHabilidad: 3, rangos: 4 }, { idHabilidad: 6, rangos: 1 }]);
        expect(ficha.niveles![0].elecciones!.filter((e) => e.tipo === 'rangos').map((e) => [e.idElemento, e.valor])).toEqual([[2, 2], [3, 4]]);
        expect(ficha.niveles![1].elecciones!.filter((e) => e.tipo === 'rangos').map((e) => [e.idElemento, e.valor])).toEqual([[6, 1]]);
    });

    it('las decisiones que se recalculan: las de esos tipos se sustituyen (una edad corregida a una que vale quita la suya)', () => {
        const base = entrada();
        base.decisionesHomebrew!.push({ tipo: 'edad_mayor_que_la_maxima', idElemento: 3 });
        const ficha = fichaDeLaCorreccion(base, {
            ...sinCambios(),
            decisionesRecalculadas: { tipos: ['edad_mayor_que_la_maxima', 'alineamiento_clase'], decisiones: [{ tipo: 'alineamiento_clase', idElemento: 11 }] },
        });
        expect(ficha.decisionesHomebrew).toEqual([{ tipo: 'alineamiento_raza', idElemento: 3 }, { tipo: 'alineamiento_clase', idElemento: 11 }]);
    });
});
