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
});
