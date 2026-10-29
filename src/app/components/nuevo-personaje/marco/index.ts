import { CreacionCabeceraComponent, CreacionCuerpoComponent, CreacionMarcoComponent, CreacionPieComponent, CreacionVistaPreviaComponent } from './creacion-marco.component';
import { CreacionPersonajeComponent } from './creacion-personaje.component';
import { CreacionVentanaComponent } from './creacion-ventana.component';

export * from './creacion';
export { modeloTuPersonaje } from './creacion-personaje.component';

/**
 * Los componentes del marco de la creación de personaje. Se declaran juntos en `AppModule` y en las pruebas que pintan un
 * paso o una ventana de la creación (con `FICHA_DETALLE_COMPONENTES`, que usan la franja y las casillas).
 */
export const CREACION_MARCO_COMPONENTES = [
    CreacionMarcoComponent,
    CreacionCabeceraComponent,
    CreacionCuerpoComponent,
    CreacionPieComponent,
    CreacionPersonajeComponent,
    CreacionVentanaComponent,
    CreacionVistaPreviaComponent,
];
