import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { Rasgo } from "../interfaces/rasgo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

@Injectable({
    providedIn: 'root'
})
export class RasgoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) { }

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
            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, `Rasgos/${id}`);
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    getRasgos(): Observable<Rasgo[]> {
        return new Observable((observador) => {
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

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, 'Rasgos');
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

}
