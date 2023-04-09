import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, Validators, ValidatorFn, FormControl, AbstractControl, ValidationErrors, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { UserCredential } from 'firebase/auth';
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
    styleUrls: ['./sesion-dialog.component.sass']
})
export class SesionDialogComponent {
    emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    constructor(private usrService: UserService,
        public dialogRef: MatDialogRef<SesionDialogComponent>, @Inject(MAT_DIALOG_DATA) public msg: string) { }

    loginForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.pattern(this.emailRegex)]),
        password: new FormControl('', [Validators.required, Validators.minLength(8)])
    });

    login(value: any): void {
        if (this.emailRegex.test(value.email) && value.password.length >= 8) {
            this.usrService.loginEmailPass(this.loginForm.value);
        }
    }

    loginGoogle() {
        this.usrService.loginGoogle()?.then(_ => this.dialogRef.close());
    }

    register(value: any): void {
        if (value.usuario.length >= 3 && this.emailRegex.test(value.email) && value.password.length >= 8 && value.password === value.confirmPassword)
            this.usrService.register(this.registerForm.value);
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
}