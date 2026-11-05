import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";
import { Rasgo, RasgoCuerpo } from "../interfaces/rasgo";
import { EscrituraDeCatalogo, guardarEnCatalogo } from "./escritura-de-catalogo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { RASGO } from 'src/app/services/utils/nombres-de-catalogo';
import { toBoolean, toInt, toText } from 'src/app/services/utils/normalizacion';
import { EntradaGuardada } from 'src/app/services/utils/respuesta-de-escritura';

/** `RasgoDetalle` de la API (`GET /rasgos/<id>` y la respuesta del alta y la edición): claves cortas `i`, `n`, `d`, `o`. */
export function normalizeRasgoApi(raw: any): Rasgo {
    return {
        Id: toInt(raw?.i ?? raw?.Id),
        Nombre: toText(raw?.n ?? raw?.Nombre),
        Descripcion: toText(raw?.d ?? raw?.Descripcion),
        Oficial: toBoolean(raw?.o ?? raw?.Oficial, true),
    };
}

@Injectable({
    providedIn: 'root'
})
export class RasgoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private auth?: Auth,
    ) { }

    /** El rasgo por HTTP, sin caché: el que abre «Modificar rasgo» (guía de modificaciones de catálogo). */
    getRasgoFresco(id: number): Observable<Rasgo> {
        return this.http.get(`${environment.apiUrl}rasgos/${Math.trunc(Number(id))}`).pipe(map((raw: any) => normalizeRasgoApi(raw)));
    }

    /** `POST /rasgos/add`: permiso de creación `rasgos`. */
    crearRasgo(cuerpo: RasgoCuerpo): Promise<EntradaGuardada<Rasgo>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_RASGO, null, cuerpo);
    }

    /** `PUT /rasgos/<id>`: el rasgo entero, con el mismo cuerpo que el alta (el mismo permiso). */
    actualizarRasgo(id: number, cuerpo: RasgoCuerpo): Promise<EntradaGuardada<Rasgo>> {
        return guardarEnCatalogo(this.http, this.auth, ESCRITURA_RASGO, id, cuerpo);
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

/** `{ message, idRasgo, rasgo }`, el rasgo con las claves cortas de su `GET`. */
const ESCRITURA_RASGO: EscrituraDeCatalogo<Rasgo> = {
    url: 'rasgos', clave: 'rasgo', claveId: 'idRasgo', normalizar: normalizeRasgoApi, nombre: RASGO,
};
