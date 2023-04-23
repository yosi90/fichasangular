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
        pj.Plantillas.forEach(p => {
            raza += ` ${p.Nombre}`;
        });
        form.getTextField('raza').setText(raza);
        form.getTextField('alineamiento').setText(pj.Alineamiento);
        if(pj.Deidad && pj.Deidad.length > 0)
            form.getTextField('deidad').setText(pj.Deidad);
        form.getTextField('tamaño').setText(pj.Tamano.Nombre);
        form.getTextField('mod_tamaño_presa').setText(pj.Tamano.Modificador_presa.toString());
        form.getTextField('mod_varios_presa').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);
        form.getTextField('raza').setText(raza);


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
