import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { CompletarCompaneroComponent } from './completar-companero.component';

// «Completar el compañero» (contrato: SESIONES_FRONT, «Lo que la mascota tiene pendiente, fuera de una subida»).
describe('CompletarCompaneroComponent (lo que le falta al compañero, fuera de una subida)', () => {
    let fixture: ComponentFixture<CompletarCompaneroComponent>;
    let sesiones: jasmine.SpyObj<SesionesService>;
    let motor: jasmine.SpyObj<MotorDesdeFichaService>;

    const sesion = (numero: number, estado = 'abierta') => ({ numero, estado, version: `v${numero}`, eventos: [] });
    const LOBO = {
        Id: 1, Nombre: 'Colmillo', Tipo: { Id: 3, Nombre: 'Animal' }, Dg_adi: 2, Trucos_adi: 0, Trucos: [],
        Dados_golpe: { Cantidad: '2', Tipo_dado: { Id: 3, Nombre: 'd8' }, Suma: 0 },
        Caracteristicas: { Fuerza: 13, Destreza: 15, Constitucion: 15, Inteligencia: 2, Sabiduria: 12, Carisma: 6 },
        Habilidades: [{ Id_habilidad: 1, Habilidad: 'Avistar', Rangos: 4, Id_extra: -1, Extra: '' }],
        Habilidades_monstruo: [{ Id_habilidad: 1, Habilidad: 'Avistar', Rangos: 4, Id_extra: -1, Extra: '' }],
        Puntos_habilidad_tipo: 2, Dotes: [], Mejoras: [],
    };
    const companero = (rangos: number) => ({ nombre: 'Colmillo', idMonstruo: 7, dgAdi: 2, habilidades: [{ idHabilidad: 1, idExtra: -1, rangos }] });

    async function crear(conCompanero = true): Promise<CompletarCompaneroComponent> {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'sesion', 'corregirFicha']);
        sesiones.historial.and.resolveTo({ idPersonaje: 5, puedeApuntar: true, veNotas: true, rolActor: 'jugador', sesiones: [sesion(2)], experiencia: null } as any);
        sesiones.sesion.and.resolveTo({
            sesion: sesion(2), ficha: {},
            entrada: { personaje: { nombre: 'Myra' }, colecciones: {}, niveles: [], ...(conCompanero ? { companero: companero(4) } : {}) },
        } as any);
        sesiones.corregirFicha.and.resolveTo({} as any);
        motor = jasmine.createSpyObj<MotorDesdeFichaService>('MotorDesdeFichaService', ['cargarSesionDeJuego', 'cargarSesion', 'hidratar', 'cuerpoDelMotor']);
        motor.cargarSesionDeJuego.and.callFake((...args) =>
            MotorDesdeFichaService.prototype.cargarSesionDeJuego.apply({ sesionesSvc: sesiones, cargarSesion: motor.cargarSesion } as any, args));
        motor.cargarSesion.and.callFake(async (_motor, idPersonaje, numero) => {
            const { sesion, entrada } = await sesiones.sesion(idPersonaje, numero);
            return { sesion, entrada: entrada!, pj: { Nombre: 'Myra', Nivel_personaje: 4 } as any };
        });
        motor.hidratar.and.callFake(async (svc: any) => {
            if (conCompanero)
                svc.PersonajeCreacion.Companeros = [JSON.parse(JSON.stringify(LOBO))];
        });
        motor.cuerpoDelMotor.and.returnValue({ personaje: {}, colecciones: {}, companero: companero(4) } as any);
        await TestBed.configureTestingModule({
            imports: [CompletarCompaneroComponent, NoopAnimationsModule],
            providers: [
                { provide: Auth, useValue: { currentUser: { uid: 'cuenta-a' } } },
                { provide: SesionesService, useValue: sesiones },
                { provide: PersonajeService, useValue: {} },
                { provide: UserSettingsService, useValue: {} },
                { provide: SubidaNivelPuertaService, useValue: new SubidaNivelPuertaService() },
                { provide: MotorDesdeFichaService, useValue: motor },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CompletarCompaneroComponent);
        fixture.componentRef.setInput('idPersonaje', 5);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.componentInstance;
    }

    it('dice lo que le falta: los puntos de sus DG adicionales que no ha gastado (también los de una ficha de antes)', async () => {
        const componente = await crear();
        expect(componente.error).toBe('');
        // Int 2 (−4): 1 punto por DG adicional; 2 DG, 2 puntos, y no ha gastado ninguno. Y de 2 a 4 DG, la mejora de su 4.º.
        expect(componente.falta).toEqual(['2 puntos de habilidad', '1 mejora de característica (la de su 4.º DG)']);
        expect(fixture.nativeElement.textContent).toContain('Lo que le falta a Colmillo');
        // Elegir abre el reparto de sus rangos.
        await componente.elegir();
        expect(componente.paso).toBe('rangos');
    });

    it('sin compañero, lo dice y no deja elegir', async () => {
        const componente = await crear(false);
        expect(componente.error).toContain('no tiene compañero');
        expect(componente.listo).toBeFalse();
    });

    it('guarda como una corrección que solo cambia el compañero, con su motivo; sin cambios, no deja guardar', async () => {
        const componente = await crear();
        (componente as any).prepararResumen();
        expect(componente.filas).toEqual([]);
        expect(componente.puedeGuardar).toBeFalse();
        motor.cuerpoDelMotor.and.returnValue({ personaje: {}, colecciones: {}, companero: companero(6) } as any);
        (componente as any).prepararResumen();
        expect(componente.filas.map((f) => f.que)).toEqual(['Compañero animal (Colmillo): rangos']);
        await componente.guardar();
        const cuerpo = sesiones.corregirFicha.calls.mostRecent().args[1];
        expect(cuerpo.motivo).toBe('lo que le faltaba al compañero');
        expect(cuerpo.version).toBe('v2');
        expect(cuerpo.ficha.companero?.habilidades).toEqual([{ idHabilidad: 1, idExtra: -1, rangos: 6 }]);
        expect(cuerpo.ficha.personaje).toEqual({ nombre: 'Myra' } as any);
    });
});
