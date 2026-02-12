import Swal from 'sweetalert2';
import { Campana } from 'src/app/interfaces/campaña';
import { Raza } from 'src/app/interfaces/raza';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { NuevoPersonajeComponent } from './nuevo-personaje.component';

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

function waitTick(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}

describe('NuevoPersonajeComponent', () => {
    let component: NuevoPersonajeComponent;
    let nuevoPSvc: NuevoPersonajeService;

    beforeEach(() => {
        nuevoPSvc = new NuevoPersonajeService();
        component = new NuevoPersonajeComponent(nuevoPSvc, {} as any);
        component.Personaje = nuevoPSvc.PersonajeCreacion;
        (component as any).TabGroup = { selectedIndex: 0 };
        component.seleccionarRaza(crearRazaMock());
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Heironeous';
        component.Personaje.Edad = 20;
        component.Personaje.Peso = 55;
        component.Personaje.Altura = 1.5;
        component.recalcularOficialidad();
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

    it('regla de distancia permite un paso (Legal bueno vs Legal neutral)', () => {
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'St. Cuthbert';
        const inconsistencias = component.getInconsistenciasManual();
        expect(inconsistencias.some(i => i.includes('Alineamiento incompatible'))).toBeFalse();
    });

    it('regla de distancia marca invalido mas de un paso (Legal bueno vs Neutral autentico)', () => {
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Deidad = 'Boccob';
        const inconsistencias = component.getInconsistenciasManual();
        expect(inconsistencias.some(i => i.includes('Alineamiento incompatible'))).toBeTrue();
    });

    it('recalcularOficialidad pone true cuando todo es valido', () => {
        component.Personaje.Deidad = 'Heironeous';
        component.Personaje.Alineamiento = 'Legal bueno';
        component.Personaje.Edad = 20;
        component.Personaje.Peso = 55;
        component.Personaje.Altura = 1.5;
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeTrue();
    });

    it('recalcularOficialidad pone false con raza no oficial', () => {
        (component as any).nuevoPSvc.razaSeleccionada = crearRazaMock(false);
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeFalse();
    });

    it('recalcularOficialidad pone false con deidad no oficial', () => {
        component.Personaje.Deidad = 'Deidad fanmade';
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeFalse();
    });

    it('recalcularOficialidad pone false con contradicciones de manual', () => {
        component.Personaje.Peso = 999;
        component.recalcularOficialidad();
        expect(component.Personaje.Oficial).toBeFalse();
    });

    it('panel deidad se oculta con No tener deidad y muestra info con deidad seleccionada', () => {
        component.Personaje.Deidad = 'No tener deidad';
        expect(component.mostrarPanelDeidad).toBeFalse();

        component.Personaje.Deidad = 'Heironeous';
        expect(component.mostrarPanelDeidad).toBeTrue();
        expect(component.deidadAlineamientoInfo).toBe('Legal bueno');
        expect(component.deidadOficialidadInfo).toBe('Oficial');
    });

    it('onInternalTabChange cancela cambio y restaura tab al cancelar alerta', async () => {
        component.Personaje.Peso = 999;
        (component as any).previousInternalTabIndex = 1;
        (component as any).TabGroup = { selectedIndex: 0 };
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        await component.onInternalTabChange({ index: 0 } as any);
        await waitTick();

        expect((component as any).TabGroup.selectedIndex).toBe(1);
        expect((component as any).previousInternalTabIndex).toBe(1);
    });

    it('onInternalTabChange permite cambio al aceptar alerta', async () => {
        component.Personaje.Peso = 999;
        (component as any).previousInternalTabIndex = 1;
        (component as any).TabGroup = { selectedIndex: 0 };
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.onInternalTabChange({ index: 0 } as any);

        expect((component as any).previousInternalTabIndex).toBe(0);
        expect(component.Personaje.Oficial).toBeFalse();
    });

    it('onInternalTabChange sin inconsistencias no muestra alerta', async () => {
        component.Personaje.Peso = 55;
        component.Personaje.Altura = 1.5;
        component.Personaje.Edad = 20;
        component.Personaje.Deidad = 'Heironeous';
        component.Personaje.Alineamiento = 'Legal bueno';
        (component as any).previousInternalTabIndex = 1;
        (component as any).TabGroup = { selectedIndex: 0 };
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        await component.onInternalTabChange({ index: 0 } as any);

        expect(swalSpy).not.toHaveBeenCalled();
        expect((component as any).previousInternalTabIndex).toBe(0);
    });
});
