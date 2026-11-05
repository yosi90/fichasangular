import { TipoCriaturaCuerpo, TipoCriaturaEditable } from 'src/app/interfaces/tipo_criatura';
import { idsUnicosOrdenados, toInt } from './normalizacion';

/**
 * El formulario de «Insertar/Modificar tipo de criatura» (hito 9 del roadmap de inserciones): del tipo que da la API a los
 * valores del formulario y de ellos al cuerpo de `POST /tiposCriatura/add` y `PUT /tiposCriatura/<id>`. Guardar sin tocar
 * nada manda lo que llegó (comprobado con todos los tipos de `rol_dev` en `src/testing/ida-y-vuelta-criaturas-mundo.ts`).
 */

/** Lo que sabe una criatura de ese tipo (las columnas sí/no de `tipos`), con su etiqueta. */
export type BanderaTipoCriatura = 'come' | 'respira' | 'duerme' | 'criticos' | 'flanqueado' | 'pierde_cons';

export const BANDERAS_TIPO_CRIATURA: readonly { clave: BanderaTipoCriatura; etiqueta: string; }[] = [
    { clave: 'come', etiqueta: 'Come' },
    { clave: 'respira', etiqueta: 'Respira' },
    { clave: 'duerme', etiqueta: 'Duerme' },
    { clave: 'criticos', etiqueta: 'Recibe críticos' },
    { clave: 'flanqueado', etiqueta: 'Puede ser flanqueado' },
    { clave: 'pierde_cons', etiqueta: 'Pierde la Constitución' },
];

/** Los valores del formulario: los de `tipo` del cuerpo (los ids que faltan, `null`). */
export interface ValoresTipoCriatura extends Record<BanderaTipoCriatura, boolean> {
    nombre: string;
    descripcion: string;
    id_manual: number | null;
    pagina: number | null;
    id_tipo_dado: number | null;
    id_ataque: number | null;
    id_fortaleza: number | null;
    id_reflejos: number | null;
    id_voluntad: number | null;
    id_puntos_habilidad: number | null;
    limite_inteligencia: number | null;
    tesoro: string;
    id_alineamiento: number | null;
    oficial: boolean;
}

export function valoresVaciosDeTipoCriatura(): ValoresTipoCriatura {
    return {
        nombre: '', descripcion: '', id_manual: null, pagina: null, id_tipo_dado: null, id_ataque: null,
        id_fortaleza: null, id_reflejos: null, id_voluntad: null, id_puntos_habilidad: null,
        come: true, respira: true, duerme: true, criticos: true, flanqueado: true, pierde_cons: false,
        // -1: sin límite de Inteligencia, como casi todos los tipos.
        limite_inteligencia: -1, tesoro: '', id_alineamiento: null, oficial: true,
    };
}

export function valoresDeTipoCriatura(tipo: TipoCriaturaEditable): ValoresTipoCriatura {
    return {
        nombre: `${tipo.Nombre ?? ''}`,
        descripcion: `${tipo.Descripcion ?? ''}`,
        id_manual: tipo.Id_manual > 0 ? tipo.Id_manual : null,
        pagina: toInt(tipo.Pagina),
        id_tipo_dado: tipo.Id_tipo_dado > 0 ? tipo.Id_tipo_dado : null,
        id_ataque: tipo.Id_ataque > 0 ? tipo.Id_ataque : null,
        id_fortaleza: tipo.Id_fortaleza > 0 ? tipo.Id_fortaleza : null,
        id_reflejos: tipo.Id_reflejos > 0 ? tipo.Id_reflejos : null,
        id_voluntad: tipo.Id_voluntad > 0 ? tipo.Id_voluntad : null,
        id_puntos_habilidad: tipo.Id_puntos_habilidad > 0 ? tipo.Id_puntos_habilidad : null,
        come: tipo.Come === true,
        respira: tipo.Respira === true,
        duerme: tipo.Duerme === true,
        criticos: tipo.Recibe_criticos === true,
        flanqueado: tipo.Puede_ser_flanqueado === true,
        pierde_cons: tipo.Pierde_constitucion === true,
        limite_inteligencia: toInt(tipo.Limite_inteligencia, -1),
        tesoro: `${tipo.Tesoro ?? ''}`,
        id_alineamiento: toInt(tipo.Id_alineamiento),
        oficial: tipo.Oficial === true,
    };
}

/** El cuerpo de `POST /tiposCriatura/add` y `PUT /tiposCriatura/<id>`, con sus rasgos de menor a mayor. */
export function cuerpoDeTipoCriatura(valores: ValoresTipoCriatura, rasgos: readonly number[]): TipoCriaturaCuerpo {
    return {
        tipo: {
            nombre: `${valores.nombre ?? ''}`.trim(),
            descripcion: `${valores.descripcion ?? ''}`.trim(),
            id_manual: toInt(valores.id_manual),
            pagina: toInt(valores.pagina),
            id_tipo_dado: toInt(valores.id_tipo_dado),
            id_ataque: toInt(valores.id_ataque),
            id_fortaleza: toInt(valores.id_fortaleza),
            id_reflejos: toInt(valores.id_reflejos),
            id_voluntad: toInt(valores.id_voluntad),
            id_puntos_habilidad: toInt(valores.id_puntos_habilidad),
            come: valores.come === true,
            respira: valores.respira === true,
            duerme: valores.duerme === true,
            criticos: valores.criticos === true,
            flanqueado: valores.flanqueado === true,
            pierde_cons: valores.pierde_cons === true,
            limite_inteligencia: toInt(valores.limite_inteligencia, -1),
            // Sin tesoro propio, `null`: la API guarda el texto de relleno («No aplica»).
            tesoro: `${valores.tesoro ?? ''}`.trim() || null,
            id_alineamiento: toInt(valores.id_alineamiento),
            oficial: valores.oficial === true,
        },
        rasgos: idsUnicosOrdenados(rasgos),
    };
}
