import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { FormControl } from '@angular/forms';
import { Personaje } from 'src/app/interfaces/personaje';

@Component({
    selector: 'app-tab-control',
    templateUrl: './tab-control.component.html',
    styleUrls: ['./tab-control.component.sass']
})
export class TabControlComponent implements OnInit {
    @Input() AbrirNuevoPersonajeTab!: number;
    usrPerm: number = 0;
    tabs: Personaje[] = [];

    constructor(private usrSvc: UserService, private pSvc: PersonajeService) { }

    @ViewChild(MatTabGroup) TabGroup!: MatTabGroup;
    selected = new FormControl(0);

    async ngOnInit(): Promise<void> {
        this.usrPerm = this.usrSvc.Usuario.permisos;
    }

    async VerDetallesDe(value: number) {
        const abierto = this.tabs.find(p => p.Id == value);
        if (abierto) {
            const pestaña = this.TabGroup._tabs.find(tab => tab.textLabel === abierto.Nombre);
            if (pestaña && !pestaña.isActive)
                this.TabGroup.selectedIndex = this.TabGroup._tabs.toArray().indexOf(pestaña);
        } else {
            (await this.pSvc.getDetallesPersonaje(value)).subscribe(personaje => {
                this.tabs.push(personaje);
                setTimeout(() => {
                    this.VerDetallesDe(value);
                }, 20);
            });
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['AbrirNuevoPersonajeTab'].currentValue) {
            this.TabGroup.selectedIndex = this.TabGroup._tabs.toArray().length;
        }
    }

    removeDetallesTab(value: string) {
        const existe = this.TabGroup._tabs.find(tab => tab.textLabel === value);
        const resta = this.TabGroup._allTabs.length - this.tabs.length;
        if (existe) {
            this.TabGroup.selectedIndex = 0;
            this.tabs.splice(this.TabGroup._tabs.toArray().indexOf(existe) - resta, 1);
        }
    }

    @Output() CerrarNuevoPersonajeTab: EventEmitter<any> = new EventEmitter();
    removeNuevoPersonaje() {
        this.TabGroup.selectedIndex = 0;
        this.CerrarNuevoPersonajeTab.emit();
    }
}
