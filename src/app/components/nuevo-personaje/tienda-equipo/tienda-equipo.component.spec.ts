import { fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { EquipoService } from 'src/app/services/equipo.service';
import { normalizeArma } from 'src/app/services/arma.service';
import { normalizeArmadura } from 'src/app/services/armadura.service';
import { normalizeEncantamiento, normalizeEquipoCatalogos, normalizeMaterial, normalizeMunicion, normalizeObjeto } from 'src/app/services/utils/equipo-mapper';
import { articuloDeArma, articuloDeArmadura, articuloDeMunicion, reglaDineroInicial } from 'src/app/services/utils/tienda-equipo';
import { LibroTienda, precioCopiaLibro } from 'src/app/services/utils/libro-conjuros';
import { Conjuro } from 'src/app/interfaces/conjuro';
import {
    crearArmaApi,
    crearArmaduraApi,
    crearEncantamientoApi,
    crearEquipoCatalogosApi,
    crearMaterialApi,
    crearMunicionApi,
    crearObjetoApi,
    crearObjetoGenericoApi,
} from 'src/testing/equipo-api';
import { TiendaEquipoComponent } from './tienda-equipo.component';

describe('TiendaEquipoComponent', () => {
    let equipoSvc: jasmine.SpyObj<EquipoService>;
    let component: TiendaEquipoComponent;
    const catalogos = normalizeEquipoCatalogos(crearEquipoCatalogosApi());
    const espada = articuloDeArma(normalizeArma(crearArmaApi({ Id: 30, Nombre: 'Espada larga', Precio: 15, Peso: 4, Manejo: { Id: 3, Nombre: 'A una mano' }, Tipo_dano: { Id: 3, Nombre: 'Cortante' } })));
    const cota = articuloDeArmadura(normalizeArmadura(crearArmaduraApi()));
    const flechas = articuloDeMunicion(normalizeMunicion(crearMunicionApi()));
    const adamantina = normalizeMaterial(crearMaterialApi({
        Id: 7, Nombre: 'Adamantina', Costes: [{ Aplicacion: { Id: 1, Nombre: 'Arma' }, Coste: 3000, Coste_por_libra: null, Multiplicador_precio: null, Coste_encantar: null }],
    }));

    function abrir(nivel = 1): void {
        component.regla = reglaDineroInicial({ nivelEfectivo: nivel, clases: [{ Id: 9, Nombre: 'Guerrero' }], duplicaOro: false, aumentaOro: false }, catalogos);
        component.articulos = [espada, cota, flechas];
        component.conjuros = [{ Id: 1, Nombre: 'Curar heridas leves' }, { Id: 2, Nombre: 'Curar heridas moderadas' }];
        component.ngOnChanges({ regla: new SimpleChange(null, component.regla, true) });
        component.ngOnInit();
    }

    beforeEach(() => {
        equipoSvc = jasmine.createSpyObj<EquipoService>('EquipoService', ['getObjetos', 'getMateriales', 'getEncantamientos', 'getCatalogos']);
        equipoSvc.getObjetos.and.returnValue(of({
            items: [normalizeObjeto(crearObjetoGenericoApi()), normalizeObjeto(crearObjetoApi({ Precio: null }))],
            total: 2,
            hayMas: false,
        }));
        equipoSvc.getMateriales.and.returnValue(of([adamantina]));
        equipoSvc.getEncantamientos.and.returnValue(of([normalizeEncantamiento(crearEncantamientoApi())]));
        equipoSvc.getCatalogos.and.returnValue(of(catalogos));
        component = new TiendaEquipoComponent(equipoSvc);
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

    it('ofrece lo de cada pestaña y busca sin tildes', () => {
        abrir();
        expect(component.opciones.map((a) => a.nombre)).toEqual(['Espada larga']);
        component.cambiarSeccion('armadura');
        expect(component.opciones.map((a) => a.nombre)).toEqual(['Cota de mallas']);
        component.buscar('MALLAS');
        expect(component.opciones.length).toBe(1);
        component.buscar('placas');
        expect(component.opciones.length).toBe(0);
    });

    it('los objetos se buscan en la API, sin las específicas, y no ofrece los que no tienen precio', fakeAsync(() => {
        abrir();
        component.cambiarSeccion('objeto');
        expect(component.opciones.map((a) => a.nombre)).toEqual(['Poción']);
        expect(equipoSvc.getObjetos).toHaveBeenCalledWith({ q: null, limit: 100, offset: 0, especificas: false });
        component.buscar('poción');
        tick(300);
        expect(equipoSvc.getObjetos).toHaveBeenCalledWith({ q: 'poción', limit: 100, offset: 0, especificas: false });
        component.cambiarSeccion('especifica');
        expect(equipoSvc.getObjetos).toHaveBeenCalledWith({ q: null, limit: 100, offset: 0, especificas: true });
    }));

    it('las pestañas son una lista con condición: sin objetos mágicos no salen las específicas', () => {
        abrir();
        expect(component.pestanas.map((p) => p.id)).toEqual(['arma', 'armadura', 'municion', 'objeto', 'especifica']);
        component.cambiarSeccion('especifica');
        component.politica = { objetosMagicos: false, aMedida: true, precioMaximo: null, copiarConjuros: true };
        component.ngOnChanges({ politica: new SimpleChange(null, component.politica, false) });
        expect(component.pestanas.map((p) => p.id)).toEqual(['arma', 'armadura', 'municion', 'objeto']);
        expect(component.seccion).toBe('arma');
        component.cambiarSeccion('objeto');
        expect(equipoSvc.getObjetos).toHaveBeenCalledWith({ q: null, limit: 100, offset: 0, especificas: false, categoria: 'mundano' });
        // Lo mágico que pudiera llegar tampoco se ofrece.
        expect(component.opciones.length).toBe(0);
        expect(component.notaPie).toContain('Esta campaña no permite objetos mágicos.');
    });

    it('la franja trae el dinero, lo gastado, lo que queda y el peso con su carga', () => {
        abrir(3);
        component.capacidadCarga = { Ligera: 76, Media: 153, Pesada: 230 };
        component.anadir(espada);
        const franja = component.franja;
        expect(franja.map((d) => d.etiqueta)).toEqual(['Dinero inicial', 'Gastado', 'Te queda', 'Peso']);
        expect(franja[0].detalle).toBe('riqueza de su NEP');
        expect(franja[3].detalle).toContain('carga ligera');
    });

    describe('conjuros para el libro', () => {
        const conjuro = (Id: number, Nombre: string, Escuela: string, Oficial = true) =>
            ({ Id, Nombre, Escuela: { Id: 0, Nombre: Escuela, Nombre_especial: '', Prohibible: true }, Oficial } as Conjuro);
        const escudo = conjuro(51, 'Escudo', 'Abjuración');
        const bola = conjuro(50, 'Bola de fuego', 'Evocación');
        const libro: LibroTienda = {
            idClase: 9,
            clase: 'Mago',
            paginasUsadas: 47,
            conjuros: [
                { conjuro: escudo, nivel: 1, precio: precioCopiaLibro(1, 1) },
                { conjuro: bola, nivel: 3, precio: precioCopiaLibro(3, 5) },
            ],
        };

        function conLibro(politica = { objetosMagicos: true, aMedida: true, precioMaximo: null, copiarConjuros: true }): void {
            abrir(3);
            component.libros = [libro];
            component.politica = politica;
            component.ngOnChanges({ libros: new SimpleChange([], component.libros, false), politica: new SimpleChange(null, politica, false) });
        }

        it('la pestaña sale si alguna clase tiene libro y la campaña lo deja', () => {
            abrir();
            expect(component.pestanas.map((p) => p.id)).not.toContain('libro');
            conLibro();
            expect(component.pestanas.map((p) => p.id)).toContain('libro');
            conLibro({ objetosMagicos: true, aMedida: true, precioMaximo: null, copiarConjuros: false });
            expect(component.pestanas.map((p) => p.id)).not.toContain('libro');
            expect(component.franja.map((d) => d.etiqueta)).not.toContain('Páginas del libro');
        });

        it('ofrece lo que se puede copiar, filtra por nivel y busca', () => {
            conLibro();
            component.cambiarSeccion('libro');
            expect(component.filasLibro.map((f) => f.item.conjuro.Nombre)).toEqual(['Escudo', 'Bola de fuego']);
            expect(component.nivelesLibro).toEqual([1, 3]);
            component.filtrarNivelLibro(3);
            expect(component.filasLibro.map((f) => f.item.conjuro.Nombre)).toEqual(['Bola de fuego']);
            component.filtrarNivelLibro(null);
            component.buscar('ABJURACION');
            expect(component.filasLibro.map((f) => f.item.conjuro.Nombre)).toEqual(['Escudo']);
            expect(component.notaPie).toContain('Solo salen los conjuros que puedes lanzar');
        });

        it('copia, cuenta las páginas, cobra y manda conjurosLibro', () => {
            conLibro();
            component.cambiarSeccion('libro');
            const confirmar = spyOn(component.confirmar, 'emit');
            const [filaEscudo, filaBola] = component.filasLibro;
            component.alternarCopia(filaBola);
            expect(component.estaCopiado(libro, filaBola.item)).toBeTrue();
            // Una bola de fuego para una maga de nivel 5: 375 de pergamino + 300 de escribirla.
            expect(component.resumen.gastado).toBe(675);
            const paginas = component.franja.find((d) => d.etiqueta === 'Páginas del libro');
            expect(paginas).toEqual(jasmine.objectContaining({ valor: 50, detalle: 'de 100' }));
            expect(component.cuantasCompras).toBe(1);
            component.alternarCopia(filaEscudo);
            component.alternarCopia(filaEscudo);
            expect(component.copias.length).toBe(1);
            component.onConfirmar();
            expect(confirmar).toHaveBeenCalledWith({ dineroInicial: 2700, conjurosLibro: [{ idConjuro: 50, idClase: 9 }], piezas: [] });
            component.quitarCopia(0);
            expect(component.resumen.gastado).toBe(0);
        });

        it('señala el conjuro del error de la API y un conjuro homebrew avisa', () => {
            conLibro();
            component.alternarCopia({ libro, item: { conjuro: conjuro(53, 'Casero', 'Evocación', false), nivel: 1, precio: precioCopiaLibro(1, 1) } });
            expect(component.hayHomebrew).toBeTrue();
            component.copiaConError = 0;
            component.ngOnChanges({ copiaConError: new SimpleChange(null, 0, false) });
            expect(component.copiaSenalada).toBe(0);
            component.quitarCopia(0);
            expect(component.copiaSenalada).toBeNull();
        });
    });

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

    it('un genérico abre su configuración para elegir el conjuro antes de añadirlo', () => {
        abrir();
        component.cambiarDinero(200);
        component.cambiarSeccion('objeto');
        component.anadir(component.opciones[0]);
        expect(component.piezas.length).toBe(0);
        expect(component.configurando?.indice).toBeNull();
        component.guardarConfiguracion({ ...component.configurando!.pieza, idConjuro: 1, nombreConjuro: 'Curar heridas leves' });
        expect(component.piezas[0].idConjuro).toBe(1);
        expect(component.configurando).toBeNull();
        expect(component.motivoNoComprar).toBeNull();
    });

    it('configurar una pieza del carro solo ofrece lo que se le aplica y cuenta lo que ya costaba', () => {
        abrir(3);
        component.anadir(espada);
        component.editarPieza(0);
        const configurando = component.configurando!;
        expect(configurando.materiales.map((m) => m.material.Nombre)).toEqual(['Adamantina']);
        expect(configurando.aptitudes.map((a) => a.Nombre)).toEqual(['Afilada']);
        expect(configurando.disponible).toBe(2700);
        component.guardarConfiguracion({ ...configurando.pieza, bonificadorMejora: 1 });
        expect(component.piezas.length).toBe(1);
        expect(component.piezas[0].bonificadorMejora).toBe(1);
        // A una cota de mallas (armadura intermedia) no se le aplica la adamantina de armas ni afilada.
        component.anadir(cota);
        component.editarPieza(1);
        expect(component.configurando!.materiales).toEqual([]);
        expect(component.configurando!.aptitudes).toEqual([]);
    });

    it('sin objetos a medida no se configura y una pieza a medida se marca', () => {
        abrir(3);
        component.politica = { objetosMagicos: true, aMedida: false, precioMaximo: null, copiarConjuros: true };
        component.anadir(espada);
        component.cambiarPieza(0, { bonificadorMejora: 1 });
        expect(component.motivosPiezas[0]).toBe('Esta campaña no permite objetos a medida.');
        expect(component.motivoNoComprar).toBe('Completa las piezas marcadas.');
    });

    it('el precio máximo por pieza de la campaña', () => {
        abrir(3);
        component.politica = { objetosMagicos: true, aMedida: true, precioMaximo: 1000, copiarConjuros: true };
        component.anadir(espada);
        expect(component.motivoNoComprar).toBeNull();
        component.cambiarPieza(0, { bonificadorMejora: 1 });
        expect(component.motivosPiezas[0]).toContain('más de 1000 po');
    });

    it('emite la compra con material y aptitudes, y «terminar sin comprar»', () => {
        abrir(25); // por encima de la tabla de riqueza: sin tope
        component.cambiarDinero(10000);
        const confirmar = spyOn(component.confirmar, 'emit');
        const omitir = spyOn(component.omitir, 'emit');
        component.anadir(espada);
        component.cambiarPieza(0, { bonificadorMejora: 1, material: adamantina, costeMaterial: adamantina.Costes[0] });
        component.onConfirmar();
        expect(confirmar).toHaveBeenCalledWith({
            dineroInicial: 10000,
            piezas: [{ tipo: 'arma', id: 30, cantidad: 1, equipado: true, bonificadorMejora: 1, idMaterial: 7 }],
        });
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
        expect(component.notaPie).toBe('Esta campaña no deja comprar homebrew.');
        component.cambiarPieza(0, { cantidad: 2 });
        expect(component.piezaSenalada).toBeNull();
    });
});
