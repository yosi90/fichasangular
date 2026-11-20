import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DominioService } from 'src/app/services/dominio.service';
import { DoteService } from 'src/app/services/dote.service';
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
                    EscuelaConjurosService, ArmaService, ArmaduraService, GrupoArmaService, GrupoArmaduraService, SubtipoService]
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
});
