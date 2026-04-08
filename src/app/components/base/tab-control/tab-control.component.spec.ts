import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { TabControlComponent } from './tab-control.component';

function crearComponente(overrides?: { pSvc?: any; }): TabControlComponent {
    const isLoggedIn$ = new BehaviorSubject<boolean>(false);
    const permisos$ = new BehaviorSubject<number>(0);
    const banStatus$ = new BehaviorSubject<any>({
        restriction: null,
        sanction: null,
        isActiveNow: false,
        endsAtUtc: null,
        expiresInMs: null,
    });
    const userSvc = {
        Usuario: { permisos: 0 },
        isLoggedIn$,
        permisos$,
        banStatus$,
    } as any;
    const ngZone = { run: (fn: () => void) => fn() } as any;
    const monstruoSvc = { getMonstruo: jasmine.createSpy('getMonstruo').and.returnValue(of({ Id: 90, Nombre: 'Grifo' })) } as any;
    const armaSvc = { getArma: jasmine.createSpy('getArma').and.returnValue(of({ Id: 70, Nombre: 'Espada larga' })) } as any;
    const armaduraSvc = { getArmadura: jasmine.createSpy('getArmadura').and.returnValue(of({ Id: 71, Nombre: 'Escudo pesado', Es_escudo: true })) } as any;
    const deidadSvc = {
        getDeidad: jasmine.createSpy('getDeidad').and.returnValue(of({ Id: 72, Nombre: 'Heironeous' })),
        getDeidades: jasmine.createSpy('getDeidades').and.returnValue(of([{ Id: 72, Nombre: 'Heironeous' }])),
    } as any;
    const pSvc = overrides?.pSvc ?? {} as any;
    const manualRefNavSvc = { aperturas$: new Subject<any>() } as any;
    const manualVistaNavSvc = { aperturas$: new Subject<any>() } as any;
    const cacheSyncMetadataSvc = {
        getSnapshotOnce: jasmine.createSpy('getSnapshotOnce').and.resolveTo(null),
        buildUiState: jasmine.createSpy('buildUiState').and.returnValue([]),
    } as any;
    const userProfileNavSvc = {
        privateProfileOpen$: new Subject<any>(),
        publicProfileOpen$: new Subject<any>(),
        accountRestrictionOpen$: new Subject<any>(),
        socialOpen$: new Subject<any>(),
        adminPanelOpen$: new Subject<any>(),
        roadmapOpen$: new Subject<void>(),
        legalPrivacyOpen$: new Subject<void>(),
        usageAboutOpen$: new Subject<void>(),
        feedbackBugOpen$: new Subject<void>(),
        feedbackFeatureOpen$: new Subject<void>(),
    } as any;
    const component = new TabControlComponent(
        userSvc,
        pSvc,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        monstruoSvc,
        armaSvc,
        armaduraSvc,
        deidadSvc,
        {} as any,
        manualRefNavSvc,
        manualVistaNavSvc,
        cacheSyncMetadataSvc,
        ngZone,
        userProfileNavSvc,
    );

    const buildTabs = () => {
        const tabs: any[] = [];
        if (!component.temporaryRestrictionActive)
            tabs.push({ textLabel: 'Personajes' });
        if (component.usrLoggedIn && component.privateProfileTabOpen)
            tabs.push({ textLabel: 'Mi perfil' });
        if (component.restrictionTabOpen)
            tabs.push({ textLabel: 'Cuenta restringida' });
        if (component.socialTabOpen)
            tabs.push({ textLabel: 'Social' });
        if (component.usrPerm === 1 && component.adminPanelTabOpen)
            tabs.push({ textLabel: 'Panel de administración' });
        if (component.roadmapTabOpen)
            tabs.push({ textLabel: 'Roadmap' });
        if (component.legalPrivacyTabOpen)
            tabs.push({ textLabel: 'Legal y privacidad' });
        if (component.usageAboutTabOpen)
            tabs.push({ textLabel: 'Uso y acerca' });
        if (component.feedbackBugTabOpen)
            tabs.push({ textLabel: 'Reportar bug' });
        if (component.feedbackFeatureTabOpen)
            tabs.push({ textLabel: 'Solicitar funcionalidad' });
        (component.detallesPersonajeAbiertos ?? []).forEach((pj: any) => tabs.push({ textLabel: pj.Nombre }));
        (component.publicProfileTabs ?? []).forEach((tab: any) => tabs.push({ textLabel: component.getEtiquetaPerfilPublico(tab) }));
        if (component.AbrirNuevoPersonajeTab)
            tabs.push({ textLabel: 'Nuevo personaje' });
        (component.listadoTabsAbiertos ?? []).forEach((tab: any) => tabs.push({ textLabel: component.getEtiquetaListadoTab(tab) }));
        (component.detallesManualAbiertos ?? []).forEach((manual: any) => tabs.push({ textLabel: component.getEtiquetaManual(manual) }));
        (component.detallesRazaAbiertos ?? []).forEach((raza: any) => tabs.push({ textLabel: raza.Nombre }));
        (component.detallesConjuroAbiertos ?? []).forEach((conjuro: any) => tabs.push({ textLabel: conjuro.Nombre }));
        (component.detallesSortilegaAbiertos ?? []).forEach((tupla: any) => tabs.push({ textLabel: tupla.ap.Conjuro.Nombre }));
        (component.detallesTipoCriaturaAbiertos ?? []).forEach((tipo: any) => tabs.push({ textLabel: tipo.Nombre }));
        (component.detallesRasgoAbiertos ?? []).forEach((rasgo: any) => tabs.push({ textLabel: rasgo.Nombre }));
        (component.detallesClaseAbiertos ?? []).forEach((clase: any) => tabs.push({ textLabel: component.getEtiquetaClase(clase) }));
        (component.detallesEspecialAbiertos ?? []).forEach((especial: any) => tabs.push({ textLabel: component.getEtiquetaEspecial(especial) }));
        (component.detallesRacialAbiertos ?? []).forEach((racial: any) => tabs.push({ textLabel: component.getEtiquetaRacial(racial) }));
        (component.detallesDoteAbiertos ?? []).forEach((dote: any) => tabs.push({ textLabel: component.getEtiquetaDote(dote) }));
        (component.detallesVentajaAbiertos ?? []).forEach((ventaja: any) => tabs.push({ textLabel: component.getEtiquetaVentaja(ventaja) }));
        (component.detallesPlantillaAbiertos ?? []).forEach((plantilla: any) => tabs.push({ textLabel: component.getEtiquetaPlantilla(plantilla) }));
        (component.detallesSubtipoAbiertos ?? []).forEach((subtipo: any) => tabs.push({ textLabel: component.getEtiquetaSubtipo(subtipo) }));
        (component.detallesMonstruoAbiertos ?? []).forEach((monstruo: any) => tabs.push({ textLabel: component.getEtiquetaMonstruo(monstruo) }));
        (component.detallesArmaAbiertos ?? []).forEach((arma: any) => tabs.push({ textLabel: component.getEtiquetaArma(arma) }));
        (component.detallesArmaduraAbiertos ?? []).forEach((armadura: any) => tabs.push({ textLabel: component.getEtiquetaArmadura(armadura) }));
        (component.detallesDeidadAbiertos ?? []).forEach((deidad: any) => tabs.push({ textLabel: component.getEtiquetaDeidad(deidad) }));
        return tabs;
    };

    (component as any).TabGroup = {
        selectedIndex: 0,
        _tabs: { toArray: () => buildTabs() },
    };
    (component as any).activeTabKey = 'base:personajes';
    (component as any).__monstruoSvc = monstruoSvc;
    (component as any).__userSvc = userSvc;
    (component as any).__isLoggedIn$ = isLoggedIn$;
    (component as any).__permisos$ = permisos$;
    (component as any).__banStatus$ = banStatus$;
    (component as any).__userProfileNavSvc = userProfileNavSvc;
    (component as any).__cacheSyncMetadataSvc = cacheSyncMetadataSvc;

    return component;
}

describe('TabControlComponent navegación por origen', () => {
    const crearClase = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);
    const crearConjuro = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);
    const crearRaza = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);
    const crearMonstruo = (id: number, nombre: string) => ({ Id: id, Nombre: nombre } as any);

    it('cierra pestaña activa y vuelve a su origen inmediato', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(11, 'Guerrero');
        const conjuro = crearConjuro(77, 'Bola de fuego');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirDetallesConjuro(conjuro);
        tick(120);

        component.quitarDetallesConjuro(conjuro);

        expect((component as any).activeTabKey).toBe('clase:11');
        expect(component.detallesConjuroAbiertos.length).toBe(0);
    }));

    it('usa fallback a personajes si el origen ya no existe', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(12, 'Mago');
        const conjuro = crearConjuro(78, 'Misil mágico');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirDetallesConjuro(conjuro);
        tick(120);

        component.quitarDetallesClase(clase);
        expect((component as any).activeTabKey).toBe('conjuro:78');

        component.quitarDetallesConjuro(conjuro);
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('no relinka origen al reabrir una pestaña ya abierta', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(13, 'Clérigo');

        component.abrirDetallesClase(clase);
        tick(120);

        component.AbrirNuevoPersonajeTab = 1;
        (component as any).selectTabByKey('base:nuevo');
        component.abrirDetallesClase(clase);

        component.quitarDetallesClase(clase);

        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('cerrar pestaña en segundo plano mantiene la pestaña activa actual', fakeAsync(() => {
        const component = crearComponente();
        const raza = crearRaza(4, 'Elfo');
        const conjuro = crearConjuro(80, 'Escudo');

        component.abrirDetallesRaza(raza);
        tick(120);
        component.abrirDetallesConjuro(conjuro);
        tick(120);

        component.quitarDetallesRaza(raza);

        expect((component as any).activeTabKey).toBe('conjuro:80');
    }));

    it('ESC aplica la misma política de retorno por origen', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(14, 'Druida');
        const conjuro = crearConjuro(81, 'Convocar aliado');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirDetallesConjuro(conjuro);
        tick(120);

        component.onEscPressed();

        expect((component as any).activeTabKey).toBe('clase:14');
        expect(component.detallesConjuroAbiertos.length).toBe(0);
    }));

    it('autoabre la pestaña de restricción y cierra social cuando entra un ban temporal', fakeAsync(() => {
        const component = crearComponente();
        const banStatus$ = (component as any).__banStatus$ as BehaviorSubject<any>;
        const isLoggedIn$ = (component as any).__isLoggedIn$ as BehaviorSubject<boolean>;

        component.ngOnInit();
        isLoggedIn$.next(true);
        component.abrirSocial({ section: 'mensajes', requestId: 1 });
        tick(120);

        banStatus$.next({
            restriction: 'temporaryBan',
            sanction: {
                sanctionId: 7,
                kind: 'ban',
                code: 'manual-ban',
                name: 'Ban temporal',
                startsAtUtc: '2026-04-02T09:00:00Z',
                endsAtUtc: '2026-04-02T10:00:00Z',
                isPermanent: false,
            },
            isActiveNow: true,
            endsAtUtc: '2026-04-02T10:00:00Z',
            expiresInMs: 60_000,
        });
        tick(120);

        expect(component.temporaryRestrictionActive).toBeTrue();
        expect(component.restrictionTabOpen).toBeTrue();
        expect(component.socialTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:restriction');
    }));

    it('la navegación puede abrir la pestaña de restricción temporal', fakeAsync(() => {
        const component = crearComponente();
        const banStatus$ = (component as any).__banStatus$ as BehaviorSubject<any>;
        const navSvc = (component as any).__userProfileNavSvc as any;

        component.ngOnInit();
        banStatus$.next({
            restriction: 'temporaryBan',
            sanction: null,
            isActiveNow: true,
            endsAtUtc: '2026-04-02T10:00:00Z',
            expiresInMs: 60_000,
        });
        tick(120);

        navSvc.accountRestrictionOpen$.next({ section: 'resumen', requestId: 2 });
        tick(120);

        expect(component.restrictionTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:restriction');
    }));

    it('cierra la pestaña de restricción al levantarse el bloqueo y sale del estado restringido', fakeAsync(() => {
        const component = crearComponente();
        const banStatus$ = (component as any).__banStatus$ as BehaviorSubject<any>;
        const isLoggedIn$ = (component as any).__isLoggedIn$ as BehaviorSubject<boolean>;

        component.ngOnInit();
        isLoggedIn$.next(true);
        component.abrirPerfilPrivado({ section: 'resumen', requestId: 1 });
        tick(120);

        banStatus$.next({
            restriction: 'temporaryBan',
            sanction: null,
            isActiveNow: true,
            endsAtUtc: '2026-04-02T10:00:00Z',
            expiresInMs: 60_000,
        });
        tick(120);
        expect(component.restrictionTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:restriction');

        banStatus$.next({
            restriction: null,
            sanction: null,
            isActiveNow: false,
            endsAtUtc: null,
            expiresInMs: null,
        });
        tick(120);

        expect(component.temporaryRestrictionActive).toBeFalse();
        expect(component.restrictionTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('abre detalle de monstruo desde listado dinámico', fakeAsync(() => {
        const component = crearComponente();
        const monstruo = crearMonstruo(21, 'Hidra');

        component.abrirListadoTab('monstruos', 'detalles');
        tick(120);
        component.recibirObjetoListado({ item: monstruo, tipo: 'monstruos' });
        tick(120);

        expect(component.detallesMonstruoAbiertos.length).toBe(1);
        expect((component as any).activeTabKey).toBe('monstruo:21');
    }));

    it('abre detalle de arma desde listado dinámico', fakeAsync(() => {
        const component = crearComponente();
        const arma = { Id: 31, Nombre: 'Espada larga' } as any;

        component.abrirListadoTab('armas', 'detalles');
        tick(120);
        component.recibirObjetoListado({ item: arma, tipo: 'armas' });
        tick(120);

        expect(component.detallesArmaAbiertos.length).toBe(1);
        expect((component as any).activeTabKey).toBe('arma:31');
    }));

    it('abre detalle de armadura por id', () => {
        const component = crearComponente();

        component.abrirDetallesArmaduraPorId(71);

        expect(component.detallesArmaduraAbiertos.length).toBe(1);
    });

    it('abre detalle de deidad por id', () => {
        const component = crearComponente();

        component.abrirDetallesDeidadPorId(72);

        expect(component.detallesDeidadAbiertos.length).toBe(1);
    });

    it('abre detalle de deidad por nombre', () => {
        const component = crearComponente();

        component.abrirDetallesDeidadPorNombre('Heironeous');

        expect(component.detallesDeidadAbiertos.length).toBe(1);
    });

    it('navegación desde manual enruta tipo monstruo por id', () => {
        const component = crearComponente();
        const spy = spyOn(component, 'abrirDetallesMonstruoPorId');

        (component as any).abrirDesdeManual({ tipo: 'monstruo', id: 44, nombre: 'Mantícora', manualId: 2 });

        expect(spy).toHaveBeenCalledWith(44);
    });

    it('ESC cierra monstruo y vuelve al origen', fakeAsync(() => {
        const component = crearComponente();
        const raza = crearRaza(4, 'Elfo');
        const monstruo = crearMonstruo(66, 'Lobo terrible');

        component.abrirDetallesRaza(raza);
        tick(120);
        component.abrirDetallesMonstruo(monstruo);
        tick(120);

        component.onEscPressed();

        expect(component.detallesMonstruoAbiertos.length).toBe(0);
        expect((component as any).activeTabKey).toBe('raza:4');
    }));

    it('onNuevoPersonajeFinalizado cierra nuevo personaje y abre detalles', () => {
        const component = crearComponente();
        const cerrarSpy = spyOn(component, 'quitarNuevoPersonaje');
        const abrirSpy = spyOn(component, 'abrirDetallesPersonaje').and.resolveTo();

        component.onNuevoPersonajeFinalizado(123);

        expect(cerrarSpy).toHaveBeenCalled();
        expect(abrirSpy).toHaveBeenCalledWith(123);
    });

    it('abrirDetallesPersonaje no duplica pestañas ante nuevas emisiones del mismo observable', fakeAsync(() => {
        const subject = new Subject<any>();
        const pSvc = {
            getDetallesPersonaje: jasmine.createSpy('getDetallesPersonaje').and.resolveTo(subject.asObservable()),
        };
        const component = crearComponente({ pSvc });

        void component.abrirDetallesPersonaje(42);
        tick();

        subject.next({ Id: 42, Nombre: 'Druida' } as any);
        tick(120);
        expect(component.detallesPersonajeAbiertos.length).toBe(1);

        subject.next({ Id: 42, Nombre: 'Druida actualizado' } as any);
        tick(120);
        expect(component.detallesPersonajeAbiertos.length).toBe(1);
    }));

    it('mantiene pestañas separadas para listado e insercion', fakeAsync(() => {
        const component = crearComponente();

        component.abrirListadoTab('dotes', 'detalles');
        tick(120);
        component.abrirListadoTab('conjuros', 'insertar');
        tick(120);

        expect(component.listadoTabsAbiertos.map((tab) => tab.key)).toEqual([
            'listado:detalles:dotes',
            'listado:insertar:conjuros',
        ]);
        expect((component as any).activeTabKey).toBe('listado:insertar:conjuros');
    }));

    it('ESC cierra la pestaña de listado activa y vuelve al origen', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(15, 'Explorador');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirListadoTab('dotes', 'detalles');
        tick(120);

        component.onEscPressed();

        expect(component.listadoTabsAbiertos.length).toBe(0);
        expect((component as any).activeTabKey).toBe('clase:15');
    }));

    it('abre mi perfil como tab dinamica y la puede cerrar con ESC', fakeAsync(() => {
        const component = crearComponente();
        component.usrLoggedIn = true;

        component.abrirPerfilPrivado();
        tick(120);

        expect(component.privateProfileTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:perfil');

        component.onEscPressed();

        expect(component.privateProfileTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('abre mi perfil con la sección solicitada y la conserva en el request activo', fakeAsync(() => {
        const component = crearComponente();
        component.usrLoggedIn = true;

        component.abrirPerfilPrivado('preferencias');
        tick(120);

        expect(component.privateProfileTabOpen).toBeTrue();
        expect(component.privateProfileOpenRequest?.section).toBe('preferencias');
        expect((component as any).activeTabKey).toBe('base:perfil');
    }));

    it('abre social como tab dinámica y la puede cerrar con ESC', fakeAsync(() => {
        const component = crearComponente();

        component.abrirSocial({ section: 'amistades', requestId: 4 });
        tick(120);

        expect(component.socialTabOpen).toBeTrue();
        expect(component.socialOpenRequest?.section).toBe('amistades');
        expect((component as any).activeTabKey).toBe('base:social');

        component.onEscPressed();

        expect(component.socialTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('la navegación social por servicio propaga la sección y la conversación pedidas', fakeAsync(() => {
        const component = crearComponente();
        const userProfileNavSvc = (component as any).__userProfileNavSvc as any;

        component.ngOnInit();
        userProfileNavSvc.socialOpen$.next({ section: 'mensajes', conversationId: 55, requestId: 9 });
        tick(120);

        expect(component.socialTabOpen).toBeTrue();
        expect(component.socialOpenRequest).toEqual({
            section: 'mensajes',
            conversationId: 55,
            campaignId: null,
            requestId: 9,
        });
    }));

    it('la navegación de perfil por servicio propaga la sección pedida', fakeAsync(() => {
        const component = crearComponente();
        const isLoggedIn$ = (component as any).__isLoggedIn$ as BehaviorSubject<boolean>;
        const userProfileNavSvc = (component as any).__userProfileNavSvc as any;

        component.ngOnInit();
        isLoggedIn$.next(true);
        tick();

        userProfileNavSvc.privateProfileOpen$.next({ section: 'identidad', requestId: 7 });
        tick(120);

        expect(component.privateProfileTabOpen).toBeTrue();
        expect(component.privateProfileOpenRequest).toEqual({
            section: 'identidad',
            requestId: 7,
            campaignId: null,
        });
    }));

    it('reutiliza la misma tab de perfil y la promociona a relationship cuando Social lo solicita', fakeAsync(() => {
        const component = crearComponente();

        component.abrirPerfilPublico({ uid: 'uid-2', initialDisplayName: 'Yuna' });
        tick(120);
        component.abrirPerfilPublico({ uid: 'uid-2', initialDisplayName: 'Yuna', mode: 'relationship' });
        tick(120);

        expect(component.publicProfileTabs.length).toBe(1);
        expect(component.publicProfileTabs[0]).toEqual({
            uid: 'uid-2',
            initialDisplayName: 'Yuna',
            mode: 'relationship',
        });
    }));

    it('abre admin panel como tab dinámica y la puede cerrar con ESC', fakeAsync(() => {
        const component = crearComponente();
        component.usrPerm = 1;

        component.abrirPanelAdministracion();
        tick(120);

        expect(component.adminPanelTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:admin');

        component.onEscPressed();

        expect(component.adminPanelTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('propaga el openRequest del panel admin cuando se abre enfocado en pendientes', fakeAsync(() => {
        const component = crearComponente();
        component.usrPerm = 1;

        component.abrirPanelAdministracion({ section: 'role-requests', pendingOnly: true, requestId: 91 });
        tick(120);

        expect(component.adminPanelOpenRequest).toEqual({
            section: 'role-requests',
            pendingOnly: true,
            requestId: 91,
        });
    }));

    it('cerrar admin panel vuelve a la pestaña origen', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(16, 'Bardo');
        component.usrPerm = 1;

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirPanelAdministracion();
        tick(120);

        component.quitarPanelAdministracion();

        expect(component.adminPanelTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('clase:16');
    }));

    it('no duplica admin panel cuando ya está abierta', fakeAsync(() => {
        const component = crearComponente();
        component.usrPerm = 1;

        component.abrirPanelAdministracion();
        tick(120);
        component.abrirPanelAdministracion();
        tick(120);

        expect(component.adminPanelTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:admin');
    }));

    it('abre roadmap como tab dinámica y la cierra con ESC', fakeAsync(() => {
        const component = crearComponente();

        component.abrirRoadmap();
        tick(120);

        expect(component.roadmapTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:roadmap');

        component.onEscPressed();

        expect(component.roadmapTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('abre legal y privacidad una sola vez', fakeAsync(() => {
        const component = crearComponente();

        component.abrirLegalPrivacidad();
        tick(120);
        component.abrirLegalPrivacidad();
        tick(120);

        expect(component.legalPrivacyTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:legal');
    }));

    it('abre reportar bug solo con sesión iniciada', fakeAsync(() => {
        const component = crearComponente();
        const isLoggedIn$ = (component as any).__isLoggedIn$ as BehaviorSubject<boolean>;

        component.ngOnInit();
        component.abrirFeedbackBug();
        tick(120);

        expect(component.feedbackBugTabOpen).toBeFalse();

        isLoggedIn$.next(true);
        tick();
        component.abrirFeedbackBug();
        tick(120);

        expect(component.feedbackBugTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:feedback-bug');
    }));

    it('abre solicitar funcionalidad también para invitados', fakeAsync(() => {
        const component = crearComponente();

        component.abrirFeedbackFeature();
        tick(120);

        expect(component.feedbackFeatureTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:feedback-feature');
    }));

    it('la navegación por servicio puede abrir ambas tabs de feedback', fakeAsync(() => {
        const component = crearComponente();
        const isLoggedIn$ = (component as any).__isLoggedIn$ as BehaviorSubject<boolean>;
        const userProfileNavSvc = (component as any).__userProfileNavSvc as any;

        component.ngOnInit();
        userProfileNavSvc.feedbackFeatureOpen$.next();
        tick(120);
        expect(component.feedbackFeatureTabOpen).toBeTrue();

        isLoggedIn$.next(true);
        tick();
        userProfileNavSvc.feedbackBugOpen$.next();
        tick(120);
        expect(component.feedbackBugTabOpen).toBeTrue();
        expect((component as any).activeTabKey).toBe('base:feedback-bug');
    }));

    it('cerrar sesión cierra la tab privada de bugs pero mantiene accesible la de funcionalidades', fakeAsync(() => {
        const component = crearComponente();
        const isLoggedIn$ = (component as any).__isLoggedIn$ as BehaviorSubject<boolean>;

        component.ngOnInit();
        isLoggedIn$.next(true);
        tick();
        component.abrirFeedbackFeature();
        tick(120);
        component.abrirFeedbackBug();
        tick(120);

        isLoggedIn$.next(false);
        tick(120);

        expect(component.feedbackBugTabOpen).toBeFalse();
        expect(component.feedbackFeatureTabOpen).toBeTrue();
    }));

    it('cerrar uso y acerca vuelve al origen', fakeAsync(() => {
        const component = crearComponente();
        const clase = crearClase(17, 'Paladín');

        component.abrirDetallesClase(clase);
        tick(120);
        component.abrirUsoYAcerca();
        tick(120);

        component.quitarUsoYAcerca();

        expect(component.usageAboutTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('clase:17');
    }));

    it('cerrar sesion elimina la tab privada abierta', fakeAsync(() => {
        const component = crearComponente();
        component.usrLoggedIn = true;
        component.abrirPerfilPrivado();
        tick(120);

        (component as any).cerrarPerfilPrivadoPorLogout();

        expect(component.privateProfileTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('cierra admin panel si se pierde el permiso admin', fakeAsync(() => {
        const component = crearComponente();
        const permisos$ = (component as any).__permisos$ as BehaviorSubject<number>;
        const userSvc = (component as any).__userSvc as any;
        userSvc.Usuario.permisos = 1;
        component.ngOnInit();
        permisos$.next(1);
        component.usrPerm = 1;

        component.abrirPanelAdministracion();
        tick(120);

        userSvc.Usuario.permisos = 0;
        permisos$.next(0);
        tick(120);

        expect(component.adminPanelTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));

    it('cierra admin panel al cerrar sesión desde la suscripción de auth', fakeAsync(() => {
        const component = crearComponente();
        const isLoggedIn$ = (component as any).__isLoggedIn$ as BehaviorSubject<boolean>;
        const permisos$ = (component as any).__permisos$ as BehaviorSubject<number>;
        const userSvc = (component as any).__userSvc as any;
        userSvc.Usuario.permisos = 1;
        component.ngOnInit();
        isLoggedIn$.next(true);
        permisos$.next(1);
        component.usrPerm = 1;

        component.abrirPanelAdministracion();
        tick(120);

        userSvc.Usuario.permisos = 0;
        isLoggedIn$.next(false);
        permisos$.next(0);
        tick(120);

        expect(component.adminPanelTabOpen).toBeFalse();
        expect((component as any).activeTabKey).toBe('base:personajes');
    }));
});
