/*
 * La `entrada` de una ficha real de `rol_dev` (un enano clérigo 1 de antes del historial: su nivel con el orden por
 * conocer), leída con `utils/personaje_entrada.leer_entrada` el 2026-11-12, sin escribir nada. El nombre y los textos
 * libres están cambiados y sin campaña. Para las pruebas de la subida de nivel (`subida-nivel.spec.ts`).
 */
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';

export const ENTRADA_ENANO_CLERIGO_1: PersonajeCreateRequestDto = {
    "personaje": {
        "nombre": "Enano de prueba",
        "descripcionPersonalidad": "",
        "descripcionHistoria": "",
        "ataqueBase": "+0",
        "armaduraNatural": 0,
        "caDesvio": 0,
        "idRaza": 3,
        "idTipoCriatura": 11,
        "altura": 1.2,
        "edad": 40,
        "peso": 55.0,
        "ajuste": 0,
        "deidad": 4,
        "idAlineamiento": 4,
        "idGenero": 2,
        "puntosGolpe": 12,
        "madurez": 0,
        "archivado": false,
        "pgsLic": 0,
        "correr": 20,
        "nadar": 0,
        "volar": 0,
        "idManiobrabilidad": 0,
        "trepar": 0,
        "excavar": 0,
        "espacio": 0,
        "alcance": 0,
        "idEspArcana": 0,
        "idEspPsionica": 0,
        "idDisProhibida": 0,
        "idRegion": 0,
        "visible_otros_usuarios": true,
        "tipo": "pj"
    },
    "caracteristicas": {
        "fuerza": {
            "valor": 18,
            "minimo": 0,
            "perdido": false
        },
        "destreza": {
            "valor": 17,
            "minimo": 0,
            "perdido": false
        },
        "constitucion": {
            "valor": 19,
            "minimo": 0,
            "perdido": false
        },
        "inteligencia": {
            "valor": 16,
            "minimo": 0,
            "perdido": false
        },
        "sabiduria": {
            "valor": 16,
            "minimo": 0,
            "perdido": false
        },
        "carisma": {
            "valor": 14,
            "minimo": 0,
            "perdido": false
        }
    },
    "tamano": {
        "idTamano": 5,
        "origen": "Web"
    },
    "modificadores": {
        "ca": [],
        "iniciativa": [],
        "presa": [],
        "salvaciones": {
            "fortaleza": {
                "claseos": [
                    {
                        "valor": 2,
                        "origen": "Clérigo nivel 1"
                    }
                ],
                "varios": [
                    {
                        "valor": 2,
                        "origen": "Enano - +2 a las TS contra conjuros y efectos sortílegos",
                        "condicion": "Contra conjuros y efectos sortílegos"
                    },
                    {
                        "valor": 2,
                        "origen": "Enano - +2 en las ts contra veneno",
                        "condicion": "Contra veneno"
                    }
                ]
            },
            "reflejos": {
                "claseos": [],
                "varios": [
                    {
                        "valor": 2,
                        "origen": "Enano - +2 a las TS contra conjuros y efectos sortílegos",
                        "condicion": "Contra conjuros y efectos sortílegos"
                    },
                    {
                        "valor": 2,
                        "origen": "Enano - +2 en las ts contra veneno",
                        "condicion": "Contra veneno"
                    }
                ]
            },
            "voluntad": {
                "claseos": [
                    {
                        "valor": 2,
                        "origen": "Clérigo nivel 1"
                    }
                ],
                "varios": [
                    {
                        "valor": 2,
                        "origen": "Enano - +2 a las TS contra conjuros y efectos sortílegos",
                        "condicion": "Contra conjuros y efectos sortílegos"
                    },
                    {
                        "valor": 2,
                        "origen": "Enano - +2 en las ts contra veneno",
                        "condicion": "Contra veneno"
                    }
                ]
            }
        }
    },
    "colecciones": {
        "clases": [
            {
                "idClase": 4,
                "nivel": 1
            }
        ],
        "plantillas": [],
        "subtipos": [],
        "competencia_arma": [],
        "competencia_armadura": [],
        "competencia_grupo_arma": [],
        "competencia_grupo_armadura": [],
        "rasgos": [],
        "dgsExtra": [],
        "escuelasProhibidas": [],
        "rd": [],
        "rc": [],
        "re": [],
        "enemigosPredilectos": [],
        "habilidades": {
            "base": [
                {
                    "idHabilidad": 1,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 2,
                    "idExtra": 7,
                    "clasea": true,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 3,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 4,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 5,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 6,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 1,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 7,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 1,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 8,
                    "idExtra": 0,
                    "clasea": true,
                    "rangos": 2,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 9,
                    "idExtra": 0,
                    "clasea": true,
                    "rangos": 2,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 10,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 11,
                    "idExtra": 0,
                    "clasea": true,
                    "rangos": 2,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 12,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 13,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 1,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 14,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 15,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 16,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 17,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 1,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 18,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 19,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 20,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 21,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 22,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 23,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 24,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 25,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 26,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 27,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 28,
                    "idExtra": 45,
                    "clasea": true,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 29,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 30,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 31,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 32,
                    "idExtra": 51,
                    "clasea": true,
                    "rangos": 1,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 33,
                    "idExtra": 55,
                    "clasea": true,
                    "rangos": 1,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 34,
                    "idExtra": 59,
                    "clasea": true,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 35,
                    "idExtra": 60,
                    "clasea": true,
                    "rangos": 4,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 36,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 37,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 38,
                    "idExtra": 0,
                    "clasea": true,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 39,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 40,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 41,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 42,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 43,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 44,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 45,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                },
                {
                    "idHabilidad": 46,
                    "idExtra": 0,
                    "clasea": false,
                    "rangos": 0,
                    "rangosVarios": 0,
                    "modVarios": ""
                }
            ],
            "custom": []
        },
        "ventajas": [],
        "especiales": [],
        "idiomas": [
            {
                "idIdioma": 1,
                "origen": "Enano"
            },
            {
                "idIdioma": 6,
                "origen": "Idiomas iniciales"
            },
            {
                "idIdioma": 8,
                "origen": "Idiomas iniciales"
            },
            {
                "idIdioma": 12,
                "origen": "Enano"
            },
            {
                "idIdioma": 22,
                "origen": "Idiomas iniciales"
            }
        ],
        "dotes": [
            {
                "idDote": 2,
                "idExtra": 0,
                "origen": "Dote por nivel: Clérigo nivel 1"
            }
        ],
        "dominios": [
            {
                "idDominio": 31,
                "origen": "No especifica"
            }
        ],
        "conjurosConocidos": [
            {
                "idConjuro": 21,
                "copiado": false
            },
            {
                "idConjuro": 22,
                "copiado": false
            },
            {
                "idConjuro": 25,
                "copiado": false
            },
            {
                "idConjuro": 29,
                "copiado": false
            },
            {
                "idConjuro": 30,
                "copiado": false
            },
            {
                "idConjuro": 34,
                "copiado": false
            }
        ],
        "sortilegas": [],
        "raciales": []
    },
    "niveles": [
        {
            "idClase": 4,
            "nivelClase": 1,
            "pg": {
                "tirada": null,
                "maximo": false
            },
            "elecciones": [],
            "ordenConocido": false,
            "idSesion": null
        }
    ],
    "decisionesHomebrew": [
        {
            "tipo": "edad_menor_que_la_inicial",
            "idElemento": 4
        }
    ]
} as unknown as PersonajeCreateRequestDto;
