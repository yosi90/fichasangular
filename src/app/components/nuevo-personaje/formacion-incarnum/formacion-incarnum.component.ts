import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { DatoFranja } from 'src/app/components/detalles/ficha';
import { unirConO } from 'src/app/components/detalles/ficha/incarnum';
import {
    Chakra,
    FormacionIncarnumDto,
    FormacionIncarnumFusionDto,
    Fusion,
    PersonajeIncarnum,
    PersonajeIncarnumReceptaculo,
} from 'src/app/interfaces/incarnum';
import {
    AlineamientoParaFusiones,
    FalloFormacion,
    capacidadesDeFormacion,
    chakrasAbiertos,
    esenciaInvertida,
    fusionesALaVez,
    fusionesMoldeables,
    validarFormacionIncarnum,
    vinculosALaVez,
} from 'src/app/services/utils/incarnum';

/** Una lista de fusiones que puede moldear: la de una de sus clases o las que eligió con una dote. */
interface ListaFusiones {
    clave: string;
    titulo: string;
    idClase: number | null;
    fusiones: Fusion[];
}

/** Una fusión de la lista, con dónde se puede moldear ahora y por qué no, si no se puede. */
interface FilaLista {
    fusion: Fusion;
    chakras: string;
    moldeada: boolean;
    opciones: { idChakra: number; nombre: string; }[];
    motivo: string;
}

/** Un chakra de la tabla de la derecha: la fusión moldeada en él, sus vínculos posibles y su esencia. */
interface FilaChakra {
    idChakra: number;
    nombre: string;
    fusion: Fusion | null;
    vinculos: { idChakra: number; texto: string; activo: boolean; motivo: string; cerrado: boolean; }[];
    nota: string;
    esencia: number;
    motivoMas: string;
    motivoMenos: string;
    conError: boolean;
}

/** Un receptáculo (dote, racial o aptitud de clase) con su esencia. */
interface FilaReceptaculo {
    receptaculo: PersonajeIncarnumReceptaculo;
    etiqueta: string;
    esencia: number;
    motivoMas: string;
    motivoMenos: string;
    conError: boolean;
}

const ETIQUETA_RECEPTACULO: Record<string, string> = { dote: 'Dote', racial: 'Racial', especial: 'Aptitud' };

/**
 * El paso «Formación» de la creación (Magic of Incarnum, decisión 4 de la fase 0, opción B; lienzo `Formacion.dc.html`):
 * opcional. Moldear fusiones de la lista de su clase (o de las elegidas con una dote) en chakras libres, vincularlas a
 * los chakras abiertos y repartir la esencia entre fusiones y receptáculos, con los límites del bloque `incarnum`. Cada
 * cambio se comprueba como lo hará la API (`validarFormacionIncarnum`, los mismos códigos); la API decide al guardar y,
 * si no la acepta, su error llega en `errorApi`. Emite la formación al continuar, o `saltar`.
 */
@Component({
    selector: 'app-formacion-incarnum',
    templateUrl: './formacion-incarnum.component.html',
    styleUrls: ['./formacion-incarnum.component.sass'],
    standalone: false
})
export class FormacionIncarnumComponent implements OnChanges {
    /** El bloque `incarnum` del personaje, calculado como la API, sin formación. */
    @Input() bloque: PersonajeIncarnum | null = null;
    @Input() fusiones: Fusion[] = [];
    /** El catálogo de chakras, para su orden y sus nombres. */
    @Input() chakras: Chakra[] = [];
    @Input() alineamiento: AlineamientoParaFusiones = { actitudes: [], descriptoresSinAlineamiento: [] };
    /** La formación que ya tenía (al volver tras un error de la API). */
    @Input() inicial: FormacionIncarnumDto | null = null;
    /** El error de la API al guardar la formación (sus códigos de `docs/publica/INCARNUM.md`). */
    @Input() errorApi: FalloFormacion | null = null;
    @Input() guardando = false;

    @Output() confirmar = new EventEmitter<FormacionIncarnumDto>();
    @Output() saltar = new EventEmitter<void>();
    @Output() fusionDetalles = new EventEmitter<number>();

    formacion: FormacionIncarnumDto = { fusiones: [], receptaculos: [] };
    listas: ListaFusiones[] = [];
    listaActiva = '';
    filasLista: FilaLista[] = [];
    filasChakras: FilaChakra[] = [];
    filasReceptaculos: FilaReceptaculo[] = [];
    franja: DatoFranja[] = [];
    fallo: FalloFormacion | null = null;
    /** La fusión o el receptáculo que señala el error de la API. */
    private claveConErrorApi = '';

    ngOnChanges(): void {
        if (this.inicial && this.formacion.fusiones.length < 1 && this.formacion.receptaculos.length < 1)
            this.formacion = { fusiones: [...this.inicial.fusiones], receptaculos: [...this.inicial.receptaculos] };
        this.listas = this.construirListas();
        if (!this.listas.some((lista) => lista.clave === this.listaActiva))
            this.listaActiva = this.listas[0]?.clave ?? '';
        this.claveConErrorApi = this.claveDelCampo(this.errorApi?.field ?? '');
        this.recalcular();
    }

    get listaActual(): ListaFusiones | null {
        return this.listas.find((lista) => lista.clave === this.listaActiva) ?? null;
    }

    get nota(): string {
        if (this.fallo)
            return this.fallo.mensaje;
        return 'Es la formación con la que empieza a jugar: cada mañana puede cambiarla, y la esencia de las fusiones se reasigna en cada asalto.';
    }

    elegirLista(clave: string): void {
        this.listaActiva = clave;
        this.recalcular();
    }

    moldear(fila: FilaLista, idChakra: number): void {
        const nueva = this.conFusion(fila.fusion, idChakra);
        if (nueva)
            this.aplicar(nueva);
    }

    quitar(idFusion: number): void {
        this.aplicar({ ...this.formacion, fusiones: this.formacion.fusiones.filter((f) => f.idFusion !== idFusion) });
    }

    vincular(idFusion: number, idChakraVinculo: number | null): void {
        this.aplicar({
            ...this.formacion,
            fusiones: this.formacion.fusiones.map((f) => f.idFusion === idFusion ? { ...f, idChakraVinculo } : f),
        });
    }

    cambiarEsenciaFusion(idFusion: number, delta: number): void {
        const nueva = this.conEsenciaFusion(idFusion, delta);
        if (nueva && !this.motivoEsencia(nueva, delta))
            this.aplicar(nueva);
    }

    cambiarEsenciaReceptaculo(r: PersonajeIncarnumReceptaculo, delta: number): void {
        const nueva = this.conEsenciaReceptaculo(r, delta);
        if (nueva && !this.motivoEsencia(nueva, delta))
            this.aplicar(nueva);
    }

    continuar(): void {
        if (this.fallo || this.guardando)
            return;
        this.confirmar.emit({
            fusiones: this.formacion.fusiones.map((f) => ({ ...f })),
            receptaculos: this.formacion.receptaculos.filter((r) => r.esencia > 0).map((r) => ({ ...r })),
        });
    }

    verFusion(id: number): void {
        if (id > 0)
            this.fusionDetalles.emit(id);
    }

    private aplicar(nueva: FormacionIncarnumDto): void {
        this.formacion = nueva;
        this.claveConErrorApi = '';
        this.recalcular();
    }

    /** La lista de cada clase con moldeado (las que su alineamiento deja, si la clase lo limita) y la de las dotes. */
    private construirListas(): ListaFusiones[] {
        const listas: ListaFusiones[] = (this.bloque?.clases ?? [])
            .filter((clase) => clase.fusionesMaximas > 0)
            .map((clase) => ({
                clave: `clase:${clase.id}`,
                titulo: `Lista de ${clase.nombre}`,
                idClase: clase.id,
                fusiones: fusionesMoldeables(clase.id, clase.limitadoPorAlineamiento, this.fusiones, this.alineamiento),
            }));
        const deDotes = (this.bloque?.fusionesDeDotes ?? [])
            .map((d) => this.fusiones.find((f) => f.Id === d.fusion.id))
            .filter((f): f is Fusion => !!f);
        if (deDotes.length > 0)
            listas.push({ clave: 'dotes', titulo: 'Elegidas con dotes', idClase: null, fusiones: deDotes });
        return listas;
    }

    private recalcular(): void {
        const bloque = this.bloque;
        this.fallo = validarFormacionIncarnum(this.formacion, bloque, this.fusiones, this.alineamiento, this.nombresChakras());
        const lista = this.listaActual;
        this.filasLista = (lista?.fusiones ?? []).map((fusion) => this.filaLista(fusion, lista!));
        this.filasChakras = this.construirFilasChakras();
        this.filasReceptaculos = (bloque?.receptaculos ?? []).map((r) => {
            const esencia = this.formacion.receptaculos.find((x) => x.tipo === r.tipo && x.id === r.id)?.esencia ?? 0;
            return {
                receptaculo: r,
                etiqueta: ETIQUETA_RECEPTACULO[r.tipo] ?? r.tipo,
                esencia,
                motivoMas: this.motivoEsencia(this.conEsenciaReceptaculo(r, 1), 1),
                motivoMenos: esencia > 0 ? '' : 'Ya está a 0.',
                conError: this.claveConErrorApi === `receptaculo:${r.tipo}:${r.id}` || this.esCampoDelFallo(r),
            };
        });
        this.franja = this.construirFranja();
    }

    private filaLista(fusion: Fusion, lista: ListaFusiones): FilaLista {
        const moldeada = this.formacion.fusiones.some((f) => f.idFusion === fusion.Id);
        const ocupados = new Set(this.formacion.fusiones.map((f) => f.idChakra));
        const opciones = fusion.Chakras.filter((c) => c.Ocupa && !ocupados.has(c.Id)).map((c) => ({ idChakra: c.Id, nombre: c.Nombre }));
        let motivo = '';
        if (!moldeada) {
            if (opciones.length < 1)
                motivo = 'Sus chakras ya tienen otra fusión.';
            else {
                const prueba = this.conFusion(fusion, opciones[0].idChakra, lista.idClase);
                const fallo = prueba ? this.falloNuevo(prueba) : null;
                motivo = fallo ? fallo.mensaje : '';
            }
        }
        return {
            fusion,
            chakras: unirConO(fusion.Chakras.filter((c) => c.Ocupa).map((c) => c.Nombre)),
            moldeada,
            opciones: motivo ? [] : opciones,
            motivo,
        };
    }

    private construirFilasChakras(): FilaChakra[] {
        const enListas = new Set(this.listas.flatMap((l) => l.fusiones).flatMap((f) => f.Chakras.filter((c) => c.Ocupa).map((c) => c.Id)));
        this.formacion.fusiones.forEach((f) => enListas.add(f.idChakra));
        const orden = this.chakras.length > 0
            ? this.chakras.filter((c) => enListas.has(c.Id)).map((c) => ({ id: c.Id, nombre: c.Nombre }))
            : Array.from(enListas).map((id) => ({ id, nombre: this.nombresChakras().get(id) ?? `#${id}` }));
        return orden.map((chakra) => {
            const f = this.formacion.fusiones.find((x) => x.idChakra === chakra.id) ?? null;
            const fusion = f ? this.fusiones.find((x) => x.Id === f.idFusion) ?? null : null;
            const opciones = f && fusion ? fusion.Chakras
                .filter((c) => c.Vinculo && (c.Id === f.idChakra || !c.Ocupa))
                .map((c) => {
                    const activo = f.idChakraVinculo === c.Id;
                    const prueba = { ...this.formacion, fusiones: this.formacion.fusiones.map((x) => x.idFusion === f.idFusion ? { ...x, idChakraVinculo: c.Id } : x) };
                    const fallo = activo ? null : this.falloNuevo(prueba);
                    return {
                        idChakra: c.Id,
                        texto: c.Id === f.idChakra ? (activo ? 'Vinculada' : 'Vincular') : (activo ? `Vinculada a ${c.Nombre}` : `Vincular a ${c.Nombre}`),
                        activo,
                        motivo: fallo?.mensaje ?? '',
                        cerrado: fallo?.code === 'chakra_cerrado',
                    };
                }) : [];
            // Los chakras aún cerrados no se ofrecen: la nota lo dice.
            const vinculos = opciones.filter((v) => v.activo || !v.cerrado);
            const nota = !f ? '' : opciones.length < 1 ? 'sin vínculo' : vinculos.length < 1 ? 'chakra aún cerrado' : '';
            const esencia = f?.esencia ?? 0;
            return {
                idChakra: chakra.id,
                nombre: chakra.nombre,
                fusion,
                vinculos,
                nota,
                esencia,
                motivoMas: f ? this.motivoEsencia(this.conEsenciaFusion(f.idFusion, 1), 1) : '',
                motivoMenos: esencia > 0 ? '' : 'Ya está a 0.',
                conError: !!f && (this.claveConErrorApi === `fusion:${this.formacion.fusiones.indexOf(f)}` || this.esCampoDelFallo(f)),
            };
        });
    }

    private construirFranja(): DatoFranja[] {
        const bloque = this.bloque;
        if (!bloque)
            return [];
        const maximo = fusionesALaVez(bloque);
        const vinculos = vinculosALaVez(bloque);
        const idsAbiertos = new Set(chakrasAbiertos(bloque).map((chakra) => chakra.id));
        const abiertos = this.chakras.filter((c) => idsAbiertos.has(c.Id)).map((c) => c.Nombre.toLowerCase());
        const capacidades = bloque.clases.map((c) => `${c.capacidadFusiones} en fusiones de ${c.nombre}`);
        const receptaculoDote = bloque.receptaculos.find((r) => r.tipo === 'dote');
        return [
            { etiqueta: 'Fusiones moldeadas', valor: this.formacion.fusiones.length, detalle: `de ${maximo}` },
            {
                etiqueta: 'Vínculos',
                valor: this.formacion.fusiones.filter((f) => !!f.idChakraVinculo).length,
                detalle: [`de ${vinculos}`, unirConO(abiertos)].filter(Boolean).join(' · '),
            },
            { etiqueta: 'Esencia repartida', valor: esenciaInvertida(this.formacion), detalle: `de ${bloque.reserva.total}` },
            {
                etiqueta: 'Capacidad',
                valor: bloque.capacidad.basica,
                detalle: [...capacidades, receptaculoDote ? `${receptaculoDote.capacidad} en dotes` : ''].filter(Boolean).join(' · '),
            },
        ];
    }

    /** La formación con la fusión moldeada en ese chakra (de la lista activa), o `null` si ya estaba. */
    private conFusion(fusion: Fusion, idChakra: number, idClase: number | null = this.listaActual?.idClase ?? null): FormacionIncarnumDto | null {
        if (this.formacion.fusiones.some((f) => f.idFusion === fusion.Id))
            return null;
        const nueva: FormacionIncarnumFusionDto = { idFusion: fusion.Id, idClase, idChakra, idChakraVinculo: null, esencia: 0 };
        return { ...this.formacion, fusiones: [...this.formacion.fusiones, nueva] };
    }

    private conEsenciaFusion(idFusion: number, delta: number): FormacionIncarnumDto | null {
        const f = this.formacion.fusiones.find((x) => x.idFusion === idFusion);
        if (!f || f.esencia + delta < 0)
            return null;
        return { ...this.formacion, fusiones: this.formacion.fusiones.map((x) => x === f ? { ...x, esencia: x.esencia + delta } : x) };
    }

    private conEsenciaReceptaculo(r: PersonajeIncarnumReceptaculo, delta: number): FormacionIncarnumDto | null {
        const actual = this.formacion.receptaculos.find((x) => x.tipo === r.tipo && x.id === r.id);
        const esencia = (actual?.esencia ?? 0) + delta;
        if (esencia < 0)
            return null;
        const receptaculos = actual
            ? this.formacion.receptaculos.map((x) => x === actual ? { ...x, esencia } : x)
            : [...this.formacion.receptaculos, { tipo: r.tipo, id: r.id, esencia }];
        return { ...this.formacion, receptaculos };
    }

    /** Por qué no se puede subir la esencia (pasa de la capacidad o de la reserva), o vacío si se puede. */
    private motivoEsencia(nueva: FormacionIncarnumDto | null, delta: number): string {
        if (!nueva)
            return delta < 0 ? 'Ya está a 0.' : '';
        if (delta < 0)
            return '';
        const fallo = validarFormacionIncarnum(nueva, this.bloque, this.fusiones, this.alineamiento, this.nombresChakras());
        return fallo && (fallo.code === 'capacidad_superada' || fallo.code === 'esencia_insuficiente') ? fallo.mensaje : '';
    }

    /** El fallo que añadiría un cambio (si ya había uno igual, no cuenta: no es culpa del cambio). */
    private falloNuevo(nueva: FormacionIncarnumDto): FalloFormacion | null {
        const fallo = validarFormacionIncarnum(nueva, this.bloque, this.fusiones, this.alineamiento, this.nombresChakras());
        if (!fallo || (this.fallo && fallo.code === this.fallo.code && fallo.field === this.fallo.field))
            return null;
        return fallo;
    }

    private nombresChakras(): Map<number, string> {
        return new Map(this.chakras.map((c) => [c.Id, c.Nombre]));
    }

    /** La fila que señala un `field` de la API: «incarnum.fusiones[2]…» o «incarnum.receptaculos[0]…». */
    private claveDelCampo(campo: string): string {
        const fusion = /^incarnum\.fusiones\[(\d+)\]/.exec(campo);
        if (fusion)
            return `fusion:${fusion[1]}`;
        const receptaculo = /^incarnum\.receptaculos\[(\d+)\]/.exec(campo);
        if (receptaculo) {
            const r = this.formacion.receptaculos[Number(receptaculo[1])];
            return r ? `receptaculo:${r.tipo}:${r.id}` : '';
        }
        return '';
    }

    /** Si el fallo de la comprobación de la web señala esta fusión o este receptáculo. */
    private esCampoDelFallo(item: FormacionIncarnumFusionDto | PersonajeIncarnumReceptaculo): boolean {
        const campo = this.fallo?.field ?? '';
        if ('idFusion' in item) {
            const indice = this.formacion.fusiones.indexOf(item);
            return indice >= 0 && campo.startsWith(`incarnum.fusiones[${indice}]`);
        }
        const indice = this.formacion.receptaculos.findIndex((r) => r.tipo === item.tipo && r.id === item.id);
        return indice >= 0 && campo.startsWith(`incarnum.receptaculos[${indice}]`);
    }

    /** Lo que admite cada fusión de la formación (su capacidad con las dotes de una sola fusión), para el tooltip. */
    capacidadDe(idFusion: number): number | null {
        if (!this.bloque)
            return null;
        const indice = this.formacion.fusiones.findIndex((f) => f.idFusion === idFusion);
        if (indice < 0)
            return null;
        const { bases, extra } = capacidadesDeFormacion(this.bloque, this.formacion.fusiones);
        return bases[indice] + (extra?.[indice] ?? 0);
    }
}
