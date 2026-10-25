import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, ref, set } from "@angular/fire/database";
import { Observable, Subject, firstValueFrom, map } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import {
    EspecialBonificadores,
    EspecialClaseDetalle,
    EspecialClaseMutationApiResponse,
    EspecialClaseMutationRequest,
    EspecialClaseMutationResponse,
    EspecialExtraRef,
    EspecialFlagsExtra,
    EspecialHabilidadRef,
    EspecialRefSimple
} from "../interfaces/especial";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";
import { cabeceraApiConFirebase } from './platform-session.service';
import { toArray, toBoolean, toInt, toNumber, toText } from 'src/app/services/utils/normalizacion';
import { cacheRtdbOApi, escucharRtdb } from './catalogo-api';
import { ElementoDeCatalogo, errorDeCatalogo } from "src/app/services/utils/error-catalogo";
import { leerComodin } from "src/app/services/utils/comodin";
import { mensajeDeError } from './utils/error-api';

const ESPECIAL: ElementoDeCatalogo = { singular: "especial", plural: "especiales", femenino: false };

function normalizeRefSimple(raw: any): EspecialRefSimple {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
    };
}

function normalizeBonificadores(raw: any): EspecialBonificadores {
    return {
        Fuerza: toNumber(raw?.Fuerza),
        Destreza: toNumber(raw?.Destreza),
        Constitucion: toNumber(raw?.Constitucion),
        Inteligencia: toNumber(raw?.Inteligencia),
        Sabiduria: toNumber(raw?.Sabiduria),
        Carisma: toNumber(raw?.Carisma),
        CA: toNumber(raw?.CA),
        Armadura_natural: toNumber(raw?.Armadura_natural),
        RD: toNumber(raw?.RD),
    };
}

function normalizeFlagsExtra(raw: any): EspecialFlagsExtra {
    return {
        No_aplica: toBoolean(raw?.No_aplica),
        Da_CA: toBoolean(raw?.Da_CA),
        Da_armadura_natural: toBoolean(raw?.Da_armadura_natural),
        Da_RD: toBoolean(raw?.Da_RD),
        Da_velocidad: toBoolean(raw?.Da_velocidad),
    };
}

function normalizeExtra(raw: any): EspecialExtraRef {
    return {
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
        Extra_comodin: leerComodin(raw?.Extra_comodin),
        Orden: toNumber(raw?.Orden),
    };
}

function normalizeHabilidad(raw: any): EspecialHabilidadRef {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Habilidad: toText(raw?.Habilidad),
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
        Extra_comodin: leerComodin(raw?.Extra_comodin),
        Rangos: toNumber(raw?.Rangos),
    };
}

export function normalizeEspecial(raw: any): EspecialClaseDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Oficial: raw?.Oficial === undefined ? undefined : toBoolean(raw?.Oficial),
        Extra: toBoolean(raw?.Extra),
        Repetible: toBoolean(raw?.Repetible),
        Repite_mismo_extra: toBoolean(raw?.Repite_mismo_extra ?? raw?.Repetible_mismo_extra),
        Repite_combinacion: toBoolean(raw?.Repite_combinacion ?? raw?.Repetible_combinacion),
        Activa_extra: toBoolean(raw?.Activa_extra),
        Caracteristica: normalizeRefSimple(raw?.Caracteristica),
        Bonificadores: normalizeBonificadores(raw?.Bonificadores),
        Flags_extra: normalizeFlagsExtra(raw?.Flags_extra),
        Subtipo: normalizeRefSimple(raw?.Subtipo),
        Extras: toArray(raw?.Extras).map(normalizeExtra),
        Habilidades: toArray(raw?.Habilidades).map(normalizeHabilidad),
    };
}

@Injectable({
    providedIn: "root"
})
export class EspecialService {
    private readonly especialesMutadosSubject = new Subject<EspecialClaseDetalle>();
    readonly especialesMutados$ = this.especialesMutadosSubject.asObservable();

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getEspecial(id: number): Observable<EspecialClaseDetalle> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, `Especiales/${id}`),
            desdeCache: (snapshot) => normalizeEspecial(snapshot.val()),
            pedir: () => this.http.get(`${environment.apiUrl}clases/habilidades/${id}`),
            desdeApi: (raw) => normalizeEspecial(raw),
            avisos: {
                noEncontrado: { titulo: "Especial no encontrado", texto: `No existe el especial con id ${id}` },
                error: "Error al obtener el especial",
            },
        });
    }

    getEspecialFresco(id: number): Observable<EspecialClaseDetalle> {
        return this.http.get(`${environment.apiUrl}clases/habilidades/${toInt(id)}`)
            .pipe(map((raw: any) => normalizeEspecial(raw)));
    }

    getEspeciales(): Observable<EspecialClaseDetalle[]> {
        return cacheRtdbOApi({
            escuchar: escucharRtdb(this.db, this.firebaseContextSvc, "Especiales"),
            desdeCache: (snapshot) => {
                const especiales: EspecialClaseDetalle[] = [];
                snapshot.forEach((obj: any) => {
                    especiales.push(normalizeEspecial(obj.val()));
                });
                return especiales;
            },
            pedir: () => this.http.get(`${environment.apiUrl}clases/habilidades`),
            desdeApi: (raw) => toArray(raw).map(normalizeEspecial),
        });
    }

    private syncEspeciales(): Observable<any> {
        return this.http.get(`${environment.apiUrl}clases/habilidades`);
    }

    public async crearEspecial(payload: EspecialClaseMutationRequest): Promise<EspecialClaseMutationResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const response = await firstValueFrom(
                this.http.post<EspecialClaseMutationApiResponse>(`${environment.apiUrl}clases/habilidades/add`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload, "Especial creado");
            await this.actualizarCacheLocal(normalized.especial);
            this.notificarEspecialMutado(normalized.especial);
            return normalized;
        } catch (error: any) {
            throw errorDeCatalogo(error, "crear", ESPECIAL);
        }
    }

    public async actualizarEspecial(idEspecial: number, payload: EspecialClaseMutationRequest): Promise<EspecialClaseMutationResponse> {
        try {
            const headers = await cabeceraApiConFirebase(this.auth);
            const id = toInt(idEspecial);
            const response = await firstValueFrom(
                this.http.put<EspecialClaseMutationApiResponse>(`${environment.apiUrl}clases/habilidades/${id}`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload, "Especial actualizado");
            await this.actualizarCacheLocal(normalized.especial);
            this.notificarEspecialMutado(normalized.especial);
            return normalized;
        } catch (error: any) {
            throw errorDeCatalogo(error, "actualizar", ESPECIAL);
        }
    }

    public async RenovarEspeciales(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.syncEspeciales());
            await Promise.all(
                toArray(response).map((raw: any) => {
                    const especial = normalizeEspecial(raw);
                    return this.firebaseContextSvc.run(() => set(ref(this.db, `Especiales/${especial.Id}`), especial));
                })
            );

            Swal.fire({
                icon: "success",
                title: "Listado de especiales actualizado con éxito",
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            const httpError = error as HttpErrorResponse;
            if (httpError.status === 404) {
                Swal.fire({
                    icon: "warning",
                    title: "Endpoint de especiales no disponible",
                    text: "No se encontró /clases/habilidades en la API",
                    showConfirmButton: true
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Error al actualizar el listado de especiales",
                    text: mensajeDeError(error, "Error no identificado"),
                    showConfirmButton: true
                });
            }
            return false;
        }
    }

    private normalizarMutacionResponse(
        response: EspecialClaseMutationApiResponse,
        payload: EspecialClaseMutationRequest,
        fallbackMessage: string,
    ): EspecialClaseMutationResponse {
        const idEspecial = toInt(response?.idEspecial ?? response?.id_especial ?? response?.especial?.Id);
        if (!Number.isFinite(idEspecial) || idEspecial <= 0)
            throw new Error("La API no devolvió un idEspecial válido");

        return {
            message: `${response?.message ?? fallbackMessage}`,
            idEspecial,
            especial: normalizeEspecial(response?.especial ?? {
                Id: idEspecial,
                Nombre: payload.especial.nombre,
                Descripcion: payload.especial.descripcion,
                Extra: payload.especial.extra,
                Repetible: payload.especial.repetible,
                Repite_mismo_extra: payload.especial.rep_mismo_extra,
                Repite_combinacion: payload.especial.rep_comb,
                Activa_extra: payload.especial.act_extra,
                Caracteristica: { Id: payload.especial.caracteristica, Nombre: "" },
                Bonificadores: {
                    Fuerza: payload.especial.bonificadores.fuerza,
                    Destreza: payload.especial.bonificadores.destreza,
                    Constitucion: payload.especial.bonificadores.constitucion,
                    Inteligencia: payload.especial.bonificadores.inteligencia,
                    Sabiduria: payload.especial.bonificadores.sabiduria,
                    Carisma: payload.especial.bonificadores.carisma,
                    CA: payload.especial.bonificadores.ca,
                    Armadura_natural: payload.especial.bonificadores.arm_nat,
                    RD: payload.especial.bonificadores.rd,
                },
                Flags_extra: {
                    No_aplica: payload.especial.flags_extra.no_aplica,
                    Da_CA: payload.especial.flags_extra.da_ca,
                    Da_armadura_natural: payload.especial.flags_extra.da_armadura_natural,
                    Da_RD: payload.especial.flags_extra.da_rd,
                    Da_velocidad: payload.especial.flags_extra.da_velocidad,
                },
                Subtipo: { Id: payload.especial.id_subtipo, Nombre: "" },
                Extras: [],
                Habilidades: [],
                Oficial: payload.especial.oficial,
            }),
        };
    }

    private async actualizarCacheLocal(especial: EspecialClaseDetalle): Promise<void> {
        if (!especial || Number(especial.Id) <= 0)
            return;
        await this.firebaseContextSvc.run(() => set(ref(this.db, `Especiales/${especial.Id}`), especial));
    }

    private notificarEspecialMutado(especial: EspecialClaseDetalle): void {
        if (!especial || Number(especial.Id) <= 0)
            return;
        this.especialesMutadosSubject.next(especial);
    }
}
