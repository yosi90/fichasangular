import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { RasgoService } from 'src/app/services/rasgo.service';
import { ordenarEnEspanol } from 'src/app/services/utils/orden-tabla';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

@Component({
    selector: 'app-listado-rasgo',
    templateUrl: './listado-rasgo.component.html',
    styleUrls: ['./listado-rasgo.component.sass'],
    standalone: false
})
export class ListadoRasgoRacialComponent {
    rasgos: Rasgo[] = [];
    rasgosDS = new MatTableDataSource(this.rasgos);
    rasgoColumns = ['Nombre'];

    constructor(private cdr: ChangeDetectorRef, private rSvc: RasgoService) { }

    @ViewChild(MatSort) tipoSort!: MatSort;
    @ViewChild(MatPaginator) tipoPaginator!: MatPaginator;
    @ViewChild('rasgoTextInc', { read: ElementRef }) nombreText!: ElementRef;

    ngAfterViewInit() {
        this.rasgosDS.paginator = this.tipoPaginator;
        this.rasgosDS.sort = this.tipoSort;
        ordenarEnEspanol(this.rasgosDS);
        (this.rSvc.getRasgos()).subscribe(rasgos => {
            this.rasgos = rasgos;
            this.cdr.detectChanges();
            this.filtroRasgos();
            this.cdr.detectChanges();
        });
    }

    filtroRasgos() {
        const texto = normalizarTexto(this.nombreText?.nativeElement.value, true);
        const homebrew = !(this.anuncioRasgosHomebrew === 'Clic para mostar rasgos homebrew');
        const rasgosFiltrados = this.rasgos.filter(rasgo =>
            (texto === undefined || texto === '' || normalizarTexto(rasgo.Nombre, true).includes(texto))
            && (homebrew || !homebrew && rasgo.Oficial)
        );
        this.rasgosDS = new MatTableDataSource(rasgosFiltrados);
        setTimeout(() => {
            this.rasgosDS.sort = this.tipoSort;
            ordenarEnEspanol(this.rasgosDS);
        }, 200);
        this.rasgosDS.paginator = this.tipoPaginator;
        this.tipoSort.active = 'Nombre';
        this.tipoSort.direction = 'asc';
    }

    anuncioRasgosHomebrew: string = 'Clic para mostar tipos homebrew';
    AlternarRasgosHombrew(value: string) {
        if (value === 'Clic para mostar tipos homebrew') {
            this.anuncioRasgosHomebrew = 'Mostrando tipos homebrew';
            this.rasgoColumns.push('Homebrew');
        } else {
            this.anuncioRasgosHomebrew = 'Clic para mostar tipos homebrew';
            this.rasgoColumns.pop();
        }
        this.filtroRasgos();
    }

    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    verDetallesRasgo(value: number) {
        this.rasgoDetalles.emit(this.rasgos.find(c => c.Id === value));
    }

    @Output() rasgoSeleccionado: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();
    seleccionarRasgo(value: number) {
        this.rasgoSeleccionado.emit(this.rasgos.find(c => c.Id === value));
    }
}
