import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private auth: Auth) { }

    register({ email, password }: any) {
        return createUserWithEmailAndPassword(this.auth, email, password);
    }

    loginEmailPass({ email, password }: any) {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    loginGoogle(){
        return signInWithPopup(this.auth, new GoogleAuthProvider());
    }

    loginAnon() {

    }

    logOut() {
        return signOut(this.auth);
    }
}
