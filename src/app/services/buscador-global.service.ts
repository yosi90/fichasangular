import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, catchError, from, map, of, switchMap, take } from 'rxjs';
import { ArmaService } from './arma.service';
import { ArmaduraService } from './armadura.service';
import { ClaseService } from './clase.service';
import { ConjuroService } from './conjuro.service';
import { DeidadService } from './deidad.service';
import { DoteService } from './dote.service';
import { EquipoService } from './equipo.service';
import { EspecialService } from './especial.service';
import { IdiomaService } from './idioma.service';
import { IncarnumService } from './incarnum.service';
import { ListaPersonajesService } from './listas/lista-personajes.service';
import { ManualVistaNavigationService } from './manual-vista-navigation.service';
import { ManualesAsociadosService } from './manuales-asociados.service';
import { MonstruoService } from './monstruo.service';
import { NavegacionRolService } from './navegacion-rol.service';
import { PlantillaService } from './plantilla.service';
import { RacialService } from './racial.service';
import { RasgoService } from './rasgo.service';
import { RazaService } from './raza.service';
import { SubtipoService } from './subtipo.service';
import { TipoCriaturaService } from './tipo-criatura.service';
import { VentajaService } from './ventaja.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';
import { ElementoBusqueda, FuenteBusqueda, LETRAS_MINIMAS_BUSQUEDA, RESULTADOS_POR_GRUPO, textoBuscable } from './utils/busqueda-global';
import { ICONOS_ROL, LISTADOS_ROL, TipoRol, tipoRolDeClase, tipoRolDeConjuro, tipoRolDeEquipo, tipoRolDeListado, tipoRolDeVentaja } from './utils/iconos-rol';
import { mayusculaInicial } from './utils/formato-registros';
import { normalizarTexto } from './utils/normalizacion';
import { textoVisible } from './utils/texto-visible';
import { TipoCatalogoEquipo } from '../interfaces/equipo';
import { nombreDeManual } from '../components/detalles/ficha/ficha';

/** Una fuente de la búsqueda: un catálogo que la web ya carga (caché o API), sin rutas nuevas. */
interface DefinicionFuente {
    readonly id: string;
    readonly titulo: string;
    readonly tipo: TipoRol | null;
    readonly iconoMaterial?: string;
    readonly lista?: string;
    readonly femenino?: boolean;
    readonly cargar: () => Observable<ElementoBusqueda[]>;
}

/** El título de un listado como grupo o pantalla: «Armaduras y escudos» (`LISTADOS_ROL`). */
function tituloListado(lista: string): string {
    return mayusculaInicial(LISTADOS_ROL[lista]?.titulo);
}

/**
 * Los datos de la búsqueda global (Ctrl+K o ⌘K; lienzo «Rol: las vistas que faltan», vista 5; la ventana es
 * `<app-buscador-global>`, que abre `BuscadorGlobalVentanaService`): carga una vez por sesión los catálogos que la web ya tiene (cachés de la RTDB o la API) y los personajes que
 * se pueden ver, y busca en ellos con `normalizarTexto`. Los objetos, que la API pagina, se buscan con `GET /objetos?q=`.
 * Ninguna ruta nueva: si los catálogos grandes pesaran demasiado, haría falta una ruta de búsqueda (cambio de contrato).
 */
@Injectable({
    providedIn: 'root'
})
export class BuscadorGlobalService {
    private readonly fuentesSubject = new BehaviorSubject<FuenteBusqueda[]>([]);
    readonly fuentes$: Observable<FuenteBusqueda[]> = this.fuentesSubject.asObservable();
    private readonly objetosSubject = new BehaviorSubject<FuenteBusqueda | null>(null);
    readonly objetos$: Observable<FuenteBusqueda | null> = this.objetosSubject.asObservable();
    private readonly textoObjetos$ = new Subject<string>();
    private cargado = false;

    constructor(
        private navegacion: NavegacionRolService,
        private perfilNav: UserProfileNavigationService,
        private manualVistaNav: ManualVistaNavigationService,
        private listaPersonajes: ListaPersonajesService,
        private razas: RazaService,
        private clases: ClaseService,
        private dotes: DoteService,
        private conjuros: ConjuroService,
        private monstruos: MonstruoService,
        private plantillas: PlantillaService,
        private raciales: RacialService,
        private especiales: EspecialService,
        private rasgos: RasgoService,
        private idiomas: IdiomaService,
        private ventajas: VentajaService,
        private incarnum: IncarnumService,
        private tiposCriatura: TipoCriaturaService,
        private subtipos: SubtipoService,
        private deidades: DeidadService,
        private armas: ArmaService,
        private armaduras: ArmaduraService,
        private equipo: EquipoService,
        private manuales: ManualesAsociadosService,
    ) {
        this.textoObjetos$
            .pipe(switchMap((texto) => this.buscarObjetos(texto)))
            .subscribe((fuente) => this.objetosSubject.next(fuente));
    }

    /** Lo escrito en el buscador, para los objetos (que busca la API). */
    buscarTexto(texto: string): void {
        this.textoObjetos$.next(texto);
    }

    /** Ver todo un listado («Ver los 23 en el listado»). */
    abrirListado(lista: string): void {
        this.navegacion.abrir({ clase: 'listado', lista });
    }

    /** Las fuentes, en el orden de los grupos; cada una se carga una vez por sesión (al abrir el buscador). */
    cargarFuentes(): void {
        if (this.cargado)
            return;
        this.cargado = true;
        const definiciones = this.definiciones();
        this.fuentesSubject.next(definiciones.map((d) => this.fuenteDe(d, 'cargando', [])));
        definiciones.forEach((definicion, indice) => {
            definicion.cargar().pipe(
                take(1),
                map((elementos) => this.fuenteDe(definicion, 'lista', elementos)),
                catchError(() => of(this.fuenteDe(definicion, 'error', []))),
            ).subscribe((fuente) => {
                const fuentes = [...this.fuentesSubject.value];
                fuentes[indice] = fuente;
                this.fuentesSubject.next(fuentes);
            });
        });
    }

    private fuenteDe(definicion: DefinicionFuente, estado: FuenteBusqueda['estado'], elementos: ElementoBusqueda[]): FuenteBusqueda {
        return { id: definicion.id, titulo: definicion.titulo, tipo: definicion.tipo, iconoMaterial: definicion.iconoMaterial, lista: definicion.lista, femenino: definicion.femenino, estado, elementos };
    }

    private buscarObjetos(texto: string): Observable<FuenteBusqueda | null> {
        if (normalizarTexto(texto, true).length < LETRAS_MINIMAS_BUSQUEDA)
            return of(null);
        const base = { id: 'objetos', titulo: tituloListado('objetos'), tipo: tipoRolDeListado('objetos'), lista: 'objetos', yaFiltrados: true };
        return from([null]).pipe(
            switchMap(() => this.equipo.getObjetos({ q: texto.trim(), limit: RESULTADOS_POR_GRUPO, offset: 0 })),
            map((pagina): FuenteBusqueda => ({
                ...base,
                estado: 'lista',
                total: pagina.total,
                elementos: pagina.items.map((objeto) => this.elementoEquipo('objeto', 'objetos', objeto)),
            })),
            catchError(() => of<FuenteBusqueda>({ ...base, estado: 'error', elementos: [] })),
        );
    }

    private elemento(lista: string, tipo: TipoRol, item: any, subtitulo: string = nombreDeManual(item?.Manual)): ElementoBusqueda {
        const nombre = textoVisible(item?.Nombre);
        return {
            clave: `${lista}:${item?.Id}`,
            tipo,
            nombre,
            subtitulo,
            buscable: textoBuscable(nombre, subtitulo),
            abrir: () => this.navegacion.abrir({ clase: 'detalle', lista, item }),
        };
    }

    private elementoEquipo(tipo: TipoCatalogoEquipo, lista: string, item: any): ElementoBusqueda {
        const elemento = this.elemento(lista, tipoRolDeEquipo(tipo), item);
        return {
            ...elemento,
            abrir: () => this.navegacion.abrir({ clase: 'detalle', lista, item: { tipo, item } }),
        };
    }

    /** Las filas con nombre y un id positivo (fuera los comodines y las vacías). */
    private filas<T>(lista: T[] | null | undefined): T[] {
        return (lista ?? []).filter((item: any) => Number(item?.Id) > 0 && textoVisible(item?.Nombre).length > 0);
    }

    private catalogo<T>(datos: Observable<T[]>, crear: (item: T) => ElementoBusqueda): Observable<ElementoBusqueda[]> {
        return datos.pipe(take(1), map((lista) => this.filas(lista).map(crear)));
    }

    private definiciones(): DefinicionFuente[] {
        // El título del grupo es el del listado («Armaduras y escudos»), salvo que se dé otro.
        const fuente = (id: string, lista: string, femenino: boolean, cargar: () => Observable<ElementoBusqueda[]>, titulo = tituloListado(lista)): DefinicionFuente =>
            ({ id, titulo, tipo: tipoRolDeListado(lista), lista, femenino, cargar });
        return [
            {
                id: 'personajes', titulo: 'Personajes', tipo: 'personaje',
                cargar: () => from(this.listaPersonajes.getPersonajes()).pipe(
                    switchMap((personajes) => personajes),
                    take(1),
                    map((personajes) => this.filas(personajes).map((pj): ElementoBusqueda => {
                        const subtitulo = [textoVisible(pj.Raza?.Nombre), textoVisible(pj.Clases)].filter((t) => t).join(' · ');
                        return {
                            clave: `personaje:${pj.Id}`, tipo: 'personaje', nombre: pj.Nombre, subtitulo,
                            buscable: textoBuscable(pj.Nombre, subtitulo),
                            abrir: () => this.navegacion.abrir({ clase: 'personaje', id: pj.Id }),
                        };
                    })),
                ),
            },
            fuente('razas', 'razas', true, () => this.catalogo(this.razas.getRazas(), (r) => this.elemento('razas', 'raza', r))),
            fuente('clases', 'clases', true, () => this.catalogo(this.clases.getClases(), (c) => this.elemento('clases', tipoRolDeClase(c), c))),
            fuente('dotes', 'dotes', true, () => this.catalogo(this.dotes.getDotes(), (d) => this.elemento('dotes', 'dote', d))),
            fuente('conjuros', 'conjuros', false, () => this.catalogo(this.conjuros.getConjuros(), (c) => this.elemento('conjuros', tipoRolDeConjuro(c), c)), 'Conjuros y poderes'),
            fuente('monstruos', 'monstruos', false, () => this.catalogo(this.monstruos.getMonstruos(), (m) => this.elemento('monstruos', 'monstruo', m))),
            fuente('plantillas', 'plantillas', true, () => this.catalogo(this.plantillas.getPlantillas(), (p) => this.elemento('plantillas', 'plantilla', p))),
            fuente('especiales', 'especiales', false, () => this.catalogo(this.especiales.getEspeciales(), (e) => this.elemento('especiales', 'especial', e))),
            fuente('raciales', 'raciales', false, () => this.catalogo(this.raciales.getRaciales(), (r) => this.elemento('raciales', 'racial', r))),
            fuente('rasgos', 'rasgos', false, () => this.catalogo(this.rasgos.getRasgos(), (r) => this.elemento('rasgos', 'rasgo', r))),
            fuente('idiomas', 'idiomas', false, () => this.catalogo(this.idiomas.getIdiomas(), (i) => this.elemento('idiomas', 'idioma', i))),
            fuente('ventajas', 'ventajas', true, () => this.ventajas.getVentajas().pipe(
                take(1),
                switchMap((ventajas) => this.ventajas.getDesventajas().pipe(take(1), map((desventajas) => [...ventajas, ...desventajas]))),
                map((todas) => this.filas(todas).map((v) => this.elemento('ventajas', tipoRolDeVentaja(v), v, ICONOS_ROL[tipoRolDeVentaja(v)].etiqueta))),
            )),
            fuente('fusiones', 'fusiones del alma', true, () => this.catalogo(this.incarnum.getFusiones(), (f) => this.elemento('fusiones del alma', 'fusion', f))),
            fuente('chakras', 'chakras', false, () => this.catalogo(this.incarnum.getChakras(), (c) => this.elemento('chakras', 'chakra', c, ''))),
            fuente('tipos', 'tipos de criatura', false, () => this.catalogo(this.tiposCriatura.getTiposCriatura(), (t) => this.elemento('tipos de criatura', 'tipo-criatura', t))),
            fuente('subtipos', 'subtipos', false, () => this.catalogo(this.subtipos.getSubtipos(), (s) => this.elemento('subtipos', 'subtipo', s))),
            fuente('deidades', 'deidades', true, () => this.catalogo(this.deidades.getDeidades(), (d) => this.elemento('deidades', 'deidad', d))),
            fuente('armas', 'armas', true, () => this.catalogo(this.armas.getArmas(), (a) => this.elemento('armas', 'arma', a))),
            fuente('armaduras', 'armaduras', true, () => this.catalogo(this.armaduras.getArmaduras(), (a) => this.elemento('armaduras', 'armadura', a))),
            fuente('municiones', 'munición', true, () => this.catalogo(this.equipo.getMuniciones(), (m) => this.elementoEquipo('municion', 'munición', m))),
            fuente('materiales', 'materiales especiales', false, () => this.catalogo(this.equipo.getMateriales(), (m) => this.elementoEquipo('material', 'materiales especiales', m))),
            fuente('aptitudes', 'aptitudes de armas y armaduras', true, () => this.catalogo(this.equipo.getEncantamientos(), (e) => this.elementoEquipo('encantamiento', 'aptitudes de armas y armaduras', e))),
            fuente('conjuntos', 'conjuntos de objetos', false, () => this.catalogo(this.equipo.getConjuntos(), (c) => this.elementoEquipo('conjunto', 'conjuntos de objetos', c))),
            {
                id: 'manuales', titulo: 'Manuales', tipo: 'manual',
                cargar: () => this.catalogo(this.manuales.getManualesAsociados(), (manual): ElementoBusqueda => ({
                    ...this.elemento('manuales', 'manual', manual, ''),
                    abrir: () => this.manualVistaNav.emitirApertura(manual),
                })),
            },
            {
                id: 'pantallas', titulo: 'Pantallas', tipo: null, iconoMaterial: 'tab',
                cargar: () => of(this.pantallas()),
            },
        ];
    }

    /** Las pantallas de la web: cada listado y la ayuda. */
    private pantallas(): ElementoBusqueda[] {
        const listados = Object.entries(LISTADOS_ROL).map(([lista, { tipo, titulo }]): ElementoBusqueda => {
            const nombre = `Lista de ${titulo}`;
            return {
                clave: `pantalla:${lista}`, tipo, nombre, subtitulo: 'Listado',
                buscable: textoBuscable(nombre), abrir: () => this.abrirListado(lista),
            };
        });
        return [
            ...listados,
            {
                clave: 'pantalla:ayuda', tipo: null, iconoMaterial: 'help_center', nombre: 'Ayuda', subtitulo: 'Primeros pasos, novedades, legal y créditos',
                buscable: textoBuscable('Ayuda', 'Primeros pasos novedades legal privacidad cookies créditos companion'),
                abrir: () => this.perfilNav.openAyuda(),
            },
        ];
    }
}
