import { SelectorEspecialidadMagicaModalComponent } from './selector-especialidad-magica-modal.component';

describe('SelectorEspecialidadMagicaModalComponent', () => {
    let component: SelectorEspecialidadMagicaModalComponent;

    beforeEach(() => {
        component = new SelectorEspecialidadMagicaModalComponent();
        // Como `/escuelas` y `/disciplinas`: si se puede elegir y cuántas prohíbe quien la elige (MJ cap. 3; MPE).
        component.escuelas = [
            { Id: -1, Nombre: 'Universal', Nombre_especial: '', Prohibible: false, Especializable: false, Prohibidas_al_especializarse: 0 },
            { Id: 0, Nombre: 'Placeholder', Nombre_especial: '', Prohibible: false, Especializable: false, Prohibidas_al_especializarse: 0 },
            { Id: 1, Nombre: 'Adivinacion', Nombre_especial: 'Adivino', Prohibible: false, Especializable: true, Prohibidas_al_especializarse: 1 },
            { Id: 2, Nombre: 'Abjuracion', Nombre_especial: 'Abjurador', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
            { Id: 3, Nombre: 'Evocacion', Nombre_especial: 'Evocador', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
            { Id: 4, Nombre: 'Conjuracion', Nombre_especial: 'Conjurador', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
            { Id: 9, Nombre: 'Universal', Nombre_especial: '', Prohibible: false, Especializable: false, Prohibidas_al_especializarse: 0 },
        ];
        component.disciplinas = [
            { Id: 1, Nombre: 'Metacreatividad', Nombre_especial: 'Metacreador', Subdisciplinas: [], Especializable: true, Prohibidas_al_especializarse: 0 },
            { Id: 2, Nombre: 'Psicoquinesis', Nombre_especial: 'Psicoquineta', Subdisciplinas: [], Especializable: true, Prohibidas_al_especializarse: 0 },
            { Id: 3, Nombre: 'Telepatia', Nombre_especial: 'Telepata', Subdisciplinas: [], Especializable: true, Prohibidas_al_especializarse: 0 },
        ];
    });

    it('al crear no se puede cerrar sin elegir; en el reciclaje de la subida (cancelable), sí', () => {
        const cancelada = jasmine.createSpy('cancelar');
        component.cancelar.subscribe(cancelada);
        component.onCancelar();
        expect(cancelada).not.toHaveBeenCalled();
        component.cancelable = true;
        component.onCancelar();
        expect(cancelada).toHaveBeenCalledTimes(1);
    });

    it('en el reciclaje se abre con lo que ya tiene: su especialista y sus prohibidas, o generalista', () => {
        component.mostrarArcano = true;
        component.seleccionInicial = { especialista: 3, prohibidas: [2, 4] };
        expect(component.arcanoEspecializar).toBeTrue();
        expect(component.arcanoEscuelaEspecialistaId).toBe(3);
        expect(component.idsEscuelasProhibidasSeleccionadas).toEqual([2, 4]);
        expect(component.arcanoValido).toBeTrue();

        const generalista = new SelectorEspecialidadMagicaModalComponent();
        generalista.escuelas = component.escuelas;
        generalista.mostrarArcano = true;
        generalista.seleccionInicial = { especialista: null, prohibidas: [] };
        expect(generalista.arcanoEspecializar).toBeFalse();
        expect(generalista.arcanoEscuelaEspecialistaId).toBeNull();
    });

    it('con escuela fija, la marcada es la suya y conserva sus prohibidas', () => {
        component.mostrarArcano = true;
        component.escuelaFija = component.escuelas.find((e) => e.Id === 3)!;
        component.seleccionInicial = { especialista: 2, prohibidas: [4, 2] };
        expect(component.arcanoEscuelaEspecialistaId).toBe(3);
        expect(component.idsEscuelasProhibidasSeleccionadas).toEqual([4, 2]);
    });

    it('arcano permite continuar sin especializarse', () => {
        component.mostrarArcano = true;
        component.arcanoEspecializar = false;

        expect(component.arcanoValido).toBeTrue();
        expect(component.puedeConfirmar).toBeTrue();
    });

    it('arcano especializado requiere 2 prohibidas salvo adivinacion', () => {
        component.mostrarArcano = true;
        component.onToggleArcanoEspecializar(true);

        component.onChangeEscuelaEspecialista(2);
        expect(component.escuelasProhibidasRequeridas).toBe(2);
        component.onToggleEscuelaProhibida(3, true);
        expect(component.arcanoValido).toBeFalse();
        component.onToggleEscuelaProhibida(4, true);
        expect(component.arcanoValido).toBeTrue();

        component.onChangeEscuelaEspecialista(1);
        component.onToggleEscuelaProhibida(2, true);
        expect(component.escuelasProhibidasRequeridas).toBe(1);
        expect(component.arcanoValido).toBeTrue();
    });

    it('Universal no se ofrece como especialidad, por su dato (MJ cap. 3)', () => {
        component.mostrarArcano = true;
        component.onToggleArcanoEspecializar(true);

        expect(component.escuelasEspecializables.map((escuela) => escuela.Id)).toEqual([2, 1, 4, 3]);
    });

    it('arcano nunca ofrece adivinacion como prohibida', () => {
        component.mostrarArcano = true;
        component.onToggleArcanoEspecializar(true);
        component.onChangeEscuelaEspecialista(2);

        const nombresProhibibles = component.escuelasProhibibles.map((escuela) => escuela.Nombre);
        expect(nombresProhibibles).not.toContain('Adivinacion');
    });

    it('psionico elige una disciplina y no prohíbe ninguna (Manual de psiónica expandido)', () => {
        component.mostrarPsionico = true;

        expect(component.psionicoValido).toBeFalse();
        component.onChangeDisciplinaEspecialista(1);
        expect(component.disciplinaProhibidaRequerida).toBeFalse();
        expect(component.psionicoValido).toBeTrue();
    });

    it('psionico con una disciplina homebrew que prohíbe otra: la pide distinta', () => {
        component.mostrarPsionico = true;
        component.disciplinas = component.disciplinas.map((d) => ({ ...d, Prohibidas_al_especializarse: 1 }));

        component.onChangeDisciplinaEspecialista(1);
        component.onChangeDisciplinaProhibida(1);
        expect(component.psionicoValido).toBeFalse();
        component.onChangeDisciplinaProhibida(2);
        expect(component.psionicoValido).toBeTrue();
    });

    it('mixto exige resolver ambos bloques', () => {
        component.mostrarArcano = true;
        component.mostrarPsionico = true;

        component.arcanoEspecializar = false;
        component.onChangeDisciplinaEspecialista(1);
        expect(component.puedeConfirmar).toBeTrue();

        component.onToggleArcanoEspecializar(true);
        component.onChangeEscuelaEspecialista(2);
        component.onToggleEscuelaProhibida(3, true);
        expect(component.puedeConfirmar).toBeFalse();
        component.onToggleEscuelaProhibida(4, true);
        expect(component.puedeConfirmar).toBeTrue();
    });
});
