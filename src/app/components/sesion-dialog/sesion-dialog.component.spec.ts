import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { SesionDialogComponent } from './sesion-dialog.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { UserService } from 'src/app/services/user.service';

describe('SesionDialogComponent', () => {
  let component: SesionDialogComponent;
  let fixture: ComponentFixture<SesionDialogComponent>;
  let dialogRefMock: { close: jasmine.Spy };
  let appToastSvcMock: jasmine.SpyObj<AppToastService>;

  const userServiceMock = {
    loginEmailPass: jasmine.createSpy('loginEmailPass').and.returnValue(Promise.resolve()),
    loginGoogle: jasmine.createSpy('loginGoogle').and.returnValue(Promise.resolve()),
    register: jasmine.createSpy('register').and.returnValue(Promise.resolve()),
    requestPasswordReset: jasmine.createSpy('requestPasswordReset').and.returnValue(Promise.resolve()),
  };

  beforeEach(async () => {
    dialogRefMock = { close: jasmine.createSpy('close') };
    appToastSvcMock = jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError', 'showInfo']);
    await TestBed.configureTestingModule({
      declarations: [ SesionDialogComponent ],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: AppToastService, useValue: appToastSvcMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: '' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SesionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    userServiceMock.loginEmailPass.calls.reset();
    userServiceMock.register.calls.reset();
    userServiceMock.loginGoogle.calls.reset();
    userServiceMock.requestPasswordReset.calls.reset();
    dialogRefMock.close.calls.reset();
    appToastSvcMock.showSuccess.calls.reset();
    appToastSvcMock.showError.calls.reset();
    appToastSvcMock.showInfo.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('register usa el valor del FormGroup y cierra el dialogo al completar', async () => {
    component.registerForm.setValue({
      usuario: 'Aldric',
      email: 'aldric@test.com',
      password: '12345678',
      confirmPassword: '12345678',
    });

    await component.register();

    expect(userServiceMock.register).toHaveBeenCalledWith({
      usuario: 'Aldric',
      email: 'aldric@test.com',
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('register muestra feedback cuando el correo ya existe y mantiene el dialogo abierto', async () => {
    userServiceMock.register.and.rejectWith(new Error('Ese correo ya está registrado.'));
    component.registerForm.setValue({
      usuario: 'Aldric',
      email: 'aldric@test.com',
      password: '12345678',
      confirmPassword: '12345678',
    });

    await component.register();

    expect(appToastSvcMock.showError).toHaveBeenCalledWith('Ese correo ya está registrado.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
    expect(component.registerForm.getRawValue().email).toBe('aldric@test.com');
  });

  it('register no envia si el formulario es invalido', async () => {
    component.registerForm.setValue({
      usuario: 'Al',
      email: 'correo-invalido',
      password: '1234',
      confirmPassword: '9999',
    });

    await component.register();

    expect(userServiceMock.register).not.toHaveBeenCalled();
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('login usa el valor del FormGroup y cierra el dialogo al completar', async () => {
    component.loginForm.setValue({
      email: 'aldric@test.com',
      password: '12345678',
    });

    await component.login();

    expect(userServiceMock.loginEmailPass).toHaveBeenCalledWith({
      email: 'aldric@test.com',
      password: '12345678',
    });
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('login muestra feedback cuando las credenciales fallan', async () => {
    userServiceMock.loginEmailPass.and.rejectWith(new Error('Las credenciales no son correctas.'));
    component.loginForm.setValue({
      email: 'aldric@test.com',
      password: '12345678',
    });

    await component.login();

    expect(appToastSvcMock.showError).toHaveBeenCalledWith('Las credenciales no son correctas.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('abre recuperación con el correo ya escrito en login', () => {
    component.loginForm.patchValue({ email: 'aldric@test.com' });

    component.abrirRecuperacionPassword();

    expect(component.mostrandoRecuperacion).toBeTrue();
    expect(component.passwordResetForm.getRawValue().email).toBe('aldric@test.com');
  });

  it('recuperarPassword lanza el reset y muestra mensaje genérico de éxito', async () => {
    component.mostrandoRecuperacion = true;
    component.passwordResetForm.setValue({ email: 'aldric@test.com' });

    await component.recuperarPassword();

    expect(userServiceMock.requestPasswordReset).toHaveBeenCalledWith('aldric@test.com');
    expect(appToastSvcMock.showSuccess).toHaveBeenCalledWith('Si la cuenta existe, recibirás un correo para restablecer la contraseña.');
    expect(component.mostrandoRecuperacion).toBeFalse();
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('recuperarPassword muestra feedback de error y mantiene el flujo abierto', async () => {
    userServiceMock.requestPasswordReset.and.rejectWith(new Error('No se pudo iniciar la recuperación de contraseña.'));
    component.mostrandoRecuperacion = true;
    component.passwordResetForm.setValue({ email: 'aldric@test.com' });

    await component.recuperarPassword();

    expect(appToastSvcMock.showError).toHaveBeenCalledWith('No se pudo iniciar la recuperación de contraseña.');
    expect(component.mostrandoRecuperacion).toBeTrue();
  });
});
