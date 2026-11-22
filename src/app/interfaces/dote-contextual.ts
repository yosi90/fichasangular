import { Dote } from "./dote";

export interface DoteLegacy {
    Nombre: string;
    Descripcion: string;
    Beneficio: string;
    Pagina: number;
    Extra: string;
    Origen: string;
    /** La conserva sin poder usarla hasta que vuelva a cumplir sus prerrequisitos (MJ pág. 87; desde el 2026-11-13). */
    Sin_prerrequisitos?: boolean;
}

interface DoteContextoBase {
    Entidad: "personaje" | "raza" | "plantilla";
    Extra: string;
    Id_extra: number;
    /**
     * Adicional: no llena un hueco de dote de sus DG (la «(B)» del bloque de un monstruo; en una plantilla, abajo). Solo lo
     * traen los monstruos y las plantillas.
     */
    Adicional?: boolean;
}

export interface DoteContextoPersonaje extends DoteContextoBase {
    Entidad: "personaje";
    Id_personaje: number;
    Origen?: string;
    /**
     * La conserva sin poder usarla hasta que vuelva a cumplir sus prerrequisitos (al perder un nivel: MJ pág. 87); no es
     * homebrew. Desde el 2026-11-13.
     */
    Sin_prerrequisitos?: boolean;
    /**
     * Suspendida: una dote elevada tras una caída con `dotesElevadas` sin su expiación (contrato: personajes.md, «La mascota
     * inactiva…»; *Libro de obras elevadas*, pág. 39). Se conserva sin poder usarla: no abre la mascota de su fila ni cuenta
     * como prerrequisito.
     */
    Suspendida?: boolean;
    /**
     * En una dote del compañero animal, el DG total en que la eligió (contrato: «Las dotes y las mejoras que elige el
     * compañero»); sin él, la de su monstruo o su tabla.
     */
    Dg?: number;
}

export interface DoteContextoRaza extends DoteContextoBase {
    Entidad: "raza";
    Id_raza: number;
}

export interface DoteContextoPlantilla extends DoteContextoBase {
    Entidad: "plantilla";
    Id_plantilla: number;
    Dg?: number;
    /** La plantilla la da solo si cumple sus prerrequisitos y no la tiene ya (el vampiro, MM1, pág. 258). */
    Solo_si_cumple?: boolean;
    /**
     * Adicional: no llena un hueco de dote de los DG que añade la plantilla (la «(B)» del animal de un licántropo y su
     * Voluntad de hierro, MM1, pág. 178). Solo cuenta en una plantilla que añade DG.
     */
    Adicional?: boolean;
}

export type DoteContexto = DoteContextoPersonaje | DoteContextoRaza | DoteContextoPlantilla;

export interface DoteContextual {
    Dote: Dote;
    Contexto: DoteContexto;
}
