import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { EscuelaConjuros } from "../interfaces/escuela-conjuros";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

function toInt(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toText(value: any): string {
    return `${value ?? ''}`.trim();
}

function toBoolean(value: any): boolean {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value > 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'si' || normalized === 'sí';
    }
    return false;
}

function normalizeEscuela(raw: any, fallbackId: number = 0): EscuelaConjuros {
    return {
        Id: toInt(raw?.Id, fallbackId),
        Nombre: toText(raw?.Nombre),
        Nombre_especial: toText(raw?.Nombre_esp ?? raw?.Nombre_especial),
        Prohibible: toBoolean(raw?.Prohibible),
    };
}

@Injectable({
    providedIn: 'root'
})
export class EscuelaConjurosService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getEscuela(id: number): Observable<EscuelaConjuros> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Escuelas/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                observador.next(normalizeEscuela(snapshot.val(), id));
            };

            const onError = (error: any) => {
                observador.error(error);
            };
            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));

            return () => {
                unsubscribe();
            };
        });
    }

    getEscuelas(): Observable<EscuelaConjuros[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Escuelas');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const escuelas: EscuelaConjuros[] = [];
                snapshot.forEach((obj: any) => {
                    const escuela = normalizeEscuela(obj.val());
                    escuelas.push(escuela);
                });
                observador.next(escuelas);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));

            return () => {
                unsubscribe();
            };
        });
    }

    private syncEscuelas(): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}escuelas`);
        return res;
    }

    public async RenovarEscuelas(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncEscuelas());
            const escuelas = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                escuelas.map((element: any) => {
                    const escuela = normalizeEscuela(element);
                    if (escuela.Id <= 0 || escuela.Nombre.length < 1)
                        return Promise.resolve();
                    return this.firebaseContextSvc.run(() => set(
                        ref(this.db, `Escuelas/${escuela.Id}`), {
                        Id: escuela.Id,
                        Nombre: escuela.Nombre,
                        Nombre_especial: escuela.Nombre_especial,
                        Prohibible: escuela.Prohibible
                    }));
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de escuelas actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de escuelas',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}
