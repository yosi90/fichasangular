import { textoAtaqueBase } from './ataque-base';
import { capacidadCarga } from './capacidad-carga';
import { bonosSinergia } from './habilidades-bonos';
import { dgsDePlantillas, dgsTotales, nivelEfectivoPersonaje, primerDgEsRacial } from './nivel-personaje';
import { calcularPuntosGolpe, carasDado, dadoTrasPasos } from './puntos-golpe';
import { puntosHabilidadDgPlantilla } from './puntos-habilidad';

describe('Cifras de la creación (Manual del jugador, Guía del DM y Manual de monstruos)', () => {
    describe('ataque base con sus ataques adicionales (MJ tabla 3-1)', () => {
        it('un ataque más cada 5 puntos desde +6, hasta 4', () => {
            expect(textoAtaqueBase(0)).toBe('+0');
            expect(textoAtaqueBase(5)).toBe('+5');
            expect(textoAtaqueBase(6)).toBe('+6/+1');
            expect(textoAtaqueBase(11)).toBe('+11/+6/+1');
            expect(textoAtaqueBase(20)).toBe('+20/+15/+10/+5');
        });
    });

    describe('capacidad de carga (MJ tabla 9-1)', () => {
        const tabla = [
            { Fuerza: 8, Ligera: 26, Media: 53, Pesada: 80 },
            { Fuerza: 14, Ligera: 58, Media: 116, Pesada: 175 },
            { Fuerza: 20, Ligera: 133, Media: 266, Pesada: 400 },
            { Fuerza: 29, Ligera: 466, Media: 933, Pesada: 1400 },
        ];

        it('Fuerza 14 Mediano: la fila de la tabla (no la de carga ligera como pesada)', () => {
            expect(capacidadCarga(14, tabla, 1)).toEqual({ Ligera: 58, Media: 116, Pesada: 175 });
        });

        it('un mediano de Fuerza 8 (Pequeño, ×3/4) y un cuadrúpedo Grande de Fuerza 20 (×3)', () => {
            expect(capacidadCarga(8, tabla, 0.75)).toEqual({ Ligera: 19, Media: 39, Pesada: 60 });
            expect(capacidadCarga(20, tabla, 3).Pesada).toBe(1200);
        });

        it('Fuerza 30: la fila de 20 × 4; sin Fuerza o sin tabla, 0', () => {
            expect(capacidadCarga(30, tabla, 1)).toEqual({ Ligera: 532, Media: 1064, Pesada: 1600 });
            expect(capacidadCarga(0, tabla, 1)).toEqual({ Ligera: 0, Media: 0, Pesada: 0 });
            expect(capacidadCarga(14, [], 1)).toEqual({ Ligera: 0, Media: 0, Pesada: 0 });
        });
    });

    describe('NEP y DG totales (GDM cap. 6, MM)', () => {
        const licantropoLobo = { Actualiza_dg: false, Licantronia_dg: { Multiplicador: 2 }, Ajuste_nivel: 2 };
        const liche = { Actualiza_dg: true, Licantronia_dg: { Multiplicador: 0 }, Ajuste_nivel: 4 };

        it('los DG de plantilla son los del animal; una plantilla que actualiza los DG no añade', () => {
            expect(dgsDePlantillas([licantropoLobo, liche])).toBe(2);
        });

        it('centauro (4 DG, +2) explorador 1: 5 DG y NEP 7; los subtipos también suman su ajuste', () => {
            const partes = { nivelesClase: 1, dgsRaza: 4, dgsPlantillas: 0, ajusteRaza: 2, ajustePlantillas: 0, ajusteSubtipos: 0 };
            expect(dgsTotales(partes)).toBe(5);
            expect(nivelEfectivoPersonaje(partes)).toBe(7);
            expect(nivelEfectivoPersonaje({ ...partes, ajusteSubtipos: 1 })).toBe(8);
        });

        it('el primer DG es racial solo con DG de la raza, no con los de una plantilla', () => {
            expect(primerDgEsRacial({ dgsRaza: 4 })).toBeTrue();
            expect(primerDgEsRacial({ dgsRaza: 0 })).toBeFalse();
        });
    });

    describe('puntos de golpe (MJ cap. 3)', () => {
        it('las caras del dado salen de su nombre y la escalera, del catálogo de tipos de dado', () => {
            expect(carasDado('d8')).toBe(8);
            expect(carasDado('D12')).toBe(12);
            expect(carasDado('elegir')).toBe(0);
            expect(dadoTrasPasos(8, 1, [4, 6, 8, 10, 12])).toBe(10);
            expect(dadoTrasPasos(12, 2, [4, 6, 8, 10, 12])).toBe(12);
            expect(dadoTrasPasos(8, 1, [])).toBe(8);
        });

        it('cada DG da su tirada + Con con un mínimo de 1, y el primer DG de clase va al máximo', () => {
            const resultado = calcularPuntosGolpe({
                dgsRaciales: { cantidad: 0, caras: 0 },
                nivelesClase: [{ cantidad: 2, caras: 4 }],
                dgsPlantillas: [],
                modConstitucion: -4,
                bonoPorDg: 0,
                bonoPlano: 0,
                tirar: () => 1,
            });
            expect(resultado).toEqual({ total: 2, maximo: 2, tiradas: 1, dgsRaciales: 0 });
        });
    });

    describe('puntos de habilidad de los DG de plantilla (MM, «Licántropo»)', () => {
        it('(puntos del tipo + Int, mínimo 1) por DG, sin ×4', () => {
            expect(puntosHabilidadDgPlantilla({ puntosPorDg: 2, dgs: 2, modInteligencia: 0 })).toBe(4);
            expect(puntosHabilidadDgPlantilla({ puntosPorDg: 2, dgs: 2, modInteligencia: 3 })).toBe(10);
            expect(puntosHabilidadDgPlantilla({ puntosPorDg: 2, dgs: 2, modInteligencia: -4 })).toBe(2);
        });
    });

    describe('sinergias (MJ tabla 4-5)', () => {
        const reglas = [
            { Id_habilidad_origen: 37, Habilidad_origen: 'Saltar', Id_extra_origen: -1, Id_habilidad_destino: 30, Habilidad_destino: 'Piruetas', Id_extra_destino: -1, Rangos_minimos: 5, Bonificador: 2, Condicion: null },
            { Id_habilidad_origen: 32, Habilidad_origen: 'Saber (naturaleza)', Id_extra_origen: 57, Id_habilidad_destino: 39, Habilidad_destino: 'Supervivencia', Id_extra_destino: -1, Rangos_minimos: 5, Bonificador: 2, Condicion: 'En la superficie, en entornos naturales' },
        ];

        it('con 5 rangos en Saltar, Piruetas lleva +2; con 4, nada', () => {
            expect(bonosSinergia({ id: 30, idExtra: -1 }, [{ id: 37, idExtra: -1, rangos: 5 }], reglas))
                .toEqual([{ tipo: 'sinergia', origen: 'Sinergia (Saltar)', valor: 2 }]);
            expect(bonosSinergia({ id: 30, idExtra: -1 }, [{ id: 37, idExtra: -1, rangos: 4 }], reglas)).toEqual([]);
        });

        it('Saber (naturaleza) en cualquier hueco de Saber da su +2 condicional a Supervivencia', () => {
            expect(bonosSinergia({ id: 39, idExtra: -1 }, [{ id: 34, idExtra: 57, rangos: 5 }], reglas))
                .toEqual([{ tipo: 'sinergia', origen: 'Sinergia (Saber (naturaleza))', valor: 2, condicion: 'En la superficie, en entornos naturales' }]);
        });
    });
});
