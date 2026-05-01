import { of } from 'rxjs';
import { EspecialClaseMutationRequest } from '../interfaces/especial';
import { EspecialService } from './especial.service';

describe('EspecialService', () => {
    const payload: EspecialClaseMutationRequest = {
        especial: {
            nombre: 'Aura de mando',
            descripcion: 'Otorga bonificadores.',
            extra: false,
            repetible: false,
            rep_mismo_extra: false,
            rep_comb: false,
            act_extra: false,
            caracteristica: 0,
            id_caracteristica_ca: 0,
            bonificadores: {
                fuerza: 0,
                destreza: 0,
                constitucion: 0,
                inteligencia: 0,
                sabiduria: 0,
                carisma: 2,
                ca: 0,
                arm_nat: 0,
                rd: 0,
            },
            flags_extra: {
                no_aplica: true,
                da_ca: false,
                da_armadura_natural: false,
                da_rd: false,
                da_velocidad: false,
            },
            id_subtipo: 0,
            oficial: true,
        },
        extras: [{ id_extra: 4, orden: 1 }],
        habilidades: [{ id_habilidad: 8, id_extra: -1, rangos: 2 }],
    };

    function createService() {
        const auth = {
            currentUser: {
                getIdToken: jasmine.createSpy('getIdToken').and.resolveTo('token-123'),
            },
        };
        const http = jasmine.createSpyObj('HttpClient', ['post', 'put']);
        const context = {
            run: jasmine.createSpy('run').and.returnValue(Promise.resolve()),
        };
        const service = new EspecialService(auth as any, {} as any, http as any, context as any);
        return { service, http, context };
    }

    it('crea especial con Bearer, sin uid en body y actualiza cache', async () => {
        const { service, http, context } = createService();
        http.post.and.returnValue(of({
            message: 'Creado',
            idEspecial: 77,
            especial: {
                Id: 77,
                Nombre: 'Aura de mando',
                Descripcion: 'Otorga bonificadores.',
                Oficial: true,
                Extra: false,
                Repetible: false,
                Repite_mismo_extra: false,
                Repite_combinacion: false,
                Activa_extra: false,
                Caracteristica: { Id: 0, Nombre: '' },
                Bonificadores: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 2, CA: 0, Armadura_natural: 0, RD: 0 },
                Flags_extra: { No_aplica: true, Da_CA: false, Da_armadura_natural: false, Da_RD: false, Da_velocidad: false },
                Subtipo: { Id: 0, Nombre: '' },
                Extras: [],
                Habilidades: [],
            },
        }));

        const response = await service.crearEspecial(payload);

        expect(http.post).toHaveBeenCalledWith(
            jasmine.stringMatching(/clases\/habilidades\/add$/),
            payload,
            { headers: { Authorization: 'Bearer token-123' } },
        );
        expect(JSON.stringify(http.post.calls.mostRecent().args[1])).not.toContain('uid');
        expect(context.run).toHaveBeenCalled();
        expect(response.idEspecial).toBe(77);
        expect(response.especial.Nombre).toBe('Aura de mando');
    });

    it('actualiza especial con PUT y normaliza id_especial legacy de respuesta', async () => {
        const { service, http } = createService();
        http.put.and.returnValue(of({
            message: 'Actualizado',
            id_especial: 77,
            especial: {
                Id: 77,
                Nombre: 'Aura de mando superior',
                Descripcion: '',
                Oficial: false,
                Extra: false,
                Repetible: false,
                Repite_mismo_extra: false,
                Repite_combinacion: false,
                Activa_extra: false,
                Caracteristica: { Id: 0, Nombre: '' },
                Bonificadores: {},
                Flags_extra: {},
                Subtipo: {},
                Extras: [],
                Habilidades: [],
            },
        }));

        const response = await service.actualizarEspecial(77, payload);

        expect(http.put).toHaveBeenCalledWith(
            jasmine.stringMatching(/clases\/habilidades\/77$/),
            payload,
            { headers: { Authorization: 'Bearer token-123' } },
        );
        expect(response.idEspecial).toBe(77);
        expect(response.especial.Oficial).toBeFalse();
    });
});

