import { Auth } from '@angular/fire/auth';

/**
 * La cuenta con la que se abrió una pantalla de las sesiones (la subida de nivel, la corrección de la ficha y la
 * adquisición de una plantilla), para descartar lo que llega después de cerrarla o de cambiar de cuenta
 * (`ecosistema-kit/CAMBIO_DE_CUENTA.md`): `fijar()` al cargar, `sigue()` antes de aplicar cada respuesta y `destruir()` en
 * `ngOnDestroy`.
 */
export class MismaCuenta {
    private fijada = '';
    private destruida = false;

    constructor(private readonly auth: Pick<Auth, 'currentUser'>) { }

    /** La cuenta fijada (vacía si no había sesión): la del borrador de la subida, por ejemplo. */
    get uid(): string {
        return this.fijada;
    }

    /** Fija la cuenta de ahora. */
    fijar(): void {
        this.fijada = this.actual();
    }

    /** Si la pantalla sigue abierta y con la misma cuenta, que no está vacía. */
    sigue(): boolean {
        return !this.destruida && this.fijada.length > 0 && this.actual() === this.fijada;
    }

    /** La pantalla se cierra: desde ahora no sigue. */
    destruir(): void {
        this.destruida = true;
    }

    private actual(): string {
        return `${this.auth.currentUser?.uid ?? ''}`.trim();
    }
}
