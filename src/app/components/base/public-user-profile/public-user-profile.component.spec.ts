import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { PublicUserProfileComponent } from './public-user-profile.component';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';

describe('PublicUserProfileComponent', () => {
    let fixture: ComponentFixture<PublicUserProfileComponent>;
    let component: PublicUserProfileComponent;
    let apiSvc: jasmine.SpyObj<UserProfileApiService>;

    beforeEach(async () => {
        apiSvc = jasmine.createSpyObj<UserProfileApiService>('UserProfileApiService', ['getPublicProfile']);

        await TestBed.configureTestingModule({
            declarations: [PublicUserProfileComponent],
            providers: [
                { provide: UserProfileApiService, useValue: apiSvc },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PublicUserProfileComponent);
        component = fixture.componentInstance;
    });

    it('renderiza bio, pronombres y cinco estadisticas cuando existen', fakeAsync(() => {
        apiSvc.getPublicProfile.and.resolveTo({
            uid: 'uid-publico',
            displayName: 'Perfil publico',
            bio: 'Jugador de campañas largas.',
            pronouns: 'elle/they',
            photoThumbUrl: null,
            memberSince: '2026-01-01T00:00:00.000Z',
            stats: {
                totalPersonajes: 2,
                publicos: 1,
                campanasActivas: 3,
                campanasMaster: 1,
                campanasCreadas: 2,
            },
        });

        component.uid = 'uid-publico';
        component.ngOnChanges({
            uid: new SimpleChange('', 'uid-publico', true),
        });
        tick();
        fixture.detectChanges();

        const html = fixture.nativeElement as HTMLElement;
        expect(html.textContent).toContain('Perfil publico');
        expect(html.textContent).toContain('elle/they');
        expect(html.textContent).toContain('Jugador de campañas largas.');
        expect(html.querySelectorAll('.public-profile-stat').length).toBe(5);
        expect(html.textContent).toContain('Campañas activas');
        expect(html.textContent).toContain('Campañas creadas');
    }));

    it('oculta bio y pronombres cuando no existen', fakeAsync(() => {
        apiSvc.getPublicProfile.and.resolveTo({
            uid: 'uid-publico',
            displayName: 'Perfil minimo',
            bio: null,
            pronouns: null,
            photoThumbUrl: null,
            memberSince: null,
            stats: {
                totalPersonajes: 0,
                publicos: 0,
                campanasActivas: 0,
                campanasMaster: 0,
                campanasCreadas: 0,
            },
        });

        component.uid = 'uid-publico';
        component.ngOnChanges({
            uid: new SimpleChange('', 'uid-publico', true),
        });
        tick();
        fixture.detectChanges();

        const html = fixture.nativeElement as HTMLElement;
        expect(html.querySelector('.public-profile-pronouns')).toBeNull();
        expect(html.querySelector('.public-profile-bio')).toBeNull();
        expect(html.querySelectorAll('.public-profile-stat').length).toBe(5);
    }));
});
