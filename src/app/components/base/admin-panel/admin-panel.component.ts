import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { CACHE_CONTRACT_MANIFEST, CacheEntityKey } from 'src/app/config/cache-contract-manifest';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { DoteService } from 'src/app/services/dote.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { EspecialService } from 'src/app/services/especial.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ListaPersonajesService } from 'src/app/services/listas/lista-personajes.service';
import { ManualService } from 'src/app/services/manual.service';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RacialService } from 'src/app/services/racial.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { RazaService } from 'src/app/services/raza.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { VerifyConnectionService } from 'src/app/services/utils/verify-connection.service';
import { VentajaService } from 'src/app/services/ventaja.service';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { CacheSyncMetadataService, CacheSyncUiState } from 'src/app/services/cache-sync-metadata.service';
import { AmbitoService } from 'src/app/services/ambito.service';
import { DeidadService } from 'src/app/services/deidad.service';
import { DominioService } from 'src/app/services/dominio.service';
import { PabellonService } from 'src/app/services/pabellon.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { RegionService } from 'src/app/services/region.service';
import { UserService } from 'src/app/services/user.service';
import { AdminUserRow, AdminUsersService } from 'src/app/services/admin-users.service';
import { PERMISSION_RESOURCES, PermissionResource, UserRole } from 'src/app/interfaces/user-acl';
import { EnemigoPredilectoService } from 'src/app/services/enemigo-predilecto.service';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { ExtraService } from 'src/app/services/extra.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { SubdisciplinaConjurosService } from 'src/app/services/subdisciplina-conjuros.service';
import { AdminPanelOpenRequest } from 'src/app/interfaces/user-account';
import { AdminRoleRequestItem } from 'src/app/interfaces/user-role-request';
import { ChatAlertCandidate } from 'src/app/interfaces/chat';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import {
    AdminModerationCaseModalMode,
    AdminModerationCaseModalSubmit,
    AdminPolicyDraftDto,
    CreationAuditEventDetailDto,
    CreationAuditEventSummaryDto,
    CreationAuditResultCode,
    ModerationAdminHistoryItemDto,
    ModerationAdminHistoryResponseDto,
    ModerationCaseListItemDto,
    ModerationCasePatchRequestDto,
    ModerationCaseSourceMode,
    ModerationCaseStageDto,
    ModerationCaseStagesReplaceRequestDto,
    ModerationIncidentCreateRequestDto,
    ModerationIncidentListItemDto,
    ModerationProgressCaseDto,
    ModerationSanctionListItemDto,
    ModerationSanctionRevokeRequestDto,
    UsuarioAclResponseDto,
} from 'src/app/interfaces/usuarios-api';
import { UsuariosApiService } from 'src/app/services/usuarios-api.service';
import {
    UserComplianceActivePolicy,
    UserCompliancePolicyKind,
    UserModerationHistoryResult,
    UserModerationSanction,
} from 'src/app/interfaces/user-moderation';

interface SyncItemConfig {
    key: CacheEntityKey;
    label: string;
    schemaVersion: number;
    run: () => Promise<boolean>;
}

interface SyncItemUi extends SyncItemConfig, CacheSyncUiState {
    lastSuccessTexto: string;
}

interface AdminPolicyPanelItem {
    kind: UserCompliancePolicyKind;
    draft: AdminPolicyDraftDto | null;
    active: UserComplianceActivePolicy | null;
}

type AdminPanelViewSectionId = 'usuarios' | 'role-requests' | 'moderacion' | 'auditoria' | 'sync';

interface AdminPanelSectionItem {
    id: AdminPanelViewSectionId;
    label: string;
    icon: string;
    hint: string;
}

interface AdminModerationCaseModalState {
    mode: AdminModerationCaseModalMode;
    item: ModerationCaseListItemDto | null;
}

@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass'],
    standalone: false
})
export class AdminPanelComponent implements OnInit, OnDestroy {
    @Input() openRequest: AdminPanelOpenRequest | null = null;

    hasCon?: boolean;
    esAdmin: boolean = false;
    cargandoUsuarios: boolean = true;
    errorUsuarios: string = '';
    filtroUsuarios: string = '';
    sincronizandoUsuariosApi: boolean = false;
    estadoSyncUsuariosApi: string = '';
    descargandoBackupSql: boolean = false;
    estadoBackupSql: string = '';
    usuariosAdmin: AdminUserRow[] = [];
    readonly permissionResources = PERMISSION_RESOURCES;
    readonly roleOptions: UserRole[] = ['jugador', 'master', 'colaborador', 'admin'];
    serverStatusIcon: string = 'question_mark';
    serverStatus: string = 'Verificar conexión';
    syncItems: SyncItemUi[] = [];
    syncItemsOrdenados: SyncItemUi[] = [];
    solicitudesMasterPendientes: AdminRoleRequestItem[] = [];
    solicitudesColaboradorPendientes: AdminRoleRequestItem[] = [];
    solicitudesAprobadas: AdminRoleRequestItem[] = [];
    solicitudesRechazadas: AdminRoleRequestItem[] = [];
    cargandoSolicitudesRol: boolean = false;
    errorSolicitudesRol: string = '';
    roleRequestsSqlAccessDenied: boolean = false;
    currentSection: AdminPanelViewSectionId = 'usuarios';
    resaltarSolicitudesPendientes: boolean = false;
    politicasModeracion: AdminPolicyPanelItem[] = [];
    supuestosModerables: ModerationCaseListItemDto[] = [];
    incidenciasModeracion: ModerationIncidentListItemDto[] = [];
    sancionesModeracion: ModerationSanctionListItemDto[] = [];
    cargandoModeracionAdmin: boolean = false;
    errorModeracionAdmin: string = '';
    moderacionUsuarioUid: string = '';
    previewModeracionUsuario: UsuarioAclResponseDto | null = null;
    historialModeracionUsuario: ModerationAdminHistoryResponseDto | null = null;
    cargandoHistorialModeracionUsuario: boolean = false;
    errorHistorialModeracionUsuario: string = '';
    historialModeracionUsuarioLimit = 10;
    historialModeracionUsuarioOffset = 0;
    auditoriaCreaciones: CreationAuditEventSummaryDto[] = [];
    cargandoAuditoriaCreaciones: boolean = false;
    errorAuditoriaCreaciones: string = '';
    auditoriaCreacionesActorUid = '';
    auditoriaCreacionesActionCode = '';
    auditoriaCreacionesResult: '' | CreationAuditResultCode = '';
    auditoriaCreacionesResourceType = '';
    auditoriaCreacionesFrom = '';
    auditoriaCreacionesTo = '';
    auditoriaCreacionesLimit = 25;
    auditoriaCreacionesOffset = 0;
    auditoriaCreacionesTotal = 0;
    detalleAuditoriaCreacion: CreationAuditEventDetailDto | null = null;
    cargandoDetalleAuditoriaCreacion: boolean = false;
    errorDetalleAuditoriaCreacion: string = '';
    usuarioPermisosModal: AdminUserRow | null = null;
    usuarioHistorialModeracionModal: AdminUserRow | null = null;
    guardandoPermisosUsuario: boolean = false;
    usuarioSancionModal: AdminUserRow | null = null;
    registrandoSancionUsuario: boolean = false;
    casoModeracionModal: AdminModerationCaseModalState | null = null;
    guardandoCasoModeracion: boolean = false;
    private auditoriaCreacionesLoadedOnce: boolean = false;
    readonly sectionItems: AdminPanelSectionItem[] = [
        { id: 'usuarios', label: 'Usuarios', icon: 'manage_accounts', hint: 'Sanciones, roles y permisos de creación.' },
        { id: 'role-requests', label: 'Solicitudes de rol', icon: 'pending_actions', hint: 'Peticiones pendientes e historico.' },
        { id: 'moderacion', label: 'Moderacion', icon: 'gavel', hint: 'Politicas, incidencias y sanciones.' },
        { id: 'auditoria', label: 'Auditoria REST', icon: 'history', hint: 'Eventos de creacion y detalle HTTP.' },
        { id: 'sync', label: 'Sincronizacion', icon: 'sync_alt', hint: 'Herramientas de cache y resincronizacion.' },
    ];

    private readonly destroy$ = new Subject<void>();
    private readonly keysEjecutando = new Set<CacheEntityKey>();
    private readonly userOpsInFlight = new Set<string>();
    private readonly roleRequestOpsInFlight = new Set<number>();
    private roleRequestsLoadedOnce: boolean = false;
    private moderacionAdminLoadedOnce: boolean = false;
    private readonly dateFormatter = new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    private readonly syncRunners: Record<CacheEntityKey, () => Promise<boolean>>;

    constructor(
        private conSvc: VerifyConnectionService,
        private pSvc: PersonajeService,
        private lpSvc: ListaPersonajesService,
        private rSvc: RazaService,
        private mSvc: ManualService,
        private manualesAsociadosSvc: ManualesAsociadosService,
        private tcSvc: TipoCriaturaService,
        private subtipoSvc: SubtipoService,
        private raSvc: RasgoService,
        private coSvc: ConjuroService,
        private escSvc: EscuelaConjurosService,
        private disSvc: DisciplinaConjurosService,
        private subdisSvc: SubdisciplinaConjurosService,
        private extraSvc: ExtraService,
        private aSvc: AlineamientoService,
        private plSvc: PlantillaService,
        private doSvc: DoteService,
        private clSvc: ClaseService,
        private espSvc: EspecialService,
        private racialSvc: RacialService,
        private habSvc: HabilidadService,
        private idiSvc: IdiomaService,
        private enemigoPredilectoSvc: EnemigoPredilectoService,
        private monstruoSvc: MonstruoService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private tamanoSvc: TamanoService,
        private grupoArmaSvc: GrupoArmaService,
        private grupoArmaduraSvc: GrupoArmaduraService,
        private dominioSvc: DominioService,
        private regionSvc: RegionService,
        private ambitoSvc: AmbitoService,
        private pabellonSvc: PabellonService,
        private deidadSvc: DeidadService,
        private ventajaSvc: VentajaService,
        private cacheSyncMetadataSvc: CacheSyncMetadataService,
        private userSvc: UserService,
        private adminUsersSvc: AdminUsersService,
        private usuariosApiSvc: UsuariosApiService,
        private userProfileApiSvc: UserProfileApiService,
        private chatRealtimeSvc: ChatRealtimeService,
    ) {
        this.syncRunners = {
            lista_personajes: () => this.lpSvc.RenovarPersonajesSimples(),
            personajes: () => this.pSvc.RenovarPersonajes(),
            monstruos: () => this.monstruoSvc.RenovarMonstruos(),
            familiares: () => this.monstruoSvc.RenovarFamiliares(),
            companeros: () => this.monstruoSvc.RenovarCompaneros(),
            razas: () => this.rSvc.RenovarRazas(),
            manuales: () => this.mSvc.RenovarManuales(),
            manuales_asociados: () => this.manualesAsociadosSvc.RenovarManualesAsociados(),
            tipos_criatura: () => this.tcSvc.RenovarTiposCriatura(),
            subtipos: () => this.subtipoSvc.RenovarSubtipos(),
            rasgos: () => this.raSvc.RenovarRasgos(),
            conjuros: () => this.coSvc.RenovarConjuros(),
            extras: () => this.extraSvc.RenovarExtras(),
            dotes: () => this.doSvc.RenovarDotes(),
            clases: () => this.clSvc.RenovarClases(),
            especiales: () => this.espSvc.RenovarEspeciales(),
            raciales: () => this.racialSvc.RenovarRaciales(),
            escuelas_conjuros: () => this.escSvc.RenovarEscuelas(),
            disciplinas_conjuros: () => this.disSvc.RenovarDisciplinas(),
            subdisciplinas_conjuros: () => this.subdisSvc.RenovarSubdisciplinas(),
            alineamientos: () => this.aSvc.RenovarAlineamientos(),
            alineamientos_basicos: () => this.aSvc.RenovarAlineamientosBasicos(),
            alineamientos_combinaciones: () => this.aSvc.RenovarAlineamientosCombinaciones(),
            alineamientos_prioridades: () => this.aSvc.RenovarAlineamientosPrioridades(),
            alineamientos_preferencia_ley: () => this.aSvc.RenovarAlineamientosPreferenciaLey(),
            alineamientos_preferencia_moral: () => this.aSvc.RenovarAlineamientosPreferenciaMoral(),
            habilidades: () => this.habSvc.RenovarHabilidades(),
            habilidades_custom: () => this.habSvc.RenovarHabilidadesCustom(),
            idiomas: () => this.idiSvc.RenovarIdiomas(),
            enemigos_predilectos: () => this.enemigoPredilectoSvc.RenovarEnemigosPredilectos(),
            tamanos: () => this.tamanoSvc.RenovarTamanos(),
            armas: () => this.armaSvc.RenovarArmas(),
            armaduras: () => this.armaduraSvc.RenovarArmaduras(),
            grupos_armas: () => this.grupoArmaSvc.RenovarGruposArmas(),
            grupos_armaduras: () => this.grupoArmaduraSvc.RenovarGruposArmaduras(),
            dominios: () => this.dominioSvc.RenovarDominios(),
            regiones: () => this.regionSvc.RenovarRegiones(),
            ambitos: () => this.ambitoSvc.RenovarAmbitos(),
            pabellones: () => this.pabellonSvc.RenovarPabellones(),
            deidades: () => this.deidadSvc.RenovarDeidades(),
            plantillas: () => this.plSvc.RenovarPlantillas(),
            ventajas_desventajas: () => this.ventajaSvc.RenovarVentajasYDesventajas(),
            usuarios_acl_cache: () => this.adminUsersSvc.syncUsersCacheFromApi(),
        };
    }

    ngOnInit(): void {
        this.userSvc.esAdmin$
            .pipe(takeUntil(this.destroy$))
            .subscribe((estado) => {
                this.esAdmin = estado === true;
                if (this.esAdmin)
                    void this.validarAccesoAdmin();
            });
        this.chatRealtimeSvc.alertCandidate$
            .pipe(takeUntil(this.destroy$))
            .subscribe((candidate) => {
                if (!this.esAdmin || !this.isRealtimeRoleRequestNotification(candidate))
                    return;
                if (this.currentSection === 'role-requests' && this.roleRequestsLoadedOnce)
                    void this.cargarSolicitudesRolPendientes();
            });
        this.adminUsersSvc.watchUsersAdminView()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (rows: AdminUserRow[]) => {
                    this.usuariosAdmin = rows;
                    this.cargandoUsuarios = false;
                    this.errorUsuarios = '';
                },
                error: (error: any) => {
                    this.errorUsuarios = error?.message ?? 'No se pudieron cargar los usuarios';
                    this.cargandoUsuarios = false;
                }
            });
        this.verificar();
        this.cacheSyncMetadataSvc.watchAll()
            .pipe(takeUntil(this.destroy$))
            .subscribe(metaByKey => {
                const uiStateByKey = new Map(
                    this.cacheSyncMetadataSvc
                        .buildUiState(metaByKey)
                        .map((state) => [state.key, state] as [CacheEntityKey, CacheSyncUiState])
                );

                this.syncItems = CACHE_CONTRACT_MANIFEST.map((entry) => {
                    const state = uiStateByKey.get(entry.key);
                    return {
                        key: entry.key,
                        label: entry.label,
                        schemaVersion: entry.schemaVersion,
                        run: this.syncRunners[entry.key],
                        lastSuccessAt: state?.lastSuccessAt ?? null,
                        lastSuccessIso: state?.lastSuccessIso ?? null,
                        isPrimary: state?.isPrimary ?? true,
                        lastSuccessTexto: this.formatearFecha(state?.lastSuccessAt ?? null),
                    };
                });
                this.syncItemsOrdenados = this.ordenarSyncItems(this.syncItems);
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['openRequest']?.currentValue)
            this.aplicarOpenRequest(changes['openRequest'].currentValue);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    verificar() {
        this.serverStatusIcon = 'question_mark';
        this.serverStatus = 'Verificando...';
        this.conSvc.verifyCon().subscribe(isConnected => {
            if (isConnected) {
                this.serverStatusIcon = 'thumb_up';
                this.serverStatus = 'Conexión establecida';
            } else {
                this.serverStatusIcon = 'thumb_down';
                this.serverStatus = 'Error en la conexión';
            }
        });
    }

    private ordenarSyncItems(items: SyncItemUi[]): SyncItemUi[] {
        return [...items].sort((a, b) => {
            if (a.isPrimary !== b.isPrimary)
                return a.isPrimary ? -1 : 1;
            return a.label.localeCompare(b.label, 'es', { sensitivity: 'base' });
        });
    }

    async ejecutarSync(item: SyncItemUi): Promise<void> {
        if (!this.esAdmin)
            return;
        if (this.keysEjecutando.has(item.key))
            return;

        try {
            await this.adminUsersSvc.assertAdminAccess();
        } catch (error: any) {
            this.errorUsuarios = error?.message ?? 'No autorizado';
            this.userSvc.setCanonicalAdminAccess(false);
            this.esAdmin = false;
            return;
        }

        this.keysEjecutando.add(item.key);
        try {
            const ok = await item.run();
            if (ok)
                await this.cacheSyncMetadataSvc.markSuccess(item.key, item.schemaVersion);
        } catch (error: any) {
            this.errorUsuarios = error?.message ?? 'No se pudo ejecutar la sincronización';
        } finally {
            this.keysEjecutando.delete(item.key);
        }
    }

    estaEjecutando(key: CacheEntityKey): boolean {
        return this.keysEjecutando.has(key);
    }

    private formatearFecha(lastSuccessAt: number | null): string {
        if (!lastSuccessAt)
            return 'Sin cacheo';

        return this.dateFormatter.format(new Date(lastSuccessAt)).replace(',', '');
    }

    trackBySyncItem(index: number, item: SyncItemUi): CacheEntityKey {
        return item.key;
    }

    get usuariosFiltrados(): AdminUserRow[] {
        const filtro = this.normalizarTexto(this.filtroUsuarios);
        if (filtro.length < 1)
            return this.usuariosAdmin;

        return this.usuariosAdmin.filter((row) => {
            const nombre = this.normalizarTexto(row.displayName);
            const correo = this.normalizarTexto(row.email);
            const uid = this.normalizarTexto(row.uid);
            return nombre.includes(filtro) || correo.includes(filtro) || uid.includes(filtro);
        });
    }

    get etiquetaEstadoUsuarios(): string {
        if (this.cargandoUsuarios)
            return 'Cargando usuarios...';
        if (this.errorUsuarios.length > 0)
            return this.errorUsuarios;
        if (this.usuariosFiltrados.length < 1)
            return 'No hay usuarios que coincidan con el filtro actual';
        return '';
    }

    get etiquetaEstadoSolicitudesRol(): string {
        if (this.cargandoSolicitudesRol)
            return 'Cargando solicitudes...';
        if (this.errorSolicitudesRol.length > 0)
            return this.errorSolicitudesRol;
        return '';
    }

    get haySolicitudesRolPendientes(): boolean {
        return this.solicitudesMasterPendientes.length > 0 || this.solicitudesColaboradorPendientes.length > 0;
    }

    get pendingRoleRequestsCount(): number {
        return this.solicitudesMasterPendientes.length + this.solicitudesColaboradorPendientes.length;
    }

    get hayHistorialSolicitudesRol(): boolean {
        return this.solicitudesAprobadas.length > 0 || this.solicitudesRechazadas.length > 0;
    }

    get noHaySolicitudesRol(): boolean {
        return !this.haySolicitudesRolPendientes && !this.hayHistorialSolicitudesRol;
    }

    providerLabel(provider: string): string {
        const normalizado = this.normalizarTexto(provider);
        if (normalizado === 'correo')
            return 'Correo';
        if (normalizado === 'google')
            return 'Google';
        return 'Otro';
    }

    roleLabel(role: UserRole): string {
        if (role === 'admin')
            return 'Admin';
        if (role === 'colaborador')
            return 'Colaborador';
        if (role === 'master')
            return 'Master';
        return 'Jugador';
    }

    moderationSummaryLabel(row: AdminUserRow): string {
        if (this.isSystemEntityRow(row))
            return 'Moderación: no aplica a entidades del sistema';
        const summary = row.moderationSummary;
        if (!summary)
            return 'Moderación: sin resumen';
        if (summary.incidentCount < 1 && summary.sanctionCount < 1 && !summary.activeSanction)
            return 'Moderación: sin historial confirmado';
        return `Moderación: ${summary.incidentCount} incidencias · ${summary.sanctionCount} sanciones`;
    }

    moderationSummaryDetailLabel(row: AdminUserRow): string {
        if (this.isSystemEntityRow(row))
            return '';
        const summary = row.moderationSummary;
        if (!summary)
            return '';
        if (summary.activeSanction) {
            const label = `${summary.activeSanction.name ?? summary.activeSanction.code ?? summary.activeSanction.kind ?? 'Sanción'}`.trim();
            if (summary.activeSanction.isPermanent)
                return `Activa: ${label} permanente`;
            if (`${summary.activeSanction.endsAtUtc ?? ''}`.trim().length > 0)
                return `Activa hasta ${this.formatearFechaUtc(summary.activeSanction.endsAtUtc, 'fecha no disponible')}`;
            return `Activa: ${label}`;
        }
        if (summary.lastSanctionAtUtc)
            return `Última sanción: ${this.formatearFechaUtc(summary.lastSanctionAtUtc)}`;
        if (summary.lastIncidentAtUtc)
            return `Última incidencia: ${this.formatearFechaUtc(summary.lastIncidentAtUtc)}`;
        return '';
    }

    policyKindLabel(kind: UserCompliancePolicyKind): string {
        return kind === 'creation' ? 'Normas de creación' : 'Normas de uso';
    }

    policyVersionLabel(item: AdminPolicyPanelItem): string {
        const draftVersion = `${item?.draft?.version ?? ''}`.trim();
        const activeVersion = `${item?.active?.version ?? ''}`.trim();
        return draftVersion || activeVersion || 'Sin versión';
    }

    policyExcerpt(item: AdminPolicyPanelItem): string {
        const text = `${item?.draft?.markdown ?? item?.active?.markdown ?? ''}`
            .replace(/\s+/g, ' ')
            .trim();
        if (text.length < 1)
            return 'Sin contenido visible';
        if (text.length <= 220)
            return text;
        return `${text.slice(0, 220).trim()}...`;
    }

    moderationCaseLabel(item: ModerationCaseListItemDto): string {
        return `${item?.name ?? item?.code ?? 'Caso sin nombre'}`.trim();
    }

    moderationCaseSourceModeLabel(value: ModerationCaseSourceMode | string | null | undefined): string {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'technical_signal_auto')
            return 'Señal técnica automática';
        return normalized.length > 0 ? 'Manual admin' : 'Sin modo';
    }

    moderationCaseStatusLabel(item: ModerationCaseListItemDto | null | undefined): string {
        if (!item)
            return 'Sin estado';
        if (item.isDeleted || item.deleted)
            return 'Eliminado lógico';
        if (item.enabled === false)
            return 'Deshabilitado';
        return 'Activo';
    }

    moderationCaseOriginLabel(item: ModerationCaseListItemDto | null | undefined): string {
        if (item?.originType === 'system_seed')
            return 'Seed del sistema';
        if (item?.originType === 'admin_custom')
            return 'Custom admin';
        return 'Origen n/d';
    }

    moderationStageLabel(stage: ModerationCaseStageDto): string {
        const threshold = stage.reportThreshold !== null ? `umbral ${stage.reportThreshold}` : 'umbral n/d';
        const sanction = this.moderationSanctionNameFromParts(stage.sanctionName, stage.sanctionCode, stage.sanctionKind);
        const duration = this.moderationStageDurationLabel(stage);
        return `Etapa ${stage.stageIndex}: ${threshold} -> ${sanction}${duration ? ` (${duration})` : ''}`;
    }

    moderationIncidentTargetLabel(item: ModerationIncidentListItemDto | ModerationSanctionListItemDto | ModerationAdminHistoryItemDto | null | undefined): string {
        return `${item?.targetDisplayName ?? item?.targetUid ?? 'Sin usuario'}`.trim();
    }

    moderationResultLabel(result: UserModerationHistoryResult | null | undefined): string {
        if (result === 'reported')
            return 'Reportada';
        if (result === 'sanctioned')
            return 'Sancionada';
        if (result === 'banned')
            return 'Ban efectivo';
        return 'Sin resultado';
    }

    moderationModeLabel(mode: string | null | undefined): string {
        const normalized = `${mode ?? ''}`.trim().toLowerCase();
        if (normalized === 'force_sanction')
            return 'Sanción forzada';
        if (normalized === 'report')
            return 'Reporte';
        if (normalized === 'technical_signal_auto')
            return 'Señal técnica';
        return normalized.length > 0 ? normalized : 'Sin modo';
    }

    moderationProgressLabel(item: ModerationProgressCaseDto): string {
        const stage = item.currentStageIndex !== null ? `Etapa ${item.currentStageIndex}` : 'Etapa n/d';
        const pending = item.pendingReports !== null ? `${item.pendingReports} pendientes` : 'pendientes n/d';
        const sanction = item.activeSanction ? ` · ${this.moderationSanctionLabel(item.activeSanction)}` : '';
        return `${stage} · ${pending}${sanction}`;
    }

    moderationSanctionLabel(sanction: UserModerationSanction | ModerationSanctionListItemDto | null | undefined): string {
        if (!sanction)
            return 'Sin sanción';

        const label = this.moderationSanctionNameFromParts(sanction.name, sanction.code, sanction.kind);
        if (sanction.isPermanent)
            return `${label} permanente`;
        if (`${sanction.endsAtUtc ?? ''}`.trim().length > 0)
            return `${label} hasta ${this.formatearFechaUtc(sanction.endsAtUtc, 'fecha no disponible')}`;
        return label;
    }

    moderationHistoryDetailLabel(item: ModerationAdminHistoryItemDto): string {
        const details: string[] = [];
        if (`${item.clientDate ?? ''}`.trim().length > 0)
            details.push(`Cliente: ${item.clientDate}`);
        if (item.localBlockCountToday !== null)
            details.push(`Bloqueos día: ${item.localBlockCountToday}`);
        if (item.triggeredStageIndex !== null)
            details.push(`Etapa disparada: ${item.triggeredStageIndex}`);
        if (item.triggeredSanctionId !== null)
            details.push(`Sanción: #${item.triggeredSanctionId}`);
        return details.join(' · ');
    }

    moderationObjectPreview(value: Record<string, any> | null | undefined): string {
        if (!value)
            return '';

        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return '';
        }
    }

    get etiquetaEstadoModeracionAdmin(): string {
        if (this.cargandoModeracionAdmin)
            return 'Cargando moderación y cumplimiento...';
        if (this.errorModeracionAdmin.length > 0)
            return this.errorModeracionAdmin;
        return '';
    }

    get etiquetaEstadoHistorialModeracionUsuario(): string {
        if (this.cargandoHistorialModeracionUsuario)
            return 'Cargando historial de moderación...';
        if (this.errorHistorialModeracionUsuario.length > 0)
            return this.errorHistorialModeracionUsuario;
        if (this.historialModeracionUsuario && this.historialModeracionUsuario.items.length < 1)
            return 'No hay incidencias o sanciones para el usuario seleccionado';
        return '';
    }

    get puedePaginaAnteriorHistorialModeracionUsuario(): boolean {
        return this.historialModeracionUsuarioOffset > 0 && !this.cargandoHistorialModeracionUsuario;
    }

    get puedePaginaSiguienteHistorialModeracionUsuario(): boolean {
        if (this.cargandoHistorialModeracionUsuario || !this.historialModeracionUsuario)
            return false;
        return this.historialModeracionUsuarioOffset + this.historialModeracionUsuario.items.length < this.historialModeracionUsuario.total;
    }

    get historialModeracionUsuarioPaginaTexto(): string {
        if (!this.historialModeracionUsuario || this.historialModeracionUsuario.total < 1)
            return 'Sin resultados';
        const desde = this.historialModeracionUsuario.offset + 1;
        const hasta = Math.min(
            this.historialModeracionUsuario.offset + this.historialModeracionUsuario.items.length,
            this.historialModeracionUsuario.total
        );
        return `${desde}-${hasta} de ${this.historialModeracionUsuario.total}`;
    }

    isSelfRow(row: AdminUserRow): boolean {
        const uidActual = this.userSvc.CurrentUserUid;
        return uidActual.length > 0 && uidActual === row.uid;
    }

    isSystemEntityRow(row: AdminUserRow): boolean {
        return row.isSystemEntity === true;
    }

    canChangeRole(row: AdminUserRow): boolean {
        if (!this.esAdmin)
            return false;
        if (this.isSystemEntityRow(row))
            return false;
        if (this.isUserOpRunning(row.uid, 'role'))
            return false;
        if (this.isSelfRow(row))
            return false;
        if (row.role === 'admin')
            return false;
        return true;
    }

    async onRoleChange(row: AdminUserRow, value: UserRole): Promise<void> {
        if (!this.canChangeRole(row))
            return;
        if (row.role === value)
            return;

        const opKey = this.userOpKey(row.uid, 'role');
        this.userOpsInFlight.add(opKey);
        try {
            await this.adminUsersSvc.setRole(row.uid, value);
        } catch (error: any) {
            this.errorUsuarios = error?.message ?? 'No se pudo actualizar el rol del usuario';
        } finally {
            this.userOpsInFlight.delete(opKey);
        }
    }

    canOpenPermissionsModal(row: AdminUserRow): boolean {
        if (!this.esAdmin)
            return false;
        if (this.isSystemEntityRow(row))
            return false;
        if (this.isUserOpRunning(row.uid, 'permissions'))
            return false;
        return true;
    }

    canOpenManualSanction(row: AdminUserRow): boolean {
        if (!this.esAdmin)
            return false;
        if (this.isSystemEntityRow(row))
            return false;
        if (this.isSelfRow(row))
            return false;
        if (this.isUserOpRunning(row.uid, 'sanction'))
            return false;
        return true;
    }

    canRevokeActiveBan(row: AdminUserRow): boolean {
        if (!this.esAdmin)
            return false;
        if (!this.hasActiveAccountRestriction(row))
            return false;
        if (this.isSystemEntityRow(row))
            return false;
        if (this.isSelfRow(row))
            return false;
        if (this.isUserOpRunning(row.uid, 'revoke-ban'))
            return false;
        return `${row?.uid ?? ''}`.trim().length > 0;
    }

    isRevokingActiveBan(row: AdminUserRow): boolean {
        return !!row && this.isUserOpRunning(row.uid, 'revoke-ban');
    }

    canOpenModerationCaseModal(item: ModerationCaseListItemDto | null | undefined): boolean {
        if (!this.esAdmin || !item)
            return false;
        if (this.cargandoModeracionAdmin || this.guardandoCasoModeracion)
            return false;
        if (item.isDeleted || item.deleted)
            return false;
        return item.caseId > 0;
    }

    canOpenModerationHistory(row: AdminUserRow): boolean {
        if (!this.esAdmin)
            return false;
        if (this.isSystemEntityRow(row))
            return false;
        return true;
    }

    permissionSummaryLabel(row: AdminUserRow): string {
        if (this.isSystemEntityRow(row))
            return 'Entidad del sistema: permisos no editables';
        const active = this.permissionActiveCount(row);
        const total = this.permissionResources.length;
        if (row.role === 'admin')
            return `Todos activos por rol admin (${total}/${total})`;
        return `${active} de ${total} activos`;
    }

    systemEntityAdminLabel(row: AdminUserRow): string {
        if (!this.isSystemEntityRow(row))
            return '';
        return 'Entidad del sistema. No es un usuario jugable ni moderable.';
    }

    permissionActiveCount(row: AdminUserRow): number {
        return this.permissionResources.filter((resource) => row.permissions[resource] === true).length;
    }

    abrirPermisosUsuario(row: AdminUserRow): void {
        if (!this.canOpenPermissionsModal(row))
            return;
        this.usuarioPermisosModal = row;
    }

    cerrarPermisosUsuario(): void {
        if (this.guardandoPermisosUsuario)
            return;
        this.usuarioPermisosModal = null;
    }

    async guardarPermisosUsuario(permissions: Record<PermissionResource, boolean>): Promise<void> {
        const row = this.usuarioPermisosModal;
        if (!row || !this.canOpenPermissionsModal(row) || row.role === 'admin')
            return;

        const opKey = this.userOpKey(row.uid, 'permissions');
        this.userOpsInFlight.add(opKey);
        this.guardandoPermisosUsuario = true;
        try {
            await this.adminUsersSvc.setCreatePermissions(row.uid, permissions);
            this.patchAdminUserRow(row.uid, {
                permissions: { ...permissions },
            });
            this.usuarioPermisosModal = null;
            await Swal.fire({
                icon: 'success',
                title: 'Permisos actualizados',
                text: 'Los permisos de creación se han guardado correctamente.',
            });
        } catch (error: any) {
            const message = error?.message ?? 'No se pudieron guardar los permisos del usuario';
            this.errorUsuarios = message;
            await Swal.fire({
                icon: 'error',
                title: 'No se pudo guardar',
                text: message,
            });
        } finally {
            this.userOpsInFlight.delete(opKey);
            this.guardandoPermisosUsuario = false;
        }
    }

    async abrirSancionManual(row: AdminUserRow): Promise<void> {
        if (!this.canOpenManualSanction(row))
            return;

        if (!this.moderacionAdminLoadedOnce)
            await this.cargarModeracionAdmin(true);

        if (this.manualModerationCases.length < 1) {
            const message = 'No hay supuestos moderables manuales disponibles para aplicar sanciones.';
            this.errorUsuarios = message;
            await Swal.fire({
                icon: 'error',
                title: 'Sin casos manuales',
                text: message,
            });
            return;
        }

        this.usuarioSancionModal = row;
    }

    async retirarBaneoActivo(row: AdminUserRow): Promise<void> {
        if (!this.hasActiveAccountRestriction(row))
            return;

        const uid = `${row?.uid ?? ''}`.trim();
        if (uid.length < 1) {
            const message = 'No se ha encontrado un usuario válido para retirar la restricción activa.';
            this.errorUsuarios = message;
            await Swal.fire({
                icon: 'error',
                title: 'Restricción no revocable',
                text: message,
            });
            return;
        }

        const confirmation = await Swal.fire({
            title: this.activeRestrictionActionTitle(row),
            text: this.hasEffectiveBan(row)
                ? 'Se retirará la sanción activa que mantiene el ban efectivo actual de esta cuenta.'
                : 'Se retirará la restricción activa que bloquea temporalmente esta cuenta.',
            input: 'textarea',
            inputLabel: 'Comentario admin opcional',
            inputPlaceholder: 'Motivo interno de la retirada anticipada',
            inputAttributes: {
                'aria-label': 'Comentario admin opcional',
            },
            inputAutoTrim: true,
            showCancelButton: true,
            confirmButtonText: this.activeRestrictionActionTitle(row),
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#c62828',
        });

        if (!confirmation.isConfirmed)
            return;

        const opKey = this.userOpKey(row.uid, 'revoke-ban');
        this.userOpsInFlight.add(opKey);
        try {
            const payload: ModerationSanctionRevokeRequestDto = {
                adminComment: `${confirmation.value ?? ''}`.trim() || null,
                userVisibleMessage: 'Administración ha retirado antes de tiempo la restricción activa de tu cuenta.',
            };
            const response = await this.usuariosApiSvc.revokeModerationSanction(uid, payload);
            const canonicalRow = await this.adminUsersSvc.getCanonicalAdminRow(uid);
            this.patchAdminUserRow(row.uid, canonicalRow
                ? {
                    banned: canonicalRow.banned,
                    moderationStatus: canonicalRow.moderationStatus ?? null,
                    moderationSummary: canonicalRow.moderationSummary ?? null,
                }
                : response.revoked
                    ? {
                        banned: false,
                        moderationStatus: 'none',
                        moderationSummary: row.moderationSummary
                            ? {
                                ...row.moderationSummary,
                                activeSanction: null,
                            }
                            : null,
                    }
                    : {}
            );
            if (this.previewModeracionUsuario?.uid === row.uid) {
                this.previewModeracionUsuario = await this.usuariosApiSvc.getAclByUid(row.uid, 5);
                await this.cargarHistorialModeracionUsuario(true);
            }
            this.adminUsersSvc.refreshUsersAdminView();
            if (this.moderacionAdminLoadedOnce)
                await this.cargarModeracionAdmin(true);

            await Swal.fire({
                icon: 'success',
                title: response.revoked ? this.activeRestrictionSuccessTitle(row) : 'Sin cambios',
                text: response.revoked
                    ? 'La sanción activa se ha retirado correctamente.'
                    : 'La sanción ya no estaba activa y no ha sido necesario aplicar cambios.',
            });
        } catch (error: any) {
            const message = error?.message ?? 'No se pudo retirar el ban activo';
            this.errorUsuarios = message;
            await Swal.fire({
                icon: 'error',
                title: 'No se pudo retirar la restricción',
                text: message,
            });
        } finally {
            this.userOpsInFlight.delete(opKey);
        }
    }

    cerrarSancionManual(): void {
        if (this.registrandoSancionUsuario)
            return;
        this.usuarioSancionModal = null;
    }

    get manualModerationCases(): ModerationCaseListItemDto[] {
        return this.supuestosModerables.filter((item) => {
            if (!item || item.deleted === true)
                return false;
            const sourceMode = `${item.sourceMode ?? ''}`.trim().toLowerCase();
            return sourceMode !== 'technical_signal_auto';
        });
    }

    async aplicarSancionManual(payload: ModerationIncidentCreateRequestDto): Promise<void> {
        const row = this.usuarioSancionModal;
        if (!row || !this.canOpenManualSanction(row))
            return;

        const opKey = this.userOpKey(row.uid, 'sanction');
        this.userOpsInFlight.add(opKey);
        this.registrandoSancionUsuario = true;
        try {
            const response = await this.usuariosApiSvc.createModerationIncident(payload);
            const preview = await this.usuariosApiSvc.getAclByUid(row.uid, 5);
            this.patchAdminUserRow(row.uid, {
                banned: preview.banned,
                moderationStatus: preview.moderationStatus ?? null,
                moderationSummary: preview.moderationSummary ?? null,
            });
            if (this.previewModeracionUsuario?.uid === row.uid) {
                this.previewModeracionUsuario = preview;
                await this.cargarHistorialModeracionUsuario(true);
            }
            if (this.moderacionAdminLoadedOnce)
                await this.cargarModeracionAdmin(true);
            this.usuarioSancionModal = null;
            await Swal.fire({
                icon: 'success',
                title: response.banned ? 'Ban aplicado' : 'Sanción aplicada',
                text: response.deduped
                    ? 'La incidencia ya existía y backend la ha tratado como duplicada.'
                    : (response.incident.userVisibleMessage ?? 'La sanción manual se ha registrado correctamente.'),
            });
        } catch (error: any) {
            const message = error?.message ?? 'No se pudo registrar la sanción manual';
            this.errorUsuarios = message;
            await Swal.fire({
                icon: 'error',
                title: 'No se pudo sancionar',
                text: message,
            });
        } finally {
            this.userOpsInFlight.delete(opKey);
            this.registrandoSancionUsuario = false;
        }
    }

    async abrirCreacionCasoModeracion(): Promise<void> {
        if (!this.esAdmin || this.guardandoCasoModeracion)
            return;
        if (!this.moderacionAdminLoadedOnce)
            await this.cargarModeracionAdmin(true);
        this.casoModeracionModal = {
            mode: 'create',
            item: null,
        };
    }

    async abrirEdicionCasoModeracion(item: ModerationCaseListItemDto): Promise<void> {
        if (!this.canOpenModerationCaseModal(item))
            return;
        if (!this.moderacionAdminLoadedOnce)
            await this.cargarModeracionAdmin(true);
        this.casoModeracionModal = {
            mode: 'edit',
            item,
        };
    }

    cerrarCasoModeracion(): void {
        if (this.guardandoCasoModeracion)
            return;
        this.casoModeracionModal = null;
    }

    async guardarCasoModeracion(payload: AdminModerationCaseModalSubmit): Promise<void> {
        if (!this.esAdmin || this.guardandoCasoModeracion)
            return;

        this.guardandoCasoModeracion = true;
        this.errorModeracionAdmin = '';
        try {
            if (payload.mode === 'create') {
                await this.usuariosApiSvc.createModerationCase(payload.createRequest);
            } else {
                await this.persistirEdicionCasoModeracion(payload.caseId, payload.patchRequest, payload.stagesRequest);
            }

            await this.cargarModeracionAdmin(true);
            this.casoModeracionModal = null;
            await Swal.fire({
                icon: 'success',
                title: payload.mode === 'create' ? 'Supuesto creado' : 'Supuesto actualizado',
                text: payload.mode === 'create'
                    ? 'El supuesto moderable se ha creado correctamente.'
                    : 'Los cambios del supuesto moderable se han guardado correctamente.',
            });
        } catch (error: any) {
            const message = error?.message ?? 'No se pudo guardar el supuesto moderable';
            this.errorModeracionAdmin = message;
            await Swal.fire({
                icon: 'error',
                title: 'No se pudo guardar',
                text: message,
            });
        } finally {
            this.guardandoCasoModeracion = false;
        }
    }

    async onSincronizarUsuariosApi(): Promise<void> {
        if (!this.esAdmin || this.sincronizandoUsuariosApi)
            return;

        this.estadoSyncUsuariosApi = '';
        this.errorUsuarios = '';
        this.sincronizandoUsuariosApi = true;
        try {
            await this.adminUsersSvc.assertAdminAccess();
            const result = await this.adminUsersSvc.syncAllUsersToApiFromCache();
            if (result.total < 1) {
                this.estadoSyncUsuariosApi = 'No hay usuarios en cache para resincronizar.';
                return;
            }

            if (result.failed > 0) {
                const listadoFallidos = result.failedUids.slice(0, 8).join(', ');
                const sufijo = result.failedUids.length > 8 ? '...' : '';
                this.estadoSyncUsuariosApi = `Resincronización parcial: ${result.success}/${result.total} ok. Fallos (${result.failed}): ${listadoFallidos}${sufijo}`;
                return;
            }

            this.estadoSyncUsuariosApi = `Resincronización completada: ${result.success}/${result.total} usuarios enviados a SQL.`;
        } catch (error: any) {
            this.errorUsuarios = error?.message ?? 'No se pudieron resincronizar los usuarios en SQL';
            this.estadoSyncUsuariosApi = '';
        } finally {
            this.sincronizandoUsuariosApi = false;
        }
    }

    async onDescargarBackupSql(): Promise<void> {
        if (!this.esAdmin || this.descargandoBackupSql)
            return;

        this.estadoBackupSql = '';
        this.errorUsuarios = '';
        this.descargandoBackupSql = true;
        try {
            const filename = await this.adminUsersSvc.downloadDatabaseBackup();
            this.estadoBackupSql = filename.length > 0
                ? `Backup descargado: ${filename}`
                : 'Backup descargado correctamente.';
        } catch (error: any) {
            this.errorUsuarios = error?.message ?? 'No se pudo descargar el backup SQL';
            this.estadoBackupSql = '';
        } finally {
            this.descargandoBackupSql = false;
        }
    }

    trackByUser(index: number, item: AdminUserRow): string {
        return item.uid;
    }

    trackByPermissionResource(index: number, item: PermissionResource): string {
        return item;
    }

    trackByRoleRequest(index: number, item: AdminRoleRequestItem): number {
        return item.requestId;
    }

    formatearFechaUtc(value: string | null | undefined, fallback: string = 'Sin dato'): string {
        const text = `${value ?? ''}`.trim();
        if (text.length < 1)
            return fallback;

        const parsed = new Date(text);
        if (Number.isNaN(parsed.getTime()))
            return fallback;
        return this.dateFormatter.format(parsed).replace(',', '');
    }

    isRoleRequestOpRunning(item: AdminRoleRequestItem): boolean {
        return this.roleRequestOpsInFlight.has(item.requestId);
    }

    async aprobarSolicitudRol(item: AdminRoleRequestItem): Promise<void> {
        if (!this.esAdmin || this.isRoleRequestOpRunning(item))
            return;

        const opKey = item.requestId;
        this.roleRequestOpsInFlight.add(opKey);
        this.errorSolicitudesRol = '';
        try {
            await this.userProfileApiSvc.resolveRoleRequest(item.requestId, { decision: 'approve' });
            await this.adminUsersSvc.syncUsersCacheFromApi();
            await this.cargarSolicitudesRolPendientes();
        } catch (error: any) {
            this.handleRoleRequestsLoadError(error, 'No se pudo aprobar la solicitud');
        } finally {
            this.roleRequestOpsInFlight.delete(opKey);
        }
    }

    async rechazarSolicitudRol(item: AdminRoleRequestItem): Promise<void> {
        if (!this.esAdmin || this.isRoleRequestOpRunning(item))
            return;

        const opKey = item.requestId;
        this.roleRequestOpsInFlight.add(opKey);
        this.errorSolicitudesRol = '';
        try {
            const rechazo = await this.pedirDatosRechazo();
            if (!rechazo)
                return;

            await this.userProfileApiSvc.resolveRoleRequest(item.requestId, {
                decision: 'reject',
                blockedUntilUtc: rechazo.blockedUntilUtc,
                adminComment: rechazo.adminComment,
            });
            await this.adminUsersSvc.syncUsersCacheFromApi();
            await this.cargarSolicitudesRolPendientes();
        } catch (error: any) {
            this.handleRoleRequestsLoadError(error, 'No se pudo rechazar la solicitud');
        } finally {
            this.roleRequestOpsInFlight.delete(opKey);
        }
    }

    private normalizarTexto(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private patchAdminUserRow(uid: string, patch: Partial<AdminUserRow>): void {
        this.usuariosAdmin = this.usuariosAdmin.map((row) => {
            if (row.uid !== uid)
                return row;

            const hasPermissionsPatch = Object.prototype.hasOwnProperty.call(patch, 'permissions');
            const hasModerationPatch = Object.prototype.hasOwnProperty.call(patch, 'moderationSummary');
            return {
                ...row,
                ...patch,
                permissions: hasPermissionsPatch ? (patch.permissions ?? row.permissions) : row.permissions,
                moderationSummary: hasModerationPatch ? (patch.moderationSummary ?? null) : row.moderationSummary,
            };
        });
    }

    private userOpKey(uid: string, action: string): string {
        return `${uid}::${action}`;
    }

    private isUserOpRunning(uid: string, action: string): boolean {
        return this.userOpsInFlight.has(this.userOpKey(uid, action));
    }

    hasActiveAccountRestriction(row: AdminUserRow | null | undefined): boolean {
        if (!row)
            return false;
        const moderationStatus = `${row.moderationStatus ?? ''}`.trim().toLowerCase();
        return moderationStatus === 'blocked'
            || moderationStatus === 'banned'
            || !!row.moderationSummary?.activeSanction
            || row.banned === true;
    }

    hasEffectiveBan(row: AdminUserRow | null | undefined): boolean {
        if (!row)
            return false;
        const moderationStatus = `${row.moderationStatus ?? ''}`.trim().toLowerCase();
        return moderationStatus === 'banned'
            || row.moderationSummary?.activeSanction?.isPermanent === true;
    }

    activeRestrictionStatusLabel(row: AdminUserRow | null | undefined): string {
        if (!row)
            return 'Sin ban efectivo';
        const moderationStatus = `${row.moderationStatus ?? ''}`.trim().toLowerCase();
        if (moderationStatus === 'banned' || row.moderationSummary?.activeSanction?.isPermanent === true)
            return 'Ban efectivo';
        if (moderationStatus === 'blocked' || !!row.moderationSummary?.activeSanction || row.banned === true)
            return 'Bloqueo activo';
        return 'Sin ban efectivo';
    }

    activeRestrictionActionTitle(row: AdminUserRow | null | undefined): string {
        return this.hasEffectiveBan(row) ? 'Retirar baneo' : 'Retirar bloqueo';
    }

    private activeRestrictionSuccessTitle(row: AdminUserRow | null | undefined): string {
        return this.hasEffectiveBan(row) ? 'Ban retirado' : 'Bloqueo retirado';
    }

    private async validarAccesoAdmin(): Promise<void> {
        try {
            await this.adminUsersSvc.assertAdminAccess();
        } catch (error: any) {
            this.errorUsuarios = error?.message ?? 'No autorizado';
            this.userSvc.setCanonicalAdminAccess(false);
            this.esAdmin = false;
        }
    }

    async cargarSolicitudesRolPendientes(): Promise<void> {
        if (!this.esAdmin)
            return;

        this.cargandoSolicitudesRol = true;
        this.errorSolicitudesRol = '';
        try {
            const pendientes = await this.userProfileApiSvc.listRoleRequests({
                status: 'pending',
            });
            const aprobadas = await this.userProfileApiSvc.listRoleRequests({
                status: 'approved',
            });
            const rechazadas = await this.userProfileApiSvc.listRoleRequests({
                status: 'rejected',
            });
            this.solicitudesMasterPendientes = pendientes.filter((item) => item.requestedRole === 'master');
            this.solicitudesColaboradorPendientes = pendientes.filter((item) => item.requestedRole === 'colaborador');
            this.solicitudesAprobadas = aprobadas;
            this.solicitudesRechazadas = rechazadas;
            this.roleRequestsLoadedOnce = true;
            this.roleRequestsSqlAccessDenied = false;
        } catch (error: any) {
            this.handleRoleRequestsLoadError(error, 'No se pudieron cargar las solicitudes pendientes');
        } finally {
            this.cargandoSolicitudesRol = false;
        }
    }

    async onSolicitudesPanelOpened(): Promise<void> {
        await this.setSection('role-requests');
    }

    onSolicitudesPanelClosed(): void {
        this.currentSection = 'usuarios';
    }

    async onModeracionPanelOpened(): Promise<void> {
        await this.setSection('moderacion');
    }

    onModeracionPanelClosed(): void {
        this.currentSection = 'usuarios';
    }

    async cargarModeracionAdmin(forceReload: boolean = false): Promise<void> {
        if (!this.esAdmin)
            return;
        if (this.cargandoModeracionAdmin)
            return;
        if (!forceReload && this.moderacionAdminLoadedOnce)
            return;

        this.cargandoModeracionAdmin = true;
        this.errorModeracionAdmin = '';
        try {
            const [
                usageDraftResult,
                creationDraftResult,
                usageActiveResult,
                creationActiveResult,
                casesResult,
                incidentsResult,
                sanctionsResult,
            ] = await Promise.allSettled([
                this.usuariosApiSvc.getAdminPolicyDraft('usage'),
                this.usuariosApiSvc.getAdminPolicyDraft('creation'),
                this.userProfileApiSvc.getActivePolicy('usage'),
                this.userProfileApiSvc.getActivePolicy('creation'),
                this.usuariosApiSvc.listModerationCases(false),
                this.usuariosApiSvc.listModerationIncidents(),
                this.usuariosApiSvc.listModerationSanctions(),
            ]);

            this.politicasModeracion = [
                {
                    kind: 'usage',
                    draft: usageDraftResult.status === 'fulfilled' ? usageDraftResult.value : null,
                    active: usageActiveResult.status === 'fulfilled' ? usageActiveResult.value : null,
                },
                {
                    kind: 'creation',
                    draft: creationDraftResult.status === 'fulfilled' ? creationDraftResult.value : null,
                    active: creationActiveResult.status === 'fulfilled' ? creationActiveResult.value : null,
                },
            ];
            this.supuestosModerables = casesResult.status === 'fulfilled' ? casesResult.value : [];
            this.incidenciasModeracion = incidentsResult.status === 'fulfilled' ? incidentsResult.value : [];
            this.sancionesModeracion = sanctionsResult.status === 'fulfilled' ? sanctionsResult.value : [];
            this.moderacionAdminLoadedOnce = true;

            const errors = [
                usageDraftResult,
                creationDraftResult,
                usageActiveResult,
                creationActiveResult,
                casesResult,
                incidentsResult,
                sanctionsResult,
            ]
                .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
                .map((result) => `${result.reason?.message ?? ''}`.trim())
                .filter((message) => message.length > 0);

            if (errors.length > 0)
                this.errorModeracionAdmin = errors[0];
        } catch (error: any) {
            this.errorModeracionAdmin = error?.message ?? 'No se pudo cargar la lectura admin de moderación';
        } finally {
            this.cargandoModeracionAdmin = false;
        }
    }

    async abrirModeracionUsuario(row: AdminUserRow): Promise<void> {
        if (!this.canOpenModerationHistory(row))
            return;
        this.usuarioHistorialModeracionModal = row;
        this.seleccionarModeracionUsuario(row.uid, true);
        await this.cargarHistorialModeracionUsuario(true);
    }

    cerrarHistorialModeracionUsuarioModal(): void {
        this.usuarioHistorialModeracionModal = null;
    }

    async cargarHistorialModeracionUsuarioDesdePanel(): Promise<void> {
        this.usuarioHistorialModeracionModal = null;
        this.seleccionarModeracionUsuario(this.moderacionUsuarioUid, true);
        await this.cargarHistorialModeracionUsuario(true);
    }

    async cargarHistorialModeracionUsuario(forceReload: boolean = false): Promise<void> {
        const normalizedUid = `${this.moderacionUsuarioUid ?? ''}`.trim();
        if (!this.esAdmin || normalizedUid.length < 1)
            return;
        if (this.cargandoHistorialModeracionUsuario)
            return;
        if (!forceReload && this.historialModeracionUsuario?.uid === normalizedUid)
            return;

        this.cargandoHistorialModeracionUsuario = true;
        this.errorHistorialModeracionUsuario = '';
        try {
            const [preview, history] = await Promise.all([
                this.usuariosApiSvc.getAclByUid(normalizedUid, 5),
                this.usuariosApiSvc.getUserModerationHistory(
                    normalizedUid,
                    this.historialModeracionUsuarioLimit,
                    this.historialModeracionUsuarioOffset
                ),
            ]);
            this.previewModeracionUsuario = preview;
            this.historialModeracionUsuario = history;
            this.historialModeracionUsuarioOffset = history.offset;
            this.historialModeracionUsuarioLimit = history.limit;
        } catch (error: any) {
            this.previewModeracionUsuario = null;
            this.historialModeracionUsuario = null;
            this.errorHistorialModeracionUsuario = error?.message ?? 'No se pudo cargar el historial admin del usuario';
        } finally {
            this.cargandoHistorialModeracionUsuario = false;
        }
    }

    limpiarModeracionUsuario(): void {
        this.usuarioHistorialModeracionModal = null;
        this.moderacionUsuarioUid = '';
        this.previewModeracionUsuario = null;
        this.historialModeracionUsuario = null;
        this.errorHistorialModeracionUsuario = '';
        this.historialModeracionUsuarioOffset = 0;
    }

    async irPaginaAnteriorHistorialModeracionUsuario(): Promise<void> {
        if (!this.puedePaginaAnteriorHistorialModeracionUsuario)
            return;
        this.historialModeracionUsuarioOffset = Math.max(0, this.historialModeracionUsuarioOffset - this.historialModeracionUsuarioLimit);
        await this.cargarHistorialModeracionUsuario(true);
    }

    async irPaginaSiguienteHistorialModeracionUsuario(): Promise<void> {
        if (!this.puedePaginaSiguienteHistorialModeracionUsuario)
            return;
        this.historialModeracionUsuarioOffset += this.historialModeracionUsuarioLimit;
        await this.cargarHistorialModeracionUsuario(true);
    }

    trackByPolicy(index: number, item: AdminPolicyPanelItem): UserCompliancePolicyKind {
        return item.kind;
    }

    trackByModerationCase(index: number, item: ModerationCaseListItemDto): string {
        return `${item?.caseId ?? index}:${item?.code ?? ''}`;
    }

    trackByModerationStage(index: number, item: ModerationCaseStageDto): string {
        return `${item?.stageIndex ?? index}:${item?.sanctionCode ?? item?.sanctionKind ?? ''}`;
    }

    trackByModerationIncident(index: number, item: ModerationIncidentListItemDto): string {
        return `${item?.incidentId ?? index}`;
    }

    trackByModerationSanction(index: number, item: ModerationSanctionListItemDto): string {
        return `${item?.sanctionId ?? index}`;
    }

    trackByModerationProgress(index: number, item: ModerationProgressCaseDto): string {
        return `${item?.caseId ?? index}:${item?.caseCode ?? ''}`;
    }

    trackByModerationHistory(index: number, item: ModerationAdminHistoryItemDto): string {
        return `${item?.incidentId ?? index}`;
    }

    get etiquetaEstadoAuditoriaCreaciones(): string {
        if (this.cargandoAuditoriaCreaciones)
            return 'Cargando auditoría...';
        if (this.errorAuditoriaCreaciones.length > 0)
            return this.errorAuditoriaCreaciones;
        if (this.auditoriaCreaciones.length < 1)
            return 'No hay eventos que coincidan con los filtros actuales';
        return '';
    }

    get puedePaginaAnteriorAuditoriaCreaciones(): boolean {
        return this.auditoriaCreacionesOffset > 0 && !this.cargandoAuditoriaCreaciones;
    }

    get puedePaginaSiguienteAuditoriaCreaciones(): boolean {
        return !this.cargandoAuditoriaCreaciones
            && this.auditoriaCreacionesOffset + this.auditoriaCreaciones.length < this.auditoriaCreacionesTotal;
    }

    get auditoriaCreacionesPaginaTexto(): string {
        if (this.auditoriaCreacionesTotal < 1)
            return 'Sin resultados';
        const desde = this.auditoriaCreacionesOffset + 1;
        const hasta = Math.min(this.auditoriaCreacionesOffset + this.auditoriaCreaciones.length, this.auditoriaCreacionesTotal);
        return `${desde}-${hasta} de ${this.auditoriaCreacionesTotal}`;
    }

    async onAuditoriaPanelOpened(): Promise<void> {
        await this.setSection('auditoria');
    }

    onAuditoriaPanelClosed(): void {
        this.currentSection = 'usuarios';
    }

    async aplicarFiltrosAuditoriaCreaciones(): Promise<void> {
        this.auditoriaCreacionesOffset = 0;
        await this.cargarAuditoriaCreaciones(true);
    }

    limpiarFiltrosAuditoriaCreaciones(): void {
        this.auditoriaCreacionesActorUid = '';
        this.auditoriaCreacionesActionCode = '';
        this.auditoriaCreacionesResult = '';
        this.auditoriaCreacionesResourceType = '';
        this.auditoriaCreacionesFrom = '';
        this.auditoriaCreacionesTo = '';
        this.auditoriaCreacionesOffset = 0;
        this.detalleAuditoriaCreacion = null;
        this.errorDetalleAuditoriaCreacion = '';
        void this.cargarAuditoriaCreaciones(true);
    }

    async cargarAuditoriaCreaciones(forceReload: boolean = false): Promise<void> {
        if (!this.esAdmin)
            return;
        if (this.cargandoAuditoriaCreaciones)
            return;
        if (!forceReload && this.auditoriaCreacionesLoadedOnce)
            return;

        this.cargandoAuditoriaCreaciones = true;
        this.errorAuditoriaCreaciones = '';
        try {
            const response = await this.usuariosApiSvc.listCreationAuditEvents({
                actorUid: this.auditoriaCreacionesActorUid,
                actionCode: this.auditoriaCreacionesActionCode,
                result: this.auditoriaCreacionesResult || null,
                resourceType: this.auditoriaCreacionesResourceType,
                from: this.toAuditUtcFilter(this.auditoriaCreacionesFrom),
                to: this.toAuditUtcFilter(this.auditoriaCreacionesTo),
                limit: this.auditoriaCreacionesLimit,
                offset: this.auditoriaCreacionesOffset,
            });
            this.auditoriaCreaciones = response.items ?? [];
            this.auditoriaCreacionesTotal = Number(response.total ?? 0) || 0;
            this.auditoriaCreacionesLimit = Number(response.limit ?? this.auditoriaCreacionesLimit) || this.auditoriaCreacionesLimit;
            this.auditoriaCreacionesOffset = Number(response.offset ?? this.auditoriaCreacionesOffset) || 0;
            this.auditoriaCreacionesLoadedOnce = true;

            if (this.detalleAuditoriaCreacion) {
                const currentEventId = `${this.detalleAuditoriaCreacion.eventId ?? ''}`.trim();
                if (currentEventId.length > 0 && !this.auditoriaCreaciones.some((item) => `${item?.eventId ?? ''}`.trim() === currentEventId)) {
                    this.detalleAuditoriaCreacion = null;
                    this.errorDetalleAuditoriaCreacion = '';
                }
            }
        } catch (error: any) {
            this.auditoriaCreaciones = [];
            this.auditoriaCreacionesTotal = 0;
            this.errorAuditoriaCreaciones = error?.message ?? 'No se pudo cargar la auditoría de creaciones';
        } finally {
            this.cargandoAuditoriaCreaciones = false;
        }
    }

    async cargarDetalleAuditoriaCreacion(eventId: string): Promise<void> {
        const normalizedEventId = `${eventId ?? ''}`.trim();
        if (!this.esAdmin || normalizedEventId.length < 1)
            return;

        this.cargandoDetalleAuditoriaCreacion = true;
        this.errorDetalleAuditoriaCreacion = '';
        try {
            this.detalleAuditoriaCreacion = await this.usuariosApiSvc.getCreationAuditEventDetail(normalizedEventId);
        } catch (error: any) {
            this.detalleAuditoriaCreacion = null;
            this.errorDetalleAuditoriaCreacion = error?.message ?? 'No se pudo cargar el detalle de auditoría';
        } finally {
            this.cargandoDetalleAuditoriaCreacion = false;
        }
    }

    async irPaginaAnteriorAuditoriaCreaciones(): Promise<void> {
        if (!this.puedePaginaAnteriorAuditoriaCreaciones)
            return;
        this.auditoriaCreacionesOffset = Math.max(0, this.auditoriaCreacionesOffset - this.auditoriaCreacionesLimit);
        await this.cargarAuditoriaCreaciones(true);
    }

    async irPaginaSiguienteAuditoriaCreaciones(): Promise<void> {
        if (!this.puedePaginaSiguienteAuditoriaCreaciones)
            return;
        this.auditoriaCreacionesOffset += this.auditoriaCreacionesLimit;
        await this.cargarAuditoriaCreaciones(true);
    }

    trackByAuditEvent(index: number, item: CreationAuditEventSummaryDto): string {
        return `${item?.eventId ?? index}`;
    }

    async setSection(section: AdminPanelViewSectionId): Promise<void> {
        if (this.currentSection === section) {
            await this.ensureSectionLoaded(section);
            return;
        }

        this.currentSection = section;
        this.resaltarSolicitudesPendientes = false;
        await this.ensureSectionLoaded(section);
    }

    private aplicarOpenRequest(request: AdminPanelOpenRequest): void {
        this.currentSection = request?.section === 'role-requests' ? 'role-requests' : 'usuarios';
        this.resaltarSolicitudesPendientes = request?.section === 'role-requests' && request?.pendingOnly === true;

        if (request?.section === 'role-requests') {
            void this.cargarSolicitudesRolPendientes();
            this.scrollToRoleRequests();
        }
    }

    private async ensureSectionLoaded(section: AdminPanelViewSectionId): Promise<void> {
        if (section === 'role-requests') {
            if (!this.roleRequestsLoadedOnce)
                await this.cargarSolicitudesRolPendientes();
            return;
        }
        if (section === 'moderacion') {
            if (!this.moderacionAdminLoadedOnce)
                await this.cargarModeracionAdmin(true);
            return;
        }
        if (section === 'auditoria') {
            if (!this.auditoriaCreacionesLoadedOnce)
                await this.cargarAuditoriaCreaciones(true);
        }
    }

    private scrollToRoleRequests(): void {
        if (typeof document === 'undefined')
            return;

        setTimeout(() => {
            document.getElementById('admin-role-requests')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 50);
    }

    private scrollToModeration(): void {
        if (typeof document === 'undefined')
            return;

        setTimeout(() => {
            document.getElementById('admin-moderation-panel')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 50);
    }

    private seleccionarModeracionUsuario(uid: string | null | undefined, resetOffset: boolean = false): void {
        const normalizedUid = `${uid ?? ''}`.trim();
        const previousUid = `${this.moderacionUsuarioUid ?? ''}`.trim();
        const uidChanged = normalizedUid !== previousUid;

        this.moderacionUsuarioUid = normalizedUid;

        if (uidChanged) {
            this.previewModeracionUsuario = null;
            this.historialModeracionUsuario = null;
            this.errorHistorialModeracionUsuario = '';
        }

        if (uidChanged || resetOffset)
            this.historialModeracionUsuarioOffset = 0;
    }

    private isRealtimeRoleRequestNotification(candidate: ChatAlertCandidate | null | undefined): boolean {
        const notificationCode = `${candidate?.notification?.code ?? ''}`.trim().toLowerCase();
        const actionTarget = `${candidate?.notification?.action?.target ?? ''}`.trim().toLowerCase();
        return notificationCode === 'system.role_request_created' && actionTarget === 'admin.role_requests';
    }

    private handleRoleRequestsLoadError(error: any, fallbackMessage: string): void {
        if (this.isRoleRequestsForbidden(error)) {
            this.userSvc.setCanonicalAdminAccess(false);
            this.esAdmin = false;
            this.roleRequestsSqlAccessDenied = true;
            this.roleRequestsLoadedOnce = true;
            this.solicitudesMasterPendientes = [];
            this.solicitudesColaboradorPendientes = [];
            this.solicitudesAprobadas = [];
            this.solicitudesRechazadas = [];
            this.errorSolicitudesRol = 'La API no autoriza esta seccion para tu sesion actual. El admin real de role-requests se resuelve en SQL y no en caches actor-scoped.';
            return;
        }

        this.errorSolicitudesRol = error?.message ?? fallbackMessage;
    }

    private isRoleRequestsForbidden(error: any): boolean {
        const status = Number(error?.status ?? 0);
        const code = `${error?.code ?? ''}`.trim().toUpperCase();
        return status === 403 || code === 'FORBIDDEN';
    }

    auditActorLabel(item: CreationAuditEventSummaryDto | CreationAuditEventDetailDto | null | undefined): string {
        return `${item?.actor?.displayName ?? item?.actor?.uid ?? 'Sin actor'}`.trim();
    }

    auditResourceLabel(item: CreationAuditEventSummaryDto | CreationAuditEventDetailDto | null | undefined): string {
        return `${item?.resource?.label ?? item?.resource?.id ?? item?.resource?.type ?? 'Sin recurso'}`.trim();
    }

    auditResultLabel(result: string | null | undefined): string {
        const normalized = `${result ?? ''}`.trim().toLowerCase();
        if (normalized === 'created')
            return 'Creado';
        if (normalized === 'reused')
            return 'Reutilizado';
        if (normalized === 'rejected')
            return 'Rechazado';
        return normalized.length > 0 ? normalized : 'Sin dato';
    }

    private toAuditUtcFilter(value: string): string | null {
        const normalized = `${value ?? ''}`.trim();
        if (normalized.length < 1)
            return null;
        const parsed = new Date(normalized);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }

    private moderationSanctionNameFromParts(
        name: string | null | undefined,
        code: string | null | undefined,
        kind: string | null | undefined
    ): string {
        return `${name ?? code ?? kind ?? 'Sanción'}`.trim();
    }

    private moderationStageDurationLabel(stage: ModerationCaseStageDto): string {
        if (stage.isPermanent)
            return 'permanente';
        if (stage.durationMinutes !== null && stage.durationMinutes > 0) {
            if (stage.durationMinutes % (24 * 60) === 0) {
                const days = stage.durationMinutes / (24 * 60);
                return `${days} día${days === 1 ? '' : 's'}`;
            }
            if (stage.durationMinutes % 60 === 0) {
                const hours = stage.durationMinutes / 60;
                return `${hours} hora${hours === 1 ? '' : 's'}`;
            }
            return `${stage.durationMinutes} minuto${stage.durationMinutes === 1 ? '' : 's'}`;
        }
        if (stage.durationDays !== null && stage.durationDays > 0)
            return `${stage.durationDays} día${stage.durationDays === 1 ? '' : 's'}`;
        if (stage.durationHours !== null && stage.durationHours > 0)
            return `${stage.durationHours} hora${stage.durationHours === 1 ? '' : 's'}`;
        return '';
    }

    private async persistirEdicionCasoModeracion(
        caseId: number,
        patchRequest: ModerationCasePatchRequestDto,
        stagesRequest: ModerationCaseStagesReplaceRequestDto
    ): Promise<void> {
        await this.usuariosApiSvc.updateModerationCase(caseId, patchRequest);
        await this.usuariosApiSvc.replaceModerationCaseStages(caseId, stagesRequest);
    }

    private async pedirDatosRechazo(): Promise<{ blockedUntilUtc: string; adminComment: string | null; } | null> {
        const ahora = new Date();
        const sugerida = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
        const isoLocal = this.toLocalDateTimeValue(sugerida);

        const result = await Swal.fire({
            title: 'Rechazar solicitud',
            html: `
                <label for="role-request-blocked-until" style="display:block;text-align:left;margin-bottom:6px;">Bloquear nuevas solicitudes hasta</label>
                <input id="role-request-blocked-until" type="datetime-local" class="swal2-input" value="${isoLocal}" style="margin:0 0 12px 0;width:100%;" />
                <label for="role-request-admin-comment" style="display:block;text-align:left;margin-bottom:6px;">Comentario para el usuario (opcional)</label>
                <textarea id="role-request-admin-comment" class="swal2-textarea" style="margin:0;width:100%;" placeholder="Motivo del rechazo"></textarea>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Rechazar',
            cancelButtonText: 'Cancelar',
            focusConfirm: false,
            preConfirm: () => {
                const blockedUntilInput = document.getElementById('role-request-blocked-until') as HTMLInputElement | null;
                const adminCommentInput = document.getElementById('role-request-admin-comment') as HTMLTextAreaElement | null;
                const blockedUntilValue = `${blockedUntilInput?.value ?? ''}`.trim();
                if (blockedUntilValue.length < 1) {
                    Swal.showValidationMessage('Debes indicar hasta cuándo se bloquean nuevas solicitudes.');
                    return null;
                }

                const blockedUntilDate = new Date(blockedUntilValue);
                if (Number.isNaN(blockedUntilDate.getTime()) || blockedUntilDate.getTime() <= Date.now()) {
                    Swal.showValidationMessage('La fecha de bloqueo debe estar en el futuro.');
                    return null;
                }

                return {
                    blockedUntilUtc: blockedUntilDate.toISOString(),
                    adminComment: `${adminCommentInput?.value ?? ''}`.trim() || null,
                };
            },
        });

        return result.isConfirmed ? (result.value ?? null) : null;
    }

    private toLocalDateTimeValue(value: Date): string {
        const year = value.getFullYear();
        const month = `${value.getMonth() + 1}`.padStart(2, '0');
        const day = `${value.getDate()}`.padStart(2, '0');
        const hours = `${value.getHours()}`.padStart(2, '0');
        const minutes = `${value.getMinutes()}`.padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}
