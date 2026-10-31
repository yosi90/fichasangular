import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrerrequisitosConservadosComponent } from './prerrequisitos-conservados.component';

describe('PrerrequisitosConservadosComponent («Se guardan tal cual»)', () => {
    let fixture: ComponentFixture<PrerrequisitosConservadosComponent>;
    const elemento = () => fixture.nativeElement as HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PrerrequisitosConservadosComponent],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(PrerrequisitosConservadosComponent);
    });

    it('sin conservados no enseña nada', () => {
        fixture.detectChanges();
        expect(elemento().textContent).not.toContain('Se guardan tal cual');
    });

    it('enseña cada frase y avisa del índice que se quita', () => {
        fixture.componentInstance.conservados = [{ frase: 'Competencia con el arma 0' }, { frase: 'Raza sin elegir' }];
        const quitados: number[] = [];
        fixture.componentInstance.quitar.subscribe((i) => quitados.push(i));
        fixture.detectChanges();

        expect(elemento().textContent).toContain('Se guardan tal cual:');
        expect(elemento().textContent).toContain('Raza sin elegir');
        const botones = elemento().querySelectorAll('button');
        expect(botones[1].getAttribute('aria-label')).toBe('Quitar Raza sin elegir');
        (botones[1] as HTMLButtonElement).click();
        expect(quitados).toEqual([1]);
    });

    it('con borde, los chips llevan su clase', () => {
        fixture.componentInstance.conservados = [{ frase: 'A' }];
        fixture.componentInstance.conBorde = true;
        fixture.detectChanges();
        expect(elemento().querySelector('mat-chip')?.classList).toContain('con-borde');
    });
});
