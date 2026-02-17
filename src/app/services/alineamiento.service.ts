import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import {
    Alineamiento,
    AlineamientoBasicoCatalogItem,
    AlineamientoCombinacionCatalogItem,
    PreferenciaLeyCatalogItem,
    PreferenciaMoralCatalogItem,
    PrioridadAlineamientoCatalogItem,
} from "../interfaces/alineamiento";

@Injectable({
    providedIn: 'root'
})
export class AlineamientoService {

    constructor(private db: Database, private http: HttpClient) { }

    getAlineamiento(id: number): Observable<Alineamiento> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Alineamientos/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let alineamiento: Alineamiento = {
                    Id: id,
                    Basico: snapshot.child('Basico').val(),
                    Ley: snapshot.child('Ley').val(),
                    Moral: snapshot.child('Moral').val(),
                    Prioridad: snapshot.child('Prioridad').val(),
                    Descripcion: snapshot.child('Descripcion').val(),
                };
                observador.next(alineamiento);
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

    getAlineamientosBasicosCatalogo(): Observable<AlineamientoBasicoCatalogItem[]> {
        return this.watchArrayPath<AlineamientoBasicoCatalogItem>('AlineamientosCatalogo/Basicos');
    }

    getAlineamientosCombinacionesCatalogo(): Observable<AlineamientoCombinacionCatalogItem[]> {
        return this.watchArrayPath<AlineamientoCombinacionCatalogItem>('AlineamientosCatalogo/Combinaciones');
    }

    getAlineamientosPrioridadesCatalogo(): Observable<PrioridadAlineamientoCatalogItem[]> {
        return this.watchArrayPath<PrioridadAlineamientoCatalogItem>('AlineamientosCatalogo/Prioridades');
    }

    getAlineamientosPreferenciaLeyCatalogo(): Observable<PreferenciaLeyCatalogItem[]> {
        return this.watchArrayPath<PreferenciaLeyCatalogItem>('AlineamientosCatalogo/PreferenciaLey');
    }

    getAlineamientosPreferenciaMoralCatalogo(): Observable<PreferenciaMoralCatalogItem[]> {
        return this.watchArrayPath<PreferenciaMoralCatalogItem>('AlineamientosCatalogo/PreferenciaMoral');
    }

    private syncAlineamientos(): Observable<any> {
        return this.http.get(`${environment.apiUrl}alineamientos`);
    }

    private syncAlineamientosBasicos(): Observable<any> {
        return this.http.get(`${environment.apiUrl}alineamientos/basicos`);
    }

    private syncAlineamientosCombinaciones(): Observable<any> {
        return this.http.get(`${environment.apiUrl}alineamientos/combinaciones`);
    }

    private syncAlineamientosPrioridades(): Observable<any> {
        return this.http.get(`${environment.apiUrl}alineamientos/prioridades`);
    }

    private syncAlineamientosPreferenciaLey(): Observable<any> {
        return this.http.get(`${environment.apiUrl}alineamientos/preferencia-ley`);
    }

    private syncAlineamientosPreferenciaMoral(): Observable<any> {
        return this.http.get(`${environment.apiUrl}alineamientos/preferencia-moral`);
    }

    public async RenovarAlineamientos(): Promise<boolean> {
        const db_instance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncAlineamientos());
            const alineamientos = this.normalizeArrayResponse(response);

            await Promise.all(
                alineamientos.map((element: {
                    i: number; b: any; l: any; m: any; p: any; d: boolean;
                }) => {
                    return set(
                        ref(db_instance, `Alineamientos/${element.i}`), {
                        Id: element.i,
                        Basico: element.b,
                        Ley: element.l,
                        Moral: element.m,
                        Prioridad: element.p,
                        Descripcion: element.d
                    });
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de alineamientos actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de alineamientos',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }

    public async RenovarAlineamientosBasicos(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            getter: () => firstValueFrom(this.syncAlineamientosBasicos()),
            dbPath: 'AlineamientosCatalogo/Basicos',
            successTitle: 'Catálogo de alineamientos básicos actualizado con éxito',
            errorTitle: 'Error al actualizar el catálogo de alineamientos básicos',
        });
    }

    public async RenovarAlineamientosCombinaciones(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            getter: () => firstValueFrom(this.syncAlineamientosCombinaciones()),
            dbPath: 'AlineamientosCatalogo/Combinaciones',
            successTitle: 'Catálogo de combinaciones de alineamiento actualizado con éxito',
            errorTitle: 'Error al actualizar el catálogo de combinaciones de alineamiento',
        });
    }

    public async RenovarAlineamientosPrioridades(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            getter: () => firstValueFrom(this.syncAlineamientosPrioridades()),
            dbPath: 'AlineamientosCatalogo/Prioridades',
            successTitle: 'Catálogo de prioridades de alineamiento actualizado con éxito',
            errorTitle: 'Error al actualizar el catálogo de prioridades de alineamiento',
        });
    }

    public async RenovarAlineamientosPreferenciaLey(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            getter: () => firstValueFrom(this.syncAlineamientosPreferenciaLey()),
            dbPath: 'AlineamientosCatalogo/PreferenciaLey',
            successTitle: 'Catálogo de preferencia legal actualizado con éxito',
            errorTitle: 'Error al actualizar el catálogo de preferencia legal',
        });
    }

    public async RenovarAlineamientosPreferenciaMoral(): Promise<boolean> {
        return this.renovarCatalogoSimple({
            getter: () => firstValueFrom(this.syncAlineamientosPreferenciaMoral()),
            dbPath: 'AlineamientosCatalogo/PreferenciaMoral',
            successTitle: 'Catálogo de preferencia moral actualizado con éxito',
            errorTitle: 'Error al actualizar el catálogo de preferencia moral',
        });
    }

    private normalizeArrayResponse(response: any): any[] {
        return Array.isArray(response)
            ? response
            : Object.values(response ?? {});
    }

    private watchArrayPath<T>(path: string): Observable<T[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, path);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const items: T[] = [];
                snapshot.forEach((child: any) => {
                    items.push(child.val() as T);
                });
                observador.next(items);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);
            return () => unsubscribe();
        });
    }

    private async renovarCatalogoSimple(params: {
        getter: () => Promise<any>;
        dbPath: string;
        successTitle: string;
        errorTitle: string;
    }): Promise<boolean> {
        const db_instance = getDatabase();
        try {
            const response = await params.getter();
            const items = this.normalizeArrayResponse(response);
            await set(ref(db_instance, params.dbPath), items);
            Swal.fire({
                icon: 'success',
                title: params.successTitle,
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: params.errorTitle,
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}
