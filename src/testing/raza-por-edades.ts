/*
 * Datos simulados con la forma del contrato de las razas por edades (`docs/publica/endpoints/catalogos.md`,
 * `CategoriaEdadRaza` y `PasoEdadRaza`; `docs/publica/DRAGONES_FRONT.md`), para las pruebas de la web mientras la API de
 * desarrollo no tiene ese código. Un dragón con cuatro categorías: cría, muy joven y joven con ajuste (joven con dos
 * pasos, como la tabla 3-21 del *Draconomicón*) y juvenil sin ajuste (solo PNJ).
 */

export const ID_RAZA_POR_EDADES = 709;

function categoria(orden: number, id: number, nombre: string, desde: number, hasta: number | null, dgs: number, ajuste: number | null, vd: number, nivelLanzamiento: number, raciales: any[] = []) {
    return {
        Orden: orden,
        Categoria: { Id: id, Nombre: nombre },
        Edad_desde: desde,
        Edad_hasta: hasta,
        Tamano: { Id: orden > 1 ? 6 : 5, Nombre: orden > 1 ? 'Grande' : 'Mediano', Modificador: orden > 1 ? -1 : 0, Modificador_presa: orden > 1 ? 4 : 0, Modificador_esconderse: orden > 1 ? -4 : 0 },
        Espacio: orden > 1 ? 10 : 5,
        Alcance: 5,
        Dgs: dgs,
        Ajuste_nivel: ajuste,
        Vd: vd,
        Caracteristicas: { Fuerza: 17 + orden * 4, Destreza: 10, Constitucion: 15, Inteligencia: 10, Sabiduria: 11, Carisma: 10 },
        Modificadores: { Fuerza: 7 + orden * 4, Destreza: 0, Constitucion: 4, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
        Armadura_natural: 3 + orden * 3,
        Velocidades: { Correr: 40, Nadar: 0, Volar: 150, Trepar: 0, Excavar: 0 },
        Maniobrabilidad: { Id: 4, Nombre: 'Mala' },
        Ataques_naturales: 'Mordisco 1d8, 2 garras 1d6',
        Rd: null,
        Rc: null,
        Re: null,
        Nivel_lanzamiento: nivelLanzamiento,
        Nivel_lanzador_sortilegas: orden,
        Raciales: raciales,
        Sortilegas: [],
    };
}

function paso(id: number, edad: number, idCategoria: number, nombre: string, orden: number, dgs: number, ajuste: number | null, vd: number) {
    return {
        Id: id,
        Edad: edad,
        Categoria: { Id: idCategoria, Nombre: nombre },
        Orden: orden,
        Dgs: dgs,
        Ajuste_nivel: ajuste,
        Armadura_natural: 3 + orden * 3,
        Nep_base: ajuste === null ? null : dgs + ajuste,
        Jugable: ajuste !== null,
        Vd: vd,
    };
}

const ALIENTO = { Id: 900, Nombre: 'Arma de aliento', Valor: '2d10', Caracteristica_cd: { Id: 3, Nombre: 'Constitución' } };

export function categoriasEdadContrato(): any[] {
    return [
        categoria(1, 1, 'Cría', 0, 5, 7, 4, 4, 0, [ALIENTO]),
        categoria(2, 2, 'Muy joven', 6, 15, 10, 5, 5, 0, [{ ...ALIENTO, Valor: '4d10' }]),
        categoria(3, 3, 'Joven', 16, 25, 13, 6, 7, 1, [{ ...ALIENTO, Valor: '6d10' }]),
        categoria(4, 4, 'Juvenil', 26, 50, 16, null, 10, 3, [{ ...ALIENTO, Valor: '8d10' }]),
    ];
}

export function pasosEdadContrato(): any[] {
    return [
        paso(11, 0, 1, 'Cría', 1, 7, 4, 4),
        paso(12, 6, 2, 'Muy joven', 2, 10, 5, 5),
        paso(13, 16, 3, 'Joven', 3, 13, 6, 7),
        paso(14, 20, 3, 'Joven', 3, 14, 6, 7),
        paso(15, 26, 4, 'Juvenil', 4, 16, null, 10),
    ];
}

/** `RazaCompleta` de `GET /razas/{id}` (claves cortas del contrato) de una raza por edades. */
export function razaPorEdadesApi(extra: any = {}): any {
    return {
        i: ID_RAZA_POR_EDADES,
        n: 'Dragón rojo',
        m: { Fuerza: 8, Destreza: 0, Constitucion: 4, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
        aju: 4,
        ma: 'Manual de monstruos',
        o: true,
        t: { Id: 5, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
        dg: { Cantidad: 7, Dado: 'd12', Tipo_criatura: 'Dragón' },
        tc: { Id: 7, Nombre: 'Dragón' },
        rac: [],
        sor: [],
        Categorias_edad: categoriasEdadContrato(),
        Pasos_edad: pasosEdadContrato(),
        Lanzamiento: { Clase: { Id: 9, Nombre: 'Hechicero' }, Nivel: 0, Listas: [] },
        ...extra,
    };
}

/** La raza resuelta a un paso (`GET /razas/{id}/pasos-edad/{idPaso}`): las cifras de esa edad, su paso y su categoría. */
export function razaPorEdadesEnPasoApi(idPaso: number): any {
    const pasoElegido = pasosEdadContrato().find((p) => p.Id === idPaso);
    const categoriaElegida = categoriasEdadContrato().find((c) => c.Categoria.Id === pasoElegido.Categoria.Id);
    return razaPorEdadesApi({
        m: categoriaElegida.Modificadores,
        aju: pasoElegido.Ajuste_nivel,
        ant: pasoElegido.Armadura_natural,
        t: categoriaElegida.Tamano,
        dg: { Cantidad: pasoElegido.Dgs, Dado: 'd12', Tipo_criatura: 'Dragón', Ataque_base: pasoElegido.Dgs, Dotes_extra: 1 + Math.floor(pasoElegido.Dgs / 3), Puntos_habilidad: pasoElegido.Dgs + 3, Multiplicador_puntos_habilidad: 6 },
        rac: categoriaElegida.Raciales.map((r: any) => ({ ...r, Descripcion: '', Categoria_edad: categoriaElegida.Categoria })),
        Lanzamiento: { Clase: { Id: 9, Nombre: 'Hechicero' }, Nivel: categoriaElegida.Nivel_lanzamiento, Listas: [] },
        Paso_edad: pasoElegido,
        Categoria_edad: categoriaElegida,
    });
}
