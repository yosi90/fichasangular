import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateNivelDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import type { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import type { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { caracteristicaDelAlta } from './correccion-ficha';
import { EstadoDeLasMascotas, filasDeLasMascotas, perdidaConSusMascotas } from './mascota-al-dia';
import {
    FilaPerdida, filasDelNivelPerdido, marcarDotesSinPrerrequisitos, nombresDeLaFicha, perdidaDelNivel, ResultadoPerdida,
} from './perder-nivel';

/*
 * La pérdida de un nivel «con todo» (roadmap de sesiones, «Perder un nivel», y dictamen del máster de Rol: MJ pág. 87;
 * contrato, «La mascota inactiva…»): el último nivel que ganó con lo que eligió en él (`perdidaDelNivel`), las dotes que se
 * quedan sin sus prerrequisitos (se conservan sin poder usarse, `dotesSinPrerrequisitosTrasPerder`) y sus mascotas juzgadas
 * otra vez sin el nivel (`perdidaConSusMascotas`). La usan «Perder un nivel» (`perder-nivel.component`) y la mascota perdida
 * que le baja un nivel («Su mascota», `mascota-sesion.component`), para que las dos quiten lo mismo.
 */

/** Una dote que se conserva sin poder usarse hasta volver a cumplir sus prerrequisitos. */
export interface DoteSinPrerrequisitos {
    idDote: number;
    idExtra: number;
    origen: string;
    nombre: string;
}

export interface PerdidaConTodo {
    /** La ficha sin el nivel, con las dotes sin prerrequisitos marcadas y sus mascotas al día: lo que se manda. */
    resultado: ResultadoPerdida;
    /** Lo que quita el nivel, antes de las mascotas (sus PG y lo que pierde, para «Lo que pierde»). */
    sinElNivel: ResultadoPerdida;
    nivel: PersonajeCreateNivelDto;
    filaDelNivel: FilaPerdida;
    sinPrerrequisitos: DoteSinPrerrequisitos[];
    mascotas: EstadoDeLasMascotas;
}

/** El nivel `indice` de `entrada`, perdido con todo lo que se le cae (arriba, en el módulo). */
export function perdidaDeUnNivelConTodo(svc: NuevoPersonajeService, motor: MotorDesdeFichaService, datos: {
    entrada: PersonajeCreateRequestDto;
    indice: number;
    dgs: number;
    incremento: number | null;
    dote: { idDote: number; idExtra: number; origen: string; } | null;
}): PerdidaConTodo {
    const { resultado, nivel, filaDelNivel } = perdidaDelNivel(svc, motor, datos);
    const caracteristicaQueBaja = resultado.quitado.incremento !== null ? caracteristicaDelAlta(resultado.quitado.incremento)?.[1] : null;
    const sinPrerrequisitos = svc.dotesSinPrerrequisitosTrasPerder({
        idClase: nivel.idClase,
        ataqueBase: resultado.ataqueBase.despues,
        caracteristica: caracteristicaQueBaja ? { clave: caracteristicaQueBaja, menos: 1 } : null,
        rangos: resultado.quitado.rangos,
        dotesQuitadas: resultado.quitado.dotes,
    });
    const conMascotas = perdidaConSusMascotas(svc, motor, datos.entrada,
        { ...resultado, ficha: marcarDotesSinPrerrequisitos(resultado.ficha, sinPrerrequisitos) },
        { idClase: nivel.idClase, indice: datos.indice });
    return {
        resultado: conMascotas.resultado, sinElNivel: resultado, nivel, filaDelNivel, sinPrerrequisitos, mascotas: conMascotas.estado,
    };
}

/** «Sin poder usar»: las dotes que se conservan sin sus prerrequisitos (vuelven a valer al cumplirlos). */
export function filaSinPrerrequisitos(sinPrerrequisitos: readonly DoteSinPrerrequisitos[]): FilaPerdida[] {
    return sinPrerrequisitos.length > 0
        ? [{ que: 'Sin poder usar (hasta cumplir de nuevo sus prerrequisitos)', antes: sinPrerrequisitos.map((d) => d.nombre).join(', '), ahora: 'Las conserva' }]
        : [];
}

/**
 * Las filas de «Lo que pierde» de la pérdida después de la del nivel (y de las que pone cada pantalla, como el NEP o los PX):
 * sus puntos de golpe, lo que pierde el nivel, las dotes sin poder usar y sus mascotas. `ficha`, la que se manda (sin el
 * familiar perdido, en «Su mascota»: su fila no sale).
 */
export function filasDeLaPerdidaConTodo(svc: NuevoPersonajeService, pj: Personaje | null, entrada: PersonajeCreateRequestDto,
    perdida: PerdidaConTodo, ficha: PersonajeCreateRequestDto = perdida.resultado.ficha): FilaPerdida[] {
    const pg = perdida.sinElNivel.pg;
    return [
        { que: 'Puntos de golpe', antes: `${pg.antes}`, ahora: `${pg.despues}${pg.exacto ? '' : ' (aproximado)'}` },
        ...filasDelNivelPerdido(perdida.sinElNivel, nombresDeLaFicha(svc, pj, entrada)),
        ...filaSinPrerrequisitos(perdida.sinPrerrequisitos),
        ...filasDeLasMascotas(entrada, ficha, perdida.mascotas, svc.nombresDeLoQueEligeLaMascota()),
    ];
}
