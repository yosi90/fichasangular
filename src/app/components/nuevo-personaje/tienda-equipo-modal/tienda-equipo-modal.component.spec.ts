import { fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { EquipoService } from 'src/app/services/equipo.service';
import { normalizeArma } from 'src/app/services/arma.service';
import { normalizeArmadura } from 'src/app/services/armadura.service';
import { normalizeEquipoCatalogos, normalizeMunicion, normalizeObjeto } from 'src/app/services/utils/equipo-mapper';
import { articuloDeArma, articuloDeArmadura, articuloDeMunicion, reglaDineroInicial } from 'src/app/services/utils/tienda-equipo';
import {
    crearArmaApi,
    crearArmaduraApi,
    crearEquipoCatalogosApi,
    crearMunicionApi,
    crearObjetoApi,
    crearObjetoGenericoApi,
} from 'src/testing/equipo-api';
import { TiendaEquipoModalComponent } from './tienda-equipo-modal.component';

describe('TiendaEquipoModalComponent', () => {
    let equipoSvc: jasmine.SpyObj<EquipoService>;
    let component: TiendaEquipoModalComponent;
    const catalogos = normalizeEquipoCatalogos(crearEquipoCatalogosApi());
    const espada = articuloDeArma(normalizeArma(crearArmaApi({ Id: 30, Nombre: 'Espada larga', Precio: 15 })));
    const cota = articuloDeArmadura(normalizeArmadura(crearArmaduraApi()));
    const flechas = articuloDeMunicion(normalizeMunicion(crearMunicionApi()));

    function abrir(nivel = 1): void {
        component.regla = reglaDineroInicial({ nivelEfectivo: nivel, clases: [{ Id: 9, Nombre: 'Guerrero' }], duplicaOro: false, aumentaOro: false }, catalogos);
        component.articulos = [espada, cota, flechas];
        component.conjuros = [{ Id: 1, Nombre: 'Curar heridas leves' }, { Id: 2, Nombre: 'Curar heridas moderadas' }];
        component.ngOnChanges({ regla: new SimpleChange(null, component.regla, true) });
        component.ngOnInit();
    }

    beforeEach(() => {
        equipoSvc = jasmine.createSpyObj<EquipoService>('EquipoService', ['getObjetos']);
        equipoSvc.getObjetos.and.returnValue(of({
            items: [normalizeObjeto(crearObjetoGenericoApi()), normalizeObjeto(crearObjetoApi({ Precio: null }))],
            total: 2,
            hayMas: false,
        }));
        component = new TiendaEquipoModalComponent(equipoSvc);
    });

    afterEach(() => component.ngOnDestroy());

    it('en nivel 1 empieza sin dinero hasta tirar los dados de su clase', () => {
        abrir();
        expect(component.dineroInicial).toBe(0);
        expect(component.puedeTirar).toBeTrue();
        spyOn(Math, 'random').and.returnValue(0.999);
        component.tirarDados();
        expect(component.dineroInicial).toBe(240);
    });

    it('en nivel 2 o más empieza con la riqueza de su nivel', () => {
        abrir(3);
        expect(component.dineroInicial).toBe(2700);
        expect(component.puedeTirar).toBeFalse();
    });

    it('ofrece lo de cada sección y busca sin tildes', () => {
        abrir();
        expect(component.opciones.map((a) => a.nombre)).toEqual(['Espada larga']);
        component.cambiarSeccion('armadura');
        expect(component.opciones.map((a) => a.nombre)).toEqual(['Cota de mallas']);
        component.buscar('MALLAS');
        expect(component.opciones.length).toBe(1);
        component.buscar('placas');
        expect(component.opciones.length).toBe(0);
    });

    it('los objetos se buscan en la API y no ofrece los que no tienen precio', fakeAsync(() => {
        abrir();
        component.cambiarSeccion('objeto');
        expect(component.opciones.map((a) => a.nombre)).toEqual(['Poción']);
        component.buscar('poción');
        tick(300);
        expect(equipoSvc.getObjetos).toHaveBeenCalledWith({ q: 'poción', limit: 100, offset: 0 });
    }));

    it('lleva la cuenta de lo gastado y no deja comprar si no llega', () => {
        abrir();
        component.cambiarDinero(100);
        component.anadir(espada);
        component.anadir(flechas);
        expect(component.resumen).toEqual(jasmine.objectContaining({ gastado: 16, queda: 84, alcanza: true }));
        expect(component.motivoNoComprar).toBeNull();
        component.anadir(cota);
        expect(component.motivoNoComprar).toBe('No te llega el dinero para todo.');
        component.quitar(2);
        component.cambiarPieza(0, { bonificadorMejora: 1 });
        expect(component.motivoNoComprar).toBe('No te llega el dinero para todo.');
    });

    it('no deja pasar del tope del dinero inicial', () => {
        abrir();
        component.cambiarDinero(500);
        expect(component.motivoNoComprar).toContain('no puede pasar de');
    });

    it('un genérico pide su conjuro antes de comprar', () => {
        abrir();
        component.cambiarDinero(200);
        component.cambiarSeccion('objeto');
        component.anadir(component.opciones[0]);
        expect(component.motivoNoComprar).toBe('Completa las piezas marcadas.');
        expect(component.conjurosPara('cu').length).toBe(2);
        component.elegirConjuro(0, 'Curar heridas leves');
        expect(component.piezas[0].idConjuro).toBe(1);
        expect(component.motivoNoComprar).toBeNull();
        component.escribirConjuro(0, 'curar heridas');
        expect(component.piezas[0].idConjuro).toBeNull();
    });

    it('emite la compra y «terminar sin comprar»', () => {
        abrir();
        const confirmar = spyOn(component.confirmar, 'emit');
        const omitir = spyOn(component.omitir, 'emit');
        component.cambiarDinero(60);
        component.anadir(espada);
        component.onConfirmar();
        expect(confirmar).toHaveBeenCalledWith({ dineroInicial: 60, piezas: [{ tipo: 'arma', id: 30, cantidad: 1, equipado: true }] });
        component.onOmitir();
        expect(omitir).toHaveBeenCalled();
    });

    it('mientras guarda no emite nada', () => {
        abrir();
        component.guardando = true;
        const confirmar = spyOn(component.confirmar, 'emit');
        const omitir = spyOn(component.omitir, 'emit');
        component.onConfirmar();
        component.onOmitir();
        expect(confirmar).not.toHaveBeenCalled();
        expect(omitir).not.toHaveBeenCalled();
    });

    it('en una campaña sin homebrew solo ofrece lo oficial', () => {
        abrir();
        component.articulos = [espada, { ...espada, id: 99, nombre: 'Hacha casera', oficial: false }];
        expect(component.opciones.length).toBe(2);
        component.soloOficial = true;
        expect(component.opciones.map((a) => a.nombre)).toEqual(['Espada larga']);
    });

    it('señala la pieza del error de la API hasta que cambia la compra', () => {
        abrir();
        component.anadir(espada);
        component.anadir(cota);
        component.error = 'Esta campaña no deja comprar homebrew.';
        component.piezaConError = 1;
        component.ngOnChanges({ piezaConError: new SimpleChange(null, 1, false) });
        expect(component.piezaSenalada).toBe(1);
        component.cambiarPieza(0, { cantidad: 2 });
        expect(component.piezaSenalada).toBeNull();
    });
});
