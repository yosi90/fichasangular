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

export interface UserSettingsV1 {
    version: 1;
    nuevo_personaje: {
        generador_config: NuevoPersonajeGeneradorConfig | null;
        preview_minimizada: NuevoPersonajePreviewMinimizada | null;
    };
}
