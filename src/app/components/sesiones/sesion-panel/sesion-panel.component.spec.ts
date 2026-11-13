import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { TiendaSesionComponent } from 'src/app/components/sesiones/tienda-sesion/tienda-sesion.component';
import { Personaje } from 'src/app/interfaces/personaje';
import { RespuestaSesion } from 'src/app/interfaces/sesiones';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DeidadService } from 'src/app/services/deidad.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { SesionesService, leerHistorial, leerRespuestaSesion } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { POLITICA_TIENDA_LIBRE } from 'src/app/services/utils/tienda-equipo';
import { crearEquipoFichaApi } from 'src/testing/equipo-api';
import { crearDetalleApi } from 'src/testing/personaje-detalle-api';
import { respuestaSesiones } from 'src/testing/sesiones-api';
import { SesionPanelComponent } from './sesion-panel.component';

describe('SesionPanelComponent', () => {
    let fixture: ComponentFixture<SesionPanelComponent>;
    let component: SesionPanelComponent;
    let sesiones: jasmine.SpyObj<SesionesService>;
    let alCambiar: jasmine.Spy;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const limpio = (nodo: Element | null | undefined) => `${nodo?.textContent ?? ''}`.replace(/\s+/g, ' ').trim();
    const boton = (texto: string): HTMLButtonElement | undefined =>
        Array.from(elemento().querySelectorAll<HTMLButtonElement>('button')).find((b) => limpio(b) === texto);

    /** La ficha de ahora, con una daga en el equipo, la penalización de PX que se pida y lo que se cambie de la de la API. */
    function ficha(porcentaje = 0, api: Record<string, any> = {}): Personaje {
        const pj = new PersonajeService({ currentUser: null } as any, {} as any).fichaDeApi(crearDetalleApi({
            i: 129, n: 'Prueba guerrero', experiencia: respuestaSesiones<any>('venta').experiencia, ...api,
        }));
        pj.Equipo = [crearEquipoFichaApi()['equipo'][0]].map((pieza: any) => ({ ...pieza, id: 33, nombre: 'Daga', cantidad: 2 })) as any;
        pj.Penalizacion_experiencia = { porcentaje, penalizadas: [], referencia: null, predilectas: [] };
        return pj;
    }

    function crear(cambios: Partial<SesionPanelComponent> = {}, captura: 'venta' | 'experiencia' = 'venta'): void {
        const respuesta = leerRespuestaSesion(respuestaSesiones(captura));
        fixture = TestBed.createComponent(SesionPanelComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('pj', ficha());
        fixture.componentRef.setInput('sesion', respuesta.sesion);
        fixture.componentRef.setInput('experiencia', respuesta.experiencia);
        fixture.componentRef.setInput('puedeApuntar', true);
        fixture.componentRef.setInput('veNotas', true);
        fixture.componentRef.setInput('alCambiar', alCambiar);
        for (const [clave, valor] of Object.entries(cambios))
            fixture.componentRef.setInput(clave, valor);
        fixture.detectChanges();
    }

    async function estable(): Promise<void> {
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['apuntar', 'comprar', 'cambiar', 'deshacer', 'cerrar', 'historial']);
        alCambiar = jasmine.createSpy('alCambiar');
        await TestBed.configureTestingModule({
            imports: [SesionPanelComponent],
            declarations: [TiendaSesionComponent],
            providers: [
                { provide: SesionesService, useValue: sesiones },
                { provide: ArmaService, useValue: { getArmas: () => of([]) } },
                { provide: ArmaduraService, useValue: { getArmaduras: () => of([]) } },
                { provide: EquipoService, useValue: { getMuniciones: () => of([]) } },
                { provide: ConjuroService, useValue: { getConjuros: () => of([]) } },
                {
                    provide: AlineamientoService, useValue: {
                        getAlineamientosBasicosCatalogo: () => of([{ Id: 0, Nombre: 'No aplica' }, { Id: 1, Nombre: 'Legal bueno' },
                            { Id: 7, Nombre: 'Caótico bueno' }]),
                    },
                },
                { provide: DeidadService, useValue: { getDeidades: () => of([{ Id: 9, Nombre: 'Heironeous' }, { Id: 0, Nombre: 'No tener deidad' }]) } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    it('lo que ha pasado, con la frase de la API tal cual y «Deshacer» solo en el último', () => {
        crear();

        const filas = Array.from(elemento().querySelectorAll('.sesion__evento'));
        expect(filas.map((fila) => limpio(fila.querySelector('.sesion__evento-texto')))).toEqual(
            leerRespuestaSesion(respuestaSesiones('venta')).sesion.eventos.map((evento) => evento.texto));
        expect(filas.map((fila) => !!fila.querySelector('.sesion__deshacer'))).toEqual([false, false, false, false, true]);
        expect(limpio(elemento().querySelector('.sesion__cifras-valor'))).toBe('+1.000 PX · +47 po');
        expect(limpio(elemento().querySelector('.sesion__cifras-saldo'))).toBe('Saldo: 132 po');
    });

    it('«Alineamiento y expiación», solo para el máster (o el dueño sin campaña): el cambio, la caída y la expiación', async () => {
        crear();
        expect(boton('Alineamiento y expiación')).toBeUndefined();

        crear({ controlaAlineamiento: true });
        const respuesta = leerRespuestaSesion(respuestaSesiones('dinero'));
        sesiones.apuntar.and.resolveTo(respuesta);
        const puerta = TestBed.inject(SubidaNivelPuertaService);
        spyOn(puerta, 'subidaHecha');
        boton('Alineamiento y expiación')!.click();
        await estable();
        expect(component.basicos.map((b) => b.Nombre)).toEqual(['Legal bueno', 'Caótico bueno']);
        expect(component.deidades.map((d) => d.Nombre)).toEqual(['No tener deidad', 'Heironeous']);
        expect(component.motivoNoApuntar).toBe('Elige el alineamiento nuevo, la deidad nueva o los dos.');
        component.idBasico = 7;
        component.alineamientoConcepto = ' liberó al prisionero ';
        await component.apuntar();
        expect(sesiones.apuntar).toHaveBeenCalledWith(129, jasmine.anything(),
            { tipo: 'cambio_alineamiento', idAlineamiento: 7, concepto: 'liberó al prisionero' });
        // Cambia la ficha (el alineamiento y sus ex clases): se vuelve a leer.
        expect(puerta.subidaHecha).toHaveBeenCalledWith(129);

        component.elegirTipo('alineamiento');
        component.elegirModoAlineamiento('expiacion');
        expect(component.motivoNoApuntar).toBe('Elige la clase que recupera.');
        component.alternarClaseAlineamiento(11);
        component.idBasico = 1;
        component.voluntaria = true;
        await component.apuntar();
        expect(sesiones.apuntar.calls.mostRecent().args[2]).toEqual({ tipo: 'expiacion', clases: [11], voluntaria: true, idAlineamiento: 1 });

        component.elegirTipo('alineamiento');
        component.elegirModoAlineamiento('caida');
        component.alternarClaseAlineamiento(11);
        expect(component.motivoNoApuntar).toBe('Di por qué cae: un acto maligno, su código, su juramento…');
        component.motivoCaida = 'un acto maligno';
        await component.apuntar();
        expect(sesiones.apuntar.calls.mostRecent().args[2]).toEqual({ tipo: 'caida', clases: [11], motivo: 'un acto maligno' });
    });

    it('apunta los PX con la versión de ahora y deja la sesión al día', async () => {
        crear({}, 'experiencia');
        const respuesta = leerRespuestaSesion(respuestaSesiones('dinero'));
        sesiones.apuntar.and.resolveTo(respuesta);
        const version = component.actual.version;

        boton('Experiencia')!.click();
        fixture.detectChanges();
        component.px = 1200;
        component.pxConcepto = ' El guardián de la compuerta ';
        fixture.detectChanges();
        expect(limpio(elemento().querySelector('.sesion__formulario .sesion__nota'))).toBe('Sin penalización por multiclase: suma 1.200 PX.');
        await component.apuntar();
        fixture.detectChanges();

        expect(sesiones.apuntar).toHaveBeenCalledWith(129, jasmine.objectContaining({ numero: 1, version }),
            { tipo: 'experiencia', px: 1200, concepto: 'El guardián de la compuerta' });
        expect(component.actual.version).toBe(respuesta.sesion.version);
        expect(alCambiar).toHaveBeenCalledWith(respuesta);
        expect(component.tipo).toBeNull();
    });

    it('con penalización por multiclase enseña antes lo que sumará, como la API', () => {
        crear();
        fixture.componentRef.setInput('pj', ficha(20));
        component.elegirTipo('experiencia');
        component.px = 1200;
        fixture.detectChanges();

        expect(limpio(elemento().querySelector('.sesion__formulario .sesion__nota'))).toBe('Con −20 % por multiclase: 960 PX.');
    });

    it('con 409 sesion_desactualizada vuelve a cargar la sesión y lo dice', async () => {
        crear();
        sesiones.apuntar.and.rejectWith(new ProfileApiError('La sesión ha cambiado…', 'sesion_desactualizada', 409, 'version'));
        const historial = leerHistorial(respuestaSesiones('historial_con_abierta'));
        historial.sesiones = historial.sesiones.map((sesion) => sesion.numero === 1 ? { ...sesion, estado: 'abierta' } : sesion);
        sesiones.historial.and.resolveTo(historial);

        component.elegirTipo('dinero');
        component.po = 5;
        await component.apuntar();
        fixture.detectChanges();

        expect(sesiones.historial).toHaveBeenCalledWith(129);
        expect(component.actual.version).toBe(historial.sesiones[1].version);
        expect(limpio(elemento().querySelector('.sesion__aviso'))).toContain('Otra persona ha apuntado algo en esta sesión');
        expect(component.tipo).toBe('dinero');
    });

    it('vende una pieza de su equipo y apunta lo que pierde', async () => {
        crear();
        sesiones.apuntar.and.resolveTo(leerRespuestaSesion(respuestaSesiones('nota')));

        component.elegirTipo('vender');
        component.idPieza = 33;
        component.cantidad = 1;
        await component.apuntar();
        expect(sesiones.apuntar.calls.mostRecent().args[2]).toEqual({ tipo: 'venta', idPersonajeEquipo: 33, cantidad: 1 });

        component.elegirTipo('vender');
        component.venderModo = 'pierde';
        component.idPieza = 33;
        component.cantidad = 3;
        expect(component.motivoNoApuntar).toBe('La cantidad va de 1 a 2.');
        component.cantidad = 2;
        component.perdidaConcepto = 'se rompieron';
        await component.apuntar();
        expect(sesiones.apuntar.calls.mostRecent().args[2]).toEqual({ tipo: 'objeto_perdido', idPersonajeEquipo: 33, cantidad: 2, concepto: 'se rompieron' });
    });

    it('no deja gastar más dinero del saldo ni más PX de los que tiene por encima de su nivel', () => {
        crear();
        component.elegirTipo('dinero');
        component.poModo = 'gasta';
        component.po = 500;
        expect(component.motivoNoApuntar).toBe('No le llega: tiene 132 po.');
        component.po = 2.555;
        expect(component.motivoNoApuntar).toBe('Pon la cantidad en po (con dos decimales como mucho).');

        component.elegirTipo('experiencia');
        component.pxModo = 'gasta';
        component.px = 2000;
        expect(component.motivoNoApuntar).toBe('No puede gastar tantos PX sin bajar de su nivel.');
    });

    it('«Comprar» abre la tienda con el saldo y compra sin dinero inicial', async () => {
        crear();
        sesiones.comprar.and.resolveTo(leerRespuestaSesion(respuestaSesiones('compra')));

        boton('Comprar')!.click();
        await estable();
        const tienda = fixture.debugElement.query(By.directive(TiendaSesionComponent)).componentInstance as TiendaSesionComponent;
        expect(tienda.modo).toBe('compra');
        expect(tienda.regla.sugerido).toBe(132);
        expect(tienda.titulo).toBe('Comprar en la sesión 1');
        // Sin campaña (`politicaCompra: null`), todo.
        expect(tienda.politica).toEqual(POLITICA_TIENDA_LIBRE);
        expect(tienda.soloOficial).toBeFalse();

        tienda.confirmar.emit({ dineroInicial: 132, piezas: [{ tipo: 'arma', id: 5, cantidad: 2, equipado: false }] });
        await estable();

        expect(sesiones.comprar).toHaveBeenCalledWith(129, jasmine.objectContaining({ numero: 1 }), {
            piezas: [{ tipo: 'arma', id: 5, cantidad: 2, equipado: false }],
        });
        expect(fixture.debugElement.query(By.directive(TiendaSesionComponent))).toBeNull();
    });

    it('si la compra no vale, la tienda se queda abierta con el error en su pieza', async () => {
        crear();
        sesiones.comprar.and.rejectWith(new ProfileApiError('Esta campaña no deja comprar objetos mágicos.', 'objeto_magico_no_permitido', 400, 'piezas[0]'));

        component.elegirTipo('comprar');
        await estable();
        const tienda = fixture.debugElement.query(By.directive(TiendaSesionComponent)).componentInstance as TiendaSesionComponent;
        tienda.confirmar.emit({ dineroInicial: 0, piezas: [{ tipo: 'objeto', id: 1 }] });
        await estable();

        expect(tienda.error).toBe('Esta campaña no deja comprar objetos mágicos.');
        expect(tienda.piezaConError).toBe(0);
        expect(tienda.guardando).toBeFalse();
    });

    describe('con la política de compra de su campaña (`politicaCompra` de la ficha)', () => {
        const estricta = {
            permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: 0, permitirObjetosMagicos: false,
            permitirObjetosAMedida: false, precioMaximoPorObjeto: 500, permitirCopiarConjuros: false,
        };
        const mago = { Id: 6, Nombre: 'Explorador', Conjuros: { Libro: true } } as any;
        const tiendaAbierta = () => fixture.debugElement.query(By.directive(TiendaSesionComponent))?.componentInstance as TiendaSesionComponent | undefined;

        it('la compra no ofrece lo que la campaña no deja, como la tienda de la creación; el botín solo filtra lo homebrew', async () => {
            crear({ pj: ficha(0, { idCampana: 2, politicaCompra: estricta }) });
            expect(component.pj.IdCampana).toBe(2);

            component.elegirTipo('comprar');
            await estable();
            expect(tiendaAbierta()!.politica).toEqual({ objetosMagicos: false, aMedida: false, precioMaximo: 500, copiarConjuros: false });
            expect(tiendaAbierta()!.soloOficial).toBeTrue();
            tiendaAbierta()!.cancelar.emit();
            await estable();

            // El botín o regalo no se compra: la API no mira ahí los límites de la tienda, solo lo homebrew.
            component.elegirTipo('objeto');
            await component.apuntar();
            await estable();
            expect(tiendaAbierta()!.modo).toBe('botin');
            expect(tiendaAbierta()!.politica).toEqual(POLITICA_TIENDA_LIBRE);
            expect(tiendaAbierta()!.soloOficial).toBeTrue();
        });

        it('un PNJ del máster compra sin la política de su campaña: la ficha trae la campaña y `politicaCompra` null', async () => {
            // Propietario, 2026-11-12: como en la tienda de la creación, que no aplica la política a un PNJ.
            crear({ pj: ficha(0, { idCampana: 2, politicaCompra: null }), clases: [mago] });
            expect(component.pj.IdCampana).toBe(2);
            expect(boton('Conjuro al libro')).toBeDefined();

            component.elegirTipo('comprar');
            await estable();
            expect(tiendaAbierta()!.politica).toEqual(POLITICA_TIENDA_LIBRE);
            expect(tiendaAbierta()!.soloOficial).toBeFalse();
        });

        it('«Conjuro al libro» sale solo si la campaña deja copiar conjuros, y sin homebrew ofrece solo los oficiales', () => {
            crear({ pj: ficha(0, { idCampana: 2, politicaCompra: estricta }), clases: [mago] });
            expect(boton('Conjuro al libro')).toBeUndefined();

            crear({ pj: ficha(0, { idCampana: 2, politicaCompra: { ...estricta, permitirCopiarConjuros: true } }), clases: [mago] });
            expect(boton('Conjuro al libro')).toBeDefined();
            (component as any).conjurosCatalogo = [
                { Id: 1, Nombre: 'Luz de las hadas', Oficial: true, Nivel_clase: [{ Id_clase: 6, Nivel: 1 }] },
                { Id: 2, Nombre: 'Luz casera', Oficial: false, Nivel_clase: [{ Id_clase: 6, Nivel: 1 }] },
            ];
            component.elegirTipo('libro');
            component.busquedaConjuro = 'luz';
            expect(component.conjurosDelLibro.map((item) => item.conjuro.Nombre)).toEqual(['Luz de las hadas']);

            // Sin campaña, también los homebrew.
            crear({ clases: [mago] });
            (component as any).conjurosCatalogo = [
                { Id: 1, Nombre: 'Luz de las hadas', Oficial: true, Nivel_clase: [{ Id_clase: 6, Nivel: 1 }] },
                { Id: 2, Nombre: 'Luz casera', Oficial: false, Nivel_clase: [{ Id_clase: 6, Nivel: 1 }] },
            ];
            component.elegirTipo('libro');
            component.busquedaConjuro = 'luz';
            expect(component.conjurosDelLibro.map((item) => item.conjuro.Nombre)).toEqual(['Luz casera', 'Luz de las hadas']);
        });
    });

    it('el botín: un evento por pieza, cada uno con la versión de la respuesta anterior', async () => {
        crear();
        const primera = leerRespuestaSesion(respuestaSesiones('botin'));
        const segunda = leerRespuestaSesion(respuestaSesiones('venta'));
        sesiones.apuntar.and.returnValues(Promise.resolve(primera), Promise.resolve(segunda));

        component.elegirTipo('objeto');
        component.origenObjeto = 'regalo';
        await component.apuntar();
        await estable();
        const tienda = fixture.debugElement.query(By.directive(TiendaSesionComponent)).componentInstance as TiendaSesionComponent;
        expect(tienda.modo).toBe('botin');
        tienda.confirmar.emit({ dineroInicial: 0, piezas: [{ tipo: 'arma', id: 5 }, { tipo: 'arma', id: 30 }] });
        await estable();

        const llamadas = sesiones.apuntar.calls.all().map((llamada) => [llamada.args[1].version, llamada.args[2]]);
        expect(llamadas).toEqual([
            [leerRespuestaSesion(respuestaSesiones('venta')).sesion.version, { tipo: 'objeto_obtenido', origen: 'regalo', pieza: { tipo: 'arma', id: 5 } }],
            [primera.sesion.version, { tipo: 'objeto_obtenido', origen: 'regalo', pieza: { tipo: 'arma', id: 30 } }],
        ]);
        expect(fixture.debugElement.query(By.directive(TiendaSesionComponent))).toBeNull();
    });

    it('«Deshacer» y «Cerrar la sesión», tras confirmarlo', async () => {
        crear();
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        const salir = jasmine.createSpy('alSalir');
        fixture.componentRef.setInput('alSalir', salir);
        sesiones.deshacer.and.resolveTo(leerRespuestaSesion(respuestaSesiones('botin')));
        sesiones.cerrar.and.resolveTo(leerRespuestaSesion(respuestaSesiones('cerrar')));

        boton('Deshacer')!.click();
        await estable();
        expect(sesiones.deshacer).toHaveBeenCalledWith(129, jasmine.objectContaining({ numero: 1 }));

        await component.cerrarSesion();
        expect(sesiones.cerrar).toHaveBeenCalled();
        expect(salir).toHaveBeenCalled();
    });

    it('con PX para subir, el aviso y su botón piden la subida por la puerta', () => {
        crear();
        const puerta = TestBed.inject(SubidaNivelPuertaService);
        spyOn(puerta, 'solicitar');

        expect(limpio(elemento().querySelector('.sesion__subida span'))).toBe('Con 1.000 PX puede subir a nivel 2.');
        boton('Subir a nivel 2')!.click();

        expect(puerta.solicitar).toHaveBeenCalledWith(129);
    });

    it('sin `puedeApuntar`, solo se lee: ni tipos, ni deshacer, ni cerrar, ni subida', () => {
        crear({ puedeApuntar: false, veNotas: false } as any);

        expect(elemento().querySelector('.sesion__tipos')).toBeNull();
        expect(elemento().querySelector('.sesion__deshacer')).toBeNull();
        expect(boton('Cerrar la sesión')).toBeUndefined();
        expect(elemento().querySelector('.sesion__subida')).toBeNull();
        expect(elemento().querySelector('textarea')).toBeNull();
        expect(limpio(elemento().querySelector('.sesion__titulo'))).toBe('El camino de Zorvintal');
    });

    it('guarda el título y la fecha al cambiarlos, y no deja el título vacío', async () => {
        crear();
        sesiones.cambiar.and.resolveTo(leerRespuestaSesion(respuestaSesiones('cambiar')) as RespuestaSesion);

        component.fecha = '2026-11-12';
        await component.guardarCabecera('fecha');
        expect(sesiones.cambiar).toHaveBeenCalledWith(129, jasmine.objectContaining({ numero: 1 }), { fechaJuego: '2026-11-12' });

        component.titulo = '   ';
        await component.guardarCabecera('titulo');
        expect(component.error).toBe('El título no puede quedar vacío.');
        expect(component.titulo).toBe(component.actual.titulo);
    });
});
