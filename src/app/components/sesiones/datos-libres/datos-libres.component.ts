import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom, take } from 'rxjs';
import { DeidadGeneroRef } from 'src/app/interfaces/deidad';
import { Personaje } from 'src/app/interfaces/personaje';
import { RegionDetalle } from 'src/app/interfaces/region';
import { DeidadService } from 'src/app/services/deidad.service';
import { PersonajeCamposLibresDto, PersonajeService } from 'src/app/services/personaje.service';
import { RegionService } from 'src/app/services/region.service';
import { normalizarTexto, toInt } from 'src/app/services/utils/normalizacion';

/** El límite del nombre en el contrato (`PATCH /personajes/{id}`). */
const MAXIMO_NOMBRE = 100;

/**
 * Los datos libres del personaje (roadmap de sesiones, fase 6; `PATCH /personajes/{id}`): el nombre, la personalidad,
 * la historia, la región y el género. Se cambian sin versión ni sesión (no salen en el historial). Solo manda lo que
 * cambia. La región y el género son prerrequisitos de algunas dotes y clases: si el cambio rompe uno, la API lo dice.
 */
@Component({
    selector: 'app-datos-libres',
    standalone: true,
    imports: [FormsModule, MatButtonModule],
    templateUrl: './datos-libres.component.html',
    styleUrls: ['../historial-sesiones/historial-sesiones.component.sass'],
})
export class DatosLibresComponent implements OnInit {
    @Input() pj!: Personaje;
    /** Tras guardar (la ficha se vuelve a leer) o al cancelar (`false`). */
    @Input() alTerminar: (guardado: boolean) => void = () => undefined;

    readonly maximoNombre = MAXIMO_NOMBRE;

    nombre = '';
    personalidad = '';
    historia = '';
    idRegion = 0;
    idGenero = 0;
    regiones: RegionDetalle[] = [];
    generos: DeidadGeneroRef[] = [];
    guardando = false;
    error = '';

    constructor(
        private personajeSvc: PersonajeService,
        private regionSvc: RegionService,
        private deidadSvc: DeidadService,
    ) { }

    ngOnInit(): void {
        this.nombre = `${this.pj?.Nombre ?? ''}`;
        this.personalidad = `${this.pj?.Personalidad ?? ''}`;
        this.historia = `${this.pj?.Contexto ?? ''}`;
        this.idRegion = toInt(this.pj?.Region?.Id);
        void this.cargarCatalogos();
    }

    private async cargarCatalogos(): Promise<void> {
        const [regiones, generos] = await Promise.all([
            firstValueFrom(this.regionSvc.getRegiones().pipe(take(1))).catch(() => [] as RegionDetalle[]),
            firstValueFrom(this.deidadSvc.getGeneros().pipe(take(1))).catch(() => [] as DeidadGeneroRef[]),
        ]);
        this.regiones = regiones ?? [];
        this.generos = generos ?? [];
        // La ficha trae el género por su nombre: su id, del catálogo.
        this.idGenero = toInt(this.generos.find((g) => normalizarTexto(g.Nombre) === normalizarTexto(this.pj?.Genero ?? ''))?.Id);
    }

    /** Solo lo que cambia. */
    private cambios(): PersonajeCamposLibresDto {
        const cambios: PersonajeCamposLibresDto = {};
        if (this.nombre.trim() !== `${this.pj?.Nombre ?? ''}`.trim())
            cambios.nombre = this.nombre.trim();
        if (this.personalidad.trim() !== `${this.pj?.Personalidad ?? ''}`.trim())
            cambios.descripcionPersonalidad = this.personalidad.trim() || null;
        if (this.historia.trim() !== `${this.pj?.Contexto ?? ''}`.trim())
            cambios.descripcionHistoria = this.historia.trim() || null;
        if (this.idRegion !== toInt(this.pj?.Region?.Id))
            cambios.idRegion = this.idRegion;
        const generoAntes = toInt(this.generos.find((g) => normalizarTexto(g.Nombre) === normalizarTexto(this.pj?.Genero ?? ''))?.Id);
        if (this.idGenero > 0 && this.idGenero !== generoAntes)
            cambios.idGenero = this.idGenero;
        return cambios;
    }

    get hayCambios(): boolean {
        return Object.keys(this.cambios()).length > 0;
    }

    async guardar(): Promise<void> {
        if (this.guardando || !this.hayCambios)
            return;
        if (!this.nombre.trim()) {
            this.error = 'El nombre no puede quedar vacío.';
            return;
        }
        this.guardando = true;
        this.error = '';
        try {
            await this.personajeSvc.cambiarDatosLibres(toInt(this.pj?.Id), this.cambios());
            this.alTerminar(true);
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se han podido guardar los datos.';
        } finally {
            this.guardando = false;
        }
    }
}
