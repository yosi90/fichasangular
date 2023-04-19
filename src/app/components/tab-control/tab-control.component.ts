import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { DetallesPersonajeService } from 'src/app/services/detalles-personaje.service';
import { MatTabGroup } from '@angular/material/tabs';
import { FormControl } from '@angular/forms';
import { DetallesPersonaje } from 'src/app/interfaces/detalles-personaje';

@Component({
    selector: 'app-tab-control',
    templateUrl: './tab-control.component.html',
    styleUrls: ['./tab-control.component.sass']
})
export class TabControlComponent implements OnInit {
    usrPerm: number = 0;
    tabs: DetallesPersonaje[] = [];

    constructor(private usrSvc: UserService, private dpsSvc: DetallesPersonajeService) { }

    @ViewChild(MatTabGroup) TabGroup!: MatTabGroup;
    selected = new FormControl(0);

    async ngOnInit(): Promise<void> {
        this.usrPerm = this.usrSvc.Usuario.permisos;
    }

    async VerDetallesDe(value: number) {
        (await this.dpsSvc.getDetallesPersonaje(value)).subscribe(personaje => {
            const pestañaExistente = this.TabGroup._tabs.find(tab => tab.textLabel === personaje.Nombre);
            if (!pestañaExistente) {
                this.tabs.push(personaje);
                this.TabGroup.selectedIndex = this.TabGroup._tabs.toArray().length;
            } else if (pestañaExistente && !pestañaExistente.isActive)
                this.TabGroup.selectedIndex = this.TabGroup._tabs.toArray().indexOf(pestañaExistente);
        });
    }

    removeTab(value: string) {
        const existe = this.TabGroup._tabs.find(tab => tab.textLabel === value);
        const resta = this.TabGroup._allTabs.length - this.tabs.length;
        if (existe) {
            this.tabs.splice(this.TabGroup._tabs.toArray().indexOf(existe) - resta, 1);
            this.TabGroup.selectedIndex = 0;
        }
    }
}
