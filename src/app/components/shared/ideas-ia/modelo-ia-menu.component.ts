import { Component } from '@angular/core';
import { IdeasIaService, ModelosIaProveedor, SeleccionModeloIa } from 'src/app/services/ideas-ia.service';

const NOMBRES_PROVEEDOR: Record<string, string> = { anthropic: 'Anthropic (Claude)', openai: 'OpenAI' };

const ERRORES_MODELOS: Record<string, string> = {
    sin_clave_de_ia: 'Sin clave',
    clave_de_ia_rechazada: 'La clave no vale',
    proveedor_sin_respuesta: 'No responde',
    claves_ia_no_configuradas: 'No disponible',
};

/**
 * Botón con el modelo de IA para las ideas: «Automático» (el que elige Rol) o uno de los modelos a los que llega la
 * clave de la persona (`GET /v1/ia/modelos`). Nunca un campo de texto (ecosistema-kit/CLAVES_DE_IA.md, kit 1.45).
 */
@Component({
    selector: 'app-modelo-ia-menu',
    templateUrl: './modelo-ia-menu.component.html',
    styleUrls: ['./ideas-ia.component.sass'],
    standalone: false
})
export class ModeloIaMenuComponent {
    modelos: ModelosIaProveedor[] | null = null;
    cargando = false;
    error = false;

    constructor(private ideasIaSvc: IdeasIaService) { }

    get seleccion(): SeleccionModeloIa | null {
        return this.ideasIaSvc.seleccion();
    }

    get descripcion(): string {
        return this.seleccion ? `Modelo de IA: ${this.seleccion.nombre}` : 'Modelo de IA: automático';
    }

    nombreProveedor(proveedor: string): string {
        return NOMBRES_PROVEEDOR[proveedor] ?? proveedor;
    }

    motivoSinModelos(error: string | null): string {
        return (error && ERRORES_MODELOS[error]) || 'Sin modelos';
    }

    async cargar(): Promise<void> {
        if (this.cargando)
            return;
        this.cargando = true;
        this.error = false;
        try {
            this.modelos = await this.ideasIaSvc.modelos();
        } catch {
            this.error = true;
        } finally {
            this.cargando = false;
        }
    }

    elegir(seleccion: SeleccionModeloIa | null): void {
        this.ideasIaSvc.seleccion.set(seleccion);
    }

    esElegido(proveedor: string, modelo: string): boolean {
        const actual = this.seleccion;
        return !!actual && actual.proveedor === proveedor && actual.modelo === modelo;
    }
}
