import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SocialRelationshipProfile } from 'src/app/interfaces/social-v3';
import { UserPublicProfile } from 'src/app/interfaces/user-account';
import { AppToastService } from 'src/app/services/app-toast.service';
import { SocialApiService } from 'src/app/services/social-api.service';
import { SocialV3ApiService } from 'src/app/services/social-v3-api.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';
import { toUserFacingErrorMessage } from 'src/app/services/utils/user-facing-error.util';

@Component({
    selector: 'app-public-user-profile',
    templateUrl: './public-user-profile.component.html',
    styleUrls: ['./public-user-profile.component.sass'],
    standalone: false
})
export class PublicUserProfileComponent implements OnChanges {
    @Input() uid = '';
    @Input() initialDisplayName: string | null = null;
    @Input() mode: 'public' | 'relationship' = 'public';
    @Output() profileLoaded = new EventEmitter<{ uid: string; displayName: string | null; }>();

    publicProfile: UserPublicProfile | null = null;
    relationshipProfile: SocialRelationshipProfile | null = null;
    loading = false;
    relationshipActionInFlight = false;
    relationshipActionErrorMessage = '';
    errorMessage = '';
    private readonly dateFormatter = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    constructor(
        private userProfileApiSvc: UserProfileApiService,
        private socialV3ApiSvc: SocialV3ApiService,
        private socialApiSvc: SocialApiService,
        private appToastSvc: AppToastService,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['uid'] || changes['mode']) && `${this.uid ?? ''}`.trim().length > 0)
            void this.cargar();
    }

    get avatarUrl(): string {
        const image = `${this.relationshipProfile?.profile?.photoThumbUrl ?? this.publicProfile?.photoThumbUrl ?? ''}`.trim();
        if (image.length > 0)
            return image;
        return resolveDefaultProfileAvatar(this.uid || this.initialDisplayName || this.profileLabel || '');
    }

    get profileLabel(): string {
        return `${this.relationshipProfile?.profile?.displayName ?? this.publicProfile?.displayName ?? this.initialDisplayName ?? ''}`.trim()
            || 'Perfil público';
    }

    get bioText(): string {
        return `${this.relationshipProfile?.profile?.bio ?? this.publicProfile?.bio ?? ''}`.trim();
    }

    get pronounsText(): string {
        return `${this.relationshipProfile?.profile?.pronouns ?? this.publicProfile?.pronouns ?? ''}`.trim();
    }

    get statsItems(): { value: number; label: string; }[] {
        const stats = (this.relationshipProfile?.stats ?? this.publicProfile?.stats ?? null) as any;
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

    get formattedMemberSince(): string {
        const raw = `${this.relationshipProfile?.profile?.joinedAtUtc ?? this.publicProfile?.memberSince ?? ''}`.trim();
        if (raw.length < 1)
            return 'fecha desconocida';

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime()))
            return 'fecha desconocida';

        return this.dateFormatter.format(parsed);
    }

    get tagLabel(): string {
        return this.mode === 'relationship' ? 'Perfil social relacional' : 'Perfil público del creador';
    }

    get relationshipStateLabel(): string {
        const state = `${this.relationshipProfile?.relationship?.state ?? ''}`.trim();
        if (state === 'self')
            return 'Este perfil corresponde a tu propia cuenta.';
        if (state === 'friend')
            return 'Amistad activa.';
        if (state === 'incoming_request')
            return 'Solicitud de amistad recibida.';
        if (state === 'outgoing_request')
            return 'Solicitud de amistad enviada.';
        if (state === 'blocked_by_actor')
            return 'Has bloqueado a esta persona.';
        if (state === 'blocked_actor')
            return 'Esta persona te ha bloqueado o no puede interactuar contigo.';
        return 'Sin vínculo social activo.';
    }

    get canSendFriendRequest(): boolean {
        return this.relationshipState === 'none';
    }

    get canAcceptFriendRequest(): boolean {
        return this.relationshipState === 'incoming_request';
    }

    get canRejectFriendRequest(): boolean {
        return this.relationshipState === 'incoming_request';
    }

    get canCancelFriendRequest(): boolean {
        return this.relationshipState === 'outgoing_request';
    }

    get hasRelationshipActions(): boolean {
        return this.mode === 'relationship'
            && !!this.relationshipProfile
            && (this.canSendFriendRequest || this.canAcceptFriendRequest || this.canRejectFriendRequest || this.canCancelFriendRequest);
    }

    get relationshipMetaItems(): { value: string; label: string; tone?: 'neutral' | 'warn'; }[] {
        if (!this.relationshipProfile)
            return [];

        const items: { value: string; label: string; tone?: 'neutral' | 'warn'; }[] = [
            {
                value: `${this.relationshipProfile.relationship.mutualFriendsCount}`,
                label: 'Amistades en común',
            },
            {
                value: `${this.relationshipProfile.relationship.mutualCampaignsCount}`,
                label: 'Campañas en común',
            },
        ];

        if (this.relationshipProfile.relationship.blockedByActor)
            items.push({ value: 'Sí', label: 'Bloqueado por ti', tone: 'warn' });
        if (this.relationshipProfile.relationship.blockedActor)
            items.push({ value: 'Sí', label: 'Te bloquea o restringe', tone: 'warn' });

        return items;
    }

    get visibilityItems(): { value: string; label: string; }[] {
        if (!this.relationshipProfile)
            return [];

        return [
            {
                value: this.relationshipProfile.visibility.showAuthenticatedBlock ? 'Visible' : 'Oculto',
                label: 'Bloque autenticado',
            },
            {
                value: this.relationshipProfile.visibility.showFriendsBlock ? 'Visible' : 'Oculto',
                label: 'Bloque de amistades',
            },
            {
                value: this.relationshipProfile.visibility.showRecentActivity ? 'Visible' : 'Oculta',
                label: 'Actividad reciente',
            },
        ];
    }

    get recentActivityItems(): SocialRelationshipProfile['recentActivity'] {
        if (!this.relationshipProfile?.visibility?.showRecentActivity)
            return [];
        return this.relationshipProfile.recentActivity ?? [];
    }

    async cargar(): Promise<void> {
        const uid = `${this.uid ?? ''}`.trim();
        if (uid.length < 1)
            return;

        this.loading = true;
        this.errorMessage = '';
        this.relationshipActionErrorMessage = '';
        this.publicProfile = null;
        this.relationshipProfile = null;
        try {
            if (this.mode === 'relationship')
                this.relationshipProfile = await this.socialV3ApiSvc.getRelationshipProfile(uid);
            else
                this.publicProfile = await this.userProfileApiSvc.getPublicProfile(uid);

            this.profileLoaded.emit({
                uid,
                displayName: this.profileLabel || null,
            });
        } catch (error: any) {
            this.publicProfile = null;
            this.relationshipProfile = null;
            this.errorMessage = `${error?.message ?? 'No se pudo cargar el perfil público.'}`.trim();
        } finally {
            this.loading = false;
        }
    }

    async sendFriendRequest(): Promise<void> {
        await this.runRelationshipAction('Solicitud de amistad enviada.', async () => {
            await this.socialApiSvc.sendFriendRequest(this.targetProfileUid);
        });
    }

    async acceptFriendRequest(): Promise<void> {
        await this.runRelationshipAction('Solicitud aceptada.', async () => {
            const requestId = await this.findPendingFriendRequestId('received');
            await this.socialApiSvc.resolveFriendRequest(requestId, 'accept');
        });
    }

    async rejectFriendRequest(): Promise<void> {
        await this.runRelationshipAction('Solicitud rechazada.', async () => {
            const requestId = await this.findPendingFriendRequestId('received');
            await this.socialApiSvc.resolveFriendRequest(requestId, 'reject');
        });
    }

    async cancelFriendRequest(): Promise<void> {
        await this.runRelationshipAction('Solicitud cancelada.', async () => {
            const requestId = await this.findPendingFriendRequestId('sent');
            await this.socialApiSvc.resolveFriendRequest(requestId, 'cancel');
        });
    }

    private get relationshipState(): string {
        return `${this.relationshipProfile?.relationship?.state ?? ''}`.trim();
    }

    private get targetProfileUid(): string {
        return `${this.relationshipProfile?.profile?.uid ?? this.uid ?? ''}`.trim();
    }

    private async findPendingFriendRequestId(direction: 'received' | 'sent'): Promise<number> {
        const targetUid = this.targetProfileUid;
        const result = direction === 'received'
            ? await this.socialApiSvc.listReceivedFriendRequests()
            : await this.socialApiSvc.listSentFriendRequests();
        const request = result.items.find((item) => item.status === 'pending' && item.target.uid === targetUid);
        if (!request)
            throw new Error('No se encontró una solicitud de amistad pendiente para este perfil.');
        return request.requestId;
    }

    private async runRelationshipAction(successMessage: string, handler: () => Promise<void>): Promise<void> {
        if (this.relationshipActionInFlight)
            return;

        this.relationshipActionInFlight = true;
        this.relationshipActionErrorMessage = '';
        try {
            await handler();
            this.appToastSvc.showSuccess(successMessage, { category: 'amistad' });
            await this.cargar();
        } catch (error) {
            this.relationshipActionErrorMessage = toUserFacingErrorMessage(error, 'No se pudo actualizar la solicitud de amistad.');
            this.appToastSvc.showError(this.relationshipActionErrorMessage);
        } finally {
            this.relationshipActionInFlight = false;
        }
    }

    private toNumber(value: any): number {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }
}
