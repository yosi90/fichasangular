import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ModerationAdminHistoryResponseDto, UsuarioAclResponseDto } from 'src/app/interfaces/usuarios-api';
import { AdminUserRow } from 'src/app/services/admin-users.service';

@Component({
    selector: 'app-admin-user-moderation-history-modal',
    templateUrl: './admin-user-moderation-history-modal.component.html',
    styleUrls: ['./admin-user-moderation-history-modal.component.sass'],
    standalone: false
})
export class AdminUserModerationHistoryModalComponent {
    @Input() user: AdminUserRow | null = null;
    @Input() preview: UsuarioAclResponseDto | null = null;
    @Input() history: ModerationAdminHistoryResponseDto | null = null;
    @Input() loading: boolean = false;
    @Input() statusLabel: string = '';
    @Input() pageText: string = 'Sin resultados';
    @Input() canGoPrevious: boolean = false;
    @Input() canGoNext: boolean = false;

    @Output() closeRequested = new EventEmitter<void>();
    @Output() previousRequested = new EventEmitter<void>();
    @Output() nextRequested = new EventEmitter<void>();

    get subtitle(): string {
        const email = `${this.user?.email ?? this.history?.email ?? ''}`.trim();
        if (email.length > 0)
            return email;
        return this.preview?.uid || this.history?.uid || this.user?.uid || 'Sin usuario';
    }

    onBackdropClose(): void {
        this.closeRequested.emit();
    }

    onPrevious(): void {
        if (this.canGoPrevious)
            this.previousRequested.emit();
    }

    onNext(): void {
        if (this.canGoNext)
            this.nextRequested.emit();
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.closeRequested.emit();
    }
}
