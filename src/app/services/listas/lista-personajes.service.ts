import { Injectable } from '@angular/core';
import { PersonajeSimple } from '../../interfaces/simplificaciones/personaje-simple';
import { Database, Unsubscribe, onValue, ref, set } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { Observable, firstValueFrom, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { RazaSimple } from 'src/app/interfaces/simplificaciones/raza-simple';
import Swal from 'sweetalert2';
import { FirebaseInjectionContextService } from '../firebase-injection-context.service';

@Injectable({
    providedIn: 'root'
})
export class ListaPersonajesService {

    constructor(
        private auth: Auth,
        private db: Database,
        private http: HttpClient,
        private firebaseContextSvc: FirebaseInjectionContextService
    ) { }

    async getPersonajes(): Promise<Observable<PersonajeSimple[]>> {
        const headers = await this.buildAuthHeaders();
        const response = await firstValueFrom(this.pjs(headers));
        const personajes = (Array.isArray(response) ? response : Object.values(response ?? {}))
            .map((element: any) => this.mapApiToPersonajeSimple(element));
        return of(personajes);
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

    pjs(headers?: HttpHeaders): Observable<any> {
        const personajes = this.http.get(`${environment.apiUrl}personajes/simplificados`, headers ? { headers } : undefined);
        return personajes;
    }

    public async RenovarPersonajesSimples(): Promise<boolean> {
        try {
            const headers = await this.buildAuthHeaders();
            const response = await firstValueFrom(this.pjs(headers));
            const personajes = Array.isArray(response)
                ? response
                : Object.values(response ?? {});

            await Promise.all(
                personajes.map((element: any) => {
                    const personaje = this.mapApiToPersonajeSimple(element);
                    return this.firebaseContextSvc.run(() => {
                        return set(ref(this.db, `Personajes-simples/${element.i}`), {
                            Nombre: personaje.Nombre,
                            ownerUid: personaje.ownerUid,
                            ownerDisplayName: personaje.ownerDisplayName,
                            visible_otros_usuarios: personaje.visible_otros_usuarios,
                            Id_region: personaje.Id_region,
                            Region: {
                                Id: personaje.Region?.Id ?? 0,
                                Nombre: personaje.Region?.Nombre ?? '',
                            },
                            Raza: personaje.Raza as RazaSimple,
                            Clases: personaje.Clases,
                            Contexto: personaje.Contexto,
                            Personalidad: personaje.Personalidad,
                            Campaña: personaje.Campana,
                            Trama: personaje.Trama,
                            Subtrama: personaje.Subtrama,
                            Archivado: personaje.Archivado,
                        });
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

    private mapApiToPersonajeSimple(element: any): PersonajeSimple {
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

        return {
            Id: Math.trunc(toNumber(element?.i ?? element?.Id)),
            Nombre: `${element?.n ?? element?.Nombre ?? ''}`.trim(),
            ownerUid: extractOwnerUid(element),
            ownerDisplayName: extractOwnerDisplayName(element),
            visible_otros_usuarios: toBoolean(element?.visible_otros_usuarios),
            Id_region: idRegion,
            Region: {
                Id: idRegion,
                Nombre: nombreRegion.length > 0 ? nombreRegion : (idRegion === 0 ? 'Sin región' : ''),
            },
            Raza: (element?.r ?? element?.Raza) as RazaSimple,
            Clases: `${element?.c ?? element?.Clases ?? ''}`.trim(),
            Contexto: `${element?.co ?? element?.Contexto ?? ''}`.trim(),
            Personalidad: `${element?.p ?? element?.Personalidad ?? ''}`.trim(),
            Campana: `${element?.ca ?? element?.Campaña ?? element?.Campana ?? 'Sin campaña'}`.trim() || 'Sin campaña',
            Trama: `${element?.t ?? element?.Trama ?? 'Trama base'}`.trim() || 'Trama base',
            Subtrama: `${element?.s ?? element?.Subtrama ?? 'Subtrama base'}`.trim() || 'Subtrama base',
            Archivado: toBoolean(element?.a ?? element?.Archivado),
        };
    }

    private async buildAuthHeaders(): Promise<HttpHeaders> {
        const user = this.auth.currentUser;
        if (!user)
            throw new Error('Sesión no iniciada');

        const idToken = await user.getIdToken();
        if (`${idToken ?? ''}`.trim().length < 1)
            throw new Error('Token no disponible');

        return new HttpHeaders({
            Authorization: `Bearer ${idToken}`,
        });
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
