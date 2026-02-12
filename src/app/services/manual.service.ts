import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { Manual } from '../interfaces/manual';

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

@Injectable({
    providedIn: 'root'
})
export class ManualService {

    constructor(private db: Database, private http: HttpClient) { }

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

            unsubscribe = onValue(dbRef, onNext, onError);

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

            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    private syncManuales(): Observable<any> {
        return this.http.get(`${environment.apiUrl}manuales`);
    }

    public async RenovarManuales() {
        const db = getDatabase();
        this.syncManuales().subscribe(
            response => {
                response.forEach((raw: any) => {
                    const manual = normalizeManual(raw);
                    set(ref(db, `Manuales/${manual.Id}`), manual);
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Listado de manuales actualizado con éxito',
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            (error: any) => {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error al actualizar el listado de manuales',
                    text: error.message,
                    showConfirmButton: true
                });
            }
        );
    }
}
