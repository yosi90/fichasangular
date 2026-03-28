export interface NuevoPersonajeGeneradorConfig {
    minimoSeleccionado: number;
    tablasPermitidas: number;
    updatedAt: number;
}

export interface FloatingWindowPlacementMinimized {
    version: 1;
    side: 'left' | 'right';
    top: number;
    updatedAt: number;
}

export interface FloatingWindowPlacementRestored {
    version: 1;
    left: number;
    top: number;
    width: number;
    height: number;
    updatedAt: number;
}

export type NuevoPersonajePreviewMinimizada = FloatingWindowPlacementMinimized;
export type NuevoPersonajePreviewRestaurada = FloatingWindowPlacementRestored;

export type ChatFloatingListWindowMode = 'window' | 'minimized' | 'maximized';
export type ChatFloatingBubbleMode = 'window' | 'bubble' | 'maximized';

export interface ChatFloatingWindowState {
    version: 1;
    mode: ChatFloatingListWindowMode;
    restoredPlacement: FloatingWindowPlacementRestored | null;
    minimizedPlacement: FloatingWindowPlacementMinimized | null;
    updatedAt: number;
}

export interface ChatFloatingBubbleState {
    version: 1;
    conversationId: number;
    mode: ChatFloatingBubbleMode;
    restoredPlacement: FloatingWindowPlacementRestored | null;
    bubblePlacement: FloatingWindowPlacementMinimized | null;
    updatedAt: number;
}

export interface ChatFloatingSettings {
    version: 1;
    ventana_chat: ChatFloatingWindowState | null;
    burbujas_abiertas: ChatFloatingBubbleState[];
}

export interface UserSettingsV1 {
    version: 1;
    nuevo_personaje: {
        generador_config: NuevoPersonajeGeneradorConfig | null;
        preview_minimizada: NuevoPersonajePreviewMinimizada | null;
        preview_restaurada: NuevoPersonajePreviewRestaurada | null;
    };
    perfil: {
        visibilidadPorDefectoPersonajes: boolean;
        mostrarPerfilPublico: boolean;
        allowDirectMessagesFromNonFriends: boolean;
        autoAbrirVentanaChats: boolean;
        permitirBurbujasChat: boolean;
        notificaciones: {
            mensajes: boolean;
            amistad: boolean;
            campanas: boolean;
            cuentaSistema: boolean;
        };
    };
    mensajeria_flotante: ChatFloatingSettings | null;
}

export function createDefaultUserSettings(): UserSettingsV1 {
    return {
        version: 1,
        nuevo_personaje: {
            generador_config: null,
            preview_minimizada: null,
            preview_restaurada: null,
        },
        perfil: {
            visibilidadPorDefectoPersonajes: false,
            mostrarPerfilPublico: true,
            allowDirectMessagesFromNonFriends: false,
            autoAbrirVentanaChats: true,
            permitirBurbujasChat: true,
            notificaciones: {
                mensajes: true,
                amistad: true,
                campanas: true,
                cuentaSistema: true,
            },
        },
        mensajeria_flotante: null,
    };
}
