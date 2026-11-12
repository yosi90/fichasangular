import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
        motor = jasmine.createSpyObj<MotorDesdeFichaService>('MotorDesdeFichaService', ['cargarCatalogos', 'hidratar', 'primero']);
        motor.cargarCatalogos.and.resolveTo();
        motor.hidratar.and.resolveTo();
        await TestBed.configureTestingModule({
            imports: [CorregirFichaComponent, NoopAnimationsModule],
            providers: [
                { provide: Auth, useValue: { currentUser: { uid: 'cuenta-a' } } },
                { provide: SesionesService, useValue: sesiones },
                { provide: PersonajeService, useValue: { fichaDeApi: () => ({ Nombre: 'Brunilda', Nivel_personaje: 1 }) } },
                { provide: UserSettingsService, useValue: {} },
                { provide: SubidaNivelPuertaService, useValue: new SubidaNivelPuertaService() },
                { provide: MotorDesdeFichaService, useValue: motor },
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

    it('las puntuaciones: un jugador de una campaña no las corrige; el máster, o el dueño sin campaña, sí', async () => {
        expect((await crear({})).puedeCaracteristicas).toBeFalse();
        expect(fixture.nativeElement.textContent).toContain('solo las corrige el máster');
        TestBed.resetTestingModule();
        expect((await crear({ rolActor: 'master' })).puedeCaracteristicas).toBeTrue();
        TestBed.resetTestingModule();
        expect((await crear({}, { personaje: { nombre: 'Brunilda', puntosGolpe: 12 } })).puedeCaracteristicas).toBeTrue();
    });
});
