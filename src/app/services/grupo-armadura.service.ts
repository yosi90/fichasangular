import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
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

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getGrupoArmadura(id: number): Observable<GrupoCompetencia> {
        return new Observable((observador) => {
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

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, `GruposArmaduras/${id}`);
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

    getGruposArmaduras(): Observable<GrupoCompetencia[]> {
        return new Observable((observador) => {
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

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "GruposArmaduras");
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

}
