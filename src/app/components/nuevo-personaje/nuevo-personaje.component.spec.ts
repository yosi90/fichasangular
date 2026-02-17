import Swal from 'sweetalert2';
import { Campana } from 'src/app/interfaces/campaña';
import { Raza } from 'src/app/interfaces/raza';
import { VentajaDetalle } from 'src/app/interfaces/ventaja';
import { AsignacionCaracteristicas, NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { NuevoPersonajeComponent } from './nuevo-personaje.component';
import { of } from 'rxjs';

function crearRazaMock(oficial = true): Raza {
    return {
        Id: 1,
        Nombre: 'Elfo',
        Ajuste_nivel: 0,
        Manual: 'Manual base',
        Clase_predilecta: 'Mago',
        Modificadores: {
            Fuerza: 0,
            Destreza: 2,
            Constitucion: -2,
            Inteligencia: 0,
            Sabiduria: 0,
            Carisma: 0,
        },
        Alineamiento: {
            Id: 1,
            Basico: { Id_basico: 1, Nombre: 'Neutral bueno' },
            Ley: { Id_ley: 2, Nombre: 'Tendencia caotica' },
            Moral: { Id_moral: 1, Nombre: 'Tendencia buena' },
            Prioridad: { Id_prioridad: 1, Nombre: 'Moral' },
            Descripcion: 'Mock',
        },
        Oficial: oficial,
        Ataques_naturales: 'No especifica',
        Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
        Dgs_adicionales: {
            Cantidad: 0,
            Dado: 'd8',
            Tipo_criatura: 'Humanoide',
            Ataque_base: 0,
            Dotes_extra: 0,
            Puntos_habilidad: 0,
            Multiplicador_puntos_habilidad: 1,
            Fortaleza: 0,
            Reflejos: 0,
            Voluntad: 0,
        },
        Reduccion_dano: 'No especifica',
        Resistencia_magica: 'No especifica',
        Resistencia_energia: 'No especifica',
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
        Armadura_natural: 0,
        Varios_armadura: 0,
        Correr: 30,
        Nadar: 0,
        Volar: 0,
        Maniobrabilidad: {
            Id: 0,
            Nombre: '-',
            Velocidad_avance: 'N/A',
            Flotar: 0,
            Volar_atras: 0,
            Contramarcha: 0,
            Giro: 'N/A',
            Rotacion: 'N/A',
            Giro_max: 'N/A',
            Angulo_ascenso: 'N/A',
            Velocidad_ascenso: 'N/A',
            Angulo_descenso: 'N/A',
            Descenso_ascenso: 0,
        },
        Trepar: 0,
        Escalar: 0,
        Altura_rango_inf: 1.5,
        Altura_rango_sup: 1.9,
        Peso_rango_inf: 55,
        Peso_rango_sup: 85,
        Edad_adulto: 20,
        Edad_mediana: 40,
        Edad_viejo: 60,
        Edad_venerable: 80,
        Espacio: 5,
        Alcance: 5,
        Tipo_criatura: {
            Id: 1,
            Nombre: 'Humanoide',
            Descripcion: 'Mock',
            Manual: 'Mock',
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
            Tesoro: 'Normal',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        },
        Subtipos: [],
        Sortilegas: [],
        Raciales: [],
        DotesContextuales: [],
    };
}

function crearRazaConAlineamientoBasico(nombre: string): Raza {
    const raza = crearRazaMock();
    raza.Alineamiento.Basico.Nombre = nombre;
    return raza;
}

function crearRazaConPreferenciasSinBasico(ley: string, moral: string): Raza {
    const raza = crearRazaMock();
    raza.Alineamiento.Basico.Nombre = 'No aplica';
    raza.Alineamiento.Ley.Nombre = ley;
    raza.Alineamiento.Moral.Nombre = moral;
    raza.Alineamiento.Prioridad = { Id_prioridad: 3, Nombre: 'Siempre' };
    return raza;
}

function crearRazaConConflictoDuroAlineamiento(): Raza {
    const raza = crearRazaMock();
    raza.Alineamiento.Basico.Nombre = 'Legal maligno';
    raza.Alineamiento.Ley.Nombre = 'Siempre legal';
    raza.Alineamiento.Moral.Nombre = 'Siempre maligno';
    raza.Alineamiento.Prioridad = { Id_prioridad: 3, Nombre: 'Siempre' };
    return raza;
}

function crearRazaConPrioridadNoDura(): Raza {
    const raza = crearRazaConConflictoDuroAlineamiento();
    raza.Alineamiento.Ley.Nombre = 'Casi siempre legal';
    raza.Alineamiento.Moral.Nombre = 'Casi siempre maligno';
    raza.Alineamiento.Prioridad = { Id_prioridad: 2, Nombre: 'Casi siempre' };
    return raza;
}

function crearRazaMutadaConPrerequisito(): Raza {
    const raza = crearRazaMock();
    raza.Id = 99;
    raza.Nombre = 'Mutada celestial';
    raza.Mutada = true;
    (raza as any).Mutacion = { Es_mutada: true, Tiene_prerrequisitos: true };
    (raza as any).Prerrequisitos_flags = {
        alineamiento_requerido: true,
    };
    (raza as any).Prerrequisitos = {
        alineamiento_requerido: [{ id_alineamiento: 1, opcional: 0 }],
    };
    return raza;
}

function crearRazaMutadaConWarning(): Raza {
    const raza = crearRazaMock();
    raza.Id = 199;
    raza.Nombre = 'Mutada incierta';
    raza.Mutada = true;
    (raza as any).Mutacion = { Es_mutada: true, Tiene_prerrequisitos: true };
    (raza as any).Prerrequisitos_flags = {
        alineamiento_requerido: true,
    };
    (raza as any).Prerrequisitos = {
        alineamiento_requerido: [{ id_ley: 99, opcional: 0 }],
    };
    return raza;
}

function crearRazaConRacialesOpcionales(): Raza {
    const raza = crearRazaMock();
    raza.Id = 300;
    raza.Nombre = 'Prole de bahamut';
    raza.Raciales = [
        {
            Id: 1,
            Nombre: 'Vision en la oscuridad',
            Descripcion: '',
            Opcional: 0,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        } as any,
        {
            Id: 2,
            Nombre: 'Linaje de plata',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        } as any,
        {
            Id: 3,
            Nombre: 'Linaje de bronce',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
            Prerrequisitos: { raza: [], caracteristica: [] },
        } as any,
    ];
    return raza;
}

function crearRazaMutadaConRacialesOpcionalesPrereq(): Raza {
    const raza = crearRazaConRacialesOpcionales();
    raza.Id = 301;
    raza.Nombre = 'Prole mutada';
    raza.Mutada = true;
    (raza as any).Mutacion = { Es_mutada: true, Tiene_prerrequisitos: false };
    raza.Raciales = [
        {
            Id: 2,
            Nombre: 'Linaje de plata',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: { raza: [{ id_raza: 301 }], caracteristica: [] },
        } as any,
        {
            Id: 3,
            Nombre: 'Linaje de bronce',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: { raza: [{ id_raza: 10 }], caracteristica: [] },
        } as any,
    ];
    return raza;
}

function crearRazaMutadaConOpcionalesBloqueadas(): Raza {
    const raza = crearRazaMutadaConRacialesOpcionalesPrereq();
    raza.Id = 302;
    raza.Nombre = 'Mutada bloqueada';
    raza.Raciales = [
        {
            Id: 40,
            Nombre: 'Linaje imposible A',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: { raza: [{ id_raza: 999 }], caracteristica: [] },
        } as any,
        {
            Id: 41,
            Nombre: 'Linaje imposible B',
            Descripcion: '',
            Opcional: 1,
            Dotes: [],
            Habilidades: { Base: [], Custom: [] },
            Caracteristicas: [],
            Salvaciones: [],
            Sortilegas: [],
            Ataques: [],
            Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
            Prerrequisitos: { raza: [{ id_raza: 998 }], caracteristica: [] },
        } as any,
    ];
    return raza;
}

describe('NuevoPersonajeComponent', () => {
    let component: NuevoPersonajeComponent;
    let nuevoPSvc: NuevoPersonajeService;
    let campanaSvcMock: any;
    let alineamientoSvcMock: any;
    let razaSvcMock: any;
    let plantillaSvcMock: any;
    let ventajaSvcMock: any;
    let habilidadSvcMock: any;
    let idiomaSvcMock: any;
    let tipoCriaturaSvcMock: any;

    beforeEach(() => {
        nuevoPSvc = new NuevoPersonajeService();
        campanaSvcMock = {
            getListCampanas: async () => of([]),
        };
        alineamientoSvcMock = {
            getAlineamientosBasicosCatalogo: () => of([]),
        };
        razaSvcMock = {
            getRazas: () => of([
                crearRazaMock(),
                {
                    ...crearRazaMock(),
                    Id: 2,
                    Nombre: 'Humano base',
                    Alineamiento: {
                        ...crearRazaMock().Alineamiento,
                        Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
                    },
                },
            ]),
        };
        plantillaSvcMock = {
            getPlantillas: () => of([]),
        };
        ventajaSvcMock = {
            getVentajas: () => of([]),
            getDesventajas: () => of([]),
        };
        habilidadSvcMock = {
            getHabilidades: () => of([]),
            getHabilidadesCustom: () => of([]),
        };
        idiomaSvcMock = {
            getIdiomas: () => of([]),
        };
        tipoCriaturaSvcMock = {
            getTiposCriatura: () => of([]),
        };
        component = new NuevoPersonajeComponent(
            nuevoPSvc,
            campanaSvcMock,
            alineamientoSvcMock,
            razaSvcMock,
            plantillaSvcMock,
            ventajaSvcMock,
            habilidadSvcMock,
            idiomaSvcMock,
            tipoCriaturaSvcMock
        );
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.seleccionarRaza(crearRazaMock());
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Heironeous';
        component.Personaje.Edad = 20;
        component.Personaje.Peso = 55;
        component.Personaje.Altura = 1.5;
        component.recalcularOficialidad();
    });

    it('seleccionarRaza mueve automáticamente a Básicos', () => {
        expect(component.selectedInternalTabIndex).toBe(1);
        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('basicos');
    });

    it('si el alineamiento base de raza no existe en el selector, usa Legal bueno visible', () => {
        component.seleccionarRaza(crearRazaConAlineamientoBasico('Alineamiento desconocido'));
        expect(component.Personaje.Alineamiento).toBe('Legal bueno');
    });

    it('al seleccionar una raza mutada abre selector de base y no aplica hasta confirmar', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        component.razasCatalogo = [
            crearRazaMock(),
            {
                ...crearRazaMock(),
                Id: 2,
                Nombre: 'Humano base',
                Alineamiento: {
                    ...crearRazaMock().Alineamiento,
                    Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
                },
            },
        ];

        component.seleccionarRaza(crearRazaMutadaConPrerequisito());

        expect(component.modalSelectorRazaBaseAbierto).toBeTrue();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
    });

    it('confirmar base en mutada aplica la seleccion y cierra modal', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        component.razasCatalogo = [
            crearRazaMock(),
            {
                ...crearRazaMock(),
                Id: 2,
                Nombre: 'Humano base',
                Alineamiento: {
                    ...crearRazaMock().Alineamiento,
                    Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
                },
            },
        ];
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(crearRazaMutadaConPrerequisito());
        await component.onConfirmarRazaBase({
            ...crearRazaMock(),
            Id: 2,
            Nombre: 'Humano base',
            Alineamiento: {
                ...crearRazaMock().Alineamiento,
                Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
            },
        });

        expect(component.modalSelectorRazaBaseAbierto).toBeFalse();
        expect(nuevoPSvc.PersonajeCreacion.RazaBase?.Id).toBe(2);
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('permite base homebrew solo cuando se activa el toggle', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const baseOficial = {
            ...crearRazaMock(),
            Id: 2,
            Nombre: 'Humano base',
            Oficial: true,
        };
        const baseHomebrew = {
            ...crearRazaMock(false),
            Id: 3,
            Nombre: 'Bestial homebrew',
            Oficial: false,
        };
        component.razasCatalogo = [baseOficial, baseHomebrew];
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(crearRazaMutadaConWarning());
        await component.onConfirmarRazaBase(baseHomebrew);
        expect(nuevoPSvc.PersonajeCreacion.RazaBase).toBeNull();

        component.incluirHomebrewRazaBase = true;
        await component.onConfirmarRazaBase(baseHomebrew);
        expect(nuevoPSvc.PersonajeCreacion.RazaBase?.Id).toBe(3);
    });

    it('base con warning muestra aviso y permite continuar', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const base = {
            ...crearRazaMock(),
            Id: 2,
            Nombre: 'Humano base',
        };
        component.razasCatalogo = [base];
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(crearRazaMutadaConWarning());
        await component.onConfirmarRazaBase(base);

        expect(swalSpy).toHaveBeenCalled();
        expect(nuevoPSvc.PersonajeCreacion.RazaBase?.Id).toBe(2);
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('si no hay candidatas elegibles muestra alerta y no aplica seleccion', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        component.razasCatalogo = [{
            ...crearRazaMock(),
            Id: 2,
            Nombre: 'Base caotica',
            Alineamiento: {
                ...crearRazaMock().Alineamiento,
                Basico: { Id_basico: 1, Nombre: 'Caotico bueno' },
            },
        }];
        const mutadaExigente = crearRazaMutadaConPrerequisito();
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(mutadaExigente);

        expect(swalSpy).toHaveBeenCalled();
        expect(component.modalSelectorRazaBaseAbierto).toBeFalse();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
    });

    it('seleccionar raza con opcionales abre modal y bloquea avance', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;

        component.seleccionarRaza(crearRazaConRacialesOpcionales());

        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeTrue();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
        expect(component.selectedInternalTabIndex).toBe(0);
    });

    it('confirmar raciales opcionales aplica raza y avanza', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;

        component.seleccionarRaza(crearRazaConRacialesOpcionales());
        component.onConfirmarRacialesOpcionales({ 1: 'id:2' });

        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeFalse();
        expect(nuevoPSvc.RazaSeleccionada?.Id).toBe(300);
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('cancelar raciales opcionales no aplica selección', () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;

        component.seleccionarRaza(crearRazaConRacialesOpcionales());
        component.onCerrarModalRacialesOpcionales();

        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeFalse();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
        expect(component.selectedInternalTabIndex).toBe(0);
    });

    it('mutada + base con opcionales abre modal y habilita opciones por identidad dual', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const base = {
            ...crearRazaMock(),
            Id: 10,
            Nombre: 'Elfo base',
        };
        component.razasCatalogo = [base];

        component.seleccionarRaza(crearRazaMutadaConRacialesOpcionalesPrereq());
        await component.onConfirmarRazaBase(base);

        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeTrue();
        const grupoUno = component.gruposRacialesOpcionalesModal.find((g) => g.grupo === 1);
        expect(grupoUno).toBeTruthy();
        expect((grupoUno?.opciones ?? []).every((opcion) => opcion.estado !== 'blocked')).toBeTrue();
    });

    it('muestra opciones raciales bloqueadas cuando no cumplen prerrequisitos', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const base = {
            ...crearRazaMock(),
            Id: 10,
            Nombre: 'Elfo base',
        };
        const mutada = crearRazaMutadaConRacialesOpcionalesPrereq();
        mutada.Raciales = [
            ...(mutada.Raciales ?? []),
            {
                Id: 99,
                Nombre: 'Linaje vetado',
                Descripcion: '',
                Opcional: 1,
                Dotes: [],
                Habilidades: { Base: [], Custom: [] },
                Caracteristicas: [],
                Salvaciones: [],
                Sortilegas: [],
                Ataques: [],
                Prerrequisitos_flags: { raza: true, caracteristica_minima: false },
                Prerrequisitos: { raza: [{ id_raza: 999 }], caracteristica: [] },
            } as any,
        ];
        component.razasCatalogo = [base];

        component.seleccionarRaza(mutada);
        await component.onConfirmarRazaBase(base);

        const bloqueada = component.gruposRacialesOpcionalesModal
            .flatMap((g) => g.opciones)
            .find((opcion) => opcion.racial.Nombre === 'Linaje vetado');
        expect(bloqueada?.estado).toBe('blocked');
        expect((bloqueada?.razones ?? []).length).toBeGreaterThan(0);
    });

    it('si un grupo opcional queda sin opciones habilitadas muestra alerta y no avanza', async () => {
        nuevoPSvc.reiniciar();
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        component.selectedInternalTabIndex = 0;
        const base = {
            ...crearRazaMock(),
            Id: 10,
            Nombre: 'Elfo base',
        };
        component.razasCatalogo = [base];
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        component.seleccionarRaza(crearRazaMutadaConOpcionalesBloqueadas());
        await component.onConfirmarRazaBase(base);

        expect(swalSpy).toHaveBeenCalled();
        expect(component.modalSelectorRacialesOpcionalesAbierto).toBeFalse();
        expect(nuevoPSvc.RazaSeleccionada).toBeNull();
        expect(component.selectedInternalTabIndex).toBe(0);
    });

    it('usa catálogo cacheado de alineamientos cuando existe', () => {
        alineamientoSvcMock.getAlineamientosBasicosCatalogo = () => of([
            { Id: 88, Nombre: 'Alineamiento custom cacheado' },
            { Id: 89, Nombre: 'Legal bueno' },
        ]);

        component.ngOnInit();

        expect(component.alineamientosDisponibles).toContain('Alineamiento custom cacheado');
    });

    it('usa fallback local de alineamientos cuando el catálogo cacheado está vacío', () => {
        alineamientoSvcMock.getAlineamientosBasicosCatalogo = () => of([]);

        component.ngOnInit();

        expect(component.alineamientosDisponibles).toContain('Legal bueno');
        expect(component.alineamientosDisponibles.length).toBeGreaterThan(1);
    });

    it('onInternalTabIndexChange no permite cambiar el paso por navegación manual', () => {
        component.selectedInternalTabIndex = 1;
        component.onInternalTabIndexChange(0);
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('puedeContinuarBasicos es false si falta un campo obligatorio visible', () => {
        component.Personaje.Nombre = '';
        expect(component.puedeContinuarBasicos).toBeFalse();
    });

    it('puedeContinuarBasicos es true cuando todos los campos visibles obligatorios están completos', () => {
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Genero = 'Macho';
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Heironeous';
        component.Personaje.Campana = 'Sin campaña';
        component.Personaje.Trama = 'Trama base';
        component.Personaje.Subtrama = 'Subtrama base';
        component.Personaje.Edad = 21;
        component.Personaje.Peso = 75;
        component.Personaje.Altura = 1.8;

        expect(component.puedeContinuarBasicos).toBeTrue();
    });

    it('actualizarTramas con Sin campaña resetea trama y subtrama', () => {
        component.Tramas = [{ Id: 1, Nombre: 'Temporal' }];
        component.Subtramas = [{ Id: 1, Nombre: 'Temporal' }];
        component.Personaje.Campana = 'Sin campaña';
        component.Personaje.Trama = 'Otra trama';
        component.Personaje.Subtrama = 'Otra subtrama';

        component.actualizarTramas();

        expect(component.Tramas.length).toBe(0);
        expect(component.Subtramas.length).toBe(0);
        expect(component.Personaje.Trama).toBe('Trama base');
        expect(component.Personaje.Subtrama).toBe('Subtrama base');
    });

    it('actualizarTramas con campaña valida autoselecciona primera trama y primera subtrama', () => {
        const campanas: Campana[] = [{
            Id: 1,
            Nombre: 'Campaña A',
            Tramas: [
                { Id: 10, Nombre: 'Trama 1', Subtramas: [{ Id: 100, Nombre: 'Sub 1' }] },
                { Id: 11, Nombre: 'Trama 2', Subtramas: [{ Id: 101, Nombre: 'Sub 2' }] },
            ],
        }];
        component.Campanas = campanas;
        component.Personaje.Campana = 'Campaña A';
        component.Personaje.Trama = 'Invalida';
        component.Personaje.Subtrama = 'Invalida';

        component.actualizarTramas();

        expect(component.Personaje.Trama).toBe('Trama 1');
        expect(component.Personaje.Subtrama).toBe('Sub 1');
    });

    it('getInconsistenciasManual incluye peso, altura y edad fuera de rango', () => {
        component.Personaje.Edad = 100;
        component.Personaje.Peso = 120;
        component.Personaje.Altura = 2.2;

        const inconsistencias = component.getInconsistenciasManual();

        expect(inconsistencias.some(i => i.includes('Edad fuera de rango'))).toBeTrue();
        expect(inconsistencias.some(i => i.includes('Peso fuera de rango'))).toBeTrue();
        expect(inconsistencias.some(i => i.includes('Altura fuera de rango'))).toBeTrue();
    });

    it('getInconsistenciasManual incluye deidad no oficial', () => {
        component.Personaje.Deidad = 'Dios inventado';
        const inconsistencias = component.getInconsistenciasManual();
        expect(inconsistencias.some(i => i.includes('Deidad no oficial'))).toBeTrue();
    });

    it('getInconsistenciasManual registra conflicto duro de raza en prioridad 3 sin forzar homebrew hasta confirmar', () => {
        component.seleccionarRaza(crearRazaConConflictoDuroAlineamiento());
        component.Personaje.Alineamiento = 'Legal neutral';
        component.Personaje.Deidad = 'No tener deidad';
        const inconsistencias = component.getInconsistenciasManual();
        expect(inconsistencias.some(i => i.includes('Alineamiento incompatible con raza'))).toBeTrue();
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeTrue();
    });

    it('getInconsistenciasManual detecta referencia racial desde Ley/Moral cuando Basico es No aplica', () => {
        component.seleccionarRaza(crearRazaConPreferenciasSinBasico('Casi siempre legal', 'Casi siempre maligno'));
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'No tener deidad';

        const inconsistencias = component.getInconsistenciasManual();

        expect(inconsistencias.some(i => i.includes('extremadamente inusual'))).toBeTrue();
    });

    it('recalcularOficialidad mantiene oficial hasta confirmar cuando hay conflicto duro de deidad', () => {
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Gruumsh';
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeTrue();
    });

    it('recalcularOficialidad pone false con contradicciones de manual', () => {
        component.Personaje.Peso = 999;
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeFalse();
    });

    it('continuarDesdeBasicos cancela al rechazar alerta', async () => {
        component.Personaje.Peso = 999;
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        await component.continuarDesdeBasicos();

        expect(component.modalCaracteristicasAbierto).toBeFalse();
    });

    it('continuarDesdeBasicos abre modal al aceptar alerta', async () => {
        component.Personaje.Peso = 999;
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('continuarDesdeBasicos con conflicto duro de raza en prioridad 3 marca homebrew al confirmar', async () => {
        component.seleccionarRaza(crearRazaConConflictoDuroAlineamiento());
        component.Personaje.Alineamiento = 'Legal neutral';
        component.Personaje.Deidad = 'No tener deidad';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).toHaveBeenCalledTimes(1);
        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.html ?? ''}`).toContain('Regla dura de alineamiento');
        expect(`${swalConfig.html ?? ''}`).toContain('tu raza exige');
        expect(`${swalConfig.html ?? ''}`).toContain('se convertirá en homebrew');
        expect(component.Personaje.Oficial).toBeFalse();
        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('continuarDesdeBasicos con deidad incompatible marca homebrew al confirmar', async () => {
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Gruumsh';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).toHaveBeenCalledTimes(1);
        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.html ?? ''}`).toContain('Regla dura de alineamiento');
        expect(`${swalConfig.html ?? ''}`).toContain('tu deidad exige');
        expect(component.Personaje.Oficial).toBeFalse();
        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('deidad permite diferencia de un paso sin conflicto duro', async () => {
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'St. Cuthbert';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).not.toHaveBeenCalled();
        expect(component.Personaje.Oficial).toBeTrue();
        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('continuarDesdeBasicos usa swal combinado cuando coinciden advertencia de raza e impacto de deidad', async () => {
        component.seleccionarRaza(crearRazaConPrioridadNoDura());
        component.Personaje.Alineamiento = 'Caotico maligno';
        component.Personaje.Deidad = 'Heironeous';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).toHaveBeenCalledTimes(1);
        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.html ?? ''}`).toContain('Regla dura de alineamiento');
        expect(`${swalConfig.html ?? ''}`).toContain('tu raza suele exigir');
        expect(`${swalConfig.html ?? ''}`).toContain('tu deidad exige');
        expect(`${swalConfig.html ?? ''}`).toContain('1 entre un millón');
    });

    it('continuarDesdeBasicos no marca homebrew por conflicto duro si el usuario cancela', async () => {
        component.seleccionarRaza(crearRazaConConflictoDuroAlineamiento());
        component.Personaje.Alineamiento = 'Legal neutral';
        component.Personaje.Deidad = 'No tener deidad';
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        await component.continuarDesdeBasicos();

        expect(component.Personaje.Oficial).toBeTrue();
        expect(component.modalCaracteristicasAbierto).toBeFalse();
    });

    it('raza con preferencia casi siempre muestra advertencia pero no marca homebrew', async () => {
        component.seleccionarRaza(crearRazaConPrioridadNoDura());
        component.Personaje.Alineamiento = 'Caotico maligno';
        component.Personaje.Deidad = 'No tener deidad';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).toHaveBeenCalledTimes(1);
        const swalConfig = swalSpy.calls.mostRecent().args[0] as any;
        expect(`${swalConfig.html ?? ''}`).toContain('Advertencias');
        expect(`${swalConfig.html ?? ''}`).toContain('1 entre un millón');
        expect(component.Personaje.Oficial).toBeTrue();
    });

    it('continuarDesdeBasicos abre ventana flotante en escritorio', async () => {
        spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1600);
        spyOnProperty(window, 'innerHeight', 'get').and.returnValue(900);

        await component.continuarDesdeBasicos();

        expect(component.ventanaDetalleAbierta).toBeTrue();
    });

    it('continuarDesdeBasicos no abre ventana flotante en layout móvil/tablet', async () => {
        spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1024);
        spyOnProperty(window, 'innerHeight', 'get').and.returnValue(800);

        await component.continuarDesdeBasicos();

        expect(component.ventanaDetalleAbierta).toBeFalse();
    });

    it('onSolicitarCerrarVentanaDetalle emite cierre al confirmar', async () => {
        component.ventanaDetalleAbierta = true;
        const emitSpy = spyOn(component.cerrarNuevoPersonajeSolicitado, 'emit');
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.onSolicitarCerrarVentanaDetalle();

        expect(component.ventanaDetalleAbierta).toBeFalse();
        expect(emitSpy).toHaveBeenCalled();
    });

    it('onSolicitarCerrarVentanaDetalle mantiene ventana si cancela', async () => {
        component.ventanaDetalleAbierta = true;
        const emitSpy = spyOn(component.cerrarNuevoPersonajeSolicitado, 'emit');
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        await component.onSolicitarCerrarVentanaDetalle();

        expect(component.ventanaDetalleAbierta).toBeTrue();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('tituloVentanaDetalle usa el nombre del personaje cuando existe', () => {
        component.Personaje.Nombre = 'Pepe';
        expect(component.tituloVentanaDetalle).toBe('Pepe - En creación');
    });

    it('tituloVentanaDetalle usa fallback cuando no hay nombre', () => {
        component.Personaje.Nombre = '   ';
        expect(component.tituloVentanaDetalle).toBe('Sin nombre - En creación');
    });

    it('continuarDesdeBasicos sin inconsistencias abre modal sin alerta', async () => {
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Peso = 55;
        component.Personaje.Altura = 1.5;
        component.Personaje.Edad = 20;
        component.Personaje.Deidad = 'Heironeous';
        component.Personaje.Alineamiento = 'Legal bueno';
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.continuarDesdeBasicos();

        expect(swalSpy).not.toHaveBeenCalled();
        expect(component.modalCaracteristicasAbierto).toBeTrue();
    });

    it('continuarDesdeBasicos autorrellena contexto y personalidad cuando están vacíos', async () => {
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Contexto = '   ';
        component.Personaje.Personalidad = '';

        await component.continuarDesdeBasicos();

        expect(component.Personaje.Contexto).toBe(component.fallbackContexto);
        expect(component.Personaje.Personalidad).toBe(component.fallbackPersonalidad);
    });

    it('continuarDesdeBasicos no sobreescribe contexto ni personalidad si ya tenían valor', async () => {
        component.Personaje.Nombre = 'Aldric';
        component.Personaje.Contexto = 'Contexto custom';
        component.Personaje.Personalidad = 'Personalidad custom';

        await component.continuarDesdeBasicos();

        expect(component.Personaje.Contexto).toBe('Contexto custom');
        expect(component.Personaje.Personalidad).toBe('Personalidad custom');
    });

    it('no avanza a Plantillas sin características generadas', () => {
        component.irAPlantillas();
        expect(component.selectedInternalTabIndex).toBe(1);
    });

    it('finalizarGeneracionCaracteristicas aplica valores y avanza a Plantillas', () => {
        const asignaciones: AsignacionCaracteristicas = {
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        };

        component.finalizarGeneracionCaracteristicas(asignaciones);

        expect(component.caracteristicasGeneradas).toBeTrue();
        expect(component.selectedInternalTabIndex).toBe(2);
        expect(component.Personaje.Fuerza).toBe(14);
        expect(component.Personaje.Destreza).toBe(17);
        expect(component.Personaje.Constitucion).toBe(11);
        expect(component.Personaje.ModDestreza).toBe(3);
    });

    it('flujo de tabs: Plantillas -> Ventajas y desventajas', () => {
        component.finalizarGeneracionCaracteristicas({
            Fuerza: 14,
            Destreza: 15,
            Constitucion: 13,
            Inteligencia: 12,
            Sabiduria: 10,
            Carisma: 8,
        });
        component.continuarDesdePlantillas();
        expect(nuevoPSvc.EstadoFlujo.pasoActual).toBe('ventajas');
        expect(component.selectedInternalTabIndex).toBe(3);
    });

    it('muestra contador de ventajas y puntos desde el estado del servicio', () => {
        const ventaja: VentajaDetalle = {
            Id: 10,
            Nombre: 'Fuerte',
            Descripcion: '',
            Disipable: false,
            Coste: -1,
            Mejora: 1,
            Caracteristica: false,
            Fuerza: true,
            Destreza: false,
            Constitucion: false,
            Inteligencia: false,
            Sabiduria: false,
            Carisma: false,
            Fortaleza: false,
            Reflejos: false,
            Voluntad: false,
            Iniciativa: false,
            Duplica_oro: false,
            Aumenta_oro: false,
            Idioma_extra: false,
            Manual: { Id: 0, Nombre: '', Pagina: 0 },
            Rasgo: { Id: 0, Nombre: '', Descripcion: '' },
            Idioma: { Id: 0, Nombre: '', Descripcion: '' },
            Habilidad: { Id: 0, Nombre: '', Descripcion: '' },
            Oficial: true,
        };
        const desventaja: VentajaDetalle = {
            ...ventaja,
            Id: 11,
            Nombre: 'Miope',
            Coste: 1,
            Mejora: -1,
            Fuerza: false,
            Habilidad: { Id: 0, Nombre: 'Avistar', Descripcion: '' },
        };

        nuevoPSvc.setCatalogosVentajas([ventaja], [desventaja]);
        component.toggleDesventajaSeleccion(desventaja);
        component.toggleVentajaSeleccion(ventaja);

        expect(component.ventajasSeleccionadasCount).toBe(1);
        expect(component.flujoVentajas.puntosDisponibles).toBe(1);
        expect(component.flujoVentajas.puntosRestantes).toBe(0);
    });

    it('bloquea continuar desde ventajas con déficit', () => {
        const ventaja: VentajaDetalle = {
            Id: 12,
            Nombre: 'Caro',
            Descripcion: '',
            Disipable: false,
            Coste: -3,
            Mejora: 1,
            Caracteristica: false,
            Fuerza: true,
            Destreza: false,
            Constitucion: false,
            Inteligencia: false,
            Sabiduria: false,
            Carisma: false,
            Fortaleza: false,
            Reflejos: false,
            Voluntad: false,
            Iniciativa: false,
            Duplica_oro: false,
            Aumenta_oro: false,
            Idioma_extra: false,
            Manual: { Id: 0, Nombre: '', Pagina: 0 },
            Rasgo: { Id: 0, Nombre: '', Descripcion: '' },
            Idioma: { Id: 0, Nombre: '', Descripcion: '' },
            Habilidad: { Id: 0, Nombre: '', Descripcion: '' },
            Oficial: true,
        };
        nuevoPSvc.setCatalogosVentajas([ventaja], []);
        component.toggleVentajaSeleccion(ventaja);

        expect(component.flujoVentajas.hayDeficit).toBeTrue();
        expect(component.puedeContinuarVentajas).toBeFalse();
    });

    it('chip homebrew queda bloqueado cuando el personaje no es oficial', () => {
        component.Personaje.Oficial = false;
        expect(component.homebrewForzado).toBeTrue();
        expect(component.incluirHomebrewPlantillasEfectivo).toBeTrue();
        expect(component.incluirHomebrewVentajasEfectivo).toBeTrue();
    });

    it('persistencia de modal: si vuelves al componente, mantiene estado del servicio', () => {
        nuevoPSvc.abrirModalCaracteristicas();
        nuevoPSvc.actualizarPasoActual('basicos');

        const componentReabierto = new NuevoPersonajeComponent(
            nuevoPSvc,
            campanaSvcMock,
            alineamientoSvcMock,
            razaSvcMock,
            plantillaSvcMock,
            ventajaSvcMock,
            habilidadSvcMock,
            idiomaSvcMock,
            tipoCriaturaSvcMock
        );
        componentReabierto.ngOnInit();

        expect(componentReabierto.modalCaracteristicasAbierto).toBeTrue();
        expect(componentReabierto.selectedInternalTabIndex).toBe(1);
    });
});
