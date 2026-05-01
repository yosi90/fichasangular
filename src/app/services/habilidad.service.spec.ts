import { of } from 'rxjs';
import { HabilidadService } from './habilidad.service';

describe('HabilidadService custom mutations', () => {
    function createService() {
        const auth = {
            currentUser: {
                getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-123'),
            },
        };
        const http = jasmine.createSpyObj('HttpClient', ['post', 'patch']);
        const context = {
            run: jasmine.createSpy('run').and.returnValue(Promise.resolve()),
        };
        const service = new HabilidadService(auth as any, {} as any, http as any, context as any);
        return { service, http, context };
    }

    it('crea habilidad custom con POST y cache local', async () => {
        const { service, http, context } = createService();
        http.post.and.returnValue(of({
            message: 'Creada',
            idHabilidad: 12,
            habilidad: {
                Id_habilidad: 12,
                Nombre: 'Pilotar aeronave',
                Id_caracteristica: 3,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: false,
                Entrenada: false,
                Extras: [],
            },
        }));

        const response = await service.crearHabilidadCustom({ nombre: 'Pilotar aeronave', id_caracteristica: 3 });

        expect(http.post).toHaveBeenCalledWith(
            jasmine.stringMatching(/habilidades\/custom\/add$/),
            { nombre: 'Pilotar aeronave', id_caracteristica: 3 },
            { headers: { Authorization: 'Bearer token-123' } },
        );
        expect(JSON.stringify(http.post.calls.mostRecent().args[1])).not.toContain('uid');
        expect(context.run).toHaveBeenCalled();
        expect(response.habilidad.Nombre).toBe('Pilotar aeronave');
    });

    it('actualiza habilidad custom con PATCH', async () => {
        const { service, http } = createService();
        http.patch.and.returnValue(of({
            message: 'Actualizada',
            id_habilidad: 12,
            habilidad: {
                Id_habilidad: 12,
                Nombre: 'Pilotar dirigible',
                Id_caracteristica: 4,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: false,
                Entrenada: false,
                Extras: [],
            },
        }));

        const response = await service.actualizarHabilidadCustom(12, { nombre: 'Pilotar dirigible' });

        expect(http.patch).toHaveBeenCalledWith(
            jasmine.stringMatching(/habilidades\/custom\/12$/),
            { nombre: 'Pilotar dirigible' },
            { headers: { Authorization: 'Bearer token-123' } },
        );
        expect(response.idHabilidad).toBe(12);
        expect(response.habilidad.Nombre).toBe('Pilotar dirigible');
    });
});

