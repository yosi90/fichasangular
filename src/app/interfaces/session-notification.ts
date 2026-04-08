import { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';
import { AppToastType } from './app-toast';

export type SessionNotificationSource = 'toast' | 'swal';
export type SessionNotificationLevel = AppToastType | 'warning';
export type SessionNotificationActionHandler = () => void | Promise<void>;

export interface SessionNotificationAction {
    label: string | null;
    run: SessionNotificationActionHandler;
}

export interface SessionNotificationEntry {
    id: string;
    source: SessionNotificationSource;
    level: SessionNotificationLevel;
    title: string;
    message: string;
    createdAt: number;
    seenAt: number | null;
    actionLabel: string | null;
    action: SessionNotificationActionHandler | null;
}

export interface SessionNotificationEntryInput {
    source: SessionNotificationSource;
    level: SessionNotificationLevel;
    title?: string | null;
    message?: string | null;
    actionLabel?: string | null;
    action?: SessionNotificationActionHandler | null;
}

export interface SessionNotificationSwalMetadata {
    include?: boolean;
    title?: string | null;
    message?: string | null;
    level?: SessionNotificationLevel | SweetAlertIcon | null;
    actionLabel?: string | null;
    action?: SessionNotificationActionHandler | null;
}

export type SessionNotificationSwalOptions = SweetAlertOptions & {
    sessionNotification?: SessionNotificationSwalMetadata | boolean;
};
