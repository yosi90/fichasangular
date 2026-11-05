export interface Rasgo {
    Id: number;
    Nombre: string;
    Descripcion: string;
    Oficial: boolean;
    Origen?: string;
}

/** Cuerpo de `POST /rasgos/add` y `PUT /rasgos/<id>` (el mismo; hito 8 del roadmap de inserciones). */
export interface RasgoCuerpo {
    rasgo: {
        nombre: string;
        descripcion: string;
        oficial: boolean;
    };
}
