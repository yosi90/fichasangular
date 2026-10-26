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
}

function noOficiales(tipo: string, elementos: (ConOficial | null | undefined)[] | null | undefined): string[] {
    return (elementos ?? [])
        .filter((elemento): elemento is ConOficial => !!elemento && elemento.Oficial === false)
        .map((elemento) => `${tipo} homebrew: ${`${elemento.Nombre ?? ''}`.trim() || 'sin nombre'}`);
}

/**
 * Los elementos no oficiales que usa el personaje (decisión del propietario del 2026-10-17: con uno solo, el personaje es
 * homebrew entero): la raza y la raza base, las clases, las plantillas, las dotes, los raciales, los idiomas, el familiar
 * y el compañero, y las ventajas y desventajas. Vacío si todo es oficial. Las restricciones saltadas (alineamiento, edad…)
 * van aparte.
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
        ...noOficiales('Familiar', personaje?.Familiares as ConOficial[]),
        ...noOficiales('Compañero', personaje?.Companeros as ConOficial[]),
        ...(contexto.tieneVentajas ? ['Ventajas y desventajas (homebrew)'] : []),
    ];
}
