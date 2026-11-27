import { environment } from 'src/environments/environment';

/**
 * La versión de la web (kit 2026.11.1, `ecosistema-kit/VERSIONADO.md`): versionado semántico estricto, la misma que
 * `package.json` (lo comprueba `scripts/comprobar-version.mjs` antes de compilar). QA lleva el sufijo `-qa`.
 * MAYOR si quien usa la web tiene que cambiar algo, MENOR con algo nuevo compatible, ARREGLO con un arreglo.
 */
export const VERSION_WEB = '1.0.0';

// El sufijo sale del entorno de la plataforma (`environment.plataforma.entorno`), como en la API (`utils/version.py`).
export const VERSION_WEB_PUBLICADA = `${VERSION_WEB}${environment.plataforma.entorno === 'qa' ? '-qa' : ''}`;
