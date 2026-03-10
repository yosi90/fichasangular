import { Injectable } from '@angular/core';
import { Database, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { Manual } from '../interfaces/manual';
import { ManualIncludeFlag } from '../config/manual-secciones.config';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === '1';
}

function normalizeManual(raw: any): Manual {
    return {
        Id: Number(raw?.Id ?? raw?.i ?? 0),
        Nombre: raw?.Nombre ?? raw?.n ?? '',
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

    private syncManuales(): Observable<any> {
        return this.http.get(`${environment.apiUrl}manuales`);
    }

    public async patchManualFlags(idManual: number, payload: ManualFlagsPatchPayload): Promise<Manual> {
        const id = Math.trunc(Number(idManual));
        if (!Number.isFinite(id) || id <= 0)
            throw new Error('Id de manual inválido');

        const allowedEntries = Object.entries(payload ?? {})
            .filter(([_, value]) => typeof value === 'boolean');
        if (allowedEntries.length < 1)
            throw new Error('No hay flags de manual para actualizar');

        const requestBody = allowedEntries.reduce((acc, [key, value]) => {
            acc[key as ManualIncludeFlag] = value;
            return acc;
        }, {} as ManualFlagsPatchPayload);

        try {
            const response = await firstValueFrom(
                this.http.patch(`${environment.apiUrl}manuales/${id}`, requestBody)
            );
            return normalizeManual(response);
        } catch (error: any) {
            if (error instanceof HttpErrorResponse) {
                const backendMessage = this.extractErrorMessage(error.error);
                if (backendMessage.length > 0)
                    throw new Error(backendMessage);
                if (error.status === 404)
                    throw new Error(`No existe el manual con id ${id}`);
                if (error.status === 400)
                    throw new Error('La API rechazó las flags del manual');
            }

            throw new Error(error?.message ?? `No se pudieron actualizar las flags del manual ${id}`);
        }
    }

    public async RenovarManuales(showFeedback: boolean = true): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncManuales());
            const manuales = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                manuales.map((raw: any) => {
                    const manual = normalizeManual(raw);
                    return this.firebaseContextSvc.run(() => set(ref(this.db, `Manuales/${manual.Id}`), manual));
                })
            );

            if (showFeedback) {
                Swal.fire({
                    icon: 'success',
                    title: 'Listado de manuales actualizado con éxito',
                    showConfirmButton: true,
                    timer: 2000
                });
            }
            return true;
        } catch (error: any) {
            if (showFeedback) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error al actualizar el listado de manuales',
                    text: error?.message ?? 'Error no identificado',
                    showConfirmButton: true
                });
            }
            return false;
        }
    }

    private extractErrorMessage(errorBody: any): string {
        if (!errorBody)
            return '';

        if (typeof errorBody === 'string') {
            const message = errorBody.trim();
            return message.length > 0 ? message : '';
        }

        if (typeof errorBody === 'object') {
            const message = `${errorBody?.message ?? errorBody?.error ?? ''}`.trim();
            if (message.length > 0)
                return message;
        }

        return '';
    }
}
