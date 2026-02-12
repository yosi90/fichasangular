import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { Tamano } from '../interfaces/tamaño';
import { Plantilla } from '../interfaces/plantilla';
import { DoteContextual } from '../interfaces/dote-contextual';
import { toDoteContextualArray } from './utils/dote-mapper';

@Injectable({
    providedIn: 'root'
})
export class PlantillaService {

    constructor(private db: Database, private http: HttpClient) { }

    async getPlantilla(id: number): Promise<Observable<Plantilla>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Plantillas/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const dotesContextuales = toDoteContextualArray(snapshot.child('DotesContextuales').val());
                let plantilla: Plantilla = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    Descripcion: snapshot.child('Descripcion').val(),
                    Manual: snapshot.child('Manual').val(),
                    Tamano: snapshot.child('Tamano').val(),
                    Dado_golpe: snapshot.child('Dado_golpe').val(),
                    Actualiza_dgs: snapshot.child('Actualiza_dgs').val(),
                    Modifica_dgs: snapshot.child('Modifica_dgs').val(),
                    Ataque_base: snapshot.child('Ataque_base').val(),
                    Iniciativa: snapshot.child('Iniciativa').val(),
                    Presa: snapshot.child('Presa').val(),
                    Velocidades: snapshot.child('Velocidades').val(),
                    Ca: snapshot.child('Ca').val(),
                    Ataques: snapshot.child('Ataques').val(),
                    Ataque_completo: snapshot.child('Ataque_completo').val(),
                    Reduccion_dano: snapshot.child('Reduccion_dano').val(),
                    Resistencia_conjuros: snapshot.child('Resistencia_conjuros').val(),
                    Resistencia_energia: snapshot.child('Resistencia_energia').val(),
                    Fortaleza: snapshot.child('Fortaleza').val(),
                    Reflejos: snapshot.child('Reflejos').val(),
                    Voluntad: snapshot.child('Voluntad').val(),
                    Fuerza: snapshot.child('Fuerza').val(),
                    Destreza: snapshot.child('Destreza').val(),
                    Constitucion: snapshot.child('Constitucion').val(),
                    Inteligencia: snapshot.child('Inteligencia').val(),
                    Sabiduria: snapshot.child('Sabiduria').val(),
                    Carisma: snapshot.child('Carisma').val(),
                    DotesContextuales: dotesContextuales,
                };
                observador.next(plantilla); // Emitir el array de personajes
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

    getPlantillas(): Observable<Plantilla[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Plantillas');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Plantillas: Plantilla[] = [];
                snapshot.forEach((obj: any) => {
                    const dotesContextuales = toDoteContextualArray(obj.child('DotesContextuales').val());
                    const plantilla: Plantilla = {
                        Id: obj.child('Id').val() ?? Number(obj.key),
                        Nombre: obj.child('Nombre').val(),
                        Descripcion: obj.child('Descripcion').val(),
                        Manual: obj.child('Manual').val(),
                        Tamano: obj.child('Tamano').val(),
                        Dado_golpe: obj.child('Dado_golpe').val(),
                        Actualiza_dgs: obj.child('Actualiza_dgs').val(),
                        Modifica_dgs: obj.child('Modifica_dgs').val(),
                        Ataque_base: obj.child('Ataque_base').val(),
                        Iniciativa: obj.child('Iniciativa').val(),
                        Presa: obj.child('Presa').val(),
                        Velocidades: obj.child('Velocidades').val(),
                        Ca: obj.child('Ca').val(),
                        Ataques: obj.child('Ataques').val(),
                        Ataque_completo: obj.child('Ataque_completo').val(),
                        Reduccion_dano: obj.child('Reduccion_dano').val(),
                        Resistencia_conjuros: obj.child('Resistencia_conjuros').val(),
                        Resistencia_energia: obj.child('Resistencia_energia').val(),
                        Fortaleza: obj.child('Fortaleza').val(),
                        Reflejos: obj.child('Reflejos').val(),
                        Voluntad: obj.child('Voluntad').val(),
                        Fuerza: obj.child('Fuerza').val(),
                        Destreza: obj.child('Destreza').val(),
                        Constitucion: obj.child('Constitucion').val(),
                        Inteligencia: obj.child('Inteligencia').val(),
                        Sabiduria: obj.child('Sabiduria').val(),
                        Carisma: obj.child('Carisma').val(),
                        DotesContextuales: dotesContextuales,
                    };
                    Plantillas.push(plantilla);
                });
                observador.next(Plantillas); // Emitir el array de personajes
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

    private syncPlantillas(): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const res = this.http.get(`${environment.apiUrl}plantillas`);
        return res;
    }

    public async RenovarPlantillas() {
        const db = getDatabase();
        this.syncPlantillas().subscribe(
            response => {
                response.forEach((element: {
                    i: number; n: string; d: string; m: string; ta: Tamano; da: any; act_dg: boolean; mod_dg: any; mod_tam: any; ini: number; vs: string; ca: string; a: number; p: number; as: string; ac: string; rd: string; rc: string; re: string;
                    f: number; r: number; v: number; fue: number; de: number; con: number; inte: number; sab: number; car: number; aju: number; o: boolean; dotes: DoteContextual[];
                }) => {
                    const dotesContextuales = toDoteContextualArray(element.dotes);
                    set(
                        ref(db, `Plantillas/${element.i}`), {
                            Id: element.i,
                            Nombre: element.n,
                            Descripcion: element.d,
                            Manual: element.m,
                            Tamano: element.ta,
                            Dado_golpe: element.da,
                            Actualiza_dgs: element.act_dg,
                            Modifica_dgs: element.mod_dg,
                            Modifica_tamano: element.mod_tam,
                            Ataque_base: element.a,
                            Iniciativa: element.ini,
                            Presa: element.p,
                            Velocidades: element.vs,
                            Ca: element.ca,
                            Ataques: element.as,
                            Ataque_completo: element.ac,
                            Reduccion_dano: element.rd,
                            Resistencia_conjuros: element.rc,
                            Resistencia_energia: element.re,
                            Fortaleza: element.f,
                            Reflejos: element.r,
                            Voluntad: element.v,
                            Fuerza: element.fue,
                            Destreza: element.de,
                            Constitucion: element.con,
                            Inteligencia: element.inte,
                            Sabiduria: element.sab,
                            Carisma: element.car,
                            Ajuste_nivel: element.aju,
                            Oficial: element.o,
                            DotesContextuales: dotesContextuales,
                    });
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Listado de plantillas actualizado con éxito',
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            (error: any) => {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error al actualizar el listado de plantillas',
                    text: error.message,
                    showConfirmButton: true
                });
            }
        );
    }
}
