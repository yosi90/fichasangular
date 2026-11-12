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
import { fichaDeLaSubida, puntosGolpeTrasSubida, modConstitucionDeEntrada } from './utils/subida-nivel';

// Lo que crece con los DG (roadmap `ACTIVO_razas-mutadas`, 2026-11-12) en la creación y en la subida de nivel, con los
// aspectos de la prole de Bahamut (Races of the Dragon, págs. 9-10) y del nacido del Infierno (Fiendish Codex II,
// pág. 78) con la forma exacta de `Progresion` del contrato (`GET /razas/{id}/sobre/{idBase}`, los ids de `rol_dev`).

const TIPO: TipoCriatura = {
    Id: 1, Nombre: 'Humanoide', Descripcion: '', Manual: 'Manual', Id_tipo_dado: 1, Tipo_dado: 8, Id_ataque: 1,
    Id_fortaleza: 1, Id_reflejos: 1, Id_voluntad: 1, Id_puntos_habilidad: 1, Come: true, Respira: true, Duerme: true,
    Recibe_criticos: true, Puede_ser_flanqueado: true, Pierde_constitucion: false, Limite_inteligencia: 0,
    Tesoro: 'Normal', Id_alineamiento: 0, Rasgos: [], Oficial: true,
} as TipoCriatura;

const racial = (Id: number, Nombre: string, Progresion: any[] = []) => ({ Id, Nombre, Descripcion: '', Oficial: true, Progresion });
const fila = (Desde: number, extra: Record<string, any>) => ({
    Medida: 'dg', Desde, Gana: null, Sustituye: null, Tipo_dote: null, Velocidad: null, Valor: null, Frase: '', ...extra,
});
const VO30 = racial(4972, "Visión en la oscuridad 30'");
const VO60 = racial(8, "Visión en la oscuridad 60'");
const VO120 = racial(81, "Visión en la oscuridad 120'");
const VUELO = racial(4980, 'Vuelo (aspecto dracónico de las alas)');
const REGULAR = { Id: 3, Nombre: 'Regular' };

const ALAS = normalizeRacial(racial(41, 'Aspecto dracónico (alas)', [
    fila(6, { Gana: VUELO, Velocidad: { Tipo: 'Volar', Pies: 30, Maniobrabilidad: REGULAR },
        Frase: "A los 6 DG: gana Vuelo (aspecto dracónico de las alas); velocidad volando 30' (maniobrabilidad regular)." }),
]));
const ESPIRITU = normalizeRacial(racial(4847, 'Aspecto infernal (espíritu)', [
    fila(1, { Gana: VO30 }),
    fila(6, { Gana: VO60, Sustituye: { Id: VO30.Id, Nombre: VO30.Nombre } }),
    fila(9, { Gana: VO120, Sustituye: { Id: VO60.Id, Nombre: VO60.Nombre } }),
]));
const CUERPO = normalizeRacial(racial(4846, 'Aspecto infernal (cuerpo)', [
    fila(4, { Tipo_dote: { Id: 88, Nombre: 'Tocado por diablos' } }),
    fila(14, { Tipo_dote: { Id: 88, Nombre: 'Tocado por diablos' } }),
]));

/** La raza combinada como la da la API sobre un humano (con el aspecto ya elegido, como obligatorio). */
function raza(nombre: string, aspecto: RacialDetalle): Raza {
    return {
        Id: 21, Nombre: nombre, Ajuste_nivel: 0, Manual: 'Manual', Clase_predilecta: 'Cualquiera',
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
        Trepar: 0, Excavar: 0, Altura_rango_inf: 1.5, Altura_rango_sup: 1.9, Peso_rango_inf: 55, Peso_rango_sup: 90,
        Edad_adulto: 15, Edad_mediana: 200, Edad_viejo: 300, Edad_venerable: 400, Espacio: 5, Alcance: 5, Tipo_criatura: TIPO,
        Subtipos: [], Sortilegas: [], Raciales: [{ ...aspecto, Opcional: 0 }], Habilidades: { Base: [], Custom: [] }, DotesContextuales: [],
    } as unknown as Raza;
}

const GUERRERO = normalizeClase({
    Id: 7, Nombre: 'Guerrero', Nivel_max_claseo: 20, Conjuros: {}, Tipo_dado: { Id: 4, Nombre: 'd10' },
    Puntos_habilidad: { Id: 1, Valor: 2 }, Habilidades: { Base: [{ Id_habilidad: 2, Nombre: 'Trepar' }], Custom: [] },
    Desglose_niveles: Array.from({ length: 10 }, (_x, i) => ({
        Nivel: i + 1, Ataque_base: `+${i + 1}`, Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
    })),
});
const HABILIDADES = [{ Id_habilidad: 2, Nombre: 'Trepar', Id_caracteristica: 1, Caracteristica: 'Fuerza', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] }];

function motor(): NuevoPersonajeService {
    const svc = new NuevoPersonajeService();
    svc.setCatalogoTiposCriatura([TIPO]);
    svc.setCatalogoHabilidades(HABILIDADES as any);
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
    for (const h of svc.getHabilidadesSesion())
        for (let i = 0; i < 20 && svc.puedeSubirRangoHabilidad(claveHabilidad(h)); i++)
            svc.ajustarRangoHabilidad(claveHabilidad(h), 1);
    svc.cerrarDistribucionHabilidades();
    for (let p = svc.getSiguienteDotePendiente(), i = 0; p && i < 10; p = svc.getSiguienteDotePendiente(), i++)
        svc.omitirDotePendiente(p.id);
}

function crear(r: Raza, niveles: number): NuevoPersonajeService {
    const svc = motor();
    svc.seleccionarRaza(r);
    svc.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 12, Constitucion: 12, Inteligencia: 10, Sabiduria: 10, Carisma: 10 });
    for (let i = 0; i < niveles; i++)
        aplicarNivel(svc, GUERRERO);
    return svc;
}

function cuerpo(svc: NuevoPersonajeService): PersonajeCreateRequestDto {
    return new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
        { ...svc.PersonajeCreacion, Nombre: 'Prole', Campana: 'Sin campaña' } as Personaje,
        { idAlineamiento: 1, idGenero: 1, idDeidad: 0, catalogos: { clases: [{ id: 7, nombre: 'Guerrero' }] } } as any);
}

function guardar(svc: NuevoPersonajeService): { entrada: PersonajeCreateRequestDto; personaje: Personaje; } {
    const vida = svc.calcularVidaFinalAleatoria();
    svc.PersonajeCreacion.Vida = vida.total;
    const entrada = cuerpo(svc);
    entrada.niveles = (svc.getNivelesParaGuardar(entrada.progresionLanzador, vida.detalle?.dados) ?? []).map((n) => ({ ...n, ordenConocido: true } as any));
    return { entrada, personaje: JSON.parse(JSON.stringify(svc.PersonajeCreacion)) };
}

function subir(guardado: { entrada: PersonajeCreateRequestDto; personaje: Personaje; }, r: Raza): NuevoPersonajeService {
    const svc = motor();
    svc.iniciarSubidaDesdeFicha({ personaje: JSON.parse(JSON.stringify(guardado.personaje)), entrada: guardado.entrada, raza: r });
    return svc;
}

const nombres = (svc: NuevoPersonajeService) => svc.PersonajeCreacion.Raciales.map((x) => x.Nombre);

describe('Lo que crece con los DG: la creación y la subida de nivel', () => {
    const PROLE = raza('Prole de Bahamut', ALAS);
    const NACIDO = raza('Nacido del Infierno', ESPIRITU);

    it('una prole humana con las alas no vuela con 5 DG y vuela a 30\' (regular) con 6, también al crearla', () => {
        const a5 = crear(PROLE, 5);
        expect(a5.PersonajeCreacion.Volar).toBe(0);
        expect(nombres(a5)).not.toContain('Vuelo (aspecto dracónico de las alas)');
        const a6 = crear(PROLE, 6);
        expect(a6.PersonajeCreacion.Volar).toBe(30);
        expect(a6.PersonajeCreacion.Maniobrabilidad).toEqual(REGULAR);
        const vuelo = a6.PersonajeCreacion.Raciales.find((x) => x.Id === VUELO.Id)!;
        expect(vuelo.Origen).toBe('Aspecto dracónico (alas), a los 6 DG');
        const alta = cuerpo(a6);
        expect(alta.personaje.volar).toBe(30);
        expect(alta.personaje.idManiobrabilidad).toBe(3);
        expect(alta.colecciones?.raciales).toContain(jasmine.objectContaining({ idRacial: VUELO.Id, origen: 'Aspecto dracónico (alas), a los 6 DG' }));
    });

    it('una prole humana que sube de 5 a 6 DG gana el vuelo, y la ficha que se manda lo lleva', () => {
        const guardado = guardar(crear(PROLE, 5));
        expect(guardado.entrada.personaje.volar).toBe(0);
        const subida = subir(guardado, PROLE);
        expect(subida.PersonajeCreacion.Volar).toBe(0);
        const antes = cuerpo(subida);
        aplicarNivel(subida, GUERRERO);
        expect(subida.PersonajeCreacion.Volar).toBe(30);
        expect(nombres(subida)).toContain('Vuelo (aspecto dracónico de las alas)');
        const despues = cuerpo(subida);
        const pg = puntosGolpeTrasSubida({
            pgAntes: guardado.entrada.personaje.puntosGolpe ?? 0, modConAntes: modConstitucionDeEntrada(guardado.entrada),
            modConDespues: subida.PersonajeCreacion.ModConstitucion, tiradasAnteriores: [], dgsSinTirada: 5, tirada: 5,
        });
        const ficha = fichaDeLaSubida({
            entrada: guardado.entrada, antes, despues, idClase: 7,
            nivel: { idClase: 7, nivelClase: 6, elecciones: subida.getEleccionesDelNivelEnCurso() }, puntosGolpe: pg.total,
        });
        expect(ficha.personaje.volar).toBe(30);
        expect(ficha.personaje.idManiobrabilidad).toBe(3);
        expect(ficha.colecciones?.raciales?.map((x: any) => x.idRacial)).toEqual([41, VUELO.Id]);
    });

    it('un nacido del Infierno con el espíritu: 30\' hasta 5 DG, 60\' a 6 y 120\' a 9; la ficha quita la que sustituye', () => {
        const a5 = crear(NACIDO, 5);
        expect(nombres(a5)).toEqual(['Aspecto infernal (espíritu)', "Visión en la oscuridad 30'"]);
        const guardado = guardar(a5);
        const subida = subir(guardado, NACIDO);
        const antes = cuerpo(subida);
        aplicarNivel(subida, GUERRERO);
        expect(nombres(subida)).toEqual(['Aspecto infernal (espíritu)', "Visión en la oscuridad 60'"]);
        const ficha = fichaDeLaSubida({
            entrada: guardado.entrada, antes, despues: cuerpo(subida), idClase: 7,
            nivel: { idClase: 7, nivelClase: 6, elecciones: [] }, puntosGolpe: 40,
        });
        expect(ficha.colecciones?.raciales?.map((x: any) => x.idRacial)).toEqual([4847, VO60.Id]);
        const a9 = crear(NACIDO, 9);
        expect(nombres(a9)).toEqual(['Aspecto infernal (espíritu)', "Visión en la oscuridad 120'"]);
    });

    it('el cuerpo del nacido del Infierno pide una dote de tipo Tocado por diablos a los 4 DG, una sola vez', () => {
        const svc = motor();
        svc.seleccionarRaza(raza('Nacido del Infierno', CUERPO));
        svc.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 12, Constitucion: 12, Inteligencia: 10, Sabiduria: 10, Carisma: 10 });
        for (let n = 1; n <= 3; n++)
            aplicarNivel(svc, GUERRERO);
        expect(svc.aplicarSiguienteNivelClase(GUERRERO).aplicado).toBeTrue();
        const creadas = svc.registrarDotesPendientesPorRazaExtras('Raza');
        expect(creadas).toEqual([jasmine.objectContaining({ fuente: 'adicional', tipoPermitido: 'Tocado por diablos', origen: 'Aspecto infernal (cuerpo)' })]);
        expect(svc.registrarDotesPendientesPorRazaExtras('Raza')).toEqual([]);
        // En la subida, lo ya concedido no se vuelve a pedir.
        svc.getDotesPendientes().forEach((d) => svc.omitirDotePendiente(d.id));
        svc.registrarDotesPendientesPorProgresion('Guerrero 4');
        svc.getDotesPendientes().forEach((d) => svc.omitirDotePendiente(d.id));
        const subida = subir(guardar(svc), raza('Nacido del Infierno', CUERPO));
        expect(subida.getDotesPendientes()).toEqual([]);
        expect(subida.aplicarSiguienteNivelClase(GUERRERO).aplicado).toBeTrue();
        expect(subida.registrarDotesPendientesPorRazaExtras('Raza')).toEqual([]);
    });
});
