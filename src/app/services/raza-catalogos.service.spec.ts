import { firstValueFrom, of } from "rxjs";
import Swal from "sweetalert2";
import { RazaCatalogItem } from "../interfaces/raza-catalogos";
import { RazaCatalogosService } from "./raza-catalogos.service";

describe("RazaCatalogosService", () => {
    class TestRazaCatalogosService extends RazaCatalogosService {
        snapshotFactory: (path: string) => any = () => snapshot(null, false);
        writes: Array<{ path: string; items: RazaCatalogItem[]; }> = [];

        protected override watchCatalogPath(path: string, onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.snapshotFactory(path));
            return () => undefined;
        }

        protected override writeCatalogPath(path: string, items: RazaCatalogItem[]): Promise<void> {
            this.writes.push({ path, items });
            return Promise.resolve();
        }
    }

    function snapshot(value: any, exists = true): any {
        return {
            exists: () => exists,
            val: () => value,
        };
    }

    function createService(http: any, reportSvc = jasmine.createSpyObj('CacheCatalogMissReportService', ['reportEmptyCacheFallback'])): TestRazaCatalogosService {
        reportSvc.reportEmptyCacheFallback.and.resolveTo();
        return new TestRazaCatalogosService({} as any, http as any, { run: (fn: () => any) => fn() } as any, reportSvc as any);
    }

    it("usa RTDB para maniobrabilidades cuando la cache existe", async () => {
        const http = { get: jasmine.createSpy() };
        const service = createService(http);
        service.snapshotFactory = () => snapshot({
            3: { Id: 3, Nombre: "Regular", Giro: "45 grados" },
            0: { Id: 0, Nombre: "No vuela" },
        });

        const items = await firstValueFrom(service.getManiobrabilidades());

        expect(items.map((item) => item.Id)).toEqual([0, 3]);
        expect((items[1] as any).Giro).toBe("45 grados");
        expect(http.get).not.toHaveBeenCalled();
        expect(service.writes).toEqual([]);
    });

    it("usa REST si Maniobrabilidades existe pero no trae detalle suficiente", async () => {
        const http = {
            get: jasmine.createSpy().and.returnValue(of([
                { Id: 3, Nombre: "Regular", Giro: "45 grados" },
                { Id: 0, Nombre: "No vuela" },
            ])),
        };
        const reportSvc = jasmine.createSpyObj('CacheCatalogMissReportService', ['reportEmptyCacheFallback']);
        const service = createService(http, reportSvc);
        service.snapshotFactory = () => snapshot({
            3: { Id: 3, Nombre: "Regular" },
            0: { Id: 0, Nombre: "No vuela" },
        });

        const items = await firstValueFrom(service.getManiobrabilidades());

        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/maniobrabilidades$/));
        expect(reportSvc.reportEmptyCacheFallback).toHaveBeenCalledWith('maniobrabilidades');
        expect((items.find((item) => item.Id === 3) as any).Giro).toBe("45 grados");
        expect(service.writes).toEqual([]);
    });

    it("usa REST y reporta miss si Maniobrabilidades esta vacio", async () => {
        const http = {
            get: jasmine.createSpy().and.returnValue(of([
                { Id: 3, Nombre: "Regular", Giro: "45 grados" },
                { Id: 0, Nombre: "No vuela" },
            ])),
        };
        const reportSvc = jasmine.createSpyObj('CacheCatalogMissReportService', ['reportEmptyCacheFallback']);
        const service = createService(http, reportSvc);
        service.snapshotFactory = () => snapshot(null, false);

        const items = await firstValueFrom(service.getManiobrabilidades());

        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/maniobrabilidades$/));
        expect(reportSvc.reportEmptyCacheFallback).toHaveBeenCalledWith('maniobrabilidades');
        expect(items).toEqual([
            { Id: 0, Nombre: "No vuela" },
            { Id: 3, Nombre: "Regular", Giro: "45 grados" } as any,
        ]);
        expect(service.writes).toEqual([]);
    });

    it("usa REST y reporta miss si TiposDado esta vacio", async () => {
        const http = {
            get: jasmine.createSpy().and.returnValue(of([
                { Id: 8, Nombre: "D8" },
                { Id_tipo_dado: 4, Nombre: "D4" },
            ])),
        };
        const reportSvc = jasmine.createSpyObj('CacheCatalogMissReportService', ['reportEmptyCacheFallback']);
        const service = createService(http, reportSvc);
        service.snapshotFactory = () => snapshot({}, true);

        const items = await firstValueFrom(service.getTiposDado());

        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/tipos-dado$/));
        expect(reportSvc.reportEmptyCacheFallback).toHaveBeenCalledWith('tipos_dado');
        expect(items).toEqual([
            { Id: 4, Nombre: "D4" },
            { Id: 8, Nombre: "D8" },
        ]);
        expect(service.writes).toEqual([]);
    });

    it("usa RTDB para actitudes cuando la cache existe", async () => {
        const http = { get: jasmine.createSpy() };
        const service = createService(http);
        service.snapshotFactory = () => snapshot({
            3: { Id: 3, Nombre: "Caotica" },
            1: { Id: 1, Nombre: "Legal" },
        });

        const items = await firstValueFrom(service.getActitudes());

        expect(items).toEqual([
            { Id: 3, Nombre: "Caotica" },
            { Id: 1, Nombre: "Legal" },
        ]);
        expect(http.get).not.toHaveBeenCalled();
        expect(service.writes).toEqual([]);
    });

    it("usa REST y refresca RTDB si Actitudes esta vacio", async () => {
        const http = {
            get: jasmine.createSpy().and.returnValue(of([
                { id_actitud: 5, nombre: "Maligna" },
                { Id_actitud: 4, Nombre: "Buena" },
            ])),
        };
        const service = createService(http);
        service.snapshotFactory = () => snapshot(null, false);

        const items = await firstValueFrom(service.getActitudes());

        expect(http.get).toHaveBeenCalledWith(jasmine.stringMatching(/actitudes$/));
        expect(items).toEqual([
            { Id: 4, Nombre: "Buena" },
            { Id: 5, Nombre: "Maligna" },
        ]);
        expect(service.writes).toEqual([]);
    });

    it("RenovarManiobrabilidades escribe el nodo completo desde REST", async () => {
        spyOn(Swal, "fire");
        const http = {
            get: jasmine.createSpy().and.returnValue(of([
                { Id: 3, Nombre: "Regular" },
                { Id: 0, Nombre: "No vuela" },
            ])),
        };
        const service = createService(http);

        const ok = await service.RenovarManiobrabilidades();

        expect(ok).toBeTrue();
        expect(service.writes).toEqual([
            {
                path: "Maniobrabilidades",
                items: [
                    { Id: 0, Nombre: "No vuela" },
                    { Id: 3, Nombre: "Regular" },
                ],
            },
        ]);
    });

    it("RenovarTiposDado escribe el nodo completo desde REST", async () => {
        spyOn(Swal, "fire");
        const http = {
            get: jasmine.createSpy().and.returnValue(of([
                { Id_tipo_dado: 4, Nombre: "D4" },
            ])),
        };
        const service = createService(http);

        const ok = await service.RenovarTiposDado();

        expect(ok).toBeTrue();
        expect(service.writes).toEqual([
            {
                path: "TiposDado",
                items: [{ Id: 4, Nombre: "D4" }],
            },
        ]);
    });
});
