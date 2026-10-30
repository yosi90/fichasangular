import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TipoRol } from 'src/app/services/utils/iconos-rol';
import { IconoRolComponent } from './icono-rol.component';

@Component({
    template: '<app-icono-rol [tipo]="tipo" [tamano]="tamano" [recuadro]="recuadro" [solo]="solo" [etiqueta]="etiqueta"></app-icono-rol>',
    standalone: false
})
class AnfitrionComponent {
    tipo: TipoRol = 'raza';
    tamano = 18;
    recuadro: boolean | 'oscuro' = false;
    solo = false;
    etiqueta: string | null = null;
}

describe('IconoRolComponent', () => {
    let fixture: ComponentFixture<AnfitrionComponent>;
    const icono = (): HTMLElement => fixture.nativeElement.querySelector('app-icono-rol');
    const dibujo = (): HTMLElement => icono().querySelector('.icono-rol__dibujo') as HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ declarations: [AnfitrionComponent, IconoRolComponent] }).compileComponents();
        fixture = TestBed.createComponent(AnfitrionComponent);
    });

    it('pinta el SVG de su catálogo como máscara, con la clase de su grupo', () => {
        fixture.componentInstance.tipo = 'conjuro';
        fixture.detectChanges();
        expect(icono().classList).toContain('icono-rol--magia');
        expect(dibujo().style.width).toBe('18px');
        const mascara = dibujo().style.getPropertyValue('mask-image') || dibujo().style.getPropertyValue('-webkit-mask-image');
        expect(mascara).toContain('assets/iconos/game-icons/spell-book.svg');
    });

    it('con texto al lado es decoración: el lector de pantalla no lo lee', () => {
        fixture.detectChanges();
        expect(icono().getAttribute('aria-hidden')).toBe('true');
        expect(icono().getAttribute('role')).toBeNull();
    });

    it('solo, se anuncia con la etiqueta del catálogo o con la que se le dé', () => {
        fixture.componentInstance.solo = true;
        fixture.componentInstance.tipo = 'clase-prestigio';
        fixture.detectChanges();
        expect(icono().getAttribute('role')).toBe('img');
        expect(icono().getAttribute('aria-label')).toBe('Clase de prestigio');
        expect(icono().getAttribute('aria-hidden')).toBeNull();

        fixture.componentInstance.etiqueta = 'Lista de clases';
        fixture.detectChanges();
        expect(icono().getAttribute('aria-label')).toBe('Lista de clases');
    });

    it('el recuadro mide lo del lienzo: 28 para 18, 40 para 28, 56 para 38 y el oscuro del menú 24 para 16', () => {
        const medidas: [number, boolean | 'oscuro', number, string][] = [[18, true, 28, 'icono-rol--recuadro'], [28, true, 40, 'icono-rol--recuadro'], [38, true, 56, 'icono-rol--recuadro'], [16, 'oscuro', 24, 'icono-rol--oscuro']];
        for (const [tamano, recuadro, caja, clase] of medidas) {
            fixture.componentInstance.tamano = tamano;
            fixture.componentInstance.recuadro = recuadro;
            fixture.detectChanges();
            expect(icono().style.width).withContext(`${tamano}`).toBe(`${caja}px`);
            expect(icono().classList).toContain(clase);
        }
    });

    it('sin recuadro no fija la caja', () => {
        fixture.detectChanges();
        expect(icono().style.width).toBe('');
        expect(icono().classList).not.toContain('icono-rol--recuadro');
    });
});
