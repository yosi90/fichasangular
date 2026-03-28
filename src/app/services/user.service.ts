import { Injectable } from '@angular/core';
import {
    Auth,
    GoogleAuthProvider,
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from '@angular/fire/auth';
import { Database, get, onValue, ref, set } from '@angular/fire/database';
import { BehaviorSubject, map } from 'rxjs';
import { UserPrivateProfile } from '../interfaces/user-account';
import { Usuario } from '../interfaces/usuario';
import { EMPTY_USER_ACL, UserAcl, UserRole, normalizeUserAcl } from '../interfaces/user-acl';
import { AuthProviderType, UserProfile } from '../interfaces/user-profile';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { PrivateUserFirestoreService } from './private-user-firestore.service';
import { UserProfileApiService } from './user-profile-api.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private usuario: Usuario = { nombre: 'Invitado', correo: '', permisos: 0 };
    private acl: UserAcl = { ...EMPTY_USER_ACL };
    private aclHasSourceData: boolean = false;
    private sesionAbierta: boolean = false;
    private authUidActivo: string = '';
    private aclUnsubscribe: (() => void) | null = null;
    private privateProfileUnsubscribe: (() => void) | null = null;
    private banSignOutInProgress: boolean = false;
    private isLoggedInSubject = new BehaviorSubject<boolean>(false);
    private permisosSubject = new BehaviorSubject<number>(0);
    private isBannedSubject = new BehaviorSubject<boolean>(false);
    private aclSubject = new BehaviorSubject<UserAcl>({ ...EMPTY_USER_ACL });
    private privateProfileSubject = new BehaviorSubject<UserPrivateProfile | null>(null);
    private privateProfileBase: UserPrivateProfile | null = null;
    public isLoggedIn$ = this.isLoggedInSubject.asObservable();
    public permisos$ = this.permisosSubject.asObservable();
    public isBanned$ = this.isBannedSubject.asObservable();
    public acl$ = this.aclSubject.asObservable();
    public currentPrivateProfile$ = this.privateProfileSubject.asObservable();
    public esAdmin$ = this.permisos$.pipe(map((value) => value === 1));

    public get Usuario() {
        return this.usuario;
    }

    public get CurrentUserUid(): string {
        return `${this.auth.currentUser?.uid ?? ''}`.trim();
    }

    public get CurrentPrivateProfile(): UserPrivateProfile | null {
        return this.privateProfileSubject.value;
    }

    constructor(
        private auth: Auth,
        private db: Database,
        private firebaseContextSvc: FirebaseInjectionContextService,
        private userProfileApiSvc?: UserProfileApiService,
        private privateUserFirestoreSvc?: PrivateUserFirestoreService
    ) {
        this.subscribeAuthState((firebaseUser) => {
            this.actualizarSesionDesdeAuth(firebaseUser);
        });
    }

    public setLoggedIn(usr: Usuario): void {
        this.actualizarUsuarioSesion(usr);
    }

    public can(resource: string, action: string): boolean {
        if (!this.sesionAbierta)
            return false;
        if (this.isBanned())
            return false;

        if (this.isAdmin())
            return true;

        const resourceKey = `${resource ?? ''}`.trim().toLowerCase();
        const actionKey = `${action ?? ''}`.trim().toLowerCase();
        if (resourceKey.length < 1 || actionKey.length < 1)
            return false;

        const aclResource = this.acl.permissions?.[resourceKey];
        if (aclResource && Object.prototype.hasOwnProperty.call(aclResource, actionKey))
            return aclResource?.[actionKey] === true;

        const profileResource = this.privateProfileSubject.value?.permissions?.[resourceKey] as Record<string, boolean | undefined> | undefined;
        return profileResource?.[actionKey] === true;
    }

    public getPermissionDeniedMessage(): string {
        const base = 'No dispones de los permisos necesarios para realizar esta acción.';
        if (!this.sesionAbierta)
            return `${base} Regístrate o inicia sesión para poder solicitar acceso.`;

        const role = this.resolveCurrentRole();
        if (role === 'jugador')
            return `${base} Puedes solicitar convertirte en master desde tu perfil.`;
        if (role === 'master')
            return `${base} Puedes solicitar convertirte en colaborador desde tu perfil.`;
        return base;
    }

    register({ email, password }: any) {
        if (this.sesionAbierta)
            return null;

        const emailNormalizado = `${email ?? ''}`.trim();
        const passwordNormalizada = `${password ?? ''}`;
        return this.authCreateUserWithEmailAndPassword(emailNormalizado, passwordNormalizada)
            .catch((error) => {
                throw this.mapAuthError(error, 'register');
            });
    }

    loginEmailPass({ email, password }: any) {
        if (this.sesionAbierta)
            return null;

        const emailNormalizado = `${email ?? ''}`.trim();
        const passwordNormalizada = `${password ?? ''}`;
        return this.authSignInWithEmailAndPassword(emailNormalizado, passwordNormalizada)
            .catch((error) => {
                throw this.mapAuthError(error, 'login');
            });
    }

    loginGoogle() {
        if (!this.sesionAbierta) {
            return this.authSignInWithPopup()
                .catch((error) => {
                    throw this.mapAuthError(error, 'google-login');
                });
        } else return null;
    }

    requestPasswordReset(email: string): Promise<void> {
        const emailNormalizado = `${email ?? ''}`.trim();
        return this.authSendPasswordResetEmail(emailNormalizado)
            .catch((error) => {
                const code = this.normalizeAuthErrorCode(error);
                if (code === 'auth/user-not-found')
                    return;
                throw this.mapAuthError(error, 'password-reset');
            });
    }

    loginAnon() {
        if (!this.sesionAbierta) {
            throw new Error('Not implemented')  // Método de inicio de sesión anónimo
        } else return null;
    }

    logOut() {
        if (this.sesionAbierta) {
            return this.ejecutarSignOut();
        } else return null;
    }

    private actualizarSesionDesdeAuth(firebaseUser: User | null): void {
        this.stopAclSubscription();
        this.stopPrivateProfileSubscription();

        if (!firebaseUser) {
            this.authUidActivo = '';
            this.banSignOutInProgress = false;
            this.setAclRaw(null);
            this.setCurrentPrivateProfile(null);
            this.setLoggedIn({ nombre: 'Invitado', correo: '', permisos: 0 });
            return;
        }

        this.authUidActivo = `${firebaseUser.uid ?? ''}`.trim();

        this.setAclRaw(null);
        this.setLoggedIn({
            nombre: `${firebaseUser.displayName ?? ''}`.trim(),
            correo: `${firebaseUser.email ?? ''}`.trim(),
            permisos: 0,
        });

        this.startAclSubscription(firebaseUser.uid);
        this.startPrivateProfileSubscription(firebaseUser.uid);
        void this.hidratarSesion(firebaseUser);
    }

    public setCurrentPrivateProfile(profile: UserPrivateProfile | null): void {
        this.privateProfileBase = profile;
        const effectiveProfile = this.buildEffectivePrivateProfile(profile);
        this.privateProfileSubject.next(effectiveProfile);

        if (!effectiveProfile || !this.sesionAbierta)
            return;

        const email = `${effectiveProfile.email ?? ''}`.trim();
        const displayName = `${effectiveProfile.displayName ?? ''}`.trim();
        const fallbackName = email.length > 0 ? this.fallbackDisplayName(email) : this.usuario.nombre;
        this.actualizarUsuarioSesion({
            nombre: displayName.length > 0 ? displayName : fallbackName,
            correo: email.length > 0 ? email : this.usuario.correo,
            permisos: this.usuario.permisos,
        });
    }

    public async refreshCurrentPrivateProfile(): Promise<UserPrivateProfile | null> {
        if (!this.userProfileApiSvc)
            return this.CurrentPrivateProfile;

        const uid = this.CurrentUserUid;
        if (uid.length < 1) {
            this.setCurrentPrivateProfile(null);
            return null;
        }

        const profile = await this.userProfileApiSvc.getMyProfile();
        if (this.isActiveUser(uid))
            this.setCurrentPrivateProfile(profile);
        return this.CurrentPrivateProfile;
    }

    protected subscribeAuthState(handler: (firebaseUser: User | null) => void): void {
        this.firebaseContextSvc.run(() => onAuthStateChanged(this.auth, handler));
    }

    protected ejecutarSignOut(): Promise<void> {
        return signOut(this.auth);
    }

    protected authCreateUserWithEmailAndPassword(email: string, password: string) {
        return createUserWithEmailAndPassword(this.auth, email, password);
    }

    protected authSignInWithEmailAndPassword(email: string, password: string) {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    protected authSignInWithPopup() {
        return signInWithPopup(this.auth, new GoogleAuthProvider());
    }

    protected authSendPasswordResetEmail(email: string): Promise<void> {
        return sendPasswordResetEmail(this.auth, email);
    }

    protected watchAclPath(uid: string, onData: (rawAcl: any) => void, onError: () => void): () => void {
        return this.firebaseContextSvc.run(() => {
            const aclRef = ref(this.db, `Acl/users/${uid}`);
            return onValue(
                aclRef,
                (snapshot) => onData(snapshot.val()),
                () => onError()
            );
        });
    }

    protected runFirebaseOperation<T>(fn: () => T): T {
        return this.firebaseContextSvc.run(fn);
    }

    protected async getProfileSnapshot(uid: string): Promise<any> {
        const profileRef = this.runFirebaseOperation(() => ref(this.db, `UserProfiles/${uid}`));
        return this.runFirebaseOperation(() => get(profileRef));
    }

    protected saveUserProfile(uid: string, payload: UserProfile): Promise<void> {
        const profileRef = this.runFirebaseOperation(() => ref(this.db, `UserProfiles/${uid}`));
        return this.runFirebaseOperation(() => set(profileRef, payload));
    }

    protected getCurrentAuthUid(): string {
        return `${this.auth.currentUser?.uid ?? ''}`.trim();
    }

    protected getCurrentAuthEmail(): string {
        return `${this.auth.currentUser?.email ?? ''}`.trim();
    }

    protected getCurrentAuthDisplayName(): string {
        return `${this.auth.currentUser?.displayName ?? ''}`.trim();
    }

    protected getCurrentAuthProviderIds(): string[] {
        return (this.auth.currentUser?.providerData ?? [])
            .map((provider) => `${provider?.providerId ?? ''}`.trim().toLowerCase())
            .filter((providerId) => providerId.length > 0);
    }

    protected getCurrentAuthUserLike(): Pick<User, 'uid' | 'email' | 'displayName' | 'providerData'> | null {
        const uid = this.getCurrentAuthUid();
        if (uid.length < 1)
            return null;

        return {
            uid,
            email: this.getCurrentAuthEmail(),
            displayName: this.getCurrentAuthDisplayName(),
            providerData: (this.auth.currentUser?.providerData ?? []) as any,
        } as Pick<User, 'uid' | 'email' | 'displayName' | 'providerData'>;
    }

    protected resolveActiveUserUid(): string {
        const fromAuthGetter = this.getCurrentAuthUid();
        if (fromAuthGetter.length > 0)
            return fromAuthGetter;
        return `${this.auth.currentUser?.uid ?? ''}`.trim();
    }

    protected getAuthProviderIds(firebaseUser: User): string[] {
        return (firebaseUser?.providerData ?? [])
            .map((provider) => `${provider?.providerId ?? ''}`.trim().toLowerCase())
            .filter((providerId) => providerId.length > 0);
    }

    protected getFirebaseUserDisplayName(firebaseUser: User): string {
        return `${firebaseUser.displayName ?? ''}`.trim();
    }

    protected getFirebaseUserEmail(firebaseUser: User): string {
        return `${firebaseUser.email ?? ''}`.trim();
    }

    protected getFirebaseUserUid(firebaseUser: User): string {
        return `${firebaseUser?.uid ?? ''}`.trim();
    }

    protected getSnapshotValue(snapshot: any): any {
        return snapshot?.val?.() ?? null;
    }

    protected toUserProfilePayload(firebaseUser: User, createdAt: number, lastSeenAt: number): UserProfile {
        const displayName = this.getFirebaseUserDisplayName(firebaseUser);
        const email = this.getFirebaseUserEmail(firebaseUser);
        return {
            uid: this.getFirebaseUserUid(firebaseUser),
            displayName: displayName.length > 0 ? displayName : this.fallbackDisplayName(email),
            email,
            authProvider: this.resolveAuthProvider(firebaseUser),
            createdAt,
            lastSeenAt,
        };
    }

    protected readCreatedAt(raw: any, fallback: number): number {
        const createdAtRaw = Number(raw?.createdAt);
        return Number.isFinite(createdAtRaw) && createdAtRaw > 0 ? Math.trunc(createdAtRaw) : fallback;
    }

    protected getCurrentUserUidForProfile(): string {
        return this.getFirebaseUserUid(this.auth.currentUser as User);
    }

    protected createProfilePayload(firebaseUser: User, existente: any, now: number): UserProfile {
        return this.toUserProfilePayload(
            firebaseUser,
            this.readCreatedAt(existente, now),
            now
        );
    }

    protected async persistUserProfile(firebaseUser: User): Promise<void> {
        const uid = this.getFirebaseUserUid(firebaseUser);
        if (uid.length < 1)
            return;

        const now = Date.now();
        const snapshot = await this.getProfileSnapshot(uid);
        const existente = this.getSnapshotValue(snapshot);
        const payload = this.createProfilePayload(firebaseUser, existente, now);
        await this.saveUserProfile(uid, payload);
    }

    private actualizarUsuarioSesion(value: Usuario): void {
        this.usuario = {
            nombre: `${value?.nombre ?? ''}`.trim(),
            correo: `${value?.correo ?? ''}`.trim(),
            permisos: 0,
        };

        const abrirSesion: boolean = this.usuario.nombre !== 'Invitado' && this.usuario.correo !== '';
        this.isLoggedInSubject.next(abrirSesion);
        this.sesionAbierta = abrirSesion;
        this.actualizarPermisosDesdeAcl();
    }

    private setAclRaw(raw: any): void {
        this.aclHasSourceData = !!raw && typeof raw === 'object';
        this.acl = normalizeUserAcl(raw);
        this.aclSubject.next(this.acl);
        this.privateProfileSubject.next(this.buildEffectivePrivateProfile(this.privateProfileBase));
        this.isBannedSubject.next(this.isBanned());
        this.actualizarPermisosDesdeAcl();
        this.evaluarSesionBaneada();
    }

    private isAdmin(): boolean {
        return this.acl.roles?.admin === true;
    }

    private resolveCurrentRole(): UserRole {
        const profileRole = `${this.privateProfileSubject.value?.role ?? ''}`.trim().toLowerCase();
        if (profileRole === 'admin' || profileRole === 'colaborador' || profileRole === 'master' || profileRole === 'jugador')
            return profileRole as UserRole;
        return this.acl.roles?.type ?? 'jugador';
    }

    private isBanned(): boolean {
        return this.acl.status?.banned === true;
    }

    private actualizarPermisosDesdeAcl(): void {
        const permisos = this.sesionAbierta && !this.isBanned() && this.isAdmin() ? 1 : 0;
        this.usuario = {
            ...this.usuario,
            permisos,
        };
        this.permisosSubject.next(permisos);
    }

    private evaluarSesionBaneada(): void {
        if (!this.sesionAbierta || !this.isBanned() || this.banSignOutInProgress)
            return;

        this.banSignOutInProgress = true;
        this.ejecutarSignOut()
            .catch(() => undefined)
            .finally(() => {
                this.banSignOutInProgress = false;
            });
    }

    private startAclSubscription(uid: string): void {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1) {
            this.setAclRaw(null);
            return;
        }

        this.aclUnsubscribe = this.watchAclPath(
            uidNormalizado,
            (rawAcl) => {
                if (this.isActiveUser(uidNormalizado))
                    this.setAclRaw(rawAcl);
            },
            () => {
                if (this.isActiveUser(uidNormalizado))
                    this.setAclRaw(null);
            }
        );
    }

    private stopAclSubscription(): void {
        if (!this.aclUnsubscribe)
            return;

        this.aclUnsubscribe();
        this.aclUnsubscribe = null;
    }

    private startPrivateProfileSubscription(uid: string): void {
        if (!this.privateUserFirestoreSvc)
            return;

        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1) {
            this.setCurrentPrivateProfile(null);
            return;
        }

        this.privateProfileUnsubscribe = this.privateUserFirestoreSvc.watchMyProfile(
            (profile) => {
                if (this.isActiveUser(uidNormalizado))
                    this.setCurrentPrivateProfile(profile);
            },
            () => {
                if (this.isActiveUser(uidNormalizado))
                    this.setCurrentPrivateProfile(null);
            }
        );
    }

    private stopPrivateProfileSubscription(): void {
        if (!this.privateProfileUnsubscribe)
            return;

        this.privateProfileUnsubscribe();
        this.privateProfileUnsubscribe = null;
    }

    private async hidratarSesion(firebaseUser: User): Promise<void> {
        const uid = `${firebaseUser.uid ?? ''}`.trim();
        if (uid.length < 1)
            return;

        if (!this.isActiveUser(uid))
            return;
        try {
            await this.persistUserProfile(firebaseUser);
        } catch {
            // Mantiene sesión y permisos aunque falle escritura de perfil.
        }

        if (!this.userProfileApiSvc || this.privateUserFirestoreSvc)
            return;

        try {
            const profile = await this.userProfileApiSvc.getMyProfile();
            if (this.isActiveUser(uid))
                this.setCurrentPrivateProfile(profile);
        } catch {
            // El perfil privado mejora la UI pero no bloquea la sesión.
        }
    }

    private fallbackDisplayName(email: string): string {
        const emailNormalizado = `${email ?? ''}`.trim();
        if (emailNormalizado.length < 1)
            return 'Usuario';
        const atPos = emailNormalizado.indexOf('@');
        if (atPos > 0)
            return emailNormalizado.substring(0, atPos);
        return emailNormalizado;
    }

    private resolveAuthProvider(firebaseUser: User): AuthProviderType {
        const providerIds = this.getAuthProviderIds(firebaseUser);

        if (providerIds.includes('google.com'))
            return 'google';
        if (providerIds.includes('password') || providerIds.includes('email'))
            return 'correo';
        return 'otro';
    }

    private truncate(value: string, maxLength: number): string {
        const text = `${value ?? ''}`.trim();
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength).trim();
    }

    private mapAuthError(error: any, context: 'register' | 'login' | 'password-reset' | 'google-login'): Error {
        const code = this.normalizeAuthErrorCode(error);
        const mapped = new Error(this.resolveAuthErrorMessage(code, context, error));
        (mapped as any).code = code;
        (mapped as any).cause = error;
        return mapped;
    }

    private normalizeAuthErrorCode(error: any): string {
        return `${error?.code ?? ''}`.trim().toLowerCase();
    }

    private resolveAuthErrorMessage(
        code: string,
        context: 'register' | 'login' | 'password-reset' | 'google-login',
        error: any
    ): string {
        if (code.includes('email-already-in-use'))
            return 'Ese correo ya está registrado.';
        if (code.includes('wrong-password') || code.includes('invalid-credential'))
            return 'Las credenciales no son correctas.';
        if (code.includes('user-not-found')) {
            if (context === 'password-reset')
                return 'Si la cuenta existe, recibirás un correo para restablecer la contraseña.';
            return 'No existe ninguna cuenta con ese correo.';
        }
        if (code.includes('too-many-requests'))
            return 'Demasiados intentos. Inténtalo de nuevo más tarde.';
        if (code.includes('invalid-email'))
            return 'Debes indicar un correo electrónico válido.';
        if (code.includes('weak-password'))
            return 'La contraseña es demasiado débil.';
        if (code.includes('network-request-failed'))
            return 'No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.';
        if (code.includes('popup-closed-by-user'))
            return 'Se canceló el inicio de sesión con Google.';
        if (code.includes('popup-blocked'))
            return 'El navegador bloqueó la ventana de inicio de sesión.';

        if (context === 'register')
            return `${error?.message ?? 'No se pudo completar el registro.'}`.trim() || 'No se pudo completar el registro.';
        if (context === 'password-reset')
            return `${error?.message ?? 'No se pudo iniciar la recuperación de contraseña.'}`.trim() || 'No se pudo iniciar la recuperación de contraseña.';
        return `${error?.message ?? 'No se pudo iniciar sesión.'}`.trim() || 'No se pudo iniciar sesión.';
    }

    private isActiveUser(uid: string): boolean {
        const actual = this.authUidActivo.length > 0
            ? this.authUidActivo
            : this.resolveActiveUserUid();
        return actual.length > 0 && actual === `${uid ?? ''}`.trim();
    }

    private buildEffectivePrivateProfile(profile: UserPrivateProfile | null): UserPrivateProfile | null {
        if (!profile)
            return null;

        if (!this.aclHasSourceData)
            return profile;

        return {
            ...profile,
            permissions: this.mergeEffectivePermissions(profile.permissions, this.acl.permissions),
        };
    }

    private mergeEffectivePermissions(
        profilePermissions: UserPrivateProfile['permissions'],
        aclPermissions: UserAcl['permissions']
    ): UserPrivateProfile['permissions'] {
        const merged: UserPrivateProfile['permissions'] = {};

        Object.entries(aclPermissions ?? {}).forEach(([resource, actions]) => {
            const key = `${resource ?? ''}`.trim();
            if (key.length < 1)
                return;
            merged[key] = {
                create: actions?.['create'] === true,
            };
        });

        Object.entries(profilePermissions ?? {}).forEach(([resource, actions]) => {
            const key = `${resource ?? ''}`.trim();
            if (key.length < 1)
                return;
            merged[key] = {
                create: actions?.['create'] === true,
            };
        });

        return merged;
    }
}
