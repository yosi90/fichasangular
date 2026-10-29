import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha, HabilidadFicha, datosIncarnumDote, datosVisibles, esTextoCorto, habilidadesVisibles, unirTipo } from 'src/app/components/detalles/ficha';
import { Dote, DoteExtrasDeTodoElCatalogo, DoteSalvacionCondicional } from 'src/app/interfaces/dote';
import { DoteContexto, DoteContextual } from 'src/app/interfaces/dote-contextual';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import {
    CondicionPrerrequisito,
    GrupoPrerrequisitos,
    agruparPrerrequisitos,
    destinoPrerrequisito,
} from 'src/app/services/utils/prerrequisito-frase';

@Component({
    selector: 'app-detalles-dote',
    templateUrl: './detalles-dote.component.html',
    standalone: false
})
export class DetallesDoteComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    doteData!: Dote;
    contexto?: DoteContexto;
    /** Los prerrequisitos con la frase de la API, agrupados por `Opcional`. */
    prerrequisitosAgrupados: GrupoPrerrequisitos[] = [];

    @Input()
    set dote(value: Dote | DoteContextual) {
        if ((value as DoteContextual)?.Dote) {
            this.doteData = (value as DoteContextual).Dote;
            this.contexto = (value as DoteContextual).Contexto;
        } else {
            this.doteData = value as Dote;
            this.contexto = undefined;
        }
        this.prerrequisitosAgrupados = agruparPrerrequisitos(this.doteData?.Prerrequisitos);
        this.resumen = this.construirResumen();
        this.descripcionEnCabecera = esTextoCorto(this.doteData?.Descripcion);
        const otorgadas = this.doteData?.Habilidades_otorgadas ?? [];
        this.habilidadesBase = habilidadesVisibles(otorgadas.filter((h) => !h.Custom), (h) => h.Rangos);
        this.habilidadesCustom = habilidadesVisibles(otorgadas.filter((h) => h.Custom), (h) => h.Rangos);
        this.datosIncarnum = datosVisibles(datosIncarnumDote(this.doteData?.Incarnum));
        this.cuentaComo = (this.doteData?.Cuenta_como ?? []).filter((dote) => dote.Id > 0 && `${dote.Nombre ?? ''}`.trim().length > 0);
        this.salvacionesCondicionales = this.doteData?.Salvaciones_condicionales ?? [];
    }

    /** Los bonificadores a una salvación que solo cuentan en un caso, con su condición (no se suman al total). */
    salvacionesCondicionales: DoteSalvacionCondicional[] = [];

    /** Magic of Incarnum: lo que da a la reserva, si es receptáculo, la capacidad, el chakra que abre… */
    datosIncarnum: DatoFicha[] = [];
    /** Las dotes a las que sustituye en los prerrequisitos (Dureza azur cuenta como Dureza). */
    cuentaComo: { Id: number; Nombre: string; }[] = [];

    /** Las habilidades en las que da rangos («Avistar +2»), las base y las custom. */
    habilidadesBase: HabilidadFicha[] = [];
    habilidadesCustom: HabilidadFicha[] = [];

    /** «En resumen», en la columna derecha (como en el lienzo aprobado). */
    resumen: DatoFicha[] = [];

    /** «Dote · General · Guerrero». */
    get tipoCabecera(): string {
        return unirTipo(['Dote', ...(this.doteData?.Tipos ?? []).map(t => t.Nombre)]);
    }

    /** La descripción va en cursiva bajo el nombre si es un párrafo corto; si no, como sección del cuerpo. */
    descripcionEnCabecera = false;

    private construirResumen(): DatoFicha[] {
        return [
            { etiqueta: 'Tipos', valor: this.getTipos() },
            { etiqueta: 'Se elige', valor: this.textoRepeticion() },
            { etiqueta: 'Origen', valor: this.getOrigenContexto() },
        ];
    }

    /** «Una vez», o las formas en que se puede repetir. */
    private textoRepeticion(): string {
        const formas = [
            this.doteData?.Repetible ? 'Repetible' : '',
            this.doteData?.Repetible_distinto_extra ? 'Repetible con extra distinto' : '',
            this.doteData?.Repetible_comb ? 'Repetible en combinación' : '',
        ].filter(Boolean);
        return formas.length > 0 ? formas.join(', ') : 'Una vez';
    }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.doteData?.Manual?.Id,
            nombre: this.doteData?.Manual?.Nombre,
        });
    }

    getTipos(): string {
        return this.doteData?.Tipos?.map(t => t.Nombre).join(', ') ?? '';
    }

    @Output() armaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() armaduraDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() chakraDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() fusionDetallesId: EventEmitter<number> = new EventEmitter<number>();

    abrirDetallesDote(id: number): void {
        if (Number(id) > 0)
            this.doteDetallesId.emit(Number(id));
    }

    getModificadoresActivos(): { clave: string, valor: number }[] {
        if (!this.doteData?.Modificadores)
            return [];
        return Object.entries(this.doteData.Modificadores)
            .filter(([, value]) => value !== 0)
            .map(([clave, valor]) => ({ clave, valor }));
    }

    /**
     * Los extras que admite, por tipo. Si se elige de todo su catálogo (`Extras_de_todo_el_catalogo`), el bloque no lista
     * nada (la API solo trae el comodín «Elegir» o «Cualquiera») y lo dice con una nota.
     */
    getExtrasDisponibles(): { nombre: string, items: { Id: number, Nombre: string }[], todoElCatalogo: boolean }[] {
        if (!this.doteData?.Extras_disponibles)
            return [];
        const activas = new Set(this.getExtrasSoportadosActivos().map(extra => extra.nombre));
        const armaduras = this.doteData.Extras_disponibles.Armaduras ?? [];
        const todo = this.doteData.Extras_de_todo_el_catalogo;
        const bloque = (nombre: string, items: { Id: number, Nombre: string }[], clave: keyof DoteExtrasDeTodoElCatalogo) =>
            ({ nombre, items: todo?.[clave] ? [] : items, todoElCatalogo: !!todo?.[clave] });
        return [
            bloque('Armas', this.doteData.Extras_disponibles.Armas ?? [], 'Armas'),
            bloque('Armaduras', armaduras.filter((item: any) => !item?.Es_escudo), 'Armaduras'),
            bloque('Escudos', armaduras.filter((item: any) => !!item?.Es_escudo), 'Armaduras'),
            bloque('Escuelas', this.doteData.Extras_disponibles.Escuelas ?? [], 'Escuelas'),
            bloque('Habilidades', this.doteData.Extras_disponibles.Habilidades ?? [], 'Habilidades'),
            bloque('Chakras', this.doteData.Extras_disponibles.Chakras ?? [], 'Chakras'),
            bloque('Fusiones', this.doteData.Extras_disponibles.Fusiones ?? [], 'Fusiones'),
        ].filter(item => activas.has(item.nombre) && (item.items.length > 0 || item.todoElCatalogo));
    }

    bloqueExtraRequiereCompetencia(nombreBloque: string): boolean {
        if (!this.doteData?.Comp_arma)
            return false;
        return nombreBloque === 'Armas' || nombreBloque === 'Escudos';
    }

    esExtraNavegable(nombreBloque: string): boolean {
        return ['Armas', 'Armaduras', 'Escudos', 'Chakras', 'Fusiones'].includes(nombreBloque);
    }

    abrirDetalleExtra(nombreBloque: string, item: { Id: number, Nombre: string }): void {
        const id = Number(item?.Id ?? 0);
        if (!this.esExtraNavegable(nombreBloque) || !Number.isFinite(id) || id <= 0)
            return;
        if (nombreBloque === 'Armas') {
            this.armaDetallesId.emit(id);
            return;
        }
        if (nombreBloque === 'Chakras') {
            this.chakraDetallesId.emit(id);
            return;
        }
        if (nombreBloque === 'Fusiones') {
            this.fusionDetallesId.emit(id);
            return;
        }
        this.armaduraDetallesId.emit(id);
    }

    getExtrasSoportadosActivos(): { nombre: string, activo: boolean }[] {
        if (!this.doteData?.Extras_soportados)
            return [];
        return [
            { nombre: 'Armas', activo: !!this.doteData.Extras_soportados.Extra_arma },
            {
                nombre: 'Armaduras',
                activo: !!(this.doteData.Extras_soportados.Extra_armadura_armaduras ?? this.doteData.Extras_soportados.Extra_armadura)
            },
            {
                nombre: 'Escudos',
                activo: !!(this.doteData.Extras_soportados.Extra_armadura_escudos ?? this.doteData.Extras_soportados.Extra_armadura)
            },
            { nombre: 'Escuelas', activo: !!this.doteData.Extras_soportados.Extra_escuela },
            { nombre: 'Habilidades', activo: !!this.doteData.Extras_soportados.Extra_habilidad },
            { nombre: 'Chakras', activo: !!this.doteData.Extras_soportados.Extra_chakra },
            { nombre: 'Fusiones', activo: !!this.doteData.Extras_soportados.Extra_fusion },
        ].filter(extra => extra.activo);
    }

    /** «Armas, Escudos»: los tipos de extra que admite. */
    getTextoExtrasSoportados(): string {
        return this.getExtrasSoportadosActivos().map(extra => extra.nombre).join(', ');
    }

    tieneExtras(): boolean {
        return this.getExtrasSoportadosActivos().length > 0;
    }

    /** Las competencias con un arma o una armadura llevan a su detalle (función: la usa `<app-ficha-prerrequisitos>`). */
    readonly esPrerrequisitoNavegable = (condicion: CondicionPrerrequisito): boolean => {
        const destino = destinoPrerrequisito(condicion);
        return destino?.entidad === 'arma' || destino?.entidad === 'armadura';
    };

    abrirDetallePrerrequisito(condicion: CondicionPrerrequisito): void {
        const destino = destinoPrerrequisito(condicion);
        if (destino?.entidad === 'arma')
            this.armaDetallesId.emit(destino.id);
        else if (destino?.entidad === 'armadura')
            this.armaduraDetallesId.emit(destino.id);
    }

    getOrigenContexto(): string {
        if (!this.contexto || this.contexto.Entidad !== 'personaje')
            return '';
        return this.contexto.Origen?.trim() ?? '';
    }
}
