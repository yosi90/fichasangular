import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { CACHE_CONTRACT_MANIFEST, CacheEntityKey } from 'src/app/config/cache-contract-manifest';
import { CampanaService } from 'src/app/services/campana.service';
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
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';

interface SyncItemConfig {
    key: CacheEntityKey;
    label: string;
    schemaVersion: number;
    run: () => Promise<boolean>;
}

interface SyncItemUi extends SyncItemConfig, CacheSyncUiState {
    lastSuccessTexto: string;
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
    usuariosPanelExpanded: boolean = true;
    solicitudesPanelExpanded: boolean = false;
    syncPanelExpanded: boolean = false;
    resaltarSolicitudesPendientes: boolean = false;

    private readonly destroy$ = new Subject<void>();
    private readonly keysEjecutando = new Set<CacheEntityKey>();
    private readonly userOpsInFlight = new Set<string>();
    private readonly roleRequestOpsInFlight = new Set<number>();
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
        private cSvc: CampanaService,
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
        private userProfileApiSvc: UserProfileApiService,
    ) {
        this.syncRunners = {
            lista_personajes: () => this.lpSvc.RenovarPersonajesSimples(),
            campanas_tramas_subtramas: () => this.cSvc.RenovarCampañasFirebase(),
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
                if (this.esAdmin) {
                    void this.validarAccesoAdmin();
                    void this.cargarSolicitudesRolPendientes();
                }
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

    isSelfRow(row: AdminUserRow): boolean {
        const uidActual = this.userSvc.CurrentUserUid;
        return uidActual.length > 0 && uidActual === row.uid;
    }

    canToggleBan(row: AdminUserRow): boolean {
        if (!this.esAdmin)
            return false;
        if (this.isUserOpRunning(row.uid, 'ban'))
            return false;
        if (this.isSelfRow(row))
            return false;
        return true;
    }

    canChangeRole(row: AdminUserRow): boolean {
        if (!this.esAdmin)
            return false;
        if (this.isUserOpRunning(row.uid, 'role'))
            return false;
        if (this.isSelfRow(row))
            return false;
        if (row.role === 'admin')
            return false;
        return true;
    }

    canTogglePermission(row: AdminUserRow, resource: PermissionResource): boolean {
        if (!this.esAdmin)
            return false;
        if (row.role === 'admin')
            return false;
        if (this.isUserOpRunning(row.uid, `perm:${resource}`))
            return false;
        return true;
    }

    async onToggleBanned(row: AdminUserRow, value: boolean): Promise<void> {
        if (!this.canToggleBan(row))
            return;

        const opKey = this.userOpKey(row.uid, 'ban');
        this.userOpsInFlight.add(opKey);
        try {
            await this.adminUsersSvc.setBanned(row.uid, value);
        } catch (error: any) {
            this.errorUsuarios = error?.message ?? 'No se pudo actualizar el estado de ban';
        } finally {
            this.userOpsInFlight.delete(opKey);
        }
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

    async onToggleCreatePermission(row: AdminUserRow, resource: PermissionResource, value: boolean): Promise<void> {
        if (!this.canTogglePermission(row, resource))
            return;

        const opKey = this.userOpKey(row.uid, `perm:${resource}`);
        this.userOpsInFlight.add(opKey);
        try {
            await this.adminUsersSvc.setCreatePermission(row.uid, resource, value);
        } catch (error: any) {
            this.errorUsuarios = error?.message ?? `No se pudo actualizar permiso ${resource}.create`;
        } finally {
            this.userOpsInFlight.delete(opKey);
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
            this.errorSolicitudesRol = error?.message ?? 'No se pudo aprobar la solicitud';
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
            this.errorSolicitudesRol = error?.message ?? 'No se pudo rechazar la solicitud';
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

    private userOpKey(uid: string, action: string): string {
        return `${uid}::${action}`;
    }

    private isUserOpRunning(uid: string, action: string): boolean {
        return this.userOpsInFlight.has(this.userOpKey(uid, action));
    }

    private async validarAccesoAdmin(): Promise<void> {
        try {
            await this.adminUsersSvc.assertAdminAccess();
        } catch (error: any) {
            this.errorUsuarios = error?.message ?? 'No autorizado';
            this.esAdmin = false;
        }
    }

    async cargarSolicitudesRolPendientes(): Promise<void> {
        if (!this.esAdmin)
            return;

        this.cargandoSolicitudesRol = true;
        this.errorSolicitudesRol = '';
        try {
            const [master, colaborador, aprobadas, rechazadas] = await Promise.all([
                this.userProfileApiSvc.listRoleRequests({
                    status: 'pending',
                    requestedRole: 'master',
                }),
                this.userProfileApiSvc.listRoleRequests({
                    status: 'pending',
                    requestedRole: 'colaborador',
                }),
                this.userProfileApiSvc.listRoleRequests({
                    status: 'approved',
                }),
                this.userProfileApiSvc.listRoleRequests({
                    status: 'rejected',
                }),
            ]);
            this.solicitudesMasterPendientes = master;
            this.solicitudesColaboradorPendientes = colaborador;
            this.solicitudesAprobadas = aprobadas;
            this.solicitudesRechazadas = rechazadas;
        } catch (error: any) {
            this.errorSolicitudesRol = error?.message ?? 'No se pudieron cargar las solicitudes pendientes';
        } finally {
            this.cargandoSolicitudesRol = false;
        }
    }

    private aplicarOpenRequest(request: AdminPanelOpenRequest): void {
        this.usuariosPanelExpanded = request?.section !== 'role-requests';
        this.solicitudesPanelExpanded = request?.section === 'role-requests';
        this.syncPanelExpanded = false;
        this.resaltarSolicitudesPendientes = request?.section === 'role-requests' && request?.pendingOnly === true;

        if (request?.section === 'role-requests') {
            void this.cargarSolicitudesRolPendientes();
            this.scrollToRoleRequests();
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
