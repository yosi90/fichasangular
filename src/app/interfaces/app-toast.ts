export type AppToastType = 'success' | 'error' | 'info';

export interface AppToast {
    id: string;
    message: string;
    type: AppToastType;
}
