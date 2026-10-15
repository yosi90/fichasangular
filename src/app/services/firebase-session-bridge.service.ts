import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth, signInWithCustomToken, signOut } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { EstadoPlataforma, PlatformSessionService } from './platform-session.service';

// Firebase solo da acceso a los datos de Rol (Firestore `private_users/{uid}` y RTDB): nunca identifica a la
// persona, eso lo hace la plataforma. Con sesión en la plataforma se pide a la API el token propio de Firebase
// (`uid = sub`, `POST /usuarios/me/firebase-token`) y al pasar a `sin_sesion` se cierra esa sesión
// (docs/publica/MIGRACION_PLATAFORMA_FRONT.md).

@Injectable({
    providedIn: 'root'
})
export class FirebaseSessionBridgeService {
    private cola: Promise<void> = Promise.resolve();
    private iniciado = false;

    constructor(
        private auth: Auth,
        private http: HttpClient,
        private platformSession: PlatformSessionService,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    iniciar(): void {
        if (this.iniciado)
            return;
        this.iniciado = true;
        this.platformSession.estado$.subscribe((estado) => {
            // Los cambios se aplican en orden: entrar y salir seguidos no se cruzan.
            this.cola = this.cola.then(() => this.aplicar(estado)).catch(() => undefined);
        });
    }

    private async aplicar(estado: EstadoPlataforma): Promise<void> {
        if (estado.tipo === 'con_sesion') {
            if (this.auth.currentUser?.uid === estado.cuenta.id)
                return;
            await this.entrarEnFirebase();
            return;
        }
        if (estado.tipo === 'sin_sesion' && this.auth.currentUser)
            await this.salirDeFirebase();
    }

    private async entrarEnFirebase(): Promise<void> {
        try {
            const token = await this.platformSession.tokenApi();
            const respuesta = await firstValueFrom(this.http.post<{ token: string; uid: string }>(
                `${environment.apiUrl}usuarios/me/firebase-token`,
                null,
                { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) },
            ));
            await this.firebaseContextSvc.run(() => signInWithCustomToken(this.auth, respuesta.token));
        } catch (error) {
            // 403 ACCOUNT_NOT_ACTIVE: la cuenta está cerrada o suspendida; sin datos de Rol.
            if (error instanceof HttpErrorResponse && error.status === 403 && this.auth.currentUser)
                await this.salirDeFirebase();
            throw error;
        }
    }

    private async salirDeFirebase(): Promise<void> {
        await this.firebaseContextSvc.run(() => signOut(this.auth));
    }
}
