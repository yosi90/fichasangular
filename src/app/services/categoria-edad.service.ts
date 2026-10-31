import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Observable, firstValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CategoriaEdadCatalogo, CategoriaEdadCreateRequest } from '../interfaces/raza-catalogos';
import { cabeceraApiConFirebase } from './platform-session.service';
import { errorDeCatalogo } from './utils/error-catalogo';
import { CATEGORIA_EDAD } from './utils/nombres-de-catalogo';
import { toArray, toBoolean, toInt, toText } from './utils/normalizacion';
import { leerRespuestaDeEscritura } from './utils/respuesta-de-escritura';
import { compararTexto } from './utils/orden-texto';

/** Una categoría de `GET /categorias-edad` (o de la respuesta de su alta). */
export function normalizarCategoriaEdad(raw: any): CategoriaEdadCatalogo {
    return {
        Id: toInt(raw?.Id),
        Nombre: toText(raw?.Nombre).trim(),
        Orden_tipico: toInt(raw?.Orden_tipico),
        Oficial: toBoolean(raw?.Oficial),
        Manual: { Id: toInt(raw?.Manual?.Id), Nombre: toText(raw?.Manual?.Nombre).trim(), Pagina: toInt(raw?.Manual?.Pagina) },
    };
}

/** El orden de las categorías: por su orden típico (cría 1 … gran sierpe 12, y las añadidas) y, si empatan, por nombre. */
export function porOrdenTipico(a: CategoriaEdadCatalogo, b: CategoriaEdadCatalogo): number {
    return a.Orden_tipico - b.Orden_tipico || compararTexto(a.Nombre, b.Nombre);
}

/**
 * El catálogo común de las categorías de edad (`docs/publica/endpoints/catalogos.md`, `GET /categorias-edad` y
 * `POST /categorias-edad/add`), del que cada raza por edades elige las suyas. Sin caché de la RTDB: se lee por HTTP.
 */
@Injectable({ providedIn: 'root' })
export class CategoriaEdadService {
    constructor(private http: HttpClient, private auth?: Auth) { }

    /** Las categorías, por su orden típico (`porOrdenTipico`). */
    getCategoriasEdad(): Observable<CategoriaEdadCatalogo[]> {
        return this.http.get(`${environment.apiUrl}categorias-edad`).pipe(
            map((raw) => toArray(raw).map(normalizarCategoriaEdad)
                .filter((categoria) => categoria.Id > 0 && categoria.Nombre.length > 0)
                .sort(porOrdenTipico)),
        );
    }

    /** Añade una categoría al catálogo (permiso de creación `razas`); devuelve la categoría creada. */
    async crearCategoriaEdad(cuerpo: CategoriaEdadCreateRequest): Promise<{ message: string; categoria: CategoriaEdadCatalogo; }> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const respuesta = await firstValueFrom(this.http.post<any>(`${environment.apiUrl}categorias-edad/add`, cuerpo, { headers }));
            const { message } = leerRespuestaDeEscritura(respuesta, 'idCategoriaEdad', 'Categoría de edad creada');
            return { message, categoria: normalizarCategoriaEdad(respuesta?.categoria) };
        } catch (error: unknown) {
            throw errorDeCatalogo(error, 'crear', CATEGORIA_EDAD);
        }
    }
}
