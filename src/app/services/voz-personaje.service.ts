import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { errorDeIa, IdeasIaError, IdeasIaService, ProveedorDeVoz } from './ideas-ia.service';
import { PlatformSessionService } from './platform-session.service';

// Las voces guardadas de un personaje (docs/publica/endpoints/personajes.md, «Las voces de un personaje»): su dueño las
// genera en la web con su clave de IA (ElevenLabs o la voz de OpenAI), como mucho 3, y las oye quien puede ver la
// ficha. 3.5 Companion solo las reproduce. El audio necesita el token si la ficha no es pública: se descarga y se
// reproduce desde memoria.

export interface VozGuardada {
    id: number;
    texto: string;
    proveedor: ProveedorDeVoz;
    voz: string;
    nombreVoz: string | null;
    modelo: string;
    tipo: string;
    creada: string;
}

export interface VocesGuardadas {
    voces: VozGuardada[];
    /** Cuántas puede tener como mucho (3). */
    maximo: number;
}

export interface PeticionDeVoz {
    texto: string;
    proveedor: ProveedorDeVoz;
    voz: string;
    nombreVoz?: string;
}

const ERROR_GENERICO = 'No se ha podido atender la voz. Inténtalo de nuevo.';
const MAXIMO_POR_DEFECTO = 3;

@Injectable({
    providedIn: 'root'
})
export class VozPersonajeService {
    constructor(private http: HttpClient, private platformSessionSvc: PlatformSessionService, private ideasIaSvc: IdeasIaService) { }

    /** Sus voces, de la más antigua a la más nueva. */
    async voces(idPersonaje: number): Promise<VocesGuardadas> {
        try {
            const respuesta = await firstValueFrom(this.http.get<any>(this.ruta(idPersonaje), { headers: await this.cabeceras(false) }));
            const maximo = Number(respuesta?.maximo);
            return {
                voces: (Array.isArray(respuesta?.voces) ? respuesta.voces : []).map(deRespuesta).filter((v: VozGuardada) => v.id > 0),
                maximo: maximo > 0 ? maximo : MAXIMO_POR_DEFECTO,
            };
        } catch (error) {
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    async audio(idPersonaje: number, idVoz: number): Promise<Blob> {
        try {
            return await firstValueFrom(this.http.get(`${this.ruta(idPersonaje)}/${idVoz}/audio`, { headers: await this.cabeceras(false), responseType: 'blob' }));
        } catch (error) {
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    /** Genera otra con la clave de IA de la persona y la guarda. Solo el dueño, y con menos de 3. */
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

    async descartar(idPersonaje: number, idVoz: number): Promise<void> {
        try {
            await firstValueFrom(this.http.delete(`${this.ruta(idPersonaje)}/${idVoz}`, { headers: await this.cabeceras(true) }));
        } catch (error) {
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    private ruta(idPersonaje: number): string {
        return `${environment.apiUrl}personajes/${idPersonaje}/voces`;
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
        id: Number(r?.id) || 0,
        texto: `${r?.texto ?? ''}`,
        proveedor: r?.proveedor === 'openai' ? 'openai' : 'elevenlabs',
        voz: `${r?.voz ?? ''}`,
        nombreVoz: typeof r?.nombreVoz === 'string' && r.nombreVoz.trim() ? r.nombreVoz : null,
        modelo: `${r?.modelo ?? ''}`,
        tipo: `${r?.tipo ?? 'audio/mpeg'}`,
        creada: `${r?.creada ?? ''}`,
    };
}
