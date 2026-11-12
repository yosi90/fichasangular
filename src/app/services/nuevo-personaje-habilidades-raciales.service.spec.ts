import { NuevoPersonajeService } from './nuevo-personaje.service';
import { PersonajeService } from './personaje.service';
import { normalizeClase } from './clase.service';
import { normalizeHabilidadBasica } from './habilidad.service';
import { Clase } from '../interfaces/clase';
import { Personaje } from '../interfaces/personaje';
import { PersonajeCreateRequestDto } from '../interfaces/personajes-api';
import { Raza } from '../interfaces/raza';
import { claveHabilidad } from './utils/habilidad-clave';
import { normalizeRazaApi } from './utils/raza-mapper';
import { fichaDeLaSubida } from './utils/subida-nivel';
import { ENANO_API, GNOMO_API, HABILIDADES_API, HUMANO_API, PROLE_SOBRE_HUMANO_API } from 'src/testing/razas-condicionales-api';

// Las habilidades de un rasgo racial y sus bonificadores condicionales en la creación y en la subida (roadmap
// `ACTIVO_razas-mutadas`, `bugs.md`, 2026-11-12), con las razas reales de `rol_dev` (`src/testing/razas-condicionales-api.ts`):
// el aspecto dracónico de la mente (+2 a Avistar, Buscar y Escuchar, Races of the Dragon, págs. 9-10), el gnomo (+2 a
// Artesanía (alquimia) en la raza y en su rasgo) y el enano (+2 a Artesanía y Tasación con piedra o metal, +1 al ataque
// contra orcos y trasgoides y esquiva +4 contra gigantes; Manual del jugador, cap. 2).

const GUERRERO = normalizeClase({
    Id: 7, Nombre: 'Guerrero', Nivel_max_claseo: 20, Conjuros: {}, Tipo_dado: { Id: 4, Nombre: 'd10' },
    Puntos_habilidad: { Id: 1, Valor: 2 }, Habilidades: { Base: [], Custom: [] },
    Desglose_niveles: Array.from({ length: 10 }, (_x, i) => ({
        Nivel: i + 1, Ataque_base: `+${i + 1}`, Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
    })),
});
const CARACTERISTICAS = { Fuerza: 14, Destreza: 12, Constitucion: 12, Inteligencia: 10, Sabiduria: 10, Carisma: 10 };

const PROLE = normalizeRazaApi(PROLE_SOBRE_HUMANO_API);
const HUMANO = normalizeRazaApi(HUMANO_API);
const GNOMO = normalizeRazaApi(GNOMO_API);
const ENANO = normalizeRazaApi(ENANO_API);
const id = (raza: Raza, nombre: string) => raza.Raciales.find((r) => r.Nombre === nombre)!.Id;

function motor(): NuevoPersonajeService {
    const svc = new NuevoPersonajeService();
    const tipo = PROLE.Tipo_criatura;
    svc.setCatalogoTiposCriatura([tipo, ENANO.Tipo_criatura, GNOMO.Tipo_criatura]);
    svc.setCatalogoHabilidades(HABILIDADES_API.map(normalizeHabilidadBasica));
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
    svc.registrarDotesPendientesPorProgresion(`${c.Nombre} ${r.nivelAplicado}`);
    svc.iniciarDistribucionHabilidadesPorClase(c);
    svc.cerrarDistribucionHabilidades();
    for (let p = svc.getSiguienteDotePendiente(), i = 0; p && i < 10; p = svc.getSiguienteDotePendiente(), i++)
        svc.omitirDotePendiente(p.id);
}

function crear(raza: Raza, base: Raza | null, opcionales: Record<number, string> = {}, niveles = 1): NuevoPersonajeService {
    const svc = motor();
    expect(svc.seleccionarRaza(raza, base as any, opcionales)).toBeTrue();
    svc.aplicarCaracteristicasGeneradas(CARACTERISTICAS);
    for (let i = 0; i < niveles; i++)
        aplicarNivel(svc, GUERRERO);
    svc.recalcularSinergiasHabilidades();
    return svc;
}

const habilidad = (svc: NuevoPersonajeService, nombre: string) =>
    svc.PersonajeCreacion.Habilidades.find((h) => !h.Custom && h.Nombre === nombre)!;

function cuerpo(svc: NuevoPersonajeService): PersonajeCreateRequestDto {
    return new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
        { ...svc.PersonajeCreacion, Nombre: 'Prueba', Campana: 'Sin campaña' } as Personaje,
        { idAlineamiento: 1, idGenero: 1, idDeidad: 0, catalogos: { clases: [{ id: 7, nombre: 'Guerrero' }] } } as any);
}

describe('Las habilidades de los rasgos raciales en la creación', () => {
    it('la prole humana con el aspecto de la mente suma +2 a Avistar, Buscar y Escuchar, con el nombre del rasgo', () => {
        const svc = crear(PROLE, HUMANO, { 1: `id:${id(PROLE, 'Aspecto dracónico (mente)')}` });
        ['Avistar', 'Buscar', 'Escuchar'].forEach((nombre) => {
            expect(habilidad(svc, nombre).Rangos_varios).withContext(nombre).toBe(2);
            expect(habilidad(svc, nombre).Varios).withContext(nombre).toBe('Aspecto dracónico (mente) +2');
        });
        expect(habilidad(svc, 'Saltar').Rangos_varios).toBe(0);
        // Y el alta lo guarda en sus rangos varios.
        const avistar = cuerpo(svc).colecciones?.habilidades?.base?.find((h: any) => h.idHabilidad === 6) as any;
        expect(avistar.rangosVarios).toBe(2);
    });

    it('con el de las alas, +10 a Saltar; al cambiar de aspecto, el de antes se va', () => {
        const svc = crear(PROLE, HUMANO, { 1: `id:${id(PROLE, 'Aspecto dracónico (alas)')}` });
        expect(habilidad(svc, 'Saltar').Rangos_varios).toBe(10);
        expect(habilidad(svc, 'Avistar').Rangos_varios).toBe(0);
    });

    it('el gnomo: el +2 a Artesanía (alquimia) de la raza y el de su rasgo no se apilan', () => {
        const svc = crear(GNOMO, null);
        const artesania = svc.PersonajeCreacion.Habilidades.find((h) => !h.Custom && Number(h.Id) === 2 && Number(h.Rangos_varios) !== 0)!;
        expect(artesania.Rangos_varios).toBe(2);
        expect(artesania.Varios).toBe('Gnomo +2');
        expect(habilidad(svc, 'Escuchar').Rangos_varios).toBe(2);
    });

    it('el enano: el +2 a Artesanía y a Tasación con piedra o metal va aparte, sin sumar', () => {
        const svc = crear(ENANO, null);
        const tasacion = habilidad(svc, 'Tasación');
        expect(tasacion.Rangos_varios).toBe(0);
        expect(tasacion.Bonos_condicionales).toContain(jasmine.objectContaining({
            origen: '+2 a tasación de objetos de piedra y/o metal', valor: 2, condicion: 'Objetos de piedra y/o metal',
        }));
        const artesania = svc.PersonajeCreacion.Habilidades.find((h) => !h.Custom && Number(h.Id) === 2)!;
        expect(artesania.Rangos_varios).toBe(0);
        expect(artesania.Bonos_condicionales).toContain(jasmine.objectContaining({ valor: 2, condicion: 'Objetos de piedra y/o metal' }));
    });
});

describe('Los bonificadores condicionales de los rasgos en la creación', () => {
    it('el enano: +1 al ataque contra orcos y trasgoides y esquiva +4 contra gigantes, aparte de la CA', () => {
        const svc = crear(ENANO, null);
        const pj = svc.PersonajeCreacion;
        expect(pj.Bonificadores_condicionales?.map((b) => b.frase)).toEqual([
            'Ataque +1 (racial) contra orcos y trasgoides',
            'CA +4 (esquiva) contra gigantes',
        ]);
        expect(pj.Bonificadores_condicionales?.[0].contra.map((c) => c.Nombre.toLowerCase()).sort()).toEqual(['orco', 'trasgoide']);
        expect(pj.Bonificadores_condicionales?.[1].origen).toBe('+4 de esquiva a la ca contra gigantes');
        // La CA no lo cuenta: 10 + Destreza (+1).
        expect(pj.Ca).toBe(11);
    });

    it('la prole: la esquiva +2 contra dragones; un humano, ninguno', () => {
        const prole = crear(PROLE, HUMANO, { 1: `id:${id(PROLE, 'Aspecto dracónico (mente)')}` });
        expect(prole.PersonajeCreacion.Bonificadores_condicionales?.map((b) => b.frase)).toEqual(['CA +2 (esquiva) contra criaturas del tipo dragón']);
        expect(crear(HUMANO, null).PersonajeCreacion.Bonificadores_condicionales).toEqual([]);
    });
});

describe('Lo que llega con un rasgo ganado por la progresión', () => {
    // Un rasgo que se gana a los 6 DG con una habilidad y un bonificador condicional (la forma del contrato).
    const GANADO = {
        Id: 99001, Nombre: 'Ojo de dragón (prueba)', Descripcion: '', Oficial: true, Progresion: [],
        Habilidades: { Base: [{ Id_habilidad: 6, Habilidad: 'Avistar', Id_extra: -1, Rangos: 4, Condicion: null, Se_considera_clasea: false }], Custom: [] },
        Bonificadores_condicionales: [{
            Id: 1, Objetivo: { Id: 2, Nombre: 'Ataque' }, Tipo_bonificador: { Id: 14, Nombre: 'Racial' }, Cantidad: 1,
            Condicion: 'Contra dragones', Contra: [{ Catalogo: 'tipo_criatura', Id: 7, Nombre: 'Dragón' }],
            Frase: 'Ataque +1 (racial) contra dragones',
        }],
    };
    const CON_PROGRESION = (() => {
        const raw = JSON.parse(JSON.stringify(PROLE_SOBRE_HUMANO_API));
        const mente = raw.rac.find((r: any) => r.Nombre === 'Aspecto dracónico (mente)');
        mente.Progresion = [...(mente.Progresion ?? []), {
            Medida: 'dg', Desde: 6, Gana: GANADO, Sustituye: null, Tipo_dote: null, Velocidad: null, Valor: null,
            Frase: 'A los 6 DG: gana Ojo de dragón (prueba).',
        }];
        return normalizeRazaApi(raw);
    })();
    const opcional = { 1: `id:${id(PROLE, 'Aspecto dracónico (mente)')}` };

    it('a 5 DG no está; a 6, su +4 a Avistar no se apila con el +2 de la mente y su bonificador sale aparte', () => {
        const a5 = crear(CON_PROGRESION, HUMANO, opcional, 5);
        expect(habilidad(a5, 'Avistar').Rangos_varios).toBe(2);
        expect(a5.PersonajeCreacion.Bonificadores_condicionales?.map((b) => b.frase)).not.toContain('Ataque +1 (racial) contra dragones');
        const a6 = crear(CON_PROGRESION, HUMANO, opcional, 6);
        expect(habilidad(a6, 'Avistar').Rangos_varios).toBe(4);
        expect(habilidad(a6, 'Avistar').Varios).toBe('Ojo de dragón (prueba) +4');
        expect(a6.PersonajeCreacion.Bonificadores_condicionales?.map((b) => b.frase)).toContain('Ataque +1 (racial) contra dragones');
    });

    it('al subir de 5 a 6 DG, la ficha que se manda lleva los rangos varios nuevos', () => {
        const svc = crear(CON_PROGRESION, HUMANO, opcional, 5);
        const antes = cuerpo(svc);
        aplicarNivel(svc, GUERRERO);
        const despues = cuerpo(svc);
        const entrada: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(antes));
        const ficha = fichaDeLaSubida({
            entrada, antes, despues, idClase: 7, nivel: { idClase: 7, nivelClase: 6, elecciones: [] }, puntosGolpe: 50,
        });
        const avistar = ficha.colecciones?.habilidades?.base?.find((h: any) => h.idHabilidad === 6) as any;
        expect(avistar.rangosVarios).toBe(4);
        expect(claveHabilidad(habilidad(svc, 'Avistar'))).toBeTruthy();
    });
});
