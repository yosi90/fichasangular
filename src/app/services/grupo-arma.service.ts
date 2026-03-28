import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
import { Observable, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { GrupoCompetencia } from "../interfaces/grupo-competencia";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

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

export function normalizeGrupoArma(raw: any): GrupoCompetencia {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class GrupoArmaService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getGrupoArma(id: number): Observable<GrupoCompetencia> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeGrupoArma(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}grupos-armas/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeGrupoArma(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Grupo de arma no encontrado",
                                text: `No existe el grupo de arma con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el grupo de arma",
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

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, `GruposArmas/${id}`);
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

    getGruposArmas(): Observable<GrupoCompetencia[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const grupos: GrupoCompetencia[] = [];
                snapshot.forEach((obj: any) => {
                    const grupo = normalizeGrupoArma(obj.val());
                    if (grupo.Id > 0)
                        grupos.push(grupo);
                });
                grupos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(grupos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "GruposArmas");
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

    private syncGruposArmas() {
        return this.http.get(`${environment.apiUrl}grupos-armas`);
    }

    public async RenovarGruposArmas(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncGruposArmas());
            const grupos = toArray(response)
                .map((raw: any) => normalizeGrupoArma(raw))
                .filter((grupo) => grupo.Id > 0);

            await Promise.all(
                grupos.map((grupo) => this.firebaseContextSvc.run(() => set(ref(this.db, `GruposArmas/${grupo.Id}`), grupo)))
            );

            Swal.fire({
                icon: "success",
                title: "Listado de grupos de armas actualizado con exito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de grupos de armas no disponible",
                    text: "No se encontro /grupos-armas en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de grupos de armas",
                    text: error?.message ?? "Error no identificado",
                    showConfirmButton: true
                });
            }
            return false;
        }
    }
}
