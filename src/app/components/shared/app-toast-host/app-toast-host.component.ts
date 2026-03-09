import { Component } from '@angular/core';
import { AppToast } from 'src/app/interfaces/app-toast';
import { AppToastService } from 'src/app/services/app-toast.service';

@Component({
    selector: 'app-app-toast-host',
    templateUrl: './app-toast-host.component.html',
    styleUrls: ['./app-toast-host.component.sass'],
    standalone: false
})
export class AppToastHostComponent {
    readonly toasts$ = this.appToastSvc.toasts$;

    constructor(private appToastSvc: AppToastService) { }

    trackByToastId(_: number, toast: AppToast): string {
        return toast.id;
    }

    dismiss(id: string): void {
        this.appToastSvc.dismiss(id);
    }
}
