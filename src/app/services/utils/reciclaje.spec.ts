import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { ENTRADA_ENANO_CLERIGO_1 } from 'src/testing/subida-nivel-api';
import { aplicarReciclajeAlMotor, cantidadesDeRangos, destinosDeRangos, fichaConElReciclaje, filaDelReciclaje, habilidadesConRangos, PlanReciclaje, reciclajeDelPlan } from './reciclaje';
import { fichaDeLaSubida } from './subida-nivel';

const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/** La subida sobre la ficha reciclada: un nivel de clérigo con una dote nueva (lo que haría el motor). */
function conElNivel(reciclada: PersonajeCreateRequestDto): PersonajeCreateRequestDto {
    const despues = copia(reciclada);
    despues.colecciones!.dotes = [...(despues.colecciones!.dotes ?? []), { idDote: 999, idExtra: 0, origen: 'Dote por nivel: Clérigo nivel 2' }];
    return fichaDeLaSubida({
        entrada: reciclada, antes: reciclada, despues, idClase: 4, puntosGolpe: 20,
        nivel: { idClase: 4, nivelClase: 2, elecciones: [{ tipo: 'dote', idElemento: 999, idExtra: 0 }] },
    });
}

describe('reciclaje (Manual del jugador II, págs. 194-196: la ficha que se manda)', () => {
    it('una dote: sale la antigua y la nueva entra en su hueco (su origen), sin su decisión de homebrew; los niveles no cambian', () => {
        const entrada = copia(ENTRADA_ENANO_CLERIGO_1);
        entrada.decisionesHomebrew = [...(entrada.decisionesHomebrew ?? []), { tipo: 'requisitos_dote', idElemento: 2 }];
        const reciclada = fichaConElReciclaje(entrada, { tipo: 'dote', quita: { idDote: 2, idExtra: 0, orden: null }, pone: { idDote: 21, idExtra: 0 } });
        expect(reciclada.colecciones?.dotes).toEqual([{ idDote: 21, idExtra: 0, origen: 'Dote por nivel: Clérigo nivel 1' }]);
        expect(reciclada.decisionesHomebrew).toEqual([{ tipo: 'edad_menor_que_la_inicial', idElemento: 4 }]);
        expect(reciclada.niveles).toEqual(entrada.niveles);
        // La entrada no cambia.
        expect(entrada.colecciones?.dotes?.[0].idDote).toBe(2);

        const ficha = conElNivel(reciclada);
        expect(ficha.colecciones?.dotes?.map((d) => d.idDote)).toEqual([21, 999]);
        expect(ficha.niveles?.length).toBe(2);
    });

    it('un idioma: el nuevo, con el origen del olvidado', () => {
        const entrada = copia(ENTRADA_ENANO_CLERIGO_1);
        const ficha = conElNivel(fichaConElReciclaje(entrada, { tipo: 'idioma', quita: { idIdioma: 6 }, pone: { idIdioma: 9 } }));
        const idiomas = ficha.colecciones?.idiomas ?? [];
        expect(idiomas.some((i) => i.idIdioma === 6)).toBeFalse();
        expect(idiomas.find((i) => i.idIdioma === 9)).toEqual({ idIdioma: 9, origen: 'Idiomas iniciales' });
        expect(idiomas.length).toBe((entrada.colecciones?.idiomas ?? []).length);
    });

    it('los rangos: pasan de una habilidad a otra y no tocan las demás; una sin fila entra con los suyos', () => {
        const entrada = copia(ENTRADA_ENANO_CLERIGO_1);
        const rangos = (ficha: PersonajeCreateRequestDto, id: number) => ficha.colecciones?.habilidades?.base?.find((h) => h.idHabilidad === id)?.rangos;
        const ficha = conElNivel(fichaConElReciclaje(entrada, {
            tipo: 'rangos', quita: { idHabilidad: 8, idExtra: 0 }, pone: { idHabilidad: 9, idExtra: 0 }, rangos: 2,
        }));
        expect([rangos(ficha, 8), rangos(ficha, 9), rangos(ficha, 11)]).toEqual([0, 4, 2]);

        const sinFila = fichaConElReciclaje(entrada, {
            tipo: 'rangos', quita: { idHabilidad: 11, idExtra: 0 }, pone: { idHabilidad: 77, idExtra: 3 }, rangos: 1,
        }, { claseaDestino: true });
        expect(sinFila.colecciones?.habilidades?.base?.find((h) => h.idHabilidad === 77))
            .toEqual(jasmine.objectContaining({ idHabilidad: 77, idExtra: 3, rangos: 1, clasea: true }));
        expect(rangos(sinFila, 11)).toBe(1);
    });

    it('los conjuros: uno o dos de su clase, con su origen, y los copiados al libro se quedan', () => {
        const entrada = copia(ENTRADA_ENANO_CLERIGO_1);
        entrada.colecciones!.conjurosConocidos = [
            { idConjuro: 21, idClase: 8, origen: 'Hechicero nivel 1' },
            { idConjuro: 22, idClase: 8, origen: 'Hechicero nivel 1' },
            { idConjuro: 21, idClase: 9, copiado: true },
        ];
        const ficha = conElNivel(fichaConElReciclaje(entrada, { tipo: 'conjuros', cambios: [
            { idClase: 8, olvida: 21, aprende: 31 }, { idClase: 8, olvida: 22, aprende: 32 },
        ] }));
        expect(ficha.colecciones?.conjurosConocidos).toEqual([
            { idConjuro: 21, idClase: 9, copiado: true },
            { idConjuro: 31, idClase: 8, origen: 'Hechicero nivel 1' },
            { idConjuro: 32, idClase: 8, origen: 'Hechicero nivel 1' },
        ]);
    });

    it('el cuerpo `reciclaje`: la dote con su nivel del registro (1, 2…) o null; y la primera línea del resumen', () => {
        const quita = { idDote: 7, idExtra: 0, origen: 'Dote por nivel', nombre: 'Alerta', extra: '', indiceNivel: 2, motivo: null };
        const plan: PlanReciclaje = { tipo: 'dote', quita, seleccion: { idDote: 21, idExtra: 0, extra: '' }, pone: { idDote: 21, idExtra: 0, nombre: 'Esquiva', extra: '' } };
        expect(reciclajeDelPlan(plan)).toEqual({ tipo: 'dote', quita: { idDote: 7, idExtra: 0, orden: 3 }, pone: { idDote: 21, idExtra: 0 } });
        expect(reciclajeDelPlan({ ...plan, quita: { ...quita, indiceNivel: null } })).toEqual(jasmine.objectContaining({ quita: { idDote: 7, idExtra: 0, orden: null } }));
        expect(filaDelReciclaje(plan)).toEqual({ que: 'Reciclaje: dote', antes: 'Alerta', ahora: 'Esquiva', porque: 'Dote de nivel 3; Manual del jugador II, pág. 195' });
        const rangos: PlanReciclaje = { tipo: 'rangos', rangos: 4, quita: { idHabilidad: 30, idExtra: 0, nombre: 'Piruetas' }, pone: { idHabilidad: 18, idExtra: 0, nombre: 'Falsificar' } };
        expect(reciclajeDelPlan(rangos)).toEqual({ tipo: 'rangos', quita: { idHabilidad: 30, idExtra: 0 }, pone: { idHabilidad: 18, idExtra: 0 }, rangos: 4 });
        expect(filaDelReciclaje(rangos).antes).toBe('Piruetas −4');
        const conjuros: PlanReciclaje = { tipo: 'conjuros', cambios: [{ idClase: 4, clase: 'Hechicero', olvida: { id: 101, nombre: 'luz' }, aprende: { id: 140, nombre: 'mano de mago' } }] };
        expect(reciclajeDelPlan(conjuros)).toEqual({ tipo: 'conjuros', cambios: [{ idClase: 4, olvida: 101, aprende: 140 }] });
        expect(filaDelReciclaje(conjuros).porque).toContain('hechicero');
    });

    it('los rangos que se pueden traspasar: de 1 a 4, sin pasar de los que tiene', () => {
        expect(cantidadesDeRangos(0)).toEqual([]);
        expect(cantidadesDeRangos(2)).toEqual([1, 2]);
        expect(cantidadesDeRangos(9)).toEqual([1, 2, 3, 4]);
    });

    it('el traspaso de rangos en el motor, de la habilidad con su especialidad (no la primera de ese id)', () => {
        const habilidades = [
            { Id: 32, Id_extra: 52, Extra: 'Arcano', Rangos: 3 },
            { Id: 32, Id_extra: 53, Extra: 'Dungeons', Rangos: 4 },
            { Id: 42, Id_extra: -1, Extra: '', Rangos: 0 },
        ];
        const motor = { PersonajeCreacion: { Habilidades: habilidades } } as any;
        const plan: PlanReciclaje = { tipo: 'rangos', rangos: 4, quita: { idHabilidad: 32, idExtra: 53, nombre: 'Saber (dungeons)' }, pone: { idHabilidad: 42, idExtra: 0, nombre: 'Trepar' } };
        expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
        expect(habilidades.map((h) => h.Rangos)).toEqual([3, 0, 4]);
        expect(aplicarReciclajeAlMotor(motor, plan)).toBeFalse();
    });
});

describe('el reciclaje de rangos con dos especialidades de la misma habilidad', () => {
    // Saber (arcano) y Saber (religión): cada uno es una habilidad (contrato, «El reciclaje», `rangos`).
    const saber = (idExtra: number, extra: string, rangos: number) =>
        ({ Id: 20, Nombre: 'Saber', Soporta_extra: true, Id_extra: idExtra, Extra: extra, Rangos: rangos, Custom: false });
    const motor: any = {
        PersonajeCreacion: { Habilidades: [saber(5, 'Arcano', 4), saber(6, 'Religión', 1)] },
        esHabilidadDeClaseEnAlguna: () => true,
    };
    const entrada = { colecciones: { habilidades: { base: [
        { idHabilidad: 20, idExtra: 5, rangos: 4 }, { idHabilidad: 20, idExtra: 6, rangos: 1 }] } } } as unknown as PersonajeCreateRequestDto;

    it('cada una, con su nombre y sus rangos', () => {
        expect(habilidadesConRangos(motor, entrada).map((h) => [h.nombre, h.idExtra, h.rangos]))
            .toEqual([['Saber (Arcano)', 5, 4], ['Saber (Religión)', 6, 1]]);
    });

    it('de una a la otra, con los rangos de la de destino', () => {
        const arcano = habilidadesConRangos(motor, entrada)[0];
        const destinos = destinosDeRangos(motor, entrada, arcano, 2, 3, []);
        expect(destinos.map((d) => [d.idExtra, d.rangos])).toEqual([[6, 1]]);
        expect(destinos[0].motivo).toBeNull();
    });
});
