import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { SesionDialogComponent } from './sesion-dialog.component';
import { UserService } from 'src/app/services/user.service';

describe('SesionDialogComponent', () => {
  let component: SesionDialogComponent;
  let fixture: ComponentFixture<SesionDialogComponent>;

  const userServiceMock = {
    loginEmailPass: jasmine.createSpy('loginEmailPass'),
    loginGoogle: jasmine.createSpy('loginGoogle').and.returnValue(Promise.resolve()),
    register: jasmine.createSpy('register'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SesionDialogComponent ],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: '' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SesionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
