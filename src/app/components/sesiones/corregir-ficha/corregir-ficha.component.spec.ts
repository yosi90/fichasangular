import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { DeidadService } from 'src/app/services/deidad.service';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { CorregirFichaComponent } from './corregir-ficha.component';

describe('CorregirFichaComponent (la corrección de la ficha, fase 6)', () => {
    let fixture: ComponentFixture<CorregirFichaComponent>;
    let sesiones: jasmine.SpyObj<SesionesService>;
    let motor: jasmine.SpyObj<MotorDesdeFichaService>;

    const sesion = (numero: number, estado = 'abierta') => ({ numero, estado, version: `v${numero}`, eventos: [] });

    async function crear(historial: Record<string, unknown>, entrada: Record<string, unknown> = {}, pj: Record<string, unknown> = {}): Promise<CorregirFichaComponent> {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'sesion', 'corregirFicha']);
        sesiones.historial.and.resolveTo({ idPersonaje: 5, puedeApuntar: true, veNotas: true, rolActor: 'jugador', sesiones: [sesion(0)], experiencia: null, ...historial } as any);
        sesiones.sesion.and.resolveTo({
            sesion: sesion(0), ficha: {},
            entrada: { personaje: { nombre: 'Brunilda', puntosGolpe: 12, campana: { id: 2 } }, colecciones: {}, niveles: [], ...entrada },
        } as any);
        motor = jasmine.createSpyObj<MotorDesdeFichaService>('MotorDesdeFichaService', ['cargarSesion', 'hidratar', 'primero', 'cuerpoDelMotor']);
        motor.primero.and.callFake(async (origen: any) => {
            let valor: any = null;
            (await origen).subscribe((v: any) => valor = v);
            return valor;
        });
        motor.cuerpoDelMotor.and.returnValue({ personaje: {}, colecciones: {} } as any);
        // La sesión, de `SesionesService` como la lee el motor (`cargarSesion`).
        motor.cargarSesion.and.callFake(async (_motor, idPersonaje, numero) => {
            const { sesion, entrada } = await sesiones.sesion(idPersonaje, numero);
            return { sesion, entrada: entrada!, pj: { Nombre: 'Brunilda', Nivel_personaje: 1, ...pj } as any };
        });
        motor.hidratar.and.resolveTo();
        await TestBed.configureTestingModule({
            imports: [CorregirFichaComponent, NoopAnimationsModule],
            providers: [
                { provide: Auth, useValue: { currentUser: { uid: 'cuenta-a' } } },
                { provide: SesionesService, useValue: sesiones },
                { provide: PersonajeService, useValue: {} },
                { provide: UserSettingsService, useValue: {} },
                { provide: SubidaNivelPuertaService, useValue: new SubidaNivelPuertaService() },
                { provide: MotorDesdeFichaService, useValue: motor },
                { provide: AlineamientoService, useValue: { getAlineamientosBasicosCatalogo: () => of([
                    { Id: 0, Nombre: 'No aplica' }, { Id: 1, Nombre: 'Legal bueno' }, { Id: 4, Nombre: 'Neutral bueno' }, { Id: 8, Nombre: 'Caótico neutral' }]) } },
                { provide: DeidadService, useValue: { getDeidades: () => of([]) } },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CorregirFichaComponent);
        fixture.componentRef.setInput('idPersonaje', 5);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.componentInstance;
    }

    it('sin una sesión abierta no corrige: dice que hay que abrirla o reabrir la última', async () => {
        const componente = await crear({ sesiones: [sesion(0, 'cerrada'), sesion(1, 'cerrada')] });
        expect(componente.error).toContain('hace falta una sesión abierta');
        expect(sesiones.sesion).not.toHaveBeenCalled();
    });

    it('quien ve la ficha sin poder apuntar no corrige', async () => {
        expect((await crear({ puedeApuntar: false })).error).toContain('Solo su dueño o el máster');
    });

    it('en la sesión 0 abierta sí: hidrata el motor y, sin nada corregido, no deja guardar', async () => {
        const componente = await crear({});
        expect(componente.error).toBe('');
        expect(motor.hidratar).toHaveBeenCalled();
        expect(componente.cambios).toEqual([]);
        expect(componente.puedeGuardar).toBeFalse();
        expect(fixture.nativeElement.textContent).toContain('la sesión de creación');
    });

    it('las puntuaciones, la edad y las tiradas de PG: un jugador de una campaña no las corrige; el máster, o el dueño sin campaña, sí', async () => {
        expect((await crear({})).puedeLoDelMaster).toBeFalse();
        expect(fixture.nativeElement.textContent).toContain('solo las corrige el máster');
        TestBed.resetTestingModule();
        expect((await crear({ rolActor: 'master' })).puedeLoDelMaster).toBeTrue();
        TestBed.resetTestingModule();
        expect((await crear({}, { personaje: { nombre: 'Brunilda', puntosGolpe: 12 } })).puedeLoDelMaster).toBeTrue();
    });

    it('el alineamiento: sale en «Lo que cambia» y el catálogo no ofrece «No aplica»', async () => {
        const componente = await crear({}, { personaje: { nombre: 'Brunilda', puntosGolpe: 12, campana: { id: 2 }, idAlineamiento: 1 } });
        expect(componente.alineamientos.map((a) => a.Id)).toEqual([1, 4, 8]);
        componente.idAlineamiento = 4;
        componente.cambiarAlineamiento();
        expect(componente.cambios).toContain('Alineamiento Legal bueno → Neutral bueno');
        expect(componente.puedeGuardar).toBeTrue();
    });

    it('la altura fuera del rango de su raza: hay que mantenerla (homebrew) o volver a la de antes para guardar', async () => {
        const componente = await crear({}, { personaje: { nombre: 'Brunilda', puntosGolpe: 12, campana: { id: 2 }, altura: 1.3 } });
        (componente.svc as any).razaSeleccionada = { Altura_rango_inf: 1.2, Altura_rango_sup: 1.4 };
        componente.altura = 2.1;
        componente.cambiarMedidas();
        expect(componente.reglas.map((r) => r.clave)).toEqual(['altura']);
        expect(componente.puedeGuardar).toBeFalse();
        componente.mantener(componente.reglas[0]);
        expect(componente.puedeGuardar).toBeTrue();
        componente.deshacerRegla(componente.reglas[0]);
        expect(componente.altura).toBe(1.3);
        expect(componente.reglas).toEqual([]);
    });

    it('las tiradas de PG de cada nivel (el máster): la del primer nivel tomado al máximo no se corrige', async () => {
        const componente = await crear({ rolActor: 'master' }, {
            personaje: { nombre: 'Brunilda', puntosGolpe: 16, campana: { id: 2 } },
            caracteristicas: { constitucion: { valor: 10, perdido: false } },
            niveles: [{ idClase: 7, nivelClase: 1, pg: { tirada: null, maximo: true } }, { idClase: 7, nivelClase: 2, pg: { tirada: 4, maximo: false } }],
        });
        componente.svc.setCatalogoClases([{ Id: 7, Nombre: 'Guerrero', Tipo_dado: { Id: 4, Nombre: 'd10' }, Desglose_niveles: [] } as any]);
        await componente.empezarDeNuevo();
        expect(componente.tiradas.map((t) => [t.indice, t.maximo, t.antes])).toEqual([[0, true, null], [1, false, 4]]);
        componente.cambiarTirada(componente.tiradas[1], 9);
        expect(componente.pg?.total).toBe(21);
        expect(componente.cambios).toContain('Tirada de PG de nivel 2 (guerrero 2): 4 → 9');
        componente.cambiarTirada(componente.tiradas[0], 3);
        expect(componente.tiradas[0].tirada).toBeNull();
    });

    it('las tiradas de un vampiro se corrigen con el d12 de su plantilla, no con el d10 de su clase (como en la subida)', async () => {
        const componente = await crear({ rolActor: 'master' }, {
            personaje: { nombre: 'Brunilda', puntosGolpe: 16, campana: { id: 2 } },
            caracteristicas: { constitucion: { valor: 10, perdido: false } },
            niveles: [{ idClase: 7, nivelClase: 1, pg: { tirada: null, maximo: true } }, { idClase: 7, nivelClase: 2, pg: { tirada: 4, maximo: false } }],
        });
        componente.svc.setCatalogoClases([{ Id: 7, Nombre: 'Guerrero', Tipo_dado: { Id: 4, Nombre: 'd10' }, Desglose_niveles: [] } as any]);
        componente.svc.EstadoFlujo.plantillas.seleccionadas = [{ Id: 8, Nombre: 'Vampiro', Actualiza_dg: true, Tipo_dado: { Id_tipo_dado: 5, Nombre: 'd12' } } as any];
        await componente.empezarDeNuevo();
        expect(componente.tiradas.map((t) => t.caras)).toEqual([12, 12]);
        componente.cambiarTirada(componente.tiradas[1], 11);
        expect(componente.tiradas[1].tirada).toBe(11);
        expect(componente.cambios).toContain('Tirada de PG de nivel 2 (guerrero 2): 4 → 11');
    });

    describe('la política de la campaña (bugs.md de sesiones, 2026-11-13: la misma regla que la API, antes de guardar)', () => {
        const sinHomebrew = { permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: null, permitirIgnorarRestriccionesAlineamiento: false };
        const rota = { idDote: 3, idExtra: 0, origen: 'Nivel 1', nombre: 'Soltura con un arma', razones: ['Requiere ataque base +1'], nivel: 1 };

        it('sin homebrew en la campaña, una dote que deja de cumplirse solo se quita', async () => {
            const componente = await crear({}, {}, { PoliticaCompra: sinHomebrew });
            spyOn(componente.svc, 'dotesSinSusPrerrequisitos').and.returnValue([rota] as any);
            componente.cambiarMedidas();
            expect(componente.rotas[0].puedeMantener).toBeFalse();
            componente.mantener(componente.rotas[0]);
            expect(componente.rotas[0].mantenida).toBeFalse();
            fixture.detectChanges();
            expect(fixture.nativeElement.textContent).toContain('la campaña no admite homebrew: solo se puede quitar');
        });

        it('el máster se salta la política, con su aviso', async () => {
            const componente = await crear({ rolActor: 'master' }, {}, { PoliticaCompra: sinHomebrew });
            spyOn(componente.svc, 'dotesSinSusPrerrequisitos').and.returnValue([rota] as any);
            componente.cambiarMedidas();
            expect(componente.rotas[0].puedeMantener).toBeTrue();
            expect(componente.avisoDelMaster).toContain('Como máster');
        });

        it('el alineamiento de su raza: con una regla «siempre», se mantiene como homebrew solo si la campaña deja saltarse el alineamiento', async () => {
            const enano = { Nombre: 'Enano', Alineamiento: {
                Basico: { Id_basico: 0, Nombre: 'No aplica' }, Ley: { Nombre: 'Siempre legal', Valor: 1, Prohibe: false, Id_prioridad: 3 },
                Moral: { Nombre: 'No aplica', Valor: null }, Prioridad: { Id_prioridad: 3, Nombre: 'Siempre' } } };
            const entrada = { personaje: { nombre: 'Brunilda', puntosGolpe: 12, campana: { id: 2 }, idAlineamiento: 1, idRaza: 3 } };
            let componente = await crear({}, entrada, { PoliticaCompra: sinHomebrew });
            (componente.svc as any).razaSeleccionada = enano;
            componente.idAlineamiento = 8;
            componente.cambiarAlineamiento();
            expect(componente.reglas.map((r) => [r.clave, r.puedeMantener, r.motivoNoMantener])).toEqual([
                ['raza', false, 'la campaña no deja saltarse las restricciones de alineamiento']]);
            expect(componente.puedeGuardar).toBeFalse();
            TestBed.resetTestingModule();
            componente = await crear({}, entrada, { PoliticaCompra: { ...sinHomebrew, permitirIgnorarRestriccionesAlineamiento: true } });
            (componente.svc as any).razaSeleccionada = enano;
            componente.idAlineamiento = 8;
            componente.cambiarAlineamiento();
            componente.mantener(componente.reglas[0]);
            expect(componente.puedeGuardar).toBeTrue();
            const decisiones = (componente as any).decisionesRecalculadas();
            expect(decisiones.tipos).toContain('alineamiento_raza');
            expect(decisiones.decisiones).toContain({ tipo: 'alineamiento_raza', idElemento: 3 });
        });

        it('una ex clase (ya no admitía su alineamiento) sigue ex: no se ofrece mantenerla, solo se avisa', async () => {
            const componente = await crear({ rolActor: 'master' }, {
                personaje: { nombre: 'Brunilda', puntosGolpe: 12, campana: { id: 2 }, idAlineamiento: 4 },
                colecciones: { clases: [{ idClase: 11, nivel: 2 }] },
            });
            componente.svc.setCatalogoClases([{ Id: 11, Nombre: 'Paladín', Tipo_dado: { Id: 4, Nombre: 'd10' }, Desglose_niveles: [],
                Alineamiento: { Basico: { Id_basico: 1, Nombre: 'Legal bueno' }, Ley: {}, Moral: {}, Prioridad: { Id_prioridad: 3 } } } as any]);
            componente.idAlineamiento = 8;
            componente.cambiarAlineamiento();
            expect(componente.reglas).toEqual([]);
            expect(componente.avisos).toEqual(['Ex paladín: sigue sin poder subir de nivel en esta clase, y una corrección no le devuelve lo que perdió.']);
        });
    });

    it('la deidad tutelar de sus clases: no ofrece otra deidad ni «Sin deidad», y lo dice', async () => {
        const componente = await crear({}, {
            personaje: { nombre: 'Brunilda', puntosGolpe: 12, campana: { id: 2 }, idAlineamiento: 1, deidad: 9 },
            colecciones: { clases: [{ idClase: 188, nivel: 1 }] },
        });
        componente.deidades = [{ Id: 9, Nombre: 'Heironeous', Oficial: true }, { Id: 18, Nombre: 'Pelor', Oficial: true }] as any;
        componente.svc.setCatalogoClases([{ Id: 188, Nombre: 'Hoja brillante de Heironeous', Tipo_dado: { Id: 4, Nombre: 'd10' }, Desglose_niveles: [],
            Prerrequisitos_flags: { deidad: true }, Prerrequisitos: { deidad: [{ Id_deidad: 9, Deidad: 'Heironeous', Opcional: 0, Frase: 'Deidad tutelar: Heironeous' }] } } as any]);
        expect(componente.deidadesElegibles.map((d) => d.Nombre)).toEqual(['Heironeous']);
        expect(componente.sinDeidadElegible).toBeFalse();
        expect(componente.deidadesTutelares).toEqual(['Hoja brillante de Heironeous: Deidad tutelar: Heironeous']);
    });
});
