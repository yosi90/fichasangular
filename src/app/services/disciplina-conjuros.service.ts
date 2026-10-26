import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from '@angular/fire/database';
import { Observable } from "rxjs";
import { DisciplinaConjuros } from "../interfaces/disciplina-conjuros";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toBoolean, toInt, toText } from 'src/app/services/utils/normalizacion';
import { escucharRtdbConAlternativa, listaRtdb } from './catalogo-api';
import { normalizeSubdisciplinas } from './utils/conjuro-mapper';

function normalizeDisciplina(raw: any, fallbackId: number = 0): DisciplinaConjuros {
    return {
        Id: toInt(raw?.Id, fallbackId),
        Nombre: toText(raw?.Nombre).trim(),
        Nombre_especial: toText(raw?.Nombre_esp).trim(),
        Subdisciplinas: normalizeSubdisciplinas(raw?.Subdisciplinas),
        Especializable: toBoolean(raw?.Especializable),
        Prohibidas_al_especializarse: Math.max(0, toInt(raw?.Prohibidas_al_especializarse)),
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
