import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { EquipoService } from 'src/app/services/equipo.service';
import { normalizeEquipoCatalogos, normalizeObjeto } from 'src/app/services/utils/equipo-mapper';
import { crearEquipoCatalogosApi, crearObjetoApi, crearObjetoGenericoApi } from 'src/testing/equipo-api';
import { textoPrecio } from 'src/app/services/utils/equipo-texto';
import { ListadoObjetosComponent } from './listado-objetos.component';

describe('ListadoObjetosComponent', () => {
    let equipoSvc: jasmine.SpyObj<EquipoService>;
    let component: ListadoObjetosComponent;
    const capa = normalizeObjeto(crearObjetoApi());
    const pocion = normalizeObjeto(crearObjetoGenericoApi());

    beforeEach(() => {
        equipoSvc = jasmine.createSpyObj<EquipoService>('EquipoService', ['getObjetos', 'getCatalogos']);
        equipoSvc.getObjetos.and.returnValue(of({ items: [capa, pocion], total: 30, hayMas: true }));
        equipoSvc.getCatalogos.and.returnValue(of(normalizeEquipoCatalogos(crearEquipoCatalogosApi())));
        const manualSvc = { getManuales: () => of([]) } as any;
        component = new ListadoObjetosComponent({ detectChanges: () => undefined } as any, equipoSvc, manualSvc, { abrirDetalleManual: jasmine.createSpy() } as any);
    });

    afterEach(() => component.ngOnDestroy());

    it('pide la primera página al empezar y lee el total', () => {
        component.ngOnInit();
        expect(equipoSvc.getObjetos).toHaveBeenCalledWith({ q: null, categoria: null, tipo: null, ranura: null, manual: null, limit: 25, offset: 0 });
        expect(component.objetos.length).toBe(2);
        expect(component.total).toBe(30);
        expect(component.cargando).toBeFalse();
        expect(component.tipos.length).toBeGreaterThan(0);
    });

    it('al escribir espera un poco y vuelve a la primera página', fakeAsync(() => {
        component.ngOnInit();
        component.alCambiarPagina({ pageIndex: 2, pageSize: 25, length: 30 });
        expect(equipoSvc.getObjetos.calls.mostRecent().args[0]?.offset).toBe(50);
        component.buscar('capa');
        component.buscar('capa de');
        expect(equipoSvc.getObjetos).toHaveBeenCalledTimes(2);
        tick(300);
        expect(equipoSvc.getObjetos).toHaveBeenCalledTimes(3);
        expect(equipoSvc.getObjetos.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ q: 'capa de', offset: 0 }));
    }));

    it('la categoría limita los tipos y quita un tipo que ya no encaja', () => {
        component.ngOnInit();
        component.idTipo = 1;
        component.categoria = 'magico';
        component.alCambiarFiltro();
        expect(component.tiposVisibles.every((tipo) => tipo.Categoria === 'magico')).toBeTrue();
        expect(component.idTipo).toBeNull();
        expect(equipoSvc.getObjetos.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ categoria: 'magico', tipo: null }));
    });

    it('filtra por manual con su id', () => {
        component.ngOnInit();
        component.manual = 24;
        component.alCambiarFiltro();
        expect(equipoSvc.getObjetos.calls.mostRecent().args[0]?.manual).toBe(24);
    });

    it('enseña la fórmula del precio de un genérico de un conjuro', () => {
        expect(component.precioVisible(pocion)).toBe('50 po × nivel × NL');
        expect(component.precioVisible(capa)).toBe(textoPrecio(1000));
    });

    it('si falla la API enseña el error y una lista vacía', () => {
        equipoSvc.getObjetos.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { error: 'Algo falló' } })));
        component.ngOnInit();
        expect(component.objetos).toEqual([]);
        expect(component.error).toContain('Algo falló');
    });

    it('el texto que llega antes de empezar («Ver los N») va en la primera petición', () => {
        component.textoBusqueda = 'capa';
        component.ngOnInit();
        expect(equipoSvc.getObjetos).toHaveBeenCalledWith(jasmine.objectContaining({ q: 'capa', offset: 0 }));
    });

    it('«Limpiar filtros» vuelve todo a como se abre el listado y pide la primera página', () => {
        component.ngOnInit();
        expect(component.hayFiltros).toBeFalse();
        component.categoria = 'magico';
        component.idRanura = 3;
        component.manual = 24;
        component.alCambiarFiltro();
        component.alCambiarPagina({ pageIndex: 1, pageSize: 25, length: 30 });
        expect(component.hayFiltros).toBeTrue();

        component.limpiarFiltros();

        expect(component.hayFiltros).toBeFalse();
        expect(equipoSvc.getObjetos.calls.mostRecent().args[0]).toEqual({ q: null, categoria: null, tipo: null, ranura: null, manual: null, limit: 25, offset: 0 });
    });

    it('«Reintentar» vuelve a pedir la misma página tras un error', () => {
        equipoSvc.getObjetos.and.returnValues(throwError(() => new HttpErrorResponse({ status: 500 })), of({ items: [capa], total: 1, hayMas: false }));
        component.ngOnInit();
        expect(component.error).not.toBe('');

        component.reintentar();

        expect(component.error).toBe('');
        expect(component.objetos).toEqual([capa]);
        expect(component.cargado).toBeTrue();
    });

    it('emite el objeto con su tipo', () => {
        const emit = spyOn(component.entradaDetalles, 'emit');
        component.verDetalles(capa);
        expect(emit).toHaveBeenCalledWith({ tipo: 'objeto', item: capa });
    });
});
