import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppToast, AppToastOptions, AppToastType } from '../interfaces/app-toast';
import { SessionNotificationCenterService } from './session-notification-center.service';
import { SocialAlertPreferencesService } from './social-alert-preferences.service';

@Injectable({
    providedIn: 'root'
})
export class AppToastService {
    private readonly toastsSubject = new BehaviorSubject<AppToast[]>([]);
    private readonly closeTimers = new Map<string, number>();
    private sequence = 0;

    readonly toasts$ = this.toastsSubject.asObservable();

    constructor(
        private socialAlertPrefsSvc?: SocialAlertPreferencesService,
        private sessionNotificationCenterSvc?: SessionNotificationCenterService,
    ) { }

    showSuccess(message: string, options?: AppToastOptions): void {
        this.show('success', message, options);
    }

    showError(message: string, options?: AppToastOptions): void {
        this.show('error', message, options);
    }

    showInfo(message: string, options?: AppToastOptions): void {
        this.show('info', message, options);
    }

    showSystem(message: string, options?: AppToastOptions): void {
        this.show('system', message, options);
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
        if (type !== 'error' && options?.category && this.socialAlertPrefsSvc?.isEnabled(options.category) === false)
            return;

        const explicitDedupeKey = `${options?.dedupeKey ?? ''}`.trim();
        const dedupeKey = this.resolveDedupeKey(type, message, options);
        const durationMs = this.resolveDuration(type, options?.durationMs);
        const existing = dedupeKey
            ? this.toastsSubject.value.find((toast) => toast.dedupeKey === dedupeKey) ?? null
            : null;
        const toast: AppToast = {
            id: existing?.id ?? `app-toast-${Date.now()}-${++this.sequence}`,
            dedupeKey,
            message,
            type,
            category: options?.category,
            createdAt: Date.now(),
            durationMs,
            repeatCount: existing && this.sameToastSignature(existing, type, message, options?.category, explicitDedupeKey.length > 0)
                ? existing.repeatCount + 1
                : 1,
        };
        this.toastsSubject.next(existing
            ? [...this.toastsSubject.value.filter((item) => item.id !== existing.id), toast]
            : [...this.toastsSubject.value, toast]);
        if (options?.captureSessionNotification !== false)
            this.sessionNotificationCenterSvc?.captureToast(type, message);
        this.scheduleDismiss(toast.id, durationMs);
    }

    private resolveDuration(type: AppToastType, explicit?: number): number {
        if (Number.isFinite(explicit) && Number(explicit) > 0)
            return Math.trunc(Number(explicit));
        if (type === 'success')
            return 3200;
        if (type === 'info')
            return 4200;
        if (type === 'system')
            return 7600;
        return 7200;
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

    private resolveDedupeKey(type: AppToastType, message: string, options?: AppToastOptions): string | null {
        const explicit = `${options?.dedupeKey ?? ''}`.trim();
        if (explicit.length > 0)
            return explicit;
        const category = `${options?.category ?? ''}`.trim();
        return `toast:${type}:${category}:${message}`.toLowerCase();
    }

    private sameToastSignature(
        toast: AppToast,
        type: AppToastType,
        message: string,
        category: AppToastOptions['category'],
        allowMessageVariance: boolean
    ): boolean {
        if (allowMessageVariance)
            return toast.type === type && `${toast.category ?? ''}` === `${category ?? ''}`;
        return toast.type === type
            && toast.message === message
            && `${toast.category ?? ''}` === `${category ?? ''}`;
    }
}
