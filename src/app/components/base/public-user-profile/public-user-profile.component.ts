import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { UserPublicProfile } from 'src/app/interfaces/user-account';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';

@Component({
    selector: 'app-public-user-profile',
    templateUrl: './public-user-profile.component.html',
    styleUrls: ['./public-user-profile.component.sass'],
    standalone: false
})
export class PublicUserProfileComponent implements OnChanges {
    @Input() uid = '';
    @Input() initialDisplayName: string | null = null;
    @Output() profileLoaded = new EventEmitter<{ uid: string; displayName: string | null; }>();

    profile: UserPublicProfile | null = null;
    loading = false;
    errorMessage = '';
    private readonly dateFormatter = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    constructor(private userProfileApiSvc: UserProfileApiService) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['uid'] && `${changes['uid'].currentValue ?? ''}`.trim().length > 0)
            void this.cargar();
    }

    get avatarUrl(): string {
        const image = `${this.profile?.photoThumbUrl ?? ''}`.trim();
        if (image.length > 0)
            return image;
        return resolveDefaultProfileAvatar(this.uid || this.initialDisplayName || this.profile?.displayName || '');
    }

    get profileLabel(): string {
        return `${this.profile?.displayName ?? this.initialDisplayName ?? ''}`.trim() || 'Perfil público';
    }

    get formattedMemberSince(): string {
        const raw = `${this.profile?.memberSince ?? ''}`.trim();
        if (raw.length < 1)
            return 'fecha desconocida';

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime()))
            return 'fecha desconocida';

        return this.dateFormatter.format(parsed);
    }

    async cargar(): Promise<void> {
        const uid = `${this.uid ?? ''}`.trim();
        if (uid.length < 1)
            return;

        this.loading = true;
        this.errorMessage = '';
        try {
            const profile = await this.userProfileApiSvc.getPublicProfile(uid);
            this.profile = profile;
            this.profileLoaded.emit({
                uid,
                displayName: `${profile?.displayName ?? ''}`.trim() || null,
            });
        } catch (error: any) {
            this.profile = null;
            this.errorMessage = `${error?.message ?? 'No se pudo cargar el perfil público.'}`.trim();
        } finally {
            this.loading = false;
        }
    }
}
