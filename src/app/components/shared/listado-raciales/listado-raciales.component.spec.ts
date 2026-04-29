import { ElementRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { ListadoRacialesComponent } from './listado-raciales.component';

describe('ListadoRacialesComponent', () => {
    it('recarga el listado cuando el servicio emite un racial actualizado', () => {
        const racialesMutados$ = new Subject<any>();
        const rSvc = jasmine.createSpyObj('RacialService', ['getRaciales'], {
            racialesMutados$: racialesMutados$.asObservable(),
        });
        rSvc.getRaciales.and.returnValues(
            of([{ Id: 1, Nombre: 'Alas', Descripcion: '' }]),
            of([{ Id: 1, Nombre: 'Alas actualizadas', Descripcion: '' }]),
        );
        const cdr = { detectChanges: jasmine.createSpy('detectChanges') } as any;
        const component = new ListadoRacialesComponent(cdr, rSvc);

        component.racialSort = {
            active: '',
            direction: '',
            sortChange: of(null),
            initialized: of(null),
        } as any;
        component.racialPaginator = {
            page: of(null),
            initialized: of(null),
        } as any;
        component.nombreText = new ElementRef({ value: '' });

        component.ngAfterViewInit();
        racialesMutados$.next({ Id: 1, Nombre: 'Alas actualizadas' });

        expect(rSvc.getRaciales).toHaveBeenCalledTimes(2);
        expect(component.raciales[0].Nombre).toBe('Alas actualizadas');
    });
});
