import Swal from 'sweetalert2';
import { SelectorAumentosCaracteristicaModalComponent } from 'src/app/components/nuevo-personaje/selector-aumentos-caracteristica-modal/selector-aumentos-caracteristica-modal.component';
import { SelectorDotesModalComponent } from 'src/app/components/nuevo-personaje/selector-dotes-modal/selector-dotes-modal.component';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { CampanaService } from 'src/app/services/campana.service';
import { DoteSeleccionConfirmada, NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { caracteristicasPerdidasDe } from 'src/app/services/utils/caracteristicas';
import { toInt } from 'src/app/services/utils/normalizacion';
import { MAX_TIRADAS_PUNTOS_GOLPE, tiradasPuntosGolpe } from 'src/app/services/utils/puntos-golpe';
import { HuecoDeSelectores } from './hueco-selectores';

/*
 * Los pasos que la subida de nivel y la adquisición de una plantilla resuelven igual, con el motor de la creación en su
 * propia instancia y sus selectores en el hueco común (`HuecoDeSelectores`): el incremento de característica y las dotes
 * pendientes, las tiradas de PG que deja la campaña y el aviso de un paso que no se puede cerrar.
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
    if (entrada.personaje?.tipo === 'pnj')
        return MAX_TIRADAS_PUNTOS_GOLPE;
    const campana = toInt(entrada.personaje?.campana?.id);
    if (campana <= 0)
        return 1;
    try {
        const detalle = await campanaSvc.getCampaignDetail(campana);
        return tiradasPuntosGolpe(detalle?.politicaCreacion?.maxTiradasPuntosGolpe);
    } catch {
        return 1;
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
