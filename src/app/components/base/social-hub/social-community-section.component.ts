import { Component, Input, OnChanges } from '@angular/core';
import {
    SocialCommunityRankings,
    SocialCommunityRole,
    SocialCommunitySort,
    SocialCommunityStats,
    SocialCommunityUserItem,
    SocialRankingMetric,
} from 'src/app/interfaces/social-v3';
import { UserPublicProfileTab } from 'src/app/interfaces/user-account';
import { SocialV3ApiService } from 'src/app/services/social-v3-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';

@Component({
    selector: 'app-social-community-section',
    templateUrl: './social-community-section.component.html',
    styleUrls: ['./social-community-section.component.sass'],
    standalone: false,
})
export class SocialCommunitySectionComponent implements OnChanges {
    @Input() isLoggedIn = false;

    readonly roles: { value: '' | SocialCommunityRole; label: string; }[] = [
        { value: '', label: 'Todos los roles' },
        { value: 'jugador', label: 'Jugadores' },
        { value: 'master', label: 'Masters' },
        { value: 'colaborador', label: 'Colaboradores' },
        { value: 'admin', label: 'Administración' },
    ];
    readonly sorts: { value: SocialCommunitySort; label: string; }[] = [
        { value: 'recent', label: 'Más recientes' },
        { value: 'active', label: 'Más activos' },
        { value: 'characters', label: 'Más personajes' },
        { value: 'campaigns_mastered', label: 'Más como master' },
        { value: 'campaigns_joined', label: 'Más campañas' },
    ];
    readonly rankingMetrics: { value: SocialRankingMetric; label: string; }[] = [
        { value: 'public_characters', label: 'Personajes públicos' },
        { value: 'campaigns_created', label: 'Campañas creadas' },
        { value: 'campaigns_as_master', label: 'Campañas como master' },
        { value: 'active_campaigns', label: 'Campañas activas' },
        { value: 'seniority', label: 'Antigüedad' },
    ];

    query = '';
    role: '' | SocialCommunityRole = '';
    sort: SocialCommunitySort = 'recent';
    rankingMetric: SocialRankingMetric = 'public_characters';
    loading = false;
    loadingMore = false;
    statsLoading = false;
    rankingsLoading = false;
    errorMessage = '';
    stats: SocialCommunityStats | null = null;
    rankings: SocialCommunityRankings | null = null;
    users: SocialCommunityUserItem[] = [];
    hasMore = false;
    private readonly pageSize = 12;

    constructor(
        private socialV3ApiSvc: SocialV3ApiService,
        private userProfileNavSvc: UserProfileNavigationService,
    ) { }

    ngOnChanges(): void {
        if (!this.isLoggedIn) {
            this.users = [];
            this.stats = null;
            this.rankings = null;
            this.errorMessage = '';
            this.loading = false;
            this.loadingMore = false;
            this.statsLoading = false;
            this.rankingsLoading = false;
            return;
        }

        if (!this.stats && !this.loading)
            void this.reloadAll();
    }

    get statCards(): { label: string; value: number; }[] {
        if (!this.stats)
            return [];

        return [
            { label: 'Usuarios visibles', value: this.stats.visibleUsers },
            { label: 'Personajes públicos', value: this.stats.publicCharacters },
            { label: 'Campañas activas', value: this.stats.activeCampaigns },
            { label: 'Grupos activos', value: this.stats.activeGroups },
            { label: 'Vínculos de amistad', value: this.stats.friendLinks },
        ];
    }

    async reloadAll(): Promise<void> {
        if (!this.isLoggedIn)
            return;

        await Promise.all([
            this.reloadUsers(true),
            this.reloadStats(),
            this.reloadRankings(),
        ]);
    }

    async reloadUsers(reset: boolean): Promise<void> {
        if (!this.isLoggedIn)
            return;

        if (reset) {
            this.loading = true;
            this.errorMessage = '';
        } else {
            this.loadingMore = true;
        }

        try {
            const result = await this.socialV3ApiSvc.listCommunityUsers({
                query: this.query,
                role: this.role || null,
                sort: this.sort,
                limit: this.pageSize,
                offset: reset ? 0 : this.users.length,
            });
            this.users = reset ? result.items : [...this.users, ...result.items];
            this.hasMore = result.meta.hasMore;
        } catch (error: any) {
            this.errorMessage = `${error?.message ?? 'No se pudo cargar la comunidad.'}`.trim();
            if (reset)
                this.users = [];
        } finally {
            this.loading = false;
            this.loadingMore = false;
        }
    }

    async reloadStats(): Promise<void> {
        if (!this.isLoggedIn)
            return;

        this.statsLoading = true;
        try {
            this.stats = await this.socialV3ApiSvc.getCommunityStats();
        } finally {
            this.statsLoading = false;
        }
    }

    async reloadRankings(): Promise<void> {
        if (!this.isLoggedIn)
            return;

        this.rankingsLoading = true;
        try {
            this.rankings = await this.socialV3ApiSvc.getCommunityRankings(this.rankingMetric, 8);
        } finally {
            this.rankingsLoading = false;
        }
    }

    openRelationshipProfile(user: Pick<SocialCommunityUserItem, 'uid' | 'displayName'>): void {
        const payload: UserPublicProfileTab = {
            uid: user.uid,
            initialDisplayName: user.displayName ?? null,
            mode: 'relationship',
        };
        this.userProfileNavSvc.openPublicProfile(payload);
    }

    getRelationshipLabel(user: SocialCommunityUserItem): string {
        const state = `${user.relationship.state ?? ''}`.trim();
        if (state === 'friend')
            return 'Amistad activa';
        if (state === 'incoming_request')
            return 'Te ha enviado solicitud';
        if (state === 'outgoing_request')
            return 'Solicitud enviada';
        if (state === 'blocked_by_actor')
            return 'Bloqueado por ti';
        if (state === 'blocked_actor')
            return 'No disponible';
        if (state === 'self')
            return 'Tu cuenta';
        return 'Sin vínculo';
    }

    getRoleLabel(role: SocialCommunityRole): string {
        if (role === 'master')
            return 'Master';
        if (role === 'colaborador')
            return 'Colaborador';
        if (role === 'admin')
            return 'Admin';
        return 'Jugador';
    }

    getAvatarUrl(user: Pick<SocialCommunityUserItem, 'uid' | 'displayName' | 'photoThumbUrl'>): string {
        const photo = `${user.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(user.uid || user.displayName || '');
    }

    trackByUid(_: number, item: SocialCommunityUserItem): string {
        return item.uid;
    }
}
