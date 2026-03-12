import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, Validators, ValidatorFn, FormControl, AbstractControl, ValidationErrors, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { AppToastService } from 'src/app/services/app-toast.service';
import { UserService } from 'src/app/services/user.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const invalidCtrl = !!(control?.invalid && control?.parent?.dirty);
        const invalidParent = !!(control?.parent?.invalid && control?.parent?.dirty);

        return invalidCtrl || invalidParent;
    }
}

@Component({
    selector: 'app-sesion-dialog',
    templateUrl: './sesion-dialog.component.html',
    styleUrls: ['./sesion-dialog.component.sass'],
    standalone: false
})
export class SesionDialogComponent {
    emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    enviandoLogin = false;
    enviandoRegistro = false;
    enviandoRecuperacion = false;
    mostrandoRecuperacion = false;

    constructor(private usrService: UserService,
        private appToastSvc: AppToastService,
        public dialogRef: MatDialogRef<SesionDialogComponent>, @Inject(MAT_DIALOG_DATA) public msg: string) { }

    loginForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.pattern(this.emailRegex)]),
        password: new FormControl('', [Validators.required, Validators.minLength(8)])
    });

    async login(): Promise<void> {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.enviandoLogin = true;
        try {
            await this.usrService.loginEmailPass(this.loginForm.getRawValue());
            this.dialogRef.close(true);
        } catch (error: any) {
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo iniciar sesión.'}`.trim());
        } finally {
            this.enviandoLogin = false;
        }
    }

    loginGoogle() {
        this.usrService.loginGoogle()
            ?.then(_ => this.dialogRef.close())
            .catch((error: any) => {
                this.appToastSvc.showError(`${error?.message ?? 'No se pudo iniciar sesión con Google.'}`.trim());
            });
    }

    async register(): Promise<void> {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.enviandoRegistro = true;
        try {
            await this.usrService.register(this.registerForm.getRawValue());
            this.dialogRef.close(true);
        } catch (error: any) {
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo completar el registro.'}`.trim());
        } finally {
            this.enviandoRegistro = false;
        }
    }

    abrirRecuperacionPassword(): void {
        this.mostrandoRecuperacion = true;
        this.passwordResetForm.patchValue({
            email: this.resolveEmailPrefill(),
        });
        this.passwordResetForm.markAsPristine();
        this.passwordResetForm.markAsUntouched();
    }

    cancelarRecuperacionPassword(): void {
        this.mostrandoRecuperacion = false;
    }

    async recuperarPassword(): Promise<void> {
        if (this.passwordResetForm.invalid) {
            this.passwordResetForm.markAllAsTouched();
            return;
        }

        this.enviandoRecuperacion = true;
        const email = `${this.passwordResetForm.getRawValue().email ?? ''}`.trim();
        try {
            await this.usrService.requestPasswordReset(email);
            this.loginForm.patchValue({ email });
            this.appToastSvc.showSuccess('Si la cuenta existe, recibirás un correo para restablecer la contraseña.');
            this.mostrandoRecuperacion = false;
        } catch (error: any) {
            this.appToastSvc.showError(`${error?.message ?? 'No se pudo iniciar la recuperación de contraseña.'}`.trim());
        } finally {
            this.enviandoRecuperacion = false;
        }
    }

    matcher = new MyErrorStateMatcher();

    checkPasswords: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        let pass = group.get('password')?.value;
        let confirmPass = group.get('confirmPassword')?.value
        return pass === confirmPass ? null : { notSame: true }
    }

    registerForm = new FormGroup({
        usuario: new FormControl('', [Validators.required, Validators.minLength(3)]),
        email: new FormControl('', [Validators.required, Validators.pattern(this.emailRegex)]),
        password: new FormControl('', [Validators.required, Validators.minLength(8)]),
        confirmPassword: new FormControl(''),
    }, { validators: this.checkPasswords });

    passwordResetForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.pattern(this.emailRegex)]),
    });

    private resolveEmailPrefill(): string {
        const fromLogin = `${this.loginForm.getRawValue().email ?? ''}`.trim();
        if (fromLogin.length > 0)
            return fromLogin;

        return `${this.registerForm.getRawValue().email ?? ''}`.trim();
    }
}
