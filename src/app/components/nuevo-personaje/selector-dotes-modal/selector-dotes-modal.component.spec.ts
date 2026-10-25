import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SelectorDotesModalComponent } from './selector-dotes-modal.component';

describe('SelectorDotesModalComponent', () => {
    let component: SelectorDotesModalComponent;
    let fixture: ComponentFixture<SelectorDotesModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SelectorDotesModalComponent],
            imports: [
                FormsModule,
                NoopAnimationsModule,
                MatButtonModule,
                MatChipsModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatSelectModule,
                MatTooltipModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SelectorDotesModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('recalcula el estado seleccionado y puede confirmar al elegir un candidato sin extra', () => {
        component.candidatos = [
            {
                dote: {
                    Id: 7,
                    Nombre: 'Ataque poderoso',
                    Manual: { Nombre: 'PHB', Pagina: 98 },
                    Tipos: [{ Nombre: 'General' }],
                } as any,
                restringidaPorTipo: false,
                repeticionValida: true,
                requiereExtra: false,
                extrasDisponibles: [],
                evaluacion: {
                    estado: 'eligible',
                    razones: [],
                    advertencias: [],
                },
            } as any,
        ];

        component.ngOnChanges({ candidatos: {} as any });
        component.seleccionarCandidato(component.candidatos[0] as any);

        expect(component.candidatoSeleccionado?.dote?.Id).toBe(7);
        expect(component.puedeConfirmar).toBeTrue();
    });
});

// Sin TestBed: los motivos y avisos de cada candidato son métodos puros del componente.
describe('SelectorDotesModalComponent: motivos y avisos', () => {
    const aviso = 'La web no puede comprobar este requisito: Amplias zancadas';
    const candidato = (estado: string, razones: string[], advertencias: string[]) => ({
        dote: { Id: 9, Nombre: 'Zancada de dragón', Manual: { Nombre: 'MM', Pagina: 1 }, Tipos: [] },
        restringidaPorTipo: false,
        repeticionValida: true,
        requiereExtra: false,
        extrasDisponibles: [],
        evaluacion: { estado, razones, advertencias },
    } as any);

    it('una dote elegible con un aviso se puede elegir y enseña el aviso, sin motivos de bloqueo', () => {
        const component = new SelectorDotesModalComponent();
        const elegible = candidato('eligible', [], [aviso]);

        expect(component.esCandidatoElegible(elegible)).toBeTrue();
        expect(component.getMotivosBloqueo(elegible)).toEqual([]);
        expect(component.getAvisos(elegible)).toEqual([aviso]);
    });

    it('una dote bloqueada enseña sus motivos y también el aviso', () => {
        const component = new SelectorDotesModalComponent();
        const bloqueada = candidato('blocked_failed', ['No cumple: Ataque base +4'], [aviso]);

        expect(component.getMotivosBloqueo(bloqueada)).toEqual(['No cumple: Ataque base +4']);
        expect(component.getAvisos(bloqueada)).toEqual([aviso]);
    });
});
