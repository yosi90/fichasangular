import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContPrincipalComponent } from './cont-principal.component';

describe('ContPrincipalComponent', () => {
  let component: ContPrincipalComponent;
  let fixture: ComponentFixture<ContPrincipalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContPrincipalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContPrincipalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
