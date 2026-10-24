import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable, map } from "rxjs";
import { environment } from "src/environments/environment";
import { Plantilla } from "../interfaces/plantilla";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizePlantilla, normalizePlantillaApi } from "./utils/plantilla-mapper";
import { normalizarTexto, toNumber } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

function hasValidId(raw: any): boolean {
    return toNumber(raw?.Id) > 0;
}

@Injectable({
    providedIn: "root"
})
export class PlantillaService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getPlantilla(id: number): Observable<Plantilla> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Plantillas/${id}`),
            desdeCache: (snapshot) => normalizePlantilla(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}plantillas/${id}`),
            desdeApi: (raw) => normalizePlantillaApi(raw),
            avisos: {
                noEncontrado: { titulo: "Plantilla no encontrada", texto: `No existe la plantilla con id ${id}` },
                error: "Error al obtener la plantilla",
            },
        });
    }

    getPlantillas(): Observable<Plantilla[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const plantillas: Plantilla[] = [];
                snapshot.forEach((obj: any) => {
                    const plantilla = normalizePlantilla(obj.val());
                    if (hasValidId(plantilla))
                        plantillas.push(plantilla);
                });

                plantillas.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(plantillas);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, "Plantillas");
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    buscarPorNombre(nombre: string): Observable<Plantilla | null> {
        const objetivo = normalizarTexto(nombre);
        return this.getPlantillas().pipe(
            map(plantillas => plantillas.find(p => normalizarTexto(p.Nombre) === objetivo) ?? null)
        );
    }

}
