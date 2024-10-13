import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { ListadoRazasComponent } from '../shared/listado-razas/listado-razas.component';
import { Raza } from 'src/app/interfaces/raza';

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
        // 'conjuros':
        // 'mosntruos':
        // 'plantillas':
        // 'otros':
    };

    constructor(private cdr: ChangeDetectorRef) { }

    ngAfterViewInit(): void {
        this.cargarComponente();
        this.cdr.detectChanges();
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
    }
    
    @Output() abrirDetalles: EventEmitter<{item: any, tipo: string}> = new EventEmitter();
    handleItemDetalles(item: any) {
        this.abrirDetalles.emit({item, tipo: this.tipoLista});
    }

    @Output() itemSeleccionado: EventEmitter<{item: any, tipo: string}> = new EventEmitter();
    handleItemSeleccionado(item: any) {
        this.itemSeleccionado.emit({item, tipo: this.tipoLista});
    }
}
