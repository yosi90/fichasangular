import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MutacionRaza, Raza, RazaPrerrequisitos, RazaPrerrequisitosFlags } from '../interfaces/raza';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { Maniobrabilidad } from '../interfaces/maniobrabilidad';
import { Tamano } from '../interfaces/tamaño';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { AptitudSortilega } from '../interfaces/aptitud-sortilega';
import { Alineamiento } from '../interfaces/alineamiento';
import { DoteContextual } from '../interfaces/dote-contextual';
import { toDoteContextualArray } from './utils/dote-mapper';
import { normalizeRaciales } from './utils/racial-mapper';
import { normalizeSubtipoRefArray } from './utils/subtipo-mapper';

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === "1";
}

function toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === 'object')
        return Object.values(value) as T[];
    return [];
}

function normalizePrerrequisitos(raw: any): RazaPrerrequisitos {
    const source = raw ?? {};
    return {
        actitud_prohibido: toArray(source?.actitud_prohibido),
        actitud_requerido: toArray(source?.actitud_requerido),
        alineamiento_prohibido: toArray(source?.alineamiento_prohibido),
        alineamiento_requerido: toArray(source?.alineamiento_requerido),
        tipo_criatura: toArray(source?.tipo_criatura),
    };
}

function normalizePrerrequisitosFlags(raw: any, prer: RazaPrerrequisitos): RazaPrerrequisitosFlags {
    const source = raw ?? {};
    return {
        actitud_prohibido: toBoolean(source?.actitud_prohibido) || (prer?.actitud_prohibido?.length ?? 0) > 0,
        actitud_requerido: toBoolean(source?.actitud_requerido) || (prer?.actitud_requerido?.length ?? 0) > 0,
        alineamiento_prohibido: toBoolean(source?.alineamiento_prohibido) || (prer?.alineamiento_prohibido?.length ?? 0) > 0,
        alineamiento_requerido: toBoolean(source?.alineamiento_requerido) || (prer?.alineamiento_requerido?.length ?? 0) > 0,
        tipo_criatura: toBoolean(source?.tipo_criatura) || (prer?.tipo_criatura?.length ?? 0) > 0,
    };
}

function normalizeMutacion(raw: any, mutada: any, tmd: any, heredada: any, prer: RazaPrerrequisitos): MutacionRaza {
    const source = raw ?? {};
    const tienePrerrequisitos = (prer?.actitud_prohibido?.length ?? 0) > 0
        || (prer?.actitud_requerido?.length ?? 0) > 0
        || (prer?.alineamiento_prohibido?.length ?? 0) > 0
        || (prer?.alineamiento_requerido?.length ?? 0) > 0
        || (prer?.tipo_criatura?.length ?? 0) > 0;
    return {
        Es_mutada: toBoolean(source?.Es_mutada) || toBoolean(mutada),
        Tamano_dependiente: toBoolean(source?.Tamano_dependiente) || toBoolean(tmd),
        Tiene_prerrequisitos: toBoolean(source?.Tiene_prerrequisitos) || tienePrerrequisitos,
        Heredada: toBoolean(source?.Heredada) || toBoolean(heredada),
    };
}

function normalizeModificadores(raw: any): Raza['Modificadores'] {
    return {
        Fuerza: toNumber(raw?.Fuerza),
        Destreza: toNumber(raw?.Destreza),
        Constitucion: toNumber(raw?.Constitucion),
        Inteligencia: toNumber(raw?.Inteligencia),
        Sabiduria: toNumber(raw?.Sabiduria),
        Carisma: toNumber(raw?.Carisma),
    };
}

function normalizeDgsAdicionales(raw: any): Raza['Dgs_adicionales'] {
    return {
        Cantidad: toNumber(raw?.Cantidad),
        Dado: `${raw?.Dado ?? ''}`,
        Tipo_criatura: `${raw?.Tipo_criatura ?? ''}`,
        Ataque_base: toNumber(raw?.Ataque_base),
        Dotes_extra: toNumber(raw?.Dotes_extra),
        Puntos_habilidad: toNumber(raw?.Puntos_habilidad),
        Multiplicador_puntos_habilidad: toNumber(raw?.Multiplicador_puntos_habilidad),
        Fortaleza: toNumber(raw?.Fortaleza),
        Reflejos: toNumber(raw?.Reflejos),
        Voluntad: toNumber(raw?.Voluntad),
    };
}

function mapRazaDesdeRaw(raw: any, id: any, dotesContextuales: DoteContextual[], subtipos: any[], raciales: any[]): Raza {
    const prerrequisitos = normalizePrerrequisitos(raw?.Prerrequisitos ?? raw?.pr ?? raw?.PR);
    const prerrequisitosFlags = normalizePrerrequisitosFlags(
        raw?.Prerrequisitos_flags ?? raw?.prf ?? raw?.PrerrequisitosFlags,
        prerrequisitos
    );

    const mutadaRaw = raw?.Mutada ?? raw?.mu;
    const tmdRaw = raw?.Tamano_mutacion_dependiente ?? raw?.Tamano_mutacion_pendiente ?? raw?.tmd;
    const heredadaRaw = raw?.Heredada ?? raw?.he;
    const mutacion = normalizeMutacion(raw?.Mutacion, mutadaRaw, tmdRaw, heredadaRaw, prerrequisitos);

    return {
        Id: toNumber(id),
        Nombre: `${raw?.Nombre ?? raw?.n ?? ''}`,
        Modificadores: normalizeModificadores(raw?.Modificadores ?? raw?.m),
        Alineamiento: raw?.Alineamiento ?? raw?.ali ?? ({} as any),
        Manual: `${raw?.Manual ?? raw?.ma ?? ''}`,
        Ajuste_nivel: toNumber(raw?.Ajuste_nivel ?? raw?.aju),
        Clase_predilecta: `${raw?.Clase_predilecta ?? raw?.c ?? ''}`,
        Oficial: toBoolean(raw?.Oficial ?? raw?.o),
        Ataques_naturales: `${raw?.Ataques_naturales ?? raw?.an ?? ''}`,
        Tamano: raw?.Tamano ?? raw?.t ?? ({} as any),
        Dgs_adicionales: normalizeDgsAdicionales(raw?.Dgs_adicionales ?? raw?.dg),
        Reduccion_dano: `${raw?.Reduccion_dano ?? raw?.rd ?? ''}`,
        Resistencia_magica: `${raw?.Resistencia_magica ?? raw?.Resistencia_magia ?? raw?.rc ?? ''}`,
        Resistencia_energia: `${raw?.Resistencia_energia ?? raw?.re ?? ''}`,
        Heredada: toBoolean(heredadaRaw),
        Mutada: mutacion.Es_mutada === true,
        Tamano_mutacion_dependiente: mutacion.Tamano_dependiente === true,
        Prerrequisitos: prerrequisitos,
        Prerrequisitos_flags: prerrequisitosFlags,
        Mutacion: mutacion,
        Armadura_natural: toNumber(raw?.Armadura_natural ?? raw?.ant),
        Varios_armadura: toNumber(raw?.Varios_armadura ?? raw?.va),
        Correr: toNumber(raw?.Correr ?? raw?.co),
        Nadar: toNumber(raw?.Nadar ?? raw?.na),
        Volar: toNumber(raw?.Volar ?? raw?.vo),
        Maniobrabilidad: raw?.Maniobrabilidad ?? raw?.man ?? ({} as any),
        Trepar: toNumber(raw?.Trepar ?? raw?.tr),
        Escalar: toNumber(raw?.Escalar ?? raw?.es),
        Altura_rango_inf: toNumber(raw?.Altura_rango_inf ?? raw?.ari),
        Altura_rango_sup: toNumber(raw?.Altura_rango_sup ?? raw?.ars),
        Peso_rango_inf: toNumber(raw?.Peso_rango_inf ?? raw?.pri),
        Peso_rango_sup: toNumber(raw?.Peso_rango_sup ?? raw?.prs),
        Edad_adulto: toNumber(raw?.Edad_adulto ?? raw?.ea),
        Edad_mediana: toNumber(raw?.Edad_mediana ?? raw?.em),
        Edad_viejo: toNumber(raw?.Edad_viejo ?? raw?.ev),
        Edad_venerable: toNumber(raw?.Edad_venerable ?? raw?.eve),
        Espacio: toNumber(raw?.Espacio ?? raw?.esp),
        Alcance: toNumber(raw?.Alcance ?? raw?.alc),
        Tipo_criatura: raw?.Tipo_criatura ?? raw?.tc ?? ({} as any),
        Subtipos: subtipos,
        Sortilegas: toArray(raw?.Sortilegas ?? raw?.sor),
        Raciales: normalizeRaciales(raciales),
        DotesContextuales: dotesContextuales,
    };
}

@Injectable({
    providedIn: 'root'
})
export class RazaService {

    constructor(private db: Database, private http: HttpClient) { }

    async getRaza(id: number): Promise<Observable<Raza>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Razas/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const dotesContextuales = toDoteContextualArray(snapshot.child('DotesContextuales').val());
                const subtipos = normalizeSubtipoRefArray(snapshot.child('Subtipos').val() ?? snapshot.child('subtipos').val());
                const raza: Raza = mapRazaDesdeRaw(
                    snapshot.val() ?? {},
                    id,
                    dotesContextuales,
                    subtipos,
                    snapshot.child('Raciales').val()
                );
                observador.next(raza); // Emitir el array de personajes
            };

            const onError = (error: any) => {
                observador.error(error); // Manejar el error
            };

            // const onComplete = () => {
            //     observador.complete();  Completar el observable
            // };

            // unsubscribe = onValue(dbRef, onNext, onError, onComplete);
            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe(); // Cancelar la suscripción al evento onValue
            };
        });
    }

    getRazas(): Observable<Raza[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Razas');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Razas: Raza[] = [];
                snapshot.forEach((obj: any) => {
                    const dotesContextuales = toDoteContextualArray(obj.child('DotesContextuales').val());
                    const subtipos = normalizeSubtipoRefArray(obj.child('Subtipos').val() ?? obj.child('subtipos').val());
                    const raza: Raza = mapRazaDesdeRaw(
                        obj.val() ?? {},
                        obj.key,
                        dotesContextuales,
                        subtipos,
                        obj.child('Raciales').val()
                    );
                    Razas.push(raza);
                });
                observador.next(Razas); // Emitir el array de personajes
            };

            const onError = (error: any) => {
                observador.error(error); // Manejar el error
            };

            // const onComplete = () => {
            //     observador.complete();  Completar el observable
            // };

            // unsubscribe = onValue(dbRef, onNext, onError, onComplete);
            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe(); // Cancelar la suscripción al evento onValue
            };
        });
    }

    private syncRazas(): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const res = this.http.get(`${environment.apiUrl}razas`);
        return res;
    }

    public async RenovarRazas(): Promise<boolean> {
        const db = getDatabase();
        try {
            const response = await firstValueFrom(this.syncRazas());
            const razas = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                razas.map((element: {
                    i: any; n: any; m: { Fuerza: number; Destreza: number; Constitucion: number; Inteligencia: number; Sabiduria: number; Carisma: number; }; ma: any;
                    aju: any; c: any; o: boolean; an: string; t: Tamano; dg: any; rd: string; rc: string; re: string; he: boolean; mu: boolean; tmd: boolean; pr: any;
                    ant: number; va: number; co: number; na: number; vo: number; man: Maniobrabilidad; tr: number; es: number; ari: number; ars: number; pri: number; 
                    prs: number; ea: number; em: number; ev: number; eve: number; esp: number; alc: number; tc: TipoCriatura; sor: AptitudSortilega[],
                    ali: Alineamiento; dotes: DoteContextual[]; subtipos?: any; prf?: any; Prerrequisitos_flags?: any; Mutacion?: any;
                    rac: any;
                }) => {
                    const dotesContextuales = toDoteContextualArray(element.dotes);
                    const raciales = normalizeRaciales(element.rac);
                    const subtipos = normalizeSubtipoRefArray(element.subtipos ?? "");
                    const prerrequisitos = normalizePrerrequisitos(element.pr);
                    const prerrequisitosFlags = normalizePrerrequisitosFlags(
                        element.prf ?? element.Prerrequisitos_flags,
                        prerrequisitos
                    );
                    const mutacion = normalizeMutacion(
                        element.Mutacion,
                        element.mu,
                        element.tmd,
                        element.he,
                        prerrequisitos
                    );
                    return set(
                        ref(db, `Razas/${element.i}`), {
                        Nombre: element.n,
                        Modificadores: element.m,
                        Alineamiento: element.ali,
                        Manual: element.ma,
                        Ajuste_nivel: element.aju,
                        Clase_predilecta: element.c,
                        Oficial: toBoolean(element.o),
                        Ataques_naturales: element.an,
                        Tamano: element.t,
                        Dgs_adicionales: element.dg,
                        Reduccion_dano: element.rd,
                        Resistencia_magica: element.rc,
                        Resistencia_magia: element.rc,
                        Resistencia_energia: element.re,
                        Heredada: element.he,
                        Mutada: mutacion.Es_mutada,
                        Tamano_mutacion_dependiente: mutacion.Tamano_dependiente,
                        Prerrequisitos: prerrequisitos,
                        Prerrequisitos_flags: prerrequisitosFlags,
                        Mutacion: mutacion,
                        Armadura_natural: element.ant,
                        Varios_armadura: element.va,
                        Correr: element.co,
                        Nadar: element.na,
                        Volar: element.vo,
                        Maniobrabilidad: element.man,
                        Trepar: element.tr,
                        Escalar: element.es,
                        Altura_rango_inf: element.ari,
                        Altura_rango_sup: element.ars,
                        Peso_rango_inf: element.pri,
                        Peso_rango_sup: element.prs,
                        Edad_adulto: element.ea,
                        Edad_mediana: element.em,
                        Edad_viejo: element.ev,
                        Edad_venerable: element.eve,
                        Espacio: element.esp,
                        Alcance: element.alc,
                        Tipo_criatura: element.tc,
                        Subtipos: subtipos,
                        Sortilegas: element.sor,
                        Raciales: raciales,
                        DotesContextuales: dotesContextuales,
                    });
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de razas actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de razas',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}
