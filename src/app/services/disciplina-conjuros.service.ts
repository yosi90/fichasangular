import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, getDatabase, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { DisciplinaConjuros, Subdisciplinas } from "../interfaces/disciplina-conjuros";

function toArray<T = any>(value: any): T[] {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === 'object')
        return Object.values(value) as T[];
    return [];
}

function toInt(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toText(value: any): string {
    return `${value ?? ''}`.trim();
}

function normalizeSubdisciplinas(raw: any): Subdisciplinas[] {
    return toArray(raw)
        .map((item: any, index: number) => {
            if (typeof item === 'string') {
                return {
                    Id: index + 1,
                    Nombre: toText(item),
                };
            }
            return {
                Id: toInt(item?.Id ?? item?.id ?? item?.i, 0),
                Nombre: toText(item?.Nombre ?? item?.nombre ?? item?.n),
            };
        })
        .filter((item) => {
            const nombre = item.Nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
            return item.Nombre.length > 0 && nombre !== 'ninguna' && nombre !== 'sin subdisciplina';
        });
}

function normalizeDisciplina(raw: any, fallbackId: number = 0): DisciplinaConjuros {
    return {
        Id: toInt(raw?.Id ?? raw?.id ?? raw?.i, fallbackId),
        Nombre: toText(raw?.Nombre ?? raw?.nombre ?? raw?.n),
        Nombre_especial: toText(raw?.Nombre_especial ?? raw?.Nombre_esp ?? raw?.nombre_especial ?? raw?.ne),
        Subdisciplinas: normalizeSubdisciplinas(raw?.Subdisciplinas ?? raw?.subdisciplinas ?? raw?.sd),
    };
}

@Injectable({
    providedIn: 'root'
})
export class DisciplinaConjurosService {

    constructor(private db: Database, private http: HttpClient) { }

    getDisciplina(id: number): Observable<DisciplinaConjuros> {
        return new Observable((observador) => {
            const dbRefLower = ref(this.db, `disciplinas/${id}`);
            const dbRefUpper = ref(this.db, `Disciplinas/${id}`);
            let lowerSnapshot: any = null;
            let upperSnapshot: any = null;

            const emitPreferred = () => {
                const snapshot = lowerSnapshot?.exists?.() ? lowerSnapshot : upperSnapshot?.exists?.() ? upperSnapshot : null;
                if (!snapshot)
                    return;
                observador.next(normalizeDisciplina(snapshot.val(), id));
            };

            const onError = (error: any) => observador.error(error);
            const unsubscribeLower = onValue(dbRefLower, (snapshot: any) => {
                lowerSnapshot = snapshot;
                emitPreferred();
            }, onError);
            const unsubscribeUpper = onValue(dbRefUpper, (snapshot: any) => {
                upperSnapshot = snapshot;
                emitPreferred();
            }, onError);

            return () => {
                unsubscribeLower();
                unsubscribeUpper();
            };
        });
    }

    getDisciplinas(): Observable<DisciplinaConjuros[]> {
        return new Observable((observador) => {
            const dbRefLower = ref(this.db, 'disciplinas');
            const dbRefUpper = ref(this.db, 'Disciplinas');
            let lowerSnapshot: any = null;
            let upperSnapshot: any = null;

            const emitPreferred = () => {
                const snapshot = lowerSnapshot?.exists?.() ? lowerSnapshot : upperSnapshot?.exists?.() ? upperSnapshot : null;
                if (!snapshot) {
                    observador.next([]);
                    return;
                }

                const disciplinas = toArray(snapshot.val())
                    .map((raw: any) => normalizeDisciplina(raw))
                    .filter((disciplina) => disciplina.Id > 0 && disciplina.Nombre.length > 0)
                    .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                observador.next(disciplinas);
            };

            const onError = (error: any) => observador.error(error);
            const unsubscribeLower = onValue(dbRefLower, (snapshot: any) => {
                lowerSnapshot = snapshot;
                emitPreferred();
            }, onError);
            const unsubscribeUpper = onValue(dbRefUpper, (snapshot: any) => {
                upperSnapshot = snapshot;
                emitPreferred();
            }, onError);

            return () => {
                unsubscribeLower();
                unsubscribeUpper();
            };
        });
    }

    private syncConjuros(): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}disciplinas`);
        return res;
    }

    public async RenovarDisciplinas(): Promise<boolean> {
        const db_instance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncConjuros());
            const disciplinas = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                disciplinas.map((element: {
                    i: number; n: string; ne: string; sd: Subdisciplinas[];
                }) => {
                    return set(
                        ref(db_instance, `Disciplinas/${element.i}`), {
                        Id: element.i,
                        Nombre: element.n,
                        Nombre_especial: element.ne,
                        Subdisciplinas: element.sd
                    });
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de disciplinas actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de disciplinas',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}
