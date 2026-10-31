import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { DetallesConjuroComponent } from './detalles-conjuro.component';
import { lectorFicha } from 'src/testing/ficha-detalle';

describe('DetallesConjuroComponent', () => {
    let component: DetallesConjuroComponent;
    let fixture: ComponentFixture<DetallesConjuroComponent>;
    let usuario: { can: jasmine.Spy };
    let manualNav: { abrirDetalleManual: jasmine.Spy };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, datos, tipoCabecera } = lectorFicha(elemento);

    beforeEach(async () => {
        manualNav = { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') };
        usuario = { can: jasmine.createSpy('can').and.returnValue(false) };
        await TestBed.configureTestingModule({
            declarations: [DetallesConjuroComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [
                { provide: ManualDetalleNavigationService, useValue: manualNav },
                { provide: UserService, useValue: usuario },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesConjuroComponent);
        component = fixture.componentInstance;
    });

    function desvioDeRayos(extra: object = {}): any {
        return {
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
            ...extra,
        };
    }

    function empujeMental(): any {
        return {
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
        };
    }

    it('el tipo de un poder lleva su subdisciplina entre paréntesis', () => {
        component.conjuro = {
            ...empujeMental(),
            Disciplina: { Id: 2, Nombre: 'Metacreatividad', Nombre_especial: 'Formador', Subdisciplinas: [{ Id: 1, Nombre: 'Creación' }] },
            Descriptores: [],
        };
        fixture.detectChanges();

        expect(tipoCabecera()).toBe('Poder psiónico · Metacreatividad (Creación)');
    });

    it('oculta descriptores y bloques vacíos en un conjuro base', () => {
        component.conjuro = desvioDeRayos();
        fixture.detectChanges();

        const html = texto();

        expect(component.tieneDescriptores).toBeFalse();
        expect(component.muestraAumentos).toBeFalse();
        expect(component.nivelesDominioVisibles).toEqual([]);
        expect(component.nivelesDisciplinaVisibles).toEqual([]);
        expect(html).not.toContain('Descripción de los aumentos');
        expect(html).not.toContain('Descripción de los componentes');
        expect(html).not.toContain('Nivel por dominio');
        expect(html).not.toContain('Nivel por disciplina');
        expect(html).not.toContain('Área');
        expect(html).not.toContain('Resistencia a poderes');
        expect(html).not.toContain('Puntos de poder');
    });

    it('enseña la ficha común: tipo, nombre, manual, datos clave, descripción y niveles a la vista', () => {
        component.conjuro = desvioDeRayos({ Descriptores: [{ Id: 3, Nombre: 'Fuerza' }], Permanente: true });
        fixture.detectChanges();

        const cabecera = elemento().querySelector('.ficha-cabecera') as HTMLElement;
        expect(cabecera.querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Conjuro arcano · Abjuración [Fuerza]');
        expect(cabecera.querySelector('h1')?.textContent?.trim()).toBe('Desvío de rayos');
        expect(cabecera.querySelector('.ficha-cabecera__manual')?.textContent).toContain('Compendio de conjuros · pág. 79');
        expect(Array.from(cabecera.querySelectorAll('.ficha-etiqueta')).map((e) => e.textContent?.trim()))
            .toEqual(['Puede hacerse permanente', 'Oficial']);

        expect(datos()).toEqual([
            ['Tiempo de lanzamiento', '1 acción gratuita'],
            ['Componentes', 'Verbal'],
            ['Alcance', 'Personal'],
            ['Duración', '1 min/nivel'],
            ['Objetivo', 'Tú'],
            ['Efecto', 'Desvía rayos dirigidos al objetivo'],
            ['Tirada de salvación', 'Ninguno'],
            ['Resistencia a conjuros', 'No'],
        ]);

        expect(titulos('.ficha-principal')).toEqual(['Descripción']);
        expect(texto()).toContain('Protege frente a ataques de rayo');
        expect(titulos('.ficha-columna-lateral')).toEqual(['Nivel por clase']);
        const fila = elemento().querySelector('.ficha-pares tr') as HTMLElement;
        expect(fila.textContent).toContain('Mago');
        expect(fila.textContent).toContain('4');
        expect(elemento().querySelector('mat-expansion-panel')).toBeNull();
        expect(elemento().querySelector('mat-chip')).toBeNull();
    });

    it('el alcance 0 es Personal y la resistencia a conjuros sí', () => {
        component.conjuro = desvioDeRayos({ Alcance: '0', Resistencia_conjuros: true });
        fixture.detectChanges();
        expect(datos()).toContain(['Alcance', 'Personal']);
        expect(datos()).toContain(['Resistencia a conjuros', 'Sí']);
    });

    it('no enseña los null de la API', () => {
        component.conjuro = desvioDeRayos({
            Tiempo_lanzamiento: null, Objetivo: null, Efecto: null, Duracion: null, Tipo_salvacion: null, Alcance: null,
            Descripcion: null, Componentes: null, Nivel_clase: null, Escuela: null,
        });
        fixture.detectChanges();

        expect(datos()).toEqual([['Resistencia a conjuros', 'No']]);
        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Conjuro arcano');
        expect((elemento().querySelector('.ficha-principal') as HTMLElement).classList).toContain('ficha-oculta');
        expect(texto()).not.toContain('Nivel por clase');
        expect(texto()).not.toContain('null');
    });

    it('marca los niveles espontáneos', () => {
        component.conjuro = desvioDeRayos({ Nivel_clase: [{ Id_clase: 2, Clase: 'Clérigo', Nivel: 1, Espontaneo: true }] });
        fixture.detectChanges();
        expect(elemento().querySelector('.ficha-pares')?.textContent).toContain('(espontáneo)');
    });

    it('muestra sólo bloques psiónicos válidos y renombra componentes a despliegues', () => {
        component.conjuro = empujeMental();
        fixture.detectChanges();

        const html = texto();

        expect(component.tieneDescriptores).toBeTrue();
        expect(component.muestraAumentos).toBeTrue();
        expect(component.tituloComponentes).toBe('Despliegues');
        expect(component.nivelesDominioVisibles).toEqual([]);
        expect(component.nivelesDisciplinaVisibles.length).toBe(1);
        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Poder psiónico · Psicoquinesis [Fuerza]');
        expect(datos()).toContain(['Despliegues', 'Mental']);
        expect(datos()).toContain(['Resistencia a poderes', 'Sí']);
        expect(datos()).toContain(['Puntos de poder', '3']);
        expect(datos().some(([etiqueta]) => etiqueta.startsWith('Resistencia a conjuros'))).toBeFalse();
        expect(titulos('.ficha-principal')).toEqual(['Descripción', 'Descripción de los despliegues', 'Descripción de los aumentos']);
        expect(html).toContain('Contacto visual y concentración.');
        expect(html).toContain('Nivel por disciplina');
        expect(html).not.toContain('Nivel por dominio');
    });

    it('como aptitud sortílega enseña de quién es, su nivel de lanzador, sus usos y su origen', () => {
        component.sortilega = {
            ap: {
                Conjuro: desvioDeRayos(),
                Nivel_lanzador: 5,
                Usos_diarios: '3/día',
                Descripcion: 'Solo contra rayos de fuego.',
                Dgs_necesarios: 0,
                Origen: 'Raza drow',
            },
            fuente: 'Eren',
        };
        fixture.detectChanges();

        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Aptitud sortílega · Conjuro arcano · Abjuración');
        expect(titulos('.ficha-columna-lateral')[0]).toBe('Aptitud sortílega de Eren');
        const lateral = elemento().querySelector('.ficha-lateral-tarjeta') as HTMLElement;
        expect(lateral.textContent).toContain('Nivel de lanzador');
        expect(lateral.textContent).toContain('3/día');
        expect(lateral.textContent).toContain('Raza drow');
        expect(lateral.textContent).toContain('Solo contra rayos de fuego.');
        expect(lateral.textContent).not.toContain('Dados de golpe necesarios');
    });

    it('pulsar el manual abre su detalle', () => {
        component.conjuro = desvioDeRayos();
        fixture.detectChanges();
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith('Compendio de conjuros, página: 79');
    });

    it('enseña el lápiz «Modificar» solo con permiso de conjuros, si alguien lo escucha y no en una sortílega', () => {
        const abiertos: number[] = [];
        component.modificar.subscribe((conjuro) => abiertos.push(conjuro.Id));
        component.conjuro = desvioDeRayos();
        fixture.detectChanges();
        expect(texto()).not.toContain('Modificar');
        expect(usuario.can).toHaveBeenCalledWith('conjuros', 'create');

        usuario.can.and.returnValue(true);
        fixture.detectChanges();
        const lapiz = Array.from(elemento().querySelectorAll('button')).find((boton) => boton.textContent?.includes('Modificar'));
        expect(lapiz).toBeTruthy();
        lapiz!.click();
        expect(abiertos).toEqual([component.conjuro.Id]);
    });
});
