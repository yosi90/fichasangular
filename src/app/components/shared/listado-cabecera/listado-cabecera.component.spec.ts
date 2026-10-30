import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { IconoRolComponent } from '../icono-rol/icono-rol.component';
import { ListadoCabeceraComponent } from './listado-cabecera.component';

@Component({
    template: `<app-listado-cabecera icono="personaje" titulo="Personajes" [total]="total" [texto]="texto" (textoChange)="escrito.push($event)"
        etiquetaBuscar="Buscar personajes" placeholder="Buscar por nombre, raza o clase"><button type="button" class="filtros">F</button></app-listado-cabecera>`,
    standalone: false
})
class AnfitrionComponent {
    total: number | null = 9;
    texto = '';
    escrito: string[] = [];
}

describe('ListadoCabeceraComponent', () => {
    let fixture: ComponentFixture<AnfitrionComponent>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AnfitrionComponent, ListadoCabeceraComponent, IconoRolComponent],
            imports: [MatIconModule],
        }).compileComponents();
        fixture = TestBed.createComponent(AnfitrionComponent);
        fixture.detectChanges();
    });

    it('enseña el icono del catálogo en su recuadro de 40, el título, el total y lo proyectado (los filtros)', () => {
        const icono = elemento().querySelector('app-icono-rol') as HTMLElement;
        expect(icono.style.width).toBe('40px');
        expect(elemento().querySelector('h2')?.textContent?.trim()).toBe('Personajes');
        expect(elemento().querySelector('.listado-cabecera__total')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('9 en total');
        expect(elemento().querySelector('.listado-cabecera__acciones .filtros')).not.toBeNull();
    });

    it('el buscador tiene su nombre accesible y avisa de lo que se escribe', () => {
        const campo = elemento().querySelector('input') as HTMLInputElement;
        const etiqueta = elemento().querySelector(`label[for="${campo.id}"]`);
        expect(etiqueta?.textContent).toContain('Buscar personajes');
        expect(campo.placeholder).toBe('Buscar por nombre, raza o clase');
        campo.value = 'lázaro';
        campo.dispatchEvent(new Event('input'));
        expect(fixture.componentInstance.escrito).toEqual(['lázaro']);
    });

    it('sin total, no lo enseña', () => {
        fixture.componentInstance.total = null;
        fixture.detectChanges();
        expect(elemento().querySelector('.listado-cabecera__total')).toBeNull();
    });

    it('una pantalla que no es un listado la usa con subtítulo y sin buscador', async () => {
        expect(elemento().querySelector('.listado-cabecera__subtitulo')).toBeNull();
        TestBed.resetTestingModule();
        @Component({
            template: '<app-listado-cabecera icono="dado-d20" titulo="Dados" subtitulo="Tiradas sueltas para la mesa" [buscador]="false"></app-listado-cabecera>',
            standalone: false
        })
        class SinBuscadorComponent { }
        await TestBed.configureTestingModule({
            declarations: [SinBuscadorComponent, ListadoCabeceraComponent, IconoRolComponent],
            imports: [MatIconModule],
        }).compileComponents();
        const otra = TestBed.createComponent(SinBuscadorComponent);
        otra.detectChanges();
        const raiz = otra.nativeElement as HTMLElement;
        expect(raiz.querySelector('.listado-cabecera__subtitulo')?.textContent?.trim()).toBe('Tiradas sueltas para la mesa');
        expect(raiz.querySelector('input')).toBeNull();
        expect(raiz.querySelector('[role="search"]')).toBeNull();
    });
});
