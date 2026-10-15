import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { getManualFlagMismatches } from '../config/manual-secciones.config';
import { ManualAsociadoDetalle } from '../interfaces/manual-asociado';

@Injectable({
    providedIn: 'root'
})
export class ManualFlagConsistencyNoticeService {
    private readonly warnedManualIds = new Set<number>();

    notifyAdminIfNeeded(manual: ManualAsociadoDetalle | null | undefined, isAdmin: boolean): void {
        if (!isAdmin || !manual)
            return;

        const idManual = Number(manual.Id);
        if (!Number.isFinite(idManual) || idManual <= 0)
            return;

        if (this.warnedManualIds.has(idManual))
            return;

        const mismatches = getManualFlagMismatches(manual);
        if (mismatches.length < 1)
            return;

        this.warnedManualIds.add(idManual);
        void this.mostrarAviso(manual);
    }

    private async mostrarAviso(manual: ManualAsociadoDetalle): Promise<void> {
        await Swal.fire({
            icon: 'info',
            title: 'Manual desincronizado',
            text: `El manual "${manual.Nombre}" tiene flags de contenido desajustadas respecto a sus asociados. Renueva «Manuales asociados» en la pestaña Cachés del plugin de Rol, en la administración de Yosiftware: corrige las flags y la caché.`,
            target: typeof document !== 'undefined' ? document.body : undefined,
            heightAuto: false,
            scrollbarPadding: false,
        });
    }
}
