import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, map } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import {
    Plantilla,
    PlantillaCaracteristicas,
    PlantillaCompatibilidadTipo,
    PlantillaMovimientos,
    PlantillaPrerrequisitos,
    PlantillaPrerrequisitosFlags,
} from "../interfaces/plantilla";
import { toDoteContextualArray } from "./utils/dote-mapper";

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value: any): boolean {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value === 1;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        return normalized === "1" || normalized === "true";
    }
    return false;
}

function toText(value: any, fallback: string = ""): string {
    if (typeof value === "string")
        return value;
    if (value === null || value === undefined)
        return fallback;
    return `${value}`;
}

function toArray<T = any>(raw: any): T[] {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === "object")
        return Object.values(raw) as T[];
    return [];
}

function hasValidId(raw: any): boolean {
    return toNumber(raw?.Id) > 0;
}

function normalizeManual(raw: any): { Id: number; Nombre: string; Pagina: number } {
    if (typeof raw === "string") {
        return {
            Id: 0,
            Nombre: raw,
            Pagina: 0,
        };
    }

    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Pagina: toNumber(raw?.Pagina),
    };
}

function normalizeCaracteristicas(raw: any): PlantillaCaracteristicas {
    return {
        Fuerza: toNumber(raw?.Fuerza),
        Destreza: toNumber(raw?.Destreza),
        Constitucion: toNumber(raw?.Constitucion),
        Inteligencia: toNumber(raw?.Inteligencia),
        Sabiduria: toNumber(raw?.Sabiduria),
        Carisma: toNumber(raw?.Carisma),
    };
}

function normalizeMovimientos(raw: any): PlantillaMovimientos {
    return {
        Correr: toNumber(raw?.Correr),
        Nadar: toNumber(raw?.Nadar),
        Volar: toNumber(raw?.Volar),
        Trepar: toNumber(raw?.Trepar),
        Escalar: toNumber(raw?.Escalar),
    };
}

function normalizePrerrequisitosFlags(raw: any): PlantillaPrerrequisitosFlags {
    if (!raw || typeof raw !== "object")
        return {};

    return {
        actitud_requerido: toBoolean(raw?.actitud_requerido),
        actitud_prohibido: toBoolean(raw?.actitud_prohibido),
        alineamiento_requerido: toBoolean(raw?.alineamiento_requerido),
        caracteristica: toBoolean(raw?.caracteristica),
        criaturas_compatibles: toBoolean(raw?.criaturas_compatibles),
    };
}

function normalizePrerrequisitos(raw: any): PlantillaPrerrequisitos {
    return {
        actitud_requerido: toArray(raw?.actitud_requerido),
        actitud_prohibido: toArray(raw?.actitud_prohibido),
        alineamiento_requerido: toArray(raw?.alineamiento_requerido),
        caracteristica: toArray(raw?.caracteristica),
        criaturas_compatibles: toArray(raw?.criaturas_compatibles),
    };
}

function getNumberFromCandidates(raw: any, candidates: string[]): number {
    if (!raw || typeof raw !== "object")
        return 0;

    for (const key of candidates) {
        if (!(key in raw))
            continue;
        const value = raw[key as keyof typeof raw];
        if (typeof value === "object" && value !== null) {
            const nested = toNumber((value as any).Id);
            if (nested > 0)
                return nested;
        }
        const n = toNumber(value);
        if (n > 0)
            return n;
    }

    return 0;
}

function getTextFromCandidates(raw: any, candidates: string[]): string {
    if (!raw || typeof raw !== "object")
        return "";

    for (const key of candidates) {
        if (!(key in raw))
            continue;
        const value = raw[key as keyof typeof raw];
        if (typeof value === "object" && value !== null) {
            const nested = toText((value as any).Nombre);
            if (nested.trim().length > 0)
                return nested;
        }
        const text = toText(value).trim();
        if (text.length > 0)
            return text;
    }

    return "";
}

function normalizeCompatibilidades(prerrequisitosRaw: any): PlantillaCompatibilidadTipo[] {
    const source = toArray(prerrequisitosRaw?.criaturas_compatibles);

    return source.map((item: any) => {
        const idTipoComp = getNumberFromCandidates(item, [
            "Id_tipo_compatible",
            "id_tipo_compatible",
            "Id_tipo_comp",
            "id_tipo_comp",
            "Id_tipo",
            "id_tipo",
            "i",
            "id",
            "Id",
        ]);
        const idTipoNuevo = getNumberFromCandidates(item, [
            "Id_tipo_nuevo",
            "id_tipo_nuevo",
            "Id_nuevo",
            "id_nuevo",
            "Id_tipo_resultante",
            "id_tipo_resultante",
            "Id_nuevo_tipo",
            "id_nuevo_tipo",
        ]);

        return {
            Id_tipo_comp: idTipoComp,
            Id_tipo_nuevo: idTipoNuevo,
            Tipo_comp: getTextFromCandidates(item, ["Tipo_comp", "tipo_comp", "Tipo_compatible", "tipo_compatible", "Nombre_tipo_comp", "nombre_tipo_comp"]),
            Tipo_nuevo: getTextFromCandidates(item, ["Tipo_nuevo", "tipo_nuevo", "Nombre_tipo_nuevo", "nombre_tipo_nuevo"]),
            Opcional: toNumber(item?.opcional ?? item?.o),
        };
    }).filter(item => item.Id_tipo_comp > 0);
}

export function normalizePlantilla(raw: any): Plantilla {
    const prerrequisitos = normalizePrerrequisitos(raw?.Prerrequisitos);

    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: normalizeManual(raw?.Manual),
        Tamano: {
            Id: toNumber(raw?.Tamano?.Id),
            Nombre: toText(raw?.Tamano?.Nombre),
            Modificador: toNumber(raw?.Tamano?.Modificador),
            Modificador_presa: toNumber(raw?.Tamano?.Modificador_presa),
        },
        Tipo_dado: {
            Id_tipo_dado: toNumber(raw?.Tipo_dado?.Id_tipo_dado),
            Nombre: toText(raw?.Tipo_dado?.Nombre),
        },
        Actualiza_dg: toBoolean(raw?.Actualiza_dg),
        Modificacion_dg: {
            Id_paso_modificacion: toNumber(raw?.Modificacion_dg?.Id_paso_modificacion),
            Nombre: toText(raw?.Modificacion_dg?.Nombre),
        },
        Modificacion_tamano: {
            Id_paso_modificacion: toNumber(raw?.Modificacion_tamano?.Id_paso_modificacion),
            Nombre: toText(raw?.Modificacion_tamano?.Nombre),
        },
        Iniciativa: toNumber(raw?.Iniciativa),
        Velocidades: toText(raw?.Velocidades),
        Ca: toText(raw?.Ca),
        Ataque_base: toNumber(raw?.Ataque_base),
        Presa: toNumber(raw?.Presa),
        Ataques: toText(raw?.Ataques),
        Ataque_completo: toText(raw?.Ataque_completo),
        Reduccion_dano: toText(raw?.Reduccion_dano),
        Resistencia_conjuros: toText(raw?.Resistencia_conjuros),
        Resistencia_elemental: toText(raw?.Resistencia_elemental),
        Fortaleza: toNumber(raw?.Fortaleza),
        Reflejos: toNumber(raw?.Reflejos),
        Voluntad: toNumber(raw?.Voluntad),
        Modificadores_caracteristicas: normalizeCaracteristicas(raw?.Modificadores_caracteristicas),
        Minimos_caracteristicas: normalizeCaracteristicas(raw?.Minimos_caracteristicas),
        Ajuste_nivel: toNumber(raw?.Ajuste_nivel),
        Licantronia_dg: {
            Id_dado: toNumber(raw?.Licantronia_dg?.Id_dado),
            Dado: toText(raw?.Licantronia_dg?.Dado),
            Multiplicador: toNumber(raw?.Licantronia_dg?.Multiplicador),
            Suma: toNumber(raw?.Licantronia_dg?.Suma),
        },
        Cd: toNumber(raw?.Cd),
        Puntos_habilidad: {
            Suma: toNumber(raw?.Puntos_habilidad?.Suma),
            Suma_fija: toNumber(raw?.Puntos_habilidad?.Suma_fija),
        },
        Nacimiento: toBoolean(raw?.Nacimiento),
        Movimientos: normalizeMovimientos(raw?.Movimientos),
        Maniobrabilidad: {
            Id: toNumber(raw?.Maniobrabilidad?.Id),
            Nombre: toText(raw?.Maniobrabilidad?.Nombre),
            Velocidad_avance: toText(raw?.Maniobrabilidad?.Velocidad_avance),
            Flotar: toNumber(raw?.Maniobrabilidad?.Flotar),
            Volar_atras: toNumber(raw?.Maniobrabilidad?.Volar_atras),
            Contramarcha: toNumber(raw?.Maniobrabilidad?.Contramarcha),
            Giro: toText(raw?.Maniobrabilidad?.Giro),
            Rotacion: toText(raw?.Maniobrabilidad?.Rotacion),
            Giro_max: toText(raw?.Maniobrabilidad?.Giro_max),
            Angulo_ascenso: toText(raw?.Maniobrabilidad?.Angulo_ascenso),
            Velocidad_ascenso: toText(raw?.Maniobrabilidad?.Velocidad_ascenso),
            Angulo_descenso: toText(raw?.Maniobrabilidad?.Angulo_descenso),
            Descenso_ascenso: toNumber(raw?.Maniobrabilidad?.Descenso_ascenso),
        },
        Alineamiento: {
            Id: toNumber(raw?.Alineamiento?.Id),
            Basico: {
                Id_basico: toNumber(raw?.Alineamiento?.Basico?.Id_basico),
                Nombre: toText(raw?.Alineamiento?.Basico?.Nombre),
            },
            Ley: {
                Id_ley: toNumber(raw?.Alineamiento?.Ley?.Id_ley),
                Nombre: toText(raw?.Alineamiento?.Ley?.Nombre),
            },
            Moral: {
                Id_moral: toNumber(raw?.Alineamiento?.Moral?.Id_moral),
                Nombre: toText(raw?.Alineamiento?.Moral?.Nombre),
            },
            Prioridad: {
                Id_prioridad: toNumber(raw?.Alineamiento?.Prioridad?.Id_prioridad),
                Nombre: toText(raw?.Alineamiento?.Prioridad?.Nombre),
            },
            Descripcion: toText(raw?.Alineamiento?.Descripcion),
        },
        Oficial: toBoolean(raw?.Oficial),
        Dotes: toDoteContextualArray(raw?.Dotes ?? raw?.DotesContextuales),
        Habilidades: toArray(raw?.Habilidades).map((h: any) => ({
            Id_habilidad: toNumber(h?.Id_habilidad),
            Habilidad: toText(h?.Habilidad),
            Id_caracteristica: toNumber(h?.Id_caracteristica),
            Caracteristica: toText(h?.Caracteristica),
            Descripcion: toText(h?.Descripcion),
            Soporta_extra: toBoolean(h?.Soporta_extra),
            Entrenada: toBoolean(h?.Entrenada),
            Id_extra: toNumber(h?.Id_extra),
            Extra: toText(h?.Extra),
            Rangos: toNumber(h?.Rangos),
            Varios: toText(h?.Varios),
        })),
        Sortilegas: toArray(raw?.Sortilegas).map((s: any) => ({
            Conjuro: s?.Conjuro ?? {},
            Nivel_lanzador: toNumber(s?.Nivel_lanzador),
            Usos_diarios: toText(s?.Usos_diarios),
            Dg: toNumber(s?.Dg),
        })),
        Prerrequisitos_flags: normalizePrerrequisitosFlags(raw?.Prerrequisitos_flags),
        Prerrequisitos: prerrequisitos,
        Compatibilidad_tipos: normalizeCompatibilidades(raw?.Prerrequisitos),
    };
}

@Injectable({
    providedIn: "root"
})
export class PlantillaService {

    constructor(private db: Database, private http: HttpClient) { }

    getPlantilla(id: number): Observable<Plantilla> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Plantillas/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizePlantilla(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}plantillas/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizePlantilla(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Plantilla no encontrada",
                                text: `No existe la plantilla con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener la plantilla",
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

            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    getPlantillas(): Observable<Plantilla[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Plantillas");
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

            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    buscarPorNombre(nombre: string): Observable<Plantilla | null> {
        const objetivo = this.normalizar(nombre);
        return this.getPlantillas().pipe(
            map(plantillas => plantillas.find(p => this.normalizar(p.Nombre) === objetivo) ?? null)
        );
    }

    private syncPlantillas(): Observable<any> {
        return this.http.get(`${environment.apiUrl}plantillas`);
    }

    public async RenovarPlantillas() {
        const dbInstance = getDatabase();
        this.syncPlantillas().subscribe(
            response => {
                toArray(response).forEach((raw: any) => {
                    const plantilla = normalizePlantilla(raw);
                    if (!hasValidId(plantilla))
                        return;
                    set(ref(dbInstance, `Plantillas/${plantilla.Id}`), plantilla);
                });

                Swal.fire({
                    icon: "success",
                    title: "Listado de plantillas actualizado con exito",
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            (error: any) => {
                const httpError = error as HttpErrorResponse;
                if (httpError.status === 404) {
                    Swal.fire({
                        icon: "warning",
                        title: "Endpoint de plantillas no disponible",
                        text: "No se encontro /plantillas en la API",
                        showConfirmButton: true
                    });
                } else {
                    Swal.fire({
                        icon: "warning",
                        title: "Error al actualizar el listado de plantillas",
                        text: error.message,
                        showConfirmButton: true
                    });
                }
            }
        );
    }

    private normalizar(value: string): string {
        return (value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();
    }
}
