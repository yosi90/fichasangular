import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable, map } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { SubtipoDetalle, SubtipoResumen } from "../interfaces/subtipo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeSubtipoDetalle, normalizeSubtipoResumen } from "./utils/subtipo-mapper";
import { normalizarTexto, toArray } from 'src/app/services/utils/normalizacion';

@Injectable({
    providedIn: "root"
})
export class SubtipoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getSubtipos(): Observable<SubtipoResumen[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Subtipos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const subtipos: SubtipoResumen[] = [];
                snapshot.forEach((obj: any) => {
                    const subtipo = normalizeSubtipoResumen(obj.val());
                    if (subtipo.Id > 0)
                        subtipos.push(subtipo);
                });
                subtipos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(subtipos);
            };

            const onError = (error: any) => observador.error(error);
            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    getSubtipo(id: number): Observable<SubtipoDetalle> {
        return new Observable((observador) => {
            const subtipoId = Number(id);
            if (!Number.isFinite(subtipoId) || subtipoId <= 0) {
                observador.error(new Error("Id de subtipo invalido"));
                return;
            }

            const dbRef = ref(this.db, `Subtipos/${subtipoId}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    const raw = snapshot.val();
                    // Si el cache solo tiene resumen, se pide detalle remoto.
                    if (raw && typeof raw === "object" && raw.Habilidades && raw.Movimientos) {
                        observador.next(normalizeSubtipoDetalle(raw));
                        return;
                    }
                }

                this.http.get(`${environment.apiUrl}subtipos/${subtipoId}`).subscribe({
                    next: async (raw: any) => {
                        const detalle = normalizeSubtipoDetalle(raw);
                        observador.next(detalle);
                    },
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Subtipo no encontrado",
                                text: `No existe el subtipo con id ${subtipoId}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el subtipo",
                                text: error.message,
                                showConfirmButton: true,
                            });
                        }
                        observador.error(error);
                    }
                });
            };

            const onError = (error: any) => observador.error(error);
            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    buscarPorNombre(nombre: string): Observable<SubtipoResumen | null> {
        const objetivo = normalizarTexto(nombre);
        return this.getSubtipos().pipe(
            map((subtipos) => subtipos.find((s) => normalizarTexto(s.Nombre) === objetivo) ?? null)
        );
    }

}
