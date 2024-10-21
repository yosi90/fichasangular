import { Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { FormControl } from '@angular/forms';
import { Personaje } from 'src/app/interfaces/personaje';
import { Raza } from 'src/app/interfaces/raza';
import { Conjuro } from 'src/app/interfaces/conjuro';
import Swal from 'sweetalert2';
import { AptitudSortilega } from 'src/app/interfaces/Aptitud-sortilega';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';

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
    detallesConjuroAbiertos: Conjuro[] = [];
    detallesSortilegaAbiertos: { ap: AptitudSortilega, fuente: string }[] = [];
    detallesTipoCriaturaAbiertos: TipoCriatura[] = [];

    constructor(private usrSvc: UserService, private pSvc: PersonajeService) { }

    @ViewChild(MatTabGroup) TabGroup!: MatTabGroup;
    previousTab!: MatTab;
    actualTab!: MatTab;

    ngOnInit() {
        this.usrPerm = this.usrSvc.Usuario.permisos;
    }

    ngAfterViewInit() {
        this.previousTab = this.TabGroup._tabs.toArray()[0];
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['AbrirNuevoPersonajeTab'] && changes['AbrirNuevoPersonajeTab'].currentValue) {
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(t => t.textLabel === 'Nuevo personaje'));
            }, 100);
        } else if (changes['AbrirListadoTab'] && changes['AbrirListadoTab'].currentValue) {
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(t => t.textLabel === `Lista de ${this.ListadoTabTipo}`));
            }, 100);
        }
    }

    onTabChange(event: any) {
        if (!this.actualTab) {
            this.actualTab = this.TabGroup._tabs.toArray()[event.index];
        } else if (!this.TabGroup._tabs.toArray().includes(this.previousTab) || this.TabGroup._tabs.toArray()[event.index] === this.actualTab) {
            this.previousTab = this.TabGroup._tabs.toArray()[0];
        } else {
            this.previousTab = this.actualTab;
            this.actualTab = this.TabGroup._tabs.toArray()[event.index];
        }
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            if (this.TabGroup._tabs.toArray()[this.TabGroup.selectedIndex ?? 0].textLabel === 'Nuevo personaje') {
                Swal.fire({
                    title: "¿Estas seguro?",
                    text: "Perderás el personaje que estás creando",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Sí, sácame de aquí"
                }).then((result) => {
                    if (result.isConfirmed)
                        this.onEscPressed();
                });
            } else
                this.onEscPressed();
        }
    }

    // Función que se ejecuta al presionar "Esc"
    onEscPressed(): void {
        const currentIndex = this.TabGroup.selectedIndex;
        if (!currentIndex || currentIndex == 0)
            return;
        const tabLabel = this.TabGroup._tabs.toArray()[currentIndex].textLabel;
        if (tabLabel === 'Panel de administración' || tabLabel === 'Información importante')
            return;
        if (this.detallesPersonajeAbiertos.map(p => p.Nombre).includes(tabLabel) && this.quitarDetallesPersonaje(tabLabel))
            return;
        else if (this.detallesRazaAbiertos.map(r => r.Nombre).includes(tabLabel) && this.quitarDetallesRaza(tabLabel))
            return;
        else if (this.detallesConjuroAbiertos.map(c => c.Nombre).includes(tabLabel) && this.quitarDetallesConjuro(tabLabel))
            return;
        else if (this.detallesSortilegaAbiertos.map(c => c.ap.Conjuro.Nombre).includes(tabLabel) && this.quitarDetallesSortilega(tabLabel))
            return;
        else if (this.detallesTipoCriaturaAbiertos.map(t => t.Nombre).includes(tabLabel) && this.quitarDetallesTipoCriatura(tabLabel))
            return;
        else if (tabLabel.includes('Nuevo personaje'))
            this.quitarNuevoPersonaje();
        else if (tabLabel.includes('Lista de'))
            this.quitarListado();
    }

    cambiarA(modo: boolean, pestaña?: MatTab) {
        if (modo && pestaña && !pestaña.isActive)
            this.TabGroup.selectedIndex = this.TabGroup._tabs.toArray().indexOf(pestaña);
        else if (!modo) {
            if (!this.TabGroup._tabs.toArray().includes(this.previousTab) || this.previousTab === this.actualTab)
                this.TabGroup.selectedIndex = 0;
            else if ((this.previousTab.position ?? 0) < 0)
                this.TabGroup.selectedIndex = (this.previousTab.origin ?? 0)
            else {
                let moverA = (this.previousTab.position ?? 0) > 0 ? (this.previousTab.position ?? 0) - 1 : (this.previousTab.position ?? 0);
                this.TabGroup.selectedIndex = (this.actualTab.origin ?? 0) + moverA;
            }
            this.actualTab = this.previousTab;
            this.previousTab = this.TabGroup._tabs.toArray()[0];
        }
    }

    async abrirDetallesPersonaje(value: number) {
        const abierto = this.detallesPersonajeAbiertos.find(p => p.Id == value);
        if (abierto)
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === abierto.Nombre));
        else {
            (await this.pSvc.getDetallesPersonaje(value)).subscribe(personaje => {
                this.detallesPersonajeAbiertos.push(personaje);
                setTimeout(() => {
                    this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === personaje.Nombre));
                }, 100);
            });
        }
    }
    quitarDetallesPersonaje(value: string): boolean {
        const tab = this.detallesPersonajeAbiertos.find(p => p.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesPersonajeAbiertos.indexOf(tab);
        this.detallesPersonajeAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    recibirObjetoListado(value: { item: any, tipo: string }) {
        if (value.tipo === 'razas') {
            this.abrirDetallesRaza(value.item);
        } else if (value.tipo === 'conjuros') {
            this.abrirDetallesConjuro(value.item);
        } else if (value.tipo === 'tipos de criatura') {
            this.abrirDetallesTipoCriatura(value.item);
        }
    }

    async abrirDetallesRaza(raza: Raza) {
        if (this.detallesRazaAbiertos.find(r => r.Id === raza.Id))
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === raza.Nombre));
        else {
            this.detallesRazaAbiertos.push(raza);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === raza.Nombre));
            }, 100);
        }
    }
    quitarDetallesRaza(value: string): boolean {
        const tab = this.detallesRazaAbiertos.find(r => r.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesRazaAbiertos.indexOf(tab);
        this.detallesRazaAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    async abrirDetallesConjuro(conjuro: Conjuro) {
        if (this.detallesConjuroAbiertos.find(c => c.Id === conjuro.Id))
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === conjuro.Nombre));
        else {
            this.detallesConjuroAbiertos.push(conjuro);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === conjuro.Nombre));
            }, 100);
        }
    }
    quitarDetallesConjuro(value: string): boolean {
        const tab = this.detallesConjuroAbiertos.find(c => c.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesConjuroAbiertos.indexOf(tab);
        this.detallesConjuroAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    async abrirDetallesSortilega(ap: AptitudSortilega, fuente: string) {
        if (this.detallesSortilegaAbiertos.find(c => c.ap.Conjuro.Id === ap.Conjuro.Id))
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === ap.Conjuro.Nombre));
        else {
            this.detallesSortilegaAbiertos.push({ ap, fuente });
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === ap.Conjuro.Nombre));
            }, 100);
        }
    }
    quitarDetallesSortilega(value: string): boolean {
        const tab = this.detallesSortilegaAbiertos.find(c => c.ap.Conjuro.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesSortilegaAbiertos.indexOf(tab);
        this.detallesSortilegaAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    async abrirDetallesTipoCriatura(tipo: TipoCriatura) {
        if (this.detallesTipoCriaturaAbiertos.find(t => t.Id === tipo.Id))
            this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === tipo.Nombre));
        else {
            this.detallesTipoCriaturaAbiertos.push(tipo);
            setTimeout(() => {
                this.cambiarA(true, this.TabGroup._tabs.find(tab => tab.textLabel === tipo.Nombre));
            }, 100);
        }
    }
    quitarDetallesTipoCriatura(value: string): boolean {
        const tab = this.detallesTipoCriaturaAbiertos.find(t => t.Nombre === value);
        if (!tab)
            return false;
        const indexTab = this.detallesTipoCriaturaAbiertos.indexOf(tab);
        this.detallesTipoCriaturaAbiertos.splice(indexTab, 1);
        this.cambiarA(false);
        return true;
    }

    verPersonajes() {
        this.TabGroup.selectedIndex = 0;
    }

    @Output() CerrarNuevoPersonajeTab: EventEmitter<void> = new EventEmitter();
    quitarNuevoPersonaje() {
        this.cambiarA(false);
        this.CerrarNuevoPersonajeTab.emit();
    }

    @Output() CerrarListadoTab: EventEmitter<void> = new EventEmitter();
    quitarListado() {
        this.cambiarA(false);
        this.CerrarListadoTab.emit();
    }
}
