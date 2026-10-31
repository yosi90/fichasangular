import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { simularTokenApi } from 'src/testing/simular-token-api';
import { ProfileApiError } from '../interfaces/user-account';
import { CategoriaEdadService } from './categoria-edad.service';

describe('CategoriaEdadService', () => {
    const servicio = (http: any) => new CategoriaEdadService(http, { currentUser: { uid: 'a' } } as any);

    it('lee el catálogo por su orden típico', async () => {
        const http = jasmine.createSpyObj('HttpClient', ['get']);
        http.get.and.returnValue(of([
            { Id: 12, Nombre: 'Gran sierpe', Orden_tipico: 12, Oficial: true, Manual: { Id: 47, Nombre: 'Manual de monstruos 1', Pagina: 74 }, Comodin: null },
            { Id: 1, Nombre: 'Cría', Orden_tipico: 1, Oficial: true, Manual: { Id: 47, Nombre: 'Manual de monstruos 1', Pagina: 74 }, Comodin: null },
        ]));

        const categorias = await firstValueFrom(servicio(http).getCategoriasEdad());

        expect(http.get.calls.argsFor(0)[0]).toMatch(/categorias-edad$/);
        expect(categorias.map((categoria) => categoria.Nombre)).toEqual(['Cría', 'Gran sierpe']);
        expect(categorias[0]).toEqual({ Id: 1, Nombre: 'Cría', Orden_tipico: 1, Oficial: true, Manual: { Id: 47, Nombre: 'Manual de monstruos 1', Pagina: 74 } });
    });

    it('crea una categoría con la sesión y devuelve la creada', async () => {
        simularTokenApi('token-categoria');
        const http = jasmine.createSpyObj('HttpClient', ['post']);
        http.post.and.returnValue(of({
            message: 'Categoría de edad creada exitosamente', idCategoriaEdad: 13,
            categoria: { Id: 13, Nombre: 'Anciano', Orden_tipico: 13, Oficial: false, Manual: { Id: 1, Nombre: 'Homebrew', Pagina: 0 } },
        }));
        const cuerpo = { categoria: { nombre: 'Anciano', orden_tipico: 13, id_manual: 1, pagina: 0, oficial: false } };

        const respuesta = await servicio(http).crearCategoriaEdad(cuerpo);

        const [url, enviado] = http.post.calls.argsFor(0);
        expect(url).toMatch(/categorias-edad\/add$/);
        expect(enviado).toEqual(cuerpo);
        expect(respuesta.message).toBe('Categoría de edad creada exitosamente');
        expect(respuesta.categoria.Id).toBe(13);
    });

    it('un error de la API llega con su código y su campo', async () => {
        simularTokenApi();
        const http = jasmine.createSpyObj('HttpClient', ['post']);
        http.post.and.returnValue(throwError(() => new HttpErrorResponse({
            status: 409, error: { error: 'Ya existe una categoría de edad con ese nombre.', code: 'nombre_duplicado', field: 'categoria.nombre' },
        })));

        const error = await servicio(http).crearCategoriaEdad({ categoria: { nombre: 'Cría', orden_tipico: 1, id_manual: 1, pagina: 0, oficial: true } })
            .catch((e) => e);

        expect(error instanceof ProfileApiError).toBeTrue();
        expect((error as ProfileApiError).code).toBe('nombre_duplicado');
        expect((error as ProfileApiError).field).toBe('categoria.nombre');
    });
});
