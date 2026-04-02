import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
    AccountRestrictionOpenRequest,
    AccountRestrictionSectionId,
    AdminPanelOpenRequest,
    AdminPanelSectionId,
    SocialHubOpenRequest,
    SocialHubSectionId,
    UserPrivateProfileOpenRequest,
    UserPrivateProfileSectionId,
    UserPublicProfileTab
} from '../interfaces/user-account';

@Injectable({
    providedIn: 'root'
})
export class UserProfileNavigationService {
    private readonly privateProfileSubject = new Subject<UserPrivateProfileOpenRequest>();
    private readonly publicProfileSubject = new Subject<UserPublicProfileTab>();
    private readonly socialSubject = new Subject<SocialHubOpenRequest>();
    private readonly adminPanelSubject = new Subject<AdminPanelOpenRequest>();
    private readonly accountRestrictionSubject = new Subject<AccountRestrictionOpenRequest>();
    private readonly roadmapSubject = new Subject<void>();
    private readonly legalPrivacySubject = new Subject<void>();
    private readonly usageAboutSubject = new Subject<void>();

    readonly privateProfileOpen$: Observable<UserPrivateProfileOpenRequest> = this.privateProfileSubject.asObservable();
    readonly publicProfileOpen$: Observable<UserPublicProfileTab> = this.publicProfileSubject.asObservable();
    readonly socialOpen$: Observable<SocialHubOpenRequest> = this.socialSubject.asObservable();
    readonly adminPanelOpen$: Observable<AdminPanelOpenRequest> = this.adminPanelSubject.asObservable();
    readonly accountRestrictionOpen$: Observable<AccountRestrictionOpenRequest> = this.accountRestrictionSubject.asObservable();
    readonly roadmapOpen$: Observable<void> = this.roadmapSubject.asObservable();
    readonly legalPrivacyOpen$: Observable<void> = this.legalPrivacySubject.asObservable();
    readonly usageAboutOpen$: Observable<void> = this.usageAboutSubject.asObservable();

    openPrivateProfile(request?: UserPrivateProfileOpenRequest | UserPrivateProfileSectionId): void {
        if (typeof request === 'string' || !request) {
            this.privateProfileSubject.next({
                section: request ?? 'resumen',
                requestId: Date.now(),
            });
            return;
        }

        this.privateProfileSubject.next({
            section: request.section ?? 'resumen',
            requestId: Number(request.requestId) > 0 ? Number(request.requestId) : Date.now(),
            campaignId: Number(request.campaignId) > 0 ? Number(request.campaignId) : null,
        });
    }

    openPublicProfile(payload: UserPublicProfileTab): void {
        this.publicProfileSubject.next(payload);
    }

    openSocial(request?: SocialHubOpenRequest | SocialHubSectionId): void {
        if (typeof request === 'string') {
            this.socialSubject.next({
                section: request,
                requestId: Date.now(),
            });
            return;
        }

        this.socialSubject.next({
            section: request?.section ?? 'resumen',
            conversationId: Number(request?.conversationId) > 0 ? Number(request?.conversationId) : null,
            campaignId: Number(request?.campaignId) > 0 ? Number(request?.campaignId) : null,
            requestId: Number(request?.requestId) > 0 ? Number(request?.requestId) : Date.now(),
        });
    }

    openAdminPanel(request?: AdminPanelOpenRequest | AdminPanelSectionId): void {
        if (typeof request === 'string') {
            this.adminPanelSubject.next({
                section: request,
                requestId: Date.now(),
            });
            return;
        }

        this.adminPanelSubject.next({
            section: request?.section ?? 'usuarios',
            pendingOnly: request?.pendingOnly === true,
            requestId: Number(request?.requestId) > 0 ? Number(request?.requestId) : Date.now(),
        });
    }

    openAccountRestriction(request?: AccountRestrictionOpenRequest | AccountRestrictionSectionId): void {
        if (typeof request === 'string' || !request) {
            this.accountRestrictionSubject.next({
                section: request ?? 'resumen',
                requestId: Date.now(),
            });
            return;
        }

        this.accountRestrictionSubject.next({
            section: request.section ?? 'resumen',
            requestId: Number(request.requestId) > 0 ? Number(request.requestId) : Date.now(),
        });
    }

    openRoadmap(): void {
        this.roadmapSubject.next();
    }

    openLegalPrivacy(): void {
        this.legalPrivacySubject.next();
    }

    openUsageAbout(): void {
        this.usageAboutSubject.next();
    }
}
