import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PermissionResource } from 'src/app/interfaces/user-acl';
import { AdminUserRow } from 'src/app/services/admin-users.service';

@Component({
    selector: 'app-admin-user-permissions-modal',
    templateUrl: './admin-user-permissions-modal.component.html',
    styleUrls: ['./admin-user-permissions-modal.component.sass'],
    standalone: false
})
export class AdminUserPermissionsModalComponent implements OnChanges {
    @Input() user: AdminUserRow | null = null;
    @Input() resources: readonly PermissionResource[] = [];
    @Input() saving: boolean = false;

    @Output() closeRequested = new EventEmitter<void>();
    @Output() saveRequested = new EventEmitter<Record<PermissionResource, boolean>>();

    draftPermissions = {} as Record<PermissionResource, boolean>;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['user'] || changes['resources'])
            this.resetDraft();
    }

    get canEdit(): boolean {
        return !!this.user && this.user.role !== 'admin';
    }

    get activePermissionsCount(): number {
        return this.resources.filter((resource) => this.draftPermissions[resource] === true).length;
    }

    get totalPermissionsCount(): number {
        return this.resources.length;
    }

    get hasChanges(): boolean {
        if (!this.user)
            return false;

        return this.resources.some((resource) => this.draftPermissions[resource] !== (this.user?.permissions?.[resource] === true));
    }

    permissionLabel(resource: PermissionResource): string {
        switch (resource) {
            case 'tipos_criatura':
                return 'Tipos de criatura';
            case 'subtipos':
                return 'Subtipos';
            case 'rasgos':
                return 'Rasgos';
            case 'ventajas':
                return 'Ventajas';
            case 'desventajas':
                return 'Desventajas';
            case 'campanas':
                return 'Campañas';
            case 'conjuros':
                return 'Conjuros';
            case 'dotes':
                return 'Dotes';
            case 'razas':
                return 'Razas';
            case 'clases':
                return 'Clases';
            case 'plantillas':
                return 'Plantillas';
            case 'manuales':
                return 'Manuales';
            case 'personajes':
                return 'Personajes';
            default:
                return `${resource}`.replace(/_/g, ' ');
        }
    }

    onBackdropClose(): void {
        if (!this.saving)
            this.closeRequested.emit();
    }

    onPermissionToggle(resource: PermissionResource, checked: boolean): void {
        this.draftPermissions = {
            ...this.draftPermissions,
            [resource]: checked,
        };
    }

    onSave(): void {
        if (!this.canEdit || !this.hasChanges || this.saving)
            return;

        this.saveRequested.emit({ ...this.draftPermissions });
    }

    private resetDraft(): void {
        const nextDraft = {} as Record<PermissionResource, boolean>;
        this.resources.forEach((resource) => {
            nextDraft[resource] = this.user?.permissions?.[resource] === true;
        });
        this.draftPermissions = nextDraft;
    }
}
