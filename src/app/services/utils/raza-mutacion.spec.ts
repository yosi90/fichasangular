import { Raza } from "src/app/interfaces/raza";
import { createRacialPlaceholder } from "./racial-mapper";
import { aplicarMutacion, evaluarElegibilidadRazaBase } from "./raza-mutacion";

function crearRazaMock(partial?: Partial<Raza>): Raza {
    return {
        Id: 1,
        Nombre: "Raza",
        Ajuste_nivel: 0,
        Manual: "Manual",
        Clase_predilecta: "Guerrero",
        Modificadores: {
            Fuerza: 0,
            Destreza: 0,
            Constitucion: 0,
            Inteligencia: 0,
            Sabiduria: 0,
            Carisma: 0,
        },
        Alineamiento: {
            Id: 1,
            Basico: { Id_basico: 1, Nombre: "Neutral autentico" },
            Ley: { Id_ley: 2, Nombre: "Neutral" },
            Moral: { Id_moral: 2, Nombre: "Neutral" },
            Prioridad: { Id_prioridad: 1, Nombre: "Moral" },
            Descripcion: "",
        },
        Oficial: true,
        Ataques_naturales: "",
        Tamano: { Id: 1, Nombre: "Mediano", Modificador: 0, Modificador_presa: 0 },
        Dgs_adicionales: {
            Cantidad: 0,
            Dado: "d8",
            Tipo_criatura: "Humanoide",
            Ataque_base: 0,
            Dotes_extra: 0,
            Puntos_habilidad: 0,
            Multiplicador_puntos_habilidad: 1,
            Fortaleza: 0,
            Reflejos: 0,
            Voluntad: 0,
        },
        Reduccion_dano: "No especifica",
        Resistencia_magica: "No especifica",
        Resistencia_energia: "No especifica",
        Heredada: false,
        Mutada: false,
        Tamano_mutacion_dependiente: false,
        Prerrequisitos: {
            actitud_prohibido: [],
            actitud_requerido: [],
            alineamiento_prohibido: [],
            alineamiento_requerido: [],
            tipo_criatura: [],
        },
        Prerrequisitos_flags: {
            actitud_prohibido: false,
            actitud_requerido: false,
            alineamiento_prohibido: false,
            alineamiento_requerido: false,
            tipo_criatura: false,
        },
        Mutacion: {
            Es_mutada: false,
            Tamano_dependiente: false,
            Tiene_prerrequisitos: false,
            Heredada: false,
        },
        Armadura_natural: 0,
        Varios_armadura: 0,
        Correr: 30,
        Nadar: 0,
        Volar: 0,
        Maniobrabilidad: {
            Id: 0,
            Nombre: "-",
            Velocidad_avance: "",
            Flotar: 0,
            Volar_atras: 0,
            Contramarcha: 0,
            Giro: "",
            Rotacion: "",
            Giro_max: "",
            Angulo_ascenso: "",
            Velocidad_ascenso: "",
            Angulo_descenso: "",
            Descenso_ascenso: 0,
        },
        Trepar: 0,
        Escalar: 0,
        Altura_rango_inf: 1.5,
        Altura_rango_sup: 1.9,
        Peso_rango_inf: 55,
        Peso_rango_sup: 90,
        Edad_adulto: 20,
        Edad_mediana: 40,
        Edad_viejo: 60,
        Edad_venerable: 80,
        Espacio: 5,
        Alcance: 5,
        Tipo_criatura: {
            Id: 1,
            Nombre: "Humanoide",
            Descripcion: "",
            Manual: "",
            Id_tipo_dado: 1,
            Tipo_dado: 8,
            Id_ataque: 1,
            Id_fortaleza: 1,
            Id_reflejos: 1,
            Id_voluntad: 1,
            Id_puntos_habilidad: 1,
            Come: true,
            Respira: true,
            Duerme: true,
            Recibe_criticos: true,
            Puede_ser_flanqueado: true,
            Pierde_constitucion: false,
            Limite_inteligencia: 0,
            Tesoro: "",
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        },
        Subtipos: [],
        Sortilegas: [],
        Raciales: [],
        Habilidades: { Base: [], Custom: [] },
        DotesContextuales: [],
        ...partial,
    } as Raza;
}

describe("raza-mutacion utils", () => {
    it("evalua como elegible una base que cumple prerequisito de actitud", () => {
        const mutada = crearRazaMock({
            Mutada: true,
            Mutacion: { Es_mutada: true },
            Prerrequisitos_flags: {
                actitud_requerido: true,
            },
            Prerrequisitos: {
                actitud_requerido: [{ id_actitud: 1, opcional: 0 }],
            },
        });
        const base = crearRazaMock({
            Alineamiento: {
                ...crearRazaMock().Alineamiento,
                Basico: { Id_basico: 1, Nombre: "Legal bueno" },
            },
        });

        const evaluacion = evaluarElegibilidadRazaBase(mutada, base);

        expect(evaluacion.estado).toBe("eligible");
        expect(evaluacion.razones.length).toBe(0);
    });

    it("bloquea candidatas que ya son mutadas", () => {
        const mutada = crearRazaMock({
            Mutada: true,
            Mutacion: { Es_mutada: true },
        });
        const baseMutada = crearRazaMock({
            Mutada: true,
            Mutacion: { Es_mutada: true },
        });

        const evaluacion = evaluarElegibilidadRazaBase(mutada, baseMutada);

        expect(evaluacion.estado).toBe("blocked");
        expect(evaluacion.razones.some((r) => r.includes("no puede ser una raza mutada"))).toBeTrue();
    });

    it("soporta grupos opcionales 1..3", () => {
        const mutada = crearRazaMock({
            Mutada: true,
            Mutacion: { Es_mutada: true },
            Prerrequisitos_flags: {
                actitud_requerido: true,
            },
            Prerrequisitos: {
                actitud_requerido: [
                    { id_actitud: 1, opcional: 1 },
                    { id_actitud: 3, opcional: 1 },
                ],
            },
        });
        const base = crearRazaMock({
            Alineamiento: {
                ...crearRazaMock().Alineamiento,
                Basico: { Id_basico: 1, Nombre: "Legal neutral" },
            },
        });

        const evaluacion = evaluarElegibilidadRazaBase(mutada, base);

        expect(evaluacion.estado).toBe("eligible");
    });

    it("prerrequisito no soportado devuelve elegible con warning", () => {
        const mutada = crearRazaMock({
            Mutada: true,
            Mutacion: { Es_mutada: true },
            Prerrequisitos_flags: {
                alineamiento_requerido: true,
            },
            Prerrequisitos: {
                alineamiento_requerido: [{ id_ley: 99, opcional: 0 }],
            },
        });
        const base = crearRazaMock();

        const evaluacion = evaluarElegibilidadRazaBase(mutada, base);

        expect(evaluacion.estado).toBe("eligible_with_warning");
        expect(evaluacion.advertencias.length).toBeGreaterThan(0);
    });

    it("aplica mutacion con merge base+override y union sin duplicados", () => {
        const base = crearRazaMock({
            Id: 10,
            Nombre: "Humano",
            Correr: 30,
            Nadar: 10,
            Dgs_adicionales: {
                ...crearRazaMock().Dgs_adicionales,
                Cantidad: 1,
                Dado: "d8",
                Tipo_criatura: "Humanoide",
            },
            Subtipos: [{ Id: 1, Nombre: "Humano" }],
            Raciales: [
                createRacialPlaceholder("Vision en penumbra", 1),
            ],
            Sortilegas: [
                {
                    Conjuro: { Nombre: "Detectar magia" } as any,
                    Nivel_lanzador: 1,
                    Usos_diarios: "1/dia",
                    Descripcion: "",
                } as any,
            ],
            DotesContextuales: [{
                Dote: { Id: 5, Nombre: "Alerta" } as any,
                Contexto: { Entidad: "raza", Id_raza: 10, Extra: "", Id_extra: 0 },
            }],
        });
        const mutada = crearRazaMock({
            Id: 20,
            Nombre: "Semidivino",
            Mutada: true,
            Mutacion: { Es_mutada: true, Tamano_dependiente: true },
            Modificadores: {
                Fuerza: 4,
                Destreza: 0,
                Constitucion: 2,
                Inteligencia: 0,
                Sabiduria: 2,
                Carisma: 2,
            },
            Correr: 40,
            Nadar: 0,
            Dgs_adicionales: {
                ...crearRazaMock().Dgs_adicionales,
                Cantidad: 2,
                Dado: "d10",
                Tipo_criatura: "Ajeno",
            },
            Subtipos: [{ Id: 2, Nombre: "Celestial" }],
            Raciales: [
                createRacialPlaceholder("Vision en penumbra", 1),
                createRacialPlaceholder("Resistencia divina", 2),
            ],
            Sortilegas: [
                {
                    Conjuro: { Nombre: "Detectar magia" } as any,
                    Nivel_lanzador: 1,
                    Usos_diarios: "1/dia",
                    Descripcion: "",
                } as any,
                {
                    Conjuro: { Nombre: "Luz" } as any,
                    Nivel_lanzador: 1,
                    Usos_diarios: "a voluntad",
                    Descripcion: "",
                } as any,
            ],
            DotesContextuales: [{
                Dote: { Id: 5, Nombre: "Alerta" } as any,
                Contexto: { Entidad: "raza", Id_raza: 20, Extra: "", Id_extra: 0 },
            }, {
                Dote: { Id: 6, Nombre: "Voluntad de hierro" } as any,
                Contexto: { Entidad: "raza", Id_raza: 20, Extra: "", Id_extra: 0 },
            }],
        });

        const efectiva = aplicarMutacion(base, mutada);

        expect(efectiva.Id).toBe(20);
        expect(efectiva.Modificadores.Fuerza).toBe(4);
        expect(efectiva.Correr).toBe(40);
        expect(efectiva.Nadar).toBe(10);
        expect(efectiva.Dgs_adicionales.Cantidad).toBe(3);
        expect(efectiva.Dgs_adicionales.Dado).toBe("d10");
        expect(efectiva.Subtipos.length).toBe(2);
        expect(efectiva.Raciales.length).toBe(2);
        expect(efectiva.Sortilegas.length).toBe(2);
        expect(efectiva.DotesContextuales.length).toBe(2);
        expect(efectiva.Tamano.Id).toBe(base.Tamano.Id);
    });

    it("mergea habilidades de raza sumando cantidades y priorizando metadata de mutada", () => {
        const base = crearRazaMock({
            Habilidades: {
                Base: [
                    {
                        Id_habilidad: 8,
                        Habilidad: "Avistar",
                        Id_caracteristica: 5,
                        Caracteristica: "Sabiduria",
                        Soporta_extra: true,
                        Id_extra: 0,
                        Extra: "Elegir",
                        Cantidad: 2,
                        Varios: "+2 base",
                    },
                ],
                Custom: [
                    {
                        Id_habilidad: 99,
                        Habilidad: "Conocimiento prohibido",
                        Id_caracteristica: 4,
                        Caracteristica: "Inteligencia",
                        Cantidad: 1,
                        Custom: true,
                    },
                ],
            },
        });
        const mutada = crearRazaMock({
            Habilidades: {
                Base: [
                    {
                        Id_habilidad: 8,
                        Habilidad: "Avistar",
                        Id_caracteristica: 5,
                        Caracteristica: "Sabiduria",
                        Soporta_extra: true,
                        Id_extra: 0,
                        Extra: "Elegir",
                        Cantidad: 3,
                        Varios: "+3 mutada",
                    },
                ],
                Custom: [
                    {
                        Id_habilidad: 99,
                        Habilidad: "Conocimiento prohibido",
                        Id_caracteristica: 4,
                        Caracteristica: "Inteligencia",
                        Cantidad: 2,
                        Custom: true,
                    },
                ],
            },
        });

        const efectiva = aplicarMutacion(base, mutada);
        const baseAvistar = efectiva.Habilidades.Base.find((h) => h.Id_habilidad === 8);
        const custom = efectiva.Habilidades.Custom.find((h) => h.Id_habilidad === 99);

        expect(baseAvistar?.Cantidad).toBe(5);
        expect(baseAvistar?.Varios).toBe("+3 mutada");
        expect(baseAvistar?.Extra).toBe("Elegir");
        expect(baseAvistar?.Soporta_extra).toBeTrue();
        expect(custom?.Cantidad).toBe(3);
    });
});
