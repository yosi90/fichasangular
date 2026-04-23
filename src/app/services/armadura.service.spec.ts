import { firstValueFrom, of } from "rxjs";
import { ArmaduraDetalle } from "../interfaces/armadura";
import { ArmaduraService } from "./armadura.service";

describe("ArmaduraService", () => {
    class TestArmaduraService extends ArmaduraService {
        snapshotFactory: () => any = () => snapshot(null, false);
        writes: ArmaduraDetalle[] = [];

        protected override watchArmadurasPath(onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.snapshotFactory());
            return () => undefined;
        }

        protected override writeArmaduraCache(armadura: ArmaduraDetalle): Promise<void> {
            this.writes.push(armadura);
            return Promise.resolve();
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
            Tipo_armadura: { Id: 1, Nombre: "Ligera" },
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

    it("getArmaduras usa GET /armaduras y refresca cache si RTDB esta vacio", async () => {
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
        expect(service.writes.map((item) => item.Id)).toEqual([2, 4]);
    });
});
