import { ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { ListadoRazasComponent } from '../listado-razas/listado-razas.component';
import { Raza } from 'src/app/interfaces/raza';
import { ListadoConjurosComponent } from '../listado-conjuros/listado-conjuros.component';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { ListadoTiposCriaturaComponent } from '../listado-tipos-criatura/listado-tipos-criatura.component';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { ListadoRasgoRacialComponent } from '../listado-rasgo/listado-rasgo.component';
import { ListadoDotesComponent } from '../listado-dotes/listado-dotes.component';
import { Dote } from 'src/app/interfaces/dote';
import { ListadoClasesComponent } from '../listado-clases/listado-clases.component';
import { Clase } from 'src/app/interfaces/clase';
import { ListadoEspecialesComponent } from '../listado-especiales/listado-especiales.component';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { ListadoRacialesComponent } from '../listado-raciales/listado-raciales.component';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { Rasgo } from 'src/app/interfaces/rasgo';

@Component({
    selector: 'app-listado',
    templateUrl: './listado.component.html',
    styleUrls: ['./listado.component.sass']
})
export class ListadoComponent {
    @ViewChild('contenedor', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

    @Input() tipoLista!: string;
    @Input() tipoOperacion!: string;

    componentes: any = {
        'razas': ListadoRazasComponent,
        'conjuros': ListadoConjurosComponent,
        'tipos de criatura': ListadoTiposCriaturaComponent,
        'rasgos': ListadoRasgoRacialComponent,
        'dotes': ListadoDotesComponent,
        'clases': ListadoClasesComponent,
        'especiales': ListadoEspecialesComponent,
        'raciales': ListadoRacialesComponent,
    };

    constructor(private cdr: ChangeDetectorRef) { }

    ngAfterViewInit(): void {
        this.cargarComponente();
        this.cdr.detectChanges();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if(!this.viewContainerRef)
            return;
        if (changes['tipoLista']) {
            this.cargarComponente();
        }
    }

    cargarComponente() {
        this.viewContainerRef.clear();
        const componentRef = this.viewContainerRef.createComponent(this.componentes[this.tipoLista]);

        if (componentRef.instance instanceof ListadoRazasComponent) {
            componentRef.instance.razaDetalles.subscribe((item: Raza) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.razaSeleccionada.subscribe((item: Raza) => {
                this.handleItemSeleccionado(item);
            });
        } else if (componentRef.instance instanceof ListadoConjurosComponent) {
            componentRef.instance.conjuroDetalles.subscribe((item: Conjuro) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.conjuroSeleccionado.subscribe((item: Conjuro) => {
                this.handleItemSeleccionado(item);
            });
        } else if (componentRef.instance instanceof ListadoTiposCriaturaComponent) {
            componentRef.instance.tipoCriaturaDetalles.subscribe((item: TipoCriatura) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.tipoCriaturaSeleccionado.subscribe((item: TipoCriatura) => {
                this.handleItemSeleccionado(item);
            });
        } else if (componentRef.instance instanceof ListadoRasgoRacialComponent) {
            componentRef.instance.rasgoDetalles.subscribe((item: Rasgo) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.rasgoSeleccionado.subscribe((item: Rasgo) => {
                this.handleItemSeleccionado(item);
            });
        } else if (componentRef.instance instanceof ListadoDotesComponent) {
            componentRef.instance.doteDetalles.subscribe((item: Dote) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.doteSeleccionada.subscribe((item: Dote) => {
                this.handleItemSeleccionado(item);
            });
        } else if (componentRef.instance instanceof ListadoClasesComponent) {
            componentRef.instance.claseDetalles.subscribe((item: Clase) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.claseSeleccionada.subscribe((item: Clase) => {
                this.handleItemSeleccionado(item);
            });
        } else if (componentRef.instance instanceof ListadoEspecialesComponent) {
            componentRef.instance.especialDetalles.subscribe((item: EspecialClaseDetalle) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.especialSeleccionado.subscribe((item: EspecialClaseDetalle) => {
                this.handleItemSeleccionado(item);
            });
        } else if (componentRef.instance instanceof ListadoRacialesComponent) {
            componentRef.instance.racialDetalles.subscribe((item: RacialDetalle) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.racialSeleccionada.subscribe((item: RacialDetalle) => {
                this.handleItemSeleccionado(item);
            });
        }
    }

    @Output() abrirDetalles: EventEmitter<{ item: any, tipo: string }> = new EventEmitter();
    handleItemDetalles(item: any) {
        this.abrirDetalles.emit({ item, tipo: this.tipoLista });
    }

    @Output() itemSeleccionado: EventEmitter<{ item: any, tipo: string }> = new EventEmitter();
    handleItemSeleccionado(item: any) {
        this.itemSeleccionado.emit({ item, tipo: this.tipoLista });
    }
}
