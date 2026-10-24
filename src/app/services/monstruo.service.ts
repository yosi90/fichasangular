import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoDetalle } from "../interfaces/monstruo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import {
    normalizeCompaneroMonstruoDetalle,
    normalizeFamiliarMonstruoDetalle,
    normalizeMonstruoDetalle,
} from "./utils/monstruo-mapper";
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

@Injectable({
    providedIn: "root"
})
export class MonstruoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getMonstruo(id: number): Observable<MonstruoDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Monstruos/${id}`),
            desdeCache: (snapshot) => normalizeMonstruoDetalle(snapshot.val(), 1),
            pedir: () => this.http.get(`${environment.apiUrl}monstruos/${id}`),
            desdeApi: (raw) => normalizeMonstruoDetalle(raw, 1),
            avisos: {
                noEncontrado: { titulo: "Monstruo no encontrado", texto: `No existe el monstruo con id ${id}` },
                error: "Error al obtener el monstruo",
            },
        });
    }

    getMonstruos(): Observable<MonstruoDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Monstruos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const monstruos: MonstruoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const monstruo = normalizeMonstruoDetalle(obj.val(), 1);
                    if (monstruo.Id > 0)
                        monstruos.push(monstruo);
                });
                monstruos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(monstruos);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    getFamiliar(idFamiliar: number): Observable<FamiliarMonstruoDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Familiares/${idFamiliar}`),
            desdeCache: (snapshot) => normalizeFamiliarMonstruoDetalle(snapshot.val(), 1),
            pedir: () => this.http.get(`${environment.apiUrl}familiares/${idFamiliar}`),
            desdeApi: (raw) => normalizeFamiliarMonstruoDetalle(raw, 1),
            avisos: {
                noEncontrado: { titulo: "Familiar no encontrado", texto: `No existe el familiar con id ${idFamiliar}` },
                error: "Error al obtener el familiar",
            },
        });
    }

    getFamiliares(): Observable<FamiliarMonstruoDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Familiares");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const familiares: FamiliarMonstruoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const familiar = normalizeFamiliarMonstruoDetalle(obj.val(), 1);
                    if (familiar.Id_familiar > 0)
                        familiares.push(familiar);
                });
                familiares.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(familiares);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    getCompanero(idCompanero: number): Observable<CompaneroMonstruoDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Companeros/${idCompanero}`),
            desdeCache: (snapshot) => normalizeCompaneroMonstruoDetalle(snapshot.val(), 1),
            pedir: () => this.http.get(`${environment.apiUrl}companeros/${idCompanero}`),
            desdeApi: (raw) => normalizeCompaneroMonstruoDetalle(raw, 1),
            avisos: {
                noEncontrado: { titulo: "Compañero animal no encontrado", texto: `No existe el compañero animal con id ${idCompanero}` },
                error: "Error al obtener el compañero animal",
            },
        });
    }

    getCompaneros(): Observable<CompaneroMonstruoDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Companeros");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const companeros: CompaneroMonstruoDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const companero = normalizeCompaneroMonstruoDetalle(obj.val(), 1);
                    if (companero.Id_companero > 0)
                        companeros.push(companero);
                });
                companeros.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(companeros);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

}
