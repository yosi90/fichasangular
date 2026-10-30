import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
    SocialHubOpenRequest,
    SocialHubSectionId,
    UserPrivateProfileOpenRequest,
    UserPrivateProfileSectionId,
    UserPublicProfileTab
} from '../interfaces/user-account';
import { AyudaSolicitud, SeccionAyuda } from '../interfaces/ayuda';
import { PlatformSessionService } from './platform-session.service';

@Injectable({
    providedIn: 'root'
})
export class UserProfileNavigationService {
    private readonly privateProfileSubject = new Subject<UserPrivateProfileOpenRequest>();
    private readonly publicProfileSubject = new Subject<UserPublicProfileTab>();
    private readonly socialSubject = new Subject<SocialHubOpenRequest>();
    private readonly ayudaSubject = new Subject<AyudaSolicitud>();

    readonly privateProfileOpen$: Observable<UserPrivateProfileOpenRequest> = this.privateProfileSubject.asObservable();
    readonly publicProfileOpen$: Observable<UserPublicProfileTab> = this.publicProfileSubject.asObservable();
    readonly socialOpen$: Observable<SocialHubOpenRequest> = this.socialSubject.asObservable();
    readonly ayudaOpen$: Observable<AyudaSolicitud> = this.ayudaSubject.asObservable();

    constructor(private platformSessionSvc: PlatformSessionService) { }

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
            campaignId: Number(request?.campaignId) > 0 ? Number(request?.campaignId) : null,
            requestId: Number(request?.requestId) > 0 ? Number(request?.requestId) : Date.now(),
        });
    }

    /** La moderación de la cuenta (avisos, limitaciones y alegaciones) está en la web social de Yosiftware. */
    openAccountRestriction(): void {
        window.open(this.platformSessionSvc.urlSocial('moderacion'), '_blank', 'noopener');
    }

    /** La Ayuda, una sola pestaña, abierta en una sección (Primeros pasos, si no se dice). */
    openAyuda(seccion: SeccionAyuda = 'primeros-pasos'): void {
        this.ayudaSubject.next({ seccion, id: Date.now() });
    }

    /** Errores y propuestas: el formulario de la plataforma, sobre la web (ecosistema-kit/ACCESO.md). */
    openFeedbackBug(): void {
        void this.platformSessionSvc.reportar('error').catch(() => undefined);
    }

    openFeedbackFeature(): void {
        void this.platformSessionSvc.reportar('propuesta').catch(() => undefined);
    }

    /**
     * Los enlaces de las notificaciones de Rol en el centro de la plataforma (docs/publica/MIGRACION_PLATAFORMA_FRONT.md):
     * `?vista=campanas&campana={id}` y `?vista=cuenta`. Devuelve `true` si el enlace era de una vista de Rol.
     */
    abrirVista(parametros: URLSearchParams): boolean {
        const vista = `${parametros.get('vista') ?? ''}`.trim();
        if (vista === 'campanas') {
            const campana = Math.trunc(Number(parametros.get('campana')));
            this.openSocial({
                section: 'campanas',
                campaignId: Number.isFinite(campana) && campana > 0 ? campana : null,
                requestId: Date.now(),
            });
            return true;
        }
        if (vista === 'cuenta') {
            this.openPrivateProfile('resumen');
            return true;
        }
        return false;
    }
}
