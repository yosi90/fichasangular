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
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DoteService } from 'src/app/services/dote.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { UserService } from 'src/app/services/user.service';
import { normalizeSubtipoDetalle } from 'src/app/services/utils/subtipo-mapper';
import { IDA_Y_VUELTA_CRIATURAS_MUNDO } from 'src/testing/ida-y-vuelta-criaturas-mundo';
import { NuevoSubtipoComponent } from './nuevo-subtipo.component';

describe('NuevoSubtipoComponent', () => {
    let fixture: ComponentFixture<NuevoSubtipoComponent>;
    let component: NuevoSubtipoComponent;
    let subtipoSvc: jasmine.SpyObj<SubtipoService>;
    let puede = true;

    async function montar(modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        subtipoSvc = jasmine.createSpyObj<SubtipoService>('SubtipoService', ['getSubtipoFresco', 'crearSubtipo', 'actualizarSubtipo']);
        if (get)
            subtipoSvc.getSubtipoFresco.and.returnValue(of(normalizeSubtipoDetalle(get)));
        await TestBed.configureTestingModule({
            declarations: [NuevoSubtipoComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
            providers: [
                { provide: SubtipoService, useValue: subtipoSvc },
                { provide: ManualService, useValue: { getManuales: () => of([{ Id: 47, Nombre: 'Manual de monstruos 1' }]) } },
                { provide: AlineamientoService, useValue: { getAlineamientosCombinacionesCatalogo: () => of([]) } },
                { provide: RazaCatalogosService, useValue: { getManiobrabilidades: () => of([{ Id: 0, Nombre: 'No vuela' }, { Id: 4, Nombre: 'Buena' }]) } },
                { provide: IdiomaService, useValue: { getIdiomas: () => of([{ Id: 4, Nombre: 'Celestial' }]) } },
                { provide: RasgoService, useValue: { getRasgos: () => of([{ Id: 0, Nombre: 'Ninguno' }, { Id: 1, Nombre: 'Aura amenazadora' }]) } },
                { provide: PlantillaService, useValue: { getPlantillas: () => of([{ Id: 1, Nombre: 'Celestial' }]) } },
                { provide: ConjuroService, useValue: { getConjuros: () => of([{ Id: 20, Nombre: 'Luz' }]) } },
                {
                    provide: DoteService, useValue: {
                        getDotes: () => of([{ Id: 10, Nombre: 'Soltura con un arma', Extras_disponibles: { Armas: [{ Id: 3, Nombre: 'Espada larga' }] } }]),
                    },
                },
                { provide: HabilidadService, useValue: { getHabilidades: () => of([{ Id_habilidad: 5, Nombre: 'Avistar', Extras: [] }]) } },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: (recurso: string) => puede && recurso === 'subtipos',
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevoSubtipoComponent);
        component = fixture.componentInstance;
        component.modo = modo;
        component.idSubtipo = get ? Number(get.Id) : null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => {
        puede = true;
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    describe('ida y vuelta (todos los subtipos de rol_dev)', () => {
        IDA_Y_VUELTA_CRIATURAS_MUNDO.subtipos.forEach(({ id, nombre, get, cuerpo }) => {
            it(`«${nombre}» (${id}): cargado y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                await montar('editar', get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
            });
        });
    });

    it('un subtipo nuevo: sus listas, una dote dos veces con extras distintos y los textos sin dato a `null`', async () => {
        await montar();
        subtipoSvc.crearSubtipo.and.resolveTo({ message: 'Subtipo creado exitosamente', id: 88, entrada: normalizeSubtipoDetalle({ Id: 88, Nombre: 'Nuevo' }) });
        component.form.patchValue({ nombre: 'Nuevo', id_manual: 47, pagina: 1, id_alineamiento: 2, nadar: 30, rd: ' 5/plata ' });
        component.anadirId('idiomas', 4);
        component.anadirId('rasgos', 1);
        component.anadirId('rasgos', 1);
        component.anadirFila('dotes', 10);
        component.anadirFila('dotes', 10);
        (component.listas.dotes[1] as any).id_extra = 3;
        component.anadirFila('habilidades', 5);
        component.anadirFila('sortilegas', 20);

        await component.guardar();

        const cuerpo = subtipoSvc.crearSubtipo.calls.mostRecent().args[0];
        expect(cuerpo.subtipo).toEqual(jasmine.objectContaining({ nombre: 'Nuevo', nadar: 30, rd: '5/plata', ca: null, tesoro: null, id_maniobrabilidad: null, heredada: true }));
        expect(cuerpo.idiomas).toEqual([4]);
        expect(cuerpo.rasgos).toEqual([1]);
        expect(cuerpo.dotes).toEqual([{ id_dote: 10, id_extra: -1 }, { id_dote: 10, id_extra: 3 }]);
        expect(cuerpo.habilidades).toEqual([{ id_habilidad: 5, id_extra: -1, cantidad: 0, varios: null }]);
        expect(cuerpo.sortilegas).toEqual([{ id_conjuro: 20, nivel_lanzador: 1, usos_diarios: null }]);
        expect(component.listas.dotes).toEqual([]);
    });

    it('lo que da: sin extra (la API lo da `null`) vuelve como -1, y las habilidades personalizadas se nombran sin editarse', async () => {
        await montar('editar', {
            Id: 88, Nombre: 'Subtipo de prueba', Descripcion: '', Manual: { Id: 47, Nombre: 'Manual de monstruos 1', Pagina: 1 },
            Heredada: true, Oficial: false, Alineamiento: { Id: 2 }, Maniobrabilidad: null, Movimientos: { Nadar: 30 },
            Modificadores_caracteristicas: {}, Minimos_caracteristicas: {}, Voluntad: 2, Rd: '5/plata',
            Idiomas: [], Rasgos: [], Plantillas: [],
            Dotes: [{ Dote: { Id: 10, Nombre: 'Desarme mejorado' }, Contexto: { Entidad: 'subtipo', Id_subtipo: 88, Id_extra: null, Extra: null } }],
            Habilidades: {
                Base: [{ Id_habilidad: 5, Habilidad: 'Avistar', Id_extra: null, Extra: null, Cantidad: 8, Varios: null }],
                Custom: [{ Id_habilidad: 2, Habilidad: 'Autohipnosis', Cantidad: 2 }],
            },
            Sortilegas: [{ Conjuro: { Id: 20, Nombre: 'Luz' }, Nivel_lanzador: 5, Usos_diarios: '1/día' }],
        });

        const cuerpo = component.cuerpo();
        expect(component.edicion.hayCambios).toBeFalse();
        expect(cuerpo.dotes).toEqual([{ id_dote: 10, id_extra: -1 }]);
        expect(cuerpo.habilidades).toEqual([{ id_habilidad: 5, id_extra: -1, cantidad: 8, varios: null }]);
        expect(cuerpo.sortilegas).toEqual([{ id_conjuro: 20, nivel_lanzador: 5, usos_diarios: '1/día' }]);
        expect(cuerpo.subtipo).toEqual(jasmine.objectContaining({ nadar: 30, voluntad: 2, rd: '5/plata', ca: null, id_maniobrabilidad: null }));
        expect(component.personalizadas).toEqual(['Autohipnosis +2']);
    });

    it('el error de un campo de la API salta a su paso', async () => {
        await montar();
        subtipoSvc.crearSubtipo.and.rejectWith(new ProfileApiError("'subtipo.nadar' no puede ser menor que 0.", 'peticion_no_valida', 400, 'subtipo.nadar'));
        component.form.patchValue({ nombre: 'Nuevo', id_manual: 47, pagina: 1, id_alineamiento: 2 });

        await component.guardar();

        expect(component.pasoActual).toBe(1);
        expect(component.form.controls.nadar.errors?.['api']).toContain('nadar');
    });

    it('el formulario inválido lleva al paso del primer error', async () => {
        await montar();
        component.pasoActual = 2;

        await component.guardar();

        expect(subtipoSvc.crearSubtipo).not.toHaveBeenCalled();
        expect(component.pasoActual).toBe(0);
    });

    it('sin permiso no guarda', async () => {
        puede = false;
        await montar();

        await component.guardar();

        expect(subtipoSvc.crearSubtipo).not.toHaveBeenCalled();
    });
});
