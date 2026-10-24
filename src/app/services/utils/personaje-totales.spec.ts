import { Personaje } from 'src/app/interfaces/personaje';
import { origenesDePartes, sumarPartes, textoDesglose, totalesPersonaje, totalHabilidad } from './personaje-totales';

describe('personaje-totales', () => {
    it('usa los totales de la ficha de la API tal cual', () => {
        const totales = {
            iniciativa: { total: 99, desglose: [] },
            presa: null,
            salvaciones: {
                fortaleza: { total: 1, desglose: [] },
                reflejos: { total: 2, desglose: [] },
                voluntad: { total: 3, desglose: [] },
            },
        };

        expect(totalesPersonaje({ Totales: totales, ModDestreza: 4 } as any)).toBe(totales);
    });

    it('calcula los del borrador de la creación con la misma regla que la API', () => {
        const borrador = {
            Ataque_base: '+6/+1',
            ModFuerza: 2,
            ModDestreza: 3,
            ModConstitucion: 1,
            ModSabiduria: -1,
            Raza: { Tamano: { Nombre: 'Pequeño', Modificador_presa: -4 } },
            Iniciativa_varios: [{ Valor: 4, Origen: 'Iniciativa mejorada' }, { Valor: 0, Origen: 'Nada' }],
            Presa_varios: [{ Valor: 1, Origen: 'Plantilla' }],
            Salvaciones: {
                fortaleza: { modsClaseos: [{ valor: 5, origen: 'Guerrero nivel 6' }], modsVarios: [{ valor: 2, origen: 'Gran fortaleza' }] },
                reflejos: { modsClaseos: [{ valor: 2, origen: 'Guerrero nivel 6' }], modsVarios: [] },
                voluntad: { modsClaseos: [{ valor: 0, origen: 'Guerrero nivel 6' }], modsVarios: [] },
            },
        } as unknown as Personaje;

        const totales = totalesPersonaje(borrador);

        expect(totales.iniciativa).toEqual({
            total: 7,
            desglose: [
                { tipo: 'caracteristica', origen: 'Destreza', valor: 3 },
                { tipo: 'varios', origen: 'Iniciativa mejorada', valor: 4 },
            ],
        });
        expect(totales.presa?.total).toBe(5);
        expect(sumarPartes(totales.presa, 'tamano')).toBe(-4);
        expect(totales.salvaciones.fortaleza.total).toBe(8);
        expect(totales.salvaciones.reflejos.total).toBe(5);
        expect(totales.salvaciones.voluntad).toEqual({
            total: -1,
            desglose: [{ tipo: 'caracteristica', origen: 'Sabiduría', valor: -1 }],
        });
    });

    it('deja la presa del borrador sin total si el ataque base no tiene número', () => {
        expect(totalesPersonaje({ Ataque_base: '' } as any).presa).toBeNull();
    });

    it('suma y nombra las partes de cada tipo y escribe el desglose', () => {
        const total = {
            total: 10,
            desglose: [
                { tipo: 'caracteristica' as const, origen: 'Constitución', valor: 2 },
                { tipo: 'clase' as const, origen: null, valor: 5 },
                { tipo: 'clase' as const, origen: 'Clérigo nivel 5', valor: 4 },
                { tipo: 'varios' as const, origen: 'Maldición', valor: -1 },
            ],
        };

        expect(sumarPartes(total, 'clase')).toBe(9);
        expect(origenesDePartes(total, 'clase')).toEqual(['Clérigo nivel 5']);
        expect(textoDesglose(total)).toBe('Constitución +2\nClase +5\nClérigo nivel 5 +4\nMaldición -1');
        expect(sumarPartes(null, 'varios')).toBe(0);
    });

    it('toma el total de la habilidad de la API o lo suma en el borrador', () => {
        expect(totalHabilidad({ Total: 18, Rangos: 1, Rangos_varios: 1, Mod_car: 1 })).toBe(18);
        expect(totalHabilidad({ Rangos: 1, Rangos_varios: 2, Mod_car: -5 })).toBe(-2);
    });
});
