import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesConjuroComponent } from './detalles-conjuro.component';

describe('DetallesConjuroComponent', () => {
    let component: DetallesConjuroComponent;
    let fixture: ComponentFixture<DetallesConjuroComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesConjuroComponent],
            providers: [
                {
                    provide: ManualDetalleNavigationService,
                    useValue: { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesConjuroComponent);
        component = fixture.componentInstance;
    });

    it('oculta descriptores y bloques vacíos en un conjuro base', () => {
        component.conjuro = {
            Id: 100,
            Nombre: 'Desvío de rayos',
            Descripcion: 'Protege frente a ataques de rayo dirigidos al objetivo.',
            Tiempo_lanzamiento: '1 acción gratuita',
            Alcance: 'Personal',
            Escuela: { Id: 4, Nombre: 'Abjuración', Nombre_especial: '', Prohibible: true },
            Disciplina: { Id: 0, Nombre: '', Nombre_especial: '', Subdisciplinas: [] },
            Manual: 'Compendio de conjuros, página: 79',
            Objetivo: 'Tú',
            Efecto: 'Desvía rayos dirigidos al objetivo',
            Area: '',
            Arcano: true,
            Divino: false,
            Psionico: false,
            Alma: false,
            Duracion: '1 min/nivel',
            Tipo_salvacion: 'Ninguno',
            Resistencia_conjuros: false,
            Resistencia_poderes: false,
            Descripcion_componentes: '',
            Permanente: false,
            Puntos_poder: 0,
            Descripcion_aumentos: '',
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 1, Clase: 'Mago', Nivel: 4, Espontaneo: false }],
            Nivel_dominio: [{ Id_dominio: 0, Dominio: '', Nivel: 0, Espontaneo: false }],
            Nivel_disciplinas: [{ Id_disciplina: 0, Disciplina: '', Nivel: 0, Espontaneo: false }],
            Componentes: [{ Componente: 'Verbal', Id_componente: 1 }],
            Oficial: true,
        } as any;

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;

        expect(component.tieneDescriptores).toBeFalse();
        expect(component.muestraAumentos).toBeFalse();
        expect(component.nivelesDominioVisibles).toEqual([]);
        expect(component.nivelesDisciplinaVisibles).toEqual([]);
        expect(html).not.toContain('Descripción de los aumentos');
        expect(html).not.toContain('Niveles de acceso según dominio');
        expect(html).not.toContain('Niveles de acceso según disciplina');
    });

    it('muestra sólo bloques psiónicos válidos y renombra componentes a despliegues', () => {
        component.conjuro = {
            Id: 101,
            Nombre: 'Empuje mental',
            Descripcion: 'Empuja al objetivo con una descarga psiónica.',
            Tiempo_lanzamiento: '1 acción estándar',
            Alcance: 'Medio',
            Escuela: { Id: 0, Nombre: '', Nombre_especial: '', Prohibible: false },
            Disciplina: { Id: 8, Nombre: 'Psicoquinesis', Nombre_especial: '', Subdisciplinas: [] },
            Manual: 'Manual de psiónica',
            Objetivo: 'Una criatura',
            Efecto: '',
            Area: '',
            Arcano: false,
            Divino: false,
            Psionico: true,
            Alma: false,
            Duracion: 'Instantánea',
            Tipo_salvacion: '',
            Resistencia_conjuros: false,
            Resistencia_poderes: true,
            Descripcion_componentes: 'Contacto visual y concentración.',
            Permanente: false,
            Puntos_poder: 3,
            Descripcion_aumentos: 'Aumenta el empuje por 2 PP.',
            Descriptores: [{ Id: 2, Nombre: 'Fuerza' }],
            Nivel_clase: [{ Id_clase: 12, Clase: 'Psiónico', Nivel: 2, Espontaneo: false }],
            Nivel_dominio: [{ Id_dominio: 5, Dominio: 'Fuego', Nivel: 3, Espontaneo: false }],
            Nivel_disciplinas: [{ Id_disciplina: 8, Disciplina: 'Psicoquinesis', Nivel: 2, Espontaneo: false }],
            Componentes: [{ Componente: 'Mental', Id_componente: 10 }],
            Oficial: true,
        } as any;

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;

        expect(component.tieneDescriptores).toBeTrue();
        expect(component.muestraAumentos).toBeTrue();
        expect(component.tituloComponentes).toBe('Despliegues');
        expect(component.nivelesDominioVisibles).toEqual([]);
        expect(component.nivelesDisciplinaVisibles.length).toBe(1);
        expect(html).toContain('Descripción de los aumentos');
        expect(html).toContain('Niveles de acceso según disciplina');
        expect(html).not.toContain('Niveles de acceso según dominio');
        expect(html).toContain('Despliegues');
    });
});
