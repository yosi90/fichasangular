import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TipoRol } from 'src/app/services/utils/iconos-rol';
import { IconoRolComponent } from '../icono-rol/icono-rol.component';
import Swal from 'sweetalert2';
import { InsercionMarcoComponent, ModoInsercion, confirmarCierreConCambios } from './insercion-marco.component';

@Component({
    template: `
        <form (ngSubmit)="envios = envios + 1">
            <app-insercion-marco [modo]="modo" tipo="Raza" [iconoTipo]="iconoTipo" [enVentana]="enVentana" [nombre]="nombre" [oficial]="oficial" [pasos]="pasos"
                [(pasoActual)]="paso" [pasosConCambios]="pasosConCambios" [detalleTipo]="detalleTipo" [avisoPermisos]="avisoPermisos" [guardando]="guardando" [nota]="nota"
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
    iconoTipo: TipoRol | null = 'raza';
    enVentana = false;
    nombre = '';
    oficial: boolean | null = true;
    pasos = ['Base y cuerpo', 'Valores', 'Relaciones'];
    paso = 0;
    pasosConCambios: number[] = [];
    detalleTipo = '';
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
            declarations: [AnfitrionComponent, InsercionMarcoComponent, IconoRolComponent],
            imports: [FormsModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatTooltipModule, NoopAnimationsModule],
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

    it('lleva el icono del catálogo en su recuadro (56/38; en ventana, 40/28) y, sin tipo, no pinta ninguno', () => {
        const icono = () => raiz().querySelector<HTMLElement>('.insercion-cabecera app-icono-rol');
        expect(icono()).not.toBeNull();
        expect(icono()!.classList).toContain('icono-rol--recuadro');
        expect(icono()!.getAttribute('aria-hidden')).toBe('true');
        expect(icono()!.style.width).toBe('56px');

        anfitrion.enVentana = true;
        fixture.detectChanges();
        expect(icono()!.style.width).toBe('40px');

        anfitrion.iconoTipo = null;
        fixture.detectChanges();
        expect(icono()).toBeNull();
    });

    it('deja saltar a cualquier paso desde la fila y marca el actual con aria-current', () => {
        const pasos = Array.from(raiz().querySelectorAll<HTMLButtonElement>('.insercion-paso-boton'));
        expect(pasos.map((p) => p.querySelector('.insercion-paso-boton__nombre')?.textContent?.trim())).toEqual(['Base y cuerpo', 'Valores', 'Relaciones']);
        expect(pasos.map((p) => p.querySelector('.insercion-paso-boton__numero')?.textContent?.trim())).toEqual(['1', '2', '3']);
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

    it('al modificar, la línea del tipo puede llevar el manual en vez del paso', () => {
        anfitrion.modo = 'editar';
        anfitrion.detalleTipo = 'Manual de monstruos 1, p. 175';
        fixture.detectChanges();

        expect(texto('.insercion-cabecera__tipo')).toBe('Modificar · Raza · Manual de monstruos 1, p. 175');
    });

    it('los pasos con cambios llevan un punto ámbar (y lo dicen al lector de pantalla)', () => {
        anfitrion.pasosConCambios = [1];
        fixture.detectChanges();

        const pasos = Array.from(raiz().querySelectorAll('.insercion-paso-boton'));
        expect(pasos.map((paso) => !!paso.querySelector('.insercion-paso-boton__cambios'))).toEqual([false, true, false]);
        expect(pasos[1].textContent).toContain('(con cambios)');
    });

    it('tiene el desplegable de los pasos del móvil, «Paso N de M: nombre», y la flecha atrás', async () => {
        await fixture.whenStable();
        fixture.detectChanges();
        const desplegable = raiz().querySelector('.insercion-pasos-movil');
        expect(desplegable).not.toBeNull();
        expect(desplegable!.textContent).toContain('Paso 1 de 3: Base y cuerpo');
        expect(raiz().querySelector('.insercion-pie__atras')).not.toBeNull();
    });
});

describe('confirmarCierreConCambios', () => {
    it('pregunta lo mismo en todas las modificaciones y deja cerrar solo si se confirma', async () => {
        const swal = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        expect(await confirmarCierreConCambios('del idioma')).toBeTrue();
        expect(swal).toHaveBeenCalledWith(jasmine.objectContaining({
            title: 'Hay cambios sin guardar',
            text: 'Si cierras esta pestaña perderás los cambios del idioma.',
            confirmButtonText: 'Cerrar sin guardar',
            cancelButtonText: 'Seguir editando',
        }));

        swal.and.resolveTo({ isConfirmed: false } as any);
        expect(await confirmarCierreConCambios('de la clase')).toBeFalse();
    });
});
