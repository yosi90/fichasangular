import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RacialService } from './racial.service';

describe('RacialService', () => {
    let http: jasmine.SpyObj<any>;
    let auth: any;
    let service: RacialService;

    beforeEach(() => {
        http = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'patch']);
        auth = {
            currentUser: {
                getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-racial'),
            },
        };
        service = new RacialService(auth, http);
    });

    it('getRaciales usa REST y normaliza el listado', async () => {
        http.get.and.returnValue(of([
            { Id: 2, Nombre: 'Zancada' },
            { id: 1, nombre: 'Aguante' },
        ]));

        const raciales = await new Promise<any[]>((resolve) => service.getRaciales().subscribe(resolve));

        expect(http.get).toHaveBeenCalledWith(`${environment.apiUrl}razas/raciales`);
        expect(raciales.map((item) => item.Nombre)).toEqual(['Aguante', 'Zancada']);
    });

    it('getRacial usa REST y normaliza el detalle', async () => {
        http.get.and.returnValue(of({ Id: 7, Nombre: 'Visión en la penumbra' }));

        const racial = await new Promise<any>((resolve) => service.getRacial(7).subscribe(resolve));

        expect(http.get).toHaveBeenCalledWith(`${environment.apiUrl}razas/raciales/7`);
        expect(racial.Id).toBe(7);
        expect(racial.Nombre).toBe('Visión en la penumbra');
    });

    it('crearRacial envia Bearer, no envia auditoria y normaliza respuesta', async () => {
        http.post.and.returnValue(of({ message: 'ok', idRacial: 31, racial: { Id: 31, Nombre: 'Alas' } }));
        const payload = { racial: { nombre: 'Alas' } };

        const response = await service.crearRacial(payload as any);

        expect(http.post).toHaveBeenCalledWith(
            `${environment.apiUrl}razas/raciales/add`,
            payload,
            { headers: { Authorization: 'Bearer token-racial' } }
        );
        expect(JSON.stringify(http.post.calls.mostRecent().args[1])).not.toContain('uid');
        expect(response.idRacial).toBe(31);
        expect(response.racial.Nombre).toBe('Alas');
    });

    it('mapea errores 403 a mensaje de permisos', async () => {
        http.post.and.returnValue(throwError(() => new HttpErrorResponse({
            status: 403,
            error: { message: 'Falta razas.create' },
        })));

        await expectAsync(service.crearRacial({ racial: { nombre: 'Alas' } } as any))
            .toBeRejectedWithError('No tienes permisos para crear raciales. Falta razas.create');
    });

    it('actualizarRacial usa PUT y normaliza la respuesta', async () => {
        http.put.and.returnValue(of({ message: 'ok', idRacial: 31, racial: { Id: 31, Nombre: 'Alas actualizadas' } }));
        const payload = { racial: { nombre: 'Alas actualizadas', descripcion: 'Nueva desc' } };

        const response = await service.actualizarRacial(31, payload as any);

        expect(http.put).toHaveBeenCalledWith(
            `${environment.apiUrl}razas/raciales/31`,
            payload,
            { headers: { Authorization: 'Bearer token-racial' } }
        );
        expect(response.racial.Nombre).toBe('Alas actualizadas');
    });

    it('anadirPrerrequisitosRacial usa PATCH y normaliza la respuesta', async () => {
        http.patch.and.returnValue(of({ message: 'ok', idRacial: 31, racial: { Id: 31, Nombre: 'Alas' } }));

        const response = await service.anadirPrerrequisitosRacial(31, { raza: [{ id_raza: 99 }] });

        expect(http.patch).toHaveBeenCalledWith(
            `${environment.apiUrl}razas/raciales/31/prerrequisitos`,
            { prerrequisitos: { raza: [{ id_raza: 99 }] } },
            { headers: { Authorization: 'Bearer token-racial' } }
        );
        expect(response.idRacial).toBe(31);
    });
});
