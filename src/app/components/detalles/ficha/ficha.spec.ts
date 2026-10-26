import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { ManualReferencia } from 'src/app/interfaces/manual';
import { CondicionPrerrequisito, GrupoPrerrequisitos } from 'src/app/services/utils/prerrequisito-frase';
import {
    DatoFicha,
    FICHA_DETALLE_COMPONENTES,
    datoAlineamiento,
    datosMovimiento,
    datosVisibles,
    esTextoCorto,
    separarManualTexto,
    etiquetasVisibles,
    sortilegasVisibles,
    textoDato,
    textoPies,
    unirTipo,
} from './index';
import { lectorFicha } from 'src/testing/ficha-detalle';

describe('Ficha de detalle: reglas', () => {
    it('textoDato oculta null, vacío y relleno, y enseña números (también el 0) y booleanos', () => {
        expect(textoDato(null)).toBeNull();
        expect(textoDato(undefined)).toBeNull();
        expect(textoDato('   ')).toBeNull();
        expect(textoDato('No especifica')).toBeNull();
        expect(textoDato(' Corto ')).toBe('Corto');
        expect(textoDato(0)).toBe('0');
        expect(textoDato(Number.NaN)).toBeNull();
        expect(textoDato(true)).toBe('Sí');
        expect(textoDato(false)).toBe('No');
        // «Cualquiera» y «Ninguno» son datos.
        expect(textoDato('Cualquiera')).toBe('Cualquiera');
        expect(textoDato('Ninguno')).toBe('Ninguno');
    });

    it('datosVisibles conserva el orden y quita los que no tienen nada que enseñar', () => {
        const datos: DatoFicha[] = [
            { etiqueta: 'A', valor: 'uno' },
            { etiqueta: 'B', valor: null },
            { etiqueta: 'C', valor: 3 },
            { etiqueta: 'D', valor: '' },
        ];
        expect(datosVisibles(datos).map(d => d.etiqueta)).toEqual(['A', 'C']);
        expect(datosVisibles(null)).toEqual([]);
    });

    it('etiquetasVisibles acepta textos sueltos y quita los vacíos', () => {
        expect(etiquetasVisibles(['Alma', '', { texto: 'Aviso', aviso: true }, { texto: ' ' }]))
            .toEqual([{ texto: 'Alma' }, { texto: 'Aviso', aviso: true }]);
    });

    it('unirTipo une con « · » las partes visibles', () => {
        expect(unirTipo(['Dote', null, 'General', '', ' Guerrero '])).toBe('Dote · General · Guerrero');
    });

    it('esTextoCorto solo acepta un párrafo corto', () => {
        expect(esTextoCorto('Puedes atacar con más fuerza.')).toBeTrue();
        expect(esTextoCorto(null)).toBeFalse();
        expect(esTextoCorto('Uno.\n\nDos.')).toBeFalse();
        expect(esTextoCorto('- uno\n- dos')).toBeFalse();
        expect(esTextoCorto('x'.repeat(241))).toBeFalse();
    });

    it('textoPies enseña los pies con apóstrofo y nada sin un número mayor que 0', () => {
        expect(textoPies(30)).toBe("30'");
        expect(textoPies(0)).toBeNull();
        expect(textoPies(null)).toBeNull();
    });

    it('datosMovimiento enseña los movimientos que tiene, en pies, y la maniobrabilidad', () => {
        const datos = datosMovimiento({ Correr: 20, Nadar: 0, Volar: 60, Trepar: 0, Escalar: 0 }, 'Buena');
        expect(datos.map((dato) => `${dato.etiqueta} ${dato.valor}`)).toEqual(["Correr 20'", "Volar 60'", 'Maniobrabilidad Buena']);
        expect(datosMovimiento(null, null)).toEqual([]);
    });

    it('datoAlineamiento enseña el básico o las preferencias que tiene, y «Sin preferencia» si ninguna la tiene', () => {
        const ninguna = { Id_ley: 10, Nombre: 'Ninguna preferencia' };
        expect(datoAlineamiento({
            Id: 32, Basico: null, Ley: ninguna, Moral: { Id_moral: 6, Nombre: 'Siempre Maligno' },
            Prioridad: { Id_prioridad: 3, Nombre: 'Siempre' }, Descripcion: 'Se debe respetar a raja tabla.',
        } as any)).toEqual({ etiqueta: 'Alineamiento', valor: 'Siempre maligno', ayuda: 'Prioridad: Siempre. Se debe respetar a raja tabla.' });
        expect(datoAlineamiento({ Id: 7, Basico: { Id_basico: 1, Nombre: 'Legal bueno' }, Ley: null, Moral: null } as any).valor)
            .toBe('Legal bueno');
        expect(datoAlineamiento({
            Id: 40, Basico: null, Ley: { Id_ley: 6, Nombre: 'Siempre Caótico' }, Moral: { Id_moral: 4, Nombre: 'Siempre Bueno' },
        } as any).valor).toBe('Siempre caótico, siempre bueno');
        expect(datoAlineamiento({
            Id: 3, Basico: null, Ley: { Id_ley: 5, Nombre: 'Casi siempre Neutral' }, Moral: { Id_moral: 5, Nombre: 'Casi siempre Neutral' },
        } as any).valor).toBe('Casi siempre neutral');
        expect(datoAlineamiento({ Id: 2, Basico: null, Ley: ninguna, Moral: { Id_moral: 10, Nombre: 'Ninguna preferencia' } } as any).valor)
            .toBe('Sin preferencia');
        // Sin alineamiento (la API da `null` en cada parte), nada; tampoco tooltip.
        expect(datoAlineamiento({ Id: 0, Basico: null, Ley: null, Moral: null, Prioridad: null, Descripcion: 'Texto' } as any))
            .toEqual({ etiqueta: 'Alineamiento', valor: '', ayuda: null });
        expect(datoAlineamiento(null).valor).toBe('');
    });

    it('sortilegasVisibles quita las que no tienen conjuro y une nivel de lanzador y usos', () => {
        const conjuro = (Id: number, Nombre: string) => ({ Id, Nombre });
        expect(sortilegasVisibles([
            { Conjuro: conjuro(7, ' Luz '), Nivel_lanzador: 3, Usos_diarios: 'A voluntad' },
            { Conjuro: conjuro(8, 'Oscuridad'), Nivel_lanzador: 5, Usos_diarios: '' },
            { Conjuro: conjuro(9, ''), Nivel_lanzador: 1, Usos_diarios: '1/día' },
        ])).toEqual([
            { id: 7, nombre: 'Luz', detalle: 'NL 3 · A voluntad' },
            { id: 8, nombre: 'Oscuridad', detalle: 'NL 5' },
        ]);
    });
});

@Component({
    template: `
        <app-ficha-detalle>
            <app-ficha-cabecera [tipo]="tipo" [nombre]="nombre" [subtitulo]="subtitulo" [manual]="manual" [oficial]="oficial"
                [etiquetas]="etiquetas" (abrirManual)="manualesAbiertos = manualesAbiertos + 1">
            </app-ficha-cabecera>
            <app-ficha-datos [datos]="datos" titulo="Datos de prueba"></app-ficha-datos>
            <app-ficha-cuerpo>
                <app-ficha-seccion titulo="Beneficio" [texto]="beneficio"></app-ficha-seccion>
                <app-ficha-seccion titulo="Normal" [texto]="normal"></app-ficha-seccion>
                <app-ficha-lateral titulo="Prerrequisitos" *ngIf="conLateral">
                    <app-ficha-prerrequisitos [grupos]="grupos" [esNavegable]="esNavegable" textoVacio="Sin prerrequisitos."
                        (abrir)="abiertas.push($event)">
                    </app-ficha-prerrequisitos>
                </app-ficha-lateral>
            </app-ficha-cuerpo>
            <app-ficha-bloque titulo="Progresión" *ngIf="conBloque">
                <table class="ficha-tabla"><tbody><tr><td>1.º</td></tr></tbody></table>
            </app-ficha-bloque>
        </app-ficha-detalle>`,
    standalone: false,
})
class FichaPruebaComponent {
    tipo = 'Dote · General';
    nombre = 'Ataque poderoso';
    subtitulo: string | null = 'Puedes atacar con más fuerza.';
    manual: ManualReferencia | string | null = { Id: 1, Nombre: 'Manual del jugador 1', Pagina: 92 };
    oficial: boolean | null = true;
    etiquetas: string[] = [];
    manualesAbiertos = 0;
    datos: DatoFicha[] = [
        { etiqueta: 'Alcance', valor: 'Corto' },
        { etiqueta: 'Duración', valor: null },
        { etiqueta: 'Resistencia a conjuros', valor: true },
        { etiqueta: 'Objetivo', valor: 'Un arma o 50 proyectiles, todos los cuales deben estar en contacto' },
    ];
    beneficio: string | null = 'Restas al ataque y sumas al daño.';
    normal: string | null = null;
    conLateral = true;
    conBloque = false;
    grupos: GrupoPrerrequisitos[] = [];
    abiertas: CondicionPrerrequisito[] = [];
    esNavegable = (condicion: CondicionPrerrequisito) => condicion.clave === 'competencia_arma';
}

describe('Ficha de detalle: componentes', () => {
    let fixture: ComponentFixture<FichaPruebaComponent>;
    let host: FichaPruebaComponent;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto } = lectorFicha(elemento);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FichaPruebaComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(FichaPruebaComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('la cabecera enseña tipo, nombre, cursiva, manual con página y Oficial', () => {
        const cabecera = elemento().querySelector('.ficha-cabecera') as HTMLElement;
        expect(cabecera.querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Dote · General');
        expect(cabecera.querySelector('h1')?.textContent?.trim()).toBe('Ataque poderoso');
        expect(cabecera.querySelector('.ficha-cabecera__subtitulo')?.textContent).toContain('Puedes atacar con más fuerza.');
        expect(cabecera.querySelector('.ficha-cabecera__manual')?.textContent).toContain('Manual del jugador 1 · pág. 92');
        expect(Array.from(cabecera.querySelectorAll('.ficha-etiqueta')).map(e => e.textContent?.trim())).toEqual(['Oficial']);
    });

    it('la cabecera oculta lo que no viene y marca el homebrew', () => {
        host.subtitulo = null;
        host.manual = { Id: 0, Nombre: '', Pagina: 0 };
        host.oficial = false;
        host.etiquetas = ['Alma'];
        fixture.detectChanges();
        const cabecera = elemento().querySelector('.ficha-cabecera') as HTMLElement;
        expect(cabecera.querySelector('.ficha-cabecera__subtitulo')).toBeNull();
        expect(cabecera.querySelector('.ficha-cabecera__manual')).toBeNull();
        const etiquetas = Array.from(cabecera.querySelectorAll('.ficha-etiqueta'));
        expect(etiquetas.map(e => e.textContent?.trim())).toEqual(['Alma', 'Homebrew']);
        expect(etiquetas[1].classList).toContain('ficha-etiqueta--aviso');
    });

    it('un manual en texto (con su página dentro) sale con el mismo formato que la referencia de la API', () => {
        host.manual = 'Compendio de conjuros, página: 79';
        fixture.detectChanges();
        const manual = elemento().querySelector('.ficha-cabecera__manual') as HTMLElement;
        expect(manual.textContent).toContain('Compendio de conjuros · pág. 79');
        expect(manual.textContent).not.toContain('página:');
    });

    it('pulsar el manual emite abrirManual', () => {
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(host.manualesAbiertos).toBe(1);
    });

    it('la rejilla de datos enseña los pares visibles, los booleanos como Sí y los largos a dos columnas', () => {
        const datos = Array.from(elemento().querySelectorAll('.ficha-dato')) as HTMLElement[];
        expect(datos.map(d => d.querySelector('dt')?.textContent?.trim())).toEqual(['Alcance', 'Resistencia a conjuros', 'Objetivo']);
        expect(datos[1].querySelector('dd')?.textContent?.trim()).toBe('Sí');
        expect(datos[2].style.gridColumn).toContain('span 2');
        expect(texto()).not.toContain('Duración');
        expect(elemento().querySelector('.ficha-datos-contenedor')?.getAttribute('aria-label')).toBe('Datos de prueba');
    });

    it('sin datos visibles, la rejilla no se pinta', () => {
        host.datos = [{ etiqueta: 'Duración', valor: null }, { etiqueta: 'Área', valor: 'No especifica' }];
        fixture.detectChanges();
        expect(elemento().querySelector('.ficha-datos-contenedor')).toBeNull();
    });

    it('un dato con alPulsar es un enlace', () => {
        let pulsado = false;
        host.datos = [{ etiqueta: 'Manual', valor: 'Manual del jugador 1', alPulsar: () => pulsado = true }];
        fixture.detectChanges();
        (elemento().querySelector('.ficha-dato button.ficha-enlace') as HTMLButtonElement).click();
        expect(pulsado).toBeTrue();
    });

    it('las secciones con texto null no se ven', () => {
        const titulos = Array.from(elemento().querySelectorAll('.ficha-principal .ficha-titulo')).map(t => t.textContent?.trim());
        expect(titulos).toEqual(['Beneficio']);
        expect(texto()).toContain('Restas al ataque y sumas al daño.');
        expect(texto()).not.toContain('Normal');
    });

    it('sin secciones visibles se oculta la tarjeta de texto; sin laterales, el texto va a todo lo ancho', () => {
        const cuerpo = elemento().querySelector('.ficha-cuerpo') as HTMLElement;
        expect(cuerpo.classList).not.toContain('ficha-cuerpo--sin-lateral');

        host.conLateral = false;
        fixture.detectChanges();
        expect(cuerpo.classList).toContain('ficha-cuerpo--sin-lateral');

        host.beneficio = null;
        fixture.detectChanges();
        expect((elemento().querySelector('.ficha-principal') as HTMLElement).classList).toContain('ficha-oculta');
        expect(getComputedStyle(elemento().querySelector('.ficha-principal') as HTMLElement).display).toBe('none');
    });

    it('las laterales van a la columna derecha y siempre a la vista', () => {
        const lateral = elemento().querySelector('.ficha-columna-lateral .ficha-lateral-tarjeta') as HTMLElement;
        expect(lateral.querySelector('.ficha-titulo')?.textContent?.trim()).toBe('Prerrequisitos');
        expect(lateral.textContent).toContain('Sin prerrequisitos.');
        expect(elemento().querySelector('mat-expansion-panel')).toBeNull();
    });

    it('los prerrequisitos enseñan la frase de la API y las condiciones navegables son enlaces', () => {
        const arma: CondicionPrerrequisito = { clave: 'competencia_arma', item: { Id_arma: 7, Opcional: 0 } as any, frase: 'Competencia con espada larga' };
        const fuerza: CondicionPrerrequisito = { clave: 'caracteristica', item: { Opcional: 0 } as any, frase: 'Fuerza 13' };
        host.grupos = [{ titulo: 'Obligatorios', descripcion: 'Se deben cumplir todos', opcional: false, condiciones: [fuerza, arma] }];
        fixture.detectChanges();

        const lateral = elemento().querySelector('.ficha-lateral-tarjeta') as HTMLElement;
        expect(lateral.textContent).toContain('Fuerza 13');
        expect(lateral.textContent).not.toContain('Sin prerrequisitos.');
        // Con solo obligatorios no hace falta el título del grupo.
        expect(lateral.querySelector('.ficha-subtitulo')).toBeNull();
        const enlaces = Array.from(lateral.querySelectorAll('button.ficha-enlace')) as HTMLButtonElement[];
        expect(enlaces.map(e => e.textContent?.trim())).toEqual(['Competencia con espada larga']);
        enlaces[0].click();
        expect(host.abiertas).toEqual([arma]);
    });

    it('con elecciones, cada grupo lleva su título y su explicación', () => {
        const a: CondicionPrerrequisito = { clave: 'caracteristica', item: { Opcional: 1 } as any, frase: 'Fuerza 13' };
        const b: CondicionPrerrequisito = { clave: 'caracteristica', item: { Opcional: 1 } as any, frase: 'Destreza 13' };
        host.grupos = [{ titulo: 'Elección A', descripcion: 'Basta con una de estas opciones', opcional: true, condiciones: [a, b] }];
        fixture.detectChanges();
        const subtitulo = elemento().querySelector('.ficha-subtitulo') as HTMLElement;
        expect(subtitulo.textContent).toContain('Elección A');
        expect(subtitulo.textContent).toContain('Basta con una de estas opciones');
    });

    it('el bloque a todo lo ancho va fuera del cuerpo', () => {
        host.conBloque = true;
        fixture.detectChanges();
        const bloque = elemento().querySelector('.ficha-bloque') as HTMLElement;
        expect(bloque.closest('.ficha-cuerpo')).toBeNull();
        expect(bloque.querySelector('.ficha-titulo')?.textContent?.trim()).toBe('Progresión');
        expect(bloque.querySelector('table.ficha-tabla')).not.toBeNull();
    });
});

describe('separarManualTexto', () => {
    it('separa el nombre y la página de los formatos de texto de la API', () => {
        expect(separarManualTexto('Manual del jugador 1, Página: 15')).toEqual({ nombre: 'Manual del jugador 1', pagina: 15 });
        expect(separarManualTexto('El combatiente completo (p. 96)')).toEqual({ nombre: 'El combatiente completo', pagina: 96 });
        expect(separarManualTexto('Compendio de conjuros, Página: 6')).toEqual({ nombre: 'Compendio de conjuros', pagina: 6 });
        expect(separarManualTexto('Rol mapa mundi')).toEqual({ nombre: 'Rol mapa mundi', pagina: null });
        expect(separarManualTexto(null)).toEqual({ nombre: '', pagina: null });
    });
});
