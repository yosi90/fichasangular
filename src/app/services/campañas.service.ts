import { Injectable } from '@angular/core';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Campana } from '../interfaces/campaña';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class CampañasService {
    constructor(public db: Database, private http: HttpClient) { }

    async getListCampañas(): Promise<Observable<Campana[]>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Campañas');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Campañas: Campana[] = [];
                snapshot.forEach((obj: any) => {
                    const campaña: Campana = {
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
        const campañas = this.http.get(`${environment.apiUrl}campanas`);
        return campañas;
    }

    private getTramas(idCam: number): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const params = new HttpParams().set('id_campana', idCam)
        const campañas = this.http.get(`${environment.apiUrl}tramas`, { params });
        return campañas;
    }

    private getSubtramas(idTra: number): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const params = new HttpParams().set('id_trama', idTra)
        const campañas = this.http.get(`${environment.apiUrl}subtramas`, { params });
        return campañas;
    }

    public async RenovarCampañasFirebase() {
        const db = getDatabase();
        let campañas: Campana[] = [];

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
                Swal.fire({
                    icon: 'success',
                    title: 'Listado de campañas, tramas y subtramas actualizado con éxito',
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            onerror = (error: any) => {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error al actualizar el listado de campañas, tramas y subtramas',
                    text: error,
                    showConfirmButton: true
                });
            }
        );
    }

}
