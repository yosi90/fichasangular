import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { EscuelaConjuros } from "../interfaces/escuela-conjuros";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toBoolean } from 'src/app/services/utils/normalizacion';

function toInt(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toText(value: any): string {
    return `${value ?? ''}`.trim();
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
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                observador.next(normalizeEscuela(snapshot.val(), id));
            };

            const onError = (error: any) => {
                observador.error(error);
            };
            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, `Escuelas/${id}`);
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    getEscuelas(): Observable<EscuelaConjuros[]> {
        return new Observable((observador) => {
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

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, 'Escuelas');
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

}
