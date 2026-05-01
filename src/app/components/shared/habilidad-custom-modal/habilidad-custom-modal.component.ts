import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { HabilidadBasicaDetalle } from 'src/app/interfaces/habilidad';
import { HabilidadService } from 'src/app/services/habilidad.service';

@Component({
    selector: 'app-habilidad-custom-modal',
    templateUrl: './habilidad-custom-modal.component.html',
    styleUrls: ['./habilidad-custom-modal.component.sass'],
    standalone: false,
})
export class HabilidadCustomModalComponent implements OnChanges {
    @Input() abierto = false;
    @Input() modo: 'crear' | 'editar' = 'crear';
    @Input() habilidad: HabilidadBasicaDetalle | null = null;
    @Output() cerrado = new EventEmitter<void>();
    @Output() guardada = new EventEmitter<HabilidadBasicaDetalle>();

    guardando = false;

    readonly caracteristicas = [
        { Id: 1, Nombre: 'Fuerza' },
        { Id: 2, Nombre: 'Destreza' },
        { Id: 3, Nombre: 'Constitución' },
        { Id: 4, Nombre: 'Inteligencia' },
        { Id: 5, Nombre: 'Sabiduría' },
        { Id: 6, Nombre: 'Carisma' },
    ];

    readonly form = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
        id_caracteristica: [4, [Validators.required, Validators.min(1)]],
    });

    constructor(
        private fb: FormBuilder,
        private habilidadSvc: HabilidadService,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['abierto'] && this.abierto)
            this.hidratar();
        if (changes['habilidad'] && this.abierto)
            this.hidratar();
    }

    cerrar(): void {
        if (this.guardando)
            return;
        this.cerrado.emit();
    }

    async guardar(): Promise<void> {
        this.form.markAllAsTouched();
        if (this.form.invalid)
            return;

        this.guardando = true;
        try {
            const raw = this.form.getRawValue();
            const payload = {
                nombre: this.texto(raw.nombre),
                id_caracteristica: this.entero(raw.id_caracteristica, 4),
            };
            const response = this.modo === 'editar' && this.habilidad
                ? await this.habilidadSvc.actualizarHabilidadCustom(this.habilidad.Id_habilidad, payload)
                : await this.habilidadSvc.crearHabilidadCustom(payload);
            this.guardada.emit(response.habilidad);
        } catch (error: any) {
            await Swal.fire({
                icon: 'error',
                title: this.modo === 'editar' ? 'No se pudo actualizar la habilidad' : 'No se pudo crear la habilidad',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true,
            });
        } finally {
            this.guardando = false;
        }
    }

    private hidratar(): void {
        this.form.reset({
            nombre: this.modo === 'editar' ? this.habilidad?.Nombre ?? '' : '',
            id_caracteristica: this.modo === 'editar' && Number(this.habilidad?.Id_caracteristica) > 0
                ? Number(this.habilidad?.Id_caracteristica)
                : 4,
        });
    }

    private texto(value: unknown): string {
        return `${value ?? ''}`.trim();
    }

    private entero(value: unknown, fallback = 0): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
    }
}
