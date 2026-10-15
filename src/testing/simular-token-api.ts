import { NgZone } from '@angular/core';
import { PlatformSessionService } from 'src/app/services/platform-session.service';

/**
 * Para las specs: hace que `obtenerTokenApi()` devuelva `token` (en las pruebas no se carga el SDK de la plataforma).
 * Se llama dentro de un `beforeEach` o de un `it`.
 */
export function simularTokenApi(token = 'token'): jasmine.Spy {
    const sesion = new PlatformSessionService(new NgZone({ enableLongStackTrace: false }));
    return spyOn(sesion, 'tokenApi').and.resolveTo(token);
}
