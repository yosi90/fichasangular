import { Component, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
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
import { RacialDetalle } from 'src/app/interfaces/racial';
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
        private plantillaSvc: PlantillaService,
        private nuevoPSvc: NuevoPersonajeService,
        private manualRefNavSvc: ManualReferenciaNavigationService,
        private manualVistaNavSvc: ManualVistaNavigationService,
        private cacheSyncMetadataSvc: CacheSyncMetadataService,
        private ngZone: NgZone,
    ) { }

    @ViewChild(MatTabGroup) TabGroup!: MatTabGroup;
    previousTab!: MatTab;
    actualTab!: MatTab;

    ngOnInit() {
        this.usrPerm = this.usrSvc.Usuario.permisos;
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
        this.previousTab = this.TabGroup._tabs.toArray()[0];
        this.verificarPendientesCacheAdminEnInicio();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['AbrirNuevoPersonajeTab'] && changes['AbrirNuevoPersonajeTab'].currentValue) {
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(t => t.textLabel === 'Nuevo personaje'));
            }, 100);
        } else if (changes['AbrirListadoTab'] && changes['AbrirListadoTab'].currentValue) {
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(t => t.textLabel === `Lista de ${this.ListadoTabTipo}`));
            }, 100);
        }
    }

    onTabChange(event: any) {
        if (!this.actualTab) {
            this.actualTab = this.TabGroup._tabs.toArray()[event.index];
        } else if (!this.TabGroup._tabs.toArray().includes(this.previousTab) || this.TabGroup._tabs.toArray()[event.index] === this.actualTab) {
            this.previousTab = this.TabGroup._tabs.toArray()[0];
        } else {
            this.previousTab = this.actualTab;
            this.actualTab = this.TabGroup._tabs.toArray()[event.index];
        }
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
        else if (this.detallesEspecialAbiertos.map(e => this.getEtiquetaEspecial(e)).includes(tabLabel) && this.quitarDetallesEspecial(tabLabel))
            return;
        else if (this.detallesRacialAbiertos.map(r => this.getEtiquetaRacial(r)).includes(tabLabel) && this.quitarDetallesRacial(tabLabel))
            return;
        else if (this.detallesPlantillaAbiertos.map(p => this.getEtiquetaPlantilla(p)).includes(tabLabel) && this.quitarDetallesPlantilla(tabLabel))
            return;
        else if (this.detallesManualAbiertos.map(m => this.getEtiquetaManual(m)).includes(tabLabel) && this.quitarDetallesManual(tabLabel))
            return;
        else if (tabLabel.includes('Nuevo personaje'))
            this.quitarNuevoPersonaje();
        else if (tabLabel.includes('Lista de'))
            this.quitarListado();
    }

    cambiarA(modo: boolean, pestaña?: MatTab) {
        if (modo && pestaña && !pestaña.isActive)
            this.TabGroup.selectedIndex = this.TabGroup._tabs.toArray().indexOf(pestaña);
        else if (!modo) {
            if (!this.TabGroup._tabs.toArray().includes(this.previousTab) || this.previousTab === this.actualTab)
                this.TabGroup.selectedIndex = 0;
            else if ((this.previousTab.position ?? 0) < 0)
                this.TabGroup.selectedIndex = (this.previousTab.origin ?? 0)
            else {
                let moverA = (this.previousTab.position ?? 0) > 0 ? (this.previousTab.position ?? 0) - 1 : (this.previousTab.position ?? 0);
                this.TabGroup.selectedIndex = (this.actualTab.origin ?? 0) + moverA;
            }
            this.actualTab = this.previousTab;
            this.previousTab = this.TabGroup._tabs.toArray()[0];
        }
    }

    async abrirDetallesPersonaje(value: number) {
        const abierto = this.detallesPersonajeAbiertos.find(p => p.Id == value);
        if (abierto)
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === abierto.Nombre));
        else {
            (await this.pSvc.getDetallesPersonaje(value)).subscribe(personaje => {
                this.detallesPersonajeAbiertos.push(personaje);
                setTimeout(() => {
                    this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === personaje.Nombre));
                }, 100);
            });
        }
    }
    quitarDetallesPersonaje(value: string): boolean {
        const tab = this.detallesPersonajeAbiertos.find(p => p.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesPersonajeAbiertos.indexOf(tab);
        this.detallesPersonajeAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
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
        } else if (value.tipo === 'especiales') {
            this.abrirDetallesEspecial(value.item);
        } else if (value.tipo === 'raciales') {
            this.abrirDetallesRacial(value.item);
        } else if (value.tipo === 'plantillas') {
            this.abrirDetallesPlantilla(value.item);
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

        const navegar = () => {
            const tabs = this.TabGroup?._tabs?.toArray?.() ?? [];
            if (tabs.length < 1)
                return;

            const tabAdmin = tabs.find(tab => this.esTabAdmin(tab.textLabel)) ?? tabs[1];
            const indexAdmin = tabs.indexOf(tabAdmin);
            if (indexAdmin < 0)
                return;

            this.TabGroup.selectedIndex = indexAdmin;
        };

        this.ngZone.run(() => navegar());
        setTimeout(() => this.ngZone.run(() => navegar()), 0);
        setTimeout(() => this.ngZone.run(() => navegar()), 80);
    }

    async abrirDetallesRaza(raza: Raza) {
        if (this.detallesRazaAbiertos.find(r => r.Id === raza.Id))
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === raza.Nombre));
        else {
            this.detallesRazaAbiertos.push(raza);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === raza.Nombre));
            }, 100);
        }
    }

    async abrirDetallesRazaPorId(idRaza: number) {
        const abierto = this.detallesRazaAbiertos.find(r => r.Id === idRaza);
        if (abierto) {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === abierto.Nombre));
            return;
        }

        (await this.rSvc.getRaza(idRaza)).subscribe(raza => {
            this.abrirDetallesRaza(raza);
        });
    }

    quitarDetallesRaza(value: string): boolean {
        const tab = this.detallesRazaAbiertos.find(r => r.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesRazaAbiertos.indexOf(tab);
        this.detallesRazaAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    async abrirDetallesConjuro(conjuro: Conjuro) {
        if (this.detallesConjuroAbiertos.find(c => c.Id === conjuro.Id))
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === conjuro.Nombre));
        else {
            this.detallesConjuroAbiertos.push(conjuro);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === conjuro.Nombre));
            }, 100);
        }
    }
    quitarDetallesConjuro(value: string): boolean {
        const tab = this.detallesConjuroAbiertos.find(c => c.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesConjuroAbiertos.indexOf(tab);
        this.detallesConjuroAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    async abrirDetallesSortilega(ap: AptitudSortilega, fuente: string) {
        if (this.detallesSortilegaAbiertos.find(c => c.ap.Conjuro.Id === ap.Conjuro.Id))
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === ap.Conjuro.Nombre));
        else {
            this.detallesSortilegaAbiertos.push({ ap, fuente });
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === ap.Conjuro.Nombre));
            }, 100);
        }
    }
    quitarDetallesSortilega(value: string): boolean {
        const tab = this.detallesSortilegaAbiertos.find(c => c.ap.Conjuro.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesSortilegaAbiertos.indexOf(tab);
        this.detallesSortilegaAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    async abrirDetallesTipoCriatura(tipo: TipoCriatura) {
        if (this.detallesTipoCriaturaAbiertos.find(t => t.Id === tipo.Id))
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === tipo.Nombre));
        else {
            this.detallesTipoCriaturaAbiertos.push(tipo);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === tipo.Nombre));
            }, 100);
        }
    }
    quitarDetallesTipoCriatura(value: string): boolean {
        const tab = this.detallesTipoCriaturaAbiertos.find(t => t.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesTipoCriaturaAbiertos.indexOf(tab);
        this.detallesTipoCriaturaAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    async abrirDetallesRasgo(rasgo: Rasgo) {
        if (this.detallesRasgoAbiertos.find(r => r.Id === rasgo.Id))
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === rasgo.Nombre));
        else {
            this.detallesRasgoAbiertos.push(rasgo);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === rasgo.Nombre));
            }, 100);
        }
    }
    quitarDetallesRasgo(value: string): boolean {
        const tab = this.detallesRasgoAbiertos.find(t => t.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesRasgoAbiertos.indexOf(tab);
        this.detallesRasgoAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
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

    async abrirDetallesClase(clase: Clase) {
        const abierto = this.detallesClaseAbiertos.find(c => c.Id === clase.Id);
        if (abierto)
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaClase(abierto)));
        else {
            this.detallesClaseAbiertos.push(clase);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaClase(clase)));
            }, 100);
        }
    }

    abrirDetallesConjuroPorId(idConjuro: number) {
        const id = Number(idConjuro);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesConjuroAbiertos.find(c => c.Id === id);
        if (abierto) {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === abierto.Nombre));
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
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaDote(abierto)));
            return;
        }

        this.doteSvc.getDote(id).pipe(take(1)).subscribe(dote => {
            this.abrirDetallesDote(dote);
        });
    }

    abrirDetallesClasePorNombre(nombreClase: string) {
        if (!nombreClase || nombreClase.trim().length < 1)
            return;

        const encontrado = this.detallesClaseAbiertos.find(c => this.normalizar(c.Nombre) === this.normalizar(nombreClase));
        if (encontrado) {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaClase(encontrado)));
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
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaClase(abierto)));
            return;
        }

        this.clSvc.getClase(id).pipe(take(1)).subscribe(clase => {
            this.abrirDetallesClase(clase);
        });
    }

    quitarDetallesClase(label: string): boolean {
        const tab = this.detallesClaseAbiertos.find(c => this.getEtiquetaClase(c) === label);
        if (!tab)
            return false;
        const indexTab = this.detallesClaseAbiertos.indexOf(tab);
        this.detallesClaseAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    async abrirDetallesEspecial(especial: EspecialClaseDetalle) {
        const abierto = this.detallesEspecialAbiertos.find(e => e.Id === especial.Id);
        if (abierto)
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaEspecial(abierto)));
        else {
            this.detallesEspecialAbiertos.push(especial);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaEspecial(especial)));
            }, 100);
        }
    }

    abrirDetallesEspecialPorId(idEspecial: number) {
        const id = Number(idEspecial);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesEspecialAbiertos.find(e => e.Id === id);
        if (abierto) {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaEspecial(abierto)));
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
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaEspecial(abierto)));
            return;
        }

        this.especialSvc.getEspeciales().pipe(take(1)).subscribe(especiales => {
            const encontrado = especiales.find(e => this.normalizar(e.Nombre) === this.normalizar(nombreEspecial));
            if (encontrado) {
                this.abrirDetallesEspecial(encontrado);
                return;
            }

            Swal.fire({
                icon: 'warning',
                title: 'Especial no encontrado',
                text: `No se encontró un especial catalogado para "${nombreEspecial}"`,
                showConfirmButton: true
            });
        });
    }

    quitarDetallesEspecial(label: string): boolean {
        const tab = this.detallesEspecialAbiertos.find(e => this.getEtiquetaEspecial(e) === label);
        if (!tab)
            return false;
        const indexTab = this.detallesEspecialAbiertos.indexOf(tab);
        this.detallesEspecialAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    async abrirDetallesRacial(racial: RacialDetalle) {
        const abierto = this.detallesRacialAbiertos.find(r => r.Id === racial.Id);
        if (abierto)
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaRacial(abierto)));
        else {
            this.detallesRacialAbiertos.push(racial);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaRacial(racial)));
            }, 100);
        }
    }

    abrirDetallesRacialPorId(idRacial: number) {
        const id = Number(idRacial);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesRacialAbiertos.find(r => r.Id === id);
        if (abierto) {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaRacial(abierto)));
            return;
        }

        this.racialSvc.getRacial(id).pipe(take(1)).subscribe(racial => {
            this.abrirDetallesRacial(racial);
        });
    }

    abrirDetallesRacialPorNombre(nombreRacial: string) {
        if (this.esNombreNoAplicable(nombreRacial))
            return;

        const abierto = this.detallesRacialAbiertos.find(r => this.normalizar(r.Nombre) === this.normalizar(nombreRacial));
        if (abierto) {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaRacial(abierto)));
            return;
        }

        this.racialSvc.getRaciales().pipe(take(1)).subscribe(raciales => {
            const encontrada = raciales.find(r => this.normalizar(r.Nombre) === this.normalizar(nombreRacial));
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

    abrirDetallesTipoCriaturaPorId(idTipo: number) {
        const id = Number(idTipo);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesTipoCriaturaAbiertos.find(t => t.Id === id);
        if (abierto) {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === abierto.Nombre));
            return;
        }

        this.tcSvc.getTipoCriatura(id).pipe(take(1)).subscribe(tipo => {
            this.abrirDetallesTipoCriatura(tipo);
        });
    }

    async abrirDetallesPlantilla(plantilla: Plantilla) {
        const abierto = this.detallesPlantillaAbiertos.find(p => p.Id === plantilla.Id);
        if (abierto)
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaPlantilla(abierto)));
        else {
            this.detallesPlantillaAbiertos.push(plantilla);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaPlantilla(plantilla)));
            }, 100);
        }
    }

    abrirDetallesPlantillaPorId(idPlantilla: number) {
        const id = Number(idPlantilla);
        if (!Number.isFinite(id) || id <= 0)
            return;

        const abierto = this.detallesPlantillaAbiertos.find(p => p.Id === id);
        if (abierto) {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaPlantilla(abierto)));
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
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaPlantilla(abierta)));
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

    quitarDetallesRacial(label: string): boolean {
        const tab = this.detallesRacialAbiertos.find(r => this.getEtiquetaRacial(r) === label);
        if (!tab)
            return false;
        const indexTab = this.detallesRacialAbiertos.indexOf(tab);
        this.detallesRacialAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    quitarDetallesPlantilla(label: string): boolean {
        const tab = this.detallesPlantillaAbiertos.find(p => this.getEtiquetaPlantilla(p) === label);
        if (!tab)
            return false;
        const indexTab = this.detallesPlantillaAbiertos.indexOf(tab);
        this.detallesPlantillaAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    abrirDetallesManual(manual: ManualAsociadoDetalle): void {
        if (!manual || Number(manual.Id) <= 0)
            return;
        const abierto = this.detallesManualAbiertos.find(m => m.Id === manual.Id);
        if (abierto) {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaManual(abierto)));
            return;
        }

        this.detallesManualAbiertos.push(manual);
        setTimeout(() => {
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaManual(manual)));
        }, 100);
    }

    quitarDetallesManual(label: string): boolean {
        const tab = this.detallesManualAbiertos.find(m => this.getEtiquetaManual(m) === label);
        if (!tab)
            return false;
        const indexTab = this.detallesManualAbiertos.indexOf(tab);
        this.detallesManualAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
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
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaDote(abierto)));
        else {
            this.detallesDoteAbiertos.push(doteCtx);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === this.getEtiquetaDote(doteCtx)));
            }, 100);
        }
    }

    quitarDetallesDote(doteCtx: DoteContextual): boolean {
        const clave = this.getClaveDoteTab(doteCtx);
        const tab = this.detallesDoteAbiertos.find(d => this.getClaveDoteTab(d) === clave);
        if (!tab)
            return false;
        const indexTab = this.detallesDoteAbiertos.indexOf(tab);
        this.detallesDoteAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    quitarDetallesDotePorLabel(label: string): boolean {
        const tab = this.detallesDoteAbiertos.find(d => this.getEtiquetaDote(d) === label);
        if (!tab)
            return false;
        return this.quitarDetallesDote(tab);
    }

    verPersonajes() {
        this.TabGroup.selectedIndex = 0;
    }

    @Output() CerrarNuevoPersonajeTab: EventEmitter<void> = new EventEmitter();
    quitarNuevoPersonaje() {
        this.nuevoPSvc.resetearCreacionNuevoPersonaje();
        this.cambiarA(false);
        this.CerrarNuevoPersonajeTab.emit();
    }

    @Output() CerrarListadoTab: EventEmitter<void> = new EventEmitter();
    quitarListado() {
        this.cambiarA(false);
        this.CerrarListadoTab.emit();
    }

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private esNombreNoAplicable(value: string): boolean {
        const normalizado = this.normalizar(value).replace(/[.]/g, '');
        return normalizado.length < 1
            || normalizado === 'no aplica'
            || normalizado === 'no especifica'
            || normalizado === 'no se especifica'
            || normalizado === 'nada';
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
        }
    }
}
