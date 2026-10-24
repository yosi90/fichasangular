import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { Rasgo } from "../interfaces/rasgo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toBoolean } from 'src/app/services/utils/normalizacion';

@Injectable({
    providedIn: 'root'
})
export class RasgoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) { }

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
                    Oficial: toBoolean(this.readSnapshotValue(snapshot, ['Oficial', 'oficial', 'o']), true),
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
                        Oficial: toBoolean(this.readSnapshotValue(obj, ['Oficial', 'oficial', 'o']), true),
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
