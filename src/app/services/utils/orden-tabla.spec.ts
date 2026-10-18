import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ordenarEnEspanol } from './orden-tabla';

describe('ordenarEnEspanol', () => {
    const ordenar = (datos: any[], columna: string, sentido: 'asc' | 'desc') => {
        const tabla = new MatTableDataSource(datos);
        ordenarEnEspanol(tabla);
        const sort = new MatSort();
        sort.active = columna;
        sort.direction = sentido;
        return tabla.sortData(datos, sort);
    };

    it('pone las palabras con tilde en su sitio, sin distinguir mayúsculas', () => {
        const nombres = ordenar([{ Nombre: 'Zancada' }, { Nombre: 'Ágil' }, { Nombre: 'alerta' }, { Nombre: 'Esquiva' }], 'Nombre', 'asc')
            .map((d) => d.Nombre);
        expect(nombres).toEqual(['Ágil', 'alerta', 'Esquiva', 'Zancada']);
    });

    it('ordena los números como números y respeta el sentido', () => {
        const niveles = ordenar([{ Nivel: 10 }, { Nivel: 2 }, { Nivel: 1 }], 'Nivel', 'desc').map((d) => d.Nivel);
        expect(niveles).toEqual([10, 2, 1]);
    });
});
