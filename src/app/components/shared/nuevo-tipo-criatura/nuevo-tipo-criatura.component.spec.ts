import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ManualService } from 'src/app/services/manual.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { TipoCriaturaService, normalizeTipoCriaturaApi } from 'src/app/services/tipo-criatura.service';
import { UserService } from 'src/app/services/user.service';
import { IDA_Y_VUELTA_CRIATURAS_MUNDO } from 'src/testing/ida-y-vuelta-criaturas-mundo';
import { NuevoTipoCriaturaComponent } from './nuevo-tipo-criatura.component';

describe('NuevoTipoCriaturaComponent', () => {
    let fixture: ComponentFixture<NuevoTipoCriaturaComponent>;
    let component: NuevoTipoCriaturaComponent;
    let tipoSvc: jasmine.SpyObj<TipoCriaturaService>;
    let puede = true;

    async function montar(modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        tipoSvc = jasmine.createSpyObj<TipoCriaturaService>('TipoCriaturaService',
            ['getTipoCriaturaFresco', 'crearTipoCriatura', 'actualizarTipoCriatura']);
        if (get)
            tipoSvc.getTipoCriaturaFresco.and.returnValue(of(normalizeTipoCriaturaApi(get)));
        await TestBed.configureTestingModule({
            declarations: [NuevoTipoCriaturaComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
            providers: [
                { provide: TipoCriaturaService, useValue: tipoSvc },
                { provide: ManualService, useValue: { getManuales: () => of([{ Id: 47, Nombre: 'Manual de monstruos 1' }]) } },
                { provide: AlineamientoService, useValue: { getAlineamientosCombinacionesCatalogo: () => of([]) } },
                { provide: RazaCatalogosService, useValue: { getTiposDado: () => of([{ Id: 0, Nombre: 'Elegir' }, { Id: 3, Nombre: 'd8' }]) } },
                {
                    provide: ClaseService, useValue: {
                        getCatalogosProgresion: () => of({
                            ataques_base: [{ Id: 2, Nombre: 'Medio' }], salvaciones: [{ Id: 1, Nombre: 'Buena' }, { Id: 2, Nombre: 'Mala' }],
                            puntos_habilidad: [{ Id: 1, Valor: 2 }], aumentos_clase_lanzadora: [],
                        }),
                    },
                },
                { provide: RasgoService, useValue: { getRasgos: () => of([{ Id: 0, Nombre: 'Ninguno' }, { Id: 9, Nombre: 'Visión en la oscuridad 60\'' }]) } },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: (recurso: string) => puede && recurso === 'tipos_criatura',
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevoTipoCriaturaComponent);
        component = fixture.componentInstance;
        component.modo = modo;
        component.idTipo = get ? Number(get.i) : null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => {
        puede = true;
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    describe('ida y vuelta (todos los tipos de rol_dev)', () => {
        IDA_Y_VUELTA_CRIATURAS_MUNDO.tipos.forEach(({ id, nombre, get, cuerpo }) => {
            it(`«${nombre}» (${id}): cargado y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                await montar('editar', get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
            });
        });
    });

    it('las opciones: sin el dado «Elegir» ni el rasgo de relleno; los puntos por DG, por su valor', async () => {
        await montar();

        expect(component.tiposDado.map((tipo) => tipo.id)).toEqual([3]);
        expect(component.rasgosOpciones.map((rasgo) => rasgo.id)).toEqual([9]);
        expect(component.puntosHabilidad).toEqual([{ id: 1, nombre: '2 + Int por DG' }]);
    });

    it('un tipo nuevo: con el permiso de tipos de criatura, lo crea con sus rasgos y vuelve a quedar vacío', async () => {
        await montar();
        tipoSvc.crearTipoCriatura.and.resolveTo({ message: 'Tipo de criatura creado exitosamente', id: 44, entrada: normalizeTipoCriaturaApi({ i: 44, n: 'Bestia' }) });
        const creado = jasmine.createSpy('creado');
        component.tipoCreado.subscribe(creado);
        component.form.patchValue({
            nombre: ' Bestia ', id_manual: 47, pagina: 314, id_alineamiento: 2, id_tipo_dado: 3, id_puntos_habilidad: 1,
            id_ataque: 2, id_fortaleza: 1, id_reflejos: 1, id_voluntad: 2,
        });
        component.anadirRasgo(9);
        component.anadirRasgo(9);
        component.alternar('pierde_cons');

        await component.guardar();

        expect(tipoSvc.crearTipoCriatura).toHaveBeenCalledWith(jasmine.objectContaining({
            tipo: jasmine.objectContaining({ nombre: 'Bestia', limite_inteligencia: -1, tesoro: null, pierde_cons: true, oficial: true }),
            rasgos: [9],
        }));
        expect(creado).toHaveBeenCalled();
        expect(component.form.controls.nombre.value).toBe('');
        expect(component.rasgos).toEqual([]);
    });

    it('el 404 de un rasgo de la API va a la lista de rasgos y al marco', async () => {
        await montar();
        tipoSvc.crearTipoCriatura.and.rejectWith(new ProfileApiError('No se ha encontrado el rasgo.', 'no_encontrado', 404, 'rasgos[0]'));
        component.form.patchValue({
            nombre: 'Bestia', id_manual: 47, pagina: 1, id_alineamiento: 2, id_tipo_dado: 3, id_puntos_habilidad: 1,
            id_ataque: 2, id_fortaleza: 1, id_reflejos: 1, id_voluntad: 2,
        });

        await component.guardar();

        expect(component.errores.global).toContain('No se ha encontrado el rasgo.');
        expect(component.errores.mensajeDe('rasgos')).toContain('No se ha encontrado el rasgo.');
    });

    it('sin permiso no guarda y el marco lo avisa', async () => {
        puede = false;
        await montar();

        await component.guardar();

        expect(tipoSvc.crearTipoCriatura).not.toHaveBeenCalled();
        expect(component.edicion.avisoPermisos(component.puedeCrear)).toContain('No tienes permisos');
    });

    it('modificar: «Guardar cambios» manda PUT con lo cambiado y emite el tipo de la API', async () => {
        const { get } = IDA_Y_VUELTA_CRIATURAS_MUNDO.tipos[0];
        await montar('editar', get);
        tipoSvc.actualizarTipoCriatura.and.resolveTo({ message: 'Tipo de criatura actualizado exitosamente', id: Number(get.i), entrada: normalizeTipoCriaturaApi(get) });
        const actualizado = jasmine.createSpy('actualizado');
        component.tipoActualizado.subscribe(actualizado);
        component.quitarRasgo(component.rasgos[0] ?? { id: 0 });
        component.form.controls.tesoro.setValue('Doble');
        expect(component.edicion.hayCambios).toBeTrue();

        await component.guardar();

        expect(tipoSvc.actualizarTipoCriatura).toHaveBeenCalledWith(Number(get.i), jasmine.objectContaining({
            tipo: jasmine.objectContaining({ tesoro: 'Doble' }),
        }));
        expect(actualizado).toHaveBeenCalled();
    });
});
