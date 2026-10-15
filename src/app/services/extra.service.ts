import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { ExtraDetalle } from "../interfaces/extra";
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

export function normalizeExtra(raw: any): ExtraDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

@Injectable({
    providedIn: "root"
})
export class ExtraService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getExtras(): Observable<ExtraDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Extras");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const extras: ExtraDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const extra = normalizeExtra(obj.val());
                    if (extra.Id > 0 && extra.Nombre.trim().length > 0)
                        extras.push(extra);
                });

                extras.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(extras);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    getExtra(id: number): Observable<ExtraDetalle> {
        return new Observable((observador) => {
            const idNormalizado = Math.trunc(toNumber(id));
            if (idNormalizado <= 0) {
                observador.error(new Error("Id de extra invalido"));
                return;
            }

            const dbRef = ref(this.db, `Extras/${idNormalizado}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeExtra(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}extras/${idNormalizado}`).subscribe({
                    next: (raw: any) => observador.next(normalizeExtra(raw)),
                    error: (error: HttpErrorResponse) => observador.error(error),
                });
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

}
