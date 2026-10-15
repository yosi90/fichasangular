import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable } from "rxjs";
import Swal from "sweetalert2";
import {
    Alineamiento,
    AlineamientoBasicoCatalogItem,
    AlineamientoCombinacionCatalogItem,
    PreferenciaLeyCatalogItem,
    PreferenciaMoralCatalogItem,
    PrioridadAlineamientoCatalogItem,
} from "../interfaces/alineamiento";
import { FirebaseInjectionContextService } from "./firebase-injection-context.service";

@Injectable({
    providedIn: 'root'
})
export class AlineamientoService {

    constructor(
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService,
    ) { }

    getAlineamiento(id: number): Observable<Alineamiento> {
        return new Observable((observador) => {
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
            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, `Alineamientos/${id}`);
                return onValue(dbRef, onNext, onError);
            });

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

    private watchArrayPath<T>(path: string): Observable<T[]> {
        return new Observable((observador) => {
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const items: T[] = [];
                snapshot.forEach((child: any) => {
                    items.push(child.val() as T);
                });
                observador.next(this.sortById(items));
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = this.firebaseContextSvc.run(() => {
                const dbRef = ref(this.db, path);
                return onValue(dbRef, onNext, onError);
            });
            return () => unsubscribe();
        });
    }

    private sortById<T>(items: T[]): T[] {
        return [...items].sort((a: any, b: any) => this.toNumber(a?.Id) - this.toNumber(b?.Id));
    }

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
}
