import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, getDatabase, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { SubdisciplinaCatalogItem } from "../interfaces/conjuro-catalogos";

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

function normalizeSubdisciplina(raw: any): SubdisciplinaCatalogItem {
    return {
        Id: toInt(raw?.Id ?? raw?.id ?? raw?.i, 0),
        Nombre: toText(raw?.Nombre ?? raw?.nombre ?? raw?.n),
        id_disciplina: toInt(raw?.id_disciplina ?? raw?.Id_disciplina ?? raw?.idDisciplina ?? raw?.d ?? raw?.id_discipina, 0),
    };
}

@Injectable({
    providedIn: 'root'
})
export class SubdisciplinaConjurosService {

    constructor(private db: Database, private http: HttpClient) { }

    getSubdisciplinas(): Observable<SubdisciplinaCatalogItem[]> {
        return new Observable((observador) => {
            const dbRefLower = ref(this.db, 'subdisciplinas');
            const dbRefUpper = ref(this.db, 'Subdisciplinas');
            let lowerSnapshot: any = null;
            let upperSnapshot: any = null;

            const emitPreferred = () => {
                const snapshot = lowerSnapshot?.exists?.() ? lowerSnapshot : upperSnapshot?.exists?.() ? upperSnapshot : null;
                if (!snapshot) {
                    observador.next([]);
                    return;
                }

                const subdisciplinas = toArray(snapshot.val())
                    .map((raw: any) => normalizeSubdisciplina(raw))
                    .filter((item) => item.Id > 0 && item.id_disciplina > 0 && item.Nombre.length > 0)
                    .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
                observador.next(subdisciplinas);
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

    private syncSubdisciplinas(): Observable<any> {
        return this.http.get(`${environment.apiUrl}subdisciplinas`);
    }

    public async RenovarSubdisciplinas(): Promise<boolean> {
        const dbInstance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncSubdisciplinas());
            const subdisciplinas = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                subdisciplinas.map((raw: any) => {
                    const item = normalizeSubdisciplina(raw);
                    if (item.Id <= 0 || item.id_disciplina <= 0 || item.Nombre.length < 1)
                        return Promise.resolve();
                    return set(ref(dbInstance, `Subdisciplinas/${item.Id}`), item);
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de subdisciplinas actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de subdisciplinas',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}
