export type AppToastType = 'success' | 'error' | 'info' | 'system';
export type AppToastCategory = 'mensajes' | 'amistad' | 'campanas' | 'cuentaSistema';

export interface AppToast {
    id: string;
    dedupeKey: string | null;
    message: string;
    type: AppToastType;
    category?: AppToastCategory;
    createdAt: number;
    durationMs: number;
    repeatCount: number;
}

export interface AppToastOptions {
    durationMs?: number;
    category?: AppToastCategory;
    captureSessionNotification?: boolean;
    dedupeKey?: string | null;
}
