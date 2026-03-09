import { Injectable } from '@angular/core';
import { PersonajeSimple } from '../../interfaces/simplificaciones/personaje-simple';
import { Database, getDatabase, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { RazaSimple } from 'src/app/interfaces/simplificaciones/raza-simple';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class ListaPersonajesService {

    constructor(private db: Database, private http: HttpClient) { }

    async getPersonajes(): Promise<Observable<PersonajeSimple[]>> {
        return new Observable((observador) => {
            const dbRef = ref(this.db, 'Personajes-simples');
            let unsubscribe: Unsubscribe;

            const onNext = (snapshot: any) => {
                const Personajes: PersonajeSimple[] = [];
                snapshot.forEach((obj: any) => {
                    const idRegion = Math.max(0, Math.trunc(toNumber(
                        obj.child('Id_region').val()
                        ?? obj.child('id_region').val()
                        ?? obj.child('idRegion').val()
                        ?? obj.child('Region').child('Id').val()
                        ?? obj.child('Region').child('id').val()
                        ?? obj.child('region').child('Id').val()
                        ?? obj.child('region').child('id').val()
                    )));
                    const nombreRegion = `${obj.child('Region').child('Nombre').val()
                        ?? obj.child('Region').child('nombre').val()
                        ?? obj.child('region').child('Nombre').val()
                        ?? obj.child('region').child('nombre').val()
                        ?? ''}`.trim();
                    const pj: PersonajeSimple = {
                        Id: obj.key,
                        Nombre: obj.child('Nombre').val(),
                        ownerUid: obj.child('ownerUid').val() ?? null,
                        ownerDisplayName: extractOwnerDisplayName({
                            ownerDisplayName: obj.child('ownerDisplayName').val(),
                            owner_display_name: obj.child('owner_display_name').val(),
                            odn: obj.child('odn').val(),
                        }),
                        visible_otros_usuarios: toBoolean(obj.child('visible_otros_usuarios').val()),
                        Id_region: idRegion,
                        Region: {
                            Id: idRegion,
                            Nombre: nombreRegion.length > 0 ? nombreRegion : (idRegion === 0 ? 'Sin región' : ''),
                        },
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
                cell: (pj: PersonajeSimple) => `${pj.Raza.Nombre}`,
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

    pjs(): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const personajes = this.http.get(`${environment.apiUrl}personajes/simplificados`);
        return personajes;
    }

    public async RenovarPersonajesSimples(): Promise<boolean> {
        const db = getDatabase();
        try {
            const response = await firstValueFrom(this.pjs());
            const personajes = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                personajes.map((element: any) => {
                    const idRegion = Math.max(0, Math.trunc(toNumber(
                        element?.id_region
                        ?? element?.idRegion
                        ?? element?.Region?.Id
                        ?? element?.Region?.id
                        ?? element?.region?.Id
                        ?? element?.region?.id
                    )));
                    const nombreRegion = `${element?.Region?.Nombre
                        ?? element?.Region?.nombre
                        ?? element?.region?.Nombre
                        ?? element?.region?.nombre
                        ?? ''}`.trim();
                    return set(ref(db, `Personajes-simples/${element.i}`), {
                        Nombre: element.n,
                        ownerUid: extractOwnerUid(element),
                        ownerDisplayName: extractOwnerDisplayName(element),
                        visible_otros_usuarios: toBoolean(element.visible_otros_usuarios),
                        Id_region: idRegion,
                        Region: {
                            Id: idRegion,
                            Nombre: nombreRegion.length > 0 ? nombreRegion : (idRegion === 0 ? 'Sin región' : ''),
                        },
                        Raza: element.r as RazaSimple,
                        Clases: element.c,
                        Contexto: element.co,
                        Personalidad: element.p,
                        Campaña: element.ca,
                        Trama: element.t,
                        Subtrama: element.s,
                        Archivado: element.a,
                    });
                })
            );

            Swal.fire({
                icon: 'success',
                title: 'Listado de personajes simple actualizado con éxito',
                showConfirmButton: true,
                timer: 2000
            });
            return true;
        } catch (error: any) {
            Swal.fire({
                icon: 'warning',
                title: 'Error al actualizar el listado de personajes simple',
                text: error?.message ?? 'Error no identificado',
                showConfirmButton: true
            });
            return false;
        }
    }
}

function toBoolean(value: any): boolean {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value === 1;
    if (typeof value === 'string') {
        const normalizado = value.trim().toLowerCase();
        return normalizado === '1' || normalizado === 'true' || normalizado === 'si' || normalizado === 'sí';
    }
    return false;
}

function toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function extractOwnerUid(value: any): string | null {
    if (!value || typeof value !== 'object')
        return null;

    const text = `${value.ownerUid ?? value.owneruid ?? value.owner_uid ?? value.uid ?? ''}`.trim();
    return text.length > 0 ? text : null;
}

function extractOwnerDisplayName(value: any): string | null {
    if (!value || typeof value !== 'object')
        return null;

    const text = `${value.ownerDisplayName ?? value.owner_display_name ?? value.odn ?? ''}`.trim();
    return text.length > 0 ? text : null;
}
