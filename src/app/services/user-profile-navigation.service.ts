import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
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
    private readonly roadmapSubject = new Subject<void>();
    private readonly legalPrivacySubject = new Subject<void>();
    private readonly usageAboutSubject = new Subject<void>();

    readonly privateProfileOpen$: Observable<UserPrivateProfileOpenRequest> = this.privateProfileSubject.asObservable();
    readonly publicProfileOpen$: Observable<UserPublicProfileTab> = this.publicProfileSubject.asObservable();
    readonly socialOpen$: Observable<SocialHubOpenRequest> = this.socialSubject.asObservable();
    readonly adminPanelOpen$: Observable<AdminPanelOpenRequest> = this.adminPanelSubject.asObservable();
    readonly roadmapOpen$: Observable<void> = this.roadmapSubject.asObservable();
    readonly legalPrivacyOpen$: Observable<void> = this.legalPrivacySubject.asObservable();
    readonly usageAboutOpen$: Observable<void> = this.usageAboutSubject.asObservable();

    openPrivateProfile(section: UserPrivateProfileSectionId = 'resumen'): void {
        this.privateProfileSubject.next({
            section,
            requestId: Date.now(),
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
