import { EnvironmentInjector, Injectable, runInInjectionContext } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FirebaseInjectionContextService {
    constructor(private environmentInjector: EnvironmentInjector) { }

    run<T>(fn: () => T): T {
        return runInInjectionContext(this.environmentInjector, fn);
    }
}
