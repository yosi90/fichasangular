import { CommonModule } from '@angular/common';
import { Component, ComponentRef, Input, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom, Observable, take } from 'rxjs';
import Swal from 'sweetalert2';
import { SelectorAumentosCaracteristicaModalComponent } from 'src/app/components/nuevo-personaje/selector-aumentos-caracteristica-modal/selector-aumentos-caracteristica-modal.component';
import { SelectorClaseOpcionalModalComponent } from 'src/app/components/nuevo-personaje/selector-clase-opcional-modal/selector-clase-opcional-modal.component';
import { SelectorDominiosModalComponent } from 'src/app/components/nuevo-personaje/selector-dominios-modal/selector-dominios-modal.component';
import { SelectorDotesModalComponent } from 'src/app/components/nuevo-personaje/selector-dotes-modal/selector-dotes-modal.component';
import { SelectorEnemigoPredilectoModalComponent } from 'src/app/components/nuevo-personaje/selector-enemigo-predilecto-modal/selector-enemigo-predilecto-modal.component';
import { SelectorEspecialidadMagicaModalComponent } from 'src/app/components/nuevo-personaje/selector-especialidad-magica-modal/selector-especialidad-magica-modal.component';
import { Clase } from 'src/app/interfaces/clase';
import { Conjuro } from 'src/app/interfaces/conjuro';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeContextoIdsDto, PersonajeCreateNivelEleccionDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { ExperienciaPersonaje, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { CampanaService } from 'src/app/services/campana.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { DominioService } from 'src/app/services/dominio.service';
import { DoteService } from 'src/app/services/dote.service';
import { EnemigoPredilectoService } from 'src/app/services/enemigo-predilecto.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { DoteSeleccionConfirmada, IntercambioConjurosNivel, NuevoPersonajeService, SeleccionAumentosClaseLanzadora, SeleccionDominiosClase, SeleccionOpcionalesClase } from 'src/app/services/nuevo-personaje.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RazaService } from 'src/app/services/raza.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { caracteristicasPerdidasDe } from 'src/app/services/utils/caracteristicas';
import { daDgEnNivel } from 'src/app/services/utils/clase-niveles';
import { claveHabilidad } from 'src/app/services/utils/habilidad-clave';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';
import { carasDado, tiradasPuntosGolpe } from 'src/app/services/utils/puntos-golpe';
import { claveBorradorSubida, fichaDeLaSubida, modConstitucionDeEntrada, PgSubida, puntosGolpeTrasSubida } from 'src/app/services/utils/subida-nivel';
import { cambiosDeLaSubida, CambioSubida, campoDelErrorASubida, PasoSubida } from 'src/app/services/utils/subida-nivel-vista';

/** El borrador de la subida (`fichas35.subidaNivel.draft.v1.<uid>.<id>`), solo de esta cuenta y este personaje. */
interface BorradorSubida {
    version: 1;
    uid: string;
    idPersonaje: number;
    versionSesion: string;
    actualizado: number;
    paso: PasoSubida;
    idClase: number;
    motor: unknown;
    antes: PersonajeCreateRequestDto;
    tiradas: number[];
    tiradaElegida: number | null;
    olvidado: { idConjuro: number; idClase: number; } | null;
}

const CADUCIDAD_BORRADOR_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * La subida de nivel (roadmap de sesiones, fase 4; lienzo «Rol: sesiones y subida de nivel», pantalla 4): solo los pasos
 * que dispara el nivel, con el motor y los selectores de la creación (su propia instancia de `NuevoPersonajeService`, que
 * no toca la creación en curso) y, al final, el resumen con la diferencia antes de guardar (`POST /personajes/{id}/niveles`).
 * Se abre desde la ficha (`SubidaNivelPuertaService.solicitar`) en su pestaña, con carga diferida.
 */
@Component({
    selector: 'app-subir-nivel',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
    templateUrl: './subir-nivel.component.html',
    styleUrls: ['./subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class SubirNivelComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    @ViewChild('modalHost', { read: ViewContainerRef }) modalHost?: ViewContainerRef;

    cargando = true;
    guardando = false;
    error = '';
    /** El paso donde enseñar el error de la API (con su frase). */
    errorPaso: PasoSubida | null = null;
    paso: PasoSubida = 'clase';
    pasos: PasoSubida[] = ['clase', 'resumen'];

    pj: Personaje | null = null;
    entrada: PersonajeCreateRequestDto | null = null;
    sesion: SesionPersonaje | null = null;
    experiencia: ExperienciaPersonaje | null = null;
    clases: Array<{ clase: Clase; siguienteNivel: number; elegible: boolean; motivo: string; tiene: boolean; }> = [];
    claseElegida: Clase | null = null;
    nivelClase = 0;

    tiradasPermitidas = 1;
    tiradas: number[] = [];
    tiradaElegida: number | null = null;
    carasDg = 0;
    daDg = true;
    pg: PgSubida | null = null;

    intercambio: IntercambioConjurosNivel | null = null;
    olvidado: { idConjuro: number; idClase: number; nivel: number; } | null = null;
    idNuevoIntercambio: number | null = null;
    filtroConjuros = '';

    cambios: CambioSubida[] = [];
    private antes: PersonajeCreateRequestDto | null = null;
    private uid = '';
    private modalAbierto: ComponentRef<unknown> | null = null;
    private destruido = false;

    constructor(
        public svc: NuevoPersonajeService,
        private auth: Auth,
        private sesionesSvc: SesionesService,
        private personajeSvc: PersonajeService,
        private puerta: SubidaNivelPuertaService,
        private campanaSvc: CampanaService,
        private claseSvc: ClaseService,
        private doteSvc: DoteService,
        private conjuroSvc: ConjuroService,
        private habilidadSvc: HabilidadService,
        private idiomaSvc: IdiomaService,
        private dominioSvc: DominioService,
        private razaSvc: RazaService,
        private plantillaSvc: PlantillaService,
        private escuelaSvc: EscuelaConjurosService,
        private disciplinaSvc: DisciplinaConjurosService,
        private enemigoSvc: EnemigoPredilectoService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private grupoArmaSvc: GrupoArmaService,
        private grupoArmaduraSvc: GrupoArmaduraService,
    ) { }

    ngOnInit(): void {
        void this.cargar();
    }

    ngOnDestroy(): void {
        this.destruido = true;
        this.cerrarModal();
    }

    get nivelNuevo(): number {
        return toInt(this.experiencia?.nivel) + 1;
    }

    get puedeSeguir(): boolean {
        return toInt(this.experiencia?.nivelesPorSubir) > 1;
    }

    get habilidadesSesion() {
        return this.svc.getHabilidadesSesion();
    }

    get puntosHabilidadRestantes(): number {
        return toInt(this.svc.EstadoFlujo.habilidades.puntosRestantes);
    }

    get entradaConjuros() {
        const flujo = this.svc.getConjurosSesionActual();
        return flujo.activa ? flujo.entradas[flujo.indiceEntradaActual] ?? null : null;
    }

    get conjurosDisponibles(): Conjuro[] {
        return this.svc.filtrarConjurosDisponibles(this.filtroConjuros, null, this.pj?.Oficial === false);
    }

    px(valor: number): string {
        return formatoPx(valor);
    }

    nombreConjuro(id: number): string {
        return (this.svc as any).catalogoConjuros?.find((c: Conjuro) => toInt(c?.Id) === toInt(id))?.Nombre ?? `#${id}`;
    }

    etiquetaPaso(paso: PasoSubida): string {
        const nombres: Record<PasoSubida, string> = {
            clase: this.claseElegida ? `Clase: ${this.claseElegida.Nombre.toLowerCase()}` : 'Clase',
            incremento: 'Incremento',
            pg: 'Puntos de golpe',
            habilidades: 'Habilidades',
            dotes: 'Dotes',
            conjuros: 'Conjuros',
            intercambio: 'Cambiar un conjuro',
            resumen: 'Resumen',
        };
        return `${this.pasos.indexOf(paso) + 1} · ${nombres[paso]}`;
    }

    estadoPaso(paso: PasoSubida): 'hecho' | 'actual' | 'pendiente' {
        const i = this.pasos.indexOf(paso);
        const actual = this.pasos.indexOf(this.paso);
        return i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente';
    }

    // --- Carga -------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.errorPaso = null;
        this.uid = `${this.auth.currentUser?.uid ?? ''}`.trim();
        try {
            const historial = await this.sesionesSvc.historial(this.idPersonaje);
            this.experiencia = historial.experiencia;
            const abierta = toInt(historial.experiencia?.sesionAbierta?.numero);
            if (!historial.puedeApuntar)
                throw new Error('Solo su dueño o el máster de su campaña pueden subirle de nivel.');
            if (abierta < 1)
                throw new Error('Para subir de nivel hace falta una sesión de juego abierta: ábrela desde el historial.');
            if (!historial.experiencia?.puedeSubir)
                throw new Error('Aún no le llegan los PX para el siguiente nivel.');
            const { sesion, ficha, entrada } = await this.sesionesSvc.sesion(this.idPersonaje, abierta);
            if (!this.sigueLaMismaCuenta())
                return;
            if (!entrada)
                throw new Error('La API no ha dado la ficha de la sesión abierta.');
            this.sesion = sesion;
            this.entrada = entrada;
            this.pj = this.personajeSvc.fichaDeApi(ficha);
            await this.cargarCatalogos();
            const campana = toInt(entrada.personaje?.campana?.id);
            this.tiradasPermitidas = campana > 0 ? await this.tiradasDeLaCampana(campana) : 1;
            await this.hidratar();
            if (!this.sigueLaMismaCuenta())
                return;
            if (!await this.restaurarBorrador())
                this.irA('clase');
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la subida de nivel.';
        } finally {
            this.cargando = false;
        }
    }

    private async tiradasDeLaCampana(idCampana: number): Promise<number> {
        try {
            const detalle = await this.campanaSvc.getCampaignDetail(idCampana);
            return tiradasPuntosGolpe(detalle?.politicaCreacion?.maxTiradasPuntosGolpe);
        } catch {
            return 1;
        }
    }

    private async primero<T>(origen: Observable<T> | Promise<Observable<T>>): Promise<T | null> {
        try {
            return await firstValueFrom((await origen).pipe(take(1)));
        } catch {
            return null;
        }
    }

    private async cargarCatalogos(): Promise<void> {
        const [clases, dotes, conjuros, habilidades, custom, idiomas, dominios, escuelas, armas, armaduras, gruposArmas, gruposArmaduras] = await Promise.all([
            this.primero(this.claseSvc.getClases()), this.primero(this.doteSvc.getDotes()), this.primero(this.conjuroSvc.getConjuros()),
            this.primero(this.habilidadSvc.getHabilidades()), this.primero(this.habilidadSvc.getHabilidadesCustom()),
            this.primero(this.idiomaSvc.getIdiomas()), this.primero(this.dominioSvc.getDominios()), this.primero(this.escuelaSvc.getEscuelas()),
            this.primero(this.armaSvc.getArmas()), this.primero(this.armaduraSvc.getArmaduras()),
            this.primero(this.grupoArmaSvc.getGruposArmas()), this.primero(this.grupoArmaduraSvc.getGruposArmaduras()),
        ]);
        this.svc.setCatalogoClases(clases ?? []);
        this.svc.setCatalogoDotes(dotes ?? []);
        this.svc.setCatalogoConjuros(conjuros ?? []);
        this.svc.setCatalogoHabilidades(habilidades ?? []);
        this.svc.setCatalogoHabilidadesCustom(custom ?? []);
        this.svc.setCatalogoIdiomas(idiomas ?? []);
        this.svc.setCatalogoDominios(dominios ?? []);
        this.svc.setCatalogoEscuelasDotes((escuelas ?? []).map((e: any) => ({ Id: toInt(e?.Id), Nombre: `${e?.Nombre ?? ''}`.trim() })));
        this.svc.setCatalogoArmasDotes((armas ?? []).map((a: any) => ({ Id: toInt(a?.Id), Nombre: `${a?.Nombre ?? ''}`.trim(), Id_tipo_arma: a?.Tipo_arma?.Id ?? null })));
        this.svc.setCatalogoArmadurasDotes((armaduras ?? []).map((a: any) => ({ Id: toInt(a?.Id), Nombre: `${a?.Nombre ?? ''}`.trim(), Es_escudo: !!a?.Es_escudo })));
        this.svc.setCatalogoGruposArmasDotes((gruposArmas ?? []).map((g: any) => ({ Id: toInt(g?.Id), Nombre: `${g?.Nombre ?? ''}`.trim() })));
        this.svc.setCatalogoGruposArmadurasDotes((gruposArmaduras ?? []).map((g: any) => ({ Id: toInt(g?.Id), Nombre: `${g?.Nombre ?? ''}`.trim() })));
    }

    private async hidratar(): Promise<void> {
        const pj = this.pj!;
        const entrada = this.entrada!;
        const idRaza = toInt(entrada.personaje?.idRaza);
        const idRazaBase = toInt(entrada.personaje?.idRazaBase);
        const raza = idRaza > 0 ? await this.primero(this.razaSvc.getRaza(idRaza)) : null;
        const razaBase = idRazaBase > 0 && idRazaBase !== idRaza ? await this.primero(this.razaSvc.getRaza(idRazaBase)) : null;
        const plantillas = (await Promise.all((entrada.colecciones?.plantillas ?? [])
            .map((p) => this.primero(this.plantillaSvc.getPlantilla(toInt(p.idPlantilla))))))
            .filter((p): p is NonNullable<typeof p> => !!p);
        this.svc.iniciarSubidaDesdeFicha({ personaje: pj, entrada, raza, razaBase, plantillas });
        this.antes = this.cuerpoDelMotor();
        this.recalcularClases();
    }

    /** El cuerpo del alta que arma el motor ahora (para la diferencia de la subida). */
    private cuerpoDelMotor(): PersonajeCreateRequestDto {
        const entrada = this.entrada!;
        const personaje = { ...this.svc.PersonajeCreacion, Nombre: entrada.personaje.nombre, Campana: 'Sin campaña' } as Personaje;
        const catalogo = (lista: Array<{ Id?: number; Nombre?: string; }>) => lista
            .map((x) => ({ id: toInt(x?.Id), nombre: `${x?.Nombre ?? ''}` })).filter((x) => x.id > 0);
        const s: any = this.svc;
        const contexto: PersonajeContextoIdsDto = {
            idAlineamiento: toInt(entrada.personaje.idAlineamiento) || 1,
            idGenero: toInt(entrada.personaje.idGenero) || 1,
            idDeidad: toInt(entrada.personaje.deidad),
            idRegion: toInt(entrada.personaje.idRegion),
            catalogos: {
                clases: catalogo(s.catalogoClases ?? []),
                dominios: catalogo(s.catalogoDominios ?? []),
                idiomas: catalogo(this.svc.EstadoFlujo.ventajas.catalogoIdiomas ?? []),
            },
        };
        return this.personajeSvc.construirPayloadCreacionDesdePersonaje(personaje, contexto, null,
            this.svc.getProgresionLanzadorPersistible(), null);
    }

    private sigueLaMismaCuenta(): boolean {
        return !this.destruido && `${this.auth.currentUser?.uid ?? ''}`.trim() === this.uid && this.uid.length > 0;
    }

    // --- La clase ------------------------------------------------------------------------------------------------------

    private recalcularClases(): void {
        const s: any = this.svc;
        const propias = new Set((this.svc.PersonajeCreacion.desgloseClases ?? []).map((c) => normalizarTexto(c?.Nombre ?? '')));
        this.clases = ((s.catalogoClases ?? []) as Clase[])
            .filter((clase) => this.pj?.Oficial === false || clase?.Oficial !== false || propias.has(normalizarTexto(clase.Nombre)))
            .map((clase) => {
                const evaluacion = this.svc.evaluarClaseParaSeleccion(clase);
                const tiene = propias.has(normalizarTexto(clase.Nombre));
                return {
                    clase,
                    tiene,
                    siguienteNivel: toInt((this.svc.PersonajeCreacion.desgloseClases ?? [])
                        .find((c) => normalizarTexto(c?.Nombre ?? '') === normalizarTexto(clase.Nombre))?.Nivel) + 1,
                    elegible: evaluacion.estado === 'eligible',
                    motivo: evaluacion.razones?.[0] ?? '',
                };
            })
            .filter((item) => item.elegible || item.tiene)
            .sort((a, b) => Number(b.tiene) - Number(a.tiene) || a.clase.Nombre.localeCompare(b.clase.Nombre, 'es'));
    }

    async elegirClase(clase: Clase): Promise<void> {
        if (this.claseElegida || this.guardando)
            return;
        const opcionales = this.svc.obtenerOpcionalesSiguienteNivelClase(clase);
        let seleccionesOpcionales: SeleccionOpcionalesClase | null = null;
        for (const grupo of opcionales) {
            const clave = await this.abrirModal<string>(SelectorClaseOpcionalModalComponent, {
                titulo: `Grupo opcional ${grupo.grupo}`,
                descripcion: 'Elige una opción para continuar con el nivel de clase.',
                opciones: (grupo.opciones ?? []).map((o: any) => ({
                    clave: `${o?.clave ?? ''}`, tipo: o?.tipo === 'especial' ? 'especial' : 'dote', nombre: `${o?.nombre ?? ''}`,
                    extra: `${o?.extra ?? ''}`, ...(o?.bloqueada ? { bloqueada: true, motivo: `${o?.motivo ?? ''}` } : {}),
                })),
            }, ['confirmar'], ['cerrar']);
            if (!clave)
                return;
            seleccionesOpcionales = { ...(seleccionesOpcionales ?? {}), [grupo.grupo]: clave };
        }
        if (this.svc.obtenerEspecialesExtraPendientesSiguienteNivelClase(clase, seleccionesOpcionales).length > 0) {
            await this.avisar('Aún no disponible', `El nivel ${this.nivelDe(clase)} de ${clase.Nombre} pide elegir el extra de una aptitud: la subida todavía no lo ofrece.`);
            return;
        }
        let seleccionesDominios: SeleccionDominiosClase | null = null;
        const dominios = this.svc.obtenerDominiosPendientesSiguienteNivelClase(clase);
        if (dominios && dominios.cantidad > 0) {
            seleccionesDominios = await this.abrirModal<SeleccionDominiosClase>(SelectorDominiosModalComponent, {
                opciones: dominios.opciones.map((o) => ({ id: toInt(o.id), nombre: o.nombre, oficial: o.oficial !== false })),
                titulo: `Dominios de ${clase.Nombre}`, cantidadObjetivo: dominios.cantidad, cantidadSeleccionada: 0, bloquearCierreHastaCompletar: false,
            }, ['confirmar'], ['cerrar']);
            if (!seleccionesDominios)
                return;
        }
        let aumentos: SeleccionAumentosClaseLanzadora | null = null;
        let resultado = this.svc.aplicarSiguienteNivelClase(clase, seleccionesOpcionales, seleccionesDominios, false, aumentos, null);
        if (!resultado.aplicado && (resultado.aumentosClaseLanzadoraPendientes ?? []).length > 0) {
            aumentos = [];
            for (const pendiente of resultado.aumentosClaseLanzadoraPendientes ?? []) {
                const opciones: Record<string, string> = {};
                (pendiente.opciones ?? []).forEach((o) => opciones[`${o.idClase}`] = `${o.nombreClase} (${o.tipoLanzamiento})`);
                const r = await Swal.fire({
                    icon: 'question', title: `${clase.Nombre}: aumento de lanzador`, text: pendiente.descripcion, input: 'select',
                    inputOptions: opciones, showCancelButton: true, confirmButtonText: 'Aplicar', cancelButtonText: 'Cancelar',
                    target: document.body, heightAuto: false, scrollbarPadding: false,
                    inputValidator: (valor) => valor ? undefined : 'Elige la clase que sube',
                });
                if (!r.isConfirmed || !r.value)
                    return;
                aumentos[Math.max(0, toInt(pendiente.indice) - 1)] = toInt(r.value);
            }
            resultado = this.svc.aplicarSiguienteNivelClase(clase, seleccionesOpcionales, seleccionesDominios, false, aumentos, null);
        }
        if (!resultado.aplicado) {
            await this.avisar('No se puede subir en esta clase', resultado.evaluacion?.razones?.join(' · ') || resultado.razon || 'No se puede aplicar el nivel.');
            return;
        }
        this.claseElegida = clase;
        this.nivelClase = toInt(resultado.nivelAplicado);
        if (!await this.resolverEspecialidad(clase) || !await this.resolverEnemigos(resultado.especialesAplicados ?? [])) {
            await this.descartar(false);
            return;
        }
        const contexto = `${clase.Nombre} nivel ${this.nivelClase}`;
        this.svc.registrarAumentosPendientesPorEspeciales(resultado.especialesAplicados ?? [], contexto);
        this.svc.registrarAumentosPendientesPorProgresion(contexto);
        this.svc.registrarDotesPendientesPorRazaExtras(`${this.svc.RazaSeleccionada?.Nombre ?? 'Raza'}`);
        this.svc.registrarDotesPendientesPorEspeciales(resultado.especialesAplicados ?? [], contexto);
        this.svc.registrarDotesPendientesPorProgresion(contexto);
        this.daDg = daDgEnNivel(clase, this.nivelClase);
        this.carasDg = carasDado(clase?.Tipo_dado?.Nombre);
        this.svc.iniciarDistribucionHabilidadesPorClase(clase);
        this.intercambio = this.svc.getIntercambioConjurosDelNivel();
        this.pasos = [
            'clase',
            ...(this.svc.getAumentosCaracteristicaPendientes().length > 0 ? ['incremento' as const] : []),
            ...(this.daDg && this.carasDg > 0 ? ['pg' as const] : []),
            ...(this.svc.EstadoFlujo.habilidades.activa ? ['habilidades' as const] : []),
            ...(this.svc.getDotesPendientes().some((d) => d.estado === 'pendiente') ? ['dotes' as const] : []),
            ...(this.svc.getConjurosSesionActual().activa ? ['conjuros' as const] : []),
            ...(this.intercambio ? ['intercambio' as const] : []),
            'resumen',
        ];
        await this.siguiente();
    }

    private nivelDe(clase: Clase): number {
        return toInt((this.svc.PersonajeCreacion.desgloseClases ?? []).find((c) => normalizarTexto(c?.Nombre ?? '') === normalizarTexto(clase.Nombre))?.Nivel) + 1;
    }

    private async resolverEspecialidad(clase: Clase): Promise<boolean> {
        const pendiente = this.svc.getEspecialidadMagicaPendiente(clase, this.nivelClase);
        if (!pendiente)
            return true;
        const [escuelas, disciplinas] = await Promise.all([this.primero(this.escuelaSvc.getEscuelas()), this.primero(this.disciplinaSvc.getDisciplinas())]);
        const escuelaFija = this.svc.escuelaFijaEnCatalogo(pendiente, escuelas ?? []);
        const seleccion = await this.abrirModal<any>(SelectorEspecialidadMagicaModalComponent, {
            titulo: 'Especialización mágica', nombreClase: clase.Nombre, mostrarArcano: pendiente.requiereArcano,
            mostrarPsionico: pendiente.requierePsionico, escuelas: escuelas ?? [], escuelaFija, disciplinas: disciplinas ?? [],
        }, ['confirmar'], []);
        if (!seleccion)
            return false;
        const aplicado = this.svc.aplicarEspecialidadMagicaClase(clase, this.nivelClase, seleccion, escuelas ?? [], disciplinas ?? []);
        if (!aplicado.aplicado) {
            await this.avisar('Especialización inválida', aplicado.razon ?? 'No se ha podido aplicar la especialización.');
            return false;
        }
        this.svc.refrescarSesionConjurosPorEspecialidad();
        return true;
    }

    private async resolverEnemigos(especiales: any[]): Promise<boolean> {
        const total = this.svc.contarSeleccionesEnemigoPredilectoPorEspeciales(especiales);
        if (total < 1)
            return true;
        const enemigos = (await this.primero(this.enemigoSvc.getEnemigosPredilectos())) ?? [];
        for (let i = 1; i <= total; i++) {
            const id = await this.abrirModal<number>(SelectorEnemigoPredilectoModalComponent, {
                titulo: total > 1 ? `Enemigo predilecto (${i} de ${total})` : 'Enemigo predilecto',
                enemigos, enemigosYaElegidos: this.svc.PersonajeCreacion.enemigosPredilectos ?? [],
            }, ['confirmar'], []);
            const enemigo = enemigos.find((e: any) => toInt(e?.Id) === toInt(id));
            if (!enemigo || !this.svc.aplicarSeleccionEnemigoPredilecto(enemigo))
                return false;
        }
        return true;
    }

    // --- Los pasos -----------------------------------------------------------------------------------------------------

    /** El siguiente paso de la lista; los que se resuelven con un selector se abren al llegar. */
    async siguiente(): Promise<void> {
        const i = this.pasos.indexOf(this.paso);
        const siguiente = this.pasos[i + 1] ?? 'resumen';
        this.irA(siguiente);
        if (siguiente === 'incremento')
            await this.resolverIncremento();
        else if (siguiente === 'dotes')
            await this.resolverDotes();
        else if (siguiente === 'resumen')
            this.prepararResumen();
        this.guardarBorrador();
    }

    private irA(paso: PasoSubida): void {
        this.paso = paso;
        if (paso === 'clase')
            this.recalcularClases();
    }

    private async resolverIncremento(): Promise<void> {
        const pendientes = this.svc.getAumentosCaracteristicaPendientes();
        const p = this.svc.PersonajeCreacion;
        const asignaciones = await this.abrirModal<any[]>(SelectorAumentosCaracteristicaModalComponent, {
            titulo: `Incremento de característica del nivel ${this.nivelNuevo}`,
            pendientes,
            caracteristicasActuales: { Fuerza: p.Fuerza, Destreza: p.Destreza, Constitucion: p.Constitucion, Inteligencia: p.Inteligencia, Sabiduria: p.Sabiduria, Carisma: p.Carisma },
            caracteristicasPerdidas: caracteristicasPerdidasDe(p),
            topesCaracteristicas: this.svc.getTopesCaracteristicas(),
        }, ['confirmar'], []);
        if (!asignaciones || !this.svc.aplicarAumentosCaracteristica(asignaciones)) {
            await this.avisar('Falta el incremento', 'Elige a qué característica va el +1 para seguir.');
            return this.resolverIncremento();
        }
        // Con más Inteligencia, los puntos de este nivel también suben (MJ p. 59): el reparto se vuelve a abrir.
        if (this.svc.EstadoFlujo.habilidades.activa && this.claseElegida)
            this.svc.iniciarDistribucionHabilidadesPorClase(this.claseElegida);
        await this.siguiente();
    }

    private async resolverDotes(): Promise<void> {
        while (true) {
            const pendiente = this.svc.getSiguienteDotePendiente();
            if (!pendiente)
                break;
            const candidatos = this.svc.obtenerCandidatosDotePendiente(pendiente.id);
            if (!candidatos.some((c) => c.evaluacion?.estado === 'eligible' && c.repeticionValida && !c.restringidaPorTipo)) {
                this.svc.omitirDotePendiente(pendiente.id);
                continue;
            }
            const restantes = this.svc.getDotesPendientes().filter((d) => d.estado === 'pendiente').length;
            const seleccion = await this.abrirModal<DoteSeleccionConfirmada | 'omitir'>(SelectorDotesModalComponent, {
                titulo: 'Seleccionar dote', pendiente, candidatos, pendientesRestantes: restantes,
            }, ['confirmar'], [], { omitir: 'omitir' });
            if (!seleccion)
                return;
            if (seleccion === 'omitir')
                this.svc.omitirDotePendiente(pendiente.id);
            else if (!this.svc.aplicarDotePendiente(pendiente.id, seleccion))
                await this.avisar('No se pudo aplicar la dote', 'La selección ya no vale con el personaje de ahora. Elige otra.');
        }
        await this.siguiente();
    }

    // PG
    tirar(): void {
        if (this.tiradas.length >= this.tiradasPermitidas || this.carasDg < 1)
            return;
        const tirada = 1 + Math.floor(Math.random() * this.carasDg);
        this.tiradas = [...this.tiradas, tirada];
        this.tiradaElegida = Math.max(this.tiradaElegida ?? 0, tirada);
        this.calcularPg();
        this.guardarBorrador();
    }

    elegirTirada(tirada: number): void {
        this.tiradaElegida = tirada;
        this.calcularPg();
        this.guardarBorrador();
    }

    private calcularPg(): void {
        const entrada = this.entrada!;
        const tiradasGuardadas = (entrada.niveles ?? []).map((n) => n?.pg?.tirada).filter((t): t is number => toInt(t) > 0);
        const dgsAntes = Math.max(toInt(this.pj?.Nivel_personaje), (entrada.niveles ?? []).length);
        this.pg = puntosGolpeTrasSubida({
            pgAntes: toInt(entrada.personaje.puntosGolpe),
            modConAntes: modConstitucionDeEntrada(entrada),
            modConDespues: toInt(this.svc.PersonajeCreacion.ModConstitucion),
            tiradasAnteriores: tiradasGuardadas,
            dgsSinTirada: Math.max(0, dgsAntes - tiradasGuardadas.length),
            tirada: this.daDg ? this.tiradaElegida : null,
        });
    }

    get puedeSeguirPg(): boolean {
        return !this.daDg || this.tiradaElegida !== null;
    }

    // Habilidades
    claveDe(habilidad: any): string {
        return claveHabilidad(habilidad);
    }

    esDeClase(habilidad: any): boolean {
        return this.svc.esHabilidadClaseaEfectiva(claveHabilidad(habilidad));
    }

    limite(habilidad: any): number {
        return this.svc.obtenerLimiteRangoHabilidad(claveHabilidad(habilidad));
    }

    puedeSubir(habilidad: any): boolean {
        return this.svc.puedeSubirRangoHabilidad(claveHabilidad(habilidad));
    }

    rangosDeLaSesion(habilidad: any): number {
        return Math.max(0, Math.trunc(Number(habilidad?.Rangos ?? 0))
            - Math.trunc(Number(this.svc.EstadoFlujo.habilidades.rangosIniciales?.[claveHabilidad(habilidad)] ?? 0)));
    }

    ajustar(habilidad: any, delta: number): void {
        this.svc.ajustarRangoHabilidad(claveHabilidad(habilidad), delta);
    }

    cerrarHabilidades(): void {
        if (!this.svc.puedeCerrarDistribucionHabilidades())
            return;
        this.svc.cerrarDistribucionHabilidades();
        void this.siguiente();
    }

    // Conjuros
    elegirConjuro(conjuro: Conjuro): void {
        this.svc.seleccionarConjuroSesion(toInt(conjuro?.Id), this.pj?.Oficial === false);
    }

    quitarConjuro(id: number): void {
        this.svc.quitarConjuroSesion(id);
    }

    cerrarConjuros(): void {
        if (!this.svc.puedeCerrarSesionConjuros())
            return;
        this.svc.cerrarSesionConjuros();
        this.intercambio = this.svc.getIntercambioConjurosDelNivel();
        if (this.intercambio && !this.pasos.includes('intercambio'))
            this.pasos.splice(this.pasos.indexOf('resumen'), 0, 'intercambio');
        void this.siguiente();
    }

    // Intercambio
    elegirOlvidado(idConjuro: number): void {
        const o = this.intercambio?.olvidables.find((x) => toInt(x.conjuro?.Id) === toInt(idConjuro));
        this.olvidado = o ? { idConjuro: toInt(o.conjuro.Id), idClase: this.intercambio!.clase.id, nivel: o.nivel } : null;
        this.idNuevoIntercambio = null;
    }

    get candidatosIntercambio(): Conjuro[] {
        return this.olvidado && this.intercambio ? this.intercambio.candidatos(this.olvidado.nivel) : [];
    }

    cerrarIntercambio(cambiar: boolean): void {
        if (cambiar) {
            if (!this.olvidado || !this.idNuevoIntercambio || !this.svc.aplicarIntercambioConjuro(this.olvidado.idConjuro, this.idNuevoIntercambio))
                return;
        } else
            this.olvidado = null;
        void this.siguiente();
    }

    // --- El resumen y el guardado --------------------------------------------------------------------------------------

    private prepararResumen(): void {
        this.calcularPg();
        this.cambios = cambiosDeLaSubida({
            antes: this.pj!,
            despues: this.svc.PersonajeCreacion,
            clase: this.claseElegida,
            nivelClase: this.nivelClase,
            nivelNuevo: this.nivelNuevo,
            pg: this.pg,
            tirada: this.daDg ? this.tiradaElegida : null,
            caras: this.carasDg,
            elecciones: this.svc.getEleccionesDelNivelEnCurso(),
            nombreConjuro: (id) => this.nombreConjuro(id),
        });
    }

    private fichaParaGuardar(): PersonajeCreateRequestDto {
        const elecciones: PersonajeCreateNivelEleccionDto[] = this.svc.getEleccionesDelNivelEnCurso();
        return fichaDeLaSubida({
            entrada: this.entrada!,
            antes: this.antes!,
            despues: this.cuerpoDelMotor(),
            idClase: toInt(this.claseElegida?.Id),
            nivel: { idClase: toInt(this.claseElegida?.Id), nivelClase: this.nivelClase, elecciones },
            puntosGolpe: this.pg?.total ?? toInt(this.entrada?.personaje.puntosGolpe),
            olvidados: elecciones.filter((e) => e.tipo === 'conjuro_olvidado')
                .map((e) => ({ idConjuro: toInt(e.idElemento), idClase: toInt(e.idExtra) })),
        });
    }

    async guardar(seguir: boolean): Promise<void> {
        if (this.guardando || !this.claseElegida || !this.sesion || !this.puedeSeguirPg)
            return;
        this.guardando = true;
        this.error = '';
        this.errorPaso = null;
        try {
            const respuesta = await this.sesionesSvc.subirNivel(this.idPersonaje, {
                idClase: toInt(this.claseElegida.Id),
                ...(this.daDg && this.tiradaElegida !== null ? { pg: { tirada: this.tiradaElegida, tiradas: [...this.tiradas] } } : {}),
                ficha: this.fichaParaGuardar(),
                version: this.sesion.version,
            });
            if (!this.sigueLaMismaCuenta())
                return;
            this.borrarBorrador();
            this.puerta.subidaHecha(this.idPersonaje);
            if (seguir && respuesta.subida.nivelesPorSubir > 0) {
                this.reiniciarEstado();
                await this.cargar();
                return;
            }
            this.alTerminar?.();
        } catch (error: any) {
            if (!this.sigueLaMismaCuenta())
                return;
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido guardar la subida.';
            this.errorPaso = campoDelErrorASubida(error?.code, error?.field, this.pasos);
            if (this.errorPaso !== 'resumen' && this.errorPaso !== 'clase')
                this.irA(this.errorPaso);
        } finally {
            this.guardando = false;
        }
    }

    async descartar(confirmar = true): Promise<void> {
        if (confirmar) {
            const r = await Swal.fire({
                icon: 'question', title: 'Empezar la subida de nuevo', text: 'Se pierde lo elegido en este nivel.',
                showCancelButton: true, confirmButtonText: 'Empezar de nuevo', cancelButtonText: 'Seguir',
                target: document.body, heightAuto: false, scrollbarPadding: false,
            });
            if (!r.isConfirmed)
                return;
        }
        this.borrarBorrador();
        this.reiniciarEstado();
        await this.hidratar();
        this.irA('clase');
    }

    cancelar(): void {
        this.alTerminar?.();
    }

    private reiniciarEstado(): void {
        this.claseElegida = null;
        this.nivelClase = 0;
        this.pasos = ['clase', 'resumen'];
        this.tiradas = [];
        this.tiradaElegida = null;
        this.pg = null;
        this.intercambio = null;
        this.olvidado = null;
        this.idNuevoIntercambio = null;
        this.cambios = [];
    }

    // --- El borrador (por cuenta y personaje) --------------------------------------------------------------------------

    private guardarBorrador(): void {
        if (!this.sigueLaMismaCuenta() || !this.claseElegida || !this.sesion || !this.antes)
            return;
        const borrador: BorradorSubida = {
            version: 1, uid: this.uid, idPersonaje: this.idPersonaje, versionSesion: this.sesion.version, actualizado: Date.now(),
            paso: this.paso, idClase: toInt(this.claseElegida.Id), motor: this.svc.exportarEstadoSubida(), antes: this.antes,
            tiradas: this.tiradas, tiradaElegida: this.tiradaElegida, olvidado: this.olvidado,
        };
        try {
            localStorage.setItem(claveBorradorSubida(this.uid, this.idPersonaje), JSON.stringify({ ...borrador, pasos: this.pasos, nivelClase: this.nivelClase }));
        } catch { /* sin almacenamiento, la subida sigue sin borrador */ }
    }

    private borrarBorrador(): void {
        try {
            localStorage.removeItem(claveBorradorSubida(this.uid, this.idPersonaje));
        } catch { /* sin almacenamiento */ }
    }

    /** Si hay un borrador de esta cuenta, este personaje y esta versión de la sesión, se ofrece seguir con él. */
    private async restaurarBorrador(): Promise<boolean> {
        let borrador: (BorradorSubida & { pasos?: PasoSubida[]; nivelClase?: number; }) | null = null;
        try {
            borrador = JSON.parse(localStorage.getItem(claveBorradorSubida(this.uid, this.idPersonaje)) ?? 'null');
        } catch {
            borrador = null;
        }
        if (!borrador)
            return false;
        const vale = borrador.version === 1 && borrador.uid === this.uid && toInt(borrador.idPersonaje) === toInt(this.idPersonaje)
            && borrador.versionSesion === this.sesion?.version && Date.now() - toInt(borrador.actualizado) < CADUCIDAD_BORRADOR_MS;
        if (!vale) {
            this.borrarBorrador();
            return false;
        }
        const r = await Swal.fire({
            icon: 'question', title: 'Tienes una subida a medias', text: 'Puedes seguir donde lo dejaste o empezarla de nuevo.',
            showCancelButton: true, confirmButtonText: 'Seguir', cancelButtonText: 'Empezar de nuevo',
            target: document.body, heightAuto: false, scrollbarPadding: false,
        });
        const clase = ((this.svc as any).catalogoClases as Clase[]).find((c) => toInt(c?.Id) === toInt(borrador!.idClase)) ?? null;
        if (!r.isConfirmed || !clase || !this.svc.restaurarEstadoSubida(borrador.motor)) {
            this.borrarBorrador();
            return false;
        }
        this.antes = borrador.antes;
        this.claseElegida = clase;
        this.nivelClase = toInt(borrador.nivelClase);
        this.pasos = borrador.pasos ?? ['clase', 'resumen'];
        this.tiradas = borrador.tiradas ?? [];
        this.tiradaElegida = borrador.tiradaElegida ?? null;
        this.daDg = daDgEnNivel(clase, this.nivelClase);
        this.carasDg = carasDado(clase?.Tipo_dado?.Nombre);
        this.intercambio = this.svc.getIntercambioConjurosDelNivel();
        this.olvidado = borrador.olvidado ? { ...borrador.olvidado, nivel: -1 } as any : null;
        this.calcularPg();
        this.irA(borrador.paso);
        if (borrador.paso === 'resumen')
            this.prepararResumen();
        return true;
    }

    // --- Los selectores de la creación ---------------------------------------------------------------------------------

    /**
     * Abre un selector de la creación (declarados en `AppModule`) en el hueco de los modales: le pone sus entradas y
     * resuelve con lo que emita en `aceptar` (su valor) o en `rechazar` (`null`); `fijos` resuelve esas salidas con un valor.
     */
    private abrirModal<T>(tipo: Type<unknown>, entradas: Record<string, unknown>, aceptar: string[], rechazar: string[],
        fijos: Record<string, unknown> = {}): Promise<T | null> {
        this.cerrarModal();
        if (!this.modalHost)
            return Promise.resolve(null);
        const ref = this.modalHost.createComponent(tipo);
        Object.entries(entradas).forEach(([k, v]) => ref.setInput(k, v));
        this.modalAbierto = ref;
        return new Promise<T | null>((resolve) => {
            const terminar = (valor: T | null) => {
                this.cerrarModal();
                resolve(valor);
            };
            const instancia = ref.instance as Record<string, any>;
            aceptar.forEach((salida) => instancia[salida]?.subscribe((valor: T) => terminar(valor)));
            rechazar.forEach((salida) => instancia[salida]?.subscribe(() => terminar(null)));
            Object.entries(fijos).forEach(([salida, valor]) => instancia[salida]?.subscribe(() => terminar(valor as T)));
        });
    }

    private cerrarModal(): void {
        this.modalAbierto?.destroy();
        this.modalAbierto = null;
    }

    private async avisar(titulo: string, texto: string): Promise<void> {
        await Swal.fire({ icon: 'warning', title: titulo, text: texto, confirmButtonText: 'Entendido', target: document.body, heightAuto: false, scrollbarPadding: false });
    }
}
