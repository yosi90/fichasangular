import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { EquipoCatalogos, EquipoRef } from 'src/app/interfaces/equipo';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DoteService } from 'src/app/services/dote.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { CATALOGO_CARACTERISTICAS } from 'src/app/services/utils/caracteristicas';
import { toInt, toText } from 'src/app/services/utils/normalizacion';
import { conOpcionSinValor } from 'src/app/services/utils/opcion-sin-valor';
import { FilaModificador, RelacionesMagicas, filaModificadorVacia } from 'src/app/services/utils/relaciones-equipo-formulario';
import { OpcionCatalogo, nombreDeOpcion, opcionesDeCatalogo } from '../catalogo-buscador/catalogo-buscador.component';
import { cargadorDeCatalogos } from '../insercion-marco/edicion-de-catalogo';
import { uidDeFila } from '../insercion-marco/filas-repetibles';

/**
 * Lo mágico que comparten las aptitudes especiales de armas y armaduras y los objetos en su alta y su edición (segunda
 * parte del hito 7; guía de inserciones, «El equipo»): las escuelas del aura, los requisitos de creación (dotes y
 * conjuros, con su grupo de alternativas) y los modificadores estructurados. Edita las filas de `relaciones` (las del
 * formulario que lo incluye) y avisa con `cambio`; los catálogos los carga él.
 */
@Component({
    selector: 'app-equipo-magia',
    templateUrl: './equipo-magia.component.html',
    styleUrls: ['./equipo-magia.component.sass'],
    standalone: false,
})
export class EquipoMagiaComponent implements OnInit, OnDestroy {
    @Input() relaciones!: RelacionesMagicas;
    /** El error de la API o de la comprobación de antes de mandar, en su tarjeta. */
    @Input() errorRequisitos: string | null = null;
    @Input() errorModificadores: string | null = null;
    /** Los campos que ha cambiado la persona al modificar (`requisitos`, `modificadores`, `aura_escuelas`). */
    @Input() cambiados: readonly string[] = [];
    @Output() cambio = new EventEmitter<void>();

    private readonly destroy$ = new Subject<void>();
    escuelas: OpcionCatalogo[] = [];
    dotes: OpcionCatalogo[] = [];
    conjuros: OpcionCatalogo[] = [];
    habilidades: OpcionCatalogo[] = [];
    readonly caracteristicas: readonly OpcionCatalogo[] = CATALOGO_CARACTERISTICAS;
    objetivos: EquipoRef[] = [];
    tiposBonificador: EquipoRef[] = [];
    tiposDano: EquipoRef[] = [];

    constructor(
        private equipoSvc: EquipoService,
        private escuelaSvc: EscuelaConjurosService,
        private doteSvc: DoteService,
        private conjuroSvc: ConjuroService,
        private habilidadSvc: HabilidadService,
    ) { }

    ngOnInit(): void {
        const cargar = cargadorDeCatalogos(this.destroy$);
        cargar(this.equipoSvc.getCatalogos(), (catalogos: EquipoCatalogos) => {
            this.objetivos = catalogos?.Objetivos_modificador ?? [];
            this.tiposBonificador = catalogos?.Tipos_bonificador ?? [];
            this.tiposDano = (catalogos?.Tipos_dano ?? []).filter((tipo) => tipo.Id > 0);
        });
        cargar(this.escuelaSvc.getEscuelas(), (items) => this.escuelas = opcionesDeCatalogo(items as any[]).filter((item) => item.id > 0));
        cargar(this.doteSvc.getDotes(), (items) => this.dotes = opcionesDeCatalogo(items as any[]));
        cargar(this.conjuroSvc.getConjuros(), (items) => this.conjuros = opcionesDeCatalogo(items as any[]));
        cargar(this.habilidadSvc.getHabilidades(), (items) => this.habilidades = opcionesDeCatalogo(items as any[],
            (item: any) => ({ id: toInt(item?.Id_habilidad), nombre: toText(item?.Nombre) })).filter((item) => item.id > 0));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    cambiado(campo: string): boolean {
        return this.cambiados.includes(campo);
    }

    idsDe(lista: readonly { id: number; }[]): number[] {
        return lista.map((item) => item.id);
    }

    anadir(lista: 'escuelas' | 'dotes' | 'conjuros', id: number): void {
        const opciones = lista === 'escuelas' ? this.escuelas : lista === 'dotes' ? this.dotes : this.conjuros;
        if (id <= 0 || this.relaciones[lista].some((item) => item.id === id))
            return;
        const nombre = nombreDeOpcion(opciones, id);
        if (lista === 'conjuros')
            this.relaciones.conjuros = [...this.relaciones.conjuros, { id, nombre, opcional: 0 }];
        else
            this.relaciones[lista] = [...this.relaciones[lista], { id, nombre }];
        this.cambio.emit();
    }

    quitar(lista: 'escuelas' | 'dotes' | 'conjuros', id: number): void {
        (this.relaciones as any)[lista] = this.relaciones[lista].filter((item) => item.id !== id);
        this.cambio.emit();
    }

    anadirModificador(): void {
        this.relaciones.modificadores = [...this.relaciones.modificadores, filaModificadorVacia(uidDeFila('modificador'))];
        this.cambio.emit();
    }

    quitarModificador(uid: string): void {
        this.relaciones.modificadores = this.relaciones.modificadores.filter((fila) => fila.uid !== uid);
        this.cambio.emit();
    }

    elegirHabilidad(fila: FilaModificador, id: number): void {
        fila.id_habilidad = id > 0 ? id : null;
        this.cambio.emit();
    }

    quitarHabilidad(fila: FilaModificador): void {
        fila.id_habilidad = null;
        this.cambio.emit();
    }

    /** Las opciones de un selector con la de la fila si el catálogo no la lista (llega con la entrada). */
    opcionesCon(lista: EquipoRef[], id: number | null): EquipoRef[] {
        return id === null ? lista : conOpcionSinValor(lista, { Id: id, Nombre: `#${id}` });
    }

    /** «Salvaciones · resistencia +1», el resumen de la fila en su cabecera. */
    resumen(fila: FilaModificador, indice: number): string {
        const objetivo = this.objetivos.find((item) => item.Id === fila.id_objetivo)?.Nombre ?? 'Sin objetivo';
        const tipo = this.tiposBonificador.find((item) => item.Id === fila.id_tipo_bonificador)?.Nombre;
        const valor = fila.valor === null || fila.valor === undefined ? '' : ` ${Number(fila.valor) >= 0 ? '+' : ''}${fila.valor}`;
        return `${indice + 1} · ${objetivo}${tipo ? ` · ${tipo.toLowerCase()}` : ''}${valor}`;
    }

    trackByUid(_indice: number, fila: FilaModificador): string {
        return fila.uid;
    }

    trackById(_indice: number, item: { id: number; }): number {
        return item.id;
    }
}
