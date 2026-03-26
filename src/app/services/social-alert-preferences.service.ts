import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppToastCategory } from '../interfaces/app-toast';
import { UserSettingsV1, createDefaultUserSettings } from '../interfaces/user-settings';
import { UserService } from './user.service';
import { UserSettingsService } from './user-settings.service';

@Injectable({
    providedIn: 'root'
})
export class SocialAlertPreferencesService {
    private initialized = false;
    private readonly defaults = createDefaultUserSettings().perfil.notificaciones;
    private readonly subscriptions = new Subscription();
    private activeLoadToken = 0;
    private snapshot: UserSettingsV1['perfil']['notificaciones'] = { ...this.defaults };

    constructor(
        private userSvc: UserService,
        private userSettingsSvc: UserSettingsService,
    ) { }

    init(): void {
        if (this.initialized)
            return;

        this.initialized = true;
        this.subscriptions.add(
            this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
                if (loggedIn === true) {
                    void this.refreshFromProfileSettings();
                    return;
                }
                this.activeLoadToken++;
                this.resetToDefaults();
            })
        );
    }

    isEnabled(category: AppToastCategory | null | undefined): boolean {
        if (!category)
            return true;
        return this.snapshot[category] !== false;
    }

    applyProfileSettings(profile: Pick<UserSettingsV1['perfil'], 'notificaciones'> | UserSettingsV1['perfil'] | null | undefined): void {
        this.snapshot = this.normalize(profile?.notificaciones);
    }

    getSnapshot(): UserSettingsV1['perfil']['notificaciones'] {
        return { ...this.snapshot };
    }

    private async refreshFromProfileSettings(): Promise<void> {
        const loadToken = ++this.activeLoadToken;
        try {
            const profileSettings = await this.userSettingsSvc.loadProfileSettings();
            if (loadToken !== this.activeLoadToken || this.userSvc.CurrentUserUid.length < 1)
                return;
            this.applyProfileSettings(profileSettings);
        } catch {
            if (loadToken !== this.activeLoadToken)
                return;
            this.resetToDefaults();
        }
    }

    private resetToDefaults(): void {
        this.snapshot = { ...this.defaults };
    }

    private normalize(raw: UserSettingsV1['perfil']['notificaciones'] | null | undefined): UserSettingsV1['perfil']['notificaciones'] {
        return {
            mensajes: raw?.mensajes !== false,
            amistad: raw?.amistad !== false,
            campanas: raw?.campanas !== false,
            cuentaSistema: raw?.cuentaSistema !== false,
        };
    }
}
