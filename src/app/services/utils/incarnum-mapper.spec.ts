import { chakraApi, fusionApi, moldeadoEncarnadoApi, personajeIncarnumApi } from 'src/testing/incarnum';
import {
    normalizarChakraDetalle,
    normalizarClaseMoldeado,
    normalizarDoteIncarnum,
    normalizarEsenciaRasgo,
    normalizarFusion,
    normalizarHabilidadesPorAlineamiento,
    normalizarPersonajeIncarnum,
} from './incarnum-mapper';

describe('incarnum-mapper', () => {
    it('lee una fusión con sus chakras, descriptores y clases, sin los datos internos de juego', () => {
        const fusion = normalizarFusion(fusionApi());
        expect(fusion.Nombre).toBe('Yelmo de cristal');
        expect(fusion.Nombre_original).toBe('Crystal Helm');
        expect(fusion.Chakras[0]).toEqual(jasmine.objectContaining({ Id: 34, Nombre: 'Corona', Ocupa: true, Vinculo: true }));
        expect(fusion.Descriptores).toEqual([{ Id: 7, Nombre: 'Fuerza', Actitud: null }]);
        expect(fusion.Clases.map((c) => c.Id)).toEqual([405, 406]);
        expect(fusion.Manual).toEqual({ Id: 31, Nombre: 'Magia del incarnum', Pagina: 63 });
        expect((fusion as any).Datos_basico).toBeUndefined();
        expect(fusion.Salvacion).toBeNull();
    });

    it('la caché de la RTDB (claves a null que no están, listas como objetos) se lee igual', () => {
        const cache = fusionApi({ Salvacion: undefined, Descriptores: { a: { Id: 7, Nombre: 'Fuerza' } } });
        delete cache.Efecto_esencia;
        const fusion = normalizarFusion(cache);
        expect(fusion.Efecto_esencia).toBeNull();
        expect(fusion.Descriptores).toEqual([{ Id: 7, Nombre: 'Fuerza', Actitud: null }]);
    });

    it('lee el detalle de un chakra con su categoría, su ranura, sus fusiones y las clases que lo abren', () => {
        const chakra = normalizarChakraDetalle(chakraApi());
        expect(chakra.Categoria).toEqual(jasmine.objectContaining({ Nombre: 'Mínimo', Orden: 1 }));
        expect(chakra.Ranura).toEqual({ Id: 1, Nombre: 'Cabeza' });
        expect(chakra.Fusiones.length).toBe(2);
        expect(chakra.Clases).toEqual([{ Id: 407, Nombre: 'Totemista', Nivel: 5 }, { Id: 405, Nombre: 'Encarnado', Nivel: 2 }]);
        expect(normalizarChakraDetalle(chakraApi({ Ranura: null })).Ranura).toBeNull();
    });

    it('`Moldeado` de una clase: `null` si no moldea; si moldea, sus tablas ordenadas por nivel', () => {
        expect(normalizarClaseMoldeado(null)).toBeNull();
        const moldeado = normalizarClaseMoldeado(moldeadoEncarnadoApi({ Niveles: [{ Nivel: 2, Fusiones: 3 }, { Nivel: 1, Fusiones: 2 }] }))!;
        expect(moldeado.Niveles.map((n) => n.Nivel)).toEqual([1, 2]);
        expect(moldeado.Caracteristica_cd).toEqual({ Id: 5, Nombre: 'Sabiduría' });
        expect(moldeado.Chakras[0]).toEqual(jasmine.objectContaining({ Nombre: 'Corona', Nivel: 2 }));
        expect(moldeado.Capacidad[0]).toEqual({ Nivel: 3, Bonificador: 1, Chakra: null });
    });

    it('las habilidades por alineamiento descartan las que no tienen habilidad o alineamiento', () => {
        expect(normalizarHabilidadesPorAlineamiento([
            { Id_habilidad: 11, Habilidad: 'Diplomacia', Id_extra: null, Extra: null, Alineamiento: { Id: 1, Nombre: 'Legal bueno' } },
            { Id_habilidad: 0, Habilidad: '', Alineamiento: { Id: 1, Nombre: 'Legal bueno' } },
        ])).toEqual([{ Id_habilidad: 11, Habilidad: 'Diplomacia', Id_extra: null, Extra: null, Alineamiento: { Id: 1, Nombre: 'Legal bueno' } }]);
    });

    it('`Incarnum` de una dote y `Esencia` de un rasgo', () => {
        expect(normalizarDoteIncarnum(undefined)).toBeNull();
        expect(normalizarDoteIncarnum({ Esencia_reserva: 1, Esencia_reserva_moldeador: 2, Capacidad: { Bono: 1, Ambito: 'dotes', Tope_constitucion: 1 } }))
            .toEqual(jasmine.objectContaining({ Esencia_reserva: 1, Esencia_reserva_moldeador: 2, Capacidad: { Bono: 1, Ambito: 'dotes', Tope_constitucion: true } }));
        expect(normalizarEsenciaRasgo({ Reserva: 0, Receptaculo: false })).toBeNull();
        expect(normalizarEsenciaRasgo({ Reserva: 1, Receptaculo: false })).toEqual({ Reserva: 1, Receptaculo: false });
    });

    it('el bloque `incarnum` de la ficha, con su formación de partida', () => {
        const bloque = normalizarPersonajeIncarnum(personajeIncarnumApi())!;
        expect(bloque.reserva.total).toBe(7);
        expect(bloque.clases[0].chakrasAbiertos.map((c) => c.nombre)).toEqual(['Corona', 'Pies', 'Manos']);
        expect(bloque.formacion?.fusiones[0]).toEqual(jasmine.objectContaining({ esencia: 2, cd: 14, capacidad: 2 }));
        expect(bloque.formacion?.fusiones[0].vinculo?.id).toBe(34);
        expect(normalizarPersonajeIncarnum(null)).toBeNull();
        expect(normalizarPersonajeIncarnum(personajeIncarnumApi({ formacion: null }))!.formacion).toBeNull();
    });
});
