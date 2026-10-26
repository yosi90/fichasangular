import { Component, DoCheck, EventEmitter, Input, Output } from '@angular/core';
import { CasillaFicha, casillasCaracteristicasPersonaje, dotesVisiblesPersonaje, textosMovimiento } from 'src/app/components/detalles/ficha';
import { DoteLegacy } from 'src/app/interfaces/dote-contextual';
import { Personaje } from 'src/app/interfaces/personaje';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { textoDesglose, totalesPersonaje } from 'src/app/services/utils/personaje-totales';
import { esVisibleEnPersonaje } from 'src/app/components/detalles/ficha/personaje';

interface ParPersonaje {
    nombre: string;
    valor: string;
    ayuda: string;
}

interface ModeloTuPersonaje {
    casillas: CasillaFicha[];
    pares: ParPersonaje[];
    dotes: { texto: string; ref: DoteLegacy; }[];
}

/**
 * «Tu personaje», a la derecha de los pasos de la creación: las casillas de las características y los números que
 * cambian con cada elección (PG, CA, iniciativa, ataque base, salvaciones y velocidad) y sus dotes. El personaje de la
 * creación cambia por dentro, así que se recalcula en cada revisión y solo se vuelve a pintar si cambia algo.
 */
@Component({
    selector: 'app-creacion-personaje',
    template: `
        <section class="ficha-tarjeta creacion-personaje" aria-labelledby="creacion-personaje-titulo">
            <h2 class="ficha-titulo" id="creacion-personaje-titulo">Tu personaje</h2>
            <app-ficha-casillas [casillas]="m.casillas" [compacta]="true"></app-ficha-casillas>
            <p class="ficha-nota" *ngIf="m.casillas.length < 1">Las características salen al generarlas.</p>
            <div class="creacion-personaje__pares" *ngIf="m.pares.length > 0">
                <div class="creacion-personaje__par" *ngFor="let par of m.pares">
                    <span class="creacion-personaje__par-nombre">{{par.nombre}}</span>
                    <span class="creacion-personaje__par-valor" [matTooltip]="par.ayuda" [matTooltipDisabled]="!par.ayuda"
                        matTooltipClass="tt-accent tt-multiline">{{par.valor}}</span>
                </div>
            </div>
            <ng-container *ngIf="m.dotes.length > 0">
                <h3 class="ficha-titulo">Dotes ({{m.dotes.length}})</h3>
                <ul class="ficha-lista">
                    <li class="ficha-lista__item" *ngFor="let dote of m.dotes">
                        <button type="button" class="ficha-enlace" *ngIf="doteDetalles.observed; else doteTexto"
                            (click)="doteDetalles.emit(dote.ref)">{{dote.texto}}</button>
                        <ng-template #doteTexto>{{dote.texto}}</ng-template>
                    </li>
                </ul>
            </ng-container>
            <ng-content></ng-content>
        </section>`,
    standalone: false
})
export class CreacionPersonajeComponent implements DoCheck {
    @Input() personaje: Personaje | null | undefined = null;
    /** Si alguien la escucha, cada dote es un enlace a su detalle. */
    @Output() doteDetalles = new EventEmitter<DoteLegacy>();

    m: ModeloTuPersonaje = { casillas: [], pares: [], dotes: [] };
    private firma = '';

    ngDoCheck(): void {
        const modelo = modeloTuPersonaje(this.personaje);
        const firma = JSON.stringify(modelo, (clave, valor) => clave === 'ref' ? undefined : valor);
        if (firma === this.firma)
            return;
        this.firma = firma;
        this.m = modelo;
    }
}

/** Lo que enseña «Tu personaje»: solo los números que ya tiene (sin PG hasta tirarlos, sin CA hasta tener raza…). */
export function modeloTuPersonaje(pj: Personaje | null | undefined): ModeloTuPersonaje {
    if (!pj)
        return { casillas: [], pares: [], dotes: [] };
    const casillas = casillasCaracteristicasPersonaje(pj);
    const totales = totalesPersonaje(pj);
    const pares: ParPersonaje[] = [];
    if (toNumber(pj.Vida) > 0)
        pares.push({ nombre: 'Puntos de golpe', valor: `${toNumber(pj.Vida)}`, ayuda: '' });
    if (toNumber(pj.Ca) > 0)
        pares.push({ nombre: 'Clase de armadura', valor: `${toNumber(pj.Ca)}`, ayuda: '' });
    if (casillas.length > 0)
        pares.push({ nombre: 'Iniciativa', valor: textoConSigno(toNumber(totales.iniciativa?.total)), ayuda: textoDesglose(totales.iniciativa) });
    if (esVisibleEnPersonaje(pj.Ataque_base))
        pares.push({ nombre: 'Ataque base', valor: `${pj.Ataque_base}`.trim(), ayuda: '' });
    if (casillas.length > 0) {
        ([['fortaleza', 'Fortaleza'], ['reflejos', 'Reflejos'], ['voluntad', 'Voluntad']] as const).forEach(([tipo, nombre]) => {
            const salvacion = totales.salvaciones?.[tipo];
            pares.push({ nombre, valor: textoConSigno(toNumber(salvacion?.total)), ayuda: textoDesglose(salvacion) });
        });
    }
    const velocidad = textosMovimiento(pj, null)[0];
    if (velocidad)
        pares.push({ nombre: 'Velocidad', valor: velocidad, ayuda: textosMovimiento(pj, null).slice(1).join(', ') });
    return { casillas, pares, dotes: dotesVisiblesPersonaje(pj) };
}
