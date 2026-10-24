import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { cabecerasConSesionOpcional, DatosIdeaIa, errorDeIa, IdeasIaService } from './ideas-ia.service';
import { PlatformSessionService } from './platform-session.service';

// Las imágenes de un personaje (docs/publica/endpoints/personajes.md, «Las imágenes de un personaje»): un retrato y una
// de cuerpo entero. Su dueño las sube o, si quiere, las genera con IA (OpenAI, con su clave); la API las deja todas en
// WebP con las mismas medidas. Las ve quien puede ver la ficha. El archivo necesita el token si la ficha no es pública:
// se descarga y se enseña desde un `blob:`.

export type TipoImagenPersonaje = 'retrato' | 'cuerpo';
export const TIPOS_IMAGEN_PERSONAJE: TipoImagenPersonaje[] = ['retrato', 'cuerpo'];

export interface ImagenPersonaje {
    tipo: TipoImagenPersonaje;
    ancho: number;
    alto: number;
    origen: 'subida' | 'ia';
    creada: string;
    /** La ruta del archivo, con `?v=` (cambia al sustituirla). */
    imagen: string;
}

export type ImagenesPersonaje = Record<TipoImagenPersonaje, ImagenPersonaje | null>;

export interface PeticionImagenIa {
    datos: DatosIdeaIa;
    detalles?: string;
    modelo?: string;
}

const ERROR_GENERICO = 'No se ha podido atender la imagen. Inténtalo de nuevo.';
/** Lo que deja subir la API (10 MB); se comprueba antes para no mandar archivos que va a rechazar. */
export const MAX_BYTES_IMAGEN = 10 * 1024 * 1024;

@Injectable({
    providedIn: 'root'
})
export class ImagenesPersonajeService {
    constructor(private http: HttpClient, private platformSessionSvc: PlatformSessionService, private ideasIaSvc: IdeasIaService) { }

    async imagenes(idPersonaje: number): Promise<ImagenesPersonaje> {
        try {
            const respuesta = await firstValueFrom(this.http.get<any>(this.ruta(idPersonaje), { headers: await cabecerasConSesionOpcional(this.platformSessionSvc, false) }));
            return { retrato: deRespuesta(respuesta?.retrato), cuerpo: deRespuesta(respuesta?.cuerpo) };
        } catch (error) {
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    /** El archivo de una imagen ([ruta] es la `imagen` que da la API). */
    async archivo(ruta: string): Promise<Blob> {
        try {
            return await firstValueFrom(this.http.get(`${environment.apiUrl}${ruta.replace(/^\//, '')}`, { headers: await cabecerasConSesionOpcional(this.platformSessionSvc, false), responseType: 'blob' }));
        } catch (error) {
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    async subir(idPersonaje: number, tipo: TipoImagenPersonaje, archivo: Blob, nombre: string): Promise<ImagenPersonaje> {
        const formulario = new FormData();
        formulario.append('imagen', archivo, nombre);
        try {
            const respuesta = await firstValueFrom(this.http.put<any>(`${this.ruta(idPersonaje)}/${tipo}`, formulario, { headers: await cabecerasConSesionOpcional(this.platformSessionSvc, true) }));
            return deRespuesta(respuesta)!;
        } catch (error) {
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    async generar(idPersonaje: number, tipo: TipoImagenPersonaje, peticion: PeticionImagenIa): Promise<ImagenPersonaje> {
        try {
            const respuesta = await firstValueFrom(this.http.post<any>(`${this.ruta(idPersonaje)}/${tipo}/ia`, peticion, { headers: await cabecerasConSesionOpcional(this.platformSessionSvc, true) }));
            return deRespuesta(respuesta)!;
        } catch (error) {
            const traducido = errorDeIa(error, ERROR_GENERICO);
            if (traducido.esDeLaClave)
                this.ideasIaSvc.olvidarEstado();
            throw traducido;
        }
    }

    async quitar(idPersonaje: number, tipo: TipoImagenPersonaje): Promise<void> {
        try {
            await firstValueFrom(this.http.delete(`${this.ruta(idPersonaje)}/${tipo}`, { headers: await cabecerasConSesionOpcional(this.platformSessionSvc, true) }));
        } catch (error) {
            throw errorDeIa(error, ERROR_GENERICO);
        }
    }

    private ruta(idPersonaje: number): string {
        return `${environment.apiUrl}personajes/${idPersonaje}/imagenes`;
    }
}

function deRespuesta(r: any): ImagenPersonaje | null {
    if (!r || (r.tipo !== 'retrato' && r.tipo !== 'cuerpo') || typeof r.imagen !== 'string')
        return null;
    return {
        tipo: r.tipo,
        ancho: Number(r.ancho) || 0,
        alto: Number(r.alto) || 0,
        origen: r.origen === 'ia' ? 'ia' : 'subida',
        creada: `${r.creada ?? ''}`,
        imagen: r.imagen,
    };
}
