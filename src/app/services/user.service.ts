import { Injectable } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Database, onValue, ref } from '@angular/fire/database';
import { BehaviorSubject, map } from 'rxjs';
import { UserPrivateProfile } from '../interfaces/user-account';
import { Usuario } from '../interfaces/usuario';
import { EMPTY_USER_ACL, UserAcl, UserRole, normalizeUserAcl } from '../interfaces/user-acl';
import { UserAccessRestrictionReason, UserAccessScope, UserBanStatus, UserComplianceSnapshot, UserModerationSanction } from '../interfaces/user-moderation';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';
import { EstadoPlataforma, PlatformSessionService, RestriccionesPlataforma } from './platform-session.service';
import { PrivateUserFirestoreService } from './private-user-firestore.service';
import { UserProfileApiService } from './user-profile-api.service';
import { codigoDeError } from './utils/error-api';

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
    private complianceBootstrapPending: boolean = false;
    private complianceCanonicalOverride: UserComplianceSnapshot | null | undefined = undefined;
    private canonicalAdminAccess: boolean | null = null;
    private canonicalAdminValidationInFlight: Promise<boolean> | null = null;
    private estadoPlataforma: EstadoPlataforma = { tipo: 'comprobando' };
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

    public get IsLoggedIn(): boolean {
        return this.isLoggedInSubject.value;
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

        const restriccion = this.getPlatformRestriction(scope);
        if (restriccion)
            return restriccion;
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
        if (codigoDeError(error) === 'CREATION_POLICY_ACCEPTANCE_REQUIRED')
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
        private privateUserFirestoreSvc?: PrivateUserFirestoreService,
        private platformSessionSvc?: PlatformSessionService,
    ) {
        this.subscribeAuthState((firebaseUser) => {
            this.actualizarSesionDesdeAuth(firebaseUser);
        });
        this.platformSessionSvc?.estado$.subscribe((estado) => this.aplicarEstadoPlataforma(estado));
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

        const profileResource = this.privateProfileSubject.value?.permissions?.[resourceKey] as Record<string, boolean | undefined> | undefined;
        if (profileResource && Object.prototype.hasOwnProperty.call(profileResource, actionKey))
            return profileResource?.[actionKey] === true;

        if (this.userProfileApiSvc || this.privateUserFirestoreSvc)
            return false;

        const aclResource = this.acl.permissions?.[resourceKey];
        if (aclResource && Object.prototype.hasOwnProperty.call(aclResource, actionKey))
            return aclResource?.[actionKey] === true;
        return false;
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

    /** Abre el acceso de Yosiftware sobre la web (ecosistema-kit/ACCESO.md). */
    entrar(vista: 'entrar' | 'registro' = 'entrar'): Promise<boolean> {
        if (!this.platformSessionSvc)
            return Promise.resolve(false);
        return this.platformSessionSvc.entrar(vista);
    }

    /** Cierra la sesión en todas las webs de Yosiftware; la de Firebase la cierra el puente al pasar a `sin_sesion`. */
    logOut() {
        if (this.sesionAbierta && this.platformSessionSvc) {
            return this.platformSessionSvc.salir();
        } else return null;
    }

    private actualizarSesionDesdeAuth(firebaseUser: User | null): void {
        this.stopAclSubscription();
        this.stopPrivateProfileSubscription();

        if (!firebaseUser) {
            this.authUidActivo = '';
            this.complianceBootstrapPending = false;
            this.complianceCanonicalOverride = undefined;
            this.canonicalAdminAccess = null;
            this.canonicalAdminValidationInFlight = null;
            this.setAclRaw(null);
            this.setCurrentPrivateProfile(null);
            this.setLoggedIn({ nombre: 'Invitado', correo: '', permisos: 0 });
            return;
        }

        this.authUidActivo = `${firebaseUser.uid ?? ''}`.trim();
        this.complianceBootstrapPending = false;
        this.complianceCanonicalOverride = undefined;
        this.canonicalAdminAccess = null;
        this.canonicalAdminValidationInFlight = null;

        this.setAclRaw(null);
        const cuenta = this.platformSessionSvc?.cuenta;
        this.setLoggedIn({
            nombre: `${cuenta?.alias ?? firebaseUser.displayName ?? 'Usuario'}`.trim() || 'Usuario',
            correo: `${cuenta?.correo ?? firebaseUser.email ?? ''}`.trim(),
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

        if (!effectiveProfile || !this.sesionAbierta)
            return;

        const displayName = `${effectiveProfile.displayName ?? ''}`.trim();
        this.actualizarUsuarioSesion({
            nombre: displayName.length > 0 ? displayName : this.usuario.nombre,
            correo: this.usuario.correo,
            permisos: this.usuario.permisos,
        });
        void this.validateCurrentAdminAccess(true);
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

    /**
     * Antes lo decidía una llamada de administración a la API. Ahora ser administrador sale solo del rol
     * (`meta/profile` y `Acl/users`, que escribe el backend): se ignora el valor y se vuelve a calcular.
     */
    public setCanonicalAdminAccess(value: boolean | null | undefined): void {
        void value;
        void this.validateCurrentAdminAccess(true);
    }

    private aplicarAccesoAdmin(esAdmin: boolean): void {
        this.canonicalAdminAccess = esAdmin;
        this.actualizarPermisosDesdeAcl();
    }

    public async refreshCurrentPrivateProfile(): Promise<UserPrivateProfile | null> {
        // El perfil privado llega por Firestore (`private_users/{uid}/meta/profile`) y lo proyecta el backend.
        await this.validateCurrentAdminAccess(true);
        return this.CurrentPrivateProfile;
    }

    protected subscribeAuthState(handler: (firebaseUser: User | null) => void): void {
        this.firebaseContextSvc.run(() => onAuthStateChanged(this.auth, handler));
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

    protected getFirebaseUserUid(firebaseUser: User): string {
        return `${firebaseUser?.uid ?? ''}`.trim();
    }

    protected getSnapshotValue(snapshot: any): any {
        return snapshot?.val?.() ?? null;
    }

    private aplicarEstadoPlataforma(estado: EstadoPlataforma): void {
        this.estadoPlataforma = estado;
        if (estado.tipo === 'con_sesion' && this.sesionAbierta) {
            // El alias de la cuenta, si el perfil de Rol aún no ha llegado.
            const nombreActual = `${this.privateProfileSubject.value?.displayName ?? ''}`.trim();
            this.actualizarUsuarioSesion({
                nombre: nombreActual.length > 0 ? nombreActual : estado.cuenta.alias,
                correo: `${estado.cuenta.correo ?? ''}`.trim(),
                permisos: this.usuario.permisos,
            });
        }
        this.setCanonicalCompliance(estado.tipo === 'con_sesion'
            ? {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: !!estado.normasPendientes,
                activeSanction: null,
                usage: null,
                creation: null,
            }
            : undefined);
    }

    /** Restricción de moderación de la plataforma que afecta al alcance pedido, si sigue vigente. */
    private getPlatformRestriction(scope: UserAccessScope): UserAccessRestrictionReason | null {
        const estado = this.estadoPlataforma;
        if (estado.tipo !== 'con_sesion' || !estado.restricciones)
            return null;
        if (!this.restriccionVigente(estado.restricciones))
            return null;
        const alcances = (estado.restricciones.alcances ?? []).map((alcance) => `${alcance}`.trim().toLowerCase());
        if (scope === 'creation' && alcances.includes('creacion'))
            return 'creationRestricted';
        return null;
    }

    /** ¿Tiene limitada la participación en la comunidad (buscador de partidas)? */
    public hasCommunityRestriction(): boolean {
        const estado = this.estadoPlataforma;
        return estado.tipo === 'con_sesion'
            && !!estado.restricciones
            && this.restriccionVigente(estado.restricciones)
            && (estado.restricciones.alcances ?? []).some((alcance) => `${alcance}`.trim().toLowerCase() === 'comunidad');
    }

    private restriccionVigente(restricciones: RestriccionesPlataforma): boolean {
        const hasta = this.fechaRestriccion(restricciones.hasta);
        return hasta === null || hasta.getTime() > Date.now();
    }

    private fechaRestriccion(valor: RestriccionesPlataforma['hasta']): Date | null {
        if (valor === null || valor === undefined || `${valor}`.trim() === '')
            return null;
        const fecha = typeof valor === 'number' ? new Date(valor < 1e12 ? valor * 1000 : valor) : new Date(valor);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }

    private actualizarUsuarioSesion(value: Usuario): void {
        this.usuario = {
            nombre: `${value?.nombre ?? ''}`.trim(),
            correo: `${value?.correo ?? ''}`.trim(),
            permisos: 0,
        };

        // La sesión de Firebase solo existe con sesión en la plataforma; la cuenta puede no tener correo.
        const abrirSesion: boolean = this.usuario.nombre !== 'Invitado' && this.authUidActivo.length > 0;
        this.isLoggedInSubject.next(abrirSesion);
        this.sesionAbierta = abrirSesion;
        this.actualizarPermisosDesdeAcl();
    }

    private setAclRaw(raw: any): void {
        this.aclHasSourceData = !!raw && typeof raw === 'object';
        this.acl = normalizeUserAcl(raw);
        void this.validateCurrentAdminAccess(true);
        this.aclSubject.next(this.acl);
        this.privateProfileSubject.next(this.buildEffectivePrivateProfile(this.privateProfileBase));
        this.banStatusSubject.next(this.buildBanStatus(this.privateProfileSubject.value?.compliance ?? null));
        this.isBannedSubject.next(this.isBanned());
        this.actualizarPermisosDesdeAcl();
    }

    private isAdmin(): boolean {
        return this.canonicalAdminAccess === true;
    }

    private resolveCurrentRole(profileOverride?: Pick<UserPrivateProfile, 'role'> | null): UserRole {
        const aclRole = this.normalizeUserRoleValue(this.acl.roles?.type);
        const profileRole = this.normalizeUserRoleValue(
            (profileOverride ?? this.privateProfileSubject.value)?.role
        );

        if (this.isAdmin())
            return 'admin';
        if (this.userProfileApiSvc || this.privateUserFirestoreSvc) {
            if (profileRole && profileRole !== 'admin')
                return profileRole;
            if (this.aclHasSourceData && aclRole && aclRole !== 'admin')
                return aclRole;
            return 'jugador';
        }
        if (this.aclHasSourceData && aclRole)
            return aclRole;
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
        if (uid.length < 1 || !this.isActiveUser(uid))
            return;
        await this.validateCurrentAdminAccess(true);
        this.isBannedSubject.next(this.isBanned());
        this.actualizarPermisosDesdeAcl();
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
    }

    private mergeEffectivePermissions(
        profilePermissions: UserPrivateProfile['permissions'],
        aclPermissions: UserAcl['permissions']
    ): UserPrivateProfile['permissions'] {
        const merged: UserPrivateProfile['permissions'] = {};

        if (this.userProfileApiSvc || this.privateUserFirestoreSvc) {
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
            return 'Debes aceptar las normas de Rol vigentes antes de crear o editar contenido.';
        if (restriction === 'creationRestricted' || restriction === 'communityRestricted') {
            const estado = this.estadoPlataforma;
            const hasta = estado.tipo === 'con_sesion' ? this.fechaRestriccion(estado.restricciones?.hasta) : null;
            const que = restriction === 'creationRestricted' ? 'la creación de contenido' : 'la participación en la comunidad';
            const cuando = hasta
                ? ` hasta el ${hasta.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}`
                : ' de forma indefinida';
            return `Tu cuenta tiene limitada ${que}${cuando}. Puedes ver el motivo en la moderación de tu cuenta de Yosiftware.`;
        }
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

    private async validateCurrentAdminAccess(force: boolean = false): Promise<boolean> {
        void force;
        const esAdmin = this.sesionAbierta && (
            this.normalizeUserRoleValue(this.privateProfileBase?.role) === 'admin'
            || (this.acl.roles?.admin === true && this.normalizeUserRoleValue(this.acl.roles?.type) === 'admin')
        );
        if (this.canonicalAdminAccess !== esAdmin)
            this.aplicarAccesoAdmin(esAdmin);
        return esAdmin;
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
