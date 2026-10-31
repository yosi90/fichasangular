import { Personaje } from 'src/app/interfaces/personaje';
import { ListaLanzamientoRaza } from 'src/app/interfaces/raza';
import { nombreEdadEnFrase } from 'src/app/services/utils/razas-por-edades';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { esPnj, textoNivelPersonaje } from 'src/app/services/utils/tipo-personaje';
import { EtiquetaFicha, unirLista } from './ficha';

/*
 * Lo que enseña la ficha de un personaje de una raza que crece por edades y de una raza que lanza conjuros (lienzo de los
 * dragones jugables, tablero 3; `docs/publica/DRAGONES_FRONT.md`): la raza con su edad, las aptitudes con su cifra y su
 * CD, y el lanzamiento racial. Todo lo calcula la API (`categoriaEdad`, `rac[].Valor` y `.Cd`, `lanzamientoRacial`); la
 * ficha solo lo pinta.
 */

/** «Dragón rojo · adulto maduro»; sin edad, la raza. */
export function razaConCategoriaPersonaje(pj: Personaje | null | undefined): string {
    const raza = `${pj?.Raza?.Nombre ?? ''}`.trim();
    const categoria = nombreEdadEnFrase(pj?.CategoriaEdad?.categoria?.Nombre);
    return [raza, categoria].filter((parte) => parte.length > 0).join(' · ');
}

/** Las etiquetas del tipo de la cabecera: «PNJ» y su nivel («VD 18»); un PJ no lleva ninguna. */
export function etiquetasTipoPersonaje(pj: Personaje | null | undefined): EtiquetaFicha[] {
    if (!pj || !esPnj(pj.tipo))
        return [];
    const nivel = textoNivelPersonaje({ tipo: pj.tipo, vd: pj.vd });
    return [
        { texto: 'PNJ', ayuda: 'Personaje no jugador: no sigue la política de creación de la campaña' },
        ...(nivel ? [{ texto: nivel, ayuda: 'Valor de desafío orientativo (Manual de monstruos, pág. 294)' }] : []),
    ];
}

export interface AptitudesDeEdadFicha {
    titulo: string;
    filas: { nombre: string; valor: string; }[];
}

/**
 * «Aptitudes de dragón · adulto maduro»: los raciales que traen una cifra a su edad (`Valor`) o una CD (`Cd`), con ellas
 * («14d10 · CD 28»). El título sale del tipo de criatura y de la edad; sin edad, «Aptitudes con CD». `null` si ningún
 * racial trae nada de eso.
 */
export function aptitudesDeEdadPersonaje(pj: Personaje | null | undefined): AptitudesDeEdadFicha | null {
    const filas = (pj?.Raciales ?? [])
        .filter((racial) => `${racial?.Nombre ?? ''}`.trim().length > 0 && (!!`${racial?.Valor ?? ''}`.trim() || typeof racial?.Cd === 'number'))
        .map((racial) => ({
            nombre: `${racial.Nombre}`.trim(),
            valor: [`${racial.Valor ?? ''}`.trim(), typeof racial.Cd === 'number' ? `CD ${racial.Cd}` : '']
                .filter((parte) => parte.length > 0).join(' · '),
        }));
    if (filas.length < 1)
        return null;
    const tipo = nombreEdadEnFrase(pj?.Tipo_criatura?.Nombre);
    const categoria = nombreEdadEnFrase(pj?.CategoriaEdad?.categoria?.Nombre);
    const titulo = categoria
        ? [tipo ? `Aptitudes de ${tipo}` : 'Aptitudes de su edad', categoria].join(' · ')
        : 'Aptitudes con CD';
    return { titulo, filas };
}

export interface LanzamientoRacialFicha {
    texto: string;
    detalle: string;
    caracteristica: string | null;
    conjuros: { nivel: string; total: number; }[];
    listas: string | null;
}

/**
 * El lanzamiento racial (*Draconomicón*, pág. 24): «Lanza conjuros como un hechicero de nivel 9», de dónde sale el nivel
 * («9 por su edad + 0 niveles de hechicero»), su característica y sus conjuros al día. `null` si su raza no lanza.
 */
export function lanzamientoRacialPersonaje(pj: Personaje | null | undefined): LanzamientoRacialFicha | null {
    const lanzamiento = pj?.LanzamientoRacial;
    if (!lanzamiento)
        return null;
    const clase = nombreEdadEnFrase(lanzamiento.clase.nombre);
    const origen = pj?.CategoriaEdad ? 'por su edad' : 'por su raza';
    const niveles = lanzamiento.nivelesClase === 1 ? 'nivel' : 'niveles';
    const caracteristica = lanzamiento.caracteristicaLanzamiento
        ? `${lanzamiento.caracteristicaLanzamiento}${typeof lanzamiento.modificadorLanzamiento === 'number' ? ` (${textoConSigno(lanzamiento.modificadorLanzamiento)})` : ''}`
        : null;
    return {
        texto: `Lanza conjuros como un ${clase} de nivel ${lanzamiento.nivel}`,
        detalle: `${lanzamiento.nivelRacial} ${origen} + ${lanzamiento.nivelesClase} ${niveles} de ${clase}. Si sube niveles de ${clase}, se suman.`,
        caracteristica,
        conjuros: (lanzamiento.conjurosDiarios ?? [])
            .filter((fila) => fila?.puedeLanzar !== false)
            .map((fila) => ({ nivel: Number(fila.nivel) === 0 ? '0' : `${fila.nivel}.º`, total: Number(fila.total) || 0 })),
        listas: textoListasRaciales(lanzamiento.listas ?? []),
    };
}

/** «También lanza como arcanos los conjuros de clérigo y de los dominios de Aire, Ley y Mal.»; sin listas, `null`. */
function textoListasRaciales(listas: Pick<ListaLanzamientoRaza, 'Tipo' | 'Nombre'>[]): string | null {
    const conNombre = listas.filter((lista) => lista.Nombre.length > 0);
    const clases = conNombre.filter((lista) => lista.Tipo === 'clase').map((lista) => lista.Nombre.toLocaleLowerCase('es'));
    const dominios = conNombre.filter((lista) => lista.Tipo === 'dominio').map((lista) => lista.Nombre);
    const partes = [
        clases.length > 0 ? `de ${unirLista(clases, 'y')}` : '',
        dominios.length === 1 ? `del dominio de ${dominios[0]}` : dominios.length > 1 ? `de los dominios de ${unirLista(dominios, 'y')}` : '',
    ].filter((parte) => parte.length > 0);
    return partes.length > 0 ? `También lanza como arcanos los conjuros ${partes.join(' y ')}.` : null;
}
