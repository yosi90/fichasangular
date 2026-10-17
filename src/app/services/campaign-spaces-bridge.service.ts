import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CampanaService } from './campana.service';
import { PlatformSessionService } from './platform-session.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';

/**
 * Al aceptar una invitación a una campaña en la ventana del SDK (que se abre sola con el enlace del correo o de la
 * campana, en cualquier página), Rol pone al día su copia de la pertenencia y abre la campaña.
 */
@Injectable({
    providedIn: 'root'
})
export class CampaignSpacesBridgeService implements OnDestroy {
    private subscription: Subscription | null = null;

    constructor(
        private platformSessionSvc: PlatformSessionService,
        private campanaSvc: CampanaService,
        private userProfileNavSvc: UserProfileNavigationService,
    ) { }

    init(): void {
        if (this.subscription)
            return;
        this.subscription = this.platformSessionSvc.espacioAceptado$.subscribe((espacio) => {
            const match = /^campana-(\d+)$/.exec(espacio.idExterno);
            const campaignId = match ? Number(match[1]) : null;
            void this.campanaSvc.syncMembership(campaignId).then(() => {
                this.userProfileNavSvc.openSocial({ section: 'campanas', campaignId, requestId: Date.now() });
            });
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.subscription = null;
    }
}
