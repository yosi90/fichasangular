import { Raza } from 'src/app/interfaces/raza';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { GeneradorCaracteristicasModalComponent } from './generador-caracteristicas-modal.component';

const GENERADOR_CONFIG_STORAGE_KEY = 'fichas35.nuevoPersonaje.generador.config.v1';

function crearRazaMock(pierdeConstitucion = false): Raza {
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
        Oficial: true,
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
            Pierde_constitucion: pierdeConstitucion,
            Limite_inteligencia: 0,
            Tesoro: 'Normal',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        },
        Sortilegas: [],
        Raciales: [],
        DotesContextuales: [],
    };
}

describe('GeneradorCaracteristicasModalComponent', () => {
    let service: NuevoPersonajeService;
    let component: GeneradorCaracteristicasModalComponent;

    beforeEach(() => {
        localStorage.removeItem(GENERADOR_CONFIG_STORAGE_KEY);

        service = new NuevoPersonajeService();
        service.seleccionarRaza(crearRazaMock(false));
        component = new GeneradorCaracteristicasModalComponent(service);
        component.raza = service.RazaSeleccionada!;
        component.pierdeConstitucion = false;
    });

    afterEach(() => {
        localStorage.removeItem(GENERADOR_CONFIG_STORAGE_KEY);
    });

    it('expone minimos de 3 a 13', () => {
        expect(component.minimos[0]).toBe(3);
        expect(component.minimos[component.minimos.length - 1]).toBe(13);
        expect(component.minimos.length).toBe(11);
    });

    it('expone selector de tablas permitidas de 1 a 5', () => {
        expect(component.tablasPermitidasOpciones).toEqual([1, 2, 3, 4, 5]);
    });

    it('seleccionar tabla crea pool de 6 valores inmediatamente', () => {
        component.seleccionarTabla(1);

        expect(component.estado.tablaSeleccionada).toBe(1);
        expect(component.estado.poolDisponible.length).toBe(6);
    });

    it('seleccionar otra tabla reinicia asignaciones y cambia la selección activa', () => {
        component.seleccionarTabla(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        component.seleccionarTabla(2);

        expect(component.estado.tablaSeleccionada).toBe(2);
        expect(component.estado.asignaciones.Fuerza).toBeNull();
        expect(component.estado.poolDisponible).toEqual(service.getTiradasTabla(2));
    });

    it('cambiar tirada minima resetea selección, pool y asignaciones', () => {
        component.seleccionarTabla(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        component.onMinimoChange(10);

        expect(component.estado.minimoSeleccionado).toBe(10);
        expect(component.estado.tablaSeleccionada).toBeNull();
        expect(component.estado.poolDisponible.length).toBe(0);
        expect(component.estado.asignaciones.Fuerza).toBeNull();
    });

    it('cambiar tablas permitidas resetea selección, pool y asignaciones', () => {
        component.seleccionarTabla(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        component.onTablasPermitidasChange(5);

        expect(component.estado.tablasPermitidas).toBe(5);
        expect(component.estado.tablaSeleccionada).toBeNull();
        expect(component.estado.poolDisponible.length).toBe(0);
        expect(component.estado.asignaciones.Fuerza).toBeNull();
        expect(component.tablasVisibles.length).toBe(5);
    });

    it('pierde constitucion permite finalizar con 5 asignaciones', () => {
        const servicioNoMuerto = new NuevoPersonajeService();
        servicioNoMuerto.seleccionarRaza(crearRazaMock(true));
        const modalNoMuerto = new GeneradorCaracteristicasModalComponent(servicioNoMuerto);
        modalNoMuerto.raza = servicioNoMuerto.RazaSeleccionada!;
        modalNoMuerto.pierdeConstitucion = true;

        modalNoMuerto.seleccionarTabla(1);

        servicioNoMuerto.asignarDesdePoolACaracteristica('Fuerza', 0);
        servicioNoMuerto.asignarDesdePoolACaracteristica('Destreza', 1);
        servicioNoMuerto.asignarDesdePoolACaracteristica('Inteligencia', 2);
        servicioNoMuerto.asignarDesdePoolACaracteristica('Sabiduria', 3);
        servicioNoMuerto.asignarDesdePoolACaracteristica('Carisma', 4);

        expect(modalNoMuerto.puedeFinalizar).toBeTrue();
        expect(modalNoMuerto.estado.asignaciones.Constitucion).toBe(0);
    });
});
