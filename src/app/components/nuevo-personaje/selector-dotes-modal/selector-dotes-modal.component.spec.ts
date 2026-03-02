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
});
