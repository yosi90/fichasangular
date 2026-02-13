import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { NavbarComponent } from './navbar.component';
import { of } from 'rxjs';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { ManualVistaNavigationService } from 'src/app/services/manual-vista-navigation.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  const manualesAsociadosMock = {
    getManualesAsociados: () => of([]),
  };

  const navVistaMock = {
    emitirApertura: jasmine.createSpy('emitirApertura'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavbarComponent ],
      providers: [
        { provide: ManualesAsociadosService, useValue: manualesAsociadosMock },
        { provide: ManualVistaNavigationService, useValue: navVistaMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
