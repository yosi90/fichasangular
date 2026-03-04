import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FichasDescargaJobView, FichasDescargaOpciones } from '../interfaces/fichas-descarga-background';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from '../interfaces/monstruo';
import { Personaje } from '../interfaces/personaje';
import { FichaPersonajeService } from './ficha-personaje.service';

@Injectable({
    providedIn: 'root'
})
export class FichasDescargaBackgroundService {
    private readonly ERROR_AUTOCLOSE_MS = 4500;
    private readonly jobsSubject = new BehaviorSubject<FichasDescargaJobView[]>([]);
    private readonly closeTimers = new Map<string, number>();
    private sequence = 0;

    readonly jobs$ = this.jobsSubject.asObservable();

    constructor(private fichaSvc: FichaPersonajeService) { }

    descargarFichas(personaje: Personaje, opciones: FichasDescargaOpciones): void {
        const nombre = this.resolverNombrePersonaje(personaje);
        const id = `${Date.now()}-${++this.sequence}`;
        const opcionesNormalizadas = this.normalizarOpciones(opciones);
        const pj = this.normalizarPersonaje(personaje, nombre);

        this.pushJob({
            id,
            personajeNombre: nombre,
            estado: 'running',
            mensaje: `Generando las fichas de ${nombre}`,
        });

        void this.ejecutarTrabajo(id, pj, opcionesNormalizadas);
    }

    private async ejecutarTrabajo(id: string, personaje: Personaje, opciones: FichasDescargaOpciones): Promise<void> {
        try {
            await this.fichaSvc.generarPDF(personaje);

            if (opciones.incluirConjuros && this.tieneConjuros(personaje))
                await this.fichaSvc.generarPDF_Conjuros(personaje);

            if (opciones.incluirFamiliares) {
                const familiares = this.toArray<FamiliarMonstruoDetalle>((personaje as any)?.Familiares);
                for (let i = 0; i < familiares.length; i++)
                    await this.fichaSvc.generarPDF_Familiar(personaje, familiares[i], i);
            }

            if (opciones.incluirCompaneros) {
                const companeros = this.toArray<CompaneroMonstruoDetalle>((personaje as any)?.Companeros);
                for (let i = 0; i < companeros.length; i++)
                    await this.fichaSvc.generarPDF_Companero(personaje, companeros[i], i);
            }

            this.removeJob(id);
        } catch (error: any) {
            const nombre = this.resolverNombrePersonaje(personaje);
            const motivo = this.resumirError(error);
            this.updateJob(id, {
                estado: 'error',
                mensaje: `No se pudieron generar las fichas de ${nombre}: ${motivo}`,
            });
            this.programarCierreError(id);
        }
    }

    private normalizarOpciones(opciones: FichasDescargaOpciones): FichasDescargaOpciones {
        return {
            incluirConjuros: !!opciones?.incluirConjuros,
            incluirFamiliares: !!opciones?.incluirFamiliares,
            incluirCompaneros: !!opciones?.incluirCompaneros,
        };
    }

    private normalizarPersonaje(personaje: Personaje, nombre: string): Personaje {
        return {
            ...personaje,
            Nombre: nombre,
            Conjuros: this.toArray((personaje as any)?.Conjuros),
            Sortilegas: this.toArray((personaje as any)?.Sortilegas),
            Familiares: this.toArray((personaje as any)?.Familiares),
            Companeros: this.toArray((personaje as any)?.Companeros),
        };
    }

    private resolverNombrePersonaje(personaje: Personaje): string {
        const nombre = `${personaje?.Nombre ?? ''}`.trim();
        return nombre.length > 0 ? nombre : 'personaje';
    }

    private tieneConjuros(personaje: Personaje): boolean {
        const conjuros = this.toArray((personaje as any)?.Conjuros);
        const sortilegas = this.toArray((personaje as any)?.Sortilegas);
        return conjuros.length > 0 || sortilegas.length > 0;
    }

    private resumirError(error: any): string {
        const message = `${error?.message ?? ''}`.trim();
        if (message.length > 0)
            return message;
        return 'Error no identificado';
    }

    private pushJob(job: FichasDescargaJobView): void {
        const next = [...this.jobsSubject.value, job];
        this.jobsSubject.next(next);
    }

    private updateJob(id: string, patch: Partial<FichasDescargaJobView>): void {
        const next = this.jobsSubject.value.map((job) => job.id === id ? { ...job, ...patch } : job);
        this.jobsSubject.next(next);
    }

    private removeJob(id: string): void {
        const timer = this.closeTimers.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.closeTimers.delete(id);
        }
        const next = this.jobsSubject.value.filter((job) => job.id !== id);
        this.jobsSubject.next(next);
    }

    private programarCierreError(id: string): void {
        const prevTimer = this.closeTimers.get(id);
        if (prevTimer !== undefined)
            clearTimeout(prevTimer);

        const timer = window.setTimeout(() => {
            this.closeTimers.delete(id);
            this.removeJob(id);
        }, this.ERROR_AUTOCLOSE_MS);
        this.closeTimers.set(id, timer);
    }

    private toArray<T>(value: any): T[] {
        if (Array.isArray(value))
            return value as T[];
        if (value && typeof value === 'object')
            return Object.values(value) as T[];
        return [];
    }
}
