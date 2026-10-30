import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { ManualListadoPipe } from '../listado-nombre/manual-listado.pipe';
import { ListadoManualComponent, ManualDeFila } from './listado-manual.component';

@Component({
    template: `<div class="fila" (click)="filas = filas + 1"><app-listado-manual [manual]="manual"></app-listado-manual></div>`,
    standalone: false,
})
class AnfitrionComponent {
    manual: ManualDeFila = { Id: 1, Nombre: 'Manual base', Pagina: 5 };
    filas = 0;
}

describe('ListadoManualComponent', () => {
    let fixture: ComponentFixture<AnfitrionComponent>;
    let nav: jasmine.SpyObj<ManualDetalleNavigationService>;
    const boton = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.listado-manual')!;

    beforeEach(async () => {
        nav = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        await TestBed.configureTestingModule({
            declarations: [AnfitrionComponent, ListadoManualComponent, ManualListadoPipe],
            providers: [{ provide: ManualDetalleNavigationService, useValue: nav }],
        }).compileComponents();
        fixture = TestBed.createComponent(AnfitrionComponent);
        fixture.detectChanges();
    });

    it('escribe el manual «Libro · p. N»', () => {
        expect(boton().textContent?.trim()).toBe('Manual base · p. 5');
    });

    it('abre el manual por su id y su nombre sin pasar el clic a la fila', () => {
        boton().click();
        expect(nav.abrirDetalleManual).toHaveBeenCalledWith({ id: 1, nombre: 'Manual base' });
        expect(fixture.componentInstance.filas).toBe(0);
    });

    it('si el manual es un texto, lo abre por ese texto', () => {
        fixture.componentInstance.manual = 'Naufragio en la tormenta, Página: 137';
        fixture.detectChanges();
        expect(boton().textContent?.trim()).toBe('Naufragio en la tormenta · p. 137');
        boton().click();
        expect(nav.abrirDetalleManual).toHaveBeenCalledWith('Naufragio en la tormenta, Página: 137');
    });
});
