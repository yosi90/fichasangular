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
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RazaService } from 'src/app/services/raza.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { PerderNivelComponent } from './perder-nivel.component';

describe('PerderNivelComponent (perder un nivel, fase 7)', () => {
    let fixture: ComponentFixture<PerderNivelComponent>;
    let sesiones: jasmine.SpyObj<SesionesService>;

    const experiencia = (cambios: Record<string, unknown> = {}) => ({
        px: 12000, nivel: 5, pxNivelActual: 10000, pxSiguienteNivel: 15000, puedeSubir: false, nivelesPorSubir: 0,
        sesionAbierta: { numero: 3, titulo: 'Sesión 3' }, ...cambios,
    });

    async function crear(historial: Record<string, unknown>): Promise<PerderNivelComponent> {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'sesion', 'perderNivel']);
        sesiones.historial.and.resolveTo({ idPersonaje: 5, puedeApuntar: true, veNotas: true, sesiones: [], experiencia: experiencia(), ...historial } as any);
        await TestBed.configureTestingModule({
            imports: [PerderNivelComponent, NoopAnimationsModule],
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
        fixture = TestBed.createComponent(PerderNivelComponent);
        fixture.componentRef.setInput('idPersonaje', 5);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.componentInstance;
    }

    it('sin una sesión de juego abierta no se apunta: dice que hay que abrirla', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        expect(componente.error).toContain('hace falta una sesión de juego abierta');
        expect(sesiones.sesion).not.toHaveBeenCalled();
    });

    it('quien ve la ficha sin poder apuntar tampoco', async () => {
        expect((await crear({ puedeApuntar: false })).error).toContain('Solo su dueño o el máster');
    });

    it('con un solo DG: un nivel negativo lo mata (no se puede) y al volver a la vida pierde 2 de Constitución', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        componente.entrada = {
            personaje: { puntosGolpe: 5 }, colecciones: { clases: [{ idClase: 9, nivel: 1 }] },
            caracteristicas: { constitucion: { valor: 12, minimo: 0, perdido: false } },
            niveles: [{ idClase: 9, nivelClase: 1, pg: { tirada: 4, maximo: true }, elecciones: [] }],
        } as any;
        componente.dgs = 1;
        componente.elegirCausa('nivel_negativo');
        expect(componente.impedimento).toContain('Guía del DM, pág. 291');
        expect(componente.puedeGuardar).toBeFalse();
        componente.elegirCausa('revivir');
        expect(componente.impedimento).toBe('');
        expect(componente.filas[0]).toEqual({ que: 'Constitución', antes: '12', ahora: '10' });
        expect(componente.resultado?.ficha.caracteristicas.constitucion.valor).toBe(10);
        expect(componente.puedeGuardar).toBeTrue();
    });
});
