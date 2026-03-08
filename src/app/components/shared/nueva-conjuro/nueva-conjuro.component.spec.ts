import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
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

        const payload = (component as any).buildPayload('uid-1');

        expect(payload.conjuro.variante).toBe('base');
        expect(payload.conjuro.id_escuela).toBe(4);
        expect(payload.conjuro.arcano).toBeTrue();
        expect(payload.niveles_clase).toEqual([{ id_clase: 10, nivel: 1, espontaneo: false }]);
        expect(payload.niveles_dominio).toEqual([{ id_dominio: 5, nivel: 1, espontaneo: true }]);
        expect(payload.componentes).toEqual([1, 2]);
    });

    it('muestra todos los manuales y preselecciona compendio de conjuros', () => {
        expect(component.manuales.map((manual) => manual.Nombre)).toEqual([
            'Compendio de conjuros',
            'Manual básico',
            'Manual sin conjuros',
        ]);
        expect(component.form.controls.id_manual.value).toBe(3);
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

        const payload = (component as any).buildPayload('uid-1');

        expect(payload.conjuro.variante).toBe('psionico');
        expect(payload.conjuro.id_disciplina).toBe(8);
        expect(payload.conjuro.id_subdisciplina).toBe(81);
        expect(payload.conjuro.puntos_poder).toBe(3);
        expect(payload.niveles_disciplina).toEqual([{ id_disciplina: 8, nivel: 2, espontaneo: false }]);
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
});
