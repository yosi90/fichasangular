import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { of, throwError } from 'rxjs';
import { EquipoService } from 'src/app/services/equipo.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { normalizeEncantamiento, normalizeMunicion } from 'src/app/services/utils/equipo-mapper';
import { crearEncantamientoApi, crearMunicionApi } from 'src/testing/equipo-api';
import { ManualListadoPipe } from '../listado-nombre/manual-listado.pipe';
import { ListadoEquipoComponent } from './listado-equipo.component';
import { claveEntradaEquipo, etiquetaEntradaEquipo, tipoDeListaEquipo } from './listas-equipo';

describe('ListadoEquipoComponent', () => {
    let fixture: ComponentFixture<ListadoEquipoComponent>;
    let component: ListadoEquipoComponent;
    let equipoSvc: jasmine.SpyObj<EquipoService>;
    let manualNav: jasmine.SpyObj<ManualDetalleNavigationService>;

    const flechas = normalizeMunicion(crearMunicionApi());
    const virotes = normalizeMunicion(crearMunicionApi({ Id: 2, Nombre: 'Virotes', Descripcion: 'Para ballestas', Oficial: false, Armas: [] }));
    const afilada = normalizeEncantamiento(crearEncantamientoApi());

    beforeEach(async () => {
        equipoSvc = jasmine.createSpyObj<EquipoService>('EquipoService', ['getMuniciones', 'getEncantamientos', 'getMateriales', 'getConjuntos']);
        equipoSvc.getMuniciones.and.returnValue(of([flechas, virotes]));
        equipoSvc.getEncantamientos.and.returnValue(of([afilada]));
        manualNav = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        await TestBed.configureTestingModule({
            declarations: [ListadoEquipoComponent, ManualListadoPipe],
            imports: [NoopAnimationsModule, MatTableModule, MatSortModule, MatPaginatorModule, MatMenuModule],
            providers: [
                { provide: EquipoService, useValue: equipoSvc },
                { provide: ManualDetalleNavigationService, useValue: manualNav },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(ListadoEquipoComponent);
        component = fixture.componentInstance;
    });

    it('lista la munición oficial con su precio por lote y las armas que la disparan', () => {
        component.tipo = 'municion';
        fixture.detectChanges();
        expect(equipoSvc.getMuniciones).toHaveBeenCalled();
        expect(component.columnas).toEqual(['Nombre', 'Manual', 'Precio', 'Armas']);
        expect(component.dataSource.data.map((m) => m.Nombre)).toEqual(['Flechas']);
        expect(component.valorColumna(flechas, 'Precio')).toBe('1 po (20)');
        expect(component.valorColumna(flechas, 'Armas')).toBe('Arco corto, Arco largo');
    });

    it('enseña lo homebrew al pulsar su chip', () => {
        component.tipo = 'municion';
        fixture.detectChanges();
        component.alternarHomebrew();
        expect(component.dataSource.data.map((m) => m.Nombre)).toEqual(['Flechas', 'Virotes']);
    });

    it('busca también en la descripción', () => {
        component.tipo = 'municion';
        fixture.detectChanges();
        component.alternarHomebrew();
        component.buscar('ballestas');
        expect(component.dataSource.data.map((m) => m.Nombre)).toEqual(['Virotes']);
    });

    it('«Limpiar filtros» vacía el buscador, vuelve a «Cualquiera» y quita lo homebrew', () => {
        component.tipo = 'municion';
        fixture.detectChanges();
        expect(component.hayFiltros).toBeFalse();
        component.alternarHomebrew();
        component.buscar('ballestas');
        component.defaultManual = 'Manual del jugador 1';
        expect(component.hayFiltros).toBeTrue();

        component.limpiarFiltros();

        expect(component.textoBusqueda).toBe('');
        expect(component.defaultManual).toBe('Cualquiera');
        expect(component.mostrarHomebrew).toBeFalse();
        expect(component.hayFiltros).toBeFalse();
        expect(component.dataSource.data.map((m) => m.Nombre)).toEqual(['Flechas']);
    });

    it('el icono y el título salen del registro por el tipo', () => {
        component.tipo = 'encantamiento';
        expect(component.icono).toBe('aptitud-equipo');
        expect(component.titulo).toBe('Aptitudes de armas y armaduras');
        component.tipo = 'municion';
        expect(component.titulo).toBe('Munición');
    });

    it('si la lectura falla enseña el error y «Reintentar» vuelve a leer', () => {
        component.tipo = 'municion';
        equipoSvc.getMuniciones.and.returnValues(throwError(() => new Error('caída')), of([flechas]));
        fixture.detectChanges();
        expect(component.cargado).toBeTrue();
        expect(component.errorCarga).toBeTrue();

        component.cargar();
        expect(component.errorCarga).toBeFalse();
        expect(component.dataSource.data.map((m) => m.Nombre)).toEqual(['Flechas']);
    });

    it('las aptitudes enseñan su bonificador equivalente y a qué se aplican', () => {
        component.tipo = 'encantamiento';
        fixture.detectChanges();
        expect(component.valorColumna(afilada, 'Valor')).toBe('Bonificador +1');
        expect(component.valorColumna(afilada, 'Aplica')).toBe('armas cuerpo a cuerpo');
    });

    it('emite la entrada con su tipo al ver el detalle y al seleccionar', () => {
        component.tipo = 'municion';
        fixture.detectChanges();
        const detalles = spyOn(component.entradaDetalles, 'emit');
        const seleccion = spyOn(component.entradaSeleccionada, 'emit');
        component.verDetalles(flechas);
        component.seleccionar(flechas);
        expect(detalles).toHaveBeenCalledWith({ tipo: 'municion', item: flechas });
        expect(seleccion).toHaveBeenCalledWith({ tipo: 'municion', item: flechas });
    });

    it('abre el manual sin seleccionar la fila', () => {
        component.tipo = 'municion';
        const event = jasmine.createSpyObj<MouseEvent>('MouseEvent', ['preventDefault', 'stopPropagation']);
        component.abrirDetalleManual(flechas, event);
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith({ id: 54, nombre: 'Manual del jugador 1' });
    });
});

describe('listas-equipo', () => {
    it('cada listado del menú tiene su tipo de entrada', () => {
        expect(tipoDeListaEquipo('objetos')).toBe('objeto');
        expect(tipoDeListaEquipo('munición')).toBe('municion');
        expect(tipoDeListaEquipo('aptitudes de armas y armaduras')).toBe('encantamiento');
        expect(tipoDeListaEquipo('armas')).toBeNull();
    });

    it('la pestaña de un detalle tiene etiqueta y clave por tipo', () => {
        const entrada = { tipo: 'municion' as const, item: normalizeMunicion(crearMunicionApi()) };
        expect(etiquetaEntradaEquipo(entrada)).toBe('Flechas (Munición)');
        expect(claveEntradaEquipo(entrada)).toBe('equipo:municion:1');
    });
});
