import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { Rasgo } from "../interfaces/rasgo";

@Injectable({
    providedIn: 'root'
})
export class RasgoService {

    constructor(private db: Database, private http: HttpClient) { }

    private toBoolean(value: any, fallback: boolean = false): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value !== 0;
        if (typeof value === 'string') {
            const normalizado = value.trim().toLowerCase();
            if (['true', '1', 'si', 'sí', 'yes'].includes(normalizado))
                return true;
            if (['false', '0', 'no'].includes(normalizado))
                return false;
        }
        return fallback;
    }

    private readSnapshotValue(snapshot: any, keys: string[]): any {
        for (const key of keys) {
            const value = snapshot?.child?.(key)?.val?.();
            if (value !== null && value !== undefined)
                return value;
        }
        return null;
    }

    getRasgo(id: number): Observable<Rasgo> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Rasgos/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let rasgo: Rasgo = {
                    Id: id,
                    Nombre: this.readSnapshotValue(snapshot, ['Nombre', 'n']) ?? '',
                    Descripcion: this.readSnapshotValue(snapshot, ['Descripcion', 'd']) ?? '',
                    Oficial: this.toBoolean(this.readSnapshotValue(snapshot, ['Oficial', 'oficial', 'o']), true),
                };
                observador.next(rasgo);
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

    getRasgos(): Observable<Rasgo[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Rasgos');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const rasgos: Rasgo[] = [];
                snapshot.forEach((obj: any) => {
                    const rasgo: Rasgo = {
                        Id: Number(this.readSnapshotValue(obj, ['Id', 'i']) ?? 0),
                        Nombre: this.readSnapshotValue(obj, ['Nombre', 'n']) ?? '',
                        Descripcion: this.readSnapshotValue(obj, ['Descripcion', 'd']) ?? '',
                        Oficial: this.toBoolean(this.readSnapshotValue(obj, ['Oficial', 'oficial', 'o']), true),
                    };
                    rasgos.push(rasgo);
                });
                observador.next(rasgos);
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

    private syncRasgos(): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}rasgos`);
        return res;
    }

    public async RenovarRasgos(): Promise<boolean> {
        const db_instance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncRasgos());
            const rasgos = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                rasgos.map((element: any) => {
                    const id = Number(element?.i ?? element?.Id ?? 0);
                    const nombre = `${element?.n ?? element?.Nombre ?? ''}`.trim();
                    const descripcion = `${element?.d ?? element?.Descripcion ?? ''}`;
                    if (!Number.isFinite(id) || id <= 0)
                        return Promise.resolve();
                    return set(
                        ref(db_instance, `Rasgos/${id}`), {
                        Id: id,
                        Nombre: nombre,
                        Descripcion: descripcion,
                        Oficial: this.toBoolean(element?.o ?? element?.Oficial ?? element?.oficial, true),
                    });
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de rasgos actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de rasgos',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}
