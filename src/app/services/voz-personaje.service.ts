import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { errorDeIa, IdeasIaError, IdeasIaService, ProveedorDeVoz } from './ideas-ia.service';
import { PlatformSessionService } from './platform-session.service';

// La voz guardada de un personaje (docs/publica/endpoints/personajes.md, «La voz de un personaje»): su dueño la genera
// en la web con su clave de IA (ElevenLabs o la voz de OpenAI) y la oye quien puede ver la ficha. 3.5 Companion solo
// la reproduce. El audio necesita el token si la ficha no es pública: se descarga y se reproduce desde memoria.

export interface VozGuardada {
    texto: string;
    proveedor: ProveedorDeVoz;
    voz: string;
    nombreVoz: string | null;
    modelo: string;
    tipo: string;
    creada: string;
}

export interface PeticionDeVoz {
    texto: string;
    proveedor: ProveedorDeVoz;
    voz: string;
    nombreVoz?: string;
}

const ERROR_GENERICO = 'No se ha podido atender la voz. Inténtalo de nuevo.';

@Injectable({
    providedIn: 'root'
})
export class VozPersonajeService {
    constructor(private http: HttpClient, private platformSessionSvc: PlatformSessionService, private ideasIaSvc: IdeasIaService) { }

    /** La voz guardada, o `null` si aún no tiene. */
    async guardada(idPersonaje: number): Promise<VozGuardada | null> {
        try {
            const respuesta = await firstValueFrom(this.http.get<any>(this.ruta(idPersonaje), { headers: await this.cabeceras(false) }));
            return deRespuesta(respuesta);
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 404)
                return null;
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    async audio(idPersonaje: number): Promise<Blob> {
        try {
            return await firstValueFrom(this.http.get(`${this.ruta(idPersonaje)}/audio`, { headers: await this.cabeceras(false), responseType: 'blob' }));
        } catch (error) {
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    /** La genera con la clave de IA de la persona y la guarda (sustituye la que hubiera). Solo el dueño. */
    async generar(idPersonaje: number, peticion: PeticionDeVoz): Promise<VozGuardada> {
        try {
            const respuesta = await firstValueFrom(this.http.post<any>(this.ruta(idPersonaje), peticion, { headers: await this.cabeceras(true) }));
            return deRespuesta(respuesta);
        } catch (error) {
            const traducido = errorDeIa(error, ERROR_GENERICO);
            if (traducido.esDeLaClave)
                this.ideasIaSvc.olvidarEstado();
            throw traducido;
        }
    }

    async borrar(idPersonaje: number): Promise<void> {
        try {
            await firstValueFrom(this.http.delete(this.ruta(idPersonaje), { headers: await this.cabeceras(true) }));
        } catch (error) {
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    private ruta(idPersonaje: number): string {
        return `${environment.apiUrl}personajes/${idPersonaje}/voz`;
    }

    /** Con sesión, el token de la API; sin ella, nada (se oyen los personajes públicos). */
    private async cabeceras(obligatoria: boolean): Promise<HttpHeaders> {
        if (this.platformSessionSvc.estado.tipo !== 'con_sesion') {
            if (obligatoria)
                throw new IdeasIaError('Tienes que iniciar sesión.', 'UNAUTHORIZED', 401);
            return new HttpHeaders();
        }
        return new HttpHeaders({ Authorization: `Bearer ${await this.platformSessionSvc.tokenApi()}` });
    }
}

function deRespuesta(r: any): VozGuardada {
    return {
        texto: `${r?.texto ?? ''}`,
        proveedor: r?.proveedor === 'openai' ? 'openai' : 'elevenlabs',
        voz: `${r?.voz ?? ''}`,
        nombreVoz: typeof r?.nombreVoz === 'string' && r.nombreVoz.trim() ? r.nombreVoz : null,
        modelo: `${r?.modelo ?? ''}`,
        tipo: `${r?.tipo ?? 'audio/mpeg'}`,
        creada: `${r?.creada ?? ''}`,
    };
}
