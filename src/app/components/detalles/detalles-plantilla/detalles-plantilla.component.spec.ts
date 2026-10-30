import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesPlantillaComponent } from './detalles-plantilla.component';
import { lectorFicha, limpio } from 'src/testing/ficha-detalle';

function caracteristicas(valores: Partial<Plantilla['Modificadores_caracteristicas']> = {}): Plantilla['Modificadores_caracteristicas'] {
    return { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0, ...valores };
}

function crearPlantilla(partial: Partial<Plantilla> = {}): Plantilla {
    return {
        Id: 3,
        Nombre: 'Medio dragón',
        Descripcion: 'Criatura con sangre de dragón.',
        Manual: { Id: 2, Nombre: 'Manual de monstruos', Pagina: 146 },
        Tamano: { Id: 0, Nombre: '', Modificador: 0, Modificador_presa: 0 } as any,
        Tipo_dado: { Id_tipo_dado: 4, Nombre: 'd12' },
        Tipo_dado_comodin: null,
        Actualiza_dg: true,
        Modificacion_dg: null as any,
        Modificacion_tamano: null as any,
        Iniciativa: 0,
        Velocidades: '',
        Ca: '+4 armadura natural',
        Ataque_base: 0,
        Presa: 0,
        Ataques: '',
        Ataque_completo: '',
        Reduccion_dano: '',
        Resistencia_conjuros: null as any,
        Resistencia_elemental: 'Inmune al fuego',
        Fortaleza: 0,
        Reflejos: 0,
        Voluntad: 0,
        Modificadores_caracteristicas: caracteristicas({ Fuerza: 8, Constitucion: 2, Inteligencia: 2, Carisma: 2 }),
        Minimos_caracteristicas: caracteristicas(),
        Ajuste_nivel: 3,
        Licantronia_dg: null,
        Cd: 0,
        Puntos_habilidad: { Suma: 0, Suma_fija: 0 },
        Nacimiento: true,
        Movimientos: { Correr: 0, Nadar: 0, Volar: 60, Trepar: 0, Excavar: 0 },
        Maniobrabilidad: { Id: 2, Nombre: 'Media' } as any,
        Alineamiento: null as any,
        Entorno: null,
        Organizacion: null,
        Vd: null,
        Tesoro: null,
        Avance: null,
        Nombre_original: null,
        Traducido: false,
        Oficial: true,
        Dotes: [],
        Subtipos: [],
        Habilidades: [],
        Sortilegas: [],
        Raciales: [],
        Ataques_especiales: [],
        Prerrequisitos_flags: {},
        Prerrequisitos: {
            actitud_requerido: [],
            actitud_prohibido: [],
            alineamiento_requerido: [],
            caracteristica: [],
            criaturas_compatibles: [{ Frase: 'Criatura corpórea', Opcional: 0 } as any],
        },
        Compatibilidad_tipos: [],
        ...partial,
    };
}

describe('DetallesPlantillaComponent', () => {
    let component: DetallesPlantillaComponent;
    let fixture: ComponentFixture<DetallesPlantillaComponent>;
    let manualNav: { abrirDetalleManual: jasmine.Spy };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, datos, seccion, lateral, enlace, filasPares } = lectorFicha(elemento);

    beforeEach(async () => {
        manualNav = { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') };
        await TestBed.configureTestingModule({
            declarations: [DetallesPlantillaComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNav }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesPlantillaComponent);
        component = fixture.componentInstance;
    });

    it('pinta la cabecera y agrupa los modificadores en datos clave y secciones', () => {
        component.plantilla = crearPlantilla();
        fixture.detectChanges();

        expect(limpio(elemento().querySelector('.ficha-cabecera__tipo'))).toBe('Plantilla');
        expect(limpio(elemento().querySelector('.ficha-cabecera__nombre'))).toBe('Medio dragón');
        expect(limpio(elemento().querySelector('.ficha-cabecera__manual'))).toContain('Manual de monstruos · pág. 146');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e))).toEqual(['Heredada', 'Oficial']);

        const datosClave = elemento().querySelector('.ficha-datos-contenedor--tarjeta');
        expect(datos(datosClave)).toEqual([['Ajuste de nivel', '+3'], ['Dado de golpe', 'd12 también los DG de clase']]);

        expect(titulos()).toEqual(['Descripción', 'Características', 'Combate y defensas', 'Movimiento', 'Prerrequisitos']);
        expect(datos(seccion('Características'))).toEqual([
            ['Fuerza', '+8'], ['Constitución', '+2'], ['Inteligencia', '+2'], ['Carisma', '+2'],
        ]);
        expect(Array.from(seccion('Características')!.querySelectorAll('.ficha-subtitulo')).map((t) => limpio(t))).toEqual(['Modificadores']);
        expect(datos(seccion('Combate y defensas'))).toEqual([
            ['CA', '+4 armadura natural'], ['Resistencia elemental', 'Inmune al fuego'],
        ]);
        expect(datos(seccion('Movimiento'))).toEqual([['Volar', "60'"], ['Maniobrabilidad', 'Media']]);
        expect(texto()).toContain('Criatura corpórea');
    });

    it('no enseña lo que la API da vacío o null, ni las secciones sin datos', () => {
        component.plantilla = crearPlantilla({
            Descripcion: null as any,
            Ajuste_nivel: 0,
            Tipo_dado_comodin: 'elegir',
            Ca: null as any,
            Resistencia_elemental: '',
            Modificadores_caracteristicas: caracteristicas(),
            Movimientos: { Correr: 0, Nadar: 0, Volar: 0, Trepar: 0, Excavar: 0 },
            Maniobrabilidad: null as any,
            Prerrequisitos: null as any,
            Nacimiento: false,
        });
        fixture.detectChanges();

        expect(elemento().querySelector('.ficha-datos-contenedor--tarjeta')).toBeNull();
        expect(titulos()).toEqual(['Prerrequisitos']);
        expect(texto()).toContain('Sin prerrequisitos.');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e))).toEqual(['Oficial']);
        expect(texto()).not.toContain('null');
        expect(texto()).not.toContain('undefined');
    });

    it('enseña la ecología del manual, el nombre original y la marca de traducida', () => {
        component.plantilla = crearPlantilla({
            Nombre: 'Liche seco',
            Nacimiento: false,
            Entorno: 'Cualquier desierto',
            Organizacion: 'Solitario',
            Vd: 'Igual que la criatura base +2',
            Tesoro: 'Estándar',
            Avance: 'Según la clase del personaje',
            Nombre_original: 'Dry Lich',
            Traducido: true,
        });
        fixture.detectChanges();

        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e))).toEqual(['Traducido', 'Oficial']);
        expect(datos(elemento().querySelector('.ficha-datos-contenedor--tarjeta'))).toContain(['Nombre original', 'Dry Lich']);
        expect(datos(seccion('Ecología'))).toEqual([
            ['Entorno', 'Cualquier desierto'],
            ['Organización', 'Solitario'],
            ['Valor de desafío', 'Igual que la criatura base +2'],
            ['Tesoro', 'Estándar'],
            ['Avance', 'Según la clase del personaje'],
        ]);
    });

    it('sin ecología ni traducción no pinta la sección ni la etiqueta', () => {
        component.plantilla = crearPlantilla({ Nacimiento: false, Nombre_original: 'Half-Dragon', Traducido: false });
        fixture.detectChanges();

        expect(titulos()).not.toContain('Ecología');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e))).toEqual(['Oficial']);
        expect(texto()).not.toContain('Half-Dragon');
    });

    it('enseña los mínimos, los DG de animal y la compatibilidad de tipo', () => {
        component.plantilla = crearPlantilla({
            Minimos_caracteristicas: caracteristicas({ Inteligencia: 3 }),
            Licantronia_dg: { Id_dado: 2, Dado: 'd8', Multiplicador: 2, Suma: 4 },
            Compatibilidad_tipos: [
                { Id_tipo_comp: 1, Id_tipo_nuevo: 2, Tipo_comp: 'Humanoide', Tipo_nuevo: 'Cambiaformas', Opcional: 0 },
                { Id_tipo_comp: 3, Id_tipo_nuevo: 0, Tipo_comp: 'Gigante', Tipo_nuevo_comodin: 'cualquiera', Opcional: 0 },
            ],
        });
        fixture.detectChanges();

        expect(Array.from(seccion('Características')!.querySelectorAll('.ficha-subtitulo')).map((t) => limpio(t)))
            .toEqual(['Modificadores', 'Mínimos']);
        expect(datos(seccion('Características'))).toContain(['Inteligencia', '3']);
        expect(datos(seccion('Dados de golpe adicionales'))).toEqual([['DG otorgados', '2'], ['Dado', 'd8'], ['Suma de PG', '+4']]);
        expect(filasPares()).toEqual([['Humanoide', 'Cambiaformas'], ['Gigante', 'Gigante']]);
    });

    it('enseña lo que define la plantilla: pasos de DG y tamaño, puntos de habilidad, alineamiento, ataques, CD y velocidades', () => {
        component.plantilla = crearPlantilla({
            Tipo_dado_comodin: 'elegir',
            Modificacion_dg: { Id_paso_modificacion: 1, Nombre: '+1 paso' },
            Modificacion_tamano: { Id_paso_modificacion: 2, Nombre: '+1 paso' },
            Puntos_habilidad: { Suma: 6, Suma_fija: 0 },
            Alineamiento: {
                Id: 32,
                Basico: null,
                Ley: { Id_ley: 10, Nombre: 'Ninguna preferencia' },
                Moral: { Id_moral: 6, Nombre: 'Siempre Maligno' },
                Prioridad: { Id_prioridad: 3, Nombre: 'Siempre' },
                Descripcion: 'Se debe respetar a raja tabla.',
            } as any,
            Ataques: 'Dos ataques de garra y uno de mordisco.',
            Ataque_completo: 'Ambas garras y el mordisco.',
            Cd: 15,
            Velocidades: 'Posee alas con las que puede volar al doble de su velocidad.',
            Movimientos: { Correr: 0, Nadar: 0, Volar: 0, Trepar: 0, Excavar: 0 },
            Maniobrabilidad: null as any,
        });
        fixture.detectChanges();

        expect(datos(elemento().querySelector('.ficha-datos-contenedor--tarjeta'))).toEqual([
            ['Ajuste de nivel', '+3'],
            ['Cambio de tamaño', '+1 paso'],
            ['Cambio del dado de golpe', '+1 paso'],
            ['Puntos de habilidad por DG', '6 + mod. de Int'],
            ['Alineamiento', 'Siempre maligno'],
        ]);
        expect(titulos()).toEqual([
            'Descripción', 'Características', 'Combate y defensas', 'Ataques', 'Ataque completo', 'Movimiento', 'Prerrequisitos',
        ]);
        expect(limpio(seccion('Ataques'))).toContain('Dos ataques de garra y uno de mordisco.');
        expect(limpio(seccion('Ataque completo'))).toContain('Ambas garras y el mordisco.');
        expect(datos(seccion('Combate y defensas'))).toContain(['CD', '15']);
        expect(limpio(seccion('Movimiento')?.querySelector('app-texto-manual'))).toBe('Posee alas con las que puede volar al doble de su velocidad.');
        expect(datos(seccion('Movimiento'))).toEqual([]);
    });

    it('enseña las habilidades, los puntos de habilidad del animal y las aptitudes raciales y ataques especiales, enlazados', () => {
        const racialSpy = spyOn(component.racialDetalles, 'emit');
        const resistencia = { Id: 21, Nombre: 'Resistencia al frío' } as any;
        const aura = { Id: 22, Nombre: 'Aura de miedo' } as any;
        component.plantilla = crearPlantilla({
            Licantronia_dg: { Id_dado: 2, Dado: 'd8', Multiplicador: 2, Suma: 4, Tipo_criatura: { Id: 3, Nombre: 'Animal', Puntos_habilidad: 2 } },
            Puntos_habilidad: { Suma: 0, Suma_fija: 8 },
            Habilidades: [
                { Habilidad: 'Esconderse', Extra: null, Extra_comodin: null, Rangos: 8, Varios: null } as any,
                { Habilidad: 'Avistar', Extra: null, Extra_comodin: null, Rangos: 0, Varios: 'De clase' } as any,
                { Habilidad: 'Saber', Extra: null, Extra_comodin: 'elegir', Rangos: 2, Varios: null } as any,
            ],
            Raciales: [{ Racial: resistencia, Dg: 4 }, { Racial: { Id: 0, Nombre: null } as any, Dg: 0 }],
            Ataques_especiales: [{ Racial: aura, Dg: 0 }],
            Sortilegas: [{ Conjuro: { Id: 11, Nombre: 'Aura sagrada' } as any, Nivel_lanzador: 0, Usos_diarios: '3/día', Dg: 13 }],
        });
        fixture.detectChanges();

        expect(datos(seccion('Dados de golpe adicionales'))).toEqual([
            ['DG otorgados', '2'], ['Dado', 'd8'], ['Tipo de los DG', 'Animal'], ['Suma de PG', '+4'],
            ['Puntos de habilidad', '2 + mod. de Int por DG'],
        ]);
        expect(filasPares(lateral('Habilidades'))).toEqual([['Avistar De clase', ''], ['Esconderse', '+8'], ['Saber (Elegir)', '+2']]);
        expect(limpio(lateral('Aptitudes raciales')?.querySelector('ul'))).toBe('Resistencia al frío · desde 4 DG');
        expect(limpio(lateral('Ataques especiales')?.querySelector('ul'))).toBe('Aura de miedo');
        expect(texto()).toContain('NL 0 · 3/día · desde 13 DG');
        enlace('Resistencia al frío').click();
        enlace('Aura de miedo').click();
        expect(racialSpy).toHaveBeenCalledWith(resistencia);
        expect(racialSpy).toHaveBeenCalledWith(aura);
    });

    it('enlaza dotes, sortílegas, subtipos y el manual con su detalle', () => {
        const doteSpy = spyOn(component.doteDetalles, 'emit');
        const conjuroSpy = spyOn(component.conjuroDetalles, 'emit');
        const subtipoSpy = spyOn(component.subtipoDetalles, 'emit');
        component.plantilla = crearPlantilla({
            Dotes: [{ Dote: { Id: 9, Nombre: 'Alerta' }, Contexto: { Extra: '' } } as any],
            Sortilegas: [{ Conjuro: { Id: 11, Nombre: 'Oscuridad' } as any, Nivel_lanzador: 5, Usos_diarios: '1/día', Dg: 0 }],
            Subtipos: [{ Id: 4, Nombre: 'Dragón' }],
        });
        fixture.detectChanges();

        expect(titulos()).toEqual([
            'Descripción', 'Características', 'Combate y defensas', 'Movimiento',
            'Prerrequisitos', 'Subtipos', 'Dotes', 'Aptitudes sortílegas',
        ]);
        expect(texto()).toContain('NL 5 · 1/día');
        enlace('Alerta').click();
        enlace('Oscuridad').click();
        enlace('Dragón').click();
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();

        expect(doteSpy).toHaveBeenCalledWith(9);
        expect(conjuroSpy).toHaveBeenCalledWith(11);
        expect(subtipoSpy).toHaveBeenCalledWith({ Id: 4, Nombre: 'Dragón' });
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith({ id: 2, nombre: 'Manual de monstruos' });
    });
});
