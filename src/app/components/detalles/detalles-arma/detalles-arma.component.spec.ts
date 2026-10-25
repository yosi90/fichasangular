import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { DescripcionEquipoComponent } from 'src/app/components/shared/descripcion-equipo/descripcion-equipo.component';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesArmaComponent } from './detalles-arma.component';
import { normalizeArma } from 'src/app/services/arma.service';
import { crearArmaApi } from 'src/testing/equipo-api';
import { lectorFicha } from 'src/testing/ficha-detalle';

describe('DetallesArmaComponent', () => {
    let component: DetallesArmaComponent;
    let fixture: ComponentFixture<DetallesArmaComponent>;
    let manualNavSpy: jasmine.SpyObj<ManualDetalleNavigationService>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, etiquetasDatos, valor, titulos } = lectorFicha(elemento);

    function mostrar(cambios: Record<string, any> = {}): void {
        component.arma = normalizeArma(crearArmaApi(cambios));
        fixture.detectChanges();
    }

    beforeEach(async () => {
        manualNavSpy = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);

        await TestBed.configureTestingModule({
            declarations: [DetallesArmaComponent, TextoManualComponent, DescripcionEquipoComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [
                { provide: ManualDetalleNavigationService, useValue: manualNavSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesArmaComponent);
        component = fixture.componentInstance;
        mostrar({
            Id: 1,
            Nombre: 'Espada larga',
            Descripcion: 'Hoja versátil.',
            Manual: { Id: 2, Nombre: 'Manual base', Pagina: 123 },
            Dano: '1d8',
            Dano_pequeno: '1d6',
            Dano_mediano: '1d8',
            Tipo_dano: { Id: 1, Nombre: 'Cortante' },
            Tipo_arma: { Id: 2, Nombre: 'Marcial' },
            Manejo: { Id: 3, Nombre: 'A una mano' },
            Arrojadiza: false,
            Precio: 15,
            Peso: 4,
            Incremento_distancia: 0,
            Propiedades: [{ Id: 2, Nombre: 'Desarmar', Descripcion: 'Ayuda a desarmar.', Valor: 2 }],
        });
    });

    it('la cabecera dice el tipo de arma, su manejo, el manual y si es oficial', () => {
        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Arma · Marcial · A una mano');
        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Espada larga');
        expect(elemento().querySelector('.ficha-cabecera__manual')?.textContent).toContain('Manual base · pág. 123');
        expect(texto()).toContain('Oficial');
    });

    it('abre el detalle del manual desde la cabecera', () => {
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(manualNavSpy.abrirDetalleManual).toHaveBeenCalledWith({ id: 2, nombre: 'Manual base' });
    });

    it('enseña el daño por tamaño, el crítico explicado y los demás datos', () => {
        expect(valor('Daño (Pequeño)')).toBe('1d6');
        expect(valor('Daño (Mediano)')).toBe('1d8');
        expect(valor('Crítico')).toBe('19-20/x2 (amenaza con 19-20, daño ×2)');
        expect(valor('Tipo de daño')).toBe('Cortante');
        expect(valor('Precio')).toBe('15 po');
        expect(valor('Peso')).toBe('4 lb');
        expect(valor('Tamaño')).toBe('Mediano');
        expect(valor('Material')).toBe('Hierro');
    });

    it('las propiedades se ven con su explicación, sin pastillas', () => {
        expect(titulos()).toContain('Propiedades');
        expect(texto()).toContain('Desarmar +2');
        expect(texto()).toContain('Ayuda a desarmar.');
        expect(elemento().querySelector('mat-chip')).toBeNull();
    });

    it('la descripción va con su origen', () => {
        expect(titulos()).toContain('Descripción');
        expect(texto()).toContain('Hoja versátil.');
        expect(texto()).toContain('Descripción propia');
    });

    it('sin dado ni crítico (un rayo) no enseña daño ni crítico, ni lo que es null', () => {
        mostrar({ Nombre: 'Rayo', Dano: null, Dano_pequeno: null, Dano_mediano: null, Critico: null, Critico_rango: null, Critico_multiplicador: null, Manejo: null, Material: null, Incremento_distancia: 0, Alcance: null, Descripcion: '' });
        expect(texto()).toContain('Rayo');
        expect(etiquetasDatos().some((e) => e.startsWith('Daño'))).toBeFalse();
        expect(etiquetasDatos()).not.toContain('Crítico');
        expect(etiquetasDatos()).not.toContain('Material');
        expect(etiquetasDatos()).not.toContain('Incremento de distancia');
        expect(etiquetasDatos()).not.toContain('Alcance');
        expect(titulos()).not.toContain('Descripción');
        expect(texto()).not.toContain('null');
    });

    it('sin daño por tamaño, el daño compuesto; y el crítico doble de un arma doble', () => {
        mostrar({ Dano: '1d8/1d6', Dano_pequeno: null, Dano_mediano: null, Critico: 'x3/x4', Critico_rango: 20, Critico_multiplicador: 3, Critico_multiplicador_2: 4, Doble: true });
        expect(valor('Daño')).toBe('1d8/1d6');
        expect(valor('Crítico')).toBe('x3/x4 (amenaza con 20, daño ×3 y ×4)');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => e.textContent?.trim())).toContain('Doble');
    });

    it('el incremento de distancia, el alcance y la munición (que se abre)', () => {
        const emitSpy = spyOn(component.municionDetallesId, 'emit');
        mostrar({ Incremento_distancia: 60, Alcance: 10, Municion: { Id: 1, Nombre: 'Flechas' }, A_distancia: true });
        expect(valor('Incremento de distancia')).toBe('60 pies');
        expect(valor('Alcance')).toBe('10 pies');
        expect(valor('Munición')).toBe('Flechas');
        const enlace = Array.from(elemento().querySelectorAll('.ficha-dato button.ficha-enlace'))
            .find((b) => b.textContent?.trim() === 'Flechas') as HTMLButtonElement;
        enlace.click();
        expect(emitSpy).toHaveBeenCalledWith(1);
    });
});
