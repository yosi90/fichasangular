import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CACHE_CONTRACT_MANIFEST, CacheEntityKey } from 'src/app/config/cache-contract-manifest';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { ConjuroCatalogosService } from 'src/app/services/conjuro-catalogos.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { DoteService } from 'src/app/services/dote.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { EspecialService } from 'src/app/services/especial.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { ManualesAsociadosService } from 'src/app/services/manuales-asociados.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { RazaService } from 'src/app/services/raza.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
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
import { EnemigoPredilectoService } from 'src/app/services/enemigo-predilecto.service';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { ExtraService } from 'src/app/services/extra.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { SubdisciplinaConjurosService } from 'src/app/services/subdisciplina-conjuros.service';
import { UserService } from 'src/app/services/user.service';

interface SyncItemConfig {
    key: CacheEntityKey;
    label: string;
    schemaVersion: number;
    run: () => Promise<boolean>;
}

interface SyncItemUi extends SyncItemConfig, CacheSyncUiState {
    lastSuccessTexto: string;
}

/**
 * Panel de administración de Rol en la web: solo la sincronización de las cachés públicas de catálogos.
 * Usuarios, solicitudes de rol, auditoría y copias están en el plugin de la administración de Yosiftware.
 */
@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.sass'],
    standalone: false
})
export class AdminPanelComponent implements OnInit, OnDestroy {
    esAdmin: boolean = false;
    errorSync: string = '';
    serverStatusIcon: string = 'question_mark';
    serverStatus: string = 'Verificar conexión';
    syncItems: SyncItemUi[] = [];
    syncItemsOrdenados: SyncItemUi[] = [];
    syncFiltroTexto: string = '';
    syncSoloPendientes: boolean = false;

    private readonly destroy$ = new Subject<void>();
    private readonly keysEjecutando = new Set<CacheEntityKey>();
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
        private razaCatalogosSvc: RazaCatalogosService,
        private conjuroCatalogosSvc: ConjuroCatalogosService,
        private userSvc: UserService,
    ) {
        this.syncRunners = {
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
            escuelas_conjuros: () => this.escSvc.RenovarEscuelas(),
            disciplinas_conjuros: () => this.disSvc.RenovarDisciplinas(),
            subdisciplinas_conjuros: () => this.subdisSvc.RenovarSubdisciplinas(),
            alineamientos: () => this.aSvc.RenovarAlineamientos(),
            alineamientos_basicos: () => this.aSvc.RenovarAlineamientosBasicos(),
            alineamientos_combinaciones: () => this.aSvc.RenovarAlineamientosCombinaciones(),
            alineamientos_prioridades: () => this.aSvc.RenovarAlineamientosPrioridades(),
            alineamientos_preferencia_ley: () => this.aSvc.RenovarAlineamientosPreferenciaLey(),
            alineamientos_preferencia_moral: () => this.aSvc.RenovarAlineamientosPreferenciaMoral(),
            actitudes: () => this.aSvc.RenovarActitudes(),
            maniobrabilidades: () => this.razaCatalogosSvc.RenovarManiobrabilidades(),
            tipos_dado: () => this.razaCatalogosSvc.RenovarTiposDado(),
            componentes_conjuros: () => this.conjuroCatalogosSvc.RenovarComponentes(),
            tiempos_lanzamiento: () => this.conjuroCatalogosSvc.RenovarTiemposLanzamiento(),
            alcances_conjuros: () => this.conjuroCatalogosSvc.RenovarAlcances(),
            descriptores_conjuros: () => this.conjuroCatalogosSvc.RenovarDescriptores(),
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
        };
    }

    ngOnInit(): void {
        this.userSvc.esAdmin$
            .pipe(takeUntil(this.destroy$))
            .subscribe((estado) => {
                this.esAdmin = estado === true;
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

    get syncItemsVisibles(): SyncItemUi[] {
        const filtro = this.normalizarTexto(this.syncFiltroTexto);
        return this.syncItemsOrdenados.filter((item) => {
            if (this.syncSoloPendientes && !item.isPrimary)
                return false;
            if (filtro.length < 1)
                return true;
            const texto = this.normalizarTexto(`${item.label} ${item.key} ${item.lastSuccessTexto}`);
            return texto.includes(filtro);
        });
    }

    get syncPendientesCount(): number {
        return this.syncItemsOrdenados.filter((item) => item.isPrimary).length;
    }

    toggleSyncSoloPendientes(): void {
        this.syncSoloPendientes = !this.syncSoloPendientes;
    }

    async ejecutarSync(item: SyncItemUi): Promise<void> {
        if (!this.esAdmin || this.keysEjecutando.has(item.key))
            return;

        this.errorSync = '';
        this.keysEjecutando.add(item.key);
        try {
            const ok = await item.run();
            if (ok)
                await this.cacheSyncMetadataSvc.markSuccess(item.key, item.schemaVersion);
        } catch (error: any) {
            this.errorSync = error?.message ?? 'No se pudo ejecutar la sincronización';
        } finally {
            this.keysEjecutando.delete(item.key);
        }
    }

    estaEjecutando(key: CacheEntityKey): boolean {
        return this.keysEjecutando.has(key);
    }

    trackBySyncItem(index: number, item: SyncItemUi): CacheEntityKey {
        return item.key;
    }

    private ordenarSyncItems(items: SyncItemUi[]): SyncItemUi[] {
        return [...items].sort((a, b) => {
            if (a.isPrimary !== b.isPrimary)
                return a.isPrimary ? -1 : 1;
            return a.label.localeCompare(b.label, 'es', { sensitivity: 'base' });
        });
    }

    private formatearFecha(lastSuccessAt: number | null): string {
        if (!lastSuccessAt)
            return 'Sin cacheo';

        return this.dateFormatter.format(new Date(lastSuccessAt)).replace(',', '');
    }

    private normalizarTexto(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
