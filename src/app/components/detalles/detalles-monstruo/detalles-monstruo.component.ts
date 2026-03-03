import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-detalles-monstruo',
    templateUrl: './detalles-monstruo.component.html',
    styleUrls: ['./detalles-monstruo.component.sass']
})
export class DetallesMonstruoComponent {
    private monstruoData!: MonstruoDetalle;

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    @Input()
    set monstruo(value: MonstruoDetalle) {
        this.monstruoData = value;
    }

    get monstruo(): MonstruoDetalle {
        return this.monstruoData;
    }

    @Output() conjuroDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetalles: EventEmitter<DoteContextual> = new EventEmitter<DoteContextual>();
    @Output() racialDetalles: EventEmitter<RacialDetalle> = new EventEmitter<RacialDetalle>();
    @Output() claseDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();
    @Output() tipoCriaturaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() monstruoRelacionadoDetalles: EventEmitter<MonstruoDetalle> = new EventEmitter<MonstruoDetalle>();

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.monstruo?.Manual?.Id,
            nombre: this.monstruo?.Manual?.Nombre,
        });
    }

    abrirDetallesConjuro(idConjuro: number) {
        const id = this.toNumber(idConjuro);
        if (id > 0)
            this.conjuroDetallesId.emit(id);
    }

    abrirDetallesDote(doteCtx: DoteContextual) {
        const id = this.toNumber(doteCtx?.Dote?.Id);
        if (id > 0)
            this.doteDetalles.emit(doteCtx);
    }

    abrirDetallesRacial(racial: RacialDetalle) {
        if (racial && this.tieneTextoVisible(racial?.Nombre))
            this.racialDetalles.emit(racial);
    }

    abrirDetallesClase(idClase: number) {
        const id = this.toNumber(idClase);
        if (id > 0)
            this.claseDetallesId.emit(id);
    }

    abrirDetallesSubtipo(subtipo: { Id?: number | null; Nombre?: string; }) {
        const nombre = `${subtipo?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;
        const id = this.toNumber(subtipo?.Id);
        this.subtipoDetalles.emit({
            Id: id > 0 ? id : null,
            Nombre: nombre,
        });
    }

    abrirDetallesTipoCriatura(idTipo: number) {
        const id = this.toNumber(idTipo);
        if (id > 0)
            this.tipoCriaturaDetallesId.emit(id);
    }

    abrirDetallesMonstruoRelacionado(monstruo: MonstruoDetalle) {
        if (!monstruo || this.toNumber(monstruo.Id) <= 0)
            return;
        this.monstruoRelacionadoDetalles.emit(monstruo);
    }

    getNombreDote(doteCtx: DoteContextual): string {
        const extra = `${doteCtx?.Contexto?.Extra ?? ''}`.trim();
        if (this.tieneTextoVisible(extra) && this.normalizar(extra) !== 'no aplica')
            return `${doteCtx.Dote.Nombre} (${extra})`;
        return doteCtx?.Dote?.Nombre ?? '';
    }

    getManualLabel(): string {
        const nombre = `${this.monstruo?.Manual?.Nombre ?? ''}`.trim();
        const pagina = this.toNumber(this.monstruo?.Manual?.Pagina);
        if (nombre.length < 1)
            return 'Sin manual';
        return pagina > 0 ? `${nombre} (p. ${pagina})` : nombre;
    }

    getAlineamientoLabel(): string {
        const basico = `${this.monstruo?.Alineamiento?.Basico?.Nombre ?? ''}`.trim();
        const ley = `${this.monstruo?.Alineamiento?.Ley?.Nombre ?? ''}`.trim();
        const moral = `${this.monstruo?.Alineamiento?.Moral?.Nombre ?? ''}`.trim();

        if (this.tieneTextoVisible(basico))
            return basico;
        const parcial = `${ley}/${moral}`.replace(/^\/+|\/+$/g, '');
        return this.tieneTextoVisible(parcial) ? parcial : '-';
    }

    get tieneRelacionFamiliarExtendida(): boolean {
        return this.toNumber((this.monstruo as any)?.Id_familiar) > 0;
    }

    get tieneRelacionCompaneroExtendida(): boolean {
        return this.toNumber((this.monstruo as any)?.Id_companero) > 0;
    }

    get esDetalleFamiliarOCompanero(): boolean {
        return this.tieneRelacionFamiliarExtendida || this.tieneRelacionCompaneroExtendida;
    }

    get idFamiliarExtendido(): number {
        return this.toNumber((this.monstruo as any)?.Id_familiar);
    }

    get idCompaneroExtendido(): number {
        return this.toNumber((this.monstruo as any)?.Id_companero);
    }

    get vidaRelacionExtendida(): number {
        return this.toNumber((this.monstruo as any)?.Vida);
    }

    get dgAdicionalCompanero(): number {
        return this.toNumber((this.monstruo as any)?.Dg_adi);
    }

    get trucosAdicionalesCompanero(): number {
        return this.toNumber((this.monstruo as any)?.Trucos_adi);
    }

    get monstruoOrigenLabel(): string {
        return `${(this.monstruo as any)?.Monstruo_origen?.Nombre ?? ''}`.trim();
    }

    get plantillaRelacionLabel(): string {
        return `${(this.monstruo as any)?.Plantilla?.Nombre ?? ''}`.trim();
    }

    get personajesDirectosRelacionados(): Array<{ Id_personaje: number; Nombre: string; }> {
        const lista = Array.isArray((this.monstruo as any)?.Personajes) ? (this.monstruo as any).Personajes : [];
        return lista
            .filter((item: any) => this.toNumber(item?.Id_personaje) > 0 && this.tieneTextoVisible(item?.Nombre))
            .map((item: any) => ({
                Id_personaje: this.toNumber(item?.Id_personaje),
                Nombre: `${item?.Nombre ?? ''}`.trim(),
            }));
    }

    get especialesRelacionados(): Array<{ nombre: string; contexto: string; }> {
        const especiales = Array.isArray((this.monstruo as any)?.Especiales) ? (this.monstruo as any).Especiales : [];
        return especiales
            .map((item: any) => ({
                nombre: `${item?.Especial?.Nombre ?? ''}`.trim(),
                contexto: this.formatearContexto(item?.Contexto),
            }))
            .filter((item: any) => this.tieneTextoVisible(item?.nombre));
    }

    getFamiliaresRelacionados(): MonstruoDetalle[] {
        return (this.monstruo?.Familiares ?? [])
            .filter(item => this.toNumber(item?.Id) > 0 && this.tieneTextoVisible(item?.Nombre))
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    getCompanerosRelacionados(): MonstruoDetalle[] {
        return (this.monstruo?.Companeros ?? [])
            .filter(item => this.toNumber(item?.Id) > 0 && this.tieneTextoVisible(item?.Nombre))
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    getRacialesActivas(): RacialDetalle[] {
        return (this.monstruo?.Raciales ?? []).filter(racial => this.tieneTextoVisible(racial?.Nombre));
    }

    getAtaquesEspecialesActivos(): RacialDetalle[] {
        return (this.monstruo?.Ataques_especiales ?? []).filter(ataque => this.tieneTextoVisible(ataque?.Nombre));
    }

    getHabilidadesConRangos(): Array<{ Habilidad: string; Rangos: number; Extra: string; }> {
        return (this.monstruo?.Habilidades ?? [])
            .map((habilidad) => ({
                Habilidad: `${habilidad?.Habilidad ?? ''}`.trim(),
                Rangos: this.toNumber(habilidad?.Rangos),
                Extra: `${habilidad?.Extra ?? ''}`.trim(),
            }))
            .filter((habilidad) => this.tieneTextoVisible(habilidad.Habilidad) && habilidad.Rangos > 0);
    }

    getTipoSizeLabel(): string {
        const tipo = `${this.monstruo?.Tipo?.Nombre ?? ''}`.trim();
        const tamano = `${this.monstruo?.Tamano?.Nombre ?? ''}`.trim();
        if (this.tieneTextoVisible(tipo) && this.tieneTextoVisible(tamano))
            return `${tipo} (${tamano})`;
        if (this.tieneTextoVisible(tipo))
            return tipo;
        if (this.tieneTextoVisible(tamano))
            return tamano;
        return '-';
    }

    getIdiomasLabel(): string {
        const idiomas = (this.monstruo?.Idiomas ?? [])
            .map(i => `${i?.Nombre ?? ''}`.trim())
            .filter(nombre => this.tieneTextoVisible(nombre));
        if (idiomas.length < 1)
            return '-';
        return idiomas.join(', ');
    }

    getAlineamientosRequeridosLabel(tipo: 'Familiar' | 'Companero'): string {
        const valores = this.getAlineamientosRequeridos(tipo);
        if (valores.length < 1)
            return '-';
        return valores.join(', ');
    }

    getAlineamientosRequeridos(tipo: 'Familiar' | 'Companero'): string[] {
        const lista = this.monstruo?.Alineamientos_requeridos?.[tipo] ?? [];
        return lista
            .map((item) => `${item?.Nombre ?? ''}`.trim())
            .filter((item) => this.tieneTextoVisible(item));
    }

    tieneAlineamientosRequeridos(tipo: 'Familiar' | 'Companero'): boolean {
        return this.getAlineamientosRequeridosLabel(tipo) !== '-';
    }

    tieneNivelesClaseRequeridos(): boolean {
        return this.getNivelesClaseActivos().length > 0;
    }

    tieneRequisitosFamiliar(): boolean {
        return this.tieneAlineamientosRequeridos('Familiar')
            || this.mostrarNivelesEnPanelFamiliar();
    }

    tieneRequisitosCompanero(): boolean {
        return this.tieneAlineamientosRequeridos('Companero')
            || this.mostrarNivelesEnPanelCompanero();
    }

    mostrarNivelesEnPanelFamiliar(): boolean {
        if (!this.tieneNivelesClaseRequeridos())
            return false;

        return this.tieneAlineamientosRequeridos('Familiar')
            || !this.tieneAlineamientosRequeridos('Companero');
    }

    mostrarNivelesEnPanelCompanero(): boolean {
        return this.tieneNivelesClaseRequeridos() && !this.mostrarNivelesEnPanelFamiliar();
    }

    getPersonajesRelacionadosFamiliarLabel(): string {
        const lista = this.monstruo?.Personajes_relacionados?.Por_familiar ?? [];
        return this.formatearListaPersonajes(lista.map(item => ({
            id: item?.Id_personaje,
            nombre: item?.Nombre,
            extra: `F#${this.toNumber(item?.Id_familiar)}`,
        })));
    }

    getPersonajesRelacionadosCompaneroLabel(): string {
        const lista = this.monstruo?.Personajes_relacionados?.Por_companero ?? [];
        return this.formatearListaPersonajes(lista.map(item => ({
            id: item?.Id_personaje,
            nombre: item?.Nombre,
            extra: `C#${this.toNumber(item?.Id_companero)}`,
        })));
    }

    getSubtiposActivos(): Array<{ Id: number; Nombre: string; }> {
        return (this.monstruo?.Subtipos ?? [])
            .filter(subtipo => this.tieneTextoVisible(subtipo?.Nombre))
            .map(subtipo => ({
                Id: this.toNumber(subtipo?.Id),
                Nombre: `${subtipo?.Nombre ?? ''}`.trim(),
            }))
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    getNivelesClaseActivos(): Array<{ idClase: number; nombreClase: string; nivel: number; plantilla: string; dote: string; }> {
        return (this.monstruo?.Niveles_clase ?? [])
            .filter(item => this.toNumber(item?.Clase?.Id) > 0 && this.tieneTextoVisible(item?.Clase?.Nombre))
            .map(item => ({
                idClase: this.toNumber(item?.Clase?.Id),
                nombreClase: `${item?.Clase?.Nombre ?? ''}`.trim(),
                nivel: this.toNumber(item?.Nivel),
                plantilla: `${item?.Plantilla?.Nombre ?? ''}`.trim(),
                dote: `${item?.Dote?.Nombre ?? ''}`.trim(),
            }));
    }

    getSigno(valor: number): string {
        return valor > 0 ? `+${valor}` : `${valor}`;
    }

    getSignoConCeroPositivo(valor: number): string {
        return valor >= 0 ? `+${valor}` : `${valor}`;
    }

    mostrarManiobrabilidad(): boolean {
        const vuela = this.toNumber(this.monstruo?.Movimientos?.Volar) > 0;
        if (!vuela)
            return false;

        const maniobrabilidad = `${this.monstruo?.Maniobrabilidad?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(maniobrabilidad))
            return false;

        const normalizado = this.normalizar(maniobrabilidad).replace(/[.]/g, '');
        return normalizado !== 'no vuela' && normalizado !== 'no modifica';
    }

    tieneTextoVisible(texto: string | undefined | null): boolean {
        if (!texto)
            return false;
        const base = this.normalizar(texto);
        if (!base)
            return false;
        const limpiado = base.replace(/[.]/g, '');
        return limpiado !== 'no especifica'
            && limpiado !== 'no se especifica'
            && limpiado !== 'no aplica'
            && limpiado !== '-';
    }

    private formatearListaPersonajes(items: Array<{ id: any; nombre: any; extra?: string; }>): string {
        const textos = items
            .filter(item => this.toNumber(item?.id) > 0 && this.tieneTextoVisible(`${item?.nombre ?? ''}`))
            .map(item => `${item.nombre}${item.extra ? ` (${item.extra})` : ''}`);
        if (textos.length < 1)
            return '-';
        return textos.join(', ');
    }

    private formatearContexto(contexto: any): string {
        if (!contexto || typeof contexto !== 'object')
            return '';
        const entries = Object.entries(contexto as Record<string, unknown>)
            .filter(([_, value]) => value !== undefined && value !== null && `${value}`.trim().length > 0);
        if (entries.length < 1)
            return '';
        return entries.map(([key, value]) => `${key}: ${value}`).join(' | ');
    }

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private normalizar(value: string): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }
}
