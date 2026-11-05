import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { TipoVentaja } from 'src/app/interfaces/ventaja';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { RasgoService } from 'src/app/services/rasgo.service';
import { UserService } from 'src/app/services/user.service';
import { VentajaService, normalizeVentaja } from 'src/app/services/ventaja.service';
import { idDeReferencia, tipoDeVentaja } from 'src/app/services/utils/ventaja-formulario';
import { IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM } from 'src/testing/ida-y-vuelta-rasgos-ventajas-incarnum';
import { NuevaVentajaComponent } from './nueva-ventaja.component';

describe('NuevaVentajaComponent', () => {
    let fixture: ComponentFixture<NuevaVentajaComponent>;
    let component: NuevaVentajaComponent;
    let ventajaSvc: jasmine.SpyObj<VentajaService>;
    let permisos: string[] = [];

    async function montar(tipo: TipoVentaja = 'ventaja', modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        ventajaSvc = jasmine.createSpyObj<VentajaService>('VentajaService', ['getVentajaFresca', 'crearVentaja', 'actualizarVentaja']);
        if (get)
            ventajaSvc.getVentajaFresca.and.returnValue(of(normalizeVentaja(get)));
        await TestBed.configureTestingModule({
            declarations: [NuevaVentajaComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule],
            providers: [
                { provide: VentajaService, useValue: ventajaSvc },
                { provide: ManualService, useValue: { getManuales: () => of([{ Id: 65, Nombre: 'Rol mapa mundi' }]) } },
                { provide: RasgoService, useValue: { getRasgos: () => of([{ Id: 10, Nombre: 'Ambidestrismo', Descripcion: '', Oficial: true }]) } },
                { provide: IdiomaService, useValue: { getIdiomas: () => of([{ Id: 3, Nombre: 'Élfico' }]) } },
                { provide: HabilidadService, useValue: { getHabilidades: () => of([{ Id_habilidad: 22, Nombre: 'Intimidar' }]) } },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: (recurso: string) => permisos.includes(recurso),
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevaVentajaComponent);
        component = fixture.componentInstance;
        component.tipo = tipo;
        component.modo = modo;
        component.idVentaja = get?.Id ?? null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => {
        permisos = ['ventajas', 'desventajas'];
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    describe('ida y vuelta (respuestas reales de rol_dev)', () => {
        (['ventajas', 'desventajas'] as const).forEach((lista) => {
            IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM[lista].forEach(({ id, nombre, get, cuerpo }) => {
                it(`${lista === 'ventajas' ? 'ventaja' : 'desventaja'} «${nombre}» (${id}): cargada y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                    await montar(tipoDeVentaja(get), 'editar', get);

                    expect(component.edicion.hayCambios).toBeFalse();
                    expect(component.cuerpo()).toEqual(cuerpo);
                });
            });
        });
    });

    it('el tipo sale del signo del coste y una referencia sin nombre es «ninguna»', () => {
        expect(tipoDeVentaja({ Coste: -4 })).toBe('ventaja');
        expect(tipoDeVentaja({ Coste: 5 })).toBe('desventaja');
        expect(idDeReferencia({ Id: 0, Nombre: '', Descripcion: '' })).toBeNull();
        expect(idDeReferencia({ Id: 0, Nombre: 'Elegir', Descripcion: '' })).toBe(0);
        expect(idDeReferencia({ Id: 22, Nombre: 'Intimidar', Descripcion: '' })).toBe(22);
    });

    it('al crear se elige el tipo: los puntos se escriben en positivo y el signo lo pone el tipo', async () => {
        await montar();
        ventajaSvc.crearVentaja.and.resolveTo({ message: 'Desventaja creada exitosamente', id: 50, ventaja: normalizeVentaja({ Id: 50, Coste: 2 }) });
        component.form.patchValue({ nombre: 'Patoso', id_manual: 65, pagina: 35, puntos: 2, mejora: -1 });
        component.alternar('destreza');
        component.elegirTipo('desventaja');

        await component.guardar();

        const [tipo, cuerpo] = ventajaSvc.crearVentaja.calls.mostRecent().args as [TipoVentaja, any];
        expect(tipo).toBe('desventaja');
        expect(cuerpo.desventaja).toEqual(jasmine.objectContaining({
            nombre: 'Patoso', coste: 2, mejora: -1, destreza: true, fuerza: false, id_rasgo: null, id_idioma: null, id_habilidad: null,
        }));
        expect(cuerpo.ventaja).toBeUndefined();
    });

    it('una ventaja cuesta puntos: el coste va en negativo', async () => {
        await montar();
        component.form.patchValue({ nombre: 'Valiente', id_manual: 65, pagina: 35, puntos: 3 });
        expect((component.cuerpo() as any).ventaja.coste).toBe(-3);
    });

    it('al modificar el tipo no cambia', async () => {
        const { get } = IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM.desventajas[0];
        await montar('desventaja', 'editar', get);
        component.elegirTipo('ventaja');
        expect(component.tipo).toBe('desventaja');
    });

    it('el permiso es el del tipo: desventajas para las desventajas', async () => {
        permisos = ['desventajas'];
        await montar();
        expect(component.puedeCrear).toBeFalse();
        component.elegirTipo('desventaja');
        expect(component.puedeCrear).toBeTrue();
    });

    it('un idioma a elegir quita el idioma fijo, y elegir uno fijo quita el de elegir', async () => {
        await montar();
        component.elegir('id_idioma', 3);
        component.alternar('idioma_extra');
        expect(component.form.controls.id_idioma.value).toBeNull();
        component.elegir('id_idioma', 3);
        expect(component.form.controls.idioma_extra.value).toBeFalse();
    });

    it('el error de la API con su campo: el coste va a los puntos', async () => {
        await montar();
        ventajaSvc.crearVentaja.and.rejectWith(new ProfileApiError('Una ventaja cuesta puntos.', 'coste_de_ventaja', 400, 'ventaja.coste'));
        component.form.patchValue({ nombre: 'Valiente', id_manual: 65, pagina: 35, puntos: 3 });

        await component.guardar();

        expect(component.errores.global).toContain('Una ventaja cuesta puntos.');
        expect(component.form.controls.puntos.errors?.['api']).toBeTruthy();
    });
});
