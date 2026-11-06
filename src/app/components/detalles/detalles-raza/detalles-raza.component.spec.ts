import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { Raza } from 'src/app/interfaces/raza';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { createRacialPlaceholder } from 'src/app/services/utils/racial-mapper';
import { DetallesRazaComponent } from './detalles-raza.component';
import { lectorFicha, limpio } from 'src/testing/ficha-detalle';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { normalizeRazaApi } from 'src/app/services/utils/raza-mapper';
import { categoriasEdadContrato, razaPorEdadesApi, razaPorEdadesEnPasoApi } from 'src/testing/raza-por-edades';

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
        Excavar: 0,
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
    let usuario: { can: jasmine.Spy };
    let navegacion: { abrir: jasmine.Spy };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, etiquetasDatos, valor, filasPares, enlace, lateral, seccion, etiquetasCabecera, bloque, textos } = lectorFicha(elemento);

    function pintar(extra: Partial<Raza> = {}): void {
        component.raza = crearRazaMock(extra);
        fixture.detectChanges();
    }

    beforeEach(async () => {
        manualNav = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        usuario = { can: jasmine.createSpy('can').and.returnValue(false) };
        navegacion = { abrir: jasmine.createSpy('abrir') };
        await TestBed.configureTestingModule({
            declarations: [DetallesRazaComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [
                { provide: ManualDetalleNavigationService, useValue: manualNav },
                { provide: UserService, useValue: usuario },
                { provide: NavegacionRolService, useValue: navegacion },
            ],
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
        expect(valor('Clase predilecta')).toBe('Mago');
        expect(valor('Alineamiento')).toBe('Neutral bueno');
        expect(valor('Altura')).toBe('1.4 - 1.9 m');
        expect(valor('Peso')).toBe('45 - 90 kg');
        expect(valor('Correr')).toBe("30'");
    });

    it('la clase predilecta en minúscula se enseña con la primera letra en mayúscula', () => {
        pintar({ Clase_predilecta: 'explorador', Ajuste_nivel: 2, Armadura_natural: 1, Varios_armadura: -1 });
        expect(valor('Clase predilecta')).toBe('Explorador');
        expect(valor('Ajuste de nivel')).toBe('+2');
        expect(valor('Armadura natural')).toBe('+1');
        expect(valor('CA varios')).toBe('-1');
    });

    it('enseña la dote adicional y los puntos de habilidad extra de la raza (el humano)', () => {
        pintar({ Dotes_adicionales: 1, Puntos_habilidad_extra_primer_nivel: 4, Puntos_habilidad_extra_por_nivel: 1 });
        expect(valor('Dotes adicionales')).toBe('1');
        expect(valor('Puntos de habilidad extra')).toBe('4 en el primer nivel y 1 por nivel');

        pintar({ Dotes_adicionales: 1, Puntos_habilidad_extra_primer_nivel: 0, Puntos_habilidad_extra_por_nivel: 0 });
        expect(etiquetasDatos()).not.toContain('Puntos de habilidad extra');
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

        expect(valor('Dados de golpe')).toBe('+2d8 de Humanoide monstruoso');
        expect(valor('Ataque base')).toBe('+2');
        expect(valor('Fortaleza')).toBe('+0');
        expect(valor('Multiplicador')).toBe('x4');
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
        expect(valor('Alineamiento')).toBe('Siempre legal, casi siempre maligno');
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

    it('enseña los ataques naturales, las defensas y si es mutada', () => {
        pintar({
            Ataques_naturales: 'Mordisco (1d8) y golpetazo (1d4).',
            Reduccion_dano: '10/maligna',
            Resistencia_magica: '16 + niveles de clase',
            Resistencia_energia: '',
            Mutada: true,
            Tamano_mutacion_dependiente: true,
        });

        expect(etiquetasCabecera()).toEqual(['Mutada', 'Tamaño según la mutación', 'Oficial']);
        expect(limpio(seccion('Ataques naturales')?.querySelector('app-texto-manual'))).toBe('Mordisco (1d8) y golpetazo (1d4).');
        expect(valor('Reducción de daño')).toBe('10/maligna');
        expect(valor('Resistencia a conjuros')).toBe('16 + niveles de clase');
        expect(valor('Resistencia elemental')).toBeNull();
    });

    it('enseña las armas naturales como dato, con la frase de la API, en lugar del texto', () => {
        pintar({
            Ataques_naturales: '2 garras (1d6), mordisco (1d6)',
            Armas_naturales: [
                { Id_arma_natural: 2, Arma_natural: 'Garra', Cantidad: 2, Dano: '1d6', Primaria: true, Texto: '2 garras 1d6' },
                { Id_arma_natural: 1, Arma_natural: 'Mordisco', Cantidad: 1, Dano: '1d6', Primaria: false, Texto: 'Mordisco 1d6 (ataque secundario)' },
            ],
        });

        const ataques = seccion('Ataques naturales');
        expect(Array.from(ataques?.querySelectorAll('.ficha-lista__item') ?? []).map((item) => limpio(item)))
            .toEqual(['2 garras 1d6', 'Mordisco 1d6 (ataque secundario)']);
        expect(ataques?.querySelector('app-texto-manual')).toBeNull();
    });

    it('enseña la descripción de la raza, con sus párrafos, antes de los ataques naturales', () => {
        pintar({
            Descripcion: 'Los goliats viven en las cumbres.\n\nCompiten en todo.',
            Ataques_naturales: 'Mordisco (1d6).',
        });

        expect(titulos().slice(0, 2)).toEqual(['Descripción', 'Ataques naturales']);
        expect(seccion('Descripción')?.querySelectorAll('app-texto-manual p').length).toBe(2);
        expect(texto()).toContain('Compiten en todo.');
    });

    it('sin descripción no pinta la sección', () => {
        pintar({ Descripcion: '' });

        expect(titulos()).not.toContain('Descripción');
    });

    it('una raza traducida lleva la etiqueta «Traducido» y su nombre original', () => {
        pintar({ Nombre: 'Goliat', Nombre_original: 'Goliath', Traducido: true });

        expect(etiquetasCabecera()).toEqual(['Traducido', 'Oficial']);
        expect(valor('Nombre original')).toBe('Goliath');
    });

    it('sin traducción no hay etiqueta ni nombre original', () => {
        pintar({ Nombre_original: 'Elf', Traducido: false });

        expect(etiquetasCabecera()).toEqual(['Oficial']);
        expect(valor('Nombre original')).toBeNull();
    });

    it('enseña los prerrequisitos con su frase, las dotes y las plantillas por subtipo, enlazadas', () => {
        const doteSpy = spyOn(component.doteDetalles, 'emit');
        const plantillaSpy = spyOn(component.plantillaDetalles, 'emit');
        pintar({
            Prerrequisitos: {
                actitud_prohibido: [],
                actitud_requerido: [],
                alineamiento_prohibido: [],
                alineamiento_requerido: [],
                tipo_criatura: [{ id_tipo_criatura: 7, tipo_criatura: 'Dragón', opcional: 0, Frase: 'Criatura de tipo dragón' } as any],
            },
            DotesContextuales: [{ Dote: { Id: 9, Nombre: 'Alerta' }, Contexto: { Extra: '' } } as any],
            Plantillas_por_subtipo: [
                { Subtipo: { Id: 2, Nombre: 'Arconte' }, Plantillas: [{ Id: 1, Nombre: 'Celestial', Descripcion: 'Criaturas de los planos superiores.' }] },
                { Subtipo: { Id: 3, Nombre: 'Fuego' }, Plantillas: [] },
            ],
        });

        expect(titulos()).toContain('Prerrequisitos');
        expect(limpio(lateral('Prerrequisitos'))).toContain('Criatura de tipo dragón');
        expect(Array.from(lateral('Plantillas por subtipo')!.querySelectorAll('.ficha-subtitulo')).map((t) => limpio(t))).toEqual(['Arconte']);
        enlace('Celestial').click();
        enlace('Alerta').click();
        expect(plantillaSpy).toHaveBeenCalledWith(1);
        expect(doteSpy).toHaveBeenCalledWith(9);
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

    it('enseña el lápiz «Modificar» solo con permiso de razas y si alguien lo escucha', () => {
        expect(texto()).not.toContain('Modificar');

        const abiertas: Raza[] = [];
        component.modificar.subscribe((raza) => abiertas.push(raza));
        fixture.detectChanges();
        expect(texto()).not.toContain('Modificar');
        expect(usuario.can).toHaveBeenCalledWith('razas', 'create');

        usuario.can.and.returnValue(true);
        fixture.detectChanges();
        const lapiz = Array.from(elemento().querySelectorAll('button')).find((boton) => boton.textContent?.includes('Modificar'));
        expect(lapiz).toBeTruthy();
        lapiz!.click();
        expect(abiertas.map((raza) => raza.Id)).toEqual([component.raza.Id]);
    });

    describe('una raza que crece por edades (los dragones)', () => {
        /** El dragón del contrato con una sortílega en juvenil y la presencia pavorosa desde joven. */
        function dragon(): Raza {
            const categorias = categoriasEdadContrato();
            categorias[2].Raciales.push({ Id: 901, Nombre: 'Presencia pavorosa (dragón)', Valor: "150'", Caracteristica_cd: { Id: 6, Nombre: 'Carisma' } });
            categorias[3].Raciales.push({ Id: 901, Nombre: 'Presencia pavorosa (dragón)', Valor: "180'", Caracteristica_cd: { Id: 6, Nombre: 'Carisma' } });
            categorias[3].Sortilegas = [{ Conjuro: { Id: 55, Nombre: 'Localizar objeto' }, Usos_diarios: '1/día por categoría de edad', Descripcion: '' }];
            categorias[3].Rd = '5/mágica';
            return normalizeRazaApi(razaPorEdadesApi({
                co: 40,
                Categorias_edad: categorias,
                Lanzamiento: { Clase: { Id: 9, Nombre: 'Hechicero' }, Nivel: 0, Listas: [{ Tipo: 'clase', Id: 4, Nombre: 'Clérigo' }, { Tipo: 'dominio', Id: 2, Nombre: 'Aire' }] },
            }));
        }

        function tabla(titulo: string): { cabecera: string[]; filas: string[][]; } {
            const tarjeta = bloque(titulo);
            return {
                cabecera: textos('thead th', tarjeta),
                filas: Array.from(tarjeta?.querySelectorAll('tbody tr') ?? []).map((fila) => Array.from(fila.children).map((celda) => limpio(celda))),
            };
        }

        beforeEach(() => {
            component.raza = dragon();
            fixture.detectChanges();
        });

        it('dice que las cifras sueltas son las de la cría, en la cabecera, en cada dato y en los DG', () => {
            expect(limpio(elemento().querySelector('.ficha-cabecera__subtitulo'))).toBe('Crece por edades: las cifras sueltas son las de cría, su primera edad; las de cada edad, abajo, en «Por edad».');
            expect(valor('Ajuste de nivel')).toBe('+4 de cría');
            expect(valor('Correr')).toBe("40' de cría");
            expect(lateral('Dados de golpe adicionales · cría')).not.toBeNull();
            expect(lateral('Modificadores de característica · cría')).not.toBeNull();
            expect(lateral('Edades')).toBeNull();
        });

        it('la tabla por edad, con una columna por cada aptitud cuya cifra cambia y sin las columnas vacías', () => {
            const porEdad = tabla('Por edad');

            expect(porEdad.cabecera).toEqual(['Edad', 'Años', 'Tamaño', 'DG', 'CA natural', 'Arma de aliento', 'Presencia pavorosa', 'RD', 'Nivel de hechicero', 'Ajuste', 'VD']);
            expect(porEdad.filas[0]).toEqual(['Cría', '0–5', 'Mediano', '7', '+6', '2d10', '', '', '', '+4', '4']);
            expect(porEdad.filas[2]).toEqual(['Joven', '16–25', 'Grande', '13', '+12', '6d10', "150'", '', '1', '+6', '7']);
            expect(porEdad.filas[3]).toEqual(['Juvenil', '26–50', 'Grande', '16', '+15', '8d10', "180'", '5/mágica', '3', 'Solo PNJ', '10']);
            expect(bloque('Por edad')?.querySelector('abbr[title="Armadura natural"]')).not.toBeNull();
        });

        it('las características por edad con lo que suma la raza, y el movimiento y los ataques', () => {
            const caracteristicas = tabla('Características por edad');
            expect(caracteristicas.cabecera).toEqual(['Edad', 'FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR']);
            expect(caracteristicas.filas[0]).toEqual(['Cría', '21 (+11)', '10 (+0)', '15 (+4)', '10 (+0)', '11 (+0)', '10 (+0)']);

            const movimiento = tabla('Movimiento y ataques por edad');
            expect(movimiento.cabecera).toEqual(['Edad', 'Espacio / alcance', 'Velocidad', 'Ataques naturales', 'NL de las sortílegas']);
            expect(movimiento.filas[1]).toEqual(['Muy joven', "10' / 5'", "40', volar 150' (mala)", 'Mordisco 1d8, 2 garras 1d6', '2']);
        });

        it('lo que gana cada edad, una vez, con la característica de su CD y los usos, enlazado a su detalle', () => {
            const ganancias = tabla('Lo que gana cada edad');
            expect(ganancias.filas.map((fila) => fila[0])).toEqual(['Cría', 'Joven', 'Juvenil']);
            expect(ganancias.filas[0][1]).toBe('Arma de aliento · CD por Constitución');
            expect(ganancias.filas[1][1]).toBe('Presencia pavorosa (dragón) · CD por Carisma');
            expect(ganancias.filas[2]).toEqual(['Juvenil', '', 'Localizar objeto · 1/día por categoría de edad']);

            const racial = spyOn(component.racialDetallesPorNombre, 'emit');
            enlace('Presencia pavorosa (dragón)').click();
            expect(racial).toHaveBeenCalledWith({ id: 901, nombre: 'Presencia pavorosa (dragón)' });

            enlace('Localizar objeto').click();
            expect(navegacion.abrir).toHaveBeenCalledWith({
                clase: 'referencia-manual', referencia: { tipo: 'conjuro', id: 55, nombre: 'Localizar objeto', manualId: 0 },
            });
        });

        it('los pasos de edad, con el NEP o «Solo PNJ»', () => {
            const pasos = tabla('Pasos de edad al crear el personaje');
            expect(pasos.cabecera).toEqual(['Desde', 'Edad', 'DG', 'CA natural', 'Ajuste', 'NEP', 'VD']);
            expect(pasos.filas[0]).toEqual(['0 años', 'Cría', '7', '+6', '+4', '11', '4']);
            expect(pasos.filas[4]).toEqual(['26 años', 'Juvenil', '16', '+15', 'Solo PNJ', 'Solo PNJ', '10']);
        });

        it('el lanzamiento racial: la clase (enlazada), «el de su edad» y las listas de más', () => {
            expect(filasPares(lateral('Lanzamiento racial'))).toEqual([['Lanza como', 'Hechicero'], ['Nivel', 'El de su edad (en «Por edad»)']]);
            expect(limpio(lateral('Lanzamiento racial'))).toContain('También lanza como arcanos los conjuros de clérigo y del dominio de Aire.');

            enlace('Hechicero').click();
            expect(navegacion.abrir).toHaveBeenCalledWith({
                clase: 'referencia-manual', referencia: { tipo: 'clase', id: 9, nombre: 'Hechicero', manualId: 0 },
            });
        });

        it('resuelta a una edad (la vista previa de la creación), las cifras son las de esa edad', () => {
            component.raza = normalizeRazaApi(razaPorEdadesEnPasoApi(13));
            fixture.detectChanges();

            expect(limpio(elemento().querySelector('.ficha-cabecera__subtitulo'))).toBe('Crece por edades: las cifras son las de joven; las de cada edad, abajo, en «Por edad».');
            expect(valor('Ajuste de nivel')).toBe('+6 de joven');
            expect(filasPares(lateral('Lanzamiento racial'))).toContain(['Nivel', '1']);
        });
    });

    it('una raza sin edades que lanza como una clase (el rakshasa): su nivel, sin tablas por edad', () => {
        pintar({ Lanzamiento: { Clase: { Id: 8, Nombre: 'Hechicero' }, Nivel: 7, Listas: [] } } as Partial<Raza>);

        expect(filasPares(lateral('Lanzamiento racial'))).toEqual([['Lanza como', 'Hechicero'], ['Nivel', '7']]);
        expect(bloque('Por edad')).toBeNull();
        expect(bloque('Pasos de edad al crear el personaje')).toBeNull();
        expect(elemento().querySelector('.ficha-cabecera__subtitulo')).toBeNull();
        expect(valor('Correr')).toBe("30'");
        expect(lateral('Edades')).not.toBeNull();
    });
});
