import { Dote } from 'src/app/interfaces/dote';
import { PrerequisiteRowModel, PrerequisiteType } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.models';
import { getPrerequisiteDefinition } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.registry';
import { ID_DE_LECTURA, filaDeLectura } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-lectura';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA } from './habilidad-extra-visible';
import { toInt, toText } from './normalizacion';

/**
 * «Modificar dote» (hito 4 del roadmap de inserciones): la dote de `GET /dotes/<id>` como el estado del formulario de
 * `nueva-dote`, para que guardar sin cambios mande lo mismo que hay (`PUT /dotes/<id>` reemplaza la dote entera).
 */

/** Una fila de «Habilidades otorgadas» del formulario. `id_extra` `ID_EXTRA_HABILIDAD_SIN_EXTRA` (-1): sin extra (0 es el extra «Elegir»). */
export interface HabilidadOtorgadaFila {
    id_habilidad: number;
    id_extra: number;
    rangos: number;
    /** De `habilidades_custom` (la dote lo dice al cargarla; si no, el formulario lo deduce del catálogo). */
    custom?: boolean;
}

export interface ModificadorFila {
    key: string;
    value: number;
}

/**
 * Un prerrequisito que el editor compartido no puede enseñar como fila y que se devuelve tal cual al guardar: los que
 * apuntan al comodín 0 de su catálogo (la «Competencia con el arma elegida» de Soltura con un arma, `Id_arma` 0).
 */
export interface PrerrequisitoConservado {
    fila: PrerequisiteRowModel;
    frase: string;
}

/** Las claves de `Modificadores` de la lectura que no son la de la escritura en minúscula. */
const MODIFICADOR_DE_LECTURA: Readonly<Record<string, string>> = {
    Armadura_natural: 'arm_nat',
    Ataque_base: 'ata_base',
};

/** Los modificadores de la dote distintos de 0, como filas del formulario (con la clave del alta). */
export function modificadoresDeDote(dote: Dote): ModificadorFila[] {
    return Object.entries(dote?.Modificadores ?? {})
        .map(([clave, valor]) => ({ key: MODIFICADOR_DE_LECTURA[clave] ?? clave.toLowerCase(), value: toInt(valor) }))
        .filter((fila) => fila.value !== 0);
}

export function habilidadesOtorgadasDeDote(dote: Dote): HabilidadOtorgadaFila[] {
    return (dote?.Habilidades_otorgadas ?? []).map((habilidad) => ({
        id_habilidad: toInt(habilidad.Id_habilidad),
        id_extra: habilidad.Id_extra === null || habilidad.Id_extra === undefined
            ? ID_EXTRA_HABILIDAD_SIN_EXTRA
            : toInt(habilidad.Id_extra, ID_EXTRA_HABILIDAD_SIN_EXTRA),
        rangos: toInt(habilidad.Rangos),
        custom: habilidad.Custom === true,
    }));
}

/** Los ids de `Extras_disponibles` de la dote, por la clave del alta (el 0 «Elegir» incluido). */
export function extrasDisponiblesDeDote(dote: Dote): { armas: number[]; armaduras: number[]; escuelas: number[]; habilidades: number[]; } {
    const ids = (items: { Id: number; }[] | undefined) => (items ?? []).map((item) => toInt(item?.Id, -1)).filter((id) => id >= 0);
    return {
        armas: ids(dote?.Extras_disponibles?.Armas),
        armaduras: ids(dote?.Extras_disponibles?.Armaduras),
        escuelas: ids(dote?.Extras_disponibles?.Escuelas),
        habilidades: ids(dote?.Extras_disponibles?.Habilidades),
    };
}

/**
 * Los prerrequisitos de la dote como filas del editor compartido, de los tipos que edita la dote (`tipos`): los demás
 * (los de Magic of Incarnum y la psiónica) no los escribe el alta y la edición los conserva. Las filas que apuntan al
 * comodín 0 de su catálogo y que el editor no puede elegir (los que no tienen `comodinLabel` en el registro) van aparte
 * (`conservados`), con la `Frase` de la API; la «Competencia con el arma elegida» ya es una fila.
 */
export function prerrequisitosDeDote(
    dote: Dote,
    tipos: ReadonlySet<PrerequisiteType>,
    uid: () => string,
): { filas: PrerequisiteRowModel[]; conservados: PrerrequisitoConservado[]; } {
    const filas: PrerequisiteRowModel[] = [];
    const conservados: PrerrequisitoConservado[] = [];
    Object.entries(dote?.Prerrequisitos ?? {}).forEach(([clave, items]) => {
        const tipo = clave as PrerequisiteType;
        if (!tipos.has(tipo))
            return;
        (items ?? []).forEach((item) => {
            const fila = filaDeLectura(tipo, item, uid());
            const definicion = getPrerequisiteDefinition(tipo);
            if (ID_DE_LECTURA[tipo] && fila.id <= 0 && tipo !== 'dote' && tipo !== 'clase_especial' && !definicion.isComplete(fila))
                conservados.push({ fila, frase: toText(item?.Frase).trim() || definicion.label });
            else
                filas.push(fila);
        });
    });
    return { filas, conservados };
}
