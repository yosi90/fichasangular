import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { Manual } from '../interfaces/manual';
import { ManualIncludeFlag } from '../config/manual-secciones.config';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === '1';
}

function hasCanonicalManualShape(raw: any): boolean {
    return !!raw
        && typeof raw === 'object'
        && Object.prototype.hasOwnProperty.call(raw, 'Id')
        && Object.prototype.hasOwnProperty.call(raw, 'Nombre');
}

function normalizeManual(raw: any): Manual {
    if (!hasCanonicalManualShape(raw)) {
        return {
            Id: 0,
            Nombre: '',
            Incluye_dotes: false,
            Incluye_conjuros: false,
            Incluye_plantillas: false,
            Incluye_monstruos: false,
            Incluye_razas: false,
            Incluye_clases: false,
            Incluye_tipos: false,
            Incluye_subtipos: false,
            Oficial: false,
        };
    }

    return {
        Id: Number(raw?.Id ?? 0),
        Nombre: raw?.Nombre ?? '',
        Incluye_dotes: toBoolean(raw?.Incluye_dotes),
        Incluye_conjuros: toBoolean(raw?.Incluye_conjuros),
        Incluye_plantillas: toBoolean(raw?.Incluye_plantillas),
        Incluye_monstruos: toBoolean(raw?.Incluye_monstruos),
        Incluye_razas: toBoolean(raw?.Incluye_razas),
        Incluye_clases: toBoolean(raw?.Incluye_clases),
        Incluye_tipos: toBoolean(raw?.Incluye_tipos),
        Incluye_subtipos: toBoolean(raw?.Incluye_subtipos),
        Oficial: toBoolean(raw?.Oficial),
    };
}

export type ManualFlagsPatchPayload = Partial<Record<ManualIncludeFlag, boolean>>;

@Injectable({
    providedIn: 'root'
})
export class ManualService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private auth?: Auth,
    ) { }

    getManual(id: number): Observable<Manual> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Manuales/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeManual(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}manuales/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeManual(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Manual no encontrado',
                                text: `No existe el manual con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Error al obtener el manual',
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

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));

            return () => {
                unsubscribe();
            };
        });
    }

    getManuales(): Observable<Manual[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Manuales');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Manuales: Manual[] = [];
                snapshot.forEach((obj: any) => {
                    Manuales.push(normalizeManual(obj.val()));
                });

                Manuales.sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                observador.next(Manuales);
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

}
