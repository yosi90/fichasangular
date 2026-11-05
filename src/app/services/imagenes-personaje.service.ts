import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { cabecerasConSesionOpcional, DatosIdeaIa, errorDeIa, IdeasIaService } from './ideas-ia.service';
import { PlatformSessionService } from './platform-session.service';

// Las imágenes de un personaje (docs/publica/endpoints/personajes.md, «Las imágenes de un personaje»): un retrato y una
// de cuerpo entero. Su dueño las sube o, si quiere, las genera con IA (OpenAI, con su clave); la API las deja todas en
// WebP con las mismas medidas. Las ve quien puede ver la ficha. El archivo necesita el token si la ficha no es pública:
// se descarga y se enseña desde un `blob:`. También se pueden encargar a otra web del ecosistema (p.i.c.) con
// `<yosi-encargos>`: lo que llega se sube por el mismo `PUT` (docs/publica/IDEAS_CON_IA.md, punto 6).

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

/** La proporción con la que la API guarda cada tipo (512 × 512 y 768 × 1152), la que se pide a otra web. */
export const FORMATO_IMAGEN_PERSONAJE: Record<TipoImagenPersonaje, string> = { retrato: '1:1', cuerpo: '2:3' };

const ENCUADRE_ENCARGO: Record<TipoImagenPersonaje, string> = {
    retrato: 'Retrato de cabeza y hombros',
    cuerpo: 'Imagen de cuerpo entero, de la cabeza a los pies',
};

/**
 * Lo que se manda a la web que hace el encargo de una imagen (ecosistema-kit/ENCARGOS.md, `indicaciones`): en `texto`,
 * el encuadre y lo que se ve del personaje, lo mismo que mira la IA de Rol (`POST …/ia`: raza, clases, género, edad,
 * alineamiento, deidad y región; ni el nombre, que ya va en el título, ni los textos largos); en `formato`, su proporción.
 */
export function indicacionesDeEncargo(tipo: TipoImagenPersonaje, datos: DatosIdeaIa): { texto: string; formato: string } {
    const clases = (datos.clases ?? []).map(clase => clase.nivel ? `${clase.nombre} ${clase.nivel}` : clase.nombre).join(', ');
    const lineas = [
        ['Raza', datos.raza],
        ['Clases', clases],
        ['Género', datos.genero],
        ['Edad', datos.edad],
        ['Alineamiento', datos.alineamiento],
        ['Deidad', datos.deidad],
        ['Región', datos.region],
    ].filter(([, valor]) => `${valor ?? ''}`.trim().length > 0).map(([etiqueta, valor]) => `${etiqueta}: ${valor}`);
    const encabezado = `${ENCUADRE_ENCARGO[tipo]} de un personaje de Dragones y Mazmorras 3.5.`;
    return { texto: lineas.length > 0 ? `${encabezado}\n${lineas.join('\n')}` : encabezado, formato: FORMATO_IMAGEN_PERSONAJE[tipo] };
}

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
