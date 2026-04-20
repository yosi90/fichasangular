import { AdminFeedbackManagerComponent } from './admin-feedback-manager.component';
import {
    FeedbackAdminSubmissionDetailDto,
    FeedbackAdminSubmissionSummaryDto,
    FeedbackKind,
    FeedbackStatus,
} from 'src/app/interfaces/usuarios-api';
import { Subject } from 'rxjs';
import { UsuariosApiService } from 'src/app/services/usuarios-api.service';

describe('AdminFeedbackManagerComponent', () => {
    let component: AdminFeedbackManagerComponent;
    let usuariosApiSvc: jasmine.SpyObj<UsuariosApiService>;
    let alertCandidate$: Subject<any>;

    const buildSummary = (id: number, kind: FeedbackKind = 'bug', status: FeedbackStatus = 'submitted'): FeedbackAdminSubmissionSummaryDto => ({
        id,
        kind,
        status,
        priority: 'high',
        title: kind === 'feature' ? `Funcionalidad ${id}` : `Bug ${id}`,
        description: 'Descripcion',
        pageUrl: '/perfil',
        details: {
            stepsToReproduce: kind === 'bug' ? 'Pasos' : null,
            expectedBehavior: kind === 'bug' ? 'Esperado' : null,
            actualBehavior: kind === 'bug' ? 'Actual' : null,
            useCase: kind === 'feature' ? 'Caso' : null,
            desiredOutcome: kind === 'feature' ? 'Resultado' : null,
        },
        reporter: {
            userId: 'user-1',
            uid: 'uid-1',
            displayName: 'Yosi',
        },
        createdAtUtc: '2026-04-19T10:00:00Z',
        updatedAtUtc: '2026-04-19T10:30:00Z',
    });

    const buildDetail = (id: number, kind: FeedbackKind = 'bug', status: FeedbackStatus = 'submitted'): FeedbackAdminSubmissionDetailDto => ({
        ...buildSummary(id, kind, status),
        attachments: [],
        updates: [{
            status,
            publicMessage: 'Mensaje publico',
            internalComment: 'Comentario interno',
            createdAtUtc: '2026-04-19T10:30:00Z',
            actor: {
                userId: 'admin-1',
                uid: 'admin-uid',
                displayName: 'Admin',
            },
        }],
    });

    beforeEach(() => {
        usuariosApiSvc = jasmine.createSpyObj<UsuariosApiService>('UsuariosApiService', [
            'listAdminFeedbackSubmissions',
            'getAdminFeedbackSubmission',
            'updateAdminFeedbackSubmission',
            'downloadFeedbackAttachment',
            'getFeedbackSubscriptionStates',
            'setFeedbackSubscription',
        ]);
        alertCandidate$ = new Subject<any>();
        usuariosApiSvc.listAdminFeedbackSubmissions.and.resolveTo({
            items: [buildSummary(7)],
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        });
        usuariosApiSvc.getAdminFeedbackSubmission.and.resolveTo(buildDetail(7));
        usuariosApiSvc.updateAdminFeedbackSubmission.and.resolveTo(buildDetail(7, 'bug', 'triaged'));
        usuariosApiSvc.downloadFeedbackAttachment.and.resolveTo('captura.png');
        usuariosApiSvc.getFeedbackSubscriptionStates.and.resolveTo({
            items: [{ submissionId: 7, subscribed: true, canSubscribe: true }],
        });
        usuariosApiSvc.setFeedbackSubscription.and.resolveTo({ submissionId: 7, subscribed: false });
        component = new AdminFeedbackManagerComponent(usuariosApiSvc, { alertCandidate$ } as any);
    });

    it('lista bugs con kind=bug', async () => {
        component.kind = 'bug';

        await component.load(true);

        expect(usuariosApiSvc.listAdminFeedbackSubmissions).toHaveBeenCalledWith(jasmine.objectContaining({
            kind: 'bug',
            limit: 25,
            offset: 0,
        }));
        expect(component.items.length).toBe(1);
    });

    it('lista funcionalidades con kind=feature', async () => {
        component.kind = 'feature';
        usuariosApiSvc.listAdminFeedbackSubmissions.and.resolveTo({
            items: [buildSummary(11, 'feature')],
            total: 1,
            limit: 25,
            offset: 0,
            hasMore: false,
        });

        await component.load(true);

        expect(usuariosApiSvc.listAdminFeedbackSubmissions).toHaveBeenCalledWith(jasmine.objectContaining({
            kind: 'feature',
            limit: 25,
            offset: 0,
        }));
        expect(component.items[0].kind).toBe('feature');
    });

    it('aplica filtros desde la primera pagina', async () => {
        component.offset = 50;
        component.statusFilter = 'submitted';
        component.reporterUidFilter = 'uid-1';

        await component.applyFilters();

        expect(component.offset).toBe(0);
        expect(usuariosApiSvc.listAdminFeedbackSubmissions).toHaveBeenCalledWith(jasmine.objectContaining({
            status: 'submitted',
            reporterUid: 'uid-1',
            offset: 0,
        }));
    });

    it('carga detalle y guarda una actualizacion admin', async () => {
        await component.loadDetail(buildSummary(7));
        component.patchStatus = 'closed';
        component.internalComment = ' Cerrado internamente. ';
        component.publicMessage = ' Cerrado para el usuario. ';

        await component.savePatch();

        expect(usuariosApiSvc.getAdminFeedbackSubmission).toHaveBeenCalledWith(7);
        expect(usuariosApiSvc.updateAdminFeedbackSubmission).toHaveBeenCalledWith(7, {
            status: 'closed',
            internalComment: 'Cerrado internamente.',
            publicMessage: 'Cerrado para el usuario.',
        });
        expect(component.internalComment).toBe('');
        expect(component.publicMessage).toBe('');
    });

    it('carga y alterna la suscripcion admin del detalle', async () => {
        await component.loadDetail(buildSummary(7));

        expect(usuariosApiSvc.getFeedbackSubscriptionStates).toHaveBeenCalledWith([7]);
        expect(component.canShowSubscriptionControl).toBeTrue();
        expect(component.subscriptionSubscribed).toBeTrue();

        await component.toggleSubscription();

        expect(usuariosApiSvc.setFeedbackSubscription).toHaveBeenCalledWith(7, false);
        expect(component.subscriptionSubscribed).toBeFalse();
    });

    it('refresca la cola visible cuando llega feedback_created del mismo kind', async () => {
        component.kind = 'feature';
        component.ngOnInit();
        await Promise.resolve();
        usuariosApiSvc.listAdminFeedbackSubmissions.calls.reset();

        alertCandidate$.next({
            notification: {
                code: 'system.feedback_created',
                action: { target: 'admin.feedback', conversationId: 90 },
                context: { kind: 'feature', submissionId: 17 },
            },
        });
        await Promise.resolve();

        expect(usuariosApiSvc.listAdminFeedbackSubmissions).toHaveBeenCalledWith(jasmine.objectContaining({
            kind: 'feature',
        }));
    });

    it('reabrir funcionalidades usa estado triaged', async () => {
        component.detail = buildDetail(11, 'feature', 'closed');
        usuariosApiSvc.updateAdminFeedbackSubmission.and.resolveTo(buildDetail(11, 'feature', 'triaged'));

        await component.quickAction('triaged');

        expect(usuariosApiSvc.updateAdminFeedbackSubmission).toHaveBeenCalledWith(11, { status: 'triaged' });
        expect(component.detail?.status).toBe('triaged');
    });
});
