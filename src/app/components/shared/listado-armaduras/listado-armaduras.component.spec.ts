import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ListadoArmadurasComponent } from './listado-armaduras.component';

describe('ListadoArmadurasComponent', () => {
    let component: ListadoArmadurasComponent;
    let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;
    let manualDetalleNavSvcMock: jasmine.SpyObj<ManualDetalleNavigationService>;
    let armaduraSvcMock: any;
    let manualSvcMock: any;

    beforeEach(() => {
        cdrMock = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
        manualDetalleNavSvcMock = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        armaduraSvcMock = { getArmaduras: jasmine.createSpy('getArmaduras').and.returnValue(of([])) };
        manualSvcMock = { getManuales: jasmine.createSpy('getManuales').and.returnValue(of([])) };

        component = new ListadoArmadurasComponent(
            cdrMock,
            armaduraSvcMock,
            manualSvcMock,
            manualDetalleNavSvcMock
        );
        component.armaduraSort = { active: '', direction: '', sortChange: of({}), initialized: of({}) } as any;
        component.armaduraPaginator = { page: of({}), initialized: of({}) } as any;
        component.nombreText = { nativeElement: { value: '' } } as any;
        component.armaduras = [{
            Id: 1,
            Nombre: 'Escudo pesado',
            Descripcion: 'Escudo robusto',
            Manual: { Id: 1, Nombre: 'Manual base', Pagina: 10 },
            Ca: 2,
            Bon_des: 0,
            Penalizador: -2,
            Tipo_armadura: { Id: 1, Nombre: 'Escudo' },
            Precio: 20,
            Material: { Id: 1, Nombre: 'Acero' },
            Peso_armadura: { Id: 1, Nombre: 'Ligera' },
            Peso: 15,
            Tamano: { Id: 1, Nombre: 'Mediano' },
            Fallo_arcano: 5,
            Es_escudo: true,
            Oficial: true,
            Encantamientos: [],
        }];
    });

    it('emite detalle al abrir desde listado', () => {
        const emitSpy = spyOn(component.armaduraDetalles, 'emit');
        component.verDetallesArmadura(1);
        expect(emitSpy).toHaveBeenCalled();
    });

    it('filtra solo escudos cuando el toggle está activo', () => {
        component.soloEscudos = true;
        component.filtroArmaduras();
        expect(component.armadurasDS.data.length).toBe(1);
    });

    it('abre el manual y evita propagación del click de fila', () => {
        const event = jasmine.createSpyObj<MouseEvent>('MouseEvent', ['preventDefault', 'stopPropagation']);
        component.abrirDetalleManual(component.armaduras[0], event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(manualDetalleNavSvcMock.abrirDetalleManual).toHaveBeenCalledWith({ id: 1, nombre: 'Manual base' });
    });
});
