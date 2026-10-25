import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesDeidadComponent } from './detalles-deidad.component';

describe('DetallesDeidadComponent', () => {
    let component: DetallesDeidadComponent;
    let fixture: ComponentFixture<DetallesDeidadComponent>;
    let manualNavSpy: jasmine.SpyObj<ManualDetalleNavigationService>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const texto = (): string => `${elemento().textContent ?? ''}`;
    const etiquetas = (): string[] => Array.from(elemento().querySelectorAll('.ficha-dato dt')).map((dt) => `${dt.textContent ?? ''}`.trim());
    const valor = (etiqueta: string): string | null => {
        const dato = Array.from(elemento().querySelectorAll('.ficha-dato'))
            .find((d) => `${d.querySelector('dt')?.textContent ?? ''}`.trim() === etiqueta);
        return dato ? `${dato.querySelector('dd')?.textContent ?? ''}`.replace(/\s+/g, ' ').trim() : null;
    };
    const titulos = (): string[] => Array.from(elemento().querySelectorAll('.ficha-titulo')).map((t) => `${t.textContent ?? ''}`.trim());

    function heironeous(cambios: Partial<DeidadDetalle> = {}): DeidadDetalle {
        return {
            Id: 1,
            Nombre: 'Heironeous',
            Descripcion: 'Deidad del valor.',
            Manual: { Id: 2, Nombre: 'Manual base', Pagina: 106 },
            Alineamiento: { Id: 3, Id_basico: 3, Nombre: 'Legal bueno' },
            Arma: { Id: 4, Nombre: 'Espada larga' },
            Pabellon: { Id: 5, Nombre: 'Bien' },
            Genero: { Id: 6, Nombre: 'Masculino' },
            Ambitos: [{ Id: 7, Nombre: 'Guerra' }],
            Dominios: [{ Id: 8, Nombre: 'Bien', Oficial: true }],
            Oficial: false,
            ...cambios,
        } as DeidadDetalle;
    }

    beforeEach(async () => {
        manualNavSpy = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        await TestBed.configureTestingModule({
            declarations: [DetallesDeidadComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNavSpy }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(DetallesDeidadComponent);
        component = fixture.componentInstance;
        component.deidad = heironeous();
        fixture.detectChanges();
    });

    it('la cabecera enseña el manual con su página y que es homebrew', () => {
        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Deidad');
        expect(elemento().querySelector('.ficha-cabecera__manual')?.textContent).toContain('Manual base · pág. 106');
        expect(texto()).toContain('Homebrew');
    });

    it('abre el detalle del manual', () => {
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(manualNavSpy.abrirDetalleManual).toHaveBeenCalledWith({ id: 2, nombre: 'Manual base' });
    });

    it('enseña sus datos, la descripción y los ámbitos y dominios siempre a la vista', () => {
        expect(valor('Alineamiento')).toBe('Legal bueno');
        expect(valor('Pabellón')).toBe('Bien');
        expect(valor('Género')).toBe('Masculino');
        expect(valor('Arma predilecta')).toBe('Espada larga');
        expect(texto()).toContain('Deidad del valor.');
        expect(titulos()).toEqual(jasmine.arrayContaining(['Descripción', 'Ámbitos', 'Dominios']));
        expect(texto()).toContain('Guerra');
        expect(elemento().querySelector('mat-expansion-panel')).toBeNull();
        expect(elemento().querySelector('mat-chip')).toBeNull();
    });

    it('el arma predilecta abre su detalle', () => {
        const emitSpy = spyOn(component.armaDetallesId, 'emit');
        (elemento().querySelector('.ficha-dato button.ficha-enlace') as HTMLButtonElement).click();
        expect(emitSpy).toHaveBeenCalledWith(4);
    });

    it('no enseña lo que viene vacío o de relleno', () => {
        component.deidad = heironeous({
            Descripcion: '',
            Arma: { Id: 0, Nombre: '' },
            Genero: { Id: 1, Nombre: 'Sin genero' },
            Ambitos: [],
            Dominios: [{ Id: 0, Nombre: '' } as any],
        });
        fixture.detectChanges();
        expect(etiquetas()).not.toContain('Arma predilecta');
        expect(etiquetas()).not.toContain('Género');
        expect(titulos()).not.toContain('Descripción');
        expect(titulos()).not.toContain('Ámbitos');
        expect(titulos()).not.toContain('Dominios');
    });
});
