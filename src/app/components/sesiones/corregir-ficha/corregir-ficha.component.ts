import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Caracteristica } from 'src/app/interfaces/caracteristica';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { MAXIMO_MOTIVO_CORRECCION, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { CARACTERISTICAS_DEL_ALTA, CambiosCorreccion, DoteDeLaFicha, fichaDeLaCorreccion } from 'src/app/services/utils/correccion-ficha';
import { toInt } from 'src/app/services/utils/normalizacion';
import { PgSubida, pgTrasCambioDeCon } from 'src/app/services/utils/subida-nivel';

/** Una dote del personaje en la corrección. */
interface FilaDote extends DoteDeLaFicha {
    nombre: string;
    extra: string;
    quitada: boolean;
}

/** Una dote que deja de cumplir sus prerrequisitos con lo corregido: se quita o se mantiene como homebrew. */
interface DoteRota extends DoteDeLaFicha {
    nombre: string;
    razones: string[];
    mantenida: boolean;
}

/** Un idioma o un conjuro conocido de la `entrada`, que se puede quitar. */
interface FilaQuitable {
    id: number;
    idClase: number | null;
    nombre: string;
    quitado: boolean;
}

/**
 * La corrección de la ficha (roadmap de sesiones, fase 6; `PUT /personajes/{id}/ficha`): arreglar un error de la ficha.
 * Es retroactiva (lo corregido vale desde que se creó), así que la web recalcula en cascada lo que depende de ello con el
 * motor de la creación (su propia instancia, hidratada como para la subida): las puntuaciones desde su base, los PG con la
 * Constitución retroactiva y los prerrequisitos de las dotes que tiene; lo que deja de cumplirse se quita o se mantiene
 * como homebrew (dictamen del máster de Rol). Las puntuaciones las corrige el máster de su campaña (sin campaña, su
 * dueño). Queda como un evento de la sesión abierta, también la 0, y se deshace desde el historial.
 */
@Component({
    selector: 'app-corregir-ficha',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
    templateUrl: './corregir-ficha.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass', './corregir-ficha.component.sass'],
    providers: [NuevoPersonajeService],
})
export class CorregirFichaComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    readonly maximoMotivo = MAXIMO_MOTIVO_CORRECCION;
    readonly caracteristicas = CARACTERISTICAS_DEL_ALTA;

    cargando = true;
    guardando = false;
    error = '';

    pj: Personaje | null = null;
    sesion: SesionPersonaje | null = null;
    /** Si corrige las puntuaciones (el máster de su campaña o, sin campaña, su dueño). */
    puedeCaracteristicas = false;
    base: Record<Caracteristica, number> = {} as Record<Caracteristica, number>;
    dotes: FilaDote[] = [];
    rotas: DoteRota[] = [];
    idiomas: FilaQuitable[] = [];
    conjuros: FilaQuitable[] = [];
    pg: PgSubida | null = null;
    motivo = '';

    private entrada: PersonajeCreateRequestDto | null = null;
    private finalesAntes: Record<Caracteristica, number> = {} as Record<Caracteristica, number>;
    private mantenidas = new Set<number>();
    private uid = '';
    private destruido = false;

    constructor(
        public svc: NuevoPersonajeService,
        private auth: Auth,
        private sesionesSvc: SesionesService,
        private personajeSvc: PersonajeService,
        private puerta: SubidaNivelPuertaService,
        private motor: MotorDesdeFichaService,
    ) { }

    ngOnInit(): void {
        void this.cargar();
    }

    ngOnDestroy(): void {
        this.destruido = true;
    }

    final(key: Caracteristica): number {
        return toInt((this.svc.PersonajeCreacion as any)?.[key]);
    }

    get pendientes(): DoteRota[] {
        return this.rotas.filter((r) => !r.mantenida);
    }

    /** Lo que cambia, en frases (el resumen antes de guardar). */
    get cambios(): string[] {
        const salida: string[] = [];
        this.caracteristicas.forEach(([, key]) => {
            if (this.final(key) !== toInt(this.finalesAntes[key]))
                salida.push(`${key === 'Constitucion' ? 'Constitución' : key === 'Sabiduria' ? 'Sabiduría' : key} ${this.finalesAntes[key]} → ${this.final(key)}`);
        });
        if (this.pg && this.pg.total !== toInt(this.entrada?.personaje?.puntosGolpe))
            salida.push(`PG ${toInt(this.entrada?.personaje?.puntosGolpe)} → ${this.pg.total}${this.pg.exacto ? '' : ' (aproximado: hay DG sin su tirada)'}`);
        this.dotes.filter((d) => d.quitada).forEach((d) => salida.push(`Quita la dote ${d.nombre}${d.extra ? ` (${d.extra})` : ''}`));
        this.rotas.filter((r) => r.mantenida).forEach((r) => salida.push(`Mantiene ${r.nombre} sin sus prerrequisitos (homebrew)`));
        this.idiomas.filter((i) => i.quitado).forEach((i) => salida.push(`Quita el idioma ${i.nombre}`));
        this.conjuros.filter((c) => c.quitado).forEach((c) => salida.push(`Quita el conjuro ${c.nombre}`));
        return salida;
    }

    get puedeGuardar(): boolean {
        return !this.guardando && this.cambios.length > 0 && this.pendientes.length === 0;
    }

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.uid = `${this.auth.currentUser?.uid ?? ''}`.trim();
        try {
            const historial = await this.sesionesSvc.historial(this.idPersonaje);
            if (!historial.puedeApuntar)
                throw new Error('Solo su dueño o el máster de su campaña pueden corregir la ficha.');
            const abierta = historial.sesiones.find((s) => s.estado === 'abierta') ?? null;
            if (!abierta)
                throw new Error('Para corregir la ficha hace falta una sesión abierta: ábrela o reabre la última desde el historial.');
            const { sesion, ficha, entrada } = await this.sesionesSvc.sesion(this.idPersonaje, abierta.numero);
            if (!this.sigueLaMismaCuenta())
                return;
            if (!entrada)
                throw new Error('La API no ha dado la ficha de la sesión abierta.');
            this.sesion = sesion;
            this.entrada = entrada;
            this.pj = this.personajeSvc.fichaDeApi(ficha);
            this.puedeCaracteristicas = historial.rolActor === 'master' || toInt(entrada.personaje?.campana?.id) <= 0;
            await this.motor.cargarCatalogos(this.svc);
            await this.hidratar();
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la corrección.';
        } finally {
            this.cargando = false;
        }
    }

    private async hidratar(): Promise<void> {
        await this.motor.hidratar(this.svc, this.pj!, this.entrada!);
        this.base = this.svc.getBaseCaracteristicas();
        this.caracteristicas.forEach(([, key]) => this.finalesAntes[key] = this.final(key));
        this.mantenidas = new Set((this.entrada!.decisionesHomebrew ?? [])
            .filter((d) => d.tipo === 'requisitos_dote').map((d) => toInt(d.idElemento)));
        this.dotes = (this.svc.PersonajeCreacion.DotesContextuales ?? [])
            .filter((d) => d?.Contexto?.Entidad === 'personaje' || !d?.Contexto?.Entidad)
            .map((d) => ({
                idDote: toInt(d?.Dote?.Id), idExtra: toInt(d?.Contexto?.Id_extra), origen: `${(d?.Contexto as any)?.Origen ?? ''}`,
                nombre: `${d?.Dote?.Nombre ?? ''}`, extra: toInt(d?.Contexto?.Id_extra) > 0 ? `${d?.Contexto?.Extra ?? ''}` : '', quitada: false,
            }))
            .filter((d) => d.idDote > 0);
        const s: any = this.svc;
        const nombre = (lista: Array<{ Id?: number; Nombre?: string; }> | undefined, id: number) =>
            (lista ?? []).find((x) => toInt(x?.Id) === toInt(id))?.Nombre ?? `#${id}`;
        this.idiomas = (this.entrada!.colecciones?.idiomas ?? []).map((i) => ({
            id: toInt(i.idIdioma), idClase: null, nombre: nombre(this.svc.EstadoFlujo.ventajas.catalogoIdiomas as any, toInt(i.idIdioma)), quitado: false,
        }));
        this.conjuros = (this.entrada!.colecciones?.conjurosConocidos ?? []).filter((c) => !c.copiado).map((c) => {
            const idClase = toInt(c.idClase) > 0 ? toInt(c.idClase) : null;
            const clase = idClase ? ` (${nombre(s.catalogoClases, idClase).toLowerCase()})` : '';
            return { id: toInt(c.idConjuro), idClase, nombre: `${nombre(s.catalogoConjuros, toInt(c.idConjuro))}${clase}`, quitado: false };
        });
        this.recalcular();
    }

    private sigueLaMismaCuenta(): boolean {
        return !this.destruido && `${this.auth.currentUser?.uid ?? ''}`.trim() === this.uid && this.uid.length > 0;
    }

    // --- La cascada ----------------------------------------------------------------------------------------------------

    /** Con lo corregido: los PG (la Constitución retroactiva con las tiradas guardadas) y las dotes que dejan de cumplirse. */
    private recalcular(): void {
        this.pg = pgTrasCambioDeCon(this.entrada!, toInt(this.pj?.Nivel_personaje), toInt(this.svc.PersonajeCreacion.ModConstitucion), null);
        this.rotas = this.svc.dotesSinSusPrerrequisitos().map((r) => ({ ...r, mantenida: this.mantenidas.has(r.idDote) }));
    }

    cambiarBase(key: Caracteristica, valor: number): void {
        if (!this.puedeCaracteristicas)
            return;
        this.svc.corregirBaseCaracteristica(key, valor);
        this.base = this.svc.getBaseCaracteristicas();
        this.recalcular();
    }

    quitarDote(fila: FilaDote | DoteRota): void {
        const dote = this.dotes.find((d) => !d.quitada && d.idDote === fila.idDote && d.idExtra === fila.idExtra && d.origen === fila.origen);
        if (!dote || !this.svc.quitarDoteDeLaFicha(dote.idDote, dote.idExtra, dote.origen))
            return;
        dote.quitada = true;
        this.mantenidas.delete(dote.idDote);
        this.recalcular();
    }

    mantener(rota: DoteRota): void {
        this.mantenidas.add(rota.idDote);
        rota.mantenida = true;
    }

    quitar(fila: FilaQuitable): void {
        fila.quitado = true;
    }

    // --- El guardado ---------------------------------------------------------------------------------------------------

    private cambiosParaGuardar(): CambiosCorreccion {
        const caracteristicas: Partial<Record<Caracteristica, number>> = {};
        this.caracteristicas.forEach(([, key]) => caracteristicas[key] = this.final(key) - toInt(this.finalesAntes[key]));
        return {
            caracteristicas,
            puntosGolpe: this.pg?.total ?? null,
            dotesQuitadas: this.dotes.filter((d) => d.quitada).map(({ idDote, idExtra, origen }) => ({ idDote, idExtra, origen })),
            dotesMantenidas: this.rotas.filter((r) => r.mantenida).map((r) => r.idDote),
            idiomasQuitados: this.idiomas.filter((i) => i.quitado).map((i) => i.id),
            conjurosQuitados: this.conjuros.filter((c) => c.quitado).map((c) => ({ idConjuro: c.id, idClase: c.idClase })),
        };
    }

    async guardar(): Promise<void> {
        if (!this.puedeGuardar || !this.sesion || !this.entrada)
            return;
        this.guardando = true;
        this.error = '';
        try {
            await this.sesionesSvc.corregirFicha(this.idPersonaje, {
                ficha: fichaDeLaCorreccion(this.entrada, this.cambiosParaGuardar()),
                version: this.sesion.version,
                ...(this.motivo.trim() ? { motivo: this.motivo.trim().slice(0, this.maximoMotivo) } : {}),
            });
            if (!this.sigueLaMismaCuenta())
                return;
            this.puerta.subidaHecha(this.idPersonaje);
            this.alTerminar?.();
        } catch (error: any) {
            if (this.sigueLaMismaCuenta())
                this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido guardar la corrección.';
        } finally {
            this.guardando = false;
        }
    }

    async empezarDeNuevo(): Promise<void> {
        this.error = '';
        this.motivo = '';
        await this.hidratar();
    }

    cancelar(): void {
        this.alTerminar?.();
    }
}
