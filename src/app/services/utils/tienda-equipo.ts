import { ArmaDetalle } from 'src/app/interfaces/arma';
import { ArmaduraDetalle } from 'src/app/interfaces/armadura';
import { EquipoCatalogos, GenericoConjuro, MunicionDetalle, ObjetoDetalle } from 'src/app/interfaces/equipo';
import { PersonajeCompraPiezaDto, PersonajeCompraRequestDto, PersonajeTipoPiezaDto } from 'src/app/interfaces/personajes-api';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';

/*
 * La tienda del final de la creación (decisión del propietario del 2026-10-25; `docs/publica/OBJETOS_FRONT.md`, «Las
 * compras»): el dinero inicial que le toca, el precio estimado de cada pieza y la compra para `PUT
 * /personajes/{id}/equipo`. La API es la que manda: calcula el precio de verdad y comprueba el dinero; aquí se estima con
 * sus mismas reglas (`docs/publica/endpoints/personajes.md`) para enseñar lo que lleva gastado mientras compra.
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
}

/** Una pieza de la compra, con lo que la persona elige. */
export interface PiezaTienda {
    articulo: ArticuloTienda;
    cantidad: number;
    equipado: boolean;
    granCalidad: boolean;
    bonificadorMejora: number;
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
    /** Los niveles de clase sumados (la API no cuenta el ajuste de nivel ni los DG raciales). */
    nivel: number;
    /** Sus clases, con id o con nombre (el borrador de la creación puede no tener el id). */
    clases: { Id?: number; Nombre: string; }[];
    duplicaOro: boolean;
    aumentaOro: boolean;
}

const GRAN_CALIDAD: Readonly<Record<Exclude<PersonajeTipoPiezaDto, 'objeto'>, number>> = { arma: 300, armadura: 150, municion: 6 };
const MAGIA_POR_PUNTO: Readonly<Record<Exclude<PersonajeTipoPiezaDto, 'objeto'>, number>> = { arma: 2000, armadura: 1000, municion: 2000 };
const MUNICION_POR_LOTE_MAGICO = 50;
export const MEJORA_MAXIMA = 5;

export function articuloDeArma(arma: ArmaDetalle): ArticuloTienda {
    return {
        tipo: 'arma', id: arma.Id, nombre: arma.Nombre, precio: arma.Precio, peso: arma.Peso, lote: 1, generico: null,
        oficial: arma.Oficial, categoria: arma.Tipo_arma?.Nombre ?? '',
    };
}

export function articuloDeArmadura(armadura: ArmaduraDetalle): ArticuloTienda {
    return {
        tipo: 'armadura', id: armadura.Id, nombre: armadura.Nombre, precio: armadura.Precio, peso: armadura.Peso, lote: 1,
        generico: null, oficial: armadura.Oficial,
        categoria: armadura.Es_escudo ? 'Escudo' : (armadura.Peso_armadura?.Nombre ?? ''),
    };
}

export function articuloDeMunicion(municion: MunicionDetalle): ArticuloTienda {
    return {
        tipo: 'municion', id: municion.Id, nombre: municion.Nombre, precio: municion.Precio, peso: municion.Peso,
        lote: Math.max(1, municion.Cantidad_por_precio), generico: null, oficial: municion.Oficial, categoria: 'Munición',
    };
}

export function articuloDeObjeto(objeto: ObjetoDetalle): ArticuloTienda {
    return {
        tipo: 'objeto', id: objeto.Id, nombre: objeto.Nombre, precio: objeto.Precio, peso: objeto.Peso, lote: 1,
        generico: objeto.Generico_conjuro, oficial: objeto.Oficial, categoria: objeto.Tipo?.Nombre ?? '',
    };
}

/** Si se puede comprar: con precio o con su fórmula (un genérico de un conjuro). Las filas comodín o sin id, no. */
export function sePuedeComprar(articulo: ArticuloTienda): boolean {
    return articulo.id > 0 && (articulo.generico !== null || (articulo.precio !== null && articulo.precio >= 0));
}

/** Una pieza nueva con lo de partida: la munición, un lote entero; lo demás, una unidad; puesta si se lleva encima. */
export function nuevaPieza(articulo: ArticuloTienda): PiezaTienda {
    return {
        articulo,
        cantidad: articulo.tipo === 'municion' ? articulo.lote : 1,
        equipado: articulo.tipo === 'arma' || articulo.tipo === 'armadura',
        granCalidad: false,
        bonificadorMejora: 0,
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

/**
 * El precio estimado de una pieza (todas sus unidades), en po, con las reglas de la API: el del catálogo (la munición,
 * por pieza), 300 po de gran calidad en armas, 150 en armaduras y 6 por pieza de munición (incluida si es mágica),
 * 2.000 po × bonificador² en armas, 1.000 en armaduras y entre 50 en munición; los genéricos, precio por nivel × nivel
 * del conjuro (el 0 cuenta ½) × nivel de lanzador. Sin el componente caro de los conjuros, que la API tampoco cobra aún.
 */
export function precioEstimado(pieza: PiezaTienda): number {
    const articulo = pieza.articulo;
    const cantidad = Math.max(1, Math.trunc(pieza.cantidad || 1));
    if (articulo.tipo === 'objeto') {
        if (articulo.generico) {
            const nivel = pieza.nivelConjuro === 0 ? 0.5 : Math.max(0, pieza.nivelConjuro ?? 0);
            return redondear(articulo.generico.Precio_por_nivel * nivel * Math.max(0, pieza.nivelLanzador ?? 0) * cantidad);
        }
        return redondear((articulo.precio ?? 0) * cantidad);
    }
    const mejora = Math.max(0, Math.min(MEJORA_MAXIMA, Math.trunc(pieza.bonificadorMejora || 0)));
    const magica = mejora > 0;
    let unidad = articulo.precio ?? 0;
    if (articulo.tipo === 'municion')
        unidad = unidad / Math.max(1, articulo.lote);
    if (pieza.granCalidad || magica)
        unidad += GRAN_CALIDAD[articulo.tipo];
    let magia = MAGIA_POR_PUNTO[articulo.tipo] * mejora * mejora;
    if (articulo.tipo === 'municion')
        magia = magia / MUNICION_POR_LOTE_MAGICO;
    return redondear((unidad + magia) * cantidad);
}

/** El peso de una pieza (todas sus unidades), en libras; la munición pesa por lote. */
export function pesoEstimado(pieza: PiezaTienda): number {
    const peso = pieza.articulo.peso ?? 0;
    const porUnidad = pieza.articulo.tipo === 'municion' ? peso / Math.max(1, pieza.articulo.lote) : peso;
    return redondear(porUnidad * Math.max(1, Math.trunc(pieza.cantidad || 1)));
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

/**
 * Cómo se decide el dinero inicial (`dineroInicial` de la compra), con las reglas de la API: en nivel 1, el oro inicial
 * de su clase (los dados de la tabla 7-1 del Manual del jugador, el doble con la ventaja que duplica el oro); en nivel 2
 * a 20, la riqueza por nivel de la Guía del DM. Sin oro de clase, por encima del nivel 20 o con la ventaja que aumenta el
 * oro, no hay tope.
 */
export function reglaDineroInicial(contexto: ContextoDineroInicial, catalogos: Pick<EquipoCatalogos, 'Oro_inicial_por_clase' | 'Riqueza_por_nivel'>): ReglaDineroInicial {
    const nivel = Math.max(1, Math.trunc(contexto.nivel || 1));
    const libre = (descripcion: string): ReglaDineroInicial => ({ modo: 'libre', dados: null, multiplicador: 1, maximo: null, sugerido: 0, descripcion });
    if (nivel >= 2) {
        const riqueza = catalogos.Riqueza_por_nivel.find((fila) => fila.Nivel === nivel);
        if (!riqueza)
            return libre(`La Guía del DM no da riqueza para el nivel ${nivel}: pon el dinero que acuerdes con tu máster.`);
        return {
            modo: 'riqueza', dados: null, multiplicador: 1, maximo: riqueza.Po, sugerido: riqueza.Po,
            descripcion: `Riqueza de un personaje de nivel ${nivel} (Guía del DM).`,
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
