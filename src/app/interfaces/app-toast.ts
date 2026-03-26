export type AppToastType = 'success' | 'error' | 'info' | 'system';
export type AppToastCategory = 'mensajes' | 'amistad' | 'campanas' | 'cuentaSistema';

export interface AppToast {
    id: string;
    message: string;
    type: AppToastType;
    category?: AppToastCategory;
}

export interface AppToastOptions {
    durationMs?: number;
    category?: AppToastCategory;
}
