import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocialFeedItem, SocialFeedKind, SocialFeedScope, SocialWebSocketEvent } from 'src/app/interfaces/social-v3';
import { UserPublicProfileTab } from 'src/app/interfaces/user-account';
import { SocialRealtimeService } from 'src/app/services/social-realtime.service';
import { SocialV3ApiService } from 'src/app/services/social-v3-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';

@Component({
    selector: 'app-social-activity-section',
    templateUrl: './social-activity-section.component.html',
    styleUrls: ['./social-activity-section.component.sass'],
    standalone: false,
})
export class SocialActivitySectionComponent implements OnInit, OnChanges, OnDestroy {
    @Input() isLoggedIn = false;

    readonly scopes: { value: SocialFeedScope; label: string; }[] = [
        { value: 'global', label: 'Global' },
        { value: 'friends', label: 'Amistades' },
        { value: 'self', label: 'Mi actividad' },
    ];
    readonly kinds: { value: '' | SocialFeedKind; label: string; }[] = [
        { value: '', label: 'Todo' },
        { value: 'friendship.created', label: 'Amistad creada' },
        { value: 'campaign.created', label: 'Campaña creada' },
        { value: 'campaign.joined', label: 'Campaña unida' },
        { value: 'group.created', label: 'Grupo creado' },
        { value: 'character.published', label: 'Personaje publicado' },
    ];

    scope: SocialFeedScope = 'global';
    kind: '' | SocialFeedKind = '';
    items: SocialFeedItem[] = [];
    loading = false;
    loadingMore = false;
    errorMessage = '';
    hasMore = false;
    private readonly pageSize = 12;
    private readonly subscriptions = new Subscription();

    constructor(
        private socialV3ApiSvc: SocialV3ApiService,
        private socialRealtimeSvc: SocialRealtimeService,
        private userProfileNavSvc: UserProfileNavigationService,
    ) { }

    ngOnInit(): void {
        this.subscriptions.add(
            this.socialRealtimeSvc.events$.subscribe((event) => this.handleRealtimeEvent(event))
        );
        this.subscriptions.add(
            this.socialRealtimeSvc.refetchRequested$.subscribe(() => {
                if (this.isLoggedIn)
                    void this.reloadFeed(true);
            })
        );
    }

    ngOnChanges(): void {
        if (!this.isLoggedIn) {
            this.items = [];
            this.errorMessage = '';
            this.loading = false;
            this.loadingMore = false;
            return;
        }

        if (!this.loading && this.items.length < 1)
            void this.reloadFeed(true);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    async reloadFeed(reset: boolean): Promise<void> {
        if (!this.isLoggedIn)
            return;

        if (reset) {
            this.loading = true;
            this.errorMessage = '';
        } else {
            this.loadingMore = true;
        }

        try {
            const result = await this.socialV3ApiSvc.getFeed({
                scope: this.scope,
                kind: this.kind || null,
                limit: this.pageSize,
                offset: reset ? 0 : this.items.length,
            });
            this.items = reset
                ? result.items
                : this.reconcileFeed([...this.items, ...result.items]);
            this.hasMore = result.meta.hasMore;
        } catch (error: any) {
            this.errorMessage = `${error?.message ?? 'No se pudo cargar la actividad social.'}`.trim();
            if (reset)
                this.items = [];
        } finally {
            this.loading = false;
            this.loadingMore = false;
        }
    }

    openItemProfile(item: SocialFeedItem): void {
        const uid = `${item?.cta?.uid ?? item?.actor?.uid ?? ''}`.trim();
        if (uid.length < 1)
            return;

        const payload: UserPublicProfileTab = {
            uid,
            initialDisplayName: item.actor.displayName ?? null,
            mode: 'relationship',
        };
        this.userProfileNavSvc.openPublicProfile(payload);
    }

    canOpenProfile(item: SocialFeedItem): boolean {
        const ctaType = `${item?.cta?.type ?? ''}`.trim();
        const uid = `${item?.cta?.uid ?? item?.actor?.uid ?? ''}`.trim();
        return ctaType === 'open_profile' && uid.length > 0;
    }

    getActorAvatarUrl(item: SocialFeedItem): string {
        const photo = `${item.actor.photoThumbUrl ?? ''}`.trim();
        if (photo.length > 0)
            return photo;
        return resolveDefaultProfileAvatar(item.actor.uid || item.actor.displayName || item.id);
    }

    getKindLabel(item: SocialFeedItem): string {
        const kind = `${item.kind ?? ''}`.trim();
        if (kind === 'friendship.created')
            return 'Amistad';
        if (kind === 'campaign.created')
            return 'Campaña';
        if (kind === 'campaign.joined')
            return 'Campaña unida';
        if (kind === 'group.created')
            return 'Grupo';
        if (kind === 'character.published')
            return 'Personaje';
        return kind || 'Actividad';
    }

    trackByItemId(_: number, item: SocialFeedItem): string {
        return item.id;
    }

    private handleRealtimeEvent(event: SocialWebSocketEvent): void {
        if (!this.isLoggedIn || event.type !== 'feed.item_created')
            return;

        if (!this.matchesCurrentFilters(event.payload))
            return;

        this.items = this.reconcileFeed([event.payload, ...this.items]);
    }

    private matchesCurrentFilters(item: SocialFeedItem): boolean {
        if (this.kind && item.kind !== this.kind)
            return false;

        if (this.scope === 'self')
            return item.visibility === 'self';
        if (this.scope === 'friends')
            return item.visibility === 'friends' || item.visibility === 'self';
        return true;
    }

    private reconcileFeed(items: SocialFeedItem[]): SocialFeedItem[] {
        const seen = new Set<string>();
        return items.filter((item) => {
            const id = `${item?.id ?? ''}`.trim();
            if (id.length < 1 || seen.has(id))
                return false;
            seen.add(id);
            return true;
        });
    }
}
