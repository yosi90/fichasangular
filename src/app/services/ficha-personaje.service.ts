import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Personaje } from '../interfaces/personaje';


@Injectable({
    providedIn: 'root'
})
export class FichaPersonajeService {

    async generarPDF(pj: Personaje) {
        const pdfTemplateBytes = await fetch('../../assets/pdf/Ficha.pdf').then((res) => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfTemplateBytes);
        const form = pdfDoc.getForm();
        if (!pj.Oficial) {
            const field = form.getTextField('oficial');
            // TODO El campo está oculto, mostrarlo
        }
        form.getTextField('nombre').setText(pj.Nombre);
        form.getTextField('jugador').setText(pj.Jugador);
        form.getTextField('clase').setText(pj.Clases);
        let raza = pj.Raza;
        if (pj.Plantillas)
            pj.Plantillas.forEach(p => {
                raza += ` ${p.Nombre}`;
            });
        form.getTextField('raza').setText(raza);
        form.getTextField('alineamiento').setText(pj.Alineamiento);
        if (pj.Deidad && pj.Deidad.length > 0)
            form.getTextField('deidad').setText(pj.Deidad);
        form.getTextField('tamaño').setText(pj.Tamano.Nombre);
        form.getTextField('edad').setText(pj.Edad.toString());
        form.getTextField('sexo').setText(pj.Genero);
        form.getTextField('altura').setText(pj.Altura.toString());
        form.getTextField('peso').setText(pj.Peso.toString());
        form.getTextField('campaña').setText(pj.Campana);
        form.getTextField('fue').setText(pj.Fuerza.toString());
        form.getTextField('des').setText(pj.Destreza.toString());
        form.getTextField('con').setText(pj.Constitucion.toString());
        form.getTextField('int').setText(pj.Inteligencia.toString());
        form.getTextField('sab').setText(pj.Sabiduria.toString());
        form.getTextField('car').setText(pj.Carisma.toString());
        form.getTextField('mod_fue').setText(`${pj.ModFuerza > 0 ? '+' : ''}${pj.ModFuerza}`);
        form.getTextField('mod_des').setText(`${pj.ModDestreza > 0 ? '+' : ''}${pj.ModDestreza}`);
        form.getTextField('mod_con').setText(`${pj.ModConstitucion > 0 ? '+' : ''}${pj.ModConstitucion}`);
        form.getTextField('mod_int').setText(`${pj.ModInteligencia > 0 ? '+' : ''}${pj.ModInteligencia}`);
        form.getTextField('mod_sab').setText(`${pj.ModSabiduria > 0 ? '+' : ''}${pj.ModSabiduria}`);
        form.getTextField('mod_car').setText(`${pj.ModCarisma > 0 ? '+' : ''}${pj.ModCarisma}`);
        form.getTextField('mod_tamaño_presa').setText(pj.Tamano.Modificador_presa.toString());
        form.getTextField('ca').setText(pj.Ca.toString());
        form.getTextField('ca_armadura').setText('0');
        form.getTextField('ca_escudo').setText('0');
        form.getTextField('mod_tamaño_ca').setText(pj.Tamano.Modificador.toString());
        form.getTextField('armadura_natural').setText(pj.Armadura_natural.toString());
        form.getTextField('mod_desvio').setText(pj.Ca_desvio.toString());
        form.getTextField('mod_varios_ca').setText(pj.Ca_varios.toString());
        form.getTextField('ca_toque').setText(pj.Ca.toString());
        form.getTextField('ca_desprevenido').setText((pj.Ca - pj.ModDestreza).toString());
        form.getTextField('pg').setText(pj.Vida.toString());
        form.getTextField('fort_clase').setText(pj.Salvaciones.fortaleza.modsClaseos ? pj.Salvaciones.fortaleza.modsClaseos.valor.reduce((c, v) => c + v, 0).toString() : '0');
        form.getTextField('mod_magico_fortaleza').setText('0');
        form.getTextField('mod_varios_fortaleza').setText(pj.Salvaciones.fortaleza.modsVarios ? pj.Salvaciones.fortaleza.modsVarios.valor.reduce((c, v) => c + v, 0).toString() : '0');
        form.getTextField('ref_clase').setText(pj.Salvaciones.reflejos.modsClaseos ? pj.Salvaciones.reflejos.modsClaseos.valor.reduce((c, v) => c + v, 0).toString() : '0');
        form.getTextField('mod_magico_reflejos').setText('0');
        form.getTextField('mod_varios_reflejos').setText(pj.Salvaciones.reflejos.modsVarios ? pj.Salvaciones.reflejos.modsVarios.valor.reduce((c, v) => c + v, 0).toString() : '0');
        form.getTextField('vol_clase').setText(pj.Salvaciones.voluntad.modsClaseos ? pj.Salvaciones.voluntad.modsClaseos.valor.reduce((c, v) => c + v, 0).toString() : '0');
        form.getTextField('mod_magico_voluntad').setText('0');
        form.getTextField('mod_varios_voluntad').setText(pj.Salvaciones.voluntad.modsVarios ? pj.Salvaciones.voluntad.modsVarios.valor.reduce((c, v) => c + v, 0).toString() : '0');

        form.getTextField('mod_varios_presa').setText(pj.Presa_varios.toString());


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
    }

    constructor() { }
}
