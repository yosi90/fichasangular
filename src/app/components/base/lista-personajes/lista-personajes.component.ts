import { Component, ViewChild, OnInit, AfterViewInit, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ListaPersonajesService } from '../../../services/listas/lista-personajes.service';
import { PersonajeSimple } from '../../../interfaces/simplificaciones/personaje-simple';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Campana, Tramas, Super } from 'src/app/interfaces/campaña';
import { CampanaService } from 'src/app/services/campana.service';
import { UserService } from 'src/app/services/user.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-lista-personajes',
    templateUrl: './lista-personajes.component.html',
    styleUrls: ['./lista-personajes.component.sass'],
    animations: [
        trigger('detailExpand', [
            state('collapsed, void', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
            transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    standalone: false
})
export class ListaPersonajesComponent implements OnInit, AfterViewInit, OnDestroy {
    Personajes: PersonajeSimple[] = [];
    Campanas: Campana[] = [];
    Tramas: Tramas[] = [];
    Subtramas: Super[] = [];
    defaultCampana!: string;
    defaultTrama!: string;
    defaultSubtrama!: string;
    columns = this.listaPjs.ceateDataTable();
    personajesDS = new MatTableDataSource(this.Personajes);
    columnsToDisplay = ['Nombre', 'Clases', 'Raza', 'Visibilidad'];
    columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
    expandedElement!: PersonajeSimple;
    personajesCargados: boolean = false;
    private personajesSub?: Subscription;
    private sessionStateSub?: Subscription;
    private lastLoggedInState: boolean | null = null;

    constructor(
        private listaPjs: ListaPersonajesService,
        private csrv: CampanaService,
        private lva: LiveAnnouncer,
        private userSvc: UserService
    ) { }

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild('textInc', { read: ElementRef }) inputText!: ElementRef;

    async ngOnInit(): Promise<void> {
        await Promise.all([
            this.cargarPersonajes(),
            this.cargarCampanas(),
        ]);

        this.sessionStateSub = this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
            if (this.lastLoggedInState === null) {
                this.lastLoggedInState = loggedIn;
                return;
            }

            if (this.lastLoggedInState === loggedIn)
                return;

            this.lastLoggedInState = loggedIn;
            void this.cargarCampanas();
        });
    }

    ngAfterViewInit() {
        const flt = document.querySelectorAll('.filtros');
        if (flt[0]) {
            flt[0].classList.add('filtroBS');
            if (flt.length > 1)
                flt[1].classList.add('filtroSS');
        }

        this.filtroPersonajes();
    }

    ngOnDestroy(): void {
        this.personajesSub?.unsubscribe();
        this.sessionStateSub?.unsubscribe();
    }

    actualizarTramas(value: string) {
        if (value === 'Sin campaña') {
            this.Tramas = [];
            this.Subtramas = [];
            this.defaultTrama = 'Trama base';
            this.defaultSubtrama = 'Subtrama base';
            this.filtroPersonajes();
            return;
        }

        const campana = this.Campanas.find(c => c.Nombre == value);
        this.Tramas = campana?.Tramas ?? [];
        this.defaultTrama = this.Tramas[0]?.Nombre ?? 'Trama base';
        this.actualizarSubtramas(this.defaultTrama);
    }

    actualizarSubtramas(value: string) {
        if (this.defaultCampana === 'Sin campaña') {
            this.Subtramas = [];
            this.defaultSubtrama = 'Subtrama base';
            this.filtroPersonajes();
            return;
        }

        const trama = this.Tramas.find(t => t.Nombre == value);
        this.Subtramas = trama?.Subtramas ?? [];
        this.defaultSubtrama = this.Subtramas[0]?.Nombre ?? 'Subtrama base';
        this.filtroPersonajes();
    }

    filtroPersonajes() {
        const texto = this.normalizarTexto(this.inputText?.nativeElement?.value ?? '');
        const archivo = !(this.anuncioArchivo === 'Clic para mostar pjs archivados');
        const pjFiltrados = this.Personajes.filter(pj => (texto === '' || this.coincideConTextoFiltro(pj, texto))
            && (this.defaultCampana === undefined || this.defaultCampana === 'Sin campaña' || pj.Campana === this.defaultCampana)
            && (this.defaultTrama === undefined || this.defaultTrama === 'Trama base' || pj.Trama === this.defaultTrama)
            && (this.defaultSubtrama === undefined || this.defaultSubtrama === 'Subtrama base' || pj.Subtrama === this.defaultSubtrama)
            && (archivo || !archivo && !pj.Archivado)
        );
        this.personajesDS = new MatTableDataSource(pjFiltrados);
        this.personajesDS.sortingDataAccessor = (item: PersonajeSimple, property: string) => {
            if (property === 'Visibilidad')
                return this.esPublicoPersonaje(item) ? 1 : 0;
            if (property === '¿Archivado?')
                return item?.Archivado ? 1 : 0;
            return (item as any)?.[property];
        };
        this.personajesDS.sort = this.sort;
        this.personajesDS.paginator = this.paginator;
    }

    anuncioArchivo: string = 'Clic para mostrar pjs archivados';
    AlternarArchivados(value: string) {
        if (value === 'Clic para mostrar pjs archivados') {
            this.anuncioArchivo = 'Mostrando pjs archivados';
            this.columnsToDisplay.push('¿Archivado?');
        } else {
            this.anuncioArchivo = 'Clic para mostrar pjs archivados';
            this.columnsToDisplay.pop();
        }
        this.columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
        this.filtroPersonajes();
    }

    announceSortChange(sortState: Sort) {
        if (sortState.direction) {
            this.lva.announce(`Ordenado ${sortState.direction}ending`);
        } else {
            this.lva.announce('Orden limpiado');
        }
    }

    @Output() NewDetallesTab: EventEmitter<any> = new EventEmitter();
    CrearDetallesDe(value: number) {
        this.NewDetallesTab.emit(value);
    }

    @Output() RazaDetallesTab: EventEmitter<number> = new EventEmitter();
    CrearDetallesRaza(value: number) {
        this.RazaDetallesTab.emit(value);
    }

    extraerClases(raw: string): { Nombre: string, Nivel: number | null }[] {
        if (!raw || raw.trim().length < 1)
            return [];

        return raw
            .split(',')
            .map(parte => parte.trim())
            .filter(parte => parte.length > 0)
            .map(parte => {
                const formatoParentesis = parte.match(/^(.*)\((\d+)\)$/);
                if (formatoParentesis) {
                    return {
                        Nombre: formatoParentesis[1].trim(),
                        Nivel: Number(formatoParentesis[2]),
                    };
                }

                const formatoEspacio = parte.match(/^(.*)\s+(\d+)$/);
                if (formatoEspacio) {
                    return {
                        Nombre: formatoEspacio[1].trim(),
                        Nivel: Number(formatoEspacio[2]),
                    };
                }

                return { Nombre: parte, Nivel: null };
            })
            .filter(c => c.Nombre.length > 0);
    }

    @Output() ClaseDetallesTab: EventEmitter<string> = new EventEmitter();
    CrearDetallesClase(nombreClase: string) {
        if (nombreClase && nombreClase.trim().length > 0)
            this.ClaseDetallesTab.emit(nombreClase.trim());
    }

    esPublicoPersonaje(personaje: PersonajeSimple): boolean {
        return personaje?.visible_otros_usuarios === true;
    }

    private coincideConTextoFiltro(pj: PersonajeSimple, texto: string): boolean {
        return this.normalizarTexto(pj?.Nombre).includes(texto)
            || this.normalizarTexto(pj?.Contexto).includes(texto)
            || this.normalizarTexto(pj?.Personalidad).includes(texto)
            || this.normalizarTexto(pj?.Clases).includes(texto)
            || this.normalizarTexto(pj?.Raza?.Nombre).includes(texto)
            || this.normalizarTexto(pj?.Campana).includes(texto)
            || this.normalizarTexto(pj?.Trama).includes(texto)
            || this.normalizarTexto(pj?.Subtrama).includes(texto);
    }

    private normalizarTexto(value: any): string {
        return `${value ?? ''}`
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    private async cargarPersonajes(): Promise<void> {
        try {
            this.personajesSub?.unsubscribe();
            this.personajesSub = (await this.listaPjs.getPersonajes()).subscribe(personajes => {
                this.Personajes = personajes;
                this.personajesCargados = true;
                this.filtroPersonajes();
            });
        } catch {
            this.Personajes = [];
            this.personajesDS = new MatTableDataSource(this.Personajes);
            this.personajesCargados = true;
        }
    }

    private async cargarCampanas(): Promise<void> {
        try {
            (await this.csrv.getListCampanas()).subscribe(campañas => {
                this.Campanas = campañas;
                this.defaultCampana = this.Campanas[0]?.Nombre ?? 'Sin campaña';
                this.actualizarTramas(this.defaultCampana);
            });
        } catch {
            this.Campanas = [];
            this.Tramas = [];
            this.Subtramas = [];
            this.defaultCampana = 'Sin campaña';
            this.defaultTrama = 'Trama base';
            this.defaultSubtrama = 'Subtrama base';
        }
    }
}
