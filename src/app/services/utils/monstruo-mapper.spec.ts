import {
    normalizeCompaneroMonstruoDetalle,
    normalizeCompaneroMonstruoDetalleArray,
    normalizeFamiliarMonstruoDetalle,
    normalizeFamiliarMonstruoDetalleArray,
    normalizeMonstruoDetalle,
    normalizeMonstruoDetalleArray
} from "./monstruo-mapper";

function createRawConjuro() {
    return {
        Id: 10,
        Nombre: "Luz",
        Descripcion: "Descripcion",
        Tiempo_lanzamiento: "1 accion",
        Alcance: "Corto",
        Escuela: { Id: 1, Nombre: "Evocacion", Nombre_esp: "Evocacion", Prohibible: 1 },
        Disciplina: { Id: 0, Nombre: "", Nombre_esp: "", Subdisciplinas: [] },
        Manual: "Manual basico",
        Objetivo: "Objetivo",
        Efecto: "",
        Area: "",
        Arcano: 1,
        Divino: 0,
        Psionico: 0,
        Alma: 0,
        Duracion: "1 min",
        Tipo_salvacion: "Ninguna",
        Resistencia_conjuros: 0,
        Resistencia_poderes: 0,
        Descripcion_componentes: "",
        Permanente: 0,
        Puntos_poder: 0,
        Descripcion_aumentos: "",
        Descriptores: [],
        Nivel_clase: [],
        Nivel_dominio: [],
        Nivel_disciplinas: [],
        Componentes: [],
        Oficial: 1,
    };
}

function createRawMonstruo(overrides: Record<string, any> = {}) {
    return {
        Id: 1,
        Nombre: "Lobo terrible",
        Descripcion: "Descripcion base",
        Manual: { Id: 1, Nombre: "Manual", Pagina: 42 },
        Tipo: { Id: 2, Nombre: "Bestia", Descripcion: "Tipo", Oficial: 1 },
        Tamano: { Id: 3, Nombre: "Mediano", Modificador: 0, Modificador_presa: 0 },
        Dados_golpe: { Cantidad: "2", Tipo_dado: { Id: 1, Nombre: "d8" }, Suma: 2 },
        Movimientos: { Correr: 40, Nadar: 0, Volar: 0, Trepar: 0, Escalar: 0 },
        Maniobrabilidad: {
            Id: 0, Nombre: "Ninguna", Velocidad_avance: "", Flotar: 0, Volar_atras: 0, Contramarcha: 0,
            Giro: "", Rotacion: "", Giro_max: "", Angulo_ascenso: "", Velocidad_ascenso: "", Angulo_descenso: "", Descenso_ascenso: 0
        },
        Alineamiento: {
            Id: 1,
            Basico: { Id_basico: 1, Nombre: "Neutral" },
            Ley: { Id_ley: 1, Nombre: "Neutral" },
            Moral: { Id_moral: 1, Nombre: "Neutral" },
            Prioridad: { Id_prioridad: 1, Nombre: "Neutral" },
            Descripcion: "Neutral",
        },
        Iniciativa: 2,
        Defensa: { Ca: 12, Toque: 12, Desprevenido: 10, Armadura_natural: 2, Reduccion_dano: "", Resistencia_conjuros: "", Resistencia_elemental: "" },
        Ataque: { Ataque_base: 1, Presa: 2, Ataques: "Mordisco", Ataque_completo: "Mordisco" },
        Espacio: 5,
        Alcance: 5,
        Salvaciones: { Fortaleza: 4, Reflejos: 3, Voluntad: 1 },
        Caracteristicas: { Fuerza: 15, Destreza: 14, Constitucion: 13, Inteligencia: 2, Sabiduria: 12, Carisma: 6 },
        Cd_sortilegas: "",
        Valor_desafio: "1",
        Tesoro: "Ninguno",
        Familiar: false,
        Companero: true,
        Oficial: true,
        Idiomas: [{ Id: 1, Nombre: "Comun", Descripcion: "", Secreto: 0, Oficial: 1 }],
        Alineamientos_requeridos: {
            Familiar: [{ Id: 1, Nombre: "Neutral" }],
            Companero: [{ Id: 1, Nombre: "Neutral" }],
        },
        Sortilegas: [{ Conjuro: createRawConjuro(), Nivel_lanzador: 1, Usos_diarios: "1/dia" }],
        Habilidades: [{ Id_habilidad: 1, Habilidad: "Avistar", Id_caracteristica: 5, Caracteristica: "Sabiduria", Descripcion: "", Soporta_extra: 0, Entrenada: 0, Id_extra: 0, Extra: "", Rangos: 2 }],
        Dotes: [],
        Niveles_clase: [],
        Subtipos: [{ Id: 1, Nombre: "Frio", Descripcion: "Descripcion subtipo" }],
        Raciales: [],
        Ataques_especiales: [],
        Familiares: [],
        Companeros: [],
        Personajes_relacionados: {
            Por_familiar: [],
            Por_companero: [],
        },
        ...overrides,
    };
}

function createRawFamiliar(overrides: Record<string, any> = {}) {
    return {
        ...createRawMonstruo({ Id: 200, Nombre: "Halcón familiar", Familiar: true }),
        Monstruo_origen: { Id: 5, Nombre: "Halcón" },
        Id_familiar: 44,
        Vida: 12,
        Plantilla: { Id: 8, Nombre: "Plantilla familiar" },
        Especiales: [],
        Personajes: [{ Id_personaje: 1, Nombre: "Aramil" }],
        ...overrides,
    };
}

function createRawCompanero(overrides: Record<string, any> = {}) {
    return {
        ...createRawMonstruo({ Id: 300, Nombre: "Lobo companero", Companero: true }),
        Monstruo_origen: { Id: 9, Nombre: "Lobo" },
        Id_companero: 55,
        Vida: 18,
        Dg_adi: 2,
        Trucos_adi: 1,
        Plantilla: { Id: 4, Nombre: "Companero animal" },
        Especiales: [],
        Personajes: [{ Id_personaje: 2, Nombre: "Kara" }],
        ...overrides,
    };
}

describe("monstruo-mapper", () => {
    it("normaliza monstruo completo y respeta recursividad con depth=1", () => {
        const raw = createRawMonstruo({
            Familiares: [
                createRawFamiliar({
                    Familiares: [createRawFamiliar({ Id_familiar: 999 })],
                    Companeros: [createRawCompanero({ Id_companero: 888 })],
                })
            ],
            Companeros: [
                createRawCompanero({
                    Familiares: [createRawFamiliar({ Id_familiar: 777 })],
                    Companeros: [createRawCompanero({ Id_companero: 666 })],
                })
            ],
        });

        const normalized = normalizeMonstruoDetalle(raw, 1);

        expect(normalized.Id).toBe(1);
        expect(normalized.Nombre).toBe("Lobo terrible");
        expect(normalized.Familiares.length).toBe(1);
        expect(normalized.Companeros.length).toBe(1);
        expect(normalized.Familiares[0].Familiares.length).toBe(0);
        expect(normalized.Familiares[0].Companeros.length).toBe(0);
        expect(normalized.Companeros[0].Familiares.length).toBe(0);
        expect(normalized.Companeros[0].Companeros.length).toBe(0);
    });

    it("normaliza familiar con Id_familiar y datos extendidos", () => {
        const normalized = normalizeFamiliarMonstruoDetalle(createRawFamiliar(), 1);

        expect(normalized.Id_familiar).toBe(44);
        expect(normalized.Monstruo_origen.Nombre).toBe("Halcón");
        expect(normalized.Vida).toBe(12);
        expect(normalized.Personajes.length).toBe(1);
        expect(normalized.Plantilla.Nombre).toBe("Plantilla familiar");
    });

    it("normaliza companero animal con Id_companero y extras", () => {
        const normalized = normalizeCompaneroMonstruoDetalle(createRawCompanero(), 1);

        expect(normalized.Id_companero).toBe(55);
        expect(normalized.Dg_adi).toBe(2);
        expect(normalized.Trucos_adi).toBe(1);
        expect(normalized.Monstruo_origen.Nombre).toBe("Lobo");
        expect(normalized.Plantilla.Nombre).toBe("Companero animal");
    });

    it("acepta entrada array y entrada objeto-map", () => {
        const arrayInput = [createRawMonstruo({ Id: 11 }), createRawMonstruo({ Id: 12 })];
        const mapInput = {
            a: createRawFamiliar({ Id_familiar: 21 }),
            b: createRawFamiliar({ Id_familiar: 22 }),
        };
        const mapCompaneros = {
            a: createRawCompanero({ Id_companero: 31 }),
            b: createRawCompanero({ Id_companero: 32 }),
        };

        const monstruos = normalizeMonstruoDetalleArray(arrayInput, 1);
        const familiares = normalizeFamiliarMonstruoDetalleArray(mapInput, 1);
        const companeros = normalizeCompaneroMonstruoDetalleArray(mapCompaneros, 1);

        expect(monstruos.length).toBe(2);
        expect(familiares.length).toBe(2);
        expect(companeros.length).toBe(2);
    });
});
