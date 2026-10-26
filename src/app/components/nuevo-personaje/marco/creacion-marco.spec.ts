import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { Personaje } from 'src/app/interfaces/personaje';
import { CREACION_MARCO_COMPONENTES, PasoCreacionId, lineaPersonajeCreacion, modeloTuPersonaje, pasoCreacionDeLaPestana, textoContinuarCreacion } from '.';

@Component({
    template: `
        <app-creacion-marco>
            <app-creacion-cabecera [paso]="paso" [conVentajas]="conVentajas" [conConjuros]="conConjuros" [nombre]="nombre"
                linea="Humano · Guerrero 5" [oficial]="oficial" (verFicha)="vecesFicha = vecesFicha + 1"></app-creacion-cabecera>
            <app-ficha-franja [datos]="franja" titulo="En este paso"></app-ficha-franja>
            <app-creacion-cuerpo [lateral]="lateral">
                <div creacionTarea class="tarea">La tarea</div>
                <div creacionLateral class="lateral">Lo que miras</div>
            </app-creacion-cuerpo>
            <app-creacion-pie nota="Un paso hecho no se puede deshacer."><button type="button" class="seguir">Continuar</button></app-creacion-pie>
        </app-creacion-marco>
        <app-creacion-ventana *ngIf="ventana" titulo="Elige una dote" subtitulo="Dote adicional de guerrero" [cerrable]="cerrable"
            (cerrar)="vecesCerrar = vecesCerrar + 1">
            <p class="cuerpo">Lista</p>
            <button ventanaSecundaria type="button" class="secundaria">Omitir</button>
            <button ventanaPrincipal type="button" class="principal">Elegir</button>
        </app-creacion-ventana>`,
    standalone: false
})
class PasoDePruebaComponent {
    paso: PasoCreacionId = 'habilidades';
    conVentajas = true;
    conConjuros = false;
    nombre = '';
    oficial: boolean | null = true;
    lateral = true;
    franja = [{ etiqueta: 'Puntos por repartir', valor: 12, detalle: 'de 32' }];
    ventana = false;
    cerrable = true;
    vecesFicha = 0;
    vecesCerrar = 0;
}

describe('El marco de la creación', () => {
    let fixture: ComponentFixture<PasoDePruebaComponent>;
    let host: PasoDePruebaComponent;
    const el = (): HTMLElement => fixture.nativeElement;
    /** Cada paso de la fila como «estado nombre» («hecho Raza», «actual 6 Habilidades», «falta 7 Equipo»). */
    const pasos = (): string[] => Array.from(el().querySelectorAll('.creacion-paso')).map((li) => {
        const estado = ['hecho', 'actual', 'falta'].find((e) => li.classList.contains(`creacion-paso--${e}`));
        const circulo = (li.querySelector('.creacion-paso__circulo')?.textContent ?? '').trim();
        const nombre = (li.querySelector('.creacion-paso__nombre')?.textContent ?? '').trim();
        return `${estado} ${estado === 'hecho' ? '' : circulo + ' '}${nombre}`.replace(/\s+/g, ' ');
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PasoDePruebaComponent, ...CREACION_MARCO_COMPONENTES, ...FICHA_DETALLE_COMPONENTES, TextoManualComponent],
            imports: [MatIconModule, MatTooltipModule],
        }).compileComponents();
        fixture = TestBed.createComponent(PasoDePruebaComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('la cabecera dice el paso, el nombre (o «Sin nombre todavía»), la línea y la etiqueta, y abre la ficha', () => {
        const cabecera = el().querySelector('.creacion-cabecera')!;
        expect(cabecera.textContent).toContain('Nuevo personaje · Paso 6 de 7');
        expect(el().querySelector('.creacion-cabecera__nombre--vacio')?.textContent).toContain('Sin nombre todavía');
        expect(cabecera.textContent).toContain('Humano · Guerrero 5');
        expect(cabecera.textContent).toContain('Oficial');
        host.nombre = 'Brenna';
        host.oficial = false;
        fixture.detectChanges();
        expect(el().querySelector('.creacion-cabecera__nombre')?.textContent).toContain('Brenna');
        expect(cabecera.textContent).toContain('Homebrew');
        (Array.from(cabecera.querySelectorAll('button')).find((b) => b.textContent?.includes('Ver la ficha')) as HTMLButtonElement).click();
        expect(host.vecesFicha).toBe(1);
    });

    it('la fila de pasos: hechos con ✓, el actual con su número y aria-current, y los que faltan', () => {
        expect(pasos()).toEqual([
            'hecho Raza', 'hecho Básicos', 'hecho Plantillas', 'hecho Ventajas', 'hecho Clases', 'actual 6 Habilidades', 'falta 7 Equipo',
        ]);
        expect(el().querySelector('.creacion-paso--hecho .creacion-paso__circulo mat-icon')?.textContent).toContain('check');
        const actual = el().querySelector('[aria-current="step"]')!;
        expect(actual.textContent).toContain('Habilidades');
        expect(el().querySelectorAll('.creacion-paso--hecho').length).toBe(5);
    });

    it('los pasos que no se aplican no salen y la cuenta no los cuenta', () => {
        host.conVentajas = false;
        host.conConjuros = true;
        host.paso = 'conjuros';
        fixture.detectChanges();
        expect(pasos()).toEqual(['hecho Raza', 'hecho Básicos', 'hecho Plantillas', 'hecho Clases', 'hecho Habilidades', 'actual 6 Conjuros', 'falta 7 Equipo']);
        expect(el().textContent).toContain('Paso 6 de 7');
    });

    it('no se puede volver atrás ni saltar: los pasos no son botones ni enlaces', () => {
        const fila = el().querySelector('.creacion-pasos')!;
        expect(fila.querySelectorAll('button, a, [tabindex]').length).toBe(0);
    });

    it('la franja, el cuerpo en dos columnas y el pie con una nota y la acción', () => {
        expect(el().querySelector('.ficha-franja')?.textContent).toContain('Puntos por repartir');
        expect(el().querySelector('.creacion-cuerpo__tarea .tarea')).not.toBeNull();
        expect(el().querySelector('.creacion-cuerpo__lateral .lateral')).not.toBeNull();
        expect(el().querySelector('.creacion-pie__nota')?.textContent).toContain('Un paso hecho no se puede deshacer.');
        expect(el().querySelector('.creacion-pie__acciones .seguir')).not.toBeNull();
        host.lateral = false;
        host.franja = [];
        fixture.detectChanges();
        expect(el().querySelector('.creacion-cuerpo--sin-lateral')).not.toBeNull();
        // Un paso sin cifras no pinta la franja.
        expect(el().querySelector('.ficha-franja')).toBeNull();
    });

    it('la ventana de elección: título, subtítulo, ✕ solo si se puede cerrar, y el pie con la secundaria y la principal', () => {
        host.ventana = true;
        fixture.detectChanges();
        const ventana = el().querySelector('[role="dialog"]')!;
        expect(ventana.getAttribute('aria-modal')).toBe('true');
        expect(ventana.querySelector('h2')?.textContent).toContain('Elige una dote');
        expect(ventana.textContent).toContain('Dote adicional de guerrero');
        const lados = ventana.querySelectorAll('.creacion-ventana__pie-lado');
        expect(lados[0].querySelector('.secundaria')).not.toBeNull();
        expect(lados[1].querySelector('.principal')).not.toBeNull();
        (ventana.querySelector('[aria-label="Cerrar"]') as HTMLButtonElement).click();
        expect(host.vecesCerrar).toBe(1);
        host.cerrable = false;
        fixture.detectChanges();
        expect(ventana.querySelector('[aria-label="Cerrar"]')).toBeNull();
    });
});

describe('Las reglas del marco de la creación', () => {
    it('el paso que se ve sale de la pestaña interna; la tienda es «Equipo»', () => {
        expect(pasoCreacionDeLaPestana(0, { enTienda: false, eligiendoDotesSinConjuros: false })).toBe('raza');
        expect(pasoCreacionDeLaPestana(5, { enTienda: false, eligiendoDotesSinConjuros: false })).toBe('habilidades');
        expect(pasoCreacionDeLaPestana(6, { enTienda: false, eligiendoDotesSinConjuros: false })).toBe('conjuros');
        expect(pasoCreacionDeLaPestana(6, { enTienda: false, eligiendoDotesSinConjuros: true })).toBe('clases');
        expect(pasoCreacionDeLaPestana(4, { enTienda: true, eligiendoDotesSinConjuros: false })).toBe('equipo');
    });

    it('el botón dice a qué paso sigue, salvo donde depende del nivel', () => {
        const todos = { conVentajas: true, conConjuros: false };
        expect(textoContinuarCreacion('basicos', todos)).toBe('Continuar: Plantillas');
        expect(textoContinuarCreacion('plantillas', todos)).toBe('Continuar: Ventajas');
        expect(textoContinuarCreacion('plantillas', { ...todos, conVentajas: false })).toBe('Continuar: Clases');
        expect(textoContinuarCreacion('habilidades', todos)).toBe('Continuar');
    });

    it('la línea de la cabecera', () => {
        expect(lineaPersonajeCreacion({ Raza: { Nombre: '' } } as unknown as Personaje)).toBe('Elige la raza');
        const pj = { Raza: { Nombre: 'Humano' }, desgloseClases: [{ Nombre: 'Guerrero', Nivel: 5 }], Alineamiento: 'Neutral bueno' } as unknown as Personaje;
        expect(lineaPersonajeCreacion(pj)).toBe('Humano · Guerrero 5 · Neutral bueno');
    });

    it('«Tu personaje» solo enseña lo que ya tiene', () => {
        const sinGenerar = { Fuerza: 10, Destreza: 10, Constitucion: 10, Inteligencia: 10, Sabiduria: 10, Carisma: 10,
            ModFuerza: 0, ModDestreza: 0, ModConstitucion: 0, ModInteligencia: 0, ModSabiduria: 0, ModCarisma: 0,
            Correr: 30, Ataque_base: '', Vida: 0, Ca: 0, Dotes: [] } as unknown as Personaje;
        const vacio = modeloTuPersonaje(sinGenerar);
        expect(vacio.casillas).toEqual([]);
        expect(vacio.pares.map((p) => p.nombre)).toEqual(['Velocidad']);
        const generado = modeloTuPersonaje({ ...sinGenerar, Fuerza: 16, ModFuerza: 3, Vida: 12, Ca: 15, Ataque_base: '+1',
            Dotes: [{ Nombre: 'Soltura con un arma', Extra: 'Espada larga', Origen: '' }] } as unknown as Personaje);
        expect(generado.casillas[0]).toEqual(jasmine.objectContaining({ abreviatura: 'FUE', valor: '16', modificador: '+3' }));
        expect(generado.pares.map((p) => p.nombre)).toEqual(['Puntos de golpe', 'Clase de armadura', 'Iniciativa', 'Ataque base', 'Fortaleza', 'Reflejos', 'Voluntad', 'Velocidad']);
        expect(generado.dotes.map((d) => d.texto)).toEqual(['Soltura con un arma (Espada larga)']);
    });
});
