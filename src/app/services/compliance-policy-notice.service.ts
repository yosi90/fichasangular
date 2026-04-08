import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SessionNotificationSwalOptions } from '../interfaces/session-notification';
import { UserPrivateProfile } from '../interfaces/user-account';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class CompliancePolicyNoticeService implements OnDestroy {
    private initialized = false;
    private isLoggedIn = false;
    private loginSub: Subscription | null = null;
    private profileSub: Subscription | null = null;
    private alertInFlight = false;
    private lastHandledRequirementKey = '';
    private reviewFlowPendingUid = '';

    constructor(
        private userSvc: UserService,
        private userProfileNavSvc: UserProfileNavigationService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.loginSub = this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
            this.isLoggedIn = loggedIn === true;
            if (!this.isLoggedIn) {
                this.alertInFlight = false;
                this.lastHandledRequirementKey = '';
                this.reviewFlowPendingUid = '';
                return;
            }
            void this.handleProfile(this.userSvc.CurrentPrivateProfile);
        });
        this.profileSub = this.userSvc.currentPrivateProfile$.subscribe((profile) => {
            void this.handleProfile(profile);
        });
    }

    ngOnDestroy(): void {
        this.loginSub?.unsubscribe();
        this.loginSub = null;
        this.profileSub?.unsubscribe();
        this.profileSub = null;
    }

    private async handleProfile(profile: UserPrivateProfile | null): Promise<void> {
        if (!this.isLoggedIn)
            return;

        const pendingUid = this.getPendingRequirementUid(profile);
        if (pendingUid.length < 1) {
            this.reviewFlowPendingUid = '';
            return;
        }
        if (this.reviewFlowPendingUid === pendingUid)
            return;

        const requirementKey = this.buildRequirementKey(profile);
        if (requirementKey.length < 1)
            return;
        if (this.alertInFlight || this.lastHandledRequirementKey === requirementKey)
            return;

        this.lastHandledRequirementKey = requirementKey;
        this.alertInFlight = true;
        try {
            const prompt = this.buildPrompt(profile);
            const result = await Swal.fire({
                icon: 'warning',
                title: prompt.title,
                text: prompt.message,
                showCancelButton: true,
                confirmButtonText: 'Revisar ahora',
                cancelButtonText: 'Más tarde',
                sessionNotification: {
                    include: true,
                    level: 'warning',
                    title: prompt.title,
                    message: prompt.message,
                    actionLabel: 'Revisar ahora',
                    action: () => {
                        this.reviewFlowPendingUid = pendingUid;
                        this.userProfileNavSvc.openPrivateProfile({
                            section: 'resumen',
                            requestId: Date.now(),
                        });
                    },
                },
            } as SessionNotificationSwalOptions);

            if (result.isConfirmed) {
                this.reviewFlowPendingUid = pendingUid;
                this.userProfileNavSvc.openPrivateProfile({
                    section: 'resumen',
                    requestId: Date.now(),
                });
            }
        } finally {
            this.alertInFlight = false;
        }
    }

    private getPendingRequirementUid(profile: UserPrivateProfile | null): string {
        const uid = `${profile?.uid ?? ''}`.trim();
        const compliance = profile?.compliance ?? null;
        if (uid.length < 1 || !compliance)
            return '';
        if (!compliance.mustAcceptUsage && !compliance.mustAcceptCreation)
            return '';
        return uid;
    }

    private buildRequirementKey(profile: UserPrivateProfile | null): string {
        const uid = `${profile?.uid ?? ''}`.trim();
        const compliance = profile?.compliance ?? null;
        if (uid.length < 1 || !compliance)
            return '';
        if (!compliance.mustAcceptUsage && !compliance.mustAcceptCreation)
            return '';

        const parts = [uid];
        if (compliance.mustAcceptUsage)
            parts.push(`usage:${`${compliance.usage?.version ?? 'pending'}`.trim() || 'pending'}`);
        if (compliance.mustAcceptCreation)
            parts.push(`creation:${`${compliance.creation?.version ?? 'pending'}`.trim() || 'pending'}`);
        return parts.join('|');
    }

    private buildPrompt(profile: UserPrivateProfile | null): { title: string; message: string; } {
        const compliance = profile?.compliance ?? null;
        const pendingUsage = compliance?.mustAcceptUsage === true;
        const pendingCreation = compliance?.mustAcceptCreation === true;
        if (pendingUsage) {
            const updated = `${compliance?.usage?.acceptedAtUtc ?? ''}`.trim().length > 0;
            return {
                title: updated
                    ? 'Los términos de uso han sido actualizados'
                    : 'Debes aceptar los términos de uso',
                message: pendingCreation
                    ? 'Para poder usar la web debes aceptar los términos de uso vigentes. Además, antes de crear o editar contenido, tendrás que aceptar también los términos de creación.'
                    : 'Para poder usar la web debes aceptar los términos de uso vigentes.',
            };
        }

        const updated = `${compliance?.creation?.acceptedAtUtc ?? ''}`.trim().length > 0;
        return {
            title: updated
                ? 'Los términos de creación han sido actualizados'
                : 'Debes aceptar los términos de creación',
            message: 'Para poder crear o editar contenido debes aceptar los términos de creación vigentes.',
        };
    }
}
