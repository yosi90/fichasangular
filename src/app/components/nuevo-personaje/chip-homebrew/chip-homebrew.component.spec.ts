import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChipHomebrewComponent } from './chip-homebrew.component';

describe('ChipHomebrewComponent («Incluir homebrew»)', () => {
    let fixture: ComponentFixture<ChipHomebrewComponent>;
    const chip = () => (fixture.nativeElement as HTMLElement).querySelector('mat-chip-option') as HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChipHomebrewComponent],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(ChipHomebrewComponent);
    });

    it('dice si el homebrew está incluido y avisa al pulsarlo', () => {
        let veces = 0;
        fixture.componentInstance.alternar.subscribe(() => veces++);
        fixture.detectChanges();
        expect(chip().textContent?.trim()).toBe('Incluir homebrew');

        chip().click();
        expect(veces).toBe(1);

        fixture.componentInstance.incluido = true;
        fixture.detectChanges();
        expect(chip().textContent?.trim()).toBe('Homebrew incluido');
    });
});
