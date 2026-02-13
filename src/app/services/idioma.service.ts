import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { IdiomaDetalle } from "../interfaces/idioma";

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function toNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: any, fallback = ""): string {
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

export function normalizeIdioma(raw: any): IdiomaDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Secreto: toBoolean(raw?.Secreto),
        Oficial: toBoolean(raw?.Oficial),
    };
}

@Injectable({
    providedIn: "root"
})
export class IdiomaService {

    constructor(private db: Database, private http: HttpClient) { }

    getIdiomas(): Observable<IdiomaDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Idiomas");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const idiomas: IdiomaDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const idioma = normalizeIdioma(obj.val());
                    if (idioma.Id > 0)
                        idiomas.push(idioma);
                });

                idiomas.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(idiomas);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    private syncIdiomas() {
        return this.http.get(`${environment.apiUrl}idiomas`);
    }

    public async RenovarIdiomas(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncIdiomas());
            const idiomas = toArray(response)
                .map((raw: any) => normalizeIdioma(raw))
                .filter((idioma) => idioma.Id > 0);

            await Promise.all(
                idiomas.map((idioma) => set(ref(dbInstance, `Idiomas/${idioma.Id}`), idioma))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de idiomas actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de idiomas no disponible",
                    text: "No se encontro /idiomas en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de idiomas",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
