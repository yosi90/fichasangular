import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
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
    styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent implements OnInit, OnDestroy {
    hasCon?: boolean;
    serverStatusIcon: string = 'question_mark';
    serverStatus: string = 'Verificar conexión';
    syncItems: SyncItemUi[] = [];
    syncItemsOrdenados: SyncItemUi[] = [];

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
        private aSvc: AlineamientoService,
        private plSvc: PlantillaService,
        private doSvc: DoteService,
        private clSvc: ClaseService,
        private espSvc: EspecialService,
        private racialSvc: RacialService,
        private habSvc: HabilidadService,
        private idiSvc: IdiomaService,
        private dominioSvc: DominioService,
        private ambitoSvc: AmbitoService,
        private pabellonSvc: PabellonService,
        private deidadSvc: DeidadService,
        private ventajaSvc: VentajaService,
        private cacheSyncMetadataSvc: CacheSyncMetadataService,
    ) {
        this.syncRunners = {
            lista_personajes: () => this.lpSvc.RenovarPersonajesSimples(),
            campanas_tramas_subtramas: () => this.cSvc.RenovarCampañasFirebase(),
            personajes: () => this.pSvc.RenovarPersonajes(),
            razas: () => this.rSvc.RenovarRazas(),
            manuales: () => this.mSvc.RenovarManuales(),
            manuales_asociados: () => this.manualesAsociadosSvc.RenovarManualesAsociados(),
            tipos_criatura: () => this.tcSvc.RenovarTiposCriatura(),
            subtipos: () => this.subtipoSvc.RenovarSubtipos(),
            rasgos: () => this.raSvc.RenovarRasgos(),
            conjuros: () => this.coSvc.RenovarConjuros(),
            dotes: () => this.doSvc.RenovarDotes(),
            clases: () => this.clSvc.RenovarClases(),
            especiales: () => this.espSvc.RenovarEspeciales(),
            raciales: () => this.racialSvc.RenovarRaciales(),
            escuelas_conjuros: () => this.escSvc.RenovarEscuelas(),
            disciplinas_conjuros: () => this.disSvc.RenovarDisciplinas(),
            alineamientos: () => this.aSvc.RenovarAlineamientos(),
            alineamientos_basicos: () => this.aSvc.RenovarAlineamientosBasicos(),
            alineamientos_combinaciones: () => this.aSvc.RenovarAlineamientosCombinaciones(),
            alineamientos_prioridades: () => this.aSvc.RenovarAlineamientosPrioridades(),
            alineamientos_preferencia_ley: () => this.aSvc.RenovarAlineamientosPreferenciaLey(),
            alineamientos_preferencia_moral: () => this.aSvc.RenovarAlineamientosPreferenciaMoral(),
            habilidades: () => this.habSvc.RenovarHabilidades(),
            habilidades_custom: () => this.habSvc.RenovarHabilidadesCustom(),
            idiomas: () => this.idiSvc.RenovarIdiomas(),
            dominios: () => this.dominioSvc.RenovarDominios(),
            ambitos: () => this.ambitoSvc.RenovarAmbitos(),
            pabellones: () => this.pabellonSvc.RenovarPabellones(),
            deidades: () => this.deidadSvc.RenovarDeidades(),
            plantillas: () => this.plSvc.RenovarPlantillas(),
            ventajas_desventajas: () => this.ventajaSvc.RenovarVentajasYDesventajas(),
        };
    }

    ngOnInit(): void {
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

    private ordenarSyncItems(items: SyncItemUi[]): SyncItemUi[] {
        return [...items].sort((a, b) => {
            if (a.isPrimary !== b.isPrimary)
                return a.isPrimary ? -1 : 1;
            return a.label.localeCompare(b.label, 'es', { sensitivity: 'base' });
        });
    }

    async ejecutarSync(item: SyncItemUi): Promise<void> {
        if (this.keysEjecutando.has(item.key))
            return;

        this.keysEjecutando.add(item.key);
        try {
            const ok = await item.run();
            if (ok)
                await this.cacheSyncMetadataSvc.markSuccess(item.key, item.schemaVersion);
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
}
