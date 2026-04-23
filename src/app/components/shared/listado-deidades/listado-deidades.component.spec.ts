import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ListadoDeidadesComponent } from './listado-deidades.component';

describe('ListadoDeidadesComponent', () => {
    let component: ListadoDeidadesComponent;
    let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;
    let manualDetalleNavSvcMock: jasmine.SpyObj<ManualDetalleNavigationService>;
    let deidadSvcMock: any;

    beforeEach(() => {
        cdrMock = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
        manualDetalleNavSvcMock = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        deidadSvcMock = { getDeidades: jasmine.createSpy('getDeidades').and.returnValue(of([])) };

        component = new ListadoDeidadesComponent(
            cdrMock,
            deidadSvcMock,
            manualDetalleNavSvcMock
        );
        component.deidadSort = { active: '', direction: '', sortChange: of({}), initialized: of({}) } as any;
        component.deidadPaginator = { page: of({}), initialized: of({}) } as any;
        component.nombreText = { nativeElement: { value: '' } } as any;
        component.deidades = [{
            Id: 1,
            Nombre: 'Heironeous',
            Descripcion: 'Deidad del valor.',
            Manual: { Id: 2, Nombre: 'Manual base', Pagina: 106 },
            Alineamiento: { Id: 3, Id_basico: 3, Nombre: 'Legal bueno' },
            Arma: { Id: 4, Nombre: 'Espada larga' },
            Pabellon: { Id: 5, Nombre: 'Bien' },
            Genero: { Id: 6, Nombre: 'Masculino' },
            Ambitos: [],
            Dominios: [],
            Oficial: true,
        }];
    });

    it('emite detalle al abrir desde listado', () => {
        const emitSpy = spyOn(component.deidadDetalles, 'emit');
        component.verDetallesDeidad(1);
        expect(emitSpy).toHaveBeenCalled();
    });

    it('filtra por alineamiento', () => {
        component.defaultAlineamiento = 'Legal bueno';
        component.filtroDeidades();
        expect(component.deidadesDS.data.length).toBe(1);
    });

    it('abre el manual y evita propagación del click de fila', () => {
        const event = jasmine.createSpyObj<MouseEvent>('MouseEvent', ['preventDefault', 'stopPropagation']);
        component.abrirDetalleManual(component.deidades[0], event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(manualDetalleNavSvcMock.abrirDetalleManual).toHaveBeenCalledWith({ id: 2, nombre: 'Manual base' });
    });
});
