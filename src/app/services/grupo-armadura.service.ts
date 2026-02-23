import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { GrupoCompetencia } from "../interfaces/grupo-competencia";

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

export function normalizeGrupoArmadura(raw: any): GrupoCompetencia {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class GrupoArmaduraService {

    constructor(private db: Database, private http: HttpClient) { }

    getGrupoArmadura(id: number): Observable<GrupoCompetencia> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `GruposArmaduras/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeGrupoArmadura(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}grupos-armaduras/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeGrupoArmadura(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Grupo de armadura no encontrado",
                                text: `No existe el grupo de armadura con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el grupo de armadura",
                                text: error.message,
                                showConfirmButton: true,
                            });
                        }
                        observador.error(error);
                    }
                });
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    getGruposArmaduras(): Observable<GrupoCompetencia[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "GruposArmaduras");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const grupos: GrupoCompetencia[] = [];
                snapshot.forEach((obj: any) => {
                    const grupo = normalizeGrupoArmadura(obj.val());
                    if (grupo.Id > 0)
                        grupos.push(grupo);
                });
                grupos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(grupos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    private syncGruposArmaduras() {
        return this.http.get(`${environment.apiUrl}grupos-armaduras`);
    }

    public async RenovarGruposArmaduras(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncGruposArmaduras());
            const grupos = toArray(response)
                .map((raw: any) => normalizeGrupoArmadura(raw))
                .filter((grupo) => grupo.Id > 0);

            await Promise.all(
                grupos.map((grupo) => set(ref(dbInstance, `GruposArmaduras/${grupo.Id}`), grupo))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de grupos de armaduras actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de grupos de armaduras no disponible",
                    text: "No se encontro /grupos-armaduras en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de grupos de armaduras",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
