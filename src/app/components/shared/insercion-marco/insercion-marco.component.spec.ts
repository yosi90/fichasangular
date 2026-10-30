import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InsercionMarcoComponent, ModoInsercion } from './insercion-marco.component';

@Component({
    template: `
        <form (ngSubmit)="envios = envios + 1">
            <app-insercion-marco [modo]="modo" tipo="Raza" [nombre]="nombre" [oficial]="oficial" [pasos]="pasos"
                [(pasoActual)]="paso" [avisoPermisos]="avisoPermisos" [guardando]="guardando" [nota]="nota"
                textoAccion="Crear raza">
                <div class="insercion-paso contenido-uno" [hidden]="paso !== 0">Uno</div>
                <div class="insercion-paso contenido-dos" [hidden]="paso !== 1">Dos</div>
                <button type="button" insercionPieSecundario class="secundaria">Cancelar</button>
            </app-insercion-marco>
        </form>`,
    standalone: false,
})
class AnfitrionComponent {
    modo: ModoInsercion = 'crear';
    nombre = '';
    oficial: boolean | null = true;
    pasos = ['Base y cuerpo', 'Valores', 'Relaciones'];
    paso = 0;
    avisoPermisos = '';
    guardando = false;
    nota = '';
    envios = 0;
}

describe('InsercionMarcoComponent', () => {
    let fixture: ComponentFixture<AnfitrionComponent>;
    let anfitrion: AnfitrionComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AnfitrionComponent, InsercionMarcoComponent],
            imports: [FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatTooltipModule, NoopAnimationsModule],
        }).compileComponents();
        fixture = TestBed.createComponent(AnfitrionComponent);
        anfitrion = fixture.componentInstance;
        fixture.detectChanges();
    });

    const raiz = () => fixture.nativeElement as HTMLElement;
    const texto = (selector: string) => (raiz().querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const botonesPie = () => Array.from(raiz().querySelectorAll<HTMLButtonElement>('.insercion-pie button'));
    const boton = (etiqueta: string) => botonesPie().find((b) => b.textContent?.includes(etiqueta)) ?? null;
    const accion = () => raiz().querySelector<HTMLButtonElement>('.insercion-pie__accion')!;

    it('pinta la cabecera con la acción, el tipo y el paso, y «Sin nombre todavía» mientras no hay nombre', () => {
        expect(texto('.insercion-cabecera__tipo')).toBe('Insertar · Raza · Paso 1 de 3');
        expect(texto('.insercion-cabecera__nombre')).toBe('Sin nombre todavía');
        expect(raiz().querySelector('.insercion-cabecera__nombre--vacio')).not.toBeNull();
        expect(texto('.insercion-etiqueta')).toBe('Oficial');

        anfitrion.nombre = '  Goliat de las cumbres ';
        anfitrion.oficial = false;
        anfitrion.modo = 'editar';
        fixture.detectChanges();

        expect(texto('.insercion-cabecera__tipo')).toBe('Modificar · Raza · Paso 1 de 3');
        expect(texto('.insercion-cabecera__nombre')).toBe('Goliat de las cumbres');
        expect(texto('.insercion-etiqueta')).toBe('Homebrew');
        expect(raiz().querySelector('.insercion-etiqueta--aviso')).not.toBeNull();
    });

    it('deja saltar a cualquier paso desde la fila y marca el actual con aria-current', () => {
        const pasos = Array.from(raiz().querySelectorAll<HTMLButtonElement>('.insercion-paso-boton'));
        expect(pasos.map((p) => p.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['1 Base y cuerpo', '2 Valores', '3 Relaciones']);
        expect(pasos[0].getAttribute('aria-current')).toBe('step');

        pasos[2].click();
        fixture.detectChanges();

        expect(anfitrion.paso).toBe(2);
        expect(pasos[2].getAttribute('aria-current')).toBe('step');
        expect(pasos[0].getAttribute('aria-current')).toBeNull();
        expect(texto('.insercion-cabecera__tipo')).toBe('Insertar · Raza · Paso 3 de 3');
    });

    it('lleva «Anterior» y «Siguiente: <paso>» en el pie, sin «Siguiente» en el último', () => {
        expect(boton('Anterior')!.disabled).toBeTrue();
        expect(boton('Siguiente: Valores')).not.toBeNull();

        boton('Siguiente: Valores')!.click();
        fixture.detectChanges();
        expect(anfitrion.paso).toBe(1);
        expect(raiz().querySelector<HTMLElement>('.contenido-uno')!.hidden).toBeTrue();
        expect(raiz().querySelector<HTMLElement>('.contenido-dos')!.hidden).toBeFalse();

        boton('Siguiente: Relaciones')!.click();
        fixture.detectChanges();
        expect(boton('Siguiente')).toBeNull();
        expect(boton('Anterior')!.disabled).toBeFalse();

        boton('Anterior')!.click();
        fixture.detectChanges();
        expect(anfitrion.paso).toBe(1);
    });

    it('sin pasos no pinta la fila de pasos ni «Anterior» y «Siguiente»', () => {
        anfitrion.pasos = [];
        fixture.detectChanges();

        expect(raiz().querySelector('.insercion-pasos')).toBeNull();
        expect(boton('Anterior')).toBeNull();
        expect(texto('.insercion-cabecera__tipo')).toBe('Insertar · Raza');
    });

    it('la acción principal envía el formulario que la contiene y va abajo a la derecha con lo proyectado al lado', () => {
        expect(accion().getAttribute('type')).toBe('submit');
        expect(accion().textContent).toContain('Crear raza');
        expect(raiz().querySelector('.insercion-pie .secundaria')).not.toBeNull();

        accion().click();
        expect(anfitrion.envios).toBe(1);
    });

    it('sin permisos enseña el aviso ámbar, desactiva la acción y lo explica en el pie', () => {
        anfitrion.avisoPermisos = 'No tienes permisos para crear razas.';
        fixture.detectChanges();

        expect(texto('.insercion-aviso')).toContain('No tienes permisos para crear razas.');
        expect(accion().disabled).toBeTrue();
        expect(texto('.insercion-pie__nota')).toBe('No puedes guardar sin permisos.');
        expect(raiz().querySelector('.insercion-pie__nota--aviso')).not.toBeNull();
    });

    it('mientras guarda dice «Guardando…» y desactiva la acción', () => {
        anfitrion.guardando = true;
        fixture.detectChanges();

        expect(accion().textContent).toContain('Guardando…');
        expect(accion().disabled).toBeTrue();
    });

    it('con una nota propia la enseña en el pie', () => {
        anfitrion.nota = 'Faltan la descripción y el alineamiento.';
        fixture.detectChanges();

        expect(texto('.insercion-pie__nota')).toBe('Faltan la descripción y el alineamiento.');
    });
});
