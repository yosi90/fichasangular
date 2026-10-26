/*
 * Lectura de la ficha común de los detalles (`components/detalles/ficha/`) en las specs de cada pantalla: lo que se ve,
 * con los espacios juntados. Se crea una vez por spec con la raíz de la pantalla y se toman las funciones que use:
 *
 *     const { texto, titulos, valor, enlace } = lectorFicha(() => fixture.nativeElement);
 */

/** El texto de un nodo como se lee: con los espacios y saltos juntados en uno y sin espacios en los extremos. */
export function limpio(nodo: Node | null | undefined): string {
    return `${nodo?.textContent ?? ''}`.replace(/\s+/g, ' ').trim();
}

export function lectorFicha(raiz: () => HTMLElement) {
    const todos = (selector: string, dentro: ParentNode | null = raiz()): Element[] =>
        Array.from(dentro?.querySelectorAll(selector) ?? []);
    /** La tarjeta (`selector`) cuyo título es `titulo`. */
    const porTitulo = (selector: string, titulo: string): Element | null =>
        todos(selector).find((tarjeta) => limpio(tarjeta.querySelector('.ficha-titulo')) === titulo) ?? null;

    return {
        /** Todo el texto de la pantalla. */
        texto: (): string => limpio(raiz()),
        /** Los títulos de las tarjetas y secciones, en su orden; con `dentro`, solo los de ese selector. */
        titulos: (dentro = ''): string[] => todos(`${dentro} .ficha-titulo`.trim()).map((titulo) => limpio(titulo)),
        /** El tipo de la cabecera («Dote · General»). */
        tipoCabecera: (): string => limpio(raiz().querySelector('.ficha-cabecera__tipo')),
        /** Las etiquetas de la cabecera (Oficial, Homebrew y las propias). */
        etiquetasCabecera: (): string[] => todos('.ficha-etiqueta').map((etiqueta) => limpio(etiqueta)),
        /** Los pares etiqueta y valor de las rejillas de datos de `dentro` (toda la pantalla, sin darlo). */
        datos: (dentro: Element | null = raiz()): string[][] => todos('.ficha-dato', dentro)
            .map((dato) => [limpio(dato.querySelector('dt')), limpio(dato.querySelector('dd'))]),
        /** Las etiquetas de los datos; con `dentro`, solo los de ese selector. */
        etiquetasDatos: (dentro = ''): string[] => todos(`${dentro} .ficha-dato dt`.trim()).map((dt) => limpio(dt)),
        /** El valor del dato con esa etiqueta, o `null` si no se ve. */
        valor: (etiqueta: string): string | null => {
            const dato = todos('.ficha-dato').find((d) => limpio(d.querySelector('dt')) === etiqueta);
            return dato ? limpio(dato.querySelector('dd')) : null;
        },
        /** El enlace a otra entrada con ese texto. */
        enlace: (nombre: string): HTMLButtonElement =>
            todos('button.ficha-enlace').find((boton) => limpio(boton) === nombre) as HTMLButtonElement,
        /** Los pares etiqueta y valor (con su detalle) de la franja grande de `dentro` (toda la pantalla, sin darlo). */
        franja: (dentro: Element | null = raiz()): string[][] => todos('.ficha-franja__dato', dentro)
            .map((dato) => [limpio(dato.querySelector('dt')), limpio(dato.querySelector('dd'))]),
        /** Las casillas de características y salvaciones de `dentro`: cada parte que se ve («FUE», «16», «+3»). */
        casillas: (dentro: Element | null = raiz()): string[][] => todos('.ficha-casilla', dentro)
            .map((casilla) => Array.from(casilla.children).map((parte) => limpio(parte))),
        seccion: (titulo: string): Element | null => porTitulo('.ficha-seccion', titulo),
        lateral: (titulo: string): Element | null => porTitulo('.ficha-lateral-tarjeta', titulo),
        bloque: (titulo: string): Element | null => porTitulo('.ficha-bloque', titulo),
        /**
         * Las filas de las tablas de pares (`ficha-pares`) de `dentro`, cada nodo de la celda por separado: el nombre y
         * cada nota, que van en su propia línea, quedan separados por un espacio.
         */
        filasPares: (dentro: Element | null = raiz()): string[][] => todos('.ficha-pares tr', dentro)
            .map((fila) => Array.from(fila.querySelectorAll('td')).map((celda) => Array.from(celda.childNodes)
                .filter((nodo) => nodo.nodeType !== Node.COMMENT_NODE)
                .map((nodo) => `${nodo.textContent ?? ''}`.trim()).filter(Boolean).join(' '))),
    };
}
