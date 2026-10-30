import { Component } from '@angular/core';
import { CampanasGestionEstado } from './campanas-gestion.estado';

export type PestanaCampana = 'politica' | 'jugadores' | 'historias';

/**
 * La gestión de campañas de «Mi perfil» (lienzo «Rol: las vistas que faltan», vista 8): la lista de tarjetas de las
 * campañas que dirige la cuenta y, a la derecha, la cabecera de la campaña y tres pestañas internas (Política de
 * creación · Jugadores · Historias). Solo pinta: el estado y las acciones son de `CampanasGestionEstado`, que provee
 * `UserProfileComponent`.
 */
@Component({
    selector: 'app-campanas-gestion',
    templateUrl: './campanas-gestion.component.html',
    styleUrls: ['./campanas-gestion.component.sass'],
    standalone: false
})
export class CampanasGestionComponent {
    readonly pestanas: readonly { id: PestanaCampana; etiqueta: string; }[] = [
        { id: 'politica', etiqueta: 'Política de creación' },
        { id: 'jugadores', etiqueta: 'Jugadores' },
        { id: 'historias', etiqueta: 'Historias' },
    ];

    constructor(readonly g: CampanasGestionEstado) { }

    /** Sin pestaña elegida (recién elegida la campaña), se ve la política. */
    get pestana(): PestanaCampana {
        if (this.g.isCampaignWorkspacePeopleStories)
            return this.g.isCampaignWorkspaceStoriesTab ? 'historias' : 'jugadores';
        return 'politica';
    }

    /** «Campaña · Máster · 4 jugadores». */
    get lineaTipo(): string {
        if (this.g.isCreatingCampaign)
            return 'Campaña · Nueva';
        const partes = ['Campaña'];
        const rol = this.g.selectedCampaignActorRole;
        if (rol)
            partes.push(this.g.getCampaignRoleLabel(rol, this.g.selectedCampaignSummary?.isOwner === true));
        const jugadores = this.g.selectedCampaignMembers.filter((member) => member.isActive && member.campaignRole !== 'master').length;
        if (this.g.selectedCampaignDetail)
            partes.push(jugadores === 1 ? '1 jugador' : `${jugadores} jugadores`);
        return partes.join(' · ');
    }

    abrirPestana(pestana: PestanaCampana): void {
        const id = this.g.selectedCampaignSummary?.id;
        if (!id || pestana === this.pestana)
            return;
        if (pestana === 'politica')
            void this.g.abrirConfiguracionCampana(id);
        else if (pestana === 'jugadores')
            void this.g.abrirUsuariosCampana(id);
        else
            void this.g.abrirHistoriasCampana(id);
    }

    /** Flechas, Inicio y Fin en la fila de pestañas (patrón `tablist`). */
    moverPestana(event: KeyboardEvent): void {
        const actual = this.pestanas.findIndex((p) => p.id === this.pestana);
        let destino = actual;
        if (event.key === 'ArrowRight')
            destino = (actual + 1) % this.pestanas.length;
        else if (event.key === 'ArrowLeft')
            destino = (actual - 1 + this.pestanas.length) % this.pestanas.length;
        else if (event.key === 'Home')
            destino = 0;
        else if (event.key === 'End')
            destino = this.pestanas.length - 1;
        else
            return;
        event.preventDefault();
        const id = this.pestanas[destino].id;
        this.abrirPestana(id);
        const boton = (event.currentTarget as HTMLElement | null)?.parentElement?.querySelector<HTMLElement>(`#campanas-pestana-${id}`);
        boton?.focus();
    }
}
