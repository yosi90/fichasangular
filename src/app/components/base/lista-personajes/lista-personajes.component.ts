import { Component, ViewChild, OnInit, AfterViewInit, Output, EventEmitter, OnDestroy } from '@angular/core';
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
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { conColumnaOpcional } from 'src/app/services/utils/columnas-tabla';
import { normalizarTexto, toNumberOrNull } from 'src/app/services/utils/normalizacion';
import { esPnj, nombreTipoPersonaje, textoNivelPersonaje } from 'src/app/services/utils/tipo-personaje';
import { razaConCategoria } from 'src/app/services/utils/razas-por-edades';

type FiltroVisibilidadPersonajes = 'todos' | 'publicos' | 'privados';
/** «Todos · Personajes jugadores · PNJ» (lienzo de los dragones jugables, tablero 4). */
type FiltroTipoPersonajes = 'todos' | 'pj' | 'pnj';

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
    columnsToDisplay = ['Personaje', 'QueEs', 'Nivel', 'Campana', 'Visibilidad', 'Homebrew'];
    columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
    expandedElement!: PersonajeSimple;
    personajesCargados: boolean = false;
    /** No se pudo leer el listado: se enseña el error con «Reintentar». */
    errorCarga = false;
    /** El buscador rápido de la cabecera (el «Incluye texto» de antes). */
    textoBusqueda = '';
    mostrarArchivados = false;
    mostrarSoloMios = false;
    filtroVisibilidad: FiltroVisibilidadPersonajes = 'todos';
    filtroTipo: FiltroTipoPersonajes = 'todos';
    /** Los botones del filtro por tipo, con cuántos hay de cada uno con los demás filtros. */
    filtrosTipo: { clave: FiltroTipoPersonajes; texto: string; total: number; }[] = [];
    sesionIniciada = false;
    private personajesSub?: Subscription;
    private campanasSub?: Subscription;
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

    async ngOnInit(): Promise<void> {
        await Promise.all([
            this.cargarPersonajes(),
            this.cargarCampanas(),
        ]);

        this.sessionStateSub = this.userSvc.isLoggedIn$.subscribe((loggedIn) => {
            this.sesionIniciada = loggedIn;
            if (!loggedIn && this.mostrarSoloMios)
                this.mostrarSoloMios = false;

            if (this.lastLoggedInState === null) {
                this.lastLoggedInState = loggedIn;
                this.filtroPersonajes();
                return;
            }

            if (this.lastLoggedInState === loggedIn)
                return;

            this.lastLoggedInState = loggedIn;
            this.filtroPersonajes();
            void this.cargarCampanas();
        });
    }

    ngAfterViewInit(): void {
        this.filtroPersonajes();
    }

    ngOnDestroy(): void {
        this.personajesSub?.unsubscribe();
        this.campanasSub?.unsubscribe();
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
        const texto = normalizarTexto(this.textoBusqueda, true);
        const sinTipo = this.Personajes.filter(pj => (texto === '' || this.coincideConTextoFiltro(pj, texto))
            && (this.defaultCampana === undefined || this.defaultCampana === 'Sin campaña' || pj.Campana === this.defaultCampana)
            && (this.defaultTrama === undefined || this.defaultTrama === 'Trama base' || pj.Trama === this.defaultTrama)
            && (this.defaultSubtrama === undefined || this.defaultSubtrama === 'Subtrama base' || pj.Subtrama === this.defaultSubtrama)
            && (!this.mostrarSoloMios || this.esPersonajePropio(pj))
            && this.cumpleFiltroVisibilidad(pj)
            && (this.mostrarArchivados || !pj.Archivado)
        );
        const pnj = sinTipo.filter((pj) => esPnj(pj.tipo)).length;
        this.filtrosTipo = [
            { clave: 'todos', texto: 'Todos', total: sinTipo.length },
            { clave: 'pj', texto: 'Personajes jugadores', total: sinTipo.length - pnj },
            { clave: 'pnj', texto: 'PNJ', total: pnj },
        ];
        const pjFiltrados = sinTipo.filter((pj) => this.filtroTipo === 'todos' || (this.filtroTipo === 'pnj') === esPnj(pj.tipo));
        this.personajesDS = new MatTableDataSource(pjFiltrados);
        this.personajesDS.sortingDataAccessor = (item: PersonajeSimple, property: string) => {
            if (property === 'QueEs')
                return esPnj(item?.tipo) ? 1 : 0;
            if (property === 'Nivel')
                return toNumberOrNull(esPnj(item?.tipo) ? item?.vd : item?.nep) ?? -1;
            if (property === 'Visibilidad')
                return this.esPublicoPersonaje(item) ? 1 : 0;
            if (property === 'Archivado')
                return item?.Archivado ? 1 : 0;
            if (property === 'Personaje')
                return item?.Nombre;
            return (item as any)?.[property];
        };
        this.personajesDS.sort = this.sort;
        ordenarEnEspanol(this.personajesDS);
        this.personajesDS.paginator = this.paginator;
    }

    get anuncioArchivo(): string {
        return this.mostrarArchivados ? 'Mostrando pjs archivados' : 'Clic para mostrar pjs archivados';
    }

    AlternarArchivados() {
        this.mostrarArchivados = !this.mostrarArchivados;
        this.columnsToDisplay = conColumnaOpcional(this.columnsToDisplay, 'Archivado', this.mostrarArchivados);
        this.columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
        this.filtroPersonajes();
    }

    AlternarSoloMios() {
        if (!this.sesionIniciada)
            return;

        this.mostrarSoloMios = !this.mostrarSoloMios;
        this.filtroPersonajes();
    }

    announceSortChange(sortState: Sort) {
        if (sortState.direction)
            this.lva.announce(sortState.direction === 'asc' ? 'Orden ascendente' : 'Orden descendente');
        else
            this.lva.announce('Sin orden');
    }

    /** El buscador rápido de la cabecera. */
    buscar(texto: string): void {
        this.textoBusqueda = texto;
        this.filtroPersonajes();
    }

    /** «Todos», «Personajes jugadores» o «PNJ». */
    elegirFiltroTipo(clave: FiltroTipoPersonajes): void {
        this.filtroTipo = clave;
        this.filtroPersonajes();
    }

    /** «Personaje jugador» o «PNJ». */
    textoTipo(pj: PersonajeSimple): string {
        return nombreTipoPersonaje(pj?.tipo);
    }

    /** La raza con su edad, «Dragón rojo · cría» (`categoriaEdad` del listado); sin edad, solo la raza. */
    textoRaza(pj: PersonajeSimple): string {
        return razaConCategoria(pj?.Raza?.Nombre, pj?.categoriaEdad);
    }

    esPnj(pj: PersonajeSimple): boolean {
        return esPnj(pj?.tipo);
    }

    /** El NEP de un PJ («NEP 5») o el VD de un PNJ («VD 18»); sin el dato, «—». */
    textoNivel(pj: PersonajeSimple): string {
        return textoNivelPersonaje({ tipo: pj?.tipo, nep: pj?.nep, vd: pj?.vd }) ?? '—';
    }

    /** Si algún filtro no es el de por defecto (para «Limpiar filtros»). */
    get hayFiltros(): boolean {
        return normalizarTexto(this.textoBusqueda, true).length > 0
            || this.filtroTipo !== 'todos'
            || this.filtroVisibilidad !== 'todos'
            || this.mostrarSoloMios
            || this.mostrarArchivados
            || (this.Campanas.length > 0 && this.defaultCampana !== this.Campanas[0]?.Nombre);
    }

    limpiarFiltros(): void {
        this.textoBusqueda = '';
        this.filtroTipo = 'todos';
        this.filtroVisibilidad = 'todos';
        this.mostrarSoloMios = false;
        if (this.mostrarArchivados)
            this.AlternarArchivados();
        this.defaultCampana = this.Campanas[0]?.Nombre ?? 'Sin campaña';
        this.actualizarTramas(this.defaultCampana);
    }

    reintentar(): void {
        this.personajesCargados = false;
        this.errorCarga = false;
        void this.cargarPersonajes();
    }

    /** «Burlón 4»: la clase con su nivel, como en la línea del personaje. */
    textoClase(clase: { Nombre: string, Nivel: number | null }): string {
        return clase.Nivel === null ? clase.Nombre : `${clase.Nombre} ${clase.Nivel}`;
    }

    /** «Aún no hay personajes que puedas ver»: abre la creación (como el botón del menú). */
    @Output() nuevoPersonaje = new EventEmitter<void>();

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

    private esPersonajePropio(personaje: PersonajeSimple): boolean {
        const actorUid = `${this.userSvc.CurrentUserUid ?? ''}`.trim();
        if (actorUid.length < 1)
            return false;

        const ownerUid = `${personaje?.ownerUid ?? ''}`.trim();
        return ownerUid === actorUid || personaje?.accessReason === 'owner';
    }

    private cumpleFiltroVisibilidad(personaje: PersonajeSimple): boolean {
        const esPublico = this.esPublicoPersonaje(personaje);
        if (this.filtroVisibilidad === 'publicos')
            return esPublico;
        if (this.filtroVisibilidad === 'privados')
            return !esPublico;
        return true;
    }

    private coincideConTextoFiltro(pj: PersonajeSimple, texto: string): boolean {
        return normalizarTexto(pj?.Nombre, true).includes(texto)
            || normalizarTexto(pj?.Contexto, true).includes(texto)
            || normalizarTexto(pj?.Personalidad, true).includes(texto)
            || normalizarTexto(pj?.Clases, true).includes(texto)
            || normalizarTexto(pj?.Raza?.Nombre, true).includes(texto)
            || normalizarTexto(pj?.Campana, true).includes(texto)
            || normalizarTexto(pj?.Trama, true).includes(texto)
            || normalizarTexto(pj?.Subtrama, true).includes(texto);
    }

    private async cargarPersonajes(): Promise<void> {
        try {
            this.personajesSub?.unsubscribe();
            this.personajesSub = (await this.listaPjs.getPersonajes()).subscribe(personajes => {
                this.Personajes = personajes;
                this.personajesCargados = true;
                this.errorCarga = false;
                this.filtroPersonajes();
            });
        } catch {
            this.Personajes = [];
            this.personajesDS = new MatTableDataSource(this.Personajes);
            this.personajesCargados = true;
            this.errorCarga = true;
        }
    }

    private async cargarCampanas(): Promise<void> {
        try {
            this.campanasSub?.unsubscribe();
            this.campanasSub = (await this.csrv.getListCampanas()).subscribe(campañas => {
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
