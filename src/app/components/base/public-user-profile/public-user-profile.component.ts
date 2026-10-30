import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Subject, distinctUntilChanged, skip, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { SocialRelationshipProfile } from 'src/app/interfaces/social-v3';
import { AppToastService } from 'src/app/services/app-toast.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { PlatformSocialError, PlatformSocialService, RelacionPlataforma } from 'src/app/services/platform-social.service';
import { SocialV3ApiService } from 'src/app/services/social-v3-api.service';
import { UserService } from 'src/app/services/user.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';
import { textoFecha } from 'src/app/services/utils/fecha-texto';

/**
 * Ficha de otra persona en la comunidad de Rol: sus datos de Rol vienen de la API
 * (`GET /social/users/{uid}/relationship-profile`) y la biografía, los pronombres y la relación (amistad,
 * seguimiento y bloqueo), de la plataforma (ecosistema-kit/SOCIAL.md). Hace falta sesión.
 */
@Component({
    selector: 'app-public-user-profile',
    templateUrl: './public-user-profile.component.html',
    styleUrls: ['./public-user-profile.component.sass'],
    standalone: false
})
export class PublicUserProfileComponent implements OnInit, OnChanges, OnDestroy {
    @Input() uid = '';
    @Input() initialDisplayName: string | null = null;
    @Output() profileLoaded = new EventEmitter<{ uid: string; displayName: string | null; }>();

    isLoggedIn = false;
    relationshipProfile: SocialRelationshipProfile | null = null;
    relacion: RelacionPlataforma | null = null;
    bio = '';
    pronouns = '';
    loading = false;
    actionInFlight = false;
    errorMessage = '';
    private loadSeq = 0;
    private readonly destroy$ = new Subject<void>();
    constructor(
        private socialV3ApiSvc: SocialV3ApiService,
        private platformSocialSvc: PlatformSocialService,
        private platformSessionSvc: PlatformSessionService,
        private userSvc: UserService,
        private appToastSvc: AppToastService,
    ) { }

    ngOnInit(): void {
        this.isLoggedIn = this.userSvc.IsLoggedIn;
        this.userSvc.isLoggedIn$
            .pipe(distinctUntilChanged(), skip(1), takeUntil(this.destroy$))
            .subscribe((logueado) => {
                this.isLoggedIn = logueado === true;
                void this.cargar();
            });
        void this.cargar();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['uid'] && !changes['uid'].firstChange)
            void this.cargar();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get avatarUrl(): string {
        const image = `${this.relationshipProfile?.profile?.photoThumbUrl ?? ''}`.trim();
        if (image.length > 0)
            return image;
        return resolveDefaultProfileAvatar(this.uid || this.initialDisplayName || this.profileLabel || '');
    }

    get profileLabel(): string {
        return `${this.relationshipProfile?.profile?.displayName ?? this.initialDisplayName ?? ''}`.trim() || 'Perfil';
    }

    get isSelf(): boolean {
        return this.relationshipProfile?.relationship?.state === 'self';
    }

    /** Has bloqueado a esta persona: la API ya no la enseña, pero se puede desbloquear desde aquí. */
    get isBlockedByMe(): boolean {
        return this.relacion?.bloqueada === true;
    }

    get statsItems(): { value: number; label: string; }[] {
        const stats = this.relationshipProfile?.stats as any;
        if (!stats)
            return [];

        return [
            { value: this.toNumber(stats.totalPersonajes ?? stats.totalCharacters), label: 'Personajes totales' },
            { value: this.toNumber(stats.publicos ?? stats.publicCharacters), label: 'Personajes públicos' },
            { value: this.toNumber(stats.campanasActivas ?? stats.activeCampaigns), label: 'Campañas activas' },
            { value: this.toNumber(stats.campanasMaster ?? stats.campaignsAsMaster), label: 'Como master' },
            { value: this.toNumber(stats.campanasCreadas ?? stats.campaignsCreated), label: 'Campañas creadas' },
        ];
    }

    get sharedItems(): { value: number; label: string; }[] {
        const relationship = this.relationshipProfile?.relationship;
        if (!relationship || this.isSelf)
            return [];
        return [
            { value: this.toNumber(relationship.mutualFriendsCount), label: 'Amistades en común' },
            { value: this.toNumber(relationship.mutualCampaignsCount), label: 'Campañas en común' },
        ];
    }

    get formattedMemberSince(): string {
        return textoFecha(this.relationshipProfile?.profile?.joinedAtUtc, '');
    }

    get relationshipLabel(): string {
        if (this.isSelf)
            return 'Este perfil es el tuyo.';
        const relacion = this.relacion;
        if (!relacion)
            return '';
        const partes: string[] = [];
        if (relacion.amistad === 'amistades')
            partes.push('Sois amistades.');
        else if (relacion.amistad === 'solicitud_enviada')
            partes.push('Le has pedido amistad.');
        else if (relacion.amistad === 'solicitud_recibida')
            partes.push('Te ha pedido amistad.');
        if (relacion.sigo)
            partes.push('La sigues.');
        if (relacion.meSigue)
            partes.push('Te sigue.');
        return partes.join(' ');
    }

    get urlWebSocial(): string {
        return this.platformSessionSvc.urlSocial();
    }

    entrar(): void {
        void this.platformSessionSvc.entrar().catch(() => undefined);
    }

    async cargar(): Promise<void> {
        const uid = `${this.uid ?? ''}`.trim();
        const seq = ++this.loadSeq;
        this.relationshipProfile = null;
        this.relacion = null;
        this.bio = '';
        this.pronouns = '';
        this.errorMessage = '';
        if (uid.length < 1 || !this.isLoggedIn) {
            this.loading = false;
            return;
        }

        this.loading = true;
        try {
            const [perfilRol, relacion, perfilPlataforma] = await Promise.allSettled([
                this.socialV3ApiSvc.getRelationshipProfile(uid),
                this.platformSocialSvc.relacion(uid),
                this.platformSocialSvc.perfil(uid),
            ]);
            if (seq !== this.loadSeq)
                return;

            if (relacion.status === 'fulfilled')
                this.relacion = relacion.value;
            if (perfilPlataforma.status === 'fulfilled') {
                this.bio = `${perfilPlataforma.value?.biografia ?? ''}`.trim();
                this.pronouns = `${perfilPlataforma.value?.pronombres ?? ''}`.trim();
            }
            if (perfilRol.status === 'fulfilled') {
                this.relationshipProfile = perfilRol.value;
                this.profileLoaded.emit({ uid, displayName: this.profileLabel || null });
            } else if (!this.isBlockedByMe) {
                this.errorMessage = `${perfilRol.reason?.message ?? 'No se pudo cargar el perfil.'}`.trim();
            }
        } finally {
            if (seq === this.loadSeq)
                this.loading = false;
        }
    }

    pedirAmistad(): Promise<void> {
        return this.ejecutar('Solicitud de amistad enviada.', () => this.platformSocialSvc.pedirAmistad(this.uid));
    }

    aceptarSolicitud(): Promise<void> {
        return this.responderSolicitud('aceptar', 'Ahora sois amistades.');
    }

    rechazarSolicitud(): Promise<void> {
        return this.responderSolicitud('rechazar', 'Solicitud rechazada.');
    }

    retirarSolicitud(): Promise<void> {
        const idSolicitud = this.relacion?.idSolicitud;
        if (!idSolicitud)
            return Promise.resolve();
        return this.ejecutar('Solicitud retirada.', () => this.platformSocialSvc.retirarSolicitud(idSolicitud));
    }

    async dejarAmistad(): Promise<void> {
        if (!await this.confirmar(`¿Dejar de ser amistades de ${this.profileLabel}?`, 'Dejar la amistad'))
            return;
        await this.ejecutar('Ya no sois amistades.', () => this.platformSocialSvc.dejarAmistad(this.uid));
    }

    alternarSeguir(): Promise<void> {
        const seguir = this.relacion?.sigo !== true;
        return this.ejecutar(seguir ? 'Ahora la sigues.' : 'Has dejado de seguirla.', () => this.platformSocialSvc.seguir(this.uid, seguir));
    }

    async bloquear(): Promise<void> {
        const texto = `${this.profileLabel} dejará de verte en todas las webs de Yosiftware y se terminarán la amistad, las solicitudes y los seguimientos entre vosotros.`;
        if (!await this.confirmar(texto, 'Bloquear'))
            return;
        await this.ejecutar('Persona bloqueada.', () => this.platformSocialSvc.bloquear(this.uid, true));
    }

    desbloquear(): Promise<void> {
        return this.ejecutar('Persona desbloqueada.', () => this.platformSocialSvc.bloquear(this.uid, false));
    }

    async denunciar(): Promise<void> {
        try {
            await this.platformSessionSvc.denunciar({ tipo: 'persona', referencia: this.uid, nombre: this.profileLabel });
        } catch {
            this.appToastSvc.showError('No se pudo abrir la denuncia ahora mismo.');
        }
    }

    private responderSolicitud(respuesta: 'aceptar' | 'rechazar', mensaje: string): Promise<void> {
        const idSolicitud = this.relacion?.idSolicitud;
        if (!idSolicitud)
            return Promise.resolve();
        return this.ejecutar(mensaje, () => this.platformSocialSvc.responderSolicitud(idSolicitud, respuesta));
    }

    private async ejecutar(mensaje: string, accion: () => Promise<void>): Promise<void> {
        if (this.actionInFlight || `${this.uid ?? ''}`.trim().length < 1)
            return;
        this.actionInFlight = true;
        try {
            await accion();
            this.appToastSvc.showSuccess(mensaje, { category: 'amistad' });
        } catch (error) {
            this.appToastSvc.showError(error instanceof PlatformSocialError ? error.message : 'No se pudo completar la acción.');
        } finally {
            this.actionInFlight = false;
        }
        await this.cargar();
    }

    private async confirmar(texto: string, boton: string): Promise<boolean> {
        const resultado = await Swal.fire({
            text: texto,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: boton,
            cancelButtonText: 'Cancelar',
        });
        return resultado.isConfirmed === true;
    }

    private toNumber(value: any): number {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }
}
