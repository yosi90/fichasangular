export interface NuevoPersonajeGeneradorConfig {
    minimoSeleccionado: number;
    tablasPermitidas: number;
    updatedAt: number;
}

export interface NuevoPersonajePreviewMinimizada {
    version: 1;
    side: 'left' | 'right';
    top: number;
    updatedAt: number;
}

export interface NuevoPersonajePreviewRestaurada {
    version: 1;
    left: number;
    top: number;
    width: number;
    height: number;
    updatedAt: number;
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
    };
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
        },
    };
}
