import { Component, ViewChild, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ListaPersonajesService } from '../../services/lista-personajes.service';
import { PersonajeSimple } from '../../interfaces/personaje-simple';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Campana } from '../../interfaces/Campana';

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
    PersonajesArchivados: PersonajeSimple[] = [];
    columns = this.listaPjs.ceateDataTable();
    personajesDS = new MatTableDataSource(this.Personajes);
    columnsToDisplay = ['Nombre', 'Clases', 'Raza', '¿Archivado?'];
    columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
    expandedElement!: PersonajeSimple;

    constructor(private listaPjs: ListaPersonajesService, private lva: LiveAnnouncer) { }

    @ViewChild('tablaPjs', { read: ElementRef }) tabla!: ElementRef;
    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    async ngOnInit(): Promise<void> {
        (await this.listaPjs.getPersonajes()).subscribe(Personajes => {
            this.Personajes = Personajes.filter(pj => !pj.Archivado);
            this.PersonajesArchivados = Personajes;
            this.actualizarDataSource(this.anuncioArchivo);
        });
    }

    ngAfterViewInit() {
        const flt = document.querySelectorAll('.filtros');
        flt[0].classList.add('filtroBS');
        if (flt.length > 1)
            flt[1].classList.add('filtroSS');
    }

    filtroGeneral(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.personajesDS.filter = filterValue.trim().toLowerCase();
    }

    filtroCampaña(event: Event) {
        //Este hay que hacerlo a mano
    }

    filtroTrama(event: Event) {
        //Este hay que hacerlo a mano
    }

    filtroSubtrama(event: Event) {
        //Este hay que hacerlo a mano
    }

    announceSortChange(sortState: Sort) {
        if (sortState.direction) {
            this.lva.announce(`Ordenado ${sortState.direction}ending`);
        } else {
            this.lva.announce('Orden limpiado');
        }
    }



    // campanias: Array<String> = ["Cualquiera", "Zoorvintal", "Los caballeros de cormyr", "El rey liche"];
    campanias: Campana[] = [
        { id: 0, nombre: "Cualquiera" },
        { id: 1, nombre: "Zoorvintal" },
        { id: 2, nombre: "Los caballeros de cormyr" },
        { id: 3, nombre: "El rey liche" }
    ];
    tramas: Array<String> = ["Cualquiera", "Prueba1", "Prueba2", "Prueba3", "Prueba4", "Prueba5"];

    personajeCampania = 2; //Representa la propiedad campaña de un objeto personaje.
    filterDefSelect = "0";

    anuncioArchivo: string = 'Clic para mostar pjs archivados';
    AlternarArchivados(value: string) {
        if (value === 'Clic para mostar pjs archivados')
            this.anuncioArchivo = 'Mostrando pjs archivados';
        else
            this.anuncioArchivo = 'Clic para mostar pjs archivados';
        this.actualizarDataSource(this.anuncioArchivo);
    }

    actualizarDataSource(value: string) {
        if (value === 'Clic para mostar pjs archivados')
            this.personajesDS = new MatTableDataSource(this.Personajes);
        else
            this.personajesDS = new MatTableDataSource(this.PersonajesArchivados);
        this.personajesDS.sort = this.sort;
        this.personajesDS.paginator = this.paginator;
    }
}
