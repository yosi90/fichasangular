import { ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { ListadoRazasComponent } from '../listado-razas/listado-razas.component';
import { Raza } from 'src/app/interfaces/raza';
import { ListadoConjurosComponent } from '../listado-conjuros/listado-conjuros.component';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { ListadoTiposCriaturaComponent } from '../listado-tipos-criatura/listado-tipos-criatura.component';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';

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
        // 'clases':
        // 'dotes':
        'conjuros': ListadoConjurosComponent,
        // 'mosntruos':
        // 'plantillas':
        // 'otros':
        'tipos de criatura': ListadoTiposCriaturaComponent,
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
        }

        // if (componentRef.instance instanceof ListadoClasesComponent) {
        //     componentRef.instance.claseDetalles.subscribe((item: Clase) => {
        //         this.handleItemSeleccionado(item);
        //     });
        //     componentRef.instance.claseSeleccionada.subscribe((item: Clase) => {
        //         this.handleItemSeleccionado(item);
        //     });
        // }

        if (componentRef.instance instanceof ListadoConjurosComponent) {
            componentRef.instance.conjuroDetalles.subscribe((item: Conjuro) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.conjuroSeleccionado.subscribe((item: Conjuro) => {
                this.handleItemSeleccionado(item);
            });
        }

        if (componentRef.instance instanceof ListadoTiposCriaturaComponent) {
            componentRef.instance.tipoCriaturaDetalles.subscribe((item: TipoCriatura) => {
                this.handleItemDetalles(item);
            });
            componentRef.instance.tipoCriaturaSeleccionado.subscribe((item: TipoCriatura) => {
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
