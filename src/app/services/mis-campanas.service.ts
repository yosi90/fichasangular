import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, distinctUntilChanged, merge } from 'rxjs';
import { UserRole } from '../interfaces/user-acl';
import { CampanaService } from './campana.service';
import { UserService } from './user.service';

/** Los roles globales que siempre ven «Mis campañas»: pueden crear campañas o gestionarlas. */
const ROLES_CON_CAMPANAS: ReadonlySet<UserRole> = new Set<UserRole>(['master', 'colaborador', 'admin']);

/**
 * Si el menú lateral enseña «Mis campañas» (decisión 3 de la ronda de noviembre): con sesión, si el rol global es máster,
 * colaborador o admin, o si la persona es miembro activo de alguna campaña. La pertenencia sale de las campañas privadas
 * de la cuenta (`CampanaService.watchCampaignSummaries`), que solo se escuchan con sesión y cuando el rol no basta; al
 * cerrar la sesión se dejan de escuchar y lo que llegue tarde se descarta (ecosistema-kit/CAMBIO_DE_CUENTA.md; además, la
 * página se recarga al cambiar de cuenta).
 */
@Injectable({
    providedIn: 'root'
})
export class MisCampanasService implements OnDestroy {
    private readonly visibleSubject = new BehaviorSubject<boolean>(false);
    readonly visible$: Observable<boolean> = this.visibleSubject.pipe(distinctUntilChanged());

    private conMembresia = false;
    private dejarDeEscuchar: (() => void) | null = null;
    private readonly cambios: Subscription;

    constructor(private userSvc: UserService, private campanaSvc: CampanaService) {
        this.cambios = merge(this.userSvc.isLoggedIn$, this.userSvc.currentPrivateProfile$, this.userSvc.permisos$)
            .subscribe(() => this.actualizar());
    }

    get visible(): boolean {
        return this.visibleSubject.value;
    }

    ngOnDestroy(): void {
        this.cambios.unsubscribe();
        this.pararEscucha();
    }

    private actualizar(): void {
        if (!this.userSvc.IsLoggedIn) {
            this.pararEscucha();
            this.conMembresia = false;
            this.visibleSubject.next(false);
            return;
        }
        if (ROLES_CON_CAMPANAS.has(this.userSvc.getCurrentRole())) {
            this.pararEscucha();
            this.visibleSubject.next(true);
            return;
        }
        this.escucharMembresias();
        this.visibleSubject.next(this.conMembresia);
    }

    private escucharMembresias(): void {
        if (this.dejarDeEscuchar)
            return;
        let activa = true;
        const parar = this.campanaSvc.watchCampaignSummaries(
            (campanas) => {
                if (!activa)
                    return;
                this.conMembresia = campanas.some((campana) => this.campanaSvc.hasActiveMembership(campana));
                this.actualizar();
            },
            () => undefined,
        );
        this.dejarDeEscuchar = () => {
            activa = false;
            parar();
        };
    }

    private pararEscucha(): void {
        this.dejarDeEscuchar?.();
        this.dejarDeEscuchar = null;
    }
}
