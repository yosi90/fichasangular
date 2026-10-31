import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroCatalogosService } from 'src/app/services/conjuro-catalogos.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { DominioService } from 'src/app/services/dominio.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { ManualService } from 'src/app/services/manual.service';
import { SubdisciplinaConjurosService } from 'src/app/services/subdisciplina-conjuros.service';
import { UserService } from 'src/app/services/user.service';
import { NuevaConjuroComponent } from './nueva-conjuro.component';
import { normalizeConjuroEditableApi } from 'src/app/services/utils/conjuro-mapper';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { IDA_Y_VUELTA } from 'src/testing/ida-y-vuelta-dotes-conjuros';
import { cuerpoComparable } from 'src/testing/cuerpo-de-catalogo';

describe('NuevaConjuroComponent', () => {
    let component: NuevaConjuroComponent;
    let fixture: ComponentFixture<NuevaConjuroComponent>;

    const conjuroSvcMock = {
        getConjuros: () => of([
            { Id: 1, Nombre: 'Bola de fuego' },
        ]),
        crearConjuro: jasmine.createSpy('crearConjuro').and.resolveTo({ message: 'ok', idConjuro: 22, uid: 'uid-1' }),
    };

    beforeEach(async () => {
        spyOn(Swal, 'fire').and.resolveTo({} as any);

        await TestBed.configureTestingModule({
            declarations: [NuevaConjuroComponent],
            imports: [
                ReactiveFormsModule,
                NoopAnimationsModule,
                MatAutocompleteModule,
                MatButtonModule,
                MatCheckboxModule,
                MatChipsModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatSelectModule,
                MatSlideToggleModule,
            ],
            providers: [
                { provide: ConjuroService, useValue: conjuroSvcMock },
                { provide: ConjuroCatalogosService, useValue: {
                    getComponentes: () => of([
                        { Id: 1, Nombre: 'Verbal' },
                        { Id: 2, Nombre: 'Somático' },
                        { Id: 3, Nombre: 'Material' },
                        { Id: 4, Nombre: 'Foco' },
                        { Id: 5, Nombre: 'Foco divino' },
                        { Id: 6, Nombre: 'Experiencia' },
                        { Id: 7, Nombre: 'Material o foco divino' },
                        { Id: 8, Nombre: 'Foco o foco divino' },
                        { Id: 9, Nombre: 'Auditivo' },
                        { Id: 10, Nombre: 'Mental' },
                        { Id: 11, Nombre: 'Olfavito' },
                        { Id: 12, Nombre: 'Visual' },
                    ]),
                    getTiemposLanzamiento: () => of([{ Id: 1, Nombre: '1 acción estándar' }]),
                    getAlcances: () => of([{ Id: 1, Nombre: 'Personal' }]),
                    getDescriptores: () => of([{ Id: 3, Nombre: 'Fuego' }]),
                } },
                { provide: ManualService, useValue: {
                    getManuales: () => of([
                        { Id: 1, Nombre: 'Manual básico', Incluye_conjuros: true },
                        { Id: 2, Nombre: 'Manual sin conjuros', Incluye_conjuros: false },
                        { Id: 3, Nombre: 'Compendio de conjuros', Incluye_conjuros: false },
                    ]),
                } },
                { provide: EscuelaConjurosService, useValue: {
                    getEscuelas: () => of([{ Id: 4, Nombre: 'Evocación', Nombre_especial: 'Evocador', Prohibible: true }]),
                } },
                { provide: DisciplinaConjurosService, useValue: {
                    getDisciplinas: () => of([
                        { Id: 8, Nombre: 'Psicoquinesis', Nombre_especial: 'Psicoquineta', Subdisciplinas: [{ Id: 81, Nombre: 'Telecinesis' }] },
                        { Id: 9, Nombre: 'Telepatía', Nombre_especial: 'Telepata', Subdisciplinas: [] },
                    ]),
                } },
                { provide: SubdisciplinaConjurosService, useValue: {
                    getSubdisciplinas: () => of([
                        { Id: 81, Nombre: 'Telecinesis', id_disciplina: 8 },
                        { Id: 91, Nombre: 'Escudriñamiento', id_disciplina: 13 },
                    ]),
                } },
                { provide: DominioService, useValue: {
                    getDominios: () => of([{ Id: 5, Nombre: 'Fuego', Oficial: true }]),
                } },
                { provide: ClaseService, useValue: {
                    getClases: () => of([
                        { Id: 10, Nombre: 'Mago', Conjuros: { Arcanos: true, Divinos: false, Psionicos: false } },
                        { Id: 11, Nombre: 'Clérigo', Conjuros: { Arcanos: false, Divinos: true, Psionicos: false } },
                        { Id: 12, Nombre: 'Psiónico', Conjuros: { Arcanos: false, Divinos: false, Psionicos: true } },
                    ]),
                } },
                { provide: UserService, useValue: {
                    acl$: of({}),
                    isLoggedIn$: of(true),
                    CurrentUserUid: 'uid-1',
                    can: () => true,
                    getPermissionDeniedMessage: () => 'No dispones de los permisos necesarios para realizar esta acción. Puedes solicitar convertirte en master desde tu perfil.',
                } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(NuevaConjuroComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('construye payload correcto para variante base', () => {
        component.form.patchValue({
            nombre: 'Manos ardientes',
            descripcion: 'Una oleada breve de fuego mágico.',
            id_manual: 1,
            pagina: 10,
            id_tiempo_lanz: 1,
            id_alcance: 1,
            efecto: 'Cono de fuego',
            duracion: 'Instantánea',
            tipo_salvacion: 'Reflejos mitad',
            descripcion_componentes: 'Gesto breve',
            arcano: true,
            divino: false,
            id_escuela: 4,
            resistencia_conjuros: true,
        });
        component.componentesSeleccionados = [1, 2];
        component.descriptoresSeleccionados = [3];
        component.nivelesBaseClase = [{ uid: 'a', id: 10, nivel: 1, espontaneo: false }];
        component.nivelesBaseDominio = [{ uid: 'b', id: 5, nivel: 1, espontaneo: true }];

        const payload = (component as any).buildPayload();

        expect(payload.conjuro.variante).toBe('base');
        expect(payload.conjuro.id_escuela).toBe(4);
        expect(payload.conjuro.arcano).toBeTrue();
        expect(payload.niveles_clase).toEqual([{ id_clase: 10, nivel: 1, espontaneo: false }]);
        expect(payload.niveles_dominio).toEqual([{ id_dominio: 5, nivel: 1, espontaneo: true }]);
        expect(payload.componentes).toEqual([1, 2]);
        expect('uid' in payload).toBeFalse();
    });

    it('muestra todos los manuales y preselecciona compendio de conjuros', () => {
        expect(component.manuales.map((manual) => manual.Nombre)).toEqual([
            'Compendio de conjuros',
            'Manual básico',
            'Manual sin conjuros',
        ]);
        expect(component.form.controls.id_manual.value).toBe(3);
    });

    it('el manual sale del buscador común de catálogos, con sus opciones', () => {
        expect(component.manualesOpciones.map((opcion) => opcion.id)).toEqual([3, 1, 2]);
        component.seleccionarManual(1);
        expect(component.form.controls.id_manual.value).toBe(1);
    });

    it('los costes del componente material y de PX van en el cuerpo solo si tienen un número', () => {
        component.form.patchValue({ coste_material: 100.5, coste_px: null });
        const conCoste = (component as any).buildPayload();
        expect(conCoste.conjuro.coste_material).toBe(100.5);
        expect('coste_px' in conCoste.conjuro).toBeFalse();
    });

    it('permite dejar vacío el tiro de salvación', () => {
        component.form.patchValue({
            nombre: 'Armadura ígnea',
            descripcion: 'Una barrera breve de brasas orbitando alrededor del lanzador.',
            id_manual: 3,
            pagina: 20,
            id_tiempo_lanz: 1,
            id_alcance: 1,
            duracion: '1 asalto',
            tipo_salvacion: '',
            arcano: true,
            divino: false,
            id_escuela: 4,
        });

        expect(component.form.controls.tipo_salvacion.valid).toBeTrue();
        expect(component.form.valid).toBeTrue();
    });

    it('construye payload correcto para variante psionica', () => {
        component.activarPsionico();
        component.form.patchValue({
            nombre: 'Empuje mental',
            descripcion: 'Empuja al objetivo con una onda psiónica.',
            id_manual: 1,
            pagina: 14,
            id_tiempo_lanz: 1,
            id_alcance: 1,
            duracion: 'Instantánea',
            tipo_salvacion: 'Fortaleza niega',
            descripcion_componentes: 'Concentración plena',
            id_disciplina: 8,
            id_subdisciplina: 81,
            puntos_poder: 3,
            descripcion_aumentos: 'Aumenta el empuje por 2 PP.',
            resistencia_poderes: true,
        });
        component.componentesSeleccionados = [2];
        component.nivelesPsiClase = [{ uid: 'a', id: 12, nivel: 2, espontaneo: false }];
        component.nivelesPsiDisciplina = [{ uid: 'b', id: 8, nivel: 2, espontaneo: false }];

        const payload = (component as any).buildPayload();

        expect(payload.conjuro.variante).toBe('psionico');
        expect(payload.conjuro.id_disciplina).toBe(8);
        expect(payload.conjuro.id_subdisciplina).toBe(81);
        expect(payload.conjuro.puntos_poder).toBe(3);
        expect(payload.niveles_disciplina).toEqual([{ id_disciplina: 8, nivel: 2, espontaneo: false }]);
        expect('uid' in payload).toBeFalse();
    });

    it('resetea la subdisciplina cuando cambia la disciplina', () => {
        component.activarPsionico();
        component.form.patchValue({
            id_disciplina: 8,
            id_subdisciplina: 81,
        });

        component.form.controls.id_disciplina.setValue(9);

        expect(component.subdisciplinasActuales).toEqual([]);
        expect(component.form.controls.id_subdisciplina.value).toBe(0);
    });

    it('normaliza subdisciplinas cuando llegan como objeto indexado', () => {
        component.subdisciplinasCatalogo = [];
        component.disciplinas = [
            {
                Id: 13,
                Nombre: 'Psicodetección',
                Nombre_especial: 'Psicodetector',
                Subdisciplinas: {
                    a: { id: 131, nombre: 'Escudriñamiento' },
                    b: { i: 132, n: 'Clarisentencia' },
                } as any,
            } as any,
        ];
        component.activarPsionico();

        component.form.controls.id_disciplina.setValue(13);

        expect(component.subdisciplinasActuales).toEqual([
            { Id: 132, Nombre: 'Clarisentencia' },
            { Id: 131, Nombre: 'Escudriñamiento' },
        ]);
    });

    it('usa la cache plana de subdisciplinas por disciplina', () => {
        component.activarPsionico();

        component.form.controls.id_disciplina.setValue(13);

        expect(component.subdisciplinasActuales).toEqual([
            { Id: 91, Nombre: 'Escudriñamiento' },
        ]);
    });

    it('filtra componentes por variante', () => {
        expect(component.tituloComponentes).toBe('Componentes');
        expect(component.componentesCatalogoActual.map((item) => item.Nombre)).toEqual([
            'Experiencia',
            'Foco',
            'Foco divino',
            'Foco o foco divino',
            'Material',
            'Material o foco divino',
            'Somático',
            'Verbal',
        ]);

        component.activarPsionico();

        expect(component.tituloComponentes).toBe('Despliegues');
        expect(component.componentesCatalogoActual.map((item) => item.Nombre)).toEqual([
            'Auditivo',
            'Material',
            'Mental',
            'Olfativo',
            'Visual',
        ]);
    });

    it('al cambiar a psionico elimina componentes no compatibles', () => {
        component.componentesSeleccionados = [1, 2, 9, 11];

        component.activarPsionico();

        expect(component.componentesSeleccionados).toEqual([9, 11]);
    });

    it('detecta nombre duplicado normalizado', () => {
        component.form.controls.nombre.setValue('bola DE fuego');

        const error = (component as any).validarReglasDominio();

        expect(error).toContain('Ya existe un conjuro');
    });

    it('marca error en base si no es arcano ni divino', () => {
        component.form.patchValue({
            arcano: false,
            divino: false,
            id_escuela: 4,
        });

        const error = (component as any).validarReglasDominio();

        expect(error).toContain('arcano, divino o ambos');
    });

    it('marca error en psionico si falta disciplina', () => {
        component.activarPsionico();
        component.form.patchValue({
            id_disciplina: 0,
            puntos_poder: 1,
        });

        const error = (component as any).validarReglasDominio();

        expect(error).toContain('disciplina válida');
    });

    it('psionico desactiva arcano y divino', () => {
        component.form.patchValue({
            arcano: true,
            divino: true,
        });

        component.activarPsionico();

        expect(component.varianteActiva).toBe('psionico');
        expect(component.form.controls.arcano.value).toBeFalse();
        expect(component.form.controls.divino.value).toBeFalse();
    });

    it('activar arcano desde psionico vuelve a variante base', () => {
        component.activarPsionico();

        component.toggleNaturaleza('arcano');

        expect(component.varianteActiva).toBe('base');
        expect(component.form.controls.arcano.value).toBeTrue();
        expect(component.form.controls.divino.value).toBeFalse();
    });

    it('usa el mensaje amigable de permisos cuando no puede crear', async () => {
        const userSvc = TestBed.inject(UserService) as any;
        userSvc.can = () => false;
        component['recalcularPermisos']();

        await component.guardarConjuro();

        expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
            title: 'Permisos insuficientes',
            text: 'No dispones de los permisos necesarios para realizar esta acción. Puedes solicitar convertirte en master desde tu perfil.',
        }));
    });

    describe('«Modificar conjuro»', () => {
        // TestBed inyecta una copia del doble (`useValue`): los espías van en la instancia inyectada.
        const servicio = () => TestBed.inject(ConjuroService) as any;

        async function abrir(get: any): Promise<void> {
            servicio().getConjuroFresco = jasmine.createSpy('getConjuroFresco').and.returnValue(of(normalizeConjuroEditableApi(get)));
            // La subdisciplina del conjuro, en el catálogo de prueba (el de verdad las trae todas).
            if (Number(get.Id_subdisciplina) > 0)
                component.subdisciplinasCatalogo = [...component.subdisciplinasCatalogo,
                    { Id: Number(get.Id_subdisciplina), Nombre: 'Subdisciplina', id_disciplina: Number(get.Disciplina?.Id) } as any];
            component.modo = 'editar';
            component.idConjuro = Number(get.Id);
            component.ngOnChanges({ idConjuro: {} as any });
            await fixture.whenStable();
        }

        IDA_Y_VUELTA.conjuros.forEach(({ id, nombre, get, cuerpo }) => {
            it(`guardar sin cambios «${nombre}» (${id}) manda el cuerpo que devuelve el mismo GET`, async () => {
                await abrir(get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(cuerpoComparable((component as any).buildPayload(), cuerpo)).toEqual(cuerpoComparable(cuerpo, cuerpo));
            });
        });

        it('enseña los componentes del conjuro aunque no sean de la lista de su variante (la Esencia de Incarnum)', async () => {
            await abrir({ ...IDA_Y_VUELTA.conjuros[0].get, Componentes: [{ Id_componente: '17', Componente: 'Esencia' }] });
            (component as any).componentesCatalogo = [...(component as any).componentesCatalogo, { Id: 17, Nombre: 'Esencia' }];
            expect(component.componentesCatalogoActual.some((item) => item.Id === 17)).toBeTrue();
            expect((component as any).buildPayload().componentes).toEqual([17]);
        });

        it('guarda con PUT, avisa con el aviso común y devuelve el conjuro de la API', async () => {
            const { get } = IDA_Y_VUELTA.conjuros[0];
            servicio().actualizarConjuro = jasmine.createSpy('actualizarConjuro')
                .and.resolveTo({ message: 'Conjuro actualizado exitosamente', idConjuro: Number(get.Id), conjuro: normalizeConjuroEditableApi(get) });
            await abrir(get);
            const actualizado = jasmine.createSpy('conjuroActualizado');
            component.conjuroActualizado.subscribe(actualizado);

            await component.guardarConjuro();

            expect(servicio().actualizarConjuro).toHaveBeenCalledWith(Number(get.Id), jasmine.any(Object));
            expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                icon: 'success', title: 'Conjuro actualizado', text: 'Conjuro actualizado exitosamente',
            }));
            expect(actualizado).toHaveBeenCalledWith(jasmine.objectContaining({ Id: Number(get.Id) }));
        });

        it('el error de la API va al marco y, con su campo, al campo', async () => {
            const { get } = IDA_Y_VUELTA.conjuros[0];
            servicio().actualizarConjuro = jasmine.createSpy('actualizarConjuro').and.rejectWith(
                new ProfileApiError('Ya existe un conjuro con ese nombre.', 'nombre_duplicado', 409, 'conjuro.nombre'));
            await abrir(get);

            await component.guardarConjuro();

            expect(component.errores.global).toBe('Ya existe un conjuro con ese nombre.');
            expect(component.errorDe('nombre', 'por defecto')).toBe('Ya existe un conjuro con ese nombre.');
        });
    });
});
