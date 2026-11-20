import { Raza } from "src/app/interfaces/raza";
import { esRazaMutada, especialQueLaSustituye } from "./raza-mutacion";

/**
 * La web solo sabe si una raza es mutada: la combinación y la elegibilidad de las bases son de la API desde la fase 2
 * (`RazaService.getRazaSobreBase` y `getBasesDeRazaMutada`). La ida y vuelta que comprobó que la API combina igual que
 * `aplicarMutacion` está en el commit `00dbf5f` de la rama `mutadas/fase-2`.
 */
describe("esRazaMutada", () => {
    it("lee la marca de la raza (sin el alias `Mutacion`, retirado en la fase 3)", () => {
        expect(esRazaMutada({ Mutada: true } as Raza)).toBeTrue();
        expect(esRazaMutada({ Mutada: false, Mutacion: { Es_mutada: true } } as unknown as Raza)).toBeFalse();
        expect(esRazaMutada({ Mutada: false } as Raza)).toBeFalse();
        expect(esRazaMutada(null)).toBeFalse();
    });
});

describe('especialQueLaSustituye', () => {
    const sustituidos = [
        { Especial: { Id: 10, Nombre: 'Expulsar muertos vivientes' }, Especial_nuevo: { Id: 11, Nombre: ' Reprender muertos vivientes ' } },
        { Especial: { Id: 10, Nombre: 'Expulsar muertos vivientes' }, Especial_nuevo: { Id: 12, Nombre: 'Otra' } },
    ];

    it('da la primera que la sustituye, con su nombre limpio', () => {
        expect(especialQueLaSustituye(sustituidos, 10)).toEqual({ Id: 11, Nombre: 'Reprender muertos vivientes' });
    });

    it('sin sustitución, sin id o sin lista, nada', () => {
        expect(especialQueLaSustituye(sustituidos, 20)).toBeNull();
        expect(especialQueLaSustituye(sustituidos, 0)).toBeNull();
        expect(especialQueLaSustituye(undefined, 10)).toBeNull();
    });
});
