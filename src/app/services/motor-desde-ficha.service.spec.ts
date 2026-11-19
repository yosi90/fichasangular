import { HistorialSesiones } from 'src/app/interfaces/sesiones';
import { MotorDesdeFichaService } from './motor-desde-ficha.service';
import { NuevoPersonajeService } from './nuevo-personaje.service';
import { PersonajeService } from './personaje.service';
import { SesionesService } from './sesiones.service';

// El tramo común de la carga de las pantallas que apuntan en una sesión (la subida, la adquisición de una plantilla, la
// pérdida de un nivel y la corrección): `cargarSesionDeJuego`.
describe('MotorDesdeFichaService.cargarSesionDeJuego', () => {
    const FRASES = { sinPermiso: 'Sin permiso.', sinSesion: 'Sin sesión.' };
    let sesiones: jasmine.SpyObj<SesionesService>;
    let servicio: MotorDesdeFichaService;
    const motor = {} as NuevoPersonajeService;

    const historial = (cambios: Partial<HistorialSesiones> = {}): HistorialSesiones => ({
        idPersonaje: 5, puedeApuntar: true, veNotas: true, rolActor: 'jugador',
        experiencia: { px: 1000, nivel: 1, pxNivelActual: 0, pxSiguienteNivel: 1000, puedeSubir: true, nivelesPorSubir: 1, sesionAbierta: { numero: 3, titulo: '' } },
        sesiones: [{ numero: 3, estado: 'abierta' } as any],
        ...cambios,
    });

    beforeEach(() => {
        sesiones = jasmine.createSpyObj<SesionesService>('SesionesService', ['historial', 'sesion']);
        sesiones.sesion.and.callFake(async (_id, numero) => ({
            sesion: { numero, estado: 'abierta' } as any, ficha: {}, entrada: { personaje: {} } as any, nivelesPerdidos: [],
        }));
        const personajes = { fichaDeApi: () => ({ Nombre: 'Brunilda' }) } as unknown as PersonajeService;
        const nulos = Array.from({ length: 13 }, () => null as any) as any[];
        servicio = new (MotorDesdeFichaService as any)(...nulos, sesiones, personajes, null);
        spyOn(servicio, 'cargarCatalogos').and.resolveTo();
    });

    it('con permiso y la sesión de juego abierta, da el historial y la sesión cargada', async () => {
        const leido = historial();
        sesiones.historial.and.resolveTo(leido);
        const resultado = await servicio.cargarSesionDeJuego(motor, 5, () => true, FRASES);
        expect(resultado?.historial).toBe(leido);
        expect(resultado?.cargada.sesion.numero).toBe(3);
        expect(resultado?.cargada.pj.Nombre).toBe('Brunilda');
        expect(sesiones.sesion).toHaveBeenCalledWith(5, 3);
        expect(servicio.cargarCatalogos).toHaveBeenCalledWith(motor);
    });

    it('sin poder apuntar, la frase de cada pantalla, sin cargar la sesión; `alLeer` recibe el historial antes', async () => {
        sesiones.historial.and.resolveTo(historial({ puedeApuntar: false }));
        const alLeer = jasmine.createSpy('alLeer');
        await expectAsync(servicio.cargarSesionDeJuego(motor, 5, () => true, FRASES, { alLeer })).toBeRejectedWithError('Sin permiso.');
        expect(alLeer).toHaveBeenCalled();
        expect(sesiones.sesion).not.toHaveBeenCalled();
    });

    it('sin una sesión de juego abierta, la suya; la de creación (0) no cuenta si no es de cualquier tipo', async () => {
        const experiencia = { ...historial().experiencia!, sesionAbierta: null };
        sesiones.historial.and.resolveTo(historial({ experiencia, sesiones: [{ numero: 0, estado: 'abierta' } as any] }));
        await expectAsync(servicio.cargarSesionDeJuego(motor, 5, () => true, FRASES)).toBeRejectedWithError('Sin sesión.');
        expect(sesiones.sesion).not.toHaveBeenCalled();
        const corregida = await servicio.cargarSesionDeJuego(motor, 5, () => true, FRASES, { deCualquierTipo: true });
        expect(corregida?.cargada.sesion.numero).toBe(0);
    });

    it('de cualquier tipo, sin ninguna abierta en el historial, la frase de la sesión', async () => {
        sesiones.historial.and.resolveTo(historial({ sesiones: [{ numero: 0, estado: 'cerrada' } as any] }));
        await expectAsync(servicio.cargarSesionDeJuego(motor, 5, () => true, FRASES, { deCualquierTipo: true }))
            .toBeRejectedWithError('Sin sesión.');
    });

    it('`exigir` va después del permiso y la sesión, y su frase corta la carga', async () => {
        sesiones.historial.and.resolveTo(historial({ puedeApuntar: false }));
        const exigir = jasmine.createSpy('exigir').and.returnValue('Faltan PX.');
        await expectAsync(servicio.cargarSesionDeJuego(motor, 5, () => true, FRASES, { exigir })).toBeRejectedWithError('Sin permiso.');
        expect(exigir).not.toHaveBeenCalled();
        sesiones.historial.and.resolveTo(historial());
        await expectAsync(servicio.cargarSesionDeJuego(motor, 5, () => true, FRASES, { exigir })).toBeRejectedWithError('Faltan PX.');
        expect(sesiones.sesion).not.toHaveBeenCalled();
    });

    it('si al responder ya no es la misma cuenta, `null` sin cargar los catálogos', async () => {
        sesiones.historial.and.resolveTo(historial());
        expect(await servicio.cargarSesionDeJuego(motor, 5, () => false, FRASES)).toBeNull();
        expect(servicio.cargarCatalogos).not.toHaveBeenCalled();
    });
});
