import { SelectorEspecialidadMagicaModalComponent } from './selector-especialidad-magica-modal.component';

describe('SelectorEspecialidadMagicaModalComponent', () => {
    let component: SelectorEspecialidadMagicaModalComponent;

    beforeEach(() => {
        component = new SelectorEspecialidadMagicaModalComponent();
        component.escuelas = [
            { Id: -1, Nombre: 'Universal', Nombre_especial: '', Prohibible: false },
            { Id: 0, Nombre: 'Placeholder', Nombre_especial: '', Prohibible: false },
            { Id: 1, Nombre: 'Adivinacion', Nombre_especial: 'Adivino', Prohibible: false },
            { Id: 2, Nombre: 'Abjuracion', Nombre_especial: 'Abjurador', Prohibible: true },
            { Id: 3, Nombre: 'Evocacion', Nombre_especial: 'Evocador', Prohibible: true },
            { Id: 4, Nombre: 'Conjuracion', Nombre_especial: 'Conjurador', Prohibible: true },
        ];
        component.disciplinas = [
            { Id: 1, Nombre: 'Metacreatividad', Nombre_especial: 'Metacreador', Subdisciplinas: [] },
            { Id: 2, Nombre: 'Psicoquinesis', Nombre_especial: 'Psicoquineta', Subdisciplinas: [] },
            { Id: 3, Nombre: 'Telepatia', Nombre_especial: 'Telepata', Subdisciplinas: [] },
        ];
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

    it('arcano nunca ofrece adivinacion como prohibida', () => {
        component.mostrarArcano = true;
        component.onToggleArcanoEspecializar(true);
        component.onChangeEscuelaEspecialista(2);

        const nombresProhibibles = component.escuelasProhibibles.map((escuela) => escuela.Nombre);
        expect(nombresProhibibles).not.toContain('Adivinacion');
    });

    it('psionico requiere especialista y prohibida distinta', () => {
        component.mostrarPsionico = true;

        expect(component.psionicoValido).toBeFalse();
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
        component.onChangeDisciplinaProhibida(2);
        expect(component.puedeConfirmar).toBeTrue();

        component.onToggleArcanoEspecializar(true);
        component.onChangeEscuelaEspecialista(2);
        component.onToggleEscuelaProhibida(3, true);
        expect(component.puedeConfirmar).toBeFalse();
        component.onToggleEscuelaProhibida(4, true);
        expect(component.puedeConfirmar).toBeTrue();
    });
});
