import { Raza } from "src/app/interfaces/raza";
import { esRazaMutada } from "./raza-mutacion";

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
