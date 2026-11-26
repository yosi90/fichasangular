import { ChangeDetectorRef } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MonstruoIndice } from 'src/app/interfaces/monstruo';
import { ListadoMonstruosComponent } from './listado-monstruos.component';

describe('ListadoMonstruosComponent (con el índice ligero)', () => {
    const entrada = (Id: number, Nombre: string, manual: string, Oficial = true): MonstruoIndice => ({
        Id, Nombre, Manual: { Id: Id, Nombre: manual, Pagina: 10 }, Tipo: { Id: 2, Nombre: 'Animal' }, Tamano: { Id: 4, Nombre: 'Mediano' },
        Valor_desafio: '1', Familiar: false, Companero: true, Oficial,
    });
    const indice = [
        entrada(48, 'Lobo', 'Manual de monstruos 1'),
        entrada(3, 'Águila', 'Manual de monstruos 1'),
        entrada(90, 'Grifo de Rol', 'Rol mapa mundi', false),
        entrada(0, 'Comodín', ''),
    ];

    function crear(lectura = of(indice)) {
        const cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
        const monstruoSvc = { getMonstruosIndice: jasmine.createSpy('getMonstruosIndice').and.returnValue(lectura) } as any;
        const componente = new ListadoMonstruosComponent(cdr, monstruoSvc);
        componente.cargar();
        return { componente, monstruoSvc };
    }

    const nombres = (componente: ListadoMonstruosComponent) => componente.monstruosDS.data.map((m) => m.Nombre);

    it('lee el índice (no la rama entera), sin las filas sin id, por nombre y sin el homebrew', fakeAsync(() => {
        const { componente, monstruoSvc } = crear();
        tick(60);

        expect(monstruoSvc.getMonstruosIndice).toHaveBeenCalledTimes(1);
        expect(componente.cargado).toBeTrue();
        expect(componente.monstruos.map((m) => m.Id)).toEqual([3, 90, 48]);
        expect(componente.Manuales).toEqual(['Manual de monstruos 1', 'Rol mapa mundi']);
        expect(nombres(componente)).toEqual(['Águila', 'Lobo']);
        componente.ngOnDestroy();
    }));

    it('filtra por texto (sin tildes), por manual y con el homebrew', fakeAsync(() => {
        const { componente } = crear();

        componente.buscar('aguila');
        expect(nombres(componente)).toEqual(['Águila']);

        componente.limpiarFiltros();
        componente.AlternarMonstruosHombrew();
        expect(nombres(componente)).toEqual(['Águila', 'Grifo de Rol', 'Lobo']);
        expect(componente.monstruoColumns).toContain('Homebrew');

        componente.defaultManual = 'Rol mapa mundi';
        componente.filtroMonstruos();
        expect(nombres(componente)).toEqual(['Grifo de Rol']);
        tick(60);
        componente.ngOnDestroy();
    }));

    it('sus eventos llevan la entrada del índice', fakeAsync(() => {
        const { componente } = crear();
        const detalles: MonstruoIndice[] = [];
        const seleccionados: MonstruoIndice[] = [];
        componente.monstruoDetalles.subscribe((m) => detalles.push(m));
        componente.monstruoSeleccionado.subscribe((m) => seleccionados.push(m));

        componente.verDetallesMonstruo(48);
        componente.seleccionarMonstruo(3);
        componente.verDetallesMonstruo(999);

        expect(detalles).toEqual([indice[0]]);
        expect(seleccionados).toEqual([indice[1]]);
        tick(60);
        componente.ngOnDestroy();
    }));

    it('si no se puede leer el índice, el error y «Reintentar»', fakeAsync(() => {
        const { componente } = crear(throwError(() => new Error('permiso denegado')));

        expect(componente.cargado).toBeTrue();
        expect(componente.errorCarga).toBeTrue();
        componente.ngOnDestroy();
    }));
});
