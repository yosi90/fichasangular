import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { SubtipoDetalle } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesSubtipoComponent } from './detalles-subtipo.component';
import { lectorFicha, limpio } from 'src/testing/ficha-detalle';

function caracteristicas(): SubtipoDetalle['Modificadores_caracteristicas'] {
    return { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 };
}

function crearSubtipo(partial: Partial<SubtipoDetalle> = {}): SubtipoDetalle {
    return {
        Id: 4,
        Nombre: 'Fuego',
        Descripcion: 'Criaturas del fuego.',
        Manual: { Id: 2, Nombre: 'Manual de monstruos', Pagina: 312 },
        Heredada: true,
        Oficial: true,
        Modificadores_caracteristicas: caracteristicas(),
        Minimos_caracteristicas: caracteristicas(),
        Ajuste_nivel: 0,
        Presa: 0,
        Fortaleza: 2,
        Reflejos: 0,
        Voluntad: 0,
        Iniciativa: 0,
        Ataque_base: 0,
        Ca: '',
        Rd: '',
        Rc: '',
        Re: 'Inmunidad al fuego',
        Cd: '',
        Tesoro: null as any,
        Movimientos: { Correr: 0, Nadar: 0, Volar: 0, Trepar: 0, Escalar: 0 },
        Maniobrabilidad: null as any,
        Alineamiento: null as any,
        Idiomas: [],
        Dotes: [],
        Habilidades: { Base: [], Custom: [] },
        Sortilegas: [],
        Rasgos: [],
        Plantillas: [],
        ...partial,
    };
}

describe('DetallesSubtipoComponent', () => {
    let component: DetallesSubtipoComponent;
    let fixture: ComponentFixture<DetallesSubtipoComponent>;
    let manualNav: { abrirDetalleManual: jasmine.Spy };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, datos, seccion, enlace } = lectorFicha(elemento);

    beforeEach(async () => {
        manualNav = { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') };
        await TestBed.configureTestingModule({
            declarations: [DetallesSubtipoComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNav }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesSubtipoComponent);
        component = fixture.componentInstance;
    });

    it('pinta la cabecera, los datos clave y las secciones con lo que modifica', () => {
        component.subtipo = crearSubtipo({
            Ajuste_nivel: 1,
            Iniciativa: 4,
            Tesoro: 'Estándar',
            Alineamiento: { Basico: { Nombre: 'Caótico neutral' } } as any,
            Movimientos: { Correr: 0, Nadar: 0, Volar: 50, Trepar: 0, Escalar: 0 },
            Maniobrabilidad: { Nombre: 'Perfecta' },
        });
        fixture.detectChanges();

        expect(limpio(elemento().querySelector('.ficha-cabecera__tipo'))).toBe('Subtipo');
        expect(limpio(elemento().querySelector('.ficha-cabecera__nombre'))).toBe('Fuego');
        expect(limpio(elemento().querySelector('.ficha-cabecera__manual'))).toContain('Manual de monstruos · pág. 312');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e))).toEqual(['Heredado', 'Oficial']);
        expect(datos(elemento().querySelector('.ficha-datos-contenedor--tarjeta'))).toEqual([
            ['Ajuste de nivel', '+1'], ['Alineamiento', 'Caótico neutral'], ['Tesoro', 'Estándar'],
        ]);
        expect(titulos()).toEqual(['Descripción', 'Combate y defensas', 'Movimiento']);
        expect(datos(seccion('Combate y defensas'))).toEqual([
            ['Iniciativa', '+4'], ['Fortaleza', '+2'], ['Resistencia elemental', 'Inmunidad al fuego'],
        ]);
        expect(datos(seccion('Movimiento'))).toEqual([['Volar', "50'"], ['Maniobrabilidad', 'Perfecta']]);
    });

    it('no enseña lo que la API da vacío o null, ni las secciones sin datos', () => {
        component.subtipo = crearSubtipo({ Descripcion: null as any, Fortaleza: 0, Re: null as any, Heredada: false, Oficial: false });
        fixture.detectChanges();

        expect(limpio(elemento().querySelector('.ficha-cabecera__nombre'))).toBe('Fuego');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e))).toEqual(['Homebrew']);
        expect(elemento().querySelector('.ficha-dato')).toBeNull();
        expect(titulos()).toEqual([]);
        expect(texto()).not.toContain('null');
        expect(texto()).not.toContain('undefined');
    });

    it('enlaza rasgos, dotes, sortílegas, plantillas y el manual, y lista los idiomas', () => {
        const rasgoSpy = spyOn(component.rasgoDetalles, 'emit');
        const doteSpy = spyOn(component.doteDetalles, 'emit');
        const conjuroSpy = spyOn(component.conjuroDetalles, 'emit');
        const plantillaSpy = spyOn(component.plantillaDetalles, 'emit');
        const rasgo = { Id: 7, Nombre: 'Inmunidad al fuego' } as any;
        component.subtipo = crearSubtipo({
            Rasgos: [rasgo],
            Dotes: [{ Dote: { Id: 9, Nombre: 'Soltura' }, Contexto: { Extra: 'Espada larga' } } as any],
            Sortilegas: [{ Conjuro: { Id: 11, Nombre: 'Manos ardientes' } as any, Nivel_lanzador: 1, Usos_diarios: '' }],
            Idiomas: [{ Id: 1, Nombre: 'Ígneo', Descripcion: 'Lengua del fuego', Secreto: false, Oficial: true }],
            Plantillas: [{ Id: 3, Nombre: 'Elemental', Descripcion: '' }],
        });
        fixture.detectChanges();

        expect(titulos()).toEqual([
            'Descripción', 'Combate y defensas', 'Rasgos', 'Dotes', 'Aptitudes sortílegas', 'Idiomas otorgados', 'Plantillas relacionadas',
        ]);
        expect(texto()).toContain('Ígneo');
        expect(texto()).toContain('NL 1');
        enlace('Inmunidad al fuego').click();
        enlace('Soltura (Espada larga)').click();
        enlace('Manos ardientes').click();
        enlace('Elemental').click();
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();

        expect(rasgoSpy).toHaveBeenCalledWith(rasgo);
        expect(doteSpy).toHaveBeenCalledWith(9);
        expect(conjuroSpy).toHaveBeenCalledWith(11);
        expect(plantillaSpy).toHaveBeenCalledWith(3);
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith({ id: 2, nombre: 'Manual de monstruos' });
    });
});
