import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { ArmaService, normalizeArma } from 'src/app/services/arma.service';
import { ArmaduraService, normalizeArmadura } from 'src/app/services/armadura.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { ManualService } from 'src/app/services/manual.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { UserService } from 'src/app/services/user.service';
import { IDA_Y_VUELTA_EQUIPO } from 'src/testing/ida-y-vuelta-equipo';
import { NuevoEquipoComponent } from './nuevo-equipo.component';

describe('NuevoEquipoComponent', () => {
    let fixture: ComponentFixture<NuevoEquipoComponent>;
    let component: NuevoEquipoComponent;
    let armaSvc: jasmine.SpyObj<ArmaService>;
    let armaduraSvc: jasmine.SpyObj<ArmaduraService>;
    let puede = true;

    const catalogos = {
        Manejos_armas: [{ Id: 1, Nombre: 'Sin armas' }, { Id: 2, Nombre: 'Ligera' }, { Id: 3, Nombre: 'A una mano' }, { Id: 4, Nombre: 'A dos manos' }],
        Propiedades_armas: [{ Id: 1, Nombre: 'Derribo', Descripcion: 'Ataques de derribo.' }, { Id: 2, Nombre: 'Desarmar', Descripcion: 'Bonificador.' }],
        Tipos_dano: [{ Id: 1, Nombre: 'Contundente' }, { Id: 3, Nombre: 'Cortante' }],
        Tipos_arma: [{ Id: 1, Nombre: 'Sencilla' }, { Id: 2, Nombre: 'Marcial' }],
        Pesos_armadura: [{ Id: 1, Nombre: 'Ligera' }, { Id: 2, Nombre: 'Intermedia' }, { Id: 3, Nombre: 'Pesada' }],
        Tipos_escudo: [{ Id: 1, Nombre: 'Broquel' }, { Id: 2, Nombre: 'Ligero' }],
    };

    async function montar(tipo: 'arma' | 'armadura', modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        armaSvc = jasmine.createSpyObj<ArmaService>('ArmaService', ['getArmaFresca', 'crearArma', 'actualizarArma']);
        armaduraSvc = jasmine.createSpyObj<ArmaduraService>('ArmaduraService', ['getArmaduraFresca', 'crearArmadura', 'actualizarArmadura']);
        if (get) {
            armaSvc.getArmaFresca.and.returnValue(of(normalizeArma(get)));
            armaduraSvc.getArmaduraFresca.and.returnValue(of(normalizeArmadura(get)));
        }
        await TestBed.configureTestingModule({
            declarations: [NuevoEquipoComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatButtonModule, MatChipsModule, MatFormFieldModule, MatIconModule,
                MatInputModule, MatSelectModule],
            providers: [
                { provide: ArmaService, useValue: armaSvc },
                { provide: ArmaduraService, useValue: armaduraSvc },
                {
                    provide: EquipoService, useValue: {
                        getCatalogos: () => of(catalogos),
                        getMateriales: () => of([{ Id: 4, Nombre: 'Acero' }, { Id: 7, Nombre: 'Adamantita' }]),
                        getMuniciones: () => of([{ Id: 67, Nombre: 'Perdigones' }]),
                    },
                },
                { provide: ManualService, useValue: { getManuales: () => of([{ Id: 54, Nombre: 'Manual del jugador 1' }]) } },
                { provide: TamanoService, useValue: { getTamanos: () => of([{ Id: 4, Nombre: 'Pequeño' }, { Id: 5, Nombre: 'Mediano' }]) } },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: () => puede,
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevoEquipoComponent);
        component = fixture.componentInstance;
        component.tipo = tipo;
        component.modo = modo;
        component.idEntrada = get?.Id ?? null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => {
        puede = true;
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    describe('ida y vuelta (respuestas reales de rol_dev)', () => {
        IDA_Y_VUELTA_EQUIPO.armas.forEach(({ id, nombre, get, cuerpo }) => {
            it(`arma «${nombre}» (${id}): cargada y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                await montar('arma', 'editar', get);

                expect(component.edicion.cargando).toBeFalse();
                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
            });
        });

        IDA_Y_VUELTA_EQUIPO.armaduras.forEach(({ id, nombre, get, cuerpo }) => {
            it(`armadura «${nombre}» (${id}): cargada y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                await montar('armadura', 'editar', get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
            });
        });
    });

    it('«Elegir» del tipo de daño de la presa sale entre las opciones aunque el catálogo no lo liste', async () => {
        const presa = IDA_Y_VUELTA_EQUIPO.armas.find((entrada) => entrada.get.Tipo_dano?.Id === 0)!;
        await montar('arma', 'editar', presa.get);

        expect(component.tiposDano.map((tipo) => tipo.Id)).toEqual([0, 1, 3]);
    });

    it('modificar guarda con PUT, avisa y emite el arma de la API', async () => {
        const { get } = IDA_Y_VUELTA_EQUIPO.armas.find((entrada) => entrada.get.Propiedades.length > 0)!;
        await montar('arma', 'editar', get);
        armaSvc.actualizarArma.and.resolveTo({ message: 'Arma actualizada exitosamente', idArma: get.Id, arma: normalizeArma(get) });
        const actualizada = jasmine.createSpy('actualizada');
        component.equipoActualizado.subscribe(actualizada);
        component.form.controls.precio.setValue(99);

        await component.guardar();

        expect(armaSvc.actualizarArma).toHaveBeenCalledWith(get.Id, jasmine.objectContaining({
            arma: jasmine.objectContaining({ precio: 99 }),
        }));
        expect(actualizada).toHaveBeenCalled();
        expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ icon: 'success' }));
    });

    it('un arma nueva: Mediana por defecto, sin material y con sus propiedades', async () => {
        await montar('arma');
        armaSvc.crearArma.and.resolveTo({ message: 'Arma creada exitosamente', idArma: 300, arma: normalizeArma({ Id: 300 }) });
        component.form.patchValue({
            nombre: 'Espada de fuego', id_manual: 54, pagina: 3, precio: 15, peso: 4, id_tipo_dano: 3, id_tipo_arma: 2,
            id_manejo: 3, dano_pequeno: '1D6', dano_mediano: '1d8', critico_multiplicador: 2, critico_rango: 19, oficial: false,
        });
        component.anadirPropiedad(2);
        component.propiedades[0].valor = 2;

        await component.guardar();

        const cuerpo = armaSvc.crearArma.calls.mostRecent().args[0];
        expect(cuerpo.arma).toEqual(jasmine.objectContaining({
            id_tamano: 5, id_material: null, dano_pequeno: '1d6', critico_rango: 19, critico_multiplicador: 2, oficial: false,
        }));
        expect(cuerpo.propiedades).toEqual([{ id_propiedad: 2, valor: 2 }]);
        expect(component.form.controls.nombre.value).toBe('');
    });

    it('avisa antes de mandar el daño de un arma doble con una sola cabeza, en su campo', async () => {
        await montar('arma');
        component.form.patchValue({
            nombre: 'Doble', id_manual: 54, pagina: 3, precio: 15, peso: 4, id_tipo_dano: 3, id_tipo_arma: 2, dano_mediano: '1d8',
        });
        component.alternar('doble');

        await component.guardar();

        expect(armaSvc.crearArma).not.toHaveBeenCalled();
        expect(component.problema?.campo).toBe('dano_mediano');
        expect(component.errorDe('dano_mediano', '')).toContain('dos cabezas');
    });

    it('un escudo no manda peso de armadura ni velocidad; el error de la API va a su campo', async () => {
        await montar('armadura');
        component.form.patchValue({
            nombre: 'Escudo', id_manual: 54, pagina: 3, precio: 10, peso: 6, ca: 1, id_peso_armadura: 2, velocidad_30: 20,
        });
        component.alternar('es_escudo');
        component.form.controls.id_tipo_escudo.setValue(2);
        armaduraSvc.crearArmadura.and.rejectWith(new ProfileApiError('Un escudo lleva su tipo.', 'tipo_de_escudo', 400, 'armadura.id_tipo_escudo'));

        await component.guardar();

        const cuerpo = armaduraSvc.crearArmadura.calls.mostRecent().args[0];
        expect(cuerpo.armadura).toEqual(jasmine.objectContaining({ es_escudo: true, id_peso_armadura: null, id_tipo_escudo: 2, velocidad_30: null }));
        expect(component.errores.global).toBe('Un escudo lleva su tipo.');
        expect(component.errores.campo?.campo).toBe('id_tipo_escudo');
    });

    it('sin permiso de armaduras, el aviso ámbar y no se manda nada', async () => {
        puede = false;
        await montar('armadura');

        expect(component.edicion.avisoPermisos(component.puedeGuardar)).toContain('armaduras');
        await component.guardar();
        expect(armaduraSvc.crearArmadura).not.toHaveBeenCalled();
    });
});
