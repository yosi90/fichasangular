import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { EncantamientoDetalle } from 'src/app/interfaces/equipo';
import { formatoNumero, textoConSigno, textoPrecio } from 'src/app/services/utils/equipo-texto';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import {
    BONIFICADOR_TOTAL_MAXIMO,
    LineaPrecio,
    MEJORA_MAXIMA,
    MaterialAplicable,
    POLITICA_TIENDA_LIBRE,
    PiezaTienda,
    PoliticaTienda,
    bonificadorTotal,
    desglosePrecio,
    motivoPiezaNoValida,
    precioEstimado,
    seConfiguraAMedida,
} from 'src/app/services/utils/tienda-equipo';

/**
 * Configurar una pieza de la tienda (lienzo de la creación del 2026-10-26): cuántas, si la lleva puesta, el conjuro de un
 * genérico y, si se hace a medida, material, mejora y aptitudes especiales, con el precio desglosado y el aviso si no
 * llega el dinero (lo que le queda más lo que ya costaba la pieza). Las opciones salen de los datos: los materiales con
 * coste para esta pieza y las aptitudes que se le aplican (los calcula la tienda).
 */
@Component({
    selector: 'app-configurar-pieza',
    templateUrl: './configurar-pieza.component.html',
    styleUrls: ['./configurar-pieza.component.sass'],
    standalone: false
})
export class ConfigurarPiezaComponent implements OnChanges {
    @Input() pieza!: PiezaTienda;
    /** Si es una pieza nueva del catálogo (se añade al guardar) o una del carro (se sustituye). */
    @Input() nueva = false;
    @Input() materiales: MaterialAplicable[] = [];
    @Input() aptitudes: EncantamientoDetalle[] = [];
    /** El dinero que hay para esta pieza: lo que le queda más lo que ya costaba. */
    @Input() disponible = 0;
    @Input() politica: PoliticaTienda = POLITICA_TIENDA_LIBRE;
    @Input() conjuros: { Id: number; Nombre: string; }[] = [];
    @Output() guardar = new EventEmitter<PiezaTienda>();
    @Output() cancelar = new EventEmitter<void>();

    readonly mejoras = Array.from({ length: MEJORA_MAXIMA + 1 }, (_, i) => i);
    readonly textoPrecio = textoPrecio;
    readonly textoConSigno = textoConSigno;
    readonly maximoTotal = BONIFICADOR_TOTAL_MAXIMO;

    borrador!: PiezaTienda;
    desglose: LineaPrecio[] = [];
    precio = 0;
    total = 0;
    motivo: string | null = null;
    falta = 0;

    ngOnChanges(): void {
        if (this.pieza)
            this.actualizar({ ...this.pieza, aptitudes: [...this.pieza.aptitudes] });
    }

    get aMedida(): boolean {
        return seConfiguraAMedida(this.borrador.articulo);
    }

    get subtitulo(): string {
        const articulo = this.borrador.articulo;
        const precio = articulo.generico ? `${textoPrecio(articulo.generico.Precio_por_nivel)} × nivel × NL` : textoPrecio(articulo.precio);
        return [articulo.categoria, precio, this.nueva ? 'nueva' : 'la que ya compra'].filter(Boolean).join(' · ');
    }

    get textoBoton(): string {
        if (this.motivo)
            return this.motivo.startsWith('El bonificador total') ? `Pasa de ${textoConSigno(BONIFICADOR_TOTAL_MAXIMO)}` : 'Revisa la pieza';
        if (this.falta > 0)
            return 'No te llega el dinero';
        return `${this.nueva ? 'Añadir' : 'Guardar'} la pieza · ${textoPrecio(this.precio)}`;
    }

    get puedeGuardar(): boolean {
        return !this.motivo && this.falta <= 0;
    }

    /** Lo que cuesta un material para esta pieza, en corto: «+3.000 po», «×2 · encantarla, +2.000 po», «+10 po/lb». */
    textoCosteMaterial(item: MaterialAplicable): string {
        const coste = item.coste;
        const partes = [
            coste.Multiplicador_precio && coste.Multiplicador_precio !== 1 ? `×${formatoNumero(coste.Multiplicador_precio)}` : '',
            coste.Coste ? `+${textoPrecio(coste.Coste)}` : '',
            coste.Coste_por_libra ? `+${textoPrecio(coste.Coste_por_libra)}/lb` : '',
            coste.Coste_encantar ? `encantarla, +${textoPrecio(coste.Coste_encantar)}` : '',
        ].filter(Boolean);
        return partes.join(' · ') || '—';
    }

    notaMaterial(item: MaterialAplicable): string {
        return item.material.Cuenta_como_gran_calidad ? 'ya de gran calidad' : (item.coste.Aplicacion?.Nombre ?? '');
    }

    textoCosteAptitud(aptitud: EncantamientoDetalle): string {
        return aptitud.Modificador > 0 ? textoConSigno(aptitud.Modificador) : textoPrecio(aptitud.Coste);
    }

    esMaterial(item: MaterialAplicable | null): boolean {
        return (this.borrador.material?.Id ?? null) === (item?.material.Id ?? null);
    }

    tieneAptitud(aptitud: EncantamientoDetalle): boolean {
        return this.borrador.aptitudes.some((a) => a.Id === aptitud.Id);
    }

    elegirMaterial(item: MaterialAplicable | null): void {
        this.actualizar({ ...this.borrador, material: item?.material ?? null, costeMaterial: item?.coste ?? null });
    }

    elegirMejora(mejora: number): void {
        // Sin mejora, las aptitudes no se pueden poner (Guía del DM): se quitan.
        this.actualizar({ ...this.borrador, bonificadorMejora: mejora, aptitudes: mejora > 0 ? this.borrador.aptitudes : [] });
    }

    alternarAptitud(aptitud: EncantamientoDetalle): void {
        if (this.borrador.bonificadorMejora < 1)
            return;
        const aptitudes = this.tieneAptitud(aptitud)
            ? this.borrador.aptitudes.filter((a) => a.Id !== aptitud.Id)
            : [...this.borrador.aptitudes, aptitud];
        this.actualizar({ ...this.borrador, aptitudes });
    }

    cambiar(cambios: Partial<PiezaTienda>): void {
        this.actualizar({ ...this.borrador, ...cambios });
    }

    numero(valor: unknown, minimo: number): number {
        const numero = Math.trunc(Number(valor));
        return Number.isFinite(numero) ? Math.max(minimo, numero) : minimo;
    }

    /** Los conjuros que encajan con lo escrito en el campo del conjuro de un genérico. */
    conjurosPara(texto: string): { Id: number; Nombre: string; }[] {
        const buscado = normalizarTexto(texto, true);
        if (buscado.length < 2)
            return [];
        return this.conjuros.filter((conjuro) => normalizarTexto(conjuro.Nombre, true).includes(buscado)).slice(0, 30);
    }

    elegirConjuro(nombre: string): void {
        const conjuro = this.conjuros.find((c) => c.Nombre === nombre);
        this.cambiar({ idConjuro: conjuro?.Id ?? null, nombreConjuro: nombre });
    }

    escribirConjuro(texto: string): void {
        const conjuro = this.conjuros.find((c) => normalizarTexto(c.Nombre) === normalizarTexto(texto));
        this.cambiar({ idConjuro: conjuro?.Id ?? null, nombreConjuro: texto });
    }

    onGuardar(): void {
        if (this.puedeGuardar)
            this.guardar.emit(this.borrador);
    }

    private actualizar(borrador: PiezaTienda): void {
        this.borrador = borrador;
        this.desglose = desglosePrecio(borrador);
        this.precio = precioEstimado(borrador);
        this.total = bonificadorTotal(borrador);
        this.motivo = motivoPiezaNoValida(borrador, this.politica);
        this.falta = Math.max(0, Math.round((this.precio - this.disponible) * 100) / 100);
    }
}
