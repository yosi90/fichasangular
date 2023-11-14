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
        form.getTextField('clase').setText(pj.Clases.replace('(', '').replace(')', ''));
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
        form.getTextField('mod_varios_iniciativa').setText(pj.Iniciativa_varios ? `${pj.Iniciativa_varios.reduce((c, v) => c + v.Valor, 0)}` : '0');
        form.getTextField('mod_tamaño_presa').setText(pj.Tamano.Modificador_presa.toString());
        form.getTextField('mod_varios_presa').setText(pj.Presa_varios ? `${pj.Presa_varios.reduce((c, v) => c + v.Valor, 0)}` : '0');
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
        if (pj.Rd != "No aplica")
            form.getTextField('rd').setText(pj.Rd);
        if (pj.Re != "No aplica")
            form.getTextField('rc').setText(pj.Rc);
        var notas = `Personalidad:\r\n${pj.Personalidad}\r\n\r\nContexto:\r\n${pj.Contexto}`;
        if (pj.Re != "No aplica")
            notas += `\r\n\r\nResistencia a la energía: ${pj.Re}`;
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
        if (pj.Escalar > 0)
            notas += `\r\n\r\nEscalar: ${pj.Escalar} pies`;
        form.getTextField('rangos_max').setText((pj.NEP + 3).toString());
        form.getTextField('rangos_min').setText(((pj.NEP + 3) / 2).toString());
        notas += Rellenar_habilidades();
        form.getTextField('carga_ligera').setText(pj.Capacidad_carga.Ligera.toString());
        form.getTextField('carga_media').setText(pj.Capacidad_carga.Media.toString());
        form.getTextField('carga_pesada').setText(pj.Capacidad_carga.Pesada.toString());
        form.getTextField('levantar_cabeza').setText(pj.Capacidad_carga.Pesada.toString());
        form.getTextField('levantar_suelo').setText((pj.Capacidad_carga.Pesada * 2).toString());
        form.getTextField('empujar_arrastrar').setText((pj.Capacidad_carga.Pesada * 5).toString());
        let idiomas = 1;
        pj.Idiomas.forEach(i => {
            if (idiomas < 10)
                form.getTextField(`idioma${idiomas}`).setText(`${i.Nombre}`);
            else if (idiomas == 20)
                notas += `\r\n\r\nIdiomas que no cabían: \r\n - ${i.Nombre}`;
            else
                notas += `\r\n - ${i.Nombre}`;
            idiomas++;
        });
        form.getTextField('monedas_cobre').setText("0");
        form.getTextField('monedas_plata').setText("0");
        form.getTextField('monedas_oro').setText(pj.Oro_inicial.toString());
        form.getTextField('monedas_platino').setText("0");
        let contador = 1;
        pj.Dotes.forEach(d => {
            if(contador <= 12){
            form.getTextField(`dote${contador}`).setText(d.Nombre);
            form.getTextField(`pag_dote${contador}`).setText(d.Pagina.toString());
            form.getTextField(`desc_dote${contador}`).setText(d.Beneficio);
            } else if(contador == 13)
                notas += `\r\n\r\nDotes que no cabían: \r\n - ${d.Nombre} - Pág ${d.Pagina}\r\n${d.Beneficio}`;
            else
                notas += `\r\n\r\n - ${d.Nombre} - Pág ${d.Pagina}\r\n${d.Beneficio}`;
            contador++;
        });
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
            pj.Habilidades.forEach(h => {
                if (h.Clasea) {
                    form.getCheckBox(`clasea${h.Id - 1}`).check();
                }
                form.getTextField(`rangos${h.Id - 1}`).setText(h.Rangos.toString());
                if (h.Extra != "" && h.Extra != "Elegir") {
                    form.getTextField(`extra${h.Id - 1}`).setText(h.Extra);
                } else if (h.Custom) {
                    if (contHabsCustom < 3) {
                        form.getTextField(`custom${contHabsCustom}`).setText(h.Nombre);
                        form.getTextField(`car${contHabsCustom}`).setText(h.Car.substring(0, 3).toUpperCase());
                        form.getTextField(`mod_custom${contHabsCustom}`).setText(h.Mod_car == 1 ? `${pj.ModFuerza}` : h.Mod_car == 2 ? `${pj.ModDestreza}` : h.Mod_car == 3 ? `${pj.ModConstitucion}` : h.Mod_car == 4 ? `${pj.ModInteligencia}` : h.Mod_car == 5 ? `${pj.ModSabiduria}` : `${pj.ModCarisma}`);
                        form.getTextField(`rangos_custom${contHabsCustom}`).setText(h.Rangos.toString());
                        form.getTextField(`varios_custom${contHabsCustom}`).setText(h.Rangos_varios.toString());
                        if (h.Varios != "") {
                            if (!notas.includes('Habilidades con rangos circunstanciales:'))
                                notas += '\r\n\r\nHabilidades con rangos circunstanciales:\r\n';
                            notas += `${h.Nombre}: - ${h.Varios}`;
                        }
                    } else {
                        if (!notas.includes('Habilidades extra (No caben):'))
                            notas += 'Habilidades extra (No caben):';
                        notas += `${contHabsCustom - 2}.- ${h.Nombre} [${h.Car.substring(0, 3).toUpperCase()}] rangos: ${h.Rangos} rangos varios: ${h.Rangos_varios} mod varios: ${h.Varios}`;
                    }
                    contHabsCustom++;
                }
                if (!h.Custom) {
                    if (h.Rangos_varios > 0) {
                        form.getTextField(`varios${h.Id - 1}`).setText(h.Rangos_varios.toString());
                    }
                    if (h.Varios != "") {
                        if (!notas.includes('Habilidades con rangos circunstanciales:'))
                            notas += '\r\n\r\nHabilidades con rangos circunstanciales:\r\n';
                        notas += `${h.Nombre}: ${h.Varios}`;
                    }
                }
            });
            return notas;
        }
    }

    constructor() { }

}
