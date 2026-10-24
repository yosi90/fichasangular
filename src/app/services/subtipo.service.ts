import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable, map, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { SubtipoDetalle, SubtipoResumen } from "../interfaces/subtipo";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { normalizeSubtipoDetalle, normalizeSubtipoResumen } from "./utils/subtipo-mapper";
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';

@Injectable({
    providedIn: "root"
})
export class SubtipoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getSubtipos(): Observable<SubtipoResumen[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Subtipos");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const subtipos: SubtipoResumen[] = [];
                snapshot.forEach((obj: any) => {
                    const subtipo = normalizeSubtipoResumen(obj.val());
                    if (subtipo.Id > 0)
                        subtipos.push(subtipo);
                });
                subtipos.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(subtipos);
            };

            const onError = (error: any) => observador.error(error);
            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));
            return () => unsubscribe();
        });
    }

    getSubtipo(id: number): Observable<SubtipoDetalle> {
        const subtipoId = Number(id);
        if (!Number.isFinite(subtipoId) || subtipoId <= 0)
            return throwError(() => new Error("Id de subtipo invalido"));

        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Subtipos/${subtipoId}`),
            // Si la caché solo tiene el resumen, se pide el detalle a la API.
            sirveLaCache: (snapshot) => {
                const raw = snapshot.exists() ? snapshot.val() : null;
                return !!raw && typeof raw === "object" && !!raw.Habilidades && !!raw.Movimientos;
            },
            desdeCache: (snapshot) => normalizeSubtipoDetalle(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}subtipos/${subtipoId}`),
            desdeApi: (raw) => normalizeSubtipoDetalle(raw),
            avisos: {
                noEncontrado: { titulo: "Subtipo no encontrado", texto: `No existe el subtipo con id ${subtipoId}` },
                error: "Error al obtener el subtipo",
            },
        });
    }

    buscarPorNombre(nombre: string): Observable<SubtipoResumen | null> {
        const objetivo = normalizarTexto(nombre);
        return this.getSubtipos().pipe(
            map((subtipos) => subtipos.find((s) => normalizarTexto(s.Nombre) === objetivo) ?? null)
        );
    }

}
