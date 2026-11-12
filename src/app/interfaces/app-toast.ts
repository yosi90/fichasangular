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
    /** Lo que va debajo del mensaje, en lista (las razones de un aviso); vacía, nada. */
    lista: string[];
}

export interface AppToastOptions {
    durationMs?: number;
    category?: AppToastCategory;
    dedupeKey?: string | null;
    /** Lo que va debajo del mensaje, en lista (las razones de un aviso). */
    lista?: readonly string[];
}
