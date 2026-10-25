import { FichaBloqueComponent } from './ficha-bloque.component';
import { FichaCabeceraComponent } from './ficha-cabecera.component';
import { FichaCuerpoComponent } from './ficha-cuerpo.component';
import { FichaDatosComponent } from './ficha-datos.component';
import { FichaDetalleComponent } from './ficha-detalle.component';
import { FichaLateralComponent } from './ficha-lateral.component';
import { FichaPrerrequisitosComponent } from './ficha-prerrequisitos.component';
import { FichaSeccionComponent } from './ficha-seccion.component';

export * from './ficha';

/**
 * Los componentes de la ficha común de los detalles. Se declaran juntos en `AppModule` y en las pruebas de cada
 * pantalla (que declaran además `TextoManualComponent`, que usan la cabecera y las secciones).
 */
export const FICHA_DETALLE_COMPONENTES = [
    FichaDetalleComponent,
    FichaCabeceraComponent,
    FichaDatosComponent,
    FichaCuerpoComponent,
    FichaSeccionComponent,
    FichaLateralComponent,
    FichaBloqueComponent,
    FichaPrerrequisitosComponent,
];
