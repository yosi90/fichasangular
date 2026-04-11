export interface UserFacingErrorOptions {
    duplicateNameEntity?: 'campaign' | 'generic';
    sessionRequiredMessage?: string;
}

interface ErrorDetails {
    message: string;
    code: string;
    status: number;
}

const SESSION_REQUIRED_MESSAGE = 'Necesitas iniciar sesión para continuar.';
const TECHNICAL_MESSAGE_PATTERNS = [
    'http ',
    'backend',
    'firestore',
    'firebase',
    'realtime',
    'websocket',
    'gateway',
    'actor-scoped',
    'actor scoped',
    'read model',
    'payload',
    'dto',
    'constraint',
    'unique key',
    'uq_',
    'ix_',
    'sql',
    'forbidden',
    'unauthorized',
    'bad request',
    'internal server',
    'integridad',
    'uid',
    'token no disponible',
    'sesion no iniciada',
    'ticket realtime',
];
const GENERIC_TECHNICAL_MESSAGES = new Set([
    'forbidden',
    'unauthorized',
    'bad request',
    'internal server error',
]);

export function toUserFacingErrorMessage(
    error: unknown,
    fallback: string,
    options: UserFacingErrorOptions = {}
): string {
    const normalizedFallback = `${fallback ?? ''}`.trim() || 'No se pudo completar la acción.';
    const details = extractErrorDetails(error);
    const rawMessage = details.message;
    const normalizedMessage = normalizeComparableText(rawMessage);
    const normalizedCode = normalizeComparableText(details.code);

    if (isSessionRequiredError(normalizedMessage, normalizedCode, details.status))
        return options.sessionRequiredMessage ?? SESSION_REQUIRED_MESSAGE;

    if (looksLikeDuplicateNameError(normalizedMessage, normalizedCode, details.status)) {
        if (options.duplicateNameEntity === 'campaign')
            return 'Ese nombre ya está en uso por otra campaña.';
        if (options.duplicateNameEntity === 'generic')
            return 'Ese nombre ya está en uso.';
    }

    if (rawMessage.length < 1)
        return normalizedFallback;

    if (looksTechnicalMessage(normalizedMessage))
        return normalizedFallback;

    return rawMessage;
}

function extractErrorDetails(error: unknown): ErrorDetails {
    if (!error || typeof error !== 'object') {
        const message = `${error ?? ''}`.trim();
        return {
            message,
            code: '',
            status: 0,
        };
    }

    const record = error as Record<string, any>;
    const nested = record['error'];
    const nestedMessage = typeof nested === 'string'
        ? nested.trim()
        : `${nested?.message ?? nested?.error ?? ''}`.trim();
    const directMessage = `${record['message'] ?? ''}`.trim();
    const code = `${record['code'] ?? nested?.code ?? ''}`.trim();
    const status = Math.trunc(Number(record['status'] ?? 0));

    return {
        message: nestedMessage || directMessage,
        code,
        status: Number.isFinite(status) ? status : 0,
    };
}

function isSessionRequiredError(message: string, code: string, status: number): boolean {
    if (code.includes('unauthorized') || code.includes('tokeninvalid'))
        return true;

    if (message.includes('sesion no iniciada') || message.includes('token no disponible'))
        return true;

    return status === 401 && GENERIC_TECHNICAL_MESSAGES.has(message);
}

function looksLikeDuplicateNameError(message: string, code: string, status: number): boolean {
    const hasDuplicateSignal = message.includes('duplicate')
        || message.includes('duplicad')
        || message.includes('ya existe')
        || message.includes('ya esta en uso')
        || message.includes('ya está en uso')
        || message.includes('unique')
        || message.includes('constraint')
        || message.includes('integridad')
        || code.includes('duplicate')
        || code.includes('alreadyexists')
        || code.includes('conflict');

    if (!hasDuplicateSignal)
        return false;

    return status === 409 || status === 400 || status === 500 || message.includes('nombre');
}

function looksTechnicalMessage(message: string): boolean {
    if (message.length < 1)
        return false;

    if (GENERIC_TECHNICAL_MESSAGES.has(message))
        return true;

    return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => message.includes(pattern));
}

function normalizeComparableText(value: string | null | undefined): string {
    return `${value ?? ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
