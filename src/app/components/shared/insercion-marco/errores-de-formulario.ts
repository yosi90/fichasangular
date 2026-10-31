import { AbstractControl } from '@angular/forms';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { mensajeDeError } from 'src/app/services/utils/error-api';

/** Un campo de una inserción: su etiqueta (la de «N cambios: Nombre, Tamaño…») y el paso en el que está. */
export interface CampoDeFormulario {
    etiqueta: string;
    paso: number;
}

/** Los campos de una inserción, por su clave: los controles del formulario y las listas (`dotes`, `prerrequisitos`…). */
export type CamposDeFormulario = Readonly<Record<string, CampoDeFormulario>>;

/**
 * El campo del formulario al que apunta el `field` de un error de la API: con la raíz `plantilla`,
 * «plantilla.nombre» → `nombre`, «dotes[0].dg» → `dotes`, «prerrequisitos.dg[0].cantidad» → `prerrequisitos`.
 * `null` si no es ninguno de `campos`.
 */
export function campoDeErrorApi(field: string | null | undefined, campos: CamposDeFormulario, raiz: string | null): string | null {
    const texto = `${field ?? ''}`.trim();
    if (texto.length < 1)
        return null;
    const partes = texto.split('.');
    const primera = partes[0].replace(/\[\d+\]$/, '');
    const campo = raiz !== null && primera === raiz ? (partes[1] ?? '').replace(/\[\d+\]$/, '') : primera;
    return campos[campo] ? campo : null;
}

/** El error de la API en un campo, con lo que valía el campo entonces (para quitarlo en cuanto se corrige). */
export interface ErrorDeCampo {
    campo: string;
    mensaje: string;
    firma: string;
}

export interface OpcionesErroresDeFormulario {
    campos: CamposDeFormulario;
    /** La clave del objeto principal del cuerpo del alta (`plantilla` en `{ plantilla: {…}, dotes: […] }`), o `null`. */
    raiz: string | null;
    /** El control de un campo, si es un control del formulario (las listas no lo son). */
    control: (campo: string) => AbstractControl | null | undefined;
    /** Lo que vale ahora un campo, en texto, para saber si se ha corregido. */
    firma: (campo: string) => string;
    /** Lleva al paso de un campo. */
    irAPaso: (paso: number) => void;
}

/**
 * Los errores de una inserción como los enseña la plantilla (guía de inserciones, «Validación, permisos y guardado»):
 * el error global en el `bloque-error` del marco (`[error]`) y, si la API dice en qué campo (`field`), también en ese
 * campo (su `mat-error` con la clave `api`, o el texto de su tarjeta), saltando a su paso. El error de un campo se va
 * solo en cuanto se cambia su valor (`seguirCambios`, en cada cambio del formulario).
 */
export class ErroresDeFormulario {
    /** El error global, para `[error]` del marco. */
    global = '';
    /** El campo que la API ha dicho que falla. */
    campo: ErrorDeCampo | null = null;

    constructor(private readonly opciones: OpcionesErroresDeFormulario) { }

    limpiar(): void {
        this.global = '';
        this.campo = null;
    }

    /** El error de un alta o una edición: global y, si la API lo da, en su campo y su paso. */
    mostrar(error: unknown, porDefecto: string): void {
        const campo = error instanceof ProfileApiError ? campoDeErrorApi(error.field, this.opciones.campos, this.opciones.raiz) : null;
        const mensaje = mensajeDeError(error, porDefecto);
        this.global = mensaje;
        if (!campo)
            return;
        this.campo = { campo, mensaje, firma: this.opciones.firma(campo) };
        this.opciones.irAPaso(this.opciones.campos[campo].paso);
        // En un campo del formulario, el error es suyo: se va solo al cambiar su valor (la validación vuelve a correr).
        const control = this.opciones.control(campo);
        if (control) {
            control.setErrors({ ...(control.errors ?? {}), api: mensaje });
            control.markAsTouched();
        }
    }

    /** En cada cambio del formulario: el error de la API en un campo se va en cuanto se corrige ese campo. */
    seguirCambios(): void {
        if (this.campo && this.opciones.firma(this.campo.campo) !== this.campo.firma)
            this.campo = null;
    }

    /** Antes de mandar: lleva al paso del primer campo (en el orden de `campos`) que no es válido. */
    irAlPrimerError(): void {
        const campo = Object.keys(this.opciones.campos).find((clave) => this.opciones.control(clave)?.invalid);
        if (campo)
            this.opciones.irAPaso(this.opciones.campos[campo].paso);
    }

    /** El mensaje de la API de un campo que no es un control (una lista), o `null`. */
    mensajeDe(campo: string): string | null {
        return this.campo?.campo === campo ? this.campo.mensaje : null;
    }

    /** El texto del `mat-error` de un control: el de la API si lo ha dado para él (clave `api`); si no, `porDefecto`. */
    textoDe(campo: string, porDefecto: string): string {
        return `${this.opciones.control(campo)?.errors?.['api'] ?? porDefecto}`;
    }
}
