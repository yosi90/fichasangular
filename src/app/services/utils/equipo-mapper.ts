import {
    AplicacionMaterial,
    CategoriaObjeto,
    ConjuntoObjetosDetalle,
    EncantamientoDetalle,
    EquipoAura,
    EquipoCatalogos,
    EquipoRef,
    EquipoTipoBonificador,
    EquipoTipoObjeto,
    MaterialDetalle,
    ModificadorEstructurado,
    MunicionDetalle,
    ObjetoDetalle,
    OrigenDescripcion,
    PiezaMaterial,
    TextoEquipo,
} from 'src/app/interfaces/equipo';
import { ManualReferencia } from 'src/app/interfaces/manual';
import { normalizeManualApi } from 'src/app/services/utils/manual-mapper';
import { toArray, toBoolean, toNullableText, toNumber, toNumberOrNull, toText } from 'src/app/services/utils/normalizacion';

/*
 * Los mappers del modelo de objetos, equipo y armas (`docs/publica/endpoints/catalogos.md`, «Equipo»). Las cachés
 * nuevas de la RTDB copian la respuesta de la API tal cual, así que el mismo mapper vale para las dos.
 */

/** Una referencia `{ Id, Nombre }`; `null` si no viene. */
export function normalizeEquipoRef(raw: any): EquipoRef | null {
    if (!raw || typeof raw !== 'object')
        return null;
    return { Id: toNumber(raw.Id), Nombre: toText(raw.Nombre) };
}

/** Las referencias de una lista, sin las que no vienen. */
export function normalizeEquipoRefs(raw: any): EquipoRef[] {
    return toArray(raw)
        .map((item) => normalizeEquipoRef(item))
        .filter((item): item is EquipoRef => item !== null);
}

function normalizeOrigenDescripcion(raw: any): OrigenDescripcion {
    return `${raw ?? ''}`.trim().toLowerCase() === 'srd' ? 'srd' : 'propia';
}

function normalizeManualOpcional(raw: any): ManualReferencia | null {
    return raw && typeof raw === 'object' ? normalizeManualApi(raw) : null;
}

/** La descripción con su origen, el nombre original de los libros traducidos y el manual. */
export function normalizeTextoEquipo(raw: any): TextoEquipo {
    return {
        Descripcion: toText(raw?.Descripcion),
        Origen_descripcion: normalizeOrigenDescripcion(raw?.Origen_descripcion),
        Nombre_original: toNullableText(raw?.Nombre_original),
        Traducido: toBoolean(raw?.Traducido),
        Manual: normalizeManualOpcional(raw?.Manual),
    };
}

function normalizeTipoBonificador(raw: any): EquipoTipoBonificador | null {
    const ref = normalizeEquipoRef(raw);
    return ref ? { ...ref, Apila: toBoolean(raw?.Apila) } : null;
}

function normalizeCategoria(raw: any): CategoriaObjeto {
    const valor = `${raw ?? ''}`.trim().toLowerCase();
    return valor === 'magico' || valor === 'psionico' ? valor : 'mundano';
}

function normalizeTipoObjeto(raw: any): EquipoTipoObjeto | null {
    const ref = normalizeEquipoRef(raw);
    return ref ? { ...ref, Categoria: normalizeCategoria(raw?.Categoria) } : null;
}

export function normalizeModificadorEstructurado(raw: any): ModificadorEstructurado {
    return {
        Objetivo: normalizeEquipoRef(raw?.Objetivo),
        Tipo_bonificador: normalizeTipoBonificador(raw?.Tipo_bonificador),
        Valor: toNumber(raw?.Valor),
        Caracteristica: normalizeEquipoRef(raw?.Caracteristica),
        Habilidad: normalizeEquipoRef(raw?.Habilidad),
        Tipo_dano: normalizeEquipoRef(raw?.Tipo_dano),
        Condicion: toNullableText(raw?.Condicion),
    };
}

function normalizeAura(raw: any): EquipoAura {
    return {
        Intensidad: normalizeEquipoRef(raw?.Intensidad),
        Escuelas: normalizeEquipoRefs(raw?.Escuelas),
    };
}

const PIEZAS_MATERIAL: readonly PiezaMaterial[] = ['arma', 'municion', 'armadura', 'escudo'];

export function normalizeEquipoCatalogos(raw: any): EquipoCatalogos {
    const refs = (clave: string) => normalizeEquipoRefs(raw?.[clave]);
    return {
        Manejos_armas: refs('Manejos_armas'),
        Propiedades_armas: toArray(raw?.Propiedades_armas).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Descripcion: toText(item?.Descripcion),
        })),
        Tipos_dano: refs('Tipos_dano'),
        Tipos_arma: refs('Tipos_arma'),
        Pesos_armadura: refs('Pesos_armadura'),
        Tipos_escudo: refs('Tipos_escudo'),
        Tipos_objeto: toArray(raw?.Tipos_objeto)
            .map((item: any) => normalizeTipoObjeto(item))
            .filter((item): item is EquipoTipoObjeto => item !== null),
        Ranuras: toArray(raw?.Ranuras).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Maximo: toNumber(item?.Maximo, 1),
        })),
        Intensidades_aura: refs('Intensidades_aura'),
        Tipos_activacion: refs('Tipos_activacion'),
        Tipos_accion: refs('Tipos_accion'),
        Tipos_bonificador: toArray(raw?.Tipos_bonificador)
            .map((item: any) => normalizeTipoBonificador(item))
            .filter((item): item is EquipoTipoBonificador => item !== null),
        Objetivos_modificador: refs('Objetivos_modificador'),
        Empunaduras: refs('Empunaduras'),
        Aplicaciones_material: toArray<any>(raw?.Aplicaciones_material)
            .map((item) => {
                const ref = normalizeEquipoRef(item);
                return ref ? {
                    ...ref,
                    Piezas: toArray<any>(item?.Piezas).filter((pieza): pieza is PiezaMaterial => PIEZAS_MATERIAL.includes(pieza)),
                    Manejo: normalizeEquipoRef(item?.Manejo),
                    Peso_armadura: normalizeEquipoRef(item?.Peso_armadura),
                } : null;
            })
            .filter((item): item is AplicacionMaterial => item !== null),
        Danos_por_tamano: toArray(raw?.Danos_por_tamano).map((item: any) => ({
            Dano_mediano: toText(item?.Dano_mediano),
            Danos: toArray(item?.Danos).map((dano: any) => ({
                Id_tamano: toNumber(dano?.Id_tamano),
                Tamano: toText(dano?.Tamano),
                Dano: toNullableText(dano?.Dano),
            })),
        })),
        Riqueza_por_nivel: toArray(raw?.Riqueza_por_nivel)
            .map((item: any) => ({ Nivel: toNumber(item?.Nivel), Po: toNumber(item?.Po) }))
            .sort((a, b) => a.Nivel - b.Nivel),
        Oro_inicial_por_clase: toArray(raw?.Oro_inicial_por_clase).map((item: any) => ({
            Clase: normalizeEquipoRef(item?.Clase) ?? { Id: 0, Nombre: '' },
            Dados: toText(item?.Dados),
            Multiplicador: toNumber(item?.Multiplicador, 1),
            Maximo: toNumber(item?.Maximo),
        })),
    };
}

export function normalizeMaterial(raw: any): MaterialDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        ...normalizeTextoEquipo(raw),
        Dureza: toNumberOrNull(raw?.Dureza),
        Pg_por_pulgada: toNumberOrNull(raw?.Pg_por_pulgada),
        Cuenta_como_gran_calidad: toBoolean(raw?.Cuenta_como_gran_calidad),
        Supera_rd: toBoolean(raw?.Supera_rd),
        Efectos: {
            Peso_multiplicador: toNumberOrNull(raw?.Efectos?.Peso_multiplicador),
            Bon_des_mas: toNumberOrNull(raw?.Efectos?.Bon_des_mas),
            Penalizador_menos: toNumberOrNull(raw?.Efectos?.Penalizador_menos),
            Fallo_arcano_menos: toNumberOrNull(raw?.Efectos?.Fallo_arcano_menos),
            Categoria_mas_ligera: toBoolean(raw?.Efectos?.Categoria_mas_ligera),
            Dano_mod: toNumberOrNull(raw?.Efectos?.Dano_mod),
        },
        Costes: toArray(raw?.Costes).map((coste: any) => ({
            Aplicacion: normalizeEquipoRef(coste?.Aplicacion) ?? { Id: 0, Nombre: '' },
            Coste: toNumberOrNull(coste?.Coste),
            Coste_por_libra: toNumberOrNull(coste?.Coste_por_libra),
            Multiplicador_precio: toNumberOrNull(coste?.Multiplicador_precio),
            Coste_encantar: toNumberOrNull(coste?.Coste_encantar),
        })),
        Oficial: toBoolean(raw?.Oficial),
    };
}

export function normalizeMunicion(raw: any): MunicionDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        ...normalizeTextoEquipo(raw),
        Precio: toNumberOrNull(raw?.Precio),
        Cantidad_por_precio: Math.max(1, toNumber(raw?.Cantidad_por_precio, 1)),
        Peso: toNumberOrNull(raw?.Peso),
        Armas: normalizeEquipoRefs(raw?.Armas),
        Oficial: toBoolean(raw?.Oficial),
    };
}

export function normalizeEncantamiento(raw: any): EncantamientoDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        ...normalizeTextoEquipo(raw),
        Modificador: toNumber(raw?.Modificador),
        Coste: toNumber(raw?.Coste),
        Aplica_a: {
            Arma_cuerpo_a_cuerpo: toBoolean(raw?.Aplica_a?.Arma_cuerpo_a_cuerpo),
            Arma_a_distancia: toBoolean(raw?.Aplica_a?.Arma_a_distancia),
            Municion: toBoolean(raw?.Aplica_a?.Municion),
            Armadura: toBoolean(raw?.Aplica_a?.Armadura),
            Escudo: toBoolean(raw?.Aplica_a?.Escudo),
        },
        Tipos_dano_requeridos: normalizeEquipoRefs(raw?.Tipos_dano_requeridos),
        Nivel_lanzador: toNumberOrNull(raw?.Nivel_lanzador),
        Aura: normalizeAura(raw?.Aura),
        Requisitos: {
            Dotes: normalizeEquipoRefs(raw?.Requisitos?.Dotes),
            Conjuros: toArray(raw?.Requisitos?.Conjuros).map((conjuro: any) => ({
                Id: toNumber(conjuro?.Id),
                Nombre: toText(conjuro?.Nombre),
                Opcional: toBoolean(conjuro?.Opcional),
            })),
        },
        Encantamiento_base: normalizeEquipoRef(raw?.Encantamiento_base),
        Es_plantilla: toBoolean(raw?.Es_plantilla),
        Danos: toArray(raw?.Danos).map((dano: any) => ({
            Dados: toText(dano?.Dados),
            Tipo_dano: normalizeEquipoRef(dano?.Tipo_dano),
            Condicion: toNullableText(dano?.Condicion),
        })),
        Modificadores: toArray(raw?.Modificadores).map((mod: any) => normalizeModificadorEstructurado(mod)),
        Oficial: toBoolean(raw?.Oficial),
    };
}

export function normalizeObjeto(raw: any): ObjetoDetalle {
    const generico = raw?.Generico_conjuro;
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        ...normalizeTextoEquipo(raw),
        Tipo: normalizeTipoObjeto(raw?.Tipo),
        Precio: toNumberOrNull(raw?.Precio),
        Nivel_objeto: toNumberOrNull(raw?.Nivel_objeto),
        Peso: toNumberOrNull(raw?.Peso),
        Ranura: normalizeEquipoRef(raw?.Ranura),
        Nivel_lanzador: toNumberOrNull(raw?.Nivel_lanzador),
        Aura: normalizeAura(raw?.Aura),
        Activaciones: toArray(raw?.Activaciones).map((activacion: any) => ({
            Id: toNumber(activacion?.Id),
            Nombre: toText(activacion?.Nombre),
            Accion: normalizeEquipoRef(activacion?.Accion),
        })),
        Cargas: toNumberOrNull(raw?.Cargas),
        Usos_por_dia: toNumberOrNull(raw?.Usos_por_dia),
        Maldito: toBoolean(raw?.Maldito),
        Inteligente: toBoolean(raw?.Inteligente),
        Reliquia: toBoolean(raw?.Reliquia),
        Requisitos_uso: toNullableText(raw?.Requisitos_uso),
        Creacion: {
            Coste_po: toNumberOrNull(raw?.Creacion?.Coste_po),
            Coste_px: toNumberOrNull(raw?.Creacion?.Coste_px),
            Dias: toNumberOrNull(raw?.Creacion?.Dias),
            Requisitos: {
                Dotes: normalizeEquipoRefs(raw?.Creacion?.Requisitos?.Dotes),
                Conjuros: normalizeEquipoRefs(raw?.Creacion?.Requisitos?.Conjuros),
            },
            Otros_requisitos: toNullableText(raw?.Creacion?.Otros_requisitos),
        },
        Conjuros: toArray(raw?.Conjuros).map((conjuro: any) => ({
            Id: toNumber(conjuro?.Id),
            Nombre: toText(conjuro?.Nombre),
            Nivel_lanzador: toNumberOrNull(conjuro?.Nivel_lanzador),
            Cargas_por_uso: toNumberOrNull(conjuro?.Cargas_por_uso),
            Usos_por_dia: toNumberOrNull(conjuro?.Usos_por_dia),
        })),
        Modificadores: toArray(raw?.Modificadores).map((mod: any) => normalizeModificadorEstructurado(mod)),
        Conjunto: normalizeEquipoRef(raw?.Conjunto),
        Monstruo: normalizeEquipoRef(raw?.Monstruo),
        Arma_base: normalizeEquipoRef(raw?.Arma_base),
        Armadura_base: normalizeEquipoRef(raw?.Armadura_base),
        Bonificador_mejora: toNumberOrNull(raw?.Bonificador_mejora),
        Bonificador_mejora_2: toNumberOrNull(raw?.Bonificador_mejora_2),
        Material: normalizeEquipoRef(raw?.Material),
        Encantamientos: toArray(raw?.Encantamientos).map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Descripcion: toText(item?.Descripcion),
            Modificador: toNumber(item?.Modificador),
            Coste: toNumber(item?.Coste),
            Cabeza: toNumber(item?.Cabeza, 1),
            Oficial: toBoolean(item?.Oficial),
        })),
        Generico_conjuro: generico && typeof generico === 'object'
            ? {
                Precio_por_nivel: toNumber(generico.Precio_por_nivel),
                Nivel_maximo: toNumberOrNull(generico.Nivel_maximo),
                Usos_componente_caro: toNumber(generico.Usos_componente_caro),
            }
            : null,
        Oficial: toBoolean(raw?.Oficial),
    };
}

export function normalizeConjuntoObjetos(raw: any): ConjuntoObjetosDetalle {
    return {
        Id: toNumber(raw?.Id),
        Nombre: toText(raw?.Nombre),
        ...normalizeTextoEquipo(raw),
        Piezas: normalizeEquipoRefs(raw?.Piezas),
        Bonificaciones: toArray(raw?.Bonificaciones).map((bonificacion: any) => ({
            Piezas: toNumber(bonificacion?.Piezas),
            Descripcion: toText(bonificacion?.Descripcion),
        })),
        Oficial: toBoolean(raw?.Oficial),
    };
}
