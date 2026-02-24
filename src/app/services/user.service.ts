import { Injectable } from '@angular/core';
import {
    Auth,
    GoogleAuthProvider,
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from '@angular/fire/auth';
import { Database, get, onValue, ref, set } from '@angular/fire/database';
import { BehaviorSubject, map } from 'rxjs';
import { Usuario } from '../interfaces/usuario';
import { EMPTY_USER_ACL, UserAcl, normalizeUserAcl } from '../interfaces/user-acl';
import { AuthProviderType, UserProfile } from '../interfaces/user-profile';
import { UsuarioUpsertRequestDto, UsuarioUpsertResponseDto } from '../interfaces/usuarios-api';
import { UsuariosApiService } from './usuarios-api.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private usuario: Usuario = { nombre: 'Invitado', correo: '', permisos: 0 };
    private acl: UserAcl = { ...EMPTY_USER_ACL };
    private sesionAbierta: boolean = false;
    private authUidActivo: string = '';
    private aclUnsubscribe: (() => void) | null = null;
    private banSignOutInProgress: boolean = false;
    private isLoggedInSubject = new BehaviorSubject<boolean>(false);
    private permisosSubject = new BehaviorSubject<number>(0);
    private isBannedSubject = new BehaviorSubject<boolean>(false);
    private aclSubject = new BehaviorSubject<UserAcl>({ ...EMPTY_USER_ACL });
    private upsertApiDeshabilitadoEnSesion = false;
    public isLoggedIn$ = this.isLoggedInSubject.asObservable();
    public permisos$ = this.permisosSubject.asObservable();
    public isBanned$ = this.isBannedSubject.asObservable();
    public acl$ = this.aclSubject.asObservable();
    public esAdmin$ = this.permisos$.pipe(map((value) => value === 1));

    public get Usuario() {
        return this.usuario;
    }

    public get CurrentUserUid(): string {
        return `${this.auth.currentUser?.uid ?? ''}`.trim();
    }

    constructor(private auth: Auth, private db: Database, private usuariosApiSvc: UsuariosApiService) {
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

        const role = this.currentRole();
        if (this.isAdmin())
            return true;

        const resourceKey = `${resource ?? ''}`.trim().toLowerCase();
        const actionKey = `${action ?? ''}`.trim().toLowerCase();
        if (resourceKey.length < 1 || actionKey.length < 1)
            return false;

        if (actionKey === 'create' && resourceKey === 'personajes')
            return role === 'usuario' || role === 'colaborador' || role === 'admin';
        if (role === 'usuario')
            return false;

        return this.acl.permissions?.[resourceKey]?.[actionKey] === true;
    }

    register({ email, password }: any) {
        if (!this.sesionAbierta) {
            return createUserWithEmailAndPassword(this.auth, email, password)
                .catch(error => {
                    console.log(error);
                    throw error;
                });
        } else return null;
    }

    loginEmailPass({ email, password }: any) {
        if (!this.sesionAbierta) {
            return signInWithEmailAndPassword(this.auth, email, password)
                .catch(error => {
                    console.log(error);
                    throw error;
                });
        } else return null;
    }

    loginGoogle() {
        if (!this.sesionAbierta) {
            return signInWithPopup(this.auth, new GoogleAuthProvider())
                .catch(error => {
                    console.log(error);
                    throw error;
                });
        } else return null;
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

        if (!firebaseUser) {
            this.authUidActivo = '';
            this.banSignOutInProgress = false;
            this.setAclRaw(null);
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
        void this.hidratarSesion(firebaseUser);
    }

    protected subscribeAuthState(handler: (firebaseUser: User | null) => void): void {
        onAuthStateChanged(this.auth, handler);
    }

    protected ejecutarSignOut(): Promise<void> {
        return signOut(this.auth);
    }

    protected upsertUserApi(payload: UsuarioUpsertRequestDto): Promise<UsuarioUpsertResponseDto> {
        return this.usuariosApiSvc.upsertUser(payload);
    }

    protected watchAclPath(uid: string, onData: (rawAcl: any) => void, onError: () => void): () => void {
        const aclRef = ref(this.db, `Acl/users/${uid}`);
        return onValue(
            aclRef,
            (snapshot) => onData(snapshot.val()),
            () => onError()
        );
    }

    protected async persistUserProfile(firebaseUser: User): Promise<void> {
        const uid = `${firebaseUser?.uid ?? ''}`.trim();
        if (uid.length < 1)
            return;

        const profileRef = ref(this.db, `UserProfiles/${uid}`);
        const now = Date.now();
        const snapshot = await get(profileRef);
        const existente = snapshot.val();
        const createdAtRaw = Number(existente?.createdAt);

        const displayName = `${firebaseUser.displayName ?? ''}`.trim();
        const email = `${firebaseUser.email ?? ''}`.trim();
        const payload: UserProfile = {
            uid,
            displayName: displayName.length > 0 ? displayName : this.fallbackDisplayName(email),
            email,
            authProvider: this.resolveAuthProvider(firebaseUser),
            createdAt: Number.isFinite(createdAtRaw) && createdAtRaw > 0 ? Math.trunc(createdAtRaw) : now,
            lastSeenAt: now,
        };
        await set(profileRef, payload);
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
        this.acl = normalizeUserAcl(raw);
        this.aclSubject.next(this.acl);
        this.isBannedSubject.next(this.isBanned());
        this.actualizarPermisosDesdeAcl();
        this.evaluarSesionBaneada();
    }

    private isAdmin(): boolean {
        return this.acl.roles?.admin === true;
    }

    private currentRole(): 'usuario' | 'colaborador' | 'admin' {
        return this.acl.roles?.type ?? 'usuario';
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

    private async hidratarSesion(firebaseUser: User): Promise<void> {
        const uid = `${firebaseUser.uid ?? ''}`.trim();
        if (uid.length < 1)
            return;

        if (!this.upsertApiDeshabilitadoEnSesion) {
            try {
                const upsertPayload = this.buildUpsertPayload(firebaseUser);
                await this.upsertUserApi(upsertPayload);
            } catch (error: any) {
                if (this.debeDeshabilitarUpsertApi(error))
                    this.upsertApiDeshabilitadoEnSesion = true;
                // Backup best-effort: el runtime de permisos vive en RTDB.
            }
        }

        if (!this.isActiveUser(uid))
            return;
        try {
            await this.persistUserProfile(firebaseUser);
        } catch {
            // Mantiene sesión y permisos aunque falle escritura de perfil.
        }
    }

    private debeDeshabilitarUpsertApi(error: any): boolean {
        const message = `${error?.message ?? error ?? ''}`.toLowerCase();
        // HTTP 0 suele indicar CORS/bloqueo de red en navegador.
        return message.includes('http 0')
            || message.includes('cors')
            || message.includes('failed to fetch')
            || message.includes('network');
    }

    private buildUpsertPayload(firebaseUser: User): UsuarioUpsertRequestDto {
        const uid = `${firebaseUser.uid ?? ''}`.trim();
        const emailRaw = `${firebaseUser.email ?? ''}`.trim();
        const email = this.truncate(emailRaw.length > 0 ? emailRaw : `${uid}@sin-email.local`, 60);
        const displayNameRaw = `${firebaseUser.displayName ?? ''}`.trim();
        const displayName = this.truncate(
            displayNameRaw.length > 0 ? displayNameRaw : this.fallbackDisplayName(email),
            20
        );

        return {
            uid,
            displayName,
            email,
            authProvider: this.resolveAuthProvider(firebaseUser),
        };
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
        const providerIds = (firebaseUser?.providerData ?? [])
            .map((provider) => `${provider?.providerId ?? ''}`.trim().toLowerCase())
            .filter((providerId) => providerId.length > 0);

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

    private isActiveUser(uid: string): boolean {
        const actual = this.authUidActivo.length > 0
            ? this.authUidActivo
            : `${this.auth.currentUser?.uid ?? ''}`.trim();
        return actual.length > 0 && actual === `${uid ?? ''}`.trim();
    }
}
