import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { VentajaService } from 'src/app/services/ventaja.service';
import { ListadoVentajasComponent } from './listado-ventajas.component';

describe('ListadoVentajasComponent', () => {
    let component: ListadoVentajasComponent;
    let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;
    let ventajaSvcMock: jasmine.SpyObj<VentajaService>;

    const ventajaBase: VentajaDetalle = {
        Id: 1,
        Nombre: 'Bendecido',
        Descripcion: 'Descripcion',
        Disipable: false,
        Coste: -1,
        Mejora: 1,
        Caracteristica: false,
        Fuerza: false,
        Destreza: false,
        Constitucion: false,
        Inteligencia: false,
        Sabiduria: false,
        Carisma: false,
        Fortaleza: false,
        Reflejos: false,
        Voluntad: false,
        Iniciativa: false,
        Duplica_oro: false,
        Aumenta_oro: false,
        Idioma_extra: false,
        Manual: { Id: 1, Nombre: 'Manual base', Pagina: 10 },
        Rasgo: { Id: 0, Nombre: '', Descripcion: '' },
        Idioma: { Id: 0, Nombre: '', Descripcion: '' },
        Habilidad: { Id: 0, Nombre: '', Descripcion: '' },
        Oficial: true,
    };

    beforeEach(() => {
        cdrMock = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
        ventajaSvcMock = jasmine.createSpyObj<VentajaService>('VentajaService', ['getVentajas', 'getDesventajas']);

        ventajaSvcMock.getVentajas.and.returnValue(of([ventajaBase]));
        ventajaSvcMock.getDesventajas.and.returnValue(of([]));

        component = new ListadoVentajasComponent(cdrMock, ventajaSvcMock);
        component.ventajaSort = { active: '', direction: '', sortChange: of({}), initialized: of({}) } as any;
        component.ventajaPaginator = { page: of({}), initialized: of({}) } as any;
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('emite detalle al abrir desde listado', () => {
        const emitSpy = spyOn(component.ventajaDetalles, 'emit');
        component.verDetallesVentaja({ ...ventajaBase, Tipo: 'Ventaja' } as any);
        expect(emitSpy).toHaveBeenCalled();
    });

    it('carga ventajas y desventajas, y el buscador rápido filtra por nombre', () => {
        ventajaSvcMock.getDesventajas.and.returnValue(of([{ ...ventajaBase, Id: 2, Nombre: 'Cojo', Coste: 2 }]));
        component.cargar();
        expect(component.cargado).toBeTrue();
        expect(component.ventajas.map((v) => v.Tipo)).toEqual(['Ventaja', 'Desventaja']);
        expect(component.tipoDe(component.ventajas[1])).toBe('desventaja');

        component.buscar('cojo');
        expect(component.ventajasDS.data.map((v) => v.Nombre)).toEqual(['Cojo']);
        expect(component.hayFiltros).toBeTrue();
    });

    it('«Limpiar filtros» vacía el texto y vuelve el manual a «Cualquiera»', () => {
        component.textoBusqueda = 'bendecido';
        component.defaultManual = 'Manual base';
        expect(component.hayFiltros).toBeTrue();

        component.limpiarFiltros();

        expect(component.textoBusqueda).toBe('');
        expect(component.defaultManual).toBe('Cualquiera');
        expect(component.hayFiltros).toBeFalse();
    });
});
