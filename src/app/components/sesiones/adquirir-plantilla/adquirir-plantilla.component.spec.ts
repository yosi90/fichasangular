import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
import { PersonajeService } from 'src/app/services/personaje.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RazaService } from 'src/app/services/raza.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import Swal from 'sweetalert2';
import { AdquirirPlantillaComponent } from './adquirir-plantilla.component';

describe('AdquirirPlantillaComponent (adquirir una plantilla, fase 7)', () => {
    let fixture: ComponentFixture<AdquirirPlantillaComponent>;
    let sesiones: jasmine.SpyObj<SesionesService>;

    const experiencia = (cambios: Record<string, unknown> = {}) => ({
        px: 6100, nivel: 3, pxNivelActual: 3000, pxSiguienteNivel: 6000, puedeSubir: true, nivelesPorSubir: 1,
        sesionAbierta: { numero: 3, titulo: 'Sesión 3' }, ...cambios,
    });

    async function crear(historial: Record<string, unknown>): Promise<AdquirirPlantillaComponent> {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'sesion', 'adquirirPlantilla']);
        sesiones.historial.and.resolveTo({ idPersonaje: 5, puedeApuntar: true, veNotas: true, sesiones: [], experiencia: experiencia(), ...historial } as any);
        await TestBed.configureTestingModule({
            imports: [AdquirirPlantillaComponent, NoopAnimationsModule],
            providers: [
                { provide: Auth, useValue: { currentUser: { uid: 'cuenta-a' } } },
                { provide: SesionesService, useValue: sesiones },
                { provide: PersonajeService, useValue: {} },
                { provide: UserSettingsService, useValue: {} },
                { provide: SubidaNivelPuertaService, useValue: new SubidaNivelPuertaService() },
                { provide: NavegacionRolService, useValue: new NavegacionRolService() },
                ...[CampanaService, ClaseService, DoteService, ConjuroService, HabilidadService, IdiomaService, DominioService, RazaService,
                    PlantillaService, EscuelaConjurosService, DisciplinaConjurosService, EnemigoPredilectoService, ArmaService, ArmaduraService,
                    GrupoArmaService, GrupoArmaduraService, SubtipoService].map((provide) => ({ provide, useValue: {} })),
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(AdquirirPlantillaComponent);
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

    it('sin sus requisitos solo se ofrece si la campaña lo deja o se salta su política (la regla de la creación)', async () => {
        const componente: any = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        const plantilla = { Id: 9, Nombre: 'Vampiro', Oficial: true } as any;
        const evaluacion = { estado: 'blocked_failed', razones: ['Requiere 5 DG'], advertencias: [], saltable: true };
        expect(componente.opcion(plantilla, evaluacion, false, true, []).estado).toBe('saltable');
        const bloqueada = componente.opcion(plantilla, evaluacion, false, false, []);
        expect(bloqueada.estado).toBe('bloqueada');
        expect(bloqueada.motivo).toContain('no se pueden saltar sus requisitos');
    });

    it('la cabecera dice qué hace y sus PX con su NEP', async () => {
        await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        const texto = fixture.nativeElement.querySelector('.subida__cabecera')?.textContent ?? '';
        expect(texto).toContain('Adquirir una plantilla');
        expect(texto).toContain('6.100 PX · NEP 3');
    });

    describe('una clase que deja de admitir su alineamiento (el paladín que se vuelve vampiro)', () => {
        const paladin = {
            Id: 6, Nombre: 'Paladín',
            Alineamiento: {
                Id: 1, Basico: { Id_basico: 1, Nombre: '' }, Ley: { Id_ley: 0, Nombre: '', Valor: null, Prohibe: false, Id_prioridad: 0 },
                Moral: { Id_moral: 0, Nombre: '', Valor: null, Prohibe: false, Id_prioridad: 0 }, Prioridad: { Id_prioridad: 3, Nombre: '' },
                Descripcion: '',
            },
            Alineamiento_deidad: false, Prerrequisitos_flags: {}, Prerrequisitos: {},
            Ex: { Pierde_magia: true, Requiere_expiacion: true, Especiales: [{ Id: 30, Nombre: 'Castigar al mal' }] },
        };

        async function preparado(rolActor: 'jugador' | 'master', politica: Record<string, unknown> | null, tipo = 'pj'): Promise<any> {
            const componente: any = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            componente.rolActor = rolActor;
            componente.pj = { Oficial: true, PoliticaCompra: politica };
            componente.pjAntes = { Alineamiento: 'Legal bueno' };
            componente.entrada = { personaje: { tipo }, colecciones: { clases: [{ idClase: 6 }] }, decisionesHomebrew: [] };
            componente.elegida = { Id: 9, Nombre: 'Vampiro', Oficial: true };
            spyOn(componente.svc, 'claseDelCatalogo').and.returnValue(paladin);
            componente.svc.PersonajeCreacion.Alineamiento = 'Legal maligno';
            spyOn(componente, 'calcularPg');
            spyOn(componente, 'razaContraElAlineamientoNuevo').and.returnValue(null);
            return componente;
        }

        const sinAlineamiento = { permitirHomebrewGeneral: true, maxFuentesHomebrewGeneralesPorPersonaje: null, permitirIgnorarRestriccionesAlineamiento: false };

        it('el jugador de una campaña que no deja saltarse el alineamiento no puede mantenerla: queda ex', async () => {
            const componente = await preparado('jugador', sinAlineamiento);
            componente.prepararResumen();
            const [clase] = componente.clasesContraAlineamiento;
            expect(clase.puedeMantener).toBeFalse();
            expect(clase.motivoNoMantener).toContain('no deja saltarse');
            expect(componente.avisoDelMaster).toBe('');
            expect(componente.cambios.some((c: any) => c.que === 'Ex paladín' && c.porque.includes('Castigar al mal'))).toBeTrue();
        });

        it('el máster la mantiene como homebrew, con su aviso y la decisión alineamiento_clase; y puede dejarla ex', async () => {
            const componente = await preparado('master', sinAlineamiento);
            componente.prepararResumen();
            expect(componente.avisoDelMaster).toContain('Como máster');
            // Avisa antes de volver homebrew la ficha (la confirmación de siempre).
            const swal = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
            await componente.mantenerClase(componente.clasesContraAlineamiento[0]);
            expect(swal).toHaveBeenCalledTimes(1);
            expect(componente.clasesContraAlineamiento[0].mantenida).toBeTrue();
            expect(componente.cambios.find((c: any) => c.que === 'Paladín').porque).toContain('Se mantiene como homebrew');
            componente.dejarEx(componente.clasesContraAlineamiento[0]);
            expect(componente.clasesContraAlineamiento[0].mantenida).toBeFalse();
        });

        it('quien la campaña deja saltarse el alineamiento, y un PNJ, también; la ficha lleva la decisión', async () => {
            for (const [rol, politica, tipo] of [['jugador', { ...sinAlineamiento, permitirIgnorarRestriccionesAlineamiento: true }, 'pj'],
                ['jugador', sinAlineamiento, 'pnj'], ['jugador', null, 'pj']] as const) {
                TestBed.resetTestingModule();
                const componente = await preparado(rol, politica, tipo);
                componente.prepararResumen();
                expect(componente.clasesContraAlineamiento[0].puedeMantener).withContext(`${tipo} ${JSON.stringify(politica)}`).toBeTrue();
                componente.clasesContraAlineamiento[0].mantenida = true;
                expect(componente.decisionesNuevas()).toEqual([{ tipo: 'alineamiento_clase', idElemento: 6 }]);
            }
        });
    });
});
