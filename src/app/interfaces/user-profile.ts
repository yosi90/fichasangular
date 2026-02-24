export type AuthProviderType = 'correo' | 'google' | 'otro';

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    authProvider: AuthProviderType;
    createdAt: number;
    lastSeenAt: number;
}

