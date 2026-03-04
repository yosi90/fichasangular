import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { FichasDescargaBackgroundService } from './fichas-descarga-background.service';
import { FichaPersonajeService } from './ficha-personaje.service';
import { Personaje } from '../interfaces/personaje';

describe('FichasDescargaBackgroundService', () => {
    let service: FichasDescargaBackgroundService;
    let fichaSvcMock: any;

    const crearPersonaje = (): Personaje => ({
        Id: 1,
        Nombre: 'Aldric',
        Conjuros: [],
        Sortilegas: [],
        Familiares: [],
        Companeros: [],
    } as any);

    beforeEach(() => {
        fichaSvcMock = {
            generarPDF: jasmine.createSpy('generarPDF').and.resolveTo(),
            generarPDF_Conjuros: jasmine.createSpy('generarPDF_Conjuros').and.resolveTo(),
            generarPDF_Familiar: jasmine.createSpy('generarPDF_Familiar').and.resolveTo(),
            generarPDF_Companero: jasmine.createSpy('generarPDF_Companero').and.resolveTo(),
        };

        TestBed.configureTestingModule({
            providers: [
                FichasDescargaBackgroundService,
                { provide: FichaPersonajeService, useValue: fichaSvcMock },
            ],
        });

        service = TestBed.inject(FichasDescargaBackgroundService);
    });

    it('crea job running y lo elimina al completar', fakeAsync(() => {
        let jobs: any[] = [];
        const sub = service.jobs$.subscribe((value) => jobs = value);

        service.descargarFichas(crearPersonaje(), {
            incluirConjuros: true,
            incluirFamiliares: false,
            incluirCompaneros: false,
        });

        expect(jobs.length).toBe(1);
        expect(jobs[0].estado).toBe('running');

        flushMicrotasks();

        expect(jobs.length).toBe(0);
        expect(fichaSvcMock.generarPDF).toHaveBeenCalledTimes(1);
        sub.unsubscribe();
    }));

    it('respeta opciones de secundarios desactivadas', fakeAsync(() => {
        const pj = crearPersonaje();
        pj.Conjuros = [{ Id: 5, Nombre: 'Luz' } as any];
        pj.Familiares = [{ Id: 10, Nombre: 'Cuervo' } as any];
        pj.Companeros = [{ Id: 20, Nombre: 'Lobo' } as any];

        service.descargarFichas(pj, {
            incluirConjuros: false,
            incluirFamiliares: false,
            incluirCompaneros: false,
        });

        flushMicrotasks();

        expect(fichaSvcMock.generarPDF).toHaveBeenCalledTimes(1);
        expect(fichaSvcMock.generarPDF_Conjuros).not.toHaveBeenCalled();
        expect(fichaSvcMock.generarPDF_Familiar).not.toHaveBeenCalled();
        expect(fichaSvcMock.generarPDF_Companero).not.toHaveBeenCalled();
    }));

    it('genera secundarios cuando opciones activas y hay datos', fakeAsync(() => {
        const pj = crearPersonaje();
        pj.Conjuros = [{ Id: 5, Nombre: 'Luz' } as any];
        pj.Familiares = [{ Id: 10, Nombre: 'Cuervo' } as any];
        pj.Companeros = [{ Id: 20, Nombre: 'Lobo' } as any];

        service.descargarFichas(pj, {
            incluirConjuros: true,
            incluirFamiliares: true,
            incluirCompaneros: true,
        });

        flushMicrotasks();

        expect(fichaSvcMock.generarPDF).toHaveBeenCalledTimes(1);
        expect(fichaSvcMock.generarPDF_Conjuros).toHaveBeenCalledTimes(1);
        expect(fichaSvcMock.generarPDF_Familiar).toHaveBeenCalledTimes(1);
        expect(fichaSvcMock.generarPDF_Companero).toHaveBeenCalledTimes(1);
    }));

    it('en error pasa a estado error y se autocierra', fakeAsync(() => {
        fichaSvcMock.generarPDF.and.returnValue(Promise.reject(new Error('fallo test')));

        let jobs: any[] = [];
        const sub = service.jobs$.subscribe((value) => jobs = value);

        service.descargarFichas(crearPersonaje(), {
            incluirConjuros: true,
            incluirFamiliares: false,
            incluirCompaneros: false,
        });

        expect(jobs.length).toBe(1);
        expect(jobs[0].estado).toBe('running');

        flushMicrotasks();

        expect(jobs.length).toBe(1);
        expect(jobs[0].estado).toBe('error');
        expect(`${jobs[0].mensaje}`).toContain('fallo test');

        tick(4500);

        expect(jobs.length).toBe(0);
        sub.unsubscribe();
    }));
});
