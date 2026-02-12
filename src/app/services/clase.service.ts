import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, getDatabase, onValue, ref, set } from "@angular/fire/database";
import { Observable, map } from "rxjs";
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";
import { Alineamiento } from "../interfaces/alineamiento";
import { Clase, ClaseConjurosConfig, ClaseNivelDetalle, ClasePrerrequisitos, ClasePrerrequisitosFlags } from "../interfaces/clase";

const CLAVES_PRERREQUISITOS: (keyof ClasePrerrequisitos)[] = [
    "subtipo",
    "caracteristica",
    "dg",
    "dominio",
    "nivel_minimo_escuela",
    "ataque_base",
    "reserva_psionica_minima",
    "lanzar_conjuros_psionicos_nivel",
    "poder_psionico_conocido",
    "genero",
    "competencia_arma",
    "competencia_armadura",
    "competencia_grupo_arma",
    "competencia_grupo_armadura",
    "dote",
    "habilidad",
    "idioma",
    "alineamiento_requerido",
    "alineamiento_prohibido",
    "actitud_requerido",
    "actitud_prohibido",
    "lanzador_arcano",
    "lanzador_divino",
    "lanzar_conjuros_arcanos_nivel",
    "lanzar_conjuros_divinos_nivel",
    "conjuro_conocido",
    "inherente",
    "clase_especial",
    "tamano_maximo",
    "tamano_minimo",
    "raza",
    "no_raza",
];

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
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

function normalizeConjuros(raw: any): ClaseConjurosConfig {
    return {
        Dependientes_alineamiento: toBoolean(raw?.Dependientes_alineamiento),
        Divinos: toBoolean(raw?.Divinos),
        Arcanos: toBoolean(raw?.Arcanos),
        Psionicos: toBoolean(raw?.Psionicos),
        Alma: toBoolean(raw?.Alma),
        Conocidos_total: toBoolean(raw?.Conocidos_total),
        Conocidos_nivel_a_nivel: toBoolean(raw?.Conocidos_nivel_a_nivel),
        Dominio: toBoolean(raw?.Dominio),
        Escuela: toBoolean(raw?.Escuela),
        Lanzamiento_espontaneo: toBoolean(raw?.Lanzamiento_espontaneo),
        Clase_origen: {
            Id: toNumber(raw?.Clase_origen?.Id),
            Nombre: toText(raw?.Clase_origen?.Nombre),
        },
        Listado: toArray(raw?.Listado).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Nivel: toNumber(item?.Nivel),
            Espontaneo: toBoolean(item?.Espontaneo),
        })),
    };
}

function normalizeAlineamiento(raw: any): Alineamiento {
    return {
        Id: toNumber(raw?.Id),
        Basico: {
            Id_basico: toNumber(raw?.Basico?.Id_basico),
            Nombre: toText(raw?.Basico?.Nombre),
        },
        Ley: {
            Id_ley: toNumber(raw?.Ley?.Id_ley),
            Nombre: toText(raw?.Ley?.Nombre),
        },
        Moral: {
            Id_moral: toNumber(raw?.Moral?.Id_moral),
            Nombre: toText(raw?.Moral?.Nombre),
        },
        Prioridad: {
            Id_prioridad: toNumber(raw?.Prioridad?.Id_prioridad),
            Nombre: toText(raw?.Prioridad?.Nombre),
        },
        Descripcion: toText(raw?.Descripcion),
    };
}

function normalizeNivel(raw: any): ClaseNivelDetalle {
    const diariosRaw = raw?.Conjuros_diarios ?? {};
    const conocidosNivelRaw = raw?.Conjuros_conocidos_nivel_a_nivel ?? {};
    return {
        Nivel: toNumber(raw?.Nivel),
        Ataque_base: toText(raw?.Ataque_base),
        Salvaciones: {
            Fortaleza: toText(raw?.Salvaciones?.Fortaleza),
            Reflejos: toText(raw?.Salvaciones?.Reflejos),
            Voluntad: toText(raw?.Salvaciones?.Voluntad),
        },
        Nivel_max_conjuro: toNumber(raw?.Nivel_max_conjuro, -1),
        Reserva_psionica: toNumber(raw?.Reserva_psionica, 0),
        Aumentos_clase_lanzadora: toArray(raw?.Aumentos_clase_lanzadora).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
        })),
        Conjuros_diarios: Object.keys(diariosRaw).reduce((acc: Record<string, number>, key) => {
            acc[key] = toNumber(diariosRaw[key], -1);
            return acc;
        }, {}),
        Conjuros_conocidos_nivel_a_nivel: Object.keys(conocidosNivelRaw).reduce((acc: Record<string, number>, key) => {
            acc[key] = toNumber(conocidosNivelRaw[key], 0);
            return acc;
        }, {}),
        Conjuros_conocidos_total: toNumber(raw?.Conjuros_conocidos_total, 0),
        Dotes: toArray(raw?.Dotes).map((item: any) => ({
            Dote: item?.Dote ?? {},
            Nivel: toNumber(item?.Nivel),
            Id_extra: toNumber(item?.Id_extra, -1),
            Extra: toText(item?.Extra, "No aplica"),
            Opcional: toNumber(item?.Opcional),
            Id_interno: toNumber(item?.Id_interno),
            Id_especial_requerido: toNumber(item?.Id_especial_requerido),
            Id_dote_requerida: toNumber(item?.Id_dote_requerida),
        })),
        Especiales: toArray(raw?.Especiales).map((item: any) => ({
            Especial: item?.Especial ?? {},
            Nivel: toNumber(item?.Nivel),
            Id_extra: toNumber(item?.Id_extra, -1),
            Extra: toText(item?.Extra, "No aplica"),
            Opcional: toNumber(item?.Opcional),
            Id_interno: toNumber(item?.Id_interno),
            Id_especial_requerido: toNumber(item?.Id_especial_requerido),
            Id_dote_requerida: toNumber(item?.Id_dote_requerida),
        })),
    };
}

function normalizePrerrequisitos(raw: any): ClasePrerrequisitos {
    const base = {} as ClasePrerrequisitos;
    CLAVES_PRERREQUISITOS.forEach((key) => {
        (base[key] as any) = toArray(raw?.[key]);
    });
    return base;
}

function normalizePrerrequisitosFlags(raw: any): ClasePrerrequisitosFlags {
    if (!raw || typeof raw !== "object")
        return {};
    return Object.keys(raw).reduce((acc: ClasePrerrequisitosFlags, key: string) => {
        (acc as any)[key] = toBoolean(raw[key]);
        return acc;
    }, {});
}

export function normalizeClase(raw: any): Clase {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        Descripcion: toText(raw?.Descripcion),
        Manual: {
            Id: toNumber(raw?.Manual?.Id),
            Nombre: toText(raw?.Manual?.Nombre),
            Pagina: toNumber(raw?.Manual?.Pagina),
        },
        Tipo_dado: {
            Id: toNumber(raw?.Tipo_dado?.Id),
            Nombre: toText(raw?.Tipo_dado?.Nombre),
        },
        Puntos_habilidad: {
            Id: toNumber(raw?.Puntos_habilidad?.Id),
            Valor: toNumber(raw?.Puntos_habilidad?.Valor),
        },
        Nivel_max_claseo: toNumber(raw?.Nivel_max_claseo),
        Mod_salv_conjuros: toText(raw?.Mod_salv_conjuros),
        Conjuros: normalizeConjuros(raw?.Conjuros),
        Roles: {
            Dps: toBoolean(raw?.Roles?.Dps),
            Tanque: toBoolean(raw?.Roles?.Tanque),
            Support: toBoolean(raw?.Roles?.Support),
            Utilidad: toBoolean(raw?.Roles?.Utilidad),
        },
        Aumenta_clase_lanzadora: toBoolean(raw?.Aumenta_clase_lanzadora),
        Es_predilecta: toBoolean(raw?.Es_predilecta),
        Prestigio: toBoolean(raw?.Prestigio),
        Alineamiento: normalizeAlineamiento(raw?.Alineamiento),
        Oficial: toBoolean(raw?.Oficial),
        Competencias: {
            Armas: toArray(raw?.Competencias?.Armas),
            Armaduras: toArray(raw?.Competencias?.Armaduras),
            Grupos_arma: toArray(raw?.Competencias?.Grupos_arma),
            Grupos_armadura: toArray(raw?.Competencias?.Grupos_armadura),
        },
        Habilidades: {
            Base: toArray(raw?.Habilidades?.Base),
            Custom: toArray(raw?.Habilidades?.Custom),
        },
        Idiomas: toArray(raw?.Idiomas).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Descripcion: toText(item?.Descripcion),
            Secreto: toBoolean(item?.Secreto),
            Oficial: toBoolean(item?.Oficial),
        })),
        Desglose_niveles: toArray(raw?.Desglose_niveles).map(normalizeNivel),
        Prerrequisitos_flags: normalizePrerrequisitosFlags(raw?.Prerrequisitos_flags),
        Prerrequisitos: normalizePrerrequisitos(raw?.Prerrequisitos),
    };
}

@Injectable({
    providedIn: "root"
})
export class ClaseService {

    constructor(private db: Database, private http: HttpClient) { }

    getClase(id: number): Observable<Clase> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Clases/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                if (snapshot.exists()) {
                    observador.next(normalizeClase(snapshot.val()));
                    return;
                }

                this.http.get(`${environment.apiUrl}clases/${id}`).subscribe({
                    next: (raw: any) => observador.next(normalizeClase(raw)),
                    error: (error: HttpErrorResponse) => {
                        if (error.status === 404) {
                            Swal.fire({
                                icon: "warning",
                                title: "Clase no encontrada",
                                text: `No existe la clase con id ${id}`,
                                showConfirmButton: true,
                            });
                        } else {
                            Swal.fire({
                                icon: "warning",
                                title: "Error al obtener la clase",
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

    getClases(): Observable<Clase[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, "Clases");
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const clases: Clase[] = [];
                snapshot.forEach((obj: any) => {
                    clases.push(normalizeClase(obj.val()));
                });
                clases.sort((a, b) => a.Nombre.localeCompare(b.Nombre, "es", { sensitivity: "base" }));
                observador.next(clases);
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

    buscarPorNombre(nombre: string): Observable<Clase | null> {
        const objetivo = this.normalizar(nombre);
        return this.getClases().pipe(
            map(clases => clases.find(c => this.normalizar(c.Nombre) === objetivo) ?? null)
        );
    }

    private syncClases(): Observable<any> {
        return this.http.get(`${environment.apiUrl}clases`);
    }

    public async RenovarClases() {
        const dbInstance = getDatabase();
        this.syncClases().subscribe(
            response => {
                toArray(response).forEach((raw: any) => {
                    const clase = normalizeClase(raw);
                    set(ref(dbInstance, `Clases/${clase.Id}`), clase);
                });
                Swal.fire({
                    icon: "success",
                    title: "Listado de clases actualizado con éxito",
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            (error: any) => {
                const httpError = error as HttpErrorResponse;
                if (httpError.status === 404) {
                    Swal.fire({
                        icon: "warning",
                        title: "Endpoint de clases no disponible",
                        text: "No se encontró /clases en la API",
                        showConfirmButton: true
                    });
                } else {
                    Swal.fire({
                        icon: "warning",
                        title: "Error al actualizar el listado de clases",
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
