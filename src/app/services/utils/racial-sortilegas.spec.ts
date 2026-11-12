import { AptitudSortilega } from 'src/app/interfaces/aptitud-sortilega';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { sortilegasConLasDeRasgos } from './racial-sortilegas';

// Los mismos casos que `tests/test_raciales_gith_y_genasies.py` (`SortilegasDeLosRasgosTests`) de la API.

const sortilega = (Id: number, Nombre: string, Usos_diarios = '3/día', Nivel_lanzador = 'igual a sus niveles de clase') =>
    ({ Conjuro: { Id, Nombre }, Nivel_lanzador, Usos_diarios });
const racial = (Id: number, Nombre: string, Sortilegas: any[] = [], Progresion: any[] = []) =>
    ({ Id, Nombre, Sortilegas, Progresion } as unknown as RacialDetalle);
const guardada = (Id: number, Nombre: string, Origen: string): AptitudSortilega =>
    ({ Conjuro: { Id, Nombre } as any, Nivel_lanzador: 1, Usos_diarios: '1/día', Descripcion: '', Dgs_necesarios: 0, Origen });

describe('sortilegasConLasDeRasgos', () => {
    const HABLAR = racial(25, '1/día hablar con los animales', [sortilega(1, 'Hablar con los animales', '1/día', '1')]);
    const CONTORNO = racial(4973, 'Poderes psiónicos de githyanki: contorno borroso', [sortilega(503, 'Contorno borroso')]);
    const TELECINESIA = racial(4975, 'Poderes psiónicos de githyanki: telecinesia y desplazamiento de plano',
        [sortilega(863, 'Telecinesia'), sortilega(549, 'Desplazamiento de plano', '1/día')]);

    it('suma las de sus rasgos tras las que tiene, sin repetir un conjuro y con el rasgo como origen', () => {
        const actuales = [guardada(1, 'Hablar con los animales', 'Gnomo')];
        const raciales = [HABLAR, CONTORNO, TELECINESIA, racial(4976, 'Otro', [sortilega(549, 'Desplazamiento de plano', '1/día')]), racial(8, 'Visión')];
        const antes = JSON.stringify([actuales, raciales]);
        const sor = sortilegasConLasDeRasgos(actuales, raciales);
        expect(JSON.stringify([actuales, raciales])).toBe(antes);
        expect(sor.map((s) => [s.Conjuro.Nombre, s.Origen])).toEqual([
            ['Hablar con los animales', 'Gnomo'],
            ['Contorno borroso', CONTORNO.Nombre],
            ['Telecinesia', TELECINESIA.Nombre],
            ['Desplazamiento de plano', TELECINESIA.Nombre],
        ]);
        expect(sor[1]).toEqual({
            Conjuro: { Id: 503, Nombre: 'Contorno borroso' } as any, Nivel_lanzador: 'igual a sus niveles de clase',
            Usos_diarios: '3/día', Descripcion: '', Dgs_necesarios: 0, Origen: CONTORNO.Nombre,
        });
    });

    it('vuelve a dar lo mismo con lo que ya dio', () => {
        const una = sortilegasConLasDeRasgos([], [CONTORNO, TELECINESIA]);
        expect(sortilegasConLasDeRasgos(una, [CONTORNO, TELECINESIA])).toEqual(una);
    });

    it('quita las de un rasgo que ya no tiene (lo sustituyó la progresión), y solo esas', () => {
        const VIEJO = racial(10, 'Rasgo viejo', [sortilega(503, 'Contorno borroso')]);
        const NUEVO = racial(11, 'Rasgo nuevo', [sortilega(783, 'Puerta dimensional')]);
        const DUENO = racial(9, 'Dueño', [], [
            { Medida: 'nivel', Desde: 1, Gana: VIEJO, Sustituye: null },
            { Medida: 'nivel', Desde: 6, Gana: NUEVO, Sustituye: { Id: 10, Nombre: 'Rasgo viejo' } },
        ]);
        const actuales = [guardada(503, 'Contorno borroso', 'Rasgo viejo'), guardada(1, 'Hablar con los animales', 'Gnomo'),
            guardada(503, 'Contorno borroso', 'Otro origen')];
        const sor = sortilegasConLasDeRasgos(actuales, [DUENO, NUEVO], [DUENO, VIEJO]);
        expect(sor.map((s) => [s.Conjuro.Nombre, s.Origen])).toEqual([
            ['Hablar con los animales', 'Gnomo'], ['Contorno borroso', 'Otro origen'], ['Puerta dimensional', 'Rasgo nuevo'],
        ]);
    });

    it('sin nada, vacía', () => {
        expect(sortilegasConLasDeRasgos(null, null)).toEqual([]);
        expect(sortilegasConLasDeRasgos([], [racial(1, 'Sin sortílegas')])).toEqual([]);
    });
});
