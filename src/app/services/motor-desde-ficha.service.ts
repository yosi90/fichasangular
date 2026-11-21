import { Injectable } from '@angular/core';
import { firstValueFrom, Observable, take } from 'rxjs';
import { MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeContextoIdsDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { HistorialSesiones, NivelPerdido, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { ArmaService } from './arma.service';
import { ArmaduraService } from './armadura.service';
import { ClaseService } from './clase.service';
import { ConjuroService } from './conjuro.service';
import { DeidadService } from './deidad.service';
import { DominioService } from './dominio.service';
import { DoteService } from './dote.service';
import { EscuelaConjurosService } from './escuela-conjuros.service';
import { GrupoArmaService } from './grupo-arma.service';
import { GrupoArmaduraService } from './grupo-armadura.service';
import { HabilidadService } from './habilidad.service';
import { IdiomaService } from './idioma.service';
import { MonstruoService } from './monstruo.service';
import { NuevoPersonajeService } from './nuevo-personaje.service';
import { PersonajeService } from './personaje.service';
import { PlantillaService } from './plantilla.service';
import { RazaService } from './raza.service';
import { SesionesService } from './sesiones.service';
import { SubtipoService } from './subtipo.service';
import { TipoCriaturaService } from './tipo-criatura.service';
import { extraConTipoArma, extraDeArmadura, extraDeDote } from './utils/extras-dotes';
import { familiarConSuCriatura } from './utils/familiar-reglas';
import { idDelMonstruo } from './utils/mascota-cupos';
import { toInt } from './utils/normalizacion';

/** Lo que da `cargarSesion`: la sesión abierta, su `entrada`, su ficha normalizada y los niveles que ha perdido. */
export interface SesionCargada {
    sesion: SesionPersonaje;
    entrada: PersonajeCreateRequestDto;
    pj: Personaje;
    nivelesPerdidos?: NivelPerdido[];
}

/**
 * Prepara una instancia del motor de la creación (`NuevoPersonajeService`) para un personaje guardado: lee la sesión
 * abierta con su ficha, carga sus catálogos y lo hidrata desde su ficha y su `entrada` (`iniciarSubidaDesdeFicha`). Lo
 * usan la subida de nivel (fase 4), la corrección de la ficha (fase 6) y la adquisición de una plantilla (fase 7) del
 * roadmap de sesiones, cada una con su propia instancia del motor, sin tocar la creación en curso.
 */
@Injectable({
    providedIn: 'root'
})
export class MotorDesdeFichaService {
    constructor(
        private claseSvc: ClaseService,
        private doteSvc: DoteService,
        private conjuroSvc: ConjuroService,
        private habilidadSvc: HabilidadService,
        private idiomaSvc: IdiomaService,
        private dominioSvc: DominioService,
        private razaSvc: RazaService,
        private plantillaSvc: PlantillaService,
        private escuelaSvc: EscuelaConjurosService,
        private armaSvc: ArmaService,
        private armaduraSvc: ArmaduraService,
        private grupoArmaSvc: GrupoArmaService,
        private grupoArmaduraSvc: GrupoArmaduraService,
        private sesionesSvc: SesionesService,
        private personajeSvc: PersonajeService,
        private subtipoSvc: SubtipoService,
        private deidadSvc: DeidadService,
        private monstruoSvc: MonstruoService,
        private tipoCriaturaSvc: TipoCriaturaService,
    ) { }

    /** El primer valor de un catálogo, o `null` si falla. */
    async primero<T>(origen: Observable<T> | Promise<Observable<T>>): Promise<T | null> {
        try {
            return await firstValueFrom((await origen).pipe(take(1)));
        } catch {
            return null;
        }
    }

    /**
     * La sesión abierta `numero` del personaje con su ficha y su `entrada` (`GET /personajes/{id}/sesiones/{numero}`), y
     * el motor con sus catálogos: lo que necesitan la subida y la corrección antes de hidratarlo. Si al responder ya no
     * es la misma cuenta (`sigue`), `null` sin cargar nada; sin la `entrada`, un error.
     */
    async cargarSesion(motor: NuevoPersonajeService, idPersonaje: number, numero: number, sigue: () => boolean)
        : Promise<SesionCargada | null> {
        const { sesion, ficha, entrada, nivelesPerdidos } = await this.sesionesSvc.sesion(idPersonaje, numero);
        if (!sigue())
            return null;
        if (!entrada)
            throw new Error('La API no ha dado la ficha de la sesión abierta.');
        const pj = this.personajeSvc.fichaDeApi(ficha);
        await this.cargarCatalogos(motor);
        return { sesion, entrada, pj, nivelesPerdidos: nivelesPerdidos ?? [] };
    }

    /**
     * El tramo común de la carga de las pantallas que apuntan en una sesión (la subida, la adquisición de una plantilla, la
     * pérdida de un nivel y la corrección): el historial, que pueda apuntar (`frases.sinPermiso`), la sesión abierta
     * (`frases.sinSesion`) y `cargarSesion`. La de juego (`experiencia.sesionAbierta`) o, con `deCualquierTipo` (la
     * corrección), cualquier abierta del historial. `alLeer` recibe el historial antes de comprobar nada (los PX de la
     * cabecera se ven aunque no se pueda seguir) y `exigir`, después del permiso y la sesión y antes de cargarla, da la frase
     * de lo que aún falta (la subida: los PX) o `null`. Lo que no se cumple, un error con su frase; si al responder ya no es
     * la misma cuenta (`sigue`), `null`.
     */
    async cargarSesionDeJuego(motor: NuevoPersonajeService, idPersonaje: number, sigue: () => boolean,
        frases: { sinPermiso: string; sinSesion: string; }, opciones: {
            deCualquierTipo?: boolean;
            alLeer?: (historial: HistorialSesiones) => void;
            exigir?: (historial: HistorialSesiones) => string | null;
        } = {}): Promise<{ historial: HistorialSesiones; cargada: SesionCargada; } | null> {
        const historial = await this.sesionesSvc.historial(idPersonaje);
        opciones.alLeer?.(historial);
        if (!historial.puedeApuntar)
            throw new Error(frases.sinPermiso);
        const abierta = opciones.deCualquierTipo
            ? toInt(historial.sesiones.find((s) => s.estado === 'abierta')?.numero ?? -1)
            : toInt(historial.experiencia?.sesionAbierta?.numero);
        if (opciones.deCualquierTipo ? abierta < 0 : abierta < 1)
            throw new Error(frases.sinSesion);
        const falta = opciones.exigir?.(historial);
        if (falta)
            throw new Error(falta);
        const cargada = await this.cargarSesion(motor, idPersonaje, abierta, sigue);
        return cargada ? { historial, cargada } : null;
    }

    /** Los catálogos que usa el motor, como en la creación. */
    async cargarCatalogos(motor: NuevoPersonajeService): Promise<void> {
        const [clases, dotes, conjuros, habilidades, custom, idiomas, dominios, escuelas, armas, armaduras, gruposArmas, gruposArmaduras, subtipos, deidades, progresionCompanero, progresionFamiliar] = await Promise.all([
            this.primero(this.claseSvc.getClases()), this.primero(this.doteSvc.getDotes()), this.primero(this.conjuroSvc.getConjuros()),
            this.primero(this.habilidadSvc.getHabilidades()), this.primero(this.habilidadSvc.getHabilidadesCustom()),
            this.primero(this.idiomaSvc.getIdiomas()), this.primero(this.dominioSvc.getDominios()), this.primero(this.escuelaSvc.getEscuelas()),
            this.primero(this.armaSvc.getArmas()), this.primero(this.armaduraSvc.getArmaduras()),
            this.primero(this.grupoArmaSvc.getGruposArmas()), this.primero(this.grupoArmaduraSvc.getGruposArmaduras()),
            // Los subtipos: su ajuste de nivel (el NEP) y el que da cambiar de tipo (el agrandado, al adquirir una plantilla).
            this.primero(this.subtipoSvc.getSubtipos()),
            // Las deidades: los dominios de la suya (el reciclaje de un dominio) y la deidad que piden sus clases.
            this.primero(this.deidadSvc.getDeidades()),
            // La tabla del compañero animal y sus aptitudes por nivel: la subida lo pone al día.
            this.primero(this.monstruoSvc.getCompanerosProgresion()),
            // Las tablas del familiar, sus aptitudes por nivel y sus pseudoplantillas: la subida también lo pone al día.
            this.primero(this.monstruoSvc.getFamiliaresProgresion()),
        ]);
        motor.setCatalogoClases(clases ?? []);
        motor.setCatalogoDotes(dotes ?? []);
        motor.setCatalogoConjuros(conjuros ?? []);
        motor.setCatalogoHabilidades(habilidades ?? []);
        motor.setCatalogoHabilidadesCustom(custom ?? []);
        motor.setCatalogoIdiomas(idiomas ?? []);
        motor.setCatalogoDominios(dominios ?? []);
        motor.setCatalogoEscuelasDotes((escuelas ?? []).map((e) => extraDeDote(e)));
        motor.setCatalogoArmasDotes((armas ?? []).map((a) => extraConTipoArma(a)));
        motor.setCatalogoArmadurasDotes((armaduras ?? []).map((a) => extraDeArmadura(a)));
        motor.setCatalogoGruposArmasDotes((gruposArmas ?? []).map((g) => extraConTipoArma(g)));
        motor.setCatalogoGruposArmadurasDotes((gruposArmaduras ?? []).map((g) => extraDeDote(g)));
        motor.setCatalogoSubtipos(subtipos ?? []);
        motor.setCatalogoDeidades(deidades ?? []);
        motor.setProgresionCompanero(progresionCompanero);
        motor.setProgresionFamiliar(progresionFamiliar);
    }

    /**
     * El cuerpo del alta que arma el motor ahora con los datos de la `entrada` que no lleva (nombre, alineamiento, deidad,
     * región…): lo que comparan antes y después la subida (`fichaDeLaSubida`), la corrección (los rangos) y la adquisición de
     * una plantilla (`fichaDeLaPlantilla`). El alineamiento, el de la `entrada` o `idAlineamiento` (el que deja una plantilla
     * que lo fija, como el vampiro).
     */
    cuerpoDelMotor(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, idAlineamiento?: number | null): PersonajeCreateRequestDto {
        const personaje = { ...motor.PersonajeCreacion, Nombre: entrada.personaje.nombre, Campana: 'Sin campaña' } as Personaje;
        const catalogo = (lista: Array<{ Id?: number; Nombre?: string; }>) => lista
            .map((x) => ({ id: toInt(x?.Id), nombre: `${x?.Nombre ?? ''}` })).filter((x) => x.id > 0);
        const s: any = motor;
        const contexto: PersonajeContextoIdsDto = {
            idAlineamiento: toInt(idAlineamiento) || toInt(entrada.personaje.idAlineamiento) || 1,
            idGenero: toInt(entrada.personaje.idGenero) || 1,
            idDeidad: toInt(entrada.personaje.deidad),
            idRegion: toInt(entrada.personaje.idRegion),
            catalogos: {
                clases: catalogo(s.catalogoClases ?? []),
                dominios: catalogo(s.catalogoDominios ?? []),
                idiomas: catalogo(motor.EstadoFlujo.ventajas.catalogoIdiomas ?? []),
            },
        };
        // El compañero animal y el familiar, con lo que les pone al día el motor (la subida: `fichaConLoDelMotor` pasa a la
        // ficha lo que cambia). Los PG del familiar, los de un amo sin PG (los suyos, si toma los mayores): los pone
        // `fichaConLoDelMotor` con los de la ficha.
        const companero = motor.companeroParaGuardar();
        const familiar = motor.familiarParaGuardar({ vidaAmo: 0 });
        const mascotas = { ...(companero ? { companero } : {}), ...(familiar ? { familiar } : {}) };
        return this.personajeSvc.construirPayloadCreacionDesdePersonaje(personaje, contexto, null,
            motor.getProgresionLanzadorPersistible(), Object.keys(mascotas).length > 0 ? mascotas : null);
    }

    /**
     * El cuerpo del motor antes y después de quitarle `dotes` (lo que dejan de dar: sus modificadores, sus características y
     * los rangos varios de sus habilidades) y los PG que dan con `dgs` DG; el motor se queda como estaba. `null` sin dotes.
     * Lo usan perder un nivel y la conversión en muerto viviente (las dotes del nivel que pierde).
     */
    loQueDabanLasDotes(motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto,
        dotes: ReadonlyArray<{ idDote: number; idExtra: number; }>, dgs: number)
        : { antes: PersonajeCreateRequestDto; despues: PersonajeCreateRequestDto; pg: number; } | null {
        if (dotes.length < 1)
            return null;
        const estado = motor.exportarEstadoSubida();
        try {
            const antes = this.cuerpoDelMotor(motor, entrada);
            dotes.forEach((d) => motor.quitarDotePorId(d.idDote, d.idExtra));
            return { antes, despues: this.cuerpoDelMotor(motor, entrada), pg: motor.pgQueDanLasDotes(dotes, dgs) };
        } finally {
            motor.restaurarEstadoSubida(estado);
        }
    }

    /**
     * El motor con el personaje guardado: su raza (y su base), sus plantillas y lo que ya eligió; `nivelesPerdidos`, los
     * que ha perdido (la subida cierra con ellos al paladín y al monje).
     */
    async hidratar(motor: NuevoPersonajeService, pj: Personaje, entrada: PersonajeCreateRequestDto,
        nivelesPerdidos: NivelPerdido[] = []): Promise<void> {
        const idRaza = toInt(entrada.personaje?.idRaza);
        const idRazaBase = toInt(entrada.personaje?.idRazaBase);
        const raza = idRaza > 0 ? await this.primero(this.razaSvc.getRaza(idRaza)) : null;
        const razaBase = idRazaBase > 0 && idRazaBase !== idRaza ? await this.primero(this.razaSvc.getRaza(idRazaBase)) : null;
        const plantillas = (await Promise.all((entrada.colecciones?.plantillas ?? [])
            .map((p) => this.primero(this.plantillaSvc.getPlantilla(toInt(p.idPlantilla))))))
            .filter((p): p is NonNullable<typeof p> => !!p);
        const personaje = await this.conLaCriaturaDelCompanero(await this.conLaCriaturaDelFamiliar(pj));
        motor.iniciarSubidaDesdeFicha({ personaje, entrada, raza, razaBase, plantillas, nivelesPerdidos });
    }

    /**
     * El personaje con las habilidades del monstruo de su compañero y los puntos por DG de su tipo (`Habilidades_monstruo`,
     * `Puntos_habilidad_tipo`): sus rangos siguen el criterio «todo o nada» al bajar sus DG adicionales (al perder un nivel o
     * quedar inactivo). Sin el monstruo o su tipo, sus rangos se quedan como están. Con las dotes de su monstruo
     * (`Dotes_monstruo`), las que le quedan por elegir, y con el límite de Inteligencia de su tipo, sus mejoras.
     */
    private async conLaCriaturaDelCompanero(pj: Personaje): Promise<Personaje> {
        const companeros = pj?.Companeros ?? [];
        if (companeros.length < 1)
            return pj;
        const conSuCriatura = await Promise.all(companeros.map(async (companero) => {
            const monstruo = await this.monstruoDeLaMascota(companero);
            const idTipo = toInt(monstruo?.Tipo?.Id);
            const tipo = idTipo > 0 ? await this.primero(Promise.resolve().then(() => this.tipoCriaturaSvc.getTipoCriatura(idTipo))) : null;
            if (!monstruo)
                return companero;
            // Las dotes de su monstruo: con ellas se cuentan las que le tocan elegir con sus DG.
            const conSusDotes = { ...companero, Dotes_monstruo: [...(monstruo.Dotes ?? [])] };
            if (!tipo || tipo.Puntos_habilidad === undefined || tipo.Puntos_habilidad === null)
                return conSusDotes;
            return {
                ...conSusDotes,
                Habilidades_monstruo: [...(monstruo.Habilidades ?? [])],
                Puntos_habilidad_tipo: toInt(tipo.Puntos_habilidad),
                Limite_inteligencia_tipo: toInt(tipo.Limite_inteligencia),
            };
        }));
        return { ...pj, Companeros: conSuCriatura };
    }

    /**
     * El personaje con su familiar sobre los valores de su criatura (`familiarConSuCriatura`): el motor le suma lo del nivel
     * de su amo al ponerlo al día, como en la creación. Sin la criatura no se sabría qué es de su nivel: un error.
     */
    private async conLaCriaturaDelFamiliar(pj: Personaje): Promise<Personaje> {
        const familiares = pj?.Familiares ?? [];
        if (familiares.length < 1)
            return pj;
        const conSuCriatura = await Promise.all(familiares.map(async (familiar) => {
            const monstruo = await this.monstruoDeLaMascota(familiar);
            if (!monstruo)
                throw new Error('No se ha podido cargar la criatura del familiar. Vuelve a intentarlo en unos segundos.');
            return familiarConSuCriatura(familiar, monstruo);
        }));
        return { ...pj, Familiares: conSuCriatura };
    }

    /** El monstruo de una mascota de la ficha (`idDelMonstruo`), o `null` si no se puede cargar. */
    private async monstruoDeLaMascota(mascota: { Id?: number; Monstruo_origen?: { Id?: number; } | null; }): Promise<MonstruoDetalle | null> {
        const id = idDelMonstruo(mascota);
        const monstruo = id > 0 ? await this.primero(Promise.resolve().then(() => this.monstruoSvc.getMonstruo(id))) : null;
        return monstruo && toInt(monstruo.Id) > 0 ? monstruo : null;
    }
}
