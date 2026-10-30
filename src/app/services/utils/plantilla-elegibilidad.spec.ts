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
        Movimientos: { Correr: 0, Nadar: 0, Volar: 0, Trepar: 0, Excavar: 0 },
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
        Entorno: null,
        Organizacion: null,
        Vd: null,
        Tesoro: null,
        Avance: null,
        Nombre_original: null,
        Traducido: false,
        Oficial: true,
        Dotes: [],
        Subtipos: [],
        Habilidades: [],
        Sortilegas: [],
        Raciales: [],
        Ataques_especiales: [],
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
        incluirHomebrew: true,
        seleccionadas: [],
    };
}

describe("plantilla-elegibilidad: reglas de la auditoría del 2026-10-26", () => {
    it("una plantilla de nacimiento solo se elige antes del primer nivel de clase (decisión del 2026-10-18)", () => {
        const semicelestial = crearPlantillaMock({ Id: 5, Nombre: "Semicelestial", Nacimiento: true });

        expect(evaluarElegibilidadPlantilla(semicelestial, { ...crearContextoBase(), nivelesClase: 0 }).estado).toBe("eligible");
        const conNivel = evaluarElegibilidadPlantilla(semicelestial, { ...crearContextoBase(), nivelesClase: 3 });
        expect(conNivel.estado).toBe("blocked_failed");
        expect(conNivel.razones).toContain("Una plantilla de nacimiento solo se elige antes del primer nivel de clase");
    });

    it("el Manual de monstruos no limita las plantillas heredadas: se puede añadir otra", () => {
        const semidragon = crearPlantillaMock({ Id: 6, Nombre: "Semidragón", Nacimiento: true });
        const ctx = { ...crearContextoBase(), seleccionadas: [{ Id: 1, Nombre: "Celestial", Nacimiento: true }] };

        expect(evaluarElegibilidadPlantilla(semidragon, ctx).estado).toBe("eligible");
    });

    it("el liche pide nivel de lanzador 11 y Fabricar objeto maravilloso (MM 1, pág. 182)", () => {
        const liche = crearPlantillaMock({
            Id: 4,
            Nombre: "Liche",
            Prerrequisitos_flags: { nivel_lanzador: true, dote: true },
            Prerrequisitos: {
                ...crearPlantillaMock().Prerrequisitos,
                nivel_lanzador: [{ Nivel: 11, Opcional: 0, Frase: "Lanzador de conjuros de nivel 11" }],
                dote: [{ Id_dote_prerrequisito: 335, Dote_prerrequisito: "Fabricar objeto maravilloso", Opcional: 0, Frase: "Fabricar objeto maravilloso" }],
            },
        });
        const fabricar = [{ id: 335, nombre: "Fabricar objeto maravilloso" }];

        expect(evaluarElegibilidadPlantilla(liche, { ...crearContextoBase(), nivelLanzador: 11, dotes: fabricar }).estado).toBe("eligible");
        expect(evaluarElegibilidadPlantilla(liche, { ...crearContextoBase(), nivelLanzador: 10, dotes: fabricar }).estado).toBe("blocked_failed");
        expect(evaluarElegibilidadPlantilla(liche, { ...crearContextoBase(), nivelLanzador: 11, dotes: [] }).estado).toBe("blocked_failed");
    });

    it("semicelestial: alineamiento no maligno (actitud prohibida, MM 1, pág. 237)", () => {
        const semicelestial = crearPlantillaMock({
            Id: 5,
            Nombre: "Semicelestial",
            Prerrequisitos_flags: { actitud_prohibido: true },
            Prerrequisitos: {
                ...crearPlantillaMock().Prerrequisitos,
                actitud_prohibido: [{ Id_actitud: 5, Actitud: "Maligno", Opcional: 0, Frase: "Cualquier alineamiento no maligno" }],
            },
        });

        expect(evaluarElegibilidadPlantilla(semicelestial, { ...crearContextoBase(), alineamiento: "Neutral autentico" }).estado).toBe("eligible");
        expect(evaluarElegibilidadPlantilla(semicelestial, { ...crearContextoBase(), alineamiento: "Neutral maligno" }).estado).toBe("blocked_failed");
    });

    it("una segunda plantilla de licántropo se reconoce por sus DG de animal (`Licantronia_dg`), no por el nombre", () => {
        const hombreLobo = crearPlantillaMock({ Id: 10, Nombre: "Hombre lobo", Licantronia_dg: { Id_dado: 3, Dado: "d8", Multiplicador: 2, Suma: 0 } });
        const ctx = { ...crearContextoBase(), seleccionadas: [{ Id: 12, Nombre: "Licántropo (camello) [Nacido]", Nacimiento: true, Licantropia: true }] };

        const res = evaluarElegibilidadPlantilla(hombreLobo, ctx);
        expect(res.estado).toBe("blocked_failed");
        expect(res.razones).toContain("Ya hay una plantilla licantropa seleccionada");
        expect(simularEstadoPlantillas({ Id: 11, Nombre: "Humanoide" } as any, [hombreLobo]).licantropiaActiva).toBeTrue();
    });

    it("el alineamiento requerido de una plantilla se compara con el básico, no con la combinación", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { alineamiento_requerido: true },
            Prerrequisitos: {
                ...crearPlantillaMock().Prerrequisitos,
                alineamiento_requerido: [{ Id_alineamiento: 3, Id_alineamiento_basico: 1, Alineamiento_basico: "Legal bueno", Opcional: 0 }],
            },
        });

        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), alineamiento: "Legal bueno" }).estado).toBe("eligible");
        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), alineamiento: "Legal maligno" }).estado).toBe("blocked_failed");
    });
});

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

    it("evalua grupos opcionales mayores que 3", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { caracteristica: true },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [{ Id_caracteristica: 1, Cantidad: 18, opcional: 4, Frase: "Fuerza 18" }],
                criaturas_compatibles: [],
            },
        });

        const res = evaluarElegibilidadPlantilla(plantilla, crearContextoBase());
        expect(res.estado).toBe("blocked_failed");
        expect(res.razones).toEqual(["No cumple: Fuerza 18"]);
    });

    it("grupo opcional mayor que 3 cumple si alguna fila del grupo pasa", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { caracteristica: true },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [
                    { Id_caracteristica: 1, Cantidad: 18, opcional: 4 },
                    { Id_caracteristica: 2, Cantidad: 10, opcional: 4 },
                ],
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

    it("no cambia el tipo simulado cuando el tipo nuevo es el comodín «Cualquiera» (Tipo_nuevo_comodin)", () => {
        const plantilla = crearPlantillaMock({
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 99,
                Tipo_comp: "Humanoide",
                Tipo_nuevo: "Cualquiera",
                Tipo_nuevo_comodin: "cualquiera",
                Opcional: 0,
            }],
        });

        const sim = simularEstadoPlantillas({ Id: 1, Nombre: "Humanoide" } as any, [plantilla]);
        expect(sim.tipoCriaturaActualId).toBe(1);
        expect(sim.tipoCriaturaActualNombre).toBe("Humanoide");
    });

    it("sin la marca de comodín, el nombre «Cualquiera» no se compara: cambia al tipo nuevo", () => {
        const plantilla = crearPlantillaMock({
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 99,
                Tipo_comp: "Humanoide",
                Tipo_nuevo: "Cualquiera",
                Tipo_nuevo_comodin: null,
                Opcional: 0,
            }],
        });

        const sim = simularEstadoPlantillas({ Id: 1, Nombre: "Humanoide" } as any, [plantilla]);
        expect(sim.tipoCriaturaActualId).toBe(99);
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

describe("plantilla-elegibilidad: los prerrequisitos de las plantillas de los manuales (2026-10-29)", () => {
    const sinPrerrequisitos = () => crearPlantillaMock().Prerrequisitos;

    it("tamano_minimo se compara con el tamaño que llega (la raza con los pasos de las plantillas ya elegidas)", () => {
        const bestiaDeGuerra = crearPlantillaMock({
            Nombre: "Bestia de guerra",
            Prerrequisitos_flags: { tamano_minimo: true },
            Prerrequisitos: { ...sinPrerrequisitos(), tamano_minimo: [{ Id_tamano: 5, Tamano: "Mediano", Opcional: 0, Frase: "Tamaño mediano o mayor" }] },
        });

        expect(evaluarElegibilidadPlantilla(bestiaDeGuerra, { ...crearContextoBase(), tamanoId: 5 }).estado).toBe("eligible");
        expect(evaluarElegibilidadPlantilla(bestiaDeGuerra, { ...crearContextoBase(), tamanoId: 6 }).estado).toBe("eligible");
        const pequena = evaluarElegibilidadPlantilla(bestiaDeGuerra, { ...crearContextoBase(), tamanoId: 4 });
        expect(pequena.estado).toBe("blocked_failed");
        expect(pequena.razones).toEqual(["No cumple: Tamaño mediano o mayor"]);
        expect(pequena.saltable).toBeTrue();
    });

    it("tamano_maximo falla con un tamaño mayor y, sin tamaño conocido, no se puede comprobar", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { tamano_maximo: true },
            Prerrequisitos: { ...sinPrerrequisitos(), tamano_maximo: [{ Id_tamano: 7, Tamano: "Enorme", Opcional: 0, Frase: "Tamaño enorme o menor" }] },
        });

        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), tamanoId: 7 }).estado).toBe("eligible");
        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), tamanoId: 8 }).razones).toEqual(["No cumple: Tamaño enorme o menor"]);
        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), tamanoId: null }).estado).toBe("blocked_unknown");
    });

    it("dg cuenta los DG totales (raciales, de clase y de plantilla)", () => {
        const simulacro = crearPlantillaMock({
            Nombre: "Simulacro de sombra",
            Prerrequisitos_flags: { dg: true },
            Prerrequisitos: { ...sinPrerrequisitos(), dg: [{ Cantidad: 10, Opcional: 0, Frase: "10 dados de golpe" }] },
        });

        expect(evaluarElegibilidadPlantilla(simulacro, { ...crearContextoBase(), dgTotal: 10 }).estado).toBe("eligible");
        const corto = evaluarElegibilidadPlantilla(simulacro, { ...crearContextoBase(), dgTotal: 9 });
        expect(corto.estado).toBe("blocked_failed");
        expect(corto.razones).toEqual(["No cumple: 10 dados de golpe"]);
    });

    it("subtipo se cumple con los subtipos de la raza o de las plantillas, por id o por nombre", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { subtipo: true },
            Prerrequisitos: { ...sinPrerrequisitos(), subtipo: [{ Id_subtipo: 21, Subtipo: "reptiliano", Opcional: 0, Frase: "Criatura de subtipo reptiliano" }] },
        });

        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), subtipos: [{ id: 21, nombre: "Reptiliano" }] }).estado).toBe("eligible");
        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), subtipos: [{ id: null, nombre: "Reptiliano" }] }).estado).toBe("eligible");
        const sinSubtipo = evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), subtipos: [{ id: 3, nombre: "Fuego" }] });
        expect(sinSubtipo.razones).toEqual(["No cumple: Criatura de subtipo reptiliano"]);

        // Una clave vacía no tapa a la siguiente: sin id y con `Subtipo` vacío, cuenta el `Nombre`.
        const porNombre = crearPlantillaMock({
            Prerrequisitos_flags: { subtipo: true },
            Prerrequisitos: { ...sinPrerrequisitos(), subtipo: [{ Subtipo: "", Nombre: "reptiliano", Opcional: 0, Frase: "Criatura de subtipo reptiliano" }] },
        });
        expect(evaluarElegibilidadPlantilla(porNombre, { ...crearContextoBase(), subtipos: [{ id: null, nombre: "Reptiliano" }] }).estado).toBe("eligible");
    });

    it("subtipo_prohibido falla si lo tiene y se cumple sin subtipos (cualquier criatura corpórea)", () => {
        const corporea = crearPlantillaMock({
            Prerrequisitos_flags: { subtipo_prohibido: true },
            Prerrequisitos: { ...sinPrerrequisitos(), subtipo_prohibido: [{ Id_subtipo: 16, Subtipo: "incorporal", Opcional: 0, Frase: "Sin el subtipo incorporal" }] },
        });

        expect(evaluarElegibilidadPlantilla(corporea, { ...crearContextoBase(), subtipos: [] }).estado).toBe("eligible");
        expect(evaluarElegibilidadPlantilla(corporea, crearContextoBase()).estado).toBe("eligible");
        const incorporal = evaluarElegibilidadPlantilla(corporea, { ...crearContextoBase(), subtipos: [{ id: 16, nombre: "Incorporal" }] });
        expect(incorporal.estado).toBe("blocked_failed");
        expect(incorporal.razones).toEqual(["No cumple: Sin el subtipo incorporal"]);
    });

    it("las alternativas de un mismo grupo valen con una sola", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos_flags: { subtipo: true, dg: true },
            Prerrequisitos: {
                ...sinPrerrequisitos(),
                subtipo: [{ Id_subtipo: 21, Subtipo: "reptiliano", Opcional: 1, Frase: "Criatura de subtipo reptiliano" }],
                dg: [{ Cantidad: 4, Opcional: 1, Frase: "4 dados de golpe" }],
            },
        });

        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), subtipos: [], dgTotal: 4 }).estado).toBe("eligible");
        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), subtipos: [], dgTotal: 3 }).razones)
            .toEqual(["No cumple: 4 dados de golpe o Criatura de subtipo reptiliano"]);
    });

    it("sin la marca de su familia en Prerrequisitos_flags no se evalúan", () => {
        const plantilla = crearPlantillaMock({
            Prerrequisitos: { ...sinPrerrequisitos(), dg: [{ Cantidad: 10, Opcional: 0, Frase: "10 dados de golpe" }] },
        });

        expect(evaluarElegibilidadPlantilla(plantilla, { ...crearContextoBase(), dgTotal: 1 }).estado).toBe("eligible");
    });

    it("solo se puede saltar si lo único que falla son sus prerrequisitos", () => {
        const heredada = crearPlantillaMock({
            Nacimiento: true,
            Prerrequisitos_flags: { dg: true },
            Prerrequisitos: { ...sinPrerrequisitos(), dg: [{ Cantidad: 10, Opcional: 0, Frase: "10 dados de golpe" }] },
        });

        expect(evaluarElegibilidadPlantilla(heredada, { ...crearContextoBase(), dgTotal: 1 }).saltable).toBeTrue();
        expect(evaluarElegibilidadPlantilla(heredada, { ...crearContextoBase(), dgTotal: 1, nivelesClase: 1 }).saltable).toBeFalse();
    });
});
