import { Comodin } from './comodin';

/** Lo que otorga una aptitud especial: un racial (`/razas/raciales`), un especial de clase, una plantilla o una dote. */
export interface AptitudEspecialOtorgante {
    Id: number;
    Nombre: string;
}

/**
 * Una aptitud especial del manual (ataque o cualidad especial: «Arma de aliento», «Agarrón mejorado», «Alas»…) que puede
 * pedir el prerrequisito `aptitud_especial`, con lo que la otorga. `GET /aptitudes-especiales` (contrato: «Aptitudes
 * especiales» en `docs/publica/endpoints/catalogos.md`).
 */
export interface AptitudEspecial {
    Id: number;
    Nombre: string;
    Raciales: AptitudEspecialOtorgante[];
    Especiales: AptitudEspecialOtorgante[];
    Plantillas: AptitudEspecialOtorgante[];
    Dotes: AptitudEspecialOtorgante[];
    Comodin: Comodin | null;
}
