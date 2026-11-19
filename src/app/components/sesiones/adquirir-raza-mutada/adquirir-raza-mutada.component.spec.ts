import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { RazaService } from 'src/app/services/raza.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
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
import { PlantillaService } from 'src/app/services/plantilla.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { normalizeRazaApi } from 'src/app/services/utils/raza-mapper';
import { NACIDO_DEL_INFIERNO_SOBRE_HUMANO_API, PROLE_SOBRE_API, RAZAS_API } from 'src/testing/razas-mutadas-api';
import { AdquirirRazaMutadaComponent } from './adquirir-raza-mutada.component';

describe('AdquirirRazaMutadaComponent (adquirir una raza mutada, fase 7)', () => {
    let fixture: ComponentFixture<AdquirirRazaMutadaComponent>;
    let sesiones: jasmine.SpyObj<SesionesService>;
    let razas: jasmine.SpyObj<RazaService>;

    const PROLE = normalizeRazaApi(RAZAS_API['21']);
    const MEDIANO = normalizeRazaApi(RAZAS_API['5']);
    const NACIDO = normalizeRazaApi(NACIDO_DEL_INFIERNO_SOBRE_HUMANO_API);
    const HUMANOIDE = PROLE.Prerrequisitos['tipo_criatura'][0].Id_referencia!;

    const experiencia = (cambios: Record<string, unknown> = {}) => ({
        px: 10000, nivel: 5, pxNivelActual: 10000, pxSiguienteNivel: 15000, puedeSubir: false, nivelesPorSubir: 0,
        sesionAbierta: { numero: 3, titulo: 'Sesión 3' }, ...cambios,
    });

    async function crear(historial: Record<string, unknown>, motor: Partial<MotorDesdeFichaService> | null = null)
        : Promise<AdquirirRazaMutadaComponent> {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'sesion', 'adquirirRazaMutada']);
        sesiones.historial.and.resolveTo({ idPersonaje: 5, puedeApuntar: true, veNotas: true, sesiones: [], experiencia: experiencia(), ...historial } as any);
        razas = jasmine.createSpyObj<RazaService>('RazaService', ['getRazas', 'getModeloMutacion', 'getRazaSobreBase', 'comprobarRequisitosDelPersonaje']);
        await TestBed.configureTestingModule({
            imports: [AdquirirRazaMutadaComponent, NoopAnimationsModule],
            providers: [
                { provide: Auth, useValue: { currentUser: { uid: 'cuenta-a' } } },
                { provide: SesionesService, useValue: sesiones },
                { provide: RazaService, useValue: razas },
                { provide: PersonajeService, useValue: { consultaRequisitosMutacion: () => ({}) } },
                { provide: UserSettingsService, useValue: {} },
                { provide: SubidaNivelPuertaService, useValue: new SubidaNivelPuertaService() },
                { provide: NavegacionRolService, useValue: new NavegacionRolService() },
                ...(motor ? [{ provide: MotorDesdeFichaService, useValue: motor }] : []),
                ...[CampanaService, ClaseService, DoteService, ConjuroService, HabilidadService, IdiomaService, DominioService,
                    PlantillaService, EscuelaConjurosService, DisciplinaConjurosService, EnemigoPredilectoService, ArmaService, ArmaduraService,
                    GrupoArmaService, GrupoArmaduraService, SubtipoService].map((provide) => ({ provide, useValue: {} })),
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(AdquirirRazaMutadaComponent);
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

    it('con una raza mutada ya no ofrece otra: no se pone una mutación sobre otra', async () => {
        const componente = await crear({}, {
            cargarSesionDeJuego: async () => ({
                historial: {} as any,
                cargada: { sesion: { numero: 3, version: 'v' } as any, entrada: { personaje: { idRazaBase: 25 } } as any, pj: { RazaBase: { Id: 25, Nombre: 'Humano' } } as any },
            }),
        });
        expect(componente.error).toContain('Ya tiene una raza mutada');
        expect(razas.getRazas).not.toHaveBeenCalled();
    });

    it('la cabecera dice qué hace y sus PX con su NEP', async () => {
        await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        const texto = fixture.nativeElement.querySelector('.subida__cabecera')?.textContent ?? '';
        expect(texto).toContain('Adquirir una raza mutada');
        expect(texto).toContain('10.000 PX · NEP 5');
    });

    describe('la evaluación con el personaje de ahora', () => {
        async function preparado(): Promise<any> {
            const componente: any = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
            componente.entrada = { personaje: { idAlineamiento: 1, tipo: 'pj' }, colecciones: { clases: [{ idClase: 7, nivel: 5 }] } };
            componente.tiposPrerrequisito = [{ Clave: 'tipo_criatura', Dato: 'tipo_criatura', Comparador: 'es' }];
            razas.getRazaSobreBase.and.resolveTo(normalizeRazaApi(PROLE_SOBRE_API['5']));
            razas.comprobarRequisitosDelPersonaje.and.resolveTo([{ Frase: 'Inteligencia 3', Cumple: true, Confirma_master: false }]);
            return componente;
        }

        it('la prole sobre un mediano guerrero (humanoide): se puede elegir, con su combinación', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE, Nombre: 'Humanoide' };
            const opcion = await componente.evaluar(PROLE, MEDIANO, false);
            expect(opcion.estado).toBe('elegible');
            expect(opcion.combinada?.Nombre).toBe('Prole de Bahamut');
            // Con el momento de la adquisición (`?momento=despues`); la creación lo pide sin él.
            expect(razas.getRazaSobreBase).toHaveBeenCalledWith(21, 5, null, 'despues');
        });

        it('un mediano semicelestial (ajeno, por su plantilla) no hace el Rito, aunque su raza base sea humanoide', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE + 1, Nombre: 'Ajeno' };
            const opcion = await componente.evaluar(PROLE, MEDIANO, false);
            expect(opcion.estado).toBe('bloqueada');
            expect(opcion.motivo).toContain('Su tipo, con sus plantillas: Criatura de tipo humanoide');
        });

        it('lo que no cumple del personaje, con su frase; la condición del máster, un aviso; el homebrew que no admite la campaña', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE, Nombre: 'Humanoide' };
            razas.comprobarRequisitosDelPersonaje.and.resolveTo([{ Frase: 'Cualquier alineamiento no maligno', Cumple: false, Confirma_master: false }]);
            const opcion = await componente.evaluar(NACIDO, MEDIANO, false);
            expect(opcion.estado).toBe('bloqueada');
            expect(opcion.motivo).toContain('Cualquier alineamiento no maligno');
            // La condición del máster no la devuelve la API: sale del `pr` de la raza, como aviso.
            expect(opcion.avisos).toEqual([`${NACIDO.Prerrequisitos['condicion_master'][0].Frase} (lo confirma el máster)`]);
            const homebrew = await componente.evaluar({ ...PROLE, Oficial: false }, MEDIANO, true);
            expect(homebrew.motivo).toBe('La campaña no admite contenido homebrew.');
        });

        it('la prole renace adulta: con su tabla de edades (200 años), un mediano de 250 no; uno de 60, sí (con la suya sería de mediana edad)', async () => {
            const componente = await preparado();
            componente.svc.PersonajeCreacion.Tipo_criatura = { Id: HUMANOIDE, Nombre: 'Humanoide' };
            componente.svc.PersonajeCreacion.Edad = 250;
            const vieja = await componente.evaluar(PROLE, MEDIANO, false);
            expect(vieja.estado).toBe('bloqueada');
            expect(vieja.motivo).toContain('no es adulto');
            componente.svc.PersonajeCreacion.Edad = 60;
            expect((await componente.evaluar(PROLE, MEDIANO, false)).estado).toBe('elegible');
        });

        it('una base que la API no admite, con su error', async () => {
            const componente = await preparado();
            razas.getRazaSobreBase.and.rejectWith(new Error('La raza base no cumple lo que pide la raza mutada.'));
            const opcion = await componente.evaluar(PROLE, MEDIANO, false);
            expect(opcion.estado).toBe('bloqueada');
            expect(opcion.motivo).toContain('La raza base no cumple');
        });
    });

    it('los errores de la API, en su paso: los de la raza en «Raza»; lo que cuesta, la edad y la ficha, en el resumen', async () => {
        const componente: any = await crear({ experiencia: experiencia({ sesionAbierta: null }) });
        expect(componente.pasoDelError('idRaza', 'personaje_no_cumple_mutacion')).toBe('raza');
        expect(componente.pasoDelError('idRaza', 'mutacion_quita_dg_raciales')).toBe('raza');
        expect(componente.pasoDelError('idRaza', 'dinero_insuficiente')).toBe('resumen');
        expect(componente.pasoDelError('idRaza', 'experiencia_insuficiente')).toBe('resumen');
        expect(componente.pasoDelError('ficha.personaje.edad', 'mutacion_edad_no_adulta')).toBe('resumen');
        expect(componente.pasoDelError('ficha.personaje.idRazaBase', 'mutacion_no_cuadra')).toBe('resumen');
    });
});
