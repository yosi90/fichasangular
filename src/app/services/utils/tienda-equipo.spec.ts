import { normalizeArma } from 'src/app/services/arma.service';
import { normalizeArmadura } from 'src/app/services/armadura.service';
import { normalizeEncantamiento, normalizeEquipoCatalogos, normalizeMaterial, normalizeMunicion, normalizeObjeto } from './equipo-mapper';
import {
    crearArmaApi,
    crearArmaduraApi,
    crearEncantamientoApi,
    crearEquipoCatalogosApi,
    crearMaterialApi,
    crearMunicionApi,
    crearObjetoApi,
    crearObjetoGenericoApi,
    crearRodelaApi,
} from 'src/testing/equipo-api';
import { crearArmaEspecificaApi } from 'src/testing/equipo-api';
import {
    aplicacionesDeArticulo,
    aptitudSeAplica,
    indicePiezaDelCampo,
    motivoPiezaNoValida,
    pestanasTienda,
    politicaTienda,
    textoCarga,
    articuloDeArma,
    articuloDeArmadura,
    articuloDeMunicion,
    articuloDeObjeto,
    construirCompra,
    faltaEnPieza,
    nuevaPieza,
    precioEstimado,
    pesoEstimado,
    reglaDineroInicial,
    resumenCompra,
    sePuedeComprar,
    tirarOroInicial,
} from './tienda-equipo';

describe('tienda-equipo', () => {
    const catalogos = normalizeEquipoCatalogos(crearEquipoCatalogosApi());
    const espada = articuloDeArma(normalizeArma(crearArmaApi({ Id: 30, Nombre: 'Espada larga', Precio: 15, Peso: 4 })));
    const cota = articuloDeArmadura(normalizeArmadura(crearArmaduraApi()));
    const rodela = articuloDeArmadura(normalizeArmadura(crearRodelaApi()));
    const flechas = articuloDeMunicion(normalizeMunicion(crearMunicionApi()));
    const capa = articuloDeObjeto(normalizeObjeto(crearObjetoApi()));
    const pocion = articuloDeObjeto(normalizeObjeto(crearObjetoGenericoApi()));

    describe('el dinero inicial', () => {
        it('en nivel 1, el oro de su clase con sus dados', () => {
            const regla = reglaDineroInicial({ nivelEfectivo: 1, clases: [{ Id: 9, Nombre: 'Guerrero' }], duplicaOro: false, aumentaOro: false }, catalogos);
            expect(regla).toEqual(jasmine.objectContaining({ modo: 'dados', dados: '6d4', multiplicador: 10, maximo: 240, sugerido: 0 }));
            expect(regla.descripcion).toContain('Guerrero');
        });

        it('la ventaja que duplica el oro dobla la tirada y el tope', () => {
            const regla = reglaDineroInicial({ nivelEfectivo: 1, clases: [{ Id: 9, Nombre: 'Guerrero' }], duplicaOro: true, aumentaOro: false }, catalogos);
            expect(regla.multiplicador).toBe(20);
            expect(regla.maximo).toBe(480);
        });

        it('sin id, busca la clase por su nombre (sin tildes ni mayúsculas)', () => {
            const regla = reglaDineroInicial({ nivelEfectivo: 1, clases: [{ Nombre: 'barbaro' }], duplicaOro: false, aumentaOro: false }, catalogos);
            expect(regla.dados).toBe('4d4');
        });

        it('la ventaja que aumenta el oro, o una clase sin oro, no tienen tope', () => {
            expect(reglaDineroInicial({ nivelEfectivo: 1, clases: [{ Id: 9, Nombre: 'Guerrero' }], duplicaOro: false, aumentaOro: true }, catalogos).maximo).toBeNull();
            expect(reglaDineroInicial({ nivelEfectivo: 1, clases: [{ Id: 77, Nombre: 'Clase rara' }], duplicaOro: false, aumentaOro: false }, catalogos).modo).toBe('libre');
        });

        it('en nivel 2 o más, la riqueza de su nivel; por encima de la tabla, sin tope', () => {
            const regla = reglaDineroInicial({ nivelEfectivo: 3, clases: [], duplicaOro: false, aumentaOro: false }, catalogos);
            expect(regla).toEqual(jasmine.objectContaining({ modo: 'riqueza', maximo: 2700, sugerido: 2700 }));
            expect(reglaDineroInicial({ nivelEfectivo: 25, clases: [], duplicaOro: false, aumentaOro: false }, catalogos).maximo).toBeNull();
        });

        it('tira los dados del oro inicial', () => {
            const regla = reglaDineroInicial({ nivelEfectivo: 1, clases: [{ Id: 9, Nombre: 'Guerrero' }], duplicaOro: false, aumentaOro: false }, catalogos);
            expect(tirarOroInicial(regla, () => 0)).toBe(60);
            expect(tirarOroInicial(regla, () => 0.999)).toBe(240);
        });
    });

    describe('los precios', () => {
        it('el del catálogo por cantidad', () => {
            expect(precioEstimado({ ...nuevaPieza(espada), cantidad: 2 })).toBe(30);
            expect(precioEstimado(nuevaPieza(capa))).toBe(1000);
        });

        it('la munición se compra por piezas, con el precio del lote entre sus piezas', () => {
            const pieza = nuevaPieza(flechas);
            expect(pieza.cantidad).toBe(20);
            expect(precioEstimado(pieza)).toBe(1);
            expect(precioEstimado({ ...pieza, cantidad: 10 })).toBe(0.5);
            expect(pesoEstimado(pieza)).toBe(3);
        });

        it('la gran calidad y la mejora (que la incluye)', () => {
            expect(precioEstimado({ ...nuevaPieza(espada), granCalidad: true })).toBe(315);
            expect(precioEstimado({ ...nuevaPieza(espada), bonificadorMejora: 1 })).toBe(2315);
            expect(precioEstimado({ ...nuevaPieza(cota), bonificadorMejora: 2 })).toBe(150 + 150 + 4000);
            expect(precioEstimado({ ...nuevaPieza(flechas), cantidad: 1, bonificadorMejora: 1 })).toBe(46.05);
        });

        it('un genérico de un conjuro con su fórmula; el nivel 0 cuenta ½', () => {
            const pieza = { ...nuevaPieza(pocion), idConjuro: 1, nombreConjuro: 'Curar heridas leves', nivelConjuro: 1, nivelLanzador: 1 };
            expect(precioEstimado(pieza)).toBe(50);
            expect(precioEstimado({ ...pieza, nivelConjuro: 0 })).toBe(25);
            expect(precioEstimado({ ...pieza, nivelConjuro: 3, nivelLanzador: 5, cantidad: 2 })).toBe(1500);
        });
    });

    it('a un genérico le falta el conjuro hasta elegirlo, y no pasa de su nivel máximo', () => {
        const pieza = nuevaPieza(pocion);
        expect(faltaEnPieza(pieza)).toBe('Elige el conjuro');
        expect(faltaEnPieza({ ...pieza, idConjuro: 1, nivelConjuro: 4 })).toBe('Admite conjuros hasta el nivel 3');
        expect(faltaEnPieza({ ...pieza, idConjuro: 1 })).toBeNull();
        expect(faltaEnPieza(nuevaPieza(espada))).toBeNull();
    });

    it('lo que no tiene precio ni fórmula no se puede comprar', () => {
        expect(sePuedeComprar(capa)).toBeTrue();
        expect(sePuedeComprar(pocion)).toBeTrue();
        expect(sePuedeComprar({ ...capa, precio: null })).toBeFalse();
        expect(sePuedeComprar({ ...espada, id: 0 })).toBeFalse();
    });

    it('el resumen dice lo gastado, lo que queda y si alcanza', () => {
        const regla = reglaDineroInicial({ nivelEfectivo: 1, clases: [{ Id: 9, Nombre: 'Guerrero' }], duplicaOro: false, aumentaOro: false }, catalogos);
        const piezas = [nuevaPieza(espada), nuevaPieza(cota), nuevaPieza(rodela)];
        expect(resumenCompra(200, piezas, regla)).toEqual({ gastado: 180, queda: 20, peso: 49, alcanza: true, dentroDelTope: true });
        expect(resumenCompra(100, piezas, regla).alcanza).toBeFalse();
        expect(resumenCompra(300, piezas, regla).dentroDelTope).toBeFalse();
    });

    it('construye el cuerpo de la compra', () => {
        const compra = construirCompra(150, [
            { ...nuevaPieza(cota) },
            { ...nuevaPieza(espada), granCalidad: true },
            nuevaPieza(flechas),
            { ...nuevaPieza(pocion), idConjuro: 1, nivelConjuro: 1, nivelLanzador: 1, cantidad: 2 },
        ]);
        expect(compra).toEqual({
            dineroInicial: 150,
            piezas: [
                { tipo: 'armadura', id: 8, cantidad: 1, equipado: true },
                { tipo: 'arma', id: 30, cantidad: 1, equipado: true, granCalidad: true },
                { tipo: 'municion', id: 1, cantidad: 20, equipado: false },
                { tipo: 'objeto', id: 1, cantidad: 2, equipado: false, idConjuro: 1, nivelConjuro: 1, nivelLanzador: 1 },
            ],
        });
    });

    describe('los ajustes del 2026-10-25', () => {
        it('cuenta por el NEP: un guerrero de nivel 1 con ajuste +1 (NEP 2) compra con la riqueza de NEP 2', () => {
            const regla = reglaDineroInicial({ nivelEfectivo: 2, clases: [{ Id: 9, Nombre: 'Guerrero' }], duplicaOro: false, aumentaOro: false }, catalogos);
            expect(regla).toEqual(jasmine.objectContaining({ modo: 'riqueza', maximo: 900, sugerido: 900 }));
            expect(regla.descripcion).toContain('NEP 2');
        });

        it('el error de la compra señala la pieza de su `field`', () => {
            expect(indicePiezaDelCampo('piezas[2].cantidad')).toBe(2);
            expect(indicePiezaDelCampo('piezas[0]')).toBe(0);
            expect(indicePiezaDelCampo('piezas')).toBeNull();
            expect(indicePiezaDelCampo(null)).toBeNull();
            expect(indicePiezaDelCampo('dineroInicial')).toBeNull();
        });

        it('un arma mágica específica se compra como objeto, a su precio, y se lleva puesta', () => {
            const espadaSolar = articuloDeObjeto(normalizeObjeto(crearArmaEspecificaApi()));
            const pieza = nuevaPieza(espadaSolar);
            expect(espadaSolar.tipo).toBe('objeto');
            expect(pieza.equipado).toBeTrue();
            expect(precioEstimado(pieza)).toBe(50335);
            expect(construirCompra(60000, [{ ...pieza, granCalidad: true, bonificadorMejora: 2 }]).piezas).toEqual([
                { tipo: 'objeto', id: 120, cantidad: 1, equipado: true },
            ]);
            expect(nuevaPieza(capa).equipado).toBeFalse();
        });
    });

    describe('material, aptitudes y la política de la campaña (2026-10-26)', () => {
        const larga = articuloDeArma(normalizeArma(crearArmaApi({ Id: 30, Nombre: 'Espada larga', Precio: 15, Peso: 4, Manejo: { Id: 3, Nombre: 'A una mano' }, Tipo_dano: { Id: 3, Nombre: 'Cortante' } })));
        const maza = articuloDeArma(normalizeArma(crearArmaApi({ Id: 31, Nombre: 'Maza', Tipo_dano: { Id: 1, Nombre: 'Contundente' } })));

        it('las aplicaciones de material, de la más concreta a la más general, según los datos', () => {
            expect(aplicacionesDeArticulo(larga, catalogos.Aplicaciones_material)).toEqual([3, 1, 10]);
            expect(aplicacionesDeArticulo(flechas, catalogos.Aplicaciones_material)).toEqual([5, 1, 10]);
            expect(aplicacionesDeArticulo(rodela, catalogos.Aplicaciones_material)).toEqual([9, 10]);
            expect(aplicacionesDeArticulo(capa, catalogos.Aplicaciones_material)).toEqual([]);
        });

        it('las aptitudes que piden un tipo de daño', () => {
            const afilada = normalizeEncantamiento(crearEncantamientoApi());
            expect(aptitudSeAplica(afilada, larga)).toBeTrue();
            expect(aptitudSeAplica(afilada, maza)).toBeFalse();
            expect(aptitudSeAplica(afilada, cota)).toBeFalse();
        });

        it('la compra lleva el material y las aptitudes', () => {
            const material = normalizeMaterial(crearMaterialApi({ Id: 7, Nombre: 'Adamantina' }));
            const afilada = normalizeEncantamiento(crearEncantamientoApi());
            const pieza = { ...nuevaPieza(larga), bonificadorMejora: 1, material, costeMaterial: null, aptitudes: [afilada] };
            expect(construirCompra(10000, [pieza]).piezas).toEqual([
                { tipo: 'arma', id: 30, cantidad: 1, equipado: true, bonificadorMejora: 1, idMaterial: 7, encantamientos: [{ id: 1, cabeza: 1 }] },
            ]);
        });

        it('las reglas de la pieza y lo que no deja la campaña', () => {
            const afilada = normalizeEncantamiento(crearEncantamientoApi());
            expect(motivoPiezaNoValida({ ...nuevaPieza(larga), aptitudes: [afilada] })).toContain('al menos un +1');
            expect(motivoPiezaNoValida({ ...nuevaPieza(larga), bonificadorMejora: 1 }, { objetosMagicos: true, aMedida: false, precioMaximo: null }))
                .toBe('Esta campaña no permite objetos a medida.');
            expect(motivoPiezaNoValida(nuevaPieza(capa), { objetosMagicos: false, aMedida: true, precioMaximo: null }))
                .toBe('Esta campaña no permite comprar objetos mágicos.');
            expect(motivoPiezaNoValida({ ...nuevaPieza(flechas), cantidad: 200 }, { objetosMagicos: true, aMedida: true, precioMaximo: 1 })).toBeNull();
        });

        it('la política: sin campaña, todo; con campaña, la suya; y las pestañas que salen', () => {
            expect(politicaTienda(null)).toEqual({ objetosMagicos: true, aMedida: true, precioMaximo: null });
            const estricta = politicaTienda({ permitirObjetosMagicos: false, permitirObjetosAMedida: false, precioMaximoPorObjeto: 500 });
            expect(estricta).toEqual({ objetosMagicos: false, aMedida: false, precioMaximo: 500 });
            expect(pestanasTienda({ politica: estricta }).map((p) => p.id)).not.toContain('especifica');
        });

        it('la carga según su capacidad', () => {
            const capacidad = { Ligera: 76, Media: 153, Pesada: 230 };
            expect(textoCarga(61, capacidad)).toBe('carga ligera, hasta 76 lb');
            expect(textoCarga(100, capacidad)).toBe('carga media, hasta 153 lb');
            expect(textoCarga(300, capacidad)).toContain('pasa de su carga pesada');
            expect(textoCarga(10, null)).toBe('');
        });
    });
});
