import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Personaje } from '../interfaces/personaje';

@Injectable({
    providedIn: 'root'
})
export class PersonajeService {

    constructor(public db: Database, private http: HttpClient) { }

    async getDetallesPersonaje(id: number): Promise<Observable<Personaje>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Personajes/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let pj: Personaje = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    Raza: snapshot.child('Raza').val(),
                    desgloseClases: snapshot.child('Clases').val(),
                    Clases: snapshot.child('Clases').val().map((c: { Nombre: any; Nivel: any; }) => `${c.Nombre} (${c.Nivel})`).join(", "),
                    Personalidad: snapshot.child('Personalidad').val(),
                    Contexto: snapshot.child('Contexto').val(),
                    Campana: snapshot.child('Campana').val(),
                    Trama: snapshot.child('Trama').val(),
                    Subtrama: snapshot.child('Subtrama').val(),
                    Ataque_base: snapshot.child('Ataque_base').val(),
                    Tamano: snapshot.child('Tamano').val(),
                    ModTamano: snapshot.child('ModTamano').val(),
                    Ca: snapshot.child('Ca').val(),
                    Armadura_natural: snapshot.child('Armadura_natural').val(),
                    Ca_desvio: snapshot.child('Ca_desvio').val(),
                    Ca_varios: snapshot.child('Ca_varios').val(),
                    Iniciativa_varios: snapshot.child('Iniciativa_varios').val(),
                    Presa: snapshot.child('Presa').val(),
                    Presa_varios: snapshot.child('Presa_varios').val(),
                    Tipo_criatura: snapshot.child('Tipo_criatura').val(),
                    Subtipos: snapshot.child('Subtipos').val(),
                    Fuerza: snapshot.child('Fuerza').val(),
                    ModFuerza: snapshot.child('ModFuerza').val(),
                    Destreza: snapshot.child('Destreza').val(),
                    ModDestreza: snapshot.child('ModDestreza').val(),
                    Constitucion: snapshot.child('Constitucion').val(),
                    ModConstitucion: snapshot.child('ModConstitucion').val(),
                    Inteligencia: snapshot.child('Inteligencia').val(),
                    ModInteligencia: snapshot.child('ModInteligencia').val(),
                    Sabiduria: snapshot.child('Sabiduria').val(),
                    ModSabiduria: snapshot.child('ModSabiduria').val(),
                    Carisma: snapshot.child('Carisma').val(),
                    ModCarisma: snapshot.child('ModCarisma').val(),
                    Ajuste_nivel: snapshot.child('Ajuste_nivel').val(),
                    Nivel: snapshot.child('Nivel').val(),
                    Experiencia: snapshot.child('Experiencia').val(),
                    Deidad: snapshot.child('Deidad').val(),
                    Alineamiento: snapshot.child('Alineamiento').val(),
                    Genero: snapshot.child('Genero').val(),
                    Vida: snapshot.child('Vida').val(),
                    Correr: snapshot.child('Correr').val(),
                    Nadar: snapshot.child('Nadar').val(),
                    Volar: snapshot.child('Volar').val(),
                    Trepar: snapshot.child('Trepar').val(),
                    Escalar: snapshot.child('Escalar').val(),
                    Oficial: snapshot.child('Oficial').val(),
                    Dados_golpe: snapshot.child('Dados_golpe').val(),
                    Pgs_lic: snapshot.child('Pgs_lic').val(),
                    Dominios: snapshot.child('Dominios').val(),
                    Plantillas: snapshot.child('Plantillas').val(),
                    Conjuros: snapshot.child('Conjuros').val(),
                    Claseas: snapshot.child('Claseas').val(),
                    Raciales: snapshot.child('Raciales').val(),
                    Habilidades: snapshot.child('Habilidades').val(),
                    Dotes: snapshot.child('Dotes').val(),
                    Ventajas: snapshot.child('Ventajas').val(),
                    Idiomas: snapshot.child('Idiomas').val(),
                    Sortilegas: snapshot.child('Sortilegas').val(),
                    Archivado: false,
                    Jugador: snapshot.child('Jugador').val(),
                    Edad: snapshot.child('Edad').val(),
                    Altura: snapshot.child('Altura').val(),
                    Peso: snapshot.child('Peso').val(),
                    Salvaciones: snapshot.child('Salvaciones').val(),
                    Rd: snapshot.child('Rd').val(),
                    Rc: snapshot.child('Rc').val(),
                    Re: snapshot.child('Re').val(),
                    Capacidad_carga: snapshot.child('Capacidad_carga').val(),
                };
                observador.next(pj); // Emitir el array de personajes
            };

            const onError = (error: any) => {
                observador.error(error); // Manejar el error
            };

            // const onComplete = () => {
            //     observador.complete();  Completar el observable
            // };

            // unsubscribe = onValue(dbRef, onNext, onError, onComplete);
            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe(); // Cancelar la suscripción al evento onValue
            };
        });
    }

    d_pjs(): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const res = this.http.post('https://85.155.185.187:5000/personajes', { headers });
        return res;
    }

    public async RenovarPersonajes() {
        const db = getDatabase();
        this.d_pjs().subscribe(
            response => {
                response.forEach((element: {
                    i: any; n: any; dcp: any; dh: any; tm: any; a: any; ca: any; an: any; cd: any; cv: any; ra: any; tc: any; f: any; mf: any; d: any; md: any;
                    co: any; mco: any; int: any; mint: any; s: any; ms: any; car: any; mcar: any; aju: any; de: any; ali: any; g: any; ncam: any; ntr: any; ju: any;
                    nst: any; v: any; cor: any; na: any; vo: any; t: any; e: any; o: any; dg: any; cla: any; dom: any; stc: any; pla: any; con: any; esp: any;
                    espX: any; rac: any; hab: any; habN: any; habC: any; habCa: any; habMc: any; habR: any; habRv: any; habX: any; habV: any; habCu: any; dot: any;
                    dotX: any; dotO: any; ve: any; idi: any; sor: any; pgl: any; ini_v: any; pr_v: {Valor: number; Origen: string;}[]; edad: any; alt: any; 
                    peso: any; salv: any; rd: any; rc: any; re: any; ccl: any; ccm: any; ccp: any;
                }) => {
                    const tempcla = element.cla.split("|");
                    let nivel: number = 0;
                    let clas: { Nombre: string; Nivel: number }[] = [];
                    tempcla.forEach((el: string) => {
                        let datos = el.split(";");
                        if (datos[0] != "") {
                            clas.push({
                                Nombre: datos[0].trim(),
                                Nivel: +datos[1]
                            });
                            nivel += +datos[1];
                        }
                    });
                    if (element.aju)
                        nivel += +element.aju;
                    let experiencia: number = 0;
                    for (let i = 0; i < nivel; i++)
                        experiencia += i * 1000;
                    let dotes: { Nombre: string; Extra: string; Origen: string; }[] = [];
                    for (let index = 0; index < element.dot.length; index++) {
                        dotes.push({
                            Nombre: element.dot[index],
                            Extra: element.dotX[index],
                            Origen: element.dotO[index]
                        });
                    }
                    let claseas: { Nombre: string; Extra: string; }[] = [];
                    for (let index = 0; index < element.esp.length; index++) {
                        claseas.push({
                            Nombre: element.esp[index],
                            Extra: element.espX[index] ?? 'Nada',
                        });
                    }
                    let habilidades: {
                        Id: number; Nombre: string; Clasea: boolean; Car: string; Mod_car: number; Rangos: number; Rangos_varios: number; Extra: string;
                        Varios: string; Custom: boolean;
                    }[] = [];
                    for (let index = 0; index < element.habN.length; index++) {
                        habilidades.push({
                            Id: element.hab[index],
                            Nombre: element.habN[index],
                            Clasea: element.habC[index],
                            Car: element.habCa[index],
                            Mod_car: element.habMc[index],
                            Rangos: element.habR[index],
                            Rangos_varios: element.habRv[index],
                            Extra: element.habX[index],
                            Varios: element.habV[index],
                            Custom: element.habCu[index]
                        });
                    }
                    let cargas = {
                        Ligera: element.ccl,
                        Media: element.ccm,
                        Pesada: element.ccp
                    }
                    const dom: [] = element.dom.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const stc: [] = element.stc.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const con: [] = element.con.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const rac: [] = element.rac.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const ve: [] = element.ve.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const sor: [] = element.sor.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    set(ref(db, `Personajes/${element.i}`), {
                        Nombre: element.n,
                        Personalidad: element.dcp,
                        Contexto: element.dh,
                        Ataque_base: element.a,
                        Tamano: element.tm,
                        Ca: element.ca,
                        Armadura_natural: element.an,
                        Ca_desvio: element.cd,
                        Ca_varios: element.cv,
                        Iniciativa_varios: element.ini_v,
                        Presa: Number(+(element.a.includes('/') ? element.a.substring(0, element.a.indexOf('/')) : element.a) + +element.mf + +element.tm.Modificador_presa + +element.pr_v.reduce((c, v) => c + v.Valor, 0)),
                        Presa_varios: element.pr_v,
                        Raza: element.ra,
                        Tipo_criatura: element.tc,
                        Fuerza: element.f,
                        ModFuerza: element.mf,
                        Destreza: element.d,
                        ModDestreza: element.md,
                        Constitucion: element.co,
                        ModConstitucion: element.mco,
                        Inteligencia: element.int,
                        ModInteligencia: element.mint,
                        Sabiduria: element.s,
                        ModSabiduria: element.ms,
                        Carisma: element.car,
                        ModCarisma: element.mcar,
                        Ajuste_nivel: element.aju,
                        Nivel: nivel,
                        Experiencia: experiencia,
                        Deidad: element.de,
                        Alineamiento: element.ali,
                        Genero: element.g,
                        Campana: element.ncam,
                        Trama: element.ntr,
                        Subtrama: element.nst,
                        Vida: element.v,
                        Correr: element.cor,
                        Nadar: element.na,
                        Volar: element.vo,
                        Trepar: element.t,
                        Escalar: element.e,
                        Oficial: element.o,
                        Dados_golpe: element.dg,
                        Pgs_lic: element.pgl,
                        Jugador: element.ju,
                        Edad: element.edad,
                        Altura: element.alt,
                        Peso: element.peso,
                        Clases: clas,
                        Dominios: dom,
                        Subtipos: stc,
                        Plantillas: element.pla,
                        Conjuros: con,
                        Claseas: claseas,
                        Raciales: rac,
                        Habilidades: habilidades,
                        Dotes: dotes,
                        Ventajas: ve,
                        Idiomas: element.idi,
                        Sortilegas: sor,
                        Salvaciones: element.salv,
                        Rd: element.rd,
                        Rc: element.rc,
                        Re: element.re,
                        Capacidad_carga: cargas
                    })
                });
            },
            error => console.log(error)
        );
    }
}
