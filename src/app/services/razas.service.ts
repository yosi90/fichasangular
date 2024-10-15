import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Raza } from '../interfaces/raza';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { Maniobrabilidad } from '../interfaces/maniobrabilidad';
import { Tamaño } from '../interfaces/tamaño';

@Injectable({
    providedIn: 'root'
})
export class RazasService {

    constructor(public db: Database, private http: HttpClient) { }

    async getRaza(id: number): Promise<Observable<Raza>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Razas/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let raza: Raza = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    Modificadores: snapshot.child('Modificadores').val(),
                    Manual: snapshot.child('Manual').val(),
                    Ajuste_nivel: snapshot.child('Ajuste_nivel').val(),
                    Clase_predilecta: snapshot.child('Clase_predilecta').val(),
                    Homebrew: snapshot.child('Homebrew').val(),
                    Ataques_naturales: snapshot.child('Ataques_naturales').val(),
                    Tamano: snapshot.child('Tamano').val(),
                    Dgs_adicionales: snapshot.child('Dgs_adicionales').val(),
                    Reduccion_dano: snapshot.child('Reduccion_dano').val(),
                    Resistencia_magica: snapshot.child('Resistencia_magica').val(),
                    Resistencia_energia: snapshot.child('Resistencia_energia').val(),
                    Heredada: snapshot.child('Heredada').val(),
                    Mutada: snapshot.child('Mutada').val(),
                    Tamano_mutacion_dependiente: snapshot.child('Tamano_mutacion_pendiente').val(),
                    Prerrequisitos: snapshot.child('Prerrequisitos').val(),
                    Armadura_natural: snapshot.child('Armadura_natural').val(),
                    Varios_armadura: snapshot.child('Varios_armadura').val(),
                    Correr: snapshot.child('Correr').val(),
                    Nadar: snapshot.child('Nadar').val(),
                    Volar: snapshot.child('Volar').val(),
                    Maniobrabilidad: snapshot.child('Maniobrabilidad').val(),
                    Trepar: snapshot.child('Trepar').val(),
                    Escalar: snapshot.child('Escalar').val(),
                };
                observador.next(raza); // Emitir el array de personajes
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

    async getRazas(): Promise<Observable<Raza[]>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Razas');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Razas: Raza[] = [];
                snapshot.forEach((obj: any) => {
                    const raza: Raza = {
                        Id: obj.key,
                        Nombre: obj.child('Nombre').val(),
                        Modificadores: obj.child('Modificadores').val(),
                        Manual: obj.child('Manual').val(),
                        Ajuste_nivel: obj.child('Ajuste_nivel').val(),
                        Clase_predilecta: obj.child('Clase_predilecta').val(),
                        Homebrew: obj.child('Homebrew').val(),
                        Ataques_naturales: obj.child('Ataques_naturales').val(),
                        Tamano: obj.child('Tamano').val(),
                        Dgs_adicionales: obj.child('Dgs_adicionales').val(),
                        Reduccion_dano: obj.child('Reduccion_dano').val(),
                        Resistencia_magica: obj.child('Resistencia_magica').val(),
                        Resistencia_energia: obj.child('Resistencia_energia').val(),
                        Heredada: obj.child('Heredada').val(),
                        Mutada: obj.child('Mutada').val(),
                        Tamano_mutacion_dependiente: obj.child('Tamano_mutacion_pendiente').val(),
                        Prerrequisitos: obj.child('Prerrequisitos').val(),
                        Armadura_natural: obj.child('Armadura_natural').val(),
                        Varios_armadura: obj.child('Varios_armadura').val(),
                        Correr: obj.child('Correr').val(),
                        Nadar: obj.child('Nadar').val(),
                        Volar: obj.child('Volar').val(),
                        Maniobrabilidad: obj.child('Maniobrabilidad').val(),
                        Trepar: obj.child('Trepar').val(),
                        Escalar: obj.child('Escalar').val(),
                    };
                    Razas.push(raza);
                });
                observador.next(Razas); // Emitir el array de personajes
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

    private syncRazas(): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const res = this.http.get(`${environment.apiUrl}razas`);
        return res;
    }

    public async RenovarRazas() {
        const db = getDatabase();
        this.syncRazas().subscribe(
            response => {
                response.forEach((element: {
                    i: any; n: any; m: { Fuerza: number; Destreza: number; Constitucion: number; Inteligencia: number; Sabiduria: number; Carisma: number; }; ma: any;
                    aju: any; c: any; o: boolean; an: string; t: Tamaño; dg: any; rd: string; rc: string; re: string; he: boolean; mu: boolean; tmd: boolean; pr: any;
                    am: number; vm: number; co: number; na: number; vo: number; man: Maniobrabilidad; tr: number; es: number;
                }) => {
                    set(
                        ref(db, `Razas/${element.i}`), {
                        Nombre: element.n,
                        Modificadores: element.m,
                        Manual: element.ma,
                        Ajuste_nivel: element.aju,
                        Clase_predilecta: element.c,
                        Homebrew: element.o,
                        Ataques_naturales: element.an,
                        Tamano: element.t,
                        Dgs_adicionales: element.dg,
                        Reduccion_dano: element.rd,
                        Resistencia_magia: element.rc,
                        Resistencia_energia: element.re,
                        Heredada: element.he,
                        Mutada: element.mu,
                        Tamano_mutacion_dependiente: element.tmd,
                        Prerrequisitos: element.pr,
                        Armadura_natural: element.am,
                        Varios_armadura: element.vm,
                        Correr: element.co,
                        Nadar: element.na,
                        Volar: element.vo,
                        Maniobrabilidad: element.man,
                        Trepar: element.tr,
                        Escalar: element.es,
                    });
                    if(element.pr)
                        console.log(element.pr);
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Listado de razas actualizado con éxito',
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            // error => console.log(error)
            onerror = (error: any) => {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error al actualizar el listado de razas',
                    text: error,
                    showConfirmButton: true
                });
            }
        );
    }
}
