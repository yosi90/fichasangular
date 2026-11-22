import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { filaSinPrerrequisitos, filasDeLaPerdidaConTodo, perdidaDeUnNivelConTodo } from './perdida-con-todo';

/*
 * La pérdida de un nivel «con todo» (`perdida-con-todo.ts`), la que comparten «Perder un nivel» y la mascota perdida que
 * baja un nivel («Su mascota»): el guerrero 4 que pierde su 4.º nivel con el incremento de Constitución y la dote de ese
 * nivel, y se queda con otra dote sin poder usarla (MJ pág. 87).
 */

const GUERRERO = 7;

function tabla(base: number[], fort: number[]): any[] {
    return base.map((ab, i) => ({ Nivel: i + 1, Ataque_base: `+${ab}`, Salvaciones: { Fortaleza: `+${fort[i]}`, Reflejos: '+0', Voluntad: '+0' }, Dotes: [], Especiales: [] }));
}

const claseGuerrero: any = {
    Id: GUERRERO, Nombre: 'Guerrero', Puntos_habilidad: { Id: 1, Valor: 2 }, Conjuros: {},
    Desglose_niveles: tabla([1, 2, 3, 4], [2, 3, 3, 4]),
};

function caracteristicas(): any {
    const c = (valor: number) => ({ valor, minimo: 0, perdido: false });
    return { fuerza: c(16), destreza: c(12), constitucion: c(14), inteligencia: c(10), sabiduria: c(10), carisma: c(8) };
}

function nivel(n: number, tirada: number, elecciones: any[] = []): any {
    return { idClase: GUERRERO, nivelClase: n, pg: { tirada, maximo: n === 1 }, elecciones, ordenConocido: true };
}

function guerrero4(): PersonajeCreateRequestDto {
    const fort = [2, 3, 3, 4];
    return {
        personaje: { nombre: 'Prueba', ataqueBase: '+4', puntosGolpe: 35 } as any,
        caracteristicas: caracteristicas(),
        tamano: { idTamano: 5, origen: 'Web' },
        modificadores: {
            salvaciones: {
                fortaleza: { claseos: fort.map((f, i) => ({ valor: f - (i > 0 ? fort[i - 1] : 0), origen: `Guerrero nivel ${i + 1}` })).filter((m) => m.valor !== 0), varios: [] },
                reflejos: { claseos: [], varios: [] }, voluntad: { claseos: [], varios: [] },
            },
        } as any,
        colecciones: {
            clases: [{ idClase: GUERRERO, nivel: 4 }],
            dotes: [{ idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 5, idExtra: 0, origen: 'Guerrero nivel 2' }, { idDote: 30, idExtra: 0, origen: 'Guerrero nivel 4' }],
            especiales: [], idiomas: [], dominios: [], conjurosConocidos: [],
            habilidades: { base: [], custom: [] },
        } as any,
        niveles: [nivel(1, 10), nivel(2, 6), nivel(3, 7),
            nivel(4, 4, [{ tipo: 'incremento', idElemento: 3, valor: 1 }, { tipo: 'dote', idElemento: 30, idExtra: 0, origen: 'Guerrero nivel 4' }])],
    } as PersonajeCreateRequestDto;
}

describe('perdida-con-todo: la pérdida de un nivel que comparten «Perder un nivel» y «Su mascota»', () => {
    // La dote de 2.º nivel (5) pide la Constitución que baja con el incremento: se queda sin poder usarla.
    const sinPrerrequisitos = [{ idDote: 5, idExtra: 0, origen: 'Guerrero nivel 2', nombre: 'Aguante' }];
    let svc: any;
    const motor: any = { loQueDabanLasDotes: () => null };

    beforeEach(() => {
        svc = {
            claseDelCatalogo: () => claseGuerrero,
            carasDadoGolpeDeClase: () => 10,
            dotesSinPrerrequisitosTrasPerder: jasmine.createSpy('dotesSinPrerrequisitosTrasPerder').and.returnValue(sinPrerrequisitos),
            nombresDeLoQueEligeLaMascota: () => ({}),
            conjuroDelCatalogo: () => null,
            EstadoFlujo: { ventajas: { catalogoIdiomas: [] } },
        };
    });

    it('pierde el incremento y la dote de ese nivel, y marca la que se queda sin sus prerrequisitos', () => {
        const entrada = guerrero4();
        const perdida = perdidaDeUnNivelConTodo(svc, motor, { entrada, indice: 3, dgs: 4, incremento: null, dote: null });
        expect(perdida.sinElNivel.quitado.incremento).toBe(3);
        expect(perdida.sinElNivel.quitado.dotes).toEqual([{ idDote: 30, idExtra: 0 }]);
        expect(perdida.resultado.ficha.caracteristicas.constitucion.valor).toBe(13);
        // Lo que se le pregunta al motor: la clase, la Constitución que baja y la dote que se va.
        expect(svc.dotesSinPrerrequisitosTrasPerder).toHaveBeenCalledWith(jasmine.objectContaining({
            idClase: GUERRERO, caracteristica: { clave: 'Constitucion', menos: 1 }, dotesQuitadas: [{ idDote: 30, idExtra: 0 }],
        }));
        expect((perdida.resultado.ficha.colecciones as any).dotes).toEqual([
            { idDote: 1, idExtra: 0, origen: 'Nivel 1' },
            { idDote: 5, idExtra: 0, origen: 'Guerrero nivel 2', sinPrerrequisitos: true },
        ]);
        expect(perdida.filaDelNivel).toEqual({ que: 'Nivel de clase', antes: 'Guerrero 4', ahora: 'Guerrero 3' });
        // Sin mascotas, sus mascotas no cambian.
        expect(perdida.mascotas).toEqual({});
    });

    it('«Lo que pierde»: los PG, el incremento, la dote y la que se queda sin poder usar, en las dos pantallas', () => {
        const entrada = guerrero4();
        const perdida = perdidaDeUnNivelConTodo(svc, motor, { entrada, indice: 3, dgs: 4, incremento: null, dote: null });
        const filas = filasDeLaPerdidaConTodo(svc, null, entrada, perdida);
        expect(filas.map((f) => f.que)).toEqual([
            'Puntos de golpe', 'Ataque base', 'Fortaleza (de clase)', 'Constitución (incremento)', 'Dotes',
            'Sin poder usar (hasta cumplir de nuevo sus prerrequisitos)',
        ]);
        expect(filas[3]).toEqual({ que: 'Constitución (incremento)', antes: '14', ahora: '13' });
        // «Su mascota» manda la ficha sin el familiar: las filas son las mismas (el familiar perdido no saca la suya).
        const sinFamiliar = { ...perdida.resultado.ficha, familiar: undefined } as PersonajeCreateRequestDto;
        expect(filasDeLaPerdidaConTodo(svc, null, entrada, perdida, sinFamiliar)).toEqual(filas);
    });

    it('sin el orden de sus niveles, el incremento que elige el jugador (no siempre la más alta)', () => {
        const entrada = guerrero4();
        entrada.niveles = entrada.niveles!.map((n) => ({ ...n, ordenConocido: false, elecciones: [] }));
        // El 4.º DG daba incremento: elige la Destreza (2), no la Fuerza, la más alta.
        const perdida = perdidaDeUnNivelConTodo(svc, motor, { entrada, indice: 3, dgs: 4, incremento: 2, dote: null });
        expect(perdida.sinElNivel.quitado.incremento).toBe(2);
        expect(perdida.resultado.ficha.caracteristicas.destreza.valor).toBe(11);
        expect(svc.dotesSinPrerrequisitosTrasPerder).toHaveBeenCalledWith(jasmine.objectContaining({ caracteristica: { clave: 'Destreza', menos: 1 } }));
    });

    it('sin dotes sin prerrequisitos, sin su fila', () => {
        expect(filaSinPrerrequisitos([])).toEqual([]);
    });
});
