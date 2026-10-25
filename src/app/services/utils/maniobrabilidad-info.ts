import { InformacionBasicosModalSection } from 'src/app/components/nuevo-personaje/informacion-basicos-modal/informacion-basicos-modal.component';
import { normalizarTexto, toNumberOrNull } from 'src/app/services/utils/normalizacion';

export interface ManiobrabilidadLike {
    Id?: number;
    Nombre?: string;
    Velocidad_avance?: string;
    Flotar?: number | boolean | string;
    Volar_atras?: number | boolean | string;
    Contramarcha?: number | boolean | string;
    Giro?: string;
    Rotacion?: string;
    Giro_max?: string;
    Angulo_ascenso?: string;
    Velocidad_ascenso?: string;
    Angulo_descenso?: string;
    Descenso_ascenso?: number | boolean | string;
}

export function buildManiobrabilidadInfoSecciones(
    maniobrabilidad: ManiobrabilidadLike | null | undefined
): InformacionBasicosModalSection[] {
    if (!maniobrabilidad || !tieneManiobrabilidadVisible(maniobrabilidad)) {
        return [{
            lineas: ['Selecciona una maniobrabilidad para ver sus reglas.'],
        }];
    }

    return [
        {
            titulo: texto(maniobrabilidad.Nombre) || 'Maniobrabilidad',
            items: [
                `Velocidad de avance: ${valorCatalogoTexto(maniobrabilidad, 'Velocidad_avance')}.`,
                `Flotar: ${formatearBooleanoCatalogo(maniobrabilidad.Flotar)}.`,
                `Volar atras: ${formatearBooleanoCatalogo(maniobrabilidad.Volar_atras)}.`,
                `Contramarcha: ${formatearContramarcha(maniobrabilidad.Contramarcha)}.`,
                `Giro: ${valorCatalogoTexto(maniobrabilidad, 'Giro')}.`,
                `Rotacion: ${valorCatalogoTexto(maniobrabilidad, 'Rotacion')}.`,
                `Giro maximo: ${valorCatalogoTexto(maniobrabilidad, 'Giro_max')}.`,
                `Angulo de ascenso: ${valorCatalogoTexto(maniobrabilidad, 'Angulo_ascenso')}.`,
                `Velocidad de ascenso: ${valorCatalogoTexto(maniobrabilidad, 'Velocidad_ascenso')}.`,
                `Angulo de descenso: ${valorCatalogoTexto(maniobrabilidad, 'Angulo_descenso')}.`,
                `Descenso y ascenso: ${formatearPies(maniobrabilidad.Descenso_ascenso)}.`,
            ],
            lineas: [
                'Estos son los rasgos completos de la maniobrabilidad escogida segun el catalogo.',
            ],
        },
    ];
}

export function tieneManiobrabilidadVisible(maniobrabilidad: ManiobrabilidadLike | null | undefined): boolean {
    const nombre = normalizarTexto(maniobrabilidad?.Nombre, true);
    if (!nombre)
        return false;
    const limpio = nombre.replace(/[.]/g, '');
    return limpio !== 'no especifica'
        && limpio !== 'no se especifica'
        && limpio !== 'no aplica'
        && limpio !== 'no modifica'
        && limpio !== 'no vuela'
        && limpio !== '-';
}

function formatearBooleanoCatalogo(value: any): string {
    if (value === true)
        return 'Si';
    if (value === false)
        return 'No';
    const numero = Number(value);
    if (Number.isFinite(numero))
        return numero > 0 ? 'Si' : 'No';
    const normalizado = normalizarTexto(value, true);
    if (['si', 'true', '1'].includes(normalizado))
        return 'Si';
    if (['no', 'false', '0'].includes(normalizado))
        return 'No';
    return texto(value) || 'No especifica';
}

/**
 * La marcha atrás (Guía del DM, «Movimiento aéreo táctico»; contrato en `docs/publica/endpoints/catalogos.md`): -1, no
 * puede («No»); 0, libre («Libre»); mayor que 0, los pies que cuesta («5'»).
 */
export function formatearContramarcha(value: unknown): string {
    const pies = numeroDeCatalogo(value);
    if (pies === null)
        return 'No especifica';
    if (pies < 0)
        return 'No';
    return pies === 0 ? 'Libre' : `${pies}'`;
}

/** Los pies que tiene que avanzar entre descender y ascender (`Descenso_ascenso`): «20'», y «0'» si ninguno. */
export function formatearPies(value: unknown): string {
    const pies = numeroDeCatalogo(value);
    return pies === null ? 'No especifica' : `${pies}'`;
}

function numeroDeCatalogo(value: unknown): number | null {
    if (typeof value === 'boolean')
        return null;
    return toNumberOrNull(value);
}

function valorCatalogoTexto(item: any, key: string): string {
    const value = item?.[key];
    const valueText = texto(value);
    return valueText.length > 0 ? valueText : 'No especifica';
}

function texto(value: any): string {
    return `${value ?? ''}`.trim();
}
