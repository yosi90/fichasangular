export type AppToastType = 'success' | 'error' | 'info' | 'system';

export interface AppToast {
    id: string;
    message: string;
    type: AppToastType;
}
