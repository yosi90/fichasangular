import { CARACTERISTICAS } from 'src/app/interfaces/caracteristica';
import { Clase } from 'src/app/interfaces/clase';
import { Personaje } from 'src/app/interfaces/personaje';
import { Plantilla } from 'src/app/interfaces/plantilla';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { ExperienciaPersonaje } from 'src/app/interfaces/sesiones';
import { unirLista } from 'src/app/components/detalles/ficha/ficha';
import { nombreExClase } from './alineamiento-clase';
import { caracteristicasPerdidasDe, NOMBRES_CARACTERISTICAS } from './caracteristicas';
import { normalizarTexto, toInt } from './normalizacion';
import { DecisionHomebrew } from './personaje-oficialidad';
import { experienciaParaNivel } from './experiencia-nivel';
import { formatoPx } from './sesiones-texto';
import { fichaConLoDelMotor, SE_CONSERVAN_PERSONAJE } from './subida-nivel';

/*
 * Adquirir una plantilla con el personaje ya creado (roadmap de sesiones, fase 7; guía `docs/publica/SESIONES_FRONT.md`,
 * «Adquirir una plantilla»): como la subida, la web parte de la `entrada` de la sesión abierta, hidrata el motor de la
 * creación, le añade la plantilla y manda a `POST /personajes/{id}/plantillas` la `entrada` con lo que cambia el motor.
 * Las reglas (dictamen del máster de Rol del 2026-11-13, en el roadmap): se adquieren las plantillas adquiridas
 * (`Nacimiento` false; Manual de monstruos, pág. 291), los PX no cambian y sube el NEP, y los DG que añade (los del animal
 * de un licántropo) se tiran con las tiradas de la campaña, nunca al máximo.
 */

/** Lo de `personaje` que no cambia al adquirir una plantilla: lo de la subida, salvo el tipo de criatura y el alineamiento. */
/**
 * Lo que pierde de su magia una ex clase (`Ex.Pierde_magia`): sus conjuros, dominios y moldeado y, si suma niveles de
 * lanzador a otra clase (`Aumenta_clase_lanzadora`), también esos (el ex hospitalario «pierde todos los rasgos de clase y
 * conjuros», El divino completo, pág. 48; la ficha de la API ya no los cuenta). Vacío si no pierde su magia.
 */
export function loQuePierdeDeSuMagia(clase: Pick<Clase, 'Ex' | 'Aumenta_clase_lanzadora'> | null | undefined): string[] {
    if (!clase?.Ex?.Pierde_magia)
        return [];
    return clase.Aumenta_clase_lanzadora ? ['su magia', 'los niveles de lanzador que suma a otra clase'] : ['su magia'];
}

export const SE_CONSERVAN_EN_PLANTILLA: ReadonlySet<string> = new Set(
    [...SE_CONSERVAN_PERSONAJE].filter((k) => k !== 'idTipoCriatura' && k !== 'idAlineamiento'));

/** Si una plantilla se puede adquirir con el personaje ya creado: una adquirida (no la de relleno, `Id` 0). */
export function esPlantillaAdquirible(plantilla: Pick<Plantilla, 'Id' | 'Nacimiento'> | null | undefined): boolean {
    return toInt(plantilla?.Id) > 0 && !plantilla?.Nacimiento;
}

export interface EntradaFichaPlantilla {
    entrada: PersonajeCreateRequestDto;
    antes: PersonajeCreateRequestDto;
    despues: PersonajeCreateRequestDto;
    idPlantilla: number;
    puntosGolpe: number;
    /** El alineamiento que deja la plantilla (una que lo fija, como el vampiro); `null`, el de la `entrada`. */
    idAlineamiento: number | null;
    /**
     * Las decisiones homebrew de la adquisición, que se suman a las de la ficha sin repetir: `requisitos_plantilla` (sin
     * sus prerrequisitos) y `alineamiento_clase` (una clase que se mantiene contra el alineamiento que fija).
     */
    decisionesNuevas?: DecisionHomebrew[];
}

/** La ficha de la adquisición: la `entrada` con lo que cambia el motor y la plantilla nueva en sus plantillas. */
export function fichaDeLaPlantilla(datos: EntradaFichaPlantilla): PersonajeCreateRequestDto {
    const ficha = fichaConLoDelMotor({ ...datos, seConservan: SE_CONSERVAN_EN_PLANTILLA });
    const col: any = ficha.colecciones;
    const previas = (datos.entrada.colecciones?.plantillas ?? []).map((p) => ({ idPlantilla: toInt(p?.idPlantilla) }));
    col.plantillas = [...previas.filter((p) => p.idPlantilla !== toInt(datos.idPlantilla)), { idPlantilla: toInt(datos.idPlantilla) }];
    if (toInt(datos.idAlineamiento) > 0)
        ficha.personaje.idAlineamiento = toInt(datos.idAlineamiento);
    if ((datos.decisionesNuevas ?? []).length > 0) {
        const decisiones = [...(ficha.decisionesHomebrew ?? [])];
        (datos.decisionesNuevas ?? []).forEach((nueva) => {
            if (!decisiones.some((d) => d.tipo === nueva.tipo && toInt(d.idElemento) === toInt(nueva.idElemento)))
                decisiones.push(nueva);
        });
        ficha.decisionesHomebrew = decisiones;
    }
    return ficha;
}

export interface EntradaPgPlantilla {
    /** La `entrada` guardada: los PG de ahora y los niveles con su tirada. */
    entrada: PersonajeCreateRequestDto;
    /** Sus DG de antes (su nivel de personaje): los que no tienen nivel guardado son raciales o de plantilla. */
    dgsAntes: number;
    modConAntes: number;
    /** Sin Constitución tras la plantilla (un muerto viviente), 0. */
    modConDespues: number;
    /** Las caras del DG de cada clase antes y después de la plantilla (`carasDadoGolpeDeClase` del motor). */
    carasClaseAntes: (idClase: number) => number;
    carasClaseDespues: (idClase: number) => number;
    /** Las de los DG sin nivel (raciales, de otra plantilla) antes y después (`carasDadoGolpeRacial`). */
    carasRacialAntes: number;
    carasRacialDespues: number;
    /** Lo que salió en cada DG nuevo de la plantilla y el modificador de Constitución con el que suman (la Con de su forma). */
    tiradasNuevas: number[];
    modConNuevos: number;
}

export interface PgPlantilla {
    total: number;
    /** Lo que suman los DG nuevos (cada uno, tirada + Con, al menos 1). */
    nuevos: number;
    /** Lo que cambian los DG de antes (el dado nuevo de una plantilla que los actualiza, la Constitución). */
    cambio: number;
    /** `false` si algún DG de antes no tiene su tirada y se ha calculado con la media del cambio. */
    exacto: boolean;
}

/** Lo que pasa un DG al dado nuevo, por el método de las medias (Especies salvajes, pág. 112): +(nuevas − viejas) / 2. */
function pasoDeDado(antes: number, despues: number): number {
    return antes > 0 && despues > 0 ? Math.trunc((despues - antes) / 2) : 0;
}

/**
 * Los PG tras adquirir la plantilla. Con una que actualiza los DG (el liche y el vampiro, d12: «todos los DG actuales»),
 * cada tirada guardada pasa a la del dado nuevo por el método de las medias, sin salirse de él, y el primer DG al máximo
 * (decisión del máster de Rol, fase 7: conserva la suerte del jugador; el máster la corrige si quiere); si cambia el
 * modificador de Constitución (la pierde un muerto viviente), cada DG suma la diferencia, sin bajar de 1. Los DG sin
 * tirada, con la media del cambio (y se avisa). Los DG nuevos (los del animal), tirada + la Con de su forma, al menos 1.
 */
export function puntosGolpeTrasPlantilla(datos: EntradaPgPlantilla): PgPlantilla {
    const modA = toInt(datos.modConAntes);
    const modD = toInt(datos.modConDespues);
    let cambio = 0;
    let exacto = true;
    const niveles = datos.entrada.niveles ?? [];
    niveles.forEach((nivel) => {
        const carasA = toInt(datos.carasClaseAntes(toInt(nivel?.idClase)));
        const carasD = toInt(datos.carasClaseDespues(toInt(nivel?.idClase)));
        const tirada = toInt(nivel?.pg?.tirada);
        const maximo = !!nivel?.pg?.maximo;
        if (tirada < 1 && !maximo) {
            // Sin su tirada (un nivel de antes del historial, o uno sin DG): la media del cambio.
            if (carasA > 0 && (carasD !== carasA || modD !== modA)) {
                cambio += pasoDeDado(carasA, carasD) + modD - modA;
                exacto = false;
            }
            return;
        }
        const tiradaAntes = maximo ? carasA : tirada;
        const tiradaDespues = maximo ? carasD : Math.min(carasD, Math.max(1, tirada + pasoDeDado(carasA, carasD)));
        cambio += Math.max(1, tiradaDespues + modD) - Math.max(1, tiradaAntes + modA);
    });
    const sinNivel = Math.max(0, toInt(datos.dgsAntes) - niveles.length);
    const porDg = pasoDeDado(toInt(datos.carasRacialAntes), toInt(datos.carasRacialDespues)) + modD - modA;
    if (sinNivel > 0 && porDg !== 0) {
        cambio += sinNivel * porDg;
        exacto = false;
    }
    const nuevos = (datos.tiradasNuevas ?? []).reduce((suma, t) => suma + Math.max(1, toInt(t) + toInt(datos.modConNuevos)), 0);
    return { total: Math.max(1, toInt(datos.entrada.personaje?.puntosGolpe) + cambio + nuevos), nuevos, cambio, exacto };
}

/** Una fila de «Lo que cambia»: qué, antes, ahora y por qué (como la de la subida). */
export interface CambioPlantilla {
    que: string;
    antes: string;
    ahora: string;
    porque: string;
    /** Una fila de aviso (una clase que deja de admitir su alineamiento). */
    aviso?: boolean;
}

export interface EntradaCambiosPlantilla {
    antes: Personaje;
    despues: Personaje;
    plantilla: Plantilla;
    pg: PgPlantilla | null;
    /** Lo que salió en cada DG nuevo. */
    tiradas: number[];
    experiencia: ExperienciaPersonaje | null;
    nepDespues: number;
    /**
     * Las clases que dejan de admitir su alineamiento y quedan ex (ex paladín), con lo que pierden (`Clase.Ex`); o, si el
     * máster (o quien deja la campaña) la mantiene como homebrew (`mantenida`: la decisión `alineamiento_clase`), lo
     * conservan todo.
     */
    exClases: Array<{ nombre: string; razones: string[]; pierde?: string[]; expiacion?: boolean; mantenida?: boolean; }>;
    /** Lo que exige su raza si la plantilla le fija un alineamiento que la raza no suele tener (un aviso, no homebrew). */
    razaContraAlineamiento?: string | null;
}

function nombresDeDotes(pj: Personaje): string[] {
    return (pj?.DotesContextuales ?? []).map((d) => {
        const extra = `${d?.Contexto?.Extra ?? ''}`.trim();
        return `${d?.Dote?.Nombre ?? ''}`.trim() + (extra && extra !== 'No aplica' ? ` (${extra})` : '');
    }).filter((n) => n.length > 0);
}

function velocidades(pj: Personaje): string {
    const partes: Array<[string, number]> = [['', toInt(pj?.Correr)], ['nadar', toInt(pj?.Nadar)], ['volar', toInt(pj?.Volar)],
        ['trepar', toInt(pj?.Trepar)], ['excavar', toInt(pj?.Excavar)]];
    return partes.filter(([, v]) => v > 0).map(([k, v]) => k ? `${k} ${v}'` : `${v}'`).join(', ') || '—';
}

/**
 * Lo que cambia al adquirir la plantilla, para el resumen antes de guardar: el NEP y los PX (que no cambian: Especies
 * salvajes, pág. 145), el tipo, el alineamiento, las características, los PG (con sus DG nuevos o el dado nuevo), el ataque
 * base, la armadura natural, las velocidades, las dotes nuevas y las clases que dejan de admitir su alineamiento.
 */
export function cambiosDeLaPlantilla(e: EntradaCambiosPlantilla): CambioPlantilla[] {
    const filas: CambioPlantilla[] = [];
    const nombre = e.plantilla?.Nombre ?? 'la plantilla';
    const porPlantilla = `Plantilla ${nombre}`;
    const nivel = toInt(e.experiencia?.nivel);
    const ajuste = toInt(e.plantilla?.Ajuste_nivel);
    const dgs = e.tiradas.length;
    filas.push({
        que: 'NEP', antes: `${nivel}`, ahora: `${e.nepDespues}`,
        porque: [ajuste ? `ajuste de nivel ${ajuste > 0 ? '+' : ''}${ajuste}` : '', dgs ? `${dgs} DG nuevos` : ''].filter(Boolean).join(' y ') || porPlantilla,
    });
    if (e.experiencia) {
        const siguiente = experienciaParaNivel(e.nepDespues + 1);
        filas.push({
            que: 'PX', antes: formatoPx(e.experiencia.px), ahora: formatoPx(e.experiencia.px),
            porque: `No cambian: sube a nivel ${e.nepDespues + 1} con ${formatoPx(siguiente)} PX`,
        });
    }
    const texto = (a: string, d: string, que: string, porque = porPlantilla) => {
        if (normalizarTexto(a) !== normalizarTexto(d))
            filas.push({ que, antes: a || '—', ahora: d || '—', porque });
    };
    texto(`${e.antes?.Tipo_criatura?.Nombre ?? ''}`, `${e.despues?.Tipo_criatura?.Nombre ?? ''}`, 'Tipo');
    texto(`${e.antes?.Alineamiento ?? ''}`, `${e.despues?.Alineamiento ?? ''}`, 'Alineamiento', `${nombre} fija su alineamiento`);
    CARACTERISTICAS.forEach((k) => {
        const a = toInt((e.antes as any)?.[k]);
        const d = toInt((e.despues as any)?.[k]);
        const perdida = caracteristicasPerdidasDe(e.despues)[k] && !caracteristicasPerdidasDe(e.antes)[k];
        if (a !== d || perdida)
            filas.push({ que: NOMBRES_CARACTERISTICAS[k], antes: `${a}`, ahora: perdida ? 'Sin ella' : `${d}`, porque: porPlantilla });
    });
    if (e.pg) {
        const partes = [
            dgs ? `${dgs} DG nuevos (tiradas ${e.tiradas.join(', ')}): +${e.pg.nuevos}` : '',
            e.pg.cambio ? `${e.pg.cambio > 0 ? '+' : ''}${e.pg.cambio} en los DG de antes${e.pg.exacto ? '' : ' (aproximado: faltan tiradas de antes)'}` : '',
        ].filter(Boolean);
        filas.push({ que: 'Puntos de golpe', antes: `${toInt(e.antes?.Vida)}`, ahora: `${e.pg.total}`, porque: partes.join('; ') || 'Sin cambios' });
    }
    texto(`${e.antes?.Ataque_base ?? ''}`.trim(), `${e.despues?.Ataque_base ?? ''}`.trim(), 'Ataque base');
    if (toInt(e.antes?.Armadura_natural) !== toInt(e.despues?.Armadura_natural))
        filas.push({ que: 'Armadura natural', antes: `${toInt(e.antes?.Armadura_natural)}`, ahora: `${toInt(e.despues?.Armadura_natural)}`, porque: porPlantilla });
    texto(velocidades(e.antes), velocidades(e.despues), 'Velocidades');
    const antes = new Set(nombresDeDotes(e.antes).map((n) => normalizarTexto(n)));
    const nuevas = nombresDeDotes(e.despues).filter((n) => !antes.has(normalizarTexto(n)));
    if (nuevas.length)
        filas.push({ que: 'Dotes', antes: '—', ahora: nuevas.join(', '), porque: porPlantilla });
    if (e.razaContraAlineamiento)
        filas.push({
            que: 'Su raza', antes: 'Admite su alineamiento', ahora: `Exige ${e.razaContraAlineamiento.toLowerCase()}`, aviso: true,
            porque: `${nombre} fija su alineamiento: manda la plantilla y no es homebrew (Manual de monstruos, pág. 291)`,
        });
    e.exClases.forEach((c) => {
        if (c.mantenida) {
            filas.push({
                que: c.nombre, antes: 'Admite su alineamiento', ahora: c.razones.join(' · ') || 'Ya no lo admite', aviso: true,
                porque: 'Se mantiene como homebrew: conserva lo que le da y puede seguir subiendo en ella',
            });
            return;
        }
        const lista = unirLista(c.pierde ?? [], 'y');
        filas.push({
            que: nombreExClase(c.nombre), antes: 'Admite su alineamiento', ahora: c.razones.join(' · ') || 'Ya no lo admite', aviso: true,
            porque: `Conserva sus niveles, pero no puede subir en ella${lista ? ` y pierde ${lista}` : ''}`
                + `${c.expiacion ? '; lo recupera con una expiación' : ''} (MJ, págs. 26-55)`,
        });
    });
    return filas;
}
