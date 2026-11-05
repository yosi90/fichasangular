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
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { AmbitoService } from 'src/app/services/ambito.service';
import { ArmaService } from 'src/app/services/arma.service';
import { DeidadService, normalizeDeidad } from 'src/app/services/deidad.service';
import { DominioService } from 'src/app/services/dominio.service';
import { ManualService } from 'src/app/services/manual.service';
import { PabellonService } from 'src/app/services/pabellon.service';
import { UserService } from 'src/app/services/user.service';
import { IDA_Y_VUELTA_CRIATURAS_MUNDO } from 'src/testing/ida-y-vuelta-criaturas-mundo';
import { NuevaDeidadComponent } from './nueva-deidad.component';

describe('NuevaDeidadComponent', () => {
    let fixture: ComponentFixture<NuevaDeidadComponent>;
    let component: NuevaDeidadComponent;
    let deidadSvc: jasmine.SpyObj<DeidadService>;
    let puede = true;

    async function montar(modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        deidadSvc = jasmine.createSpyObj<DeidadService>('DeidadService', ['getDeidadFresca', 'crearDeidad', 'actualizarDeidad', 'getGeneros']);
        deidadSvc.getGeneros.and.returnValue(of([{ Id: 2, Nombre: 'Hembra' }, { Id: 1, Nombre: 'Macho' }]));
        if (get)
            deidadSvc.getDeidadFresca.and.returnValue(of(normalizeDeidad(get)));
        await TestBed.configureTestingModule({
            declarations: [NuevaDeidadComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
            providers: [
                { provide: DeidadService, useValue: deidadSvc },
                { provide: ManualService, useValue: { getManuales: () => of([{ Id: 9, Nombre: 'Dioses y semidioses' }]) } },
                {
                    provide: AlineamientoService, useValue: {
                        getAlineamientosCombinacionesCatalogo: () => of([]),
                        getAlineamientosBasicosCatalogo: () => of([{ Id: 0, Nombre: 'No aplica' }, { Id: 2, Nombre: 'Legal neutral' }, { Id: 1, Nombre: 'Legal bueno' }]),
                    },
                },
                { provide: ArmaService, useValue: { getArmas: () => of([{ Id: -1, Nombre: 'Ninguna' }, { Id: 0, Nombre: 'Elegir' }, { Id: 73, Nombre: 'Garra' }]) } },
                { provide: PabellonService, useValue: { getPabellones: () => of([{ Id: 0, Nombre: 'Ninguno' }, { Id: 1, Nombre: 'D&d' }]) } },
                { provide: AmbitoService, useValue: { getAmbitos: () => of([{ Id: 1, Nombre: 'Dragones buenos' }, { Id: 2, Nombre: 'Viento' }]) } },
                { provide: DominioService, useValue: { getDominios: () => of([{ Id: 2, Nombre: 'Aire' }, { Id: 5, Nombre: 'Bien' }]) } },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: (recurso: string) => puede && recurso === 'deidades',
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevaDeidadComponent);
        component = fixture.componentInstance;
        component.modo = modo;
        component.idDeidad = get ? Number(get.Id) : null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => {
        puede = true;
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    describe('ida y vuelta (todas las deidades de rol_dev)', () => {
        IDA_Y_VUELTA_CRIATURAS_MUNDO.deidades.forEach(({ id, nombre, get, cuerpo }) => {
            it(`«${nombre}» (${id}): cargada y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                await montar('editar', get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
            });
        });
    });

    it('las opciones: el arma «Elegir» sí, «Ninguna» no; sin el panteón de relleno; los básicos y los géneros, por su id', async () => {
        await montar();

        expect(component.armas.map((arma) => arma.id)).toEqual([0, 73]);
        expect(component.pabellones.map((pabellon) => pabellon.id)).toEqual([1]);
        expect(component.alineamientosBasicos.map((alineamiento) => alineamiento.id)).toEqual([1, 2]);
        expect(component.generos.map((genero) => genero.id)).toEqual([1, 2]);
    });

    it('una deidad nueva: sin arma ni panteón van `null`, con sus listas ordenadas, y vuelve a quedar vacía', async () => {
        await montar();
        deidadSvc.crearDeidad.and.resolveTo({ message: 'Deidad creada exitosamente', id: 90, entrada: normalizeDeidad({ Id: 90, Nombre: 'Diosa' }) });
        component.form.patchValue({ nombre: 'Diosa', id_manual: 9, pagina: 3, id_genero: 2, id_alineamiento: 4 });
        component.anadirA('dominios', 5);
        component.anadirA('dominios', 2);
        component.anadirA('ambitos', 2);
        component.alternarDevoto(2);
        component.alternarDevoto(1);

        await component.guardar();

        expect(deidadSvc.crearDeidad).toHaveBeenCalledWith({
            deidad: {
                nombre: 'Diosa', descripcion: '', id_manual: 9, pagina: 3, id_alineamiento: 4, id_arma: null, id_pabellon: null,
                id_genero: 2, oficial: true,
            },
            ambitos: [2], dominios: [2, 5], alineamientos_devotos: [1, 2],
        });
        expect(component.listas.dominios).toEqual([]);
        expect(component.devotos).toEqual([]);
    });

    it('quitar el arma la deja sin arma; el «Elegir» es 0', async () => {
        await montar();
        component.elegir('id_arma', 0);
        expect(component.cuerpo().deidad.id_arma).toBe(0);
        component.quitar('id_arma');
        expect(component.cuerpo().deidad.id_arma).toBeNull();
    });

    it('sin permiso no guarda', async () => {
        puede = false;
        await montar();

        await component.guardar();

        expect(deidadSvc.crearDeidad).not.toHaveBeenCalled();
    });
});
