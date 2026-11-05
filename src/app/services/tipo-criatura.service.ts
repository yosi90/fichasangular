import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";
import { TipoCriatura, TipoCriaturaCuerpo, TipoCriaturaEditable } from "../interfaces/tipo_criatura";
import { EscrituraDeCatalogo, guardarEnCatalogo } from "./escritura-de-catalogo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeRasgoTipo } from "./rasgo.service";
import { leerComodin } from "./utils/comodin";
import { TIPO_CRIATURA } from "./utils/nombres-de-catalogo";
import { toArray, toBoolean, toInt, toText } from "./utils/normalizacion";
import { EntradaGuardada } from "./utils/respuesta-de-escritura";

/** Un tipo de criatura de la caché de la RTDB (`TiposCriatura/{id}`). */
function tipoCriaturaDesdeRtdb(nodo: any, id: number): TipoCriatura {
    return {
        Id: id,
        Nombre: nodo.child('Nombre').val(),
        Comodin: leerComodin(nodo.child('Comodin').val()),
        Descripcion: nodo.child('Descripcion').val(),
        Manual: nodo.child('Manual').val(),
        Id_tipo_dado: nodo.child('Id_tipo_dado').val(),
        Tipo_dado: nodo.child('Tipo_dado').val(),
        Id_ataque: nodo.child('Id_ataque').val(),
        Id_fortaleza: nodo.child('Id_fortaleza').val(),
        Id_reflejos: nodo.child('Id_reflejos').val(),
        Id_voluntad: nodo.child('Id_voluntad').val(),
        Id_puntos_habilidad: nodo.child('Id_puntos_habilidad').val(),
        Puntos_habilidad: nodo.child('Puntos_habilidad').val() ?? 0,
        Come: nodo.child('Come').val(),
        Respira: nodo.child('Respira').val(),
        Duerme: nodo.child('Duerme').val(),
        Recibe_criticos: nodo.child('Recibe_críticos').val(),
        Puede_ser_flanqueado: nodo.child('Puede_ser_flanqueado').val(),
        Pierde_constitucion: nodo.child('Pierde_constitucion').val(),
        Limite_inteligencia: nodo.child('Limite_inteligencia').val(),
        Tesoro: nodo.child('Tesoro').val(),
        Id_alineamiento: nodo.child('Id_alineamiento').val(),
        Rasgos: nodo.child('Rasgos').val(),
        Oficial: nodo.child('Oficial').val(),
    };
}

/**
 * `TipoCriaturaResumen` de la API (`GET /tiposCriatura/<id>` y la respuesta del alta y la edición), con sus claves cortas
 * (`i`, `n`, `ma`…), como la caché, más el id del manual y la página (`im`, `pg`).
 */
export function normalizeTipoCriaturaApi(raw: any): TipoCriaturaEditable {
    return {
        Id: toInt(raw?.i),
        Nombre: toText(raw?.n),
        Comodin: leerComodin(raw?.Comodin),
        Descripcion: toText(raw?.d),
        Manual: toText(raw?.ma),
        Id_tipo_dado: toInt(raw?.itd),
        Tipo_dado: raw?.ntd ?? 0,
        Id_ataque: toInt(raw?.ia),
        Id_fortaleza: toInt(raw?.ift),
        Id_reflejos: toInt(raw?.ir),
        Id_voluntad: toInt(raw?.iv),
        Id_puntos_habilidad: toInt(raw?.iph),
        Puntos_habilidad: toInt(raw?.ph),
        Come: toBoolean(raw?.c),
        Respira: toBoolean(raw?.r),
        Duerme: toBoolean(raw?.du),
        Recibe_criticos: toBoolean(raw?.cr),
        Puede_ser_flanqueado: toBoolean(raw?.f),
        Pierde_constitucion: toBoolean(raw?.pc),
        Limite_inteligencia: toInt(raw?.li),
        Tesoro: toText(raw?.t),
        Id_alineamiento: toInt(raw?.ial),
        Rasgos: toArray(raw?.ra).map((rasgo) => normalizeRasgoTipo(rasgo)),
        Oficial: toBoolean(raw?.o, true),
        Id_manual: toInt(raw?.im),
        Pagina: toInt(raw?.pg),
    };
}

/** `{ message, idTipo, tipo }`, el tipo con las claves cortas de su `GET`. */
const ESCRITURA_TIPO_CRIATURA: EscrituraDeCatalogo<TipoCriaturaEditable> = {
    url: 'tiposCriatura', clave: 'tipo', claveId: 'idTipo', normalizar: normalizeTipoCriaturaApi, nombre: TIPO_CRIATURA,
};

@Injectable({
    providedIn: 'root'
})
export class TipoCriaturaService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private auth?: Auth,
    ) { }

    /** El tipo por HTTP, sin caché: el que abre «Modificar tipo de criatura». */
    getTipoCriaturaFresco(id: number): Observable<TipoCriaturaEditable> {
        return this.http.get(`${environment.apiUrl}tiposCriatura/${Math.trunc(Number(id))}`)
            .pipe(map((raw: any) => normalizeTipoCriaturaApi(raw)));
    }

    /** `POST /tiposCriatura/add`: permiso de creación `tipos_criatura`. */
    crearTipoCriatura(cuerpo: TipoCriaturaCuerpo): Promise<EntradaGuardada<TipoCriaturaEditable>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_TIPO_CRIATURA, null, cuerpo);
    }

    /** `PUT /tiposCriatura/<id>`: el tipo entero, con el mismo cuerpo que el alta (el mismo permiso). */
    actualizarTipoCriatura(id: number, cuerpo: TipoCriaturaCuerpo): Promise<EntradaGuardada<TipoCriaturaEditable>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_TIPO_CRIATURA, id, cuerpo);
    }

    getTipoCriatura(id: number): Observable<TipoCriatura> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                observador.next(tipoCriaturaDesdeRtdb(snapshot, id));
            };

            const onError = (error: any) => {
                observador.error(error);
            };
            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, `TiposCriatura/${id}`);
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    getTiposCriatura(): Observable<TipoCriatura[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const TiposCriatura: TipoCriatura[] = [];
                snapshot.forEach((obj: any) => {
                    TiposCriatura.push(tipoCriaturaDesdeRtdb(obj, obj.child('Id').val()));
                });
                observador.next(TiposCriatura);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, 'TiposCriatura');
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

}
