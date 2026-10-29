import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesDoteComponent } from './detalles-dote.component';
import { lectorFicha, limpio } from 'src/testing/ficha-detalle';

describe('DetallesDoteComponent', () => {
    let component: DetallesDoteComponent;
    let fixture: ComponentFixture<DetallesDoteComponent>;
    let manualNav: { abrirDetalleManual: jasmine.Spy };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, lateral, filasPares } = lectorFicha(elemento);

    beforeEach(async () => {
        manualNav = { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') };
        await TestBed.configureTestingModule({
            declarations: [DetallesDoteComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [
                { provide: ManualDetalleNavigationService, useValue: manualNav },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesDoteComponent);
        component = fixture.componentInstance;
        component.dote = {
            Id: 1,
            Nombre: 'Competencia marcial',
            Manual: { Id: 1, Nombre: 'Manual base', Pagina: 10 },
            Tipos: [],
            Repetible: false,
            Repetible_distinto_extra: false,
            Repetible_comb: false,
            Comp_arma: true,
            Oficial: true,
            Descripcion: 'Descripcion',
            Beneficio: '',
            Normal: '',
            Especial: '',
            Modificadores: {},
            Extras_soportados: {
                Extra_arma: 1,
                Extra_armadura: 0,
                Extra_armadura_armaduras: 0,
                Extra_armadura_escudos: 1,
                Extra_escuela: 0,
                Extra_habilidad: 0,
            },
            Extras_disponibles: {
                Armas: [{ Id: 7, Nombre: 'Espada larga' }],
                Armaduras: [{ Id: 9, Nombre: 'Escudo pesado', Es_escudo: true } as any],
                Escuelas: [],
                Habilidades: [],
            },
            Prerrequisitos: {
                competencia_armadura: [{ Id_armadura: 9, Armadura: 'Escudo pesado', Opcional: 0, Frase: 'Competencia con escudo pesado' }],
            } as any,
        } as any;
        fixture.detectChanges();
    });

    /** Una dote completa, como la del lienzo aprobado. */
    function ataquePoderoso(extra: object = {}): any {
        return {
            ...(component.doteData as any),
            Nombre: 'Ataque poderoso',
            Manual: { Id: 1, Nombre: 'Manual del jugador 1', Pagina: 92 },
            Tipos: [{ Id: 1, Nombre: 'General', Usado: 1 }, { Id: 2, Nombre: 'Guerrero', Usado: 1 }],
            Descripcion: 'Puedes llevar a cabo ataques de cuerpo a cuerpo excepcionalmente potentes.',
            Beneficio: 'Restas a tus ataques y sumas al daño.',
            Normal: null,
            Especial: 'Un guerrero puede elegirla como dote adicional.',
            Comp_arma: 0,
            Repetible: 0,
            Repetible_distinto_extra: 0,
            Repetible_comb: 0,
            Extras_soportados: null,
            Extras_disponibles: null,
            Modificadores: { Fuerza: 0, Ataque: -1 },
            Prerrequisitos: {
                caracteristica: [{ Id_caracteristica: 1, Caracteristica: 'Fuerza', Cantidad: 13, Opcional: 0, Frase: 'Fuerza 13' }],
            },
            ...extra,
        };
    }

    it('emite detalle de arma desde extras', () => {
        const spy = spyOn(component.armaDetallesId, 'emit');
        component.abrirDetalleExtra('Armas', { Id: 7, Nombre: 'Espada larga' });
        expect(spy).toHaveBeenCalledWith(7);
    });

    it('emite detalle de armadura desde prerrequisito', () => {
        const spy = spyOn(component.armaduraDetallesId, 'emit');
        const condicion = component.prerrequisitosAgrupados[0].condiciones[0];
        expect(component.esPrerrequisitoNavegable(condicion)).toBeTrue();
        component.abrirDetallePrerrequisito(condicion);
        expect(spy).toHaveBeenCalledWith(9);
    });

    it('el prerrequisito de competencia es un enlace que abre la armadura', () => {
        const spy = spyOn(component.armaduraDetallesId, 'emit');
        const enlace = Array.from(elemento().querySelectorAll('button.ficha-enlace'))
            .find((b) => b.textContent?.includes('Competencia con escudo pesado')) as HTMLButtonElement;
        enlace.click();
        expect(spy).toHaveBeenCalledWith(9);
    });

    it('los extras de armas y escudos son enlaces a su detalle', () => {
        const armaSpy = spyOn(component.armaDetallesId, 'emit');
        const armaduraSpy = spyOn(component.armaduraDetallesId, 'emit');
        const enlaces = Array.from(elemento().querySelectorAll('button.ficha-enlace')) as HTMLButtonElement[];
        enlaces.find((b) => b.textContent?.trim() === 'Espada larga')?.click();
        enlaces.find((b) => b.textContent?.trim() === 'Escudo pesado')?.click();
        expect(armaSpy).toHaveBeenCalledWith(7);
        expect(armaduraSpy).toHaveBeenCalledWith(9);
    });

    it('no muestra la chip general de competencia y la sitúa en extras de escudos', () => {
        const html = texto();
        expect(html).not.toContain('Competencia de arma');
        expect(html).toContain('Escudos');
        expect(html).toContain('Requiere competencia');
        expect(html).toContain('Admite: Armas, Escudos');
    });

    it('marca que solo armas y escudos requieren competencia contextual', () => {
        expect(component.bloqueExtraRequiereCompetencia('Escudos')).toBeTrue();
        expect(component.bloqueExtraRequiereCompetencia('Armas')).toBeTrue();
        expect(component.bloqueExtraRequiereCompetencia('Armaduras')).toBeFalse();
    });

    it('enseña la ficha común: cabecera, texto a la izquierda y listas siempre a la vista', () => {
        component.dote = ataquePoderoso();
        fixture.detectChanges();

        const cabecera = elemento().querySelector('.ficha-cabecera') as HTMLElement;
        expect(cabecera.querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Dote · General · Guerrero');
        expect(cabecera.querySelector('h1')?.textContent?.trim()).toBe('Ataque poderoso');
        expect(cabecera.querySelector('.ficha-cabecera__subtitulo')?.textContent).toContain('excepcionalmente potentes');
        expect(cabecera.querySelector('.ficha-cabecera__manual')?.textContent).toContain('Manual del jugador 1 · pág. 92');
        expect(cabecera.textContent).toContain('Oficial');

        expect(titulos('.ficha-principal')).toEqual(['Beneficio', 'Especial']);
        expect(titulos('.ficha-columna-lateral')).toEqual(['Prerrequisitos', 'En resumen', 'Modificadores']);
        expect(texto()).toContain('Fuerza 13');
        expect(texto()).toContain('Ataque -1');
        expect(texto()).not.toContain('Fuerza 0');
        expect(elemento().querySelector('mat-expansion-panel')).toBeNull();
        expect(elemento().querySelector('mat-chip')).toBeNull();
    });

    it('no enseña lo que la API da null ni los bloques vacíos', () => {
        component.dote = ataquePoderoso({ Especial: null, Beneficio: 'No especifica', Modificadores: null });
        fixture.detectChanges();

        expect(texto()).not.toContain('Normal');
        expect(texto()).not.toContain('Especial');
        expect(texto()).not.toContain('Beneficio');
        expect(texto()).not.toContain('Extras');
        expect(texto()).not.toContain('Modificadores');
        expect(texto()).not.toContain('Origen');
        expect((elemento().querySelector('.ficha-principal') as HTMLElement).classList).toContain('ficha-oculta');
    });

    it('enseña las habilidades en las que da rangos, las base y las custom', () => {
        component.dote = ataquePoderoso({
            Habilidades_otorgadas: [
                { Id_habilidad: 17, Habilidad: 'Escuchar', Id_extra: null, Extra: null, Extra_comodin: null, Rangos: 2, Custom: false },
                { Id_habilidad: 6, Habilidad: 'Avistar', Id_extra: null, Extra: null, Extra_comodin: null, Rangos: 2, Custom: false },
                { Id_habilidad: 3, Habilidad: 'Volar', Id_extra: null, Extra: null, Extra_comodin: null, Rangos: 4, Custom: true },
            ],
        });
        fixture.detectChanges();

        const habilidades = lateral('Habilidades otorgadas');
        expect(Array.from(habilidades!.querySelectorAll('.ficha-subtitulo')).map((t) => limpio(t))).toEqual(['Base', 'Custom']);
        expect(filasPares(habilidades)).toEqual([['Avistar', '+2'], ['Escuchar', '+2'], ['Volar', '+4']]);
    });

    it('un extra que se elige de todo el catálogo lo dice, en vez de listar el comodín', () => {
        component.dote = ataquePoderoso({
            Extras_soportados: { Extra_arma: 1, Extra_armadura: 0, Extra_armadura_armaduras: 0, Extra_armadura_escudos: 0, Extra_escuela: 0, Extra_habilidad: 0 },
            Extras_disponibles: { Armas: [{ Id: 0, Nombre: 'Elegir' }], Armaduras: [], Escuelas: [], Habilidades: [] },
            Extras_de_todo_el_catalogo: { Armas: true, Armaduras: false, Escuelas: false, Habilidades: false },
        });
        fixture.detectChanges();

        expect(limpio(lateral('Extras')?.querySelector('.ficha-grupo .ficha-nota'))).toBe('Cualquiera del catálogo.');
        expect(limpio(lateral('Extras'))).not.toContain('Elegir');
    });

    it('«En resumen» dice cómo se elige y, en un personaje, su origen', () => {
        component.dote = {
            Dote: ataquePoderoso({ Repetible: 1, Repetible_comb: 1 }),
            Contexto: { Entidad: 'personaje', Id_personaje: 3, Extra: '', Id_extra: 0, Origen: 'Nivel 1' },
        } as any;
        fixture.detectChanges();

        const resumen = Array.from(elemento().querySelectorAll('.ficha-dato'))
            .map((d) => `${d.querySelector('dt')?.textContent?.trim()} ${d.querySelector('dd')?.textContent?.trim()}`);
        expect(resumen).toEqual(['Tipos General, Guerrero', 'Se elige Repetible, Repetible en combinación', 'Origen Nivel 1']);

        component.dote = ataquePoderoso();
        fixture.detectChanges();
        expect(texto()).toContain('Una vez');
    });

    it('una descripción larga va como sección y no en la cabecera', () => {
        component.dote = ataquePoderoso({ Descripcion: 'Primer párrafo.\n\nSegundo párrafo.' });
        fixture.detectChanges();
        expect(elemento().querySelector('.ficha-cabecera__subtitulo')).toBeNull();
        expect(titulos('.ficha-principal')).toEqual(['Descripción', 'Beneficio', 'Especial']);
    });

    it('homebrew: la etiqueta lo dice', () => {
        component.dote = ataquePoderoso({ Oficial: false });
        fixture.detectChanges();
        expect(elemento().querySelector('.ficha-etiqueta--aviso')?.textContent?.trim()).toBe('Homebrew');
    });

    it('pulsar el manual abre su detalle', () => {
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith({ id: 1, nombre: 'Manual base' });
    });

    it('enseña la aptitud especial con su frase, como los demás prerrequisitos', () => {
        component.dote = {
            ...(component.doteData as any),
            Prerrequisitos: {
                aptitud_especial: [{ Id_aptitud_especial: 10, Aptitud_especial: 'Alas', Raciales: [{ Id: 41, Nombre: 'Aspecto de dragón (Alas)' }], Especiales: [{ Id: 1631, Nombre: 'Alas' }], Plantillas: [], Dotes: [], Opcional: 0, Frase: 'Alas' }],
                competencia_armadura: [{ Id_armadura: 9, Armadura: 'Escudo pesado', Opcional: 0, Frase: 'Competencia con escudo pesado' }],
            },
        } as any;

        const frases = component.prerrequisitosAgrupados.flatMap((grupo) => grupo.condiciones.map((c) => c.frase));
        expect(frases).toEqual(['Alas', 'Competencia con escudo pesado']);
    });

    it('enseña la frase de la API y agrupa las alternativas por Opcional', () => {
        component.dote = {
            ...(component.doteData as any),
            Prerrequisitos: {
                clase_especial: [
                    { Id_especial: 7, Especial: 'Expulsar o reprender muertos vivientes', Id_extra: null, Extra: null, Extra_comodin: null, Opcional: 1, Frase: 'Expulsar o reprender muertos vivientes' },
                    { Id_especial: 8, Especial: 'Expulsar muertos vivientes', Id_extra: null, Extra: null, Extra_comodin: null, Opcional: 1, Frase: 'Expulsar muertos vivientes' },
                ],
                habilidad: [
                    { Id_habilidad: 4, Habilidad: 'Concentración', Cantidad: 8, Opcional: 0, Frase: 'Concentración 8 rangos' },
                ],
                dote: [
                    { Id_dote_prerrequisito: 4, Dote_prerrequisito: 'Soltura con un arma', Id_extra: 0, Extra: null, Extra_comodin: 'elegir', Repetido: 0, Opcional: 0, Frase: 'Soltura con un arma (el arma elegida)' },
                ],
            },
        } as any;
        fixture.detectChanges();

        const grupos = component.prerrequisitosAgrupados;
        expect(grupos.length).toBe(2);
        expect(grupos[0].titulo).toBe('Obligatorios');
        expect(grupos[0].condiciones.map((c) => c.frase)).toEqual(['Concentración 8 rangos', 'Soltura con un arma (el arma elegida)']);
        expect(grupos[1].titulo).toBe('Elección A');
        expect(grupos[1].opcional).toBeTrue();
        expect(grupos[1].descripcion).toContain('Basta con una');
        expect(grupos[1].condiciones.map((c) => c.frase)).toEqual(['Expulsar o reprender muertos vivientes', 'Expulsar muertos vivientes']);

        const html = texto();
        expect(html).toContain('Soltura con un arma (el arma elegida)');
        expect(html).toContain('Obligatorios');
        expect(html).toContain('Elección A');
        expect(html).not.toContain('Frase');
        expect(html).not.toContain('Extra:');
    });

    it('sin prerrequisitos lo dice', () => {
        component.dote = ataquePoderoso({ Prerrequisitos: {} });
        fixture.detectChanges();
        expect(texto()).toContain('Sin prerrequisitos.');
    });

    it('sin frase (una caché anterior) enseña el nombre del tipo', () => {
        component.dote = {
            ...(component.doteData as any),
            Prerrequisitos: {
                poder_seleccionar_familiar: [{ Opcional: 0 }],
            },
        } as any;

        expect(component.prerrequisitosAgrupados[0].condiciones[0].frase).toBe('Poder seleccionar familiar');
    });
    it('una dote de incarnum enseña lo que da, a qué dotes sustituye y el chakra que se elige (Magic of Incarnum)', () => {
        component.dote = ataquePoderoso({
            Nombre: 'Chakra menor abierto',
            Incarnum: {
                Esencia_reserva: 0, Esencia_reserva_moldeador: null, Receptaculo: false, Capacidad: null, Abre_chakra: true,
                Divisor_nivel_moldeador: null, Descriptores_sin_alineamiento: [],
            },
            Cuenta_como: [{ Id: 43, Nombre: 'Dureza' }],
            Extras_soportados: { Extra_arma: 0, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0, Extra_chakra: 1, Extra_fusion: 0 },
            Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [], Chakras: [{ Id: 37, Nombre: 'Brazos' }], Fusiones: [] },
        });
        fixture.detectChanges();

        expect(titulos()).toEqual(jasmine.arrayContaining(['Incarnum', 'Cuenta como', 'Extras']));
        expect(limpio(lateral('Incarnum'))).toContain('Queda abierto para un vínculo');
        expect(limpio(lateral('Extras'))).toContain('Admite: Chakras');
        const chakra = spyOn(component.chakraDetallesId, 'emit');
        const dote = spyOn(component.doteDetallesId, 'emit');
        (Array.from(elemento().querySelectorAll('button.ficha-enlace')).find((b) => limpio(b) === 'Brazos') as HTMLButtonElement).click();
        (Array.from(elemento().querySelectorAll('button.ficha-enlace')).find((b) => limpio(b) === 'Dureza') as HTMLButtonElement).click();
        expect(chakra).toHaveBeenCalledWith(37);
        expect(dote).toHaveBeenCalledWith(43);
    });

    it('sin incarnum ni «cuenta como», no salen sus laterales', () => {
        component.dote = ataquePoderoso({ Incarnum: null, Cuenta_como: [] });
        fixture.detectChanges();
        expect(titulos()).not.toContain('Incarnum');
        expect(titulos()).not.toContain('Cuenta como');
    });
});
