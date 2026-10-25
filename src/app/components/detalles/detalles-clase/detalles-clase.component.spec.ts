import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { Clase, ClaseNivelDetalle } from 'src/app/interfaces/clase';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesClaseComponent } from './detalles-clase.component';

function crearClaseMock(partial?: Partial<Clase>): Clase {
    return {
        Id: 1,
        Nombre: 'Clase test',
        Descripcion: 'Descripcion',
        Manual: { Id: 1, Nombre: 'Manual', Pagina: 10 },
        Tipo_dado: { Id: 1, Nombre: 'd8' },
        Puntos_habilidad: { Id: 1, Valor: 2 },
        Nivel_max_claseo: 20,
        Mod_salv_conjuros: '',
        Conjuros: {
            Dependientes_alineamiento: false,
            Divinos: false,
            Arcanos: false,
            Psionicos: false,
            Alma: false,
            Conocidos_total: false,
            Conocidos_nivel_a_nivel: false,
            Dominio: false,
            puede_elegir_especialidad: false,
            Lanzamiento_espontaneo: false,
            Clase_origen: { Id: 0, Nombre: '' },
            Listado: [],
        },
        Roles: { Dps: false, Tanque: false, Support: false, Utilidad: false },
        Aumenta_clase_lanzadora: false,
        Es_predilecta: false,
        Prestigio: false,
        Tiene_prerrequisitos: false,
        Alineamiento: {
            Id: 0,
            Basico: { Id_basico: 0, Nombre: 'No aplica' },
            Ley: { Id_ley: 0, Nombre: 'No aplica' },
            Moral: { Id_moral: 0, Nombre: 'No aplica' },
            Prioridad: { Id_prioridad: 0, Nombre: 'No aplica' },
            Descripcion: '',
        },
        Oficial: true,
        Competencias: { Armas: [], Armaduras: [], Grupos_arma: [], Grupos_armadura: [] },
        Habilidades: { Base: [], Custom: [] },
        Idiomas: [],
        Desglose_niveles: [{
            Nivel: 1,
            Ataque_base: '+0',
            Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' },
            Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
            Reserva_psionica: 0,
            Aumentos_clase_lanzadora: [],
            Conjuros_diarios: {},
            Conjuros_conocidos_nivel_a_nivel: {},
            Conjuros_conocidos_total: 0,
            Dotes: [],
            Especiales: [],
        }],
        Prerrequisitos_flags: {},
        Prerrequisitos: {
            subtipo: [],
            caracteristica: [],
            dg: [],
            dominio: [],
            nivel_escuela: [],
            ataque_base: [],
            reserva_psionica: [],
            lanzar_poder_psionico_nivel: [],
            conocer_poder_psionico: [],
            genero: [],
            competencia_arma: [],
            competencia_armadura: [],
            competencia_grupo_arma: [],
            competencia_grupo_armadura: [],
            dote_elegida: [],
            rangos_habilidad: [],
            idioma: [],
            alineamiento_requerido: [],
            alineamiento_prohibido: [],
            actitud_requerido: [],
            actitud_prohibido: [],
            lanzador_arcano: [],
            lanzador_divino: [],
            lanzar_conjuros_arcanos_nivel: [],
            lanzar_conjuros_divinos_nivel: [],
            conjuro_conocido: [],
            aptitud_especial: [],
            clase_especial: [],
            tamano_maximo: [],
            tamano_minimo: [],
            raza: [],
            no_raza: [],
        },
        ...partial,
    };
}

describe('DetallesClaseComponent', () => {
    let component: DetallesClaseComponent;
    let fixture: ComponentFixture<DetallesClaseComponent>;
    let manualNav: { abrirDetalleManual: jasmine.Spy };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const texto = (): string => `${elemento().textContent ?? ''}`.replace(/\s+/g, ' ');
    const titulos = (): string[] =>
        Array.from(elemento().querySelectorAll('.ficha-titulo')).map((t) => `${t.textContent ?? ''}`.trim());
    const valorDato = (etiqueta: string): string | undefined => {
        const dato = Array.from(elemento().querySelectorAll('.ficha-dato'))
            .find((d) => `${d.querySelector('dt')?.textContent ?? ''}`.trim() === etiqueta);
        return dato ? `${dato.querySelector('dd')?.textContent ?? ''}`.replace(/\s+/g, ' ').trim() : undefined;
    };
    const enlace = (nombre: string): HTMLButtonElement =>
        Array.from(elemento().querySelectorAll('button.ficha-enlace'))
            .find((b) => `${b.textContent ?? ''}`.trim() === nombre) as HTMLButtonElement;
    /** Las celdas de la tabla de progresión (`tabla` 0) o del listado de conjuros (1). */
    const celdas = (tabla: number, selector: string): string[][] =>
        Array.from(elemento().querySelectorAll('table.ficha-tabla')[tabla]?.querySelectorAll(`${selector} tr`) ?? [])
            .map((fila) => Array.from(fila.querySelectorAll('th, td')).map((c) => `${c.textContent ?? ''}`.replace(/\s+/g, ' ').trim()));

    function nivel(nivelClase: number, extra: Partial<ClaseNivelDetalle> = {}): ClaseNivelDetalle {
        return {
            Nivel: nivelClase,
            Ataque_base: `+${nivelClase}`,
            Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
            Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
            Reserva_psionica: 0,
            Aumentos_clase_lanzadora: [],
            Conjuros_diarios: {},
            Conjuros_conocidos_nivel_a_nivel: {},
            Conjuros_conocidos_total: 0,
            Dotes: [],
            Especiales: [],
            ...extra,
        };
    }

    beforeEach(async () => {
        manualNav = { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') };
        await TestBed.configureTestingModule({
            declarations: [DetallesClaseComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [{
                provide: ManualDetalleNavigationService,
                useValue: manualNav,
            }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesClaseComponent);
        component = fixture.componentInstance;
    });

    it('muestra la columna de nivel max poder accesible cuando hay datos psionicos', () => {
        component.clase = crearClaseMock({
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: 7,
                Reserva_psionica: 3,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        fixture.detectChanges();

        const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(component.mostrarNivelMaxPoderAccesible).toBeTrue();
        expect(texto).toContain('Nivel máx. de poder accesible');
        expect(texto).toContain('7');
    });

    it('oculta la columna de nivel max poder accesible cuando no hay datos psionicos', () => {
        component.clase = crearClaseMock({
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        fixture.detectChanges();

        const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(component.mostrarNivelMaxPoderAccesible).toBeFalse();
        expect(texto).not.toContain('Nivel máx. de poder accesible');
    });

    it('enseña la aptitud especial con su frase, como los demás prerrequisitos', () => {
        component.clase = crearClaseMock({
            Prerrequisitos: {
                ...crearClaseMock().Prerrequisitos,
                aptitud_especial: [{ Id_aptitud_especial: 13, Aptitud_especial: 'Arma de aliento', Raciales: [], Especiales: [], Plantillas: [{ Id: 6, Nombre: 'Semidragón' }], Dotes: [], Opcional: 0, Frase: 'Arma de aliento' }],
                competencia_arma: [{ Id_arma: 8, Arma: 'Alabarda', Opcional: 0, Frase: 'Competencia con alabarda' }],
            },
        });

        const frases = component.prerrequisitosAgrupados.flatMap((grupo) => grupo.condiciones.map((c) => c.frase));
        expect(frases).toContain('Arma de aliento');
        expect(frases).toContain('Competencia con alabarda');
    });

    it('enseña la frase de cada prerrequisito y agrupa los alineamientos alternativos', () => {
        component.clase = crearClaseMock({
            Prerrequisitos_flags: { dote_elegida: true, alineamiento_requerido: true },
            Prerrequisitos: {
                ...crearClaseMock().Prerrequisitos,
                dote_elegida: [{
                    Id_dote_prerrequisito: 27, Dote_prerrequisito: 'Soltura con una escuela de magia', Id_extra: 0, Extra: null,
                    Extra_comodin: 'cualquiera', Repetido: 1, Opcional: 0, Frase: 'Soltura con una escuela de magia (cualquier escuela)',
                }],
                alineamiento_requerido: [
                    { Id_alineamiento: 4, Alineamiento_basico: 'Neutral bueno', Opcional: 1, Frase: 'Neutral bueno' },
                    { Id_alineamiento: 1, Alineamiento_basico: 'Legal bueno', Opcional: 1, Frase: 'Legal bueno' },
                ],
            },
        });
        fixture.detectChanges();

        const grupos = component.prerrequisitosAgrupados;
        expect(grupos.map((grupo) => grupo.titulo)).toEqual(['Obligatorios', 'Elección A']);
        expect(grupos[0].condiciones.map((c) => c.frase)).toEqual(['Soltura con una escuela de magia (cualquier escuela)']);
        expect(grupos[1].condiciones.map((c) => c.frase)).toEqual(['Neutral bueno', 'Legal bueno']);
    });

    it('separa el extra de especial en subchip y navega por nombre cuando falta id', () => {
        component.clase = crearClaseMock({
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [{
                    Especial: { Nombre: 'Dote adicional' },
                    Nivel: 1,
                    Id_extra: -1,
                    Extra: 'Guerrero',
                    Opcional: 0,
                    Id_interno: 0,
                    Id_especial_requerido: 0,
                    Id_dote_requerida: 0,
                }],
            }],
        });

        const resumen = component.getResumenEspeciales(component.filasNivel[0]);
        const especial = resumen.find(item => item.tipo === 'especial');
        expect(especial).toBeTruthy();
        expect(especial?.texto).toBe('Dote adicional');
        expect(especial?.extras).toEqual(['Guerrero']);
        expect(especial?.clicable).toBeTrue();

        const especialNombreSpy = spyOn(component.especialDetallesPorNombre, 'emit');
        component.abrirDetalleEspecialFila(especial!);
        expect(especialNombreSpy).toHaveBeenCalledWith('Dote adicional');
    });

    it('navega por nombre de dote cuando no hay id', () => {
        component.clase = crearClaseMock({
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [{
                    Dote: {
                        Id: 0,
                        Nombre: 'Ataque poderoso',
                        Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] },
                        Extras_soportados: { Extra_arma: 0, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0 },
                    } as any,
                    Nivel: 1,
                    Id_extra: -1,
                    Extra: 'No aplica',
                    Opcional: 0,
                    Id_interno: 0,
                    Id_especial_requerido: 0,
                    Id_dote_requerida: 0,
                }],
                Especiales: [],
            }],
        });

        const resumen = component.getResumenEspeciales(component.filasNivel[0]);
        const dote = resumen.find(item => item.tipo === 'dote');
        expect(dote).toBeTruthy();
        expect(dote?.texto).toBe('Ataque poderoso');
        expect(dote?.clicable).toBeTrue();

        const doteNombreSpy = spyOn(component.doteDetallesPorNombre, 'emit');
        component.abrirDetalleEspecialFila(dote!);
        expect(doteNombreSpy).toHaveBeenCalledWith('Ataque poderoso');
    });

    it('agrupa opciones opcionales en chip de grupo con subchips clicables', () => {
        component.clase = crearClaseMock({
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [
                    {
                        Especial: { Id: 1, Nombre: 'Talento latente' },
                        Nivel: 1,
                        Id_extra: -1,
                        Extra: 'No aplica',
                        Opcional: 1,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                    {
                        Especial: { Id: 2, Nombre: 'Dominio mental' },
                        Nivel: 1,
                        Id_extra: -1,
                        Extra: 'No aplica',
                        Opcional: 1,
                        Id_interno: 0,
                        Id_especial_requerido: 0,
                        Id_dote_requerida: 0,
                    },
                ],
            }],
        });

        const render = component.getRenderEspeciales(component.filasNivel[0]) as any[];
        expect(render.length).toBe(1);
        expect(render[0].tipoRender).toBe('grupo_opcional');
        expect(render[0].opciones.length).toBe(2);
    });

    it('emite detalle de arma desde competencia navegable', () => {
        component.clase = crearClaseMock({
            Competencias: {
                Armas: [{ Id_arma: 8, Nombre: 'Espada larga' }],
                Armaduras: [],
                Grupos_arma: [],
                Grupos_armadura: [],
            },
        });

        const spy = spyOn(component.armaDetallesId, 'emit');
        const item = component.getCompetenciasVisibles('Armas')[0];
        component.abrirDetalleCompetencia('Armas', item);

        expect(spy).toHaveBeenCalledWith(8);
    });

    it('emite detalle de armadura desde prerrequisito navegable', () => {
        component.clase = crearClaseMock({
            Prerrequisitos: {
                ...crearClaseMock().Prerrequisitos,
                competencia_armadura: [{ Id_armadura: 5, Armadura: 'Escudo pesado', Opcional: 0, Frase: 'Competencia con escudo pesado' }],
            },
        });

        const spy = spyOn(component.armaduraDetallesId, 'emit');
        const condicion = component.prerrequisitosAgrupados[0].condiciones[0];
        expect(component.esPrerrequisitoNavegable(condicion)).toBeTrue();
        component.abrirDetallePrerrequisito(condicion);

        expect(spy).toHaveBeenCalledWith(5);
    });

    it('enseña la cabecera, los datos clave y la descripción, sin pastillas ni acordeones', () => {
        component.clase = crearClaseMock({
            Nombre: 'explorador',
            Manual: { Id: 1, Nombre: 'Manual del jugador 1', Pagina: 47 },
            Tipo_dado: { Id: 3, Nombre: 'd8' },
            Puntos_habilidad: { Id: 6, Valor: 6 },
            Roles: { Dps: true, Tanque: false, Support: false, Utilidad: true },
            Aumenta_clase_lanzadora: true,
        });
        fixture.detectChanges();

        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Clase básica');
        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Explorador');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => e.textContent?.trim()))
            .toEqual(['Aumenta clase lanzadora', 'Oficial']);
        expect(valorDato('Dado de golpe')).toBe('d8');
        expect(valorDato('Puntos de habilidad por nivel')).toBe('6 + mod. de Int');
        expect(valorDato('Niveles')).toBe('1 a 20');
        expect(valorDato('Roles')).toBe('DPS, Utilidad');
        expect(titulos()).toContain('Descripción');
        expect(elemento().querySelector('mat-chip')).toBeNull();
        expect(elemento().querySelector('mat-expansion-panel')).toBeNull();

        (elemento().querySelector('.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith({ id: 1, nombre: 'Manual del jugador 1' });
    });

    it('la clase de prestigio lo dice en la cabecera y no enseña los datos ni las listas vacías', () => {
        component.clase = crearClaseMock({ Prestigio: true, Descripcion: null as any, Tipo_dado: null as any, Nivel_max_claseo: 10 });
        fixture.detectChanges();

        expect(elemento().querySelector('.ficha-cabecera__tipo')?.textContent?.trim()).toBe('Clase de prestigio');
        expect(valorDato('Dado de golpe')).toBeUndefined();
        expect(valorDato('Roles')).toBeUndefined();
        expect(titulos()).toEqual(['Progresión por nivel']);
    });

    it('enseña las competencias en el cuerpo y las habilidades de clase a la vista', () => {
        component.clase = crearClaseMock({
            Competencias: {
                Armas: [{ Id: 8, Nombre: 'Espada larga' }],
                Armaduras: [{ Id: 2, Nombre: 'Cuero' }],
                Grupos_arma: [{ Id: 1, Nombre: 'Armas sencillas' }],
                Grupos_armadura: [],
            },
            Habilidades: {
                Base: [
                    { Id_habilidad: 5, Habilidad: 'Artesanía', Id_extra: 0, Extra: null, Varios: null },
                    { Id_habilidad: 9, Habilidad: 'Escuchar', Id_extra: -1, Extra: null, Varios: null },
                ],
                Custom: [],
            },
        });
        fixture.detectChanges();

        expect(titulos()).toEqual(['Descripción', 'Competencias', 'Habilidades de clase', 'Progresión por nivel']);
        expect(texto()).toContain('Armas sencillas');
        expect(texto()).toContain('Artesanía (Elegir)');
        expect(texto()).toContain('Escuchar');
        expect(texto()).not.toContain('Custom');

        const armaSpy = spyOn(component.armaDetallesId, 'emit');
        const armaduraSpy = spyOn(component.armaduraDetallesId, 'emit');
        enlace('Espada larga').click();
        enlace('Cuero').click();
        expect(armaSpy).toHaveBeenCalledWith(8);
        expect(armaduraSpy).toHaveBeenCalledWith(2);
    });

    it('enseña la progresión a lo ancho, con las salvaciones en columnas y los especiales como texto', () => {
        component.clase = crearClaseMock({
            Nivel_max_claseo: 2,
            Desglose_niveles: [
                nivel(1, {
                    Especiales: [{ Especial: { Id: 4, Nombre: 'Furia' }, Nivel: 1, Id_extra: null, Extra: '', Opcional: 0, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 }],
                    Dotes: [{ Dote: { Id: 7, Nombre: 'Soltura con un arma' } as any, Nivel: 1, Id_extra: 3, Extra: 'Hacha', Opcional: 0, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 }],
                }),
                nivel(2),
            ],
        });
        fixture.detectChanges();

        expect(celdas(0, 'thead')).toEqual([['Nivel', 'Ataque base', 'Fort', 'Ref', 'Vol', 'Especiales']]);
        expect(celdas(0, 'tbody')).toEqual([
            ['1.º', '+1', '+2', '+0', '+0', 'Furia, Soltura con un arma (Hacha)'],
            ['2.º', '+2', '+2', '+0', '+0', ''],
        ]);

        const especialSpy = spyOn(component.especialDetalles, 'emit');
        const doteSpy = spyOn(component.doteDetalles, 'emit');
        enlace('Furia').click();
        enlace('Soltura con un arma (Hacha)').click();
        expect(especialSpy).toHaveBeenCalledWith(4);
        expect(doteSpy).toHaveBeenCalledWith(7);
    });

    it('enseña las opciones de un nivel como «Elige entre … o …»', () => {
        component.clase = crearClaseMock({
            Nivel_max_claseo: 1,
            Desglose_niveles: [nivel(1, {
                Especiales: [
                    { Especial: { Id: 1, Nombre: 'Talento latente' }, Nivel: 1, Id_extra: null, Extra: '', Opcional: 1, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                    { Especial: { Id: 2, Nombre: 'Dominio mental' }, Nivel: 1, Id_extra: null, Extra: '', Opcional: 1, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                ],
            })],
        });
        fixture.detectChanges();

        expect(celdas(0, 'tbody')[0][5]).toBe('Elige entre Talento latente o Dominio mental');
    });

    it('enseña los conjuros diarios bajo una cabecera común y el listado de conjuros por nivel', () => {
        component.clase = crearClaseMock({
            Nivel_max_claseo: 1,
            Mod_salv_conjuros: 'Inteligencia',
            Conjuros: {
                ...crearClaseMock().Conjuros,
                Arcanos: true,
                Listado: [
                    { Id: 11, Nombre: 'Luz', Nivel: 0, Espontaneo: false },
                    { Id: 12, Nombre: 'Proyectil mágico', Nivel: 1, Espontaneo: true },
                    { Id: 13, Nombre: 'Escudo', Nivel: 1, Espontaneo: false },
                ],
            },
            Desglose_niveles: [nivel(1, { Conjuros_diarios: { Nivel_0: 3, Nivel_1: 1, Nivel_2: -1 } })],
        });
        fixture.detectChanges();

        expect(celdas(0, 'thead')).toEqual([
            ['Nivel', 'Ataque base', 'Fort', 'Ref', 'Vol', 'Conjuros diarios'],
            ['Truco', '1'],
        ]);
        expect(celdas(0, 'tbody')).toEqual([['1.º', '+1', '+2', '+0', '+0', '3', '1']]);
        expect(titulos()).toContain('Lanzamiento de conjuros');
        expect(texto()).toContain('Arcanos');
        expect(valorDato('Salvación de conjuros')).toBe('Inteligencia');
        expect(celdas(1, 'tbody')).toEqual([
            ['Truco', 'Luz'],
            ['1', 'Proyectil mágico (espontáneo), Escudo'],
        ]);

        const spy = spyOn(component.conjuroDetalles, 'emit');
        enlace('Proyectil mágico').click();
        expect(spy).toHaveBeenCalledWith(12);
    });

    it('enseña el prerrequisito «flag» detrás de los grupos y las competencias pedidas como enlaces', () => {
        component.clase = crearClaseMock({
            Prerrequisitos_flags: { habilidad_clase: true },
            Prerrequisitos: {
                ...crearClaseMock().Prerrequisitos,
                competencia_armadura: [{ Id_armadura: 5, Armadura: 'Escudo pesado', Opcional: 0, Frase: 'Competencia con escudo pesado' }],
            },
        });
        fixture.detectChanges();

        expect(titulos()).toContain('Prerrequisitos');
        expect(texto()).toContain('Habilidad de clase');
        const spy = spyOn(component.armaduraDetallesId, 'emit');
        enlace('Competencia con escudo pesado').click();
        expect(spy).toHaveBeenCalledWith(5);
    });
});
