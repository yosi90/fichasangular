import { Injectable } from '@angular/core';
import { take } from 'rxjs';
import Swal from 'sweetalert2';
import { ManualAsociadoDetalle } from '../interfaces/manual-asociado';
import { ManualesAsociadosService } from './manuales-asociados.service';
import { ManualVistaNavigationService } from './manual-vista-navigation.service';

export interface ManualDetalleReferencia {
    id?: number | null;
    nombre?: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class ManualDetalleNavigationService {
    constructor(
        private manualesAsociadosSvc: ManualesAsociadosService,
        private manualVistaNavSvc: ManualVistaNavigationService,
    ) { }

    abrirDetalleManual(referencia: string | ManualDetalleReferencia | null | undefined): void {
        const ref = this.normalizarReferencia(referencia);
        if (!this.tieneReferenciaValida(ref))
            return;

        this.manualesAsociadosSvc.getManualesAsociados().pipe(take(1)).subscribe({
            next: (manuales) => {
                const manual = this.resolverManual(manuales ?? [], ref);
                if (manual) {
                    this.manualVistaNavSvc.emitirApertura(manual);
                    return;
                }

                this.mostrarAvisoNoEncontrado(ref);
            },
            error: () => this.mostrarAvisoNoEncontrado(ref),
        });
    }

    private normalizarReferencia(referencia: string | ManualDetalleReferencia | null | undefined): ManualDetalleReferencia {
        if (typeof referencia === 'string')
            return { nombre: referencia };

        if (!referencia || typeof referencia !== 'object')
            return {};

        return {
            id: this.toPositiveNumber(referencia.id),
            nombre: `${referencia.nombre ?? ''}`.trim(),
        };
    }

    private tieneReferenciaValida(ref: ManualDetalleReferencia): boolean {
        const id = this.toPositiveNumber(ref.id);
        if (id > 0)
            return true;

        return this.esNombreNavegable(ref.nombre);
    }

    private resolverManual(manuales: ManualAsociadoDetalle[], ref: ManualDetalleReferencia): ManualAsociadoDetalle | null {
        const id = this.toPositiveNumber(ref.id);
        if (id > 0) {
            const porId = manuales.find((manual) => Number(manual?.Id) === id);
            if (porId)
                return porId;
        }

        const nombre = `${ref.nombre ?? ''}`.trim();
        if (!this.esNombreNavegable(nombre))
            return null;

        const nombreNormalizado = this.normalizarTexto(nombre);
        const porNombreExacto = manuales.find((manual) => this.normalizarTexto(manual?.Nombre) === nombreNormalizado);
        if (porNombreExacto)
            return porNombreExacto;

        const manualesOrdenados = [...manuales].sort(
            (a, b) => this.normalizarTexto(b?.Nombre).length - this.normalizarTexto(a?.Nombre).length
        );

        const porInclusion = manualesOrdenados.find((manual) => {
            const manualNombre = this.normalizarTexto(manual?.Nombre);
            return manualNombre.length > 0 && nombreNormalizado.includes(manualNombre);
        });

        return porInclusion ?? null;
    }

    private mostrarAvisoNoEncontrado(ref: ManualDetalleReferencia): void {
        const nombre = `${ref.nombre ?? ''}`.trim();
        const id = this.toPositiveNumber(ref.id);

        let texto = 'No se pudo resolver el manual solicitado.';
        if (this.esNombreNavegable(nombre))
            texto = `No se encontró el manual "${nombre}" en el catálogo local.`;
        else if (id > 0)
            texto = `No se encontró el manual con id ${id} en el catálogo local.`;

        Swal.fire({
            icon: 'warning',
            title: 'Manual no encontrado',
            text: texto,
            showConfirmButton: true,
        });
    }

    private esNombreNavegable(value: string | null | undefined): boolean {
        const normalizado = this.normalizarTexto(value);
        if (normalizado.length < 1)
            return false;

        return normalizado !== 'no aplica'
            && normalizado !== 'sin manual'
            && normalizado !== 'manual no especificado'
            && normalizado !== 'ninguno'
            && normalizado !== '-';
    }

    private toPositiveNumber(value: unknown): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    private normalizarTexto(value: string | null | undefined): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
