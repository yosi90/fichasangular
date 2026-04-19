import { AdminPanelComponent } from './admin-panel.component';

describe('AdminPanelComponent feedback navigation', () => {
    let component: AdminPanelComponent;

    beforeEach(() => {
        const deps = Array.from({ length: 41 }, () => ({} as any));
        component = new AdminPanelComponent(...deps as ConstructorParameters<typeof AdminPanelComponent>);
    });

    it('expone secciones separadas para bugs y funcionalidades', () => {
        expect(component.sectionItems).toEqual(jasmine.arrayContaining([
            jasmine.objectContaining({
                id: 'feedback-bugs',
                label: 'Informes de bugs',
                icon: 'bug_report',
            }),
            jasmine.objectContaining({
                id: 'feedback-features',
                label: 'Peticiones de funcionalidad',
                icon: 'lightbulb',
            }),
        ]));
    });

    it('configura acciones rápidas distintas para funcionalidades', () => {
        expect(component.bugFeedbackQuickActions.map((action) => action.status)).toEqual([
            'resolved',
            'closed',
            'rejected',
            'triaged',
        ]);
        expect(component.featureFeedbackQuickActions.map((action) => action.status)).toEqual([
            'planned',
            'in_progress',
            'resolved',
            'closed',
            'rejected',
            'triaged',
        ]);
    });
});
