import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { ManualAsociadoDetalle } from 'src/app/interfaces/manual-asociado';
import { DetallesManualComponent } from './detalles-manual.component';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualReferenciaNavigationService } from 'src/app/services/manual-referencia-navigation.service';
import { UserService } from 'src/app/services/user.service';

describe('DetallesManualComponent', () => {
    let component: DetallesManualComponent;
    let fixture: ComponentFixture<DetallesManualComponent>;
    let permisos$: BehaviorSubject<number>;
    let navegacion: jasmine.SpyObj<ManualReferenciaNavigationService>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const texto = (): string => `${elemento().textContent ?? ''}`;
    const valor = (etiqueta: string): string | null => {
        const dato = Array.from(elemento().querySelectorAll('.ficha-dato'))
            .find((d) => `${d.querySelector('dt')?.textContent ?? ''}`.trim() === etiqueta);
        return dato ? `${dato.querySelector('dd')?.textContent ?? ''}`.replace(/\s+/g, ' ').trim() : null;
    };
    const titulosBloques = (): string[] => Array.from(elemento().querySelectorAll('.ficha-bloque .ficha-titulo')).map((t) => `${t.textContent ?? ''}`.trim());

    function manual(cambios: Partial<ManualAsociadoDetalle> = {}): ManualAsociadoDetalle {
        return {
            Id: 7,
            Nombre: 'Psiónica expandida',
            Incluye_dotes: false,
            Incluye_conjuros: false,
            Incluye_plantillas: false,
            Incluye_monstruos: false,
            Incluye_razas: false,
            Incluye_clases: false,
            Incluye_tipos: false,
            Incluye_subtipos: false,
            Oficial: true,
            Asociados: {
                Dotes: [],
                Conjuros: [],
                Plantillas: [],
                Monstruos: [],
                Razas: [{ Id: 11, Nombre: 'Thri-kreen', Descripcion: '' }],
                Clases: [],
                Tipos: [],
                Subtipos: [],
            },
            ...cambios,
        };
    }

    beforeEach(async () => {
        permisos$ = new BehaviorSubject<number>(0);
        navegacion = jasmine.createSpyObj<ManualReferenciaNavigationService>('ManualReferenciaNavigationService', ['emitirApertura']);

        await TestBed.configureTestingModule({
            declarations: [DetallesManualComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            imports: [CommonModule],
            providers: [
                { provide: ManualReferenciaNavigationService, useValue: navegacion },
                { provide: UserService, useValue: { permisos$ } },
                {
                    provide: ManualFlagConsistencyNoticeService,
                    useValue: jasmine.createSpyObj<ManualFlagConsistencyNoticeService>('ManualFlagConsistencyNoticeService', ['notifyAdminIfNeeded']),
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesManualComponent);
        component = fixture.componentInstance;
    });

    it('renderiza la sección efectiva aunque la flag esté a false', () => {
        component.manual = manual();
        fixture.detectChanges();

        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Psiónica expandida');
        expect(texto()).toContain('Oficial');
        expect(valor('Categorías')).toBe('Razas');
        expect(valor('Secciones')).toBe('1');
        expect(valor('Entradas')).toBe('1');
        expect(titulosBloques()).toEqual(['Razas (1)']);
        expect(texto()).toContain('Thri-kreen');
        expect(elemento().querySelector('mat-chip')).toBeNull();
    });

    it('cada entrada abre su detalle desde la tabla de su sección', () => {
        component.manual = manual();
        fixture.detectChanges();
        (elemento().querySelector('.ficha-tabla button.ficha-enlace') as HTMLButtonElement).click();
        expect(navegacion.emitirApertura).toHaveBeenCalledWith({ tipo: 'raza', id: 11, nombre: 'Thri-kreen', manualId: 7 });
    });

    it('el resumen por sección esconde y vuelve a enseñar una sección', () => {
        component.manual = manual({
            Asociados: {
                ...manual().Asociados,
                Dotes: [{ Id: 3, Nombre: 'Mente abierta', Descripcion: 'Ganas puntos de poder.' }],
            },
        });
        fixture.detectChanges();
        expect(titulosBloques().sort()).toEqual(['Dotes (1)', 'Razas (1)']);
        expect(texto()).toContain('Ganas puntos de poder.');

        component.toggleSeccion('Dotes');
        fixture.detectChanges();
        expect(titulosBloques()).toEqual(['Razas (1)']);

        component.toggleSeccion('Dotes');
        fixture.detectChanges();
        expect(titulosBloques().sort()).toEqual(['Dotes (1)', 'Razas (1)']);
    });

    it('recorta las descripciones largas', () => {
        const larga = `${'Una descripción muy larga '.repeat(20)}fin`;
        component.manual = manual({ Asociados: { ...manual().Asociados, Razas: [{ Id: 11, Nombre: 'Thri-kreen', Descripcion: larga }] } });
        fixture.detectChanges();
        const celda = `${elemento().querySelector('.ficha-tabla tbody td:nth-child(2)')?.textContent ?? ''}`.trim();
        expect(celda.length).toBeLessThan(230);
        expect(celda.endsWith('…')).toBeTrue();
    });

    it('sin entradas lo dice y no pinta tablas', () => {
        component.manual = manual({ Asociados: { ...manual().Asociados, Razas: [] } });
        fixture.detectChanges();
        expect(valor('Categorías')).toBe('Sin categorías');
        expect(texto()).toContain('Este manual no tiene entradas asociadas.');
        expect(titulosBloques()).toEqual([]);
    });
});
