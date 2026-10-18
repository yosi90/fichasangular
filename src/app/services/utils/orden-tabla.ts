import { MatTableDataSource } from '@angular/material/table';

const COMPARADOR_ES = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

/**
 * Ordena la tabla como se ordena en español: «Ágil» va con la A, no detrás de la Z (el orden por defecto de Material
 * compara por código de carácter). Los números se siguen ordenando como números.
 */
export function ordenarEnEspanol<T>(tabla: MatTableDataSource<T>): void {
    tabla.sortData = (datos: T[], sort) => {
        if (!sort.active || sort.direction === '') {
            return datos;
        }
        const sentido = sort.direction === 'asc' ? 1 : -1;
        return [...datos].sort((a, b) => {
            const va = tabla.sortingDataAccessor(a, sort.active);
            const vb = tabla.sortingDataAccessor(b, sort.active);
            if (typeof va === 'number' && typeof vb === 'number') {
                return (va - vb) * sentido;
            }
            return COMPARADOR_ES.compare(String(va ?? ''), String(vb ?? '')) * sentido;
        });
    };
}
