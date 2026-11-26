import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconoRolComponent } from '../icono-rol/icono-rol.component';
import { ListadoNombreComponent } from './listado-nombre.component';
import { ManualListadoPipe } from './manual-listado.pipe';

@Component({
    template: `
        <div class="fila" (click)="filas = filas + 1">
            <app-listado-nombre tipo="raza" [nombre]="nombre" [original]="original" (abrir)="abiertos = abiertos + 1"></app-listado-nombre>
        </div>
        <span class="manual">{{ manual | manualListado }}</span>`,
    standalone: false,
})
class AnfitrionComponent {
    nombre = 'Anguiliano';
    original = 'Anguillian';
    manual: any = 'Naufragio en la tormenta, Página: 137';
    filas = 0;
    abiertos = 0;
}

describe('ListadoNombreComponent y manualListado', () => {
    let fixture: ComponentFixture<AnfitrionComponent>;
    const raiz = () => fixture.nativeElement as HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AnfitrionComponent, ListadoNombreComponent, IconoRolComponent, ManualListadoPipe],
        }).compileComponents();
        fixture = TestBed.createComponent(AnfitrionComponent);
        fixture.detectChanges();
    });

    it('pinta el icono del catálogo, el nombre como botón y el original en gris', () => {
        expect(raiz().querySelector('app-icono-rol')?.getAttribute('aria-hidden')).toBe('true');
        expect(raiz().querySelector('.listado-nombre__boton')?.textContent?.trim()).toBe('Anguiliano');
        expect(raiz().querySelector('.listado-nombre__original')?.textContent?.trim()).toBe('Anguillian');
    });

    it('sin traducción no hay línea del original', () => {
        fixture.componentInstance.original = '';
        fixture.detectChanges();
        expect(raiz().querySelector('.listado-nombre__original')).toBeNull();
    });

    it('el nombre abre el detalle sin pasar el clic a la fila', () => {
        raiz().querySelector<HTMLButtonElement>('.listado-nombre__boton')!.click();
        expect(fixture.componentInstance.abiertos).toBe(1);
        expect(fixture.componentInstance.filas).toBe(0);
    });

    it('el manual se escribe «Libro · p. N»', () => {
        expect(raiz().querySelector('.manual')?.textContent?.trim()).toBe('Naufragio en la tormenta · p. 137');
    });

    // El icono de cada fila repite el de la pestaña (lienzo «Rol: temas e iconos»): es un adorno, que los temas no pintan.
    describe('el icono de la fila es un adorno', () => {
        const html = document.documentElement;
        let antes: string | undefined;
        beforeEach(() => antes = html.dataset['iconos']);
        afterEach(() => {
            if (antes === undefined)
                delete html.dataset['iconos'];
            else
                html.dataset['iconos'] = antes;
        });
        const visible = () => getComputedStyle(raiz().querySelector('app-icono-rol')!).display !== 'none';

        it('se pinta sin política de iconos (los temas apagados), como antes', () => {
            delete html.dataset['iconos'];
            expect(raiz().querySelector('app-icono-rol')?.getAttribute('data-icono')).toBe('adorno');
            expect(visible()).toBeTrue();
        });

        it('no se pinta «con criterio» ni en «mínimos»', () => {
            html.dataset['iconos'] = 'criterio';
            expect(visible()).toBeFalse();
            html.dataset['iconos'] = 'minimos';
            expect(visible()).toBeFalse();
        });
    });

    // El tema C (fase 3): el nombre de la fila en Literata a 600, y la palabra entera (la tabla no la parte en dos).
    describe('la letra de la fila sigue al tema', () => {
        const html = document.documentElement;
        let antes: string | undefined;
        beforeEach(() => antes = html.dataset['tema']);
        afterEach(() => {
            if (antes === undefined)
                delete html.dataset['tema'];
            else
                html.dataset['tema'] = antes;
        });
        const boton = () => getComputedStyle(raiz().querySelector('.listado-nombre__boton')!);

        it('en C, Literata a 600 y sin partir las palabras; en A, Roboto a 500, como siempre', () => {
            html.dataset['tema'] = 'c';
            expect(boton().fontFamily).toContain('Literata');
            expect(boton().fontWeight).toBe('600');
            expect(boton().overflowWrap).toBe('break-word');
            html.dataset['tema'] = 'a';
            expect(boton().fontFamily).toContain('Roboto');
            expect(boton().fontWeight).toBe('500');
            expect(boton().overflowWrap).toBe('anywhere');
        });
    });
});
