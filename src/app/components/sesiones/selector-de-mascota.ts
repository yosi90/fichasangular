import {
    SelectorCompaneroConfirmacion, SelectorCompaneroModalComponent,
} from 'src/app/components/nuevo-personaje/selector-companero-modal/selector-companero-modal.component';
import {
    SelectorFamiliarConfirmacion, SelectorFamiliarModalComponent,
} from 'src/app/components/nuevo-personaje/selector-familiar-modal/selector-familiar-modal.component';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { claveCompanero, EntradasSelectorCompanero } from 'src/app/services/utils/companero-reglas';
import { claveFamiliar, EntradasSelectorFamiliar } from 'src/app/services/utils/familiar-reglas';
import { toInt } from 'src/app/services/utils/normalizacion';
import { HuecoDeSelectores } from './hueco-selectores';

/*
 * El selector del compañero animal y el del familiar de la creación, abiertos desde una pestaña de la sesión (en su
 * `HuecoDeSelectores`): el reciclaje de la mascota en la subida (`subir-nivel`) y obtener otra fuera del reciclaje
 * (`mascota-sesion`). Cada uno da sus entradas con los filtros del selector (el homebrew y el nivel del compañero o la
 * plantilla del familiar); el selector vuelve a juzgar al cambiarlos.
 */

/** La criatura elegida en el selector (la del catálogo, con todas sus filas) y el nombre que le puso. */
export interface MascotaElegida<T> {
    criatura: T;
    nombre: string;
}

/**
 * Lo que abre el selector de una mascota: su título, sus cupos, el homebrew al abrirlo, el catálogo del que elige y sus
 * entradas con los filtros del selector (`filtros`).
 */
interface SelectorDeMascota<T, F, E> {
    titulo: string;
    cuposDisponibles: number;
    homebrew: boolean;
    catalogo: readonly T[];
    entradas: (filtros: F) => E;
}

/** El compañero elegido en el selector de la creación (con el filtro del nivel), o `null` si se cancela. */
export async function elegirCompaneroEnElSelector(
    selectores: HuecoDeSelectores,
    opciones: SelectorDeMascota<CompaneroMonstruoDetalle, { incluirHomebrew: boolean; nivelSeleccionado: number | null; }, EntradasSelectorCompanero>,
): Promise<MascotaElegida<CompaneroMonstruoDetalle> | null> {
    let homebrew = opciones.homebrew;
    let nivel: number | null = null;
    const entradas = () => {
        const e = opciones.entradas({ incluirHomebrew: homebrew, nivelSeleccionado: nivel });
        nivel = e.nivelSeleccionado;
        return {
            companerosElegibles: e.elegibles, companerosBloqueados: e.bloqueados, nivelesRequeridos: e.nivelesRequeridos, ajustes: e.ajustes,
            nivelesDisponibles: e.nivelesDisponibles, nivelSeleccionado: e.nivelSeleccionado, incluirHomebrew: homebrew,
        };
    };
    const seleccion = await selectores.abrir<SelectorCompaneroConfirmacion>(SelectorCompaneroModalComponent, {
        titulo: opciones.titulo, cuposDisponibles: opciones.cuposDisponibles, nombreCompanero: '', ...entradas(),
    }, ['confirmar'], ['omitir'], {}, {
        incluirHomebrewChange: (valor: boolean) => { homebrew = !!valor; return entradas(); },
        nivelChange: (valor: number | null) => { nivel = valor; return entradas(); },
        nombreCompaneroChange: (valor: string) => ({ nombreCompanero: `${valor ?? ''}` }),
    });
    const criatura = seleccion ? opciones.catalogo.find((c) => claveCompanero(c) === claveCompanero(seleccion.companero)) : null;
    return criatura && seleccion ? { criatura, nombre: seleccion.nombre } : null;
}

/** El familiar elegido en el selector de la creación (con el filtro de la plantilla), o `null` si se cancela. */
export async function elegirFamiliarEnElSelector(
    selectores: HuecoDeSelectores,
    opciones: SelectorDeMascota<FamiliarMonstruoDetalle, { incluirHomebrew: boolean; plantillaSeleccionada: number | null; }, EntradasSelectorFamiliar>,
): Promise<MascotaElegida<FamiliarMonstruoDetalle> | null> {
    let homebrew = opciones.homebrew;
    let plantilla: number | null = null;
    const entradas = () => {
        const e = opciones.entradas({ incluirHomebrew: homebrew, plantillaSeleccionada: plantilla });
        return {
            familiaresElegibles: e.elegibles, familiaresBloqueados: e.bloqueados, nivelesRequeridos: e.nivelesRequeridos,
            plantillasDisponibles: e.plantillas, plantillaSeleccionada: plantilla, incluirHomebrew: homebrew,
        };
    };
    const seleccion = await selectores.abrir<SelectorFamiliarConfirmacion>(SelectorFamiliarModalComponent, {
        titulo: opciones.titulo, cuposDisponibles: opciones.cuposDisponibles, nombreFamiliar: '', ...entradas(),
    }, ['confirmar'], ['omitir'], {}, {
        incluirHomebrewChange: (valor: boolean) => { homebrew = !!valor; return entradas(); },
        plantillaChange: (valor: number | null) => { plantilla = valor === null || valor === undefined ? null : toInt(valor) || null; return entradas(); },
        nombreFamiliarChange: (valor: string) => ({ nombreFamiliar: `${valor ?? ''}` }),
    });
    const criatura = seleccion ? opciones.catalogo.find((c) => claveFamiliar(c) === claveFamiliar(seleccion.familiar)) : null;
    return criatura && seleccion ? { criatura, nombre: seleccion.nombre } : null;
}
