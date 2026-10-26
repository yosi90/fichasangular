import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha } from 'src/app/components/detalles/ficha';
import { Rasgo } from 'src/app/interfaces/rasgo';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { mayusculaInicial } from 'src/app/services/utils/formato-registros';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

@Component({
    selector: 'app-detalles-tipo-criatura',
    templateUrl: './detalles-tipo-criatura.component.html',
    standalone: false
})
export class DetallesTipoCriaturaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    private tipoData!: TipoCriatura;

    // Lo que pinta la ficha, calculado una vez al recibir el tipo.
    /** Dados de golpe, progresiones de ataque base y salvaciones, puntos de habilidad, tesoro e Inteligencia máxima. */
    datos: DatoFicha[] = [];
    /** Lo que necesita la criatura y cómo le afecta el combate (comer, respirar, críticos…). */
    naturaleza: DatoFicha[] = [];
    rasgos: Rasgo[] = [];

    @Input()
    set tipo(value: TipoCriatura) {
        this.tipoData = value;
        // Los puntos por DG del tipo, de la API; una caché anterior a la versión 3 solo trae su id (1 → 2, 2 → 4…).
        const puntos = toNumber(value?.Puntos_habilidad) || toNumber(value?.Id_puntos_habilidad) * 2;
        this.datos = [
            { etiqueta: 'Dados de golpe', valor: this.textoDado(value?.Tipo_dado) },
            { etiqueta: 'Ataque base', valor: value ? this.progresionAtaque(value.Id_ataque) : null },
            { etiqueta: 'Fortaleza', valor: value ? this.progresionSalvacion(value.Id_fortaleza) : null },
            { etiqueta: 'Reflejos', valor: value ? this.progresionSalvacion(value.Id_reflejos) : null },
            { etiqueta: 'Voluntad', valor: value ? this.progresionSalvacion(value.Id_voluntad) : null },
            { etiqueta: 'Puntos de habilidad por DG', valor: value ? puntos : null, detalle: '+ mod. de Int' },
            { etiqueta: 'Tesoro', valor: mayusculaInicial(value?.Tesoro) },
            // -1: sin límite. Los demás, la Inteligencia más alta que puede tener (2 los animales, 0 los cienos).
            {
                etiqueta: 'Inteligencia máxima',
                valor: value && toNumber(value.Limite_inteligencia) >= 0 ? toNumber(value.Limite_inteligencia) : null,
            },
        ];
        this.naturaleza = value ? [
            { etiqueta: 'Necesita comer', valor: !!value.Come },
            { etiqueta: 'Necesita respirar', valor: !!value.Respira },
            { etiqueta: 'Necesita dormir', valor: !!value.Duerme },
            { etiqueta: 'Recibe críticos', valor: !!value.Recibe_criticos },
            { etiqueta: 'Puede ser flanqueado', valor: !!value.Puede_ser_flanqueado },
            { etiqueta: 'Pierde la Constitución', valor: value.Pierde_constitucion ? true : null },
        ] : [];
        this.rasgos = (value?.Rasgos ?? []).filter((rasgo) => tieneTextoVisible(rasgo?.Nombre));
    }

    get tipo(): TipoCriatura {
        return this.tipoData;
    }

    @Output() rasgoDetalles: EventEmitter<Rasgo> = new EventEmitter<Rasgo>();

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual(this.tipo?.Manual);
    }

    verDetallesRasgo(value: Rasgo) {
        this.rasgoDetalles.emit(value);
    }

    /** «d8»: la caché da las caras del dado de golpe. */
    private textoDado(dado: unknown): string | null {
        const caras = toNumber(dado);
        if (caras > 0)
            return `d${caras}`;
        return tieneTextoVisible(`${dado ?? ''}`) ? `${dado}` : null;
    }

    /** La progresión del ataque base, con el que da a nivel 20. */
    private progresionAtaque(id: number): string {
        return id === 1 ? 'Alta (+20)' : id === 2 ? 'Media (+15)' : 'Baja (+10)';
    }

    /** La progresión de una salvación, con la que da a nivel 20. */
    private progresionSalvacion(id: number): string {
        return id === 1 ? 'Alta (+12)' : 'Baja (+6)';
    }
}
