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
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
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
                    GrupoArmaService, GrupoArmaduraService].map((provide) => ({ provide, useValue: {} })),
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

    it('la cabecera dice qué hace y sus PX con su NEP', async () => {
        await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        const texto = fixture.nativeElement.querySelector('.subida__cabecera')?.textContent ?? '';
        expect(texto).toContain('Adquirir una plantilla');
        expect(texto).toContain('6.100 PX · NEP 3');
    });
});
