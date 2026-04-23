import { TestBed } from '@angular/core/testing';
import { NuevaRazaDraftContenido, NuevaRazaDraftService } from './nueva-raza-draft.service';

describe('NuevaRazaDraftService', () => {
    let service: NuevaRazaDraftService;

    const uid = 'uid-raza-draft';
    const storageKey = `fichas35.nuevaRaza.draft.v1.${uid}`;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NuevaRazaDraftService);
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    function contenido(partial?: Partial<NuevaRazaDraftContenido>): NuevaRazaDraftContenido {
        return {
            selectedIndex: 3,
            formValue: {
                nombre: 'Raza de prueba',
                descripcion: 'Descripcion suficientemente larga',
            },
            selections: {
                subtiposSeleccionados: [8],
                idiomasSeleccionados: [9, 7],
                armasCompetenciaSeleccionadas: [17],
                armadurasCompetenciaSeleccionadas: [23],
                gruposArmaSeleccionados: [18],
                gruposArmaduraSeleccionados: [19],
            },
            searches: {
                manualBusqueda: 'Manual base',
                clasePredilectaBusqueda: 'Guerrero',
                subtipoBusqueda: 'Humano',
                tipoCriaturaDgsBusqueda: 'Humanoide',
            },
            relacionQueries: {
                idiomasSeleccionados: 'dra',
            },
            rows: {
                habilidadesBaseRows: [{ uid: 'h1', id_habilidad: 11, cantidad: 2 }],
                habilidadesCustomRows: [{ uid: 'hc1', id_habilidad: 13, cantidad: 1 }],
                dotesRows: [{ uid: 'd1', id_dote: 14, id_extra: 0 }],
                racialesRows: [{ uid: 'r1', id_racial: 15, opcional: 0 }],
                sortilegiosRows: [{ uid: 's1', id_conjuro: 16, nivel_lanzador: 1 }],
                prerrequisitosMutacionRows: [{ uid: 'p1', tipo: 'tipo_criatura', id: 3 }],
                prerrequisitosMutacionSeleccionados: ['tipo_criatura'],
            },
            ...partial,
        };
    }

    it('guarda y recupera borrador valido por uid', () => {
        service.guardarBorradorLocal(uid, contenido());

        const borrador = service.leerBorradorLocal(uid);
        const resumen = service.getResumenBorradorLocal(uid);

        expect(borrador?.uid).toBe(uid);
        expect(borrador?.version).toBe(1);
        expect(borrador?.formValue['nombre']).toBe('Raza de prueba');
        expect(borrador?.selections.idiomasSeleccionados).toEqual([7, 9]);
        expect(resumen).toEqual(jasmine.objectContaining({
            uid,
            nombre: 'Raza de prueba',
            selectedIndex: 3,
        }));
    });

    it('no mezcla borradores entre usuarios', () => {
        service.guardarBorradorLocal(uid, contenido());

        expect(service.leerBorradorLocal('otro-uid')).toBeNull();
        expect(service.puedeOfrecerRestauracionBorrador(uid)).toBeTrue();
        expect(service.puedeOfrecerRestauracionBorrador('otro-uid')).toBeFalse();
    });

    it('descarta json invalido, version incorrecta y borrador caducado', () => {
        localStorage.setItem(storageKey, '{no-json');
        expect(service.leerBorradorLocal(uid)).toBeNull();

        localStorage.setItem(storageKey, JSON.stringify({
            ...contenido(),
            version: 2,
            uid,
            updatedAt: Date.now(),
        }));
        expect(service.leerBorradorLocal(uid)).toBeNull();

        localStorage.setItem(storageKey, JSON.stringify({
            ...contenido(),
            version: 1,
            uid,
            updatedAt: Date.now() - (25 * 60 * 60 * 1000),
        }));

        expect(service.leerBorradorLocal(uid)).toBeNull();
        expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('borra el borrador al descartar', () => {
        service.guardarBorradorLocal(uid, contenido());

        service.descartarBorradorLocal(uid);

        expect(localStorage.getItem(storageKey)).toBeNull();
        expect(service.leerBorradorLocal(uid)).toBeNull();
    });
});
