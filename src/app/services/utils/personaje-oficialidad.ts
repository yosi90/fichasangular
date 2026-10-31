import { Personaje } from 'src/app/interfaces/personaje';

/** Lo mínimo de un elemento de catálogo para saber si es oficial. */
interface ConOficial {
    Nombre?: string;
    Oficial?: boolean | null;
}

/** Lo que usa el personaje en creación y no va dentro de `Personaje`: su raza, su raza base y las clases del catálogo. */
export interface ContextoOficialidad {
    raza?: ConOficial | null;
    razaBase?: ConOficial | null;
    /** Las clases del catálogo de los niveles que tiene (`desgloseClases`). */
    clases?: ConOficial[];
    /** Las plantillas elegidas, con su `Oficial` (las de `Personaje.Plantillas` no lo llevan). */
    plantillas?: ConOficial[];
    /** Si eligió ventajas o desventajas (siempre homebrew, decisión del propietario del 2026-10-25). */
    tieneVentajas?: boolean;
    /**
     * La escuela de especialista (del catálogo de escuelas, con su `Oficial`): una homebrew (la Ingeniería mágica) vuelve
     * homebrew la ficha; prohibirla, no (propietario, 2026-10-31).
     */
    escuelaEspecialista?: ConOficial | null;
    /** Los conjuros elegidos en la sesión de conjuros abierta, que aún no están en `Personaje.Conjuros`. */
    conjurosEnSesion?: ConOficial[];
}

function noOficiales(tipo: string, elementos: (ConOficial | null | undefined)[] | null | undefined): string[] {
    return (elementos ?? [])
        .filter((elemento): elemento is ConOficial => !!elemento && elemento.Oficial === false)
        .map((elemento) => `${tipo} homebrew: ${`${elemento.Nombre ?? ''}`.trim() || 'sin nombre'}`);
}

/**
 * Los elementos no oficiales que usa el personaje (decisión del propietario del 2026-10-17: con uno solo, el personaje es
 * homebrew entero): la raza y la raza base, las clases, las plantillas, las dotes, los raciales, los idiomas, los
 * conjuros, la escuela de especialista, el familiar y el compañero, y las ventajas y desventajas. Vacío si todo es
 * oficial. Las restricciones saltadas (alineamiento, edad…) van aparte.
 */
export function motivosHomebrewPersonaje(personaje: Personaje | null | undefined, contexto: ContextoOficialidad): string[] {
    return [
        ...noOficiales('Raza', [contexto.raza]),
        ...noOficiales('Raza base', [contexto.razaBase]),
        ...noOficiales('Clase', contexto.clases),
        ...noOficiales('Plantilla', contexto.plantillas),
        ...noOficiales('Dote', (personaje?.DotesContextuales ?? []).map((item) => item?.Dote)),
        ...noOficiales('Racial', personaje?.Raciales as ConOficial[]),
        ...noOficiales('Idioma', personaje?.Idiomas),
        ...noOficiales('Conjuro', [...(personaje?.Conjuros ?? []), ...(contexto.conjurosEnSesion ?? [])] as ConOficial[]),
        ...noOficiales('Escuela de especialista', [contexto.escuelaEspecialista]),
        ...noOficiales('Familiar', personaje?.Familiares as ConOficial[]),
        ...noOficiales('Compañero', personaje?.Companeros as ConOficial[]),
        ...(contexto.tieneVentajas ? ['Ventajas y desventajas (homebrew)'] : []),
    ];
}

/**
 * Antes de aplicar una elección de la creación que vuelve homebrew la ficha (guía de nuevo personaje, «Homebrew»): los
 * motivos que hay que confirmar, o ninguno si la ficha ya es homebrew por otra cosa (no se vuelve a preguntar) o si la
 * elección no la vuelve homebrew. Sin repetidos ni vacíos.
 */
export function motivosQueConfirmar(motivos: (string | null | undefined)[], yaEsHomebrew: boolean): string[] {
    if (yaEsHomebrew)
        return [];
    return Array.from(new Set(motivos.map((motivo) => `${motivo ?? ''}`.trim()).filter((motivo) => motivo.length > 0)));
}

/** «Clase homebrew: Magiingeniero» de un elemento no oficial; `null` si es oficial (o no se sabe). */
export function motivoHomebrew(tipo: string, elemento: ConOficial | null | undefined): string | null {
    return noOficiales(tipo, [elemento])[0] ?? null;
}
