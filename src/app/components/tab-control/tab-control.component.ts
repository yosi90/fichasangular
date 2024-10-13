import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { FormControl } from '@angular/forms';
import { Personaje } from 'src/app/interfaces/personaje';
import { RazasService } from 'src/app/services/razas.service';
import { Raza } from 'src/app/interfaces/raza';

@Component({
    selector: 'app-tab-control',
    templateUrl: './tab-control.component.html',
    styleUrls: ['./tab-control.component.sass']
})
export class TabControlComponent implements OnInit {
    @Input() AbrirNuevoPersonajeTab!: number;
    @Input() AbrirListadoTab!: number;
    @Input() ListadoTabTipo!: string;
    @Input() ListadoTabOperacion!: string;
    usrPerm: number = 0;
    detallesPersonajeAbiertos: Personaje[] = [];
    detallesRazaAbiertos: Raza[] = [];

    constructor(private usrSvc: UserService, private pSvc: PersonajeService) { }

    @ViewChild(MatTabGroup) TabGroup!: MatTabGroup;
    selected = new FormControl(0);

    async ngOnInit(): Promise<void> {
        this.usrPerm = this.usrSvc.Usuario.permisos;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['AbrirNuevoPersonajeTab'] && changes['AbrirNuevoPersonajeTab'].currentValue) {
            setTimeout(() => {
                this.cambiarA(this.TabGroup._tabs.find(t => t.textLabel === 'Nuevo personaje'));
            }, 100);
        } else if (changes['AbrirListadoTab'] && changes['AbrirListadoTab'].currentValue) {
            setTimeout(() => {
                this.cambiarA(this.TabGroup._tabs.find(t => t.textLabel === `Lista de ${this.ListadoTabTipo}`));
            }, 100);
        }
    }

    cambiarA(pestaña?: MatTab) {
        if (pestaña && !pestaña.isActive)
            this.TabGroup.selectedIndex = this.TabGroup._tabs.toArray().indexOf(pestaña);
    }

    async abrirDetallesPersonaje(value: number) {
        const abierto = this.detallesPersonajeAbiertos.find(p => p.Id == value);
        if (abierto)
            this.cambiarA(this.TabGroup._tabs.find(tab => tab.textLabel === abierto.Nombre));
        else {
            (await this.pSvc.getDetallesPersonaje(value)).subscribe(personaje => {
                this.detallesPersonajeAbiertos.push(personaje);
                setTimeout(() => {
                    this.cambiarA(this.TabGroup._tabs.find(tab => tab.textLabel === personaje.Nombre));
                }, 100);
            });
        }
    }
    quitarDetallesPersonaje(value: string) {
        const tab = this.detallesPersonajeAbiertos.find(p => p.Nombre === value);
        if (!tab)
            return;
        const indexTab = this.detallesPersonajeAbiertos.indexOf(tab);
        this.detallesPersonajeAbiertos.splice(indexTab, 1);
        this.TabGroup.selectedIndex = 0;
    }

    recibirObjetoListado(value: { item: any, tipo: string }) {
        if (value.tipo === 'razas') {
            this.abrirDetallesRaza(value.item);
        }
    }

    async abrirDetallesRaza(raza: Raza) {
        if (this.detallesRazaAbiertos.find(r => r.Id === raza.Id))
            this.cambiarA(this.TabGroup._tabs.find(tab => tab.textLabel === raza.Nombre));
        else {
            this.detallesRazaAbiertos.push(raza);
            setTimeout(() => {
                this.cambiarA(this.TabGroup._tabs.find(tab => tab.textLabel === raza.Nombre));
            }, 100);
        }
    }
    quitarDetallesRaza(value: string) {
        const tab = this.detallesRazaAbiertos.find(r => r.Nombre === value);
        console.log(value, tab);
        if (!tab)
            return;
        const indexTab = this.detallesRazaAbiertos.indexOf(tab);
        this.detallesRazaAbiertos.splice(indexTab, 1);
        this.TabGroup.selectedIndex = 0;
    }

    verPersonajes() {
        this.TabGroup.selectedIndex = 0;
    }

    @Output() CerrarNuevoPersonajeTab: EventEmitter<void> = new EventEmitter();
    quitarNuevoPersonaje() {
        this.TabGroup.selectedIndex = 0;
        this.CerrarNuevoPersonajeTab.emit();
    }

    @Output() CerrarListadoTab: EventEmitter<void> = new EventEmitter();
    quitarListado() {
        this.TabGroup.selectedIndex = 0;
        this.CerrarListadoTab.emit();
    }
}
