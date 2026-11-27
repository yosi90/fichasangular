// Antes de compilar: la versión de `src/app/config/version.ts` tiene que ser la de `package.json` (kit 2026.11.1).
import { readFileSync } from 'node:fs';

const paquete = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const codigo = readFileSync(new URL('../src/app/config/version.ts', import.meta.url), 'utf8');
const enCodigo = /export const VERSION_WEB = '([^']+)'/.exec(codigo)?.[1];
if (enCodigo !== paquete) {
    console.error(`La versión de package.json (${paquete}) y la de src/app/config/version.ts (${enCodigo}) no coinciden.`);
    process.exit(1);
}
