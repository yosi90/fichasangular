import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { Conjuro } from "../interfaces/conjuro";

@Injectable({
    providedIn: 'root'
})
export class ConjuroService {

    constructor(private db: Database, private http: HttpClient) { }

    getConjuro(id: number): Observable<Conjuro> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Conjuros/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let conjuro: Conjuro = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    Descripcion: snapshot.child('Descripcion').val(),
                    Tiempo_lanzamiento: snapshot.child('Tiempo_lanzamiento').val(),
                    Alcance: snapshot.child('Alcance').val(),
                    Escuela: snapshot.child('Escuela').val(),
                    Disciplina: snapshot.child('Disciplina').val(),
                    Manual: snapshot.child('Manual').val(),
                    Objetivo: snapshot.child('Objetivo').val(),
                    Efecto: snapshot.child('Efecto').val(),
                    Area: snapshot.child('Area').val(),
                    Arcano: snapshot.child('Arcano').val(),
                    Divino: snapshot.child('Divino').val(),
                    Psionico: snapshot.child('Psionico').val(),
                    Alma: snapshot.child('Alma').val(),
                    Duracion: snapshot.child('Duracion').val(),
                    Tipo_salvacion: snapshot.child('Tipo_salvacion').val(),
                    Resistencia_conjuros: snapshot.child('Resistencia_conjuros').val(),
                    Resistencia_poderes: snapshot.child('Resistencia_poderes').val(),
                    Descripcion_componentes: snapshot.child('Descripcion_componentes').val(),
                    Permanente: snapshot.child('Permanente').val(),
                    Puntos_poder: snapshot.child('Puntos_poder').val(),
                    Descripcion_aumentos: snapshot.child('Descripcion_aumentos').val(),
                    Descriptores: snapshot.child('Descriptores').val(),
                    Nivel_clase: snapshot.child('Nivel_clase').val(),
                    Nivel_dominio: snapshot.child('Nivel_dominio').val(),
                    Nivel_disciplinas: snapshot.child('Nivel_disciplinas').val(),
                    Componentes: snapshot.child('Componentes').val(),
                    Oficial: snapshot.child('Oficial').val(),
                };
                observador.next(conjuro);
            };

            const onError = (error: any) => {
                observador.error(error);
            };
            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    getConjuros(): Observable<Conjuro[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Conjuros');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const conjuros: Conjuro[] = [];
                snapshot.forEach((obj: any) => {
                    const conjuro: Conjuro = {
                        Id: obj.child('Id').val(),
                        Nombre: obj.child('Nombre').val(),
                        Descripcion: obj.child('Descripcion').val(),
                        Tiempo_lanzamiento: obj.child('Tiempo_lanzamiento').val(),
                        Alcance: obj.child('Alcance').val(),
                        Escuela: obj.child('Escuela').val(),
                        Disciplina: obj.child('Disciplina').val(),
                        Manual: obj.child('Manual').val(),
                        Objetivo: obj.child('Objetivo').val(),
                        Efecto: obj.child('Efecto').val(),
                        Area: obj.child('Area').val(),
                        Arcano: obj.child('Arcano').val(),
                        Divino: obj.child('Divino').val(),
                        Psionico: obj.child('Psionico').val(),
                        Alma: obj.child('Alma').val(),
                        Duracion: obj.child('Duracion').val(),
                        Tipo_salvacion: obj.child('Tipo_salvacion').val(),
                        Resistencia_conjuros: obj.child('Resistencia_conjuros').val(),
                        Resistencia_poderes: obj.child('Resistencia_poderes').val(),
                        Descripcion_componentes: obj.child('Descripcion_componentes').val(),
                        Permanente: obj.child('Permanente').val(),
                        Puntos_poder: obj.child('Puntos_poder').val(),
                        Descripcion_aumentos: obj.child('Descripcion_aumentos').val(),
                        Descriptores: obj.child('Descriptores').val(),
                        Nivel_clase: obj.child('Nivel_clase').val(),
                        Nivel_dominio: obj.child('Nivel_dominio').val(),
                        Nivel_disciplinas: obj.child('Nivel_disciplinas').val(),
                        Componentes: obj.child('Componentes').val(),
                        Oficial: obj.child('Oficial').val(),
                    };
                    conjuros.push(conjuro);
                });
                observador.next(conjuros);
            };

            const onError = (error: any) => {
                observador.error(error);
            };

            unsubscribe = onValue(dbRef, onNext, onError);

            return () => {
                unsubscribe();
            };
        });
    }

    private syncConjuros(): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}conjuros`);
        return res;
    }

    public async RenovarConjuros() {
        const db_instance = getDatabase();
        this.syncConjuros().subscribe(
            response => {
                response.forEach((element: {
                    i: number; n: string; d: string; tl: any; ac: any; es: any; di: any; m: any; ob: any; ef: any; ar: any; arc: any; div: any; psi: any; alm: any; com: any; dur: any; t_s: any; 
                    r_c: any; r_p: any; d_c: any; per: any; pp: any; da: any; o: any; des: any; ncl: any; nd: any; ndis: any; coms: any;
                }) => {
                    set(
                        ref(db_instance, `Conjuros/${element.i}`), {
                        Id: element.i,
                        Nombre: element.n,
                        Descripcion: element.d,
                        Tiempo_lanzamiento: element.tl,
                        Alcance: element.ac,
                        Escuela: element.es,
                        Disciplina: element.di,
                        Manual: element.m,
                        Objetivo: element.ob,
                        Efecto: element.ef,
                        Area: element.ar,
                        Arcano: element.arc,
                        Divino: element.div,
                        Psionico: element.psi,
                        Alma: element.alm,
                        Duracion: element.dur,
                        Tipo_salvacion: element.t_s,
                        Resistencia_conjuros: element.r_c,
                        Resistencia_poderes: element.r_p,
                        Descripcion_componentes: element.d_c,
                        Permanente: element.per,
                        Puntos_poder: element.pp,
                        Descripcion_aumentos: element.da,
                        Descriptores: element.des,
                        Nivel_clase: element.ncl,
                        Nivel_dominio: element.nd,
                        Nivel_disciplinas: element.ndis,
                        Componentes: element.coms,
                        Oficial: element.o,
                    });
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Listado de conjuros actualizado con éxito',
                    showConfirmButton: true,
                    timer: 2000
                });
            },
            (error: any) => {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error al actualizar el listado de conjuros',
                    text: error.message,
                    showConfirmButton: true
                });
            }
        );
    }
}