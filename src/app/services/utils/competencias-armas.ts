import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { leerComodin } from './comodin';
import { normalizarTexto, toNumber } from './normalizacion';

/** Una competencia (con un arma o con un grupo de armas) como la comparan los prerrequisitos: su id y su nombre. */
export interface CompetenciaArmaRef {
    id: number | null;
    nombre: string;
}

/** Un arma del catálogo con su tipo (sencilla, marcial, exótica), o un grupo con el tipo de arma que cubre. */
export interface ElementoConTipoArma {
    Id: number;
    Nombre: string;
    Id_tipo_arma?: number | null;
}

/** Las competencias que da un catálogo (`Competencias` de la clase o de la raza): `{ Id, Nombre }` → `{ id, nombre }`. */
export function competenciasDeCatalogo(referencias: any[] | null | undefined): CompetenciaArmaRef[] {
    return (Array.isArray(referencias) ? referencias : [])
        .map((ref: any) => {
            const id = toNumber(ref?.Id ?? ref?.id);
            return { id: id > 0 ? id : null, nombre: `${ref?.Nombre ?? ref?.nombre ?? ''}`.trim() };
        })
        .filter((ref) => ref.id !== null || ref.nombre.length > 0);
}

/**
 * Las competencias que dan las dotes del personaje (`Competencias_otorgadas`, MJ cap. 5): con Competencia con arma
 * marcial o exótica, el arma elegida como extra (el arma «Elegir» de la dote); con Competencia con arma sencilla, el grupo.
 */
export function competenciasDeDotes(dotes: DoteContextual[] | null | undefined): { armas: CompetenciaArmaRef[]; grupos: CompetenciaArmaRef[]; } {
    const armas: CompetenciaArmaRef[] = [];
    const grupos: CompetenciaArmaRef[] = [];
    (dotes ?? []).forEach((item) => {
        const otorgadas = item?.Dote?.Competencias_otorgadas;
        (otorgadas?.Armas ?? []).forEach((arma) => {
            if (leerComodin(arma?.Arma_comodin) === 'elegir') {
                const idExtra = toNumber(item?.Contexto?.Id_extra);
                const extra = `${item?.Contexto?.Extra ?? ''}`.trim();
                if (idExtra > 0 || extra.length > 0)
                    armas.push({ id: idExtra > 0 ? idExtra : null, nombre: extra });
                return;
            }
            armas.push(...competenciasDeCatalogo([arma]));
        });
        grupos.push(...competenciasDeCatalogo(otorgadas?.Grupos_arma ?? []));
    });
    return { armas, grupos };
}

/**
 * Las armas con las que se es competente por los grupos («Todas las armas marciales»): cada grupo cubre un tipo de arma
 * (`Tipo_arma` del grupo, en los datos) y da competencia con todas las armas de ese tipo. Un grupo sin tipo (las armas
 * naturales propias) no da ninguna arma del catálogo.
 */
export function armasDeGrupos(
    grupos: CompetenciaArmaRef[],
    catalogoGrupos: ElementoConTipoArma[],
    catalogoArmas: ElementoConTipoArma[]
): CompetenciaArmaRef[] {
    const tipos = new Set<number>();
    grupos.forEach((grupo) => {
        const id = toNumber(grupo?.id);
        const nombre = normalizarTexto(grupo?.nombre ?? '');
        const encontrado = (catalogoGrupos ?? []).find((item) =>
            (id > 0 && toNumber(item?.Id) === id) || (id <= 0 && nombre.length > 0 && normalizarTexto(item?.Nombre ?? '') === nombre));
        const tipo = toNumber(encontrado?.Id_tipo_arma);
        if (tipo > 0)
            tipos.add(tipo);
    });
    if (tipos.size < 1)
        return [];
    return (catalogoArmas ?? [])
        .filter((arma) => toNumber(arma?.Id) > 0 && tipos.has(toNumber(arma?.Id_tipo_arma)))
        .map((arma) => ({ id: toNumber(arma.Id), nombre: `${arma?.Nombre ?? ''}`.trim() }));
}
