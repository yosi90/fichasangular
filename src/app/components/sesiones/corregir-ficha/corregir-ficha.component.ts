import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectorDotesModalComponent } from 'src/app/components/nuevo-personaje/selector-dotes-modal/selector-dotes-modal.component';
import { HuecoDeSelectores } from 'src/app/components/sesiones/hueco-selectores';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { RepartoRangosComponent } from 'src/app/components/sesiones/reparto-rangos/reparto-rangos.component';
import { AlineamientoBasicoCatalogItem } from 'src/app/interfaces/alineamiento';
import { Caracteristica } from 'src/app/interfaces/caracteristica';
import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateNivelEleccionDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { MAXIMO_MOTIVO_CORRECCION, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { DeidadService } from 'src/app/services/deidad.service';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { DoteSeleccionConfirmada, NuevoPersonajeService, PasoRepartoRangos } from 'src/app/services/nuevo-personaje.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { evaluarAlineamientoClase } from 'src/app/services/utils/alineamiento-clase';
import { modificadorCaracteristica, NOMBRES_CARACTERISTICAS } from 'src/app/services/utils/caracteristicas';
import { daDgEnNivel } from 'src/app/services/utils/clase-niveles';
import { CARACTERISTICAS_DEL_ALTA, CambiosCorreccion, DoteDeLaFicha, fichaDeLaCorreccion } from 'src/app/services/utils/correccion-ficha';
import { comoSaleLaEdadDelManual, motivoEdadFueraDelManual } from 'src/app/services/utils/edad-personaje';
import { alturaFueraDeRango, pesoFueraDeRango, textoRangoAltura, textoRangoPeso } from 'src/app/services/utils/medidas-raza';
import { toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { decisionesHomebrewPersonaje, DecisionHomebrew } from 'src/app/services/utils/personaje-oficialidad';
import { PgSubida, pgTrasCorreccion } from 'src/app/services/utils/subida-nivel';

/** Una dote del personaje en la corrección; si se quita, la que se elige en su hueco. */
interface FilaDote extends DoteDeLaFicha {
    nombre: string;
    extra: string;
    quitada: boolean;
    /** Su nivel en `niveles` (el de su elección), o `null`. */
    indiceNivel: number | null;
    sustituta: { idDote: number; idExtra: number; nombre: string; extra: string; } | null;
}

/** Una dote que deja de cumplir sus prerrequisitos con lo corregido: se quita o se mantiene como homebrew. */
interface DoteRota extends DoteDeLaFicha {
    nombre: string;
    razones: string[];
    nivel: number | null;
    mantenida: boolean;
}

/** Una regla que lo corregido deja de cumplir (el alineamiento de una clase, la edad, la altura o el peso). */
interface ReglaSaltada {
    clave: string;
    tipo: 'clase' | 'edad' | 'altura' | 'peso';
    nombre: string;
    razones: string[];
    /** Si se puede mantener como homebrew (la clase contra su alineamiento, solo el máster o el dueño sin campaña). */
    puedeMantener: boolean;
    mantenida: boolean;
    idClase?: number;
}

/** Un idioma o un conjuro conocido de la `entrada`, que se puede quitar. */
interface FilaQuitable {
    id: number;
    idClase: number | null;
    nombre: string;
    quitado: boolean;
}

/** Un nivel con su tirada de PG (`entrada.niveles`). */
interface FilaTirada {
    indice: number;
    etiqueta: string;
    caras: number;
    antes: number | null;
    tirada: number | null;
    maximo: boolean;
}

/**
 * La corrección de la ficha (roadmap de sesiones, fase 6; `PUT /personajes/{id}/ficha`): arreglar un error de la ficha.
 * Es retroactiva (lo corregido vale desde que se creó), así que la web recalcula en cascada lo que depende de ello con el
 * motor de la creación (su propia instancia, hidratada como para la subida): las puntuaciones desde su base, los PG con la
 * Constitución retroactiva y las tiradas corregidas, los prerrequisitos de las dotes (cada una en el nivel en que se
 * eligió, si su registro lo dice), el alineamiento de sus clases y los rangos, que se reparten otra vez nivel a nivel si
 * cambia la Inteligencia; lo que deja de cumplirse se quita o se mantiene como homebrew (dictamen del máster de Rol). Las
 * puntuaciones, la edad y las tiradas de PG las corrige el máster de su campaña (sin campaña, su dueño). Queda como un
 * evento de la sesión abierta, también la 0, y se deshace desde el historial.
 */
@Component({
    selector: 'app-corregir-ficha',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, RepartoRangosComponent],
    templateUrl: './corregir-ficha.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass', './corregir-ficha.component.sass'],
    providers: [NuevoPersonajeService],
})
export class CorregirFichaComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    @ViewChild('modalHost', { read: ViewContainerRef }) modalHost?: ViewContainerRef;

    readonly maximoMotivo = MAXIMO_MOTIVO_CORRECCION;
    readonly caracteristicas = CARACTERISTICAS_DEL_ALTA;
    readonly nombres = NOMBRES_CARACTERISTICAS;

    cargando = true;
    guardando = false;
    error = '';

    pj: Personaje | null = null;
    sesion: SesionPersonaje | null = null;
    /** Si corrige lo del máster: las puntuaciones, la edad, las tiradas de PG y mantener una clase contra su alineamiento. */
    puedeLoDelMaster = false;
    base: Record<Caracteristica, number> = {} as Record<Caracteristica, number>;
    dotes: FilaDote[] = [];
    rotas: DoteRota[] = [];
    reglas: ReglaSaltada[] = [];
    idiomas: FilaQuitable[] = [];
    conjuros: FilaQuitable[] = [];
    tiradas: FilaTirada[] = [];
    pg: PgSubida | null = null;
    motivo = '';

    alineamientos: AlineamientoBasicoCatalogItem[] = [];
    deidades: DeidadDetalle[] = [];
    idAlineamiento = 0;
    idDeidad = 0;
    edad = 0;
    altura = 0;
    peso = 0;

    /** El reparto de los rangos, nivel a nivel: sus pasos, el que está abierto y si ya se ha hecho. */
    pasosRangos: PasoRepartoRangos[] = [];
    pasoRangos: number | null = null;
    rangosRepartidos = false;

    private entrada: PersonajeCreateRequestDto | null = null;
    private finalesAntes: Record<Caracteristica, number> = {} as Record<Caracteristica, number>;
    private cuerpoAntes: PersonajeCreateRequestDto | null = null;
    private modIntAntes = 0;
    private modIntDelReparto: number | null = null;
    private mantenidas = new Set<number>();
    private reglasMantenidas = new Set<string>();
    /** Las reglas que la ficha ya se saltaba al cargarla (sus decisiones homebrew): siguen mantenidas, sea quien sea. */
    private reglasDeAntes = new Set<string>();
    /** La cuenta con la que se abrió: lo que llega después de cerrarla o de cambiar de cuenta se descarta. */
    private readonly cuenta: MismaCuenta;
    private readonly selectores = new HuecoDeSelectores(() => this.modalHost);

    constructor(
        public svc: NuevoPersonajeService,
        auth: Auth,
        private sesionesSvc: SesionesService,
        private puerta: SubidaNivelPuertaService,
        private motor: MotorDesdeFichaService,
        private alineamientoSvc: AlineamientoService,
        private deidadSvc: DeidadService,
    ) {
        this.cuenta = new MismaCuenta(auth);
    }

    ngOnInit(): void {
        void this.cargar();
    }

    ngOnDestroy(): void {
        this.cuenta.destruir();
        this.cerrarModal();
    }

    final(key: Caracteristica): number {
        return toInt((this.svc.PersonajeCreacion as any)?.[key]);
    }

    get pendientes(): Array<DoteRota | ReglaSaltada> {
        return [...this.rotas.filter((r) => !r.mantenida), ...this.reglas.filter((r) => !r.mantenida)];
    }

    /** Si la Inteligencia corregida cambia los puntos de habilidad y aún no se han repartido otra vez. */
    get faltaRepartirRangos(): boolean {
        const mod = toInt(this.svc.PersonajeCreacion?.ModInteligencia);
        return mod !== this.modIntAntes && this.modIntDelReparto !== mod;
    }

    get repartiendo(): boolean {
        return this.pasoRangos !== null;
    }

    get pasoRangosActual(): PasoRepartoRangos | null {
        return this.pasoRangos !== null ? this.pasosRangos[this.pasoRangos] ?? null : null;
    }

    get rangoAltura(): string {
        return textoRangoAltura(this.svc.RazaSeleccionada);
    }

    get rangoPeso(): string {
        return textoRangoPeso(this.svc.RazaSeleccionada);
    }

    /** Lo que cambia, en frases (el resumen antes de guardar). */
    get cambios(): string[] {
        const salida: string[] = [];
        const p = this.entrada?.personaje;
        this.caracteristicas.forEach(([, key]) => {
            if (this.final(key) !== toInt(this.finalesAntes[key]))
                salida.push(`${this.nombres[key]} ${this.finalesAntes[key]} → ${this.final(key)}`);
        });
        if (this.pg && this.pg.total !== toInt(p?.puntosGolpe))
            salida.push(`PG ${toInt(p?.puntosGolpe)} → ${this.pg.total}${this.pg.exacto ? '' : ' (aproximado: hay DG sin su tirada)'}`);
        this.tiradas.filter((t) => t.tirada !== t.antes).forEach((t) => salida.push(`Tirada de PG de ${t.etiqueta}: ${t.antes} → ${t.tirada}`));
        if (this.idAlineamiento !== toInt(p?.idAlineamiento))
            salida.push(`Alineamiento ${this.nombreAlineamiento(toInt(p?.idAlineamiento))} → ${this.nombreAlineamiento(this.idAlineamiento)}`);
        if (this.idDeidad !== toInt(p?.deidad))
            salida.push(`Deidad ${this.nombreDeidad(toInt(p?.deidad))} → ${this.nombreDeidad(this.idDeidad)}`);
        if (this.edad !== toInt(p?.edad))
            salida.push(`Edad ${toInt(p?.edad)} → ${this.edad}`);
        if (this.altura !== toNumber(p?.altura))
            salida.push(`Altura ${toNumber(p?.altura)} → ${this.altura} m`);
        if (this.peso !== toNumber(p?.peso))
            salida.push(`Peso ${toNumber(p?.peso)} → ${this.peso} kg`);
        this.dotes.filter((d) => d.quitada).forEach((d) => salida.push(d.sustituta
            ? `Cambia la dote ${d.nombre}${d.extra ? ` (${d.extra})` : ''} por ${d.sustituta.nombre}${d.sustituta.extra ? ` (${d.sustituta.extra})` : ''}`
            : `Quita la dote ${d.nombre}${d.extra ? ` (${d.extra})` : ''}`));
        this.rotas.filter((r) => r.mantenida).forEach((r) => salida.push(`Mantiene ${r.nombre} sin sus prerrequisitos (homebrew)`));
        this.reglas.filter((r) => r.mantenida).forEach((r) => salida.push(`Mantiene ${r.nombre} (homebrew)`));
        if (this.rangosRepartidos)
            salida.push('Reparte de nuevo los rangos de todos sus niveles');
        this.idiomas.filter((i) => i.quitado).forEach((i) => salida.push(`Quita el idioma ${i.nombre}`));
        this.conjuros.filter((c) => c.quitado).forEach((c) => salida.push(`Quita el conjuro ${c.nombre}`));
        return salida;
    }

    get puedeGuardar(): boolean {
        return !this.guardando && !this.repartiendo && !this.faltaRepartirRangos && this.cambios.length > 0 && this.pendientes.length === 0;
    }

    nombreAlineamiento(id: number): string {
        return this.alineamientos.find((a) => toInt(a.Id) === toInt(id))?.Nombre ?? '—';
    }

    nombreDeidad(id: number): string {
        return toInt(id) > 0 ? this.deidades.find((d) => toInt(d.Id) === toInt(id))?.Nombre ?? `#${id}` : 'ninguna';
    }

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.cuenta.fijar();
        try {
            const historial = await this.sesionesSvc.historial(this.idPersonaje);
            if (!historial.puedeApuntar)
                throw new Error('Solo su dueño o el máster de su campaña pueden corregir la ficha.');
            const abierta = historial.sesiones.find((s) => s.estado === 'abierta') ?? null;
            if (!abierta)
                throw new Error('Para corregir la ficha hace falta una sesión abierta: ábrela o reabre la última desde el historial.');
            const cargada = await this.motor.cargarSesion(this.svc, this.idPersonaje, abierta.numero, () => this.cuenta.sigue());
            if (!cargada)
                return;
            const { sesion, entrada, pj } = cargada;
            this.sesion = sesion;
            this.entrada = entrada;
            this.pj = pj;
            this.puedeLoDelMaster = historial.rolActor === 'master' || toInt(entrada.personaje?.campana?.id) <= 0;
            const [alineamientos, deidades] = await Promise.all([
                this.motor.primero(this.alineamientoSvc.getAlineamientosBasicosCatalogo()),
                this.motor.primero(this.deidadSvc.getDeidades()),
            ]);
            this.alineamientos = (alineamientos ?? []).filter((a) => toInt(a?.Id) > 0);
            this.deidades = deidades ?? [];
            await this.hidratar();
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la corrección.';
        } finally {
            this.cargando = false;
        }
    }

    private async hidratar(): Promise<void> {
        const entrada = this.entrada!;
        await this.motor.hidratar(this.svc, this.pj!, entrada);
        this.base = this.svc.getBaseCaracteristicas();
        this.caracteristicas.forEach(([, key]) => this.finalesAntes[key] = this.final(key));
        this.cuerpoAntes = this.motor.cuerpoDelMotor(this.svc, entrada);
        this.modIntAntes = toInt(this.svc.PersonajeCreacion.ModInteligencia);
        this.modIntDelReparto = null;
        this.pasosRangos = [];
        this.pasoRangos = null;
        this.rangosRepartidos = false;
        const decisiones = entrada.decisionesHomebrew ?? [];
        this.mantenidas = new Set(decisiones.filter((d) => d.tipo === 'requisitos_dote').map((d) => toInt(d.idElemento)));
        this.reglasDeAntes = new Set(decisiones.map((d) => d.tipo === 'alineamiento_clase' ? `clase:${toInt(d.idElemento)}`
            : d.tipo.startsWith('edad_') ? 'edad' : d.tipo === 'altura_fuera_de_rango' ? 'altura' : d.tipo === 'peso_fuera_de_rango' ? 'peso' : ''));
        this.reglasMantenidas = new Set();
        this.idAlineamiento = toInt(entrada.personaje?.idAlineamiento);
        this.idDeidad = toInt(entrada.personaje?.deidad);
        this.edad = toInt(entrada.personaje?.edad);
        this.altura = toNumber(entrada.personaje?.altura);
        this.peso = toNumber(entrada.personaje?.peso);
        this.dotes = this.svc.dotesDelPersonaje()
            .map((d) => {
                const idDote = toInt(d?.Dote?.Id);
                const idExtra = toInt(d?.Contexto?.Id_extra);
                return {
                    idDote, idExtra, origen: `${(d?.Contexto as any)?.Origen ?? ''}`, nombre: `${d?.Dote?.Nombre ?? ''}`,
                    extra: idExtra > 0 ? `${d?.Contexto?.Extra ?? ''}` : '', quitada: false,
                    indiceNivel: this.svc.indiceNivelDeLaDote(idDote, idExtra), sustituta: null,
                };
            })
            .filter((d) => d.idDote > 0);
        const s: any = this.svc;
        const nombre = (lista: Array<{ Id?: number; Nombre?: string; }> | undefined, id: number) =>
            (lista ?? []).find((x) => toInt(x?.Id) === toInt(id))?.Nombre ?? `#${id}`;
        this.idiomas = (entrada.colecciones?.idiomas ?? []).map((i) => ({
            id: toInt(i.idIdioma), idClase: null, nombre: nombre(this.svc.EstadoFlujo.ventajas.catalogoIdiomas as any, toInt(i.idIdioma)), quitado: false,
        }));
        this.conjuros = (entrada.colecciones?.conjurosConocidos ?? []).filter((c) => !c.copiado).map((c) => {
            const idClase = toInt(c.idClase) > 0 ? toInt(c.idClase) : null;
            const clase = idClase ? ` (${nombre(s.catalogoClases, idClase).toLowerCase()})` : '';
            return { id: toInt(c.idConjuro), idClase, nombre: `${nombre(s.catalogoConjuros, toInt(c.idConjuro))}${clase}`, quitado: false };
        });
        this.tiradas = (entrada.niveles ?? []).flatMap((n, indice) => {
            const clase = this.svc.claseDelCatalogo(toInt(n.idClase));
            // Las de su clase, o las de una plantilla suya que actualiza los DG (el vampiro, d12), como en la subida.
            const caras = this.svc.carasDadoGolpeDeClase(clase);
            if (!clase || caras < 1 || !daDgEnNivel(clase, toInt(n.nivelClase)))
                return [];
            const fila = {
                indice, etiqueta: `nivel ${indice + 1} (${clase.Nombre.toLowerCase()} ${toInt(n.nivelClase)})`, caras,
                antes: toInt(n.pg?.tirada) > 0 ? toInt(n.pg?.tirada) : null, tirada: toInt(n.pg?.tirada) > 0 ? toInt(n.pg?.tirada) : null,
                maximo: !!n.pg?.maximo,
            };
            return [fila];
        });
        this.recalcular();
    }

    // --- La cascada ----------------------------------------------------------------------------------------------------

    /**
     * Con lo corregido: los PG (la Constitución retroactiva con las tiradas guardadas y las corregidas), las dotes que dejan
     * de cumplirse (cada una en su nivel) y las reglas que se saltan (el alineamiento de sus clases, la edad, la altura y
     * el peso).
     */
    private recalcular(): void {
        const tiradas: Record<number, number> = {};
        this.tiradas.filter((t) => t.tirada !== null && t.tirada !== t.antes).forEach((t) => tiradas[t.indice] = t.tirada!);
        this.pg = pgTrasCorreccion(this.entrada!, toInt(this.pj?.Nivel_personaje), toInt(this.svc.PersonajeCreacion.ModConstitucion), tiradas);
        this.rotas = this.svc.dotesSinSusPrerrequisitos().map((r) => ({ ...r, mantenida: this.mantenidas.has(r.idDote) }));
        this.reglas = this.reglasSaltadas();
    }

    /** Solo lo que se ha corregido: lo que ya tenía la ficha al cargarla no se vuelve a juzgar aquí. */
    private reglasSaltadas(): ReglaSaltada[] {
        const reglas: ReglaSaltada[] = [];
        const p = this.entrada!.personaje;
        const alineamiento = this.nombreAlineamiento(this.idAlineamiento);
        const deidad = this.deidades.find((d) => toInt(d.Id) === this.idDeidad) ?? null;
        const cambiaAlineamiento = this.idAlineamiento !== toInt(p.idAlineamiento) || this.idDeidad !== toInt(p.deidad);
        (cambiaAlineamiento ? this.entrada?.colecciones?.clases ?? [] : []).forEach((c) => {
            const clase = this.svc.claseDelCatalogo(toInt(c.idClase));
            const evaluacion = evaluarAlineamientoClase(clase, { alineamiento, deidad });
            if (!clase || !evaluacion.estricta)
                return;
            reglas.push({
                clave: `clase:${toInt(clase.Id)}`, tipo: 'clase', idClase: toInt(clase.Id), nombre: `${clase.Nombre} con su alineamiento`,
                razones: evaluacion.incumple, puedeMantener: this.puedeLoDelMaster, mantenida: false,
            });
        });
        const raza = this.svc.RazaSeleccionada;
        const grupo = this.svc.clasePrimerNivel()?.Grupo_edad_inicial;
        if (this.edad !== toInt(p.edad) && comoSaleLaEdadDelManual(this.edad, raza, grupo))
            reglas.push({ clave: 'edad', tipo: 'edad', nombre: `La edad ${this.edad}`, puedeMantener: true, mantenida: false,
                razones: [motivoEdadFueraDelManual(this.edad, raza, grupo, this.svc.clasePrimerNivel()?.Nombre)] });
        if (this.altura !== toNumber(p.altura) && alturaFueraDeRango(this.altura, raza))
            reglas.push({ clave: 'altura', tipo: 'altura', nombre: `La altura ${this.altura} m`, puedeMantener: true, mantenida: false,
                razones: [`Fuera del rango de su raza (${this.rangoAltura})`] });
        if (this.peso !== toNumber(p.peso) && pesoFueraDeRango(this.peso, raza))
            reglas.push({ clave: 'peso', tipo: 'peso', nombre: `El peso ${this.peso} kg`, puedeMantener: true, mantenida: false,
                razones: [`Fuera del rango de su raza (${this.rangoPeso})`] });
        return reglas.map((r) => ({
            ...r,
            puedeMantener: r.puedeMantener || this.reglasDeAntes.has(r.clave),
            mantenida: this.reglasDeAntes.has(r.clave) || (this.reglasMantenidas.has(r.clave) && r.puedeMantener),
        }));
    }

    cambiarBase(key: Caracteristica, valor: number): void {
        if (!this.puedeLoDelMaster)
            return;
        this.svc.corregirBaseCaracteristica(key, valor);
        this.base = this.svc.getBaseCaracteristicas();
        this.recalcular();
    }

    cambiarEdad(valor: number): void {
        if (!this.puedeLoDelMaster)
            return;
        this.edad = Math.max(0, toInt(valor));
        this.svc.corregirEdad(this.edad);
        this.recalcular();
    }

    cambiarMedidas(): void {
        this.altura = Math.max(0, toNumber(this.altura));
        this.peso = Math.max(0, toNumber(this.peso));
        this.recalcular();
    }

    cambiarAlineamiento(): void {
        this.svc.PersonajeCreacion.Alineamiento = this.nombreAlineamiento(this.idAlineamiento);
        this.svc.PersonajeCreacion.Deidad = this.idDeidad > 0 ? this.nombreDeidad(this.idDeidad) : this.svc.PersonajeCreacion.Deidad;
        this.recalcular();
    }

    /** Las deidades que se pueden elegir: las oficiales, y las homebrew si la ficha ya lo es (o la que tiene). */
    get deidadesElegibles(): DeidadDetalle[] {
        const conHomebrew = this.pj?.Oficial === false;
        return this.deidades.filter((d) => conHomebrew || d.Oficial !== false || toInt(d.Id) === toInt(this.entrada?.personaje?.deidad));
    }

    cambiarTirada(fila: FilaTirada, valor: number): void {
        if (!this.puedeLoDelMaster || fila.maximo || fila.antes === null)
            return;
        fila.tirada = Math.min(fila.caras, Math.max(1, toInt(valor)));
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

    /** Elige otra dote en el hueco de la quitada, con el selector de dotes de la creación y los prerrequisitos de su nivel. */
    async elegirOtraDote(fila: FilaDote): Promise<void> {
        if (!fila.quitada || fila.sustituta)
            return;
        const pendiente = this.svc.registrarDoteEnLugarDe(fila, fila.indiceNivel);
        const candidatos = this.svc.obtenerCandidatosDotePendiente(pendiente.id);
        // «Omitir» deja el hueco vacío: la dote se quita sin otra en su lugar.
        const seleccion = await this.selectores.abrir<DoteSeleccionConfirmada>(SelectorDotesModalComponent, {
            titulo: `Otra dote en lugar de ${fila.nombre}`, pendiente, candidatos, pendientesRestantes: 1,
        }, ['confirmar'], ['omitir']);
        if (!seleccion || !this.svc.aplicarDotePendiente(pendiente.id, seleccion)) {
            this.svc.omitirDotePendiente(pendiente.id);
            return;
        }
        const elegida = [...(this.svc.PersonajeCreacion.DotesContextuales ?? [])].reverse()
            .find((d) => toInt(d?.Dote?.Id) === toInt(seleccion.idDote) && `${(d?.Contexto as any)?.Origen ?? ''}` === `${pendiente.origenFijo}`);
        fila.sustituta = {
            idDote: toInt(seleccion.idDote), idExtra: toInt(elegida?.Contexto?.Id_extra ?? seleccion.idExtra),
            nombre: `${elegida?.Dote?.Nombre ?? ''}`, extra: toInt(elegida?.Contexto?.Id_extra) > 0 ? `${elegida?.Contexto?.Extra ?? ''}` : '',
        };
        this.recalcular();
    }

    mantener(rota: DoteRota | ReglaSaltada): void {
        if ('idDote' in rota)
            this.mantenidas.add(rota.idDote);
        else if (rota.puedeMantener)
            this.reglasMantenidas.add(rota.clave);
        else
            return;
        rota.mantenida = true;
    }

    /** Vuelve al valor de antes lo que salta una regla (el alineamiento y la deidad, la edad, la altura o el peso). */
    deshacerRegla(regla: ReglaSaltada): void {
        const p = this.entrada!.personaje;
        if (regla.tipo === 'clase') {
            this.idAlineamiento = toInt(p.idAlineamiento);
            this.idDeidad = toInt(p.deidad);
            this.cambiarAlineamiento();
            return;
        }
        if (regla.tipo === 'edad') {
            this.cambiarEdad(toInt(p.edad));
            return;
        }
        if (regla.tipo === 'altura')
            this.altura = toNumber(p.altura);
        else
            this.peso = toNumber(p.peso);
        this.cambiarMedidas();
    }

    quitar(fila: FilaQuitable): void {
        fila.quitado = true;
    }

    // --- Los rangos, nivel a nivel -------------------------------------------------------------------------------------

    /** Empieza el reparto de los rangos de todos sus niveles, con la Inteligencia corregida (la corrección es retroactiva). */
    repartirRangos(): void {
        this.pasosRangos = this.svc.pasosDelRepartoDeRangos();
        this.svc.empezarRepartoDeRangos();
        this.rangosRepartidos = false;
        this.pasoRangos = -1;
        this.siguientePasoRangos();
    }

    /** Cierra el paso abierto (si se puede) y abre el siguiente que da puntos; tras el último, el reparto queda hecho. */
    siguientePasoRangos(): void {
        if (this.pasoRangos === null)
            return;
        if (this.pasoRangos >= 0 && this.svc.EstadoFlujo.habilidades.activa) {
            if (!this.svc.puedeCerrarDistribucionHabilidades())
                return;
            this.svc.cerrarDistribucionHabilidades();
        }
        for (let i = this.pasoRangos + 1; i < this.pasosRangos.length; i++) {
            if (this.svc.abrirPasoDelRepartoDeRangos(this.pasosRangos[i])) {
                this.pasoRangos = i;
                return;
            }
            if (this.svc.EstadoFlujo.habilidades.activa)
                this.svc.cerrarDistribucionHabilidades();
        }
        this.pasoRangos = null;
        this.rangosRepartidos = true;
        this.modIntDelReparto = toInt(this.svc.PersonajeCreacion.ModInteligencia);
        this.recalcular();
    }

    get puedeSeguirRangos(): boolean {
        return this.svc.puedeCerrarDistribucionHabilidades();
    }

    // --- El guardado ---------------------------------------------------------------------------------------------------

    /** Las decisiones homebrew que dependen de lo corregido, vueltas a calcular (solo las de lo que cambia). */
    private decisionesRecalculadas(): CambiosCorreccion['decisionesRecalculadas'] {
        const p = this.entrada!.personaje;
        const tipos: string[] = [];
        const mantenida = (clave: string) => this.reglas.some((r) => r.clave === clave && r.mantenida);
        const estado: Parameters<typeof decisionesHomebrewPersonaje>[0] = { idRaza: toInt(p.idRaza) } as any;
        if (this.idAlineamiento !== toInt(p.idAlineamiento) || this.idDeidad !== toInt(p.deidad)) {
            tipos.push('alineamiento_clase');
            estado.clasesConAlineamientoSaltado = this.reglas.filter((r) => r.tipo === 'clase' && r.mantenida).map((r) => toInt(r.idClase));
        }
        if (this.edad !== toInt(p.edad)) {
            tipos.push('edad_menor_que_la_mayoria', 'edad_menor_que_la_inicial', 'edad_mayor_que_la_maxima');
            if (mantenida('edad')) {
                estado.edad = comoSaleLaEdadDelManual(this.edad, this.svc.RazaSeleccionada, this.svc.clasePrimerNivel()?.Grupo_edad_inicial);
                estado.idClasePrimerNivel = toInt(this.svc.clasePrimerNivel()?.Id);
            }
        }
        if (this.altura !== toNumber(p.altura)) {
            tipos.push('altura_fuera_de_rango');
            estado.alturaFueraDeRango = mantenida('altura');
        }
        if (this.peso !== toNumber(p.peso)) {
            tipos.push('peso_fuera_de_rango');
            estado.pesoFueraDeRango = mantenida('peso');
        }
        return tipos.length > 0 ? { tipos, decisiones: decisionesHomebrewPersonaje(estado) as DecisionHomebrew[] } : null;
    }

    private cambiosParaGuardar(): CambiosCorreccion {
        const caracteristicas: Partial<Record<Caracteristica, number>> = {};
        this.caracteristicas.forEach(([, key]) => caracteristicas[key] = this.final(key) - toInt(this.finalesAntes[key]));
        const p = this.entrada!.personaje;
        const personaje: CambiosCorreccion['personaje'] = {};
        if (this.idAlineamiento !== toInt(p.idAlineamiento))
            personaje.idAlineamiento = this.idAlineamiento;
        if (this.idDeidad !== toInt(p.deidad))
            personaje.deidad = this.idDeidad;
        if (this.edad !== toInt(p.edad))
            personaje.edad = this.edad;
        if (this.altura !== toNumber(p.altura))
            personaje.altura = this.altura;
        if (this.peso !== toNumber(p.peso))
            personaje.peso = this.peso;
        const tiradasPg: Record<number, number> = {};
        this.tiradas.filter((t) => t.tirada !== null && t.tirada !== t.antes).forEach((t) => tiradasPg[t.indice] = t.tirada!);
        const porNivel: PersonajeCreateNivelEleccionDto[][] = this.svc.getOrdenNiveles().map((n) => n.elecciones.filter((e) => e.tipo === 'rangos'));
        return {
            caracteristicas,
            puntosGolpe: this.pg?.total ?? null,
            dotesQuitadas: this.dotes.filter((d) => d.quitada).map(({ idDote, idExtra, origen }) => ({ idDote, idExtra, origen })),
            dotesNuevas: this.dotes.filter((d) => d.quitada && d.sustituta)
                .map((d) => ({ idDote: d.sustituta!.idDote, idExtra: d.sustituta!.idExtra, origen: d.origen, indiceNivel: d.indiceNivel })),
            dotesMantenidas: this.rotas.filter((r) => r.mantenida).map((r) => r.idDote),
            idiomasQuitados: this.idiomas.filter((i) => i.quitado).map((i) => i.id),
            conjurosQuitados: this.conjuros.filter((c) => c.quitado).map((c) => ({ idConjuro: c.id, idClase: c.idClase })),
            personaje,
            tiradasPg,
            rangos: this.rangosRepartidos && this.cuerpoAntes
                ? { antes: this.cuerpoAntes, despues: this.motor.cuerpoDelMotor(this.svc, this.entrada!), porNivel }
                : null,
            decisionesRecalculadas: this.decisionesRecalculadas(),
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
            if (!this.cuenta.sigue())
                return;
            this.puerta.subidaHecha(this.idPersonaje);
            this.alTerminar?.();
        } catch (error: any) {
            if (this.cuenta.sigue())
                this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido guardar la corrección.';
        } finally {
            this.guardando = false;
        }
    }

    async empezarDeNuevo(): Promise<void> {
        this.error = '';
        this.motivo = '';
        this.cerrarModal();
        await this.hidratar();
    }

    cancelar(): void {
        this.alTerminar?.();
    }

    private cerrarModal(): void {
        this.selectores.cerrar();
    }
}
