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
import { UserAccessRestrictionReason, UserAccessScope, UserBanStatus, UserComplianceSnapshot, UserModerationSanction } from '../interfaces/user-moderation';
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
    private complianceBootstrapPending: boolean = false;
    private complianceCanonicalOverride: UserComplianceSnapshot | null | undefined = undefined;
    private isLoggedInSubject = new BehaviorSubject<boolean>(false);
    private permisosSubject = new BehaviorSubject<number>(0);
    private isBannedSubject = new BehaviorSubject<boolean>(false);
    private banStatusSubject = new BehaviorSubject<UserBanStatus>(this.buildEmptyBanStatus());
    private aclSubject = new BehaviorSubject<UserAcl>({ ...EMPTY_USER_ACL });
    private privateProfileSubject = new BehaviorSubject<UserPrivateProfile | null>(null);
    private privateProfileBase: UserPrivateProfile | null = null;
    public isLoggedIn$ = this.isLoggedInSubject.asObservable();
    public permisos$ = this.permisosSubject.asObservable();
    public isBanned$ = this.isBannedSubject.asObservable();
    public banStatus$ = this.banStatusSubject.asObservable();
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

    public getCurrentRole(): UserRole {
        return this.resolveCurrentRole();
    }

    public getCurrentCompliance(): UserComplianceSnapshot | null {
        if (this.complianceCanonicalOverride !== undefined)
            return this.complianceCanonicalOverride
                ? this.sanitizeComplianceSnapshot(this.complianceCanonicalOverride)
                : null;

        const currentProfile = this.privateProfileSubject.value;
        const effectiveCompliance = currentProfile
            ? (currentProfile.compliance ?? null)
            : (this.mergeEffectiveCompliance(this.privateProfileBase?.compliance ?? null) ?? null);
        return effectiveCompliance ? { ...effectiveCompliance } : null;
    }

    public getCurrentBanStatus(): UserBanStatus {
        return this.buildBanStatus(this.getCurrentCompliance());
    }

    public getAccessRestriction(scope: UserAccessScope = 'usage'): UserAccessRestrictionReason | null {
        if (!this.sesionAbierta)
            return null;

        const compliance = this.getCurrentCompliance();
        if (!compliance)
            return null;
        const banRestriction = this.getCurrentBanStatus().restriction;
        if (banRestriction)
            return banRestriction;
        if (compliance.mustAcceptUsage)
            return 'mustAcceptUsage';
        if (scope === 'creation' && compliance.mustAcceptCreation)
            return 'mustAcceptCreation';
        return null;
    }

    public canProceed(scope: UserAccessScope = 'usage'): boolean {
        return this.sesionAbierta && !this.getAccessRestriction(scope);
    }

    public getAccessRestrictionMessage(scope: UserAccessScope = 'usage'): string {
        return this.formatAccessRestrictionMessage(this.getAccessRestriction(scope));
    }

    public resolveComplianceRestrictionFromError(
        error: any,
        scope: UserAccessScope = 'usage'
    ): UserAccessRestrictionReason | null {
        const localRestriction = this.getAccessRestriction(scope);
        const status = Number(error?.status ?? 0);
        const code = this.normalizeFunctionalErrorCode(error?.code);
        const localBanRestriction = localRestriction === 'temporaryBan' || localRestriction === 'permanentBan'
            ? localRestriction
            : null;

        if (this.isBannedFunctionalErrorCode(code))
            return localBanRestriction ?? 'permanentBan';
        if (this.isUsagePolicyFunctionalErrorCode(code))
            return 'mustAcceptUsage';
        if (this.isCreationPolicyFunctionalErrorCode(code))
            return 'mustAcceptCreation';
        if (status === 403 && localRestriction)
            return localRestriction;
        return null;
    }

    public getComplianceErrorMessage(error: any, scope: UserAccessScope = 'usage'): string {
        return this.formatAccessRestrictionMessage(this.resolveComplianceRestrictionFromError(error, scope));
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
        if (!this.canProceed(this.resolveActionScope(action)))
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

        const restrictionMessage = this.getAccessRestrictionMessage('creation');
        if (restrictionMessage.length > 0)
            return restrictionMessage;

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
            this.complianceBootstrapPending = false;
            this.complianceCanonicalOverride = undefined;
            this.setAclRaw(null);
            this.setCurrentPrivateProfile(null);
            this.setLoggedIn({ nombre: 'Invitado', correo: '', permisos: 0 });
            return;
        }

        this.authUidActivo = `${firebaseUser.uid ?? ''}`.trim();
        this.complianceBootstrapPending = !!this.userProfileApiSvc;
        this.complianceCanonicalOverride = undefined;

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
        const mergedProfile = this.mergeIncomingPrivateProfile(profile);
        const hasExplicitCompliance = !!profile && Object.prototype.hasOwnProperty.call(profile, 'compliance');
        if (this.userProfileApiSvc && !this.complianceBootstrapPending && hasExplicitCompliance && profile?.compliance === null)
            this.complianceCanonicalOverride = null;
        this.privateProfileBase = mergedProfile;
        const effectiveProfile = this.buildEffectivePrivateProfile(mergedProfile);
        this.privateProfileSubject.next(effectiveProfile);
        this.banStatusSubject.next(this.buildBanStatus(effectiveProfile?.compliance ?? null));
        this.isBannedSubject.next(this.isBanned());
        this.actualizarPermisosDesdeAcl();
        this.evaluarSesionBaneada();

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

    public setCurrentCompliance(compliance: UserComplianceSnapshot | null | undefined): void {
        if (this.privateProfileBase && compliance !== undefined) {
            this.privateProfileBase = {
                ...this.privateProfileBase,
                compliance: this.sanitizeComplianceSnapshot(compliance),
            };
        }
        this.setCanonicalCompliance(compliance);
    }

    public async refreshCurrentPrivateProfile(): Promise<UserPrivateProfile | null> {
        if (!this.userProfileApiSvc)
            return this.CurrentPrivateProfile;

        const uid = this.CurrentUserUid;
        if (uid.length < 1) {
            this.setCurrentPrivateProfile(null);
            return null;
        }

        const [profileResult, complianceResult] = await Promise.allSettled([
            this.userProfileApiSvc.getMyProfile(),
            this.userProfileApiSvc.getMyCompliance(),
        ]);

        if (!this.isActiveUser(uid))
            return this.CurrentPrivateProfile;

        if (complianceResult.status === 'fulfilled')
            this.setCanonicalCompliance(complianceResult.value);
        else if (this.complianceCanonicalOverride === undefined)
            this.setCanonicalCompliance(null);

        if (profileResult.status === 'fulfilled')
            this.setCurrentPrivateProfile(profileResult.value);

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
        this.banStatusSubject.next(this.buildBanStatus(this.privateProfileSubject.value?.compliance ?? null));
        this.isBannedSubject.next(this.isBanned());
        this.actualizarPermisosDesdeAcl();
        this.evaluarSesionBaneada();
    }

    private isAdmin(): boolean {
        return this.acl.roles?.admin === true || this.resolveCurrentRole() === 'admin';
    }

    private resolveCurrentRole(profileOverride?: Pick<UserPrivateProfile, 'role'> | null): UserRole {
        const aclRole = this.normalizeUserRoleValue(this.acl.roles?.type);
        const profileRole = this.normalizeUserRoleValue(
            (profileOverride ?? this.privateProfileSubject.value)?.role
        );

        if (this.aclHasSourceData && aclRole)
            return aclRole;
        if (profileRole === 'admin')
            return 'admin';
        if (profileRole)
            return profileRole;
        return aclRole ?? 'jugador';
    }

    private isBanned(): boolean {
        if (this.complianceBootstrapPending)
            return false;
        return this.getCurrentBanStatus().restriction !== null;
    }

    private actualizarPermisosDesdeAcl(): void {
        const permisos = this.sesionAbierta && this.getCurrentBanStatus().restriction === null && this.isAdmin() ? 1 : 0;
        this.usuario = {
            ...this.usuario,
            permisos,
        };
        this.permisosSubject.next(permisos);
    }

    private evaluarSesionBaneada(): void {
        if (this.complianceBootstrapPending
            || !this.sesionAbierta
            || this.getCurrentBanStatus().restriction !== 'permanentBan'
            || this.banSignOutInProgress) {
            return;
        }

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

        if (!this.userProfileApiSvc)
            return;

        try {
            const [profileResult, complianceResult] = await Promise.allSettled([
                this.userProfileApiSvc.getMyProfile(),
                this.userProfileApiSvc.getMyCompliance(),
            ]);
            if (!this.isActiveUser(uid))
                return;

            this.setCanonicalCompliance(
                complianceResult.status === 'fulfilled'
                    ? complianceResult.value
                    : null
            );

            if (profileResult.status === 'fulfilled')
                this.setCurrentPrivateProfile(profileResult.value);
        } catch {
            // El perfil privado mejora la UI pero no bloquea la sesión.
        } finally {
            if (this.isActiveUser(uid)) {
                this.complianceBootstrapPending = false;
                this.isBannedSubject.next(this.isBanned());
                this.actualizarPermisosDesdeAcl();
                this.evaluarSesionBaneada();
            }
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

    private normalizeFunctionalErrorCode(value: unknown): string {
        return `${value ?? ''}`
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    }

    private isBannedFunctionalErrorCode(code: string): boolean {
        return code.includes('banned');
    }

    private isUsagePolicyFunctionalErrorCode(code: string): boolean {
        return code.includes('mustacceptusage')
            || code.includes('usagepolicyacceptancerequired');
    }

    private isCreationPolicyFunctionalErrorCode(code: string): boolean {
        return code.includes('mustacceptcreation')
            || code.includes('creationpolicyacceptancerequired');
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

        const effectiveCompliance = this.mergeEffectiveCompliance(profile.compliance);
        if (!this.aclHasSourceData)
            return {
                ...profile,
                compliance: effectiveCompliance,
            };

        return {
            ...profile,
            role: this.resolveCurrentRole(profile),
            permissions: this.mergeEffectivePermissions(profile.permissions, this.acl.permissions),
            compliance: effectiveCompliance,
        };
    }

    private mergeIncomingPrivateProfile(profile: UserPrivateProfile | null): UserPrivateProfile | null {
        if (!profile)
            return null;

        const current = this.privateProfileBase;
        if (!current || current.uid !== profile.uid)
            return profile;
        const hasComplianceProperty = Object.prototype.hasOwnProperty.call(profile, 'compliance');

        return {
            ...profile,
            compliance: hasComplianceProperty
                ? (profile.compliance ?? null)
                : (current.compliance ?? null),
        };
    }

    private mergeEffectiveCompliance(profileCompliance: UserComplianceSnapshot | null | undefined): UserComplianceSnapshot | null | undefined {
        if (this.complianceCanonicalOverride !== undefined)
            return this.complianceCanonicalOverride
                ? this.sanitizeComplianceSnapshot(this.complianceCanonicalOverride)
                : null;

        if (this.complianceBootstrapPending && !!this.userProfileApiSvc)
            return null;

        const aclBanned = this.acl.status?.banned === true;
        if (profileCompliance !== null && profileCompliance !== undefined)
            return this.sanitizeComplianceSnapshot(profileCompliance);
        if (this.shouldIgnoreLegacyAclBanForCompliance())
            return null;
        if (!aclBanned)
            return profileCompliance;
        return this.buildLegacyAclBanCompliance();
    }

    private setCanonicalCompliance(compliance: UserComplianceSnapshot | null | undefined): void {
        this.complianceCanonicalOverride = compliance === undefined
            ? undefined
            : this.sanitizeComplianceSnapshot(compliance);
        this.privateProfileSubject.next(this.buildEffectivePrivateProfile(this.privateProfileBase));
        this.banStatusSubject.next(this.buildBanStatus(this.getCurrentCompliance()));
        this.isBannedSubject.next(this.isBanned());
        this.actualizarPermisosDesdeAcl();
        this.evaluarSesionBaneada();
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

    private normalizeUserRoleValue(value: unknown): UserRole | null {
        const normalized = `${value ?? ''}`.trim().toLowerCase();
        if (normalized === 'admin' || normalized === 'colaborador' || normalized === 'master' || normalized === 'jugador')
            return normalized as UserRole;
        return null;
    }

    private resolveActionScope(action: string): UserAccessScope {
        return `${action ?? ''}`.trim().toLowerCase() === 'create' ? 'creation' : 'usage';
    }

    private formatAccessRestrictionMessage(restriction: UserAccessRestrictionReason | null): string {
        if (restriction === 'temporaryBan')
            return 'Tu cuenta está restringida temporalmente. Solo puedes revisar tu estado hasta que termine la sanción.';
        if (restriction === 'permanentBan')
            return 'Tu cuenta no puede realizar esta acción en este momento.';
        if (restriction === 'mustAcceptUsage')
            return 'Debes aceptar las normas de uso vigentes antes de continuar.';
        if (restriction === 'mustAcceptCreation')
            return 'Debes aceptar las normas de creación vigentes antes de continuar.';
        return '';
    }

    private sanitizeComplianceSnapshot(profileCompliance: UserComplianceSnapshot | null | undefined): UserComplianceSnapshot | null {
        if (!profileCompliance)
            return null;

        const activeSanction = this.sanitizeModerationSanction(profileCompliance.activeSanction);

        return {
            banned: profileCompliance.banned === true,
            mustAcceptUsage: profileCompliance.mustAcceptUsage === true,
            mustAcceptCreation: profileCompliance.mustAcceptCreation === true,
            activeSanction,
            usage: profileCompliance.usage ?? null,
            creation: profileCompliance.creation ?? null,
        };
    }

    private sanitizeModerationSanction(sanction: UserModerationSanction | null | undefined): UserModerationSanction | null {
        if (!sanction)
            return null;
        const endsAtUtc = `${sanction.endsAtUtc ?? ''}`.trim();
        return {
            ...sanction,
            isPermanent: sanction.isPermanent === true,
            endsAtUtc: endsAtUtc.length > 0 ? endsAtUtc : null,
        };
    }

    private buildLegacyAclBanCompliance(): UserComplianceSnapshot {
        return {
            banned: true,
            mustAcceptUsage: false,
            mustAcceptCreation: false,
            activeSanction: null,
            usage: null,
            creation: null,
        };
    }

    private shouldIgnoreLegacyAclBanForCompliance(): boolean {
        return !!this.userProfileApiSvc || !!this.privateUserFirestoreSvc;
    }

    private buildBanStatus(compliance: UserComplianceSnapshot | null | undefined): UserBanStatus {
        const sanction = this.sanitizeModerationSanction(compliance?.activeSanction ?? null);
        if (!sanction)
            return this.buildEmptyBanStatus();

        if (sanction.isPermanent) {
            return {
                restriction: 'permanentBan',
                sanction,
                isActiveNow: true,
                endsAtUtc: null,
                expiresInMs: null,
            };
        }

        const endsAtUtc = `${sanction?.endsAtUtc ?? ''}`.trim();
        if (endsAtUtc.length > 0) {
            const parsed = new Date(endsAtUtc);
            if (Number.isNaN(parsed.getTime()))
                return this.buildEmptyBanStatus();
            const expiresInMs = parsed.getTime() - Date.now();
            if ((expiresInMs ?? 0) <= 0)
                return this.buildEmptyBanStatus();
            return {
                restriction: 'temporaryBan',
                sanction,
                isActiveNow: true,
                endsAtUtc,
                expiresInMs,
            };
        }

        return this.buildEmptyBanStatus();
    }

    private buildEmptyBanStatus(): UserBanStatus {
        return {
            restriction: null,
            sanction: null,
            isActiveNow: false,
            endsAtUtc: null,
            expiresInMs: null,
        };
    }
}
