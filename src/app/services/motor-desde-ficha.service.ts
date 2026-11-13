import { Injectable } from '@angular/core';
import { firstValueFrom, Observable, take } from 'rxjs';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeContextoIdsDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { NivelPerdido, SesionPersonaje } from 'src/app/interfaces/sesiones';
import { ArmaService } from './arma.service';
import { ArmaduraService } from './armadura.service';
import { ClaseService } from './clase.service';
import { ConjuroService } from './conjuro.service';
import { DominioService } from './dominio.service';
import { DoteService } from './dote.service';
import { EscuelaConjurosService } from './escuela-conjuros.service';
import { GrupoArmaService } from './grupo-arma.service';
import { GrupoArmaduraService } from './grupo-armadura.service';
import { HabilidadService } from './habilidad.service';
import { IdiomaService } from './idioma.service';
import { NuevoPersonajeService } from './nuevo-personaje.service';
import { PersonajeService } from './personaje.service';
import { PlantillaService } from './plantilla.service';
import { RazaService } from './raza.service';
import { SesionesService } from './sesiones.service';
import { extraConTipoArma, extraDeArmadura, extraDeDote } from './utils/extras-dotes';
import { toInt } from './utils/normalizacion';

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
        : Promise<{ sesion: SesionPersonaje; entrada: PersonajeCreateRequestDto; pj: Personaje; nivelesPerdidos?: NivelPerdido[]; } | null> {
        const { sesion, ficha, entrada, nivelesPerdidos } = await this.sesionesSvc.sesion(idPersonaje, numero);
        if (!sigue())
            return null;
        if (!entrada)
            throw new Error('La API no ha dado la ficha de la sesión abierta.');
        const pj = this.personajeSvc.fichaDeApi(ficha);
        await this.cargarCatalogos(motor);
        return { sesion, entrada, pj, nivelesPerdidos: nivelesPerdidos ?? [] };
    }

    /** Los catálogos que usa el motor, como en la creación. */
    async cargarCatalogos(motor: NuevoPersonajeService): Promise<void> {
        const [clases, dotes, conjuros, habilidades, custom, idiomas, dominios, escuelas, armas, armaduras, gruposArmas, gruposArmaduras] = await Promise.all([
            this.primero(this.claseSvc.getClases()), this.primero(this.doteSvc.getDotes()), this.primero(this.conjuroSvc.getConjuros()),
            this.primero(this.habilidadSvc.getHabilidades()), this.primero(this.habilidadSvc.getHabilidadesCustom()),
            this.primero(this.idiomaSvc.getIdiomas()), this.primero(this.dominioSvc.getDominios()), this.primero(this.escuelaSvc.getEscuelas()),
            this.primero(this.armaSvc.getArmas()), this.primero(this.armaduraSvc.getArmaduras()),
            this.primero(this.grupoArmaSvc.getGruposArmas()), this.primero(this.grupoArmaduraSvc.getGruposArmaduras()),
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
        return this.personajeSvc.construirPayloadCreacionDesdePersonaje(personaje, contexto, null,
            motor.getProgresionLanzadorPersistible(), null);
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
        motor.iniciarSubidaDesdeFicha({ personaje: pj, entrada, raza, razaBase, plantillas, nivelesPerdidos });
    }
}
