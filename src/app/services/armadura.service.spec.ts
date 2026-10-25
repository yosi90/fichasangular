import { firstValueFrom, of } from "rxjs";
import { ArmaduraDetalle } from "../interfaces/armadura";
import { ArmaduraService, normalizeArmadura } from "./armadura.service";
import { crearArmaduraApi, crearRodelaApi } from "src/testing/equipo-api";

describe("ArmaduraService", () => {
    class TestArmaduraService extends ArmaduraService {
        snapshotFactory: () => any = () => snapshot(null, false);
        writes: ArmaduraDetalle[] = [];

        protected override watchArmadurasPath(onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.snapshotFactory());
            return () => undefined;
        }

    }

    function snapshot(value: any, exists = true): any {
        return {
            exists: () => exists,
            val: () => value,
        };
    }

    function rawArmadura(id: number, nombre: string): any {
        return {
            Id: id,
            Nombre: nombre,
            Descripcion: "",
            Manual: { Id: 1, Nombre: "Manual", Pagina: 1 },
            Ca: 1,
            Bon_des: 0,
            Penalizador: 0,
            Precio: 0,
            Material: { Id: 1, Nombre: "Acero" },
            Peso_armadura: { Id: 1, Nombre: "Ligera" },
            Peso: 0,
            Tamano: { Id: 2, Nombre: "Mediano" },
            Fallo_arcano: 0,
            Es_escudo: false,
            Oficial: true,
            Encantamientos: [],
        };
    }

    function createService(http: any): TestArmaduraService {
        return new TestArmaduraService({} as any, http as any, { run: (fn: () => any) => fn() } as any);
    }

    it("getArmaduras emite desde RTDB si hay cache", async () => {
        const http = { get: jasmine.createSpy() };
        const service = createService(http);
        service.snapshotFactory = () => snapshot({
            4: rawArmadura(4, "Camisote de mallas"),
            2: rawArmadura(2, "Armadura acolchada"),
        });

        const armaduras = await firstValueFrom(service.getArmaduras());

        expect(armaduras.map((item) => item.Id)).toEqual([2, 4]);
        expect(http.get).not.toHaveBeenCalled();
        expect(service.writes).toEqual([]);
    });

    it("getArmaduras usa GET /armaduras si RTDB esta vacio y no escribe la caché (la escribe el backend)", async () => {
        const http = {
            get: jasmine.createSpy().and.returnValue(of([
                rawArmadura(4, "Camisote de mallas"),
                rawArmadura(2, "Armadura acolchada"),
            ])),
        };
        const service = createService(http);
        service.snapshotFactory = () => snapshot(null, false);

        const armaduras = await firstValueFrom(service.getArmaduras());

        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/armaduras$/));
        expect(armaduras.map((item) => item.Id)).toEqual([2, 4]);
        expect(service.writes).toEqual([]);
    });

    it("normalizeArmadura conserva Bon_des null (sin límite) y lee el tipo de escudo y la velocidad", () => {
        const armadura = normalizeArmadura(crearRodelaApi());
        expect(armadura.Bon_des).toBeNull();
        expect(armadura.Tipo_escudo).toEqual({ Id: 1, Nombre: "Broquel" });
        expect(armadura.Peso_armadura).toBeNull();
        expect("Tipo_armadura" in armadura).toBeFalse();
        const cota = normalizeArmadura(crearArmaduraApi());
        expect(cota.Velocidad_30).toBe(20);
        expect(cota.Origen_descripcion).toBe("srd");
    });
});
