import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ManualAsociadoDetalle } from '../interfaces/manual-asociado';

@Injectable({
    providedIn: 'root'
})
export class ManualVistaNavigationService {
    private readonly aperturaManualSubject = new Subject<ManualAsociadoDetalle>();
    readonly aperturas$: Observable<ManualAsociadoDetalle> = this.aperturaManualSubject.asObservable();

    emitirApertura(manual: ManualAsociadoDetalle): void {
        this.aperturaManualSubject.next(manual);
    }
}

