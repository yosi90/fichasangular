import { PersonajeCreateCompaneroDto, PersonajeCreateFamiliarDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import type { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import type { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
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

/** Cómo queda una mascota al ponerla al día y, si está inactiva, por qué (la frase de su fila). */
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

/** El porqué de las filas de la mascota en los resúmenes que lo piden (la plantilla, la raza mutada, la vuelta a la vida). */
export const PORQUE_DE_LA_MASCOTA = 'Su mascota se juzga otra vez con lo que tiene ahora su amo (Guía del DM, pág. 295; Manual del jugador, págs. 35 y 44)';

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

/** La frase de la fila, en minúscula para seguir a los dos puntos. */
function enMinuscula(texto: string): string {
    const t = `${texto ?? ''}`.trim();
    return t ? `${t.charAt(0).toLocaleLowerCase('es')}${t.slice(1)}` : '';
}

function filaDeLaMascota<T extends { nombre: string; inactiva?: boolean; }>(que: string, antes: T, despues: T,
    valores: (m: T) => string, estado: EstadoDeLaMascota | undefined): FilaDeLaMascota | null {
    const titulo = `${que} (${`${despues.nombre ?? ''}`.trim() || que.toLocaleLowerCase('es')})`;
    if (despues.inactiva && !antes.inactiva) {
        const motivo = enMinuscula(estado?.motivo ?? '');
        return {
            que: titulo, antes: valores(antes),
            ahora: `Queda inactivo hasta que vuelva a cumplir${motivo ? `: ${motivo}` : ''}. Vale su criatura tal cual y el amo pierde lo que le daba`,
        };
    }
    if (antes.inactiva && !despues.inactiva)
        return { que: titulo, antes: 'Inactivo', ahora: `Vuelve a cumplir su fila y está activo otra vez: ${valores(despues)}` };
    if (despues.inactiva)
        return null;
    const a = valores(antes);
    const d = valores(despues);
    return a === d ? null : { que: titulo, antes: a, ahora: d };
}

/**
 * Lo que cambia en las mascotas entre la `entrada` y la `ficha` que se manda, para «Lo que cambia» de cada vía: sus valores
 * de ahora o que queda inactiva hasta que vuelva a cumplir, con el motivo (`estado`, de `ponerMascotasAlDia`), o que vuelve
 * a estar activa. Sin cambios, nada.
 */
export function filasDeLasMascotas(entrada: PersonajeCreateRequestDto, ficha: PersonajeCreateRequestDto,
    estado: EstadoDeLasMascotas): FilaDeLaMascota[] {
    const filas: FilaDeLaMascota[] = [];
    if (entrada.companero && ficha.companero) {
        const fila = filaDeLaMascota('Compañero animal', entrada.companero, ficha.companero, valoresDelCompanero, estado.companero);
        if (fila)
            filas.push(fila);
    }
    if (entrada.familiar && ficha.familiar) {
        const fila = filaDeLaMascota('Familiar', entrada.familiar, ficha.familiar, valoresDelFamiliar, estado.familiar);
        if (fila)
            filas.push(fila);
    }
    return filas;
}
