import { ClaseMoldeado, DoteIncarnum, EsenciaRasgo, Fusion, FusionChakra, HabilidadPorFusiones, NombreTraducible, PersonajeIncarnum } from 'src/app/interfaces/incarnum';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { mayusculaInicial } from 'src/app/services/utils/formato-registros';
import { chakrasAbiertos, fusionesALaVez, vinculosALaVez } from 'src/app/services/utils/incarnum';
import { DatoFicha, DatoFranja, unirLista } from './ficha';

/*
 * Lo que enseñan igual el detalle de una clase, el paso de clases de la creación, el catálogo de fusiones y la ficha del
 * personaje de Magic of Incarnum (`docs/publica/INCARNUM.md`). Todo sale de los datos: ni nombres ni ids fijos.
 */

/** Una fila de la tabla de moldeado de una clase, con lo que enseña cada celda. */
export interface FilaMoldeado {
    nivel: number;
    fusiones: number;
    esencia: number;
    vinculos: number;
    /** Los chakras que abre a ese nivel («Pies, Manos»); vacío si ninguno. */
    chakras: string;
    /** El bonificador de capacidad que gana a ese nivel («+1», «+1 en Tótem»); vacío si ninguno. */
    capacidad: string;
}

/** Las filas de la tabla de moldeado de la clase (`Moldeado.Niveles`), con los chakras y la capacidad de cada nivel. */
export function filasMoldeado(moldeado: ClaseMoldeado | null | undefined): FilaMoldeado[] {
    if (!moldeado)
        return [];
    return moldeado.Niveles.map((nivel) => ({
        nivel: nivel.Nivel,
        fusiones: nivel.Fusiones,
        esencia: nivel.Esencia,
        vinculos: nivel.Vinculos,
        chakras: moldeado.Chakras.filter((chakra) => chakra.Nivel === nivel.Nivel).map((chakra) => chakra.Nombre).join(', '),
        capacidad: moldeado.Capacidad
            .filter((fila) => fila.Nivel === nivel.Nivel)
            .map((fila) => textoBonoCapacidad(fila.Bonificador, fila.Chakra))
            .join(', '),
    }));
}

/** «+1» o «+1 en Tótem»: el bonificador de capacidad (total desde ese nivel) y, si lo tiene, el chakra al que se limita. */
export function textoBonoCapacidad(bonificador: number, chakra: NombreTraducible | null | undefined): string {
    return chakra ? `${textoConSigno(bonificador)} en ${chakra.Nombre}` : textoConSigno(bonificador);
}

/** «Su nivel de clase», «La mitad de su nivel de clase» o «Su nivel de clase entre 3»: un nivel entre su divisor. */
function textoNivelEntre(nivel: 'su nivel de clase' | 'tu nivel de personaje', divisor: number | null | undefined): string {
    const d = Math.max(1, Math.trunc(Number(divisor) || 1));
    if (d === 1)
        return mayusculaInicial(nivel);
    if (d === 2)
        return `La mitad de ${nivel}`;
    return `${mayusculaInicial(nivel)} entre ${d}`;
}

/**
 * «10 + mod. de Sabiduría + esencia invertida»: la CD de las fusiones con esa característica (la de una clase o la de la
 * fusión de una dote); `null` si no la tiene.
 */
export function textoCdFusiones(caracteristica: { Nombre: string; } | null | undefined): string | null {
    return caracteristica?.Nombre ? `10 + mod. de ${caracteristica.Nombre} + esencia invertida` : null;
}

/** Los datos del moldeado de una clase, para su lateral «Moldeado de fusiones». */
export function datosMoldeadoClase(moldeado: ClaseMoldeado | null | undefined): DatoFicha[] {
    if (!moldeado)
        return [];
    const fusiones = moldeado.Caracteristica_fusiones?.Nombre;
    return [
        { etiqueta: 'Nivel de moldeador', valor: textoNivelEntre('su nivel de clase', moldeado.Divisor_nivel_moldeador) },
        { etiqueta: 'CD de sus fusiones', valor: textoCdFusiones(moldeado.Caracteristica_cd) },
        {
            etiqueta: 'Fusiones a la vez',
            valor: fusiones ? `Las de la tabla, como mucho ${fusiones} − 10` : null,
            ayuda: fusiones ? `El menor entre la tabla y la puntuación de ${fusiones} − 10.` : null,
        },
        {
            etiqueta: 'Nivel de moldeador por chakra',
            valor: (moldeado.Nivel_moldeador_chakras ?? [])
                .map((f) => `${textoConSigno(f.Bonificador)} en la fusión vinculada a ${f.Chakra.Nombre} desde el nivel ${f.Nivel}`).join(', ') || null,
        },
        {
            etiqueta: 'Lista según el alineamiento',
            valor: moldeado.Limitado_por_alineamiento,
            ayuda: moldeado.Limitado_por_alineamiento
                ? 'No moldea las fusiones con un descriptor de alineamiento que no sea componente del suyo (un encarnado bueno no moldea las legales, caóticas ni malignas).'
                : null,
        },
    ];
}

/** Los chakras de una fusión donde se moldea («Corona o Pies»). */
export function chakrasDondeSeMoldea(fusion: Pick<Fusion, 'Chakras'> | null | undefined): FusionChakra[] {
    return (fusion?.Chakras ?? []).filter((chakra) => chakra.Ocupa);
}

/** Los chakras de una fusión en los que tiene efecto al vincularla (el tótem solo se vincula). */
export function chakrasConVinculo(fusion: Pick<Fusion, 'Chakras'> | null | undefined): FusionChakra[] {
    return (fusion?.Chakras ?? []).filter((chakra) => chakra.Vinculo);
}

/** «Fortaleza niega»: la salvación de una fusión, o `null` si no tiene. */
export function textoSalvacionFusion(fusion: Pick<Fusion, 'Salvacion'> | null | undefined): string | null {
    const tipo = fusion?.Salvacion?.Tipo;
    const efecto = fusion?.Salvacion?.Efecto;
    if (!tipo && !efecto)
        return null;
    return [tipo, efecto ? efecto.toLowerCase() : ''].filter(Boolean).join(' ');
}

/** Lo que da una dote de incarnum (`Dote.Incarnum`), en datos: la esencia, si es receptáculo, la capacidad… */
export function datosIncarnumDote(incarnum: DoteIncarnum | null | undefined): DatoFicha[] {
    if (!incarnum)
        return [];
    const reserva = incarnum.Esencia_reserva > 0 ? textoConSigno(incarnum.Esencia_reserva) : null;
    const moldeador = incarnum.Esencia_reserva_moldeador;
    const capacidad = incarnum.Capacidad;
    return [
        {
            etiqueta: 'Esencia en la reserva',
            valor: reserva ?? (moldeador ? '+0' : null),
            detalle: moldeador !== null && moldeador !== undefined ? `${textoConSigno(moldeador)} si ya moldea fusiones` : null,
        },
        { etiqueta: 'Receptáculo de esencia', valor: incarnum.Receptaculo ? 'Sí' : null },
        {
            etiqueta: 'Capacidad de esencia',
            valor: capacidad
                ? `${textoConSigno(capacidad.Bono)} ${capacidad.Ambito === 'dotes' ? 'en las dotes de incarnum' : 'en una fusión'}`
                : null,
            detalle: capacidad?.Tope_constitucion ? 'como mucho, tu mod. de Constitución' : null,
        },
        {
            etiqueta: 'Chakra elegido',
            valor: incarnum.Abre_chakra ? 'Queda abierto para vincular' : null,
            ayuda: incarnum.Abre_chakra ? 'Con los vínculos de tus clases; si no tienes ninguno, puedes vincular ahí una fusión.' : null,
        },
        {
            etiqueta: 'Nivel de moldeador de su fusión',
            valor: incarnum.Divisor_nivel_moldeador ? textoNivelEntre('tu nivel de personaje', incarnum.Divisor_nivel_moldeador) : null,
        },
        {
            etiqueta: 'CD de su fusión',
            valor: textoCdFusiones(incarnum.Caracteristica_cd_fusion),
        },
        {
            etiqueta: 'Moldea con otra característica',
            valor: incarnum.Sustituye_caracteristica
                ? `${incarnum.Sustituye_caracteristica.Por.Nombre} en vez de ${incarnum.Sustituye_caracteristica.De.Nombre}`
                : null,
            ayuda: incarnum.Sustituye_caracteristica ? 'Para las fusiones a la vez y la CD de sus fusiones.' : null,
        },
        {
            etiqueta: 'Puntos de golpe',
            valor: [
                incarnum.Pg_por_esencia ? `${textoConSigno(incarnum.Pg_por_esencia)} por punto de tu reserva de esencia` : '',
                incarnum.Pg_por_dote ? `${textoConSigno(incarnum.Pg_por_dote.Valor)} por cada dote de ${incarnum.Pg_por_dote.Tipo.Nombre.toLowerCase()}` : '',
            ].filter(Boolean).join(', ') || null,
        },
        {
            etiqueta: 'Moldea sin mirar el alineamiento',
            valor: incarnum.Descriptores_sin_alineamiento.map((descriptor) => descriptor.Nombre).join(', '),
            ayuda: 'Las fusiones con estos descriptores, aunque su clase limite la lista por alineamiento.',
        },
    ];
}

/** La `Esencia` de un racial o un especial de clase, en datos (nada si no da ni recibe esencia). */
export function datosEsenciaRasgo(esencia: EsenciaRasgo | null | undefined): DatoFicha[] {
    if (!esencia)
        return [];
    return [
        { etiqueta: 'Esencia en la reserva', valor: esencia.Reserva > 0 ? textoConSigno(esencia.Reserva) : null },
        { etiqueta: 'Receptáculo de esencia', valor: esencia.Receptaculo ? 'Sí' : null },
        ...(esencia.Habilidades_por_fusiones ?? []).map((h): DatoFicha => ({
            etiqueta: h.Habilidad,
            valor: textoHabilidadPorFusiones(h),
            ayuda: 'A todas sus pruebas; cuentan las fusiones moldeadas en cada momento.',
        })),
    ];
}

/** «+1, y +1 más por cada 2 fusiones moldeadas». */
export function textoHabilidadPorFusiones(h: HabilidadPorFusiones): string {
    return `${textoConSigno(h.Bono)}, y +1 más por cada ${h.Fusiones_por_punto} ${h.Fusiones_por_punto === 1 ? 'fusión moldeada' : 'fusiones moldeadas'}`;
}

/** «+1 de esencia, receptáculo»: la `Esencia` de un rasgo en una línea; vacío si no da ni recibe esencia. */
export function textoEsenciaRasgo(esencia: EsenciaRasgo | null | undefined): string {
    if (!esencia)
        return '';
    return [
        esencia.Reserva > 0 ? `${textoConSigno(esencia.Reserva)} de esencia` : '',
        esencia.Receptaculo ? 'receptáculo de esencia' : '',
        ...(esencia.Habilidades_por_fusiones ?? []).map((h) => `${h.Habilidad} ${textoHabilidadPorFusiones(h)}`),
    ].filter(Boolean).join(', ');
}

// --- La pestaña Incarnum de la ficha del personaje (lienzo `Ficha.dc.html`, opción B) -------------------------------

/** Un chakra en la rejilla de la ficha: la fusión de la formación (o si está abierto) y su estado. */
export interface CeldaChakraFicha {
    id: number;
    nombre: string;
    /** La fusión moldeada en él, «Libre», «Abierto para vincular» o «Se abre a nivel 9». */
    texto: string;
    idFusion: number | null;
    estado: string;
    /** Tooltip: la capacidad y la CD de la fusión de la formación. */
    ayuda: string;
    formada: boolean;
    vinculada: boolean;
    abierto: boolean;
}

/** Una línea de las laterales de la pestaña: un receptáculo o una dote del incarnum. */
export interface LineaIncarnumFicha {
    texto: string;
    nota: string;
}

/** Todo lo que pinta la pestaña Incarnum, calculado una vez con el bloque de la API. */
export interface ModeloIncarnumFicha {
    datos: DatoFicha[];
    puedeMoldear: boolean;
    conFormacion: boolean;
    tituloChakras: string;
    notaChakras: string;
    chakras: CeldaChakraFicha[];
    pie: string;
    receptaculos: LineaIncarnumFicha[];
    dotes: LineaIncarnumFicha[];
}

/** Una clase del personaje con su `Moldeado` del catálogo (para saber desde qué nivel abre cada chakra). */
export interface ClaseConMoldeado {
    nombre: string;
    nivel: number;
    moldeado: ClaseMoldeado | null | undefined;
}

const TIPOS_RECEPTACULO: Record<string, string> = { dote: 'dote', racial: 'racial', especial: 'aptitud de clase' };

/**
 * La pestaña Incarnum de la ficha: los datos (reserva con su desglose, capacidad y, por clase, fusiones a la vez,
 * vínculos, nivel de moldeador y CD), la rejilla de chakras con la formación de partida si la tiene, los receptáculos y
 * lo que dan sus dotes. Todo sale del bloque `incarnum` que calcula la API; las clases del catálogo solo dicen desde qué
 * nivel se abrirá cada chakra. `null` si el personaje no tiene nada de incarnum.
 */
export function modeloIncarnumFicha(
    incarnum: PersonajeIncarnum | null | undefined,
    clases: ClaseConMoldeado[] = [],
): ModeloIncarnumFicha | null {
    if (!incarnum)
        return null;
    const formacion = incarnum.formacion && (incarnum.formacion.fusiones.length > 0 || incarnum.formacion.esenciaInvertida > 0)
        ? incarnum.formacion
        : null;
    const variasClases = incarnum.clases.length > 1;
    const prefijo = (nombre: string) => variasClases ? `${nombre}: ` : '';
    const datos: DatoFicha[] = [
        {
            etiqueta: 'Reserva de esencia',
            valor: incarnum.reserva.total,
            detalle: incarnum.reserva.desglose.map((parte) => `${parte.origen} ${parte.valor}`).join(', '),
        },
        {
            etiqueta: 'Capacidad de esencia',
            valor: incarnum.capacidad.basica,
            detalle: [
                ...incarnum.clases
                    .filter((clase) => clase.capacidadFusiones !== incarnum.capacidad.basica)
                    .map((clase) => `${clase.capacidadFusiones} en fusiones de ${clase.nombre}`),
                ...incarnum.clases.flatMap((clase) => clase.capacidadChakras
                    .map((chakra) => `${chakra.capacidad} en la fusión vinculada a ${chakra.chakra.nombre}`)),
                ...incarnum.capacidad.modificadores.map((m) =>
                    `${textoConSigno(m.bono)} ${m.ambito === 'dotes' ? 'en dotes' : 'en una fusión'}${m.tope !== null ? `, hasta ${m.tope}` : ''} (${m.origen})`),
            ].join(', '),
        },
        ...incarnum.clases.flatMap((clase): DatoFicha[] => [
            {
                etiqueta: `${prefijo(clase.nombre)}Fusiones a la vez · vínculos`,
                valor: `${clase.fusionesMaximas} · ${clase.vinculos}`,
                ayuda: clase.caracteristicaFusiones
                    ? `La tabla da ${clase.fusionesTabla}; como mucho, su ${clase.caracteristicaFusiones} − 10.`
                    : null,
            },
            {
                etiqueta: `${prefijo(clase.nombre)}Nivel de moldeador · CD`,
                valor: `${clase.nivelMoldeador} · ${clase.cd ? `${clase.cd.base} + esencia invertida` : '—'}`,
                detalle: clase.nivelMoldeadorChakras
                    .map((n) => `${n.nivelMoldeador} en la fusión vinculada a ${n.chakra.nombre}`).join(', ') || null,
                ayuda: clase.cd ? `10 + ${clase.cd.caracteristica} (${textoConSigno(clase.cd.modificador)}) + la esencia de la fusión.` : null,
            },
        ]),
        ...(incarnum.puntosGolpe.length > 0 ? [{
            etiqueta: 'Puntos de golpe del incarnum',
            valor: incarnum.puntosGolpe.reduce((suma, p) => suma + p.valor, 0),
            detalle: incarnum.puntosGolpe.map((p) => `${p.origen} ${p.valor}`).join(', '),
            ayuda: 'Ya van en sus puntos de golpe.',
        }] : []),
        ...incarnum.bonosHabilidad.map((b): DatoFicha => ({
            etiqueta: b.habilidad,
            valor: textoConSigno(b.bono),
            detalle: `${b.origen}, con ${b.fusiones} ${b.fusiones === 1 ? 'fusión' : 'fusiones'} de la formación de partida`,
            ayuda: 'Ya va sumado en sus habilidades; con otras fusiones moldeadas, cambia.',
        })),
    ];
    const receptaculos = incarnum.receptaculos.map((r) => ({
        texto: r.nombre,
        nota: [TIPOS_RECEPTACULO[r.tipo] ?? r.tipo, formacion ? `${r.esencia} de ${r.capacidad} de esencia` : `hasta ${r.capacidad} de esencia`].join(' · '),
    }));
    const dotes = [
        ...incarnum.fusionesDeDotes.map((d) => ({
            texto: `${d.dote.nombre}: ${d.fusion.nombre}`,
            nota: [d.nivelMoldeador !== null ? `nivel de moldeador ${d.nivelMoldeador}` : '', d.cd ? `CD ${d.cd.base} + esencia` : '']
                .filter(Boolean).join(' · '),
        })),
        ...incarnum.chakrasDeDotes.map((d) => ({ texto: `${d.dote.nombre}: ${d.chakra.nombre}`, nota: 'abierto para vincular' })),
    ];
    const chakras = incarnum.puedeMoldear ? celdasChakras(incarnum, clases, !!formacion) : [];
    const totalFusiones = fusionesALaVez(incarnum);
    const totalVinculos = vinculosALaVez(incarnum);
    const vinculadas = formacion ? formacion.fusiones.filter((f) => f.vinculo).length : 0;
    return {
        datos,
        puedeMoldear: incarnum.puedeMoldear,
        conFormacion: !!formacion,
        tituloChakras: formacion ? 'Chakras y formación de partida' : 'Chakras',
        notaChakras: formacion
            ? `Fusiones ${formacion.fusiones.length} de ${totalFusiones} · vínculos ${vinculadas} de ${totalVinculos} · esencia ${formacion.esenciaInvertida} de ${incarnum.reserva.total}`
            : 'Puede moldear en todos; vincular, en los abiertos',
        chakras,
        pie: formacion
            ? 'La formación de partida es la que se eligió al crearlo: cada mañana puede cambiarla, y la esencia de las fusiones se mueve en cada asalto.'
            : 'Las fusiones se eligen cada mañana y no se guardan en la ficha. Aquí se ve qué chakras puede vincular y desde qué nivel.',
        receptaculos,
        dotes,
    };
}

function celdasChakras(incarnum: PersonajeIncarnum, clases: ClaseConMoldeado[], conFormacion: boolean): CeldaChakraFicha[] {
    const orden: { id: number; nombre: string; }[] = [];
    const anadir = (ref: { id: number; nombre: string; } | null | undefined) => {
        if (ref && ref.id > 0 && !orden.some((r) => r.id === ref.id))
            orden.push({ id: ref.id, nombre: ref.nombre });
    };
    const abiertos = new Set(chakrasAbiertos(incarnum).map((chakra) => chakra.id));
    // Desde qué nivel de clase se abre cada chakra que aún no está abierto (el primero que llegue).
    const porAbrir = new Map<number, string>();
    const variasMoldeadoras = clases.filter((c) => c.moldeado).length > 1;
    clases.forEach((clase) => (clase.moldeado?.Chakras ?? []).forEach((chakra) => {
        anadir({ id: chakra.Id, nombre: chakra.Nombre });
        if (!abiertos.has(chakra.Id) && chakra.Nivel > clase.nivel && !porAbrir.has(chakra.Id))
            porAbrir.set(chakra.Id, variasMoldeadoras ? `${clase.nombre} ${chakra.Nivel}` : `nivel ${chakra.Nivel}`);
    }));
    incarnum.clases.forEach((clase) => clase.chakrasAbiertos.forEach(anadir));
    incarnum.chakrasDeDotes.forEach((d) => anadir(d.chakra));
    const fusiones = incarnum.formacion?.fusiones ?? [];
    fusiones.forEach((f) => {
        anadir(f.chakra);
        anadir(f.vinculo);
    });
    return orden.map((chakra) => {
        const formada = fusiones.find((f) => f.chakra.id === chakra.id);
        const vinculoAjeno = fusiones.find((f) => f.vinculo?.id === chakra.id && f.chakra.id !== chakra.id);
        const abierto = abiertos.has(chakra.id);
        const apertura = porAbrir.get(chakra.id);
        const celda: CeldaChakraFicha = {
            id: chakra.id, nombre: chakra.nombre, texto: '', idFusion: null, estado: '', ayuda: '',
            formada: !!formada, vinculada: false, abierto,
        };
        if (formada) {
            celda.texto = formada.fusion.nombre;
            celda.idFusion = formada.fusion.id;
            celda.vinculada = !!formada.vinculo;
            celda.estado = [
                formada.vinculo ? (formada.vinculo.id === chakra.id ? 'Vinculada' : `Vinculada a ${formada.vinculo.nombre}`) : '',
                `${formada.esencia} de esencia`,
            ].filter(Boolean).join(' · ');
            celda.ayuda = [`Capacidad ${formada.capacidad}`, formada.cd !== null ? `CD ${formada.cd}` : '',
                formada.clase ? `de ${formada.clase.nombre}` : ''].filter(Boolean).join(' · ');
        } else if (vinculoAjeno) {
            celda.texto = `Vínculo de ${vinculoAjeno.fusion.nombre}`;
            celda.idFusion = vinculoAjeno.fusion.id;
            celda.vinculada = true;
        } else if (conFormacion) {
            celda.texto = 'Libre';
            celda.estado = abierto ? 'abierto para vincular' : apertura ? `vincular a ${apertura}` : '';
        } else {
            celda.texto = abierto ? 'Abierto para vincular' : apertura ? `Se abre a ${apertura}` : 'Sin vínculo';
            celda.estado = abierto ? 'Su ranura queda libre mientras no vincule' : '';
        }
        return celda;
    });
}

// --- La creación de personaje: el paso de clases de una moldeadora (lienzo `Clases.dc.html`) --------------------------

/**
 * Las cifras del incarnum para la franja de un paso de la creación: la reserva con su desglose, las fusiones a la vez,
 * los vínculos (con los chakras abiertos) y la capacidad. Nada si el personaje no moldea fusiones.
 */
export function franjaIncarnum(bloque: PersonajeIncarnum | null | undefined): DatoFranja[] {
    if (!bloque?.puedeMoldear)
        return [];
    const abiertos = chakrasAbiertos(bloque).map((chakra) => chakra.nombre);
    return [
        {
            etiqueta: 'Reserva de esencia',
            valor: bloque.reserva.total,
            detalle: bloque.reserva.desglose.map((p) => `${p.valor} de ${p.origen}`).join(', '),
        },
        {
            etiqueta: 'Fusiones a la vez',
            valor: fusionesALaVez(bloque),
            detalle: bloque.clases.map((c) => c.caracteristicaFusiones ? `tabla ${c.fusionesTabla} · con ${c.caracteristicaFusiones} deja ${c.fusionesMaximas}` : '').filter(Boolean).join(' · '),
        },
        {
            etiqueta: 'Vínculos',
            valor: vinculosALaVez(bloque),
            detalle: unirLista(abiertos.map((nombre) => nombre.toLowerCase()), 'o'),
        },
        {
            etiqueta: 'Capacidad de esencia',
            valor: bloque.capacidad.basica,
            detalle: bloque.clases.filter((c) => c.capacidadFusiones !== bloque.capacidad.basica)
                .map((c) => `${c.capacidadFusiones} en fusiones de ${c.nombre}`).join(', '),
        },
    ];
}

/** Lo que enseña «Tu personaje» del incarnum: pares de nombre y valor y los chakras que puede vincular (y los próximos). */
export interface IncarnumTuPersonaje {
    pares: { nombre: string; valor: string; }[];
    chakras: string[];
    proximos: string;
}

/** «Tu personaje» en la creación: nivel de moldeador, CD, reserva y capacidad; los chakras abiertos y los que vienen. */
export function incarnumTuPersonaje(
    bloque: PersonajeIncarnum | null | undefined,
    clases: ClaseConMoldeado[] = [],
): IncarnumTuPersonaje | null {
    if (!bloque || (!bloque.puedeMoldear && bloque.reserva.total <= 0))
        return null;
    const variasClases = bloque.clases.length > 1;
    const pares = [
        ...bloque.clases.flatMap((c) => [
            { nombre: variasClases ? `Moldeador (${c.nombre})` : 'Nivel de moldeador', valor: `${c.nivelMoldeador}` },
            ...(c.cd ? [{ nombre: variasClases ? `CD (${c.nombre})` : 'CD', valor: `${c.cd.base} + esencia` }] : []),
        ]),
        { nombre: 'Reserva de esencia', valor: `${bloque.reserva.total}` },
        { nombre: 'Capacidad', valor: `${bloque.capacidad.basica}` },
    ];
    const chakras = chakrasAbiertos(bloque).map((chakra) => chakra.nombre);
    // Los siguientes chakras que abrirá: los del nivel más bajo que aún no tiene, de cada clase.
    const proximos = clases.filter((c) => c.moldeado).map((c) => {
        const futuros = c.moldeado!.Chakras.filter((ch) => ch.Nivel > c.nivel && !chakras.includes(ch.Nombre));
        if (futuros.length < 1)
            return '';
        const nivel = Math.min(...futuros.map((ch) => ch.Nivel));
        const nombres = futuros.filter((ch) => ch.Nivel === nivel).map((ch) => ch.Nombre.toLowerCase());
        return `${mayusculaInicial(unirLista(nombres, 'y'))} a nivel ${nivel}${clases.filter((x) => x.moldeado).length > 1 ? ` de ${c.nombre}` : ''}`;
    }).filter(Boolean).join(' · ');
    return { pares, chakras, proximos };
}
