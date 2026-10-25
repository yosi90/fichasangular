import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { DetallesRasgoRacialComponent } from './detalles-rasgo.component';

describe('DetallesRasgoRacialComponent', () => {
    let component: DetallesRasgoRacialComponent;
    let fixture: ComponentFixture<DetallesRasgoRacialComponent>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesRasgoRacialComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesRasgoRacialComponent);
        component = fixture.componentInstance;
    });

    it('enseña el tipo, el nombre, si es oficial y la descripción en una sección', () => {
        component.rasgo = { Id: 4, Nombre: 'Visión en la oscuridad', Descripcion: 'Ve sin luz hasta 60 pies.', Oficial: true };
        fixture.detectChanges();

        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Rasgo');
        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Visión en la oscuridad');
        expect(elemento().querySelector('.ficha-etiqueta')?.textContent?.trim()).toBe('Oficial');
        expect(elemento().querySelector('.ficha-titulo')?.textContent?.trim()).toBe('Descripción');
        expect(elemento().textContent).toContain('Ve sin luz hasta 60 pies.');
        expect(elemento().querySelector('mat-chip')).toBeNull();
    });

    it('marca el homebrew y no pinta la descripción vacía', () => {
        component.rasgo = { Id: 5, Nombre: 'Propio', Descripcion: '', Oficial: false };
        fixture.detectChanges();

        expect(elemento().querySelector('.ficha-etiqueta--aviso')?.textContent?.trim()).toBe('Homebrew');
        expect(elemento().querySelector('.ficha-titulo')).toBeNull();
    });
});
