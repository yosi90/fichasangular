import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ListadoArmasComponent } from './listado-armas.component';
import { normalizeArma } from 'src/app/services/arma.service';
import { crearArmaApi } from 'src/testing/equipo-api';

describe('ListadoArmasComponent', () => {
    let component: ListadoArmasComponent;
    let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;
    let manualDetalleNavSvcMock: jasmine.SpyObj<ManualDetalleNavigationService>;
    let armaSvcMock: any;

    beforeEach(() => {
        cdrMock = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
        manualDetalleNavSvcMock = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        armaSvcMock = { getArmas: jasmine.createSpy('getArmas').and.returnValue(of([])) };

        component = new ListadoArmasComponent(
            cdrMock,
            armaSvcMock,
            manualDetalleNavSvcMock
        );
        component.armaSort = { active: '', direction: '', sortChange: of({}), initialized: of({}) } as any;
        component.armaPaginator = { page: of({}), initialized: of({}) } as any;
        component.nombreText = { nativeElement: { value: '' } } as any;
        component.armas = [normalizeArma(crearArmaApi({ Id: 1, Nombre: 'Espada larga', Manual: { Id: 1, Nombre: 'Manual base', Pagina: 5 } }))];
    });

    it('emite detalle al abrir desde listado', () => {
        const emitSpy = spyOn(component.armaDetalles, 'emit');
        component.verDetallesArma(1);
        expect(emitSpy).toHaveBeenCalled();
    });

    it('abre el manual y evita propagación del click de fila', () => {
        const event = jasmine.createSpyObj<MouseEvent>('MouseEvent', ['preventDefault', 'stopPropagation']);
        component.abrirDetalleManual(component.armas[0], event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(manualDetalleNavSvcMock.abrirDetalleManual).toHaveBeenCalledWith({ id: 1, nombre: 'Manual base' });
    });
});
