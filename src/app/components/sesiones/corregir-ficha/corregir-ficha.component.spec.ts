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

    async function crear(historial: Record<string, unknown>, entrada: Record<string, unknown> = {}): Promise<CorregirFichaComponent> {
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
            return { sesion, entrada: entrada!, pj: { Nombre: 'Brunilda', Nivel_personaje: 1 } as any };
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
});
