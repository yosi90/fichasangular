import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { getManualFlagMismatches } from '../config/manual-secciones.config';
import { ManualAsociadoDetalle } from '../interfaces/manual-asociado';
import { SessionNotificationSwalOptions } from '../interfaces/session-notification';
import { CacheSyncMetadataService } from './cache-sync-metadata.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';

@Injectable({
    providedIn: 'root'
})
export class ManualFlagConsistencyNoticeService {
    private readonly warnedManualIds = new Set<number>();

    constructor(
        private userProfileNavSvc: UserProfileNavigationService,
        private cacheSyncMetadataSvc: CacheSyncMetadataService,
    ) { }

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
        void this.cacheSyncMetadataSvc.markStale('manuales_asociados', 'manual_flag_mismatch');
        void this.mostrarAviso(manual);
    }

    private async mostrarAviso(manual: ManualAsociadoDetalle): Promise<void> {
        const result = await Swal.fire({
            icon: 'info',
            title: 'Manual desincronizado',
            text: `El manual "${manual.Nombre}" tiene flags de contenido desajustadas respecto a sus asociados. Recarga la caché desde Admin panel > Manuales asociados.`,
            target: typeof document !== 'undefined' ? document.body : undefined,
            heightAuto: false,
            scrollbarPadding: false,
            showCancelButton: true,
            confirmButtonText: 'Ir al admin panel',
            cancelButtonText: 'Luego',
            sessionNotification: {
                include: true,
                level: 'info',
                title: 'Manual desincronizado',
                message: `El manual "${manual.Nombre}" tiene flags de contenido desajustadas respecto a sus asociados. Recarga la caché desde Admin panel > Manuales asociados.`,
                actionLabel: 'Ir al admin panel',
                action: () => this.userProfileNavSvc.openAdminPanel(),
            },
        } as SessionNotificationSwalOptions);

        if (result.isConfirmed)
            this.userProfileNavSvc.openAdminPanel();
    }
}
