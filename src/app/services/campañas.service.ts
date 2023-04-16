import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Campaña } from '../interfaces/campaña';
import { Super } from '../interfaces/genericas';

@Injectable({
    providedIn: 'root'
})
export class CampañasService {
    constructor(public db: Database, private http: HttpClient) { }

    async getListCampañas(): Promise<Observable<Campaña[]>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Campañas');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Campañas: Campaña[] = [];
                snapshot.forEach((obj: any) => {
                    const campaña: Campaña = {
                        Id: obj.key,
                        Nombre: obj.child('Nombre').val(),
                        Tramas: obj.child('Tramas').val()
                    };
                    Campañas.push(campaña);
                });
                observador.next(Campañas); // Emitir el array de personajes
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

    private getCampañas(): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const campañas = this.http.post('http://127.0.0.1:5000/campañas', { headers });
        return campañas;
    }

    private getTramas(idCam: number): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const campañas = this.http.post('http://127.0.0.1:5000/tramas', idCam, { headers });
        return campañas;
    }

    private getSubtramas(idTra: number): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const campañas = this.http.post('http://127.0.0.1:5000/subtramas', idTra, { headers });
        return campañas;
    }

    // public async RenovarCampañasFirebase() {
    //     const db = getDatabase();
    //     let campañas: Campaña[] = [];
    //     this.getCampañas().subscribe(
    //         response => {
    //             let tramas: { Id: any; Nombre: any; Subtramas: { Id: any; Nombre: any; }[]; }[] = [];
    //             response.forEach((cam: any) => {
    //                 this.getTramas(cam.i).subscribe(
    //                     response => {
    //                         let subTramas: { Id: any; Nombre: any; }[] = [];
    //                         response.forEach((tra: any) => {
    //                             this.getSubtramas(tra.i).subscribe(
    //                                 response => {
    //                                     response.forEach((sub: any) => {
    //                                         subTramas.push({
    //                                             Id: sub.i,
    //                                             Nombre: sub.n
    //                                         });
    //                                     });
    //                                 },
    //                                 error => console.log(error)
    //                             );
    //                             tramas.push({
    //                                 Id: tra.i,
    //                                 Nombre: tra.n,
    //                                 Subtramas: subTramas
    //                             });
    //                         });
    //                     },
    //                     error => console.log(error)
    //                 );
    //                 campañas.push({
    //                     Id: cam.i,
    //                     Nombre: cam.n,
    //                     Tramas: tramas
    //                 });
    //             });
    //         },
    //         error => console.log(error)
    //     );
    //     console.log(campañas);
    //     if (campañas.length > 0)
    //         console.log('comenzamos');
    // }

    public async RenovarCampañasFirebase() {
        const db = getDatabase();
        let campañas: Campaña[] = [];

        this.getCampañas().subscribe(
            async (response: any) => {
                for (const cam of response) {
                    let tramas: { Id: any; Nombre: any; Subtramas: { Id: any; Nombre: any; }[]; }[] = [];

                    const tramasResponse = await this.getTramas(cam.i).toPromise();

                    for (const tra of tramasResponse) {
                        let subTramas: { Id: any; Nombre: any; }[] = [];

                        const subTramasResponse = await this.getSubtramas(tra.i).toPromise();

                        for (const sub of subTramasResponse) {
                            subTramas.push({
                                Id: sub.i,
                                Nombre: sub.n
                            });
                        }

                        tramas.push({
                            Id: tra.i,
                            Nombre: tra.n,
                            Subtramas: subTramas
                        });
                    }

                    campañas.push({
                        Id: cam.i,
                        Nombre: cam.n,
                        Tramas: tramas
                    });
                }
                if (campañas.length > 0) {
                    campañas.forEach((element) => {
                        set(ref(db, `Campañas/${element.Id}`), {
                            Nombre: element.Nombre,
                            Tramas: element.Tramas
                        })
                    })
                }
            },
            error => console.log(error)
        );
    }

}
