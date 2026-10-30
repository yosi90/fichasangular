import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { simularTokenApi } from 'src/testing/simular-token-api';
import { plantillaApiDeEjemplo } from 'src/testing/plantilla-api';
import { PlantillaService } from './plantilla.service';
import { ErrorDeCatalogo } from './utils/error-catalogo';
import { construirPlantillaRequest, listasPlantillaVacias, valorPlantillaNueva } from './utils/plantilla-formulario';
import { normalizePlantilla } from './utils/plantilla-mapper';
import { normalizePlantillaApi } from './utils/plantilla-mapper';

describe('Plantilla mappers', () => {
    function createPlantillaRaw(overrides: any = {}): any {
        return {
            Id: 7,
            Nombre: 'Licantropo',
            Descripcion: 'Detalle canonico',
            Manual: { Id: 1, Nombre: 'MM', Pagina: 10 },
            Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
            Tipo_dado: { Id_tipo_dado: 8, Nombre: 'd8' },
            Actualiza_dg: true,
            Modificacion_dg: { Id_paso_modificacion: 1, Nombre: '+1 categoria' },
            Modificacion_tamano: { Id_paso_modificacion: 0, Nombre: '' },
            Iniciativa: 0,
            Velocidades: '',
            Ca: '',
            Ataque_base: 0,
            Presa: 0,
            Ataques: '',
            Ataque_completo: '',
            Reduccion_dano: '',
            Resistencia_conjuros: '',
            Resistencia_elemental: '',
            Fortaleza: 0,
            Reflejos: 0,
            Voluntad: 0,
            Modificadores_caracteristicas: {},
            Minimos_caracteristicas: {},
            Ajuste_nivel: 0,
            Licantronia_dg: {},
            Cd: 0,
            Puntos_habilidad: {},
            Nacimiento: false,
            Movimientos: {},
            Maniobrabilidad: {},
            Alineamiento: {},
            Oficial: true,
            Dotes: [],
            Habilidades: [],
            Sortilegas: [],
            Prerrequisitos_flags: {},
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [],
            },
            ...overrides,
        };
    }

    it('normaliza el payload HTTP canonico de plantilla', () => {
        const plantilla = normalizePlantillaApi(createPlantillaRaw({
            Subtipos: [{ Id: 11, Nombre: 'Humano' }],
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [{
                    Id_tipo_compatible: 3,
                    Id_tipo_nuevo: 9,
                    Tipo_compatible: 'Humanoide',
                    Tipo_nuevo: 'Cambiaformas',
                    Opcional: 1,
                }],
            },
        }));

        expect(plantilla.Subtipos).toEqual([{ Id: 11, Nombre: 'Humano' }]);
        expect(plantilla.Compatibilidad_tipos).toEqual([{
            Id_tipo_comp: 3,
            Id_tipo_nuevo: 9,
            Tipo_comp: 'Humanoide',
            Tipo_nuevo: 'Cambiaformas',
            Tipo_nuevo_comodin: null,
            Opcional: 1,
        }]);
    });

    it('lee las aptitudes raciales y los ataques especiales con sus DG, y el comodín del extra de las habilidades', () => {
        const plantilla = normalizePlantillaApi(createPlantillaRaw({
            Raciales: [{ Racial: { Id: 21, Nombre: 'Resistencia al frío', Descripcion: 'Resiste 5.' }, Dg: 4 }],
            Ataques_especiales: [{ Racial: { Id: 22, Nombre: 'Aura de miedo' }, Dg: 0 }],
            Habilidades: [{ Id_habilidad: 30, Habilidad: 'Saber', Extra: null, Extra_comodin: 'elegir', Rangos: 2 }],
        }));

        expect(plantilla.Raciales.map((item) => [item.Racial.Id, item.Racial.Nombre, item.Racial.Descripcion, item.Dg]))
            .toEqual([[21, 'Resistencia al frío', 'Resiste 5.', 4]]);
        expect(plantilla.Ataques_especiales.map((item) => [item.Racial.Nombre, item.Dg])).toEqual([['Aura de miedo', 0]]);
        expect(plantilla.Habilidades[0].Extra_comodin).toBe('elegir');
        // Sin ellas, listas vacías.
        expect(normalizePlantilla(createPlantillaRaw()).Raciales).toEqual([]);
    });

    it('lee de la caché de la RTDB los raciales, los ataques especiales y el comodín de las habilidades (Plantillas 8)', () => {
        // Como lo escribe el backend: el racial normalizado, sin las listas vacías ni las claves a null (la RTDB no las guarda).
        const plantilla = normalizePlantilla(createPlantillaRaw({
            Raciales: [{
                Racial: {
                    Id: 8, Nombre: "Visión en la oscuridad 60'", Descripcion: 'En blanco y negro.', Oficial: true, Origen: '',
                    Opcional: 0, Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
                },
                Dg: 0,
            }],
            Ataques_especiales: [{ Racial: { Id: 128, Nombre: 'Castigar al mal (celestial)', Oficial: true }, Dg: 4 }],
            Habilidades: [
                { Id_habilidad: 32, Habilidad: 'Saber', Id_extra: 0, Extra: 'Elegir', Extra_comodin: 'elegir', Rangos: 4 },
                { Id_habilidad: 6, Habilidad: 'Avistar', Id_extra: 0, Extra: '', Rangos: 8 },
            ],
        }));

        expect(plantilla.Raciales.map((item) => [item.Racial.Id, item.Racial.Nombre, item.Racial.Descripcion, item.Dg]))
            .toEqual([[8, "Visión en la oscuridad 60'", 'En blanco y negro.', 0]]);
        expect(plantilla.Raciales[0].Racial.Dotes).toEqual([]);
        expect(plantilla.Ataques_especiales.map((item) => [item.Racial.Id, item.Racial.Nombre, item.Dg]))
            .toEqual([[128, 'Castigar al mal (celestial)', 4]]);
        expect(plantilla.Habilidades.map((h) => h.Extra_comodin)).toEqual(['elegir', null]);
    });

    it('descarta aliases legacy en el mapper HTTP de plantilla', () => {
        const plantilla = normalizePlantillaApi(createPlantillaRaw({
            subtipos: [{ Id: 11, Nombre: 'Humano' }],
            Subtipos: [{ i: 12, n: 'Celestial' }],
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [{
                    id_tipo_compatible: 3,
                    Id_nuevo: 9,
                    Tipo_compatible: 'Humanoide',
                    nombre_tipo_nuevo: 'Cambiaformas',
                    o: 1,
                }],
            },
        }));

        expect(plantilla.Subtipos).toEqual([]);
        expect(plantilla.Compatibilidad_tipos).toEqual([]);
    });

    it('mantiene compatibilidad legacy en el mapper compartido de plantilla', () => {
        const plantilla = normalizePlantilla(createPlantillaRaw({
            Subtipos: undefined,
            subtipos: [{ i: 12, n: 'Celestial' }],
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [{
                    id_tipo_compatible: 3,
                    Id_nuevo: 9,
                    Tipo_compatible: 'Humanoide',
                    nombre_tipo_nuevo: 'Cambiaformas',
                    o: 1,
                }],
            },
        }));

        expect(plantilla.Subtipos).toEqual([{ Id: 12, Nombre: 'Celestial' }]);
        expect(plantilla.Compatibilidad_tipos).toEqual([{
            Id_tipo_comp: 3,
            Id_tipo_nuevo: 9,
            Tipo_comp: 'Humanoide',
            Tipo_nuevo: 'Cambiaformas',
            Tipo_nuevo_comodin: null,
            Opcional: 1,
        }]);
    });
});

describe('PlantillaService, alta y modificación', () => {
    const cuerpo = () => construirPlantillaRequest({ ...valorPlantillaNueva(), nombre: 'Prueba', id_manual: 4, id_tamano: 0 }, listasPlantillaVacias());
    const servicio = (http: any, auth: any = { currentUser: { uid: 'a' } }) => new PlantillaService({} as any, http, {} as any, auth);

    it('sin la sesión de Firebase avisa y no llama a la API', async () => {
        const http = jasmine.createSpyObj('HttpClient', ['post']);
        await expectAsync(servicio(http, { currentUser: null }).crearPlantilla(cuerpo()))
            .toBeRejectedWithError('Debes iniciar sesión para gestionar plantillas');
        expect(http.post).not.toHaveBeenCalled();
    });

    it('crea con POST /plantillas/add, el cuerpo del contrato y el token como Bearer', async () => {
        simularTokenApi('token-plantilla');
        const http = jasmine.createSpyObj('HttpClient', ['post']);
        http.post.and.returnValue(of({ message: 'Plantilla creada correctamente.', idPlantilla: 21, plantilla: plantillaApiDeEjemplo() }));

        const respuesta = await servicio(http).crearPlantilla(cuerpo());

        const [url, enviado, opciones] = http.post.calls.argsFor(0);
        expect(url).toMatch(/plantillas\/add$/);
        expect(enviado).toEqual(cuerpo());
        expect(opciones.headers).toEqual({ Authorization: 'Bearer token-plantilla' });
        expect(respuesta.idPlantilla).toBe(21);
        expect(respuesta.message).toBe('Plantilla creada correctamente.');
        expect(respuesta.plantilla?.Nombre).toBe('Licántropo de prueba');
    });

    it('modifica con PUT /plantillas/<id> y el mismo cuerpo que el alta (la plantilla entera)', async () => {
        simularTokenApi();
        const http = jasmine.createSpyObj('HttpClient', ['put']);
        http.put.and.returnValue(of({ message: 'Plantilla actualizada correctamente.', idPlantilla: 21, plantilla: plantillaApiDeEjemplo() }));

        const respuesta = await servicio(http).actualizarPlantilla(21, cuerpo());

        expect(http.put.calls.argsFor(0)[0]).toMatch(/plantillas\/21$/);
        expect(http.put.calls.argsFor(0)[1]).toEqual(cuerpo());
        expect(respuesta.plantilla?.Id).toBe(21);
    });

    it('conserva el code y el field de un 400 para que el formulario marque el campo', async () => {
        simularTokenApi();
        const http = jasmine.createSpyObj('HttpClient', ['put']);
        http.put.and.returnValue(throwError(() => new HttpErrorResponse({
            status: 400,
            error: { error: "'dotes[0].dg' es obligatorio.", code: 'peticion_no_valida', field: 'dotes[0].dg', debug: { requestId: 'x' } },
        })));

        const error = await servicio(http).actualizarPlantilla(21, cuerpo()).catch((e) => e);

        expect(error instanceof ErrorDeCatalogo).toBeTrue();
        expect(error.campo).toBe('dotes[0].dg');
        expect(error.codigo).toBe('peticion_no_valida');
        expect(error.estado).toBe(400);
        expect(error.message).toContain('Los datos de la plantilla no son válidos.');
    });

    it('lee la plantilla que se va a modificar de la API, sin la caché', (done) => {
        const http = jasmine.createSpyObj('HttpClient', ['get']);
        http.get.and.returnValue(of(plantillaApiDeEjemplo()));
        servicio(http).getPlantillaFresca(21).subscribe((plantilla) => {
            expect(http.get.calls.argsFor(0)[0]).toMatch(/plantillas\/21$/);
            expect(plantilla.Licantronia_dg?.Multiplicador).toBe(2);
            done();
        });
    });
});
