import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { AnnotationFlags, PDFDocument, PDFForm } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Personaje, PersonajeNivelLanzadorResumen, PersonajeTipoLanzamiento } from '../interfaces/personaje';
import { Caracteristica } from '../interfaces/caracteristica';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoDetalle } from '../interfaces/monstruo';
import { normalizarTexto, toArray, toBoolean, toInt, toNumber } from 'src/app/services/utils/normalizacion';
import { experienciaParaNivel } from './utils/experiencia-nivel';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import { sumarPartes, totalesPersonaje } from 'src/app/services/utils/personaje-totales';
import { extraHabilidadElegido, habilidadConExtraPorElegir } from 'src/app/services/utils/habilidad-extra-visible';
import { esNombreComodin } from 'src/app/services/utils/comodin';
import {
    SIN_CARACTERISTICA,
    caracteristicaPorId,
    modificadorParaSumar,
    textoModificadorCaracteristica,
    textoValorCaracteristica,
} from 'src/app/services/utils/caracteristicas';
import { camposPdfEquipo } from './utils/ficha-pdf-equipo';
import { camposPdfTotales, caToqueYDesprevenidaSinDefensa, sumasDeLaPlantilla } from './utils/ficha-pdf-totales';
import { tamanoQueCuenta } from './utils/tamano-efectivo';

/** Cada característica y su campo en la hoja (`fue`, y su modificador `mod_fue`): la del personaje, el familiar y el compañero. */
const CAMPOS_CARACTERISTICAS_PDF: ReadonlyArray<[Caracteristica, string]> = [
    ['Fuerza', 'fue'], ['Destreza', 'des'], ['Constitucion', 'con'],
    ['Inteligencia', 'int'], ['Sabiduria', 'sab'], ['Carisma', 'car'],
];

/**
 * Los huecos de la hoja del personaje (`assets/pdf/Ficha.pdf`): 9 idiomas y 2 filas de habilidades custom, que son las
 * filas 44 y 45 de la tabla (su casilla «de clase» es `clasea44` y `clasea45`).
 */
const IDIOMAS_EN_HOJA = 9;
const CUSTOM_EN_HOJA = 2;
const PRIMERA_FILA_CUSTOM = 44;

@Injectable({
    providedIn: 'root'
})
export class FichaPersonajeService {
    private readonly auth: Auth | null;

    constructor(auth?: Auth | null) {
        this.auth = auth ?? this.tryInjectAuth();
    }

    async generarPDF(pj: Personaje) {
        const pdfTemplateBytes = await fetch('../../assets/pdf/Ficha.pdf').then((res) => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfTemplateBytes);
        const form = pdfDoc.getForm();
        const jugadorFicha = this.resolverNombreJugador(pj);
        const totales = totalesPersonaje(pj);
        if (pj.Oficial === false)
            this.mostrarAvisoNoOficial(form);
        form.getTextField('nombre').setText(pj.Nombre);
        this.trySetText(form, 'jugador', jugadorFicha);
        form.getTextField('clase').setText(`${pj.Clases ?? ''}`.replace(/[()]/g, ''));
        let raza = pj.Raza.Nombre;
        if (pj.Plantillas)
            pj.Plantillas.forEach(p => {
                raza += ` ${p.Nombre}`;
            });
        form.getTextField('raza').setText(raza);
        form.getTextField('alineamiento').setText(pj.Alineamiento);
        if (pj.Deidad && pj.Deidad.length > 0)
            form.getTextField('deidad').setText(pj.Deidad);
        // El tamaño que cuenta (el de la raza movido por sus aptitudes, `tamano` de la ficha); sin él, el de la raza.
        const tamano = tamanoQueCuenta(pj);
        form.getTextField('tamaño').setText(tamano?.nombre ?? '');
        form.getTextField('edad').setText(pj.Edad.toString());
        form.getTextField('sexo').setText(pj.Genero);
        form.getTextField('altura').setText(pj.Altura.toString());
        form.getTextField('peso').setText(pj.Peso.toString());
        form.getTextField('campaña').setText(pj.Campana);
        this.rellenarCaracteristicasPersonaje(form, pj);
        form.getTextField('mod_varios_iniciativa').setText(`${sumarPartes(totales.iniciativa, 'varios')}`);
        form.getTextField('mod_tamaño_presa').setText(`${tamano?.modificadorPresa ?? 0}`);
        form.getTextField('mod_varios_presa').setText(`${sumarPartes(totales.presa, 'varios')}`);
        form.getTextField('ca').setText(pj.Ca.toString());
        form.getTextField('ca_armadura').setText('0');
        form.getTextField('ca_escudo').setText('0');
        form.getTextField('mod_tamaño_ca').setText(`${tamano?.modificador ?? 0}`);
        form.getTextField('armadura_natural').setText(pj.Armadura_natural.toString());
        form.getTextField('mod_desvio').setText(pj.Ca_desvio.toString());
        form.getTextField('mod_varios_ca').setText(pj.Ca_varios.toString());
        const { toque, desprevenido } = caToqueYDesprevenidaSinDefensa(pj);
        form.getTextField('ca_toque').setText(`${toque}`);
        form.getTextField('ca_desprevenido').setText(`${desprevenido}`);
        form.getTextField('pg').setText(pj.Vida.toString());
        form.getTextField('fort_clase').setText(`${sumarPartes(totales.salvaciones.fortaleza, 'clase')}`);
        form.getTextField('mod_magico_fortaleza').setText('0');
        form.getTextField('mod_varios_fortaleza').setText(`${sumarPartes(totales.salvaciones.fortaleza, 'varios')}`);
        form.getTextField('ref_clase').setText(`${sumarPartes(totales.salvaciones.reflejos, 'clase')}`);
        form.getTextField('mod_magico_reflejos').setText('0');
        form.getTextField('mod_varios_reflejos').setText(`${sumarPartes(totales.salvaciones.reflejos, 'varios')}`);
        form.getTextField('vol_clase').setText(`${sumarPartes(totales.salvaciones.voluntad, 'clase')}`);
        form.getTextField('mod_magico_voluntad').setText('0');
        form.getTextField('mod_varios_voluntad').setText(`${sumarPartes(totales.salvaciones.voluntad, 'varios')}`);
        var notas = `Personalidad:\r\n${pj.Personalidad}\r\n\r\nContexto:\r\n${pj.Contexto}`;
        notas += this.formatearNotasNivelesLanzador(pj);
        if (pj.Rds && pj.Rds.length > 0) {
            if (pj.Rds[0].Modificador.length < 25)
                form.getTextField('rd').setText(`${pj.Rds[0].Modificador} [${pj.Rds[0].Origen}]`);
            else
                form.getTextField('rd').setText("Revisar en notas");
            notas += "\r\n\r\nReducción de daño: ";
            pj.Rds.forEach(rd => {
                notas += `\r\n${rd.Modificador} [${rd.Origen}]`;
            });
        }
        if (pj.Rcs && pj.Rcs.length > 0) {
            if (pj.Rcs[0].Modificador.length < 18)
                form.getTextField('rc').setText(`${pj.Rcs[0].Modificador} [${pj.Rcs[0].Origen}]`);
            else
                form.getTextField('rc').setText("Revisar en notas");
            notas += "\r\n\r\nResistencia a conjuros: ";
            pj.Rcs.forEach(rc => {
                notas += `\r\n${rc.Modificador} [${rc.Origen}]`;
            });
        }
        if (pj.Res && pj.Res.length > 0) {
            notas += "\r\n\r\nResistencia a la energía:";
            pj.Res.forEach(re => {
                notas += `\r\n${re.Modificador} [${re.Origen}]`;
            });
        }
        form.getTextField('mod_ataque_base').setText(pj.Ataque_base);
        if (pj.Ataque_base.includes('/'))
            form.getTextField('ataque_base').setText(pj.Ataque_base.substring(0, pj.Ataque_base.indexOf('/')));
        else
            form.getTextField('ataque_base').setText(pj.Ataque_base.toString());
        form.getTextField('velocidad').setText(pj.Correr.toString());
        if (pj.Volar > 0)
            notas += `\r\n\r\nVolar: ${pj.Volar} pies`;
        if (pj.Nadar > 0)
            notas += `\r\n\r\nNadar: ${pj.Nadar} pies`;
        if (pj.Trepar > 0)
            notas += `\r\n\r\nTrepar: ${pj.Trepar} pies`;
        if (pj.Excavar > 0)
            notas += `\r\n\r\nExcavar: ${pj.Excavar} pies`;
        const self = this;
        form.getTextField('rangos_max').setText((pj.NEP + 3).toString());
        form.getTextField('rangos_min').setText(((pj.NEP + 3) / 2).toString());
        if (pj.Habilidades)
            notas += Rellenar_habilidades();
        form.getTextField('carga_ligera').setText(pj.Capacidad_carga.Ligera.toString());
        form.getTextField('carga_media').setText(pj.Capacidad_carga.Media.toString());
        form.getTextField('carga_pesada').setText(pj.Capacidad_carga.Pesada.toString());
        form.getTextField('levantar_cabeza').setText(pj.Capacidad_carga.Pesada.toString());
        form.getTextField('levantar_suelo').setText((pj.Capacidad_carga.Pesada * 2).toString());
        form.getTextField('empujar_arrastrar').setText((pj.Capacidad_carga.Pesada * 5).toString());
        // Los que no caben, todos a las notas, con su título.
        (pj.Idiomas ?? []).forEach((i, indice) => {
            if (indice < IDIOMAS_EN_HOJA)
                form.getTextField(`idioma${indice + 1}`).setText(`${i.Nombre}`);
            else if (indice === IDIOMAS_EN_HOJA)
                notas += `\r\n\r\nIdiomas que no cabían: \r\n - ${i.Nombre}`;
            else
                notas += `\r\n - ${i.Nombre}`;
        });
        form.getTextField('monedas_cobre').setText("0");
        form.getTextField('monedas_plata').setText("0");
        form.getTextField('monedas_oro').setText('0');
        form.getTextField('monedas_platino').setText("0");
        let contador = 1;
        if (pj.Dotes)
            pj.Dotes.forEach(d => {
                if (contador <= 12) {
                    form.getTextField(`dote${contador}`).setText(d.Nombre);
                    form.getTextField(`pag_dote${contador}`).setText(d.Pagina.toString());
                    form.getTextField(`desc_dote${contador}`).setText(d.Beneficio);
                } else if (contador == 13)
                    notas += `\r\n\r\nDotes que no cabían: \r\n - ${d.Nombre} - Pág ${d.Pagina}\r\n${d.Beneficio}`;
                else
                    notas += `\r\n\r\n - ${d.Nombre} - Pág ${d.Pagina}\r\n${d.Beneficio}`;
                contador++;
            });
        const escuelaNombre = `${pj?.Escuela_especialista?.Nombre ?? ''}`.trim();
        const escuelaCalificativo = `${pj?.Escuela_especialista?.Calificativo ?? ''}`.trim();
        const disciplinaNombre = `${pj?.Disciplina_especialista?.Nombre ?? ''}`.trim();
        const disciplinaCalificativo = `${pj?.Disciplina_especialista?.Calificativo ?? ''}`.trim();
        const tieneEspecialidadArcana = !esNombreComodin(pj?.Escuela_especialista, 'cualquiera')
            && this.esEspecialidadValida(escuelaNombre, escuelaCalificativo);
        const tieneEspecialidadPsionica = this.esEspecialidadValida(disciplinaNombre, disciplinaCalificativo);

        if (tieneEspecialidadArcana) {
            this.trySetText(form, 'escuela1', `${escuelaNombre}, eres un ${escuelaCalificativo}`);
            contador = 1;
            (pj.Escuelas_prohibidas ?? []).forEach(e => {
                const escuela = typeof e === 'string'
                    ? `${e}`.trim()
                    : `${e?.Nombre ?? ''}`.trim();
                if (escuela.length < 1)
                    return;
                this.trySetText(form, `escuela_pro${contador}`, escuela);
                contador++;
            });
        }
        if (tieneEspecialidadPsionica) {
            this.trySetText(
                form,
                `${tieneEspecialidadArcana ? 'escuela2' : 'escuela1'}`,
                `${disciplinaNombre}, eres un ${disciplinaCalificativo}`
            );
            this.trySetText(form, 'disciplina_pro', `${pj?.Disciplina_prohibida ?? ''}`);
        }

        let racialesCont = 1;
        this.obtenerRacialesParaFicha(pj).forEach((racial) => {
            const etiqueta = racial.origen.length > 0 ? `${racial.nombre} (${racial.origen})` : racial.nombre;
            if (racialesCont <= 10) {
                this.trySetText(form, `racial${racialesCont}`, etiqueta);
            } else if (racialesCont === 11) {
                notas += `\r\n\r\nRaciales que no cabian: \r\n - ${etiqueta}`;
            } else {
                notas += `\r\n - ${etiqueta}`;
            }
            racialesCont++;
        });

        const experiencia = Math.max(0, toInt(pj?.Experiencia));
        const ajusteNivel = this.getAjusteNivelParaFicha(pj);
        const nep = Math.max(0, toInt(pj?.NEP));
        this.trySetText(form, 'experiencia', `${experiencia}`);
        this.trySetText(form, 'exp_sig_nivel', `${this.calcularExpSiguienteNivel(pj, ajusteNivel)}`);
        this.trySetText(form, 'ajuste_nivel', `${ajusteNivel}`);
        this.trySetText(form, 'nep', `${nep}`);

        if (pj?.Ataque_base?.trim().length > 0)
            this.trySetText(form, 'mod_ataque_base', `${pj.Ataque_base}`);
        this.trySetText(form, 'fallo_arcano', '0');

        // El equipo, la defensa y el dinero de la ficha (familia 1 de objetos), encima de lo de siempre.
        Object.entries(camposPdfEquipo(pj)).forEach(([campo, valor]) => this.trySetText(form, campo, valor));
        // Los totales que la plantilla calcula con JavaScript, para los visores que no lo ejecutan.
        Object.entries(camposPdfTotales(pj, sumasDeLaPlantilla(form))).forEach(([campo, valor]) => this.trySetText(form, campo, valor));

        if (`${pj?.Jugador ?? ''}`.trim().length < 1 && jugadorFicha.length > 0)
            notas += `\r\n\r\nJugador: ${jugadorFicha}`;

        if (!tieneEspecialidadArcana && !tieneEspecialidadPsionica) {
            this.trySetText(form, 'escuela1', '');
            this.trySetText(form, 'escuela2', '');
            this.trySetText(form, 'disciplina_pro', '');
            for (let i = 1; i <= 2; i++)
                this.trySetText(form, `escuela_pro${i}`, '');
        }
        form.getTextField('notas').setText(notas);

        // const pngImage = await pdfDoc.embedPng(...)
        // const textField = form.getTextField('some.text.field')
        // textField.setImage(pngImage)



        // form.getCheckBox('agreed').check();
        const pdfBytes = await pdfDoc.save();


        // save to a file
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, `${pj.Nombre}.pdf`);


        // send to server
        // const formData = new FormData();
        // formData.append('file', new File([pdfBytes], 'filled-form.pdf'));
        // const response = await fetch('url/to/server', {
        //   method: 'POST',
        //   body: formData,
        // });

        function Rellenar_habilidades(): string {
            var notas = "";
            var contHabsCustom = 1;
            /** Los modificadores circunstanciales de una habilidad (base o custom), a las notas bajo su título. */
            const anotarCircunstanciales = (h: Personaje['Habilidades'][number]): void => {
                if (`${h.Varios ?? ''}`.trim() === '')
                    return;
                if (!notas.includes('Habilidades con rangos circunstanciales:'))
                    notas += '\r\n\r\nHabilidades con rangos circunstanciales:\r\n';
                notas += `${h.Nombre}: ${h.Varios}\r\n`;
            };
            (pj.Habilidades ?? []).forEach(h => {
                // Una custom va a sus filas propias (`custom1`, `custom2`): su id es de `habilidades_custom`, no una fila de
                // la hoja, así que no escribe en la de la habilidad base con su mismo número.
                if (h.Custom) {
                    const car = `${h.Car ?? ''}`.substring(0, 3).toUpperCase();
                    if (contHabsCustom <= CUSTOM_EN_HOJA) {
                        if (h.Clasea)
                            self.tryCheck(form, `clasea${PRIMERA_FILA_CUSTOM + contHabsCustom - 1}`, true);
                        self.trySetText(form, `custom${contHabsCustom}`, `${h.Nombre ?? ''}`);
                        self.trySetText(form, `car${contHabsCustom}`, car);
                        self.trySetText(form, `mod_custom${contHabsCustom}`, `${toNumber(h.Mod_car)}`);
                        self.trySetText(form, `rangos_custom${contHabsCustom}`, `${toNumber(h.Rangos)}`);
                        self.trySetText(form, `varios_custom${contHabsCustom}`, `${toNumber(h.Rangos_varios)}`);
                        anotarCircunstanciales(h);
                    } else {
                        if (!notas.includes('Habilidades extra (No caben):'))
                            notas += '\r\n\r\nHabilidades extra (No caben):\r\n';
                        notas += `${contHabsCustom - CUSTOM_EN_HOJA}.- ${h.Nombre} [${car}] rangos: ${toNumber(h.Rangos)} rangos varios: ${toNumber(h.Rangos_varios)}${`${h.Varios ?? ''}`.trim() !== '' ? ` mod varios: ${h.Varios}` : ''}\r\n`;
                    }
                    contHabsCustom++;
                    return;
                }

                const habilidadId = toNumber((h as any)?.Id);
                if (habilidadId <= 0)
                    return;

                const habilidadIndex = habilidadId - 1;
                if (h.Clasea)
                    self.tryCheck(form, `clasea${habilidadIndex}`, true);

                self.trySetText(form, `rangos${habilidadIndex}`, `${toNumber(h.Rangos)}`);
                if (`${h.Extra ?? ''}`.trim() !== '' && !habilidadConExtraPorElegir(h))
                    self.trySetText(form, `extra${habilidadIndex}`, `${h.Extra ?? ''}`);
                if (h.Rangos_varios > 0)
                    self.trySetText(form, `varios${habilidadIndex}`, `${toNumber(h.Rangos_varios)}`);
                anotarCircunstanciales(h);
            });
            return notas;
        }
    }

    async generarPDF_Conjuros(pj: Personaje) {
        const pdfTemplateBytes = await fetch('../../assets/pdf/Conjuros.pdf').then((res) => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfTemplateBytes);
        const form = pdfDoc.getForm();
        const conjuros = Array.isArray(pj?.Conjuros) ? pj.Conjuros : [];
        const sortilegas = Array.isArray(pj?.Sortilegas) ? pj.Sortilegas : [];

        this.trySetText(
            form,
            'Conjuros',
            conjuros.length > 0 && sortilegas.length > 0
                ? 'Listado de conjuros y sortilegas'
                : conjuros.length > 0
                    ? 'Listado de conjuros'
                    : 'Listado de sortilegas'
        );
        let contador = 0;
        conjuros.forEach(c => {
            this.trySetText(form, `conjuro${contador}`, `${c?.Nombre ?? ''}`);
            this.trySetText(form, `pag_con${contador}`, `${c?.Manual ?? ''}`);
            this.trySetText(form, `desc_con${contador}`, `${c?.Descripcion ?? ''}`);
            contador++;
        });
        sortilegas.forEach(s => {
            this.trySetText(form, `conjuro${contador}`, `${s?.Conjuro?.Nombre ?? ''}`);
            this.trySetText(form, `pag_con${contador}`, `${s?.Conjuro?.Manual ?? ''}`);
            // Los usos, como los da la API («3/día», «A voluntad»).
            const usos = `${s?.Usos_diarios ?? ''}`.trim();
            this.trySetText(form, `desc_con${contador}`, `Usos diarios: ${usos.length > 0 ? usos : '-'}\r\nNivel de lanzador: ${toNumber((s as any)?.Nivel_lanzador)}\r\n${s?.Descripcion ? s.Descripcion : ''}`);
            contador++;
        });

        const pdfBytes = await pdfDoc.save();
        // save to a file
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, `${pj.Nombre} conjuros.pdf`);

        // send to server
        // const formData = new FormData();
        // formData.append('file', new File([pdfBytes], 'filled-form.pdf'));
        // const response = await fetch('url/to/server', {
        //   method: 'POST',
        //   body: formData,
        // });
    }

    async generarPDF_Familiar(pj: Personaje, familiar: FamiliarMonstruoDetalle, index: number): Promise<void> {
        const pdfTemplateBytes = await fetch('../../assets/pdf/familiar.pdf').then((res) => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfTemplateBytes);
        const form = pdfDoc.getForm();
        const nombreFicha = `${familiar?.Nombre ?? ''}`.trim() || `Familiar de ${pj.Nombre}`;

        this.rellenarBasicosCompaneroOamiliar(form, familiar, nombreFicha, `${pj?.Jugador ?? ''}`, true);
        this.rellenarHabilidadesMonstruo(form, familiar);
        this.trySetText(form, 'Conjuros', 'Listas mixtas');
        this.rellenarListasMonstruo(form, familiar);

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const i = Math.max(0, Math.trunc(Number(index) || 0));
        saveAs(blob, `${this.normalizarNombreArchivo(pj.Nombre)} familiar ${i + 1}.pdf`);
    }

    async generarPDF_Companero(pj: Personaje, companero: CompaneroMonstruoDetalle, index: number): Promise<void> {
        const pdfTemplateBytes = await fetch('../../assets/pdf/compañero.pdf').then((res) => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfTemplateBytes);
        const form = pdfDoc.getForm();
        const nombreFicha = `${companero?.Nombre ?? ''}`.trim() || `Compañero de ${pj.Nombre}`;

        this.rellenarBasicosCompaneroOamiliar(form, companero, nombreFicha, `${pj?.Jugador ?? ''}`, false);
        this.rellenarHabilidadesMonstruo(form, companero);
        this.trySetText(form, 'Conjuros', 'Listas mixtas');
        this.rellenarListasMonstruo(form, companero);

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const i = Math.max(0, Math.trunc(Number(index) || 0));
        saveAs(blob, `${this.normalizarNombreArchivo(pj.Nombre)} compañero ${i + 1}.pdf`);
    }

    private rellenarBasicosCompaneroOamiliar(form: any, monstruo: MonstruoDetalle, nombre: string, jugador: string, esFamiliar: boolean): void {
        this.trySetText(form, 'nombre', nombre);
        this.trySetText(form, 'jugador', jugador);
        this.trySetText(form, 'raza', this.resolverEtiquetaRazaCompania(monstruo, esFamiliar));
        this.trySetText(form, 'alineamiento', 'Neutral');
        this.trySetText(form, 'tamaño', `${monstruo?.Tamano?.Nombre ?? ''}`);
        this.trySetText(form, 'presa', `${toNumber((monstruo as any)?.Ataque?.Presa ?? (monstruo as any)?.Presa)}`);
        this.trySetText(form, 'iniciativa', `${toNumber(monstruo?.Iniciativa)}`);

        // Los valores y sus modificadores los da la API; sin valor (el «—» del manual), «—» en los dos.
        CAMPOS_CARACTERISTICAS_PDF.forEach(([clave, campo]) => {
            this.trySetText(form, campo, textoValorCaracteristica(monstruo?.Caracteristicas, clave));
            this.trySetText(form, `mod_${campo}`, textoModificadorCaracteristica(monstruo?.Caracteristicas, clave));
        });

        this.trySetText(form, 'ca', `${toNumber(monstruo?.Defensa?.Ca)}`);
        this.trySetText(form, 'ca_armadura', '0');
        this.trySetText(form, 'ca_escudo', '0');
        this.trySetText(form, 'armadura_natural', `${toNumber(monstruo?.Defensa?.Armadura_natural)}`);
        this.trySetText(form, 'mod_desvio', '0');
        this.trySetText(form, 'mod_varios_ca', '0');
        this.trySetText(form, 'ca_toque', `${toNumber(monstruo?.Defensa?.Toque)}`);
        this.trySetText(form, 'ca_desprevenido', `${toNumber(monstruo?.Defensa?.Desprevenido)}`);
        this.trySetText(form, 'pg', `${toNumber((monstruo as any)?.Vida)}`);

        const mods = this.calcularBonosDotesMonstruo(monstruo);
        this.trySetText(form, 'mod_varios_presa', `${mods.presa}`);
        this.trySetText(form, 'mod_varios_iniciativa', `${mods.iniciativa}`);
        this.trySetText(form, 'mod_varios_fortaleza', `${mods.fortaleza}`);
        this.trySetText(form, 'mod_varios_reflejos', `${mods.reflejos}`);
        this.trySetText(form, 'mod_varios_voluntad', `${mods.voluntad}`);

        this.trySetText(form, 'fort_clase', `${toNumber(monstruo?.Salvaciones?.Fortaleza)}`);
        this.trySetText(form, 'mod_magico_fortaleza', '0');
        this.trySetText(form, 'ref_clase', `${toNumber(monstruo?.Salvaciones?.Reflejos)}`);
        this.trySetText(form, 'mod_magico_reflejos', '0');
        this.trySetText(form, 'vol_clase', `${toNumber(monstruo?.Salvaciones?.Voluntad)}`);
        this.trySetText(form, 'mod_magico_voluntad', '0');

        this.trySetText(form, 'rc', `${monstruo?.Defensa?.Resistencia_conjuros ?? ''}`);
        const ataqueBase = toNumber(monstruo?.Ataque?.Ataque_base);
        this.trySetText(form, 'ataque_base', `${ataqueBase}`);
        this.trySetText(form, 'mod_ataque_base', `${ataqueBase}`);
        this.trySetText(form, 'velocidad', `${toNumber(monstruo?.Movimientos?.Correr)}`);
    }

    private rellenarHabilidadesMonstruo(form: any, monstruo: MonstruoDetalle): void {
        const habilidades = Array.isArray(monstruo?.Habilidades) ? monstruo.Habilidades : [];
        let contadorCustom = 1;
        habilidades.forEach((habilidad) => {
            const id = toNumber((habilidad as any)?.Id_habilidad ?? (habilidad as any)?.Id);
            if (id <= 0)
                return;

            const index = id - 1;
            if (toBoolean((habilidad as any)?.Clasea))
                this.tryCheck(form, `clasea${index}`, true);
            this.trySetText(form, `rangos${index}`, `${toNumber(habilidad?.Rangos)}`);

            const extra = `${(habilidad as any)?.Extra ?? ''}`.trim();
            const custom = (habilidad as any)?.Custom === true;
            if (extraHabilidadElegido(extra)) {
                this.trySetText(form, `extra${index}`, extra);
                return;
            }

            if (custom && contadorCustom < 3) {
                const caracteristica = `${(habilidad as any)?.Caracteristica ?? ''}`.trim();
                this.trySetText(form, `custom${contadorCustom}`, `${(habilidad as any)?.Habilidad ?? (habilidad as any)?.Nombre ?? ''}`.trim());
                this.trySetText(form, `car${contadorCustom}`, caracteristica.substring(0, 3).toUpperCase());
                this.trySetText(form, `mod_custom${contadorCustom}`, `${this.calcularModHabilidadMonstruo(monstruo, habilidad)}`);
                this.trySetText(form, `rangos_custom${contadorCustom}`, `${toNumber(habilidad?.Rangos)}`);
                this.trySetText(form, `varios_custom${contadorCustom}`, `${toNumber((habilidad as any)?.Rangos_varios)}`);
                contadorCustom++;
                return;
            }

            this.trySetText(form, `varios${index}`, `${toNumber((habilidad as any)?.Rangos_varios)}`);
        });
    }

    private rellenarListasMonstruo(form: any, monstruo: MonstruoDetalle): void {
        let cont = 0;
        this.trySetText(form, `conjuro${cont}`, `Tipo de criatura: ${monstruo?.Tipo?.Nombre ?? '-'}`);
        this.trySetText(form, `pag_con${cont}`, `${(monstruo as any)?.Tipo?.Origen ?? monstruo?.Tipo?.Descripcion ?? ''}`);
        this.trySetText(form, `desc_con${cont}`, this.getNotasTipoCriatura(monstruo));
        cont++;

        const subtipos = Array.isArray(monstruo?.Subtipos) ? monstruo.Subtipos : [];
        if (subtipos.length > 0) {
            this.trySetText(form, `conjuro${cont}`, 'Subtipos:');
            this.trySetText(form, `desc_con${cont}`, subtipos.map((s) => `${s?.Nombre ?? ''}`.trim()).filter((n) => n.length > 0).join(', '));
            cont++;
        }

        const rasgos = toArray((monstruo as any)?.Tipo?.Rasgos);
        if (rasgos.length > 0) {
            this.trySetText(form, `conjuro${cont}`, 'Rasgos otorgados por tipos y subtipos:');
            cont++;
            rasgos.forEach((rasgo: any) => {
                this.trySetText(form, `conjuro${cont}`, `${rasgo?.Nombre ?? ''}`.trim());
                this.trySetText(form, `desc_con${cont}`, `${rasgo?.Descripcion ?? ''}`.trim());
                cont++;
            });
        }

        (monstruo?.Dotes ?? []).forEach((doteCtx) => {
            const nombre = `${doteCtx?.Dote?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const extra = `${doteCtx?.Contexto?.Extra ?? ''}`.trim();
            this.trySetText(form, `conjuro${cont}`, extra.length > 0 ? `${nombre} (${extra})` : nombre);
            this.trySetText(form, `desc_con${cont}`, `${doteCtx?.Dote?.Descripcion ?? ''}`.trim());
            this.trySetText(form, `pag_con${cont}`, `${doteCtx?.Dote?.Manual?.Nombre ?? ''} ${toNumber(doteCtx?.Dote?.Manual?.Pagina)}`.trim());
            cont++;
        });

        const especiales = toArray((monstruo as any)?.Especiales);
        especiales.forEach((especial: any) => {
            const nombre = `${especial?.Especial?.Nombre ?? especial?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            this.trySetText(form, `conjuro${cont}`, nombre);
            this.trySetText(form, `desc_con${cont}`, `${especial?.Especial?.Descripcion ?? especial?.Descripcion ?? ''}`.trim());
            cont++;
        });

        (monstruo?.Idiomas ?? []).forEach((idioma) => {
            const nombre = `${idioma?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            this.trySetText(form, `conjuro${cont}`, nombre);
            this.trySetText(form, `desc_con${cont}`, `${idioma?.Descripcion ?? ''}`.trim());
            this.trySetText(form, `pag_con${cont}`, 'Idiomas');
            cont++;
        });

        (monstruo?.Raciales ?? []).forEach((racial) => {
            const nombre = `${racial?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            this.trySetText(form, `conjuro${cont}`, nombre);
            this.trySetText(form, `desc_con${cont}`, `${racial?.Descripcion ?? ''}`.trim());
            cont++;
        });

        (monstruo?.Sortilegas ?? []).forEach((sortilega) => {
            const nombre = `${sortilega?.Conjuro?.Nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            this.trySetText(form, `conjuro${cont}`, `${nombre} como lanzador de nivel: ${toNumber(sortilega?.Nivel_lanzador)} (${sortilega?.Usos_diarios ?? ''})`);
            this.trySetText(form, `desc_con${cont}`, `${sortilega?.Conjuro?.Descripcion ?? ''}`.trim());
            this.trySetText(form, `pag_con${cont}`, `${sortilega?.Conjuro?.Manual ?? ''}`.trim());
            cont++;
        });
    }

    private resolverEtiquetaRazaCompania(monstruo: MonstruoDetalle, esFamiliar: boolean): string {
        const nombreBase = `${monstruo?.Nombre ?? ''}`.trim();
        const idPlantilla = toNumber((monstruo as any)?.Plantilla?.Id ?? (monstruo as any)?.Id_plantilla);
        if (nombreBase.length < 1)
            return '-';

        if (esFamiliar) {
            // La pseudoplantilla del familiar, por su nombre del catálogo (cualquiera, no solo las del Manual del jugador).
            const plantilla = `${(monstruo as any)?.Plantilla?.Nombre ?? ''}`.trim();
            return plantilla.length > 0 ? `${nombreBase} (${plantilla})` : nombreBase;
        }

        if (idPlantilla === 2)
            return `${nombreBase} (Elevado)`;
        if (idPlantilla === 3)
            return `${nombreBase} (Sabandija)`;
        return nombreBase;
    }

    private getNotasTipoCriatura(monstruo: MonstruoDetalle): string {
        const tipo: any = monstruo?.Tipo ?? {};
        const notas: string[] = [];
        if (toNumber(tipo?.Come) === 1)
            notas.push('Debes comer');
        if (toNumber(tipo?.Respira) === 1)
            notas.push('Debes respirar');
        if (toNumber(tipo?.Duerme) === 1)
            notas.push('Debes dormir');
        if (toNumber(tipo?.Recibe_criticos) === 0 || toNumber(tipo?.Criticos) === 1)
            notas.push('No puedes recibir criticos');
        if (toNumber(tipo?.Puede_ser_flanqueado) === 0 || toNumber(tipo?.Flanqueado) === 1)
            notas.push('No puedes ser flanqueado');
        return notas.join('\r\n');
    }

    private calcularBonosDotesMonstruo(monstruo: MonstruoDetalle): {
        presa: number;
        iniciativa: number;
        fortaleza: number;
        reflejos: number;
        voluntad: number;
    } {
        const totales = {
            presa: 0,
            iniciativa: 0,
            fortaleza: 0,
            reflejos: 0,
            voluntad: 0,
        };

        (monstruo?.Dotes ?? []).forEach((entrada) => {
            const mods = (entrada?.Dote?.Modificadores ?? {}) as Record<string, any>;
            Object.entries(mods).forEach(([clave, value]) => {
                const normalizada = `${clave ?? ''}`.trim().toLowerCase();
                const valor = toNumber(value);
                if (valor === 0)
                    return;
                if (normalizada.includes('presa'))
                    totales.presa += valor;
                else if (normalizada.includes('iniciativa'))
                    totales.iniciativa += valor;
                else if (normalizada.includes('fort'))
                    totales.fortaleza += valor;
                else if (normalizada.includes('ref'))
                    totales.reflejos += valor;
                else if (normalizada.includes('vol'))
                    totales.voluntad += valor;
            });
        });

        return totales;
    }

    /** El modificador de la característica de una habilidad del monstruo, el de la API (sin valor, +0). */
    private calcularModHabilidadMonstruo(monstruo: MonstruoDetalle, habilidad: any): number {
        const clave = caracteristicaPorId(toNumber(habilidad?.Id_caracteristica));
        return clave ? modificadorParaSumar(monstruo?.Caracteristicas, clave) : 0;
    }

    /**
     * Las características del personaje y sus modificadores, los de la API. Sin valor (la Constitución de un muerto
     * viviente: `co` 0 y `mco` `null`), «—» en los dos, como en las hojas del familiar y el compañero.
     */
    private rellenarCaracteristicasPersonaje(form: PDFForm, pj: Personaje): void {
        CAMPOS_CARACTERISTICAS_PDF.forEach(([clave, campo]) => {
            const valor: unknown = pj[clave];
            const modificador: unknown = pj[`Mod${clave}`];
            const sinModificador = modificador === null || modificador === undefined;
            const sinValor = valor === null || valor === undefined || (sinModificador && toNumber(valor) <= 0);
            form.getTextField(campo).setText(sinValor ? SIN_CARACTERISTICA : `${valor}`);
            const mod = toNumber(modificador);
            form.getTextField(`mod_${campo}`).setText(sinModificador ? SIN_CARACTERISTICA : `${mod > 0 ? '+' : ''}${mod}`);
        });
    }

    /** El aviso «Contiene elementos no oficiales» de la plantilla, que está oculto: se enseña y se imprime. */
    private mostrarAvisoNoOficial(form: PDFForm): void {
        try {
            const aviso = form.getTextField('oficial');
            aviso.acroField.getWidgets().forEach((widget) => {
                widget.setFlagTo(AnnotationFlags.Hidden, false);
                widget.setFlagTo(AnnotationFlags.Print, true);
            });
            // Se vuelve a escribir para que se dibuje su apariencia al guardar.
            aviso.setText(aviso.getText() || 'Contiene elementos no oficiales');
        } catch {
            // El template puede no contener el campo; no interrumpimos la generación.
        }
    }

    private trySetText(form: any, fieldName: string, value: string): void {
        const text = `${value ?? ''}`;
        if (fieldName.trim().length < 1)
            return;
        try {
            form.getTextField(fieldName).setText(text);
        } catch {
            // El template puede no contener el campo; no interrumpimos la generación.
        }
    }

    private tryCheck(form: any, fieldName: string, checked: boolean): void {
        if (!checked || fieldName.trim().length < 1)
            return;
        try {
            form.getCheckBox(fieldName).check();
        } catch {
            // El template puede no contener el campo; no interrumpimos la generación.
        }
    }

    private formatearNotasNivelesLanzador(pj: Personaje): string {
        const niveles = (pj?.Niveles_lanzador ?? [])
            .filter((nivel) => toInt(nivel?.nivelLanzador) > 0)
            .sort((a, b) => compararTexto(a?.nombreClase, b?.nombreClase));
        if (niveles.length < 1)
            return '';

        const lineas = niveles.map((nivel) => this.formatearLineaNivelLanzador(nivel));
        return `\r\n\r\nNiveles de lanzador:\r\n${lineas.join('\r\n')}`;
    }

    private formatearLineaNivelLanzador(nivel: PersonajeNivelLanzadorResumen): string {
        const tipo = this.formatearTipoLanzamiento(nivel?.tipoLanzamiento);
        const tipoLabel = tipo.length > 0 ? ` (${tipo})` : '';
        const nivelLanzador = Math.max(0, toInt(nivel?.nivelLanzador));
        const base = Math.max(0, toInt(nivel?.nivelLanzadorBase));
        const bonus = Math.max(0, toInt(nivel?.bonusNivelLanzador));
        const desglose = bonus > 0 ? `, base ${base} + ${bonus}` : '';
        return ` - ${nivel?.nombreClase ?? 'Clase'}${tipoLabel}: ${nivelLanzador}${desglose}`;
    }

    private formatearTipoLanzamiento(tipo: PersonajeTipoLanzamiento | null | undefined): string {
        if (tipo === 'arcano')
            return 'arcano';
        if (tipo === 'divino')
            return 'divino';
        if (tipo === 'psionico')
            return 'psionico';
        return '';
    }

    private resolverNombreJugador(pj: Personaje): string {
        const actual = `${pj?.Jugador ?? ''}`.trim();
        if (actual.length > 0)
            return actual;

        const ownerUid = `${pj?.ownerUid ?? ''}`.trim();
        try {
            const user = this.auth?.currentUser ?? null;
            const uid = `${user?.uid ?? ''}`.trim();
            const displayName = `${user?.displayName ?? ''}`.trim();
            if (uid.length > 0 && ownerUid.length > 0 && uid === ownerUid && displayName.length > 0)
                return displayName;

            const email = `${user?.email ?? ''}`.trim();
            if (uid.length > 0 && ownerUid.length > 0 && uid === ownerUid && email.length > 0) {
                const arroba = email.indexOf('@');
                if (arroba > 0)
                    return email.substring(0, arroba).trim();
                return email;
            }
        } catch {
            // Sin sesion activa; no forzamos valor.
        }

        return '';
    }

    /**
     * Si hay especialidad. La escuela «Cualquiera» se mira aparte, por su comodín. Sin disciplina, la ficha de la API la
     * da a `null` y el borrador de la creación escribe «Ninguna».
     */
    private esEspecialidadValida(nombre: string, calificativo: string): boolean {
        const nombreNorm = normalizarTexto(nombre, true);
        const calificativoNorm = normalizarTexto(calificativo, true);
        if (nombreNorm.length < 1 || calificativoNorm.length < 1)
            return false;
        return nombreNorm !== 'ninguna' && calificativoNorm !== 'ninguna';
    }

    private obtenerRacialesParaFicha(pj: Personaje): Array<{ nombre: string; origen: string; }> {
        const base = toArray((pj as any)?.Raciales);
        const fallbackRaza = toArray((pj as any)?.Raza?.Raciales);
        const fuente = base.length > 0 ? base : fallbackRaza;
        const vistos = new Set<string>();
        const raciales: Array<{ nombre: string; origen: string; }> = [];

        fuente.forEach((entrada: any) => {
            const nombre = `${entrada?.Nombre ?? entrada?.nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const origen = `${entrada?.Origen ?? entrada?.origen ?? ''}`.trim();
            const clave = `${normalizarTexto(nombre, true)}|${normalizarTexto(origen, true)}`;
            if (vistos.has(clave))
                return;
            vistos.add(clave);
            raciales.push({ nombre, origen });
        });

        return raciales;
    }

    private getAjusteNivelParaFicha(pj: Personaje): number {
        const desdePlantillas = (pj?.Plantillas ?? [])
            .reduce((acum, plantilla) => acum + toNumber((plantilla as any)?.Ajuste_nivel), 0);
        return Math.max(0, Math.trunc(desdePlantillas));
    }

    private calcularExpSiguienteNivel(pj: Personaje, ajusteNivel: number): number {
        // La experiencia va por el NEP (niveles de clase + DG raciales y de plantilla + ajustes; GDM cap. 6), el de la API.
        const nep = Math.max(0, toInt(pj?.NEP));
        if (nep > 0)
            return experienciaParaNivel(nep + 1);
        let nivelClases = (pj?.desgloseClases ?? [])
            .reduce((acum, clase) => acum + Math.max(0, toInt(clase?.Nivel)), 0);
        if (nivelClases <= 0) {
            const clasesTexto = `${pj?.Clases ?? ''}`;
            const coincidencias = (clasesTexto.match(/\((\d+)\)/g) ?? []) as string[];
            nivelClases = coincidencias.reduce((acum: number, bloque: string) => {
                const limpio = bloque.replace(/[()]/g, '');
                return acum + Math.max(0, toInt(limpio));
            }, 0);
        }
        const nivelObjetivo = Math.max(0, nivelClases + Math.max(0, toInt(ajusteNivel)));
        return experienciaParaNivel(nivelObjetivo + 1);
    }

    private normalizarNombreArchivo(nombre: string): string {
        const base = `${nombre ?? ''}`.trim();
        if (base.length < 1)
            return 'personaje';
        return base.replace(/[\\/:*?"<>|]/g, '_');
    }

    private tryInjectAuth(): Auth | null {
        try {
            return inject(Auth);
        } catch {
            return null;
        }
    }

}
