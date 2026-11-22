import {
    Clase, ClaseConjuroRef, ClaseDoteNivel, ClaseEspecialNivel, ClaseNivelDetalle, SustitucionDetalle, SustitucionNivel,
    SustitucionQuita,
} from 'src/app/interfaces/clase';
import { unirLista } from 'src/app/components/detalles/ficha/ficha';
import { IdentidadPrerrequisitos, existeCoincidenciaClaveEntidad } from './identidad-prerrequisitos';
import {
    DeidadDelPersonaje, HabilidadParaPrerrequisitos, MotivosPrerrequisitos, compararActitud, compararDeidad,
    compararRangosHabilidad, compararSubtipo,
} from './prerrequisitos-evaluacion';
import { minusculaInicial } from './formato-registros';
import { mismoExtra, normalizarTexto, toInt } from './normalizacion';
import { nivelDeClaveConjuro } from './reglas-magia';

/**
 * Los niveles de sustitución (R8; contrato: catalogos.md y personajes.md, «Los niveles de sustitución»; dictamen del
 * máster de Rol, D1-D15). Un nivel de sustitución es un nivel de la clase que se toma en lugar del estándar: lo que da y lo
 * que quita de la tabla de la clase, su DG, sus puntos y sus habilidades de clase salen de los datos del juego
 * (`Clase.Sustituciones`); aquí, sin estado, lo que el motor necesita para calcularlo.
 */

/** Un nivel de clase tomado como nivel de sustitución: el nivel de la clase y el `Id` de su `SustitucionNivel`. */
export interface NivelSustitucionTomado {
    nivelClase: number;
    idNivelSustitucion: number;
}

/** Un nivel de un juego, con su juego. */
export interface NivelDeSustitucion {
    juego: SustitucionDetalle;
    nivel: SustitucionNivel;
}

/** Los juegos de la clase (vacío si no tiene o si la caché es de antes de la versión 26). */
export function juegosDeLaClase(clase: Clase | null | undefined): SustitucionDetalle[] {
    return clase?.Sustituciones ?? [];
}

/** El nivel de sustitución con ese `Id` en los juegos de la clase, o `null`. */
export function nivelDeSustitucion(clase: Clase | null | undefined, idNivelSustitucion: unknown): NivelDeSustitucion | null {
    const id = toInt(idNivelSustitucion);
    if (id <= 0)
        return null;
    for (const juego of juegosDeLaClase(clase)) {
        const nivel = juego.Niveles.find((n) => n.Id === id);
        if (nivel)
            return { juego, nivel };
    }
    return null;
}

/** Los niveles de sustitución que se pueden tomar en ese nivel de la clase: uno por juego que lo tenga. */
export function opcionesDeSustitucion(clase: Clase | null | undefined, nivelClase: number): NivelDeSustitucion[] {
    return juegosDeLaClase(clase).flatMap((juego) => juego.Niveles
        .filter((nivel) => nivel.Nivel === toInt(nivelClase))
        .map((nivel) => ({ juego, nivel })));
}

/** Los niveles de sustitución de la clase en un orden de niveles (`Orden_niveles` o `niveles` de la API). */
export function sustitucionesDeLaClase(
    orden: ReadonlyArray<{ idClase?: unknown; nivelClase?: unknown; idNivelSustitucion?: unknown; }> | null | undefined,
    idClase: number,
): NivelSustitucionTomado[] {
    return (orden ?? [])
        .filter((n) => toInt(n?.idClase) === toInt(idClase) && toInt(n?.idNivelSustitucion) > 0)
        .map((n) => ({ nivelClase: toInt(n?.nivelClase), idNivelSustitucion: toInt(n?.idNivelSustitucion) }));
}

/** El nivel de sustitución de ese nivel de la clase entre los tomados, o `null` si es estándar. */
export function sustitucionDelNivel(clase: Clase | null | undefined, tomados: readonly NivelSustitucionTomado[], nivelClase: number): NivelDeSustitucion | null {
    const tomado = tomados.find((t) => t.nivelClase === toInt(nivelClase));
    const encontrado = tomado ? nivelDeSustitucion(clase, tomado.idNivelSustitucion) : null;
    return encontrado && encontrado.nivel.Nivel === toInt(nivelClase) ? encontrado : null;
}

/** Los tomados con su nivel del catálogo (sin los que no están en la caché o no cuadran con su nivel). */
function tomadosConDatos(clase: Clase | null | undefined, tomados: readonly NivelSustitucionTomado[]): NivelDeSustitucion[] {
    return tomados
        .map((t) => sustitucionDelNivel(clase, tomados, t.nivelClase))
        .filter((t): t is NivelDeSustitucion => !!t);
}

/** El nombre del DG de ese nivel (`Tipo_dado` del juego, o el de la clase). */
export function dadoDelNivel(clase: Clase | null | undefined, sustitucion: NivelDeSustitucion | null): string {
    return `${sustitucion?.juego.Tipo_dado?.Nombre ?? clase?.Tipo_dado?.Nombre ?? ''}`;
}

/** Los puntos de habilidad por nivel de ese nivel (los del juego, o los de la clase). */
export function puntosHabilidadDelNivel(clase: Clase | null | undefined, sustitucion: NivelDeSustitucion | null): number {
    return toInt(sustitucion?.juego.Puntos_habilidad?.Valor ?? clase?.Puntos_habilidad?.Valor);
}

/** Una habilidad del juego como las referencias de `Clase.Habilidades.Base` (`Id_habilidad`, `Habilidad`, `Id_extra`, `Extra`). */
export interface RefHabilidadDeSustitucion {
    Id_habilidad: number;
    Habilidad: string;
    Id_extra: number;
    Extra: string;
}

/** Las habilidades de clase que el juego añade y las que quita, como referencias de la tabla de la clase. */
export function habilidadesDelJuego(juego: SustitucionDetalle | null | undefined): { anade: RefHabilidadDeSustitucion[]; quita: RefHabilidadDeSustitucion[]; } {
    const ref = (h: SustitucionDetalle['Habilidades'][number]): RefHabilidadDeSustitucion => ({
        Id_habilidad: toInt(h.Habilidad?.Id),
        Habilidad: `${h.Habilidad?.Nombre ?? ''}`,
        Id_extra: h.Extra ? toInt(h.Extra.Id) : -1,
        Extra: h.Extra ? `${h.Extra.Nombre ?? ''}` : '',
    });
    const habilidades = juego?.Habilidades ?? [];
    return { anade: habilidades.filter((h) => !h.Quita).map(ref), quita: habilidades.filter((h) => h.Quita).map(ref) };
}

// --- La tabla de la clase con sus niveles de sustitución --------------------------------------------------------------

function esDeLaQuita(fila: ClaseEspecialNivel | ClaseDoteNivel, quita: SustitucionQuita, tipo: 'especial' | 'dote', conExtra = true): boolean {
    const id = tipo === 'especial'
        ? toInt(((fila as ClaseEspecialNivel).Especial as Record<string, any>)?.['Id'])
        : toInt(((fila as ClaseDoteNivel).Dote as any)?.Id);
    if (id <= 0 || id !== toInt(quita.Elemento?.Id))
        return false;
    return !conExtra || quita.Id_extra === null || mismoExtra(fila.Id_extra, quita.Id_extra);
}

function filasDe(detalle: ClaseNivelDetalle, tipo: 'especial' | 'dote'): (ClaseEspecialNivel | ClaseDoteNivel)[] {
    return tipo === 'especial' ? detalle.Especiales : detalle.Dotes;
}

function ponerFilas(detalle: ClaseNivelDetalle, tipo: 'especial' | 'dote', filas: (ClaseEspecialNivel | ClaseDoteNivel)[]): void {
    if (tipo === 'especial')
        detalle.Especiales = filas as ClaseEspecialNivel[];
    else
        detalle.Dotes = filas as ClaseDoteNivel[];
}

function filaDeLaTabla(clase: Clase, nivel: number): ClaseNivelDetalle | null {
    return (clase?.Desglose_niveles ?? []).find((n) => toInt(n?.Nivel) === nivel) ?? null;
}

/** Suma `delta` a cada cifra de una casilla de la tabla («+6/+1» con −1, «+5/+0»). */
export function ajustarCifras(texto: string, delta: number): string {
    if (!delta)
        return texto;
    return `${texto ?? ''}`.replace(/[+\-−]?\d+/g, (cifra) => {
        const valor = Number(cifra.replace('−', '-')) + delta;
        return valor >= 0 ? `+${valor}` : `${valor}`;
    });
}

/** Resta `cantidad` a la casilla de nivel de conjuro `nivelConjuro` (sin bajar de 0; -1, sin acceso, se queda). */
function restarConjuros(mapa: Record<string, number>, nivelConjuro: number | null, cantidad: number): Record<string, number> {
    const copia = { ...(mapa ?? {}) };
    Object.keys(copia).forEach((clave) => {
        if (nivelConjuro !== null && nivelDeClaveConjuro(clave) === nivelConjuro && copia[clave] > 0)
            copia[clave] = Math.max(0, copia[clave] - cantidad);
    });
    return copia;
}

/** Si la quita toca ese nivel de la clase: en el suyo (`nivel`, `aplaza`, `retrasa`) o desde el suyo (`desde`). */
function quitaEnElNivel(quita: SustitucionQuita, nivelTomado: number, nivelClase: number): boolean {
    return quita.Alcance === 'desde' ? nivelClase >= nivelTomado : nivelClase === nivelTomado;
}

function aplicarQuitaDeFilas(clase: Clase, detalle: ClaseNivelDetalle, nivelClase: number, nivelTomado: number, quita: SustitucionQuita,
    tipo: 'especial' | 'dote'): void {
    const filas = filasDe(detalle, tipo);
    if (quita.Alcance === 'retrasa') {
        // Las filas de la aptitud desde el nivel en que se toma, en orden: la primera se pierde y cada una da el extra de la
        // anterior (el sentido de las trampas, «menos 1»).
        const deLaAptitud = (clase.Desglose_niveles ?? [])
            .filter((n) => toInt(n.Nivel) >= nivelTomado)
            .sort((a, b) => toInt(a.Nivel) - toInt(b.Nivel))
            .flatMap((n) => filasDe(n, tipo).filter((f) => esDeLaQuita(f, quita, tipo, false)).map((f) => ({ nivel: toInt(n.Nivel), fila: f })));
        const indice = deLaAptitud.findIndex((f) => f.nivel === nivelClase);
        if (indice < 0)
            return;
        if (indice === 0) {
            ponerFilas(detalle, tipo, filas.filter((f) => !esDeLaQuita(f, quita, tipo, false)));
            return;
        }
        const anterior = deLaAptitud[indice - 1].fila;
        ponerFilas(detalle, tipo, filas.map((f) => esDeLaQuita(f, quita, tipo, false)
            ? { ...f, Id_extra: anterior.Id_extra, Extra: anterior.Extra, Extra_comodin: anterior.Extra_comodin ?? null }
            : f));
        return;
    }
    if (quita.Alcance === 'aplaza' && toInt(quita.Aplaza_a_nivel) === nivelClase && nivelClase !== nivelTomado) {
        // La aptitud del nivel en que se toma pasa a este (el tercer enemigo predilecto del explorador elfo, a 15.º).
        const original = filaDeLaTabla(clase, nivelTomado);
        const movidas = original ? filasDe(original, tipo).filter((f) => esDeLaQuita(f, quita, tipo)).map((f) => ({ ...f, Nivel: nivelClase })) : [];
        ponerFilas(detalle, tipo, [...filas, ...movidas]);
        return;
    }
    if (quitaEnElNivel(quita, nivelTomado, nivelClase))
        ponerFilas(detalle, tipo, filas.filter((f) => !esDeLaQuita(f, quita, tipo)));
}

/**
 * La fila de la tabla de la clase de ese nivel con los niveles de sustitución que tiene de la clase (`tomados`, también el
 * que toma ahora): sin lo que quita cada uno (con su `Alcance`), con lo que da el suyo (`Especiales` y `Dotes`) y con los
 * ajustes de ataque base y salvaciones de los tomados hasta ese nivel. `null` si la clase no tiene ese nivel. Sin
 * niveles de sustitución, la fila de la tabla tal cual (una copia).
 */
export function detalleConSustituciones(clase: Clase, nivelClase: number, tomados: readonly NivelSustitucionTomado[]): ClaseNivelDetalle | null {
    const nivel = Math.max(1, toInt(nivelClase));
    const base = filaDeLaTabla(clase, nivel);
    if (!base)
        return null;
    const conDatos = tomadosConDatos(clase, tomados);
    if (conDatos.length < 1)
        return base;
    const detalle: ClaseNivelDetalle = {
        ...base,
        Salvaciones: { ...base.Salvaciones },
        Conjuros_diarios: { ...(base.Conjuros_diarios ?? {}) },
        Conjuros_conocidos_nivel_a_nivel: { ...(base.Conjuros_conocidos_nivel_a_nivel ?? {}) },
        Especiales: [...(base.Especiales ?? [])],
        Dotes: [...(base.Dotes ?? [])],
    };
    const ajustes = { Ataque_base: 0, Fortaleza: 0, Reflejos: 0, Voluntad: 0 };
    conDatos.sort((a, b) => a.nivel.Nivel - b.nivel.Nivel).forEach(({ nivel: tomado }) => {
        tomado.Quita.forEach((quita) => {
            const cantidad = Math.max(1, toInt(quita.Cantidad ?? 1));
            switch (quita.Tipo) {
                case 'especial':
                case 'dote':
                    aplicarQuitaDeFilas(clase, detalle, nivel, tomado.Nivel, quita, quita.Tipo);
                    break;
                case 'conjuros_diarios':
                    if (quitaEnElNivel(quita, tomado.Nivel, nivel))
                        detalle.Conjuros_diarios = restarConjuros(detalle.Conjuros_diarios, quita.Nivel_conjuro, cantidad);
                    break;
                case 'conjuros_conocidos':
                    if (quitaEnElNivel(quita, tomado.Nivel, nivel)) {
                        if (quita.Nivel_conjuro === null)
                            detalle.Conjuros_conocidos_total = Math.max(0, toInt(detalle.Conjuros_conocidos_total) - cantidad);
                        else
                            detalle.Conjuros_conocidos_nivel_a_nivel = restarConjuros(detalle.Conjuros_conocidos_nivel_a_nivel, quita.Nivel_conjuro, cantidad);
                    }
                    break;
                // Las competencias, el libro, la escuela y los dominios no son de la fila: `competenciasQueQuita` y
                // `quitasDeOtroTipo`.
            }
        });
        if (tomado.Nivel === nivel) {
            detalle.Especiales = [...detalle.Especiales, ...tomado.Especiales.map((e) => ({ ...e, Nivel: nivel }))];
            detalle.Dotes = [...detalle.Dotes, ...tomado.Dotes.map((d) => ({ ...d, Nivel: nivel }))];
        }
        if (tomado.Nivel <= nivel) {
            ajustes.Ataque_base += toInt(tomado.Ajustes?.Ataque_base);
            ajustes.Fortaleza += toInt(tomado.Ajustes?.Fortaleza);
            ajustes.Reflejos += toInt(tomado.Ajustes?.Reflejos);
            ajustes.Voluntad += toInt(tomado.Ajustes?.Voluntad);
        }
    });
    detalle.Ataque_base = ajustarCifras(detalle.Ataque_base, ajustes.Ataque_base);
    detalle.Salvaciones = {
        Fortaleza: ajustarCifras(detalle.Salvaciones.Fortaleza, ajustes.Fortaleza),
        Reflejos: ajustarCifras(detalle.Salvaciones.Reflejos, ajustes.Reflejos),
        Voluntad: ajustarCifras(detalle.Salvaciones.Voluntad, ajustes.Voluntad),
    };
    return detalle;
}

/** Los tipos de quita que no son de una fila de la tabla: las competencias de la clase. */
const QUITA_DE_COMPETENCIA: Record<keyof Clase['Competencias'], string> = {
    Armas: 'competencia_arma',
    Armaduras: 'competencia_armadura',
    Grupos_arma: 'competencia_grupo_arma',
    Grupos_armadura: 'competencia_grupo_armadura',
};

/**
 * Las competencias de la clase (`Competencias[fuente]`) que no gana por sus niveles de sustitución (`competencia_*`): sus
 * ids. Una que le dé otra fuente la conserva (quien llama solo las quita de las de esta clase).
 */
export function competenciasQueQuita(clase: Clase | null | undefined, tomados: readonly NivelSustitucionTomado[],
    fuente: keyof Clase['Competencias']): Set<number> {
    const tipo = QUITA_DE_COMPETENCIA[fuente];
    return new Set(tomadosConDatos(clase, tomados)
        .flatMap(({ nivel }) => nivel.Quita.filter((q) => q.Tipo === tipo).map((q) => toInt(q.Elemento?.Id)))
        .filter((id) => id > 0));
}

/**
 * La lista de conjuros de la clase con sus niveles de sustitución hasta `nivelClase`: los que entran (al nivel de conjuro
 * del juego) y sin los que salen. `conocidos`, los que conoce sin elegirlos (los del nivel que toma ahora y los de antes).
 */
export function listadoConSustituciones(clase: Clase | null | undefined, listado: readonly ClaseConjuroRef[], tomados: readonly NivelSustitucionTomado[],
    nivelClase: number): ClaseConjuroRef[] {
    const deLosTomados = tomadosConDatos(clase, tomados).filter(({ nivel }) => nivel.Nivel <= toInt(nivelClase));
    if (deLosTomados.length < 1)
        return [...listado];
    const salen = new Set<number>();
    const entran: ClaseConjuroRef[] = [];
    deLosTomados.forEach(({ nivel }) => nivel.Conjuros.forEach((c) => {
        const id = toInt(c.Conjuro?.Id);
        if (id <= 0)
            return;
        if (c.Quita) {
            salen.add(id);
            return;
        }
        salen.delete(id);
        entran.push({ Id: id, Nombre: `${c.Conjuro?.Nombre ?? ''}`, Nivel: toInt(c.Nivel), Espontaneo: false });
    }));
    const vistos = new Set<number>();
    return [...listado.filter((r) => !entran.some((e) => e.Id === toInt(r.Id))), ...entran]
        .filter((r) => !salen.has(toInt(r.Id)))
        .filter((r) => {
            if (vistos.has(toInt(r.Id)))
                return false;
            vistos.add(toInt(r.Id));
            return true;
        });
}

/** Los conjuros que conoce sin elegirlos por el nivel de sustitución que toma (`Conocido`). */
export function conjurosConocidosDelNivel(sustitucion: NivelDeSustitucion | null): ClaseConjuroRef[] {
    return (sustitucion?.nivel.Conjuros ?? [])
        .filter((c) => !c.Quita && c.Conocido && toInt(c.Conjuro?.Id) > 0)
        .map((c) => ({ Id: toInt(c.Conjuro.Id), Nombre: `${c.Conjuro.Nombre ?? ''}`, Nivel: toInt(c.Nivel), Espontaneo: false }));
}

/**
 * Las quitas de un nivel que el motor de la web aún no aplica (el libro de conjuros, la escuela, los dominios): para
 * avisarlo al elegirlo. Ningún juego de la primera tanda las tiene.
 */
export function quitasSinAplicar(sustitucion: NivelDeSustitucion | null): SustitucionQuita[] {
    return (sustitucion?.nivel.Quita ?? []).filter((q) => ['libro_por_nivel', 'escuela', 'dominios'].includes(q.Tipo));
}

// --- Los requisitos -----------------------------------------------------------------------------------------------------

/** Lo que hace falta saber del personaje para los requisitos de un juego, al tomar el nivel. */
export interface ContextoRequisitosSustitucion {
    /** Su raza, su raza base y por la que se le considera, sus tipos y sus subtipos (`buildIdentidadPrerrequisitos`). */
    identidad: IdentidadPrerrequisitos;
    /** El alineamiento básico (1-9) y su nombre. */
    alineamientoBasicoId: number;
    alineamiento: string;
    genero: string;
    deidad: DeidadDelPersonaje | null;
    habilidades: HabilidadParaPrerrequisitos[];
    /** Los tipos de sus dotes (para `tipo_dote`). */
    tiposDeDote: Array<{ id: number | null; nombre: string; }>;
    /** La escuela de la que es especialista, o `null`. */
    escuelaEspecialista: { id: number | null; nombre: string; } | null;
}

export interface EvaluacionRequisitosSustitucion {
    /** Se puede tomar: cumple todo lo que se puede comprobar. */
    cumple: boolean;
    /** «No cumple: …» de cada requisito o grupo que no cumple, y lo que no se ha podido comprobar por falta de datos. */
    motivos: string[];
    /** Lo que nadie puede comprobar (D6): se deja elegir con el aviso. */
    avisos: string[];
}

/** El aviso de un requisito que la web no puede comprobar (D6): se deja elegir y no vuelve homebrew la ficha. */
export const AVISO_NO_VERIFICABLE = 'La web no puede comprobar este requisito';

function mismoElemento(lista: ReadonlyArray<{ id: number | null; nombre: string; }>, elemento: { Id: number; Nombre: string; } | null): boolean {
    if (!elemento)
        return false;
    return lista.some((e) => (toInt(elemento.Id) > 0 && toInt(e.id) === toInt(elemento.Id))
        || (normalizarTexto(e.nombre).length > 0 && normalizarTexto(e.nombre) === normalizarTexto(elemento.Nombre)));
}

/**
 * Los requisitos del juego para tomar el nivel `nivelClase` (los de todo el juego y los de ese nivel), con lo que tiene el
 * personaje **ahora** (D3: no se vuelven a mirar después). Los grupos `Opcional` son alternativas: basta uno.
 */
export function evaluarRequisitosDeSustitucion(juego: SustitucionDetalle, nivelClase: number, ctx: ContextoRequisitosSustitucion): EvaluacionRequisitosSustitucion {
    const motivos = new MotivosPrerrequisitos();
    juego.Prerrequisitos
        .filter((p) => p.Nivel === null || p.Nivel === toInt(nivelClase))
        .forEach((p) => {
            const e = p.Elemento;
            const base = { grupoOpcional: Math.max(0, toInt(p.Opcional)), frase: p.Frase, clave: p.Tipo, razonUnknown: `No se ha podido comprobar: ${p.Frase}` };
            const registrar = (evaluable: boolean, cumple: boolean) => motivos.registrar({ ...base, evaluable, cumple });
            switch (p.Tipo) {
                case 'raza':
                    registrar(!!e, !!e && existeCoincidenciaClaveEntidad(ctx.identidad.razas, e.Id, e.Nombre));
                    break;
                case 'subtipo': {
                    const r = compararSubtipo({ Id: e?.Id, Nombre: e?.Nombre }, ctx.identidad.subtipos, false);
                    registrar(r.evaluable, r.cumple);
                    break;
                }
                case 'tipo_criatura':
                    registrar(!!e, !!e && existeCoincidenciaClaveEntidad(ctx.identidad.tiposCriatura, e.Id, e.Nombre));
                    break;
                case 'tipo_criatura_prohibido':
                    registrar(!!e, !!e && !existeCoincidenciaClaveEntidad(ctx.identidad.tiposCriatura, e.Id, e.Nombre));
                    break;
                case 'alineamiento_requerido':
                    registrar(!!e && (ctx.alineamientoBasicoId > 0 || normalizarTexto(ctx.alineamiento).length > 0),
                        !!e && ((toInt(e.Id) > 0 && toInt(e.Id) === ctx.alineamientoBasicoId)
                            || normalizarTexto(e.Nombre) === normalizarTexto(ctx.alineamiento)));
                    break;
                case 'actitud_requerido': {
                    const r = compararActitud({ Id_actitud: e?.Id }, ctx.alineamientoBasicoId, false);
                    registrar(r.evaluable, r.cumple);
                    break;
                }
                case 'deidad': {
                    const r = compararDeidad({ Id_deidad: e?.Id, Deidad: e?.Nombre }, ctx.deidad);
                    registrar(r.evaluable, r.cumple);
                    break;
                }
                case 'deidad_arma_predilecta':
                    registrar(!!e, !!e && !!ctx.deidad && toInt(ctx.deidad.idArma) > 0 && toInt(ctx.deidad.idArma) === toInt(e.Id));
                    break;
                case 'genero':
                    registrar(!!e && normalizarTexto(ctx.genero).length > 0, !!e && normalizarTexto(e.Nombre) === normalizarTexto(ctx.genero));
                    break;
                case 'habilidad': {
                    const r = compararRangosHabilidad({
                        Id_habilidad: e?.Id, Habilidad: e?.Nombre, Rangos: p.Cantidad ?? 0,
                        Extras: p.Extra && toInt(p.Extra.Id) > 0 ? [{ Id_extra: p.Extra.Id }] : [],
                    }, ctx.habilidades);
                    registrar(r.evaluable, r.cumple);
                    break;
                }
                case 'tipo_dote':
                    registrar(!!e, mismoElemento(ctx.tiposDeDote, e));
                    break;
                case 'escuela_especialista':
                    registrar(!!e, !!ctx.escuelaEspecialista && mismoElemento([ctx.escuelaEspecialista], e));
                    break;
                case 'no_verificable':
                    motivos.registrar({ ...base, evaluable: true, cumple: false, aviso: `${p.Texto || p.Frase}: ${minusculaInicial(AVISO_NO_VERIFICABLE)}.` });
                    break;
                default:
                    registrar(false, false);
            }
        });
    motivos.cerrarGrupos();
    const fallos = Array.from(new Set([...motivos.fail, ...motivos.unknown]));
    return { cumple: fallos.length < 1, motivos: fallos, avisos: Array.from(new Set(motivos.avisos)) };
}

// --- Los textos ---------------------------------------------------------------------------------------------------------

/** «1.º» de un nivel de clase. */
export function ordinalDeNivel(nivel: number): string {
    return `${toInt(nivel)}.º`;
}

/**
 * Lo que va tras la clase en la ficha: «sustitución: guerrero enano 1.º y 2.º» (`PersonajeClase.nivelesSustitucion`); vacío
 * si no tiene ninguno. Varios juegos, separados por «;».
 */
export function textoNivelesSustitucion(niveles: ReadonlyArray<{ nivelClase: number; sustitucion: { id: number; nombre: string; }; }> | null | undefined): string {
    const porJuego = new Map<number, { nombre: string; niveles: number[]; }>();
    (niveles ?? []).forEach((n) => {
        const id = toInt(n?.sustitucion?.id);
        const actual = porJuego.get(id) ?? { nombre: `${n?.sustitucion?.nombre ?? ''}`.trim(), niveles: [] };
        actual.niveles.push(toInt(n?.nivelClase));
        porJuego.set(id, actual);
    });
    const partes = Array.from(porJuego.values())
        .filter((j) => j.nombre.length > 0)
        .map((j) => `${minusculaInicial(j.nombre)} ${unirLista(j.niveles.sort((a, b) => a - b).map(ordinalDeNivel), 'y')}`);
    return partes.length > 0 ? `sustitución: ${partes.join('; ')}` : '';
}

/** El nombre de una opción del selector: «Guerrero enano, 1.º (nivel de sustitución)». */
export function nombreDeOpcionDeSustitucion(opcion: NivelDeSustitucion): string {
    return `${opcion.juego.Titulo} (${ordinalDeNivel(opcion.nivel.Nivel)})`;
}

/** Lo que cambia un nivel, en una línea para el selector: su descripción o lo que da y lo que quita. */
export function resumenDelNivelDeSustitucion(opcion: NivelDeSustitucion): string {
    const da = [
        ...opcion.nivel.Especiales.map((e) => `${(e.Especial as Record<string, any>)?.['Nombre'] ?? ''}`.trim()),
        ...opcion.nivel.Dotes.map((d) => `${(d.Dote as any)?.Nombre ?? ''}`.trim()),
    ].filter((t) => t.length > 0);
    const quita = opcion.nivel.Quita.map((q) => `${q.Elemento?.Nombre ?? ''}`.trim()).filter((t) => t.length > 0);
    const partes = [
        `${opcion.nivel.Descripcion ?? ''}`.trim(),
        opcion.juego.Tipo_dado?.Nombre ? `DG ${opcion.juego.Tipo_dado.Nombre}` : '',
        da.length > 0 ? `Gana: ${unirLista(da, 'y')}` : '',
        quita.length > 0 ? `En lugar de: ${unirLista(quita, 'y')}` : '',
    ].filter((t) => t.length > 0);
    return partes.join('. ');
}
