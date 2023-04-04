import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, UserCredential, AuthInstances, user } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { __values } from 'tslib';


interface User {
    nombre: string;
    correo: string;
    //permisos: ¿¿??
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private usuario: User = { nombre: 'Invitado', correo: '' };
    private sesionAbierta: boolean = false;
    private isLoggedInSubject = new BehaviorSubject<boolean>(false);
    public isLoggedIn$ = this.isLoggedInSubject.asObservable();

    public get Usuario() {
        return this.usuario;
    }

    public set Usuario(value: User) {
        this.usuario = value;
        const abrirSesion: boolean = value.nombre !== 'Invitado' && value.correo !== '';
        this.isLoggedInSubject.next(abrirSesion);
        this.sesionAbierta = abrirSesion;
    }

    constructor(private auth: Auth) { }

    public setLoggedIn(usr: User): void {
        this.Usuario = usr;
    }

    register({ email, password }: any) {
        if (!this.sesionAbierta) {
            const sesion = createUserWithEmailAndPassword(this.auth, email, password);
            sesion.then(response => {
                localStorage.setItem('sesionFichas', JSON.stringify(response));
                this.setLoggedIn({ nombre: response.user.displayName ?? '', correo: response.user.email ?? '' });
            }).catch(error => console.log(error));
            return sesion;
        } else return null;
    }

    loginEmailPass({ email, password }: any) {
        if (!this.sesionAbierta) {
            const sesion = signInWithEmailAndPassword(this.auth, email, password).then(response => {
                localStorage.setItem('sesionFichas', JSON.stringify(response));
                this.setLoggedIn({ nombre: response.user.displayName ?? '', correo: response.user.email ?? '' });
            }).catch(error => console.log(error));
            return sesion;
        } else return null;
    }

    loginGoogle() {
        if (!this.sesionAbierta) {
            const sesion = signInWithPopup(this.auth, new GoogleAuthProvider()).then(response => {
                localStorage.setItem('sesionFichas', JSON.stringify(response));
                this.setLoggedIn({ nombre: response.user.displayName ?? '', correo: response.user.email ?? '' });
            }).catch(error => console.log(error));
            return sesion;
        } else return null;
    }

    loginAnon() {
        if (!this.sesionAbierta) {
            throw new Error('Not implemented')  // Método de inicio de sesión anónimo
        } else return null;
    }

    recuperarSesion(token: string) {
        const sesion = JSON.parse(token);
        this.setLoggedIn({ nombre: sesion.user.displayName ?? '', correo: sesion.user.email ?? '' });
    }

    logOut() {
        if (this.sesionAbierta) {
            localStorage.removeItem('sesionFichas');
            this.setLoggedIn({ nombre: '', correo: '' });
            return signOut(this.auth);
        } else return null;
    }
}
