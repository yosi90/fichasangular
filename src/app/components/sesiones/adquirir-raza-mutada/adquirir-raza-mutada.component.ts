import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { SelectorRacialesOpcionalesModalComponent } from 'src/app/components/nuevo-personaje/selector-raciales-opcionales-modal/selector-raciales-opcionales-modal.component';
import { HuecoDeSelectores } from 'src/app/components/sesiones/hueco-selectores';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { resolverDotesPendientes } from 'src/app/components/sesiones/pasos-con-selectores';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { Raza } from 'src/app/interfaces/raza';
import { TipoPrerrequisitoMutacion } from 'src/app/interfaces/razas-api';
import { ExperienciaPersonaje, MAXIMO_CONCEPTO_RAZA_MUTADA, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { RazaService } from 'src/app/services/raza.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { CambioPlantilla } from 'src/app/services/utils/adquirir-plantilla';
import {
    cambiosDeLaMutacion, clasesQueDejanDeCumplir, condicionesDelMaster, edadNoAdulta, esRazaMutadaAdquirible, fichaDeLaMutacion, loQuePierdeEnSuHueco, nepTrasLaMutacion,
    pagaLosPuntos, puntosDevueltos, quitaDgRaciales, razonesDeSusClases, tipoQueNoCumpleLaMutacion,
} from 'src/app/services/utils/adquirir-raza-mutada';
import { evaluarAlineamientoRaza } from 'src/app/services/utils/alineamiento-raza';
import { caracteristicasPerdidasDe } from 'src/app/services/utils/caracteristicas';
import { confirmarEleccionHomebrew } from 'src/app/services/utils/confirmar-homebrew';
import { buildIdentidadPrerrequisitos } from 'src/app/services/utils/identidad-prerrequisitos';
import { normalizarTexto, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { motivoHomebrew, motivosQueConfirmar } from 'src/app/services/utils/personaje-oficialidad';
import { modoHomebrewDeCampana } from 'src/app/services/utils/politica-campana';
import { costeRangoHabilidad } from 'src/app/services/utils/puntos-habilidad';
import { evaluarGruposParaSelectorRacial } from 'src/app/services/utils/racial-prerrequisitos';
import { agruparRacialesPorOpcional, SeleccionRacialesOpcionales } from 'src/app/services/utils/racial-opcionales';
import { razaPorEdades } from 'src/app/services/utils/razas-por-edades';
import { DoteReciclable, dotesParaReciclar } from 'src/app/services/utils/reciclaje';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';
import { pgTrasCambioDeCon, PgSubida } from 'src/app/services/utils/subida-nivel';

export type PasoMutacion = 'raza' | 'dote' | 'habilidades' | 'dotes' | 'resumen';

/** Una raza mutada de la lista, con lo que dice su evaluación con el personaje de ahora y si se puede elegir. */
export interface OpcionMutacion {
    raza: Raza;
    /** La combinada sobre su raza de ahora (`GET /razas/{id}/sobre/{idBase}`), si la API la da. */
    combinada: Raza | null;
    estado: 'elegible' | 'bloqueada';
    motivo: string;
    /** Lo que no se puede comprobar (una condición del máster: el arrepentimiento del nacido del Infierno). */
    avisos: string[];
}

/** Una habilidad con rangos, de la que se pueden quitar para pagar los puntos que pierde. */
export interface FilaRangos {
    id: number;
    custom: boolean;
    nombre: string;
    rangos: number;
    /** Lo que costó cada rango: 1 de clase, 2 transclásea. */
    coste: number;
    quitados: number;
}

/**
 * Adquirir una raza mutada con el personaje ya creado (roadmap de sesiones, fase 7; contrato en `personajes.md`, «Adquirir
 * una raza mutada»): la prole de Bahamut con el Rito del Renacimiento o el nacido del Infierno con la Flagelación. La
 * lista de las que puede adquirir (las de su dato `momento`, evaluadas con el personaje de ahora: su tipo con sus
 * plantillas, lo que pide del personaje y su raza de ahora como base, que comprueba la API), las elecciones de la mutación
 * como al crear (sus rasgos opcionales: el aspecto), lo que pierde en su hueco (la dote y los puntos del humano, las dotes
 * que dejan de cumplirse, que se cambian por otra con el selector de la creación) y el resumen «Lo que cambia» con el coste
 * y el concepto, antes de guardar (`POST /personajes/{id}/raza-mutada`). Usa el motor de la creación en su propia
 * instancia (`MotorDesdeFichaService`, `NuevoPersonajeService.adquirirRazaMutada`) y las piezas de la subida
 * (`subir-nivel.component.sass`, `HuecoDeSelectores`). Se abre desde «Adquirir una raza mutada» del historial
 * (`SubidaNivelPuertaService.solicitarMutacion`) en su pestaña.
 */
@Component({
    selector: 'app-adquirir-raza-mutada',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './adquirir-raza-mutada.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class AdquirirRazaMutadaComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    @ViewChild('modalHost', { read: ViewContainerRef }) modalHost?: ViewContainerRef;

    readonly maximoConcepto = MAXIMO_CONCEPTO_RAZA_MUTADA;

    cargando = true;
    evaluando = false;
    guardando = false;
    error = '';
    paso: PasoMutacion = 'raza';
    pasos: PasoMutacion[] = ['raza', 'resumen'];

    pj: Personaje | null = null;
    entrada: PersonajeCreateRequestDto | null = null;
    sesion: SesionPersonaje | null = null;
    experiencia: ExperienciaPersonaje | null = null;
    /** Con qué rol apunta: el máster (y un PNJ) se salta la política de homebrew de la campaña, con aviso. */
    rolActor: 'jugador' | 'master' | null = null;

    opciones: OpcionMutacion[] = [];
    elegida: OpcionMutacion | null = null;
    /** Su raza de ahora, la que pasa a ser la base. */
    anterior: Raza | null = null;

    /** Lo que pierde en su hueco: las dotes adicionales y los puntos de habilidad extra de su raza de antes. */
    pierde = { dotes: 0, puntos: 0 };
    dotesQuePuedePerder: DoteReciclable[] = [];
    dotesPerdidas: string[] = [];
    rangos: FilaRangos[] = [];
    rangosAplicados = false;
    /** Las dotes que dejan de cumplir sus prerrequisitos, cada una con la que entra en su hueco (o ninguna). */
    dotesCambiadas: Array<{ antes: string; ahora: string | null; }> = [];
    dotesResueltas = false;

    pg: PgSubida | null = null;
    cambios: CambioPlantilla[] = [];
    concepto = '';
    /** Las po que cuesta las paga otro (un mecenas, o ya se apuntaron): no salen de su saldo. */
    poPagadasPorOtro = false;

    private antes: PersonajeCreateRequestDto | null = null;
    private pjAntes: Personaje | null = null;
    private razonesClasesAntes = new Map<number, Set<string>>();
    private claveRotasAntes = new Set<string>();
    private tiposPrerrequisito: TipoPrerrequisitoMutacion[] = [];
    /** La cuenta con la que se abrió: lo que llega después de cerrarla o de cambiar de cuenta se descarta. */
    private readonly cuenta: MismaCuenta;
    private readonly selectores = new HuecoDeSelectores(() => this.modalHost);

    constructor(
        public svc: NuevoPersonajeService,
        auth: Auth,
        private sesionesSvc: SesionesService,
        private puerta: SubidaNivelPuertaService,
        private motor: MotorDesdeFichaService,
        private razaSvc: RazaService,
        private personajeSvc: PersonajeService,
        private navegacion: NavegacionRolService,
    ) {
        this.cuenta = new MismaCuenta(auth);
    }

    ngOnInit(): void {
        void this.cargar();
    }

    ngOnDestroy(): void {
        this.cuenta.destruir();
        this.selectores.cerrar();
    }

    get combinada(): Raza | null {
        return this.elegida?.combinada ?? null;
    }

    get nepDespues(): number {
        const nivel = toInt(this.experiencia?.nivel);
        return this.anterior && this.combinada
            ? nepTrasLaMutacion(nivel, this.anterior, this.combinada, this.nivelesClase)
            : nivel;
    }

    private get nivelesClase(): number {
        return (this.entrada?.colecciones?.clases ?? []).reduce((suma, c) => suma + Math.max(0, toInt(c?.nivel)), 0);
    }

    /**
     * Lo que cuesta adquirir la elegida, que se cobra al guardar: los PX, que paga siempre el personaje y no le pueden bajar
     * de nivel, y las po, de su saldo o de quien las pague.
     */
    get coste(): { px: number; po: number; } | null {
        const px = toNumber(this.elegida?.raza?.Coste_al_adquirir?.Px);
        const po = toNumber(this.elegida?.raza?.Coste_al_adquirir?.Po);
        return px > 0 || po > 0 ? { px, po } : null;
    }

    get saldo(): number {
        return toNumber(this.pj?.Dinero?.po);
    }

    get puntosPorPagar(): number {
        return Math.max(0, this.pierde.puntos - puntosDevueltos(this.rangos.map((r) => ({ rangos: r.quitados, coste: r.coste }))));
    }

    get puedeCerrarHabilidades(): boolean {
        return pagaLosPuntos(this.rangos.map((r) => ({ rangos: r.quitados, coste: r.coste })), this.pierde.puntos);
    }

    px(valor: number): string {
        return formatoPx(valor);
    }

    etiquetaPaso(paso: PasoMutacion): string {
        const nombres: Record<PasoMutacion, string> = {
            raza: this.elegida ? `Raza: ${this.elegida.raza.Nombre}` : 'Raza mutada',
            dote: 'La dote que pierde',
            habilidades: 'Los puntos que pierde',
            dotes: 'Dotes que dejan de cumplirse',
            resumen: 'Resumen',
        };
        return `${this.pasos.indexOf(paso) + 1} · ${nombres[paso]}`;
    }

    estadoPaso(paso: PasoMutacion): 'hecho' | 'actual' | 'pendiente' {
        const i = this.pasos.indexOf(paso);
        const actual = this.pasos.indexOf(this.paso);
        return i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente';
    }

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.cuenta.fijar();
        try {
            const leida = await this.motor.cargarSesionDeJuego(this.svc, this.idPersonaje, () => this.cuenta.sigue(), {
                sinPermiso: 'Solo su dueño o el máster de su campaña pueden darle una raza mutada.',
                sinSesion: 'Para adquirir una raza mutada hace falta una sesión de juego abierta: ábrela desde el historial.',
            }, {
                alLeer: (historial) => {
                    this.experiencia = historial.experiencia;
                    this.rolActor = historial.rolActor ?? null;
                },
            });
            if (!leida)
                return;
            const { cargada } = leida;
            this.sesion = cargada.sesion;
            this.entrada = cargada.entrada;
            this.pj = cargada.pj;
            if (toInt(this.entrada.personaje?.idRazaBase) > 0 || this.pj?.RazaBase)
                throw new Error('Ya tiene una raza mutada: no se pone una mutación sobre otra.');
            await this.hidratar();
            const [catalogo, modelo] = await Promise.all([
                this.motor.primero(this.razaSvc.getRazas()),
                this.razaSvc.getModeloMutacion().catch(() => null),
            ]);
            if (!this.cuenta.sigue())
                return;
            this.tiposPrerrequisito = modelo?.Tipos_de_prerrequisito ?? [];
            await this.evaluarOpciones(catalogo ?? []);
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se han podido preparar las razas mutadas.';
        } finally {
            this.cargando = false;
        }
    }

    private async hidratar(): Promise<void> {
        await this.motor.hidratar(this.svc, this.pj!, this.entrada!);
        this.antes = this.motor.cuerpoDelMotor(this.svc, this.entrada!);
        this.pjAntes = JSON.parse(JSON.stringify(this.svc.PersonajeCreacion));
        this.anterior = this.svc.RazaSeleccionada ? JSON.parse(JSON.stringify(this.svc.RazaSeleccionada)) : null;
    }

    // --- Las razas mutadas -------------------------------------------------------------------------------------------

    /**
     * Las que puede adquirir: las mutadas de su dato `momento` (`esRazaMutadaAdquirible`), cada una evaluada con el
     * personaje de ahora. Su raza de ahora como base, con la combinación de la API (que comprueba lo que pide de la base);
     * su tipo con sus plantillas (`tipoQueNoCumpleLaMutacion`); lo que pide del personaje (`POST /razas/{id}/
     * requisitos-del-personaje`, la regla del alta); que no le quite DG raciales; y que, con la tabla de edades de la
     * mutada si trae la suya, sea adulto. Sus prerrequisitos no se pueden saltar (no hay decisión homebrew para eso). Las
     * condiciones del máster, de su `pr`, como aviso.
     */
    private async evaluarOpciones(catalogo: Raza[]): Promise<void> {
        const anterior = this.anterior;
        if (!anterior)
            throw new Error('No se ha podido leer su raza de ahora.');
        this.evaluando = true;
        const homebrewPj = this.pj?.Oficial === false;
        const salta = this.rolActor === 'master' || this.entrada?.personaje?.tipo === 'pnj';
        const sinHomebrew = modoHomebrewDeCampana(this.pj?.PoliticaCompra) === 'forbidden' && !salta;
        const candidatas = catalogo.filter((r) => esRazaMutadaAdquirible(r) && toInt(r.Id) !== toInt(anterior.Id))
            .filter((r) => r.Oficial !== false || homebrewPj || !sinHomebrew);
        const opciones = await Promise.all(candidatas.map((raza) => this.evaluar(raza, anterior, sinHomebrew)));
        if (!this.cuenta.sigue())
            return;
        this.opciones = opciones.sort((a, b) => Number(a.estado === 'bloqueada') - Number(b.estado === 'bloqueada')
            || a.raza.Nombre.localeCompare(b.raza.Nombre, 'es'));
        this.evaluando = false;
    }

    private async evaluar(raza: Raza, anterior: Raza, sinHomebrew: boolean): Promise<OpcionMutacion> {
        const opcion: OpcionMutacion = { raza, combinada: null, estado: 'bloqueada', motivo: '', avisos: [] };
        if (sinHomebrew && raza.Oficial === false)
            return { ...opcion, motivo: 'La campaña no admite contenido homebrew.' };
        const motivos = tipoQueNoCumpleLaMutacion(raza, this.tiposPrerrequisito, toInt(this.svc.PersonajeCreacion.Tipo_criatura?.Id))
            .map((frase) => `Su tipo, con sus plantillas: ${frase}`);
        try {
            const paso = razaPorEdades(anterior) ? toInt(this.entrada?.personaje?.idPasoEdad) || null : null;
            opcion.combinada = await this.razaSvc.getRazaSobreBase(raza.Id, anterior.Id, paso);
        } catch (error: any) {
            motivos.push(`${error?.message ?? ''}`.trim() || `No se puede aplicar sobre ${anterior.Nombre}.`);
        }
        if (opcion.combinada && quitaDgRaciales(anterior, opcion.combinada))
            motivos.push(`Le quitaría los DG raciales de ${anterior.Nombre}: perder un DG racial aún no se puede.`);
        const edad = toInt(this.svc.PersonajeCreacion.Edad);
        const categoria = opcion.combinada ? edadNoAdulta(edad, anterior, opcion.combinada) : null;
        if (categoria)
            motivos.push(`Con las edades de ${raza.Nombre}, a sus ${edad} años no es adulto (${categoria.toLowerCase()}), y renace adulto.`);
        opcion.avisos = condicionesDelMaster(raza).map((frase) => `${frase} (lo confirma el máster)`);
        try {
            const consulta = this.personajeSvc.consultaRequisitosMutacion(this.svc.PersonajeCreacion, anterior.Id,
                toInt(this.entrada?.personaje?.idAlineamiento) || null, this.svc.getProgresionLanzadorPersistible());
            const requisitos = await this.razaSvc.comprobarRequisitosDelPersonaje(raza.Id, consulta);
            motivos.push(...requisitos.filter((r) => r.Cumple === false).map((r) => r.Frase));
        } catch {
            opcion.avisos = [...opcion.avisos, 'No se ha podido comprobar lo que pide del personaje: se comprueba al guardar.'];
        }
        return motivos.length > 0 ? { ...opcion, motivo: motivos.join(' · ') } : { ...opcion, estado: 'elegible' };
    }

    verDetalles(raza: Raza): void {
        this.navegacion.abrir({ clase: 'detalle', lista: 'razas', item: raza });
    }

    /**
     * «Elegir»: avisa antes si vuelve homebrew la ficha, pide las elecciones de la mutación (sus rasgos opcionales, como al
     * crear) y la aplica en el motor; después, lo que pierde en su hueco.
     */
    async elegir(opcion: OpcionMutacion): Promise<void> {
        if (this.elegida || this.guardando || opcion.estado === 'bloqueada' || !opcion.combinada || !this.anterior)
            return;
        const motivos = motivosQueConfirmar([motivoHomebrew('raza', opcion.raza)], this.pj?.Oficial === false);
        if (motivos.length > 0 && !await confirmarEleccionHomebrew(`Adquirir ${opcion.raza.Nombre}`, motivos))
            return;
        const seleccion = await this.eleccionesDeLaMutacion(opcion.combinada);
        if (seleccion === null)
            return;
        // Antes de cambiarla, con su raza de ahora: lo que ya no cumplían sus clases y sus dotes (solo cuenta lo que deja de
        // cumplir con ella), las dotes que puede perder (las elegidas en un hueco que no necesita nada: con la raza nueva, el
        // hueco del humano ya no está) y lo que costó cada rango.
        const pierde = loQuePierdeEnSuHueco(this.anterior, opcion.combinada, this.nivelesClase);
        this.razonesClasesAntes = razonesDeSusClases(this.svc);
        this.claveRotasAntes = new Set(this.svc.dotesSinSusPrerrequisitos().map((d) => this.clave(d)));
        const perderibles = pierde.dotes > 0 ? dotesParaReciclar(this.svc) : [];
        const rangos = pierde.puntos > 0 ? this.filasDeRangos() : [];
        if (!this.svc.adquirirRazaMutada(opcion.combinada, seleccion)) {
            this.error = `No se ha podido aplicar ${opcion.raza.Nombre} sobre ${this.anterior.Nombre}.`;
            return;
        }
        this.elegida = opcion;
        this.error = '';
        this.pierde = pierde;
        this.dotesQuePuedePerder = perderibles;
        this.rangos = rangos;
        this.pasos = [
            'raza',
            ...(this.pierde.dotes > 0 ? ['dote' as const] : []),
            ...(this.pierde.puntos > 0 ? ['habilidades' as const] : []),
            'resumen',
        ];
        await this.siguiente();
    }

    /**
     * Las elecciones de la mutación (sus rasgos opcionales: el aspecto dracónico, el infernal), con el selector de la
     * creación y la evaluación de cada rasgo con su identidad nueva y sus características. `{}` si no tiene; `null` si se
     * cierra sin elegir.
     */
    private async eleccionesDeLaMutacion(combinada: Raza): Promise<SeleccionRacialesOpcionales | null> {
        const { grupos } = agruparRacialesPorOpcional(combinada.Raciales ?? []);
        if (grupos.length < 1)
            return {};
        const identidad = buildIdentidadPrerrequisitos(combinada, this.anterior, combinada.Subtipos ?? []);
        const evaluados = evaluarGruposParaSelectorRacial(grupos, identidad, this.svc.caracteristicasActuales({ sinValor: 'sinComprobar' }));
        return this.selectores.abrir<SeleccionRacialesOpcionales>(SelectorRacialesOpcionalesModalComponent, {
            grupos: evaluados, titulo: `Las elecciones de ${combinada.Nombre}`, razaContextoNombre: `${combinada.Nombre ?? ''}`,
        }, ['confirmar'], ['cerrar']);
    }

    // --- Lo que pierde en su hueco -------------------------------------------------------------------------------------

    async siguiente(): Promise<void> {
        const i = this.pasos.indexOf(this.paso);
        let siguiente = this.pasos[i + 1] ?? 'resumen';
        // Antes del resumen, las dotes que dejan de cumplir sus prerrequisitos con todo lo de antes (también los rangos).
        if (siguiente === 'resumen' && !this.dotesResueltas && this.hayDotesRotas()) {
            this.pasos = [...this.pasos.filter((p) => p !== 'resumen'), 'dotes', 'resumen'];
            siguiente = 'dotes';
        }
        this.paso = siguiente;
        if (siguiente === 'dotes')
            await this.resolverDotesRotas();
        else if (siguiente === 'resumen')
            this.prepararResumen();
    }

    /** «Perder esta»: la dote adicional de su raza de antes que pierde (no la necesita nada de lo que tiene). */
    async perderDote(dote: DoteReciclable): Promise<void> {
        if (dote.motivo || this.dotesPerdidas.length >= this.pierde.dotes)
            return;
        if (!this.svc.quitarDoteDeLaFicha(dote.idDote, dote.idExtra, dote.origen))
            return;
        this.dotesPerdidas = [...this.dotesPerdidas, dote.extra ? `${dote.nombre} (${dote.extra})` : dote.nombre];
        this.dotesQuePuedePerder = this.dotesQuePuedePerder.filter((d) => d !== dote);
        if (this.dotesPerdidas.length >= this.pierde.dotes)
            await this.siguiente();
    }

    /** Las habilidades con rangos, con lo que costó cada rango (1 de clase, 2 transclásea: Manual del jugador, cap. 4). */
    private filasDeRangos(): FilaRangos[] {
        return (this.svc.PersonajeCreacion.Habilidades ?? [])
            .filter((h) => toNumber(h?.Rangos) > 0)
            .map((h) => ({
                id: toInt(h.Id), custom: !!h.Custom, rangos: toInt(h.Rangos), quitados: 0,
                nombre: `${h.Nombre ?? ''}`.trim() + (`${h.Extra ?? ''}`.trim() && `${h.Extra}` !== 'Elegir' ? ` (${h.Extra})` : ''),
                coste: costeRangoHabilidad(this.svc.esHabilidadDeClaseEnAlguna(h)),
            }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }

    quitarRango(fila: FilaRangos, delta: number): void {
        if (this.rangosAplicados)
            return;
        const nuevo = fila.quitados + delta;
        if (nuevo < 0 || nuevo > fila.rangos || (delta > 0 && this.puntosPorPagar < 1))
            return;
        fila.quitados = nuevo;
    }

    /** «Continuar»: quita los rangos elegidos en el motor. */
    async cerrarHabilidades(): Promise<void> {
        if (!this.puedeCerrarHabilidades || this.rangosAplicados)
            return;
        this.rangos.filter((r) => r.quitados > 0).forEach((r) => {
            const h = (this.svc.PersonajeCreacion.Habilidades ?? []).find((x) => toInt(x?.Id) === r.id && !!x?.Custom === r.custom);
            if (h)
                h.Rangos = Math.max(0, toNumber(h.Rangos) - r.quitados);
        });
        this.rangosAplicados = true;
        await this.siguiente();
    }

    private clave(d: { idDote: number; idExtra: number; origen: string; }): string {
        return `${d.idDote}|${d.idExtra}|${d.origen}`;
    }

    private hayDotesRotas(): boolean {
        return this.svc.dotesSinSusPrerrequisitos().some((d) => !this.claveRotasAntes.has(this.clave(d)));
    }

    /**
     * Las dotes que dejan de cumplir sus prerrequisitos con la raza nueva (*Races of the Dragon*, pág. 10): cada una se
     * quita y se elige otra que sí cumpla en su mismo hueco (su origen y su nivel), con el selector de dotes de la creación;
     * sin ninguna que cumpla, se queda sin ella. Las que dependían de ella, igual (otra vuelta).
     */
    private async resolverDotesRotas(): Promise<void> {
        for (let vuelta = 0; vuelta < 5; vuelta++) {
            const rotas = this.svc.dotesSinSusPrerrequisitos().filter((d) => !this.claveRotasAntes.has(this.clave(d)));
            if (rotas.length < 1)
                break;
            for (const rota of rotas) {
                const indice = rota.nivel === null ? null : rota.nivel - 1;
                if (!this.svc.quitarDoteDeLaFicha(rota.idDote, rota.idExtra, rota.origen))
                    continue;
                const claveDe = (d: any) => this.clave({ idDote: toInt(d?.Dote?.Id), idExtra: toInt(d?.Contexto?.Id_extra), origen: `${d?.Contexto?.Origen ?? ''}` });
                const antes = new Set((this.svc.PersonajeCreacion.DotesContextuales ?? []).map(claveDe));
                this.svc.registrarDoteEnLugarDe(rota, indice);
                if (!await resolverDotesPendientes(this.svc, this.selectores)) {
                    // Cerrado sin elegir: el hueco se queda vacío (la dote ya no vale).
                    this.svc.getDotesPendientes().filter((p) => p.estado === 'pendiente').forEach((p) => this.svc.omitirDotePendiente(p.id));
                }
                const entra = (this.svc.PersonajeCreacion.DotesContextuales ?? []).find((d) => !antes.has(claveDe(d)));
                const extra = toInt(entra?.Contexto?.Id_extra) > 0 ? ` (${entra?.Contexto?.Extra ?? ''})` : '';
                this.dotesCambiadas = [...this.dotesCambiadas, { antes: rota.nombre, ahora: entra ? `${entra.Dote?.Nombre ?? ''}${extra}` : null }];
            }
        }
        this.dotesResueltas = true;
    }

    // --- El resumen y el guardado --------------------------------------------------------------------------------------

    private modConstitucion(): number {
        const p = this.svc.PersonajeCreacion;
        return caracteristicasPerdidasDe(p).Constitucion ? 0 : toInt(p.ModConstitucion);
    }

    /** Lo que exige el alineamiento de su raza nueva si ya no es el suyo (y la de antes no lo exigía): se propone el cambio. */
    private alineamientoExigido(): string | null {
        const alineamiento = `${this.pjAntes?.Alineamiento ?? ''}`;
        const ahora = evaluarAlineamientoRaza(this.combinada?.Alineamiento, alineamiento);
        const antes = evaluarAlineamientoRaza(this.anterior?.Alineamiento, alineamiento);
        return ahora && (!antes || normalizarTexto(antes.requerido) !== normalizarTexto(ahora.requerido)) ? ahora.requerido : null;
    }

    private prepararResumen(): void {
        this.pg = pgTrasCambioDeCon(this.entrada!, toInt(this.pj?.Nivel_personaje), this.modConstitucion(), null);
        this.cambios = cambiosDeLaMutacion({
            antes: this.pjAntes!,
            despues: this.svc.PersonajeCreacion,
            anterior: this.anterior!,
            combinada: this.combinada!,
            experiencia: this.experiencia,
            nepDespues: this.nepDespues,
            pg: this.pg,
            dotesPerdidas: this.dotesPerdidas,
            rangosQuitados: this.rangos.filter((r) => r.quitados > 0).map((r) => ({ nombre: r.nombre, rangos: r.quitados })),
            dotesCambiadas: this.dotesCambiadas,
            exClases: clasesQueDejanDeCumplir(this.svc, this.razonesClasesAntes),
            alineamientoExigido: this.alineamientoExigido(),
        });
    }

    private fichaParaGuardar(): PersonajeCreateRequestDto {
        return fichaDeLaMutacion({
            entrada: this.entrada!,
            antes: this.antes!,
            despues: this.motor.cuerpoDelMotor(this.svc, this.entrada!),
            idRaza: toInt(this.elegida?.raza?.Id),
            idRazaBase: toInt(this.anterior?.Id),
            puntosGolpe: this.pg?.total ?? toInt(this.entrada?.personaje.puntosGolpe),
        });
    }

    async guardar(): Promise<void> {
        if (this.guardando || !this.elegida || !this.sesion || this.paso !== 'resumen')
            return;
        this.guardando = true;
        this.error = '';
        try {
            const concepto = this.concepto.trim().slice(0, MAXIMO_CONCEPTO_RAZA_MUTADA);
            await this.sesionesSvc.adquirirRazaMutada(this.idPersonaje, {
                idRaza: toInt(this.elegida.raza.Id),
                ficha: this.fichaParaGuardar(),
                version: this.sesion.version,
                ...(this.coste && this.coste.po > 0 && this.poPagadasPorOtro ? { poPagadasPorOtro: true } : {}),
                ...(concepto ? { concepto } : {}),
            });
            if (!this.cuenta.sigue())
                return;
            this.puerta.subidaHecha(this.idPersonaje);
            this.alTerminar?.();
        } catch (error: any) {
            if (!this.cuenta.sigue())
                return;
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido adquirir la raza mutada.';
            this.paso = this.pasoDelError(`${error?.field ?? ''}`, `${error?.code ?? ''}`);
        } finally {
            this.guardando = false;
        }
    }

    /**
     * El paso al que se refiere un error de la API: los de la raza (`field: idRaza`: su momento, sus prerrequisitos, sus DG,
     * la mutación sobre otra), en «Raza»; lo que cuesta (`dinero_insuficiente`, `experiencia_insuficiente`, también con
     * `idRaza`), la edad (`ficha.personaje.edad`) y lo demás de la ficha, en el resumen.
     */
    pasoDelError(field: string, code = ''): PasoMutacion {
        return field === 'idRaza' && !ERRORES_DEL_COSTE.has(code) ? 'raza' : 'resumen';
    }

    /** «Volver al resumen» desde el paso de un error. */
    volverAlResumen(): void {
        this.paso = 'resumen';
    }

    async descartar(): Promise<void> {
        const r = await Swal.fire({
            icon: 'question', title: 'Empezar de nuevo', text: 'Se pierde la raza mutada elegida y lo que has elegido con ella.',
            showCancelButton: true, confirmButtonText: 'Empezar de nuevo', cancelButtonText: 'Seguir',
            target: document.body, heightAuto: false, scrollbarPadding: false,
        });
        if (!r.isConfirmed)
            return;
        this.elegida = null;
        this.pasos = ['raza', 'resumen'];
        this.paso = 'raza';
        this.pierde = { dotes: 0, puntos: 0 };
        this.dotesQuePuedePerder = [];
        this.dotesPerdidas = [];
        this.rangos = [];
        this.rangosAplicados = false;
        this.dotesCambiadas = [];
        this.dotesResueltas = false;
        this.pg = null;
        this.cambios = [];
        this.poPagadasPorOtro = false;
        this.error = '';
        await this.hidratar();
    }

    cancelar(): void {
        this.alTerminar?.();
    }
}

/** Los errores de lo que cuesta (con `field: idRaza`), que se enseñan en el resumen, donde está el coste. */
const ERRORES_DEL_COSTE: ReadonlySet<string> = new Set(['dinero_insuficiente', 'experiencia_insuficiente']);
