import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { obtenerTokenApi } from './platform-session.service';
import { UserService } from './user.service';
import { codigoDeError } from './utils/error-api';

/** El código con el que la API de Rol rechaza crear sin las normas de Rol (`docs/publica/ERRORES.md`). */
export const CODIGO_NORMAS_PENDIENTES = 'CREATION_POLICY_ACCEPTANCE_REQUIRED';

/**
 * Si la API de Rol rechaza una acción porque faltan las normas de Rol (aunque la web no lo supiera: se aceptaron o
 * cambiaron en otra pestaña), ofrece la ventana de las normas y, si se aceptan, repite esa misma petición una vez con el
 * token nuevo. Si la persona dice «Ahora no», llega el error de siempre a quien llamó.
 */
@Injectable()
export class NormasCreacionInterceptor implements HttpInterceptor {
    private readonly apiRol = `${environment.apiUrl ?? ''}`;

    // `UserService` usa `HttpClient`: se pide al inyector cuando hace falta, no al construir el interceptor.
    constructor(private injector: Injector) { }

    intercept(peticion: HttpRequest<unknown>, siguiente: HttpHandler): Observable<HttpEvent<unknown>> {
        if (this.apiRol.length < 1 || !peticion.url.startsWith(this.apiRol))
            return siguiente.handle(peticion);
        return siguiente.handle(peticion).pipe(
            catchError((error: unknown) => {
                if (!(error instanceof HttpErrorResponse) || error.status !== 403 || codigoDeError(error) !== CODIGO_NORMAS_PENDIENTES)
                    return throwError(() => error);
                return from(this.injector.get(UserService).asegurarNormasDeCreacion(true)).pipe(
                    switchMap((aceptadas) => aceptadas
                        ? from(obtenerTokenApi()).pipe(
                            switchMap((token) => siguiente.handle(peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))))
                        : throwError(() => error)),
                );
            }),
        );
    }
}
