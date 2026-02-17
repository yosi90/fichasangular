import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { VentajaService } from 'src/app/services/ventaja.service';
import { ListadoVentajasComponent } from './listado-ventajas.component';

describe('ListadoVentajasComponent', () => {
    let component: ListadoVentajasComponent;
    let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;
    let ventajaSvcMock: jasmine.SpyObj<VentajaService>;
    let manualDetalleNavSvcMock: jasmine.SpyObj<ManualDetalleNavigationService>;

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
        manualDetalleNavSvcMock = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);

        ventajaSvcMock.getVentajas.and.returnValue(of([ventajaBase]));
        ventajaSvcMock.getDesventajas.and.returnValue(of([]));

        component = new ListadoVentajasComponent(cdrMock, ventajaSvcMock, manualDetalleNavSvcMock);
        component.ventajaSort = { active: '', direction: '' } as any;
        component.ventajaPaginator = {} as any;
        component.nombreText = { nativeElement: { value: '' } } as any;
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('emite detalle al abrir desde listado', () => {
        const emitSpy = spyOn(component.ventajaDetalles, 'emit');
        component.verDetallesVentaja({ ...ventajaBase, Tipo: 'Ventaja' } as any);
        expect(emitSpy).toHaveBeenCalled();
    });

    it('abre el manual y evita propagacion del click de fila', () => {
        const event = jasmine.createSpyObj<MouseEvent>('MouseEvent', ['preventDefault', 'stopPropagation']);
        component.abrirDetalleManual({ ...ventajaBase, Tipo: 'Ventaja' } as any, event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(manualDetalleNavSvcMock.abrirDetalleManual).toHaveBeenCalledWith({ id: 1, nombre: 'Manual base' });
    });
});
