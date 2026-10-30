import { UserAccessScope } from 'src/app/interfaces/user-moderation';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';
import { AppToastService } from 'src/app/services/app-toast.service';
import { UserService } from 'src/app/services/user.service';
import { toUserFacingErrorMessage } from 'src/app/services/utils/user-facing-error.util';

/**
 * Lo que comparten «Mi perfil» y la gestión de campañas al lanzar una acción contra la API: comprobar las normas y el
 * freno de repeticiones antes, y convertir el error en una frase para la persona después.
 */

/** Las acciones que crean o cambian contenido de rol piden las normas de creación; las demás, las de uso. */
export function ambitoDeAccion(actionKey: string): UserAccessScope {
    const normalized = `${actionKey ?? ''}`.trim().toLowerCase();
    if (normalized === 'campaign.create'
        || normalized.startsWith('campaign.update.')
        || normalized.startsWith('campaign.trama.create.')
        || normalized.startsWith('campaign.trama.update.')
        || normalized.startsWith('campaign.subtrama.create.')
        || normalized.startsWith('campaign.subtrama.update.')) {
        return 'creation';
    }
    return 'usage';
}

/** `true` si se puede lanzar la acción; si no, ya ha avisado con un toast (normas pendientes o demasiadas seguidas). */
export function permitirAccionGuardada(
    userSvc: UserService,
    apiActionGuardSvc: ApiActionGuardService,
    appToastSvc: AppToastService,
    actionKey: string,
): boolean {
    const accessRestrictionMessage = userSvc.getAccessRestrictionMessage(ambitoDeAccion(actionKey));
    if (accessRestrictionMessage.length > 0) {
        appToastSvc.showError(accessRestrictionMessage);
        return false;
    }

    const decision = apiActionGuardSvc.shouldAllow(userSvc.CurrentUserUid, actionKey);
    if (decision.status !== 'allowed') {
        appToastSvc.showError(apiActionGuardSvc.getBlockedMessage(decision), {
            dedupeKey: apiActionGuardSvc.getBlockedToastDedupeKey(userSvc.CurrentUserUid, decision.status),
        });
        return false;
    }
    return true;
}

/** La frase del error: la de las normas o la sanción si es eso, o la de la API. */
export function mensajeErrorDeAccion(userSvc: UserService, error: any, fallback: string, scope: UserAccessScope = 'usage'): string {
    const restriction = userSvc.resolveComplianceRestrictionFromError(error, scope);
    if (restriction === 'temporaryBan')
        return 'Tu cuenta está restringida temporalmente. Solo puedes revisar tu estado hasta que termine la sanción.';
    if (restriction === 'permanentBan')
        return 'Tu cuenta no puede realizar esta acción en este momento.';
    if (restriction === 'mustAcceptUsage')
        return 'Debes aceptar las normas de uso vigentes antes de continuar.';
    if (restriction === 'mustAcceptCreation')
        return 'Debes aceptar las normas de creación vigentes antes de continuar.';
    return toUserFacingErrorMessage(error, fallback);
}

const formatoFechaHora = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

/** «30 de octubre de 2026 18:05», o el texto de reserva si no hay fecha válida. */
export function textoFechaHora(value: string | null | undefined, fallback: string): string {
    const text = `${value ?? ''}`.trim();
    if (text.length < 1)
        return fallback;

    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime()))
        return fallback;

    return formatoFechaHora.format(parsed).replace(',', '');
}

/** El nombre de un rol de Rol para enseñarlo («Master», «Colaborador»…). */
export function textoRol(role: string | null | undefined, fallback: string = 'Sin rol'): string {
    const normalized = `${role ?? ''}`.trim().toLowerCase();
    if (normalized === 'admin')
        return 'Admin';
    if (normalized === 'colaborador')
        return 'Colaborador';
    if (normalized === 'master')
        return 'Master';
    if (normalized === 'jugador')
        return 'Jugador';
    return fallback;
}
