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
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { PlantillaService } from 'src/app/services/plantilla.service';
import { RazaService } from 'src/app/services/raza.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { PlanReciclaje } from 'src/app/services/utils/reciclaje';
import { ENTRADA_ENANO_CLERIGO_1 } from 'src/testing/subida-nivel-api';
import { SubirNivelComponent } from './subir-nivel.component';

describe('SubirNivelComponent (la subida de nivel, fase 4)', () => {
    let fixture: ComponentFixture<SubirNivelComponent>;
    let sesiones: jasmine.SpyObj<SesionesService>;

    const experiencia = (cambios: Record<string, unknown> = {}) => ({
        px: 6100, nivel: 3, pxNivelActual: 3000, pxSiguienteNivel: 6000, puedeSubir: true, nivelesPorSubir: 1,
        sesionAbierta: { numero: 3, titulo: 'Sesión 3' }, ...cambios,
    });

    /**
     * `carga`: la sesión abierta con la `entrada` real de rol_dev y la ficha (`pj`) que da el motor, para llegar a los pasos
     * (con el motor de la creación de verdad, sin catálogos).
     */
    async function crear(historial: Record<string, unknown>, carga?: { pj: Record<string, unknown>; }): Promise<SubirNivelComponent> {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'sesion', 'subirNivel']);
        sesiones.historial.and.resolveTo({ idPersonaje: 5, puedeApuntar: true, veNotas: true, sesiones: [], experiencia: experiencia(), ...historial } as any);
        const motor = carga ? {
            cargarSesionDeJuego: async () => ({
                historial: {},
                cargada: {
                    sesion: { numero: 3, version: 'v3', estado: 'abierta' }, entrada: JSON.parse(JSON.stringify(ENTRADA_ENANO_CLERIGO_1)),
                    pj: { Nombre: 'Tordek', Oficial: true, Nivel_personaje: 3, desgloseClases: [], ...carga.pj }, nivelesPerdidos: [],
                },
            }),
            hidratar: async () => undefined,
            cuerpoDelMotor: () => JSON.parse(JSON.stringify(ENTRADA_ENANO_CLERIGO_1)),
            primero: async () => null,
        } : null;
        await TestBed.configureTestingModule({
            imports: [SubirNivelComponent, NoopAnimationsModule],
            providers: [
                { provide: Auth, useValue: { currentUser: { uid: 'cuenta-a' } } },
                { provide: SesionesService, useValue: sesiones },
                { provide: PersonajeService, useValue: {} },
                { provide: UserSettingsService, useValue: {} },
                { provide: SubidaNivelPuertaService, useValue: new SubidaNivelPuertaService() },
                ...[CampanaService, ClaseService, DoteService, ConjuroService, HabilidadService, IdiomaService, DominioService, RazaService,
                    PlantillaService, EscuelaConjurosService, DisciplinaConjurosService, EnemigoPredilectoService, ArmaService, ArmaduraService,
                    GrupoArmaService, GrupoArmaduraService, SubtipoService].map((provide) => ({ provide, useValue: {} })),
                ...(motor ? [{ provide: MotorDesdeFichaService, useValue: motor }] : []),
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(SubirNivelComponent);
        fixture.componentRef.setInput('idPersonaje', 5);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.componentInstance;
    }

    it('sin una sesión de juego abierta no sube: dice que hay que abrirla', async () => {
        const componente = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        expect(componente.error).toContain('hace falta una sesión de juego abierta');
        expect(fixture.nativeElement.textContent).toContain('hace falta una sesión de juego abierta');
        expect(sesiones.sesion).not.toHaveBeenCalled();
    });

    it('sin los PX del siguiente nivel tampoco', async () => {
        expect((await crear({ experiencia: experiencia({ puedeSubir: false, nivelesPorSubir: 0 }) })).error).toContain('Aún no le llegan los PX');
    });

    it('quien ve la ficha sin poder apuntar no sube', async () => {
        expect((await crear({ puedeApuntar: false })).error).toContain('Solo su dueño o el máster');
    });

    it('la cabecera dice a qué nivel sube y desde cuántos PX (lienzo, pantalla 4)', async () => {
        await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        const texto = fixture.nativeElement.querySelector('.subida__cabecera')?.textContent ?? '';
        expect(texto).toContain('sube a nivel 4');
        expect(texto).toContain('PX');
    });

    describe('el paso «Reciclar» (Manual del jugador II, págs. 194-196)', () => {
        const pasos = () => Array.from(fixture.nativeElement.querySelectorAll('.subida__paso') as NodeListOf<HTMLElement>).map((p) => (p.textContent ?? '').trim());

        afterEach(() => {
            try {
                localStorage.removeItem('fichas35.subidaNivel.draft.v1.cuenta-a.5');
            } catch { /* sin almacenamiento */ }
        });

        it('sin campaña (o en un PNJ, sin política) va el primero, antes de los del nivel, y viene marcado «No reciclar nada»', async () => {
            const componente = await crear({}, { pj: { PoliticaCompra: null } });
            expect(componente.error).toBe('');
            expect(componente.pasos).toEqual(['reciclar', 'clase', 'resumen']);
            expect(componente.paso).toBe('reciclar');
            expect(pasos()[0]).toBe('1 · Reciclar');
            const texto = fixture.nativeElement.textContent;
            expect(texto).toContain('Reciclar (opcional)');
            const radios = Array.from(fixture.nativeElement.querySelectorAll('input[name="tipoReciclaje"]') as NodeListOf<HTMLInputElement>);
            expect(radios.length).toBe(5);
            expect(radios[0].checked).toBeTrue();
            expect(texto).toContain('No reciclar nada');
            expect(texto).toContain('Reciclar una dote');
            expect(texto).toContain('Reciclar habilidades');
            expect(texto).toContain('Continuar sin reciclar');
        });

        it('una campaña que lo deja (sin dato, sí) también lo enseña; con permitirReciclaje: false, la subida empieza por la clase', async () => {
            expect((await crear({}, { pj: { PoliticaCompra: { permitirHomebrewGeneral: true, permitirReciclaje: true } } })).paso).toBe('reciclar');
            TestBed.resetTestingModule();
            const componente = await crear({}, { pj: { PoliticaCompra: { permitirHomebrewGeneral: true, permitirReciclaje: false } } });
            expect(componente.pasos).toEqual(['clase', 'resumen']);
            expect(componente.paso).toBe('clase');
            expect(fixture.nativeElement.textContent).not.toContain('Reciclar (opcional)');
        });

        it('«Continuar sin reciclar» sigue con la clase y no manda nada de reciclaje', async () => {
            const componente = await crear({}, { pj: { PoliticaCompra: null } });
            await componente.confirmarReciclaje();
            expect(componente.paso).toBe('clase');
            expect(componente.plan).toBeNull();
            expect(componente.empezada).toBeFalse();
        });

        it('lo reciclado va en el cuerpo de la subida y en la ficha; su error, de vuelta en «Reciclar»', async () => {
            const componente = await crear({}, { pj: { PoliticaCompra: null } });
            const plan: PlanReciclaje = { tipo: 'idioma', quita: { idIdioma: 6, nombre: 'Orco' }, pone: { idIdioma: 9, nombre: 'Gnomo' } };
            const c = componente as any;
            c.plan = plan;
            c.entradaReciclada = { ...ENTRADA_ENANO_CLERIGO_1, colecciones: { ...ENTRADA_ENANO_CLERIGO_1.colecciones, idiomas: [{ idIdioma: 9, origen: 'Idiomas iniciales' }] } };
            componente.claseElegida = { Id: 4, Nombre: 'Clérigo' } as any;
            componente.daDg = false;
            componente.pasos = ['reciclar', 'clase', 'resumen'];
            componente.paso = 'resumen';
            sesiones.subirNivel.and.rejectWith(Object.assign(new Error('El druídico es un idioma secreto: no se recicla.'), { code: 'reciclaje_no_valido', field: 'reciclaje.quita.idIdioma' }));
            await componente.guardar(false);
            const cuerpo = sesiones.subirNivel.calls.mostRecent().args[1];
            expect(cuerpo.reciclaje).toEqual({ tipo: 'idioma', quita: { idIdioma: 6 }, pone: { idIdioma: 9 } });
            expect(cuerpo.ficha.colecciones?.idiomas?.map((i) => i.idIdioma)).toEqual([9]);
            expect(componente.paso).toBe('reciclar');
            fixture.detectChanges();
            const texto = fixture.nativeElement.textContent;
            expect(texto).toContain('El druídico es un idioma secreto');
            expect(texto).toContain('Reciclaje: idioma: Orco → Gnomo');
            expect(texto).toContain('Volver al resumen');
        });
    });
});
