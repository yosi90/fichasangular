import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ArmaNaturalTipo, FormaArmaNatural, ModoArmaNatural } from 'src/app/interfaces/arma-natural';
import { ArmaNaturalService } from 'src/app/services/arma-natural.service';
import {
    FilaArmaNatural,
    FORMAS_ARMA_NATURAL,
    MODOS_ARMA_NATURAL,
    filaArmaNatural,
    problemaDeArmaNatural,
} from 'src/app/services/utils/armas-naturales';
import { OpcionCatalogo, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';
import { FilaDeLista } from '../lista-de-catalogo/lista-de-catalogo.component';

/**
 * Las armas naturales de una raza o de una plantilla en su alta y su edición (`armas_naturales` del cuerpo): la lista de
 * catálogo común (`<app-lista-de-catalogo>`) con los tipos de `GET /armas-naturales` y, en cada fila, la cantidad, el daño
 * (los dados, sin la Fuerza) y si es primaria; en una plantilla, además en qué forma y cómo se junta con las de la
 * criatura. No guarda nada: avisa con `filasChange` y la pantalla cambia sus filas.
 */
@Component({
    selector: 'app-armas-naturales-editor',
    templateUrl: './armas-naturales-editor.component.html',
    styleUrls: ['./armas-naturales-editor.component.sass'],
    standalone: false,
})
export class ArmasNaturalesEditorComponent implements OnInit, OnDestroy {
    @Input() filas: readonly FilaArmaNatural[] = [];
    /** Las de una plantilla llevan su forma y su modo. */
    @Input() plantilla = false;
    @Input() deshabilitado = false;
    /** El error de la API sobre la lista (`armas_naturales…`). */
    @Input() error: string | null = null;
    @Output() filasChange = new EventEmitter<FilaArmaNatural[]>();

    readonly modos = MODOS_ARMA_NATURAL;
    readonly formas = FORMAS_ARMA_NATURAL;
    tipos: ArmaNaturalTipo[] = [];
    opciones: OpcionCatalogo[] = [];
    private suscripcion: Subscription | null = null;

    constructor(private armasSvc: ArmaNaturalService) { }

    ngOnInit(): void {
        this.suscripcion = this.armasSvc.getTipos().subscribe({
            next: (tipos) => {
                this.tipos = tipos;
                this.opciones = opcionesDeCatalogo(tipos);
            },
            error: () => {
                this.tipos = [];
                this.opciones = [];
            },
        });
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
    }

    get filasDeLista(): readonly FilaDeLista[] {
        return this.filas;
    }

    get problema(): string | null {
        return this.error;
    }

    problemaDe(fila: FilaDeLista): string | null {
        return problemaDeArmaNatural(fila as FilaArmaNatural, this.filas, this.plantilla);
    }

    comoFila(fila: FilaDeLista): FilaArmaNatural {
        return fila as FilaArmaNatural;
    }

    anadir(id: number): void {
        const tipo = this.tipos.find((item) => item.Id === id);
        if (tipo)
            this.filasChange.emit([...this.filas, filaArmaNatural(tipo)]);
    }

    quitar(fila: FilaDeLista): void {
        this.filasChange.emit(this.filas.filter((otra) => otra.uid !== fila.uid));
    }

    cambiar(fila: FilaDeLista, cambios: Partial<Pick<FilaArmaNatural, 'cantidad' | 'dano' | 'primaria' | 'modo' | 'forma'>>): void {
        this.filasChange.emit(this.filas.map((otra) => otra.uid === fila.uid ? { ...otra, ...cambios } : otra));
    }

    cambiarCantidad(fila: FilaDeLista, valor: string): void {
        const numero = Number(valor);
        this.cambiar(fila, { cantidad: `${valor}`.trim().length > 0 && Number.isFinite(numero) ? Math.trunc(numero) : null });
    }

    cambiarModo(fila: FilaDeLista, modo: ModoArmaNatural): void {
        this.cambiar(fila, { modo, cantidad: modo === 'quita' ? 0 : Math.max(1, this.comoFila(fila).cantidad ?? 1) });
    }

    cambiarForma(fila: FilaDeLista, forma: FormaArmaNatural): void {
        this.cambiar(fila, { forma });
    }
}
