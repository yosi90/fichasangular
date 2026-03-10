import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { UserPrivateProfileOpenRequest, UserPrivateProfileSectionId, UserPublicProfileTab } from '../interfaces/user-account';

@Injectable({
    providedIn: 'root'
})
export class UserProfileNavigationService {
    private readonly privateProfileSubject = new Subject<UserPrivateProfileOpenRequest>();
    private readonly publicProfileSubject = new Subject<UserPublicProfileTab>();
    private readonly adminPanelSubject = new Subject<void>();
    private readonly roadmapSubject = new Subject<void>();
    private readonly legalPrivacySubject = new Subject<void>();
    private readonly usageAboutSubject = new Subject<void>();

    readonly privateProfileOpen$: Observable<UserPrivateProfileOpenRequest> = this.privateProfileSubject.asObservable();
    readonly publicProfileOpen$: Observable<UserPublicProfileTab> = this.publicProfileSubject.asObservable();
    readonly adminPanelOpen$: Observable<void> = this.adminPanelSubject.asObservable();
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

    openAdminPanel(): void {
        this.adminPanelSubject.next();
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
