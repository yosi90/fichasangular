import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { ExperienciaPersonaje, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { NOMBRES_CARACTERISTICAS } from 'src/app/services/utils/caracteristicas';
import { daDotePorNivelDePersonaje, daIncrementoPorNivelDePersonaje } from 'src/app/services/utils/clase-niveles';
import { CARACTERISTICAS_DEL_ALTA } from 'src/app/services/utils/correccion-ficha';
import { toInt } from 'src/app/services/utils/normalizacion';
import {
    CAUSAS_PERDIDA, CausaPerdida, caracteristicaMasAlta, fichaConConstitucionPerdida, fichaSinElNivel, indiceDelNivelQueSePierde,
    ordenConocido, pxTrasPerder, quitadoVacio, ResultadoPerdida,
} from 'src/app/services/utils/perder-nivel';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';
import { nombreDoteConExtra, tieneTextoVisible } from 'src/app/services/utils/texto-visible';

/** Una fila de «Lo que pierde»: qué, antes, ahora. */
export interface FilaPerdida {
    que: string;
    antes: string;
    ahora: string;
}

/**
 * Perder un nivel con el personaje ya creado (roadmap de sesiones, fase 7, segunda tanda): la causa (volver a la vida,
 * un nivel negativo permanente, el coste de una plantilla u otra) y un concepto, lo que pierde a la vista (el último nivel
 * que ganó con lo que eligió en él: `fichaSinElNivel`; con un solo DG, al volver a la vida, 2 puntos de Constitución) y
 * confirmar (`POST /personajes/{id}/niveles/perdida`). La subida siguiente vuelve a pedir lo de ese nivel.
 * Se abre desde «Perder un nivel» del historial (`SubidaNivelPuertaService.solicitarPerdida`) en su pestaña. Usa el motor
 * de la creación en su propia instancia (`MotorDesdeFichaService`) para el catálogo de clases y el dado de golpe.
 */
@Component({
    selector: 'app-perder-nivel',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './perder-nivel.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class PerderNivelComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    readonly causas = CAUSAS_PERDIDA;
    cargando = true;
    guardando = false;
    error = '';

    pj: Personaje | null = null;
    entrada: PersonajeCreateRequestDto | null = null;
    sesion: SesionPersonaje | null = null;
    experiencia: ExperienciaPersonaje | null = null;

    causa: CausaPerdida = 'revivir';
    concepto = '';
    /** Con el orden de sus niveles por conocer: la clase que pierde el nivel, la característica del incremento y la dote. */
    idClaseElegida: number | null = null;
    incrementoElegido: number | null = null;
    doteElegida = '';

    /** Sus DG antes de perderlo (de clase, raciales y de plantilla): con uno solo, al volver a la vida pierde Constitución. */
    dgs = 0;
    resultado: ResultadoPerdida | null = null;
    filas: FilaPerdida[] = [];
    /** Por qué no se puede (un solo DG con otra causa, sin Constitución…): bloquea el botón. */
    impedimento = '';

    private readonly cuenta: MismaCuenta;

    constructor(
        public svc: NuevoPersonajeService,
        auth: Auth,
        private sesionesSvc: SesionesService,
        private puerta: SubidaNivelPuertaService,
        private motor: MotorDesdeFichaService,
    ) {
        this.cuenta = new MismaCuenta(auth);
    }

    ngOnInit(): void {
        void this.cargar();
    }

    ngOnDestroy(): void {
        this.cuenta.destruir();
    }

    get unSoloDg(): boolean {
        return this.dgs <= 1;
    }

    /** Si no se sabe en qué orden ganó sus niveles (las fichas de antes del historial): elige la clase el jugador. */
    get sinOrden(): boolean {
        const niveles = this.entrada?.niveles ?? [];
        return niveles.length > 0 && !ordenConocido(niveles[niveles.length - 1]);
    }

    get clases(): Array<{ id: number; nombre: string; nivel: number; }> {
        return (this.entrada?.colecciones?.clases ?? []).map((c) => ({
            id: toInt(c.idClase), nombre: this.svc.claseDelCatalogo(c.idClase)?.Nombre ?? `Clase ${c.idClase}`, nivel: toInt(c.nivel),
        }));
    }

    /** Sin su registro, si el DG que pierde daba incremento o dote (cada 4 y 1.º y cada 3). */
    get pideIncremento(): boolean {
        return this.sinOrden && !this.unSoloDg && daIncrementoPorNivelDePersonaje(this.dgs);
    }

    get pideDote(): boolean {
        return this.sinOrden && !this.unSoloDg && daDotePorNivelDePersonaje(this.dgs);
    }

    get caracteristicas(): Array<{ id: number; nombre: string; valor: number; }> {
        return CARACTERISTICAS_DEL_ALTA.map(([clave, motor], i) => ({
            id: i + 1, nombre: NOMBRES_CARACTERISTICAS[motor], valor: toInt((this.entrada?.caracteristicas as any)?.[clave]?.valor),
        })).filter((c) => !(this.entrada?.caracteristicas as any)?.[CARACTERISTICAS_DEL_ALTA[c.id - 1][0]]?.perdido);
    }

    /** Las dotes que puede perder sin registro: las suyas (no las de su raza ni sus plantillas). */
    get dotes(): Array<{ clave: string; nombre: string; }> {
        return (this.pj?.DotesContextuales ?? []).filter((d) => !d?.Contexto?.Entidad || d.Contexto.Entidad === 'personaje')
            .map((d) => ({
                clave: `${toInt(d?.Dote?.Id)}|${toInt(d?.Contexto?.Id_extra)}|${(d?.Contexto as any)?.Origen ?? ''}`,
                nombre: nombreDoteConExtra(d),
            }));
    }

    px(valor: number): string {
        return formatoPx(valor);
    }

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.cuenta.fijar();
        try {
            const historial = await this.sesionesSvc.historial(this.idPersonaje);
            this.experiencia = historial.experiencia;
            const abierta = toInt(historial.experiencia?.sesionAbierta?.numero);
            if (!historial.puedeApuntar)
                throw new Error('Solo su dueño o el máster de su campaña pueden apuntar que pierde un nivel.');
            if (abierta < 1)
                throw new Error('Para perder un nivel hace falta una sesión de juego abierta: ábrela desde el historial.');
            const cargada = await this.motor.cargarSesion(this.svc, this.idPersonaje, abierta, () => this.cuenta.sigue());
            if (!cargada)
                return;
            this.sesion = cargada.sesion;
            this.entrada = cargada.entrada;
            this.pj = cargada.pj;
            await this.motor.hidratar(this.svc, this.pj, this.entrada, cargada.nivelesPerdidos);
            if (!this.cuenta.sigue())
                return;
            this.dgs = toInt(this.pj.Nivel_personaje);
            if ((this.entrada.colecciones?.clases ?? []).length < 1)
                throw new Error('No tiene niveles de clase que perder: perder un DG racial aún no se puede apuntar.');
            this.idClaseElegida = this.sinOrden ? this.clases[this.clases.length - 1]?.id ?? null : null;
            this.incrementoElegido = this.entrada ? caracteristicaMasAlta(this.entrada) : null;
            this.recalcular();
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la pérdida del nivel.';
        } finally {
            this.cargando = false;
        }
    }

    // --- Lo que pierde ---------------------------------------------------------------------------------------------

    elegirCausa(causa: string): void {
        this.causa = (CAUSAS_PERDIDA.find((c) => c.valor === causa)?.valor ?? 'otro');
        this.recalcular();
    }

    elegirClase(id: string): void {
        this.idClaseElegida = toInt(id) || null;
        this.recalcular();
    }

    elegirIncremento(id: string): void {
        this.incrementoElegido = toInt(id) || null;
        this.recalcular();
    }

    elegirDote(clave: string): void {
        this.doteElegida = clave;
        this.recalcular();
    }

    /** «Lo que pierde», con las reglas del dictamen del máster de Rol (en el roadmap, «Perder un nivel»). */
    recalcular(): void {
        this.resultado = null;
        this.filas = [];
        this.impedimento = '';
        const entrada = this.entrada;
        if (!entrada)
            return;
        const px = toInt(this.experiencia?.px);
        const nep = toInt(this.experiencia?.nivel);
        if (this.unSoloDg) {
            if (this.causa !== 'revivir') {
                this.impedimento = this.causa === 'nivel_negativo'
                    ? 'Con un solo DG, un nivel negativo que se hace permanente lo mata: no pierde un nivel (Guía del DM, pág. 291).'
                    : this.causa === 'plantilla'
                        ? 'Con un solo DG no tiene niveles que perder: la criatura queda destruida (Libris Mortis, pág. 116).'
                        : 'Con un solo DG no tiene un nivel que perder.';
                return;
            }
            const con = fichaConConstitucionPerdida(entrada, this.dgs);
            if (!con) {
                this.impedimento = 'Con su Constitución no se le puede devolver la vida: los 2 puntos que pierde la dejarían en 0 (Manual del jugador, pág. 285).';
                return;
            }
            this.resultado = { ficha: con.ficha, quitado: quitadoVacio(), pg: { ...con.pg, exacto: true }, ataqueBase: { antes: '', despues: '' }, salvaciones: {}, avisos: [] };
            this.filas = [
                { que: 'Constitución', antes: `${con.antes}`, ahora: `${con.despues}` },
                { que: 'Puntos de golpe', antes: `${con.pg.antes}`, ahora: `${con.pg.despues}` },
                { que: 'PX', antes: this.px(px), ahora: `${this.px(px)} (los conserva)` },
            ];
            return;
        }
        const indice = indiceDelNivelQueSePierde(entrada.niveles, this.idClaseElegida);
        if (indice === null) {
            this.impedimento = 'Elige la clase que pierde el nivel.';
            return;
        }
        const nivel = entrada.niveles![indice];
        const clase = this.svc.claseDelCatalogo(nivel.idClase);
        const [idDote, idExtra, ...origen] = this.doteElegida.split('|');
        const resultado = fichaSinElNivel({
            entrada,
            indice,
            clase,
            caras: this.svc.carasDadoGolpeDeClase(clase),
            dgsAntes: this.dgs,
            incrementoSinRegistro: this.incrementoElegido,
            doteSinRegistro: this.pideDote && toInt(idDote) > 0 ? { idDote: toInt(idDote), idExtra: toInt(idExtra), origen: origen.join('|') } : null,
        });
        this.resultado = resultado;
        const nombreClase = clase?.Nombre ?? `Clase ${nivel.idClase}`;
        const filas: FilaPerdida[] = [
            { que: 'Nivel de clase', antes: `${nombreClase} ${nivel.nivelClase}`, ahora: nivel.nivelClase > 1 ? `${nombreClase} ${nivel.nivelClase - 1}` : 'Deja la clase' },
            { que: 'NEP', antes: `${nep}`, ahora: `${nep - 1}` },
            { que: 'PX', antes: this.px(px), ahora: this.px(pxTrasPerder(px, nep - 1)) },
            { que: 'Puntos de golpe', antes: `${resultado.pg.antes}`, ahora: `${resultado.pg.despues}${resultado.pg.exacto ? '' : ' (aproximado)'}` },
        ];
        if (resultado.ataqueBase.antes !== resultado.ataqueBase.despues)
            filas.push({ que: 'Ataque base', antes: resultado.ataqueBase.antes, ahora: resultado.ataqueBase.despues });
        Object.entries(resultado.salvaciones).filter(([, d]) => toInt(d) !== 0)
            .forEach(([s, d]) => filas.push({ que: `${s.charAt(0).toUpperCase()}${s.slice(1)} (de clase)`, antes: '', ahora: `−${d}` }));
        const q = resultado.quitado;
        if (q.incremento !== null) {
            const c = this.caracteristicas.find((x) => x.id === q.incremento);
            filas.push({ que: `${NOMBRES_CARACTERISTICAS[CARACTERISTICAS_DEL_ALTA[q.incremento - 1][1]]} (incremento)`, antes: `${c?.valor ?? ''}`, ahora: `${toInt(c?.valor) - 1}` });
        }
        const lista = (que: string, nombres: string[]) => nombres.length > 0 && filas.push({ que, antes: nombres.join(', '), ahora: '—' });
        lista('Dotes', q.dotes.map((d) => this.nombreDote(d.idDote, d.idExtra)));
        lista('Aptitudes', q.especiales.map((e) => this.pj?.Claseas?.find((x) => toInt(x?.Id) === e.idEspecial)?.Nombre ?? `Aptitud ${e.idEspecial}`));
        lista('Conjuros conocidos', q.conjuros.map((c) => this.svc.conjuroDelCatalogo(c.idConjuro)?.Nombre ?? `Conjuro ${c.idConjuro}`));
        if (q.vuelven.length > 0)
            filas.push({ que: 'Vuelve a conocer', antes: '—', ahora: q.vuelven.map((c) => this.svc.conjuroDelCatalogo(c.idConjuro)?.Nombre ?? `Conjuro ${c.idConjuro}`).join(', ') });
        lista('Idiomas', q.idiomas.map((id) => this.svc.EstadoFlujo.ventajas.catalogoIdiomas.find((x) => toInt((x as any)?.Id) === id)?.Nombre ?? `Idioma ${id}`));
        lista('Dominios', q.dominios.map((id) => this.pj?.Dominios?.find((x) => toInt(x?.Id) === id)?.Nombre ?? `Dominio ${id}`));
        q.rangos.forEach((r) => {
            const h = this.pj?.Habilidades?.find((x) => toInt(x?.Id) === r.idHabilidad && !x.Custom);
            const nombre = h ? `${h.Nombre}${tieneTextoVisible(h.Extra) && toInt(r.idExtra) > 0 ? ` (${h.Extra})` : ''}` : `Habilidad ${r.idHabilidad}`;
            filas.push({ que: `Rangos de ${nombre}`, antes: `${h?.Rangos ?? ''}`, ahora: `${toInt(h?.Rangos) - r.rangos}` });
        });
        this.filas = filas;
    }

    private nombreDote(idDote: number, idExtra: number): string {
        const d = (this.pj?.DotesContextuales ?? []).find((x) => toInt(x?.Dote?.Id) === idDote && toInt(x?.Contexto?.Id_extra) === idExtra)
            ?? (this.pj?.DotesContextuales ?? []).find((x) => toInt(x?.Dote?.Id) === idDote);
        return d ? nombreDoteConExtra(d) : `Dote ${idDote}`;
    }

    // --- Guardar -------------------------------------------------------------------------------------------------------

    get puedeGuardar(): boolean {
        return !!this.resultado && !this.impedimento && !this.guardando && (!this.pideDote || !!this.doteElegida);
    }

    async guardar(): Promise<void> {
        if (!this.puedeGuardar || !this.sesion || !this.resultado)
            return;
        const r = await Swal.fire({
            icon: 'warning', title: 'Perder un nivel',
            text: this.unSoloDg
                ? 'Pierde 2 puntos de Constitución en lugar del nivel. Se puede deshacer mientras la sesión siga abierta.'
                : 'Pierde el nivel con lo que se ve en la lista. Lo vuelve a subir cuando le lleguen los PX, eligiendo otra vez lo de ese nivel. Se puede deshacer mientras la sesión siga abierta.',
            showCancelButton: true, confirmButtonText: 'Perder el nivel', cancelButtonText: 'Volver',
            target: document.body, heightAuto: false, scrollbarPadding: false,
        });
        if (!r.isConfirmed)
            return;
        this.guardando = true;
        this.error = '';
        try {
            const concepto = this.concepto.trim();
            await this.sesionesSvc.perderNivel(this.idPersonaje, {
                causa: this.causa,
                ...(concepto ? { concepto } : {}),
                ...(this.sinOrden && this.idClaseElegida ? { idClase: this.idClaseElegida } : {}),
                ficha: this.resultado.ficha,
                version: this.sesion.version,
            });
            if (!this.cuenta.sigue())
                return;
            this.puerta.subidaHecha(this.idPersonaje);
            this.alTerminar?.();
        } catch (error: any) {
            if (!this.cuenta.sigue())
                return;
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido apuntar la pérdida del nivel.';
        } finally {
            this.guardando = false;
        }
    }

    cancelar(): void {
        this.alTerminar?.();
    }
}
