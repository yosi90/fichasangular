import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
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
import { of } from 'rxjs';
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
import { NuevaDoteComponent } from './nueva-dote.component';

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
                { provide: AlineamientoService, useValue: { getAlineamientosBasicosCatalogo: () => of([]) } },
                { provide: TamanoService, useValue: { getTamanos: () => of([
                    { Id: 1, Nombre: 'Pequeno', Modificador: 1, Modificador_presa: -4 },
                    { Id: 2, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
                    { Id: 3, Nombre: 'Grande', Modificador: -1, Modificador_presa: 4 },
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

    it('oculta el prerrequisito inherente del selector visible', () => {
        expect(component.prerrequisitoOpciones.some((item) => item.key === 'inherente')).toBeFalse();
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
});
