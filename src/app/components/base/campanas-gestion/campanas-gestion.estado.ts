import { Injectable, OnDestroy } from '@angular/core';
import { Subject, concatMap, debounceTime, from, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import {
    CampaignCreationPolicy,
    CampaignDetailViewModel,
    CampaignListItem,
    CampaignMemberItem,
    CampaignRealtimeEvent,
    CampaignSpace,
    CampaignSubtramaItem,
    CampaignTramaItem,
    CampaignUserSearchResult,
} from 'src/app/interfaces/campaign-management';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { InvitacionEnviadaEspacio, PlatformSpacesService, SolicitudEspacio, TraspasoEspacio } from 'src/app/services/platform-spaces.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import { normalizarPrecioMaximoPorPieza } from 'src/app/services/utils/tienda-equipo';
import { MAX_TIRADAS_PUNTOS_GOLPE, MIN_TIRADAS_PUNTOS_GOLPE, tiradasPuntosGolpe } from 'src/app/services/utils/puntos-golpe';
import { mensajeErrorDeAccion, permitirAccionGuardada, textoFechaHora, textoRol } from '../user-profile/perfil-acciones';
import { toPositiveInt } from 'src/app/services/utils/normalizacion';

export type CampaignWorkspaceMode = 'idle' | 'create' | 'config' | 'peopleStories';
export type CampaignWorkspaceTab = 'usuarios' | 'historias';

/**
 * El estado y las acciones de la gestión de campañas de «Mi perfil»: la lista de campañas que dirige la cuenta, la
 * campaña elegida, su política de creación, sus jugadores e invitaciones (en el espacio de la plataforma) y sus tramas.
 * Se provee en `UserProfileComponent` (una instancia por perfil abierto), que lo usa para la navegación y para abrir
 * la sección, y lo pinta `CampanasGestionComponent`. Mismas funciones que tenía el perfil; solo cambia dónde viven.
 */
@Injectable()
export class CampanasGestionEstado implements OnDestroy {
    /** La sección de campañas está abierta en el perfil: solo entonces se recargan por los avisos en tiempo real. */
    seccionAbierta = false;
    /** La cuenta que mira el perfil (para saber su papel en la campaña y no ofrecerse a sí misma en las búsquedas). */
    uidActual: string | null = null;

    private readonly destroy$ = new Subject<void>();
    private iniciado = false;

    campaigns: CampaignListItem[] = [];
    campaignsLoading = false;
    campaignsLoaded = false;
    campaignsErrorMessage = '';
    selectedCampaignId: number | null = null;
    selectedCampaignDetail: CampaignDetailViewModel | null = null;
    selectedCampaignLoading = false;
    selectedCampaignErrorMessage = '';
    campaignWorkspaceMode: CampaignWorkspaceMode = 'idle';
    campaignWorkspaceTab: CampaignWorkspaceTab = 'usuarios';
    campaignCreateDraft = '';
    campaignCreatePolicyDraft: CampaignCreationPolicy = this.createDefaultCampaignPolicyDraft();
    campaignCreateSaving = false;
    campaignRenameDraft = '';
    campaignRenameSaving = false;
    memberSearchQuery = '';
    memberSearchLoading = false;
    memberSearchResults: CampaignUserSearchResult[] = [];
    memberSearchErrorMessage = '';
    memberInviteInFlightUid = '';
    memberRemoveInFlightUid = '';
    campaignInviteCancelInFlightId: number | null = null;
    transferSearchQuery = '';
    transferSearchLoading = false;
    transferSearchResults: CampaignUserSearchResult[] = [];
    transferSearchErrorMessage = '';
    transferSelectedUser: CampaignUserSearchResult | null = null;
    transferSaving = false;
    transferCancelInFlight = false;
    memberInviteEmailDraft = '';
    memberInviteEmailSending = false;
    joinRequestInFlightId: number | null = null;
    entryModeSaving = false;
    tramaCreateDraft = '';
    tramaCreateVisibleParaJugadores = true;
    tramaCreateSaving = false;
    editingTramaId: number | null = null;
    editingTramaDraft = '';
    editingTramaVisibleParaJugadores = true;
    tramaSaveInFlightId: number | null = null;
    editingSubtramaId: number | null = null;
    editingSubtramaDraft = '';
    editingSubtramaVisibleParaJugadores = true;
    subtramaSaveInFlightId: number | null = null;
    subtramaCreateDraftByTrama: Record<number, string> = {};
    subtramaCreateVisibleByTrama: Record<number, boolean> = {};
    subtramaCreateSavingTramaId: number | null = null;

    private readonly campaignRealtimeRefresh$ = new Subject<CampaignRealtimeEvent>();

    private memberSearchTimerId: number | null = null;

    private transferSearchTimerId: number | null = null;

    private campaignSummariesWatchStop: (() => void) | null = null;

    private readonly campaignPolicyAutofixInFlight = new Set<number>();

    private campaignSummariesLiveReady = false;

    readonly campaignNameMinLength = 5;
    readonly campaignNameMaxLength = 150;
    readonly campaignMinimumRollMin = 3;
    readonly campaignMinimumRollMax = 13;
    readonly campaignNepMin = 1;
    readonly campaignNepMax = 20;
    readonly campaignMaxTablesMin = 1;
    readonly campaignMaxTablesMax = 5;
    /** Tiradas de PG de la campaña: 1 es el Manual del jugador y 3, lo que deja la web sin campaña. */
    readonly campaignHpRollsMin = MIN_TIRADAS_PUNTOS_GOLPE;
    readonly campaignHpRollsMax = MAX_TIRADAS_PUNTOS_GOLPE;
    readonly campaignHomebrewSourcesMin = 1;
    readonly campaignHomebrewSourcesMax = 20;

    constructor(
        private userSvc: UserService,
        private campanaSvc: CampanaService,
        private campaignRealtimeSyncSvc: CampaignRealtimeSyncService,
        private userProfileNavSvc: UserProfileNavigationService,
        private appToastSvc: AppToastService,
        private apiActionGuardSvc: ApiActionGuardService,
        private chatFloatingSvc: ChatFloatingService,
        private platformSpacesSvc: PlatformSpacesService,
    ) { }

    /** Escucha los avisos en tiempo real de las campañas y los resúmenes vivos. Lo llama el perfil al iniciarse. */
    iniciar(): void {
        if (this.iniciado)
            return;
        this.iniciado = true;
        this.campaignRealtimeSyncSvc.events$
            .pipe(takeUntil(this.destroy$))
            .subscribe((event) => {
                if (!this.seccionAbierta)
                    return;
                this.campaignRealtimeRefresh$.next(event);
            });
        this.campaignRealtimeRefresh$
            .pipe(
                takeUntil(this.destroy$),
                debounceTime(250),
                concatMap((event) => from(this.handleCampaignRealtimeEvent(event)))
            )
            .subscribe();
        this.startCampaignSummariesWatch();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearSearchTimer('member');
        this.clearSearchTimer('transfer');
        this.campaignSummariesWatchStop?.();
        this.campaignSummariesWatchStop = null;
    }

    /** La lista de campañas al cargar el perfil (sin error: si falla, ninguna). */
    async cargarListaInicial(): Promise<void> {
        const campaigns = await this.campanaSvc.listProfileCampaigns().catch(() => []);
        this.campaigns = this.filterManageableCampaigns(campaigns);
        this.campaignsLoaded = true;
    }

    /** Abre la sección: recarga la lista y elige la campaña pedida (o la que ya estaba). */
    async abrirSeccion(preferredCampaignId?: number | null): Promise<void> {
        if (toPositiveInt(preferredCampaignId)) {
            this.campaignWorkspaceMode = 'idle';
            this.campaignWorkspaceTab = 'usuarios';
        }
        await this.ensureCampaignSectionLoaded(true, preferredCampaignId);
    }

    private puedeLanzar(actionKey: string): boolean {
        return permitirAccionGuardada(this.userSvc, this.apiActionGuardSvc, this.appToastSvc, actionKey);
    }

    get campaignNameLength(): number {
        return `${this.campaignCreateDraft ?? ''}`.trim().length;
    }

    get canCreateCampaignByRole(): boolean {
        const role = `${this.userSvc.getCurrentRole() ?? ''}`.trim().toLowerCase();
        return role === 'master' || role === 'colaborador' || role === 'admin';
    }

    get canCreateCampaign(): boolean {
        return this.canCreateCampaignByRole && this.userSvc.can('campanas', 'create');
    }


    get campaignCreateHint(): string {
        if (!this.canCreateCampaignByRole)
            return 'Solo los Masters y Colaboradores pueden crear campañas.';

        return 'Ahora mismo no tienes permiso para crear campañas nuevas.';
    }

    get manageableCampaigns(): CampaignListItem[] {
        return this.campaigns.filter((campaign) => campaign.campaignRole === 'master');
    }

    get selectedCampaignSummary(): CampaignListItem | null {
        if (!this.selectedCampaignId)
            return null;
        return this.manageableCampaigns.find((campaign) => campaign.id === this.selectedCampaignId) ?? null;
    }

    get selectedCampaignCurrentMembership(): CampaignMemberItem | null {
        const currentUid = `${this.uidActual ?? ''}`.trim();
        if (currentUid.length < 1)
            return null;
        return this.selectedCampaignMembers.find((member) => member.uid === currentUid) ?? null;
    }

    get selectedCampaignActorRole(): 'master' | 'jugador' | null {
        return this.selectedCampaignCurrentMembership?.campaignRole
            ?? this.selectedCampaignSummary?.campaignRole
            ?? null;
    }

    get selectedCampaignActorStatus(): 'activo' | 'inactivo' | 'expulsado' | null {
        return this.selectedCampaignCurrentMembership?.membershipStatus
            ?? this.selectedCampaignSummary?.membershipStatus
            ?? null;
    }

    get selectedCampaignCanManage(): boolean {
        return this.selectedCampaignActorRole === 'master' && this.userSvc.canProceed('creation');
    }

    get canOpenSelectedCampaignChat(): boolean {
        return !!this.selectedCampaignSummary
            && this.selectedCampaignActorStatus === 'activo'
            && this.userSvc.canProceed('usage');
    }

    get selectedCampaignCanTransferMaster(): boolean {
        return this.selectedCampaignCanManage
            && !!this.selectedCampaignSpace
            && (this.selectedCampaignTransferCandidates.length > 0 || !!this.selectedCampaignPendingTransfer);
    }

    /** El espacio de la plataforma que lleva la pertenencia: sin él no se puede invitar ni traspasar todavía. */
    get selectedCampaignSpace(): CampaignSpace | null {
        return this.selectedCampaignDetail?.espacio ?? null;
    }

    get selectedCampaignAcceptsRequests(): boolean {
        return this.selectedCampaignSpace?.entrada === 'solicitud';
    }

    get selectedCampaignJoinRequests(): SolicitudEspacio[] {
        return this.selectedCampaignDetail?.joinRequests ?? [];
    }

    get selectedCampaignPendingTransfer(): TraspasoEspacio | null {
        return this.selectedCampaignDetail?.pendingTransfer ?? null;
    }

    get selectedCampaignPendingTransferLabel(): string {
        const transfer = this.selectedCampaignPendingTransfer;
        if (!transfer)
            return '';
        const member = this.selectedCampaignMembers.find((item) => item.uid.toLowerCase() === transfer.cuenta.toLowerCase());
        return member ? this.getUserDisplayLabel(member.displayName, member.email, member.uid) : 'un jugador';
    }

    get selectedCampaignMembers(): CampaignMemberItem[] {
        return this.selectedCampaignDetail?.members ?? [];
    }

    get selectedCampaignTransferCandidates(): CampaignMemberItem[] {
        return this.selectedCampaignMembers.filter((member) => member.campaignRole !== 'master' && member.isActive);
    }

    get selectedCampaignTramas(): CampaignTramaItem[] {
        return this.selectedCampaignDetail?.tramas ?? [];
    }

    get selectedCampaignPendingInvitations(): InvitacionEnviadaEspacio[] {
        return this.selectedCampaignDetail?.pendingInvitations ?? [];
    }

    get selectedCampaignMaster(): CampaignMemberItem | null {
        return this.selectedCampaignMembers.find((member) => member.campaignRole === 'master' && member.isActive) ?? null;
    }

    get selectedCampaignHasActiveMaster(): boolean {
        return !!this.selectedCampaignMaster;
    }

    get isCreatingCampaign(): boolean {
        return this.campaignWorkspaceMode === 'create';
    }

    get isCampaignWorkspaceIdle(): boolean {
        return this.campaignWorkspaceMode === 'idle';
    }

    get isCampaignWorkspaceConfig(): boolean {
        return this.campaignWorkspaceMode === 'config';
    }

    get isCampaignWorkspacePeopleStories(): boolean {
        return this.campaignWorkspaceMode === 'peopleStories';
    }

    get isCampaignWorkspaceUsersTab(): boolean {
        return this.campaignWorkspaceTab === 'usuarios';
    }

    get isCampaignWorkspaceStoriesTab(): boolean {
        return this.campaignWorkspaceTab === 'historias';
    }


    get campaignEditorSubmitLabel(): string {
        return this.isCreatingCampaign ? 'Crear campaña' : 'Guardar cambios';
    }

    get campaignEditorNamePlaceholder(): string {
        return this.isCreatingCampaign ? 'Nombre de la nueva campaña' : 'Nombre de campaña';
    }

    get campaignEditorSaving(): boolean {
        return this.campaignCreateSaving || this.campaignRenameSaving;
    }

    get campaignEditorCanSave(): boolean {
        return this.isCreatingCampaign ? this.canCreateCampaign : this.selectedCampaignCanManage;
    }

    get campaignEditorFormDisabled(): boolean {
        return this.campaignEditorSaving || !this.campaignEditorCanSave;
    }

    get campaignHomebrewMode(): 'none' | 'general' | 'limitado' {
        if (this.campaignCreatePolicyDraft.permitirHomebrewGeneral === true)
            return 'general';
        if ((this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje ?? 0) === 0)
            return 'none';
        return 'limitado';
    }

    get showCampaignHomebrewLimitInput(): boolean {
        return this.campaignHomebrewMode === 'limitado';
    }

    get showCampaignHomebrewAdvancedToggles(): boolean {
        return this.campaignHomebrewMode !== 'none';
    }

    get campaignHomebrewLimitDisabled(): boolean {
        return this.campaignEditorFormDisabled || !this.showCampaignHomebrewLimitInput;
    }

    async seleccionarCampana(campaignId: number): Promise<void> {
        await this.loadCampaignSelection(campaignId, false);
        this.campaignWorkspaceMode = 'idle';
        this.campaignWorkspaceTab = 'usuarios';
    }

    seleccionarNuevaCampana(): void {
        this.selectedCampaignId = null;
        this.selectedCampaignDetail = null;
        this.selectedCampaignErrorMessage = '';
        this.campaignWorkspaceMode = 'create';
        this.campaignWorkspaceTab = 'usuarios';
        this.resetCampaignEditorToCreateMode();
        this.resetCampaignDetailEditors();
    }

    async abrirConfiguracionCampana(campaignId: number, event?: Event): Promise<void> {
        event?.preventDefault();
        event?.stopPropagation();
        await this.loadCampaignSelection(campaignId, false);
        this.campaignWorkspaceMode = 'config';
        this.campaignWorkspaceTab = 'usuarios';
    }

    async abrirUsuariosCampana(campaignId: number, event?: Event): Promise<void> {
        event?.preventDefault();
        event?.stopPropagation();
        await this.loadCampaignSelection(campaignId, false);
        this.campaignWorkspaceMode = 'peopleStories';
        this.campaignWorkspaceTab = 'usuarios';
    }

    async abrirHistoriasCampana(campaignId: number, event?: Event): Promise<void> {
        event?.preventDefault();
        event?.stopPropagation();
        await this.loadCampaignSelection(campaignId, false);
        this.campaignWorkspaceMode = 'peopleStories';
        this.campaignWorkspaceTab = 'historias';
    }

    async guardarCampanaDesdeEditor(): Promise<void> {
        if (this.isCreatingCampaign) {
            await this.crearCampana();
            return;
        }
        await this.guardarNombreCampana();
    }

    setCampaignHomebrewMode(mode: 'none' | 'general' | 'limitado'): void {
        if (mode === 'none') {
            this.campaignCreatePolicyDraft.permitirHomebrewGeneral = false;
            this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = 0;
            this.campaignCreatePolicyDraft.permitirVentajasDesventajas = false;
            this.campaignCreatePolicyDraft.permitirIgnorarRestriccionesAlineamiento = false;
            return;
        }

        if (mode === 'general') {
            this.campaignCreatePolicyDraft.permitirHomebrewGeneral = true;
            this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = null;
            return;
        }

        this.campaignCreatePolicyDraft.permitirHomebrewGeneral = false;
        this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = this.normalizeCampaignHomebrewLimit(
            this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje,
            1
        );
    }

    onCampaignHomebrewLimitBlur(): void {
        if (this.campaignHomebrewMode !== 'limitado')
            return;

        this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = this.normalizeCampaignHomebrewLimit(
            this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje,
            1
        );
    }

    onCampaignMinimumRollBlur(): void {
        this.campaignCreatePolicyDraft.tiradaMinimaCaracteristica = this.normalizeCampaignMinimumRoll(
            this.campaignCreatePolicyDraft.tiradaMinimaCaracteristica
        );
    }

    onCampaignMaxNepBlur(): void {
        this.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo = this.normalizeCampaignMaxNep(
            this.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo
        );
    }

    onCampaignMaxTablesBlur(): void {
        this.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas = this.normalizeCampaignMaxTables(
            this.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas
        );
    }

    onCampaignHpRollsBlur(): void {
        this.campaignCreatePolicyDraft.maxTiradasPuntosGolpe = tiradasPuntosGolpe(
            this.campaignCreatePolicyDraft.maxTiradasPuntosGolpe
        );
    }

    abrirInfoCampaignHomebrew(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        void Swal.fire({
            title: 'Homebrew de campaña',
            icon: 'info',
            html: `
                <p style="text-align:left; margin-bottom:8px;"><strong>No permitir homebrew</strong>: bloquea excepciones generales de contenido.</p>
                <p style="text-align:left; margin-bottom:8px;"><strong>Permitir solo N fuentes</strong>: admite un margen controlado y medible.</p>
                <p style="text-align:left; margin:0;"><strong>Permitir homebrew en general</strong>: deja la campaña abierta a excepciones amplias.</p>
            `,
            confirmButtonText: 'Entendido',
        });
    }

    abrirInfoCampaignAlignmentOverride(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        void Swal.fire({
            title: 'Restricciones de alineamiento',
            icon: 'info',
            html: `
                <p style="text-align:left; margin-bottom:8px;">Esta opción no elimina los avisos del creador de personaje.</p>
                <p style="text-align:left; margin-bottom:8px;">Si está desactivada, el frontend bloquea elecciones que rompan reglas duras de alineamiento.</p>
                <p style="text-align:left; margin:0;">Si está activada, se puede continuar, pero el personaje queda marcado como Homebrew y se avisa de que será una rareza excepcional.</p>
            `,
            confirmButtonText: 'Entendido',
        });
    }

    async crearCampana(): Promise<void> {
        if (!this.canCreateCampaign || this.campaignCreateSaving)
            return;

        const validationError = this.validateCampaignName(this.campaignCreateDraft);
        if (validationError) {
            this.appToastSvc.showError(validationError);
            return;
        }
        if (!this.puedeLanzar('campaign.create'))
            return;

        this.campaignCreateSaving = true;
        try {
            const normalizedPolicy = this.buildCampaignPolicyForSave();
            const created = await this.campanaSvc.createCampaign({
                nombre: this.campaignCreateDraft,
                politicaCreacion: normalizedPolicy,
            });
            this.campaignCreateDraft = '';
            this.campaignCreatePolicyDraft = this.createDefaultCampaignPolicyDraft();
            this.campaignWorkspaceMode = 'config';
            this.showCampaignSuccess('Campaña creada correctamente.');
            await this.reloadCampaigns(created.id);
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo crear la campaña.', 'creation'));
        } finally {
            this.campaignCreateSaving = false;
        }
    }

    async guardarNombreCampana(): Promise<void> {
        if (!this.selectedCampaignCanManage || !this.selectedCampaignId || this.campaignRenameSaving)
            return;

        const validationError = this.validateCampaignName(this.campaignCreateDraft);
        if (validationError) {
            this.appToastSvc.showError(validationError);
            return;
        }
        if (!this.puedeLanzar(`campaign.update.${this.selectedCampaignId}`))
            return;

        this.campaignRenameSaving = true;
        try {
            const normalizedPolicy = this.buildCampaignPolicyForSave();
            await this.campanaSvc.updateCampaign(this.selectedCampaignId, {
                nombre: this.campaignCreateDraft,
                politicaCreacion: normalizedPolicy,
            });
            this.showCampaignSuccess('Campaña actualizada.');
            await this.reloadCampaigns(this.selectedCampaignId);
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo actualizar la campaña.', 'creation'));
        } finally {
            this.campaignRenameSaving = false;
        }
    }

    async abrirChatCampanaSeleccionada(): Promise<void> {
        if (!this.selectedCampaignId || !this.canOpenSelectedCampaignChat)
            return;
        if (!this.puedeLanzar(`campaign.chat.open.${this.selectedCampaignId}`))
            return;

        try {
            const conversacion = await this.campanaSvc.getCampaignConversation(this.selectedCampaignId);
            const abierta = await this.chatFloatingSvc.abrir(conversacion.conversacionId);
            if (!abierta)
                this.appToastSvc.showError('El chat de Yosiftware no está disponible ahora mismo.');
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo abrir el chat de la campaña.'));
        }
    }

    abrirVistaSocialCampana(): void {
        if (!this.selectedCampaignId)
            return;

        this.userProfileNavSvc.openSocial({
            section: 'campanas',
            campaignId: this.selectedCampaignId,
            requestId: Date.now(),
        });
    }

    async cambiarHistorialMiembros(value: boolean): Promise<void> {
        if (!this.selectedCampaignId)
            return;
        await this.loadCampaignSelection(this.selectedCampaignId, true, value === true);
    }

    async toggleHistorialMiembros(): Promise<void> {
        await this.cambiarHistorialMiembros(!(this.selectedCampaignDetail?.includeInactiveMembers === true));
    }

    onMemberSearchQueryChange(): void {
        this.memberSearchErrorMessage = '';
        this.scheduleUserSearch('member');
    }

    async agregarJugador(result: CampaignUserSearchResult): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio)
            return;
        if (!this.puedeLanzar(`campaign.member.invite.${this.selectedCampaignId}.${result.uid}`))
            return;

        this.memberInviteInFlightUid = result.uid;
        try {
            await this.platformSpacesSvc.invitarCuenta(espacio.id, result.uid);
            this.memberSearchQuery = '';
            this.memberSearchResults = [];
            this.memberSearchErrorMessage = '';
            this.showCampaignSuccess('Invitación enviada. Le llegará un aviso para aceptarla en Rol.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo enviar la invitación.'));
        } finally {
            this.memberInviteInFlightUid = '';
        }
    }

    /** La plataforma envía el correo y nunca dice si es de una cuenta. */
    async invitarPorCorreo(): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        const correo = `${this.memberInviteEmailDraft ?? ''}`.trim();
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || this.memberInviteEmailSending)
            return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            this.appToastSvc.showError('Escribe un correo válido.');
            return;
        }
        if (!this.puedeLanzar(`campaign.member.invite-email.${this.selectedCampaignId}`))
            return;

        this.memberInviteEmailSending = true;
        try {
            await this.platformSpacesSvc.invitarCorreo(espacio.id, correo);
            this.memberInviteEmailDraft = '';
            this.showCampaignSuccess('Invitación enviada a ese correo.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo enviar la invitación.'));
        } finally {
            this.memberInviteEmailSending = false;
        }
    }

    async cancelarInvitacionCampana(invitation: InvitacionEnviadaEspacio): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        const inviteId = Math.trunc(Number(invitation?.id));
        if (!espacio || inviteId <= 0 || this.campaignInviteCancelInFlightId === inviteId)
            return;
        if (!this.puedeLanzar(`campaign.invitation.cancel.${inviteId}`))
            return;

        this.campaignInviteCancelInFlightId = inviteId;
        try {
            await this.platformSpacesSvc.retirarInvitacion(espacio.id, inviteId);
            this.showCampaignSuccess('Invitación retirada.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo retirar la invitación.'));
        } finally {
            this.campaignInviteCancelInFlightId = null;
        }
    }

    async resolverSolicitud(request: SolicitudEspacio, accion: 'aprobar' | 'rechazar'): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || this.joinRequestInFlightId === request.id)
            return;
        if (!this.puedeLanzar(`campaign.request.${request.id}.${accion}`))
            return;

        this.joinRequestInFlightId = request.id;
        try {
            await this.platformSpacesSvc.resolverSolicitud(espacio.id, request.id, accion);
            if (accion === 'aprobar')
                await this.campanaSvc.syncMembership(this.selectedCampaignId);
            this.showCampaignSuccess(accion === 'aprobar' ? 'Solicitud aprobada: ya está en la campaña.' : 'Solicitud rechazada.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo responder a la solicitud.'));
        } finally {
            this.joinRequestInFlightId = null;
        }
    }

    /** Solo por invitación o también por solicitud (Rol no ofrece la entrada abierta). */
    async cambiarEntradaCampana(admitirSolicitudes: boolean): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || this.entryModeSaving)
            return;
        if (!this.puedeLanzar(`campaign.entry.${this.selectedCampaignId}`))
            return;

        this.entryModeSaving = true;
        try {
            await this.platformSpacesSvc.cambiarEntrada(espacio.id, admitirSolicitudes ? 'solicitud' : 'invitacion');
            await this.campanaSvc.syncMembership(this.selectedCampaignId);
            this.showCampaignSuccess(admitirSolicitudes
                ? 'La campaña admite solicitudes: comparte su enlace para que pidan entrar.'
                : 'La campaña solo admite invitaciones.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo cambiar cómo se entra en la campaña.'));
        } finally {
            this.entryModeSaving = false;
        }
    }

    get selectedCampaignEntryLink(): string {
        if (!this.selectedCampaignId)
            return '';
        return `${window.location.origin}/?vista=campanas&campana=${this.selectedCampaignId}`;
    }

    async copiarEnlaceCampana(): Promise<void> {
        const enlace = this.selectedCampaignEntryLink;
        if (!enlace)
            return;
        try {
            await navigator.clipboard.writeText(enlace);
            this.showCampaignInfo('Enlace copiado.');
        } catch {
            this.appToastSvc.showError('No se pudo copiar el enlace.');
        }
    }

    async retirarJugador(member: CampaignMemberItem): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || member.campaignRole === 'master')
            return;

        const result = await Swal.fire({
            icon: 'warning',
            title: 'Sacar de la campaña',
            text: `${this.getUserDisplayLabel(member.displayName, member.email, member.uid)} dejará de ver la campaña. Sus personajes se quedan en ella, y solo podrá volver con una invitación nueva.`,
            showCancelButton: true,
            confirmButtonText: 'Sacar',
            cancelButtonText: 'Cancelar',
        });
        if (!result.isConfirmed)
            return;
        if (!this.puedeLanzar(`campaign.member.remove.${this.selectedCampaignId}.${member.uid}`))
            return;

        this.memberRemoveInFlightUid = member.uid;
        try {
            await this.platformSpacesSvc.sacar(espacio.id, member.uid);
            await this.campanaSvc.syncMembership(this.selectedCampaignId);
            this.showCampaignSuccess('Jugador fuera de la campaña.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo sacar al jugador.'));
        } finally {
            this.memberRemoveInFlightUid = '';
        }
    }

    seleccionarNuevoMaster(member: CampaignMemberItem): void {
        this.transferSelectedUser = {
            uid: member.uid,
            displayName: member.displayName,
            photoThumbUrl: null,
        };
        this.transferSearchQuery = this.getUserDisplayLabel(member.displayName, member.email, member.uid);
        this.transferSearchResults = [];
        this.transferSearchErrorMessage = '';
    }

    limpiarNuevoMaster(): void {
        this.transferSelectedUser = null;
        this.transferSearchQuery = '';
        this.transferSearchResults = [];
        this.transferSearchErrorMessage = '';
        this.clearSearchTimer('transfer');
    }

    /** El traspaso de la plataforma: el jugador tiene que aceptarlo (7 días); el máster saliente queda como jugador. */
    async transferirMaster(): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || !this.transferSelectedUser || this.transferSaving)
            return;

        if (this.transferSelectedUser.uid === this.selectedCampaignMaster?.uid) {
            this.appToastSvc.showError('El usuario seleccionado ya es el master actual.');
            return;
        }
        if (!this.puedeLanzar(`campaign.master.transfer.${this.selectedCampaignId}.${this.transferSelectedUser.uid}`))
            return;

        this.transferSaving = true;
        try {
            await this.platformSpacesSvc.ofrecerTraspaso(espacio.id, this.transferSelectedUser.uid);
            this.showCampaignSuccess('Traspaso ofrecido. Pasará a ser el máster cuando lo acepte.');
            this.limpiarNuevoMaster();
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo ofrecer el traspaso.'));
        } finally {
            this.transferSaving = false;
        }
    }

    async cancelarTraspaso(): Promise<void> {
        const espacio = this.selectedCampaignSpace;
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || !espacio || this.transferCancelInFlight)
            return;
        if (!this.puedeLanzar(`campaign.master.transfer-cancel.${this.selectedCampaignId}`))
            return;

        this.transferCancelInFlight = true;
        try {
            await this.platformSpacesSvc.cancelarTraspaso(espacio.id);
            this.showCampaignSuccess('Traspaso cancelado.');
            await this.reloadSelectedCampaign();
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo cancelar el traspaso.'));
        } finally {
            this.transferCancelInFlight = false;
        }
    }

    private async reloadSelectedCampaign(): Promise<void> {
        if (this.selectedCampaignId)
            await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
    }

    async crearTrama(): Promise<void> {
        if (!this.selectedCampaignId || !this.selectedCampaignCanManage || this.tramaCreateSaving)
            return;
        if (!this.puedeLanzar(`campaign.trama.create.${this.selectedCampaignId}`))
            return;

        this.tramaCreateSaving = true;
        try {
            await this.campanaSvc.createTrama(this.selectedCampaignId, {
                nombre: this.tramaCreateDraft,
                visibleParaJugadores: this.tramaCreateVisibleParaJugadores,
            });
            this.tramaCreateDraft = '';
            this.tramaCreateVisibleParaJugadores = true;
            this.showCampaignSuccess('Trama creada correctamente.');
            await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo crear la trama.', 'creation'));
        } finally {
            this.tramaCreateSaving = false;
        }
    }

    iniciarEdicionTrama(trama: CampaignTramaItem): void {
        this.editingTramaId = trama.id;
        this.editingTramaDraft = trama.nombre;
        this.editingTramaVisibleParaJugadores = trama.visibleParaJugadores === true;
    }

    cancelarEdicionTrama(): void {
        this.editingTramaId = null;
        this.editingTramaDraft = '';
        this.editingTramaVisibleParaJugadores = true;
        this.tramaSaveInFlightId = null;
    }

    async guardarEdicionTrama(): Promise<void> {
        if (!this.editingTramaId || this.tramaSaveInFlightId === this.editingTramaId)
            return;
        if (!this.puedeLanzar(`campaign.trama.update.${this.editingTramaId}`))
            return;

        this.tramaSaveInFlightId = this.editingTramaId;
        try {
            await this.campanaSvc.updateTrama(this.editingTramaId, {
                nombre: this.editingTramaDraft,
                visibleParaJugadores: this.editingTramaVisibleParaJugadores,
            });
            this.showCampaignSuccess('Trama actualizada.');
            const selectedId = this.selectedCampaignId;
            this.cancelarEdicionTrama();
            if (selectedId)
                await this.loadCampaignSelection(selectedId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo actualizar la trama.', 'creation'));
        } finally {
            this.tramaSaveInFlightId = null;
        }
    }

    iniciarEdicionSubtrama(subtrama: CampaignSubtramaItem): void {
        this.editingSubtramaId = subtrama.id;
        this.editingSubtramaDraft = subtrama.nombre;
        this.editingSubtramaVisibleParaJugadores = subtrama.visibleParaJugadores === true;
    }

    cancelarEdicionSubtrama(): void {
        this.editingSubtramaId = null;
        this.editingSubtramaDraft = '';
        this.editingSubtramaVisibleParaJugadores = true;
        this.subtramaSaveInFlightId = null;
    }

    async guardarEdicionSubtrama(): Promise<void> {
        if (!this.editingSubtramaId || this.subtramaSaveInFlightId === this.editingSubtramaId)
            return;
        if (!this.puedeLanzar(`campaign.subtrama.update.${this.editingSubtramaId}`))
            return;

        this.subtramaSaveInFlightId = this.editingSubtramaId;
        try {
            await this.campanaSvc.updateSubtrama(this.editingSubtramaId, {
                nombre: this.editingSubtramaDraft,
                visibleParaJugadores: this.editingSubtramaVisibleParaJugadores,
            });
            this.showCampaignSuccess('Subtrama actualizada.');
            const selectedId = this.selectedCampaignId;
            this.cancelarEdicionSubtrama();
            if (selectedId)
                await this.loadCampaignSelection(selectedId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo actualizar la subtrama.', 'creation'));
        } finally {
            this.subtramaSaveInFlightId = null;
        }
    }

    actualizarNuevaSubtrama(tramaId: number, value: string): void {
        this.subtramaCreateDraftByTrama = {
            ...this.subtramaCreateDraftByTrama,
            [tramaId]: value,
        };
    }

    actualizarNuevaSubtramaVisible(tramaId: number, value: boolean): void {
        this.subtramaCreateVisibleByTrama = {
            ...this.subtramaCreateVisibleByTrama,
            [tramaId]: value === true,
        };
    }

    async crearSubtrama(tramaId: number): Promise<void> {
        if (!this.selectedCampaignCanManage || this.subtramaCreateSavingTramaId === tramaId)
            return;
        if (!this.puedeLanzar(`campaign.subtrama.create.${tramaId}`))
            return;

        this.subtramaCreateSavingTramaId = tramaId;
        try {
            await this.campanaSvc.createSubtrama(tramaId, {
                nombre: this.subtramaCreateDraftByTrama[tramaId] ?? '',
                visibleParaJugadores: this.subtramaCreateVisibleByTrama[tramaId] !== false,
            });
            this.subtramaCreateDraftByTrama = {
                ...this.subtramaCreateDraftByTrama,
                [tramaId]: '',
            };
            this.subtramaCreateVisibleByTrama = {
                ...this.subtramaCreateVisibleByTrama,
                [tramaId]: true,
            };
            this.showCampaignSuccess('Subtrama creada correctamente.');
            if (this.selectedCampaignId)
                await this.loadCampaignSelection(this.selectedCampaignId, true, this.selectedCampaignDetail?.includeInactiveMembers === true);
        } catch (error: any) {
            this.appToastSvc.showError(mensajeErrorDeAccion(this.userSvc, error, 'No se pudo crear la subtrama.', 'creation'));
        } finally {
            this.subtramaCreateSavingTramaId = null;
        }
    }

    isCampaignSelected(campaignId: number): boolean {
        return this.selectedCampaignId === campaignId;
    }

    isRemovingMember(uid: string): boolean {
        return this.memberRemoveInFlightUid === uid;
    }

    isAddingMember(uid: string): boolean {
        return this.memberInviteInFlightUid === uid;
    }

    isCancelingCampaignInvitation(inviteId: number): boolean {
        return this.campaignInviteCancelInFlightId === inviteId;
    }

    isEditingTrama(tramaId: number): boolean {
        return this.editingTramaId === tramaId;
    }

    isSavingTrama(tramaId: number): boolean {
        return this.tramaSaveInFlightId === tramaId;
    }

    isEditingSubtrama(subtramaId: number): boolean {
        return this.editingSubtramaId === subtramaId;
    }

    isSavingSubtrama(subtramaId: number): boolean {
        return this.subtramaSaveInFlightId === subtramaId;
    }

    getCampaignRoleLabel(role: string | null | undefined, isOwner: boolean = false): string {
        const normalized = `${role ?? ''}`.trim().toLowerCase();
        if (normalized === 'master')
            return 'Master';
        if (normalized === 'jugador')
            return 'Jugador';
        if (isOwner)
            return 'Creador';
        return 'Sin rol';
    }

    getMembershipStatusLabel(status: string | null | undefined): string {
        const normalized = `${status ?? ''}`.trim().toLowerCase();
        if (normalized === 'inactivo')
            return 'Inactivo';
        if (normalized === 'expulsado')
            return 'Expulsado';
        if (normalized === 'activo')
            return 'Activo';
        return 'Sin estado';
    }

    getCampaignVisibilityLabel(visibleParaJugadores: boolean | null | undefined): string {
        return visibleParaJugadores === false ? 'Solo master' : 'Visible para jugadores';
    }

    getUserDisplayLabel(displayName: string | null | undefined, email: string | null | undefined, uid: string): string {
        const nombre = `${displayName ?? ''}`.trim();
        if (nombre.length > 0)
            return nombre;
        const correo = `${email ?? ''}`.trim();
        if (correo.length > 0)
            return correo;
        return 'Usuario sin nombre';
    }

    formatOptionalDateTime(value: string | null | undefined, fallback: string = 'Sin dato'): string {
        return textoFechaHora(value, fallback);
    }


    trackByCampaignId(index: number, item: CampaignListItem): number {
        return item.id;
    }

    trackByMemberUid(index: number, item: CampaignMemberItem): string {
        return item.uid;
    }

    trackByTramaId(index: number, item: CampaignTramaItem): number {
        return item.id;
    }

    trackBySubtramaId(index: number, item: CampaignSubtramaItem): number {
        return item.id;
    }

    trackByUserUid(index: number, item: CampaignUserSearchResult): string {
        return item.uid;
    }

    private showCampaignSuccess(message: string): void {
        this.appToastSvc.showSuccess(message, { category: 'campanas' });
    }

    private showCampaignInfo(message: string): void {
        this.appToastSvc.showInfo(message, { category: 'campanas' });
    }

    private createDefaultCampaignPolicyDraft(): CampaignCreationPolicy {
        return {
            tiradaMinimaCaracteristica: 3,
            nepMaximoPersonajeNuevo: null,
            maxTablasDadosCaracteristicas: 1,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: false,
            permitirIgnorarRestriccionesAlineamiento: false,
            maxFuentesHomebrewGeneralesPorPersonaje: 0,
            permitirObjetosMagicos: true,
            permitirObjetosAMedida: true,
            precioMaximoPorObjeto: null,
            permitirCopiarConjuros: true,
            maxTiradasPuntosGolpe: this.campaignHpRollsMax,
        };
    }

    private buildCampaignPolicyForSave(): CampaignCreationPolicy {
        const homebrewMode = this.campaignHomebrewMode;
        const permitirHomebrewGeneral = homebrewMode === 'general';
        const maxFuentesHomebrew = homebrewMode === 'general'
            ? null
            : homebrewMode === 'limitado'
                ? this.normalizeCampaignHomebrewLimit(
                    this.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje,
                    1
                )
                : 0;
        return {
            tiradaMinimaCaracteristica: this.normalizeCampaignMinimumRoll(this.campaignCreatePolicyDraft.tiradaMinimaCaracteristica),
            nepMaximoPersonajeNuevo: this.normalizeCampaignMaxNep(this.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo),
            maxTablasDadosCaracteristicas: this.normalizeCampaignMaxTables(this.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas),
            permitirHomebrewGeneral,
            permitirVentajasDesventajas: homebrewMode !== 'none'
                && this.campaignCreatePolicyDraft.permitirVentajasDesventajas === true,
            permitirIgnorarRestriccionesAlineamiento: homebrewMode !== 'none'
                && this.campaignCreatePolicyDraft.permitirIgnorarRestriccionesAlineamiento === true,
            maxFuentesHomebrewGeneralesPorPersonaje: maxFuentesHomebrew,
            permitirObjetosMagicos: this.campaignCreatePolicyDraft.permitirObjetosMagicos !== false,
            permitirObjetosAMedida: this.campaignCreatePolicyDraft.permitirObjetosAMedida !== false,
            precioMaximoPorObjeto: normalizarPrecioMaximoPorPieza(this.campaignCreatePolicyDraft.precioMaximoPorObjeto),
            permitirCopiarConjuros: this.campaignCreatePolicyDraft.permitirCopiarConjuros !== false,
            maxTiradasPuntosGolpe: tiradasPuntosGolpe(this.campaignCreatePolicyDraft.maxTiradasPuntosGolpe),
        };
    }

    onCampaignMaxItemPriceBlur(): void {
        this.campaignCreatePolicyDraft.precioMaximoPorObjeto = normalizarPrecioMaximoPorPieza(this.campaignCreatePolicyDraft.precioMaximoPorObjeto);
    }

    private normalizeCampaignMinimumRoll(value: number | null | undefined): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return this.campaignMinimumRollMin;
        return Math.min(this.campaignMinimumRollMax, Math.max(this.campaignMinimumRollMin, parsed));
    }

    private normalizeCampaignMaxNep(value: number | null | undefined): number | null {
        if (value === null || value === undefined || `${value}`.trim() === '')
            return null;
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return null;
        return Math.min(this.campaignNepMax, Math.max(this.campaignNepMin, parsed));
    }

    private normalizeCampaignMaxTables(value: number | null | undefined): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return this.campaignMaxTablesMin;
        return Math.min(this.campaignMaxTablesMax, Math.max(this.campaignMaxTablesMin, parsed));
    }

    private normalizeCampaignHomebrewLimit(value: number | null | undefined, fallback: number): number {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed))
            return fallback;
        return Math.min(this.campaignHomebrewSourcesMax, Math.max(fallback, parsed));
    }

    private validateCampaignName(value: string | null | undefined): string | null {
        const name = `${value ?? ''}`.trim();
        if (name.length < this.campaignNameMinLength || name.length > this.campaignNameMaxLength)
            return `El nombre de campaña debe tener entre ${this.campaignNameMinLength} y ${this.campaignNameMaxLength} caracteres.`;
        if (this.isNumericOnlyText(name))
            return 'El nombre de campaña no puede estar formado solo por números.';
        return null;
    }

    private isNumericOnlyText(value: string | null | undefined): boolean {
        const compact = `${value ?? ''}`.replace(/\s+/g, '');
        return compact.length > 0 && /^\d+$/.test(compact);
    }


    async ensureCampaignSectionLoaded(force: boolean = false, preferredCampaignId?: number | null): Promise<void> {
        if (this.campaignsLoaded && !force) {
            if (this.selectedCampaignId && !this.selectedCampaignDetail)
                await this.loadCampaignSelection(this.selectedCampaignId, true);
            return;
        }
        await this.reloadCampaigns(preferredCampaignId ?? this.selectedCampaignId);
    }

    private async reloadCampaigns(preferredCampaignId?: number | null): Promise<void> {
        this.campaignsLoading = true;
        this.campaignsErrorMessage = '';
        try {
            const campaigns = await this.campanaSvc.listProfileCampaigns();
            this.campaigns = this.filterManageableCampaigns(campaigns);
            this.campaignsLoaded = true;

            const nextId = this.resolveNextSelectedCampaignId(preferredCampaignId);
            if (!nextId) {
                this.selectedCampaignId = null;
                this.selectedCampaignDetail = null;
                this.selectedCampaignErrorMessage = '';
                if (this.campaignWorkspaceMode !== 'create')
                    this.campaignWorkspaceMode = 'idle';
                this.campaignWorkspaceTab = 'usuarios';
                this.resetCampaignEditorToCreateMode();
                this.resetCampaignDetailEditors();
                return;
            }

            await this.loadCampaignSelection(nextId, true);
        } catch (error: any) {
            this.campaignsErrorMessage = mensajeErrorDeAccion(this.userSvc, error, 'No se pudieron cargar las campañas.');
            this.campaignsLoaded = false;
        } finally {
            this.campaignsLoading = false;
        }
    }

    private startCampaignSummariesWatch(): void {
        if (this.campaignSummariesWatchStop)
            return;

        this.campaignSummariesWatchStop = this.campanaSvc.watchCampaignSummaries(
            (items) => this.applyLiveCampaignSummaries(items),
            () => undefined
        );
    }

    private applyLiveCampaignSummaries(items: CampaignListItem[]): void {
        const previousManageable = [...this.campaigns];
        const previousById = new Map(previousManageable.map((campaign) => [campaign.id, campaign]));
        const incoming = Array.isArray(items) ? items : [];

        const merged = incoming.map((campaign) => ({
            ...previousById.get(campaign.id),
            ...campaign,
        }));

        const nextManageable = this.filterManageableCampaigns(merged);
        this.campaigns = nextManageable;
        this.campaignsLoaded = true;

        const selectedSummary = this.selectedCampaignId
            ? nextManageable.find((campaign) => campaign.id === this.selectedCampaignId) ?? null
            : null;
        if (selectedSummary && this.selectedCampaignDetail?.campaign?.id === selectedSummary.id) {
            this.selectedCampaignDetail = {
                ...this.selectedCampaignDetail,
                campaign: {
                    ...this.selectedCampaignDetail.campaign,
                    ...selectedSummary,
                },
            };
            if (!this.campaignRenameSaving)
                this.campaignRenameDraft = selectedSummary.nombre;
        }

        if (this.seccionAbierta && this.selectedCampaignId && !selectedSummary && !this.selectedCampaignLoading) {
            this.selectedCampaignId = null;
            this.selectedCampaignDetail = null;
            this.selectedCampaignErrorMessage = '';
            if (this.campaignWorkspaceMode !== 'create')
                this.campaignWorkspaceMode = 'idle';
            this.campaignWorkspaceTab = 'usuarios';
            this.resetCampaignEditorToCreateMode();
            this.resetCampaignDetailEditors();
        }

        if (this.campaignSummariesLiveReady) {
            const newlyManagedCampaigns = nextManageable.filter((campaign) => campaign.campaignRole === 'master'
                && previousById.get(campaign.id)?.campaignRole !== 'master');
            if (newlyManagedCampaigns.length > 0) {
                const campaignName = `${newlyManagedCampaigns[0]?.nombre ?? ''}`.trim();
                this.showCampaignInfo(
                    campaignName.length > 0
                        ? `Ahora eres Master de la campaña ${campaignName}.`
                        : 'Ahora eres Master de una campaña.'
                );
            }
        } else {
            this.campaignSummariesLiveReady = true;
        }
    }

    private resolveNextSelectedCampaignId(preferredCampaignId?: number | null): number | null {
        if (this.manageableCampaigns.length < 1)
            return null;

        const candidateIds = [
            preferredCampaignId,
            this.selectedCampaignId,
            this.manageableCampaigns[0]?.id ?? null,
        ];
        for (const candidate of candidateIds) {
            const normalized = Math.trunc(Number(candidate));
            if (normalized > 0 && this.manageableCampaigns.some((campaign) => campaign.id === normalized))
                return normalized;
        }
        return null;
    }

    private async loadCampaignSelection(
        campaignId: number,
        forceReload: boolean,
        includeInactiveOverride?: boolean
    ): Promise<void> {
        const id = Math.trunc(Number(campaignId));
        if (!Number.isFinite(id) || id <= 0)
            return;

        const includeInactive = includeInactiveOverride === undefined
            ? (forceReload && this.selectedCampaignDetail?.campaign.id === id
                ? this.selectedCampaignDetail.includeInactiveMembers === true
                : false)
            : includeInactiveOverride === true;

        if (!forceReload && this.selectedCampaignId === id && this.selectedCampaignDetail)
            return;

        this.selectedCampaignId = id;
        this.selectedCampaignLoading = true;
        this.selectedCampaignErrorMessage = '';
        this.memberSearchErrorMessage = '';
        this.transferSearchErrorMessage = '';

        try {
            const detail = await this.campanaSvc.getCampaignDetail(id, includeInactive);
            if (this.selectedCampaignId !== id)
                return;

            this.selectedCampaignDetail = detail;
            this.campaignRenameDraft = detail.campaign.nombre;
            this.syncCampaignEditorFromDetail(detail);
            this.maybePersistLegacyCampaignPolicyDefaults(detail);
            this.resetCampaignDetailEditors();
        } catch (error: any) {
            if (this.selectedCampaignId !== id)
                return;
            this.selectedCampaignDetail = null;
            this.selectedCampaignErrorMessage = mensajeErrorDeAccion(this.userSvc, error, 'No se pudo cargar el detalle de la campaña.');
        } finally {
            if (this.selectedCampaignId === id)
                this.selectedCampaignLoading = false;
        }
    }

    private resetCampaignDetailEditors(): void {
        this.clearSearchTimer('member');
        this.clearSearchTimer('transfer');
        this.memberSearchQuery = '';
        this.memberSearchResults = [];
        this.memberSearchLoading = false;
        this.memberSearchErrorMessage = '';
        this.memberInviteInFlightUid = '';
        this.memberRemoveInFlightUid = '';
        this.transferSearchQuery = '';
        this.transferSearchResults = [];
        this.transferSearchLoading = false;
        this.transferSearchErrorMessage = '';
        this.transferSelectedUser = null;
        this.transferSaving = false;
        this.transferCancelInFlight = false;
        this.memberInviteEmailDraft = '';
        this.memberInviteEmailSending = false;
        this.joinRequestInFlightId = null;
        this.tramaCreateDraft = '';
        this.tramaCreateVisibleParaJugadores = true;
        this.tramaCreateSaving = false;
        this.editingTramaId = null;
        this.editingTramaDraft = '';
        this.editingTramaVisibleParaJugadores = true;
        this.tramaSaveInFlightId = null;
        this.editingSubtramaId = null;
        this.editingSubtramaDraft = '';
        this.editingSubtramaVisibleParaJugadores = true;
        this.subtramaSaveInFlightId = null;
        this.subtramaCreateDraftByTrama = {};
        this.subtramaCreateVisibleByTrama = {};
        this.subtramaCreateSavingTramaId = null;
    }

    private resetCampaignEditorToCreateMode(): void {
        this.campaignCreateDraft = '';
        this.campaignCreatePolicyDraft = this.createDefaultCampaignPolicyDraft();
        this.campaignRenameDraft = '';
    }

    private syncCampaignEditorFromDetail(detail: CampaignDetailViewModel): void {
        this.campaignCreateDraft = `${detail?.campaign?.nombre ?? ''}`.trim();
        this.campaignCreatePolicyDraft = this.hydrateCampaignPolicyDraft(detail?.politicaCreacion ?? null);
        this.campaignRenameDraft = this.campaignCreateDraft;
    }

    private hydrateCampaignPolicyDraft(source: Partial<CampaignCreationPolicy> | null | undefined): CampaignCreationPolicy {
        const defaults = this.createDefaultCampaignPolicyDraft();
        const rawMinimo = source?.tiradaMinimaCaracteristica;
        const rawNep = source?.nepMaximoPersonajeNuevo;
        const rawTablas = source?.maxTablasDadosCaracteristicas;
        const permitirHomebrewGeneral = source?.permitirHomebrewGeneral === true;
        const maxFuentesRaw = source?.maxFuentesHomebrewGeneralesPorPersonaje;
        const maxFuentes = maxFuentesRaw === null || maxFuentesRaw === undefined
            ? defaults.maxFuentesHomebrewGeneralesPorPersonaje
            : this.normalizeCampaignHomebrewLimit(maxFuentesRaw, defaults.maxFuentesHomebrewGeneralesPorPersonaje ?? 0);

        return {
            tiradaMinimaCaracteristica: rawMinimo === null || rawMinimo === undefined
                ? defaults.tiradaMinimaCaracteristica
                : this.normalizeCampaignMinimumRoll(rawMinimo),
            nepMaximoPersonajeNuevo: rawNep === null || rawNep === undefined
                ? defaults.nepMaximoPersonajeNuevo
                : this.normalizeCampaignMaxNep(rawNep),
            maxTablasDadosCaracteristicas: rawTablas === null || rawTablas === undefined
                ? defaults.maxTablasDadosCaracteristicas
                : this.normalizeCampaignMaxTables(rawTablas),
            permitirHomebrewGeneral,
            permitirVentajasDesventajas: source?.permitirVentajasDesventajas === true,
            permitirIgnorarRestriccionesAlineamiento: source?.permitirIgnorarRestriccionesAlineamiento === true,
            maxFuentesHomebrewGeneralesPorPersonaje: permitirHomebrewGeneral ? null : maxFuentes,
            permitirObjetosMagicos: source?.permitirObjetosMagicos !== false,
            permitirObjetosAMedida: source?.permitirObjetosAMedida !== false,
            precioMaximoPorObjeto: normalizarPrecioMaximoPorPieza(source?.precioMaximoPorObjeto),
            permitirCopiarConjuros: source?.permitirCopiarConjuros !== false,
            maxTiradasPuntosGolpe: tiradasPuntosGolpe(source?.maxTiradasPuntosGolpe),
        };
    }

    private maybePersistLegacyCampaignPolicyDefaults(detail: CampaignDetailViewModel | null): void {
        const campaignId = Number(detail?.campaign?.id ?? 0);
        if (!Number.isFinite(campaignId) || campaignId <= 0)
            return;
        if (detail?.campaign?.campaignRole !== 'master')
            return;
        if (this.campaignPolicyAutofixInFlight.has(campaignId))
            return;

        const rawPolicy = detail?.politicaCreacion;
        const needsDefaults = rawPolicy?.tiradaMinimaCaracteristica === null
            || rawPolicy?.tiradaMinimaCaracteristica === undefined
            || rawPolicy?.maxTablasDadosCaracteristicas === null
            || rawPolicy?.maxTablasDadosCaracteristicas === undefined;
        if (!needsDefaults)
            return;

        this.campaignPolicyAutofixInFlight.add(campaignId);
        const normalizedPolicy = this.hydrateCampaignPolicyDraft(rawPolicy);
        void this.campanaSvc.updateCampaign(campaignId, {
            politicaCreacion: normalizedPolicy,
        }).finally(() => {
            this.campaignPolicyAutofixInFlight.delete(campaignId);
        });
    }

    private filterManageableCampaigns(campaigns: CampaignListItem[]): CampaignListItem[] {
        return (campaigns ?? [])
            .filter((campaign) => campaign?.campaignRole === 'master')
            .sort((a, b) => compararTexto(a.nombre, b.nombre));
    }

    private scheduleUserSearch(kind: 'member' | 'transfer'): void {
        this.clearSearchTimer(kind);

        const query = kind === 'member'
            ? `${this.memberSearchQuery ?? ''}`.trim()
            : `${this.transferSearchQuery ?? ''}`.trim();
        if (query.length < 2) {
            if (kind === 'member') {
                this.memberSearchResults = [];
                this.memberSearchLoading = false;
            } else {
                this.transferSearchResults = [];
                this.transferSearchLoading = false;
            }
            return;
        }

        const timerId = window.setTimeout(() => {
            void this.runUserSearch(kind, query);
        }, 250);

        if (kind === 'member')
            this.memberSearchTimerId = timerId;
        else
            this.transferSearchTimerId = timerId;
    }

    private clearSearchTimer(kind: 'member' | 'transfer'): void {
        const timerId = kind === 'member' ? this.memberSearchTimerId : this.transferSearchTimerId;
        if (timerId !== null)
            window.clearTimeout(timerId);
        if (kind === 'member')
            this.memberSearchTimerId = null;
        else
            this.transferSearchTimerId = null;
    }

    private async runUserSearch(kind: 'member' | 'transfer', expectedQuery: string): Promise<void> {
        const currentQuery = kind === 'member'
            ? `${this.memberSearchQuery ?? ''}`.trim()
            : `${this.transferSearchQuery ?? ''}`.trim();
        if (currentQuery !== expectedQuery)
            return;

        if (kind === 'member') {
            this.memberSearchLoading = true;
            this.memberSearchErrorMessage = '';
        } else {
            this.transferSearchLoading = true;
            this.transferSearchErrorMessage = '';
        }

        try {
            const results = await this.campanaSvc.searchUsers(expectedQuery);
            if ((kind === 'member' ? `${this.memberSearchQuery ?? ''}`.trim() : `${this.transferSearchQuery ?? ''}`.trim()) !== expectedQuery)
                return;

            const filteredResults = this.filterCampaignSearchResults(kind, results);

            if (kind === 'member')
                this.memberSearchResults = filteredResults;
            else
                this.transferSearchResults = filteredResults;
        } catch (error: any) {
            const message = mensajeErrorDeAccion(this.userSvc, error, 'No se pudo buscar usuarios.');
            if (kind === 'member') {
                this.memberSearchResults = [];
                this.memberSearchErrorMessage = message;
            } else {
                this.transferSearchResults = [];
                this.transferSearchErrorMessage = message;
            }
        } finally {
            if (kind === 'member')
                this.memberSearchLoading = false;
            else
                this.transferSearchLoading = false;
        }
    }

    private filterCampaignSearchResults(kind: 'member' | 'transfer', results: CampaignUserSearchResult[]): CampaignUserSearchResult[] {
        const currentMemberUids = new Set(
            this.selectedCampaignMembers
                .map((member) => `${member.uid ?? ''}`.trim())
                .filter((uid) => uid.length > 0)
        );
        const invitedUids = new Set(
            this.selectedCampaignPendingInvitations
                .map((invitation) => `${invitation.cuenta ?? ''}`.trim())
                .filter((uid) => uid.length > 0)
        );
        const currentActorUid = `${this.uidActual ?? ''}`.trim();

        return (results ?? []).filter((result) => {
            const uid = `${result?.uid ?? ''}`.trim();
            if (uid.length < 1)
                return false;
            if (uid === currentActorUid)
                return false;

            if (kind === 'member')
                return !currentMemberUids.has(uid) && !invitedUids.has(uid);

            return uid !== `${this.selectedCampaignMaster?.uid ?? ''}`.trim();
        });
    }

    private async handleCampaignRealtimeEvent(event: CampaignRealtimeEvent): Promise<void> {
        if (!this.seccionAbierta)
            return;

        await this.reloadCampaigns(this.selectedCampaignId ?? event.campaignId);
    }
}
