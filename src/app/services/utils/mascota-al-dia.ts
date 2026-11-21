import { PersonajeCreateCompaneroDto, PersonajeCreateFamiliarDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import type { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import type { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { abreviaturaCaracteristica, caracteristicaPorId } from './caracteristicas';
import { sacarDoteDeLaFicha, sacarPrimero } from './correccion-ficha';
import { textoConSigno } from './equipo-texto';
import { mismoExtra, toInt } from './normalizacion';
import { quitarElNivelDelMotor, ResultadoPerdida } from './perder-nivel';
import { aplicarLoQueDanLasDotes, conLasMascotasDelMotor, diferencia } from './subida-nivel';

/*
 * La mascota en los cambios de la ficha (contrato: `docs/publica/endpoints/personajes.md`, «La mascota inactiva, y la mascota
 * en los cambios de la ficha»; dictamen del máster de Rol del 2026-11-21: *Guía del DM*, pág. 295; *Manual del jugador*,
 * págs. 35-36, 44, 87 y 284). Las vías de la sesión que cambian el nivel o las clases (perder un nivel, convertirse en
 * muerto viviente, devolver la vida, adquirir una plantilla o una raza mutada) vuelven a juzgar el compañero animal y el
 * familiar en el motor (`NuevoPersonajeService.ponerMascotasAlDia`) antes de armar la ficha: el que cumple su fila lleva los
 * valores de su nivel nuevo; el que no, queda inactivo hasta que vuelva a cumplir, con los de su monstruo, y su amo pierde
 * lo que le daba. Aquí, lo que eso cambia en la ficha que se manda y en «Lo que cambia».
 */

/**
 * Cómo queda una mascota al ponerla al día y, si está inactiva, por qué: lo que no cumple de su fila, con la frase de la API
 * sin el punto (el `motivo` de `resolverFilaMascota`).
 */
export interface EstadoDeLaMascota {
    nombre: string;
    inactiva: boolean;
    motivo: string;
}

/** Cómo quedan las mascotas del personaje (`ponerMascotasAlDia`). */
export interface EstadoDeLasMascotas {
    companero?: EstadoDeLaMascota;
    familiar?: EstadoDeLaMascota;
}

/** Lo que dan al amo las tablas de sus mascotas, a cualquier nivel: los ids de sus aptitudes y de sus dotes (Alerta). */
export interface LoQueDanLasMascotasAlAmo {
    especiales: ReadonlySet<number>;
    dotes: ReadonlySet<number>;
}

/**
 * La `ficha` sin lo que el amo llevaba por su mascota y el motor le quita entre su cuerpo `antes` y `despues` (las
 * aptitudes del vínculo y las dotes, Alerta, de `delAmo`): la ficha del motor solo añade a las colecciones
 * (`fichaConLoDelMotor`), y la mascota que queda inactiva (o que baja de nivel) se lo lleva. Lo demás, como estaba.
 */
export function sinLoQueYaNoDaLaMascota(ficha: PersonajeCreateRequestDto, antes: PersonajeCreateRequestDto,
    despues: PersonajeCreateRequestDto, delAmo: LoQueDanLasMascotasAlAmo): PersonajeCreateRequestDto {
    const colA: any = antes.colecciones ?? {};
    const colD: any = despues.colecciones ?? {};
    const especialesQuitados = diferencia(colA.especiales ?? [], colD.especiales ?? []).quitados
        .filter((e) => delAmo.especiales.has(toInt(e['idEspecial'])));
    const dotesQuitadas = diferencia(colA.dotes ?? [], colD.dotes ?? []).quitados.filter((d) => delAmo.dotes.has(toInt(d['idDote'])));
    if (especialesQuitados.length < 1 && dotesQuitadas.length < 1)
        return ficha;
    const resultado: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(ficha));
    const col: any = resultado.colecciones = { ...(resultado.colecciones ?? {}) } as PersonajeCreateRequestDto['colecciones'];
    col.especiales = [...(col.especiales ?? [])];
    col.dotes = [...(col.dotes ?? [])];
    especialesQuitados.forEach((e) => sacarPrimero(col.especiales,
        (x: any) => toInt(x?.idEspecial) === toInt(e['idEspecial']) && mismoExtra(x?.idExtra, e['idExtra'])));
    dotesQuitadas.forEach((d) => sacarDoteDeLaFicha(col.dotes, toInt(d['idDote']), toInt(d['idExtra']), `${d['origen'] ?? ''}`.trim() || null));
    return resultado;
}

/**
 * La pérdida de un nivel (`resultado`, de `perdidaDelNivel`; sin `nivel`, la de la Constitución con un solo DG) con sus
 * mascotas puestas al día: en el motor, sin el nivel (`quitarElNivelDelMotor`), se vuelven a juzgar (`ponerMascotasAlDia`)
 * y la ficha lleva lo que cambia en ellas (sus valores o inactivas, con los rangos «todo o nada» del compañero y los PG del
 * familiar con los nuevos de su amo) y lo que el amo pierde por ellas (Alerta y sus rangos varios, el vínculo). El motor se
 * queda como estaba. Sin mascotas, la misma.
 */
export function perdidaConSusMascotas(svc: NuevoPersonajeService, motor: MotorDesdeFichaService, entrada: PersonajeCreateRequestDto,
    resultado: ResultadoPerdida, nivel: { idClase: number; indice: number; } | null): { resultado: ResultadoPerdida; estado: EstadoDeLasMascotas; } {
    if (!entrada.companero && !entrada.familiar)
        return { resultado, estado: {} };
    const guardado = svc.exportarEstadoSubida();
    try {
        if (nivel)
            quitarElNivelDelMotor(svc, resultado, nivel.idClase, nivel.indice);
        const antes = motor.cuerpoDelMotor(svc, entrada);
        const estado = svc.ponerMascotasAlDia();
        const despues = motor.cuerpoDelMotor(svc, entrada);
        const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(resultado.ficha));
        conLasMascotasDelMotor(ficha, antes, despues);
        aplicarLoQueDanLasDotes(ficha, antes, despues);
        return { resultado: { ...resultado, ficha: sinLoQueYaNoDaLaMascota(ficha, antes, despues, svc.loQueDanLasMascotasAlAmo()) }, estado };
    } finally {
        svc.restaurarEstadoSubida(guardado);
    }
}

/** El porqué de las filas de la mascota en los resúmenes que lo piden (`cambiosDeLasMascotas`). */
const PORQUE_DE_LA_MASCOTA = 'Su mascota se juzga otra vez con lo que tiene ahora su amo (Guía del DM, pág. 295; Manual del jugador, págs. 35 y 44)';

/** Una fila de «Lo que cambia» de la mascota: qué, antes, ahora. */
export interface FilaDeLaMascota {
    que: string;
    antes: string;
    ahora: string;
}

/** Lo que lleva el compañero por su nivel, para «Lo que cambia». */
function valoresDelCompanero(c: PersonajeCreateCompaneroDto): string {
    const trucos = toInt(c.trucosAdi);
    return `${textoConSigno(toInt(c.dgAdi))} DG, ${trucos} ${trucos === 1 ? 'truco' : 'trucos'}, Fue ${toInt(c.fuerza)}, Des ${toInt(c.destreza)}, `
        + `armadura natural ${toInt(c.armaduraNatural)}, ${toInt(c.vida)} PG`;
}

/** Lo que lleva el familiar por su amo, para «Lo que cambia». */
function valoresDelFamiliar(f: PersonajeCreateFamiliarDto): string {
    const rc = /\d/.test(`${f.rc ?? ''}`) ? `RC ${f.rc}` : 'sin RC';
    return `${toInt(f.vida)} PG, ataque base ${textoConSigno(toInt(f.ataqueBase))}, armadura natural ${toInt(f.armaduraNatural)}, `
        + `Int ${toInt(f.inteligencia)}, ${rc}`;
}

/**
 * El título de sus filas: «Compañero animal (Gruk)»; sin nombre, «Compañero animal (compañero animal)». También el de sus
 * rangos al completar el compañero (`completar-companero.rangosQueCambian`).
 */
export function tituloDeLaMascota(que: string, mascota: { nombre?: string | null; }): string {
    return `${que} (${`${mascota.nombre ?? ''}`.trim() || que.toLocaleLowerCase('es')})`;
}

function filaDeLaMascota<T extends { nombre: string; inactiva?: boolean; }>(que: string, antes: T, despues: T,
    valores: (m: T) => string, estado: EstadoDeLaMascota | undefined): FilaDeLaMascota | null {
    const titulo = tituloDeLaMascota(que, despues);
    // Las frases de la API (`utils/mascota_inactiva.py`; contrato: `personajes.md`, «Las frases de "queda inactivo"»).
    if (despues.inactiva && !antes.inactiva) {
        const motivo = `${estado?.motivo ?? ''}`.trim();
        return {
            que: titulo, antes: valores(antes),
            ahora: `${motivo ? `${motivo}: queda` : 'Queda'} inactivo hasta que vuelva a cumplir. Vale su criatura tal cual y el amo pierde lo que le daba`,
        };
    }
    if (antes.inactiva && !despues.inactiva)
        return { que: titulo, antes: 'Inactivo', ahora: `Vuelve a cumplir lo que pide su fila: ya no está inactivo (${valores(despues)})` };
    if (despues.inactiva)
        return null;
    const a = valores(antes);
    const d = valores(despues);
    return a === d ? null : { que: titulo, antes: a, ahora: d };
}

/** Los nombres de lo que elige el compañero (sus dotes, sus trucos y sus habilidades, por su id), para «Lo que cambia». */
export interface NombresDeLaMascota {
    dote(idDote: number): string;
    truco(idTruco: number): string;
    habilidad(idHabilidad: number): string;
}

/** Sin catálogos: el id («dote 49»). */
const NOMBRES_POR_ID: NombresDeLaMascota = {
    dote: (id) => `dote ${id}`,
    truco: (id) => `truco ${id}`,
    habilidad: (id) => `habilidad ${id}`,
};

/** Una lista para «Lo que cambia»: sus elementos separados por comas, o «Ninguna». */
function lista(elementos: string[]): string {
    return elementos.length > 0 ? elementos.join(', ') : 'Ninguna';
}

/**
 * Lo que elige el compañero con sus DG adicionales y su tabla, para «Lo que cambia» (contrato: `personajes.md`, «Las dotes y
 * las mejoras que elige el compañero» y «Los trucos del compañero»): las dotes elegidas (las que llevan `dg`) con su DG, las
 * mejoras de característica con el suyo y los trucos adicionales por su orden. Una fila por lo que cambia.
 */
function filasDeLoQueElige(titulo: string, antes: PersonajeCreateCompaneroDto, despues: PersonajeCreateCompaneroDto,
    nombres: NombresDeLaMascota): FilaDeLaMascota[] {
    const dotes = (c: PersonajeCreateCompaneroDto) => (c.dotes ?? [])
        .filter((d) => toInt(d.dg) > 0)
        .sort((a, b) => toInt(a.dg) - toInt(b.dg))
        .map((d) => `${nombres.dote(toInt(d.idDote))} (DG ${toInt(d.dg)})`);
    const mejoras = (c: PersonajeCreateCompaneroDto) => (c.mejoras ?? [])
        .slice()
        .sort((a, b) => toInt(a.dg) - toInt(b.dg))
        .map((m) => {
            const caracteristica = caracteristicaPorId(toInt(m.idCaracteristica));
            return `+1 ${caracteristica ? abreviaturaCaracteristica(caracteristica) : `característica ${toInt(m.idCaracteristica)}`} (DG ${toInt(m.dg)})`;
        });
    const adicionales = (c: PersonajeCreateCompaneroDto) => (c.trucos ?? [])
        .filter((t) => t.origen === 'adicional')
        .sort((a, b) => toInt(a.orden) - toInt(b.orden))
        .map((t) => nombres.truco(toInt(t.idTruco)));
    const filas: FilaDeLaMascota[] = [];
    ([['dotes elegidas', dotes], ['mejoras de característica', mejoras], ['trucos adicionales', adicionales]] as const)
        .forEach(([que, de]) => {
            const a = lista(de(antes));
            const d = lista(de(despues));
            if (a !== d)
                filas.push({ que: `${titulo}: ${que}`, antes: a, ahora: d });
        });
    return filas;
}

/**
 * Lo que cambia en las mascotas entre la `entrada` y la `ficha` que se manda, para «Lo que cambia» de cada vía: sus valores
 * de ahora o que queda inactiva hasta que vuelva a cumplir, con el motivo (`estado`, de `ponerMascotasAlDia`), o que vuelve
 * a estar activa; y, del compañero activo, las dotes elegidas, las mejoras y los trucos adicionales que gana o pierde, con
 * sus `nombres` (de los catálogos del motor: `NuevoPersonajeService.nombresDeLoQueEligeLaMascota`). Sin cambios, nada.
 */
export function filasDeLasMascotas(entrada: PersonajeCreateRequestDto, ficha: PersonajeCreateRequestDto,
    estado: EstadoDeLasMascotas, nombres: NombresDeLaMascota = NOMBRES_POR_ID): FilaDeLaMascota[] {
    const filas: FilaDeLaMascota[] = [];
    if (entrada.companero && ficha.companero) {
        const fila = filaDeLaMascota('Compañero animal', entrada.companero, ficha.companero, valoresDelCompanero, estado.companero);
        if (fila)
            filas.push(fila);
        // Inactivo vale su criatura tal cual: ya lo dice su fila.
        if (!ficha.companero.inactiva) {
            filas.push(...filasDeLoQueElige(tituloDeLaMascota('Compañero animal', ficha.companero), entrada.companero, ficha.companero, nombres));
        }
    }
    if (entrada.familiar && ficha.familiar) {
        const fila = filaDeLaMascota('Familiar', entrada.familiar, ficha.familiar, valoresDelFamiliar, estado.familiar);
        if (fila)
            filas.push(fila);
    }
    return filas;
}

/**
 * Las filas de la mascota en «Lo que cambia» de las vías que lo piden (adquirir una plantilla o una raza mutada, devolver
 * la vida, subir de nivel), con su porqué (`PORQUE_DE_LA_MASCOTA`): las de `filasDeLasMascotas`. Sin mascota, ninguna, y
 * la `ficha` (lo que se manda) no se arma.
 */
export function cambiosDeLasMascotas(entrada: PersonajeCreateRequestDto, ficha: () => PersonajeCreateRequestDto,
    estado: EstadoDeLasMascotas, nombres: NombresDeLaMascota = NOMBRES_POR_ID): Array<FilaDeLaMascota & { porque: string; }> {
    if (!entrada.companero && !entrada.familiar)
        return [];
    return filasDeLasMascotas(entrada, ficha(), estado, nombres).map((fila) => ({ ...fila, porque: PORQUE_DE_LA_MASCOTA }));
}
