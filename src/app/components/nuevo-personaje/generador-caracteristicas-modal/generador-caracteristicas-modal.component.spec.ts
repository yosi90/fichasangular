import { Raza } from 'src/app/interfaces/raza';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import Swal from 'sweetalert2';
import { GeneradorCaracteristicasModalComponent } from './generador-caracteristicas-modal.component';

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
            Pierde_constitucion: pierdeConstitucion,
            Limite_inteligencia: 0,
            Tesoro: 'Normal',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        },
        Subtipos: [],
        Sortilegas: [],
        Raciales: [],
        Habilidades: { Base: [], Custom: [] },
        DotesContextuales: [],
    };
}

describe('GeneradorCaracteristicasModalComponent', () => {
    let service: NuevoPersonajeService;
    let component: GeneradorCaracteristicasModalComponent;

    beforeEach(() => {
        service = new NuevoPersonajeService();
        service.seleccionarRaza(crearRazaMock(false));
        component = new GeneradorCaracteristicasModalComponent(service);
        component.raza = service.RazaSeleccionada!;
        component.caracteristicasPerdidas = service.PersonajeCreacion.Caracteristicas_perdidas ?? null;
        component.pierdeConstitucion = false;
    });

    it('expone minimos de 3 a 13', () => {
        expect(component.minimos[0]).toBe(3);
        expect(component.minimos[component.minimos.length - 1]).toBe(13);
        expect(component.minimos.length).toBe(11);
    });

    it('expone selector de tablas permitidas de 1 a 5', () => {
        expect(component.tablasPermitidasOpciones).toEqual([1, 2, 3, 4, 5]);
    });

    it('deja libres los selectores cuando no hay restricción de campaña', () => {
        expect(component.generadorRestringidoPorCampana).toBeFalse();
    });

    it('bloquea los selectores cuando la campaña restringe tirada mínima y tablas', () => {
        service.aplicarRestriccionCampanaGenerador({
            tiradaMinimaCaracteristica: 3,
            maxTablasDadosCaracteristicas: 1,
        });

        expect(component.generadorRestringidoPorCampana).toBeTrue();
        expect(component.estado.minimoSeleccionado).toBe(3);
        expect(component.estado.tablasPermitidas).toBe(1);
    });

    it('reactiva los selectores si la restricción de campaña desaparece', () => {
        service.aplicarRestriccionCampanaGenerador({
            tiradaMinimaCaracteristica: 3,
            maxTablasDadosCaracteristicas: 1,
        });
        service.aplicarRestriccionCampanaGenerador(null);

        expect(component.generadorRestringidoPorCampana).toBeFalse();
        expect(component.estado.minimoSeleccionado).toBe(13);
        expect(component.estado.tablasPermitidas).toBe(3);
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

    it('refresca un view-model compacto para tablas, pool y previews', () => {
        component.seleccionarTabla(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        component.ngDoCheck();

        expect(component.tablasVisiblesVm.length).toBe(3);
        expect(component.tablasVisiblesVm[0].seleccionada).toBeTrue();
        expect(component.poolItemsVm.length).toBe(6);
        expect(component.poolItemsVm[0].usado).toBeTrue();
        expect(component.caracteristicasVm.find((item) => item.key === 'Fuerza')?.preview).not.toBeNull();
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

    it('muestra preview con estadistica final y modificador cuando hay valor asignado', () => {
        component.seleccionarTabla(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        const preview = component.getPreviewCaracteristica('Fuerza');
        const base = component.estado.asignaciones.Fuerza as number;
        const esperadoFinal = base + component.getModRacial('Fuerza');
        const esperadoMod = Math.floor((esperadoFinal - 10) / 2);

        expect(preview).not.toBeNull();
        expect(preview?.valorFinal).toBe(esperadoFinal);
        expect(preview?.modificador).toBe(esperadoMod);
    });

    it('no muestra preview de constitucion cuando está perdida', () => {
        const servicioNoMuerto = new NuevoPersonajeService();
        servicioNoMuerto.seleccionarRaza(crearRazaMock(true));
        const modalNoMuerto = new GeneradorCaracteristicasModalComponent(servicioNoMuerto);
        modalNoMuerto.raza = servicioNoMuerto.RazaSeleccionada!;
        modalNoMuerto.caracteristicasPerdidas = servicioNoMuerto.PersonajeCreacion.Caracteristicas_perdidas ?? null;
        modalNoMuerto.pierdeConstitucion = true;
        modalNoMuerto.seleccionarTabla(1);

        expect(modalNoMuerto.getPreviewCaracteristica('Constitucion')).toBeNull();
    });

    it('bloquea drop y preview en cualquier caracteristica perdida', () => {
        (service as any).setCaracteristicaPerdida('Fuerza', true, 'test');
        component.caracteristicasPerdidas = service.PersonajeCreacion.Caracteristicas_perdidas ?? null;
        component.seleccionarTabla(1);

        expect(component.getValorAsignado('Fuerza')).toBe('-');
        expect(component.caracteristicaBloqueada('Fuerza')).toBeTrue();
        expect(component.getPreviewCaracteristica('Fuerza')).toBeNull();
        expect(component.estado.asignaciones.Fuerza).toBe(0);
    });

    it('Enter finaliza solo cuando está habilitado', () => {
        const finalizeSpy = spyOn(component.finalizar, 'emit');

        component.onEnterPresionado(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(finalizeSpy).not.toHaveBeenCalled();

        component.seleccionarTabla(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);
        service.asignarDesdePoolACaracteristica('Destreza', 1);
        service.asignarDesdePoolACaracteristica('Constitucion', 2);
        service.asignarDesdePoolACaracteristica('Inteligencia', 3);
        service.asignarDesdePoolACaracteristica('Sabiduria', 4);
        service.asignarDesdePoolACaracteristica('Carisma', 5);

        component.onEnterPresionado(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(finalizeSpy).toHaveBeenCalled();
    });

    it('repartirAutomaticamente sin asignaciones previas abre cuestionario y llama al servicio', async () => {
        const autoSpy = spyOn(service, 'autoRepartirGenerador').and.returnValue({
            aplicado: true,
            tablaSeleccionada: 1,
        });

        const repartoPromise = component.repartirAutomaticamente();
        expect(component.modalCuestionarioAutoAbierto).toBeTrue();
        component.onSeleccionarQ1('magia_arcana');
        component.onSeleccionarQ2('atras_control_apoyo');
        component.onSeleccionarQ3('investigar');
        component.confirmarCuestionarioAuto();
        await repartoPromise;

        expect(autoSpy).toHaveBeenCalledWith({
            q1: 'magia_arcana',
            q2: 'atras_control_apoyo',
            q3: 'investigar',
        });
    });

    it('repartirAutomaticamente no modifica si cancelas la confirmación de sobrescritura', async () => {
        component.seleccionarTabla(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
        const autoSpy = spyOn(service, 'autoRepartirGenerador');

        await component.repartirAutomaticamente();

        expect(autoSpy).not.toHaveBeenCalled();
    });

    it('repartirAutomaticamente confirma sobrescritura y aplica reparto automático', async () => {
        component.seleccionarTabla(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        const autoSpy = spyOn(service, 'autoRepartirGenerador').and.returnValue({
            aplicado: true,
            tablaSeleccionada: 1,
        });

        const repartoPromise = component.repartirAutomaticamente();
        await Promise.resolve();
        expect(component.modalCuestionarioAutoAbierto).toBeTrue();
        component.onSeleccionarQ1('magia_arcana');
        component.onSeleccionarQ2('atras_control_apoyo');
        component.onSeleccionarQ3('investigar');
        component.confirmarCuestionarioAuto();
        await repartoPromise;

        expect(swalSpy).toHaveBeenCalledTimes(1);
        expect(autoSpy).toHaveBeenCalledWith({
            q1: 'magia_arcana',
            q2: 'atras_control_apoyo',
            q3: 'investigar',
        });
    });

    it('repartirAutomaticamente no finaliza automáticamente', async () => {
        spyOn(service, 'autoRepartirGenerador').and.returnValue({
            aplicado: true,
            tablaSeleccionada: 1,
        });
        const finalizeSpy = spyOn(component, 'finalizarAsignacion');

        const repartoPromise = component.repartirAutomaticamente();
        component.onSeleccionarQ1('rapidez_precision');
        component.onSeleccionarQ2('evitar_contacto');
        component.onSeleccionarQ3('manitas');
        component.onSeleccionarQ4('acierto');
        component.confirmarCuestionarioAuto();
        await repartoPromise;

        expect(finalizeSpy).not.toHaveBeenCalled();
    });

    it('repartirAutomaticamente no aplica si cancelas el cuestionario', async () => {
        const autoSpy = spyOn(service, 'autoRepartirGenerador');

        const repartoPromise = component.repartirAutomaticamente();
        expect(component.modalCuestionarioAutoAbierto).toBeTrue();
        component.cancelarCuestionarioAuto();
        await repartoPromise;

        expect(autoSpy).not.toHaveBeenCalled();
    });
});
