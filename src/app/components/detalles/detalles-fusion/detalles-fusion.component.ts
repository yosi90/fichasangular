import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription, forkJoin, of, take } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
    DatoFicha,
    EtiquetaFicha,
    chakrasConVinculo,
    chakrasDondeSeMoldea,
    esTextoCorto,
    etiquetaTraducido,
    nombreOriginalVisible,
    textoSalvacionFusion,
    unirLista,
    unirTipo,
} from 'src/app/components/detalles/ficha';
import { ChakraDetalle, Fusion } from 'src/app/interfaces/incarnum';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

/** Un chakra de la fusión en su lateral: qué se hace en él, su categoría y las clases que lo abren. */
interface ChakraFusionVisible {
    id: number;
    nombre: string;
    uso: string;
    nota: string;
}

/** El efecto de vincularla a un chakra, como sección del cuerpo («Vínculo de Corona»). */
interface VinculoVisible {
    titulo: string;
    texto: string | null;
}

/**
 * El detalle de una fusión del alma (Magic of Incarnum; lienzo aprobado el 2026-10-27) con la ficha común: dónde se
 * moldea, sus vínculos, la salvación, los descriptores y las clases; su efecto básico, el de la esencia y el de cada
 * vínculo; y, a la derecha, sus chakras (con la ranura que cierran y las clases que los abren) y las clases que la
 * moldean. Los datos de juego (`Datos_*`) son internos y no se enseñan.
 */
@Component({
    selector: 'app-detalles-fusion',
    templateUrl: './detalles-fusion.component.html',
    standalone: false
})
export class DetallesFusionComponent implements OnInit, OnDestroy {
    private fusionActual!: Fusion;
    private chakrasCatalogo: ChakraDetalle[] = [];
    private suscripcion?: Subscription;
    private iniciado = false;

    tipoCabecera = '';
    etiquetas: EtiquetaFicha[] = [];
    descripcionEnCabecera = false;
    datos: DatoFicha[] = [];
    vinculos: VinculoVisible[] = [];
    chakras: ChakraFusionVisible[] = [];
    notaOrigen = '';

    @Input()
    set fusion(valor: Fusion) {
        this.fusionActual = valor;
        this.recalcular();
        if (this.iniciado)
            this.cargarChakras();
    }
    get fusion(): Fusion {
        return this.fusionActual;
    }

    @Output() claseDetallesId = new EventEmitter<number>();
    @Output() chakraDetallesId = new EventEmitter<number>();

    constructor(
        private manualDetalleNavSvc: ManualDetalleNavigationService,
        private incarnumSvc: IncarnumService,
    ) { }

    ngOnInit(): void {
        this.iniciado = true;
        this.cargarChakras();
    }

    /** El detalle de cada chakra de la fusión da la ranura que cierra el vínculo, su categoría y las clases que lo abren. */
    private cargarChakras(): void {
        this.suscripcion?.unsubscribe();
        const ids = (this.fusionActual?.Chakras ?? []).map((chakra) => chakra.Id);
        if (ids.length < 1)
            return;
        this.suscripcion = forkJoin(ids.map((id) => this.incarnumSvc.getChakra(id).pipe(take(1), catchError(() => of(null)))))
            .subscribe((chakras) => {
                this.chakrasCatalogo = chakras.filter((chakra): chakra is ChakraDetalle => !!chakra);
                this.recalcular();
            });
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
    }

    abrirDetalleManual(): void {
        this.manualDetalleNavSvc.abrirDetalleManual({ id: this.fusion?.Manual?.Id, nombre: this.fusion?.Manual?.Nombre });
    }

    abrirDetallesClase(id: number): void {
        if (Number(id) > 0)
            this.claseDetallesId.emit(Number(id));
    }

    abrirDetallesChakra(id: number): void {
        if (Number(id) > 0)
            this.chakraDetallesId.emit(Number(id));
    }

    private recalcular(): void {
        const fusion = this.fusionActual;
        if (!fusion)
            return;
        this.tipoCabecera = unirTipo(['Fusión del alma', ...fusion.Clases.map((clase) => clase.Nombre)]);
        this.etiquetas = [
            etiquetaTraducido(fusion),
            ...fusion.Descriptores.map((descriptor) => ({ texto: descriptor.Nombre })),
        ].filter((etiqueta): etiqueta is EtiquetaFicha => etiqueta !== null);
        this.descripcionEnCabecera = esTextoCorto(fusion.Descripcion);
        const ranuras = chakrasConVinculo(fusion)
            .map((chakra) => this.chakrasCatalogo.find((c) => c.Id === chakra.Id)?.Ranura?.Nombre)
            .filter((ranura): ranura is string => tieneTextoVisible(ranura));
        this.datos = [
            { etiqueta: 'Se moldea en', valor: unirLista(chakrasDondeSeMoldea(fusion).map((chakra) => chakra.Nombre), 'o') },
            { etiqueta: 'Vínculos', valor: chakrasConVinculo(fusion).map((chakra) => chakra.Nombre).join(', ') },
            { etiqueta: 'Salvación', valor: textoSalvacionFusion(fusion) },
            { etiqueta: 'Descriptores', valor: fusion.Descriptores.map((descriptor) => descriptor.Nombre).join(', ') },
            {
                etiqueta: 'Clases',
                valor: fusion.Clases.map((clase) => clase.Nombre).join(', '),
                enlaces: fusion.Clases.map((clase) => ({ texto: clase.Nombre, alPulsar: () => this.abrirDetallesClase(clase.Id) })),
            },
            {
                etiqueta: 'Alineamiento',
                valor: fusion.Alineado_portador ? 'El de quien la moldea' : null,
                ayuda: 'Toma el alineamiento de quien la moldea: el alineamiento no la limita.',
            },
            { etiqueta: 'Ranura que cierra al vincular', valor: Array.from(new Set(ranuras)).join(', ') },
            { etiqueta: 'Nombre original', valor: nombreOriginalVisible(fusion) },
        ];
        this.vinculos = chakrasConVinculo(fusion)
            .filter((chakra) => tieneTextoVisible(chakra.Efecto_vinculo))
            .map((chakra) => ({ titulo: `Vínculo de ${chakra.Nombre}`, texto: chakra.Efecto_vinculo }));
        this.chakras = fusion.Chakras.map((chakra) => {
            const catalogo = this.chakrasCatalogo.find((c) => c.Id === chakra.Id);
            const clases = [...(catalogo?.Clases ?? [])].sort((a, b) => a.Nivel - b.Nivel)
                .map((clase) => `${clase.Nombre} a nivel ${clase.Nivel}`);
            return {
                id: chakra.Id,
                nombre: chakra.Nombre,
                uso: [chakra.Ocupa ? 'se moldea' : '', chakra.Vinculo ? 'vincula' : ''].filter(Boolean).join(' · '),
                nota: [catalogo?.Categoria?.Nombre ? `Chakra ${catalogo.Categoria.Nombre.toLowerCase()}` : '',
                    clases.length > 0 ? `lo abren ${clases.join(', ')}` : ''].filter(Boolean).join(': '),
            };
        });
        this.notaOrigen = fusion.Origen_descripcion === 'propia'
            ? 'Descripción propia (resumen de las reglas); el texto completo está en el manual, en la página indicada.'
            : '';
    }
}
