import { Component, Input } from '@angular/core';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-detalles-ventaja',
    templateUrl: './detalles-ventaja.component.html',
    styleUrls: ['./detalles-ventaja.component.sass']
})
export class DetallesVentajaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    @Input() ventaja!: VentajaDetalle;

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.ventaja?.Manual?.Id,
            nombre: this.ventaja?.Manual?.Nombre,
        });
    }

    get esDesventaja(): boolean {
        return Number(this.ventaja?.Coste) > 0;
    }

    get tipoTexto(): string {
        return this.esDesventaja ? 'Desventaja' : 'Ventaja';
    }

    get costeTexto(): string {
        const coste = Number(this.ventaja?.Coste ?? 0);
        return `${coste > 0 ? '+' : ''}${coste}`;
    }

    get mejoraTexto(): string {
        const mejora = Number(this.ventaja?.Mejora ?? 0);
        return `${mejora > 0 ? '+' : ''}${mejora}`;
    }

    get tieneMejoraVisible(): boolean {
        return Number(this.ventaja?.Mejora ?? 0) !== 0;
    }

    getMateriaCaracteristica(): string[] {
        const resultado: string[] = [];
        if (this.ventaja?.Fuerza)
            resultado.push('Fuerza');
        if (this.ventaja?.Destreza)
            resultado.push('Destreza');
        if (this.ventaja?.Constitucion)
            resultado.push('Constitución');
        if (this.ventaja?.Inteligencia)
            resultado.push('Inteligencia');
        if (this.ventaja?.Sabiduria)
            resultado.push('Sabiduría');
        if (this.ventaja?.Carisma)
            resultado.push('Carisma');
        return resultado;
    }

    getMateriaSalvacion(): string[] {
        const resultado: string[] = [];
        if (this.ventaja?.Fortaleza)
            resultado.push('Fortaleza');
        if (this.ventaja?.Reflejos)
            resultado.push('Reflejos');
        if (this.ventaja?.Voluntad)
            resultado.push('Voluntad');
        return resultado;
    }

    getFlagsActivos(): string[] {
        const flags: string[] = [];
        if (this.ventaja?.Caracteristica)
            flags.push('Ajusta característica');
        if (this.ventaja?.Iniciativa)
            flags.push('Afecta iniciativa');
        if (this.ventaja?.Aumenta_oro)
            flags.push('Aumenta oro inicial');
        if (this.ventaja?.Duplica_oro)
            flags.push('Duplica oro inicial');
        if (this.ventaja?.Idioma_extra)
            flags.push('Otorga idioma extra');
        if (this.ventaja?.Disipable)
            flags.push('Disipable');
        return flags;
    }

    tieneTextoVisible(texto: string | undefined | null): boolean {
        return `${texto ?? ''}`.trim().length > 0;
    }

    private normalizarTexto(texto: string | undefined | null): string {
        return `${texto ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private esNombreReferenciaNoValido(nombre: string | undefined | null): boolean {
        const normalizado = this.normalizarTexto(nombre);
        return normalizado.length < 1
            || normalizado === 'ninguno'
            || normalizado === 'no aplica'
            || normalizado === 'no especifica'
            || normalizado === 'no se especifica';
    }

    tieneManualVisible(): boolean {
        return this.tieneTextoVisible(this.ventaja?.Manual?.Nombre);
    }

    tieneRasgoVisible(): boolean {
        const id = Number(this.ventaja?.Rasgo?.Id ?? 0);
        return id > 0 && !this.esNombreReferenciaNoValido(this.ventaja?.Rasgo?.Nombre);
    }

    tieneIdiomaVisible(): boolean {
        const id = Number(this.ventaja?.Idioma?.Id ?? 0);
        return id > 0 && !this.esNombreReferenciaNoValido(this.ventaja?.Idioma?.Nombre);
    }

    tieneHabilidadVisible(): boolean {
        const id = Number(this.ventaja?.Habilidad?.Id ?? -1);
        const nombreNormalizado = this.normalizarTexto(this.ventaja?.Habilidad?.Nombre);
        if (id < 0)
            return false;
        if (id === 0)
            return nombreNormalizado === 'elegir';
        return !this.esNombreReferenciaNoValido(this.ventaja?.Habilidad?.Nombre);
    }
}
