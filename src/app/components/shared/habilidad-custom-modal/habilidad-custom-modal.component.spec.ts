import { SimpleChange } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import Swal from 'sweetalert2';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { HabilidadCustomModalComponent } from './habilidad-custom-modal.component';

describe('HabilidadCustomModalComponent', () => {
    const habilidad = (overrides: Partial<HabilidadBasicaDetalle> = {}): HabilidadBasicaDetalle => ({
        Id_habilidad: 12, Nombre: 'Pilotar aeronave', Id_caracteristica: 3, Caracteristica: 'Inteligencia', Descripcion: '',
        Soporta_extra: false, Entrenada: false, Extras: [], ...overrides,
    } as HabilidadBasicaDetalle);
    let habilidadSvc: jasmine.SpyObj<any>;
    let component: HabilidadCustomModalComponent;

    function abrir(modo: 'crear' | 'editar', actual: HabilidadBasicaDetalle | null = null): void {
        component.modo = modo;
        component.habilidad = actual;
        component.abierto = true;
        component.ngOnChanges({ abierto: new SimpleChange(false, true, false) });
    }

    beforeEach(() => {
        habilidadSvc = jasmine.createSpyObj('HabilidadService', ['crearHabilidadCustom', 'actualizarHabilidadCustom']);
        habilidadSvc.crearHabilidadCustom.and.resolveTo({ message: 'Creada', idHabilidad: 13, habilidad: habilidad({ Id_habilidad: 13, Nombre: 'Pilotar dirigible', Id_caracteristica: 4 }) });
        habilidadSvc.actualizarHabilidadCustom.and.resolveTo({ message: 'Actualizada', idHabilidad: 12, habilidad: habilidad({ Nombre: 'Pilotar aeronave mayor', Id_caracteristica: 4 }) });
        component = new HabilidadCustomModalComponent(new FormBuilder(), habilidadSvc);
    });

    it('crea la habilidad y la devuelve', async () => {
        const guardada = spyOn(component.guardada, 'emit');
        abrir('crear');
        component.form.patchValue({ nombre: ' Pilotar dirigible ', id_caracteristica: 4 });

        await component.guardar();

        expect(habilidadSvc.crearHabilidadCustom).toHaveBeenCalledWith({ nombre: 'Pilotar dirigible', id_caracteristica: 4 });
        expect(guardada).toHaveBeenCalledWith(jasmine.objectContaining({ Id_habilidad: 13 }));
    });

    it('modifica la habilidad que recibe', async () => {
        abrir('editar', habilidad());
        expect(component.form.getRawValue()).toEqual({ nombre: 'Pilotar aeronave', id_caracteristica: 3 });
        component.form.patchValue({ nombre: 'Pilotar aeronave mayor', id_caracteristica: 4 });

        await component.guardar();

        expect(habilidadSvc.actualizarHabilidadCustom).toHaveBeenCalledWith(12, { nombre: 'Pilotar aeronave mayor', id_caracteristica: 4 });
    });

    it('si falla, avisa con el aviso común de las inserciones', async () => {
        const swal = spyOn(Swal, 'fire').and.resolveTo({} as any);
        habilidadSvc.actualizarHabilidadCustom.and.rejectWith(new Error('Ya existe una habilidad con ese nombre.'));
        abrir('editar', habilidad());

        await component.guardar();

        expect(swal).toHaveBeenCalledWith(jasmine.objectContaining({
            icon: 'error',
            title: 'No se pudo actualizar la habilidad',
            text: 'Ya existe una habilidad con ese nombre.',
        }));
        expect(component.guardando).toBeFalse();
    });
});
