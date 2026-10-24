import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class FirebaseInjectionContextService {
    constructor(private environmentInjector: EnvironmentInjector) { }

    run<T>(fn: () => T): T {
        return runInInjectionContext(this.environmentInjector, fn);
    }
}

/**
 * Se resuelve cuando Firebase ya sabe si hay sesión (o, como mucho, en 1,5 s): antes, `auth.currentUser` puede ser
 * `null` aunque la sesión se esté restaurando.
 */
export function esperarSesionFirebase(auth: Auth, contexto: FirebaseInjectionContextService): Promise<void> {
    if (auth.currentUser)
        return Promise.resolve();

    return new Promise((resolve) => {
        let resolved = false;
        let unsubscribe: (() => void) | null = null;
        const finish = () => {
            if (resolved)
                return;
            resolved = true;
            unsubscribe?.();
            resolve();
        };

        try {
            unsubscribe = contexto.run(() => onAuthStateChanged(
                auth,
                () => finish(),
                () => finish()
            ));
            setTimeout(() => finish(), 1500);
        } catch {
            finish();
        }
    });
}
