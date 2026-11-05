import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { RasgoService, normalizeRasgoApi } from 'src/app/services/rasgo.service';
import { UserService } from 'src/app/services/user.service';
import { IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM } from 'src/testing/ida-y-vuelta-rasgos-ventajas-incarnum';
import { NuevoRasgoComponent } from './nuevo-rasgo.component';

describe('NuevoRasgoComponent', () => {
    let fixture: ComponentFixture<NuevoRasgoComponent>;
    let component: NuevoRasgoComponent;
    let rasgoSvc: jasmine.SpyObj<RasgoService>;
    let puede = true;

    async function montar(modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        rasgoSvc = jasmine.createSpyObj<RasgoService>('RasgoService', ['getRasgoFresco', 'crearRasgo', 'actualizarRasgo']);
        if (get)
            rasgoSvc.getRasgoFresco.and.returnValue(of(normalizeRasgoApi(get)));
        await TestBed.configureTestingModule({
            declarations: [NuevoRasgoComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatChipsModule, MatFormFieldModule, MatInputModule],
            providers: [
                { provide: RasgoService, useValue: rasgoSvc },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: (recurso: string) => puede && recurso === 'rasgos',
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevoRasgoComponent);
        component = fixture.componentInstance;
        component.modo = modo;
        component.idRasgo = get ? Number(get.i) : null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => {
        puede = true;
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    describe('ida y vuelta (respuestas reales de rol_dev)', () => {
        IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM.rasgos.forEach(({ id, nombre, get, cuerpo }) => {
            it(`«${nombre}» (${id}): cargado y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                await montar('editar', get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
            });
        });
    });

    it('un rasgo nuevo: con el permiso de rasgos, lo crea, avisa y vuelve a quedar vacío', async () => {
        await montar();
        rasgoSvc.crearRasgo.and.resolveTo({ message: 'Rasgo creado exitosamente', idRasgo: 90, rasgo: normalizeRasgoApi({ i: 90, n: 'Vista ciega', d: '', o: false }) });
        const creado = jasmine.createSpy('creado');
        component.rasgoCreado.subscribe(creado);
        component.form.patchValue({ nombre: '  Vista ciega ', descripcion: '' });
        component.alternarOficial();

        await component.guardar();

        expect(rasgoSvc.crearRasgo).toHaveBeenCalledWith({ rasgo: { nombre: 'Vista ciega', descripcion: '', oficial: false } });
        expect(creado).toHaveBeenCalled();
        expect(component.form.controls.nombre.value).toBe('');
        expect(component.form.controls.oficial.value).toBeTrue();
    });

    it('el 409 de la API va al nombre y al marco', async () => {
        await montar();
        rasgoSvc.crearRasgo.and.rejectWith(new ProfileApiError('Ya existe un rasgo con ese nombre.', 'nombre_duplicado', 409, 'rasgo.nombre'));
        component.form.patchValue({ nombre: 'Aura amenazadora' });

        await component.guardar();

        expect(component.errores.global).toContain('Ya existe un rasgo con ese nombre.');
        expect(component.form.controls.nombre.errors?.['api']).toContain('Ya existe');
    });

    it('sin permiso no guarda y el marco lo avisa', async () => {
        puede = false;
        await montar();
        component.form.patchValue({ nombre: 'Algo' });

        await component.guardar();

        expect(rasgoSvc.crearRasgo).not.toHaveBeenCalled();
        expect(component.edicion.avisoPermisos(component.puedeCrear)).toContain('No tienes permisos');
    });

    it('modificar: «Guardar cambios» manda PUT con lo cambiado y emite el rasgo de la API', async () => {
        const { get } = IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM.rasgos[0];
        await montar('editar', get);
        rasgoSvc.actualizarRasgo.and.resolveTo({ message: 'Rasgo actualizado exitosamente', idRasgo: get.i, rasgo: normalizeRasgoApi(get) });
        const actualizado = jasmine.createSpy('actualizado');
        component.rasgoActualizado.subscribe(actualizado);
        component.form.controls.descripcion.setValue('Otra.');
        expect(component.edicion.hayCambios).toBeTrue();

        await component.guardar();

        expect(rasgoSvc.actualizarRasgo).toHaveBeenCalledWith(get.i, jasmine.objectContaining({ rasgo: jasmine.objectContaining({ descripcion: 'Otra.' }) }));
        expect(actualizado).toHaveBeenCalled();
    });
});
