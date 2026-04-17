import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Personaje, PersonajeNivelLanzadorResumen, PersonajeTipoLanzamiento } from '../interfaces/personaje';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoDetalle } from '../interfaces/monstruo';


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
        if (!pj.Oficial) {
            const field = form.getTextField('oficial');
            // TODO El campo está oculto, mostrarlo
        }
        form.getTextField('nombre').setText(pj.Nombre);
        this.trySetText(form, 'jugador', jugadorFicha);
        form.getTextField('clase').setText(pj.Clases.replace('(', '').replace(')', ''));
        let raza = pj.Raza.Nombre;
        if (pj.Plantillas)
            pj.Plantillas.forEach(p => {
                raza += ` ${p.Nombre}`;
            });
        form.getTextField('raza').setText(raza);
        form.getTextField('alineamiento').setText(pj.Alineamiento);
        if (pj.Deidad && pj.Deidad.length > 0)
            form.getTextField('deidad').setText(pj.Deidad);
        form.getTextField('tamaño').setText(pj.Raza.Tamano.Nombre);
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
        form.getTextField('mod_tamaño_presa').setText(pj.Raza.Tamano.Modificador_presa.toString());
        form.getTextField('mod_varios_presa').setText(pj.Presa_varios ? `${pj.Presa_varios.reduce((c, v) => c + v.Valor, 0)}` : '0');
        form.getTextField('ca').setText(pj.Ca.toString());
        form.getTextField('ca_armadura').setText('0');
        form.getTextField('ca_escudo').setText('0');
        form.getTextField('mod_tamaño_ca').setText(pj.Raza.Tamano.Modificador.toString());
        form.getTextField('armadura_natural').setText(pj.Armadura_natural.toString());
        form.getTextField('mod_desvio').setText(pj.Ca_desvio.toString());
        form.getTextField('mod_varios_ca').setText(pj.Ca_varios.toString());
        form.getTextField('ca_toque').setText(pj.Ca.toString());
        form.getTextField('ca_desprevenido').setText((pj.Ca - pj.ModDestreza).toString());
        form.getTextField('pg').setText(pj.Vida.toString());
        form.getTextField('fort_clase').setText(this.sumMods((pj as any)?.Salvaciones?.fortaleza?.modsClaseos).toString());
        form.getTextField('mod_magico_fortaleza').setText('0');
        form.getTextField('mod_varios_fortaleza').setText(this.sumMods((pj as any)?.Salvaciones?.fortaleza?.modsVarios).toString());
        form.getTextField('ref_clase').setText(this.sumMods((pj as any)?.Salvaciones?.reflejos?.modsClaseos).toString());
        form.getTextField('mod_magico_reflejos').setText('0');
        form.getTextField('mod_varios_reflejos').setText(this.sumMods((pj as any)?.Salvaciones?.reflejos?.modsVarios).toString());
        form.getTextField('vol_clase').setText(this.sumMods((pj as any)?.Salvaciones?.voluntad?.modsClaseos).toString());
        form.getTextField('mod_magico_voluntad').setText('0');
        form.getTextField('mod_varios_voluntad').setText(this.sumMods((pj as any)?.Salvaciones?.voluntad?.modsVarios).toString());
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
        if (pj.Escalar > 0)
            notas += `\r\n\r\nEscalar: ${pj.Escalar} pies`;
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
        let idiomas = 1;
        (pj.Idiomas ?? []).forEach(i => {
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
        const tieneEspecialidadArcana = this.esEspecialidadValida(escuelaNombre, escuelaCalificativo);
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

        const experiencia = Math.max(0, Math.trunc(this.toNumber(pj?.Experiencia)));
        const ajusteNivel = this.getAjusteNivelParaFicha(pj);
        const nep = Math.max(0, Math.trunc(this.toNumber(pj?.NEP)));
        this.trySetText(form, 'experiencia', `${experiencia}`);
        this.trySetText(form, 'exp_sig_nivel', `${this.calcularExpSiguienteNivel(pj, ajusteNivel)}`);
        this.trySetText(form, 'ajuste_nivel', `${ajusteNivel}`);
        this.trySetText(form, 'nep', `${nep}`);

        if (pj?.Ataque_base?.trim().length > 0)
            this.trySetText(form, 'mod_ataque_base', `${pj.Ataque_base}`);
        this.trySetText(form, 'fallo_arcano', '0');

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
            (pj.Habilidades ?? []).forEach(h => {
                const habilidadId = self.toNumber((h as any)?.Id);
                if (habilidadId <= 0)
                    return;

                const habilidadIndex = habilidadId - 1;
                if (h.Clasea)
                    self.tryCheck(form, `clasea${habilidadIndex}`, true);

                self.trySetText(form, `rangos${habilidadIndex}`, `${self.toNumber(h.Rangos)}`);
                if (h.Extra != "" && h.Extra != "Elegir") {
                    self.trySetText(form, `extra${habilidadIndex}`, `${h.Extra ?? ''}`);
                } else if (h.Custom) {
                    if (contHabsCustom < 3) {
                        const car = `${h.Car ?? ''}`.substring(0, 3).toUpperCase();
                        self.trySetText(form, `custom${contHabsCustom}`, `${h.Nombre ?? ''}`);
                        self.trySetText(form, `car${contHabsCustom}`, car);
                        self.trySetText(form, `mod_custom${contHabsCustom}`, h.Mod_car == 1 ? `${pj.ModFuerza}` : h.Mod_car == 2 ? `${pj.ModDestreza}` : h.Mod_car == 3 ? `${pj.ModConstitucion}` : h.Mod_car == 4 ? `${pj.ModInteligencia}` : h.Mod_car == 5 ? `${pj.ModSabiduria}` : `${pj.ModCarisma}`);
                        self.trySetText(form, `rangos_custom${contHabsCustom}`, `${self.toNumber(h.Rangos)}`);
                        self.trySetText(form, `varios_custom${contHabsCustom}`, `${self.toNumber(h.Rangos_varios)}`);
                        if (h.Varios != "") {
                            if (!notas.includes('Habilidades con rangos circunstanciales:'))
                                notas += '\r\n\r\nHabilidades con rangos circunstanciales:\r\n';
                            notas += `${h.Nombre}: - ${h.Varios}\r\n`;
                        }
                    } else {
                        if (!notas.includes('Habilidades extra (No caben):'))
                            notas += 'Habilidades extra (No caben):\r\n';
                        notas += `${contHabsCustom - 2}.- ${h.Nombre} [${`${h.Car ?? ''}`.substring(0, 3).toUpperCase()}] rangos: ${h.Rangos} rangos varios: ${h.Rangos_varios} mod varios: ${h.Varios}\r\n`;
                    }
                    contHabsCustom++;
                }
                if (!h.Custom) {
                    if (h.Rangos_varios > 0) {
                        self.trySetText(form, `varios${habilidadIndex}`, `${self.toNumber(h.Rangos_varios)}`);
                    }
                    if (h.Varios != "") {
                        if (!notas.includes('Habilidades con rangos circunstanciales:'))
                            notas += '\r\n\r\nHabilidades con rangos circunstanciales:\r\n';
                        notas += `${h.Nombre}: ${h.Varios}\r\n`;
                    }
                }
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
            this.trySetText(form, `desc_con${contador}`, `Usos diarios: ${this.toNumber((s as any)?.Usos_diarios)}\r\nNivel de lanzador:${this.toNumber((s as any)?.Nivel_lanzador)}\r\n${s?.Descripcion ? s.Descripcion : ''}`);
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
        this.trySetText(form, 'presa', `${this.toNumber((monstruo as any)?.Ataque?.Presa ?? (monstruo as any)?.Presa)}`);
        this.trySetText(form, 'iniciativa', `${this.toNumber(monstruo?.Iniciativa)}`);

        const fue = this.toNumber(monstruo?.Caracteristicas?.Fuerza);
        const des = this.toNumber(monstruo?.Caracteristicas?.Destreza);
        const con = this.toNumber(monstruo?.Caracteristicas?.Constitucion);
        const intel = this.toNumber(monstruo?.Caracteristicas?.Inteligencia);
        const sab = this.toNumber(monstruo?.Caracteristicas?.Sabiduria);
        const car = this.toNumber(monstruo?.Caracteristicas?.Carisma);

        this.trySetText(form, 'fue', `${fue}`);
        this.trySetText(form, 'des', `${des}`);
        this.trySetText(form, 'con', `${con}`);
        this.trySetText(form, 'int', `${intel}`);
        this.trySetText(form, 'sab', `${sab}`);
        this.trySetText(form, 'car', `${car}`);
        this.trySetText(form, 'mod_fue', this.formatSigned(this.calcularModificador(fue)));
        this.trySetText(form, 'mod_des', this.formatSigned(this.calcularModificador(des)));
        this.trySetText(form, 'mod_con', this.formatSigned(this.calcularModificador(con)));
        this.trySetText(form, 'mod_int', this.formatSigned(this.calcularModificador(intel)));
        this.trySetText(form, 'mod_sab', this.formatSigned(this.calcularModificador(sab)));
        this.trySetText(form, 'mod_car', this.formatSigned(this.calcularModificador(car)));

        this.trySetText(form, 'ca', `${this.toNumber(monstruo?.Defensa?.Ca)}`);
        this.trySetText(form, 'ca_armadura', '0');
        this.trySetText(form, 'ca_escudo', '0');
        this.trySetText(form, 'armadura_natural', `${this.toNumber(monstruo?.Defensa?.Armadura_natural)}`);
        this.trySetText(form, 'mod_desvio', '0');
        this.trySetText(form, 'mod_varios_ca', '0');
        this.trySetText(form, 'ca_toque', `${this.toNumber(monstruo?.Defensa?.Toque)}`);
        this.trySetText(form, 'ca_desprevenido', `${this.toNumber(monstruo?.Defensa?.Desprevenido)}`);
        this.trySetText(form, 'pg', `${this.toNumber((monstruo as any)?.Vida)}`);

        const mods = this.calcularBonosDotesMonstruo(monstruo);
        this.trySetText(form, 'mod_varios_presa', `${mods.presa}`);
        this.trySetText(form, 'mod_varios_iniciativa', `${mods.iniciativa}`);
        this.trySetText(form, 'mod_varios_fortaleza', `${mods.fortaleza}`);
        this.trySetText(form, 'mod_varios_reflejos', `${mods.reflejos}`);
        this.trySetText(form, 'mod_varios_voluntad', `${mods.voluntad}`);

        this.trySetText(form, 'fort_clase', `${this.toNumber(monstruo?.Salvaciones?.Fortaleza)}`);
        this.trySetText(form, 'mod_magico_fortaleza', '0');
        this.trySetText(form, 'ref_clase', `${this.toNumber(monstruo?.Salvaciones?.Reflejos)}`);
        this.trySetText(form, 'mod_magico_reflejos', '0');
        this.trySetText(form, 'vol_clase', `${this.toNumber(monstruo?.Salvaciones?.Voluntad)}`);
        this.trySetText(form, 'mod_magico_voluntad', '0');

        this.trySetText(form, 'rc', `${monstruo?.Defensa?.Resistencia_conjuros ?? ''}`);
        const ataqueBase = this.toNumber(monstruo?.Ataque?.Ataque_base);
        this.trySetText(form, 'ataque_base', `${ataqueBase}`);
        this.trySetText(form, 'mod_ataque_base', `${ataqueBase}`);
        this.trySetText(form, 'velocidad', `${this.toNumber(monstruo?.Movimientos?.Correr)}`);
    }

    private rellenarHabilidadesMonstruo(form: any, monstruo: MonstruoDetalle): void {
        const habilidades = Array.isArray(monstruo?.Habilidades) ? monstruo.Habilidades : [];
        let contadorCustom = 1;
        habilidades.forEach((habilidad) => {
            const id = this.toNumber((habilidad as any)?.Id_habilidad ?? (habilidad as any)?.Id);
            if (id <= 0)
                return;

            const index = id - 1;
            if ((habilidad as any)?.Clasea === true || (habilidad as any)?.Clasea === 1)
                this.tryCheck(form, `clasea${index}`, true);
            this.trySetText(form, `rangos${index}`, `${this.toNumber(habilidad?.Rangos)}`);

            const extra = `${(habilidad as any)?.Extra ?? ''}`.trim();
            const custom = (habilidad as any)?.Custom === true;
            if (extra.length > 0 && extra.toLowerCase() !== 'elegir') {
                this.trySetText(form, `extra${index}`, extra);
                return;
            }

            if (custom && contadorCustom < 3) {
                const caracteristica = `${(habilidad as any)?.Caracteristica ?? ''}`.trim();
                this.trySetText(form, `custom${contadorCustom}`, `${(habilidad as any)?.Habilidad ?? (habilidad as any)?.Nombre ?? ''}`.trim());
                this.trySetText(form, `car${contadorCustom}`, caracteristica.substring(0, 3).toUpperCase());
                this.trySetText(form, `mod_custom${contadorCustom}`, `${this.calcularModHabilidadMonstruo(monstruo, habilidad)}`);
                this.trySetText(form, `rangos_custom${contadorCustom}`, `${this.toNumber(habilidad?.Rangos)}`);
                this.trySetText(form, `varios_custom${contadorCustom}`, `${this.toNumber((habilidad as any)?.Rangos_varios)}`);
                contadorCustom++;
                return;
            }

            this.trySetText(form, `varios${index}`, `${this.toNumber((habilidad as any)?.Rangos_varios)}`);
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

        const rasgos = this.toArray((monstruo as any)?.Tipo?.Rasgos);
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
            this.trySetText(form, `conjuro${cont}`, extra.length > 0 && extra !== 'No aplica' ? `${nombre} (${extra})` : nombre);
            this.trySetText(form, `desc_con${cont}`, `${doteCtx?.Dote?.Descripcion ?? ''}`.trim());
            this.trySetText(form, `pag_con${cont}`, `${doteCtx?.Dote?.Manual?.Nombre ?? ''} ${this.toNumber(doteCtx?.Dote?.Manual?.Pagina)}`.trim());
            cont++;
        });

        const especiales = this.toArray((monstruo as any)?.Especiales);
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
            this.trySetText(form, `conjuro${cont}`, `${nombre} como lanzador de nivel: ${this.toNumber(sortilega?.Nivel_lanzador)} (${sortilega?.Usos_diarios ?? ''})`);
            this.trySetText(form, `desc_con${cont}`, `${sortilega?.Conjuro?.Descripcion ?? ''}`.trim());
            this.trySetText(form, `pag_con${cont}`, `${sortilega?.Conjuro?.Manual ?? ''}`.trim());
            cont++;
        });
    }

    private resolverEtiquetaRazaCompania(monstruo: MonstruoDetalle, esFamiliar: boolean): string {
        const nombreBase = `${monstruo?.Nombre ?? ''}`.trim();
        const idPlantilla = this.toNumber((monstruo as any)?.Plantilla?.Id ?? (monstruo as any)?.Id_plantilla);
        if (nombreBase.length < 1)
            return '-';

        if (esFamiliar) {
            if (idPlantilla === 3)
                return `${nombreBase} celestial`;
            if (idPlantilla === 4)
                return `${nombreBase} remendado`;
            if (idPlantilla === 5)
                return `${nombreBase} mejorado`;
            return nombreBase;
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
        if (this.toNumber(tipo?.Come) === 1)
            notas.push('Debes comer');
        if (this.toNumber(tipo?.Respira) === 1)
            notas.push('Debes respirar');
        if (this.toNumber(tipo?.Duerme) === 1)
            notas.push('Debes dormir');
        if (this.toNumber(tipo?.Recibe_criticos) === 0 || this.toNumber(tipo?.Criticos) === 1)
            notas.push('No puedes recibir criticos');
        if (this.toNumber(tipo?.Puede_ser_flanqueado) === 0 || this.toNumber(tipo?.Flanqueado) === 1)
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
                const valor = this.toNumber(value);
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

    private calcularModHabilidadMonstruo(monstruo: MonstruoDetalle, habilidad: any): number {
        const idCar = this.toNumber(habilidad?.Id_caracteristica);
        if (idCar === 1)
            return this.calcularModificador(this.toNumber(monstruo?.Caracteristicas?.Fuerza));
        if (idCar === 2)
            return this.calcularModificador(this.toNumber(monstruo?.Caracteristicas?.Destreza));
        if (idCar === 3)
            return this.calcularModificador(this.toNumber(monstruo?.Caracteristicas?.Constitucion));
        if (idCar === 4)
            return this.calcularModificador(this.toNumber(monstruo?.Caracteristicas?.Inteligencia));
        if (idCar === 5)
            return this.calcularModificador(this.toNumber(monstruo?.Caracteristicas?.Sabiduria));
        if (idCar === 6)
            return this.calcularModificador(this.toNumber(monstruo?.Caracteristicas?.Carisma));
        return 0;
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
            .filter((nivel) => Math.trunc(this.toNumber(nivel?.nivelLanzador)) > 0)
            .sort((a, b) => `${a?.nombreClase ?? ''}`.localeCompare(`${b?.nombreClase ?? ''}`, 'es', { sensitivity: 'base' }));
        if (niveles.length < 1)
            return '';

        const lineas = niveles.map((nivel) => this.formatearLineaNivelLanzador(nivel));
        return `\r\n\r\nNiveles de lanzador:\r\n${lineas.join('\r\n')}`;
    }

    private formatearLineaNivelLanzador(nivel: PersonajeNivelLanzadorResumen): string {
        const tipo = this.formatearTipoLanzamiento(nivel?.tipoLanzamiento);
        const tipoLabel = tipo.length > 0 ? ` (${tipo})` : '';
        const nivelLanzador = Math.max(0, Math.trunc(this.toNumber(nivel?.nivelLanzador)));
        const base = Math.max(0, Math.trunc(this.toNumber(nivel?.nivelLanzadorBase)));
        const bonus = Math.max(0, Math.trunc(this.toNumber(nivel?.bonusNivelLanzador)));
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
        if (tipo === 'alma')
            return 'alma';
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

    private esEspecialidadValida(nombre: string, calificativo: string): boolean {
        const nombreNorm = this.normalizarTexto(nombre);
        const calificativoNorm = this.normalizarTexto(calificativo);
        if (nombreNorm.length < 1 || calificativoNorm.length < 1)
            return false;
        const placeholders = new Set([
            'cualquiera',
            'ninguno',
            'ninguna',
            'no aplica',
            'no especifica',
            'sin especialidad',
            'sin disciplina',
            'n/a',
            '-',
        ]);
        return !placeholders.has(nombreNorm) && !placeholders.has(calificativoNorm);
    }

    private obtenerRacialesParaFicha(pj: Personaje): Array<{ nombre: string; origen: string; }> {
        const base = this.toArray((pj as any)?.Raciales);
        const fallbackRaza = this.toArray((pj as any)?.Raza?.Raciales);
        const fuente = base.length > 0 ? base : fallbackRaza;
        const vistos = new Set<string>();
        const raciales: Array<{ nombre: string; origen: string; }> = [];

        fuente.forEach((entrada: any) => {
            const nombre = `${entrada?.Nombre ?? entrada?.nombre ?? ''}`.trim();
            if (nombre.length < 1)
                return;
            const origen = `${entrada?.Origen ?? entrada?.origen ?? ''}`.trim();
            const clave = `${this.normalizarTexto(nombre)}|${this.normalizarTexto(origen)}`;
            if (vistos.has(clave))
                return;
            vistos.add(clave);
            raciales.push({ nombre, origen });
        });

        return raciales;
    }

    private getAjusteNivelParaFicha(pj: Personaje): number {
        const desdePlantillas = (pj?.Plantillas ?? [])
            .reduce((acum, plantilla) => acum + this.toNumber((plantilla as any)?.Ajuste_nivel), 0);
        return Math.max(0, Math.trunc(desdePlantillas));
    }

    private calcularExpSiguienteNivel(pj: Personaje, ajusteNivel: number): number {
        let nivelClases = (pj?.desgloseClases ?? [])
            .reduce((acum, clase) => acum + Math.max(0, Math.trunc(this.toNumber(clase?.Nivel))), 0);
        if (nivelClases <= 0) {
            const clasesTexto = `${pj?.Clases ?? ''}`;
            const coincidencias = (clasesTexto.match(/\((\d+)\)/g) ?? []) as string[];
            nivelClases = coincidencias.reduce((acum: number, bloque: string) => {
                const limpio = bloque.replace(/[()]/g, '');
                return acum + Math.max(0, Math.trunc(this.toNumber(limpio)));
            }, 0);
        }
        const nivelObjetivo = Math.max(0, nivelClases + Math.max(0, Math.trunc(this.toNumber(ajusteNivel))));
        let acumulado = 0;
        for (let i = 0; i <= nivelObjetivo; i++)
            acumulado += i * 1000;
        return acumulado;
    }

    private normalizarTexto(value: any): string {
        return `${value ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private sumMods(mods: any): number {
        const arr = Array.isArray(mods) ? mods : [];
        return arr.reduce((acum, mod) => acum + this.toNumber((mod as any)?.valor ?? (mod as any)?.Valor), 0);
    }

    private formatSigned(value: number): string {
        const v = this.toNumber(value);
        return v > 0 ? `+${v}` : `${v}`;
    }

    private calcularModificador(valor: number): number {
        return Math.floor((this.toNumber(valor) - 10) / 2);
    }

    private toArray(value: any): any[] {
        if (Array.isArray(value))
            return value;
        if (value && typeof value === 'object')
            return Object.values(value);
        return [];
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
