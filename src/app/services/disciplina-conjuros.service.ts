import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { DisciplinaConjuros, Subdisciplinas } from "../interfaces/disciplina-conjuros";

@Injectable({
    providedIn: 'root'
})
export class DisciplinaConjurosService {

    constructor(private db: Database, private http: HttpClient) { }

    getDisciplina(id: number): Observable<DisciplinaConjuros> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `Disciplinas/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let disciplina: DisciplinaConjuros = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    Nombre_especial: snapshot.child('Nombre_especial').val(),
                    Subdisciplinas: snapshot.child('Subdisciplinas').val()
                };
                observador.next(disciplina);
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

    getDisciplinas(): Observable<DisciplinaConjuros[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Disciplinas');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const disciplinas: DisciplinaConjuros[] = [];
                snapshot.forEach((obj: any) => {
                    const disciplina: DisciplinaConjuros = {
                        Id: obj.child('Id').val(),
                        Nombre: obj.child('Nombre').val(),
                        Nombre_especial: obj.child('Nombre_especial').val(),
                        Subdisciplinas: obj.child('Subdisciplinas').val()
                    };
                    disciplinas.push(disciplina);
                });
                observador.next(disciplinas);
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
        const res = this.http.get(`${environment.apiUrl}disciplinas`);
        return res;
    }

    public async RenovarDisciplinas(): Promise<boolean> {
        const db_instance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncConjuros());
            const disciplinas = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                disciplinas.map((element: {
                    i: number; n: string; ne: string; sd: Subdisciplinas[];
                }) => {
                    return set(
                        ref(db_instance, `Disciplinas/${element.i}`), {
                        Id: element.i,
                        Nombre: element.n,
                        Nombre_especial: element.ne,
                        Subdisciplinas: element.sd
                    });
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de disciplinas actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de disciplinas',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}
