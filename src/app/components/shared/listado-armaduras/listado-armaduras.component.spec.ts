import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ListadoArmadurasComponent } from './listado-armaduras.component';
import { normalizeArmadura } from 'src/app/services/armadura.service';
import { crearArmaduraApi, crearRodelaApi } from 'src/testing/equipo-api';

describe('ListadoArmadurasComponent', () => {
    let component: ListadoArmadurasComponent;
    let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;
    let manualDetalleNavSvcMock: jasmine.SpyObj<ManualDetalleNavigationService>;
    let armaduraSvcMock: any;

    beforeEach(() => {
        cdrMock = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
        manualDetalleNavSvcMock = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        armaduraSvcMock = { getArmaduras: jasmine.createSpy('getArmaduras').and.returnValue(of([])) };

        component = new ListadoArmadurasComponent(
            cdrMock,
            armaduraSvcMock,
            manualDetalleNavSvcMock
        );
        component.armaduraSort = { active: '', direction: '', sortChange: of({}), initialized: of({}) } as any;
        component.armaduraPaginator = { page: of({}), initialized: of({}) } as any;
        component.armaduras = [
            normalizeArmadura(crearRodelaApi({ Id: 1, Nombre: 'Escudo pesado', Manual: { Id: 1, Nombre: 'Manual base', Pagina: 10 }, Tipo_escudo: { Id: 3, Nombre: 'Pesado' } })),
            normalizeArmadura(crearArmaduraApi({ Id: 2, Nombre: 'Cota de mallas' })),
        ];
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

    it('enseña la categoría (peso o tipo de escudo) y la Destreza máxima en lugar del tipo de armadura', () => {
        expect(component.armaduraColumns).toEqual(['Nombre', 'Manual', 'Categoria', 'Bon_des']);
        expect(component.getCategoria(component.armaduras[0])).toBe('Escudo (pesado)');
        expect(component.getCategoria(component.armaduras[1])).toBe('Intermedia');
        expect(component.getDestrezaMaxima(component.armaduras[0])).toBe('Sin límite');
        expect(component.getDestrezaMaxima(component.armaduras[1])).toBe('+2');
        expect(component.tiposArmadura).toEqual(['Cualquiera', 'Escudo (pesado)', 'Intermedia']);
    });

    it('filtra por categoría', () => {
        component.defaultTipoArmadura = 'Intermedia';
        component.filtroArmaduras();
        expect(component.armadurasDS.data.map((a) => a.Id)).toEqual([2]);
    });

    it('el buscador rápido filtra por nombre y cuenta como filtro', () => {
        component.buscar('cota');
        expect(component.armadurasDS.data.map((a) => a.Id)).toEqual([2]);
        expect(component.hayFiltros).toBeTrue();
    });

    it('«Limpiar filtros» quita el texto, la categoría, los escudos y el homebrew', () => {
        component.textoBusqueda = 'escudo';
        component.defaultTipoArmadura = 'Intermedia';
        component.soloEscudos = true;
        component.AlternarArmadurasHombrew();
        expect(component.hayFiltros).toBeTrue();

        component.limpiarFiltros();

        expect(component.textoBusqueda).toBe('');
        expect(component.defaultTipoArmadura).toBe('Cualquiera');
        expect(component.soloEscudos).toBeFalse();
        expect(component.homebrewActivo).toBeFalse();
        expect(component.hayFiltros).toBeFalse();
        expect(component.armadurasDS.data.length).toBe(2);
    });
});
