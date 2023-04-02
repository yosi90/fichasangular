import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, Validators, ValidatorFn, FormControl, AbstractControl, ValidationErrors, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
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

    constructor(private usrService: UserService, public dialogRef: MatDialogRef<SesionDialogComponent>, @Inject(MAT_DIALOG_DATA) public msg: string) {

    }

    login(value: any): void {
        if (this.emailRegex.test(value.email) && value.password.length >= 8) {
            this.usrService.loginEmailPass(this.loginForm.value)
            .then(Response => {
                console.log(Response);
            })
            .catch(error => console.log(error));
        }
    }

    register(value: any): void {
        if (value.usuario.length >= 3 && this.emailRegex.test(value.email) && value.password.length >= 8 && value.password === value.confirmPassword) {
            this.usrService.register(this.registerForm.value)
            .then(response => {
                console.log(response);
                //logear directamente
                //guardar el usuario en localstorage
                //cargar una global usuario en angular
            })
            .catch(error => console.log(error));
        }
    }

    loginForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.pattern(this.emailRegex)]),
        password: new FormControl('', [Validators.required, Validators.minLength(8)])
    });

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

    onSubmit() {
        console.log('llega');
    }

    nuevoUsuario(nombre: string, correo: string, pass1: string, pass2: string) {

    }
}