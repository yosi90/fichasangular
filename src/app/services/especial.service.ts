import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Database, Unsubscribe, onValue, ref, set } from "@angular/fire/database";
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

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function toText(value: any, fallback: string = ""): string {
    return typeof value === "string" ? value : (value ?? fallback).toString();
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object")
        return Object.values(value) as T[];
    return [];
}

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
        Orden: toNumber(raw?.Orden),
    };
}

function normalizeHabilidad(raw: any): EspecialHabilidadRef {
    return {
        Id_habilidad: toNumber(raw?.Id_habilidad),
        Habilidad: toText(raw?.Habilidad),
        Id_extra: toNumber(raw?.Id_extra),
        Extra: toText(raw?.Extra),
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
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Especiales/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeEspecial(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}clases/habilidades/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeEspecial(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Especial no encontrado",
                                text: `No existe el especial con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener el especial",
                                text: error.message,
                                showConfirmButton: true,
                            });
                        }
                        observador.error(error);
                    }
                });
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));

            return () => {
                unsubscribe();
            };
        });
    }

    getEspecialFresco(id: number): Observable<EspecialClaseDetalle> {
        return this.http.get(`${environment.apiUrl}clases/habilidades/${Math.trunc(toNumber(id))}`)
            .pipe(map((raw: any) => normalizeEspecial(raw)));
    }

    getEspeciales(): Observable<EspecialClaseDetalle[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Especiales");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    const especiales: EspecialClaseDetalle[] = [];
                    snapshot.forEach((obj: any) => {
                        especiales.push(normalizeEspecial(obj.val()));
                    });
                    observador.next(especiales);
                    return;
                }

                this.http.get(`${environment.apiUrl}clases/habilidades`).subscribe({
                    next: (raw: any) => {
                        const especiales = toArray(raw).map(normalizeEspecial);
                        observador.next(especiales);
                    },
                    error: (error: any) => observador.error(error),
                });
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => onValue(dbRef, onNext, onError));

            return () => {
                unsubscribe();
            };
        });
    }

    private syncEspeciales(): Observable<any> {
        return this.http.get(`${environment.apiUrl}clases/habilidades`);
    }

    public async crearEspecial(payload: EspecialClaseMutationRequest): Promise<EspecialClaseMutationResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(
                this.http.post<EspecialClaseMutationApiResponse>(`${environment.apiUrl}clases/habilidades/add`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload, "Especial creado");
            await this.actualizarCacheLocal(normalized.especial);
            this.notificarEspecialMutado(normalized.especial);
            return normalized;
        } catch (error: any) {
            throw this.mapEspecialError(error, "crear");
        }
    }

    public async actualizarEspecial(idEspecial: number, payload: EspecialClaseMutationRequest): Promise<EspecialClaseMutationResponse> {
        try {
            const headers = await this.buildAuthHeaders();
            const id = Math.trunc(toNumber(idEspecial));
            const response = await firstValueFrom(
                this.http.put<EspecialClaseMutationApiResponse>(`${environment.apiUrl}clases/habilidades/${id}`, payload, { headers })
            );
            const normalized = this.normalizarMutacionResponse(response, payload, "Especial actualizado");
            await this.actualizarCacheLocal(normalized.especial);
            this.notificarEspecialMutado(normalized.especial);
            return normalized;
        } catch (error: any) {
            throw this.mapEspecialError(error, "actualizar");
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
                    text: error?.message ?? "Error no identificado",
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
        const idEspecial = Math.trunc(toNumber(response?.idEspecial ?? response?.id_especial ?? response?.especial?.Id));
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

    private mapEspecialError(error: any, accion: "crear" | "actualizar"): Error {
        if (!(error instanceof HttpErrorResponse))
            return error instanceof Error ? error : new Error(`No se pudo ${accion} el especial`);

        const backendMessage = this.extractErrorMessage(error.error);
        const suffix = backendMessage.length > 0 ? ` ${backendMessage}` : "";
        if (error.status === 400)
            return new Error(`Solicitud inválida para ${accion} el especial.${suffix}`.trim());
        if (error.status === 401)
            return new Error(`Sesión no válida para ${accion} especiales.${suffix}`.trim());
        if (error.status === 403)
            return new Error(`No tienes permisos para ${accion} especiales.${suffix}`.trim());
        if (error.status === 404)
            return new Error(`No se encontró el especial o una referencia requerida.${suffix}`.trim());
        if (error.status === 409)
            return new Error(`Conflicto al ${accion} el especial.${suffix}`.trim());
        if (backendMessage.length > 0)
            return new Error(backendMessage);
        return new Error(`No se pudo ${accion} el especial (HTTP ${error.status || 0})`);
    }

    private extractErrorMessage(errorBody: any): string {
        if (!errorBody)
            return "";
        if (typeof errorBody === "string")
            return errorBody.trim();
        if (typeof errorBody === "object")
            return `${errorBody?.message ?? errorBody?.error ?? ""}`.trim();
        return "";
    }

    private async buildAuthHeaders(): Promise<{ Authorization: string; }> {
        const user = this.auth.currentUser;
        if (!user)
            throw new Error("Sesión no iniciada");
        const idToken = await user.getIdToken();
        if (`${idToken ?? ""}`.trim().length < 1)
            throw new Error("Token no disponible");
        return { Authorization: `Bearer ${idToken}` };
    }
}
