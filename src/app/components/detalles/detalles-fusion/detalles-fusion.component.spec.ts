import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { normalizarChakraDetalle, normalizarFusion } from 'src/app/services/utils/incarnum-mapper';
import { chakraApi, fusionApi } from 'src/testing/incarnum';
import { lectorFicha } from 'src/testing/ficha-detalle';
import { DetallesFusionComponent } from './detalles-fusion.component';

describe('DetallesFusionComponent', () => {
    let component: DetallesFusionComponent;
    let fixture: ComponentFixture<DetallesFusionComponent>;
    let manualNavSpy: jasmine.SpyObj<ManualDetalleNavigationService>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, valor, etiquetasDatos, etiquetasCabecera, tipoCabecera, enlace, filasPares } = lectorFicha(elemento);

    beforeEach(async () => {
        manualNavSpy = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        await TestBed.configureTestingModule({
            declarations: [DetallesFusionComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [
                { provide: ManualDetalleNavigationService, useValue: manualNavSpy },
                { provide: IncarnumService, useValue: { getChakras: () => of([normalizarChakraDetalle(chakraApi())]) } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(DetallesFusionComponent);
        component = fixture.componentInstance;
        component.fusion = normalizarFusion(fusionApi());
        fixture.detectChanges();
    });

    it('la cabecera: tipo con sus clases, el nombre, el manual, Oficial, Traducido y los descriptores', () => {
        expect(tipoCabecera()).toBe('Fusión del alma · Encarnado · Nacido del alma');
        expect(texto()).toContain('Yelmo de cristal');
        expect(elemento().querySelector('.ficha-cabecera__manual')?.textContent).toContain('Magia del incarnum · pág. 63');
        expect(etiquetasCabecera()).toEqual(jasmine.arrayContaining(['Oficial', 'Traducido', 'Fuerza']));
    });

    it('los datos clave, con la ranura que cierra el vínculo (del catálogo de chakras) y el nombre original', () => {
        expect(valor('Se moldea en')).toBe('Corona');
        expect(valor('Vínculos')).toBe('Corona');
        expect(valor('Descriptores')).toBe('Fuerza');
        expect(valor('Clases')).toBe('Encarnado, Nacido del alma');
        expect(valor('Ranura que cierra al vincular')).toBe('Cabeza');
        expect(valor('Nombre original')).toBe('Crystal Helm');
        expect(etiquetasDatos()).not.toContain('Salvación');
        expect(etiquetasDatos()).not.toContain('Alineamiento');
    });

    it('el efecto, la esencia y el vínculo de cada chakra, con la nota de la descripción propia', () => {
        expect(titulos()).toEqual(jasmine.arrayContaining(['Efecto', 'Esencia', 'Vínculo de Corona', 'Chakras', 'La moldean']));
        expect(texto()).toContain('Bonificador de desvío a la CA');
        expect(texto()).toContain('Descripción propia');
        expect(filasPares()[0]).toEqual(['Corona Chakra mínimo: lo abren Encarnado a nivel 2, Totemista a nivel 5', 'se moldea · vincula']);
    });

    it('las clases y los chakras abren su detalle', () => {
        const clase = spyOn(component.claseDetallesId, 'emit');
        const chakra = spyOn(component.chakraDetallesId, 'emit');
        enlace('Nacido del alma').click();
        enlace('Corona').click();
        expect(clase).toHaveBeenCalledWith(406);
        expect(chakra).toHaveBeenCalledWith(34);
    });

    it('la que toma el alineamiento del portador lo dice; sin textos, no salen sus secciones', () => {
        component.fusion = normalizarFusion(fusionApi({ Alineado_portador: true, Efecto_esencia: null, Descripcion: null, Origen_descripcion: 'srd' }));
        fixture.detectChanges();
        expect(valor('Alineamiento')).toBe('El de quien la moldea');
        expect(titulos()).not.toContain('Esencia');
        expect(titulos()).not.toContain('Descripción');
        expect(texto()).not.toContain('Descripción propia');
    });
});
