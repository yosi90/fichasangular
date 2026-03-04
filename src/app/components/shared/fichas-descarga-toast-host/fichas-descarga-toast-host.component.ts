import { Component } from '@angular/core';
import { FichasDescargaJobView } from 'src/app/interfaces/fichas-descarga-background';
import { FichasDescargaBackgroundService } from 'src/app/services/fichas-descarga-background.service';

@Component({
    selector: 'app-fichas-descarga-toast-host',
    templateUrl: './fichas-descarga-toast-host.component.html',
    styleUrls: ['./fichas-descarga-toast-host.component.sass']
})
export class FichasDescargaToastHostComponent {
    readonly jobs$ = this.fichasDescargaSvc.jobs$;

    constructor(private fichasDescargaSvc: FichasDescargaBackgroundService) { }

    trackByJobId(_: number, job: FichasDescargaJobView): string {
        return job.id;
    }
}
