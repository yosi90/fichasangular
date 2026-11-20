import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
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
import Swal from 'sweetalert2';
import { AppToastService } from 'src/app/services/app-toast.service';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RazaService } from 'src/app/services/raza.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { dgsDeClase } from 'src/app/services/utils/clase-niveles';
import { claveHabilidad } from 'src/app/services/utils/habilidad-clave';
import {
    estadoDeLaVuelta, MOTIVO_VUELTA_NIVEL_DE_MAS_RACIAL, MOTIVO_VUELTA_NIVELES_DESPUES,
} from 'src/app/services/utils/vuelta-a-la-vida';
import { claseEngendro, ENGENDRO, enanoEngendro, GUERRERO, nivelDe } from 'src/testing/vuelta-a-la-vida';
import { normalizeClase } from 'src/app/services/clase.service';
import { normalizeRazaApi } from 'src/app/services/utils/raza-mapper';
import { baseApi, claseDeMonstruoApi, ENGENDRO_VAMPIRICO, guerreroApi, razaDeMonstruoSobreApi } from 'src/testing/clases-de-monstruo-api';
import { DevolverLaVidaComponent } from './devolver-la-vida.component';

describe('DevolverLaVidaComponent (devolver la vida a un muerto viviente, fase 7)', () => {
    let fixture: ComponentFixture<DevolverLaVidaComponent>;
    let sesiones: jasmine.SpyObj<SesionesService>;
    const texto = (): string => `${(fixture.nativeElement as HTMLElement).textContent ?? ''}`.replace(/\s+/g, ' ');
    const boton = (etiqueta: string): HTMLButtonElement | undefined => Array.from((fixture.nativeElement as HTMLElement)
        .querySelectorAll<HTMLButtonElement>('button')).find((b) => `${b.textContent ?? ''}`.trim() === etiqueta);

    const experiencia = (cambios: Record<string, unknown> = {}) => ({
        px: 8000, nivel: 5, pxNivelActual: 6000, pxSiguienteNivel: 10000, puedeSubir: false, nivelesPorSubir: 0,
        sesionAbierta: { numero: 3, titulo: 'Sesión 3' }, ...cambios,
    });

    async function crear(historial: Record<string, unknown>): Promise<DevolverLaVidaComponent> {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'sesion', 'devolverLaVida']);
        sesiones.historial.and.resolveTo({ idPersonaje: 5, puedeApuntar: true, veNotas: true, sesiones: [], experiencia: experiencia(), ...historial } as any);
        await TestBed.configureTestingModule({
            imports: [DevolverLaVidaComponent, NoopAnimationsModule],
            providers: [
                { provide: Auth, useValue: { currentUser: { uid: 'cuenta-a' } } },
                { provide: SesionesService, useValue: sesiones },
                { provide: PersonajeService, useValue: new PersonajeService({ currentUser: null } as any, {} as any) },
                { provide: UserSettingsService, useValue: {} },
                { provide: RazaService, useValue: jasmine.createSpyObj<RazaService>('RazaService', ['getRazaSobreBase']) },
                { provide: SubidaNivelPuertaService, useValue: new SubidaNivelPuertaService() },
                ...[ClaseService, DoteService, ConjuroService, HabilidadService, IdiomaService, DominioService, PlantillaService,
                    EscuelaConjurosService, DisciplinaConjurosService, EnemigoPredilectoService, ArmaService, ArmaduraService, GrupoArmaService,
                    GrupoArmaduraService, SubtipoService]
                    .map((provide) => ({ provide, useValue: {} })),
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(DevolverLaVidaComponent);
        fixture.componentRef.setInput('idPersonaje', 5);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.componentInstance;
    }

    /** La pantalla con un personaje ya leído (sin hidratar el motor: `recalcular` no hace nada mientras algo lo impida). */
    function conPersonaje(componente: DevolverLaVidaComponent, entrada: any, dgs: number, constitucion = 14): void {
        componente.error = '';
        componente.pj = { Nombre: 'Tordek' } as any;
        componente.entrada = entrada;
        componente.sesion = { numero: 3, version: 'v' } as any;
        componente.claseDeMonstruo = claseEngendro;
        componente.razaDeAntes = { Id: 2, Nombre: 'Enano' } as any;
        componente.dgs = dgs;
        componente.estado = estadoDeLaVuelta({ claseDeMonstruo: claseEngendro, niveles: entrada.niveles, clases: entrada.colecciones.clases, dgs, constitucion });
        componente.pierdeNivel = !componente.estado.motivoConResurreccion;
        fixture.detectChanges();
    }

    it('sin una sesión de juego abierta no se apunta: dice que hay que abrirla', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        expect(componente.error).toContain('hace falta una sesión de juego abierta');
        expect(sesiones.sesion).not.toHaveBeenCalled();
    });

    it('quien ve la ficha sin poder apuntar tampoco', async () => {
        expect((await crear({ puedeApuntar: false })).error).toContain('Solo su dueño o el máster');
    });

    it('los dos medios con su porqué, lo que no sirve y el concepto', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        conPersonaje(componente, enanoEngendro(), 5);
        expect(texto()).toContain('Resurrección, deseo o milagro: pierde además un nivel');
        expect(texto()).toContain('Resurrección verdadera: no pierde nivel');
        expect(texto()).toContain('Revivir a los muertos y reencarnar no sirven');
        expect(texto()).toContain('Pierde todos sus niveles de Engendro vampírico (1)');
        expect(componente.pierdeOtroNivel).toBeTrue();
        expect(componente.pierdeConstitucion).toBeFalse();
        // Sin calcular (el motor no está), no se manda nada.
        expect(boton('Devolver la vida')?.disabled).toBeTrue();
    });

    it('el gnoll: con resurrección perdería un DG racial; se ofrece deshabilitada, con su porqué, y queda la verdadera', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        const gnoll: any = { personaje: { puntosGolpe: 20 }, caracteristicas: { constitucion: { valor: 13, minimo: 0, perdido: true } },
            colecciones: { clases: [{ idClase: ENGENDRO, nivel: 1 }] }, niveles: [nivelDe(ENGENDRO, 1, 7)] };
        conPersonaje(componente, gnoll, 3, 13);
        expect(componente.pierdeNivel).toBeFalse();
        expect(componente.impedimento).toBe('');
        const radios = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[name="medioVuelta"]'));
        expect(radios.map((r) => [r.disabled, r.checked])).toEqual([[true, false], [false, true]]);
        expect(texto()).toContain(MOTIVO_VUELTA_NIVEL_DE_MAS_RACIAL);
        // No se puede elegir.
        componente.elegirMedio(componente.medios[0]);
        expect(componente.pierdeNivel).toBeFalse();
    });

    it('con niveles de otra clase después de la de monstruo: deshabilitado, con la frase de la API', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        const entrada: any = enanoEngendro([], [7, 6, 6, 6, 6, 6, 6, 6]);
        entrada.niveles = [...entrada.niveles.map((n: any, i: number) => ({ ...n, nivelClase: i + 1 })), nivelDe(GUERRERO, 1, 8)];
        entrada.colecciones.clases = [{ idClase: ENGENDRO, nivel: 8 }, { idClase: GUERRERO, nivel: 1 }];
        conPersonaje(componente, entrada, 5);
        expect(componente.motivo).toBe(MOTIVO_VUELTA_NIVELES_DESPUES);
        expect(texto()).toContain(MOTIVO_VUELTA_NIVELES_DESPUES);
        expect(texto()).not.toContain('Cómo vuelve a la vida');
        expect(boton('Devolver la vida')?.disabled).toBeTrue();
    });

    it('guardar: manda el medio, el concepto y la ficha (sin `idClase` con el orden conocido) y avisa con la frase del historial', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        conPersonaje(componente, enanoEngendro(), 5);
        componente.ficha = { personaje: {} } as any;
        componente.concepto = '  resurrección en el templo de Moradin ';
        const toasts = TestBed.inject(AppToastService);
        spyOn(toasts, 'showSuccess');
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        const frase = 'volvió a la vida (vuelve a ser enano): −1 nivel de engendro vampírico, −1 nivel de guerrero (queda en 3)';
        sesiones.devolverLaVida.and.resolveTo({
            sesion: { eventos: [{ id: 9, tipo: 'vuelta_a_la_vida', texto: frase }] }, vuelta: { idEvento: 9, raza: { id: 2, nombre: 'Enano' } },
        } as any);
        const hecha = spyOn(TestBed.inject(SubidaNivelPuertaService), 'subidaHecha');
        await componente.guardar();
        expect(sesiones.devolverLaVida).toHaveBeenCalledWith(5, { pierdeNivel: true, concepto: 'resurrección en el templo de Moradin', ficha: componente.ficha!, version: 'v' });
        expect(toasts.showSuccess).toHaveBeenCalledWith(`Tordek ${frase}`);
        expect(hecha).toHaveBeenCalledWith(5);
    });

    it('con el motor de la creación: el enano guerrero 4 / engendro 1 vuelve con resurrección a enano guerrero 3, con su Constitución', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        const svc = componente.svc;
        // El enano guerrero 5 que se convirtió: pierde su 5.º nivel y gana el 1.º del engendro (como la conversión).
        const engendro = normalizeClase(claseDeMonstruoApi(ENGENDRO_VAMPIRICO));
        const guerrero = normalizeClase(guerreroApi());
        svc.setCatalogoClases([engendro, guerrero]);
        const base = normalizeRazaApi(baseApi('enano'));
        expect(svc.seleccionarRaza(base)).toBeTrue();
        svc.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 12, Constitucion: 13, Inteligencia: 10, Sabiduria: 11, Carisma: 9 });
        for (let i = 0; i < 5; i++) {
            expect(svc.aplicarSiguienteNivelClase(guerrero).aplicado).toBeTrue();
            svc.registrarDotesPendientesPorProgresion(`Guerrero nivel ${i + 1}`);
        }
        svc.getDotesPendientes().forEach((d) => svc.omitirDotePendiente(d.id));
        (svc as any).aumentosPendientesCaracteristica = [];
        svc.perderNivelEnElMotor({ idClase: guerrero.Id, indiceNivel: 4 });
        const combinada = normalizeRazaApi(razaDeMonstruoSobreApi(ENGENDRO_VAMPIRICO, baseApi('enano'), { Fuerza: 2, Carisma: 2 }));
        expect(svc.adquirirRazaMutada(combinada, {})).toBeTrue();
        expect(svc.aplicarSiguienteNivelClase(engendro, null, null, true).aplicado).toBeTrue();
        svc.getDotesPendientes().forEach((d) => svc.omitirDotePendiente(d.id));

        // Su `entrada`: lo que arma el motor, sin Constitución con su puntuación guardada (15) y sus tiradas.
        const motor = TestBed.inject(MotorDesdeFichaService);
        const entrada: any = motor.cuerpoDelMotor(svc, { personaje: { nombre: 'Tordek' } } as any);
        entrada.personaje.idRaza = combinada.Id;
        entrada.personaje.idRazaBase = base.Id;
        entrada.personaje.puntosGolpe = 34;
        entrada.caracteristicas.constitucion = { valor: 15, minimo: 0, perdido: true };
        entrada.niveles = svc.getOrdenNiveles().map((n, i) => ({ ...n, pg: { tirada: [10, 6, 7, 4, 7][i], maximo: i === 0 }, ordenConocido: true }));
        conPersonaje(componente, entrada, 5, 15);
        componente.pj = JSON.parse(JSON.stringify(svc.PersonajeCreacion));
        componente.raza = combinada;
        componente.razaDeAntes = base;
        componente.claseDeMonstruo = engendro;
        componente.experiencia = experiencia() as any;
        componente.estado = estadoDeLaVuelta({ claseDeMonstruo: engendro, niveles: entrada.niveles, clases: entrada.colecciones.clases, dgs: 5, constitucion: 15 });
        componente.pierdeNivel = true;

        componente.calcular();
        const ficha: any = componente.ficha;
        expect(ficha).not.toBeNull();
        expect([ficha.personaje.idRaza, ficha.personaje.idRazaBase]).toEqual([base.Id, null]);
        expect(ficha.colecciones.clases).toEqual([{ idClase: guerrero.Id, nivel: 3 }]);
        expect(ficha.niveles.map((n: any) => [n.idClase, n.nivelClase])).toEqual([[guerrero.Id, 1], [guerrero.Id, 2], [guerrero.Id, 3]]);
        expect(ficha.caracteristicas.constitucion).toEqual({ valor: 15, minimo: 0, perdido: false });
        // Sin el +2 de Fuerza ni de Carisma del engendro.
        expect(ficha.caracteristicas.fuerza.valor).toBe(entrada.caracteristicas.fuerza.valor - 2);
        expect(ficha.caracteristicas.carisma.valor).toBe(entrada.caracteristicas.carisma.valor - 2);
        // 34 − 7 (el d12) + 4 × 2 (Con 15) − (4 + 2) (su 4.º de guerrero).
        expect(ficha.personaje.puntosGolpe).toBe(34 - 7 + 8 - 6);
        expect(svc.PersonajeCreacion.Tipo_criatura?.Nombre).not.toBe('Muerto viviente');
        expect(componente.nepDespues).toBe(3);
        expect(componente.pxDespues).toBe(4500);
        const fila = (que: string) => componente.cambios.find((c) => c.que === que);
        expect([fila('Raza')?.antes, fila('Raza')?.ahora]).toEqual(['Engendro vampírico', 'Enano']);
        expect(fila('Nivel de más')?.antes).toBe('Guerrero 4');
        expect(fila('Constitución')?.ahora).toBe('15');
        expect(componente.puedeGuardar).toBeTrue();
    });

    describe('sin ningún DG: gana el 1.er nivel de una clase básica (contrato, «Sin ningún DG»)', () => {
        const DOTE_HUMANO = { tipo: 'dote', idElemento: 30, idExtra: 0, origen: 'Dote adicional de raza: Humano' } as const;

        /**
         * El humano que se convirtió en engendro vampírico, con el motor de la creación: con `guerrero`, el guerrero 1 que lo
         * perdió al convertirse; sin él, el creado como engendro (`engendro` niveles). Su dote adicional de humano, en el
         * registro de su primer nivel. Deja la pantalla lista para calcular, con `pierdeNivel`.
         */
        function humanoEngendro(componente: DevolverLaVidaComponent, o: {
            guerrero: boolean; engendro: number; px: number; nep: number; pierdeNivel: boolean; nivelesPerdidos?: any[];
        }) {
            const svc = componente.svc;
            const engendro = normalizeClase(claseDeMonstruoApi(ENGENDRO_VAMPIRICO));
            const guerrero = normalizeClase(guerreroApi());
            const mago = normalizeClase({ ...guerreroApi(20, 'Mago'), Tipo_dado: { Id: 1, Nombre: 'd4' } });
            const paladin = normalizeClase({ ...guerreroApi(21, 'Paladín'), Multiclase_restringida: true });
            const prestigio = normalizeClase({ ...guerreroApi(22, 'Caballero de la rosa'), Prestigio: true });
            svc.setCatalogoClases([engendro, guerrero, mago, paladin, prestigio]);
            const base = normalizeRazaApi(baseApi('humano'));
            expect(svc.seleccionarRaza(base)).toBeTrue();
            svc.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 12, Constitucion: 12, Inteligencia: 10, Sabiduria: 11, Carisma: 9 });
            if (o.guerrero) {
                expect(svc.aplicarSiguienteNivelClase(guerrero).aplicado).toBeTrue();
                svc.registrarDotesPendientesPorRazaExtras('Humano');
                svc.registrarDotesPendientesPorProgresion('Guerrero nivel 1');
                svc.getDotesPendientes().forEach((d) => svc.omitirDotePendiente(d.id));
                svc.perderNivelEnElMotor({ idClase: guerrero.Id, indiceNivel: 0 });
            }
            const combinada = normalizeRazaApi(razaDeMonstruoSobreApi(ENGENDRO_VAMPIRICO, baseApi('humano'), { Fuerza: 2, Carisma: 2 }));
            expect(svc.adquirirRazaMutada(combinada, {})).toBeTrue();
            for (let i = 0; i < o.engendro; i++) {
                expect(svc.aplicarSiguienteNivelClase(engendro, null, null, true).aplicado).toBeTrue();
                svc.registrarDotesPendientesPorRazaExtras('Engendro vampírico');
            }
            svc.getDotesPendientes().forEach((d) => svc.omitirDotePendiente(d.id));
            (svc as any).aumentosPendientesCaracteristica = [];

            const motor = TestBed.inject(MotorDesdeFichaService);
            const entrada: any = motor.cuerpoDelMotor(svc, { personaje: { nombre: 'Ana' } } as any);
            entrada.personaje.idRaza = combinada.Id;
            entrada.personaje.idRazaBase = base.Id;
            entrada.personaje.puntosGolpe = 20;
            entrada.caracteristicas.constitucion = { valor: 12, minimo: 0, perdido: true };
            entrada.niveles = svc.getOrdenNiveles().map((n, i) => ({ ...n, pg: { tirada: 12, maximo: false }, ordenConocido: true }));
            entrada.niveles[0].elecciones = [...entrada.niveles[0].elecciones, { ...DOTE_HUMANO }];
            entrada.colecciones.dotes = [...(entrada.colecciones.dotes ?? []), { idDote: 30, idExtra: 0, origen: DOTE_HUMANO.origen }];
            const dgs = dgsDeClase(engendro, o.engendro);
            componente.error = '';
            componente.pj = { ...JSON.parse(JSON.stringify(svc.PersonajeCreacion)), Nombre: 'Ana' };
            componente.entrada = entrada;
            componente.sesion = { numero: 3, version: 'v' } as any;
            componente.raza = combinada;
            componente.razaDeAntes = base;
            componente.claseDeMonstruo = engendro;
            componente.dgs = dgs;
            componente.experiencia = experiencia({ px: o.px, nivel: o.nep }) as any;
            (componente as any).nivelesPerdidos = o.nivelesPerdidos ?? [];
            componente.estado = estadoDeLaVuelta({ claseDeMonstruo: engendro, niveles: entrada.niveles, clases: entrada.colecciones.clases, dgs, constitucion: 12 });
            componente.pierdeNivel = o.pierdeNivel;
            return { svc, engendro, guerrero, mago, paladin, base, entrada };
        }

        /** Hasta el resumen: la clase (sin selectores que abrir), el reparto de rangos y la dote de 1.er nivel (sin candidatas, se omite). */
        async function tomarElNivel(componente: DevolverLaVidaComponent, clase: any): Promise<void> {
            await componente.elegirClaseNueva(clase);
            expect(componente.paso).toBe('habilidades');
            repartir(componente);
            componente.cerrarHabilidades();
            await fixture.whenStable();
            expect(componente.paso).toBe('resumen');
        }

        /** Los puntos de habilidad del nivel, en las que se puedan subir (como con − / + en la tabla). */
        function repartir(componente: DevolverLaVidaComponent): void {
            const svc = componente.svc;
            for (let i = 0; i < 100 && !svc.puedeCerrarDistribucionHabilidades(); i++) {
                const h = svc.getHabilidadesSesion().find((x) => svc.puedeSubirRangoHabilidad(claveHabilidad(x)));
                if (!h)
                    break;
                svc.ajustarRangoHabilidad(claveHabilidad(h), 1);
            }
            expect(svc.puedeCerrarDistribucionHabilidades()).toBeTrue();
        }

        it('el humano guerrero 1 convertido en engendro 1: solo las básicas, sin la de prestigio ni la de monstruo', async () => {
            const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            humanoEngendro(componente, { guerrero: true, engendro: 1, px: 500, nep: 1, pierdeNivel: true });
            expect(componente.ganaNivel).toBeTrue();
            expect(componente.impedimento).toBe('');
            componente.calcular();
            expect(componente.base).not.toBeNull();
            expect(componente.clasesNuevas.map((c) => [c.clase.Nombre, c.elegible])).toEqual([['Guerrero', true], ['Mago', true], ['Paladín', true]]);
            fixture.detectChanges();
            expect(texto()).toContain('Elige la clase de su 1.er nivel');
            expect(texto()).toContain('gana el 1.er nivel de una clase básica, como al crear');
            expect(texto()).not.toContain('Caballero de la rosa');
            expect(boton('Devolver la vida')?.disabled).toBeTrue();
        });

        it('con resurrección vuelve guerrero 1: PG al máximo con la Constitución rebajada, ×4 + 4 del humano, su dote de humano sin repetir', async () => {
            const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            const { svc, guerrero, base } = humanoEngendro(componente, { guerrero: true, engendro: 1, px: 500, nep: 1, pierdeNivel: true });
            componente.calcular();
            const deRaza = svc.getDotesPendientes().filter((d) => d.fuente === 'raza').length;
            await componente.elegirClaseNueva(guerrero);
            // (2 + 0) × 4 + 4 del humano, con su Inteligencia de ahora.
            expect(svc.EstadoFlujo.habilidades.puntosRestantes).toBe(12);
            // La dote de 1.er nivel de personaje sí; la adicional del humano no se repite.
            expect(svc.getDotesPendientes().filter((d) => d.fuente === 'raza').length).toBe(deRaza);
            expect(svc.getDotesPendientes().some((d) => d.fuente === 'nivel' && d.estado === 'pendiente')).toBeTrue();
            expect(componente.pasos).toEqual(['clase', 'habilidades', 'dotes', 'resumen']);
            repartir(componente);
            componente.cerrarHabilidades();
            await fixture.whenStable();
            expect(componente.paso).toBe('resumen');

            const ficha: any = componente.ficha;
            expect([ficha.personaje.idRaza, ficha.personaje.idRazaBase]).toEqual([base.Id, null]);
            expect(ficha.colecciones.clases).toEqual([{ idClase: guerrero.Id, nivel: 1 }]);
            expect(ficha.niveles.length).toBe(1);
            expect([ficha.niveles[0].idClase, ficha.niveles[0].nivelClase]).toEqual([guerrero.Id, 1]);
            expect(ficha.niveles[0].pg).toBeUndefined();
            // La dote adicional del humano pasa al 1.er nivel nuevo, con su origen, y sigue en la ficha.
            expect(ficha.niveles[0].elecciones).toContain(jasmine.objectContaining(DOTE_HUMANO));
            expect(ficha.colecciones.dotes.filter((d: any) => d.idDote === 30).length).toBe(1);
            // Constitución 12 − 2 = 10: d10 al máximo + 0.
            expect(ficha.caracteristicas.constitucion).toEqual({ valor: 10, minimo: 0, perdido: false });
            expect(ficha.personaje.puntosGolpe).toBe(10);
            expect([componente.nepDespues, componente.pxDespues]).toEqual([1, 500]);
            const fila = (que: string) => componente.cambios.find((c) => c.que === que);
            expect(fila('Nivel ganado')?.ahora).toBe('Guerrero 1');
            expect(fila('Constitución')?.ahora).toBe('10');
            expect(fila('Puntos de golpe')?.ahora).toBe('10');
            expect(componente.puedeGuardar).toBeTrue();
            // Con el nivel empezado, el medio no cambia (se empieza de nuevo).
            componente.elegirMedio(componente.medios[1]);
            expect(componente.pierdeNivel).toBeTrue();

            spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
            const frase = 'volvió a la vida (vuelve a ser humano): −1 nivel de engendro vampírico, +1 nivel de guerrero (su 1.er nivel)';
            sesiones.devolverLaVida.and.resolveTo({
                sesion: { eventos: [{ id: 9, tipo: 'vuelta_a_la_vida', texto: frase }] }, vuelta: { idEvento: 9, raza: { id: base.Id, nombre: 'Humano' } },
            } as any);
            const toasts = TestBed.inject(AppToastService);
            spyOn(toasts, 'showSuccess');
            await componente.guardar();
            // Sin `idClase` (no hay nivel de más) y sin `pg` (va al máximo).
            expect(sesiones.devolverLaVida).toHaveBeenCalledWith(5, { pierdeNivel: true, ficha, version: 'v' });
            expect(toasts.showSuccess).toHaveBeenCalledWith(`Ana ${frase}`);
        });

        it('con resurrección verdadera vuelve mago 1: conserva su Constitución (d4 + 1)', async () => {
            const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            const { mago } = humanoEngendro(componente, { guerrero: true, engendro: 1, px: 0, nep: 1, pierdeNivel: false });
            componente.calcular();
            await tomarElNivel(componente, mago);
            const ficha: any = componente.ficha;
            expect(ficha.colecciones.clases).toEqual([{ idClase: mago.Id, nivel: 1 }]);
            expect(ficha.caracteristicas.constitucion).toEqual({ valor: 12, minimo: 0, perdido: false });
            expect(ficha.personaje.puntosGolpe).toBe(5);
            expect([componente.nepDespues, componente.pxDespues]).toEqual([1, 0]);
            expect(componente.cambios.find((c) => c.que === 'Constitución')?.porque).toBe('Recupera su puntuación: vuelve a sumar en todos sus DG');
        });

        it('el humano creado como engendro vampírico 3 con 3.000 PX (NEP 3) queda guerrero 1 con 500', async () => {
            const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            const { guerrero } = humanoEngendro(componente, { guerrero: false, engendro: 3, px: 3000, nep: 3, pierdeNivel: true });
            expect([componente.estado?.nivelesDeLaClase, componente.estado?.dgsSinLaClase, componente.ganaNivel]).toEqual([3, 0, true]);
            componente.calcular();
            await tomarElNivel(componente, guerrero);
            const ficha: any = componente.ficha;
            expect(ficha.colecciones.clases).toEqual([{ idClase: guerrero.Id, nivel: 1 }]);
            expect(ficha.niveles.map((n: any) => [n.idClase, n.nivelClase])).toEqual([[guerrero.Id, 1]]);
            expect(ficha.niveles[0].elecciones).toContain(jasmine.objectContaining(DOTE_HUMANO));
            expect([componente.nepDespues, componente.pxDespues]).toEqual([1, 500]);
            const fila = (que: string) => componente.cambios.find((c) => c.que === que);
            expect([fila('Niveles de Engendro vampírico')?.ahora, fila('PX')?.ahora, fila('NEP')?.ahora]).toEqual(['Los pierde todos (3)', '500', '1']);
        });

        it('el paladín que perdió su nivel al convertirse sigue cerrado; sin haberlo sido, se puede', async () => {
            const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            humanoEngendro(componente, {
                guerrero: true, engendro: 1, px: 500, nep: 1, pierdeNivel: true,
                nivelesPerdidos: [{ idClase: 21, nivelClase: 1, ordenConocido: true, clasesAnteriores: [], causa: 'conversion', restablecible: false }],
            });
            componente.calcular();
            const paladin = componente.clasesNuevas.find((c) => c.clase.Nombre === 'Paladín');
            expect(paladin?.elegible).toBeFalse();
            expect(paladin?.motivo).toContain('ya no puede volver a subir de paladín');
            fixture.detectChanges();
            expect(texto()).toContain('ya no puede volver a subir de paladín');
        });

        it('una clase que no admite su alineamiento, como al crear: «Elegir igualmente», con aviso, y la decisión alineamiento_clase', async () => {
            const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            const { svc, paladin } = humanoEngendro(componente, { guerrero: true, engendro: 1, px: 500, nep: 1, pierdeNivel: true });
            const evaluar = svc.evaluarClaseParaSeleccion.bind(svc);
            spyOn(svc, 'evaluarClaseParaSeleccion').and.callFake((clase: any) => clase.Nombre === 'Paladín'
                ? { estado: 'blocked_failed', razones: ['Requiere alineamiento legal bueno'], advertencias: [], soloPorAlineamiento: true } as any
                : evaluar(clase));
            // Con una campaña que no deja saltarse el alineamiento, no se ofrece.
            componente.pj = { ...componente.pj!, PoliticaCompra: { permitirIgnorarRestriccionesAlineamiento: false } as any };
            componente.calcular();
            expect(componente.clasesNuevas.some((c) => c.clase.Nombre === 'Paladín')).toBeFalse();
            // Sin campaña, sí: «Elegir igualmente», que avisa antes de volver homebrew la ficha.
            const { svc: svc2, paladin: paladin2 } = humanoEngendro(componente, { guerrero: true, engendro: 1, px: 500, nep: 1, pierdeNivel: true });
            expect(svc2).toBe(svc);
            componente.calcular();
            const item = componente.clasesNuevas.find((c) => c.clase.Nombre === 'Paladín');
            expect([item?.elegible, item?.soloAlineamiento]).toEqual([false, true]);
            fixture.detectChanges();
            expect(boton('Elegir igualmente')).toBeDefined();
            const aviso = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
            await tomarElNivel(componente, paladin2);
            expect(aviso).toHaveBeenCalled();
            expect((componente.ficha as any).colecciones.clases).toEqual([{ idClase: paladin.Id, nivel: 1 }]);
            expect(componente.ficha?.decisionesHomebrew).toContain({ tipo: 'alineamiento_clase', idElemento: paladin.Id });
        });

        it('con Constitución 2, con resurrección no se puede (quedaría en 0): queda la verdadera', async () => {
            const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            const entrada: any = { personaje: { puntosGolpe: 8 }, caracteristicas: { constitucion: { valor: 2, minimo: 0, perdido: true } },
                colecciones: { clases: [{ idClase: ENGENDRO, nivel: 1 }] }, niveles: [nivelDe(ENGENDRO, 1, 12)] };
            conPersonaje(componente, entrada, 1, 2);
            expect(componente.ganaNivel).toBeTrue();
            expect(componente.pierdeNivel).toBeFalse();
            const radios = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[name="medioVuelta"]'));
            expect(radios.map((r) => [r.disabled, r.checked])).toEqual([[true, false], [false, true]]);
            expect(texto()).toContain('Con Constitución 2 no se le puede devolver la vida');
        });

        it('el error de la API (vuelta_clase_nueva_no_valida) se enseña con su frase', async () => {
            const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            const entrada: any = { personaje: { puntosGolpe: 8 }, caracteristicas: { constitucion: { valor: 12, minimo: 0, perdido: true } },
                colecciones: { clases: [{ idClase: ENGENDRO, nivel: 1 }] }, niveles: [nivelDe(ENGENDRO, 1, 12)] };
            conPersonaje(componente, entrada, 1, 12);
            componente.claseNueva = { Id: 9, Nombre: 'Guerrero' } as any;
            componente.paso = 'resumen';
            componente.ficha = { personaje: {} } as any;
            spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
            const frase = 'Al volver a la vida sin ningún DG gana el 1.er nivel de una clase básica, como al crear.';
            sesiones.devolverLaVida.and.rejectWith(Object.assign(new Error(frase), { code: 'vuelta_clase_nueva_no_valida', field: 'ficha.colecciones.clases' }));
            await componente.guardar();
            fixture.detectChanges();
            expect(componente.error).toBe(frase);
            expect(texto()).toContain(frase);
        });
    });
});
