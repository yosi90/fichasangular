import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha, unirTipo } from 'src/app/components/detalles/ficha';
import { descripcionEquipoVisible } from 'src/app/components/shared/descripcion-equipo/descripcion-equipo.component';
import { ArmaDetalle, ArmaPropiedad } from 'src/app/interfaces/arma';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { textoConSigno, textoPeso, textoPrecio } from 'src/app/services/utils/equipo-texto';
import { tieneNumeroVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';

/** Una propiedad del arma con su explicación, siempre a la vista: «Desarmar +2». */
interface PropiedadVisible {
    texto: string;
    descripcion: string | null;
}

@Component({
    selector: 'app-detalles-arma',
    templateUrl: './detalles-arma.component.html',
    standalone: false
})
export class DetallesArmaComponent {
    private armaActual!: ArmaDetalle;

    @Input()
    set arma(valor: ArmaDetalle) {
        this.armaActual = valor;
        this.tipoCabecera = unirTipo(['Arma', valor?.Tipo_arma?.Nombre, valor?.Manejo?.Nombre]);
        this.etiquetas = this.construirRasgos();
        this.datos = this.construirDatos();
        this.propiedades = (valor?.Propiedades ?? [])
            .filter((propiedad) => tieneTextoVisible(propiedad?.Nombre))
            .map((propiedad) => ({
                texto: this.textoPropiedad(propiedad),
                descripcion: tieneTextoVisible(propiedad.Descripcion) ? propiedad.Descripcion.trim() : null,
            }));
        this.conDescripcion = descripcionEquipoVisible(valor);
    }
    get arma(): ArmaDetalle {
        return this.armaActual;
    }

    /** La munición que dispara, para abrir su detalle. */
    @Output() municionDetallesId = new EventEmitter<number>();

    /** «Arma · Marcial · A una mano». */
    tipoCabecera = '';
    /** Lo que es el arma además de su manejo: a distancia, arrojadiza, doble. */
    etiquetas: string[] = [];
    datos: DatoFicha[] = [];
    propiedades: PropiedadVisible[] = [];
    conDescripcion = false;

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.arma?.Manual?.Id,
            nombre: this.arma?.Manual?.Nombre,
        });
    }

    abrirMunicion() {
        const id = Number(this.arma?.Municion?.Id ?? 0);
        if (id > 0)
            this.municionDetallesId.emit(id);
    }

    /** «Desarmar +2»; sin valor, solo el nombre. */
    textoPropiedad(propiedad: ArmaPropiedad): string {
        const valor = propiedad?.Valor;
        return valor === null || valor === undefined || valor === 0
            ? propiedad.Nombre
            : `${propiedad.Nombre} ${textoConSigno(valor)}`;
    }

    private construirRasgos(): string[] {
        const rasgos: string[] = [];
        if (this.arma?.A_distancia)
            rasgos.push('A distancia');
        if (this.arma?.Arrojadiza)
            rasgos.push('Arrojadiza');
        if (this.arma?.Doble)
            rasgos.push('Doble');
        return rasgos;
    }

    private construirDatos(): DatoFicha[] {
        const arma = this.arma;
        if (!arma)
            return [];
        const porTamano = tieneTextoVisible(arma.Dano_pequeno) || tieneTextoVisible(arma.Dano_mediano);
        const incremento = Number(arma.Incremento_distancia ?? 0);
        return [
            // El daño por tamaño, si la API lo da; si no, el compuesto («1d8/1d6»).
            ...(porTamano
                ? [
                    { etiqueta: 'Daño (Pequeño)', valor: arma.Dano_pequeno, ayuda: 'El daño del arma hecha para una criatura Pequeña' },
                    { etiqueta: 'Daño (Mediano)', valor: arma.Dano_mediano, ayuda: 'El daño del arma hecha para una criatura Mediana' },
                ]
                : [{ etiqueta: 'Daño', valor: arma.Dano }]),
            { etiqueta: 'Crítico', valor: arma.Critico, detalle: this.explicacionCritico() },
            { etiqueta: 'Tipo de daño', valor: arma.Tipo_dano?.Nombre },
            { etiqueta: 'Incremento de distancia', valor: incremento > 0 ? `${incremento} pies` : null },
            { etiqueta: 'Alcance', valor: tieneNumeroVisible(arma.Alcance) ? `${arma.Alcance} pies` : null },
            {
                etiqueta: 'Munición',
                valor: arma.Municion?.Nombre,
                alPulsar: Number(arma.Municion?.Id ?? 0) > 0 ? () => this.abrirMunicion() : undefined,
            },
            { etiqueta: 'Precio', valor: tieneNumeroVisible(arma.Precio) ? textoPrecio(arma.Precio) : null },
            { etiqueta: 'Peso', valor: tieneNumeroVisible(arma.Peso) ? textoPeso(arma.Peso) : null },
            { etiqueta: 'Tamaño', valor: arma.Tamano?.Nombre },
            { etiqueta: 'Material', valor: arma.Material?.Nombre },
            {
                etiqueta: 'Índice de Fuerza',
                valor: tieneNumeroVisible(arma.Indice_fuerza_coste) ? `${arma.Indice_fuerza_coste} po por punto` : null,
                ayuda: 'Arcos compuestos: lo que cuesta cada punto de índice de Fuerza',
            },
        ];
    }

    /**
     * El crítico explicado con sus campos estructurados: «amenaza con 19-20, daño ×2»; en un arma doble, «×3 y ×4»
     * (una cabeza y la otra). Sin ellos, nada: queda el valor compuesto por la API.
     */
    private explicacionCritico(): string | null {
        const arma = this.arma;
        const multiplicador = Number(arma?.Critico_multiplicador ?? 0);
        if (!tieneTextoVisible(arma?.Critico) || multiplicador <= 0)
            return null;
        const rango = Number(arma.Critico_rango ?? 20);
        const amenaza = rango > 0 && rango < 20 ? `${rango}-20` : '20';
        const segundo = Number(arma.Critico_multiplicador_2 ?? 0);
        const dano = segundo > 0 ? `×${multiplicador} y ×${segundo}` : `×${multiplicador}`;
        return `(amenaza con ${amenaza}, daño ${dano})`;
    }
}
