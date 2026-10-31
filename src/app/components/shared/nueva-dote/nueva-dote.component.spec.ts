import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { DoteService } from 'src/app/services/dote.service';
import { ExtraService } from 'src/app/services/extra.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { ManualService } from 'src/app/services/manual.service';
import { UserService } from 'src/app/services/user.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { EscuelaConjurosService } from 'src/app/services/escuela-conjuros.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ClaseService } from 'src/app/services/clase.service';
import { RazaService } from 'src/app/services/raza.service';
import { DominioService } from 'src/app/services/dominio.service';
import { RegionService } from 'src/app/services/region.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { EspecialService } from 'src/app/services/especial.service';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { PrerrequisitosTiposService } from 'src/app/services/prerrequisitos-tipos.service';
import { AptitudEspecialService } from 'src/app/services/aptitud-especial.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { NuevaDoteComponent } from './nueva-dote.component';
import { normalizeDoteApi } from 'src/app/services/utils/dote-mapper';
import { IDA_Y_VUELTA } from 'src/testing/ida-y-vuelta-dotes-conjuros';
import { cuerpoComparable } from 'src/testing/cuerpo-de-catalogo';

describe('NuevaDoteComponent', () => {
    let component: NuevaDoteComponent;
    let fixture: ComponentFixture<NuevaDoteComponent>;

    const doteSvcMock = {
        getDotes: () => of([
            {
                Id: 1,
                Nombre: 'Ataque poderoso',
                Tipos: [{ Id: 1, Nombre: 'Combate', Usado: 1 }],
                Extras_soportados: {
                    Extra_arma: 1,
                    Extra_armadura_armaduras: 0,
                    Extra_armadura_escudos: 0,
                    Extra_armadura: 0,
                    Extra_escuela: 0,
                    Extra_habilidad: 0,
                },
                Extras_disponibles: {
                    Armas: [{ Id: 101, Nombre: 'Espada larga' }],
                    Armaduras: [],
                    Escuelas: [],
                    Habilidades: [],
                },
            },
            {
                Id: 2,
                Nombre: 'Especialización con escudo',
                Tipos: [{ Id: 1, Nombre: 'Combate', Usado: 1 }],
                Extras_soportados: {
                    Extra_arma: 0,
                    Extra_armadura_armaduras: 0,
                    Extra_armadura_escudos: 1,
                    Extra_armadura: 0,
                    Extra_escuela: 0,
                    Extra_habilidad: 0,
                },
                Extras_disponibles: {
                    Armas: [],
                    Armaduras: [
                        { Id: 301, Nombre: 'Cota de mallas', Es_escudo: false },
                        { Id: 302, Nombre: 'Escudo pesado', Es_escudo: true },
                    ],
                    Escuelas: [],
                    Habilidades: [],
                },
            },
        ]),
        crearDote: jasmine.createSpy('crearDote').and.resolveTo({ message: 'ok', idDote: 22, uid: 'uid-1' }),
    };

    const habilidadSvcMock = {
        getHabilidades: () => of([
            {
                Id_habilidad: 7,
                Nombre: 'Acrobacias',
                Soporta_extra: true,
                Extras: [{ Id_extra: 3, Extra: 'Cuerda floja' }],
            },
        ]),
        getHabilidadesCustom: () => of([]),
        habilidadesCustomMutadas$: new Subject<any>(),
    };

    const manualSvcMock = {
        getManuales: () => of([{ Id: 1, Nombre: 'Manual basico' }]),
    };

    const userSvcMock = {
        acl$: of({}),
        isLoggedIn$: of(true),
        CurrentUserUid: 'uid-1',
        can: () => true,
        getPermissionDeniedMessage: () => 'No dispones de los permisos necesarios para realizar esta acción. Puedes solicitar convertirte en master desde tu perfil.',
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NuevaDoteComponent],
            imports: [
                ReactiveFormsModule,
                NoopAnimationsModule,
                MatAutocompleteModule,
                MatButtonModule,
                MatCheckboxModule,
                MatChipsModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatRadioModule,
                MatSelectModule,
                MatTooltipModule,
            ],
            providers: [
                { provide: DoteService, useValue: doteSvcMock },
                { provide: PrerrequisitosTiposService, useValue: { cargar: () => Promise.resolve() } },
                { provide: ExtraService, useValue: { getExtras: () => of([{ Id: 55, Nombre: 'Planos' }]) } },
                { provide: HabilidadService, useValue: habilidadSvcMock },
                { provide: ManualService, useValue: manualSvcMock },
                { provide: UserService, useValue: userSvcMock },
                { provide: ArmaService, useValue: { getArmas: () => of([{ Id: 201, Nombre: 'Arco corto' }]) } },
                { provide: ArmaduraService, useValue: { getArmaduras: () => of([
                    { Id: 301, Nombre: 'Cota de mallas', Es_escudo: false },
                    { Id: 302, Nombre: 'Escudo pesado', Es_escudo: true },
                ]) } },
                { provide: EscuelaConjurosService, useValue: { getEscuelas: () => of([]) } },
                { provide: IdiomaService, useValue: { getIdiomas: () => of([]) } },
                { provide: ClaseService, useValue: { getClases: () => of([]) } },
                { provide: RazaService, useValue: { getRazas: () => of([]) } },
                { provide: DominioService, useValue: { getDominios: () => of([]) } },
                { provide: RegionService, useValue: { getRegiones: () => of([]) } },
                { provide: TipoCriaturaService, useValue: { getTiposCriatura: () => of([]) } },
                { provide: GrupoArmaService, useValue: { getGruposArmas: () => of([]) } },
                { provide: GrupoArmaduraService, useValue: { getGruposArmaduras: () => of([]) } },
                { provide: ConjuroService, useValue: { getConjuros: () => of([]) } },
                { provide: EspecialService, useValue: { getEspeciales: () => of([
                    { Id: 8, Nombre: 'Musica de bardo', Extra: true, Activa_extra: false, Extras: [] },
                    { Id: 9, Nombre: 'Esquiva asombrosa', Extra: false, Activa_extra: false, Extras: [] },
                ]) } },
                { provide: AptitudEspecialService, useValue: { getAptitudesEspeciales: () => of([
                    { Id: 13, Nombre: 'Arma de aliento', Raciales: [], Especiales: [], Plantillas: [{ Id: 6, Nombre: 'Semidragón' }], Comodin: null },
                    { Id: 9, Nombre: 'Agarrón mejorado', Raciales: [{ Id: 47, Nombre: 'Agarrón mejorado (azotamentes)' }], Especiales: [], Plantillas: [], Comodin: null },
                ]) } },
                { provide: AlineamientoService, useValue: { getAlineamientosBasicosCatalogo: () => of([]) } },
                { provide: TamanoService, useValue: { getTamanos: () => of([
                    { Id: 1, Nombre: 'Pequeno', Modificador: 1, Modificador_presa: -4 },
                    { Id: 2, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
                    { Id: 3, Nombre: 'Grande', Modificador: -1, Modificador_presa: 4 },
                ]) } },
                // `GET /actitudes`, tal como lo da la API de desarrollo.
                { provide: RazaCatalogosService, useValue: { getActitudes: () => of([
                    { Id: 1, Nombre: 'Legal' }, { Id: 2, Nombre: 'Neutral' }, { Id: 3, Nombre: 'Caótico' },
                    { Id: 4, Nombre: 'Bueno' }, { Id: 5, Nombre: 'Maligno' },
                ]) } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(NuevaDoteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('marca error si id_tipo e id_tipo2 son iguales', () => {
        component.form.controls.id_tipo.setValue(5);
        component.form.controls.id_tipo2.setValue(5);
        component.form.updateValueAndValidity();

        expect(component.form.hasError('tipos_iguales')).toBeTrue();
    });

    it('ofrece «Sin tipo secundario» con el id 0: el tipo 0 «Cualquiera» ya no sale en los tipos de las dotes', () => {
        expect(component.tiposDote[0]).toEqual({ Id: 0, Nombre: 'Sin tipo secundario' });
        expect(component.tiposPrimarios.some((tipo) => tipo.Id === 0)).toBeFalse();
        expect(component.form.controls.id_tipo2.value).toBe(0);
    });

    it('las actitudes de los prerrequisitos salen del catálogo, no de una lista escrita en el código', () => {
        expect(component.getCatalogoPrerrequisito('actitud_requerido')).toEqual([
            { id: 4, nombre: 'Bueno' }, { id: 3, nombre: 'Caótico' }, { id: 1, nombre: 'Legal' },
            { id: 5, nombre: 'Maligno' }, { id: 2, nombre: 'Neutral' },
        ]);
        expect(component.getCatalogoPrerrequisito('actitud_prohibido')).toBe(component.actitudesCatalogo);
    });

    it('detecta nombre duplicado normalizado', () => {
        component.form.controls.nombre.setValue('ataque PODEROSO');

        const error = (component as any).validarReglasDominio();
        expect(error).toContain('Ya existe una dote');
    });

    it('carga los catalogos de prerrequisitos en paralelo', async () => {
        const resolvers: Array<() => void> = [];
        const spy = spyOn<any>(component, 'asegurarCatalogo').and.callFake(() => new Promise<void>((resolve) => {
            resolvers.push(resolve);
        }));

        const pending = (component as any).asegurarCatalogosPrerrequisitos(['competencia_arma', 'dominio']);

        expect(spy.calls.count()).toBe(2);
        resolvers.forEach((resolve) => resolve());
        await pending;
    });

    it('sincroniza la seleccion confirmada sin colgar el flujo', async () => {
        component.selectorPrerrequisitosVisible = true;
        component.selectorPrerrequisitosTempKeys = ['ataque_base', 'dote'];
        component.prerrequisitoEditorHost = {
            prepareTypes: jasmine.createSpy('prepareTypes').and.callFake(async (types: string[]) => {
                component.onPrerrequisitosSeleccionadosChange(types as any);
                component.onPrerrequisitosRowsChange([
                    {
                        uid: 'pre-1',
                        tipo: 'ataque_base',
                        id: 0,
                        valor: 1,
                        opcional: 0,
                        id_extra: null,
                        repetido: 1,
                        requiere_extra: false,
                        salvacion_tipo: 'fortaleza',
                    },
                    {
                        uid: 'pre-2',
                        tipo: 'dote',
                        id: 1,
                        valor: 1,
                        opcional: 0,
                        id_extra: 0,
                        repetido: 2,
                        requiere_extra: false,
                        salvacion_tipo: 'fortaleza',
                    },
                ]);
            }),
        } as any;

        await component.confirmarSelectorPrerrequisitos();

        expect(component.prerrequisitoEditorHost?.prepareTypes).toHaveBeenCalledWith(['ataque_base', 'dote']);
        expect(component.prerrequisitosSeleccionados).toEqual(['ataque_base', 'dote']);
        expect(component.prerrequisitosEditor.length).toBe(2);
        expect(component.selectorPrerrequisitosVisible).toBeFalse();
        expect(component.confirmandoSelectorPrerrequisitos).toBeFalse();
    });

    it('considera pendientes los prerrequisitos incompletos', () => {
        component.prerrequisitosSeleccionados = ['habilidad'];
        component.prerrequisitosEditor = [{
            uid: 'pre-1',
            tipo: 'habilidad',
            id: 0,
            valor: 2,
            opcional: 0,
            id_extra: null,
            repetido: 1,
            requiere_extra: false,
            salvacion_tipo: 'fortaleza',
        }];

        expect(component.prerrequisitosPendientes).toBeTrue();
    });

    it('ofrece la aptitud especial con las aptitudes de su catálogo, no con los especiales de clase', async () => {
        expect(component.prerrequisitoOpciones.some((item) => item.key === 'aptitud_especial')).toBeTrue();

        await (component as any).asegurarCatalogo('aptitudes_especiales');

        expect(component.getCatalogoPrerrequisito('aptitud_especial')).toEqual([
            { id: 9, nombre: 'Agarrón mejorado' },
            { id: 13, nombre: 'Arma de aliento' },
        ]);
    });

    it('guarda la aptitud especial con su Id_aptitud_especial', async () => {
        await (component as any).asegurarCatalogo('aptitudes_especiales');
        component.prerrequisitosEditor = [{
            uid: 'apt',
            tipo: 'aptitud_especial',
            id: 13,
            valor: 1,
            opcional: 0,
            id_extra: null,
            repetido: 1,
            requiere_extra: false,
            salvacion_tipo: 'fortaleza',
        }];

        expect((component as any).construirPrerrequisitosPayload()).toEqual({
            aptitud_especial: [{ Id_aptitud_especial: 13, Aptitud_especial: 'Arma de aliento' }],
        });
    });

    it('detecta si un especial permite extra', async () => {
        await (component as any).asegurarCatalogo('especiales');

        expect(component.especialCatalogoPermiteExtra(8)).toBeTrue();
        expect(component.especialCatalogoPermiteExtra(9)).toBeFalse();
    });

    it('usa el catalogo del tipo de extra de la dote requerida', async () => {
        await (component as any).asegurarCatalogo('armas');

        expect(component.doteCatalogoPermiteExtra(1)).toBeTrue();
        expect(component.getOpcionesExtraDote(1)).toEqual([{ id: 101, nombre: 'Espada larga' }]);
    });

    it('filtra escudos y armaduras segun los subtipos activos', async () => {
        component.form.controls.extra_armadura_armaduras.setValue(true);
        component.form.controls.extra_armadura_escudos.setValue(false);
        await (component as any).asegurarCatalogo('armaduras');

        expect(component.itemsSelectorExtrasActual.map((item) => item.nombre)).toEqual(['Cota de mallas']);

        component.onSubtipoArmaduraChange('escudos', true);

        expect(component.itemsSelectorExtrasActual.map((item) => item.nombre)).toEqual(['Cota de mallas', 'Escudo pesado']);
    });

    it('limita a escudos los extras de una dote prerrequisito con soporte solo de escudos', async () => {
        await (component as any).asegurarCatalogo('armaduras');

        expect(component.getOpcionesExtraDote(2)).toEqual([
            { id: 302, nombre: 'Escudo pesado', esEscudo: true } as any,
        ]);
    });

    it('carga tamanos desde el catalogo dedicado y no desde razas', async () => {
        await (component as any).asegurarCatalogo('tamanos');

        expect(component.tamanosCatalogo).toEqual([
            { id: 3, nombre: 'Grande' },
            { id: 2, nombre: 'Mediano' },
            { id: 1, nombre: 'Pequeno' },
        ]);
    });

    it('prioriza Compendio de dotes como manual por defecto cuando existe', () => {
        component.manuales = [
            { Id: 1, Nombre: 'Manual basico' } as any,
            { Id: 7, Nombre: 'Compendio de dotes' } as any,
        ];
        component.form.controls.id_manual.setValue(0);

        (component as any).sincronizarManualSeleccionado();

        expect(component.form.controls.id_manual.value).toBe(7);
    });

    it('el manual sale del buscador común de catálogos, con sus opciones', () => {
        expect(component.manualesOpciones).toEqual([{ id: 1, nombre: 'Manual basico' }]);
        component.seleccionarManual(1);
        expect(component.form.controls.id_manual.value).toBe(1);
    });

    describe('«Modificar dote»', () => {
        // TestBed inyecta una copia del doble (`useValue`): los espías van en la instancia inyectada.
        const servicio = () => TestBed.inject(DoteService) as any;

        async function abrir(get: any): Promise<void> {
            servicio().getDoteFresco = jasmine.createSpy('getDoteFresco').and.returnValue(of(normalizeDoteApi(get)));
            component.modo = 'editar';
            component.idDote = get.Id;
            component.ngOnChanges({ idDote: {} as any });
            // La dote llega después de cargar los catálogos que necesita (promesas encadenadas): se espera a que acabe.
            for (let intento = 0; intento < 50 && component.edicion.cargando; intento++)
                await new Promise((resolver) => setTimeout(resolver, 10));
        }

        IDA_Y_VUELTA.dotes.forEach(({ id, nombre, get, cuerpo }) => {
            it(`guardar sin cambios «${nombre}» (${id}) manda el cuerpo que devuelve el mismo GET`, async () => {
                await abrir(get);

                expect(component.edicion.cargando).toBeFalse();
                expect(component.edicion.hayCambios).toBeFalse();
                expect(cuerpoComparable((component as any).buildPayload(), cuerpo)).toEqual(cuerpoComparable(cuerpo, cuerpo));
            });
        });

        it('guarda con PUT, avisa con el aviso común y devuelve la dote de la API', async () => {
            const { get } = IDA_Y_VUELTA.dotes[0];
            servicio().actualizarDote = jasmine.createSpy('actualizarDote')
                .and.resolveTo({ message: 'Dote actualizada exitosamente', idDote: get.Id, dote: normalizeDoteApi(get) });
            await abrir(get);
            const actualizada = jasmine.createSpy('doteActualizada');
            const cerrar = jasmine.createSpy('cerrar');
            component.doteActualizada.subscribe(actualizada);
            component.cerrar.subscribe(cerrar);
            spyOn(Swal, 'fire').and.resolveTo({} as any);

            await component.guardarDote();

            expect(servicio().actualizarDote).toHaveBeenCalledWith(get.Id, jasmine.any(Object));
            expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                icon: 'success', title: 'Dote actualizada', text: 'Dote actualizada exitosamente',
            }));
            expect(actualizada).toHaveBeenCalledWith(jasmine.objectContaining({ Id: get.Id }));
            expect(cerrar).toHaveBeenCalled();
        });

        it('el error de la API va al marco y, con su campo, al campo', async () => {
            const { get } = IDA_Y_VUELTA.dotes[0];
            servicio().actualizarDote = jasmine.createSpy('actualizarDote').and.rejectWith(
                new ProfileApiError('Ya existe una dote con ese nombre.', 'nombre_duplicado', 409, 'dote.nombre'));
            await abrir(get);

            await component.guardarDote();

            expect(component.errorDelMarco).toBe('Ya existe una dote con ese nombre.');
            expect(component.errorDe('nombre', 'por defecto')).toBe('Ya existe una dote con ese nombre.');
        });

        it('su propio nombre no cuenta como repetido', async () => {
            await abrir({ ...IDA_Y_VUELTA.dotes[0].get, Id: 1, Nombre: 'Ataque poderoso' });
            expect((component as any).validarReglasDominio()).not.toContain('Ya existe una dote');
        });
    });

    it('los modificadores usan las claves del alta de la API (`modificadores` de POST /dotes/add)', () => {
        expect(component.modificadoresCatalogo.map((item) => item.key)).toEqual([
            'pg_a_n', 'pg_a', 'caracteristica', 'habilidad', 'fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria',
            'carisma', 'ca', 'toque', 'desprevenido', 'arm_nat', 'ata_base', 'presa', 'iniciativa', 'fortaleza', 'reflejos',
            'voluntad', 'espacio', 'alcance', 'correr', 'nadar', 'volar', 'trepar', 'excavar',
        ]);
    });
});
