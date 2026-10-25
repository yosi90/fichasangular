import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { DetallesIdiomaComponent } from './detalles-idioma.component';
import { lectorFicha } from 'src/testing/ficha-detalle';

describe('DetallesIdiomaComponent', () => {
    let component: DetallesIdiomaComponent;
    let fixture: ComponentFixture<DetallesIdiomaComponent>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { etiquetasCabecera } = lectorFicha(elemento);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesIdiomaComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesIdiomaComponent);
        component = fixture.componentInstance;
    });

    it('enseña el idioma secreto con su etiqueta y la descripción', () => {
        component.idioma = { Id: 2, Nombre: 'Druídico', Descripcion: 'La lengua secreta de los druidas.', Secreto: true, Oficial: true };
        fixture.detectChanges();

        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Idioma');
        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Druídico');
        expect(etiquetasCabecera()).toEqual(['Secreto', 'Oficial']);
        expect(elemento().textContent).toContain('La lengua secreta de los druidas.');
    });

    it('sin secreto ni descripción no enseña la etiqueta ni la sección', () => {
        component.idioma = { Id: 3, Nombre: 'Común', Descripcion: null as any, Secreto: false, Oficial: false };
        fixture.detectChanges();

        expect(etiquetasCabecera()).toEqual(['Homebrew']);
        expect(elemento().querySelector('.ficha-titulo')).toBeNull();
    });
});
