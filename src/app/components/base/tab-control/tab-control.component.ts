import { Component, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { MatTabGroup } from '@angular/material/tabs';
import { Personaje } from 'src/app/interfaces/personaje';
import { Raza } from 'src/app/interfaces/raza';
import { Conjuro } from 'src/app/interfaces/conjuro';
import Swal from 'sweetalert2';
import { AptitudSortilega } from 'src/app/interfaces/aptitud-sortilega';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { RazaService } from 'src/app/services/raza.service';
import { Clase } from 'src/app/interfaces/clase';
import { ClaseService } from 'src/app/services/clase.service';
import { Subject, take, takeUntil } from 'rxjs';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DoteService } from 'src/app/services/dote.service';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { EspecialService } from 'src/app/services/especial.service';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import { RacialService } from 'src/app/services/racial.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { ManualReferenciaNavegacion } from 'src/app/interfaces/manual-referencia-navegacion';
import { ManualReferenciaNavigationService } from 'src/app/services/manual-referencia-navigation.service';
import { ManualAsociadoDetalle } from 'src/app/interfaces/manual-asociado';
import { ManualVistaNavigationService } from 'src/app/services/manual-vista-navigation.service';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { CacheSyncMetadataService } from 'src/app/services/cache-sync-metadata.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { SubtipoDetalle, SubtipoResumen } from 'src/app/interfaces/subtipo';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { VentajaService } from 'src/app/services/ventaja.service';
import { combineLatest } from 'rxjs';

@Component({
    selector: 'app-tab-control',
    templateUrl: './tab-control.component.html',
    styleUrls: ['./tab-control.component.sass']
})
export class TabControlComponent implements OnInit, OnDestroy {
    @Input() AbrirNuevoPersonajeTab!: number;
    @Input() AbrirListadoTab!: number;
    @Input() ListadoTabTipo!: string;
    @Input() ListadoTabOperacion!: string;
    usrPerm: number = 0;
    detallesPersonajeAbiertos: Personaje[] = [];
    detallesRazaAbiertos: Raza[] = [];
    detallesConjuroAbiertos: Conjuro[] = [];
    detallesSortilegaAbiertos: { ap: AptitudSortilega, fuente: string }[] = [];
    detallesTipoCriaturaAbiertos: TipoCriatura[] = [];
    detallesRasgoAbiertos: Rasgo[] = [];
    detallesDoteAbiertos: DoteContextual[] = [];
    detallesClaseAbiertos: Clase[] = [];
    detallesEspecialAbiertos: EspecialClaseDetalle[] = [];
    detallesRacialAbiertos: RacialDetalle[] = [];
    detallesManualAbiertos: ManualAsociadoDetalle[] = [];
    detallesPlantillaAbiertos: Plantilla[] = [];
    detallesSubtipoAbiertos: SubtipoDetalle[] = [];
    detallesVentajaAbiertos: VentajaDetalle[] = [];
    private readonly TAB_PERSONAJES = 'base:personajes';
    private readonly TAB_ADMIN = 'base:admin';
    private readonly TAB_NUEVO = 'base:nuevo';
    private readonly TAB_LISTADO = 'base:listado';
    private readonly TAB_IMPORTANTE = 'base:importante';
    private activeTabKey: string = this.TAB_PERSONAJES;
    private openerByTab = new Map<string, string>();
    private avisoCachePendienteMostrado = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private usrSvc: UserService,
        private pSvc: PersonajeService,
        private rSvc: RazaService,
        private tcSvc: TipoCriaturaService,
        private clSvc: ClaseService,
        private conjuroSvc: ConjuroService,
        private doteSvc: DoteService,
        private especialSvc: EspecialService,
        private racialSvc: RacialService,
        private rasgoSvc: RasgoService,
        private plantillaSvc: PlantillaService,
        private subtipoSvc: SubtipoService,
        private ventajaSvc: VentajaService,
        private nuevoPSvc: NuevoPersonajeService,
        private manualRefNavSvc: ManualReferenciaNavigationService,
        private manualVistaNavSvc: ManualVistaNavigationService,
        private cacheSyncMetadataSvc: CacheSyncMetadataService,
        private ngZone: NgZone,
    ) { }

    @ViewChild(MatTabGroup) TabGroup!: MatTabGroup;

    ngOnInit() {
        this.usrPerm = this.usrSvc.Usuario.permisos;
        this.usrSvc.permisos$
            .pipe(takeUntil(this.destroy$))
            .subscribe((permisos) => this.usrPerm = Number(permisos) === 1 ? 1 : 0);
        this.manualRefNavSvc.aperturas$
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload) => this.abrirDesdeManual(payload));
        this.manualVistaNavSvc.aperturas$
            .pipe(takeUntil(this.destroy$))
            .subscribe((manual) => this.abrirDetallesManual(manual));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngAfterViewInit() {
        this.activeTabKey = this.TAB_PERSONAJES;
        this.verificarPendientesCacheAdminEnInicio();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['AbrirNuevoPersonajeTab'] && changes['AbrirNuevoPersonajeTab'].currentValue) {
            setTimeout(() => {
                this.registerOpenContext(this.TAB_NUEVO, this.getSafeOpenerKey());
                this.selectTabByKey(this.TAB_NUEVO);
            }, 100);
        } else if (changes['AbrirListadoTab'] && changes['AbrirListadoTab'].currentValue) {
            setTimeout(() => {
                this.registerOpenContext(this.TAB_LISTADO, this.getSafeOpenerKey());
                this.selectTabByKey(this.TAB_LISTADO);
            }, 100);
        }
    }

    onTabChange(event: any) {
        const key = this.tabKeyByIndex(Number(event?.index ?? 0));
        this.activeTabKey = key ?? this.TAB_PERSONAJES;
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            if (this.TabGroup._tabs.toArray()[this.TabGroup.selectedIndex ?? 0].textLabel === 'Nuevo personaje') {
                Swal.fire({
                    title: "¿Estas seguro?",
                    text: "Perderás el personaje que estás creando",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Sí, sácame de aquí"
                }).then((result) => {
                    if (result.isConfirmed)
                        this.onEscPressed();
                });
            } else
                this.onEscPressed();
        }
    }

    // Función que se ejecuta al presionar "Esc"
    onEscPressed(): void {
        const currentIndex = this.TabGroup.selectedIndex;
        if (!currentIndex || currentIndex == 0)
            return;
        const tabLabel = this.TabGroup._tabs.toArray()[currentIndex].textLabel;
        if (this.esTabAdmin(tabLabel) || tabLabel === 'Información importante')
            return;
        if (this.detallesPersonajeAbiertos.map(p => p.Nombre).includes(tabLabel) && this.quitarDetallesPersonaje(tabLabel))
            return;
        else if (this.detallesRazaAbiertos.map(r => r.Nombre).includes(tabLabel) && this.quitarDetallesRaza(tabLabel))
            return;
        else if (this.detallesConjuroAbiertos.map(c => c.Nombre).includes(tabLabel) && this.quitarDetallesConjuro(tabLabel))
            return;
        else if (this.detallesSortilegaAbiertos.map(c => c.ap.Conjuro.Nombre).includes(tabLabel) && this.quitarDetallesSortilega(tabLabel))
            return;
        else if (this.detallesTipoCriaturaAbiertos.map(t => t.Nombre).includes(tabLabel) && this.quitarDetallesTipoCriatura(tabLabel))
            return;
        else if (this.detallesRasgoAbiertos.map(t => t.Nombre).includes(tabLabel) && this.quitarDetallesRasgo(tabLabel))
            return;
        else if (this.detallesClaseAbiertos.map(c => this.getEtiquetaClase(c)).includes(tabLabel) && this.quitarDetallesClase(tabLabel))
            return;
        else if (this.detallesDoteAbiertos.map(d => this.getEtiquetaDote(d)).includes(tabLabel) && this.quitarDetallesDotePorLabel(tabLabel))
            return;
        else if (this.detallesVentajaAbiertos.map(v => this.getEtiquetaVentaja(v)).includes(tabLabel) && this.quitarDetallesVentaja(tabLabel))
            return;
        else if (this.detallesEspecialAbiertos.map(e => this.getEtiquetaEspecial(e)).includes(tabLabel) && this.quitarDetallesEspecial(tabLabel))
            return;
        else if (this.detallesRacialAbiertos.map(r => this.getEtiquetaRacial(r)).includes(tabLabel) && this.quitarDetallesRacial(tabLabel))
            return;
        else if (this.detallesPlantillaAbiertos.map(p => this.getEtiquetaPlantilla(p)).includes(tabLabel) && this.quitarDetallesPlantilla(tabLabel))
            return;
        else if (this.detallesSubtipoAbiertos.map(s => this.getEtiquetaSubtipo(s)).includes(tabLabel) && this.quitarDetallesSubtipo(tabLabel))
            return;
        else if (this.detallesManualAbiertos.map(m => this.getEtiquetaManual(m)).includes(tabLabel) && this.quitarDetallesManual(tabLabel))
            return;
        else if (tabLabel.includes('Nuevo personaje'))
            this.quitarNuevoPersonaje();
        else if (tabLabel.includes('Lista de'))
            this.quitarListado();
    }

    private buildOrderedTabKeys(): string[] {
        const keys: string[] = [this.TAB_PERSONAJES];
        if (this.usrPerm === 1)
            keys.push(this.TAB_ADMIN);
        keys.push(...this.detallesPersonajeAbiertos.map((pj) => this.getPersonajeTabKey(pj)));
        if (this.AbrirNuevoPersonajeTab)
            keys.push(this.TAB_NUEVO);
        if (this.AbrirListadoTab)
            keys.push(this.TAB_LISTADO);
        keys.push(...this.detallesManualAbiertos.map((manual) => this.getManualTabKey(manual)));
        keys.push(...this.detallesRazaAbiertos.map((raza) => this.getRazaTabKey(raza)));
        keys.push(...this.detallesConjuroAbiertos.map((conjuro) => this.getConjuroTabKey(conjuro)));
        keys.push(...this.detallesSortilegaAbiertos.map((tupla) => this.getSortilegaTabKey(tupla)));
        keys.push(...this.detallesTipoCriaturaAbiertos.map((tipo) => this.getTipoTabKey(tipo)));
        keys.push(...this.detallesRasgoAbiertos.map((rasgo) => this.getRasgoTabKey(rasgo)));
        keys.push(...this.detallesClaseAbiertos.map((clase) => this.getClaseTabKey(clase)));
        keys.push(...this.detallesEspecialAbiertos.map((especial) => this.getEspecialTabKey(especial)));
        keys.push(...this.detallesRacialAbiertos.map((racial) => this.getRacialTabKey(racial)));
        keys.push(...this.detallesDoteAbiertos.map((doteCtx) => this.getDoteTabKey(doteCtx)));
        keys.push(...this.detallesVentajaAbiertos.map((ventaja) => this.getVentajaTabKey(ventaja)));
        keys.push(...this.detallesPlantillaAbiertos.map((plantilla) => this.getPlantillaTabKey(plantilla)));
        keys.push(...this.detallesSubtipoAbiertos.map((subtipo) => this.getSubtipoTabKey(subtipo)));
        keys.push(this.TAB_IMPORTANTE);
        return keys;
    }

    private tabKeyByIndex(index: number): string | null {
        const keys = this.buildOrderedTabKeys();
        if (!Number.isFinite(index) || index < 0 || index >= keys.length)
            return null;
        return keys[index];
    }

    private tabIndexByKey(key: string): number {
        const keys = this.buildOrderedTabKeys();
        return keys.indexOf(key);
    }

    private isTabKeyOpen(key: string): boolean {
        return this.tabIndexByKey(key) >= 0;
    }

    private getSafeOpenerKey(): string {
        if (this.isTabKeyOpen(this.activeTabKey))
            return this.activeTabKey;
        return this.TAB_PERSONAJES;
    }

    private registerOpenContext(targetKey: string, openerKey: string): void {
        if (!targetKey || this.openerByTab.has(targetKey))
            return;
        const opener = this.isTabKeyOpen(openerKey) ? openerKey : this.TAB_PERSONAJES;
        this.openerByTab.set(targetKey, opener);
    }

    private selectTabByKey(key: string, fallbackToPersonajes: boolean = true): void {
        if (!this.TabGroup)
            return;
        const idx = this.tabIndexByKey(key);
        if (idx >= 0) {
            this.TabGroup.selectedIndex = idx;
            this.activeTabKey = key;
            return;
        }
        if (fallbackToPersonajes) {
            const idxFallback = this.tabIndexByKey(this.TAB_PERSONAJES);
            if (idxFallback >= 0) {
                this.TabGroup.selectedIndex = idxFallback;
                this.activeTabKey = this.TAB_PERSONAJES;
            }
        }
    }

    private focusOpenedTab(targetKey: string): void {
        setTimeout(() => this.selectTabByKey(targetKey), 100);
    }

    private closeTabWithNavigation(closingKey: string, removeFn: () => boolean): boolean {
        const wasActive = this.activeTabKey === closingKey;
        const opener = this.openerByTab.get(closingKey) ?? this.TAB_PERSONAJES;
        const removed = removeFn();
        if (!removed)
            return false;

        this.openerByTab.delete(closingKey);

        if (!wasActive)
            return true;

        const target = this.isTabKeyOpen(opener) ? opener : this.TAB_PERSONAJES;
        this.selectTabByKey(target, true);
        return true;
    }

    async abrirDetallesPersonaje(value: number) {
        const abierto = this.detallesPersonajeAbiertos.find(p => p.Id == value);
        if (abierto)
            this.selectTabByKey(this.getPersonajeTabKey(abierto));
        else {
            (await this.pSvc.getDetallesPersonaje(value)).subscribe(personaje => {
                const targetKey = this.getPersonajeTabKey(personaje);
                this.detallesPersonajeAbiertos.push(personaje);
                this.registerOpenContext(targetKey, this.getSafeOpenerKey());
                this.focusOpenedTab(targetKey);
            });
        }
    }
    quitarDetallesPersonaje(value: string | Personaje): boolean {
        const tab = typeof value === 'string'
            ? this.detallesPersonajeAbiertos.find(p => p.Nombre === value)
            : this.detallesPersonajeAbiertos.find(p => Number(p.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getPersonajeTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesPersonajeAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesPersonajeAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    recibirObjetoListado(value: { item: any, tipo: string }) {
        if (value.tipo === 'razas') {
            this.abrirDetallesRaza(value.item);
        } else if (value.tipo === 'conjuros') {
            this.abrirDetallesConjuro(value.item);
        } else if (value.tipo === 'tipos de criatura') {
            this.abrirDetallesTipoCriatura(value.item);
        } else if (value.tipo === 'rasgos') {
            this.abrirDetallesRasgo(value.item);
        } else if (value.tipo === 'clases') {
            this.abrirDetallesClase(value.item);
        } else if (value.tipo === 'dotes') {
            this.abrirDetallesDote(value.item);
        } else if (value.tipo === 'ventajas') {
            this.abrirDetallesVentaja(value.item);
        } else if (value.tipo === 'especiales') {
            this.abrirDetallesEspecial(value.item);
        } else if (value.tipo === 'raciales') {
            this.abrirDetallesRacial(value.item);
        } else if (value.tipo === 'plantillas') {
            this.abrirDetallesPlantilla(value.item);
        } else if (value.tipo === 'subtipos') {
            this.abrirDetallesSubtipoDesdeResumen(value.item);
        }
    }

    private async verificarPendientesCacheAdminEnInicio(): Promise<void> {
        if (this.usrPerm !== 1 || this.avisoCachePendienteMostrado)
            return;

        this.avisoCachePendienteMostrado = true;

        try {
            const metaSnapshot = await this.cacheSyncMetadataSvc.getSnapshotOnce();
            const uiState = this.cacheSyncMetadataSvc.buildUiState(metaSnapshot);
            const hayPendientes = uiState.some(item => item.isPrimary);
            if (!hayPendientes)
                return;

            const result = await Swal.fire({
                icon: 'warning',
                title: 'Hay catálogos desactualizados',
                text: 'Se detectaron sincronizaciones pendientes en el Admin panel.',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
                showCancelButton: true,
                confirmButtonText: 'Ir al admin panel',
                cancelButtonText: 'Luego',
            });

            if (!result.isConfirmed)
                return;

            this.irAlPanelAdministracion();
        } catch (error) {
            // Si falla la lectura de metadata, no bloqueamos el resto del flujo de tabs.
        }
    }

    private irAlPanelAdministracion(): void {
        if (this.usrPerm !== 1 || !this.TabGroup)
            return;

        const navegar = () => this.selectTabByKey(this.TAB_ADMIN, false);

        this.ngZone.run(navegar);
        setTimeout(() => this.ngZone.run(navegar), 0);
        setTimeout(() => this.ngZone.run(navegar), 80);
    }

    async abrirDetallesRaza(raza: Raza) {
        const abierto = this.detallesRazaAbiertos.find(r => r.Id === raza.Id);
        if (abierto)
            this.selectTabByKey(this.getRazaTabKey(abierto));
        else {
            const targetKey = this.getRazaTabKey(raza);
            this.detallesRazaAbiertos.push(raza);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }

    async abrirDetallesRazaPorId(idRaza: number) {
        const abierto = this.detallesRazaAbiertos.find(r => r.Id === idRaza);
        if (abierto) {
            this.selectTabByKey(this.getRazaTabKey(abierto));
            return;
        }

        (await this.rSvc.getRaza(idRaza)).subscribe(raza => {
            this.abrirDetallesRaza(raza);
        });
    }

    quitarDetallesRaza(value: string | Raza): boolean {
        const tab = typeof value === 'string'
            ? this.detallesRazaAbiertos.find(r => r.Nombre === value)
            : this.detallesRazaAbiertos.find(r => Number(r.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getRazaTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesRazaAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesRazaAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    async abrirDetallesConjuro(conjuro: Conjuro) {
        const abierto = this.detallesConjuroAbiertos.find(c => c.Id === conjuro.Id);
        if (abierto)
            this.selectTabByKey(this.getConjuroTabKey(abierto));
        else {
            const targetKey = this.getConjuroTabKey(conjuro);
            this.detallesConjuroAbiertos.push(conjuro);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }
    quitarDetallesConjuro(value: string | Conjuro): boolean {
        const tab = typeof value === 'string'
            ? this.detallesConjuroAbiertos.find(c => c.Nombre === value)
            : this.detallesConjuroAbiertos.find(c => Number(c.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getConjuroTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesConjuroAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesConjuroAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    async abrirDetallesSortilega(ap: AptitudSortilega, fuente: string) {
        const abierto = this.detallesSortilegaAbiertos.find(c => c.ap.Conjuro.Id === ap.Conjuro.Id);
        if (abierto)
            this.selectTabByKey(this.getSortilegaTabKey(abierto));
        else {
            const tupla = { ap, fuente };
            const targetKey = this.getSortilegaTabKey(tupla);
            this.detallesSortilegaAbiertos.push(tupla);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }
    quitarDetallesSortilega(value: string | { ap: AptitudSortilega, fuente: string }): boolean {
        const tab = typeof value === 'string'
            ? this.detallesSortilegaAbiertos.find(c => c.ap.Conjuro.Nombre === value)
            : this.detallesSortilegaAbiertos.find(c => Number(c.ap.Conjuro.Id) === Number(value.ap.Conjuro.Id));
        if (!tab)
            return false;
        const closingKey = this.getSortilegaTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesSortilegaAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesSortilegaAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    async abrirDetallesTipoCriatura(tipo: TipoCriatura) {
        const abierto = this.detallesTipoCriaturaAbiertos.find(t => t.Id === tipo.Id);
        if (abierto)
            this.selectTabByKey(this.getTipoTabKey(abierto));
        else {
            const targetKey = this.getTipoTabKey(tipo);
            this.detallesTipoCriaturaAbiertos.push(tipo);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }
    quitarDetallesTipoCriatura(value: string | TipoCriatura): boolean {
        const tab = typeof value === 'string'
            ? this.detallesTipoCriaturaAbiertos.find(t => t.Nombre === value)
            : this.detallesTipoCriaturaAbiertos.find(t => Number(t.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getTipoTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesTipoCriaturaAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesTipoCriaturaAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    abrirDetallesRasgo(rasgo: Rasgo) {
        if (!rasgo)
            return;

        const id = Number(rasgo?.Id);
        if (Number.isFinite(id) && id > 0) {
            const abierto = this.detallesRasgoAbiertos.find(r => r.Id === id);
            if (abierto) {
                this.selectTabByKey(this.getRasgoTabKey(abierto));
                return;
            }

            this.rasgoSvc.getRasgo(id).pipe(take(1)).subscribe({
                next: detalle => this.abrirDetallesRasgoConDatos({
                    Id: id,
                    Nombre: `${detalle?.Nombre ?? rasgo?.Nombre ?? ''}`.trim(),
                    Descripcion: `${detalle?.Descripcion ?? rasgo?.Descripcion ?? ''}`,
                    Oficial: this.toBoolean(detalle?.Oficial ?? rasgo?.Oficial, true),
                }),
                error: () => this.abrirDetallesRasgoConDatos({
                    Id: id,
                    Nombre: `${rasgo?.Nombre ?? ''}`.trim(),
                    Descripcion: `${rasgo?.Descripcion ?? ''}`,
                    Oficial: this.toBoolean(rasgo?.Oficial, true),
                }),
            });
            return;
        }

        this.abrirDetallesRasgoConDatos({
            Id: 0,
            Nombre: `${rasgo?.Nombre ?? ''}`.trim(),
            Descripcion: `${rasgo?.Descripcion ?? ''}`,
            Oficial: this.toBoolean(rasgo?.Oficial, true),
        });
    }

    private abrirDetallesRasgoConDatos(rasgo: Rasgo): void {
        const nombre = `${rasgo?.Nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;

        const abierto = this.detallesRasgoAbiertos.find(r =>
            (Number(r.Id) > 0 && Number(rasgo.Id) > 0 && Number(r.Id) === Number(rasgo.Id))
            || this.normalizar(r.Nombre) === this.normalizar(nombre));
        if (abierto) {
            this.selectTabByKey(this.getRasgoTabKey(abierto));
            return;
        }

        const creado: Rasgo = {
            Id: Number(rasgo?.Id) > 0 ? Number(rasgo.Id) : 0,
            Nombre: nombre,
            Descripcion: `${rasgo?.Descripcion ?? ''}`,
            Oficial: this.toBoolean(rasgo?.Oficial, true),
        };
        const targetKey = this.getRasgoTabKey(creado);
        this.detallesRasgoAbiertos.push({
            ...creado,
        });
        this.registerOpenContext(targetKey, this.getSafeOpenerKey());
        this.focusOpenedTab(targetKey);
    }
    quitarDetallesRasgo(value: string | Rasgo): boolean {
        const tab = typeof value === 'string'
            ? this.detallesRasgoAbiertos.find(t => t.Nombre === value)
            : this.detallesRasgoAbiertos.find(t => Number(t.Id) > 0 && Number(t.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getRasgoTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesRasgoAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesRasgoAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    getEtiquetaClase(clase: Clase): string {
        return `${clase.Nombre} (Clase)`;
    }

    getEtiquetaEspecial(especial: EspecialClaseDetalle): string {
        return `${especial.Nombre} (Especial)`;
    }

    getEtiquetaRacial(racial: RacialDetalle): string {
        return `${racial.Nombre} (Racial)`;
    }

    getEtiquetaManual(manual: ManualAsociadoDetalle): string {
        return `${manual.Nombre} (Manual)`;
    }

    getEtiquetaPlantilla(plantilla: Plantilla): string {
        return `${plantilla.Nombre} (Plantilla)`;
    }

    getEtiquetaSubtipo(subtipo: SubtipoDetalle): string {
        return `${subtipo.Nombre} (Subtipo)`;
    }

    getEtiquetaVentaja(ventaja: VentajaDetalle): string {
        return `${ventaja.Nombre} (${this.esDesventaja(ventaja) ? 'Desventaja' : 'Ventaja'})`;
    }

    private getPersonajeTabKey(personaje: Personaje): string {
        return `personaje:${Number(personaje?.Id ?? 0)}`;
    }

    private getRazaTabKey(raza: Raza): string {
        return `raza:${Number(raza?.Id ?? 0)}`;
    }

    private getConjuroTabKey(conjuro: Conjuro): string {
        return `conjuro:${Number(conjuro?.Id ?? 0)}`;
    }

    private getSortilegaTabKey(tupla: { ap: AptitudSortilega, fuente: string }): string {
        return `sortilega:${Number(tupla?.ap?.Conjuro?.Id ?? 0)}`;
    }

    private getTipoTabKey(tipo: TipoCriatura): string {
        return `tipo:${Number(tipo?.Id ?? 0)}`;
    }

    private getRasgoTabKey(rasgo: Rasgo): string {
        const id = Number(rasgo?.Id ?? 0);
        if (Number.isFinite(id) && id > 0)
            return `rasgo:${id}`;
        return `rasgo:name:${this.normalizar(rasgo?.Nombre ?? '')}`;
    }

    private getClaseTabKey(clase: Clase): string {
        return `clase:${Number(clase?.Id ?? 0)}`;
    }

    private getEspecialTabKey(especial: EspecialClaseDetalle): string {
        return `especial:${Number(especial?.Id ?? 0)}`;
    }

    private getRacialTabKey(racial: RacialDetalle): string {
        return `racial:${Number(racial?.Id ?? 0)}`;
    }

    private getDoteTabKey(doteCtx: DoteContextual): string {
        return `dote:${this.getClaveDoteTab(doteCtx)}`;
    }

    private getVentajaTabKey(ventaja: VentajaDetalle): string {
        const variante = this.esDesventaja(ventaja) ? 'd' : 'v';
        return `ventaja:${Number(ventaja?.Id ?? 0)}:${variante}`;
    }

    private getPlantillaTabKey(plantilla: Plantilla): string {
        return `plantilla:${Number(plantilla?.Id ?? 0)}`;
    }

    private getSubtipoTabKey(subtipo: SubtipoDetalle): string {
        return `subtipo:${Number(subtipo?.Id ?? 0)}`;
    }

    private getManualTabKey(manual: ManualAsociadoDetalle): string {
        return `manual:${Number(manual?.Id ?? 0)}`;
    }

    private esDesventaja(ventaja: VentajaDetalle): boolean {
        return Number(ventaja?.Coste) > 0;
    }

    async abrirDetallesClase(clase: Clase) {
        const abierto = this.detallesClaseAbiertos.find(c => c.Id === clase.Id);
        if (abierto)
            this.selectTabByKey(this.getClaseTabKey(abierto));
        else {
            const targetKey = this.getClaseTabKey(clase);
            this.detallesClaseAbiertos.push(clase);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }

    abrirDetallesConjuroPorId(idConjuro: number) {
        const id = Number(idConjuro);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesConjuroAbiertos.find(c => c.Id === id);
        if (abierto) {
            this.selectTabByKey(this.getConjuroTabKey(abierto));
            return;
        }

        this.conjuroSvc.getConjuro(id).pipe(take(1)).subscribe(conjuro => {
            this.abrirDetallesConjuro(conjuro);
        });
    }

    abrirDetallesDotePorId(idDote: number) {
        const id = Number(idDote);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesDoteAbiertos.find(d => Number(d?.Dote?.Id) === id);
        if (abierto) {
            this.selectTabByKey(this.getDoteTabKey(abierto));
            return;
        }

        this.doteSvc.getDote(id).pipe(take(1)).subscribe(dote => {
            this.abrirDetallesDote(dote);
        });
    }

    abrirDetallesDotePorNombre(nombreDote: string) {
        if (this.esNombreNoAplicable(nombreDote))
            return;

        const abierto = this.detallesDoteAbiertos.find(d => this.normalizar(d?.Dote?.Nombre ?? '') === this.normalizar(nombreDote));
        if (abierto) {
            this.selectTabByKey(this.getDoteTabKey(abierto));
            return;
        }

        this.doteSvc.getDotes().pipe(take(1)).subscribe(dotes => {
            const encontrada = dotes.find(d => this.normalizar(d?.Nombre ?? '') === this.normalizar(nombreDote));
            if (encontrada) {
                this.abrirDetallesDote(encontrada);
                return;
            }

            Swal.fire({
                icon: 'warning',
                title: 'Dote no encontrada',
                text: `No se encontró una dote catalogada para "${nombreDote}"`,
                showConfirmButton: true
            });
        });
    }

    abrirDetallesClasePorNombre(nombreClase: string) {
        if (!nombreClase || nombreClase.trim().length < 1)
            return;

        const encontrado = this.detallesClaseAbiertos.find(c => this.normalizar(c.Nombre) === this.normalizar(nombreClase));
        if (encontrado) {
            this.selectTabByKey(this.getClaseTabKey(encontrado));
            return;
        }

        this.clSvc.buscarPorNombre(nombreClase).pipe(take(1)).subscribe(clase => {
            if (clase) {
                this.abrirDetallesClase(clase);
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Clase no encontrada',
                    text: `No se encontró la clase "${nombreClase}" en cache`,
                    showConfirmButton: true
                });
            }
        });
    }

    abrirDetallesClasePorId(idClase: number) {
        const id = Number(idClase);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesClaseAbiertos.find(c => c.Id === id);
        if (abierto) {
            this.selectTabByKey(this.getClaseTabKey(abierto));
            return;
        }

        this.clSvc.getClase(id).pipe(take(1)).subscribe(clase => {
            this.abrirDetallesClase(clase);
        });
    }

    quitarDetallesClase(value: string | Clase): boolean {
        const tab = typeof value === 'string'
            ? this.detallesClaseAbiertos.find(c => this.getEtiquetaClase(c) === value)
            : this.detallesClaseAbiertos.find(c => Number(c.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getClaseTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesClaseAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesClaseAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    async abrirDetallesEspecial(especial: EspecialClaseDetalle) {
        const abierto = this.detallesEspecialAbiertos.find(e => e.Id === especial.Id);
        if (abierto)
            this.selectTabByKey(this.getEspecialTabKey(abierto));
        else {
            const targetKey = this.getEspecialTabKey(especial);
            this.detallesEspecialAbiertos.push(especial);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }

    abrirDetallesEspecialPorId(idEspecial: number) {
        const id = Number(idEspecial);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesEspecialAbiertos.find(e => e.Id === id);
        if (abierto) {
            this.selectTabByKey(this.getEspecialTabKey(abierto));
            return;
        }

        this.especialSvc.getEspecial(id).pipe(take(1)).subscribe(especial => {
            this.abrirDetallesEspecial(especial);
        });
    }

    abrirDetallesEspecialPorNombre(nombreEspecial: string) {
        if (this.esNombreNoAplicable(nombreEspecial))
            return;

        const abierto = this.detallesEspecialAbiertos.find(e => this.normalizar(e.Nombre) === this.normalizar(nombreEspecial));
        if (abierto) {
            this.selectTabByKey(this.getEspecialTabKey(abierto));
            return;
        }

        this.especialSvc.getEspeciales().pipe(take(1)).subscribe(especiales => {
            const encontrado = especiales.find(e => this.normalizar(e.Nombre) === this.normalizar(nombreEspecial));
            if (encontrado) {
                this.abrirDetallesEspecial(encontrado);
                return;
            }

            this.doteSvc.getDotes().pipe(take(1)).subscribe(dotes => {
                const doteEncontrada = dotes.find(d => this.normalizar(d?.Nombre ?? '') === this.normalizar(nombreEspecial));
                if (doteEncontrada) {
                    this.abrirDetallesDote(doteEncontrada);
                    return;
                }

                Swal.fire({
                    icon: 'warning',
                    title: 'Especial no encontrado',
                    text: `No se encontró un especial catalogado para "${nombreEspecial}"`,
                    showConfirmButton: true
                });
            });
        });
    }

    quitarDetallesEspecial(value: string | EspecialClaseDetalle): boolean {
        const tab = typeof value === 'string'
            ? this.detallesEspecialAbiertos.find(e => this.getEtiquetaEspecial(e) === value)
            : this.detallesEspecialAbiertos.find(e => Number(e.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getEspecialTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesEspecialAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesEspecialAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    async abrirDetallesRacial(racial: RacialDetalle) {
        const abierto = this.detallesRacialAbiertos.find(r => r.Id === racial.Id);
        if (abierto)
            this.selectTabByKey(this.getRacialTabKey(abierto));
        else {
            const targetKey = this.getRacialTabKey(racial);
            this.detallesRacialAbiertos.push(racial);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }

    abrirDetallesRacialPorId(idRacial: number) {
        const id = Number(idRacial);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesRacialAbiertos.find(r => r.Id === id);
        if (abierto) {
            this.selectTabByKey(this.getRacialTabKey(abierto));
            return;
        }

        this.racialSvc.getRacial(id).pipe(take(1)).subscribe(racial => {
            this.abrirDetallesRacial(racial);
        });
    }

    abrirDetallesRacialPorNombre(nombreRacial: string) {
        if (this.esNombreNoAplicable(nombreRacial))
            return;

        const abierto = this.buscarRacialPorNombre(this.detallesRacialAbiertos, nombreRacial);
        if (abierto) {
            this.selectTabByKey(this.getRacialTabKey(abierto));
            return;
        }

        this.racialSvc.getRaciales().pipe(take(1)).subscribe(raciales => {
            const encontrada = this.buscarRacialPorNombre(raciales, nombreRacial);
            if (encontrada) {
                this.abrirDetallesRacial(encontrada);
                return;
            }

            Swal.fire({
                icon: 'warning',
                title: 'Racial no encontrada',
                text: `No se encontró una racial catalogada para "${nombreRacial}"`,
                showConfirmButton: true
            });
        });
    }

    abrirDetallesRacialDesdeReferencia(referencia: RacialReferencia | string) {
        if (typeof referencia === 'string') {
            this.abrirDetallesRacialPorNombre(referencia.trim());
            return;
        }

        const id = Number(referencia?.id);
        if (Number.isFinite(id) && id > 0) {
            this.abrirDetallesRacialPorId(id);
            return;
        }

        this.abrirDetallesRacialPorNombre(`${referencia?.nombre ?? ''}`.trim());
    }

    abrirDetallesTipoCriaturaPorId(idTipo: number) {
        const id = Number(idTipo);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesTipoCriaturaAbiertos.find(t => t.Id === id);
        if (abierto) {
            this.selectTabByKey(this.getTipoTabKey(abierto));
            return;
        }

        this.tcSvc.getTipoCriatura(id).pipe(take(1)).subscribe(tipo => {
            this.abrirDetallesTipoCriatura(tipo);
        });
    }

    async abrirDetallesPlantilla(plantilla: Plantilla) {
        const abierto = this.detallesPlantillaAbiertos.find(p => p.Id === plantilla.Id);
        if (abierto)
            this.selectTabByKey(this.getPlantillaTabKey(abierto));
        else {
            const targetKey = this.getPlantillaTabKey(plantilla);
            this.detallesPlantillaAbiertos.push(plantilla);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }

    abrirDetallesPlantillaPorId(idPlantilla: number) {
        const id = Number(idPlantilla);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesPlantillaAbiertos.find(p => p.Id === id);
        if (abierto) {
            this.selectTabByKey(this.getPlantillaTabKey(abierto));
            return;
        }

        this.plantillaSvc.getPlantilla(id).pipe(take(1)).subscribe(plantilla => {
            this.abrirDetallesPlantilla(plantilla);
        });
    }

    abrirDetallesPlantillaPorNombre(nombrePlantilla: string) {
        if (!nombrePlantilla || nombrePlantilla.trim().length < 1)
            return;

        const abierta = this.detallesPlantillaAbiertos.find(p => this.normalizar(p.Nombre) === this.normalizar(nombrePlantilla));
        if (abierta) {
            this.selectTabByKey(this.getPlantillaTabKey(abierta));
            return;
        }

        this.plantillaSvc.buscarPorNombre(nombrePlantilla).pipe(take(1)).subscribe(plantilla => {
            if (plantilla) {
                this.abrirDetallesPlantilla(plantilla);
                return;
            }

            Swal.fire({
                icon: 'warning',
                title: 'Plantilla no encontrada',
                text: `No se encontro la plantilla "${nombrePlantilla}"`,
                showConfirmButton: true
            });
        });
    }

    abrirDetallesPlantillaDesdeFicha(payload: { id?: number | null; nombre: string; }) {
        const id = Number(payload?.id ?? 0);
        if (Number.isFinite(id) && id > 0) {
            this.abrirDetallesPlantillaPorId(id);
            return;
        }

        this.abrirDetallesPlantillaPorNombre(payload?.nombre ?? '');
    }

    async abrirDetallesSubtipo(subtipo: SubtipoDetalle) {
        const abierto = this.detallesSubtipoAbiertos.find(s => s.Id === subtipo.Id);
        if (abierto)
            this.selectTabByKey(this.getSubtipoTabKey(abierto));
        else {
            const targetKey = this.getSubtipoTabKey(subtipo);
            this.detallesSubtipoAbiertos.push(subtipo);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }

    abrirDetallesSubtipoPorId(idSubtipo: number) {
        const id = Number(idSubtipo);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesSubtipoAbiertos.find(s => s.Id === id);
        if (abierto) {
            this.selectTabByKey(this.getSubtipoTabKey(abierto));
            return;
        }

        this.subtipoSvc.getSubtipo(id).pipe(take(1)).subscribe(subtipo => {
            this.abrirDetallesSubtipo(subtipo);
        });
    }

    abrirDetallesSubtipoPorNombre(nombreSubtipo: string) {
        if (!nombreSubtipo || nombreSubtipo.trim().length < 1)
            return;

        const abierto = this.detallesSubtipoAbiertos.find(s => this.normalizar(s.Nombre) === this.normalizar(nombreSubtipo));
        if (abierto) {
            this.selectTabByKey(this.getSubtipoTabKey(abierto));
            return;
        }

        this.subtipoSvc.buscarPorNombre(nombreSubtipo).pipe(take(1)).subscribe(subtipo => {
            if (subtipo) {
                this.abrirDetallesSubtipoPorId(subtipo.Id);
                return;
            }

            Swal.fire({
                icon: 'warning',
                title: 'Subtipo no encontrado',
                text: `No se encontro el subtipo "${nombreSubtipo}"`,
                showConfirmButton: true
            });
        });
    }

    abrirDetallesSubtipoDesdeResumen(subtipo: SubtipoResumen) {
        const id = Number(subtipo?.Id ?? 0);
        if (Number.isFinite(id) && id > 0) {
            this.abrirDetallesSubtipoPorId(id);
            return;
        }
        this.abrirDetallesSubtipoPorNombre(subtipo?.Nombre ?? '');
    }

    abrirDetallesSubtipoDesdeReferencia(payload: { Id?: number | null; Nombre?: string; } | string) {
        if (typeof payload === 'string') {
            this.abrirDetallesSubtipoPorNombre(payload.trim());
            return;
        }

        const id = Number(payload?.Id ?? 0);
        if (Number.isFinite(id) && id > 0) {
            this.abrirDetallesSubtipoPorId(id);
            return;
        }

        this.abrirDetallesSubtipoPorNombre(`${payload?.Nombre ?? ''}`.trim());
    }

    quitarDetallesRacial(value: string | RacialDetalle): boolean {
        const tab = typeof value === 'string'
            ? this.detallesRacialAbiertos.find(r => this.getEtiquetaRacial(r) === value)
            : this.detallesRacialAbiertos.find(r => Number(r.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getRacialTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesRacialAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesRacialAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    quitarDetallesPlantilla(value: string | Plantilla): boolean {
        const tab = typeof value === 'string'
            ? this.detallesPlantillaAbiertos.find(p => this.getEtiquetaPlantilla(p) === value)
            : this.detallesPlantillaAbiertos.find(p => Number(p.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getPlantillaTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesPlantillaAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesPlantillaAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    quitarDetallesSubtipo(value: string | SubtipoDetalle): boolean {
        const tab = typeof value === 'string'
            ? this.detallesSubtipoAbiertos.find(s => this.getEtiquetaSubtipo(s) === value)
            : this.detallesSubtipoAbiertos.find(s => Number(s.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getSubtipoTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesSubtipoAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesSubtipoAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    abrirDetallesManual(manual: ManualAsociadoDetalle): void {
        if (!manual || Number(manual.Id) <= 0)
            return;
        const abierto = this.detallesManualAbiertos.find(m => m.Id === manual.Id);
        if (abierto) {
            this.selectTabByKey(this.getManualTabKey(abierto));
            return;
        }

        const targetKey = this.getManualTabKey(manual);
        this.detallesManualAbiertos.push(manual);
        this.registerOpenContext(targetKey, this.getSafeOpenerKey());
        this.focusOpenedTab(targetKey);
    }

    quitarDetallesManual(value: string | ManualAsociadoDetalle): boolean {
        const tab = typeof value === 'string'
            ? this.detallesManualAbiertos.find(m => this.getEtiquetaManual(m) === value)
            : this.detallesManualAbiertos.find(m => Number(m.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getManualTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesManualAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesManualAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    getEtiquetaDote(doteCtx: DoteContextual): string {
        const extra = doteCtx.Contexto.Extra && doteCtx.Contexto.Extra !== 'No aplica' ? `: ${doteCtx.Contexto.Extra}` : '';
        return `${doteCtx.Dote.Nombre} (Dote - ${doteCtx.Contexto.Entidad}${extra})`;
    }

    getClaveDoteTab(doteCtx: DoteContextual): string {
        return `${doteCtx.Dote.Id}|${doteCtx.Contexto.Entidad}|${doteCtx.Contexto.Id_extra}|${doteCtx.Contexto.Extra ?? ''}`;
    }

    toDoteContextual(dote: Dote | DoteContextual): DoteContextual {
        if ((dote as DoteContextual).Dote)
            return dote as DoteContextual;
        return {
            Dote: dote as Dote,
            Contexto: {
                Entidad: 'personaje',
                Id_personaje: 0,
                Id_extra: -1,
                Extra: 'No aplica',
                Origen: 'Catálogo',
            }
        };
    }

    async abrirDetallesDote(dote: Dote | DoteContextual) {
        const doteCtx = this.toDoteContextual(dote);
        const clave = this.getClaveDoteTab(doteCtx);
        const abierto = this.detallesDoteAbiertos.find(tab => this.getClaveDoteTab(tab) === clave);

        if (abierto)
            this.selectTabByKey(this.getDoteTabKey(abierto));
        else {
            const targetKey = this.getDoteTabKey(doteCtx);
            this.detallesDoteAbiertos.push(doteCtx);
            this.registerOpenContext(targetKey, this.getSafeOpenerKey());
            this.focusOpenedTab(targetKey);
        }
    }

    abrirDetallesVentaja(ventaja: VentajaDetalle) {
        if (!ventaja || Number(ventaja.Id) <= 0)
            return;

        const abierto = this.detallesVentajaAbiertos.find(v => Number(v.Id) === Number(ventaja.Id));
        if (abierto) {
            this.selectTabByKey(this.getVentajaTabKey(abierto));
            return;
        }

        const targetKey = this.getVentajaTabKey(ventaja);
        this.detallesVentajaAbiertos.push(ventaja);
        this.registerOpenContext(targetKey, this.getSafeOpenerKey());
        this.focusOpenedTab(targetKey);
    }

    abrirDetallesVentajaDesdeReferencia(payload: { nombre: string; origen?: string; }): void {
        const nombre = `${payload?.nombre ?? ''}`.trim();
        if (nombre.length < 1)
            return;

        combineLatest([
            this.ventajaSvc.getVentajas().pipe(take(1)),
            this.ventajaSvc.getDesventajas().pipe(take(1)),
        ]).subscribe({
            next: ([ventajas, desventajas]) => {
                const encontrada = this.buscarVentajaDesdeReferencia(nombre, `${payload?.origen ?? ''}`.trim(), ventajas, desventajas);
                if (encontrada) {
                    this.abrirDetallesVentaja(encontrada);
                    return;
                }

                Swal.fire({
                    icon: 'warning',
                    title: 'Ventaja/Desventaja no encontrada',
                    text: `No se encontró "${nombre}" en el catálogo local.`,
                    showConfirmButton: true
                });
            },
            error: () => {
                Swal.fire({
                    icon: 'warning',
                    title: 'No se pudo cargar el catálogo',
                    text: 'Error leyendo ventajas y desventajas desde cache local.',
                    showConfirmButton: true
                });
            },
        });
    }

    quitarDetallesDote(doteCtx: DoteContextual): boolean {
        const clave = this.getClaveDoteTab(doteCtx);
        const tab = this.detallesDoteAbiertos.find(d => this.getClaveDoteTab(d) === clave);
        if (!tab)
            return false;
        const closingKey = this.getDoteTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesDoteAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesDoteAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    quitarDetallesDotePorLabel(label: string): boolean {
        const tab = this.detallesDoteAbiertos.find(d => this.getEtiquetaDote(d) === label);
        if (!tab)
            return false;
        return this.quitarDetallesDote(tab);
    }

    quitarDetallesVentaja(value: string | VentajaDetalle): boolean {
        const tab = typeof value === 'string'
            ? this.detallesVentajaAbiertos.find(v => this.getEtiquetaVentaja(v) === value)
            : this.detallesVentajaAbiertos.find(v => Number(v.Id) === Number(value.Id));
        if (!tab)
            return false;
        const closingKey = this.getVentajaTabKey(tab);
        return this.closeTabWithNavigation(closingKey, () => {
            const indexTab = this.detallesVentajaAbiertos.indexOf(tab);
            if (indexTab < 0)
                return false;
            this.detallesVentajaAbiertos.splice(indexTab, 1);
            return true;
        });
    }

    verPersonajes() {
        this.selectTabByKey(this.TAB_PERSONAJES, true);
    }

    @Output() CerrarNuevoPersonajeTab: EventEmitter<void> = new EventEmitter();
    quitarNuevoPersonaje() {
        this.closeTabWithNavigation(this.TAB_NUEVO, () => {
            this.nuevoPSvc.resetearCreacionNuevoPersonaje();
            this.CerrarNuevoPersonajeTab.emit();
            return true;
        });
    }

    onCerrarNuevoPersonajeSolicitado(): void {
        this.quitarNuevoPersonaje();
    }

    @Output() CerrarListadoTab: EventEmitter<void> = new EventEmitter();
    quitarListado() {
        this.closeTabWithNavigation(this.TAB_LISTADO, () => {
            this.CerrarListadoTab.emit();
            return true;
        });
    }

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private toBoolean(value: any, fallback: boolean = false): boolean {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value !== 0;
        if (typeof value === 'string') {
            const normalizado = value.trim().toLowerCase();
            if (['true', '1', 'si', 'sí', 'yes'].includes(normalizado))
                return true;
            if (['false', '0', 'no'].includes(normalizado))
                return false;
        }
        return fallback;
    }

    private esNombreNoAplicable(value: string): boolean {
        const normalizado = this.normalizar(value).replace(/[.]/g, '');
        return normalizado.length < 1
            || normalizado === 'no aplica'
            || normalizado === 'no especifica'
            || normalizado === 'no se especifica'
            || normalizado === 'nada';
    }

    private nombreRacialBase(value: string): string {
        const sinParentesis = `${value ?? ''}`.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        return this.normalizar(sinParentesis);
    }

    private buscarVentajaPorNombre(coleccion: VentajaDetalle[], nombre: string): VentajaDetalle | null {
        const objetivo = this.normalizar(nombre);
        const candidatas = coleccion
            .filter(v => this.normalizar(v?.Nombre ?? '') === objetivo)
            .sort((a, b) => Number(a.Id) - Number(b.Id));
        return candidatas[0] ?? null;
    }

    private buscarVentajaDesdeReferencia(
        nombre: string,
        origen: string,
        ventajas: VentajaDetalle[],
        desventajas: VentajaDetalle[]
    ): VentajaDetalle | null {
        const origenNormalizado = this.normalizar(origen);

        if (origenNormalizado === 'desventaja')
            return this.buscarVentajaPorNombre(desventajas, nombre) ?? this.buscarVentajaPorNombre(ventajas, nombre);

        if (origenNormalizado === 'ventaja')
            return this.buscarVentajaPorNombre(ventajas, nombre) ?? this.buscarVentajaPorNombre(desventajas, nombre);

        return this.buscarVentajaPorNombre(ventajas, nombre) ?? this.buscarVentajaPorNombre(desventajas, nombre);
    }

    private buscarRacialPorNombre(raciales: RacialDetalle[], nombreRacial: string): RacialDetalle | undefined {
        const objetivo = this.normalizar(nombreRacial);
        const objetivoBase = this.nombreRacialBase(nombreRacial);

        const exacta = raciales.find(r => this.normalizar(r.Nombre) === objetivo);
        if (exacta)
            return exacta;

        const porBase = raciales.find(r => this.nombreRacialBase(r.Nombre) === objetivoBase);
        if (porBase)
            return porBase;

        return raciales.find((r) => {
            const actual = this.normalizar(r.Nombre);
            const actualBase = this.nombreRacialBase(r.Nombre);
            return actual.includes(objetivo)
                || objetivo.includes(actual)
                || actualBase.includes(objetivoBase)
                || objetivoBase.includes(actualBase);
        });
    }

    private esTabAdmin(tabLabel: string): boolean {
        const normalizado = this.normalizar(tabLabel);
        return normalizado === 'panel de administracion'
            || normalizado === 'admin panel'
            || normalizado.includes('admin');
    }

    private abrirDesdeManual(payload: ManualReferenciaNavegacion): void {
        if (payload.tipo === 'dote') {
            this.abrirDetallesDotePorId(payload.id);
            return;
        }
        if (payload.tipo === 'conjuro') {
            this.abrirDetallesConjuroPorId(payload.id);
            return;
        }
        if (payload.tipo === 'raza') {
            this.abrirDetallesRazaPorId(payload.id);
            return;
        }
        if (payload.tipo === 'clase') {
            this.abrirDetallesClasePorId(payload.id);
            return;
        }
        if (payload.tipo === 'tipo') {
            this.abrirDetallesTipoCriaturaPorId(payload.id);
            return;
        }
        if (payload.tipo === 'plantilla') {
            if (Number(payload.id) > 0)
                this.abrirDetallesPlantillaPorId(payload.id);
            else
                this.abrirDetallesPlantillaPorNombre(payload.nombre);
            return;
        }
        if (payload.tipo === 'subtipo') {
            if (Number(payload.id) > 0)
                this.abrirDetallesSubtipoPorId(payload.id);
            else
                this.abrirDetallesSubtipoPorNombre(payload.nombre);
        }
    }
}
