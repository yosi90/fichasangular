import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseMenuResponsiveComponent } from './responsive-base.component';

describe('BaseMenuResponsiveComponent', () => {
  let component: BaseMenuResponsiveComponent;
  let fixture: ComponentFixture<BaseMenuResponsiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaseMenuResponsiveComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaseMenuResponsiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
