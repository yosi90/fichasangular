import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { UserPublicProfileTab } from '../interfaces/user-account';

@Injectable({
    providedIn: 'root'
})
export class UserProfileNavigationService {
    private readonly privateProfileSubject = new Subject<void>();
    private readonly publicProfileSubject = new Subject<UserPublicProfileTab>();

    readonly privateProfileOpen$: Observable<void> = this.privateProfileSubject.asObservable();
    readonly publicProfileOpen$: Observable<UserPublicProfileTab> = this.publicProfileSubject.asObservable();

    openPrivateProfile(): void {
        this.privateProfileSubject.next();
    }

    openPublicProfile(payload: UserPublicProfileTab): void {
        this.publicProfileSubject.next(payload);
    }
}
