import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppToast, AppToastType } from '../interfaces/app-toast';

interface AppToastOptions {
    durationMs?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AppToastService {
    private readonly toastsSubject = new BehaviorSubject<AppToast[]>([]);
    private readonly closeTimers = new Map<string, number>();
    private sequence = 0;

    readonly toasts$ = this.toastsSubject.asObservable();

    showSuccess(message: string, options?: AppToastOptions): void {
        this.show('success', message, options);
    }

    showError(message: string, options?: AppToastOptions): void {
        this.show('error', message, options);
    }

    showInfo(message: string, options?: AppToastOptions): void {
        this.show('info', message, options);
    }

    dismiss(id: string): void {
        const timer = this.closeTimers.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.closeTimers.delete(id);
        }

        const next = this.toastsSubject.value.filter((toast) => toast.id !== id);
        this.toastsSubject.next(next);
    }

    private show(type: AppToastType, rawMessage: string, options?: AppToastOptions): void {
        const message = `${rawMessage ?? ''}`.trim();
        if (message.length < 1)
            return;

        const id = `app-toast-${Date.now()}-${++this.sequence}`;
        const toast: AppToast = { id, message, type };
        this.toastsSubject.next([...this.toastsSubject.value, toast]);
        this.scheduleDismiss(id, this.resolveDuration(type, options?.durationMs));
    }

    private resolveDuration(type: AppToastType, explicit?: number): number {
        if (Number.isFinite(explicit) && Number(explicit) > 0)
            return Math.trunc(Number(explicit));
        if (type === 'success')
            return 3200;
        if (type === 'info')
            return 4200;
        return 5200;
    }

    private scheduleDismiss(id: string, durationMs: number): void {
        const previous = this.closeTimers.get(id);
        if (previous !== undefined)
            clearTimeout(previous);

        const timer = window.setTimeout(() => {
            this.closeTimers.delete(id);
            this.dismiss(id);
        }, durationMs);
        this.closeTimers.set(id, timer);
    }
}
