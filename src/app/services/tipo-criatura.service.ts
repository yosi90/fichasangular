import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "src/environments/environment";
import Swal from "sweetalert2";
import { TipoCriatura } from "../interfaces/tipo_criatura";

@Injectable({
    providedIn: 'root'
})
export class TipoCriaturaService {

    constructor(private db: Database, private http: HttpClient) { }

    getTipoCriatura(id: number): Observable<TipoCriatura> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, `TiposCriatura/${id}`);
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                let tipoCriatura: TipoCriatura = {
                    Id: id,
                    Nombre: snapshot.child('Nombre').val(),
                    Descripcion: snapshot.child('Descripcion').val(),
                    Manual: snapshot.child('Manual').val(),
                    Id_tipo_dado: snapshot.child('Id_tipo_dado').val(),
                    Tipo_dado: snapshot.child('Tipo_dado').val(),
                    Id_ataque: snapshot.child('Id_ataque').val(),
                    Id_fortaleza: snapshot.child('Id_fortaleza').val(),
                    Id_reflejos: snapshot.child('Id_reflejos').val(),
                    Id_voluntad: snapshot.child('Id_voluntad').val(),
                    Id_puntos_habilidad: snapshot.child('Id_puntos_habilidad').val(),
                    Come: snapshot.child('Come').val(),
                    Respira: snapshot.child('Respira').val(),
                    Duerme: snapshot.child('Duerme').val(),
                    Recibe_criticos: snapshot.child('Recibe_críticos').val(),
                    Puede_ser_flanqueado: snapshot.child('Puede_ser_flanqueado').val(),
                    Pierde_constitucion: snapshot.child('Pierde_constitucion').val(),
                    Limite_inteligencia: snapshot.child('Limite_inteligencia').val(),
                    Tesoro: snapshot.child('Tesoro').val(),
                    Id_alineamiento: snapshot.child('Id_alineamiento').val(),
                    Rasgos: snapshot.child('Rasgos').val(),
                    Oficial: snapshot.child('Oficial').val(),
                };
                observador.next(tipoCriatura);
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

    getTiposCriatura(): Observable<TipoCriatura[]> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'TiposCriatura');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const TiposCriatura: TipoCriatura[] = [];
                snapshot.forEach((obj: any) => {
                    const tipoCriatura: TipoCriatura = {
                        Id: obj.child('Id').val(),
                        Nombre: obj.child('Nombre').val(),
                        Descripcion: obj.child('Descripcion').val(),
                        Manual: obj.child('Manual').val(),
                        Id_tipo_dado: obj.child('Id_tipo_dado').val(),
                        Tipo_dado: obj.child('Tipo_dado').val(),
                        Id_ataque: obj.child('Id_ataque').val(),
                        Id_fortaleza: obj.child('Id_fortaleza').val(),
                        Id_reflejos: obj.child('Id_reflejos').val(),
                        Id_voluntad: obj.child('Id_voluntad').val(),
                        Id_puntos_habilidad: obj.child('Id_puntos_habilidad').val(),
                        Come: obj.child('Come').val(),
                        Respira: obj.child('Respira').val(),
                        Duerme: obj.child('Duerme').val(),
                        Recibe_criticos: obj.child('Recibe_críticos').val(),
                        Puede_ser_flanqueado: obj.child('Puede_ser_flanqueado').val(),
                        Pierde_constitucion: obj.child('Pierde_constitucion').val(),
                        Limite_inteligencia: obj.child('Limite_inteligencia').val(),
                        Tesoro: obj.child('Tesoro').val(),
                        Id_alineamiento: obj.child('Id_alineamiento').val(),
                        Rasgos: obj.child('Rasgos').val(),
                        Oficial: obj.child('Oficial').val(),
                    };
                    TiposCriatura.push(tipoCriatura);
                });
                observador.next(TiposCriatura);
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

    private syncTiposCriatura(): Observable<any> {
        const res = this.http.get(`${environment.apiUrl}tiposCriatura`);
        return res;
    }

    public async RenovarTiposCriatura(): Promise<boolean> {
        const db_instance = getDatabase();
        try {
            const response = await firstValueFrom(this.syncTiposCriatura());
            const tipos = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                tipos.map((element: {
                    i: number; n: string; d: string; ma: any; itd: number; ntd: string; ia: number; ift: number; ir: number; iv: number; iph: number; c: boolean; r: Boolean; du: boolean; cr: boolean; f: boolean; pc: boolean;
                    li: number; t: string; ial: number; ra: any; o: boolean;
                }) => {
                    return set(
                        ref(db_instance, `TiposCriatura/${element.i}`), {
                        Id: element.i,
                        Nombre: element.n,
                        Descripcion: element.d,
                        Manual: element.ma,
                        Id_tipo_dado: element.itd,
                        Tipo_dado: element.ntd,
                        Id_ataque: element.ia,
                        Id_fortaleza: element.ift,
                        Id_reflejos: element.ir,
                        Id_voluntad: element.iv,
                        Id_puntos_habilidad: element.iph,
                        Come: element.c,
                        Respira: element.r,
                        Duerme: element.du,
                        Recibe_críticos: element.cr,
                        Puede_ser_flanqueado: element.f,
                        Pierde_constitucion: element.pc,
                        Limite_inteligencia: element.li,
                        Tesoro: element.t,
                        Id_alineamiento: element.ial,
                        Rasgos: element.ra,
                        Oficial: element.o
                    });
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de tipos de criatura actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de tipos de criatura',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}
