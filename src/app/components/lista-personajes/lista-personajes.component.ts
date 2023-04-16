import { Component, ViewChild, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ListaPersonajesService } from '../../services/lista-personajes.service';
import { PersonajeSimple } from '../../interfaces/personaje-simple';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Campaña, Tramas, Super } from 'src/app/interfaces/campaña';
import { CampañasService } from 'src/app/services/campañas.service';

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
})
export class ListaPersonajesComponent implements OnInit, AfterViewInit {
    Personajes: PersonajeSimple[] = [];
    Campanas: Campaña[] = [];
    Tramas: Tramas[] = [];
    Subtramas: Super[] = [];
    defaultCampana!: string;
    defaultTrama!: string;
    defaultSubtrama!: string;
    columns = this.listaPjs.ceateDataTable();
    personajesDS = new MatTableDataSource(this.Personajes);
    columnsToDisplay = ['Nombre', 'Clases', 'Raza', '¿Archivado?'];
    columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
    expandedElement!: PersonajeSimple;

    constructor(private listaPjs: ListaPersonajesService, private csrv: CampañasService, private lva: LiveAnnouncer) { }

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild('textInc', { read: ElementRef }) inputText!: ElementRef;
    @ViewChild('archivo', { read: ElementRef }) chipArc!: ElementRef;

    async ngOnInit(): Promise<void> {
        (await this.listaPjs.getPersonajes()).subscribe(personajes => {
            this.Personajes = personajes;
            this.filtroPersonajes();
        });
        (await this.csrv.getListCampañas()).subscribe(campañas => {
            this.Campanas = campañas;
            this.defaultCampana = this.Campanas[0].Nombre;
            this.actualizarTramas(this.Campanas[0].Nombre);
        });
    }

    ngAfterViewInit() {
        const flt = document.querySelectorAll('.filtros');
        flt[0].classList.add('filtroBS');
        if (flt.length > 1)
            flt[1].classList.add('filtroSS');
    }

    actualizarTramas(value: string) {
        this.Tramas = this.Campanas.filter(c => c.Nombre == value)[0].Tramas;
        this.defaultTrama = this.Tramas[0].Nombre;
        this.actualizarSubtramas(this.Tramas[0].Nombre);
    }

    actualizarSubtramas(value: string) {
        this.Subtramas = this.Tramas.filter(t => t.Nombre == value)[0].Subtramas;
        this.defaultSubtrama = this.Subtramas[0].Nombre;
        this.filtroPersonajes();
    }

    filtroPersonajes() {
        const texto = this.inputText.nativeElement.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const archivo = !(this.anuncioArchivo === 'Clic para mostar pjs archivados');
        const pjFiltrados = this.Personajes.filter(pj => (texto === undefined || texto === '' || pj.Nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) || pj.Contexto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) ||
            pj.Personalidad.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) || pj.Clases.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) || pj.Raza.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) ||
            pj.Campana.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) || pj.Trama.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto) || pj.Subtrama.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(texto))
            && (this.defaultCampana === undefined || this.defaultCampana === 'Sin campaña' || pj.Campana === this.defaultCampana)
            && (this.defaultTrama === undefined || this.defaultTrama === 'Trama base' || pj.Trama === this.defaultTrama)
            && (this.defaultSubtrama === undefined || this.defaultSubtrama === 'Subtrama base' || pj.Subtrama === this.defaultSubtrama)
            && (archivo || !archivo && !pj.Archivado));
        this.personajesDS = new MatTableDataSource(pjFiltrados);
        this.personajesDS.sort = this.sort;
        this.personajesDS.paginator = this.paginator;
    }

    anuncioArchivo: string = 'Clic para mostar pjs archivados';
    AlternarArchivados(value: string) {
        if (value === 'Clic para mostar pjs archivados')
            this.anuncioArchivo = 'Mostrando pjs archivados';
        else
            this.anuncioArchivo = 'Clic para mostar pjs archivados';
        this.filtroPersonajes();
    }

    announceSortChange(sortState: Sort) {
        if (sortState.direction) {
            this.lva.announce(`Ordenado ${sortState.direction}ending`);
        } else {
            this.lva.announce('Orden limpiado');
        }
    }
}
