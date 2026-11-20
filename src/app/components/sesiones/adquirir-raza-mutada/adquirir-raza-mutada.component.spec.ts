import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { RazaService } from 'src/app/services/raza.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { CampanaService } from 'src/app/services/campana.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DisciplinaConjurosService } from 'src/app/services/disciplina-conjuros.service';
import { DominioService } from 'src/app/services/dominio.service';
import { DoteService } from 'src/app/services/dote.service';
import { EnemigoPredilectoService } from 'src/app/services/enemigo-predilecto.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { normalizeRazaApi } from 'src/app/services/utils/raza-mapper';
import { MOTIVO_SIN_CONSTITUCION } from 'src/app/services/utils/conversion-muerto-viviente';
import { fichaSinElNivel } from 'src/app/services/utils/perder-nivel';
import { claseGuerrero, cuerpos, enanoGuerrero, ENGENDRO, GUERRERO, nivel, SUSTITUIDOS } from 'src/testing/conversion-muerto-viviente';
import { NACIDO_DEL_INFIERNO_SOBRE_HUMANO_API, PROLE_SOBRE_API, RAZAS_API } from 'src/testing/razas-mutadas-api';
import { AdquirirRazaMutadaComponent } from './adquirir-raza-mutada.component';

describe('AdquirirRazaMutadaComponent (adquirir una raza mutada, fase 7)', () => {
    let fixture: ComponentFixture<AdquirirRazaMutadaComponent>;
    let sesiones: jasmine.SpyObj<SesionesService>;
    let razas: jasmine.SpyObj<RazaService>;

    const PROLE = normalizeRazaApi(RAZAS_API['21']);
    const MEDIANO = normalizeRazaApi(RAZAS_API['5']);
    const NACIDO = normalizeRazaApi(NACIDO_DEL_INFIERNO_SOBRE_HUMANO_API);
    const HUMANOIDE = PROLE.Prerrequisitos['tipo_criatura'][0].Id_referencia!;

    const experiencia = (cambios: Record<string, unknown> = {}) => ({
        px: 10000, nivel: 5, pxNivelActual: 10000, pxSiguienteNivel: 15000, puedeSubir: false, nivelesPorSubir: 0,
        sesionAbierta: { numero: 3, titulo: 'Sesión 3' }, ...cambios,
    });

    async function crear(historial: Record<string, unknown>, motor: Partial<MotorDesdeFichaService> | null = null)
        : Promise<AdquirirRazaMutadaComponent> {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'sesion', 'adquirirRazaMutada']);
        sesiones.historial.and.resolveTo({ idPersonaje: 5, puedeApuntar: true, veNotas: true, sesiones: [], experiencia: experiencia(), ...historial } as any);
        razas = jasmine.createSpyObj<RazaService>('RazaService', ['getRazas', 'getModeloMutacion', 'getRazaSobreBase', 'comprobarRequisitosDelPersonaje']);
        await TestBed.configureTestingModule({
            imports: [AdquirirRazaMutadaComponent, NoopAnimationsModule],
            providers: [
                { provide: Auth, useValue: { currentUser: { uid: 'cuenta-a' } } },
                { provide: SesionesService, useValue: sesiones },
                { provide: RazaService, useValue: razas },
                { provide: PersonajeService, useValue: { consultaRequisitosMutacion: () => ({}) } },
                { provide: UserSettingsService, useValue: {} },
                { provide: SubidaNivelPuertaService, useValue: new SubidaNivelPuertaService() },
                { provide: NavegacionRolService, useValue: new NavegacionRolService() },
                ...(motor ? [{ provide: MotorDesdeFichaService, useValue: motor }] : []),
                ...[CampanaService, ClaseService, DoteService, ConjuroService, HabilidadService, IdiomaService, DominioService,
                    PlantillaService, EscuelaConjurosService, DisciplinaConjurosService, EnemigoPredilectoService, ArmaService, ArmaduraService,
                    GrupoArmaService, GrupoArmaduraService, SubtipoService].map((provide) => ({ provide, useValue: {} })),
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(AdquirirRazaMutadaComponent);
        fixture.componentRef.setInput('idPersonaje', 5);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.componentInstance;
    }

    it('sin una sesión de juego abierta no la adquiere: dice que hay que abrirla', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        expect(componente.error).toContain('hace falta una sesión de juego abierta');
        expect(fixture.nativeElement.textContent).toContain('hace falta una sesión de juego abierta');
        expect(sesiones.sesion).not.toHaveBeenCalled();
    });

    it('quien ve la ficha sin poder apuntar tampoco', async () => {
        expect((await crear({ puedeApuntar: false })).error).toContain('Solo su dueño o el máster');
        expect(sesiones.sesion).not.toHaveBeenCalled();
    });

    it('con una raza mutada ya no ofrece otra: no se pone una mutación sobre otra', async () => {
        const componente = await crear({}, {
            cargarSesionDeJuego: async () => ({
                historial: {} as any,
                cargada: { sesion: { numero: 3, version: 'v' } as any, entrada: { personaje: { idRazaBase: 25 } } as any, pj: { RazaBase: { Id: 25, Nombre: 'Humano' } } as any },
            }),
        });
        expect(componente.error).toContain('Ya tiene una raza mutada');
        expect(razas.getRazas).not.toHaveBeenCalled();
    });

    it('la cabecera dice qué hace y sus PX con su NEP', async () => {
        await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        const texto = fixture.nativeElement.querySelector('.subida__cabecera')?.textContent ?? '';
        expect(texto).toContain('Adquirir una raza mutada');
        expect(texto).toContain('10.000 PX · NEP 5');
    });

    describe('la evaluación con el personaje de ahora', () => {
        async function preparado(): Promise<any> {
            const componente: any = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            componente.entrada = { personaje: { idAlineamiento: 1, tipo: 'pj' }, colecciones: { clases: [{ idClase: 7, nivel: 5 }] } };
            componente.tiposPrerrequisito = [{ Clave: 'tipo_criatura', Dato: 'tipo_criatura', Comparador: 'es' }];
            razas.getRazaSobreBase.and.resolveTo(normalizeRazaApi(PROLE_SOBRE_API['5']));
            razas.comprobarRequisitosDelPersonaje.and.resolveTo([{ Frase: 'Inteligencia 3', Cumple: true, Confirma_master: false }]);
            return componente;
        }

        it('la prole sobre un mediano guerrero (humanoide): se puede elegir, con su combinación', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE, Nombre: 'Humanoide' };
            const opcion = await componente.evaluar(PROLE, MEDIANO, false);
            expect(opcion.estado).toBe('elegible');
            expect(opcion.combinada?.Nombre).toBe('Prole de Bahamut');
            // Con el momento de la adquisición (`?momento=despues`); la creación lo pide sin él.
            expect(razas.getRazaSobreBase).toHaveBeenCalledWith(21, 5, null, 'despues');
        });

        it('un mediano semicelestial (ajeno, por su plantilla) no hace el Rito, aunque su raza base sea humanoide', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE + 1, Nombre: 'Ajeno' };
            const opcion = await componente.evaluar(PROLE, MEDIANO, false);
            expect(opcion.estado).toBe('bloqueada');
            expect(opcion.motivo).toContain('Su tipo, con sus plantillas: Criatura de tipo humanoide');
        });

        it('lo que no cumple del personaje, con su frase; la condición del máster, un aviso; el homebrew que no admite la campaña', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE, Nombre: 'Humanoide' };
            razas.comprobarRequisitosDelPersonaje.and.resolveTo([{ Frase: 'Cualquier alineamiento no maligno', Cumple: false, Confirma_master: false }]);
            const opcion = await componente.evaluar(NACIDO, MEDIANO, false);
            expect(opcion.estado).toBe('bloqueada');
            expect(opcion.motivo).toContain('Cualquier alineamiento no maligno');
            // La condición del máster no la devuelve la API: sale del `pr` de la raza, como aviso.
            expect(opcion.avisos).toEqual([`${NACIDO.Prerrequisitos['condicion_master'][0].Frase} (lo confirma el máster)`]);
            const homebrew = await componente.evaluar({ ...PROLE, Oficial: false }, MEDIANO, true);
            expect(homebrew.motivo).toBe('La campaña no admite contenido homebrew.');
        });

        it('la prole renace adulta: con su tabla de edades (200 años), un mediano de 250 no; uno de 60, sí (con la suya sería de mediana edad)', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE, Nombre: 'Humanoide' };
            componente.svc.PersonajeCreacion.Edad = 250;
            const vieja = await componente.evaluar(PROLE, MEDIANO, false);
            expect(vieja.estado).toBe('bloqueada');
            expect(vieja.motivo).toContain('no es adulto');
            componente.svc.PersonajeCreacion.Edad = 60;
            expect((await componente.evaluar(PROLE, MEDIANO, false)).estado).toBe('elegible');
        });

        it('convertirse en muerto viviente: sin Constitución (su tipo o su ficha), no disponible; con ella, sí', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE, Nombre: 'Humanoide' };
            const engendro = { ...PROLE, Id: 1009, Nombre: 'Engendro vampírico', Clase_de_monstruo: { Id: ENGENDRO, Nombre: 'Engendro vampírico' } };
            componente.entrada.caracteristicas = { constitucion: { valor: 14, minimo: 0, perdido: false } };
            expect((await componente.evaluar(engendro, MEDIANO, false)).estado).toBe('elegible');
            componente.entrada.caracteristicas = { constitucion: { valor: 14, minimo: 0, perdido: true } };
            const sinCon = await componente.evaluar(engendro, MEDIANO, false);
            expect(sinCon.estado).toBe('bloqueada');
            expect(sinCon.motivo).toContain(MOTIVO_SIN_CONSTITUCION);
            // La prole no es una conversión: la Constitución no le importa.
            expect((await componente.evaluar(PROLE, MEDIANO, false)).estado).toBe('elegible');
        });

        it('convertirse en muerto viviente en una campaña que no permite las clases de monstruo: no disponible, con su motivo', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE, Nombre: 'Humanoide' };
            componente.sinClasesDeMonstruo = true;
            const engendro = { ...PROLE, Id: 1009, Nombre: 'Engendro vampírico', Clase_de_monstruo: { Id: ENGENDRO, Nombre: 'Engendro vampírico' } };
            const opcion = await componente.evaluar(engendro, MEDIANO, false);
            expect(opcion.estado).toBe('bloqueada');
            expect(opcion.motivo).toContain('La campaña no permite las clases de monstruo');
        });

        it('una base que la API no admite, con su error', async () => {
            const componente = await preparado();
            razas.getRazaSobreBase.and.rejectWith(new Error('La raza base no cumple lo que pide la raza mutada.'));
            const opcion = await componente.evaluar(PROLE, MEDIANO, false);
            expect(opcion.estado).toBe('bloqueada');
            expect(opcion.motivo).toContain('La raza base no cumple');
        });
    });

    it('los errores de la API, en su paso: los de la raza en «Raza»; lo que cuesta, la edad y la ficha, en el resumen', async () => {
        const componente: any = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        expect(componente.pasoDelError('idRaza', 'personaje_no_cumple_mutacion')).toBe('raza');
        expect(componente.pasoDelError('idRaza', 'mutacion_quita_dg_raciales')).toBe('raza');
        expect(componente.pasoDelError('idRaza', 'dinero_insuficiente')).toBe('resumen');
        expect(componente.pasoDelError('idRaza', 'experiencia_insuficiente')).toBe('resumen');
        expect(componente.pasoDelError('ficha.personaje.edad', 'mutacion_edad_no_adulta')).toBe('resumen');
        expect(componente.pasoDelError('ficha.personaje.idRazaBase', 'mutacion_no_cuadra')).toBe('resumen');
        // La conversión: la tirada del d12, en los PG; la clase que pierde el nivel, en el nivel; las clases, en el resumen.
        componente.pasos = ['raza', 'nivel', 'pg', 'resumen'];
        expect(componente.pasoDelError('pg.tirada', 'tirada_no_valida')).toBe('pg');
        expect(componente.pasoDelError('idClase', 'perdida_clase_no_cuadra')).toBe('nivel');
        expect(componente.pasoDelError('idRaza', 'conversion_sin_constitucion')).toBe('raza');
        expect(componente.pasoDelError('ficha.colecciones.clases', 'conversion_clases_no_cuadra')).toBe('resumen');
    });

    describe('convertirse en muerto viviente: el cuerpo que se manda', () => {
        const ENGENDRO_RAZA = {
            raza: { Id: 1009, Nombre: 'Engendro vampírico', Clase_de_monstruo: { Id: ENGENDRO, Nombre: 'Engendro vampírico' }, Coste_al_adquirir: { Px: 0, Po: 0 } },
            combinada: { Id: 1009, Nombre: 'Engendro vampírico', Clase_de_monstruo: { Id: ENGENDRO, Nombre: 'Engendro vampírico' }, Especiales_sustituidos: SUSTITUIDOS },
            estado: 'elegible', motivo: '', avisos: [],
        };

        async function preparada(entrada: any, despues: any): Promise<any> {
            const componente: any = await crear({}, {
                cargarSesionDeJuego: async () => { throw new Error('Sin la sesión en la prueba.'); },
                cuerpoDelMotor: () => despues,
            } as any);
            sesiones.adquirirRazaMutada.and.resolveTo({} as any);
            Object.assign(componente, {
                elegida: ENGENDRO_RAZA, anterior: { Id: 2, Nombre: 'Enano' }, entrada, sesion: { numero: 3, version: 'v7' },
                claseDeMonstruo: { Id: ENGENDRO, Nombre: 'Engendro vampírico' }, daDg: true, carasDg: 12, paso: 'resumen',
                pasos: ['raza', 'nivel', 'pg', 'resumen'], error: '',
            });
            return componente;
        }

        it('el guerrero enano 5 que pasa a guerrero 4 / engendro vampírico 1: la ficha sin su 5.º nivel, el engendro 1 y la tirada del d12', async () => {
            const entrada = enanoGuerrero([nivel(1, 10), nivel(2, 6), nivel(3, 7), nivel(4, 4), nivel(5, 8)], 45);
            const { antes, despues } = cuerpos();
            const componente = await preparada(entrada, despues);
            componente.perdida = fichaSinElNivel({ entrada, indice: 4, clase: claseGuerrero, caras: 10, dgsAntes: 5 });
            componente.antesConversion = antes;
            componente.pj = { Nivel_personaje: 5 };
            componente.tiradas = [3, 7];
            componente.tiradaElegida = 7;
            componente.pg = { total: 34, delNivel: 7, retroactivo: -8, exacto: true };
            componente.concepto = 'la consunción de energía de un vampiro';

            await componente.guardar();

            const [id, cuerpo]: [number, any] = sesiones.adquirirRazaMutada.calls.mostRecent().args;
            expect(id).toBe(5);
            expect(cuerpo.idRaza).toBe(1009);
            expect(cuerpo.version).toBe('v7');
            expect(cuerpo.pg).toEqual({ tirada: 7, tiradas: [3, 7] });
            expect(cuerpo.idClase).toBeUndefined();
            expect(cuerpo.concepto).toBe('la consunción de energía de un vampiro');
            expect(cuerpo.ficha.colecciones.clases).toEqual([{ idClase: GUERRERO, nivel: 4 }, { idClase: ENGENDRO, nivel: 1 }]);
            expect(cuerpo.ficha.niveles.map((n: any) => [n.idClase, n.nivelClase])).toEqual([[GUERRERO, 1], [GUERRERO, 2], [GUERRERO, 3], [GUERRERO, 4], [ENGENDRO, 1]]);
            expect(cuerpo.ficha.personaje.puntosGolpe).toBe(34);
            expect(cuerpo.ficha.caracteristicas.constitucion).toEqual({ valor: 14, minimo: 0, perdido: true });
            expect(cuerpo.ficha.colecciones.especiales.map((e: any) => e.idEspecial)).toEqual([32, 3087]);
            expect(componente.error).toBe('');
        });

        it('el humano guerrero 1: su primer DG va al máximo, sin `pg`; con el orden por conocer, la clase que pierde en `idClase`', async () => {
            const entrada = enanoGuerrero([{ ...nivel(1, 10), ordenConocido: false }], 12);
            const { antes, despues } = cuerpos();
            const componente = await preparada(entrada, despues);
            componente.idClaseElegida = GUERRERO;
            componente.perdida = fichaSinElNivel({ entrada, indice: 0, clase: claseGuerrero, caras: 10, dgsAntes: 1 });
            componente.antesConversion = antes;
            componente.pj = { Nivel_personaje: 1 };
            componente.primerDg = true;
            // La ficha sin su único nivel se queda con 0 PG (ningún DG): solo es el punto de partida, no se enseña ni se manda.
            expect(componente.perdida.ficha.personaje.puntosGolpe).toBe(0);
            componente.calcularPg();
            expect(componente.pg.total).toBe(12);
            componente.paso = 'pg';
            componente.cargando = false;
            fixture.detectChanges();
            // El paso de los PG parte de los de su ficha (12) y llega a los del d12 al máximo, sin Constitución.
            expect(fixture.nativeElement.querySelector('.subida__resultado')?.textContent).toContain('PG 12 → 12');
            componente.paso = 'resumen';

            await componente.guardar();

            const [, cuerpo]: [number, any] = sesiones.adquirirRazaMutada.calls.mostRecent().args;
            expect(cuerpo.pg).toBeUndefined();
            expect(cuerpo.idClase).toBe(GUERRERO);
            expect(cuerpo.ficha.colecciones.clases).toEqual([{ idClase: ENGENDRO, nivel: 1 }]);
            expect(cuerpo.ficha.niveles.map((n: any) => [n.idClase, n.nivelClase])).toEqual([[ENGENDRO, 1]]);
            expect(cuerpo.ficha.personaje.puntosGolpe).toBe(12);
        });

        it('la cabecera y el botón dicen que se convierte en muerto viviente', async () => {
            const componente = await preparada(enanoGuerrero([nivel(1, 10)], 12), {});
            componente.pj = { Nombre: 'Tordek', Nivel_personaje: 1 };
            componente.cargando = false;
            componente.cambios = [];
            fixture.detectChanges();
            const texto = fixture.nativeElement.textContent ?? '';
            expect(texto).toContain('Convertirse en muerto viviente · Sesión 3');
            expect(texto).toContain('Tordek se convierte en Engendro vampírico');
            expect(fixture.nativeElement.querySelector('.subida__pie button[color="primary"]')?.textContent).toContain('Convertirse en muerto viviente');
        });
    });
});
