import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe, onValue, ref } from "@angular/fire/database";
import { Observable, Subject, firstValueFrom } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import {
    HabilidadBasicaDetalle,
    HabilidadCustomCreateRequest,
    HabilidadCustomMutationApiResponse,
    HabilidadCustomMutationResponse,
    HabilidadCustomUpdateRequest,
    HabilidadExtraRef,
} from "../interfaces/habilidad";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { cabeceraApiConFirebase } from './platform-session.service';
import { toBoolean, toInt, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { ElementoDeCatalogo, errorDeCatalogo } from "src/app/services/utils/error-catalogo";

const HABILIDAD: ElementoDeCatalogo = { singular: "habilidad", plural: "habilidades", femenino: true };

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object") {
        const envoltorios = ["data", "items", "rows", "recordset", "result", "resultado", "habilidades"];
        for (const key of envoltorios) {
            const v = (value as Record<string, any>)[key];
            if (Array.isArray(v))
                return v as T[];
        }
        return Object.values(value).filter(v => typeof v === "object") as T[];
    }
    return [];
}

function normalizeExtra(raw: any): HabilidadExtraRef {
    return {
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
        Descripcion: toText(raw?.Descripcion),
    };
}

export function normalizeHabilidadBasica(raw: any): HabilidadBasicaDetalle {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Nombre: toText(raw?.Nombre),
        Id_caracteristica: toNumber(raw?.Id_caracteristica),
        Caracteristica: toText(raw?.Caracteristica),
        Descripcion: toText(raw?.Descripcion),
        Soporta_extra: toBoolean(raw?.Soporta_extra),
        Entrenada: toBoolean(raw?.Entrenada),
        Extras: toArray(raw?.Extras).map(normalizeExtra),
    };
}

@Injectable({
    providedIn: "root"
})
export class HabilidadService {
    private readonly habilidadesCustomMutadasSubject = new Subject<HabilidadBasicaDetalle>();
    readonly habilidadesCustomMutadas$ = this.habilidadesCustomMutadasSubject.asObservable();

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getHabilidades(): Observable<HabilidadBasicaDetalle[]> {
        return this.getColeccion("Habilidades");
    }

    getHabilidadesCustom(): Observable<HabilidadBasicaDetalle[]> {
        return this.getColeccion("HabilidadesCustom");
    }

    private getColeccion(path: string): Observable<HabilidadBasicaDetalle[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const habilidades: HabilidadBasicaDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    const habilidad = normalizeHabilidadBasica(obj.val());
                    if (habilidad.Id_habilidad > 0)
                        habilidades.push(habilidad);
                });

                habilidades.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(habilidades);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, path);
                return onValue(dbRef, onNext, onError);
            });

            return () => {
                unsubscribe();
            };
        });
    }

    public async crearHabilidadCustom(payload: HabilidadCustomCreateRequest): Promise<HabilidadCustomMutationResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.post<HabilidadCustomMutationApiResponse>(`${environment.apiUrl}habilidades/custom/add`, payload, { headers })
            );
            const normalized = this.normalizarMutacionCustomResponse(response, payload, "Habilidad custom creada");
            this.notificarCustomMutada(normalized.habilidad);
            return normalized;
        } catch (error: any) {
            throw errorDeCatalogo(error, "crear", HABILIDAD);
        }
    }

    public async actualizarHabilidadCustom(
        idHabilidad: number,
        payload: HabilidadCustomUpdateRequest
    ): Promise<HabilidadCustomMutationResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const id = toInt(idHabilidad);
            const response = await firstValueFrom(
                this.http.patch<HabilidadCustomMutationApiResponse>(`${environment.apiUrl}habilidades/custom/${id}`, payload, { headers })
            );
            const normalized = this.normalizarMutacionCustomResponse(response, payload, "Habilidad custom actualizada", id);
            this.notificarCustomMutada(normalized.habilidad);
            return normalized;
        } catch (error: any) {
            throw errorDeCatalogo(error, "actualizar", HABILIDAD);
        }
    }

    private normalizarMutacionCustomResponse(
        response: HabilidadCustomMutationApiResponse,
        payload: HabilidadCustomCreateRequest | HabilidadCustomUpdateRequest,
        fallbackMessage: string,
        fallbackId: number = 0,
    ): HabilidadCustomMutationResponse {
        const idHabilidad = toInt(response?.idHabilidad ?? response?.id_habilidad ?? response?.habilidad?.Id_habilidad ?? fallbackId);
        if (!Number.isFinite(idHabilidad) || idHabilidad <= 0)
            throw new Error("La API no devolvió un idHabilidad válido");

        return {
            message: `${response?.message ?? fallbackMessage}`,
            idHabilidad,
            habilidad: normalizeHabilidadBasica(response?.habilidad ?? {
                Id_habilidad: idHabilidad,
                Nombre: payload.nombre ?? "",
                Id_caracteristica: payload.id_caracteristica ?? 0,
                Caracteristica: "",
                Descripcion: "",
                Soporta_extra: false,
                Entrenada: false,
                Extras: [],
            }),
        };
    }

    private notificarCustomMutada(habilidad: HabilidadBasicaDetalle): void {
        if (!habilidad || Number(habilidad.Id_habilidad) <= 0)
            return;
        this.habilidadesCustomMutadasSubject.next(habilidad);
    }
}
