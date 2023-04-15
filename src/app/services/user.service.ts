import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, UserCredential, AuthInstances, user } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { __values } from 'tslib';
import { Usuario } from '../interfaces/usuario';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private usuario: Usuario = { nombre: 'Invitado', correo: '', permisos: 0 };
    private sesionAbierta: boolean = false;
    private isLoggedInSubject = new BehaviorSubject<boolean>(false);
    public isLoggedIn$ = this.isLoggedInSubject.asObservable();

    public get Usuario() {
        return this.usuario;
    }

    public set Usuario(value: Usuario) {
        this.usuario = value;
        this.usuario.permisos = this.usuario.nombre === "MrYosi90" || this.usuario.correo.toLowerCase() === "yosi121990@hotmail.es" ? 1 : 0;
        const abrirSesion: boolean = value.nombre !== 'Invitado' && value.correo !== '';
        this.isLoggedInSubject.next(abrirSesion);
        this.sesionAbierta = abrirSesion;
    }

    constructor(private auth: Auth) { }

    public setLoggedIn(usr: Usuario): void {
        this.Usuario = usr;
    }

    register({ email, password }: any) {
        if (!this.sesionAbierta) {
            const sesion = createUserWithEmailAndPassword(this.auth, email, password);
            sesion.then(response => {
                localStorage.setItem('sesionFichas', JSON.stringify(response));
                this.setLoggedIn({ nombre: response.user.displayName ?? '', correo: response.user.email ?? '', permisos: 0 });
            }).catch(error => console.log(error));
            return sesion;
        } else return null;
    }

    loginEmailPass({ email, password }: any) {
        if (!this.sesionAbierta) {
            const sesion = signInWithEmailAndPassword(this.auth, email, password).then(response => {
                localStorage.setItem('sesionFichas', JSON.stringify(response));
                this.setLoggedIn({ nombre: response.user.displayName ?? '', correo: response.user.email ?? '', permisos: 0 });
            }).catch(error => console.log(error));
            return sesion;
        } else return null;
    }

    loginGoogle() {
        if (!this.sesionAbierta) {
            const sesion = signInWithPopup(this.auth, new GoogleAuthProvider()).then(response => {
                localStorage.setItem('sesionFichas', JSON.stringify(response));
                this.setLoggedIn({ nombre: response.user.displayName ?? '', correo: response.user.email ?? '', permisos: 0 });
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
        this.setLoggedIn({ nombre: sesion.user.displayName ?? '', correo: sesion.user.email ?? '', permisos: 0 });
    }

    logOut() {
        if (this.sesionAbierta) {
            localStorage.removeItem('sesionFichas');
            this.setLoggedIn({ nombre: '', correo: '', permisos: 0 });
            return signOut(this.auth);
        } else return null;
    }
}
