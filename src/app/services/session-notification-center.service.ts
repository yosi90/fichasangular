import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { AppToastType } from '../interfaces/app-toast';
import {
    SessionNotificationEntry,
    SessionNotificationEntryInput,
    SessionNotificationLevel,
    SessionNotificationSwalMetadata,
    SessionNotificationSwalOptions,
} from '../interfaces/session-notification';

@Injectable({
    providedIn: 'root'
})
export class SessionNotificationCenterService {
    private readonly storageKey = 'fichas3.5.session-notifications.v1';
    private readonly maxEntryAgeMs = 24 * 60 * 60 * 1000;
    private readonly entriesSubject = new BehaviorSubject<SessionNotificationEntry[]>([]);
    private sequence = 0;

    readonly entries$ = this.entriesSubject.asObservable();
    readonly hasUnread$ = this.entries$.pipe(
        map((entries) => entries.some((entry) => entry.seenAt === null)),
        distinctUntilChanged()
    );

    constructor() {
        this.restoreEntries();
    }

    add(entry: SessionNotificationEntryInput): string {
        const normalized = this.normalizeEntry(entry);
        const nextEntries = [
            normalized,
            ...this.entriesSubject.value.filter((current) => current.id !== normalized.id),
        ];
        this.writeEntries(nextEntries);
        return normalized.id;
    }

    remove(id: string): void {
        const normalizedId = `${id ?? ''}`.trim();
        if (normalizedId.length < 1)
            return;
        this.writeEntries(this.entriesSubject.value.filter((entry) => entry.id !== normalizedId));
    }

    clear(): void {
        if (this.entriesSubject.value.length < 1)
            return;
        this.writeEntries([]);
    }

    markSeen(ids: string[]): void {
        const normalizedIds = new Set(
            (ids ?? [])
                .map((id) => `${id ?? ''}`.trim())
                .filter((id) => id.length > 0)
        );
        if (normalizedIds.size < 1)
            return;

        const now = Date.now();
        this.writeEntries(
            this.entriesSubject.value.map((entry) => normalizedIds.has(entry.id) && entry.seenAt === null
                ? { ...entry, seenAt: now }
                : entry)
        );
    }

    captureToast(type: AppToastType, message: string): string {
        return this.add({
            source: 'toast',
            level: this.normalizeLevel(type) ?? 'info',
            title: this.buildToastTitle(type),
            message,
        });
    }

    prepareSwalInvocation(rawArgs: any[]): any[] {
        const args = Array.isArray(rawArgs) ? [...rawArgs] : [];
        const options = this.extractOptionsArg(args);
        const metadata = this.extractSwalMetadata(options);
        const capture = this.buildSwalCapture(args, options, metadata);
        if (capture)
            this.add(capture);

        if (options) {
            const { sessionNotification, ...rest } = options;
            args[0] = rest;
        }

        return args;
    }

    private normalizeEntry(entry: SessionNotificationEntryInput): SessionNotificationEntry {
        const title = `${entry?.title ?? ''}`.trim();
        const message = this.normalizeText(entry?.message);
        const requestedDedupeKey = `${entry?.dedupeKey ?? ''}`.trim();
        const hasExplicitDedupeKey = requestedDedupeKey.length > 0;
        const countdownUntil = this.toFutureTimestamp(entry?.countdownUntil);
        const countdownLabel = `${entry?.countdownLabel ?? ''}`.trim() || null;
        const fallbackTitle = title.length > 0
            ? title
            : (message.length > 0 ? this.truncate(message, 84) : 'Notificación');
        const dedupeKey = hasExplicitDedupeKey
            ? requestedDedupeKey
            : this.buildAutomaticDedupeKey(
                entry?.source === 'swal' ? 'swal' : 'toast',
                this.normalizeLevel(entry?.level) ?? 'info',
                fallbackTitle,
                message,
                `${entry?.actionLabel ?? ''}`.trim() || null,
                countdownLabel
            );
        const existing = dedupeKey.length > 0
            ? this.entriesSubject.value.find((item) => item.dedupeKey === dedupeKey) ?? null
            : null;
        const sameSignature = existing
            && this.isSameEntrySignature(
                existing,
                entry?.source === 'swal' ? 'swal' : 'toast',
                this.normalizeLevel(entry?.level) ?? 'info',
                fallbackTitle,
                message,
                `${entry?.actionLabel ?? ''}`.trim() || null,
                countdownLabel,
                hasExplicitDedupeKey
            );
        return {
            id: existing?.id ?? `session-notification-${Date.now()}-${++this.sequence}`,
            dedupeKey: dedupeKey.length > 0 ? dedupeKey : null,
            source: entry?.source === 'swal' ? 'swal' : 'toast',
            level: this.normalizeLevel(entry?.level) ?? 'info',
            title: fallbackTitle,
            message,
            createdAt: Date.now(),
            seenAt: null,
            countdownUntil,
            countdownLabel,
            repeatCount: sameSignature ? Math.max(1, Number(existing?.repeatCount ?? 1)) + 1 : 1,
            actionLabel: `${entry?.actionLabel ?? ''}`.trim() || null,
            action: typeof entry?.action === 'function' ? entry.action : null,
        };
    }

    private restoreEntries(): void {
        this.writeEntries(this.readStoredEntries());
    }

    private readStoredEntries(): SessionNotificationEntry[] {
        const storage = this.getStorage();
        if (!storage)
            return [];

        try {
            const raw = storage.getItem(this.storageKey);
            if (!raw)
                return [];

            const now = Date.now();
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed))
                return [];

            return parsed
                .map((entry) => this.normalizeStoredEntry(entry, now))
                .filter((entry): entry is SessionNotificationEntry => !!entry);
        } catch {
            return [];
        }
    }

    private normalizeStoredEntry(raw: any, now: number): SessionNotificationEntry | null {
        const createdAt = this.toPositiveTimestamp(raw?.createdAt);
        if (createdAt === null || now - createdAt > this.maxEntryAgeMs)
            return null;

        const id = `${raw?.id ?? ''}`.trim();
        if (id.length < 1)
            return null;

        return {
            id,
            dedupeKey: `${raw?.dedupeKey ?? ''}`.trim() || null,
            source: raw?.source === 'swal' ? 'swal' : 'toast',
            level: this.normalizeLevel(raw?.level) ?? 'info',
            title: `${raw?.title ?? ''}`.trim() || 'Notificación',
            message: this.normalizeText(raw?.message),
            createdAt,
            seenAt: this.toPositiveTimestamp(raw?.seenAt),
            countdownUntil: this.toFutureTimestamp(raw?.countdownUntil),
            countdownLabel: `${raw?.countdownLabel ?? ''}`.trim() || null,
            repeatCount: this.toPositiveTimestamp(raw?.repeatCount) ?? 1,
            actionLabel: null,
            action: null,
        };
    }

    private writeEntries(entries: SessionNotificationEntry[], persist: boolean = true): void {
        const now = Date.now();
        const normalizedEntries = (entries ?? [])
            .filter((entry) => now - entry.createdAt <= this.maxEntryAgeMs)
            .sort((a, b) => b.createdAt - a.createdAt);
        this.entriesSubject.next(normalizedEntries);
        if (!persist)
            return;

        const storage = this.getStorage();
        if (!storage)
            return;

        try {
            storage.setItem(this.storageKey, JSON.stringify(normalizedEntries.map((entry) => ({
                id: entry.id,
                dedupeKey: entry.dedupeKey,
                source: entry.source,
                level: entry.level,
                title: entry.title,
                message: entry.message,
                createdAt: entry.createdAt,
                seenAt: entry.seenAt,
                countdownUntil: entry.countdownUntil,
                countdownLabel: entry.countdownLabel,
                repeatCount: entry.repeatCount,
                actionLabel: entry.actionLabel,
            }))));
        } catch {
            // Si localStorage falla, mantenemos el histórico en memoria.
        }
    }

    private getStorage(): Storage | null {
        try {
            return globalThis?.localStorage ?? null;
        } catch {
            return null;
        }
    }

    private buildSwalCapture(
        args: any[],
        options: SessionNotificationSwalOptions | null,
        metadata: SessionNotificationSwalMetadata | null
    ): SessionNotificationEntryInput | null {
        if (metadata?.include === false)
            return null;

        const inferred = this.inferSwalShape(args, options);
        const includeExplicit = metadata !== null;
        const includeAutomatic = !includeExplicit && this.shouldAutoCaptureSwal(options, inferred.level);
        if (!includeExplicit && !includeAutomatic)
            return null;

        const title = `${metadata?.title ?? inferred.title ?? ''}`.trim();
        const message = this.normalizeText(metadata?.message ?? inferred.message ?? '');
        const level = this.normalizeLevel(metadata?.level ?? inferred.level) ?? 'info';
        if (title.length < 1 && message.length < 1)
            return null;

        return {
            source: 'swal',
            level,
            title,
            message,
            actionLabel: `${metadata?.actionLabel ?? ''}`.trim() || null,
            action: typeof metadata?.action === 'function' ? metadata.action : null,
        };
    }

    private shouldAutoCaptureSwal(
        options: SessionNotificationSwalOptions | null,
        inferredLevel: SessionNotificationLevel | null
    ): boolean {
        if (!options)
            return inferredLevel === 'success' || inferredLevel === 'error' || inferredLevel === 'info';
        if (options.toast === true)
            return false;
        if (options.input)
            return false;
        if (options.showCancelButton === true || options.showDenyButton === true)
            return false;
        if (options.showLoaderOnConfirm === true)
            return false;
        if (typeof options.preConfirm === 'function')
            return false;
        return inferredLevel === 'success' || inferredLevel === 'error' || inferredLevel === 'info';
    }

    private inferSwalShape(
        args: any[],
        options: SessionNotificationSwalOptions | null
    ): { title: string; message: string; level: SessionNotificationLevel | null; } {
        if (options) {
            return {
                title: this.normalizeText(options.title ?? ''),
                message: this.normalizeText(options.text ?? this.stripHtml(options.html ?? '')),
                level: this.normalizeLevel(options.icon),
            };
        }

        const title = this.normalizeText(args[0] ?? '');
        const message = this.normalizeText(args[1] ?? '');
        const level = this.normalizeLevel(args[2]);
        return { title, message, level };
    }

    private extractOptionsArg(args: any[]): SessionNotificationSwalOptions | null {
        if (args.length !== 1)
            return null;
        const candidate = args[0];
        return candidate && typeof candidate === 'object' && !Array.isArray(candidate)
            ? candidate as SessionNotificationSwalOptions
            : null;
    }

    private extractSwalMetadata(options: SessionNotificationSwalOptions | null): SessionNotificationSwalMetadata | null {
        if (!options || !Object.prototype.hasOwnProperty.call(options, 'sessionNotification'))
            return null;
        const metadata = options.sessionNotification;
        if (metadata === false)
            return { include: false };
        return metadata && typeof metadata === 'object'
            ? metadata
            : {};
    }

    private buildToastTitle(type: AppToastType): string {
        if (type === 'success')
            return 'Acción completada';
        if (type === 'error')
            return 'Error';
        if (type === 'system')
            return 'Aviso del sistema';
        return 'Información';
    }

    private normalizeLevel(value: any): SessionNotificationLevel | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'success' || normalized === 'error' || normalized === 'info' || normalized === 'system' || normalized === 'warning')
            return normalized;
        return null;
    }

    private normalizeText(value: any): string {
        return `${value ?? ''}`
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private stripHtml(value: any): string {
        return `${value ?? ''}`
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private truncate(value: string, maxLength: number): string {
        const normalized = this.normalizeText(value);
        if (normalized.length <= maxLength)
            return normalized;
        return `${normalized.slice(0, maxLength - 3).trim()}...`;
    }

    private toPositiveTimestamp(value: any): number | null {
        const parsed = Math.trunc(Number(value));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    private toFutureTimestamp(value: any): number | null {
        const parsed = this.toPositiveTimestamp(value);
        return parsed && parsed > Date.now() ? parsed : null;
    }

    private buildAutomaticDedupeKey(
        source: SessionNotificationEntry['source'],
        level: SessionNotificationEntry['level'],
        title: string,
        message: string,
        actionLabel: string | null,
        countdownLabel: string | null
    ): string {
        return [
            'auto',
            source,
            level,
            this.normalizeText(title),
            this.normalizeText(message),
            `${actionLabel ?? ''}`.trim().toLowerCase(),
            `${countdownLabel ?? ''}`.trim().toLowerCase(),
        ].join('|');
    }

    private isSameEntrySignature(
        entry: SessionNotificationEntry,
        source: SessionNotificationEntry['source'],
        level: SessionNotificationEntry['level'],
        title: string,
        message: string,
        actionLabel: string | null,
        countdownLabel: string | null,
        allowContentVariance: boolean
    ): boolean {
        if (allowContentVariance)
            return entry.source === source;
        return entry.source === source
            && entry.level === level
            && entry.title === title
            && entry.message === message
            && `${entry.actionLabel ?? ''}` === `${actionLabel ?? ''}`
            && `${entry.countdownLabel ?? ''}` === `${countdownLabel ?? ''}`;
    }
}
