import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetallesRazaComponent } from './detalles-raza.component';
import { Raza } from 'src/app/interfaces/raza';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { createRacialPlaceholder } from 'src/app/services/utils/racial-mapper';

function crearRazaMock(): Raza {
    return {
        Id: 1,
        Nombre: 'Elfo',
        Ajuste_nivel: 0,
        Manual: 'Manual base',
        Clase_predilecta: 'Mago',
        Modificadores: {
            Fuerza: 0,
            Destreza: 0,
            Constitucion: 0,
            Inteligencia: 0,
            Sabiduria: 0,
            Carisma: 0,
        },
        Alineamiento: {
            Basico: { Nombre: 'Neutral bueno' },
            Ley: { Nombre: 'Tendencia legal' },
            Moral: { Nombre: 'Tendencia buena' },
        } as any,
        Oficial: true,
        Ataques_naturales: 'No especifica',
        Tamano: { Id: 1, Nombre: 'Mediano' } as any,
        Dgs_adicionales: {
            Cantidad: 0,
            Dado: 'd8',
            Tipo_criatura: 'Humanoide',
            Ataque_base: 0,
            Dotes_extra: 0,
            Puntos_habilidad: 0,
            Multiplicador_puntos_habilidad: 0,
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
        Maniobrabilidad: { Nombre: '-' } as any,
        Trepar: 0,
        Escalar: 0,
        Altura_rango_inf: 1.4,
        Altura_rango_sup: 1.9,
        Peso_rango_inf: 45,
        Peso_rango_sup: 90,
        Edad_adulto: 20,
        Edad_mediana: 60,
        Edad_viejo: 120,
        Edad_venerable: 180,
        Espacio: 5,
        Alcance: 5,
        Tipo_criatura: { Id: 1, Nombre: 'Humanoide' } as any,
        Subtipos: [],
        Sortilegas: [],
        Raciales: [],
        DotesContextuales: [],
    } as unknown as Raza;
}

describe('DetallesRazaComponent', () => {
    let component: DetallesRazaComponent;
    let fixture: ComponentFixture<DetallesRazaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DetallesRazaComponent],
            providers: [
                {
                    provide: ManualDetalleNavigationService,
                    useValue: jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']),
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesRazaComponent);
        component = fixture.componentInstance;
        component.raza = crearRazaMock();
        component.raza.Raciales = [
            createRacialPlaceholder('Sangre antigua', 7),
            createRacialPlaceholder('Vision en la oscuridad', 3),
        ];
    });

    it('emite referencia estructurada al abrir una racial', () => {
        const emitSpy = spyOn(component.racialDetallesPorNombre, 'emit');
        component.abrirDetalleRacial(component.raza.Raciales[0]);
        expect(emitSpy).toHaveBeenCalledWith({
            id: 7,
            nombre: 'Sangre antigua',
        });
    });

    it('lista raciales visibles ordenadas por nombre', () => {
        const nombres = component.getRacialesActivos().map(r => r.Nombre);
        expect(nombres).toEqual(['Sangre antigua', 'Vision en la oscuridad']);
    });

    it('tieneNumeroNoCero oculta 0 aunque venga como string', () => {
        expect(component.tieneNumeroNoCero(0)).toBeFalse();
        expect(component.tieneNumeroNoCero('0')).toBeFalse();
        expect(component.tieneNumeroNoCero(1)).toBeTrue();
    });

    it('renderiza el aviso de elección única en grupos opcionales', () => {
        component.raza.Raciales = [
            { ...createRacialPlaceholder('Linaje de plata', 21), Opcional: 1 } as any,
            { ...createRacialPlaceholder('Linaje de bronce', 22), Opcional: 1 } as any,
            { ...createRacialPlaceholder('Vision en la oscuridad', 23), Opcional: 0 } as any,
        ];

        fixture.detectChanges();
        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Solo podrás elegir una de estas raciales');
    });

    it('no renderiza el aviso para raciales obligatorias', () => {
        component.raza.Raciales = [
            { ...createRacialPlaceholder('Vision en penumbra', 30), Opcional: 0 } as any,
        ];

        fixture.detectChanges();
        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('Solo podrás elegir una de estas raciales');
    });
});
