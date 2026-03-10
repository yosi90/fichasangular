import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { DetallesManualComponent } from './detalles-manual.component';
import { ManualFlagConsistencyNoticeService } from 'src/app/services/manual-flag-consistency-notice.service';
import { ManualReferenciaNavigationService } from 'src/app/services/manual-referencia-navigation.service';
import { UserService } from 'src/app/services/user.service';

describe('DetallesManualComponent', () => {
    let component: DetallesManualComponent;
    let fixture: ComponentFixture<DetallesManualComponent>;
    let permisos$: BehaviorSubject<number>;

    beforeEach(async () => {
        permisos$ = new BehaviorSubject<number>(0);

        await TestBed.configureTestingModule({
            declarations: [DetallesManualComponent],
            imports: [CommonModule],
            providers: [
                {
                    provide: ManualReferenciaNavigationService,
                    useValue: jasmine.createSpyObj<ManualReferenciaNavigationService>('ManualReferenciaNavigationService', ['emitirApertura']),
                },
                {
                    provide: UserService,
                    useValue: {
                        permisos$,
                    },
                },
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
        component.manual = {
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
            }
        };

        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;
        expect(text).toContain('Razas');
        expect(text).toContain('Thri-kreen');
    });
});
