import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { ListadoArmasComponent } from './listado-armas.component';
import { normalizeArma } from 'src/app/services/arma.service';
import { crearArmaApi } from 'src/testing/equipo-api';

describe('ListadoArmasComponent', () => {
    let component: ListadoArmasComponent;
    let cdrMock: jasmine.SpyObj<ChangeDetectorRef>;
    let armaSvcMock: any;

    beforeEach(() => {
        cdrMock = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
        armaSvcMock = { getArmas: jasmine.createSpy('getArmas').and.returnValue(of([])) };

        component = new ListadoArmasComponent(
            cdrMock,
            armaSvcMock
        );
        component.armaSort = { active: '', direction: '', sortChange: of({}), initialized: of({}) } as any;
        component.armaPaginator = { page: of({}), initialized: of({}) } as any;
        component.armas = [normalizeArma(crearArmaApi({ Id: 1, Nombre: 'Espada larga', Manual: { Id: 1, Nombre: 'Manual base', Pagina: 5 } }))];
    });

    it('emite detalle al abrir desde listado', () => {
        const emitSpy = spyOn(component.armaDetalles, 'emit');
        component.verDetallesArma(1);
        expect(emitSpy).toHaveBeenCalled();
    });

    it('el buscador rápido filtra por nombre y cuenta como filtro', () => {
        component.armas = [...component.armas, { ...component.armas[0], Id: 2, Nombre: 'Hacha de batalla' }];
        component.buscar('ESPADA');
        expect(component.armasDS.data.map((a) => a.Id)).toEqual([1]);
        expect(component.hayFiltros).toBeTrue();
    });

    it('«Limpiar filtros» vacía el texto y vuelve el manual, el tipo y el homebrew a como se abre', () => {
        component.textoBusqueda = 'espada';
        component.defaultManual = 'Manual base';
        component.defaultTipoArma = 'Sencilla';
        component.AlternarArmasHombrew();
        expect(component.hayFiltros).toBeTrue();

        component.limpiarFiltros();

        expect(component.textoBusqueda).toBe('');
        expect(component.defaultManual).toBe('Cualquiera');
        expect(component.defaultTipoArma).toBe('Cualquiera');
        expect(component.homebrewActivo).toBeFalse();
        expect(component.hayFiltros).toBeFalse();
    });
});
