import { NuevoPersonajeService } from './nuevo-personaje.service';
import { PersonajeService } from './personaje.service';
import { normalizeClase } from './clase.service';
import { Clase } from '../interfaces/clase';
import { Personaje } from '../interfaces/personaje';
import { PersonajeCreateRequestDto } from '../interfaces/personajes-api';
import { RacialDetalle } from '../interfaces/racial';
import { Raza } from '../interfaces/raza';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { claveHabilidad } from './utils/habilidad-clave';
import { normalizeRacial } from './utils/racial-mapper';
import { aplicarProgresionRacial, textoCdRacial } from './utils/racial-progresion';
import { getClaveSeleccionRacial } from './utils/racial-opcionales';

// Lo que la creación aún no hacía con las razas mutadas (roadmap `ACTIVO_razas-mutadas`, `bugs.md`, 2026-11-12, rama
// `mutadas/creacion-resto`): la elección más de un grupo opcional (el segundo sigilo de poder del iluminiano a 2.º
// nivel, Races of Destiny, pág. 54), las salvaciones y las dotes de un rasgo ganado por la progresión y la frase de la CD
// con todos los DG (el aliento del aspecto dracónico del corazón). Con la forma de `Progresion` del contrato y los ids
// de `rol_dev`.

const TIPO: TipoCriatura = {
    Id: 1, Nombre: 'Humanoide', Descripcion: '', Manual: 'Manual', Id_tipo_dado: 1, Tipo_dado: 8, Id_ataque: 1,
    Id_fortaleza: 1, Id_reflejos: 1, Id_voluntad: 1, Id_puntos_habilidad: 1, Come: true, Respira: true, Duerme: true,
    Recibe_criticos: true, Puede_ser_flanqueado: true, Pierde_constitucion: false, Limite_inteligencia: 0,
    Tesoro: 'Normal', Id_alineamiento: 0, Rasgos: [], Oficial: true,
} as TipoCriatura;

const racial = (Id: number, Nombre: string, extra: Record<string, any> = {}) => ({ Id, Nombre, Descripcion: '', Oficial: true, ...extra });
const fila = (Desde: number, extra: Record<string, any>) => ({
    Medida: 'nivel', Desde, Gana: null, Sustituye: null, Tipo_dote: null, Velocidad: null, Valor: null, Elige_opcional: null,
    Frase: '', ...extra,
});
const SIGILOS = normalizeRacial(racial(4877, 'Sigilos de poder (iluminiano)', {
    Progresion: [fila(2, { Elige_opcional: 1, Valor: '+2' })],
}));
const SIGILO = (Id: number, Nombre: string) => normalizeRacial(racial(Id, `Sigilo de poder: ${Nombre}`, { Opcional: 1 }));
const AESH = SIGILO(4871, 'aesh (vigor)');
const HOON = SIGILO(4872, 'hoon (vida)');
const KRAU = SIGILO(4873, 'krau (magia)');

/** Un iluminiano humano como el del catálogo: los rasgos fijos y los seis sigilos (aquí tres) del grupo opcional 1. */
function iluminiano(raciales: RacialDetalle[]): Raza {
    return {
        Id: 963, Nombre: 'Iluminiano', Ajuste_nivel: 0, Manual: 'Manual', Clase_predilecta: 'Mago',
        Modificadores: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
        Alineamiento: {
            Id: 0, Basico: { Id_basico: 0, Nombre: 'No aplica' }, Ley: { Id_ley: 0, Nombre: 'No aplica' },
            Moral: { Id_moral: 0, Nombre: 'No aplica' }, Prioridad: { Id_prioridad: 0, Nombre: 'No aplica' }, Descripcion: '',
        },
        Oficial: true, Ataques_naturales: '', Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
        Dgs_adicionales: {
            Cantidad: 0, Dado: 'd8', Tipo_criatura: 'Humanoide', Ataque_base: 0, Dotes_extra: 0, Puntos_habilidad: 0,
            Multiplicador_puntos_habilidad: 1, Fortaleza: 0, Reflejos: 0, Voluntad: 0,
        },
        Reduccion_dano: '', Resistencia_magica: '', Resistencia_energia: '', Heredada: false, Mutada: false,
        Tamano_mutacion_dependiente: false,
        Prerrequisitos: { actitud_prohibido: [], actitud_requerido: [], alineamiento_prohibido: [], alineamiento_requerido: [], tipo_criatura: [] },
        Armadura_natural: 0, Varios_armadura: 0, Correr: 30, Nadar: 0, Volar: 0, Maniobrabilidad: { Id: 0, Nombre: 'No vuela' },
        Trepar: 0, Excavar: 0, Altura_rango_inf: 1.4, Altura_rango_sup: 2, Peso_rango_inf: 38, Peso_rango_sup: 122,
        Edad_adulto: 15, Edad_mediana: 35, Edad_viejo: 53, Edad_venerable: 70, Espacio: 5, Alcance: 5, Tipo_criatura: TIPO,
        Subtipos: [], Sortilegas: [], Raciales: raciales, Habilidades: { Base: [], Custom: [] }, DotesContextuales: [],
    } as unknown as Raza;
}

const GUERRERO = normalizeClase({
    Id: 7, Nombre: 'Guerrero', Nivel_max_claseo: 20, Conjuros: {}, Tipo_dado: { Id: 4, Nombre: 'd10' },
    Puntos_habilidad: { Id: 1, Valor: 2 }, Habilidades: { Base: [], Custom: [] },
    Desglose_niveles: Array.from({ length: 5 }, (_x, i) => ({
        Nivel: i + 1, Ataque_base: `+${i + 1}`, Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
    })),
});

function motor(): NuevoPersonajeService {
    const svc = new NuevoPersonajeService();
    svc.setCatalogoTiposCriatura([TIPO]);
    svc.setCatalogoHabilidades([]);
    svc.setCatalogoClases([GUERRERO]);
    svc.setCatalogoDotes([]);
    svc.setCatalogoConjuros([]);
    return svc;
}

function aplicarNivel(svc: NuevoPersonajeService, c: Clase): void {
    const r = svc.aplicarSiguienteNivelClase(c);
    expect(r.aplicado).withContext(`${r.razon}`).toBeTrue();
    svc.registrarAumentosPendientesPorProgresion(`${c.Nombre} ${r.nivelAplicado}`);
    svc.getAumentosCaracteristicaPendientes().forEach((a) => svc.aplicarAumentosCaracteristica([{ idPendiente: a.id, caracteristica: 'Fuerza' }]));
    svc.registrarDotesPendientesPorRazaExtras('Raza');
    svc.iniciarDistribucionHabilidadesPorClase(c);
    svc.cerrarDistribucionHabilidades();
    for (let p = svc.getSiguienteDotePendiente(), i = 0; p && i < 10; p = svc.getSiguienteDotePendiente(), i++)
        svc.omitirDotePendiente(p.id);
}

function crearIluminiano(raciales: RacialDetalle[] = [SIGILOS, AESH, HOON, KRAU]): NuevoPersonajeService {
    const svc = motor();
    // El catálogo trae los tres sigilos; la creación elige uno (aesh) en el selector de raciales opcionales.
    svc.seleccionarRaza(iluminiano(raciales), null, { 1: getClaveSeleccionRacial(AESH) });
    svc.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 12, Constitucion: 12, Inteligencia: 10, Sabiduria: 10, Carisma: 10 });
    return svc;
}

function cuerpo(svc: NuevoPersonajeService): PersonajeCreateRequestDto {
    return new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
        { ...svc.PersonajeCreacion, Nombre: 'Iluminiano', Campana: 'Sin campaña' } as Personaje,
        { idAlineamiento: 1, idGenero: 1, idDeidad: 0, catalogos: { clases: [{ id: 7, nombre: 'Guerrero' }] } } as any);
}

const ids = (svc: NuevoPersonajeService) => svc.PersonajeCreacion.Raciales.map((x) => x.Id);

describe('Lo que la creación aún no hacía: la elección más de un grupo opcional de la progresión', () => {
    it('la regla: a nivel 2, una elección del grupo 1 y el +2 en el rasgo de los sigilos', () => {
        expect(aplicarProgresionRacial([SIGILOS], { dg: 1, nivel: 1 }).elecciones).toEqual([]);
        const a2 = aplicarProgresionRacial([SIGILOS], { dg: 2, nivel: 2 });
        expect(a2.elecciones).toEqual([jasmine.objectContaining({ Grupo: 1, Desde: 2, Medida: 'nivel', Racial: { Id: 4877, Nombre: SIGILOS.Nombre } })]);
        expect(a2.raciales[0].Valor).toBe('+2');
        expect(SIGILOS.Progresion?.[0].Elige_opcional).toBe(1);
    });

    it('un iluminiano guerrero 1 no elige otro sigilo; a 2.º nivel, entre los que no tiene, y lo guarda con su origen', () => {
        const svc = crearIluminiano();
        aplicarNivel(svc, GUERRERO);
        expect(ids(svc)).toEqual([4877, 4871]);
        expect(svc.getEleccionesRacialesPendientes()).toEqual([]);
        aplicarNivel(svc, GUERRERO);
        const [pendiente, ...otras] = svc.getEleccionesRacialesPendientes();
        expect(otras).toEqual([]);
        expect(pendiente.origen).toBe('Sigilos de poder (iluminiano), a nivel 2');
        expect(pendiente.opciones.map((o) => o.Id)).toEqual([4872, 4873]);
        const grupos = svc.gruposDeEleccionRacial(pendiente);
        expect(grupos[0].opciones.map((o) => o.estado)).toEqual(['eligible', 'eligible']);
        expect(svc.idRacialDeEleccion(pendiente, grupos[0].opciones[0].clave)).toBe(4872);
        // No vale uno que no es de sus opciones (el que ya tiene).
        expect(svc.aplicarEleccionRacialPendiente(pendiente.clave, 4871)).toBeFalse();
        expect(svc.aplicarEleccionRacialPendiente(pendiente.clave, 4872)).toBeTrue();
        expect(ids(svc)).toContain(4872);
        expect(svc.PersonajeCreacion.Raciales.find((r) => r.Id === 4872)?.Origen).toBe('Sigilos de poder (iluminiano), a nivel 2');
        expect(svc.PersonajeCreacion.Raciales.find((r) => r.Id === 4877)?.Valor).toBe('+2');
        expect(svc.getEleccionesRacialesPendientes()).toEqual([]);
        expect(cuerpo(svc).colecciones?.raciales).toContain(jasmine.objectContaining({ idRacial: 4872 }));
        // A 3.er nivel no pide otra.
        aplicarNivel(svc, GUERRERO);
        expect(svc.getEleccionesRacialesPendientes()).toEqual([]);
    });

    it('sin rasgos del grupo que no tenga, se da por hecha', () => {
        const svc = crearIluminiano([SIGILOS, AESH]);
        aplicarNivel(svc, GUERRERO);
        aplicarNivel(svc, GUERRERO);
        const [pendiente] = svc.getEleccionesRacialesPendientes();
        expect(pendiente.opciones).toEqual([]);
        svc.omitirEleccionRacialPendiente(pendiente.clave);
        expect(svc.getEleccionesRacialesPendientes()).toEqual([]);
    });
});

describe('Lo que la creación aún no hacía: las salvaciones y las dotes de un rasgo ganado por la progresión', () => {
    const DOTE = { Id_dote: 900, Dote: 'Alerta', Id_extra: 0, Extra: 'No aplica' };
    const GANADO = racial(950, 'Resistencia ganada', {
        Salvaciones: [{ Id_salvacion: 1, Salvacion: 'Fortaleza', Cantidad: 2, Condicion: null }],
        Dotes: [DOTE],
    });
    const CRECE = normalizeRacial(racial(951, 'Rasgo que crece', {
        Progresion: [fila(2, { Gana: GANADO })],
    }));

    it('a nivel 2 suma la salvación del rasgo ganado y añade su dote, una vez', () => {
        const svc = motor();
        svc.seleccionarRaza(iluminiano([CRECE]));
        svc.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 12, Constitucion: 12, Inteligencia: 10, Sabiduria: 10, Carisma: 10 });
        aplicarNivel(svc, GUERRERO);
        const fortaleza = () => svc.PersonajeCreacion.Salvaciones.fortaleza.modsVarios.filter((m) => m.origen.includes('Resistencia ganada'));
        expect(fortaleza()).toEqual([]);
        expect(svc.PersonajeCreacion.Dotes.map((d) => d.Nombre)).not.toContain('Alerta');
        aplicarNivel(svc, GUERRERO);
        expect(ids(svc)).toContain(950);
        expect(fortaleza().map((m) => m.valor)).toEqual([2]);
        expect(svc.PersonajeCreacion.Dotes.filter((d) => d.Nombre === 'Alerta').map((d) => d.Origen)).toEqual(['Resistencia ganada']);
        aplicarNivel(svc, GUERRERO);
        expect(svc.PersonajeCreacion.Dotes.filter((d) => d.Nombre === 'Alerta').length).toBe(1);
        expect(fortaleza().length).toBe(1);
    });
});

describe('La subida de nivel con la raza del catálogo (todos los opcionales de cada grupo)', () => {
    const conSalvacion = (r: RacialDetalle, cantidad: number) => normalizeRacial({
        ...r, Salvaciones: [{ Id_salvacion: 1, Salvacion: 'Fortaleza', Cantidad: cantidad, Condicion: null }],
    });
    const AESH_F = conSalvacion(AESH, 1);
    const HOON_F = conSalvacion(HOON, 5);

    function guardar(svc: NuevoPersonajeService): { entrada: PersonajeCreateRequestDto; personaje: Personaje; } {
        const vida = svc.calcularVidaFinalAleatoria();
        svc.PersonajeCreacion.Vida = vida.total;
        const entrada = cuerpo(svc);
        entrada.niveles = (svc.getNivelesParaGuardar(entrada.progresionLanzador, vida.detalle?.dados) ?? []).map((n) => ({ ...n, ordenConocido: true } as any));
        return { entrada, personaje: JSON.parse(JSON.stringify(svc.PersonajeCreacion)) };
    }

    it('solo cuentan las salvaciones del sigilo que eligió, no las de los demás del grupo; y a 2.º nivel elige otro', () => {
        const catalogo = iluminiano([SIGILOS, AESH_F, HOON_F, KRAU]);
        const creado = crearIluminiano([SIGILOS, AESH_F, HOON_F, KRAU]);
        aplicarNivel(creado, GUERRERO);
        const guardado = guardar(creado);
        const subida = motor();
        subida.iniciarSubidaDesdeFicha({ personaje: JSON.parse(JSON.stringify(guardado.personaje)), entrada: guardado.entrada, raza: catalogo });
        aplicarNivel(subida, GUERRERO);
        const fortaleza = subida.PersonajeCreacion.Salvaciones.fortaleza.modsVarios.filter((m) => m.origen.includes('Sigilo de poder'));
        expect(fortaleza.map((m) => m.valor)).toEqual([1]);
        const [pendiente] = subida.getEleccionesRacialesPendientes();
        expect(pendiente.opciones.map((o) => o.Id)).toEqual([4872, 4873]);
        expect(subida.aplicarEleccionRacialPendiente(pendiente.clave, 4873)).toBeTrue();
        expect(subida.getEleccionesRacialesPendientes()).toEqual([]);
    });
});

describe('La CD de un rasgo con todos los DG', () => {
    it('la frase del detalle', () => {
        const corazon = normalizeRacial(racial(34, 'Aspecto dracónico (corazón)', {
            Caracteristica_cd: { Id: 3, Nombre: 'Constitución' }, Cd_dg_totales: true,
        }));
        expect(corazon.Cd_dg_totales).toBeTrue();
        expect(textoCdRacial(corazon)).toBe('10 + ½ de todos sus DG + su modificador de Constitución');
        expect(textoCdRacial({ ...corazon, Cd_dg_totales: false })).toBe('10 + ½ de sus DG raciales + su modificador de Constitución');
        expect(textoCdRacial(normalizeRacial(racial(1, 'Sin CD')))).toBeNull();
    });
});
