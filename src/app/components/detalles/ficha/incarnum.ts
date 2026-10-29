import { ClaseMoldeado, DoteIncarnum, EsenciaRasgo, Fusion, FusionChakra, NombreTraducible, PersonajeIncarnum } from 'src/app/interfaces/incarnum';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { DatoFicha } from './ficha';

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

/** «Su nivel de clase» o «La mitad de su nivel de clase»: cómo sale el nivel de moldeador de la clase. */
export function textoNivelMoldeador(divisor: number | null | undefined): string {
    const d = Math.max(1, Math.trunc(Number(divisor) || 1));
    if (d === 1)
        return 'Su nivel de clase';
    if (d === 2)
        return 'La mitad de su nivel de clase';
    return `Su nivel de clase entre ${d}`;
}

/** «10 + mod. de Sabiduría + esencia invertida»: la CD de las fusiones de la clase; `null` si no tiene característica. */
export function textoCdFusiones(moldeado: ClaseMoldeado | null | undefined): string | null {
    const caracteristica = moldeado?.Caracteristica_cd?.Nombre;
    return caracteristica ? `10 + mod. de ${caracteristica} + esencia invertida` : null;
}

/** Los datos del moldeado de una clase, para su lateral «Moldeado de fusiones». */
export function datosMoldeadoClase(moldeado: ClaseMoldeado | null | undefined): DatoFicha[] {
    if (!moldeado)
        return [];
    const fusiones = moldeado.Caracteristica_fusiones?.Nombre;
    return [
        { etiqueta: 'Nivel de moldeador', valor: textoNivelMoldeador(moldeado.Divisor_nivel_moldeador) },
        { etiqueta: 'CD de sus fusiones', valor: textoCdFusiones(moldeado) },
        {
            etiqueta: 'Fusiones a la vez',
            valor: fusiones ? `Las de la tabla, como mucho ${fusiones} − 10` : null,
            ayuda: fusiones ? `El menor entre la tabla y la puntuación de ${fusiones} − 10.` : null,
        },
        {
            etiqueta: 'Lista según el alineamiento',
            valor: moldeado.Limitado_por_alineamiento,
            ayuda: moldeado.Limitado_por_alineamiento
                ? 'Solo moldea las fusiones cuyos descriptores de alineamiento comparten algún componente con el suyo.'
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

/** «Corona o Pies»: nombres unidos con «o» (dónde se puede moldear una fusión). */
export function unirConO(nombres: string[]): string {
    if (nombres.length < 2)
        return nombres.join('');
    return `${nombres.slice(0, -1).join(', ')} o ${nombres[nombres.length - 1]}`;
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
        { etiqueta: 'Chakra elegido', valor: incarnum.Abre_chakra ? 'Queda abierto para un vínculo' : null },
        {
            etiqueta: 'Nivel de moldeador de su fusión',
            valor: incarnum.Divisor_nivel_moldeador ? textoNivelPersonajeEntre(incarnum.Divisor_nivel_moldeador) : null,
        },
        {
            etiqueta: 'Moldea sin mirar el alineamiento',
            valor: incarnum.Descriptores_sin_alineamiento.map((descriptor) => descriptor.Nombre).join(', '),
            ayuda: 'Las fusiones con estos descriptores, aunque su clase limite la lista por alineamiento.',
        },
    ];
}

/** «La mitad de tu nivel de personaje»: el nivel de moldeador de la fusión que da una dote. */
export function textoNivelPersonajeEntre(divisor: number): string {
    const d = Math.max(1, Math.trunc(Number(divisor) || 1));
    if (d === 1)
        return 'Tu nivel de personaje';
    if (d === 2)
        return 'La mitad de tu nivel de personaje';
    return `Tu nivel de personaje entre ${d}`;
}

/** La `Esencia` de un racial o un especial de clase, en datos (nada si no da ni recibe esencia). */
export function datosEsenciaRasgo(esencia: EsenciaRasgo | null | undefined): DatoFicha[] {
    if (!esencia)
        return [];
    return [
        { etiqueta: 'Esencia en la reserva', valor: esencia.Reserva > 0 ? textoConSigno(esencia.Reserva) : null },
        { etiqueta: 'Receptáculo de esencia', valor: esencia.Receptaculo ? 'Sí' : null },
    ];
}

/** «+1 de esencia, receptáculo»: la `Esencia` de un rasgo en una línea; vacío si no da ni recibe esencia. */
export function textoEsenciaRasgo(esencia: EsenciaRasgo | null | undefined): string {
    if (!esencia)
        return '';
    return [
        esencia.Reserva > 0 ? `${textoConSigno(esencia.Reserva)} de esencia` : '',
        esencia.Receptaculo ? 'receptáculo de esencia' : '',
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
                    `${textoConSigno(m.bono)} ${m.ambito === 'dotes' ? 'en dotes' : 'en una fusión'} (${m.origen})`),
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
                ayuda: clase.cd ? `10 + ${clase.cd.caracteristica} (${textoConSigno(clase.cd.modificador)}) + la esencia de la fusión.` : null,
            },
        ]),
    ];
    const receptaculos = incarnum.receptaculos.map((r) => ({
        texto: r.nombre,
        nota: [TIPOS_RECEPTACULO[r.tipo] ?? r.tipo, formacion ? `${r.esencia} de ${r.capacidad} de esencia` : `hasta ${r.capacidad} de esencia`].join(' · '),
    }));
    const dotes = [
        ...incarnum.fusionesDeDotes.map((d) => ({
            texto: `${d.dote.nombre}: ${d.fusion.nombre}`,
            nota: d.nivelMoldeador !== null ? `nivel de moldeador ${d.nivelMoldeador}` : '',
        })),
        ...incarnum.chakrasDeDotes.map((d) => ({ texto: `${d.dote.nombre}: ${d.chakra.nombre}`, nota: 'abierto para un vínculo' })),
    ];
    const chakras = incarnum.puedeMoldear ? celdasChakras(incarnum, clases, !!formacion) : [];
    const totalFusiones = incarnum.clases.reduce((suma, c) => suma + c.fusionesMaximas, 0) + incarnum.fusionesDeDotes.length;
    const totalVinculos = incarnum.clases.reduce((suma, c) => suma + c.vinculos, 0) + incarnum.chakrasDeDotes.length;
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
    const abiertos = new Set<number>([
        ...incarnum.clases.flatMap((clase) => clase.chakrasAbiertos.map((chakra) => chakra.id)),
        ...incarnum.chakrasDeDotes.map((d) => d.chakra.id),
    ]);
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
