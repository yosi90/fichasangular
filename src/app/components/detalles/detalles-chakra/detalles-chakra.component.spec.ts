import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { normalizarChakraDetalle } from 'src/app/services/utils/incarnum-mapper';
import { chakraApi } from 'src/testing/incarnum';
import { lectorFicha } from 'src/testing/ficha-detalle';
import { DetallesChakraComponent } from './detalles-chakra.component';

describe('DetallesChakraComponent', () => {
    let component: DetallesChakraComponent;
    let fixture: ComponentFixture<DetallesChakraComponent>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, valor, tipoCabecera, enlace, filasPares, bloque } = lectorFicha(elemento);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesChakraComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(DetallesChakraComponent);
        component = fixture.componentInstance;
        component.chakra = normalizarChakraDetalle(chakraApi());
        fixture.detectChanges();
    });

    it('la cabecera y los datos: categoría, ranura que cierra, cuántas fusiones y el nombre original', () => {
        expect(tipoCabecera()).toBe('Chakra · Mínimo');
        expect(valor('Categoría')).toBe('Mínimo');
        expect(valor('Ranura que cierra al vincular')).toBe('Cabeza');
        expect(valor('Fusiones que se moldean aquí')).toBe('2');
        expect(valor('Nombre original')).toBe('Crown');
        expect(texto()).toContain('Chakra mínimo de la cabeza');
    });

    it('las clases que lo abren, por nivel, y sus fusiones por nombre, con enlaces', () => {
        expect(filasPares()).toEqual([['Encarnado', 'desde el nivel 2'], ['Totemista', 'desde el nivel 5']]);
        expect(titulos()).toContain('Fusiones (2)');
        expect(bloque('Fusiones (2)')?.textContent).toContain('Diadema del domador de bestias');
        const clase = spyOn(component.claseDetallesId, 'emit');
        const fusion = spyOn(component.fusionDetallesId, 'emit');
        enlace('Encarnado').click();
        enlace('Yelmo de cristal').click();
        expect(clase).toHaveBeenCalledWith(405);
        expect(fusion).toHaveBeenCalledWith(284);
    });

    it('el del tótem no tiene ranura ni clases que no lo abran', () => {
        component.chakra = normalizarChakraDetalle(chakraApi({ Ranura: null, Clases: [], Fusiones: [], Categoria: { Id: 24, Nombre: 'Tótem', Orden: 6 } }));
        fixture.detectChanges();
        expect(valor('Ranura que cierra al vincular')).toBeNull();
        expect(titulos()).not.toContain('Lo abren para vincular');
        expect(titulos().some((t) => t.startsWith('Fusiones ('))).toBeFalse();
    });
});
