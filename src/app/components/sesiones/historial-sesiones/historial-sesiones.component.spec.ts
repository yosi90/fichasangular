import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Personaje } from 'src/app/interfaces/personaje';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { SesionesService, leerHistorial, leerRespuestaSesion } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { crearDetalleApi } from 'src/testing/personaje-detalle-api';
import { respuestaSesiones } from 'src/testing/sesiones-api';
import { HistorialSesionesComponent } from './historial-sesiones.component';

/** El personaje de las capturas (`rol_dev`, transacción deshecha): su ficha con su id y sus PX. */
function fichaCapturada(): Personaje {
    const personajes = new PersonajeService({ currentUser: null } as any, {} as any);
    return personajes.fichaDeApi(crearDetalleApi({ i: 129, n: 'Prueba guerrero', experiencia: respuestaSesiones<any>('historial').experiencia }));
}

describe('HistorialSesionesComponent', () => {
    let fixture: ComponentFixture<HistorialSesionesComponent>;
    let component: HistorialSesionesComponent;
    let sesiones: jasmine.SpyObj<SesionesService>;
    let puerta: SubidaNivelPuertaService;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const textos = (selector: string): string[] =>
        Array.from(elemento().querySelectorAll(selector)).map((nodo) => `${nodo.textContent ?? ''}`.replace(/\s+/g, ' ').trim());
    /** El texto de un botón sin el de sus iconos («add», «arrow_back»). */
    const sinIconos = (nodo: Element): string => Array.from(nodo.childNodes)
        .filter((hijo) => !(hijo instanceof Element && hijo.tagName === 'MAT-ICON'))
        .map((hijo) => hijo.textContent ?? '').join(' ').replace(/\s+/g, ' ').trim();
    const boton = (texto: string): HTMLButtonElement | undefined =>
        Array.from(elemento().querySelectorAll<HTMLButtonElement>('button')).find((b) => sinIconos(b) === texto);

    async function crear(captura: 'historial' | 'historial_con_abierta' | 'historial_ajeno'): Promise<void> {
        sesiones.historial.and.resolveTo(leerHistorial(respuestaSesiones(captura)));
        fixture = TestBed.createComponent(HistorialSesionesComponent);
        component = fixture.componentInstance;
        component.pj = fichaCapturada();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'abrir', 'reabrir', 'apuntar']);
        await TestBed.configureTestingModule({
            imports: [HistorialSesionesComponent],
            providers: [
                { provide: SesionesService, useValue: sesiones },
                { provide: ArmaService, useValue: { getArmas: () => of([]) } },
                { provide: ArmaduraService, useValue: { getArmaduras: () => of([]) } },
                { provide: EquipoService, useValue: { getMuniciones: () => of([]) } },
                { provide: ConjuroService, useValue: { getConjuros: () => of([]) } },
            ],
        }).compileComponents();
        puerta = TestBed.inject(SubidaNivelPuertaService);
    });

    it('la sesión de juego abierta arriba con «Seguir la sesión»; las cerradas de la más nueva a la más vieja y la 0 al final', async () => {
        await crear('historial_con_abierta');

        expect(textos('.historial__titulo--escritorio')).toEqual(['Sesión 2', 'Sesión 1 · El camino de Zorvintal', 'Sesión 0 · Creación']);
        const [abierta, primera] = Array.from(elemento().querySelectorAll('.historial__sesion'));
        expect(abierta.classList).toContain('historial__sesion--abierta');
        expect(abierta.querySelector('.historial__estado')?.textContent).toContain('Abierta');
        expect(boton('Seguir la sesión')).toBeTruthy();
        // Una línea por evento, con la frase de la API tal cual.
        const lineas = Array.from(primera.querySelectorAll('.historial__eventos li')).map((li) => li.textContent?.trim());
        expect(lineas).toEqual(leerHistorial(respuestaSesiones('historial_con_abierta')).sesiones[1].eventos.map((e) => e.texto));
        expect(primera.querySelector('.historial__fecha')?.textContent).toBe('12 nov 2026');
        expect(primera.querySelector('.historial__notas')?.textContent).toContain('Secreto del máster');
        // Con una sesión de juego abierta no se abre otra.
        expect(boton('Nueva sesión')).toBeUndefined();
    });

    it('sin sesión de juego abierta: «Nueva sesión» y «Reabrir» solo en la última', async () => {
        await crear('historial');

        expect(boton('Nueva sesión')).toBeTruthy();
        const reabrir = Array.from(elemento().querySelectorAll('.historial__sesion')).map((li) => !!Array.from(li.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Reabrir'));
        expect(reabrir).toEqual([true, false]);
    });

    it('quien ve la ficha sin apuntar: ni «Nueva sesión», ni «Reabrir», ni notas', async () => {
        await crear('historial_ajeno');

        expect(boton('Nueva sesión')).toBeUndefined();
        expect(boton('Reabrir')).toBeUndefined();
        expect(elemento().querySelector('.historial__notas')).toBeNull();
        expect(textos('.historial__eventos li').some((texto) => texto.startsWith('nota'))).toBeFalse();
    });

    it('«Ver la ficha en esta sesión» pide esa versión con la última sesión para las flechas', async () => {
        await crear('historial_con_abierta');
        const verVersion = jasmine.createSpy('alVerVersion');
        component.alVerVersion = verVersion;

        Array.from(elemento().querySelectorAll<HTMLButtonElement>('.historial__sesion'))[1]
            .querySelector<HTMLButtonElement>('.historial__pie .ficha-enlace')!.click();

        expect(verVersion).toHaveBeenCalledWith(1, 2);
    });

    it('«Nueva sesión» abre la siguiente con su título y entra en su panel', async () => {
        await crear('historial');
        const alCambiar = jasmine.createSpy('alCambiar');
        component.alCambiar = alCambiar;
        const abierta = leerRespuestaSesion(respuestaSesiones('abrir_2'));
        sesiones.abrir.and.resolveTo(abierta);
        sesiones.historial.and.resolveTo(leerHistorial(respuestaSesiones('historial_con_abierta')));

        boton('Nueva sesión')!.click();
        fixture.detectChanges();
        component.nuevaTitulo = '  La mina inundada ';
        await component.abrirNueva();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(sesiones.abrir).toHaveBeenCalledWith(129, { titulo: 'La mina inundada' });
        expect(alCambiar).toHaveBeenCalledWith(abierta.experiencia);
        expect(component.enElPanel).toBeTrue();
        expect(elemento().querySelector('.sesion__tipo')?.textContent).toContain('Sesión 2 · Abierta');

        // «Volver al historial» deja la lista al día.
        boton('Volver al historial')!.click();
        fixture.detectChanges();
        expect(component.enElPanel).toBeFalse();
    });

    it('una subida hecha de este personaje vuelve a leer el historial', async () => {
        await crear('historial');
        sesiones.historial.calls.reset();

        puerta.subidaHecha(999);
        puerta.subidaHecha(129);

        expect(sesiones.historial).toHaveBeenCalledOnceWith(129);
    });

    it('si no carga, lo dice y deja reintentar', async () => {
        sesiones.historial.and.rejectWith(new Error('No hay conexión con Rol.'));
        fixture = TestBed.createComponent(HistorialSesionesComponent);
        fixture.componentInstance.pj = fichaCapturada();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(elemento().querySelector('.bloque-error')?.textContent).toContain('No hay conexión con Rol.');
        sesiones.historial.and.resolveTo(leerHistorial(respuestaSesiones('historial')));
        boton('Reintentar')!.click();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(textos('.historial__titulo--escritorio').length).toBe(2);
    });
});
