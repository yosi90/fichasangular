import { HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
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
        return new EquipoServiceDePrueba({} as any, http, { run: (fn: () => any) => fn() } as any);
    }

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
        expect(afilada.Requisitos.Conjuros[0].Opcional).toBeFalse();
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
