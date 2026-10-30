import { Component } from '@angular/core';

export type EstadoVersion = 'hecha' | 'actual' | 'prevista';

export interface VersionRol {
    readonly numero: string;
    readonly nombre: string;
    readonly estado: EstadoVersion;
    readonly hitos: readonly { texto: string; hecho: boolean }[];
}

/** Las versiones de la web, de la primera a la última prevista (los mismos textos de antes). */
export const VERSIONES_ROL: readonly VersionRol[] = [
    {
        numero: '0.1', nombre: 'Estos son los personajes', estado: 'hecha',
        hitos: [
            { texto: 'Base de la web creada', hecho: true },
            { texto: 'Creada lista de personajes', hecho: true },
            { texto: 'Creada vista de personajes', hecho: true },
            { texto: 'Creada funcionalidad para descargar la ficha en pdf', hecho: true },
            { texto: 'Creada base del admin panel', hecho: true },
        ],
    },
    {
        numero: '0.2', nombre: 'Creemos nuevos personajes', estado: 'hecha',
        hitos: [
            { texto: 'Creada creación de personajes', hecho: true },
            { texto: 'Creada vista de Razas', hecho: true },
            { texto: 'Creada vista de tipos de criatura', hecho: true },
            { texto: 'Creada vista de rasgos', hecho: true },
            { texto: 'Creada vista de conjuros y sortílegas', hecho: true },
            { texto: 'Creada vista de clases', hecho: true },
            { texto: 'Creada vista de Dotes', hecho: true },
        ],
    },
    {
        numero: '0.3', nombre: 'Un personaje mal creado no es un personaje', estado: 'hecha',
        hitos: [
            { texto: 'Repaso de bugs en Nuevo personaje', hecho: true },
            { texto: 'Revisión de filtros de razas', hecho: true },
            { texto: 'Revisión de filtros de clases', hecho: true },
            { texto: 'Revisión de filtros de conjuros', hecho: true },
            { texto: 'Revisión de filtros de dotes', hecho: true },
            { texto: 'Revisión de filtros de plantillas', hecho: true },
        ],
    },
    {
        numero: '0.4', nombre: 'Pasado pisado', estado: 'hecha',
        hitos: [
            { texto: 'Eliminar bootstrap e integrar Tailwind', hecho: true },
            { texto: 'Actualizar a Angular 20', hecho: true },
            { texto: 'Actualizar módulos antiguos', hecho: true },
        ],
    },
    {
        numero: '0.5', nombre: 'Gestión, revisión, adición', estado: 'hecha',
        hitos: [
            { texto: 'Creadas las vistas faltantes', hecho: true },
            { texto: 'Creada la inserción de conjuros', hecho: true },
            { texto: 'Creada la inserción de dotes', hecho: true },
            { texto: 'Mejoras en permisos', hecho: true },
            { texto: 'Creada la gestión de usuarios en admin panel', hecho: true },
        ],
    },
    {
        numero: '0.6', nombre: 'En las nubes', estado: 'hecha',
        hitos: [
            { texto: 'Instalar mini pc', hecho: true },
            { texto: 'Configurar tunnel con Cloudflare', hecho: true },
            { texto: 'Hostear base de datos y API', hecho: true },
            { texto: 'Reforzar seguridad de API y base de datos', hecho: true },
            { texto: 'Configurar bien permisos de Firebase Realtime Database', hecho: true },
            { texto: 'Crear sistema de chat y mensajería', hecho: true },
            { texto: 'Crear sistema de amigos', hecho: true },
        ],
    },
    {
        numero: '0.7', nombre: 'Usuario importa', estado: 'hecha',
        hitos: [
            { texto: 'Mejorada la gestión de usuarios', hecho: true },
            { texto: 'Creada funcionalidad de Archivo', hecho: true },
            { texto: 'Creada funcionalidad de Opciones', hecho: true },
            { texto: 'Creada funcionalidad de Ayuda', hecho: true },
            { texto: 'Creado el perfil de usuario', hecho: true },
        ],
    },
    {
        numero: '0.8', nombre: 'Relaciones relacionadas y mucho texto', estado: 'hecha',
        hitos: [
            { texto: 'Ahora los jugadores pueden solicitar ser promocionados a master', hecho: true },
            { texto: 'Ahora los masters pueden solicitar ser promocionados a colaborador', hecho: true },
            { texto: 'Ahora las campañas tienen master y jugadores', hecho: true },
            { texto: 'Mejorado el sistema de campañas, ahora el master puede establecer las tiradas mínimas y la cantidad de tablas', hecho: true },
            { texto: 'Ahora los jugadores pueden tener amigos', hecho: true },
            { texto: 'Ahora los jugadores pueden comunicarse entre si, mendiante mensaje directo, chat de campaña y chat', hecho: true },
            { texto: 'Eliminado el sistema legacy de jugadores', hecho: true },
        ],
    },
    {
        numero: '0.9', nombre: 'Las inserciones son complejas', estado: 'actual',
        hitos: [
            { texto: 'Creada la inserción de Razas', hecho: false },
            { texto: 'Creada la inserción de clases', hecho: false },
        ],
    },
    {
        numero: '1.0', nombre: 'Las apariencias también importan', estado: 'prevista',
        hitos: [
            { texto: 'Definir dirección artística del proyecto', hecho: false },
            { texto: 'Establecer paleta de colores coherente', hecho: false },
            { texto: 'Consolidar un estilo visual consistente', hecho: false },
        ],
    },
];

/** Las aclaraciones del final; las superadas se enseñan tachadas. */
export const ACLARACIONES_ROL: readonly { texto: string; superada: boolean }[] = [
    { texto: 'Esta web no es, ni pretende ser, una demostración de conocimientos.', superada: false },
    { texto: 'Todos los personajes existentes fueron creados con la versión de escritorio.', superada: true },
    { texto: 'No todos los botones de la cinta están programados.', superada: true },
    { texto: 'Los botones de insertar y modificar siguen incompletos.', superada: false },
];

/**
 * «Ayuda → Novedades» (lienzo, vista 9): las versiones como lista con ✓. La que está en curso va arriba y abierta;
 * después, las previstas y las hechas (de la más reciente a la más antigua), plegadas.
 */
@Component({
    selector: 'app-help-roadmap',
    templateUrl: './help-roadmap.component.html',
    standalone: false
})
export class HelpRoadmapComponent {
    readonly versiones: readonly VersionRol[] = [
        ...VERSIONES_ROL.filter((v) => v.estado === 'actual'),
        ...VERSIONES_ROL.filter((v) => v.estado === 'prevista'),
        ...VERSIONES_ROL.filter((v) => v.estado === 'hecha').reverse(),
    ];
    readonly aclaraciones = ACLARACIONES_ROL;
}
