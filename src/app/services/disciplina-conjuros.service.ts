import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from '@angular/fire/database';
import { Observable } from "rxjs";
import { DisciplinaConjuros, Subdisciplinas } from "../interfaces/disciplina-conjuros";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toArray, toInt, toText } from 'src/app/services/utils/normalizacion';
import { escucharRtdbConAlternativa, listaRtdb } from './catalogo-api';

function normalizeSubdisciplinas(raw: any): Subdisciplinas[] {
    return toArray(raw)
        .map((item: any, index: number) => {
            if (typeof item === 'string') {
                return {
                    Id: index + 1,
                    Nombre: toText(item).trim(),
                };
            }
            return {
                Id: toInt(item?.Id, 0),
                Nombre: toText(item?.Nombre).trim(),
            };
        })
        .filter((item) => item.Nombre.length > 0);
}

function normalizeDisciplina(raw: any, fallbackId: number = 0): DisciplinaConjuros {
    return {
        Id: toInt(raw?.Id, fallbackId),
        Nombre: toText(raw?.Nombre).trim(),
        Nombre_especial: toText(raw?.Nombre_esp).trim(),
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
        return new Observable((observador) => escucharRtdbConAlternativa(
            this.db, this.firebaseContextSvc, `disciplinas/${id}`, `Disciplinas/${id}`,
        )((snapshot) => {
            if (snapshot.exists())
                observador.next(normalizeDisciplina(snapshot.val(), id));
        }, (error) => observador.error(error)));
    }

    getDisciplinas(): Observable<DisciplinaConjuros[]> {
        return listaRtdb(
            escucharRtdbConAlternativa(this.db, this.firebaseContextSvc, 'disciplinas', 'Disciplinas'),
            (raw) => normalizeDisciplina(raw),
        );
    }

}
