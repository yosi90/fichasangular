import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Database, onValue, ref, set } from '@angular/fire/database';
import { BehaviorSubject, Observable, Subscription, catchError, combineLatest, firstValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Clase } from '../interfaces/clase';
import { Conjuro } from '../interfaces/conjuro';
import { Dote } from '../interfaces/dote';
import { ManualAsociadoDetalle, ManualAsociados, ReferenciaCorta } from '../interfaces/manual-asociado';
import { Plantilla } from '../interfaces/plantilla';
import { Raza } from '../interfaces/raza';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { ClaseService } from './clase.service';
import { ConjuroService } from './conjuro.service';
import { DoteService } from './dote.service';
import { ManualService } from './manual.service';
import { PlantillaService } from './plantilla.service';
import { RazaService } from './raza.service';
import { TipoCriaturaService } from './tipo-criatura.service';

type ColeccionAsociadosKey = keyof ManualAsociados;

function toBoolean(value: any): boolean {
    return value === true || value === 1 || value === '1';
}

function toNumber(value: any, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toText(value: any): string {
    return typeof value === 'string' ? value : (value ?? '').toString();
}

function ordenarReferencias(items: ReferenciaCorta[]): ReferenciaCorta[] {
    return [...items].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
}

@Injectable({
    providedIn: 'root'
})
export class ManualesAsociadosService {
    private readonly asociadosUrl = `${environment.apiUrl}manuales/asociados`;
    private readonly cachePath = 'ManualesAsociados';
    private readonly fallbackNoticeSubject = new BehaviorSubject<string>('');
    readonly fallbackNotice$ = this.fallbackNoticeSubject.asObservable();

    constructor(
        private db: Database,
        private http: HttpClient,
        private manualSvc: ManualService,
        private doteSvc: DoteService,
        private conjuroSvc: ConjuroService,
        private claseSvc: ClaseService,
        private razaSvc: RazaService,
        private tipoSvc: TipoCriaturaService,
        private plantillaSvc: PlantillaService,
    ) { }

    getManualesAsociados(): Observable<ManualAsociadoDetalle[]> {
        return new Observable((observer) => {
            const dbRef = ref(this.db, this.cachePath);
            let cargandoDesdeApi = false;
            let fetchSub: Subscription | null = null;

            const unsubscribe = onValue(
                dbRef,
                (snapshot) => {
                    const cache = this.readFromSnapshot(snapshot);
                    if (cache.length > 0) {
                        this.clearFallbackNotice();
                        observer.next(cache);
                        return;
                    }

                    if (cargandoDesdeApi)
                        return;

                    cargandoDesdeApi = true;
                    fetchSub?.unsubscribe();
                    fetchSub = this.fetchFromApiWithFallback().subscribe({
                        next: ({ manuales, source }) => {
                            if (source === 'api') {
                                this.persistirCacheManualesAsociados(manuales)
                                    .then(() => this.clearFallbackNotice())
                                    .catch(() => { });
                                this.clearFallbackNotice();
                            } else {
                                this.setFallbackNotice('Aviso: no se pudo cargar /manuales/asociados. Se está usando fallback local y puede haber secciones incompletas.');
                            }
                            observer.next(manuales);
                            cargandoDesdeApi = false;
                        },
                        error: (error) => {
                            observer.error(error);
                            cargandoDesdeApi = false;
                        }
                    });
                },
                (error) => observer.error(error)
            );

            return () => {
                fetchSub?.unsubscribe();
                unsubscribe();
            };
        });
    }

    async RenovarManualesAsociados(): Promise<boolean> {
        try {
            const response = await firstValueFrom(this.http.get<any>(this.asociadosUrl));
            const manuales = this.normalizeApiResponse(response);
            await this.persistirCacheManualesAsociados(manuales);
            this.clearFallbackNotice();
            return true;
        } catch (error) {
            this.setFallbackNotice('Aviso: la última sincronización de manuales asociados falló. Se seguirá usando cache/fallback local.');
            return false;
        }
    }

    private normalizeManualAsociado(raw: any): ManualAsociadoDetalle {
        return {
            Id: toNumber(raw?.Id ?? raw?.i ?? 0),
            Nombre: toText(raw?.Nombre ?? raw?.n),
            Incluye_dotes: toBoolean(raw?.Incluye_dotes),
            Incluye_conjuros: toBoolean(raw?.Incluye_conjuros),
            Incluye_plantillas: toBoolean(raw?.Incluye_plantillas),
            Incluye_monstruos: toBoolean(raw?.Incluye_monstruos),
            Incluye_razas: toBoolean(raw?.Incluye_razas),
            Incluye_clases: toBoolean(raw?.Incluye_clases),
            Incluye_tipos: toBoolean(raw?.Incluye_tipos),
            Incluye_subtipos: toBoolean(raw?.Incluye_subtipos),
            Oficial: toBoolean(raw?.Oficial),
            Asociados: this.normalizeAsociados(raw?.Asociados),
        };
    }

    private normalizeAsociados(raw: any): ManualAsociados {
        return {
            Dotes: ordenarReferencias(this.normalizeReferencias(raw?.Dotes)),
            Conjuros: ordenarReferencias(this.normalizeReferencias(raw?.Conjuros)),
            Plantillas: ordenarReferencias(this.normalizeReferencias(raw?.Plantillas)),
            Monstruos: ordenarReferencias(this.normalizeReferencias(raw?.Monstruos)),
            Razas: ordenarReferencias(this.normalizeReferencias(raw?.Razas)),
            Clases: ordenarReferencias(this.normalizeReferencias(raw?.Clases)),
            Tipos: ordenarReferencias(this.normalizeReferencias(raw?.Tipos)),
            Subtipos: ordenarReferencias(this.normalizeReferencias(raw?.Subtipos)),
        };
    }

    private normalizeReferencias(raw: any): ReferenciaCorta[] {
        if (!Array.isArray(raw))
            return [];

        return raw.map((item: any) => {
            const referencia: ReferenciaCorta = {
                Id: toNumber(item?.Id ?? item?.i),
                Nombre: toText(item?.Nombre ?? item?.n),
                Descripcion: toText(item?.Descripcion ?? item?.d),
            };

            if (item && typeof item === 'object') {
                Object.keys(item).forEach((key) => {
                    if (key === 'Id' || key === 'i' || key === 'Nombre' || key === 'n' || key === 'Descripcion' || key === 'd')
                        return;
                    referencia[key] = item[key];
                });
            }

            return referencia;
        }).filter((item: ReferenciaCorta) => item.Id > 0 && item.Nombre.trim().length > 0);
    }

    private sortManuales(items: ManualAsociadoDetalle[]): ManualAsociadoDetalle[] {
        return [...items].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    private normalizeApiResponse(raw: any): ManualAsociadoDetalle[] {
        const entrada = Array.isArray(raw) ? raw : Object.values(raw ?? {});
        const normalizados = entrada
            .map(item => this.normalizeManualAsociado(item))
            .filter(item => item.Id > 0 && item.Nombre.trim().length > 0);
        return this.sortManuales(normalizados);
    }

    private fetchFromApiWithFallback(): Observable<{ manuales: ManualAsociadoDetalle[]; source: 'api' | 'fallback'; }> {
        return this.http.get<any>(this.asociadosUrl).pipe(
            map((raw) => ({
                manuales: this.normalizeApiResponse(raw),
                source: 'api' as const,
            })),
            catchError(() =>
                this.buildFallbackFromLocalData().pipe(
                    map((manuales) => ({
                        manuales: this.sortManuales(manuales),
                        source: 'fallback' as const,
                    }))
                )
            )
        );
    }

    private readFromSnapshot(snapshot: any): ManualAsociadoDetalle[] {
        if (!snapshot?.exists?.())
            return [];

        const manuales: ManualAsociadoDetalle[] = [];
        snapshot.forEach((child: any) => {
            const normalized = this.normalizeManualAsociado(child.val());
            if (normalized.Id > 0 && normalized.Nombre.trim().length > 0)
                manuales.push(normalized);
        });

        return this.sortManuales(manuales);
    }

    private async persistirCacheManualesAsociados(manuales: ManualAsociadoDetalle[]): Promise<void> {
        const payload: Record<string, any> = {};
        manuales.forEach((manual) => {
            if (manual.Id <= 0)
                return;
            payload[String(manual.Id)] = this.sanitizarParaFirebase(manual);
        });
        await set(ref(this.db, this.cachePath), payload);
    }

    private sanitizarParaFirebase<T>(input: T): T {
        if (Array.isArray(input))
            return input.map((item) => this.sanitizarParaFirebase(item)) as any;

        if (input && typeof input === 'object') {
            const output: any = {};
            Object.keys(input as any).forEach((key) => {
                const value = (input as any)[key];
                if (value === undefined)
                    return;
                output[key] = this.sanitizarParaFirebase(value);
            });
            return output as T;
        }

        return input;
    }

    private setFallbackNotice(message: string): void {
        this.fallbackNoticeSubject.next(message);
    }

    private clearFallbackNotice(): void {
        this.fallbackNoticeSubject.next('');
    }

    private buildFallbackFromLocalData(): Observable<ManualAsociadoDetalle[]> {
        return combineLatest([
            this.manualSvc.getManuales(),
            this.doteSvc.getDotes(),
            this.conjuroSvc.getConjuros(),
            this.claseSvc.getClases(),
            this.razaSvc.getRazas(),
            this.tipoSvc.getTiposCriatura(),
            this.plantillaSvc.getPlantillas(),
        ]).pipe(
            map(([manuales, dotes, conjuros, clases, razas, tipos, plantillas]) => {
                const base = manuales
                    .map((m) => ({
                    Id: Number(m.Id),
                    Nombre: m.Nombre,
                    Incluye_dotes: toBoolean(m.Incluye_dotes),
                    Incluye_conjuros: toBoolean(m.Incluye_conjuros),
                    Incluye_plantillas: toBoolean(m.Incluye_plantillas),
                    Incluye_monstruos: toBoolean(m.Incluye_monstruos),
                    Incluye_razas: toBoolean(m.Incluye_razas),
                    Incluye_clases: toBoolean(m.Incluye_clases),
                    Incluye_tipos: toBoolean(m.Incluye_tipos),
                    Incluye_subtipos: toBoolean(m.Incluye_subtipos),
                    Oficial: toBoolean(m.Oficial),
                    Asociados: this.emptyAsociados(),
                } as ManualAsociadoDetalle))
                    .filter((m) => m.Id > 0 && m.Nombre.trim().length > 0);

                const byId = new Map<number, ManualAsociadoDetalle>();
                const byName = new Map<string, ManualAsociadoDetalle>();
                base.forEach((manual) => {
                    byId.set(manual.Id, manual);
                    byName.set(this.normalizarTexto(manual.Nombre), manual);
                });

                const manualesPorLongitud = [...base].sort(
                    (a, b) => this.normalizarTexto(b.Nombre).length - this.normalizarTexto(a.Nombre).length
                );

                dotes.forEach((item) => {
                    const manualId = this.resolveManualIdByObject(item?.Manual, byId, byName)
                        ?? this.resolveManualIdByText(item?.Manual?.Nombre, manualesPorLongitud);
                    if (!manualId)
                        return;
                    this.pushReferencia(byId.get(manualId), 'Dotes', this.toReferencia(item.Id, item.Nombre, item.Descripcion, {
                        Pagina: item?.Manual?.Pagina ?? null,
                    }));
                });

                clases.forEach((item) => {
                    const manualId = this.resolveManualIdByObject(item?.Manual, byId, byName)
                        ?? this.resolveManualIdByText(item?.Manual?.Nombre, manualesPorLongitud);
                    if (!manualId)
                        return;
                    this.pushReferencia(byId.get(manualId), 'Clases', this.toReferencia(item.Id, item.Nombre, item.Descripcion, {
                        Pagina: item?.Manual?.Pagina ?? null,
                    }));
                });

                conjuros.forEach((item) => {
                    const manualId = this.resolveManualIdByText(item?.Manual, manualesPorLongitud);
                    if (!manualId)
                        return;
                    this.pushReferencia(byId.get(manualId), 'Conjuros', this.toReferencia(item.Id, item.Nombre, item.Descripcion));
                });

                razas.forEach((item) => {
                    const manualId = this.resolveManualIdByText(item?.Manual, manualesPorLongitud);
                    if (!manualId)
                        return;
                    this.pushReferencia(byId.get(manualId), 'Razas', this.toReferencia(item.Id, item.Nombre, ''));
                });

                tipos.forEach((item) => {
                    const manualId = this.resolveManualIdByText(item?.Manual, manualesPorLongitud);
                    if (!manualId)
                        return;
                    this.pushReferencia(byId.get(manualId), 'Tipos', this.toReferencia(item.Id, item.Nombre, item.Descripcion));
                });

                plantillas.forEach((item) => {
                    const manualId = this.resolveManualIdByObject(item?.Manual, byId, byName)
                        ?? this.resolveManualIdByText(item?.Manual?.Nombre ?? item?.Manual, manualesPorLongitud);
                    if (!manualId)
                        return;
                    this.pushReferencia(byId.get(manualId), 'Plantillas', this.toReferencia(item.Id, item.Nombre, item.Descripcion));
                });

                const resultado = this.sortManuales(base).map((manual) => ({
                    ...manual,
                    Asociados: {
                        Dotes: ordenarReferencias(manual.Asociados.Dotes),
                        Conjuros: ordenarReferencias(manual.Asociados.Conjuros),
                        Plantillas: ordenarReferencias(manual.Asociados.Plantillas),
                        Monstruos: ordenarReferencias(manual.Asociados.Monstruos),
                        Razas: ordenarReferencias(manual.Asociados.Razas),
                        Clases: ordenarReferencias(manual.Asociados.Clases),
                        Tipos: ordenarReferencias(manual.Asociados.Tipos),
                        Subtipos: ordenarReferencias(manual.Asociados.Subtipos),
                    }
                }));

                return resultado;
            })
        );
    }

    private emptyAsociados(): ManualAsociados {
        return {
            Dotes: [],
            Conjuros: [],
            Plantillas: [],
            Monstruos: [],
            Razas: [],
            Clases: [],
            Tipos: [],
            Subtipos: [],
        };
    }

    private normalizarTexto(value: string): string {
        return toText(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private resolveManualIdByObject(
        manualRef: { Id?: any, Nombre?: any } | null | undefined,
        byId: Map<number, ManualAsociadoDetalle>,
        byName: Map<string, ManualAsociadoDetalle>
    ): number | undefined {
        const id = toNumber(manualRef?.Id, 0);
        if (id > 0 && byId.has(id))
            return id;

        const nombre = this.normalizarTexto(toText(manualRef?.Nombre));
        if (nombre.length < 1)
            return undefined;

        const manual = byName.get(nombre);
        return manual?.Id;
    }

    private resolveManualIdByText(manualText: any, manualesOrdenados: ManualAsociadoDetalle[]): number | undefined {
        const texto = this.normalizarTexto(toText(manualText));
        if (texto.length < 1)
            return undefined;

        const exact = manualesOrdenados.find(manual => this.normalizarTexto(manual.Nombre) === texto);
        if (exact)
            return exact.Id;

        const included = manualesOrdenados.find(manual => texto.includes(this.normalizarTexto(manual.Nombre)));
        return included?.Id;
    }

    private toReferencia(id: any, nombre: any, descripcion: any, extra: Record<string, any> = {}): ReferenciaCorta {
        const referencia: ReferenciaCorta = {
            Id: toNumber(id),
            Nombre: toText(nombre),
            Descripcion: toText(descripcion),
        };

        Object.keys(extra).forEach((key) => {
            const value = extra[key];
            if (value === undefined || value === null || value === '')
                return;
            referencia[key] = value;
        });

        return referencia;
    }

    private pushReferencia(manual: ManualAsociadoDetalle | undefined, key: ColeccionAsociadosKey, ref: ReferenciaCorta): void {
        if (!manual)
            return;
        if (ref.Id <= 0)
            return;
        if (ref.Nombre.trim().length < 1)
            return;

        const coleccion = manual.Asociados[key];
        const yaExiste = coleccion.some((item) =>
            (ref.Id > 0 && item.Id === ref.Id) || (item.Nombre === ref.Nombre && ref.Id <= 0)
        );
        if (yaExiste)
            return;

        coleccion.push(ref);
    }
}
