import { toBoolean } from 'src/app/services/utils/normalizacion';

export type UserAclPermissions = Record<string, Record<string, boolean>>;
export type UserRole = 'jugador' | 'master' | 'colaborador' | 'admin';
/** Los recursos de `dbo.PermissionResource` del backend (permisos de creación). */
export type PermissionResource =
    | 'personajes'
    | 'campanas'
    | 'tramas'
    | 'subtramas'
    | 'conjuros'
    | 'dotes'
    | 'razas'
    | 'clases'
    | 'plantillas'
    | 'manuales'
    | 'tipos_criatura'
    | 'subtipos'
    | 'rasgos'
    | 'ventajas'
    | 'desventajas'
    | 'armas'
    | 'armaduras'
    | 'deidades'
    | 'monstruos';

export const PERMISSION_RESOURCES: PermissionResource[] = [
    'personajes',
    'campanas',
    'tramas',
    'subtramas',
    'conjuros',
    'dotes',
    'razas',
    'clases',
    'plantillas',
    'manuales',
    'tipos_criatura',
    'subtipos',
    'rasgos',
    'ventajas',
    'desventajas',
    'armas',
    'armaduras',
    'deidades',
    'monstruos',
];

export interface UserAcl {
    roles: {
        admin: boolean;
        type: UserRole;
    };
    status: {
        banned: boolean;
    };
    permissions: UserAclPermissions;
}

export const EMPTY_USER_ACL: UserAcl = {
    roles: {
        admin: false,
        type: 'jugador',
    },
    status: {
        banned: false,
    },
    permissions: {},
};

function toKey(value: any): string {
    return `${value ?? ''}`.trim().toLowerCase();
}

function normalizeRole(rawRole: any, rawAdmin: any): UserRole {
    const role = toKey(rawRole);
    if (role === 'admin')
        return 'admin';
    if (role === 'master')
        return 'master';
    if (role === 'colaborador')
        return 'colaborador';
    if (role === 'jugador')
        return 'jugador';
    if (toBoolean(rawAdmin))
        return 'admin';
    return 'jugador';
}

export function normalizeUserAcl(raw: any): UserAcl {
    if (!raw || typeof raw !== 'object')
        return { ...EMPTY_USER_ACL };

    const rolesRaw = raw?.roles && typeof raw.roles === 'object' ? raw.roles : {};
    const permissionsRaw = raw?.permissions && typeof raw.permissions === 'object' ? raw.permissions : {};

    const permissions: UserAclPermissions = {};
    Object.entries(permissionsRaw).forEach(([resourceRaw, accionesRaw]) => {
        const resource = toKey(resourceRaw);
        if (resource.length < 1 || !accionesRaw || typeof accionesRaw !== 'object')
            return;

        const acciones: Record<string, boolean> = {};
        Object.entries(accionesRaw as Record<string, any>).forEach(([accionRaw, permitidoRaw]) => {
            const accion = toKey(accionRaw);
            if (accion.length < 1)
                return;
            acciones[accion] = toBoolean(permitidoRaw);
        });

        permissions[resource] = acciones;
    });

    return {
        roles: {
            type: normalizeRole(rolesRaw?.type, rolesRaw?.admin),
            admin: normalizeRole(rolesRaw?.type, rolesRaw?.admin) === 'admin',
        },
        status: {
            banned: toBoolean(raw?.status?.banned),
        },
        permissions,
    };
}
