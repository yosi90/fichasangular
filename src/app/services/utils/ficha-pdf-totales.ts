import { PDFDict, PDFForm, PDFHexString, PDFName, PDFRawStream, PDFString, decodePDFRawStream } from 'pdf-lib';
import { Personaje } from 'src/app/interfaces/personaje';
import { caDeSiempreDeRaciales } from 'src/app/services/utils/habilidades-raciales';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { totalHabilidad, totalesPersonaje } from 'src/app/services/utils/personaje-totales';

/** Cada salvación por el campo de la parte de clase que suma la plantilla (`fort_clase`). */
const SALVACION_POR_CAMPO: ReadonlyArray<[string, 'fortaleza' | 'reflejos' | 'voluntad']> = [
    ['fort_clase', 'fortaleza'],
    ['ref_clase', 'reflejos'],
    ['vol_clase', 'voluntad'],
];

const ENTRE_COMILLAS = /"([^"]+)"/g;
const FILA_HABILIDAD = /^rangos(\d+)$/;
const TOTAL_CUSTOM = /^total_custom(\d+)$/;

/** El JavaScript de cálculo (`/AA /C /JS`) de un campo de la plantilla, o `null` si no lo tiene. */
function javascriptDeCalculo(campo: { acroField: { dict: PDFDict; }; }): string | null {
    const acciones = campo.acroField.dict.lookup(PDFName.of('AA'));
    if (!(acciones instanceof PDFDict))
        return null;
    const calculo = acciones.lookup(PDFName.of('C'));
    if (!(calculo instanceof PDFDict))
        return null;
    const js = calculo.lookup(PDFName.of('JS'));
    if (js instanceof PDFString || js instanceof PDFHexString)
        return js.decodeText();
    if (js instanceof PDFRawStream)
        return String.fromCharCode(...decodePDFRawStream(js).decode());
    return null;
}

/**
 * La CA de toque y la desprevenida de la hoja sin la `defensa` de la API (la creación, antes de guardar): la de toque sin
 * la armadura natural ni lo de sus rasgos que no cuenta de toque, y la desprevenida sin la Destreza positiva ni lo de sus
 * rasgos que se pierde desprevenido (la esquiva del svirfneblin; Manual del jugador, pág. 136), por el tipo de cada
 * bonificador. Con la ficha de la API, `camposPdfEquipo` pone encima las de su `defensa`.
 */
export function caToqueYDesprevenidaSinDefensa(pj: Personaje): { toque: number; desprevenido: number; } {
    const ca = toNumber(pj.Ca);
    const deRasgos = caDeSiempreDeRaciales(pj.Raciales);
    return {
        toque: ca - toNumber(pj.Armadura_natural) - deRasgos.sinToque,
        desprevenido: ca - Math.max(0, toNumber(pj.ModDestreza)) - deRasgos.sinDesprevenido,
    };
}

/**
 * Lo que suma cada campo calculado de la plantilla: su JavaScript (`AFSimple_Calculate("SUM", new Array ("mod_sab",
 * "rangos5", "varios5"))`), por el nombre de los campos que cita.
 */
export function sumasDeLaPlantilla(form: PDFForm): Record<string, string[]> {
    const sumas: Record<string, string[]> = {};
    form.getFields().forEach((campo) => {
        const js = javascriptDeCalculo(campo);
        if (!js)
            return;
        const sumandos = Array.from(js.matchAll(ENTRE_COMILLAS), (m) => m[1]).filter((nombre) => nombre !== 'SUM');
        if (sumandos.length > 0)
            sumas[campo.getName()] = sumandos;
    });
    return sumas;
}

/**
 * Los totales de la ficha en los campos que la plantilla calcula con JavaScript ([sumas]): los visores que no lo
 * ejecutan (los del móvil, las vistas previas) los dejaban en blanco. Se sabe de qué es cada uno por lo que suma
 * (`fort_clase`: la Fortaleza; `mod_varios_iniciativa`: la iniciativa; `rangos5`: la habilidad 6). Los de las dos filas
 * de habilidades custom (`total_custom1`) suman en la plantilla campos que no existen (`rangos44`): van por su nombre, con
 * la custom de esa fila. Sin el total (una habilidad que la ficha no trae, la presa sin ataque base), el campo no se toca.
 * Como `HojaDePersonaje.totales` de 3.5 Companion.
 */
export function camposPdfTotales(pj: Personaje, sumas: Record<string, string[]>): Record<string, string> {
    const totales = totalesPersonaje(pj);
    const habilidades = pj?.Habilidades ?? [];
    const customs = habilidades.filter((h) => h?.Custom);
    const campos: Record<string, string> = {};

    Object.entries(sumas).forEach(([campo, sumandos]) => {
        let total: number | null | undefined = null;
        const custom = TOTAL_CUSTOM.exec(campo);
        const salvacion = SALVACION_POR_CAMPO.find(([parteClase]) => sumandos.includes(parteClase));
        const fila = sumandos.map((s) => FILA_HABILIDAD.exec(s)).find((m) => m !== null);
        if (custom) {
            const habilidad = customs[Number(custom[1]) - 1];
            total = habilidad ? totalHabilidad(habilidad) : null;
        } else if (sumandos.includes('mod_varios_iniciativa')) {
            total = totales.iniciativa?.total;
        } else if (sumandos.includes('mod_varios_presa')) {
            total = totales.presa?.total;
        } else if (salvacion) {
            total = totales.salvaciones?.[salvacion[1]]?.total;
        } else if (fila) {
            const habilidad = habilidades.find((h) => !h?.Custom && Number(h?.Id) === Number(fila[1]) + 1);
            total = habilidad ? totalHabilidad(habilidad) : null;
        }
        if (total !== null && total !== undefined)
            campos[campo] = `${total}`;
    });
    return campos;
}
