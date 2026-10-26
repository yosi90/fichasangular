import { CampaignCreationPolicy } from 'src/app/interfaces/campaign-management';
import { ArmaDetalle } from 'src/app/interfaces/arma';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import {
    AplicacionMaterial,
    EncantamientoDetalle,
    EquipoCatalogos,
    GenericoConjuro,
    MaterialCoste,
    MaterialDetalle,
    MunicionDetalle,
    ObjetoDetalle,
    PiezaMaterial,
} from 'src/app/interfaces/equipo';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCompraPiezaDto, PersonajeCompraRequestDto, PersonajeTipoPiezaDto } from 'src/app/interfaces/personajes-api';
import { formatoNumero, textoConSigno, textoDestrezaMaxima, textoPeso, textoPrecio } from 'src/app/services/utils/equipo-texto';
import { normalizarTexto, toNumberOrNull } from 'src/app/services/utils/normalizacion';

/*
 * La tienda del final de la creación (decisión del propietario del 2026-10-25; `docs/publica/OBJETOS_FRONT.md`, «Las
 * compras»): el dinero inicial que le toca, el precio estimado de cada pieza y la compra para `PUT
 * /personajes/{id}/equipo`. La API es la que manda: calcula el precio de verdad y comprueba el dinero y la política de la
 * campaña; aquí se estima con sus mismas reglas (`docs/publica/endpoints/personajes.md`) para enseñar lo que lleva
 * gastado mientras compra. Desde el 2026-10-26 (lienzo de la creación), con material y aptitudes especiales, que salen
 * de los datos: los materiales con coste para la pieza (`Aplicaciones_material`) y las aptitudes que se le aplican.
 */

/** Lo que se puede comprar: un arma, una armadura o escudo, una munición o un objeto del catálogo. */
export interface ArticuloTienda {
    tipo: PersonajeTipoPiezaDto;
    id: number;
    nombre: string;
    /** El precio del catálogo en po (en la munición, el de un lote); `null` si no se puede comprar. */
    precio: number | null;
    peso: number | null;
    /** Las piezas de un lote de munición (20 flechas); 1 en lo demás. */
    lote: number;
    /** Pociones, pergaminos, varitas…: su fórmula; el conjuro se elige al comprar. */
    generico: GenericoConjuro | null;
    oficial: boolean;
    /** Para agrupar y buscar: «Marcial», «Intermedia», «Poción»… */
    categoria: string;
    /** Si se lleva puesto al comprarlo: armas, armaduras y las armas y armaduras mágicas específicas (objetos 30 y 31). */
    sePone: boolean;
    /** Las dos cifras que enseña su fila del catálogo (daño y crítico, CA y Destreza máxima, base y mejora…). */
    cifras: [string, string];
    /** A qué pieza se le aplican material y aptitudes; `null` en los objetos (no llevan). */
    pieza: PiezaMaterial | null;
    /** El id de su manejo (ligera, a una mano, a dos manos) o de su peso de armadura, para el coste del material. */
    manejo: number | null;
    pesoArmadura: number | null;
    aDistancia: boolean;
    arrojadiza: boolean;
    /** El id de su tipo de daño, para las aptitudes que piden uno (afilada). */
    tipoDano: number | null;
    /** Un objeto mágico o psiónico del catálogo (la campaña puede no dejarlo comprar). */
    magico: boolean;
}

/** Una pieza de la compra, con lo que la persona elige. */
export interface PiezaTienda {
    articulo: ArticuloTienda;
    cantidad: number;
    equipado: boolean;
    granCalidad: boolean;
    bonificadorMejora: number;
    /** Material especial y el coste que le toca por la pieza (el de su aplicación más concreta). */
    material: MaterialDetalle | null;
    costeMaterial: MaterialCoste | null;
    aptitudes: EncantamientoDetalle[];
    idConjuro: number | null;
    nombreConjuro: string;
    nivelConjuro: number | null;
    nivelLanzador: number | null;
}

/** Cómo se decide el dinero inicial de este personaje. */
export interface ReglaDineroInicial {
    /** `dados`: nivel 1, el oro de su clase (se tira o se pone a mano); `riqueza`: nivel 2 o más; `libre`: sin tope. */
    modo: 'dados' | 'riqueza' | 'libre';
    /** «6d4» en `dados`. */
    dados: string | null;
    /** Lo que multiplica la tirada: ×10 po (y ×2 con la ventaja que duplica el oro). */
    multiplicador: number;
    /** El máximo que admite la API; `null` sin tope. */
    maximo: number | null;
    /** El dinero con el que empieza la tienda: la riqueza de su nivel o, con dados, 0 hasta tirarlos. */
    sugerido: number;
    descripcion: string;
}

export interface ContextoDineroInicial {
    /** El NEP de la ficha (`nivelEfectivo`): niveles de clase + DG raciales + ajustes de nivel. Lo calcula la API. */
    nivelEfectivo: number;
    /** Sus clases, con id o con nombre (el borrador de la creación puede no tener el id). */
    clases: { Id?: number; Nombre: string; }[];
    duplicaOro: boolean;
    aumentaOro: boolean;
}

/** Lo que la campaña deja comprar (`politicaCreacion`, 2026-10-26); sin campaña, todo. */
export interface PoliticaTienda {
    objetosMagicos: boolean;
    aMedida: boolean;
    /** Lo que puede costar una pieza (una unidad), en po; `null` sin tope. */
    precioMaximo: number | null;
}

export const POLITICA_TIENDA_LIBRE: PoliticaTienda = { objetosMagicos: true, aMedida: true, precioMaximo: null };

const GRAN_CALIDAD: Readonly<Record<Exclude<PersonajeTipoPiezaDto, 'objeto'>, number>> = { arma: 300, armadura: 150, municion: 6 };
const MAGIA_POR_PUNTO: Readonly<Record<Exclude<PersonajeTipoPiezaDto, 'objeto'>, number>> = { arma: 2000, armadura: 1000, municion: 2000 };
const MUNICION_POR_LOTE_MAGICO = 50;
/** Guía del DM: la mejora llega como mucho a +5 y, con el equivalente de las aptitudes, el total a +10. */
export const MEJORA_MAXIMA = 5;
export const BONIFICADOR_TOTAL_MAXIMO = 10;

const SIN_CIFRAS: [string, string] = ['', ''];

function articuloBase(tipo: PersonajeTipoPiezaDto, id: number, nombre: string): Omit<ArticuloTienda, 'precio' | 'peso' | 'oficial' | 'categoria' | 'sePone'> {
    return {
        tipo, id, nombre, lote: 1, generico: null, cifras: SIN_CIFRAS, pieza: null, manejo: null, pesoArmadura: null,
        aDistancia: false, arrojadiza: false, tipoDano: null, magico: false,
    };
}

export function articuloDeArma(arma: ArmaDetalle): ArticuloTienda {
    return {
        ...articuloBase('arma', arma.Id, arma.Nombre),
        precio: arma.Precio, peso: arma.Peso, oficial: arma.Oficial, categoria: arma.Tipo_arma?.Nombre ?? '', sePone: true,
        cifras: [arma.Dano ?? '—', arma.Critico ?? '—'],
        pieza: 'arma', manejo: arma.Manejo?.Id ?? null, aDistancia: !!arma.A_distancia, arrojadiza: !!arma.Arrojadiza,
        tipoDano: arma.Tipo_dano?.Id ?? null,
    };
}

export function articuloDeArmadura(armadura: ArmaduraDetalle): ArticuloTienda {
    return {
        ...articuloBase('armadura', armadura.Id, armadura.Nombre),
        precio: armadura.Precio, peso: armadura.Peso, oficial: armadura.Oficial,
        categoria: armadura.Es_escudo ? 'Escudo' : (armadura.Peso_armadura?.Nombre ?? ''), sePone: true,
        cifras: [textoConSigno(armadura.Ca), textoDestrezaMaxima(armadura.Bon_des)],
        pieza: armadura.Es_escudo ? 'escudo' : 'armadura', pesoArmadura: armadura.Peso_armadura?.Id ?? null,
    };
}

export function articuloDeMunicion(municion: MunicionDetalle): ArticuloTienda {
    const lote = Math.max(1, municion.Cantidad_por_precio);
    return {
        ...articuloBase('municion', municion.Id, municion.Nombre),
        precio: municion.Precio, peso: municion.Peso, lote, oficial: municion.Oficial, categoria: 'Munición', sePone: false,
        cifras: [(municion.Armas ?? []).map((arma) => arma.Nombre).join(', '), `${lote}`],
        pieza: 'municion',
    };
}

export function articuloDeObjeto(objeto: ObjetoDetalle): ArticuloTienda {
    const base = objeto.Arma_base ?? objeto.Armadura_base;
    return {
        ...articuloBase('objeto', objeto.Id, objeto.Nombre),
        precio: objeto.Precio, peso: objeto.Peso, generico: objeto.Generico_conjuro, oficial: objeto.Oficial,
        categoria: objeto.Tipo?.Nombre ?? '', sePone: objeto.Arma_base !== null || objeto.Armadura_base !== null,
        cifras: base
            ? [base.Nombre, objeto.Bonificador_mejora ? textoConSigno(objeto.Bonificador_mejora) : '—']
            : [objeto.Tipo?.Nombre ?? '', objeto.Ranura?.Nombre ?? '—'],
        magico: !!objeto.Tipo && objeto.Tipo.Categoria !== 'mundano',
    };
}

/** Si se puede comprar: con precio o con su fórmula (un genérico de un conjuro). Las filas comodín o sin id, no. */
export function sePuedeComprar(articulo: ArticuloTienda): boolean {
    return articulo.id > 0 && (articulo.generico !== null || (articulo.precio !== null && articulo.precio >= 0));
}

/** Si se le pueden poner mejora, aptitudes y material (armas, armaduras, escudos y munición). */
export function seConfiguraAMedida(articulo: ArticuloTienda): boolean {
    return articulo.pieza !== null;
}

/** Una pieza nueva con lo de partida: la munición, un lote entero; lo demás, una unidad; puesta si se lleva encima. */
export function nuevaPieza(articulo: ArticuloTienda): PiezaTienda {
    return {
        articulo,
        cantidad: articulo.tipo === 'municion' ? articulo.lote : 1,
        equipado: articulo.sePone,
        granCalidad: false,
        bonificadorMejora: 0,
        material: null,
        costeMaterial: null,
        aptitudes: [],
        idConjuro: null,
        nombreConjuro: '',
        nivelConjuro: articulo.generico ? 1 : null,
        nivelLanzador: articulo.generico ? 1 : null,
    };
}

/** Si a la pieza le falta algo para poder comprarla (el conjuro de un genérico), qué. */
export function faltaEnPieza(pieza: PiezaTienda): string | null {
    const generico = pieza.articulo.generico;
    if (!generico)
        return null;
    if (!pieza.idConjuro)
        return 'Elige el conjuro';
    if (pieza.nivelConjuro === null || pieza.nivelConjuro < 0)
        return 'Pon el nivel del conjuro';
    if (generico.Nivel_maximo !== null && pieza.nivelConjuro > generico.Nivel_maximo)
        return `Admite conjuros hasta el nivel ${generico.Nivel_maximo}`;
    if (pieza.nivelLanzador === null || pieza.nivelLanzador < 1)
        return 'Pon el nivel de lanzador';
    return null;
}

// Material y aptitudes ------------------------------------------------------------------------------------------------

/**
 * Las aplicaciones de material que valen para la pieza (`Aplicaciones_material` de `GET /equipo/catalogos`), de la más
 * concreta (la de su manejo o su peso) a la más general («Cualquier objeto»), como las ordena la API.
 */
export function aplicacionesDeArticulo(articulo: ArticuloTienda, aplicaciones: AplicacionMaterial[]): number[] {
    const pieza = articulo.pieza;
    if (!pieza)
        return [];
    return aplicaciones
        .filter((aplicacion) => aplicacion.Piezas.includes(pieza)
            && (aplicacion.Manejo === null || aplicacion.Manejo.Id === articulo.manejo)
            && (aplicacion.Peso_armadura === null || aplicacion.Peso_armadura.Id === articulo.pesoArmadura))
        .map((aplicacion) => ({
            id: aplicacion.Id,
            orden: [aplicacion.Manejo || aplicacion.Peso_armadura ? 0 : 1, aplicacion.Piezas.length, aplicacion.Id],
        }))
        .sort((a, b) => a.orden[0] - b.orden[0] || a.orden[1] - b.orden[1] || a.orden[2] - b.orden[2])
        .map((aplicacion) => aplicacion.id);
}

/** El coste del material para la pieza: el de la primera de sus aplicaciones que lo tenga, o `null` si no se aplica. */
export function costeMaterialPara(material: MaterialDetalle, aplicacionesOrdenadas: number[]): MaterialCoste | null {
    for (const id of aplicacionesOrdenadas) {
        const coste = (material.Costes ?? []).find((c) => c.Aplicacion?.Id === id);
        if (coste)
            return coste;
    }
    return null;
}

export interface MaterialAplicable {
    material: MaterialDetalle;
    coste: MaterialCoste;
}

/** Los materiales que se le pueden poner a la pieza (los que tienen coste para alguna de sus aplicaciones). */
export function materialesAplicables(articulo: ArticuloTienda, materiales: MaterialDetalle[], aplicaciones: AplicacionMaterial[]): MaterialAplicable[] {
    const orden = aplicacionesDeArticulo(articulo, aplicaciones);
    if (orden.length < 1)
        return [];
    return materiales
        .filter((material) => material.Id > 0)
        .map((material) => ({ material, coste: costeMaterialPara(material, orden) }))
        .filter((item): item is MaterialAplicable => item.coste !== null);
}

/** Si una aptitud especial se le puede poner a la pieza (`Aplica_a` y, en las armas, el tipo de daño que pide). */
export function aptitudSeAplica(aptitud: EncantamientoDetalle, articulo: ArticuloTienda): boolean {
    const aplica = aptitud.Aplica_a;
    switch (articulo.pieza) {
        case 'municion':
            return aplica.Municion;
        case 'armadura':
            return aplica.Armadura;
        case 'escudo':
            return aplica.Escudo;
        case 'arma': {
            const pide = aptitud.Tipos_dano_requeridos ?? [];
            if (pide.length > 0 && !pide.some((tipo) => tipo.Id === articulo.tipoDano))
                return false;
            if (articulo.aDistancia)
                return aplica.Arma_a_distancia;
            return aplica.Arma_cuerpo_a_cuerpo || (articulo.arrojadiza && aplica.Arma_a_distancia);
        }
        default:
            return false;
    }
}

export function aptitudesAplicables(articulo: ArticuloTienda, aptitudes: EncantamientoDetalle[]): EncantamientoDetalle[] {
    return aptitudes.filter((aptitud) => aptitud.Id > 0 && aptitudSeAplica(aptitud, articulo));
}

/** La mejora más el equivalente de sus aptitudes. */
export function bonificadorTotal(pieza: PiezaTienda): number {
    return Math.max(0, Math.trunc(pieza.bonificadorMejora || 0)) + pieza.aptitudes.reduce((total, aptitud) => total + Math.max(0, aptitud.Modificador || 0), 0);
}

/** Si es mágica: con mejora o con alguna aptitud. Lo mágico es de gran calidad. */
function esMagica(pieza: PiezaTienda): boolean {
    return pieza.bonificadorMejora > 0 || pieza.aptitudes.length > 0;
}

/** Si la pieza va a medida: mejora, aptitudes o material especial (la campaña puede no dejarlo). */
export function esAMedida(pieza: PiezaTienda): boolean {
    return pieza.bonificadorMejora > 0 || pieza.aptitudes.length > 0 || pieza.material !== null;
}

// El precio --------------------------------------------------------------------------------------------------------

export interface LineaPrecio {
    etiqueta: string;
    /** En po, ya por todas sus unidades. */
    po: number;
}

/**
 * El precio de una pieza desglosado (todas sus unidades), en po, con las reglas de la API: el del catálogo (la munición,
 * por pieza) por el multiplicador del material, el coste del material (fijo y por libra), la gran calidad (300 po en
 * armas, 150 en armaduras, 6 por pieza de munición; incluida en lo mágico y en el material que cuenta como de gran
 * calidad), la magia (2.000 po × bonificador² en armas, 1.000 en armaduras y entre 50 en munición; el bonificador suma el
 * equivalente de las aptitudes), los precios fijos de las aptitudes y el coste de encantar del material; los genéricos,
 * precio por nivel × nivel del conjuro (el 0 cuenta ½) × nivel de lanzador. Sin el componente caro de los conjuros.
 */
export function desglosePrecio(pieza: PiezaTienda): LineaPrecio[] {
    const articulo = pieza.articulo;
    const cantidad = Math.max(1, Math.trunc(pieza.cantidad || 1));
    if (articulo.tipo === 'objeto') {
        if (articulo.generico) {
            const nivel = pieza.nivelConjuro === 0 ? 0.5 : Math.max(0, pieza.nivelConjuro ?? 0);
            return [{ etiqueta: `${articulo.nombre} (conjuro de nivel ${pieza.nivelConjuro ?? 0}, NL ${pieza.nivelLanzador ?? 0})`,
                po: redondear(articulo.generico.Precio_por_nivel * nivel * Math.max(0, pieza.nivelLanzador ?? 0) * cantidad) }];
        }
        return [{ etiqueta: articulo.nombre, po: redondear((articulo.precio ?? 0) * cantidad) }];
    }
    const tipo = articulo.tipo;
    const porLote = tipo === 'municion' ? Math.max(1, articulo.lote) : 1;
    const coste = pieza.material ? pieza.costeMaterial : null;
    const multiplicador = coste?.Multiplicador_precio ?? 1;
    const pesoUnidad = (articulo.peso ?? 0) / porLote;
    const lineas: LineaPrecio[] = [];
    const sumar = (etiqueta: string, porUnidad: number) => {
        if (porUnidad !== 0)
            lineas.push({ etiqueta, po: redondear(porUnidad * cantidad) });
    };
    sumar(`${articulo.nombre}${multiplicador !== 1 ? ` (×${formatoNumero(multiplicador)})` : ''}`, ((articulo.precio ?? 0) / porLote) * multiplicador);
    if (pieza.material && coste)
        sumar(pieza.material.Nombre, (coste.Coste ?? 0) + (coste.Coste_por_libra ?? 0) * pesoUnidad);
    const magica = esMagica(pieza);
    if ((pieza.granCalidad || magica) && !(pieza.material?.Cuenta_como_gran_calidad && coste))
        sumar('Gran calidad', GRAN_CALIDAD[tipo]);
    const entreLote = tipo === 'municion' ? MUNICION_POR_LOTE_MAGICO : 1;
    const total = bonificadorTotal(pieza);
    if (total > 0) {
        const partes = [textoConSigno(pieza.bonificadorMejora), ...pieza.aptitudes.filter((a) => a.Modificador > 0)
            .map((a) => `${a.Nombre.toLowerCase()} ${textoConSigno(a.Modificador)}`)];
        sumar(`Bonificador ${textoConSigno(total)} (${partes.join(', ')})`, (MAGIA_POR_PUNTO[tipo] * total * total) / entreLote);
    }
    if (magica && pieza.material && coste?.Coste_encantar)
        sumar(`Encantar ${pieza.material.Nombre.toLowerCase()}`, coste.Coste_encantar / entreLote);
    pieza.aptitudes.filter((a) => (a.Coste ?? 0) > 0).forEach((a) => sumar(a.Nombre, a.Coste / entreLote));
    return lineas;
}

/** El precio estimado de una pieza (todas sus unidades), en po (la suma de `desglosePrecio`). */
export function precioEstimado(pieza: PiezaTienda): number {
    return redondear(desglosePrecio(pieza).reduce((total, linea) => total + linea.po, 0));
}

/** Lo que cuesta una unidad (para el precio máximo por pieza de la campaña). */
export function precioPorUnidad(pieza: PiezaTienda): number {
    return redondear(precioEstimado(pieza) / Math.max(1, Math.trunc(pieza.cantidad || 1)));
}

/** El peso de una pieza (todas sus unidades), en libras; la munición pesa por lote. */
export function pesoEstimado(pieza: PiezaTienda): number {
    const peso = pieza.articulo.peso ?? 0;
    const porUnidad = pieza.articulo.tipo === 'municion' ? peso / Math.max(1, pieza.articulo.lote) : peso;
    return redondear(porUnidad * Math.max(1, Math.trunc(pieza.cantidad || 1)));
}

/** Por qué no vale la pieza tal como está configurada (reglas de la Guía del DM y política de la campaña), o `null`. */
export function motivoPiezaNoValida(pieza: PiezaTienda, politica: PoliticaTienda = POLITICA_TIENDA_LIBRE): string | null {
    if (pieza.articulo.tipo === 'objeto' && pieza.articulo.magico && !politica.objetosMagicos)
        return 'Esta campaña no permite comprar objetos mágicos.';
    if (pieza.articulo.tipo !== 'objeto') {
        if (esAMedida(pieza) && !politica.aMedida)
            return 'Esta campaña no permite objetos a medida.';
        if (pieza.aptitudes.length > 0 && pieza.bonificadorMejora < 1)
            return 'Para añadir aptitudes, la pieza necesita al menos un +1.';
        if (bonificadorTotal(pieza) > BONIFICADOR_TOTAL_MAXIMO)
            return `El bonificador total no puede pasar de ${textoConSigno(BONIFICADOR_TOTAL_MAXIMO)}.`;
    }
    if (politica.precioMaximo !== null && precioPorUnidad(pieza) > politica.precioMaximo)
        return `Esta campaña no deja comprar piezas de más de ${textoPrecio(politica.precioMaximo)}.`;
    return faltaEnPieza(pieza);
}

export interface ResumenCompra {
    gastado: number;
    queda: number;
    peso: number;
    /** Si el dinero inicial vale (dentro del tope) y llega para todo. */
    alcanza: boolean;
    dentroDelTope: boolean;
}

export function resumenCompra(dineroInicial: number, piezas: PiezaTienda[], regla: ReglaDineroInicial): ResumenCompra {
    const gastado = redondear(piezas.reduce((acc, pieza) => acc + precioEstimado(pieza), 0));
    const dinero = Math.max(0, dineroInicial || 0);
    return {
        gastado,
        queda: redondear(dinero - gastado),
        peso: redondear(piezas.reduce((acc, pieza) => acc + pesoEstimado(pieza), 0)),
        alcanza: gastado <= dinero,
        dentroDelTope: regla.maximo === null || dinero <= regla.maximo,
    };
}

/** La carga que lleva con ese peso, según su capacidad de carga: «carga ligera, hasta 76 lb»; vacío sin capacidad. */
export function textoCarga(peso: number, capacidad: Personaje['Capacidad_carga'] | null | undefined): string {
    const ligera = Number(capacidad?.Ligera) || 0;
    const media = Number(capacidad?.Media) || 0;
    const pesada = Number(capacidad?.Pesada) || 0;
    if (ligera <= 0)
        return '';
    if (peso <= ligera)
        return `carga ligera, hasta ${textoPeso(ligera)}`;
    if (peso <= media)
        return `carga media, hasta ${textoPeso(media)}`;
    if (peso <= pesada)
        return `carga pesada, hasta ${textoPeso(pesada)}`;
    return `pasa de su carga pesada (${textoPeso(pesada)})`;
}

/**
 * El precio máximo de una pieza de la política de la campaña (`precioMaximoPorObjeto`): po enteros, 0 o más; vacío,
 * negativo o algo que no es un número, sin tope (`null`). Lo usan el mapper de la API, el editor de la campaña y la tienda.
 */
export function normalizarPrecioMaximoPorPieza(value: unknown): number | null {
    const valor = toNumberOrNull(value);
    const entero = valor === null ? null : Math.trunc(valor);
    return entero !== null && entero >= 0 ? entero : null;
}

/** Lo que la tienda deja comprar según la política de la campaña (sin campaña, todo). */
export function politicaTienda(politica: Partial<CampaignCreationPolicy> | null | undefined): PoliticaTienda {
    if (!politica)
        return POLITICA_TIENDA_LIBRE;
    return {
        objetosMagicos: politica.permitirObjetosMagicos !== false,
        aMedida: politica.permitirObjetosAMedida !== false,
        precioMaximo: normalizarPrecioMaximoPorPieza(politica.precioMaximoPorObjeto),
    };
}

/** La nota del pie de la tienda: lo que la campaña no deja comprar (o vacío). */
export function notaPoliticaTienda(politica: PoliticaTienda): string {
    return [
        politica.objetosMagicos ? '' : 'Esta campaña no permite objetos mágicos.',
        politica.aMedida ? '' : 'Esta campaña no permite objetos a medida.',
        politica.precioMaximo === null ? '' : `Como mucho ${textoPrecio(politica.precioMaximo)} por pieza.`,
    ].filter(Boolean).join(' ');
}

// Las pestañas del catálogo ---------------------------------------------------------------------------------------

/** De dónde salen las filas de una pestaña: un catálogo de la web o una búsqueda de objetos en la API. */
export type OrigenPestanaTienda = 'arma' | 'armadura' | 'municion' | 'objeto' | 'especifica';

export interface ContextoPestanasTienda {
    politica: PoliticaTienda;
}

/**
 * Una pestaña del catálogo de la tienda. Son una lista con condición: cada una dice si sale para este personaje y su
 * campaña (por ejemplo, las específicas solo si la campaña deja comprar objetos mágicos). Una pestaña nueva («Conjuros
 * para el libro») se añade aquí con su condición.
 */
export interface PestanaTienda {
    id: OrigenPestanaTienda;
    nombre: string;
    /** Las cabeceras de las dos cifras de cada fila (`ArticuloTienda.cifras`). */
    columnas: [string, string];
    sale: (contexto: ContextoPestanasTienda) => boolean;
}

export const PESTANAS_TIENDA: readonly PestanaTienda[] = [
    { id: 'arma', nombre: 'Armas', columnas: ['Daño', 'Crítico'], sale: () => true },
    { id: 'armadura', nombre: 'Armaduras y escudos', columnas: ['CA', 'Des. máx.'], sale: () => true },
    { id: 'municion', nombre: 'Munición', columnas: ['Para', 'Lote'], sale: () => true },
    { id: 'objeto', nombre: 'Objetos', columnas: ['Tipo', 'Ranura'], sale: () => true },
    { id: 'especifica', nombre: 'Armas y armaduras específicas', columnas: ['Base', 'Mejora'], sale: (c) => c.politica.objetosMagicos },
];

export function pestanasTienda(contexto: ContextoPestanasTienda): PestanaTienda[] {
    return PESTANAS_TIENDA.filter((pestana) => pestana.sale(contexto));
}

// El dinero inicial --------------------------------------------------------------------------------------------------

/**
 * Cómo se decide el dinero inicial (`dineroInicial` de la compra), por el NEP y con las reglas de la API: con NEP 1, el
 * oro inicial de su clase (los dados de la tabla 7-1 del Manual del jugador, el doble con la ventaja que duplica el oro);
 * con NEP 2 o más, la fila de su NEP en `Riqueza_por_nivel` (la única tabla: la web no lleva otra). Sin oro de clase, sin
 * fila para su NEP (por encima de 20) o con la ventaja que aumenta el oro, no hay tope.
 */
export function reglaDineroInicial(contexto: ContextoDineroInicial, catalogos: Pick<EquipoCatalogos, 'Oro_inicial_por_clase' | 'Riqueza_por_nivel'>): ReglaDineroInicial {
    const nep = Math.max(1, Math.trunc(contexto.nivelEfectivo || 1));
    const libre = (descripcion: string): ReglaDineroInicial => ({ modo: 'libre', dados: null, multiplicador: 1, maximo: null, sugerido: 0, descripcion });
    if (nep >= 2) {
        const riqueza = catalogos.Riqueza_por_nivel.find((fila) => fila.Nivel === nep);
        if (!riqueza)
            return libre(`La Guía del DM no da riqueza para un NEP ${nep}: pon el dinero que acuerdes con tu máster.`);
        return {
            modo: 'riqueza', dados: null, multiplicador: 1, maximo: riqueza.Po, sugerido: riqueza.Po,
            descripcion: `Riqueza de un personaje de NEP ${nep} (Guía del DM).`,
        };
    }
    if (contexto.aumentaOro)
        return libre('Tu ventaja aumenta el oro inicial: pon el dinero con el que empiezas.');
    const oro = oroDeSusClases(contexto.clases, catalogos.Oro_inicial_por_clase);
    if (!oro)
        return libre('Su clase no tiene oro inicial en la tabla: pon el dinero que acuerdes con tu máster.');
    const factor = contexto.duplicaOro ? 2 : 1;
    return {
        modo: 'dados',
        dados: oro.Dados,
        multiplicador: oro.Multiplicador * factor,
        maximo: oro.Maximo * factor,
        sugerido: 0,
        descripcion: `Oro inicial de ${oro.Clase.Nombre}: ${oro.Dados} × ${oro.Multiplicador} po${factor > 1 ? ', el doble por tu ventaja' : ''}.`,
    };
}

/** El oro de la primera de sus clases que lo tenga, por id (como la API) o, si no hay id, por nombre. */
function oroDeSusClases(clases: ContextoDineroInicial['clases'], tabla: EquipoCatalogos['Oro_inicial_por_clase']) {
    const candidatas = tabla.filter((fila) => clases.some((clase) =>
        (clase.Id && clase.Id > 0) ? clase.Id === fila.Clase.Id : normalizarTexto(clase.Nombre) === normalizarTexto(fila.Clase.Nombre)));
    return candidatas.sort((a, b) => a.Clase.Id - b.Clase.Id)[0] ?? null;
}

/** La pieza que nombra el `field` de un error de la compra («piezas[2].cantidad» → 2), o `null` si no nombra ninguna. */
export function indicePiezaDelCampo(campo: unknown): number | null {
    const encontrado = `${campo ?? ''}`.match(/^piezas\[(\d+)\]/);
    return encontrado ? Number(encontrado[1]) : null;
}

/** Tira los dados del oro inicial («6d4» × 10); `aleatorio` da un número en [0, 1), como `Math.random`. */
export function tirarOroInicial(regla: ReglaDineroInicial, aleatorio: () => number = Math.random): number {
    const partes = `${regla.dados ?? ''}`.trim().toLowerCase().match(/^(\d+)d(\d+)$/);
    if (!partes)
        return regla.sugerido;
    const [cuantos, caras] = [Number(partes[1]), Number(partes[2])];
    let suma = 0;
    for (let i = 0; i < cuantos; i++)
        suma += Math.floor(aleatorio() * caras) + 1;
    return suma * regla.multiplicador;
}

/** El cuerpo de `PUT /personajes/{id}/equipo`. */
export function construirCompra(dineroInicial: number, piezas: PiezaTienda[]): PersonajeCompraRequestDto {
    return {
        dineroInicial: redondear(Math.max(0, dineroInicial || 0)),
        piezas: piezas.map((pieza) => {
            const dto: PersonajeCompraPiezaDto = {
                tipo: pieza.articulo.tipo,
                id: pieza.articulo.id,
                cantidad: Math.max(1, Math.trunc(pieza.cantidad || 1)),
                equipado: pieza.equipado,
            };
            if (pieza.articulo.tipo !== 'objeto') {
                if (pieza.granCalidad)
                    dto.granCalidad = true;
                if (pieza.bonificadorMejora > 0)
                    dto.bonificadorMejora = Math.min(MEJORA_MAXIMA, Math.trunc(pieza.bonificadorMejora));
                if (pieza.material)
                    dto.idMaterial = pieza.material.Id;
                if (pieza.aptitudes.length > 0)
                    dto.encantamientos = pieza.aptitudes.map((aptitud) => ({ id: aptitud.Id, cabeza: 1 }));
            }
            if (pieza.articulo.generico && pieza.idConjuro) {
                dto.idConjuro = pieza.idConjuro;
                dto.nivelConjuro = pieza.nivelConjuro ?? 0;
                dto.nivelLanzador = pieza.nivelLanzador ?? 1;
            }
            return dto;
        }),
    };
}

function redondear(valor: number): number {
    return Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100;
}
