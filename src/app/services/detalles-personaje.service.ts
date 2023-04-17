import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DetallesPersonaje } from '../interfaces/detalles-personaje';

@Injectable({
    providedIn: 'root'
})
export class DetallesPersonajeService {

    constructor(public db: Database, private http: HttpClient) { }

    async getPersonajes(): Promise<Observable<DetallesPersonaje[]>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Personajes');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Personajes: DetallesPersonaje[] = [];
                snapshot.forEach((obj: any) => {
                    const pj: DetallesPersonaje = {
                        Id: obj.key,
                        Nombre: obj.child('Nombre').val(),
                        Raza: obj.child('Raza').val(),
                        Clases: obj.child('Clases').val(),
                        Personalidad: obj.child('Personalidad').val(),
                        Contexto: obj.child('Contexto').val(),
                        Campana: obj.child('Campaña').val(),
                        Trama: obj.child('Trama').val(),
                        Subtrama: obj.child('Subtrama').val()
                    };
                    Personajes.push(pj);
                });
                observador.next(Personajes); // Emitir el array de personajes
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
        const res = this.http.post('http://127.0.0.1:5000/detalles_personajes', { headers });
        return res;
    }

    public async RenovarDetallesPJsFirebase() {
        const db = getDatabase();
        this.d_pjs().subscribe(
            response => {
                response.forEach((element: {
                    i: any; n: any; dcp: any; dh: any; a: any; an: any; cd: any; ra: any; tc: any; f: any; d: any; co: any;
                    int: any; s: any; ca: any; aju: any; de: any; ali: any; g: any; ncam: any; ntr: any; nst: any; v: any; cor: any; na: any; vo:
                    any; t: any; e: any; o: any; dg: any; cla: any; dom: any; stc: any; pla: any; con: any; esp: any; rac: any; hab: any; dot: any;
                    ve: any; idi: any; sor: any;
                }) => {
                    const tempcla = element.cla.split("|");
                    let clas: { Nombre: string; Nivel: number }[] = [];
                    tempcla.forEach((el: string) => {
                        let datos = el.split(";");
                        if (datos[0] != "")
                            clas.push({
                                Nombre: datos[0].trim(),
                                Nivel: +datos[1]
                            });
                    });
                    const temphab = element.hab.split("|");
                    let hab: { Nombre: string; Rangos: number }[] = [];
                    temphab.forEach((el: string) => {
                        let datos = el.split(";");
                        if (datos[0] != "")
                            hab.push({
                                Nombre: datos[0].trim(),
                                Rangos: +datos[1]
                            });
                    });
                    const dom: [] = element.dom.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const stc: [] = element.stc.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const pla: [] = element.pla.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const con: [] = element.con.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const esp: [] = element.esp.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const rac: [] = element.rac.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const dot: [] = element.dot.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const ve: [] = element.ve.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const idi: [] = element.idi.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    const sor: [] = element.sor.split("|").map((item: string) => item.trim()).filter((item: string) => item.length > 0);
                    set(ref(db, `Detalles-personaje/${element.i}`), {
                        Nombre: element.n,
                        Personalidad: element.dcp,
                        Contexto: element.dh,
                        Ataque_base: element.a,
                        Armadura_natural: element.an,
                        Ca_desvio: element.cd,
                        Raza: element.ra,
                        Tipo_criatura: element.tc,
                        Fuerza: element.f,
                        Destreza: element.d,
                        Constitucion: element.co,
                        Inteligencia: element.int,
                        Sabiduria: element.s,
                        Carisma: element.ca,
                        Ajuste_nivel: element.aju,
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
                        Clases: clas,
                        Dominios: dom,
                        Subtipos: stc,
                        Plantillas: pla,
                        Conjuros: con,
                        Claseas: esp,
                        Raciales: rac,
                        Habilidades: hab,
                        Dotes: dot,
                        Ventajas: ve,
                        Idiomas: idi,
                        Sortilegas: sor
                    })
                });
            },
            error => console.log(error)
        );
    }
}
