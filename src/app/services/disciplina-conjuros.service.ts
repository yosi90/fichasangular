import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, onValue, ref } from '@angular/fire/database';
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import { DisciplinaConjuros, Subdisciplinas } from "../interfaces/disciplina-conjuros";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray } from 'src/app/services/utils/normalizacion';

function toInt(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toText(value: any): string {
    return `${value ?? ''}`.trim();
}

function normalizeSubdisciplinas(raw: any): Subdisciplinas[] {
    return toArray(raw)
        .map((item: any, index: number) => {
            if (typeof item === 'string') {
                return {
                    Id: index + 1,
                    Nombre: toText(item),
                };
            }
            return {
                Id: toInt(item?.Id, 0),
                Nombre: toText(item?.Nombre),
            };
        })
        .filter((item) => {
            const nombre = item.Nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
            return item.Nombre.length > 0 && nombre !== 'ninguna' && nombre !== 'sin subdisciplina';
        });
}

function normalizeDisciplina(raw: any, fallbackId: number = 0): DisciplinaConjuros {
    return {
        Id: toInt(raw?.Id, fallbackId),
        Nombre: toText(raw?.Nombre),
        Nombre_especial: toText(raw?.Nombre_esp),
        Subdisciplinas: normalizeSubdisciplinas(raw?.Subdisciplinas),
    };
}

@Injectable({
    providedIn: 'root'
})
export class DisciplinaConjurosService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getDisciplina(id: number): Observable<DisciplinaConjuros> {
        return new Observable((observador) => {
            const dbRefLower = ref(this.db, `disciplinas/${id}`);
            const dbRefUpper = ref(this.db, `Disciplinas/${id}`);
            let lowerSnapshot: any = null;
            let upperSnapshot: any = null;

            const emitPreferred = () => {
                const snapshot = lowerSnapshot?.exists?.() ? lowerSnapshot : upperSnapshot?.exists?.() ? upperSnapshot : null;
                if (!snapshot)
                    return;
                observador.next(normalizeDisciplina(snapshot.val(), id));
            };

            const onError = (error: any) => observador.error(error);
            const unsubscribeLower = this.firebaseContextSvc.run(() => onValue(dbRefLower, (snapshot: any) => {
                lowerSnapshot = snapshot;
                emitPreferred();
            }, onError));
            const unsubscribeUpper = this.firebaseContextSvc.run(() => onValue(dbRefUpper, (snapshot: any) => {
                upperSnapshot = snapshot;
                emitPreferred();
            }, onError));

            return () => {
                unsubscribeLower();
                unsubscribeUpper();
            };
        });
    }

    getDisciplinas(): Observable<DisciplinaConjuros[]> {
        return new Observable((observador) => {
            const dbRefLower = ref(this.db, 'disciplinas');
            const dbRefUpper = ref(this.db, 'Disciplinas');
            let lowerSnapshot: any = null;
            let upperSnapshot: any = null;

            const emitPreferred = () => {
                const snapshot = lowerSnapshot?.exists?.() ? lowerSnapshot : upperSnapshot?.exists?.() ? upperSnapshot : null;
                if (!snapshot) {
                    observador.next([]);
                    return;
                }

                const disciplinas = toArray(snapshot.val())
                    .map((raw: any) => normalizeDisciplina(raw))
                    .filter((disciplina) => disciplina.Id > 0 && disciplina.Nombre.length > 0)
                    .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                observador.next(disciplinas);
            };

            const onError = (error: any) => observador.error(error);
            const unsubscribeLower = this.firebaseContextSvc.run(() => onValue(dbRefLower, (snapshot: any) => {
                lowerSnapshot = snapshot;
                emitPreferred();
            }, onError));
            const unsubscribeUpper = this.firebaseContextSvc.run(() => onValue(dbRefUpper, (snapshot: any) => {
                upperSnapshot = snapshot;
                emitPreferred();
            }, onError));

            return () => {
                unsubscribeLower();
                unsubscribeUpper();
            };
        });
    }

}
