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
import { EquipoService } from 'src/app/services/equipo.service';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { UserService } from 'src/app/services/user.service';
import { normalizarChakra, normalizarChakraDetalle } from 'src/app/services/utils/incarnum-mapper';
import { IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM } from 'src/testing/ida-y-vuelta-rasgos-ventajas-incarnum';
import { NuevoChakraComponent } from './nuevo-chakra.component';

describe('NuevoChakraComponent', () => {
    let fixture: ComponentFixture<NuevoChakraComponent>;
    let component: NuevoChakraComponent;
    let incarnumSvc: jasmine.SpyObj<IncarnumService>;

    const chakras = [
        { Id: 34, Nombre: 'Corona', Orden: 1, Categoria: { Id: 19, Nombre: 'Mínimo', Orden: 1 }, Ranura: { Id: 1, Nombre: 'Cabeza' } },
        { Id: 35, Nombre: 'Pies', Orden: 2, Categoria: { Id: 19, Nombre: 'Mínimo', Orden: 1 }, Ranura: { Id: 11, Nombre: 'Pies' } },
        { Id: 44, Nombre: 'Tótem', Orden: 11, Categoria: { Id: 24, Nombre: 'Tótem', Orden: 6 }, Ranura: null },
        { Id: 42, Nombre: 'Corazón', Orden: 9, Categoria: { Id: 22, Nombre: 'Corazón', Orden: 4 }, Ranura: { Id: 6, Nombre: 'Torso' } },
    ].map(normalizarChakra);

    async function montar(modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        incarnumSvc = jasmine.createSpyObj<IncarnumService>('IncarnumService', ['getChakraFresco', 'guardarChakra', 'getChakras']);
        incarnumSvc.getChakras.and.returnValue(of(chakras));
        if (get)
            incarnumSvc.getChakraFresco.and.returnValue(of(normalizarChakraDetalle(get)));
        await TestBed.configureTestingModule({
            declarations: [NuevoChakraComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
            providers: [
                { provide: IncarnumService, useValue: incarnumSvc },
                { provide: EquipoService, useValue: { getCatalogos: () => of({ Ranuras: [{ Id: 1, Nombre: 'Cabeza', Maximo: 1 }, { Id: 9, Nombre: 'Anillo', Maximo: 2 }] }) } },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: (recurso: string) => recurso === 'clases',
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevoChakraComponent);
        component = fixture.componentInstance;
        component.modo = modo;
        component.idChakra = get?.Id ?? null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => spyOn(Swal, 'fire').and.resolveTo({} as any));

    describe('ida y vuelta (respuestas reales de rol_dev)', () => {
        IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM.chakras.forEach(({ id, nombre, get, cuerpo }) => {
            it(`«${nombre}» (${id}): cargado y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                await montar('editar', get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
            });
        });
    });

    it('las categorías salen de los chakras que hay, sin repetir y en su orden; uno nuevo va detrás', async () => {
        await montar();
        expect(component.categorias.map((c) => c.Nombre)).toEqual(['Mínimo', 'Corazón', 'Tótem']);
        expect(component.form.controls.orden.value).toBe(12);
        expect(component.form.controls.oficial.value).toBeFalse();
    });

    it('un chakra nuevo sin ranura, como el tótem', async () => {
        await montar();
        incarnumSvc.guardarChakra.and.resolveTo({ message: 'Chakra creado exitosamente', id: 45, entrada: normalizarChakraDetalle({ Id: 45, Orden: 12 }) });
        component.form.patchValue({ nombre: 'Cola', id_categoria: 19, descripcion: 'Propio.' });

        await component.guardar();

        expect(incarnumSvc.guardarChakra).toHaveBeenCalledWith({
            chakra: { nombre: 'Cola', nombre_original: null, traducido: false, id_categoria: 19, id_ranura: null, orden: 12, descripcion: 'Propio.', oficial: false },
        }, null);
        expect(component.form.controls.orden.value).toBe(13);
    });

    it('el nombre original repetido de la API va a su campo', async () => {
        await montar();
        incarnumSvc.guardarChakra.and.rejectWith(new ProfileApiError('Ya existe un chakra con ese nombre original.', 'nombre_duplicado', 409, 'chakra.nombre_original'));
        component.form.patchValue({ nombre: 'Cola', nombre_original: 'Crown', id_categoria: 19 });

        await component.guardar();

        expect(component.form.controls.nombre_original.errors?.['api']).toContain('nombre original');
    });
});
