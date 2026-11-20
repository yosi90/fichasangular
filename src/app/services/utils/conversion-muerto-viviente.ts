import { Caracteristica } from 'src/app/interfaces/caracteristica';
import { PersonajeCreateNivelDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { EspecialSustituido, Raza } from 'src/app/interfaces/raza';
import { EntradaFichaMutacion, fichaDeLaMutacion } from './adquirir-raza-mutada';
import { dgsRacialesQueCuentan } from './nivel-personaje';
import { toInt } from './normalizacion';
import { marcarDotesSinPrerrequisitos, pxTrasPerder } from './perder-nivel';
import { conElNivelNuevo, PgSubida, pgTrasCambioDeCon } from './subida-nivel';

/*
 * Convertirse en muerto viviente (*Libris Mortis*, pág. 34; contrato en `docs/publica/endpoints/personajes.md`, «Convertirse
 * en muerto viviente»; reglas en el dictamen del máster de Rol del 2026-11-20, en el roadmap de sesiones): es adquirir una
 * raza mutada que lleva una clase de monstruo (`Clase_de_monstruo`), en la misma ruta. Pierde el último nivel de clase, como
 * en «Perder un nivel» (`perder-nivel.ts`), y gana el 1.er nivel de su clase de monstruo, como en la subida
 * (`subida-nivel.ts`). Todo sale de los datos de la raza y de la clase, nunca de su nombre. Lo usa
 * `components/sesiones/adquirir-raza-mutada`.
 */

/** Si adquirir la raza es convertirse en muerto viviente: lleva una clase de monstruo (`Clase_de_monstruo`). */
export function esConversion(raza: Pick<Raza, 'Clase_de_monstruo'> | null | undefined): boolean {
    return toInt(raza?.Clase_de_monstruo?.Id) > 0;
}

/** La frase de la API (`409 conversion_sin_constitucion`): un personaje sin Constitución no se convierte. */
export const MOTIVO_SIN_CONSTITUCION = 'Solo un personaje vivo se convierte en muerto viviente: no tiene Constitución.';

/**
 * Si tiene una puntuación de Constitución: ni su tipo ni sus plantillas se la quitan (`perdidasDelMotor`, las del motor con
 * su tipo de ahora) y su ficha no la tiene perdida.
 */
export function tieneConstitucion(entrada: PersonajeCreateRequestDto | null | undefined,
    perdidasDelMotor: Partial<Record<Caracteristica, boolean>>): boolean {
    return !perdidasDelMotor.Constitucion && !entrada?.caracteristicas?.constitucion?.perdido;
}

/**
 * Los PX tras la conversión, como al perder un nivel por volver a la vida, con el NEP de justo después de perderlo
 * (`nepTrasPerder`): la mitad entre el mínimo de ese nivel y el del siguiente, o los suyos si ya tenía menos. Sin nivel
 * que perder (solo DG raciales), los mismos. Sin NEP tras perderlo (el humano guerrero 1), 0.
 */
export function pxTrasLaConversion(px: number, nepTrasPerder: number, pierdeNivel: boolean): number {
    const actuales = Math.max(0, toInt(px));
    if (!pierdeNivel)
        return actuales;
    return toInt(nepTrasPerder) < 1 ? 0 : pxTrasPerder(actuales, nepTrasPerder);
}

type RazaDelNep = Pick<Raza, 'Ajuste_nivel' | 'Dgs_adicionales'>;

/**
 * El NEP de justo después de perder el nivel y el de después de la conversión: el de ahora con un nivel menos (si lo
 * pierde) y uno más de la clase de monstruo, y con el ajuste y los DG raciales que cuentan de la raza combinada en lugar de
 * los de su raza de antes. El guerrero enano 5 queda en 5; el gnoll (sin niveles de clase), de 3 a 4; el drow mago 1, en 3.
 */
export function nepTrasLaConversion(nepAntes: number, anterior: RazaDelNep, combinada: RazaDelNep, nivelesClaseAntes: number,
    pierdeNivel: boolean): { trasPerder: number; despues: number; } {
    const perdidos = pierdeNivel ? 1 : 0;
    const trasPerder = Math.max(0, toInt(nepAntes) - perdidos);
    const nivelesDespues = Math.max(0, toInt(nivelesClaseAntes) - perdidos) + 1;
    const dgs = (raza: RazaDelNep) => Math.max(0, toInt(raza?.Dgs_adicionales?.Cantidad));
    const despues = trasPerder + 1 - toInt(anterior?.Ajuste_nivel) + toInt(combinada?.Ajuste_nivel)
        - dgsRacialesQueCuentan(dgs(anterior), nivelesClaseAntes) + dgsRacialesQueCuentan(dgs(combinada), nivelesDespues);
    return { trasPerder, despues: Math.max(0, despues) };
}

/**
 * Los PG tras la conversión: los de la ficha sin el nivel que pierde (`sinElNivel`, la de `fichaSinElNivel`, o la `entrada`
 * si no pierde ninguno), sin la Constitución en ningún DG (se le trata como si no la tuviera) y con el DG nuevo de la clase
 * de monstruo: `tirada`, o sus caras si es su primer DG (va al máximo). `dgsTrasPerder`, los DG que le quedan.
 */
export function pgDeLaConversion(sinElNivel: PersonajeCreateRequestDto, dgsTrasPerder: number, tirada: number | null): PgSubida {
    return pgTrasCambioDeCon(sinElNivel, Math.max(0, toInt(dgsTrasPerder)), 0, tirada);
}

/**
 * Las aptitudes de la lista que sustituye la raza (`Especiales_sustituidos`), ya cambiadas por la nueva y sin repetir:
 * la ficha de la conversión las manda así (*Libris Mortis*, pág. 35).
 */
export function especialesSustituidos(lista: ReadonlyArray<Record<string, any>> | undefined,
    sustituidos: ReadonlyArray<EspecialSustituido> | undefined): Array<Record<string, any>> {
    const porId = new Map((sustituidos ?? []).map((s) => [toInt(s?.Especial?.Id), toInt(s?.Especial_nuevo?.Id)]));
    const resultado: Array<Record<string, any>> = [];
    (lista ?? []).forEach((e) => {
        const nuevo = porId.get(toInt(e?.['idEspecial']));
        const especial: Record<string, any> = nuevo ? { ...e, idEspecial: nuevo } : { ...e };
        if (!resultado.some((r) => toInt(r['idEspecial']) === toInt(especial['idEspecial']) && toInt(r['idExtra']) === toInt(especial['idExtra'])))
            resultado.push(especial);
    });
    return resultado;
}

export interface EntradaFichaConversion extends EntradaFichaMutacion {
    /** La clase de monstruo y su 1.er nivel, con lo que se eligió en él. */
    idClaseDeMonstruo: number;
    nivel: PersonajeCreateNivelDto;
    /** Las aptitudes que sustituye la raza (`Especiales_sustituidos` de la combinada). */
    sustituidos: ReadonlyArray<EspecialSustituido>;
    /** Las dotes que dejan de cumplir un prerrequisito: se conservan sin poder usarse (`sinPrerrequisitos`). */
    sinPrerrequisitos: ReadonlyArray<{ idDote: number; idExtra: number; origen?: string; }>;
}

/**
 * La ficha de la conversión (`POST /personajes/{id}/raza-mutada` con `pg` e `idClase`): la de la raza mutada
 * (`fichaDeLaMutacion`) sobre la ficha sin el nivel que pierde (`entrada`, la de `fichaSinElNivel`, o la de la sesión si no
 * pierde ninguno), con la Constitución perdida y su puntuación (`aplicarCaracteristicasDelMotor`), la clase de monstruo a
 * nivel 1, el nivel nuevo al final de los guardados, las aptitudes ya sustituidas y las dotes que dejan de cumplirse con
 * `sinPrerrequisitos`. Los idiomas solo se suman (no están en `LISTAS_DE_LA_RAZA`).
 */
export function fichaDeLaConversion(datos: EntradaFichaConversion): PersonajeCreateRequestDto {
    const ficha = fichaDeLaMutacion(datos);
    conElNivelNuevo(ficha, datos.entrada.niveles, datos.idClaseDeMonstruo, datos.nivel);
    const col: any = ficha.colecciones;
    col.especiales = especialesSustituidos(col.especiales, datos.sustituidos);
    return marcarDotesSinPrerrequisitos(ficha, datos.sinPrerrequisitos);
}
