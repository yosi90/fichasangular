import { Component, Input } from '@angular/core';
import { IdeasIaService, ModelosIaProveedor, SeleccionModeloIa } from 'src/app/services/ideas-ia.service';

const NOMBRES_PROVEEDOR: Record<string, string> = { anthropic: 'Anthropic (Claude)', openai: 'OpenAI' };

const ERRORES_MODELOS: Record<string, string> = {
    sin_clave_de_ia: 'Sin clave',
    clave_de_ia_rechazada: 'La clave no vale',
    proveedor_sin_respuesta: 'No responde',
    claves_ia_no_configuradas: 'No disponible',
};

/**
 * Botón con el modelo de IA: «Automático» (el que elige Rol) o uno de los modelos a los que llega la clave de la persona
 * (`GET /v1/ia/modelos`). Nunca un campo de texto (ecosistema-kit/CLAVES_DE_IA.md, kit 1.45). Con `uso="imagen"`, los
 * modelos de imagen de OpenAI, para las imágenes del personaje, con su propia elección.
 */
@Component({
    selector: 'app-modelo-ia-menu',
    templateUrl: './modelo-ia-menu.component.html',
    styleUrls: ['./ideas-ia.component.sass'],
    standalone: false
})
export class ModeloIaMenuComponent {
    @Input() uso: 'texto' | 'imagen' = 'texto';

    modelos: ModelosIaProveedor[] | null = null;
    cargando = false;
    error = false;

    constructor(private ideasIaSvc: IdeasIaService) { }

    get seleccion(): SeleccionModeloIa | null {
        return this.senal();
    }

    private get senal() {
        return this.uso === 'imagen' ? this.ideasIaSvc.seleccionImagen : this.ideasIaSvc.seleccion;
    }

    get descripcion(): string {
        const que = this.uso === 'imagen' ? 'Modelo de imagen' : 'Modelo de IA';
        return this.seleccion ? `${que}: ${this.seleccion.nombre}` : `${que}: automático`;
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
            this.modelos = this.uso === 'imagen'
                ? [{ proveedor: 'openai', modelos: await this.ideasIaSvc.modelosDeImagen(), error: null }]
                : await this.ideasIaSvc.modelos();
        } catch {
            this.error = true;
        } finally {
            this.cargando = false;
        }
    }

    elegir(seleccion: SeleccionModeloIa | null): void {
        this.senal.set(seleccion);
    }

    esElegido(proveedor: string, modelo: string): boolean {
        const actual = this.seleccion;
        return !!actual && actual.proveedor === proveedor && actual.modelo === modelo;
    }
}
