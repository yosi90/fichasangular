import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesMonstruoComponent } from './detalles-monstruo.component';
import { lectorFicha, limpio } from 'src/testing/ficha-detalle';

function crearMonstruoMock(partial?: Partial<MonstruoDetalle>): MonstruoDetalle {
    return {
        Id: 1,
        Nombre: 'Lobo terrible',
        Descripcion: 'Descripcion',
        Manual: { Id: 1, Nombre: 'Manual base', Pagina: 12 },
        Tipo: { Id: 2, Nombre: 'Bestia', Descripcion: '', Oficial: true },
        Tamano: { Id: 3, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
        Dados_golpe: { Cantidad: '2', Tipo_dado: { Id: 1, Nombre: 'd8' }, Suma: 2 },
        Movimientos: { Correr: 40, Nadar: 0, Volar: 0, Trepar: 0, Escalar: 0 },
        Maniobrabilidad: {
            Id: 0,
            Nombre: '',
            Velocidad_avance: '',
            Flotar: 0,
            Volar_atras: 0,
            Contramarcha: 0,
            Giro: '',
            Rotacion: '',
            Giro_max: '',
            Angulo_ascenso: '',
            Velocidad_ascenso: '',
            Angulo_descenso: '',
            Descenso_ascenso: 0,
        },
        Alineamiento: {
            Id: 1,
            Basico: { Id_basico: 1, Nombre: 'Neutral' },
            Ley: { Id_ley: 1, Nombre: 'Neutral' },
            Moral: { Id_moral: 1, Nombre: 'Neutral' },
            Prioridad: { Id_prioridad: 1, Nombre: 'Neutral' },
            Descripcion: 'Neutral',
        },
        Iniciativa: 2,
        Defensa: {
            Ca: 14,
            Toque: 12,
            Desprevenido: 12,
            Armadura_natural: 2,
            Reduccion_dano: '',
            Resistencia_conjuros: '',
            Resistencia_elemental: '',
        },
        Ataque: { Ataque_base: 2, Presa: 3, Ataques: 'Mordisco', Ataque_completo: 'Mordisco' },
        Espacio: 5,
        Alcance: 5,
        Salvaciones: { Fortaleza: 4, Reflejos: 5, Voluntad: 1 },
        Caracteristicas: {
            Fuerza: 15, Fuerza_modificador: 2,
            Destreza: 13, Destreza_modificador: 1,
            Constitucion: 14, Constitucion_modificador: 2,
            Inteligencia: 2, Inteligencia_modificador: -4,
            Sabiduria: 12, Sabiduria_modificador: 1,
            Carisma: 10, Carisma_modificador: 0,
        },
        Cd_sortilegas: '',
        Valor_desafio: '2',
        Tesoro: 'Ninguno',
        Familiar: false,
        Companero: true,
        Oficial: true,
        Idiomas: [],
        Alineamientos_requeridos: { Familiar: [], Companero: [] },
        Sortilegas: [],
        Habilidades: [],
        Dotes: [],
        Niveles_clase: [],
        Subtipos: [],
        Raciales: [],
        Ataques_especiales: [],
        Familiares: [],
        Companeros: [],
        Personajes_relacionados: { Por_familiar: [], Por_companero: [] },
        ...partial,
    };
}

describe('DetallesMonstruoComponent', () => {
    let component: DetallesMonstruoComponent;
    let fixture: ComponentFixture<DetallesMonstruoComponent>;
    let manualNavSpy: jasmine.SpyObj<ManualDetalleNavigationService>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, datos, enlace } = lectorFicha(elemento);
    const franja = (): string[][] => Array.from(elemento().querySelectorAll('.monstruo-franja__dato'))
        .map((d) => [limpio(d.querySelector('dt')), limpio(d.querySelector('dd'))]);
    const combate = (): string[][] => {
        const dts = Array.from(elemento().querySelectorAll('.monstruo-pares dt')).map((d) => limpio(d));
        const dds = Array.from(elemento().querySelectorAll('.monstruo-pares dd')).map((d) => limpio(d));
        return dts.map((dt, i) => [dt, dds[i]]);
    };

    beforeEach(async () => {
        manualNavSpy = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);

        await TestBed.configureTestingModule({
            declarations: [DetallesMonstruoComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNavSpy }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesMonstruoComponent);
        component = fixture.componentInstance;
        component.monstruo = crearMonstruoMock();
    });

    it('emite eventos de navegación principales', () => {
        const conjuroSpy = spyOn(component.conjuroDetallesId, 'emit');
        const doteSpy = spyOn(component.doteDetalles, 'emit');
        const racialSpy = spyOn(component.racialDetalles, 'emit');
        const claseSpy = spyOn(component.claseDetallesId, 'emit');
        const subtipoSpy = spyOn(component.subtipoDetalles, 'emit');
        const tipoSpy = spyOn(component.tipoCriaturaDetallesId, 'emit');
        const relacionadoSpy = spyOn(component.monstruoRelacionadoDetalles, 'emit');

        const doteCtx: DoteContextual = {
            Dote: {
                Id: 9,
                Nombre: 'Alerta',
                Descripcion: '',
                Beneficio: '',
                Normal: '',
                Especial: '',
                Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
                Tipos: [],
                Repetible: 0,
                Repetible_distinto_extra: 0,
                Repetible_comb: 0,
                Comp_arma: 0,
                Oficial: true,
                Extras_soportados: { Extra_arma: 0, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0 },
                Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] },
                Extras_de_todo_el_catalogo: { Armas: false, Armaduras: false, Escuelas: false, Habilidades: false },
                Modificadores: {},
                Prerrequisitos: {},
            },
            Contexto: {
                Entidad: 'personaje',
                Id_personaje: 0,
                Id_extra: -1,
                Extra: 'No aplica',
                Origen: 'Catalogo',
            },
        };
        const racial: RacialDetalle = {
            Id: 5,
            Nombre: 'Mordisco mejorado',
            Descripcion: '',
            Oficial: true,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        };
        const relacionado = crearMonstruoMock({ Id: 4, Nombre: 'Lobo alfa' });

        component.abrirDetallesConjuro(11);
        component.abrirDetallesDote(doteCtx);
        component.abrirDetallesRacial(racial);
        component.abrirDetallesClase(7);
        component.abrirDetallesSubtipo({ Id: 3, Nombre: 'Frio' });
        component.abrirDetallesTipoCriatura(2);
        component.abrirDetallesMonstruoRelacionado(relacionado);

        expect(conjuroSpy).toHaveBeenCalledWith(11);
        expect(doteSpy).toHaveBeenCalledWith(doteCtx);
        expect(racialSpy).toHaveBeenCalledWith(racial);
        expect(claseSpy).toHaveBeenCalledWith(7);
        expect(subtipoSpy).toHaveBeenCalledWith({ Id: 3, Nombre: 'Frio' });
        expect(tipoSpy).toHaveBeenCalledWith(2);
        expect(relacionadoSpy).toHaveBeenCalledWith(relacionado);
    });

    it('enseña cada característica en su casilla, con el modificador de la API y «—» sin valor', () => {
        component.monstruo = crearMonstruoMock({
            Caracteristicas: {
                ...crearMonstruoMock().Caracteristicas,
                Constitucion: null,
                Constitucion_modificador: null,
            },
        });
        fixture.detectChanges();

        const casillas = Array.from(elemento().querySelectorAll('.monstruo-caracteristica'));
        expect(casillas.map((c) => c.getAttribute('aria-label'))).toEqual([
            'Fuerza 15 (+2)', 'Destreza 13 (+1)', 'Constitución —', 'Inteligencia 2 (-4)', 'Sabiduría 12 (+1)', 'Carisma 10 (+0)',
        ]);
        const partes = (casilla: Element) => Array.from(casilla.children).map((parte) => limpio(parte));
        expect(partes(casillas[0])).toEqual(['FUE', '15', '+2']);
        expect(partes(casillas[2])).toEqual(['CON', '—']);
        expect(partes(casillas[5])).toEqual(['CAR', '10', '+0']);
        expect(texto()).not.toContain('null');
    });

    it('pinta la cabecera, la franja de datos principales, el combate y el resumen', () => {
        component.monstruo = crearMonstruoMock({
            Movimientos: { Correr: 40, Nadar: 20, Volar: 0, Trepar: 0, Escalar: 0 },
            Idiomas: [{ Id: 1, Nombre: 'Común' } as any],
            Defensa: { ...crearMonstruoMock().Defensa, Reduccion_dano: '5/plata' },
        });
        fixture.detectChanges();

        expect(limpio(elemento().querySelector('.ficha-cabecera__tipo'))).toBe('Monstruo · Bestia · Mediano');
        expect(limpio(elemento().querySelector('.ficha-cabecera__nombre'))).toBe('Lobo terrible');
        expect(limpio(elemento().querySelector('.ficha-cabecera__manual'))).toContain('Manual base · pág. 12');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e)))
            .toEqual(['Puede ser compañero animal', 'Oficial']);
        expect(franja()).toEqual([
            ['Valor de desafío', '2'],
            ['Dados de golpe', '2d8+2'],
            ['Clase de armadura', '14 toque 12, desprevenido 12'],
            ['Iniciativa', '+2'],
            ['Velocidad', "40' nadar 20'"],
        ]);
        expect(combate()).toEqual([
            ['Ataque base / presa', '+2 / +3'],
            ['Ataque', 'Mordisco'],
            ['Ataque completo', 'Mordisco'],
            ['Salvaciones', 'Fortaleza +4, Reflejos +5, Voluntad +1'],
            ['Armadura natural', '+2'],
            ['Espacio / alcance', "5' / 5'"],
            ['Reducción de daño', '5/plata'],
        ]);
        expect(datos()).toEqual([
            ['Tipo', 'Bestia'],
            ['Tamaño', 'Mediano'],
            ['Alineamiento', 'Neutral'],
            ['Tesoro', 'Ninguno'],
            ['Idiomas', 'Común'],
        ]);
        expect(titulos()).toEqual(['Combate', 'Descripción', 'En resumen']);
    });

    it('no enseña lo que la API da vacío o null, ni secciones sin contenido', () => {
        component.monstruo = crearMonstruoMock({
            Descripcion: null as any,
            Tesoro: null as any,
            Ataque: { Ataque_base: 0, Presa: -1, Ataques: null as any, Ataque_completo: '' },
            Alineamiento: null as any,
            Espacio: 0,
            Alcance: 0,
        });
        fixture.detectChanges();

        expect(combate()).toEqual([
            ['Ataque base / presa', '+0 / -1'],
            ['Salvaciones', 'Fortaleza +4, Reflejos +5, Voluntad +1'],
            ['Armadura natural', '+2'],
        ]);
        expect(datos().map(([dt]) => dt)).toEqual(['Tipo', 'Tamaño']);
        expect(titulos()).toEqual(['Combate', 'En resumen']);
        expect(texto()).not.toContain('null');
        expect(texto()).not.toContain('undefined');
    });

    it('enlaza el tipo, las dotes, las aptitudes, las sortílegas y los subtipos con su detalle', () => {
        const tipoSpy = spyOn(component.tipoCriaturaDetallesId, 'emit');
        const doteSpy = spyOn(component.doteDetalles, 'emit');
        const racialSpy = spyOn(component.racialDetalles, 'emit');
        const conjuroSpy = spyOn(component.conjuroDetallesId, 'emit');
        const subtipoSpy = spyOn(component.subtipoDetalles, 'emit');
        const dote = { Dote: { Id: 9, Nombre: 'Alerta' }, Contexto: { Extra: 'No aplica' } } as any;
        const racial = { Id: 5, Nombre: 'Olfato' } as any;
        component.monstruo = crearMonstruoMock({
            Dotes: [dote],
            Raciales: [racial],
            Ataques_especiales: [{ Id: 6, Nombre: 'Derribo' } as any],
            Sortilegas: [{ Conjuro: { Id: 11, Nombre: 'Luz' } as any, Nivel_lanzador: 3, Usos_diarios: '3/día' }],
            Habilidades: [
                { Habilidad: 'Avistar', Extra: '', Rangos: 4 } as any,
                { Habilidad: 'Saltar', Extra: '', Rangos: 0 } as any,
            ],
            Subtipos: [{ Id: 3, Nombre: 'Frío', Descripcion: '' }],
        });
        fixture.detectChanges();

        expect(titulos()).toEqual([
            'Combate', 'Descripción', 'Habilidades (rangos)', 'Dotes', 'Aptitudes raciales', 'Ataques especiales',
            'Aptitudes sortílegas', 'En resumen', 'Subtipos',
        ]);
        expect(texto()).toContain('Avistar');
        expect(texto()).not.toContain('Saltar');
        expect(texto()).toContain('NL 3 · 3/día');

        enlace('Bestia').click();
        enlace('Alerta').click();
        enlace('Olfato').click();
        enlace('Luz').click();
        enlace('Frío').click();

        expect(tipoSpy).toHaveBeenCalledWith(2);
        expect(doteSpy).toHaveBeenCalledWith(dote);
        expect(racialSpy).toHaveBeenCalledWith(racial);
        expect(conjuroSpy).toHaveBeenCalledWith(11);
        expect(subtipoSpy).toHaveBeenCalledWith({ Id: 3, Nombre: 'Frío' });
    });

    it('enseña los requisitos de compañero animal siempre a la vista, con la clase enlazada', () => {
        const claseSpy = spyOn(component.claseDetallesId, 'emit');
        component.monstruo = crearMonstruoMock({
            Alineamientos_requeridos: { Familiar: [], Companero: [{ Id: 1, Nombre: 'Neutral' }] },
            Niveles_clase: [{
                Clase: { Id: 5, Nombre: 'Druida' },
                Nivel: 4,
                Plantilla: null,
                Preferencia_legal: null,
                Preferencia_moral: null,
                Dote: { Id: 53, Nombre: 'Compañero elevado' },
            }] as any,
        });
        fixture.detectChanges();

        expect(titulos()).toContain('Requisitos como compañero animal');
        expect(titulos()).not.toContain('Requisitos como familiar');
        const lateral = Array.from(elemento().querySelectorAll('.ficha-lateral-tarjeta'))
            .find((l) => limpio(l.querySelector('.ficha-titulo')) === 'Requisitos como compañero animal')!;
        expect(Array.from(lateral.querySelectorAll('.ficha-subtitulo')).map((t) => limpio(t)))
            .toEqual(['Alineamiento requerido', 'Niveles de clase requeridos']);
        expect(Array.from(lateral.querySelectorAll('.ficha-lista__item')).map((i) => limpio(i)))
            .toEqual(['Neutral', 'Druida 4 · Compañero elevado']);
        lateral.querySelector<HTMLButtonElement>('button.ficha-enlace')!.click();
        expect(claseSpy).toHaveBeenCalledWith(5);
    });

    it('en el detalle de un familiar enseña sus datos propios y no los requisitos ni «Puede ser…»', () => {
        component.monstruo = {
            ...crearMonstruoMock({ Familiar: true }),
            Id_familiar: 7,
            Vida: 12,
            Monstruo_origen: { Id: 1, Nombre: 'Lobo' },
            Plantilla: null,
            Alineamientos_requeridos: { Familiar: [{ Id: 1, Nombre: 'Neutral' }], Companero: [] },
        } as any;
        fixture.detectChanges();

        expect(limpio(elemento().querySelector('.ficha-cabecera__tipo'))).toBe('Familiar · Bestia · Mediano');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e))).toEqual(['Oficial']);
        expect(titulos()).toContain('Datos del familiar o compañero');
        expect(titulos()).not.toContain('Requisitos como familiar');
        expect(datos()).toContain(['Familiar', '#7']);
        expect(datos()).toContain(['Vida', '12']);
        expect(datos()).toContain(['Origen', 'Lobo']);
        expect(datos().map(([dt]) => dt)).not.toContain('Plantilla');
        expect(texto()).not.toContain('null');
    });

    it('abre detalle de manual con referencia normalizada', () => {
        component.abrirDetalleManual();

        expect(manualNavSpy.abrirDetalleManual).toHaveBeenCalledWith({
            id: 1,
            nombre: 'Manual base',
        });
    });

    it('separa niveles de requisitos entre familiar y compañero', () => {
        component.monstruo = crearMonstruoMock({
            Familiar: true,
            Companero: true,
            Niveles_clase: [
                {
                    Clase: { Id: 5, Nombre: 'Druida' },
                    Nivel: 4,
                    // Sin plantilla, la API la da a null (antes, «No aplica»).
                    Plantilla: null,
                    Preferencia_legal: { Id: 10, Nombre: 'Ninguna preferencia' },
                    Preferencia_moral: { Id: 10, Nombre: 'Ninguna preferencia' },
                    Dote: { Id: 53, Nombre: 'Compañero elevado' },
                },
                {
                    Clase: { Id: 9, Nombre: 'Mago' },
                    Nivel: 5,
                    Plantilla: { Id: 5, Nombre: 'Mejorado' },
                    Preferencia_legal: { Id: 10, Nombre: 'Ninguna preferencia' },
                    Preferencia_moral: { Id: 10, Nombre: 'Ninguna preferencia' },
                    Dote: { Id: 48, Nombre: 'Familiar mejorado' },
                },
            ] as any,
        });

        const nivelesCompanero = component.getNivelesClaseRequeridosCompanero();
        const nivelesFamiliar = component.getNivelesClaseRequeridosFamiliar();

        expect(nivelesCompanero.length).toBe(1);
        expect(nivelesCompanero[0].nombreClase).toBe('Druida');
        expect(nivelesCompanero[0].dote).toBe('Compañero elevado');

        expect(nivelesFamiliar.length).toBe(1);
        expect(nivelesFamiliar[0].nombreClase).toBe('Mago');
        expect(nivelesFamiliar[0].dote).toBe('Familiar mejorado');
    });

    it('muestra ayuda de maniobrabilidad cuando el monstruo vuela', () => {
        component.monstruo = crearMonstruoMock({
            Movimientos: { Correr: 40, Nadar: 0, Volar: 60, Trepar: 0, Escalar: 0 },
            Maniobrabilidad: {
                Id: 3,
                Nombre: 'Buena',
                Velocidad_avance: 'Normal',
                Flotar: 0,
                Volar_atras: 0,
                Contramarcha: 0,
                Giro: '90 grados',
                Rotacion: '180 grados',
                Giro_max: '180 grados',
                Angulo_ascenso: '60 grados',
                Velocidad_ascenso: 'Mitad',
                Angulo_descenso: 'Cualquiera',
                Descenso_ascenso: 1,
            },
        });
        fixture.detectChanges();

        expect(component.mostrarManiobrabilidad()).toBeTrue();
        const velocidad = elemento().querySelectorAll('.monstruo-franja__dato')[4];
        expect(limpio(velocidad.querySelector('dt'))).toBe('Velocidad');
        expect(limpio(velocidad.querySelector('.monstruo-franja__detalle'))).toBe("volar 60' (buena)");
        elemento().querySelector<HTMLButtonElement>('.monstruo-ayuda')!.click();

        const texto = JSON.stringify(component.getManiobrabilidadInfoSecciones());
        expect(component.mostrarInfoManiobrabilidad).toBeTrue();
        expect(texto).toContain('Buena');
        expect(texto).toContain('Giro: 90 grados.');
    });
});
