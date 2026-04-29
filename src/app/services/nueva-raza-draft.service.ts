import { Injectable } from '@angular/core';

export interface NuevaRazaDraftSelections {
    subtiposSeleccionados: number[];
    idiomasSeleccionados: number[];
    armasCompetenciaSeleccionadas: number[];
    armadurasCompetenciaSeleccionadas: number[];
    gruposArmaSeleccionados: number[];
    gruposArmaduraSeleccionados: number[];
}

export interface NuevaRazaDraftSearches {
    manualBusqueda: string;
    clasePredilectaBusqueda: string;
    subtipoBusqueda: string;
    tipoCriaturaDgsBusqueda: string;
}

export interface NuevaRazaDraftRows {
    habilidadesBaseRows: any[];
    habilidadesCustomRows: any[];
    dotesRows: any[];
    racialesRows: any[];
    racialesPendientesRazaEnCreacionIds: number[];
    sortilegiosRows: any[];
    prerrequisitosMutacionRows: any[];
    prerrequisitosMutacionSeleccionados: string[];
}

export interface NuevaRazaDraftContenido {
    selectedIndex: number;
    formValue: Record<string, any>;
    selections: NuevaRazaDraftSelections;
    searches: NuevaRazaDraftSearches;
    relacionQueries: Record<string, string>;
    rows: NuevaRazaDraftRows;
}

export interface NuevaRazaDraftV1 extends NuevaRazaDraftContenido {
    version: 1;
    uid: string;
    updatedAt: number;
}

export interface NuevaRazaDraftResumen {
    uid: string;
    updatedAt: number;
    nombre: string;
    selectedIndex: number;
}

const NUEVA_RAZA_DRAFT_VERSION = 1;
const NUEVA_RAZA_DRAFT_STORAGE_PREFIX = 'fichas35.nuevaRaza.draft.v1.';
const NUEVA_RAZA_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable({
    providedIn: 'root',
})
export class NuevaRazaDraftService {
    puedeOfrecerRestauracionBorrador(uid: string): boolean {
        return this.leerBorradorLocal(uid) !== null;
    }

    getResumenBorradorLocal(uid: string): NuevaRazaDraftResumen | null {
        const borrador = this.leerBorradorLocal(uid);
        if (!borrador)
            return null;

        return {
            uid: borrador.uid,
            updatedAt: borrador.updatedAt,
            nombre: `${borrador.formValue?.['nombre'] ?? ''}`.trim(),
            selectedIndex: this.normalizarSelectedIndex(borrador.selectedIndex),
        };
    }

    leerBorradorLocal(uid: string): NuevaRazaDraftV1 | null {
        const uidNormalizado = this.normalizarUid(uid);
        if (uidNormalizado.length < 1)
            return null;

        const raw = this.leerStorage(this.getClaveBorradorLocal(uidNormalizado));
        if (!raw)
            return null;

        try {
            const parsed = JSON.parse(raw) as NuevaRazaDraftV1;
            if (!this.esBorradorLocalValido(parsed, uidNormalizado))
                return null;
            if (this.estaBorradorLocalCaducado(parsed)) {
                this.eliminarBorradorStorage(uidNormalizado);
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }

    guardarBorradorLocal(uid: string, contenido: NuevaRazaDraftContenido): NuevaRazaDraftV1 | null {
        const uidNormalizado = this.normalizarUid(uid);
        if (uidNormalizado.length < 1 || !contenido)
            return null;

        const borrador: NuevaRazaDraftV1 = {
            ...this.normalizarContenido(contenido),
            version: NUEVA_RAZA_DRAFT_VERSION,
            uid: uidNormalizado,
            updatedAt: Date.now(),
        };
        this.escribirStorage(this.getClaveBorradorLocal(uidNormalizado), JSON.stringify(borrador));
        return borrador;
    }

    descartarBorradorLocal(uid: string): void {
        const uidNormalizado = this.normalizarUid(uid);
        if (uidNormalizado.length < 1)
            return;
        this.eliminarBorradorStorage(uidNormalizado);
    }

    firmarContenido(contenido: NuevaRazaDraftContenido | null | undefined): string | null {
        if (!contenido)
            return null;
        return JSON.stringify(this.normalizarContenido(contenido));
    }

    firmarBorrador(borrador: NuevaRazaDraftV1 | null | undefined): string | null {
        if (!borrador)
            return null;
        return this.firmarContenido(borrador);
    }

    private normalizarContenido(contenido: NuevaRazaDraftContenido): NuevaRazaDraftContenido {
        return {
            selectedIndex: this.normalizarSelectedIndex(contenido.selectedIndex),
            formValue: this.clonarObjeto(contenido.formValue),
            selections: {
                subtiposSeleccionados: this.normalizarIds(contenido.selections?.subtiposSeleccionados).slice(0, 1),
                idiomasSeleccionados: this.normalizarIds(contenido.selections?.idiomasSeleccionados),
                armasCompetenciaSeleccionadas: this.normalizarIds(contenido.selections?.armasCompetenciaSeleccionadas),
                armadurasCompetenciaSeleccionadas: this.normalizarIds(contenido.selections?.armadurasCompetenciaSeleccionadas),
                gruposArmaSeleccionados: this.normalizarIds(contenido.selections?.gruposArmaSeleccionados),
                gruposArmaduraSeleccionados: this.normalizarIds(contenido.selections?.gruposArmaduraSeleccionados),
            },
            searches: {
                manualBusqueda: this.texto(contenido.searches?.manualBusqueda),
                clasePredilectaBusqueda: this.texto(contenido.searches?.clasePredilectaBusqueda),
                subtipoBusqueda: this.texto(contenido.searches?.subtipoBusqueda),
                tipoCriaturaDgsBusqueda: this.texto(contenido.searches?.tipoCriaturaDgsBusqueda),
            },
            relacionQueries: this.normalizarRecordTexto(contenido.relacionQueries),
            rows: {
                habilidadesBaseRows: this.clonarArray(contenido.rows?.habilidadesBaseRows),
                habilidadesCustomRows: this.clonarArray(contenido.rows?.habilidadesCustomRows),
                dotesRows: this.clonarArray(contenido.rows?.dotesRows),
                racialesRows: this.clonarArray(contenido.rows?.racialesRows),
                racialesPendientesRazaEnCreacionIds: this.normalizarIds(contenido.rows?.racialesPendientesRazaEnCreacionIds),
                sortilegiosRows: this.clonarArray(contenido.rows?.sortilegiosRows),
                prerrequisitosMutacionRows: this.clonarArray(contenido.rows?.prerrequisitosMutacionRows),
                prerrequisitosMutacionSeleccionados: this.normalizarTextos(contenido.rows?.prerrequisitosMutacionSeleccionados),
            },
        };
    }

    private esBorradorLocalValido(value: NuevaRazaDraftV1 | null | undefined, uid: string): value is NuevaRazaDraftV1 {
        if (!value || typeof value !== 'object')
            return false;
        if (Number((value as any).version) !== NUEVA_RAZA_DRAFT_VERSION)
            return false;
        if (this.normalizarUid((value as any).uid) !== this.normalizarUid(uid))
            return false;
        if (!(value as any).formValue || typeof (value as any).formValue !== 'object')
            return false;
        if (!(value as any).selections || typeof (value as any).selections !== 'object')
            return false;
        if (!(value as any).rows || typeof (value as any).rows !== 'object')
            return false;
        return true;
    }

    private estaBorradorLocalCaducado(borrador: NuevaRazaDraftV1): boolean {
        const updatedAt = Math.trunc(Number((borrador as any)?.updatedAt ?? 0));
        if (!Number.isFinite(updatedAt) || updatedAt <= 0)
            return true;
        return (Date.now() - updatedAt) > NUEVA_RAZA_DRAFT_TTL_MS;
    }

    private getClaveBorradorLocal(uid: string): string {
        return `${NUEVA_RAZA_DRAFT_STORAGE_PREFIX}${this.normalizarUid(uid)}`;
    }

    private leerStorage(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    private escribirStorage(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch {
            // localStorage puede no estar disponible.
        }
    }

    private eliminarBorradorStorage(uid: string): void {
        try {
            localStorage.removeItem(this.getClaveBorradorLocal(uid));
        } catch {
            // localStorage puede no estar disponible.
        }
    }

    private normalizarUid(uid: string | null | undefined): string {
        return `${uid ?? ''}`.trim();
    }

    private normalizarSelectedIndex(value: any): number {
        const index = Math.trunc(Number(value ?? 0));
        return Number.isFinite(index) ? Math.max(0, Math.min(4, index)) : 0;
    }

    private normalizarIds(values: any): number[] {
        return [...new Set((Array.isArray(values) ? values : [])
            .map((value) => Math.trunc(Number(value ?? 0)))
            .filter((value) => Number.isFinite(value) && value > 0))]
            .sort((a, b) => a - b);
    }

    private normalizarTextos(values: any): string[] {
        return [...new Set((Array.isArray(values) ? values : [])
            .map((value) => this.texto(value))
            .filter((value) => value.length > 0))];
    }

    private normalizarRecordTexto(value: any): Record<string, string> {
        const source = value && typeof value === 'object' ? value : {};
        return Object.keys(source).reduce((acc, key) => {
            acc[key] = this.texto(source[key]);
            return acc;
        }, {} as Record<string, string>);
    }

    private texto(value: any): string {
        return `${value ?? ''}`.trim();
    }

    private clonarArray(value: any): any[] {
        return Array.isArray(value) ? this.clonarProfundo(value) : [];
    }

    private clonarObjeto(value: any): Record<string, any> {
        return value && typeof value === 'object' ? this.clonarProfundo(value) : {};
    }

    private clonarProfundo<T>(value: T): T {
        if (typeof structuredClone === 'function')
            return structuredClone(value);
        return JSON.parse(JSON.stringify(value));
    }
}
