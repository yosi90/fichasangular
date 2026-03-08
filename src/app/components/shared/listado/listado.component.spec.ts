import { ChangeDetectorRef, EventEmitter } from '@angular/core';
import { ListadoArmadurasComponent } from '../listado-armaduras/listado-armaduras.component';
import { ListadoArmasComponent } from '../listado-armas/listado-armas.component';
import { ListadoDeidadesComponent } from '../listado-deidades/listado-deidades.component';
import { ListadoMonstruosComponent } from '../listado-monstruos/listado-monstruos.component';
import { ListadoComponent } from './listado.component';

describe('ListadoComponent', () => {
    let component: ListadoComponent;

    beforeEach(() => {
        const cdrMock = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
        component = new ListadoComponent(cdrMock);
    });

    it('incluye monstruos en el mapa de listados dinámicos', () => {
        expect(component.componentes['monstruos']).toBe(ListadoMonstruosComponent);
    });

    it('incluye armas y armaduras en el mapa de listados dinámicos', () => {
        expect(component.componentes['armas']).toBe(ListadoArmasComponent);
        expect(component.componentes['armaduras']).toBe(ListadoArmadurasComponent);
    });

    it('incluye deidades en el mapa de listados dinámicos', () => {
        expect(component.componentes['deidades']).toBe(ListadoDeidadesComponent);
    });

    it('carga ListadoMonstruosComponent y propaga sus eventos', () => {
        component.tipoLista = 'monstruos';

        const instanciaMonstruos = Object.create(ListadoMonstruosComponent.prototype) as ListadoMonstruosComponent;
        instanciaMonstruos.monstruoDetalles = new EventEmitter<any>();
        instanciaMonstruos.monstruoSeleccionado = new EventEmitter<any>();

        const viewContainerRefMock = {
            clear: jasmine.createSpy('clear'),
            createComponent: jasmine.createSpy('createComponent').and.returnValue({ instance: instanciaMonstruos }),
        } as any;

        (component as any).viewContainerRef = viewContainerRefMock;

        const detallesSpy = spyOn(component.abrirDetalles, 'emit');
        const seleccionadoSpy = spyOn(component.itemSeleccionado, 'emit');
        const monstruo = { Id: 5, Nombre: 'Lobo terrible' } as any;

        component.cargarComponente();
        instanciaMonstruos.monstruoDetalles.emit(monstruo);
        instanciaMonstruos.monstruoSeleccionado.emit(monstruo);

        expect(viewContainerRefMock.createComponent).toHaveBeenCalledWith(ListadoMonstruosComponent);
        expect(detallesSpy).toHaveBeenCalledWith({ item: monstruo, tipo: 'monstruos' });
        expect(seleccionadoSpy).toHaveBeenCalledWith({ item: monstruo, tipo: 'monstruos' });
    });
});
