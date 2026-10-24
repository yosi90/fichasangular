import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database } from '@angular/fire/database';
import { Observable } from "rxjs";
import { SubdisciplinaCatalogItem } from "../interfaces/conjuro-catalogos";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { toInt, toText } from 'src/app/services/utils/normalizacion';
import { escucharRtdbConAlternativa, listaRtdb } from './catalogo-api';

function normalizeSubdisciplina(raw: any): SubdisciplinaCatalogItem {
    return {
        Id: toInt(raw?.Id, 0),
        Nombre: toText(raw?.Nombre).trim(),
        id_disciplina: toInt(raw?.Id_disciplina, 0),
    };
}

@Injectable({
    providedIn: 'root'
})
export class SubdisciplinaConjurosService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getSubdisciplinas(): Observable<SubdisciplinaCatalogItem[]> {
        return listaRtdb(
            escucharRtdbConAlternativa(this.db, this.firebaseContextSvc, 'subdisciplinas', 'Subdisciplinas'),
            (raw) => normalizeSubdisciplina(raw),
            (item) => item.Id > 0 && item.id_disciplina > 0 && item.Nombre.length > 0,
        );
    }

}
