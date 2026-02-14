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
        Prerrequisitos: [],
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
        Sortilegas: [],
        DotesContextuales: [],
    };
}

function crearRazaConAlineamientoBasico(nombre: string): Raza {
    const raza = crearRazaMock();
    raza.Alineamiento.Basico.Nombre = nombre;
    return raza;
}

describe('NuevoPersonajeComponent', () => {
    let component: NuevoPersonajeComponent;
    let nuevoPSvc: NuevoPersonajeService;
    let campanaSvcMock: any;
    let plantillaSvcMock: any;
    let ventajaSvcMock: any;
    let habilidadSvcMock: any;
    let idiomaSvcMock: any;

    beforeEach(() => {
        nuevoPSvc = new NuevoPersonajeService();
        campanaSvcMock = {
            getListCampanas: async () => of([]),
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
        component = new NuevoPersonajeComponent(
            nuevoPSvc,
            campanaSvcMock,
            plantillaSvcMock,
            ventajaSvcMock,
            habilidadSvcMock,
            idiomaSvcMock
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
            plantillaSvcMock,
            ventajaSvcMock,
            habilidadSvcMock,
            idiomaSvcMock
        );
        componentReabierto.ngOnInit();

        expect(componentReabierto.modalCaracteristicasAbierto).toBeTrue();
        expect(componentReabierto.selectedInternalTabIndex).toBe(1);
    });
});
