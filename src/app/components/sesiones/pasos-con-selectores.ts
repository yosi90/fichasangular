import Swal from 'sweetalert2';
import { SelectorAumentosCaracteristicaModalComponent } from 'src/app/components/nuevo-personaje/selector-aumentos-caracteristica-modal/selector-aumentos-caracteristica-modal.component';
import { SelectorClaseOpcionalModalComponent } from 'src/app/components/nuevo-personaje/selector-clase-opcional-modal/selector-clase-opcional-modal.component';
import { SelectorDominiosModalComponent } from 'src/app/components/nuevo-personaje/selector-dominios-modal/selector-dominios-modal.component';
import { SelectorDotesModalComponent } from 'src/app/components/nuevo-personaje/selector-dotes-modal/selector-dotes-modal.component';
import { SelectorEnemigoPredilectoModalComponent } from 'src/app/components/nuevo-personaje/selector-enemigo-predilecto-modal/selector-enemigo-predilecto-modal.component';
import { SelectorEspecialidadMagicaModalComponent } from 'src/app/components/nuevo-personaje/selector-especialidad-magica-modal/selector-especialidad-magica-modal.component';
import { SelectorRacialesOpcionalesModalComponent } from 'src/app/components/nuevo-personaje/selector-raciales-opcionales-modal/selector-raciales-opcionales-modal.component';
import { SelectorTrucosModalComponent } from 'src/app/components/nuevo-personaje/selector-trucos-modal/selector-trucos-modal.component';
import { CampaignCreationPolicy } from 'src/app/interfaces/campaign-management';
import { Clase } from 'src/app/interfaces/clase';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { CampanaService } from 'src/app/services/campana.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { EnemigoPredilectoService } from 'src/app/services/enemigo-predilecto.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import {
    DotePendienteState, DoteSeleccionConfirmada, NuevoPersonajeService, SeleccionAumentosClaseLanzadora, SeleccionDominiosClase,
    SeleccionExtrasEspecialesClase, SeleccionOpcionalesClase,
} from 'src/app/services/nuevo-personaje.service';
import { EspecialClaseDetalle } from 'src/app/interfaces/especial';
import { EspecialService } from 'src/app/services/especial.service';
import { extrasElegiblesEspecial } from 'src/app/services/utils/aptitudes-clase';
import { caracteristicasPerdidasDe } from 'src/app/services/utils/caracteristicas';
import { nombreDelCompanero, tituloDeLasMejorasDelCompanero } from 'src/app/services/utils/companero-dotes';
import { AVISO_TRUCOS_QUE_YA_NO_VALEN, tituloDeLosTrucosDelCompanero } from 'src/app/services/utils/companero-trucos';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';
import { MAX_TIRADAS_PUNTOS_GOLPE, tiradasPuntosGolpe } from 'src/app/services/utils/puntos-golpe';
import { HuecoDeSelectores } from './hueco-selectores';

/*
 * Los pasos que la subida de nivel y la adquisición de una plantilla resuelven igual, con el motor de la creación en su
 * propia instancia y sus selectores en el hueco común (`HuecoDeSelectores`): el incremento de característica y las dotes
 * pendientes, las tiradas de PG que deja la campaña y el aviso de un paso que no se puede cerrar. La corrección de la ficha
 * usa además la dote que queda en un hueco (`doteElegidaEnElHueco`). Tomar un nivel de una clase con sus selectores
 * (`tomarNivelDeClase`) lo comparten la subida, la conversión en muerto viviente (el 1.er nivel de su clase de monstruo) y
 * la vuelta a la vida sin ningún DG (el 1.er nivel de una clase básica, elegida de `clasesParaElNivel`).
 */

/** El aviso de algo que no se puede aplicar en un paso (una clase, una dote, un incremento que falta), con «Entendido». */
export async function avisarPaso(titulo: string, texto: string): Promise<void> {
    await Swal.fire({ icon: 'warning', title: titulo, text: texto, confirmButtonText: 'Entendido', target: document.body, heightAuto: false, scrollbarPadding: false });
}

/**
 * Cuántas veces puede tirar los PG: un PNJ, como al crearlo y como la API, sin el límite de la campaña (propietario,
 * 2026-11-12); en una campaña, las de su política de creación (`maxTiradasPuntosGolpe`); sin campaña, o si no se puede
 * leer, una.
 */
export async function tiradasPermitidasDe(entrada: PersonajeCreateRequestDto, campanaSvc: CampanaService): Promise<number> {
    return tiradasDeLaPolitica(entrada, await politicaDeCreacionDe(entrada, campanaSvc));
}

/** Las tiradas de PG (`tiradasPermitidasDe`) con la política de su campaña ya leída (`politicaDeCreacionDe`). */
export function tiradasDeLaPolitica(entrada: PersonajeCreateRequestDto, politica: Partial<CampaignCreationPolicy> | null): number {
    if (entrada.personaje?.tipo === 'pnj')
        return MAX_TIRADAS_PUNTOS_GOLPE;
    return politica ? tiradasPuntosGolpe(politica.maxTiradasPuntosGolpe) : 1;
}

/**
 * La política de creación de su campaña (`GET /campanas/{id}`), o `null` sin campaña, en un PNJ (es del máster: queda
 * fuera de ella) o si no se puede leer. La usan las tiradas de PG y la conversión en muerto viviente (las clases de
 * monstruo, `permitirClasesDeMonstruo`).
 */
export async function politicaDeCreacionDe(entrada: PersonajeCreateRequestDto, campanaSvc: CampanaService)
    : Promise<Partial<CampaignCreationPolicy> | null> {
    const campana = toInt(entrada.personaje?.campana?.id);
    if (entrada.personaje?.tipo === 'pnj' || campana <= 0)
        return null;
    try {
        return (await campanaSvc.getCampaignDetail(campana))?.politicaCreacion ?? {};
    } catch {
        return null;
    }
}

/**
 * El incremento de característica pendiente del motor, con el selector de la creación (`titulo`): no se cierra hasta que
 * se aplica (el +1 es obligatorio).
 */
export async function resolverIncrementoPendiente(svc: NuevoPersonajeService, selectores: HuecoDeSelectores, titulo: string): Promise<void> {
    while (true) {
        const p = svc.PersonajeCreacion;
        const asignaciones = await selectores.abrir<any[]>(SelectorAumentosCaracteristicaModalComponent, {
            titulo,
            pendientes: svc.getAumentosCaracteristicaPendientes(),
            caracteristicasActuales: { Fuerza: p.Fuerza, Destreza: p.Destreza, Constitucion: p.Constitucion, Inteligencia: p.Inteligencia, Sabiduria: p.Sabiduria, Carisma: p.Carisma },
            caracteristicasPerdidas: caracteristicasPerdidasDe(p),
            topesCaracteristicas: svc.getTopesCaracteristicas(),
        }, ['confirmar'], []);
        if (asignaciones && svc.aplicarAumentosCaracteristica(asignaciones))
            return;
        await avisarPaso('Falta el incremento', 'Elige a qué característica va el +1 para seguir.');
    }
}

/**
 * Las dotes pendientes del motor, una a una, con el selector de dotes de la creación: la que no tiene ninguna candidata
 * elegible se omite sola, y «Omitir» la deja sin elegir. `false` si se cierra el selector sin elegir (el paso sigue
 * abierto); `true` cuando no queda ninguna.
 */
export async function resolverDotesPendientes(svc: NuevoPersonajeService, selectores: HuecoDeSelectores): Promise<boolean> {
    while (true) {
        const pendiente = svc.getSiguienteDotePendiente();
        if (!pendiente)
            return true;
        const candidatos = svc.obtenerCandidatosDotePendiente(pendiente.id);
        if (!candidatos.some((c) => c.evaluacion?.estado === 'eligible' && c.repeticionValida && !c.restringidaPorTipo)) {
            svc.omitirDotePendiente(pendiente.id);
            continue;
        }
        const restantes = svc.getDotesPendientes().filter((d) => d.estado === 'pendiente').length;
        const seleccion = await selectores.abrir<DoteSeleccionConfirmada | 'omitir'>(SelectorDotesModalComponent, {
            titulo: 'Seleccionar dote', pendiente, candidatos, pendientesRestantes: restantes,
        }, ['confirmar'], [], { omitir: 'omitir' });
        if (!seleccion)
            return false;
        if (seleccion === 'omitir')
            svc.omitirDotePendiente(pendiente.id);
        else if (!svc.aplicarDotePendiente(pendiente.id, seleccion))
            await avisarPaso('No se pudo aplicar la dote', 'La selección ya no vale con el personaje de ahora. Elige otra.');
    }
}

/**
 * Lo que elige el compañero animal con sus DG y su tabla (contrato: «Las dotes y las mejoras que elige el compañero» y «Los
 * trucos del compañero»): las mejoras en el selector de los incrementos, con sus características (no se cierra hasta
 * ponerlas); las dotes en el de dotes, juzgadas como criatura; y sus trucos adicionales en el de trucos. Lo que se cierra
 * sin elegir queda pendiente.
 */
export async function resolverLoQueEligeElCompanero(svc: NuevoPersonajeService, selectores: HuecoDeSelectores): Promise<void> {
    const nombre = nombreDelCompanero(svc.PersonajeCreacion.Companeros?.[0], 'el compañero animal');
    while (svc.getMejorasPendientesDelCompanero().length > 0) {
        const asignaciones = await selectores.abrir<any[]>(SelectorAumentosCaracteristicaModalComponent, {
            titulo: tituloDeLasMejorasDelCompanero(svc.PersonajeCreacion.Companeros?.[0]),
            pendientes: svc.getMejorasPendientesDelCompanero(),
            caracteristicasActuales: svc.caracteristicasDelCompanero(),
            caracteristicasPerdidas: svc.caracteristicasPerdidasDelCompanero(),
            topesCaracteristicas: svc.topesCaracteristicasDelCompanero(),
        }, ['confirmar'], []);
        if (asignaciones && svc.aplicarMejorasDelCompanero(asignaciones))
            break;
        await avisarPaso('Falta la mejora', `Elige a qué característica de ${nombre} va el +1 para seguir.`);
    }
    if (svc.registrarDotesPendientesDelCompanero() > 0 && !await resolverDotesPendientes(svc, selectores))
        svc.omitirDotesPendientesDelCompanero();
    if (svc.getTrucosPendientesDelCompanero() > 0)
        await resolverTrucosDelCompanero(svc, selectores);
}

/** Sus trucos adicionales, en el selector de trucos: «Omitir» los deja pendientes. */
async function resolverTrucosDelCompanero(svc: NuevoPersonajeService, selectores: HuecoDeSelectores): Promise<void> {
    while (svc.hayTrucosQueElegirDelCompanero()) {
        const companero = svc.PersonajeCreacion.Companeros?.[0] ?? null;
        const elegidos = await selectores.abrir<number[] | 'omitir'>(SelectorTrucosModalComponent, {
            titulo: tituloDeLosTrucosDelCompanero(companero), companero, catalogo: svc.CatalogoTrucos,
            incluirHomebrew: svc.IncluirTrucosHomebrew,
        }, ['confirmar'], [], { omitir: 'omitir' });
        if (!elegidos || elegidos === 'omitir')
            return;
        if (!svc.aplicarTrucosDelCompanero(elegidos))
            await avisarPaso(AVISO_TRUCOS_QUE_YA_NO_VALEN.titulo, AVISO_TRUCOS_QUE_YA_NO_VALEN.texto);
    }
}

/**
 * La dote que queda en el hueco `pendiente` tras aplicar `seleccion` (`aplicarDotePendiente`): su id, su extra (el del
 * motor, o el elegido) y sus nombres, para enseñarla. La usan la corrección (otra dote en lugar de la quitada) y el
 * reciclaje de la subida (la dote que entra en el hueco de la reciclada).
 */
export function doteElegidaEnElHueco(svc: NuevoPersonajeService, pendiente: DotePendienteState, seleccion: DoteSeleccionConfirmada)
    : { idDote: number; idExtra: number; nombre: string; extra: string; } {
    const elegida = [...(svc.PersonajeCreacion.DotesContextuales ?? [])].reverse()
        .find((d) => toInt(d?.Dote?.Id) === toInt(seleccion.idDote) && `${(d?.Contexto as any)?.Origen ?? ''}` === `${pendiente.origenFijo}`);
    const idExtra = toInt(elegida?.Contexto?.Id_extra ?? seleccion.idExtra);
    return { idDote: toInt(seleccion.idDote), idExtra, nombre: `${elegida?.Dote?.Nombre ?? ''}`, extra: idExtra > 0 ? `${elegida?.Contexto?.Extra ?? ''}` : '' };
}

/** Una clase de la lista «Elige la clase de este nivel»: su siguiente nivel y, si no la puede tomar, por qué. */
export interface ClaseDelNivel {
    clase: Clase;
    siguienteNivel: number;
    elegible: boolean;
    motivo: string;
    /** Si ya tiene niveles de ella. */
    tiene: boolean;
    /** Si solo la impide su alineamiento y se puede tomar como homebrew («Elegir igualmente», la decisión `alineamiento_clase`). */
    soloAlineamiento?: boolean;
}

/**
 * Las clases que puede tomar en el nivel que gana, con el motor de la creación (`evaluarClaseParaSeleccion`: su
 * alineamiento, sus prerrequisitos, el paladín y el monje cerrados, las clases de monstruo): las que puede tomar y, de las
 * suyas, también las que no, con su motivo. Las homebrew, solo si la ficha ya lo es (`oficial` `false`) o ya tiene niveles
 * de ella. Primero las suyas y después por nombre. Con `saltarAlineamiento`, también las que solo impide su alineamiento
 * (`soloAlineamiento`), como al crear: se eligen como homebrew. La usan la subida de nivel y la vuelta a la vida sin ningún DG
 * (el 1.er nivel de una clase básica, como al crear).
 */
export function clasesParaElNivel(svc: NuevoPersonajeService, oficial: boolean | null | undefined,
    opciones: { saltarAlineamiento?: boolean; } = {}): ClaseDelNivel[] {
    const propias = new Set((svc.PersonajeCreacion.desgloseClases ?? []).map((c) => normalizarTexto(c?.Nombre ?? '')));
    return (((svc as any).catalogoClases ?? []) as Clase[])
        .filter((clase) => oficial === false || clase?.Oficial !== false || propias.has(normalizarTexto(clase.Nombre)))
        .map((clase) => {
            const evaluacion = svc.evaluarClaseParaSeleccion(clase);
            const soloAlineamiento = opciones.saltarAlineamiento === true && svc.esBloqueoSoloPorAlineamiento(evaluacion);
            return {
                clase,
                tiene: propias.has(normalizarTexto(clase.Nombre)),
                siguienteNivel: toInt((svc.PersonajeCreacion.desgloseClases ?? [])
                    .find((c) => normalizarTexto(c?.Nombre ?? '') === normalizarTexto(clase.Nombre))?.Nivel) + 1,
                elegible: evaluacion.estado === 'eligible',
                motivo: evaluacion.razones?.[0] ?? '',
                ...(soloAlineamiento ? { soloAlineamiento: true } : {}),
            };
        })
        .filter((item) => item.elegible || item.tiene || item.soloAlineamiento)
        .sort((a, b) => Number(b.tiene) - Number(a.tiene) || a.clase.Nombre.localeCompare(b.clase.Nombre, 'es'));
}

/**
 * Los catálogos que pide tomar un nivel de clase, solo si hacen falta (la especialización mágica, el enemigo predilecto y,
 * con `especial`, los extras de una aptitud con «Elegir», de `GET /clases/habilidades/{id}`). Sin `especial`, un nivel que
 * pide elegir un extra no se puede tomar (las pantallas cuyas clases no lo piden en ese nivel no lo pasan).
 */
export interface CatalogosDelNivel {
    escuelas: () => Promise<any[]>;
    disciplinas: () => Promise<any[]>;
    enemigos: () => Promise<any[]>;
    especial?: (idEspecial: number) => Promise<EspecialClaseDetalle | null>;
}

/** Los catálogos del nivel de las pantallas de sesión: el primer valor de cada uno, o ninguno si falla. */
export function catalogosDelNivel(motor: MotorDesdeFichaService, escuelas: EscuelaConjurosService, disciplinas: DisciplinaConjurosService,
    enemigos: EnemigoPredilectoService, especiales?: EspecialService): CatalogosDelNivel {
    return {
        escuelas: async () => (await motor.primero(escuelas.getEscuelas())) ?? [],
        disciplinas: async () => (await motor.primero(disciplinas.getDisciplinas())) ?? [],
        enemigos: async () => (await motor.primero(enemigos.getEnemigosPredilectos())) ?? [],
        ...(especiales ? { especial: async (id: number) => (await motor.primero(especiales.getEspecial(id))) ?? null } : {}),
    };
}

/**
 * El extra de cada aptitud del nivel con «Elegir» (el Gran arcano del archimago), como al crear: sus extras elegibles
 * (`extrasElegiblesEspecial`, sin los que ya tiene en esa aptitud ni los elegidos en este mismo nivel), con el selector de
 * los grupos opcionales. `null` si se cierra, no hay nada que elegir o falta el catálogo (`catalogos.especial`).
 */
async function elegirExtrasDelNivel(svc: NuevoPersonajeService, selectores: HuecoDeSelectores, clase: Clase, siguienteNivel: number,
    pendientes: ReturnType<NuevoPersonajeService['obtenerEspecialesExtraPendientesSiguienteNivelClase']>,
    catalogos: CatalogosDelNivel): Promise<SeleccionExtrasEspecialesClase | null> {
    if (!catalogos.especial) {
        await avisarPaso('Aún no disponible', `El nivel ${siguienteNivel} de ${clase.Nombre} pide elegir el extra de una aptitud: esta pantalla todavía no lo ofrece.`);
        return null;
    }
    const selecciones: SeleccionExtrasEspecialesClase = {};
    for (const pendiente of pendientes) {
        const elegidosEnEsteNivel = Object.entries(selecciones)
            .filter(([clave]) => pendientes.find((p) => p.clave === clave)?.idEspecial === pendiente.idEspecial)
            .map(([, elegido]) => elegido.idExtra);
        const extras = extrasElegiblesEspecial(await catalogos.especial(pendiente.idEspecial),
            [...svc.idsExtraDeAptitud(pendiente.idEspecial), ...elegidosEnEsteNivel]);
        if (extras.length < 1) {
            await avisarPaso('No se puede subir en esta clase', `No hay ningún extra que elegir para ${pendiente.nombre}.`);
            return null;
        }
        const clave = await selectores.abrir<string>(SelectorClaseOpcionalModalComponent, {
            titulo: pendiente.nombre,
            descripcion: `Elige el extra de ${pendiente.nombre} para continuar con el nivel ${siguienteNivel} de ${clase.Nombre}.`,
            opciones: extras.map((e) => ({ clave: `${e.id}`, tipo: 'especial', nombre: e.nombre, extra: '' })),
        }, ['confirmar'], ['cerrar']);
        const elegido = extras.find((e) => `${e.id}` === `${clave ?? ''}`);
        if (!elegido)
            return null;
        selecciones[pendiente.clave] = { idExtra: elegido.id, extra: elegido.nombre };
    }
    return selecciones;
}

/**
 * Lo que queda de tomar un nivel de clase: `cancelado` (no se ha aplicado nada: se puede elegir otra), `deshacer` (se ha
 * aplicado y se ha cerrado un selector obligatorio después: el motor se tiene que rehacer) o `aplicado`, con el nivel de
 * clase y sus aptitudes.
 */
export type ResultadoNivelDeClase =
    | { estado: 'cancelado'; }
    | { estado: 'deshacer'; }
    | { estado: 'aplicado'; nivelClase: number; especiales: any[]; };

/**
 * Toma el siguiente nivel de `clase` en el motor con los selectores de la creación, como en la subida de nivel: los grupos
 * opcionales de la clase, los dominios, los aumentos de una clase lanzadora, la especialización mágica, el enemigo
 * predilecto y las elecciones de la progresión de sus rasgos; después apunta lo que queda pendiente del nivel (los
 * incrementos y las dotes). El extra «Elegir» de una aptitud, con `catalogos.especial` (`elegirExtrasDelNivel`). `permitirBloqueoSoloAlineamiento`: la
 * conversión en muerto viviente, cuyo alineamiento no se fuerza (*Libris Mortis*, págs. 35-40).
 */
export async function tomarNivelDeClase(svc: NuevoPersonajeService, selectores: HuecoDeSelectores, clase: Clase,
    catalogos: CatalogosDelNivel, opciones: { permitirBloqueoSoloAlineamiento?: boolean; } = {}): Promise<ResultadoNivelDeClase> {
    const siguienteNivel = toInt((svc.PersonajeCreacion.desgloseClases ?? [])
        .find((c) => normalizarTexto(c?.Nombre ?? '') === normalizarTexto(clase.Nombre))?.Nivel) + 1;
    let seleccionesOpcionales: SeleccionOpcionalesClase | null = null;
    for (const grupo of svc.obtenerOpcionalesSiguienteNivelClase(clase)) {
        const clave = await selectores.abrir<string>(SelectorClaseOpcionalModalComponent, {
            titulo: `Grupo opcional ${grupo.grupo}`,
            descripcion: 'Elige una opción para continuar con el nivel de clase.',
            opciones: (grupo.opciones ?? []).map((o: any) => ({
                clave: `${o?.clave ?? ''}`, tipo: o?.tipo === 'especial' ? 'especial' : 'dote', nombre: `${o?.nombre ?? ''}`,
                extra: `${o?.extra ?? ''}`, ...(o?.bloqueada ? { bloqueada: true, motivo: `${o?.motivo ?? ''}` } : {}),
            })),
        }, ['confirmar'], ['cerrar']);
        if (!clave)
            return { estado: 'cancelado' };
        seleccionesOpcionales = { ...(seleccionesOpcionales ?? {}), [grupo.grupo]: clave };
    }
    let seleccionesExtras: SeleccionExtrasEspecialesClase | null = null;
    const extrasPendientes = svc.obtenerEspecialesExtraPendientesSiguienteNivelClase(clase, seleccionesOpcionales);
    if (extrasPendientes.length > 0) {
        seleccionesExtras = await elegirExtrasDelNivel(svc, selectores, clase, siguienteNivel, extrasPendientes, catalogos);
        if (!seleccionesExtras)
            return { estado: 'cancelado' };
    }
    let seleccionesDominios: SeleccionDominiosClase | null = null;
    const dominios = svc.obtenerDominiosPendientesSiguienteNivelClase(clase);
    if (dominios && dominios.cantidad > 0) {
        seleccionesDominios = await selectores.abrir<SeleccionDominiosClase>(SelectorDominiosModalComponent, {
            opciones: dominios.opciones.map((o) => ({ id: toInt(o.id), nombre: o.nombre, oficial: o.oficial !== false })),
            titulo: `Dominios de ${clase.Nombre}`, cantidadObjetivo: dominios.cantidad, cantidadSeleccionada: 0, bloquearCierreHastaCompletar: false,
        }, ['confirmar'], ['cerrar']);
        if (!seleccionesDominios)
            return { estado: 'cancelado' };
    }
    const porAlineamiento = opciones.permitirBloqueoSoloAlineamiento === true;
    let aumentos: SeleccionAumentosClaseLanzadora | null = null;
    let resultado = svc.aplicarSiguienteNivelClase(clase, seleccionesOpcionales, seleccionesDominios, porAlineamiento, aumentos, seleccionesExtras);
    if (!resultado.aplicado && (resultado.aumentosClaseLanzadoraPendientes ?? []).length > 0) {
        aumentos = [];
        for (const pendiente of resultado.aumentosClaseLanzadoraPendientes ?? []) {
            const opcionesLanzador: Record<string, string> = {};
            (pendiente.opciones ?? []).forEach((o) => opcionesLanzador[`${o.idClase}`] = `${o.nombreClase} (${o.tipoLanzamiento})`);
            const r = await Swal.fire({
                icon: 'question', title: `${clase.Nombre}: aumento de lanzador`, text: pendiente.descripcion, input: 'select',
                inputOptions: opcionesLanzador, showCancelButton: true, confirmButtonText: 'Aplicar', cancelButtonText: 'Cancelar',
                target: document.body, heightAuto: false, scrollbarPadding: false,
                inputValidator: (valor) => valor ? undefined : 'Elige la clase que sube',
            });
            if (!r.isConfirmed || !r.value)
                return { estado: 'cancelado' };
            aumentos[Math.max(0, toInt(pendiente.indice) - 1)] = toInt(r.value);
        }
        resultado = svc.aplicarSiguienteNivelClase(clase, seleccionesOpcionales, seleccionesDominios, porAlineamiento, aumentos, seleccionesExtras);
    }
    if (!resultado.aplicado) {
        await avisarPaso('No se puede subir en esta clase', resultado.evaluacion?.razones?.join(' · ') || resultado.razon || 'No se puede aplicar el nivel.');
        return { estado: 'cancelado' };
    }
    const nivelClase = toInt(resultado.nivelAplicado);
    const especiales = resultado.especialesAplicados ?? [];
    if (!await resolverEspecialidad(svc, selectores, clase, nivelClase, catalogos) || !await resolverEnemigos(svc, selectores, especiales, catalogos))
        return { estado: 'deshacer' };
    const contexto = `${clase.Nombre} nivel ${nivelClase}`;
    svc.registrarAumentosPendientesPorEspeciales(especiales, contexto);
    svc.registrarAumentosPendientesPorProgresion(contexto);
    if (!await resolverEleccionesRaciales(svc, selectores))
        return { estado: 'deshacer' };
    svc.registrarDotesPendientesPorRazaExtras(`${svc.RazaSeleccionada?.Nombre ?? 'Raza'}`);
    svc.registrarDotesPendientesPorEspeciales(especiales, contexto);
    svc.registrarDotesPendientesPorProgresion(contexto);
    return { estado: 'aplicado', nivelClase, especiales };
}

async function resolverEspecialidad(svc: NuevoPersonajeService, selectores: HuecoDeSelectores, clase: Clase, nivelClase: number,
    catalogos: CatalogosDelNivel): Promise<boolean> {
    const pendiente = svc.getEspecialidadMagicaPendiente(clase, nivelClase);
    if (!pendiente)
        return true;
    const [escuelas, disciplinas] = await Promise.all([catalogos.escuelas(), catalogos.disciplinas()]);
    const escuelaFija = svc.escuelaFijaEnCatalogo(pendiente, escuelas ?? []);
    const seleccion = await selectores.abrir<any>(SelectorEspecialidadMagicaModalComponent, {
        titulo: 'Especialización mágica', nombreClase: clase.Nombre, mostrarArcano: pendiente.requiereArcano,
        mostrarPsionico: pendiente.requierePsionico, escuelas: escuelas ?? [], escuelaFija, disciplinas: disciplinas ?? [],
    }, ['confirmar'], []);
    if (!seleccion)
        return false;
    const aplicado = svc.aplicarEspecialidadMagicaClase(clase, nivelClase, seleccion, escuelas ?? [], disciplinas ?? []);
    if (!aplicado.aplicado) {
        await avisarPaso('Especialización inválida', aplicado.razon ?? 'No se ha podido aplicar la especialización.');
        return false;
    }
    svc.refrescarSesionConjurosPorEspecialidad();
    return true;
}

async function resolverEnemigos(svc: NuevoPersonajeService, selectores: HuecoDeSelectores, especiales: any[],
    catalogos: CatalogosDelNivel): Promise<boolean> {
    const total = svc.contarSeleccionesEnemigoPredilectoPorEspeciales(especiales);
    if (total < 1)
        return true;
    const enemigos = (await catalogos.enemigos()) ?? [];
    for (let i = 1; i <= total; i++) {
        const id = await selectores.abrir<number>(SelectorEnemigoPredilectoModalComponent, {
            titulo: total > 1 ? `Enemigo predilecto (${i} de ${total})` : 'Enemigo predilecto',
            enemigos, enemigosYaElegidos: svc.PersonajeCreacion.enemigosPredilectos ?? [],
        }, ['confirmar'], []);
        const enemigo = enemigos.find((e: any) => toInt(e?.Id) === toInt(id));
        if (!enemigo || !svc.aplicarSeleccionEnemigoPredilecto(enemigo))
            return false;
    }
    return true;
}

/**
 * Lo que la progresión de sus rasgos le deja elegir a este nivel (`Elige_opcional`: el segundo sigilo de poder del
 * iluminiano a 2.º nivel), con el selector de raciales opcionales de la creación y solo los de ese grupo que aún no
 * tiene. `false` si se cierra sin elegir.
 */
function resolverEleccionesRaciales(svc: NuevoPersonajeService, selectores: HuecoDeSelectores): Promise<boolean> {
    return svc.resolverEleccionesRacialesPendientes(async ({ pendiente, grupos, titulo }) => {
        const seleccion = await selectores.abrir<Record<number, string>>(SelectorRacialesOpcionalesModalComponent, {
            grupos, titulo, razaContextoNombre: `${svc.RazaSeleccionada?.Nombre ?? ''}`.trim(),
        }, ['confirmar'], ['cerrar']);
        return seleccion ? `${seleccion[pendiente.grupo] ?? ''}` : null;
    });
}
