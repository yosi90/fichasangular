import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { HelpFeedbackComponent } from './help-feedback.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { UserService } from 'src/app/services/user.service';
import { UsuariosApiService } from 'src/app/services/usuarios-api.service';

describe('HelpFeedbackComponent', () => {
    let fixture: ComponentFixture<HelpFeedbackComponent>;
    let component: HelpFeedbackComponent;
    let isLoggedIn$: BehaviorSubject<boolean>;
    let usuariosApiSvc: jasmine.SpyObj<UsuariosApiService>;
    let appToastSvc: jasmine.SpyObj<AppToastService>;
    let dialog: jasmine.SpyObj<MatDialog>;

    const buildSummary = (id: number, kind: 'bug' | 'feature' = 'feature') => ({
        id,
        kind,
        status: 'submitted' as const,
        priority: null,
        title: `Item ${id}`,
        description: `Descripcion ${id}`,
        pageUrl: '/social',
        details: {
            stepsToReproduce: kind === 'bug' ? 'Paso' : null,
            expectedBehavior: null,
            actualBehavior: null,
            useCase: kind === 'feature' ? 'Caso' : null,
            desiredOutcome: kind === 'feature' ? 'Resultado' : null,
        },
        createdAtUtc: '2026-04-02T10:00:00Z',
        updatedAtUtc: '2026-04-02T10:00:00Z',
    });

    const buildDetail = (id: number, kind: 'bug' | 'feature' = 'feature') => ({
        ...buildSummary(id, kind),
        attachments: [{
            id: 91,
            filename: 'mockup.webp',
            mimeType: 'image/webp',
            sizeBytes: 2048,
            createdAtUtc: '2026-04-02T10:10:00Z',
            url: '/usuarios/feedback/attachments/91',
        }],
        updates: [{
            status: kind === 'feature' ? 'planned' as const : 'triaged' as const,
            publicMessage: 'Revisado',
            createdAtUtc: '2026-04-02T10:15:00Z',
        }],
    });

    beforeEach(async () => {
        isLoggedIn$ = new BehaviorSubject<boolean>(false);
        usuariosApiSvc = jasmine.createSpyObj<UsuariosApiService>('UsuariosApiService', [
            'listPublicFeatureRequests',
            'listMyFeatureRequests',
            'listMyBugReports',
            'getMyFeatureRequest',
            'getMyBugReport',
            'createFeatureRequest',
            'createBugReport',
            'downloadFeedbackAttachment',
            'getFeedbackSubscriptionStates',
            'setFeedbackSubscription',
        ]);
        appToastSvc = jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError']);
        dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

        usuariosApiSvc.listPublicFeatureRequests.and.resolveTo({
            items: [buildSummary(11, 'feature')],
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        });
        usuariosApiSvc.listMyFeatureRequests.and.resolveTo({
            items: [buildSummary(12, 'feature')],
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        });
        usuariosApiSvc.listMyBugReports.and.resolveTo({
            items: [buildSummary(21, 'bug')],
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        });
        usuariosApiSvc.getMyFeatureRequest.and.resolveTo(buildDetail(12, 'feature'));
        usuariosApiSvc.getMyBugReport.and.resolveTo(buildDetail(21, 'bug'));
        usuariosApiSvc.createFeatureRequest.and.resolveTo(buildDetail(30, 'feature'));
        usuariosApiSvc.createBugReport.and.resolveTo(buildDetail(40, 'bug'));
        usuariosApiSvc.downloadFeedbackAttachment.and.resolveTo('mockup.webp');
        usuariosApiSvc.getFeedbackSubscriptionStates.and.callFake(async (ids: number[]) => ({
            items: ids.map((id) => ({
                submissionId: id,
                subscribed: id === 12 || id === 21,
                canSubscribe: true,
            })),
        }));
        usuariosApiSvc.setFeedbackSubscription.and.resolveTo({ submissionId: 12, subscribed: false });

        await TestBed.configureTestingModule({
            declarations: [HelpFeedbackComponent],
            imports: [ReactiveFormsModule],
            providers: [
                { provide: UsuariosApiService, useValue: usuariosApiSvc },
                { provide: AppToastService, useValue: appToastSvc },
                { provide: MatDialog, useValue: dialog },
                {
                    provide: UserService,
                    useValue: {
                        isLoggedIn$: isLoggedIn$.asObservable(),
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    function createComponent(kind: 'bug' | 'feature'): void {
        fixture = TestBed.createComponent(HelpFeedbackComponent);
        component = fixture.componentInstance;
        component.kind = kind;
        fixture.detectChanges();
    }

    it('muestra el listado público de peticiones para invitados', async () => {
        createComponent('feature');
        await fixture.whenStable();
        fixture.detectChanges();

        expect(usuariosApiSvc.listPublicFeatureRequests).toHaveBeenCalled();
        expect(component.publicItems.length).toBe(1);
        expect(fixture.nativeElement.textContent).toContain('Peticiones ya registradas');
        expect(fixture.nativeElement.textContent).toContain('Identifícate para solicitar una nueva funcionalidad');
    });

    it('abre login cuando un invitado quiere crear una petición', async () => {
        createComponent('feature');
        await fixture.whenStable();

        component.openLoginDialog();

        expect(dialog.open).toHaveBeenCalled();
    });

    it('carga el área privada al iniciar sesión en la tab de funcionalidades', async () => {
        createComponent('feature');
        isLoggedIn$.next(true);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(usuariosApiSvc.listMyFeatureRequests).toHaveBeenCalled();
        expect(component.privateItems.length).toBe(1);
        expect(component.privateWorkspaceView).toBe('compose');
        expect(component.selectedPrivateSubmissionId).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Nueva solicitud');
    });

    it('muestra comunidad en funcionalidades autenticadas y oculta IDs propios cargados', async () => {
        usuariosApiSvc.listPublicFeatureRequests.and.resolveTo({
            items: [buildSummary(11, 'feature'), buildSummary(12, 'feature')],
            total: 2,
            limit: 25,
            offset: 0,
            hasMore: false,
        });
        isLoggedIn$.next(true);
        createComponent('feature');
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Comunidad');

        component.openCommunitySubmissions();
        fixture.detectChanges();

        expect(component.privateWorkspaceView).toBe('community');
        expect(component.publicCommunityItems.map((item) => item.id)).toEqual([11]);
        expect(fixture.nativeElement.textContent).toContain('Peticiones de la comunidad');
        expect(fixture.nativeElement.textContent).not.toContain('Adjuntos privados');
        expect(usuariosApiSvc.getFeedbackSubscriptionStates).toHaveBeenCalled();
    });

    it('no muestra comunidad en la tab de bugs', async () => {
        isLoggedIn$.next(true);
        createComponent('bug');
        await fixture.whenStable();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('Comunidad');
    });

    it('envía un bug con los campos específicos', async () => {
        isLoggedIn$.next(true);
        createComponent('bug');
        await fixture.whenStable();

        component.form.patchValue({
            title: 'Chat roto',
            description: 'No abre',
            pageUrl: '/social',
            stepsToReproduce: 'Entrar',
            expectedBehavior: 'Abrir',
            actualBehavior: 'Nada',
        });

        await component.submit();

        expect(usuariosApiSvc.createBugReport).toHaveBeenCalledWith(jasmine.objectContaining({
            description: 'No abre',
            stepsToReproduce: 'Entrar',
            expectedBehavior: 'Abrir',
            actualBehavior: 'Nada',
        }));
        expect(appToastSvc.showSuccess).toHaveBeenCalled();
    });

    it('valida imágenes y permite quitarlas', async () => {
        createComponent('feature');
        await fixture.whenStable();
        const invalidFile = new File(['x'], 'texto.txt', { type: 'text/plain' });
        const validFile = new File(['img'], 'captura.png', { type: 'image/png' });

        component.onFilesSelected({ target: { files: [invalidFile] } } as any);
        expect(component.selectedImages.length).toBe(0);
        expect(component.fileSelectionError).toContain('no es una imagen compatible');

        component.onFilesSelected({ target: { files: [validFile] } } as any);
        expect(component.selectedImages.length).toBe(1);

        component.removeSelectedImage(0);
        expect(component.selectedImages.length).toBe(0);
    });

    it('carga el detalle privado con timeline y adjuntos', async () => {
        isLoggedIn$.next(true);
        createComponent('feature');
        await fixture.whenStable();

        await component.selectPrivateSubmission(12);
        fixture.detectChanges();

        expect(usuariosApiSvc.getMyFeatureRequest).toHaveBeenCalledWith(12);
        expect(component.selectedPrivateDetail?.updates.length).toBe(1);
        expect(component.selectedPrivateDetail?.attachments.length).toBe(1);
        expect(fixture.nativeElement.textContent).toContain('Evolutivo');
    });

    it('alterna el seguimiento con estado confirmado por backend', async () => {
        isLoggedIn$.next(true);
        createComponent('feature');
        await fixture.whenStable();

        await component.selectPrivateSubmission(12);
        await component.toggleFeedbackSubscription(12);

        expect(usuariosApiSvc.setFeedbackSubscription).toHaveBeenCalledWith(12, false);
        expect(component.getSubscriptionState(12)?.subscribed).toBeFalse();
        expect(appToastSvc.showSuccess).toHaveBeenCalled();
    });

    it('marca como seguida una solicitud recien creada por la autosuscripcion backend', async () => {
        isLoggedIn$.next(true);
        createComponent('feature');
        await fixture.whenStable();
        component.form.patchValue({ description: 'Nueva mejora' });

        await component.submit();

        expect(component.getSubscriptionState(30)).toEqual(jasmine.objectContaining({
            subscribed: true,
            canSubscribe: true,
        }));
    });
});
