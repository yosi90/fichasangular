import { Injectable } from '@angular/core';
import { PersonajeSimple } from '../interfaces/personaje-simple';
import { Database, Unsubscribe, onValue, ref } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ListaPersonajesService {

    constructor(public db: Database) { }

    async getPersonajes(): Promise<Observable<PersonajeSimple[]>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Personajes');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Personajes: PersonajeSimple[] = [];
                snapshot.forEach((obj: any) => {
                    const pj: PersonajeSimple = {
                        Id: obj.key,
                        Nombre: obj.child('Nombre').val(),
                        Raza: obj.child('Raza').val(),
                        Clases: obj.child('Clases').val(),
                        Personalidad: obj.child('Personalidad').val(),
                        Contexto: obj.child('Contexto').val(),
                        Campana: obj.child('Campaña').val(),
                        Trama: obj.child('Trama').val(),
                        Subtrama: obj.child('Subtrama').val(),
                        Archivado: obj.child('Archivado').val(),
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

    public ceateDataTable() {
        let columns: ({ title: string; columnDef: string; header: string; cell: (pj: PersonajeSimple) => string; } | { title: string; columnDef: string; header: string; cell: (pj: PersonajeSimple) => boolean; })[] = [];
        columns = [
            {
                title: 'Nombre del personaje',
                columnDef: 'expand',
                header: 'Nombre',
                cell: (pj: PersonajeSimple) => `${pj.Nombre}`,
            },
            {
                title: 'Clases y nivel',
                columnDef: 'expand',
                header: 'Clases',
                cell: (pj: PersonajeSimple) => `${pj.Clases}`,
            },
            {
                title: 'Raza del personaje',
                columnDef: 'expand',
                header: 'Raza',
                cell: (pj: PersonajeSimple) => `${pj.Raza}`,
            },
            {
                title: 'Estado de la ficha',
                columnDef: 'expand',
                header: '¿Archivado?',
                cell: (pj: PersonajeSimple) => pj.Archivado,
            },
            {
                title: 'Personalidad del personaje',
                columnDef: 'expandedDetail',
                header: 'Personalidad',
                cell: (pj: PersonajeSimple) => `${pj.Personalidad}`,
            },
            {
                title: 'Contexto del personaje',
                columnDef: 'expandedDetail',
                header: 'Contexto',
                cell: (pj: PersonajeSimple) => `${pj.Contexto}`,
            },
            {
                title: 'Campaña en la que aparece',
                columnDef: 'expandedDetail',
                header: 'Campaña',
                cell: (pj: PersonajeSimple) => `${pj.Campana}`,
            },
            {
                title: 'Trama de la campaña',
                columnDef: 'expandedDetail',
                header: 'Trama',
                cell: (pj: PersonajeSimple) => `${pj.Trama}`,
            },
            {
                title: 'Subtrama de la trama',
                columnDef: 'expandedDetail',
                header: 'Subtrama',
                cell: (pj: PersonajeSimple) => `${pj.Subtrama}`,
            },
        ];
        return columns;
    }

    public RenovarLPsFirebase(): boolean{
        return false;
    }
}