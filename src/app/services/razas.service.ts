import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Raza } from '../interfaces/raza';

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
                    Dgs_extra: snapshot.child('Dgs_extra').val(),
                    Ajuste_nivel: snapshot.child('Ajuste_nivel').val(),
                    Clase_predilecta: snapshot.child('Clase_predilecta').val(),
                    Homebrew: snapshot.child('Homebrew').val(),
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
                        Dgs_extra: obj.child('Dgs_extra').val(),
                        Ajuste_nivel: obj.child('Ajuste_nivel').val(),
                        Clase_predilecta: obj.child('Clase_predilecta').val(),
                        Homebrew: obj.child('Homebrew').val(),
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
        const res = this.http.post('https://85.155.186.112:5000/razas', { headers });
        return res;
    }

    public async RenovarRazas() {
        const db = getDatabase();
        this.syncRazas().subscribe(
            response => {
                response.forEach((element: {
                    i: any; n: any; m: { Fuerza: number; Destreza: number; Constitucion: number; Inteligencia: number; Sabiduria: number; Carisma: number; }; ma: any;
                    dg: any; aju: any; c: any; o: boolean;
                }) => {
                    set(ref(db, `Razas/${element.i}`), {
                        Nombre: element.n,
                        Modificadores: element.m,
                        Manual: element.ma,
                        Dgs_extra: element.dg,
                        Ajuste_nivel: element.aju,
                        Clase_predilecta: element.c,
                        Homebrew: element.o,
                    })
                });
            },
            error => console.log(error)
        );
    }
}
