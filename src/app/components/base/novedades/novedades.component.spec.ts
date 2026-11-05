import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { Novedad, PaginaNovedades } from 'src/app/interfaces/novedad';
import { NovedadesService } from 'src/app/services/novedades.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { NovedadesComponent, agruparPorDia, destinoNovedad, vistaDeTipoNovedad } from './novedades.component';

const novedad = (id: string, fecha: string, extra: Partial<Novedad> = {}): Novedad => ({
    idExterno: id, tipo: 'actualizacion', texto: `Rol estrena ${id}.`, enlace: null, fecha, ...extra,
});

describe('NovedadesComponent', () => {
    let fixture: ComponentFixture<NovedadesComponent>;
    let servicio: jasmine.SpyObj<NovedadesService>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;

    beforeEach(async () => {
        servicio = jasmine.createSpyObj<NovedadesService>('NovedadesService', ['getNovedades', 'abrirAlEntrar', 'guardarAbrirAlEntrar']);
        servicio.abrirAlEntrar.and.resolveTo(true);
        servicio.guardarAbrirAlEntrar.and.resolveTo();
        await TestBed.configureTestingModule({
            declarations: [NovedadesComponent],
            providers: [
                { provide: NovedadesService, useValue: servicio },
                { provide: PlatformSessionService, useValue: { urlSocial: () => 'https://social.yosiftware.es' } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    const crear = (primera: PaginaNovedades | Error) => {
        servicio.getNovedades.and.returnValue(primera instanceof Error
            ? throwError(() => new HttpErrorResponse({ status: 500, error: { error: 'No se han podido cargar las novedades.', code: 'error_de_base_de_datos' } }))
            : of(primera));
        fixture = TestBed.createComponent(NovedadesComponent);
        fixture.detectChanges();
    };

    it('agrupa por día con el tipo, su icono y el enlace', () => {
        crear({
            novedades: [
                novedad('a', '2026-10-31T17:10:59Z', { tipo: 'contenido', enlace: 'https://rol.yosiftware.es/' }),
                novedad('b', '2026-10-31T09:00:00Z', { tipo: 'arreglo' }),
                novedad('c', '2026-10-23T17:54:15Z', { tipo: 'app_disponible', enlace: 'https://social.yosiftware.es/?vista=apps' }),
            ],
            total: 3, hayMas: false,
        });

        const dias = Array.from(elemento().querySelectorAll('.novedades-dia'));
        expect(dias.map((d) => d.querySelector('.novedades-dia__fecha')?.textContent?.trim())).toEqual(['31 de octubre de 2026', '23 de octubre de 2026']);
        expect(dias[0].querySelectorAll('.novedad').length).toBe(2);
        const tipos = Array.from(elemento().querySelectorAll('.novedad__tipo')).map((t) => t.textContent?.replace(/\s+/g, ' ').trim());
        expect(tipos).toEqual(['library_add Contenido', 'build Arreglo', 'phone_android App']);
        const enlaces = Array.from(elemento().querySelectorAll('a.novedad__enlace')) as HTMLAnchorElement[];
        expect(enlaces.map((a) => a.getAttribute('href'))).toEqual(['https://rol.yosiftware.es/', 'https://social.yosiftware.es/?vista=apps']);
        expect(enlaces.every((a) => a.target === '_blank' && a.rel === 'noopener')).toBeTrue();
        expect(enlaces[0].querySelector('.simbolo-yosiftware')).toBeNull();
        expect(enlaces[1].querySelector('.simbolo-yosiftware')).not.toBeNull();
        expect(elemento().querySelector('.novedades__mas')).toBeNull();
    });

    it('«Ver más» trae la siguiente página sin repetir', () => {
        crear({ novedades: [novedad('a', '2026-10-31T10:00:00Z')], total: 3, hayMas: true });
        servicio.getNovedades.and.returnValue(of({
            novedades: [novedad('a', '2026-10-31T10:00:00Z'), novedad('b', '2026-10-29T10:00:00Z')], total: 3, hayMas: false,
        }));

        (elemento().querySelector('.novedades__mas button') as HTMLButtonElement).click();
        fixture.detectChanges();

        expect(servicio.getNovedades.calls.mostRecent().args).toEqual([1]);
        expect(elemento().querySelectorAll('.novedad').length).toBe(2);
        expect(elemento().querySelector('.novedades__mas')).toBeNull();
    });

    it('si falla «Ver más» lo dice y deja reintentar sin perder lo cargado', () => {
        crear({ novedades: [novedad('a', '2026-10-31T10:00:00Z')], total: 3, hayMas: true });
        servicio.getNovedades.and.returnValue(throwError(() => new Error('sin red')));

        fixture.componentInstance.verMas();
        fixture.detectChanges();

        expect(elemento().querySelectorAll('.novedad').length).toBe(1);
        expect(elemento().querySelector('.novedades__mas .bloque-error')?.textContent).toContain('sin red');
        expect(elemento().querySelector('.novedades__mas button')?.textContent?.trim()).toBe('Reintentar');
    });

    it('carga, vacío y error con reintentar', () => {
        const pendiente = new Subject<PaginaNovedades>();
        servicio.getNovedades.and.returnValue(pendiente);
        fixture = TestBed.createComponent(NovedadesComponent);
        fixture.detectChanges();
        expect(elemento().querySelector('app-listado-estado')?.getAttribute('tipo')).toBe('cargando');

        pendiente.next({ novedades: [], total: 0, hayMas: false });
        fixture.detectChanges();
        expect(fixture.componentInstance.estado).toBe('listo');
        expect(elemento().querySelector('app-listado-estado')?.getAttribute('tipo')).toBe('vacio');

        crear(new Error());
        expect(fixture.componentInstance.estado).toBe('error');
        expect(fixture.componentInstance.mensajeError).toBe('No se han podido cargar las novedades.');
        servicio.getNovedades.and.returnValue(of({ novedades: [novedad('a', '2026-10-31T10:00:00Z')], total: 1, hayMas: false }));
        fixture.componentInstance.cargar();
        fixture.detectChanges();
        expect(elemento().querySelectorAll('.novedad').length).toBe(1);
    });

    it('la preferencia «Abrir Novedades al entrar» se lee y se guarda; si falla, vuelve atrás', fakeAsync(() => {
        servicio.abrirAlEntrar.and.resolveTo(false);
        crear({ novedades: [], total: 0, hayMas: false });
        flushMicrotasks();
        expect(fixture.componentInstance.abrirAlEntrar).toBeFalse();

        void fixture.componentInstance.cambiarAbrirAlEntrar(true);
        flushMicrotasks();
        expect(servicio.guardarAbrirAlEntrar).toHaveBeenCalledWith(true);
        expect(fixture.componentInstance.abrirAlEntrar).toBeTrue();

        servicio.guardarAbrirAlEntrar.and.rejectWith(new Error('No se ha podido guardar.'));
        void fixture.componentInstance.cambiarAbrirAlEntrar(false);
        flushMicrotasks();
        expect(fixture.componentInstance.abrirAlEntrar).toBeTrue();
        expect(fixture.componentInstance.errorPreferencia).toBe('No se ha podido guardar.');
    }));

    it('un tipo desconocido se enseña como novedad genérica; el destino es la dirección sin https', () => {
        expect(vistaDeTipoNovedad('otro_tipo')).toEqual({ etiqueta: 'Novedad', icono: 'new_releases' });
        expect(destinoNovedad('https://rol.yosiftware.es/', 'social.yosiftware.es')).toEqual({ texto: 'rol.yosiftware.es', social: false });
        expect(destinoNovedad('https://social.yosiftware.es/?vista=apps', 'social.yosiftware.es'))
            .toEqual({ texto: 'social.yosiftware.es/?vista=apps', social: true });
        expect(agruparPorDia([]).length).toBe(0);
    });
});
