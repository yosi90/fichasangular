import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ManualReferenciaNavegacion } from '../interfaces/manual-referencia-navegacion';

@Injectable({
    providedIn: 'root'
})
export class ManualReferenciaNavigationService {
    private readonly aperturasSubject = new Subject<ManualReferenciaNavegacion>();
    readonly aperturas$: Observable<ManualReferenciaNavegacion> = this.aperturasSubject.asObservable();

    emitirApertura(payload: ManualReferenciaNavegacion): void {
        this.aperturasSubject.next(payload);
    }
}

