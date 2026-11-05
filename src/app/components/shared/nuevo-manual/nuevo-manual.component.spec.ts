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
import { ManualService, normalizeManual } from 'src/app/services/manual.service';
import { UserService } from 'src/app/services/user.service';
import { IDA_Y_VUELTA_CRIATURAS_MUNDO } from 'src/testing/ida-y-vuelta-criaturas-mundo';
import { NuevoManualComponent } from './nuevo-manual.component';

describe('NuevoManualComponent', () => {
    let fixture: ComponentFixture<NuevoManualComponent>;
    let component: NuevoManualComponent;
    let manualSvc: jasmine.SpyObj<ManualService>;
    let puede = true;

    async function montar(modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        manualSvc = jasmine.createSpyObj<ManualService>('ManualService', ['getManualFresco', 'crearManual', 'actualizarBanderasManual']);
        if (get)
            manualSvc.getManualFresco.and.returnValue(of(normalizeManual(get)));
        await TestBed.configureTestingModule({
            declarations: [NuevoManualComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatChipsModule, MatFormFieldModule, MatInputModule],
            providers: [
                { provide: ManualService, useValue: manualSvc },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: (recurso: string) => puede && recurso === 'manuales',
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevoManualComponent);
        component = fixture.componentInstance;
        component.modo = modo;
        component.idManual = get ? Number(get.Id) : null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => {
        puede = true;
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    describe('ida y vuelta (todos los manuales de rol_dev)', () => {
        IDA_Y_VUELTA_CRIATURAS_MUNDO.manuales.forEach(({ id, nombre, get, cuerpo }) => {
            it(`«${nombre}» (${id}): cargado y sin tocar, manda las banderas que devuelven el mismo GET`, async () => {
                await montar('editar', get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.banderasDelFormulario()).toEqual(cuerpo);
                expect(component.form.controls.nombre.disabled).toBeTrue();
            });
        });
    });

    it('un manual nuevo: el nombre, si es oficial y lo que trae', async () => {
        await montar();
        manualSvc.crearManual.and.resolveTo({ message: 'Manual creado exitosamente', id: 90, entrada: normalizeManual({ Id: 90, Nombre: 'Mi libro' }) });
        component.form.patchValue({ nombre: ' Mi libro ' });
        component.alternar('oficial');
        component.alternar('Incluye_dotes');

        await component.guardar();

        expect(manualSvc.crearManual).toHaveBeenCalledWith({
            nombre: 'Mi libro', oficial: false, Incluye_dotes: true, Incluye_conjuros: false, Incluye_clases: false, Incluye_razas: false,
            Incluye_tipos: false, Incluye_plantillas: false, Incluye_monstruos: false, Incluye_subtipos: false,
        });
        expect(component.form.controls.nombre.value).toBe('');
    });

    it('el 409 del nombre va al campo y al marco', async () => {
        await montar();
        manualSvc.crearManual.and.rejectWith(new ProfileApiError('Ya existe un manual con ese nombre.', 'nombre_duplicado', 409, 'nombre'));
        component.form.patchValue({ nombre: 'Manual del jugador' });

        await component.guardar();

        expect(component.errores.global).toContain('Ya existe');
        expect(component.form.controls.nombre.errors?.['api']).toContain('Ya existe');
    });

    it('modificar: solo cambian las banderas (PATCH), no el nombre ni si es oficial', async () => {
        const { get } = IDA_Y_VUELTA_CRIATURAS_MUNDO.manuales[0];
        await montar('editar', get);
        manualSvc.actualizarBanderasManual.and.resolveTo(normalizeManual({ ...get, Incluye_subtipos: 1 }));
        const actualizado = jasmine.createSpy('actualizado');
        component.manualActualizado.subscribe(actualizado);
        const oficial = component.marcada('oficial');
        component.alternar('oficial');
        expect(component.marcada('oficial')).toBe(oficial);
        component.alternar('Incluye_subtipos');
        expect(component.edicion.hayCambios).toBeTrue();

        await component.guardar();

        expect(manualSvc.actualizarBanderasManual).toHaveBeenCalledWith(Number(get.Id), jasmine.objectContaining({ Incluye_subtipos: !get.Incluye_subtipos }));
        expect(manualSvc.crearManual).not.toHaveBeenCalled();
        expect(actualizado).toHaveBeenCalled();
    });

    it('sin permiso no guarda', async () => {
        puede = false;
        await montar();

        await component.guardar();

        expect(manualSvc.crearManual).not.toHaveBeenCalled();
    });
});
