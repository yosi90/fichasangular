import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { DescripcionEquipoComponent } from 'src/app/components/shared/descripcion-equipo/descripcion-equipo.component';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesArmaduraComponent } from './detalles-armadura.component';
import { normalizeArmadura } from 'src/app/services/armadura.service';
import { crearArmaduraApi, crearRodelaApi } from 'src/testing/equipo-api';

describe('DetallesArmaduraComponent', () => {
    let component: DetallesArmaduraComponent;
    let fixture: ComponentFixture<DetallesArmaduraComponent>;
    let manualNavSpy: jasmine.SpyObj<ManualDetalleNavigationService>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const texto = (): string => `${elemento().textContent ?? ''}`;
    const etiquetas = (): string[] => Array.from(elemento().querySelectorAll('.ficha-dato dt')).map((dt) => `${dt.textContent ?? ''}`.trim());
    const valor = (etiqueta: string): string | null => {
        const dato = Array.from(elemento().querySelectorAll('.ficha-dato'))
            .find((d) => `${d.querySelector('dt')?.textContent ?? ''}`.trim() === etiqueta);
        return dato ? `${dato.querySelector('dd')?.textContent ?? ''}`.replace(/\s+/g, ' ').trim() : null;
    };
    const tipo = (): string => `${elemento().querySelector('.ficha-cabecera__tipo')?.textContent ?? ''}`.trim();

    beforeEach(async () => {
        manualNavSpy = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);

        await TestBed.configureTestingModule({
            declarations: [DetallesArmaduraComponent, TextoManualComponent, DescripcionEquipoComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [
                { provide: ManualDetalleNavigationService, useValue: manualNavSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesArmaduraComponent);
        component = fixture.componentInstance;
        component.armadura = normalizeArmadura(crearArmaduraApi({
            Id: 1,
            Descripcion: 'Protección sólida.',
            Manual: { Id: 2, Nombre: 'Manual base', Pagina: 87 },
            Peso_armadura: { Id: 3, Nombre: 'Pesada' },
        }));
        fixture.detectChanges();
    });

    it('la cabecera dice que es una armadura y su peso', () => {
        expect(tipo()).toBe('Armadura · Pesada');
        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Cota de mallas');
        expect(elemento().querySelector('.ficha-cabecera__manual')?.textContent).toContain('Manual base · pág. 87');
    });

    it('abre el detalle del manual', () => {
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(manualNavSpy.abrirDetalleManual).toHaveBeenCalledWith({ id: 2, nombre: 'Manual base' });
    });

    it('enseña la CA, la Destreza máxima, el penalizador, el fallo arcano y la velocidad', () => {
        expect(valor('Bonificador a la CA')).toBe('+5');
        expect(valor('Destreza máxima')).toBe('+2');
        expect(valor('Penalizador de armadura')).toBe('-5');
        expect(valor('Fallo de conjuro arcano')).toBe('30%');
        expect(valor('Velocidad')).toBe('20 pies (de 30) · 15 pies (de 20)');
        expect(valor('Correr')).toBe('×4');
        expect(valor('Precio')).toBe('150 po');
        expect(valor('Peso')).toBe('40 lb');
        expect(valor('Material')).toBe('Acero');
        expect(texto()).toContain('Protección sólida.');
        expect(texto()).toContain('Texto del SRD');
        expect(elemento().querySelector('mat-chip')).toBeNull();
    });

    it('no enseña lo que la API da null (los tiempos aún sin leer)', () => {
        expect(etiquetas()).not.toContain('Ponérsela');
        expect(etiquetas()).not.toContain('Ponérsela deprisa');
        expect(etiquetas()).not.toContain('Quitársela');
        expect(texto()).not.toContain('null');
    });

    it('un escudo sin límite de Destreza enseña «Sin límite» y su tipo de escudo', () => {
        component.armadura = normalizeArmadura(crearRodelaApi());
        fixture.detectChanges();
        expect(component.armadura.Bon_des).toBeNull();
        expect(tipo()).toBe('Escudo · Broquel');
        expect(valor('Destreza máxima')).toBe('Sin límite');
        expect(etiquetas()).not.toContain('Velocidad');
        expect(etiquetas()).not.toContain('Correr');
        expect(texto()).not.toContain('Descripción');
        expect(texto()).not.toContain('Tipo_armadura');
    });
});
