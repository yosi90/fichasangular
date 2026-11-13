import Swal from 'sweetalert2';
import { SelectorAumentosCaracteristicaModalComponent } from 'src/app/components/nuevo-personaje/selector-aumentos-caracteristica-modal/selector-aumentos-caracteristica-modal.component';
import { SelectorDotesModalComponent } from 'src/app/components/nuevo-personaje/selector-dotes-modal/selector-dotes-modal.component';
import { CampanaService } from 'src/app/services/campana.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { MAX_TIRADAS_PUNTOS_GOLPE } from 'src/app/services/utils/puntos-golpe';
import { HuecoDeSelectores } from './hueco-selectores';
import { resolverDotesPendientes, resolverIncrementoPendiente, tiradasPermitidasDe } from './pasos-con-selectores';

describe('pasos-con-selectores (la subida y la adquisición de una plantilla)', () => {
    const entrada = (personaje: Record<string, unknown>) => ({ personaje } as any);

    describe('tiradasPermitidasDe', () => {
        it('un PNJ tira como al crearlo, sin el límite de la campaña', async () => {
            const campanas = jasmine.createSpyObj<CampanaService>('CampanaService', ['getCampaignDetail']);
            expect(await tiradasPermitidasDe(entrada({ tipo: 'pnj', campana: { id: 4 } }), campanas)).toBe(MAX_TIRADAS_PUNTOS_GOLPE);
            expect(campanas.getCampaignDetail).not.toHaveBeenCalled();
        });

        it('sin campaña, una; en una campaña, las de su política, y una si no se puede leer', async () => {
            const campanas = jasmine.createSpyObj<CampanaService>('CampanaService', ['getCampaignDetail']);
            expect(await tiradasPermitidasDe(entrada({ tipo: 'pj', campana: null }), campanas)).toBe(1);
            campanas.getCampaignDetail.and.resolveTo({ politicaCreacion: { maxTiradasPuntosGolpe: 2 } } as any);
            expect(await tiradasPermitidasDe(entrada({ tipo: 'pj', campana: { id: 4 } }), campanas)).toBe(2);
            expect(campanas.getCampaignDetail).toHaveBeenCalledWith(4);
            campanas.getCampaignDetail.and.rejectWith(new Error('sin red'));
            expect(await tiradasPermitidasDe(entrada({ tipo: 'pj', campana: { id: 4 } }), campanas)).toBe(1);
        });
    });

    describe('resolverIncrementoPendiente', () => {
        it('no se cierra hasta que el +1 se aplica, y avisa si falta', async () => {
            const svc = jasmine.createSpyObj<NuevoPersonajeService>('NuevoPersonajeService',
                ['getAumentosCaracteristicaPendientes', 'getTopesCaracteristicas', 'aplicarAumentosCaracteristica'],
                { PersonajeCreacion: { Fuerza: 10, Destreza: 10, Constitucion: 10, Inteligencia: 10, Sabiduria: 10, Carisma: 10 } as any });
            svc.getAumentosCaracteristicaPendientes.and.returnValue([]);
            svc.aplicarAumentosCaracteristica.and.returnValues(false, true);
            const hueco = { abrir: jasmine.createSpy('abrir').and.resolveTo([{ caracteristica: 'Fuerza' }]) } as unknown as HuecoDeSelectores;
            const aviso = spyOn(Swal, 'fire').and.resolveTo({} as any);
            await resolverIncrementoPendiente(svc, hueco, 'Incremento');
            expect((hueco.abrir as jasmine.Spy).calls.count()).toBe(2);
            expect((hueco.abrir as jasmine.Spy).calls.argsFor(0)[0]).toBe(SelectorAumentosCaracteristicaModalComponent);
            expect((hueco.abrir as jasmine.Spy).calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({ titulo: 'Incremento' }));
            expect(aviso).toHaveBeenCalledTimes(1);
        });
    });

    describe('resolverDotesPendientes', () => {
        function motor(pendientes: Array<{ id: number; }>, candidatos: Record<number, any[]>) {
            const cola = [...pendientes];
            const svc = jasmine.createSpyObj<NuevoPersonajeService>('NuevoPersonajeService',
                ['getSiguienteDotePendiente', 'obtenerCandidatosDotePendiente', 'omitirDotePendiente', 'getDotesPendientes', 'aplicarDotePendiente']);
            svc.getSiguienteDotePendiente.and.callFake(() => cola[0] as any ?? null);
            svc.obtenerCandidatosDotePendiente.and.callFake((id: number) => candidatos[id] ?? []);
            svc.omitirDotePendiente.and.callFake(() => { cola.shift(); return true as any; });
            svc.aplicarDotePendiente.and.callFake(() => { cola.shift(); return true; });
            svc.getDotesPendientes.and.callFake(() => cola.map((p) => ({ ...p, estado: 'pendiente' })) as any);
            return svc;
        }
        const elegible = { evaluacion: { estado: 'eligible' }, repeticionValida: true, restringidaPorTipo: false };

        it('omite sola la que no tiene candidata elegible y aplica la elegida', async () => {
            const svc = motor([{ id: 1 }, { id: 2 }], { 1: [{ ...elegible, repeticionValida: false }], 2: [elegible] });
            const hueco = { abrir: jasmine.createSpy('abrir').and.resolveTo({ idDote: 7, idExtra: 0 }) } as unknown as HuecoDeSelectores;
            expect(await resolverDotesPendientes(svc, hueco)).toBeTrue();
            expect(svc.omitirDotePendiente).toHaveBeenCalledOnceWith(1);
            expect(svc.aplicarDotePendiente).toHaveBeenCalledOnceWith(2, { idDote: 7, idExtra: 0 } as any);
            expect((hueco.abrir as jasmine.Spy).calls.argsFor(0)[0]).toBe(SelectorDotesModalComponent);
        });

        it('si se cierra el selector sin elegir, el paso sigue abierto', async () => {
            const svc = motor([{ id: 1 }], { 1: [elegible] });
            const hueco = { abrir: jasmine.createSpy('abrir').and.resolveTo(null) } as unknown as HuecoDeSelectores;
            expect(await resolverDotesPendientes(svc, hueco)).toBeFalse();
            expect(svc.aplicarDotePendiente).not.toHaveBeenCalled();
        });
    });
});
