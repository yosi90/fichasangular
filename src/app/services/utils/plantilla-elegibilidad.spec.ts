import { Plantilla } from "src/app/interfaces/plantilla";
import { evaluarElegibilidadPlantilla, PlantillaEvaluacionContexto, resolverAlineamientoPlantillas, simularEstadoPlantillas } from "./plantilla-elegibilidad";

function crearPlantillaMock(overrides?: Partial<Plantilla>): Plantilla {
    return {
        Id: 100,
        Nombre: "Plantilla test",
        Descripcion: "",
        Manual: { Id: 1, Nombre: "Manual", Pagina: 1 },
        Tamano: { Id: 0, Nombre: "-", Modificador: 0, Modificador_presa: 0 },
        Tipo_dado: { Id_tipo_dado: 0, Nombre: "" },
        Actualiza_dg: false,
        Modificacion_dg: { Id_paso_modificacion: 0, Nombre: "" },
        Modificacion_tamano: { Id_paso_modificacion: 0, Nombre: "" },
        Iniciativa: 0,
        Velocidades: "",
        Ca: "",
        Ataque_base: 0,
        Presa: 0,
        Ataques: "",
        Ataque_completo: "",
        Reduccion_dano: "",
        Resistencia_conjuros: "",
        Resistencia_elemental: "",
        Fortaleza: 0,
        Reflejos: 0,
        Voluntad: 0,
        Modificadores_caracteristicas: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
        Minimos_caracteristicas: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
        Ajuste_nivel: 0,
        Licantronia_dg: { Id_dado: 0, Dado: "", Multiplicador: 0, Suma: 0 },
        Cd: 0,
        Puntos_habilidad: { Suma: 0, Suma_fija: 0 },
        Nacimiento: false,
        Movimientos: { Correr: 0, Nadar: 0, Volar: 0, Trepar: 0, Escalar: 0 },
        Maniobrabilidad: {
            Id: 0,
            Nombre: "",
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
        Alineamiento: {
            Id: 0,
            Basico: { Id_basico: 0, Nombre: "" },
            Ley: { Id_ley: 0, Nombre: "" },
            Moral: { Id_moral: 0, Nombre: "" },
            Prioridad: { Id_prioridad: 0, Nombre: "" },
            Descripcion: "",
        },
        Oficial: true,
        Dotes: [],
        Subtipos: [],
        Habilidades: [],
        Sortilegas: [],
        Prerrequisitos_flags: {
            actitud_requerido: false,
            actitud_prohibido: false,
            alineamiento_requerido: false,
            caracteristica: false,
            criaturas_compatibles: false,
        },
        Prerrequisitos: {
            actitud_requerido: [],
            actitud_prohibido: [],
            alineamiento_requerido: [],
            caracteristica: [],
            criaturas_compatibles: [],
        },
        Compatibilidad_tipos: [],
        ...overrides,
    };
}

function crearContextoBase(): PlantillaEvaluacionContexto {
    return {
        alineamiento: "Neutral autentico",
        caracteristicas: {
            Fuerza: 10,
            Destreza: 10,
            Constitucion: 10,
            Inteligencia: 10,
            Sabiduria: 10,
            Carisma: 10,
        },
        tamanoRazaId: 0,
        tiposCriaturaMiembroIds: [1],
        razaHeredada: false,
        incluirHomebrew: true,
        seleccionadas: [],
    };
}

describe("plantilla-elegibilidad", () => {
    it("marca blocked_failed si falla un prerequisito obligatorio (opcional 0)", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { caracteristica: true },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [{ Id_caracteristica: 1, Cantidad: 15, opcional: 0 }],
                criaturas_compatibles: [],
            },
        });

        const res = evaluarElegibilidadPlantilla(plantilla, crearContextoBase());
        expect(res.estado).toBe("blocked_failed");
    });

    it("considera valido un grupo opcional 1 si al menos una fila cumple", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { caracteristica: true },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [
                    { Id_caracteristica: 1, Cantidad: 15, opcional: 1 },
                    { Id_caracteristica: 2, Cantidad: 10, opcional: 1 },
                ],
                criaturas_compatibles: [],
            },
        });

        const res = evaluarElegibilidadPlantilla(plantilla, crearContextoBase());
        expect(res.estado).toBe("eligible");
    });

    it("ignora opcional mayor que 3 para paridad C# literal", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { caracteristica: true },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [{ Id_caracteristica: 1, Cantidad: 18, opcional: 4 }],
                criaturas_compatibles: [],
            },
        });

        const res = evaluarElegibilidadPlantilla(plantilla, crearContextoBase());
        expect(res.estado).toBe("eligible");
    });

    it("marca blocked_unknown cuando no puede evaluar un prerequisito activo", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { actitud_requerido: true },
            Prerrequisitos: {
                actitud_requerido: [{ opcional: 0 }],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [],
            },
        });

        const res = evaluarElegibilidadPlantilla(plantilla, crearContextoBase());
        expect(res.estado).toBe("blocked_unknown");
    });

    it("no cambia el tipo simulado cuando Tipo_nuevo es Cualquiera", () => {
        const plantilla = crearPlantillaMock({
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 99,
                Tipo_comp: "Humanoide",
                Tipo_nuevo: "Cualquiera",
                Opcional: 0,
            }],
        });

        const sim = simularEstadoPlantillas({ Id: 1, Nombre: "Humanoide" } as any, [plantilla]);
        expect(sim.tipoCriaturaActualId).toBe(1);
        expect(sim.tipoCriaturaActualNombre).toBe("Humanoide");
    });

    it("resuelve alineamiento por prioridad de plantillas", () => {
        const liche = crearPlantillaMock({
            Id: 501,
            Nombre: "Liche",
            Alineamiento: {
                Id: 32,
                Basico: { Id_basico: 0, Nombre: "No aplica" },
                Ley: { Id_ley: 10, Nombre: "Ninguna preferencia" },
                Moral: { Id_moral: 6, Nombre: "Siempre maligno" },
                Prioridad: { Id_prioridad: 3, Nombre: "Siempre" },
                Descripcion: "Se debe respetar a raja tabla.",
            },
        });

        const res = resolverAlineamientoPlantillas("Legal bueno", [liche]);
        expect(res.conflicto).toBeFalse();
        expect(res.alineamiento).toBe("Legal maligno");
    });

    it("detecta conflicto de alineamiento al mismo nivel de prioridad", () => {
        const plantillaBuena = crearPlantillaMock({
            Id: 601,
            Nombre: "Plantilla santa",
            Alineamiento: {
                Id: 0,
                Basico: { Id_basico: 0, Nombre: "No aplica" },
                Ley: { Id_ley: 10, Nombre: "Ninguna preferencia" },
                Moral: { Id_moral: 0, Nombre: "Siempre bueno" },
                Prioridad: { Id_prioridad: 3, Nombre: "Siempre" },
                Descripcion: "",
            },
        });
        const plantillaMaligna = crearPlantillaMock({
            Id: 602,
            Nombre: "Plantilla profana",
            Alineamiento: {
                Id: 0,
                Basico: { Id_basico: 0, Nombre: "No aplica" },
                Ley: { Id_ley: 10, Nombre: "Ninguna preferencia" },
                Moral: { Id_moral: 0, Nombre: "Siempre maligno" },
                Prioridad: { Id_prioridad: 3, Nombre: "Siempre" },
                Descripcion: "",
            },
        });

        const res = resolverAlineamientoPlantillas("Neutral autentico", [plantillaBuena, plantillaMaligna]);
        expect(res.conflicto).toBeTrue();
        expect(res.razones.length).toBeGreaterThan(0);
    });

    it("criaturas_compatibles se cumple por tipo base aunque el tipo actual sea distinto", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { criaturas_compatibles: true },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [{ Id_tipo_compatible: 1, opcional: 0 }],
            },
        });
        const ctx = crearContextoBase();
        ctx.tiposCriaturaMiembroIds = [9, 1];

        const res = evaluarElegibilidadPlantilla(plantilla, ctx);
        expect(res.estado).toBe("eligible");
    });

    it("criaturas_compatibles se cumple por tipo mutado", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { criaturas_compatibles: true },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [{ Id_tipo_compatible: 9, opcional: 0 }],
            },
        });
        const ctx = crearContextoBase();
        ctx.tiposCriaturaMiembroIds = [1, 9];

        const res = evaluarElegibilidadPlantilla(plantilla, ctx);
        expect(res.estado).toBe("eligible");
    });

    it("criaturas_compatibles falla si no coincide ningun tipo miembro", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { criaturas_compatibles: true },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [{ Id_tipo_compatible: 15, opcional: 0 }],
            },
        });
        const ctx = crearContextoBase();
        ctx.tiposCriaturaMiembroIds = [1, 9];

        const res = evaluarElegibilidadPlantilla(plantilla, ctx);
        expect(res.estado).toBe("blocked_failed");
    });
});
