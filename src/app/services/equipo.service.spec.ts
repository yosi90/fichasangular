import { HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { simularTokenApi } from 'src/testing/simular-token-api';
import { ProfileApiError } from '../interfaces/user-account';
import { EscuchaRtdb } from './catalogo-api';
import { EquipoService } from './equipo.service';
import {
    crearConjuntoApi,
    crearEncantamientoApi,
    crearEquipoCatalogosApi,
    crearMaterialApi,
    crearMunicionApi,
    crearObjetoApi,
    crearObjetoGenericoApi,
} from 'src/testing/equipo-api';

describe('EquipoService', () => {
    class EquipoServiceDePrueba extends EquipoService {
        cache: Record<string, any> = {};
        rutas: string[] = [];

        protected override escuchar(ruta: string): EscuchaRtdb {
            return (onNext) => {
                this.rutas.push(ruta);
                const valor = this.cache[ruta];
                onNext({ exists: () => valor !== undefined && valor !== null, val: () => valor ?? null });
                return () => undefined;
            };
        }
    }

    function crear(http: any): EquipoServiceDePrueba {
        return new EquipoServiceDePrueba({} as any, http, { run: (fn: () => any) => fn() } as any, { currentUser: { uid: 'a' } } as any);
    }

    describe('alta y edición (segunda parte del hito 7)', () => {
        beforeEach(() => simularTokenApi('token-objetos'));

        it('crea una munición con POST …/add y devuelve la entrada normalizada', async () => {
            const http = jasmine.createSpyObj('HttpClient', ['post']);
            http.post.and.returnValue(of({ message: 'Munición creada exitosamente', idMunicion: 90, municion: crearMunicionApi({ Id: 90 }) }));
            const cuerpo = { municion: { nombre: 'Dardos' } } as any;

            const guardada = await crear(http).crearMunicion(cuerpo);

            const [url, enviado, opciones] = http.post.calls.argsFor(0);
            expect(url).toMatch(/municiones\/add$/);
            expect(enviado).toBe(cuerpo);
            expect(opciones.headers.Authorization).toBe('Bearer token-objetos');
            expect(guardada.id).toBe(90);
            expect(guardada.entrada.Id).toBe(90);
        });

        it('modifica un objeto y un conjunto con PUT …/<id>', async () => {
            const http = jasmine.createSpyObj('HttpClient', ['put']);
            http.put.and.returnValues(
                of({ message: 'Objeto actualizado exitosamente', idObjeto: 40, objeto: crearObjetoApi({ Id: 40 }) }),
                of({ message: 'Conjunto de objetos actualizado exitosamente', idConjunto: 22, conjunto: crearConjuntoApi({ Id: 22 }) }),
            );

            await crear(http).actualizarObjeto(40, {} as any);
            const conjunto = await crear(http).actualizarConjunto(22, {} as any);

            expect(http.put.calls.argsFor(0)[0]).toMatch(/objetos\/40$/);
            expect(http.put.calls.argsFor(1)[0]).toMatch(/conjuntos-objetos\/22$/);
            expect(conjunto.message).toBe('Conjunto de objetos actualizado exitosamente');
        });

        it('el error de la API llega con su código y su campo', async () => {
            const http = jasmine.createSpyObj('HttpClient', ['post']);
            http.post.and.returnValue(throwError(() => new HttpErrorResponse({
                status: 400, error: { error: 'Un coste por aplicación.', code: 'peticion_no_valida', field: 'costes[1].id_aplicacion' },
            })));

            const error = await crear(http).crearMaterial({} as any).catch((e) => e);

            expect(error instanceof ProfileApiError).toBeTrue();
            expect((error as ProfileApiError).field).toBe('costes[1].id_aplicacion');
        });

        it('el GET fresco va por HTTP, sin caché', async () => {
            const http = { get: jasmine.createSpy('get').and.returnValue(of(crearEncantamientoApi())) };
            const servicio = crear(http);

            const aptitud = await firstValueFrom(servicio.getEncantamientoFresco(1));

            expect(http.get.calls.argsFor(0)[0]).toMatch(/encantamientos\/1$/);
            expect(servicio.rutas).toEqual([]);
            expect(aptitud.Requisitos.Conjuros.every((conjuro) => typeof conjuro.Opcional === 'number')).toBeTrue();
        });
    });

    it('lee los materiales de la caché, sin el comodín y por nombre', async () => {
        const http = { get: jasmine.createSpy('get') };
        const servicio = crear(http);
        servicio.cache['Materiales'] = {
            9: crearMaterialApi(),
            4: crearMaterialApi({ Id: 4, Nombre: 'Acero', Costes: [] }),
            0: crearMaterialApi({ Id: 0, Nombre: 'Elegir', Comodin: 'elegir' }),
        };
        const materiales = await firstValueFrom(servicio.getMateriales());
        expect(materiales.map((m) => m.Nombre)).toEqual(['Acero', 'Mithril']);
        expect(http.get).not.toHaveBeenCalled();
    });

    it('sin caché, pide la munición a la API', async () => {
        const http = { get: jasmine.createSpy('get').and.returnValue(of([crearMunicionApi()])) };
        const servicio = crear(http);
        const municiones = await firstValueFrom(servicio.getMuniciones());
        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/municiones$/));
        expect(municiones[0].Cantidad_por_precio).toBe(20);
        expect(municiones[0].Armas.map((a) => a.Nombre)).toContain('Arco corto');
    });

    it('lee una aptitud especial de su caché por id', async () => {
        const servicio = crear({ get: jasmine.createSpy('get') });
        servicio.cache['Encantamientos/1'] = crearEncantamientoApi();
        const afilada = await firstValueFrom(servicio.getEncantamiento(1));
        expect(servicio.rutas).toEqual(['Encantamientos/1']);
        expect(afilada.Aplica_a.Arma_cuerpo_a_cuerpo).toBeTrue();
        expect(afilada.Requisitos.Conjuros[0].Opcional).toBe(0);
        expect(afilada.Origen_descripcion).toBe('srd');
    });

    it('lee los catálogos pequeños con el oro inicial y la riqueza por nivel', async () => {
        const servicio = crear({ get: jasmine.createSpy('get').and.returnValue(of(crearEquipoCatalogosApi())) });
        const catalogos = await firstValueFrom(servicio.getCatalogos());
        expect(catalogos.Riqueza_por_nivel.find((r) => r.Nivel === 2)?.Po).toBe(900);
        expect(catalogos.Oro_inicial_por_clase[1]).toEqual({ Clase: { Id: 9, Nombre: 'Guerrero' }, Dados: '6d4', Multiplicador: 10, Maximo: 240 });
        expect(catalogos.Ranuras.find((r) => r.Nombre === 'Anillo')?.Maximo).toBe(2);
    });

    it('pide los objetos paginados con sus filtros y lee el total de las cabeceras', async () => {
        const respuesta = new HttpResponse({
            body: [crearObjetoGenericoApi(), crearObjetoApi()],
            headers: new HttpHeaders({ 'X-Total-Count': '6', 'X-Has-More': 'true' }),
        });
        const http = { get: jasmine.createSpy('get').and.returnValue(of(respuesta)) };
        const servicio = crear(http);
        const pagina = await firstValueFrom(servicio.getObjetos({ q: ' poción ', categoria: 'magico', tipo: null, limit: 25, offset: 0 }));
        const [url, opciones] = http.get.calls.mostRecent().args;
        const params = opciones.params as HttpParams;
        expect(url).toMatch(/objetos$/);
        expect(params.get('q')).toBe('poción');
        expect(params.get('categoria')).toBe('magico');
        expect(params.has('tipo')).toBeFalse();
        expect(params.get('limit')).toBe('25');
        expect(pagina.total).toBe(6);
        expect(pagina.hayMas).toBeTrue();
        expect(pagina.items[0].Generico_conjuro?.Precio_por_nivel).toBe(50);
        expect(pagina.items[1].Modificadores[0].Tipo_bonificador?.Nombre).toBe('Resistencia');
    });

    it('abre una entrada de cualquier catálogo con su tipo', async () => {
        const http = { get: jasmine.createSpy('get').and.returnValue(of(crearConjuntoApi())) };
        const servicio = crear(http);
        const entrada = await firstValueFrom(servicio.getEntrada('conjunto', 1));
        expect(entrada.tipo).toBe('conjunto');
        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/conjuntos-objetos\/1$/));
    });
});
