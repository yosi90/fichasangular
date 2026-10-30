import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MENU_FILTROS_COMPONENTES } from './menu-filtros.component';

@Component({
    template: `
        <app-menu-filtros titulo="Filtros de prueba" [hayFiltros]="hayFiltros" (limpiar)="limpiezas = limpiezas + 1">
            <app-menu-filtros-grupo titulo="Buscar"><input class="campo-prueba"></app-menu-filtros-grupo>
            <app-menu-filtros-grupo titulo="Mostrar" [chips]="true"><span class="chip-prueba">Homebrew</span></app-menu-filtros-grupo>
        </app-menu-filtros>`,
    standalone: false,
})
class AnfitrionComponent {
    hayFiltros = true;
    limpiezas = 0;
}

@Component({
    template: `<app-menu-filtros titulo="Sin limpiar"><app-menu-filtros-grupo titulo="Buscar"></app-menu-filtros-grupo></app-menu-filtros>`,
    standalone: false,
})
class SinLimpiarComponent { }

describe('MenuFiltrosComponent', () => {
    let overlay: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AnfitrionComponent, SinLimpiarComponent, ...MENU_FILTROS_COMPONENTES],
            imports: [MatMenuModule, MatButtonModule, MatIconModule, MatTooltipModule, NoopAnimationsModule],
        }).compileComponents();
        overlay = TestBed.inject(OverlayContainer).getContainerElement();
    });

    function crear<T>(tipo: new (...args: any[]) => T): ComponentFixture<T> {
        const fixture = TestBed.createComponent(tipo);
        fixture.detectChanges();
        return fixture;
    }
    const boton = (fixture: ComponentFixture<unknown>) => fixture.nativeElement.querySelector('button.filtros') as HTMLButtonElement;
    const panel = () => overlay.querySelector('.menu-filtros-estandar');

    it('no se abre al pasar el ratón por encima: solo con clic', fakeAsync(() => {
        const fixture = crear(AnfitrionComponent);

        boton(fixture).dispatchEvent(new MouseEvent('mouseenter'));
        fixture.detectChanges();
        flush();
        expect(panel()).toBeNull();

        boton(fixture).click();
        fixture.detectChanges();
        flush();
        expect(panel()).not.toBeNull();
        expect(boton(fixture).getAttribute('aria-label')).toBe('Filtros de prueba');
    }));

    it('un clic dentro no lo cierra; Escape sí', fakeAsync(() => {
        const fixture = crear(AnfitrionComponent);
        boton(fixture).click();
        fixture.detectChanges();
        flush();

        (overlay.querySelector('.campo-prueba') as HTMLElement).click();
        fixture.detectChanges();
        flush();
        expect(panel()).not.toBeNull();

        panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true } as KeyboardEventInit));
        fixture.detectChanges();
        flush();
        expect(panel()).toBeNull();
    }));

    it('enseña el título, los grupos con su título y «Limpiar filtros», que avisa y se desactiva sin filtros', fakeAsync(() => {
        const fixture = crear(AnfitrionComponent);
        boton(fixture).click();
        fixture.detectChanges();
        flush();

        expect(overlay.querySelector('.menu-filtros__titulo')?.textContent?.trim()).toBe('Filtros de prueba');
        expect(Array.from(overlay.querySelectorAll('.menu-filtros__grupo-titulo')).map((t) => t.textContent?.trim())).toEqual(['Buscar', 'Mostrar']);
        expect(overlay.querySelector('.menu-filtros__grupo-cuerpo--chips .chip-prueba')).not.toBeNull();
        const limpiar = overlay.querySelector('.menu-filtros__limpiar') as HTMLButtonElement;
        limpiar.click();
        expect(fixture.componentInstance.limpiezas).toBe(1);

        fixture.componentInstance.hayFiltros = false;
        fixture.detectChanges();
        expect(limpiar.disabled).toBeTrue();
    }));

    it('sin nadie que escuche «limpiar», no hay botón de limpiar', fakeAsync(() => {
        const fixture = crear(SinLimpiarComponent);
        boton(fixture).click();
        fixture.detectChanges();
        flush();

        expect(overlay.querySelector('.menu-filtros__limpiar')).toBeNull();
    }));
});
