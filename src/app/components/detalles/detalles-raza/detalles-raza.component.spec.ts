import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { Raza } from 'src/app/interfaces/raza';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { createRacialPlaceholder } from 'src/app/services/utils/racial-mapper';
import { DetallesRazaComponent } from './detalles-raza.component';

function crearRazaMock(extra: Partial<Raza> = {}): Raza {
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
        Habilidades: { Base: [], Custom: [] },
        DotesContextuales: [],
        ...extra,
    } as unknown as Raza;
}

describe('DetallesRazaComponent', () => {
    let component: DetallesRazaComponent;
    let fixture: ComponentFixture<DetallesRazaComponent>;
    let manualNav: jasmine.SpyObj<ManualDetalleNavigationService>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const texto = (): string => `${elemento().textContent ?? ''}`.replace(/\s+/g, ' ');
    const titulos = (): string[] =>
        Array.from(elemento().querySelectorAll('.ficha-titulo')).map((t) => `${t.textContent ?? ''}`.trim());
    const etiquetasDatos = (): string[] =>
        Array.from(elemento().querySelectorAll('.ficha-dato__etiqueta')).map((dt) => `${dt.textContent ?? ''}`.trim());
    const valorDato = (etiqueta: string): string | undefined => {
        const dato = Array.from(elemento().querySelectorAll('.ficha-dato'))
            .find((d) => `${d.querySelector('dt')?.textContent ?? ''}`.trim() === etiqueta);
        return dato ? `${dato.querySelector('dd')?.textContent ?? ''}`.replace(/\s+/g, ' ').trim() : undefined;
    };
    /** Las filas de las listas de pares, cada nodo de la celda por separado (el nombre y su nota van en líneas distintas). */
    const filasPares = (): string[][] => Array.from(elemento().querySelectorAll('.ficha-pares tr'))
        .map((fila) => Array.from(fila.querySelectorAll('td')).map((td) => Array.from(td.childNodes)
            .filter((nodo) => nodo.nodeType !== Node.COMMENT_NODE)
            .map((nodo) => `${nodo.textContent ?? ''}`.trim()).filter(Boolean).join(' ')));
    const enlace = (nombre: string): HTMLButtonElement =>
        Array.from(elemento().querySelectorAll('button.ficha-enlace'))
            .find((b) => `${b.textContent ?? ''}`.trim() === nombre) as HTMLButtonElement;

    function pintar(extra: Partial<Raza> = {}): void {
        component.raza = crearRazaMock(extra);
        fixture.detectChanges();
    }

    beforeEach(async () => {
        manualNav = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        await TestBed.configureTestingModule({
            declarations: [DetallesRazaComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNav }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesRazaComponent);
        component = fixture.componentInstance;
        pintar({
            Raciales: [
                createRacialPlaceholder('Vision en la oscuridad', 3),
                createRacialPlaceholder('Sangre antigua', 7),
            ],
        });
    });

    it('enseña la cabecera con el tamaño y el tipo, y el manual lleva a su detalle', () => {
        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Raza · Mediano · Humanoide');
        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Elfo');
        (elemento().querySelector('.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith('Manual base');
        expect(elemento().querySelector('mat-chip')).toBeNull();
        expect(elemento().querySelector('mat-expansion-panel')).toBeNull();
    });

    it('enseña los datos clave y no los que valen 0 o no vienen', () => {
        expect(etiquetasDatos()).toEqual(['Clase predilecta', 'Alineamiento', 'Altura', 'Peso', 'Espacio', 'Alcance', 'Correr']);
        expect(valorDato('Clase predilecta')).toBe('Mago');
        expect(valorDato('Alineamiento')).toBe('Neutral bueno (Tendencia legal/Tendencia buena)');
        expect(valorDato('Altura')).toBe('1.4 - 1.9 m');
        expect(valorDato('Peso')).toBe('45 - 90 kg');
        expect(valorDato('Correr')).toBe("30'");
    });

    it('la clase predilecta en minúscula se enseña con la primera letra en mayúscula', () => {
        pintar({ Clase_predilecta: 'explorador', Ajuste_nivel: 2, Armadura_natural: 1, Varios_armadura: -1 });
        expect(valorDato('Clase predilecta')).toBe('Explorador');
        expect(valorDato('Ajuste de nivel')).toBe('+2');
        expect(valorDato('Armadura natural')).toBe('+1');
        expect(valorDato('CA varios')).toBe('-1');
    });

    it('enseña los modificadores distintos de 0 y las edades en listas siempre a la vista', () => {
        pintar({ Modificadores: { Fuerza: 0, Destreza: 2, Constitucion: -2, Inteligencia: 0, Sabiduria: 0, Carisma: 0 } });
        expect(titulos()).toEqual(['Modificadores de característica', 'Edades']);
        expect(filasPares()).toEqual([
            ['Destreza', '+2'], ['Constitución', '-2'],
            ['Adulto', '20 años'], ['Mediana', '60 años'], ['Viejo', '120 años'], ['Venerable', '180 años'],
        ]);
    });

    it('lista las raciales ordenadas por nombre y cada una abre su detalle', () => {
        expect(component.getRacialesActivos().map((r) => r.Nombre)).toEqual(['Sangre antigua', 'Vision en la oscuridad']);
        const emitSpy = spyOn(component.racialDetallesPorNombre, 'emit');
        enlace('Sangre antigua').click();
        expect(emitSpy).toHaveBeenCalledWith({ id: 7, nombre: 'Sangre antigua' });
    });

    it('enseña el aviso de elección única solo en los grupos opcionales', () => {
        expect(texto()).not.toContain('Solo podrás elegir una de estas raciales');

        pintar({
            Raciales: [
                { ...createRacialPlaceholder('Linaje de plata', 21), Opcional: 1 } as any,
                { ...createRacialPlaceholder('Linaje de bronce', 22), Opcional: 1 } as any,
                { ...createRacialPlaceholder('Vision en la oscuridad', 23), Opcional: 0 } as any,
            ],
        });
        expect(texto()).toContain('Grupo de opciones 1');
        expect(texto()).toContain('Solo podrás elegir una de estas raciales');
    });

    it('los subtipos son enlaces a su detalle', () => {
        pintar({ Subtipos: [{ Id: 4, Nombre: 'Elfo' } as any] });
        const spy = spyOn(component.subtipoDetalles, 'emit');
        enlace('Elfo').click();
        expect(spy).toHaveBeenCalledWith({ Id: 4, Nombre: 'Elfo' });
    });

    it('tieneNumeroNoCero oculta 0 aunque venga como string', () => {
        expect(component.tieneNumeroNoCero(0)).toBeFalse();
        expect(component.tieneNumeroNoCero('0')).toBeFalse();
        expect(component.tieneNumeroNoCero(1)).toBeTrue();
    });

    it('normaliza habilidades otorgadas y suma duplicados por id', () => {
        pintar({
            Habilidades: {
                Base: [
                    { Id_habilidad: 1, Habilidad: 'Avistar', Cantidad: 2, Varios: 'Raza' } as any,
                    { Id_habilidad: 1, Habilidad: 'Avistar', Cantidad: 1, Varios: 'Raza' } as any,
                ],
                Custom: [],
            },
        });

        expect(component.habilidadesBase.length).toBe(1);
        expect(component.habilidadesBase[0].Habilidad).toBe('Avistar');
        expect(component.habilidadesBase[0].Cantidad).toBe(3);
        expect(filasPares()).toContain(['Avistar Raza', '+3']);
    });

    it('enseña las habilidades otorgadas, base y custom, con su extra', () => {
        pintar({
            Habilidades: {
                Base: [{ Id_habilidad: 1, Habilidad: 'Avistar', Id_extra: 0, Extra: 'Elegir', Cantidad: 2, Varios: '' } as any],
                Custom: [{ Id_habilidad: 99, Habilidad: 'Navegar astral', Cantidad: 1 } as any],
            },
        });

        expect(titulos()).toContain('Habilidades otorgadas');
        expect(texto()).toContain('Base');
        expect(texto()).toContain('Custom');
        expect(filasPares()).toContain(['Avistar (Elegir)', '+2']);
        expect(filasPares()).toContain(['Navegar astral', '+1']);
    });

    it('muestra "Elegir" en habilidades tipo Saber con extra vacío si soporta extra', () => {
        pintar({
            Habilidades: {
                Base: [{ Id_habilidad: 23, Habilidad: 'Saber 1', Soporta_extra: true, Id_extra: 0, Extra: '', Cantidad: 1, Varios: '' } as any],
                Custom: [],
            },
        });
        expect(texto()).toContain('Saber 1 (Elegir)');
    });

    it('no muestra "Elegir" cuando Id_extra es -1', () => {
        pintar({
            Habilidades: {
                Base: [{ Id_habilidad: 23, Habilidad: 'Saber 1', Soporta_extra: true, Id_extra: -1, Extra: 'Elegir', Cantidad: 1, Varios: '' } as any],
                Custom: [],
            },
        });
        expect(texto()).toContain('Saber 1');
        expect(component.getExtraVisibleHabilidad(component.habilidadesBase[0])).toBe('');
        expect(texto()).not.toContain('Elegir');
    });

    it('enseña los dados de golpe adicionales y las sortílegas en su tabla', () => {
        pintar({
            Dgs_adicionales: {
                Cantidad: 2, Dado: 'd8', Tipo_criatura: 'Humanoide monstruoso', Ataque_base: 2, Dotes_extra: 1,
                Puntos_habilidad: 5, Multiplicador_puntos_habilidad: 4, Fortaleza: 0, Reflejos: 3, Voluntad: 3,
            },
            Sortilegas: [{ Conjuro: { Id: 1, Nombre: 'Luces danzantes' } as any, Nivel_lanzador: 3, Usos_diarios: '1/día', Descripcion: '', Dgs_necesarios: 0, Origen: '' }],
        });

        expect(valorDato('Dados de golpe')).toBe('+2d8 de Humanoide monstruoso');
        expect(valorDato('Ataque base')).toBe('+2');
        expect(valorDato('Fortaleza')).toBe('+0');
        expect(valorDato('Multiplicador')).toBe('x4');
        const cabecera = Array.from(elemento().querySelectorAll('.ficha-tabla th')).map((th) => `${th.textContent ?? ''}`.trim());
        expect(cabecera).toEqual(['Conjuro', 'Nivel de lanzador', 'Usos']);
        expect(texto()).toContain('Luces danzantes');
    });

    it('enseña el alineamiento parcial cuando falta el básico', () => {
        pintar({
            Alineamiento: {
                Ley: { Nombre: 'Siempre legal' },
                Moral: { Nombre: 'Casi siempre maligno' },
            } as any,
        });
        expect(valorDato('Alineamiento')).toBe('Siempre legal/Casi siempre maligno');
    });

    it('oculta el alineamiento cuando no hay datos visibles', () => {
        pintar({
            Alineamiento: {
                Basico: { Nombre: 'No aplica' },
                Ley: { Nombre: '-' },
                Moral: { Nombre: '' },
            } as any,
        });
        expect(etiquetasDatos()).not.toContain('Alineamiento');
    });

    it('la maniobrabilidad abre sus reglas cuando la raza vuela', () => {
        pintar({
            Volar: 40,
            Maniobrabilidad: {
                Nombre: 'Regular',
                Velocidad_avance: 'Mitad',
                Flotar: 0,
                Volar_atras: 0,
                Contramarcha: 0,
                Giro: '45 grados',
                Rotacion: '45 grados',
                Giro_max: '90 grados',
                Angulo_ascenso: '60 grados',
                Velocidad_ascenso: 'Mitad',
                Angulo_descenso: 'Cualquiera',
                Descenso_ascenso: 1,
            } as any,
        });

        expect(component.mostrarManiobrabilidad()).toBeTrue();
        enlace('Regular').click();

        const secciones = JSON.stringify(component.getManiobrabilidadInfoSecciones());
        expect(component.mostrarInfoManiobrabilidad).toBeTrue();
        expect(secciones).toContain('Regular');
        expect(secciones).toContain('Velocidad de avance: Mitad.');
    });
});
