/**
 * Las razas del ensayo de las razas mutadas (roadmap `ACTIVO_razas-mutadas`), como las da la API: `GET /razas/{id}` de
 * `rol_dev` (2026-11-07) de la prole de Bahamut (21), el mediano (5), el gnoll (18), el drow (308) y el jacquar (26), con
 * los textos de más de 60 caracteres recortados (los mismos datos que `tests/datos/razas_mutadas.json` del backend), y
 * `GET /razas/21/sobre/{idBase}` de cada base (`utils/raza_mutacion.combinar_raza`, rama `mutadas/fase-2` del backend).
 */
/* eslint-disable */
export const RAZAS_API: Record<string, any> = {
 "21": {
  "i": 21,
  "n": "Prole de bahamut",
  "m": {
   "Fuerza": 0,
   "Destreza": -2,
   "Constitucion": 2,
   "Inteligencia": 0,
   "Sabiduria": 0,
   "Carisma": 0
  },
  "aju": 0,
  "ma": "Razas del dragón, Página: 8",
  "c": "Guerrero",
  "o": true,
  "an": null,
  "t": {
   "Id": 5,
   "Nombre": "Mediano",
   "Modificador": 0,
   "Modificador_presa": 0,
   "Modificador_esconderse": 0
  },
  "dg": {
   "Cantidad": 0,
   "Dado": "",
   "Tipo_criatura": "",
   "Ataque_base": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0
  },
  "Dotes_adicionales": 0,
  "Puntos_habilidad_extra_primer_nivel": 0,
  "Puntos_habilidad_extra_por_nivel": 0,
  "Cuadrupedo": false,
  "Idiomas_adicionales_cualquiera": true,
  "Idiomas_adicionales": [],
  "Competencias": {
   "Armas": [],
   "Armaduras": [],
   "Grupos_arma": [],
   "Grupos_armadura": []
  },
  "Armas_naturales": [],
  "Descripcion": "Las proles de bahamut son una raza única por qué no nacen; r",
  "Nombre_original": null,
  "Traducido": false,
  "Id_clase_predilecta": 7,
  "Edad_maxima_dados": 0,
  "Edad_maxima_caras": 0,
  "Edad_inicial_dados_1": 0,
  "Edad_inicial_caras_1": 0,
  "Edad_inicial_dados_2": 0,
  "Edad_inicial_caras_2": 0,
  "Edad_inicial_dados_3": 0,
  "Edad_inicial_caras_3": 0,
  "Vd": null,
  "Vd_mod_clases_pj": null,
  "Vd_mod_clases_pnj": null,
  "Clases_asociadas": [],
  "Manual": {
   "Id": 34,
   "Nombre": "Razas del dragón",
   "Pagina": 8
  },
  "Clase_predilecta": {
   "Id": 7,
   "Nombre": "Guerrero"
  },
  "Dgs_raciales": {
   "Cantidad": 0,
   "Id_dado": 0,
   "Dado": "elegir",
   "Id_tipo_criatura": 0,
   "Tipo_criatura": "Cualquiera",
   "Ataque_base": 0,
   "Fortaleza": 0,
   "Reflejos": 0,
   "Voluntad": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0,
   "Dado_comodin": "elegir"
  },
  "rd": null,
  "rc": null,
  "re": null,
  "mu": true,
  "tmd": true,
  "pr": {
   "tipo_criatura": [
    {
     "id_tipo_criatura": 11,
     "tipo_criatura": "Humanoide",
     "opcional": 0,
     "tipo_criatura_comodin": null,
     "Frase": "Criatura de tipo humanoide"
    }
   ]
  },
  "prf": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "Prerrequisitos_flags": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "ant": 0,
  "va": 2,
  "co": 0,
  "na": 0,
  "vo": 0,
  "man": null,
  "tr": 0,
  "ex": 0,
  "ari": 0,
  "ars": 0,
  "pri": 0,
  "prs": 0,
  "ea": 0,
  "em": 200,
  "ev": 300,
  "eve": 400,
  "esp": 0,
  "alc": 0,
  "tc": {
   "Id": 11,
   "Nombre": "Humanoide",
   "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
   "Manual": "Manual de monstruos 1, Página: 316",
   "Id_tipo_dado": 3,
   "Tipo_dado": "d8",
   "Id_ataque": 2,
   "Id_fortaleza": 1,
   "Id_reflejos": 1,
   "Id_voluntad": 1,
   "Id_puntos_habilidad": 1,
   "Puntos_habilidad": 2,
   "Come": true,
   "Respira": true,
   "Duerme": true,
   "Recibe_críticos": false,
   "Puede_ser_flanqueado": false,
   "Pierde_constitucion": false,
   "Limite_inteligencia": -1,
   "Tesoro": null,
   "Id_alineamiento": 2,
   "Rasgos": [],
   "Oficial": true,
   "Tipo_dado_comodin": null
  },
  "sor": [],
  "ali": {
   "Id": 2,
   "Basico": null,
   "Ley": {
    "Id_ley": 10,
    "Nombre": "Ninguna preferencia"
   },
   "Moral": {
    "Id_moral": 10,
    "Nombre": "Ninguna preferencia"
   },
   "Prioridad": null,
   "Descripcion": "Generalmente para alineamientos basados en preferencias dond"
  },
  "dotes": [],
  "rac": [
   {
    "Id": 34,
    "Nombre": "Aspecto de dragón (Corazón)",
    "Descripcion": "Una prole de bahamut que ha elegido corazón como su aspecto ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [
      {
       "Id_habilidad": 6,
       "Habilidad": "Avistar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 7,
       "Habilidad": "Buscar",
       "Id_caracteristica": 4,
       "Caracteristica": "Inteligencia",
       "Descripcion": "Puedes encontrar puertas secretas, trampas sencillas, compar",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 17,
       "Habilidad": "Escuchar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      }
     ],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 38,
    "Nombre": "Aspecto de dragón (Mente)",
    "Descripcion": "Una prole de bahamut que ha elegido la mente como aspecto, a",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 41,
    "Nombre": "Aspecto de dragón (Alas)",
    "Descripcion": "Una prole de bahamut que ha elegido alas como aspecto porta ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 168,
    "Nombre": "Inmunidad a presencia pavorosa (prole de bahamut)",
    "Descripcion": "Los proles de bahamut son inmunes a la habilidad presencia p",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": true,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   }
  ],
  "Habilidades": {
   "Base": [],
   "Custom": []
  },
  "Idiomas": [],
  "subtipos": [
   {
    "Id": 3,
    "Nombre": "Sangre de dragón"
   }
  ],
  "Plantillas_por_subtipo": [],
  "Mutada": true,
  "Mutacion": {
   "Es_mutada": true,
   "Tamano_dependiente": true,
   "Tiene_prerrequisitos": true
  },
  "Categorias_edad": [],
  "Pasos_edad": [],
  "Lanzamiento": null,
  "Clase_predilecta_comodin": null,
  "Comodin": null
 },
 "5": {
  "i": 5,
  "n": "Mediano",
  "m": {
   "Fuerza": -2,
   "Destreza": 2,
   "Constitucion": 0,
   "Inteligencia": 0,
   "Sabiduria": 0,
   "Carisma": 0
  },
  "aju": 0,
  "ma": "Manual del jugador 1, Página: 18",
  "c": "Pícaro",
  "o": true,
  "an": null,
  "t": {
   "Id": 4,
   "Nombre": "Pequeño",
   "Modificador": 1,
   "Modificador_presa": -4,
   "Modificador_esconderse": 4
  },
  "dg": {
   "Cantidad": 0,
   "Dado": "",
   "Tipo_criatura": "",
   "Ataque_base": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0
  },
  "Dotes_adicionales": 0,
  "Puntos_habilidad_extra_primer_nivel": 0,
  "Puntos_habilidad_extra_por_nivel": 0,
  "Cuadrupedo": false,
  "Idiomas_adicionales_cualquiera": false,
  "Idiomas_adicionales": [
   {
    "Id": 8,
    "Nombre": "Élfico",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 12,
    "Nombre": "Enano",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 15,
    "Nombre": "Gnomo",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 17,
    "Nombre": "Orco",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 19,
    "Nombre": "Trasgo",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "Competencias": {
   "Armas": [],
   "Armaduras": [],
   "Grupos_arma": [],
   "Grupos_armadura": []
  },
  "Armas_naturales": [],
  "Descripcion": "Los medianos son como humanos en miniatura que adoran la cer",
  "Nombre_original": null,
  "Traducido": false,
  "Id_clase_predilecta": 12,
  "Edad_maxima_dados": 5,
  "Edad_maxima_caras": 20,
  "Edad_inicial_dados_1": 2,
  "Edad_inicial_caras_1": 4,
  "Edad_inicial_dados_2": 3,
  "Edad_inicial_caras_2": 6,
  "Edad_inicial_dados_3": 4,
  "Edad_inicial_caras_3": 6,
  "Vd": null,
  "Vd_mod_clases_pj": null,
  "Vd_mod_clases_pnj": null,
  "Clases_asociadas": [],
  "Manual": {
   "Id": 54,
   "Nombre": "Manual del jugador 1",
   "Pagina": 18
  },
  "Clase_predilecta": {
   "Id": 12,
   "Nombre": "Pícaro"
  },
  "Dgs_raciales": {
   "Cantidad": 0,
   "Id_dado": 0,
   "Dado": "elegir",
   "Id_tipo_criatura": 0,
   "Tipo_criatura": "Cualquiera",
   "Ataque_base": 0,
   "Fortaleza": 0,
   "Reflejos": 0,
   "Voluntad": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0,
   "Dado_comodin": "elegir"
  },
  "rd": null,
  "rc": null,
  "re": null,
  "mu": false,
  "tmd": false,
  "pr": {},
  "prf": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": false
  },
  "Prerrequisitos_flags": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": false
  },
  "ant": 0,
  "va": 0,
  "co": 20,
  "na": 0,
  "vo": 0,
  "man": null,
  "tr": 0,
  "ex": 0,
  "ari": 0.81,
  "ars": 1.02,
  "pri": 12.25,
  "prs": 17.24,
  "ea": 20,
  "em": 50,
  "ev": 75,
  "eve": 100,
  "esp": 5,
  "alc": 5,
  "tc": {
   "Id": 11,
   "Nombre": "Humanoide",
   "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
   "Manual": "Manual de monstruos 1, Página: 316",
   "Id_tipo_dado": 3,
   "Tipo_dado": "d8",
   "Id_ataque": 2,
   "Id_fortaleza": 1,
   "Id_reflejos": 1,
   "Id_voluntad": 1,
   "Id_puntos_habilidad": 1,
   "Puntos_habilidad": 2,
   "Come": true,
   "Respira": true,
   "Duerme": true,
   "Recibe_críticos": false,
   "Puede_ser_flanqueado": false,
   "Pierde_constitucion": false,
   "Limite_inteligencia": -1,
   "Tesoro": null,
   "Id_alineamiento": 2,
   "Rasgos": [],
   "Oficial": true,
   "Tipo_dado_comodin": null
  },
  "sor": [],
  "ali": {
   "Id": 36,
   "Basico": null,
   "Ley": {
    "Id_ley": 15,
    "Nombre": "Tendencia a ser neutral"
   },
   "Moral": {
    "Id_moral": 15,
    "Nombre": "Tendencia a ser neutral"
   },
   "Prioridad": {
    "Id_prioridad": 2,
    "Nombre": "Importante"
   },
   "Descripcion": "Se debe respetar pero existe la posibilidad de individuos fu"
  },
  "dotes": [],
  "rac": [
   {
    "Id": 28,
    "Nombre": "+1 racial a todos los TS",
    "Descripcion": "",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [
     {
      "Id_salvacion": 1,
      "Salvacion": "Fortaleza",
      "Cantidad": 1,
      "Condicion": null
     },
     {
      "Id_salvacion": 2,
      "Salvacion": "Reflejos",
      "Cantidad": 1,
      "Condicion": null
     },
     {
      "Id_salvacion": 3,
      "Salvacion": "Voluntad",
      "Cantidad": 1,
      "Condicion": null
     }
    ],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 29,
    "Nombre": "+2 de moral a los TS contra miedo",
    "Descripcion": "",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [
     {
      "Id_salvacion": 1,
      "Salvacion": "Fortaleza",
      "Cantidad": 2,
      "Condicion": "Contra miedo (bono de moral)"
     },
     {
      "Id_salvacion": 2,
      "Salvacion": "Reflejos",
      "Cantidad": 2,
      "Condicion": "Contra miedo (bono de moral)"
     },
     {
      "Id_salvacion": 3,
      "Salvacion": "Voluntad",
      "Cantidad": 2,
      "Condicion": "Contra miedo (bono de moral)"
     }
    ],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 30,
    "Nombre": "+1 al ataque con armas arrojadizas y hondas",
    "Descripcion": "",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   }
  ],
  "Habilidades": {
   "Base": [
    {
     "Id_habilidad": 17,
     "Habilidad": "Escuchar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 26,
     "Habilidad": "Moverse sigilosamente",
     "Id_caracteristica": 2,
     "Caracteristica": "Destreza",
     "Descripcion": "Puedes utilizar esta habilidad para ponerte a la espalda de ",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 37,
     "Habilidad": "Saltar",
     "Id_caracteristica": 1,
     "Caracteristica": "Fuerza",
     "Descripcion": "Utiliza esta habilidad para saltar por encima de un pozo, un",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 42,
     "Habilidad": "Trepar",
     "Id_caracteristica": 1,
     "Caracteristica": "Fuerza",
     "Descripcion": "Utiliza esta habilidad para llegar a la ventana de la segund",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    }
   ],
   "Custom": []
  },
  "Idiomas": [
   {
    "Id": 1,
    "Nombre": "Común",
    "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 20,
    "Nombre": "Mediano",
    "Descripcion": "Idioma hablado por los medianos",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "subtipos": [
   {
    "Id": 66,
    "Nombre": "Mediano"
   }
  ],
  "Plantillas_por_subtipo": [],
  "Mutada": false,
  "Mutacion": {
   "Es_mutada": false,
   "Tamano_dependiente": false,
   "Tiene_prerrequisitos": false
  },
  "Categorias_edad": [],
  "Pasos_edad": [],
  "Lanzamiento": null,
  "Clase_predilecta_comodin": null,
  "Comodin": null
 },
 "18": {
  "i": 18,
  "n": "Gnoll",
  "m": {
   "Fuerza": 4,
   "Destreza": 0,
   "Constitucion": 2,
   "Inteligencia": -2,
   "Sabiduria": 0,
   "Carisma": -2
  },
  "aju": 1,
  "ma": "Manual de monstruos 1, Página: 138",
  "c": "Explorador",
  "o": true,
  "an": null,
  "t": {
   "Id": 5,
   "Nombre": "Mediano",
   "Modificador": 0,
   "Modificador_presa": 0,
   "Modificador_esconderse": 0
  },
  "dg": {
   "Cantidad": 2,
   "Dado": "d8",
   "Tipo_criatura": "Humanoide",
   "Ataque_base": 1,
   "Dotes_extra": 1,
   "Puntos_habilidad": 5,
   "Multiplicador_puntos_habilidad": 2,
   "Fortaleza": 3,
   "Reflejos": 0,
   "Voluntad": 0
  },
  "Dotes_adicionales": 0,
  "Puntos_habilidad_extra_primer_nivel": 0,
  "Puntos_habilidad_extra_por_nivel": 0,
  "Cuadrupedo": false,
  "Idiomas_adicionales_cualquiera": true,
  "Idiomas_adicionales": [],
  "Competencias": {
   "Armas": [],
   "Armaduras": [],
   "Grupos_arma": [],
   "Grupos_armadura": []
  },
  "Armas_naturales": [],
  "Descripcion": "Los gnolls son humanoides malignos con cabeza de hiena, que ",
  "Nombre_original": null,
  "Traducido": false,
  "Id_clase_predilecta": 6,
  "Edad_maxima_dados": 0,
  "Edad_maxima_caras": 0,
  "Edad_inicial_dados_1": 1,
  "Edad_inicial_caras_1": 4,
  "Edad_inicial_dados_2": 1,
  "Edad_inicial_caras_2": 6,
  "Edad_inicial_dados_3": 2,
  "Edad_inicial_caras_3": 6,
  "Vd": 1,
  "Vd_mod_clases_pj": null,
  "Vd_mod_clases_pnj": null,
  "Clases_asociadas": [
   {
    "Id": 2,
    "Nombre": "Bárbaro"
   },
   {
    "Id": 6,
    "Nombre": "Explorador"
   },
   {
    "Id": 7,
    "Nombre": "Guerrero"
   },
   {
    "Id": 11,
    "Nombre": "Paladín"
   }
  ],
  "Manual": {
   "Id": 47,
   "Nombre": "Manual de monstruos 1",
   "Pagina": 138
  },
  "Clase_predilecta": {
   "Id": 6,
   "Nombre": "Explorador"
  },
  "Dgs_raciales": {
   "Cantidad": 2,
   "Id_dado": 3,
   "Dado": "d8",
   "Id_tipo_criatura": 11,
   "Tipo_criatura": "Humanoide",
   "Ataque_base": 1,
   "Fortaleza": 3,
   "Reflejos": 0,
   "Voluntad": 0,
   "Dotes_extra": 1,
   "Puntos_habilidad": 5,
   "Multiplicador_puntos_habilidad": 2,
   "Dado_comodin": null
  },
  "rd": null,
  "rc": null,
  "re": null,
  "mu": false,
  "tmd": false,
  "pr": {},
  "prf": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": false
  },
  "Prerrequisitos_flags": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": false
  },
  "ant": 1,
  "va": 0,
  "co": 30,
  "na": 0,
  "vo": 0,
  "man": null,
  "tr": 0,
  "ex": 0,
  "ari": 1.63,
  "ars": 2.29,
  "pri": 83.46,
  "prs": 221.36,
  "ea": 14,
  "em": 35,
  "ev": 53,
  "eve": 70,
  "esp": 5,
  "alc": 5,
  "tc": {
   "Id": 11,
   "Nombre": "Humanoide",
   "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
   "Manual": "Manual de monstruos 1, Página: 316",
   "Id_tipo_dado": 3,
   "Tipo_dado": "d8",
   "Id_ataque": 2,
   "Id_fortaleza": 1,
   "Id_reflejos": 1,
   "Id_voluntad": 1,
   "Id_puntos_habilidad": 1,
   "Puntos_habilidad": 2,
   "Come": true,
   "Respira": true,
   "Duerme": true,
   "Recibe_críticos": false,
   "Puede_ser_flanqueado": false,
   "Pierde_constitucion": false,
   "Limite_inteligencia": -1,
   "Tesoro": null,
   "Id_alineamiento": 2,
   "Rasgos": [],
   "Oficial": true,
   "Tipo_dado_comodin": null
  },
  "sor": [],
  "ali": {
   "Id": 44,
   "Basico": {
    "Id_basico": 9,
    "Nombre": "Caótico maligno"
   },
   "Ley": null,
   "Moral": null,
   "Prioridad": {
    "Id_prioridad": 2,
    "Nombre": "Importante"
   },
   "Descripcion": "Se debe respetar pero existe la posibilidad de individuos fu"
  },
  "dotes": [],
  "rac": [
   {
    "Id": 8,
    "Nombre": "Visión en la oscuridad 60'",
    "Descripcion": "La visión en la oscuridad solo te permite ver en blanco y ne",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   }
  ],
  "Habilidades": {
   "Base": [
    {
     "Id_habilidad": 6,
     "Habilidad": "Avistar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 0,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 17,
     "Habilidad": "Escuchar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 0,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    }
   ],
   "Custom": []
  },
  "Idiomas": [
   {
    "Id": 14,
    "Nombre": "Gnoll",
    "Descripcion": "Idioma hablado por los Gnolls",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "subtipos": [
   {
    "Id": 64,
    "Nombre": "Gnoll"
   }
  ],
  "Plantillas_por_subtipo": [],
  "Mutada": false,
  "Mutacion": {
   "Es_mutada": false,
   "Tamano_dependiente": false,
   "Tiene_prerrequisitos": false
  },
  "Categorias_edad": [],
  "Pasos_edad": [],
  "Lanzamiento": null,
  "Clase_predilecta_comodin": null,
  "Comodin": null
 },
 "308": {
  "i": 308,
  "n": "Drow",
  "m": {
   "Fuerza": 0,
   "Destreza": 2,
   "Constitucion": -2,
   "Inteligencia": 2,
   "Sabiduria": 0,
   "Carisma": 2
  },
  "aju": 2,
  "ma": "Los drow de la Infraoscuridad, Página: 36",
  "c": "Mago",
  "o": true,
  "an": null,
  "t": {
   "Id": 5,
   "Nombre": "Mediano",
   "Modificador": 0,
   "Modificador_presa": 0,
   "Modificador_esconderse": 0
  },
  "dg": {
   "Cantidad": 0,
   "Dado": "",
   "Tipo_criatura": "",
   "Ataque_base": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0
  },
  "Dotes_adicionales": 0,
  "Puntos_habilidad_extra_primer_nivel": 0,
  "Puntos_habilidad_extra_por_nivel": 0,
  "Cuadrupedo": false,
  "Idiomas_adicionales_cualquiera": false,
  "Idiomas_adicionales": [
   {
    "Id": 3,
    "Nombre": "Abisal",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 10,
    "Nombre": "Acuano",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 7,
    "Nombre": "Dracónico",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 15,
    "Nombre": "Gnomo",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 19,
    "Nombre": "Trasgo",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "Competencias": {
   "Armas": [
    {
     "Id": 23,
     "Nombre": "Espada corta"
    },
    {
     "Id": 31,
     "Nombre": "Estoque"
    },
    {
     "Id": 65,
     "Nombre": "Ballesta de mano"
    }
   ],
   "Armaduras": [],
   "Grupos_arma": [],
   "Grupos_armadura": []
  },
  "Armas_naturales": [],
  "Descripcion": "Los drow son parientes de los elfos de superficie, aunque má",
  "Nombre_original": "Drow",
  "Traducido": true,
  "Id_clase_predilecta": 9,
  "Edad_maxima_dados": 0,
  "Edad_maxima_caras": 0,
  "Edad_inicial_dados_1": 4,
  "Edad_inicial_caras_1": 6,
  "Edad_inicial_dados_2": 6,
  "Edad_inicial_caras_2": 6,
  "Edad_inicial_dados_3": 10,
  "Edad_inicial_caras_3": 6,
  "Vd": null,
  "Vd_mod_clases_pj": 1,
  "Vd_mod_clases_pnj": 0,
  "Clases_asociadas": [],
  "Manual": {
   "Id": 80,
   "Nombre": "Los drow de la Infraoscuridad",
   "Pagina": 36
  },
  "Clase_predilecta": {
   "Id": 9,
   "Nombre": "Mago"
  },
  "Dgs_raciales": {
   "Cantidad": 0,
   "Id_dado": 0,
   "Dado": "elegir",
   "Id_tipo_criatura": 0,
   "Tipo_criatura": "Cualquiera",
   "Ataque_base": 0,
   "Fortaleza": 0,
   "Reflejos": 0,
   "Voluntad": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0,
   "Dado_comodin": "elegir"
  },
  "rd": null,
  "rc": "11 + nivel de clase",
  "re": null,
  "mu": false,
  "tmd": false,
  "pr": {},
  "prf": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": false
  },
  "Prerrequisitos_flags": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": false
  },
  "ant": 0,
  "va": 0,
  "co": 30,
  "na": 0,
  "vo": 0,
  "man": null,
  "tr": 0,
  "ex": 0,
  "ari": 1.42,
  "ars": 1.68,
  "pri": 39.46,
  "prs": 44,
  "ea": 110,
  "em": 175,
  "ev": 263,
  "eve": 350,
  "esp": 5,
  "alc": 5,
  "tc": {
   "Id": 11,
   "Nombre": "Humanoide",
   "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
   "Manual": "Manual de monstruos 1, Página: 316",
   "Id_tipo_dado": 3,
   "Tipo_dado": "d8",
   "Id_ataque": 2,
   "Id_fortaleza": 1,
   "Id_reflejos": 1,
   "Id_voluntad": 1,
   "Id_puntos_habilidad": 1,
   "Puntos_habilidad": 2,
   "Come": true,
   "Respira": true,
   "Duerme": true,
   "Recibe_críticos": false,
   "Puede_ser_flanqueado": false,
   "Pierde_constitucion": false,
   "Limite_inteligencia": -1,
   "Tesoro": null,
   "Id_alineamiento": 2,
   "Rasgos": [],
   "Oficial": true,
   "Tipo_dado_comodin": null
  },
  "sor": [
   {
    "Conjuro": {
     "Id": 24,
     "Nombre": "Luces danzantes",
     "Descripcion": "Dependiendo de la versión por la que te inclines, creas hast",
     "Tiempo_lanzamiento": "1 acción estándar",
     "Alcance": "Intermedio",
     "Escuela": {
      "Id": 5,
      "Nombre": "Evocación",
      "Nombre_esp": "Evocador",
      "Prohibible": true,
      "Especializable": true,
      "Prohibidas_al_especializarse": 2,
      "Oficial": true
     },
     "Disciplina": null,
     "Manual": "Manual del jugador 1, Página: 258",
     "Objetivo": "",
     "Efecto": "Hasta cuatro luces ilusorias, todas ellas en un área de 10' ",
     "Area": "",
     "Arcano": true,
     "Divino": false,
     "Psionico": false,
     "Duracion": "1 minuto (D)",
     "Tipo_salvacion": "Ninguna",
     "Resistencia_conjuros": false,
     "Resistencia_poderes": false,
     "Descripcion_componentes": "",
     "Permanente": true,
     "Puntos_poder": 0,
     "Descripcion_aumentos": "",
     "Descriptores": [
      {
       "Id": "30",
       "Nombre": "Luz"
      }
     ],
     "Niveles_clase": [
      {
       "Id_clase": "3",
       "Clase": "bardo",
       "Nivel": "0",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "8",
       "Clase": "hechicero",
       "Nivel": "0",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "9",
       "Clase": "mago",
       "Nivel": "0",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "31",
       "Clase": "Wu jen",
       "Nivel": "0",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "309",
       "Clase": "Shugenja",
       "Nivel": "0",
       "Espontaneo": "0"
      }
     ],
     "Niveles_dominio": [],
     "Niveles_disciplina": [],
     "Componentes": [
      {
       "Id_componente": "1",
       "Componente": "Verbal"
      },
      {
       "Id_componente": "2",
       "Componente": "Somático"
      }
     ],
     "Coste_material": null,
     "Coste_px": null,
     "Oficial": true
    },
    "Nivel_lanzador": 0,
    "Usos_diarios": "1/día",
    "Descripcion": null
   },
   {
    "Conjuro": {
     "Id": 59,
     "Nombre": "Fuego feérico",
     "Descripcion": "Un brillo pálido rodea y perfila a los receptores del conjur",
     "Tiempo_lanzamiento": "1 acción estándar",
     "Alcance": "Largo",
     "Escuela": {
      "Id": 5,
      "Nombre": "Evocación",
      "Nombre_esp": "Evocador",
      "Prohibible": true,
      "Especializable": true,
      "Prohibidas_al_especializarse": 2,
      "Oficial": true
     },
     "Disciplina": null,
     "Manual": "Manual del jugador 1, Página: 244",
     "Objetivo": "",
     "Efecto": "",
     "Area": "Criaturas y objetos en una explosión de 5' de radio",
     "Arcano": false,
     "Divino": true,
     "Psionico": false,
     "Duracion": "1 min./nivel (D)",
     "Tipo_salvacion": "Ninguno",
     "Resistencia_conjuros": true,
     "Resistencia_poderes": false,
     "Descripcion_componentes": "",
     "Permanente": false,
     "Puntos_poder": 0,
     "Descripcion_aumentos": "",
     "Descriptores": [
      {
       "Id": "30",
       "Nombre": "Luz"
      }
     ],
     "Niveles_clase": [
      {
       "Id_clase": "5",
       "Clase": "druida",
       "Nivel": "1",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "244",
       "Clase": "Chamán espiritual",
       "Nivel": "1",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "309",
       "Clase": "Shugenja",
       "Nivel": "1",
       "Espontaneo": "0"
      }
     ],
     "Niveles_dominio": [
      {
       "Id_dominio": "143",
       "Dominio": "Luna",
       "Nivel": "1",
       "Espontaneo": "0"
      }
     ],
     "Niveles_disciplina": [],
     "Componentes": [
      {
       "Id_componente": "1",
       "Componente": "Verbal"
      },
      {
       "Id_componente": "2",
       "Componente": "Somático"
      },
      {
       "Id_componente": "5",
       "Componente": "Foco divino"
      }
     ],
     "Coste_material": null,
     "Coste_px": null,
     "Oficial": true
    },
    "Nivel_lanzador": 0,
    "Usos_diarios": "1/día",
    "Descripcion": null
   },
   {
    "Conjuro": {
     "Id": 85,
     "Nombre": "Oscuridad",
     "Descripcion": "Este conjuro hace que un objeto irradie oscuridad en un radi",
     "Tiempo_lanzamiento": "1 acción estándar",
     "Alcance": "Toque",
     "Escuela": {
      "Id": 5,
      "Nombre": "Evocación",
      "Nombre_esp": "Evocador",
      "Prohibible": true,
      "Especializable": true,
      "Prohibidas_al_especializarse": 2,
      "Oficial": true
     },
     "Disciplina": null,
     "Manual": "Manual del jugador 1, Página: 269",
     "Objetivo": "Objeto tocado",
     "Efecto": "",
     "Area": "",
     "Arcano": true,
     "Divino": true,
     "Psionico": false,
     "Duracion": "10 min./nivel (D)",
     "Tipo_salvacion": "Ninguno",
     "Resistencia_conjuros": false,
     "Resistencia_poderes": false,
     "Descripcion_componentes": "Componentes materiales arcanos: un poco de pelo de murciélag",
     "Permanente": false,
     "Puntos_poder": 0,
     "Descripcion_aumentos": "",
     "Descriptores": [
      {
       "Id": "32",
       "Nombre": "Oscuridad"
      }
     ],
     "Niveles_clase": [
      {
       "Id_clase": "3",
       "Clase": "bardo",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "4",
       "Clase": "clérigo",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "8",
       "Clase": "hechicero",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "9",
       "Clase": "mago",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "32",
       "Clase": "Filo aojador",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "33",
       "Clase": "Asesino",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "34",
       "Clase": "Guardia negro",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "240",
       "Clase": "Alma predilecta",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "241",
       "Clase": "Asolador",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "256",
       "Clase": "Protosacerdote",
       "Nivel": "2",
       "Espontaneo": "0"
      }
     ],
     "Niveles_dominio": [],
     "Niveles_disciplina": [],
     "Componentes": [
      {
       "Id_componente": "1",
       "Componente": "Verbal"
      },
      {
       "Id_componente": "7",
       "Componente": "Material o Foco divino"
      }
     ],
     "Coste_material": null,
     "Coste_px": null,
     "Oficial": true
    },
    "Nivel_lanzador": 0,
    "Usos_diarios": "1/día",
    "Descripcion": null
   }
  ],
  "ali": {
   "Id": 133,
   "Basico": null,
   "Ley": {
    "Id_ley": 10,
    "Nombre": "Ninguna preferencia"
   },
   "Moral": {
    "Id_moral": 16,
    "Nombre": "Tendencia a ser maligno"
   },
   "Prioridad": {
    "Id_prioridad": 1,
    "Nombre": "Debe tenerse en cuenta"
   },
   "Descripcion": "La mayoría de personajes deben seguir estas pautas, pero no "
  },
  "dotes": [],
  "rac": [
   {
    "Id": 81,
    "Nombre": "Visión en la oscuridad 120'",
    "Descripcion": "La visión en la oscuridad solo te permite ver en blanco y ne",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 3097,
    "Nombre": "Inmunidad a conjuros de sueño (drow)",
    "Descripcion": "Es inmune a los conjuros y efectos de sueño, y tiene +2 de V",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [
     {
      "Id_salvacion": 3,
      "Salvacion": "Voluntad",
      "Cantidad": 2,
      "Condicion": "Contra conjuros, aptitudes sortílegas y efectos de encantami"
     }
    ],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 3835,
    "Nombre": "Ceguera por luz (drow)",
    "Descripcion": "Queda cegado 1 asalto ante luz intensa y sufre -1 a ataques,",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 4268,
    "Nombre": "Sentidos agudos (drow)",
    "Descripcion": "Al pasar a 5 pies de una puerta secreta u oculta, puede hace",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   }
  ],
  "Habilidades": {
   "Base": [
    {
     "Id_habilidad": 6,
     "Habilidad": "Avistar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 7,
     "Habilidad": "Buscar",
     "Id_caracteristica": 4,
     "Caracteristica": "Inteligencia",
     "Descripcion": "Puedes encontrar puertas secretas, trampas sencillas, compar",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 17,
     "Habilidad": "Escuchar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    }
   ],
   "Custom": []
  },
  "Idiomas": [
   {
    "Id": 1,
    "Nombre": "Común",
    "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 2,
    "Nombre": "Infracomún",
    "Descripcion": "Idioma hablado por las criaturas de la infraoscuridad",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 8,
    "Nombre": "Élfico",
    "Descripcion": "Idioma hablado por los elfos",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "subtipos": [
   {
    "Id": 63,
    "Nombre": "Elfo"
   }
  ],
  "Plantillas_por_subtipo": [],
  "Mutada": false,
  "Mutacion": {
   "Es_mutada": false,
   "Tamano_dependiente": false,
   "Tiene_prerrequisitos": false
  },
  "Categorias_edad": [],
  "Pasos_edad": [],
  "Lanzamiento": null,
  "Clase_predilecta_comodin": null,
  "Comodin": null
 },
 "26": {
  "i": 26,
  "n": "Jacquar",
  "m": {
   "Fuerza": 2,
   "Destreza": 0,
   "Constitucion": 2,
   "Inteligencia": 0,
   "Sabiduria": 2,
   "Carisma": 0
  },
  "aju": 1,
  "ma": "Rol mapa mundi, Página: 5",
  "c": "Cualquiera",
  "o": false,
  "an": null,
  "t": {
   "Id": 6,
   "Nombre": "Grande",
   "Modificador": -1,
   "Modificador_presa": 4,
   "Modificador_esconderse": -4
  },
  "dg": {
   "Cantidad": 0,
   "Dado": "",
   "Tipo_criatura": "",
   "Ataque_base": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0
  },
  "Dotes_adicionales": 0,
  "Puntos_habilidad_extra_primer_nivel": 0,
  "Puntos_habilidad_extra_por_nivel": 0,
  "Cuadrupedo": false,
  "Idiomas_adicionales_cualquiera": true,
  "Idiomas_adicionales": [],
  "Competencias": {
   "Armas": [],
   "Armaduras": [],
   "Grupos_arma": [],
   "Grupos_armadura": []
  },
  "Armas_naturales": [],
  "Descripcion": "Los jacquar son humanoides con cabeza similar a la de un cha",
  "Nombre_original": null,
  "Traducido": false,
  "Id_clase_predilecta": 0,
  "Edad_maxima_dados": 0,
  "Edad_maxima_caras": 0,
  "Edad_inicial_dados_1": 0,
  "Edad_inicial_caras_1": 0,
  "Edad_inicial_dados_2": 0,
  "Edad_inicial_caras_2": 0,
  "Edad_inicial_dados_3": 0,
  "Edad_inicial_caras_3": 0,
  "Vd": null,
  "Vd_mod_clases_pj": null,
  "Vd_mod_clases_pnj": null,
  "Clases_asociadas": [],
  "Manual": {
   "Id": 65,
   "Nombre": "Rol mapa mundi",
   "Pagina": 5
  },
  "Clase_predilecta": {
   "Id": 0,
   "Nombre": "Cualquiera"
  },
  "Dgs_raciales": {
   "Cantidad": 0,
   "Id_dado": 0,
   "Dado": "elegir",
   "Id_tipo_criatura": 0,
   "Tipo_criatura": "Cualquiera",
   "Ataque_base": 0,
   "Fortaleza": 0,
   "Reflejos": 0,
   "Voluntad": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0,
   "Dado_comodin": "elegir"
  },
  "rd": null,
  "rc": null,
  "re": null,
  "mu": false,
  "tmd": false,
  "pr": {},
  "prf": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": false
  },
  "Prerrequisitos_flags": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": false
  },
  "ant": 0,
  "va": 0,
  "co": 30,
  "na": 0,
  "vo": 0,
  "man": null,
  "tr": 0,
  "ex": 0,
  "ari": 2.4,
  "ars": 3,
  "pri": 250,
  "prs": 350,
  "ea": 150,
  "em": 300,
  "ev": 600,
  "eve": 900,
  "esp": 10,
  "alc": 10,
  "tc": {
   "Id": 11,
   "Nombre": "Humanoide",
   "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
   "Manual": "Manual de monstruos 1, Página: 316",
   "Id_tipo_dado": 3,
   "Tipo_dado": "d8",
   "Id_ataque": 2,
   "Id_fortaleza": 1,
   "Id_reflejos": 1,
   "Id_voluntad": 1,
   "Id_puntos_habilidad": 1,
   "Puntos_habilidad": 2,
   "Come": true,
   "Respira": true,
   "Duerme": true,
   "Recibe_críticos": false,
   "Puede_ser_flanqueado": false,
   "Pierde_constitucion": false,
   "Limite_inteligencia": -1,
   "Tesoro": null,
   "Id_alineamiento": 2,
   "Rasgos": [],
   "Oficial": true,
   "Tipo_dado_comodin": null
  },
  "sor": [],
  "ali": {
   "Id": 2,
   "Basico": null,
   "Ley": {
    "Id_ley": 10,
    "Nombre": "Ninguna preferencia"
   },
   "Moral": {
    "Id_moral": 10,
    "Nombre": "Ninguna preferencia"
   },
   "Prioridad": null,
   "Descripcion": "Generalmente para alineamientos basados en preferencias dond"
  },
  "dotes": [
   {
    "Dote": {
     "Id": 63,
     "Nombre": "Resistencia al calor",
     "Descripcion": "Dote general que mejora la resistencia al calor: otorga +2 a",
     "Beneficio": "- +2 de bonificador a las tiradas de salvación contra efecto",
     "Normal": null,
     "Especial": null,
     "Manual": {
      "Id": 69,
      "Nombre": "Tormenta de arena",
      "Pagina": 50
     },
     "Tipos": [
      {
       "Id": 1,
       "Nombre": "General",
       "Usado": 1
      }
     ],
     "Repetible": 0,
     "Repetible_distinto_extra": 0,
     "Repetible_comb": 0,
     "Comp_arma": 0,
     "Oficial": true,
     "Extras_soportados": {
      "Extra_arma": 0,
      "Extra_armadura": 0,
      "Extra_armadura_armaduras": 0,
      "Extra_armadura_escudos": 0,
      "Extra_escuela": 0,
      "Extra_habilidad": 0,
      "Extra_chakra": 0,
      "Extra_fusion": 0
     },
     "Extras_disponibles": {
      "Armas": [],
      "Armaduras": [],
      "Escuelas": [],
      "Habilidades": [],
      "Chakras": [],
      "Fusiones": []
     },
     "Modificadores": {
      "Pg_a_n": 0,
      "Pg_a": 0,
      "Caracteristica": 0,
      "Fuerza": 0,
      "Destreza": 0,
      "Constitucion": 0,
      "Inteligencia": 0,
      "Sabiduria": 0,
      "Carisma": 0,
      "Ca": 0,
      "Toque": 0,
      "Desprevenido": 0,
      "Armadura_natural": 0,
      "Ataque_base": 0,
      "Presa": 0,
      "Iniciativa": 0,
      "Fortaleza": 0,
      "Reflejos": 0,
      "Voluntad": 0,
      "Espacio": 0,
      "Alcance": 0,
      "Correr": 0,
      "Nadar": 0,
      "Volar": 0,
      "Trepar": 0,
      "Excavar": 0,
      "Habilidad": 0
     },
     "Incarnum": {
      "Esencia_reserva": 0,
      "Esencia_reserva_moldeador": null,
      "Receptaculo": false,
      "Capacidad": null,
      "Abre_chakra": false,
      "Divisor_nivel_moldeador": null,
      "Caracteristica_cd_fusion": null,
      "Sustituye_caracteristica": null,
      "Pg_por_esencia": 0,
      "Pg_por_dote": null,
      "Descriptores_sin_alineamiento": []
     },
     "Habilidades_otorgadas": [],
     "Competencias_otorgadas": {
      "Armas": [],
      "Grupos_arma": []
     },
     "Salvaciones_condicionales": [],
     "Prerrequisitos": {
      "salvacion_minimo": [
       {
        "Fortaleza": 2,
        "Reflejos": 0,
        "Voluntad": 0,
        "Opcional": 0,
        "Frase": "Salvación base de Fortaleza +2"
       }
      ],
      "poder_seleccionar_companero": [],
      "poder_seleccionar_familiar": [],
      "lanz_espontaneo": [],
      "conjuros_escuela": [],
      "dg": [],
      "armas_naturales": [],
      "alineamiento_requerido": [],
      "alineamiento_prohibido": [],
      "actitud_requerido": [],
      "actitud_prohibido": [],
      "lanzar_conjuros_arcanos_nivel": [],
      "lanzar_conjuros_divinos_nivel": [],
      "tamano_minimo": [],
      "tamano_maximo": [],
      "limite_tipo_dote": [],
      "tipo_criatura": [],
      "lanzador_arcano": [],
      "lanzador_divino": [],
      "lanzador_psionico": [],
      "aptitud_especial": [],
      "clase_especial": [],
      "competencia_armadura": [],
      "competencia_arma": [],
      "competencia_grupo_armadura": [],
      "competencia_grupo_arma": [],
      "escuela_nivel": [],
      "dote": [],
      "ataque_base": [],
      "caracteristica": [],
      "dominio": [],
      "nivel": [],
      "nivel_max": [],
      "tipo_dote": [],
      "region": [],
      "habilidad": [],
      "idioma": [],
      "nivel_de_clase": [],
      "raza": [],
      "esencia_minima": [],
      "sin_esencia": [],
      "nivel_moldeador": [],
      "fusiones_minimas": [],
      "vinculo_chakra": [],
      "vinculos_minimos": [],
      "reserva_psionica": [],
      "lanzar_poder_psionico_nivel": []
     },
     "Extras_de_todo_el_catalogo": {
      "Armas": false,
      "Armaduras": false,
      "Escuelas": false,
      "Habilidades": false,
      "Chakras": false,
      "Fusiones": false
     },
     "Cuenta_como": []
    },
    "Contexto": {
     "Entidad": "raza",
     "Id_raza": 26,
     "Id_extra": null,
     "Extra": null,
     "Extra_comodin": null
    }
   }
  ],
  "rac": [
   {
    "Id": 43,
    "Nombre": "Olfato",
    "Descripcion": "Esta aptitud permite a la criatura detectar a individuos que",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 175,
    "Nombre": "Adaptación al desierto",
    "Descripcion": "Aguanta hasta 3 días sin beber agua.",
    "Oficial": false,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": true,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   }
  ],
  "Habilidades": {
   "Base": [],
   "Custom": []
  },
  "Idiomas": [
   {
    "Id": 1,
    "Nombre": "Común",
    "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "subtipos": [
   {
    "Id": 85,
    "Nombre": "Jacquar"
   }
  ],
  "Plantillas_por_subtipo": [],
  "Mutada": false,
  "Mutacion": {
   "Es_mutada": false,
   "Tamano_dependiente": false,
   "Tiene_prerrequisitos": false
  },
  "Categorias_edad": [],
  "Pasos_edad": [],
  "Lanzamiento": null,
  "Clase_predilecta_comodin": "cualquiera",
  "Comodin": null
 }
};

export const PROLE_SOBRE_API: Record<string, any> = {
 "5": {
  "i": 21,
  "n": "Prole de bahamut",
  "m": {
   "Fuerza": 0,
   "Destreza": -2,
   "Constitucion": 2,
   "Inteligencia": 0,
   "Sabiduria": 0,
   "Carisma": 0
  },
  "aju": 0,
  "ma": "Razas del dragón, Página: 8",
  "c": "Guerrero",
  "o": true,
  "an": null,
  "t": {
   "Id": 4,
   "Nombre": "Pequeño",
   "Modificador": 1,
   "Modificador_presa": -4,
   "Modificador_esconderse": 4
  },
  "dg": {
   "Cantidad": 0,
   "Dado": "",
   "Tipo_criatura": "",
   "Ataque_base": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0
  },
  "Dotes_adicionales": 0,
  "Puntos_habilidad_extra_primer_nivel": 0,
  "Puntos_habilidad_extra_por_nivel": 0,
  "Cuadrupedo": false,
  "Idiomas_adicionales_cualquiera": false,
  "Idiomas_adicionales": [
   {
    "Id": 8,
    "Nombre": "Élfico",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 12,
    "Nombre": "Enano",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 15,
    "Nombre": "Gnomo",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 17,
    "Nombre": "Orco",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 19,
    "Nombre": "Trasgo",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "Competencias": {
   "Armas": [],
   "Armaduras": [],
   "Grupos_arma": [],
   "Grupos_armadura": []
  },
  "Armas_naturales": [],
  "Descripcion": "Las proles de bahamut son una raza única por qué no nacen; r",
  "Nombre_original": null,
  "Traducido": false,
  "Id_clase_predilecta": 7,
  "Edad_maxima_dados": 5,
  "Edad_maxima_caras": 20,
  "Edad_inicial_dados_1": 2,
  "Edad_inicial_caras_1": 4,
  "Edad_inicial_dados_2": 3,
  "Edad_inicial_caras_2": 6,
  "Edad_inicial_dados_3": 4,
  "Edad_inicial_caras_3": 6,
  "Vd": null,
  "Vd_mod_clases_pj": null,
  "Vd_mod_clases_pnj": null,
  "Clases_asociadas": [],
  "Manual": {
   "Id": 34,
   "Nombre": "Razas del dragón",
   "Pagina": 8
  },
  "Clase_predilecta": {
   "Id": 7,
   "Nombre": "Guerrero"
  },
  "Dgs_raciales": {
   "Cantidad": 0,
   "Id_dado": 0,
   "Dado": "elegir",
   "Id_tipo_criatura": 0,
   "Tipo_criatura": "Cualquiera",
   "Ataque_base": 0,
   "Fortaleza": 0,
   "Reflejos": 0,
   "Voluntad": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0,
   "Dado_comodin": "elegir"
  },
  "rd": null,
  "rc": null,
  "re": null,
  "mu": true,
  "tmd": true,
  "pr": {
   "tipo_criatura": [
    {
     "id_tipo_criatura": 11,
     "tipo_criatura": "Humanoide",
     "opcional": 0,
     "tipo_criatura_comodin": null,
     "Frase": "Criatura de tipo humanoide"
    }
   ]
  },
  "prf": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "Prerrequisitos_flags": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "ant": 0,
  "va": 2,
  "co": 20,
  "na": 0,
  "vo": 0,
  "man": null,
  "tr": 0,
  "ex": 0,
  "ari": 0.81,
  "ars": 1.02,
  "pri": 12.25,
  "prs": 17.24,
  "ea": 20,
  "em": 200,
  "ev": 300,
  "eve": 400,
  "esp": 5,
  "alc": 5,
  "tc": {
   "Id": 11,
   "Nombre": "Humanoide",
   "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
   "Manual": "Manual de monstruos 1, Página: 316",
   "Id_tipo_dado": 3,
   "Tipo_dado": "d8",
   "Id_ataque": 2,
   "Id_fortaleza": 1,
   "Id_reflejos": 1,
   "Id_voluntad": 1,
   "Id_puntos_habilidad": 1,
   "Puntos_habilidad": 2,
   "Come": true,
   "Respira": true,
   "Duerme": true,
   "Recibe_críticos": false,
   "Puede_ser_flanqueado": false,
   "Pierde_constitucion": false,
   "Limite_inteligencia": -1,
   "Tesoro": null,
   "Id_alineamiento": 2,
   "Rasgos": [],
   "Oficial": true,
   "Tipo_dado_comodin": null
  },
  "sor": [],
  "ali": {
   "Id": 36,
   "Basico": null,
   "Ley": {
    "Id_ley": 15,
    "Nombre": "Tendencia a ser neutral"
   },
   "Moral": {
    "Id_moral": 15,
    "Nombre": "Tendencia a ser neutral"
   },
   "Prioridad": {
    "Id_prioridad": 2,
    "Nombre": "Importante"
   },
   "Descripcion": "Se debe respetar pero existe la posibilidad de individuos fu"
  },
  "dotes": [],
  "rac": [
   {
    "Id": 28,
    "Nombre": "+1 racial a todos los TS",
    "Descripcion": "",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [
     {
      "Id_salvacion": 1,
      "Salvacion": "Fortaleza",
      "Cantidad": 1,
      "Condicion": null
     },
     {
      "Id_salvacion": 2,
      "Salvacion": "Reflejos",
      "Cantidad": 1,
      "Condicion": null
     },
     {
      "Id_salvacion": 3,
      "Salvacion": "Voluntad",
      "Cantidad": 1,
      "Condicion": null
     }
    ],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 29,
    "Nombre": "+2 de moral a los TS contra miedo",
    "Descripcion": "",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [
     {
      "Id_salvacion": 1,
      "Salvacion": "Fortaleza",
      "Cantidad": 2,
      "Condicion": "Contra miedo (bono de moral)"
     },
     {
      "Id_salvacion": 2,
      "Salvacion": "Reflejos",
      "Cantidad": 2,
      "Condicion": "Contra miedo (bono de moral)"
     },
     {
      "Id_salvacion": 3,
      "Salvacion": "Voluntad",
      "Cantidad": 2,
      "Condicion": "Contra miedo (bono de moral)"
     }
    ],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 30,
    "Nombre": "+1 al ataque con armas arrojadizas y hondas",
    "Descripcion": "",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 34,
    "Nombre": "Aspecto de dragón (Corazón)",
    "Descripcion": "Una prole de bahamut que ha elegido corazón como su aspecto ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [
      {
       "Id_habilidad": 6,
       "Habilidad": "Avistar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 7,
       "Habilidad": "Buscar",
       "Id_caracteristica": 4,
       "Caracteristica": "Inteligencia",
       "Descripcion": "Puedes encontrar puertas secretas, trampas sencillas, compar",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 17,
       "Habilidad": "Escuchar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      }
     ],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 38,
    "Nombre": "Aspecto de dragón (Mente)",
    "Descripcion": "Una prole de bahamut que ha elegido la mente como aspecto, a",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 41,
    "Nombre": "Aspecto de dragón (Alas)",
    "Descripcion": "Una prole de bahamut que ha elegido alas como aspecto porta ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 168,
    "Nombre": "Inmunidad a presencia pavorosa (prole de bahamut)",
    "Descripcion": "Los proles de bahamut son inmunes a la habilidad presencia p",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": true,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   }
  ],
  "Habilidades": {
   "Base": [
    {
     "Id_habilidad": 17,
     "Habilidad": "Escuchar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 26,
     "Habilidad": "Moverse sigilosamente",
     "Id_caracteristica": 2,
     "Caracteristica": "Destreza",
     "Descripcion": "Puedes utilizar esta habilidad para ponerte a la espalda de ",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 37,
     "Habilidad": "Saltar",
     "Id_caracteristica": 1,
     "Caracteristica": "Fuerza",
     "Descripcion": "Utiliza esta habilidad para saltar por encima de un pozo, un",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 42,
     "Habilidad": "Trepar",
     "Id_caracteristica": 1,
     "Caracteristica": "Fuerza",
     "Descripcion": "Utiliza esta habilidad para llegar a la ventana de la segund",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    }
   ],
   "Custom": []
  },
  "Idiomas": [
   {
    "Id": 1,
    "Nombre": "Común",
    "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 20,
    "Nombre": "Mediano",
    "Descripcion": "Idioma hablado por los medianos",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "subtipos": [
   {
    "Id": 66,
    "Nombre": "Mediano"
   },
   {
    "Id": 3,
    "Nombre": "Sangre de dragón"
   }
  ],
  "Plantillas_por_subtipo": [],
  "Mutada": true,
  "Mutacion": {
   "Es_mutada": true,
   "Tamano_dependiente": true,
   "Tiene_prerrequisitos": true
  },
  "Categorias_edad": [],
  "Pasos_edad": [],
  "Lanzamiento": null,
  "Clase_predilecta_comodin": null,
  "Comodin": null
 },
 "18": {
  "i": 21,
  "n": "Prole de bahamut",
  "m": {
   "Fuerza": 0,
   "Destreza": -2,
   "Constitucion": 2,
   "Inteligencia": 0,
   "Sabiduria": 0,
   "Carisma": 0
  },
  "aju": 1,
  "ma": "Razas del dragón, Página: 8",
  "c": "Guerrero",
  "o": true,
  "an": null,
  "t": {
   "Id": 5,
   "Nombre": "Mediano",
   "Modificador": 0,
   "Modificador_presa": 0,
   "Modificador_esconderse": 0
  },
  "dg": {
   "Cantidad": 2,
   "Dado": "d8",
   "Tipo_criatura": "Humanoide",
   "Ataque_base": 1,
   "Dotes_extra": 1,
   "Puntos_habilidad": 5,
   "Multiplicador_puntos_habilidad": 2,
   "Fortaleza": 3,
   "Reflejos": 0,
   "Voluntad": 0
  },
  "Dotes_adicionales": 0,
  "Puntos_habilidad_extra_primer_nivel": 0,
  "Puntos_habilidad_extra_por_nivel": 0,
  "Cuadrupedo": false,
  "Idiomas_adicionales_cualquiera": true,
  "Idiomas_adicionales": [],
  "Competencias": {
   "Armas": [],
   "Armaduras": [],
   "Grupos_arma": [],
   "Grupos_armadura": []
  },
  "Armas_naturales": [],
  "Descripcion": "Las proles de bahamut son una raza única por qué no nacen; r",
  "Nombre_original": null,
  "Traducido": false,
  "Id_clase_predilecta": 7,
  "Edad_maxima_dados": 0,
  "Edad_maxima_caras": 0,
  "Edad_inicial_dados_1": 1,
  "Edad_inicial_caras_1": 4,
  "Edad_inicial_dados_2": 1,
  "Edad_inicial_caras_2": 6,
  "Edad_inicial_dados_3": 2,
  "Edad_inicial_caras_3": 6,
  "Vd": 1,
  "Vd_mod_clases_pj": null,
  "Vd_mod_clases_pnj": null,
  "Clases_asociadas": [
   {
    "Id": 2,
    "Nombre": "Bárbaro"
   },
   {
    "Id": 6,
    "Nombre": "Explorador"
   },
   {
    "Id": 7,
    "Nombre": "Guerrero"
   },
   {
    "Id": 11,
    "Nombre": "Paladín"
   }
  ],
  "Manual": {
   "Id": 34,
   "Nombre": "Razas del dragón",
   "Pagina": 8
  },
  "Clase_predilecta": {
   "Id": 7,
   "Nombre": "Guerrero"
  },
  "Dgs_raciales": {
   "Cantidad": 0,
   "Id_dado": 0,
   "Dado": "elegir",
   "Id_tipo_criatura": 0,
   "Tipo_criatura": "Cualquiera",
   "Ataque_base": 0,
   "Fortaleza": 0,
   "Reflejos": 0,
   "Voluntad": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0,
   "Dado_comodin": "elegir"
  },
  "rd": null,
  "rc": null,
  "re": null,
  "mu": true,
  "tmd": true,
  "pr": {
   "tipo_criatura": [
    {
     "id_tipo_criatura": 11,
     "tipo_criatura": "Humanoide",
     "opcional": 0,
     "tipo_criatura_comodin": null,
     "Frase": "Criatura de tipo humanoide"
    }
   ]
  },
  "prf": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "Prerrequisitos_flags": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "ant": 1,
  "va": 2,
  "co": 30,
  "na": 0,
  "vo": 0,
  "man": null,
  "tr": 0,
  "ex": 0,
  "ari": 1.63,
  "ars": 2.29,
  "pri": 83.46,
  "prs": 221.36,
  "ea": 14,
  "em": 200,
  "ev": 300,
  "eve": 400,
  "esp": 5,
  "alc": 5,
  "tc": {
   "Id": 11,
   "Nombre": "Humanoide",
   "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
   "Manual": "Manual de monstruos 1, Página: 316",
   "Id_tipo_dado": 3,
   "Tipo_dado": "d8",
   "Id_ataque": 2,
   "Id_fortaleza": 1,
   "Id_reflejos": 1,
   "Id_voluntad": 1,
   "Id_puntos_habilidad": 1,
   "Puntos_habilidad": 2,
   "Come": true,
   "Respira": true,
   "Duerme": true,
   "Recibe_críticos": false,
   "Puede_ser_flanqueado": false,
   "Pierde_constitucion": false,
   "Limite_inteligencia": -1,
   "Tesoro": null,
   "Id_alineamiento": 2,
   "Rasgos": [],
   "Oficial": true,
   "Tipo_dado_comodin": null
  },
  "sor": [],
  "ali": {
   "Id": 44,
   "Basico": {
    "Id_basico": 9,
    "Nombre": "Caótico maligno"
   },
   "Ley": null,
   "Moral": null,
   "Prioridad": {
    "Id_prioridad": 2,
    "Nombre": "Importante"
   },
   "Descripcion": "Se debe respetar pero existe la posibilidad de individuos fu"
  },
  "dotes": [],
  "rac": [
   {
    "Id": 8,
    "Nombre": "Visión en la oscuridad 60'",
    "Descripcion": "La visión en la oscuridad solo te permite ver en blanco y ne",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 34,
    "Nombre": "Aspecto de dragón (Corazón)",
    "Descripcion": "Una prole de bahamut que ha elegido corazón como su aspecto ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [
      {
       "Id_habilidad": 6,
       "Habilidad": "Avistar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 7,
       "Habilidad": "Buscar",
       "Id_caracteristica": 4,
       "Caracteristica": "Inteligencia",
       "Descripcion": "Puedes encontrar puertas secretas, trampas sencillas, compar",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 17,
       "Habilidad": "Escuchar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      }
     ],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 38,
    "Nombre": "Aspecto de dragón (Mente)",
    "Descripcion": "Una prole de bahamut que ha elegido la mente como aspecto, a",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 41,
    "Nombre": "Aspecto de dragón (Alas)",
    "Descripcion": "Una prole de bahamut que ha elegido alas como aspecto porta ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 168,
    "Nombre": "Inmunidad a presencia pavorosa (prole de bahamut)",
    "Descripcion": "Los proles de bahamut son inmunes a la habilidad presencia p",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": true,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   }
  ],
  "Habilidades": {
   "Base": [
    {
     "Id_habilidad": 6,
     "Habilidad": "Avistar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 0,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 17,
     "Habilidad": "Escuchar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 0,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    }
   ],
   "Custom": []
  },
  "Idiomas": [
   {
    "Id": 14,
    "Nombre": "Gnoll",
    "Descripcion": "Idioma hablado por los Gnolls",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "subtipos": [
   {
    "Id": 64,
    "Nombre": "Gnoll"
   },
   {
    "Id": 3,
    "Nombre": "Sangre de dragón"
   }
  ],
  "Plantillas_por_subtipo": [],
  "Mutada": true,
  "Mutacion": {
   "Es_mutada": true,
   "Tamano_dependiente": true,
   "Tiene_prerrequisitos": true
  },
  "Categorias_edad": [],
  "Pasos_edad": [],
  "Lanzamiento": null,
  "Clase_predilecta_comodin": null,
  "Comodin": null
 },
 "308": {
  "i": 21,
  "n": "Prole de bahamut",
  "m": {
   "Fuerza": 0,
   "Destreza": -2,
   "Constitucion": 2,
   "Inteligencia": 0,
   "Sabiduria": 0,
   "Carisma": 0
  },
  "aju": 2,
  "ma": "Razas del dragón, Página: 8",
  "c": "Guerrero",
  "o": true,
  "an": null,
  "t": {
   "Id": 5,
   "Nombre": "Mediano",
   "Modificador": 0,
   "Modificador_presa": 0,
   "Modificador_esconderse": 0
  },
  "dg": {
   "Cantidad": 0,
   "Dado": "",
   "Tipo_criatura": "",
   "Ataque_base": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0
  },
  "Dotes_adicionales": 0,
  "Puntos_habilidad_extra_primer_nivel": 0,
  "Puntos_habilidad_extra_por_nivel": 0,
  "Cuadrupedo": false,
  "Idiomas_adicionales_cualquiera": false,
  "Idiomas_adicionales": [
   {
    "Id": 3,
    "Nombre": "Abisal",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 10,
    "Nombre": "Acuano",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 7,
    "Nombre": "Dracónico",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 15,
    "Nombre": "Gnomo",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 19,
    "Nombre": "Trasgo",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "Competencias": {
   "Armas": [
    {
     "Id": 23,
     "Nombre": "Espada corta"
    },
    {
     "Id": 31,
     "Nombre": "Estoque"
    },
    {
     "Id": 65,
     "Nombre": "Ballesta de mano"
    }
   ],
   "Armaduras": [],
   "Grupos_arma": [],
   "Grupos_armadura": []
  },
  "Armas_naturales": [],
  "Descripcion": "Las proles de bahamut son una raza única por qué no nacen; r",
  "Nombre_original": "Drow",
  "Traducido": true,
  "Id_clase_predilecta": 7,
  "Edad_maxima_dados": 0,
  "Edad_maxima_caras": 0,
  "Edad_inicial_dados_1": 4,
  "Edad_inicial_caras_1": 6,
  "Edad_inicial_dados_2": 6,
  "Edad_inicial_caras_2": 6,
  "Edad_inicial_dados_3": 10,
  "Edad_inicial_caras_3": 6,
  "Vd": null,
  "Vd_mod_clases_pj": 1,
  "Vd_mod_clases_pnj": 0,
  "Clases_asociadas": [],
  "Manual": {
   "Id": 34,
   "Nombre": "Razas del dragón",
   "Pagina": 8
  },
  "Clase_predilecta": {
   "Id": 7,
   "Nombre": "Guerrero"
  },
  "Dgs_raciales": {
   "Cantidad": 0,
   "Id_dado": 0,
   "Dado": "elegir",
   "Id_tipo_criatura": 0,
   "Tipo_criatura": "Cualquiera",
   "Ataque_base": 0,
   "Fortaleza": 0,
   "Reflejos": 0,
   "Voluntad": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0,
   "Dado_comodin": "elegir"
  },
  "rd": null,
  "rc": "11 + nivel de clase",
  "re": null,
  "mu": true,
  "tmd": true,
  "pr": {
   "tipo_criatura": [
    {
     "id_tipo_criatura": 11,
     "tipo_criatura": "Humanoide",
     "opcional": 0,
     "tipo_criatura_comodin": null,
     "Frase": "Criatura de tipo humanoide"
    }
   ]
  },
  "prf": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "Prerrequisitos_flags": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "ant": 0,
  "va": 2,
  "co": 30,
  "na": 0,
  "vo": 0,
  "man": null,
  "tr": 0,
  "ex": 0,
  "ari": 1.42,
  "ars": 1.68,
  "pri": 39.46,
  "prs": 44,
  "ea": 110,
  "em": 200,
  "ev": 300,
  "eve": 400,
  "esp": 5,
  "alc": 5,
  "tc": {
   "Id": 11,
   "Nombre": "Humanoide",
   "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
   "Manual": "Manual de monstruos 1, Página: 316",
   "Id_tipo_dado": 3,
   "Tipo_dado": "d8",
   "Id_ataque": 2,
   "Id_fortaleza": 1,
   "Id_reflejos": 1,
   "Id_voluntad": 1,
   "Id_puntos_habilidad": 1,
   "Puntos_habilidad": 2,
   "Come": true,
   "Respira": true,
   "Duerme": true,
   "Recibe_críticos": false,
   "Puede_ser_flanqueado": false,
   "Pierde_constitucion": false,
   "Limite_inteligencia": -1,
   "Tesoro": null,
   "Id_alineamiento": 2,
   "Rasgos": [],
   "Oficial": true,
   "Tipo_dado_comodin": null
  },
  "sor": [
   {
    "Conjuro": {
     "Id": 24,
     "Nombre": "Luces danzantes",
     "Descripcion": "Dependiendo de la versión por la que te inclines, creas hast",
     "Tiempo_lanzamiento": "1 acción estándar",
     "Alcance": "Intermedio",
     "Escuela": {
      "Id": 5,
      "Nombre": "Evocación",
      "Nombre_esp": "Evocador",
      "Prohibible": true,
      "Especializable": true,
      "Prohibidas_al_especializarse": 2,
      "Oficial": true
     },
     "Disciplina": null,
     "Manual": "Manual del jugador 1, Página: 258",
     "Objetivo": "",
     "Efecto": "Hasta cuatro luces ilusorias, todas ellas en un área de 10' ",
     "Area": "",
     "Arcano": true,
     "Divino": false,
     "Psionico": false,
     "Duracion": "1 minuto (D)",
     "Tipo_salvacion": "Ninguna",
     "Resistencia_conjuros": false,
     "Resistencia_poderes": false,
     "Descripcion_componentes": "",
     "Permanente": true,
     "Puntos_poder": 0,
     "Descripcion_aumentos": "",
     "Descriptores": [
      {
       "Id": "30",
       "Nombre": "Luz"
      }
     ],
     "Niveles_clase": [
      {
       "Id_clase": "3",
       "Clase": "bardo",
       "Nivel": "0",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "8",
       "Clase": "hechicero",
       "Nivel": "0",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "9",
       "Clase": "mago",
       "Nivel": "0",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "31",
       "Clase": "Wu jen",
       "Nivel": "0",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "309",
       "Clase": "Shugenja",
       "Nivel": "0",
       "Espontaneo": "0"
      }
     ],
     "Niveles_dominio": [],
     "Niveles_disciplina": [],
     "Componentes": [
      {
       "Id_componente": "1",
       "Componente": "Verbal"
      },
      {
       "Id_componente": "2",
       "Componente": "Somático"
      }
     ],
     "Coste_material": null,
     "Coste_px": null,
     "Oficial": true
    },
    "Nivel_lanzador": 0,
    "Usos_diarios": "1/día",
    "Descripcion": null
   },
   {
    "Conjuro": {
     "Id": 59,
     "Nombre": "Fuego feérico",
     "Descripcion": "Un brillo pálido rodea y perfila a los receptores del conjur",
     "Tiempo_lanzamiento": "1 acción estándar",
     "Alcance": "Largo",
     "Escuela": {
      "Id": 5,
      "Nombre": "Evocación",
      "Nombre_esp": "Evocador",
      "Prohibible": true,
      "Especializable": true,
      "Prohibidas_al_especializarse": 2,
      "Oficial": true
     },
     "Disciplina": null,
     "Manual": "Manual del jugador 1, Página: 244",
     "Objetivo": "",
     "Efecto": "",
     "Area": "Criaturas y objetos en una explosión de 5' de radio",
     "Arcano": false,
     "Divino": true,
     "Psionico": false,
     "Duracion": "1 min./nivel (D)",
     "Tipo_salvacion": "Ninguno",
     "Resistencia_conjuros": true,
     "Resistencia_poderes": false,
     "Descripcion_componentes": "",
     "Permanente": false,
     "Puntos_poder": 0,
     "Descripcion_aumentos": "",
     "Descriptores": [
      {
       "Id": "30",
       "Nombre": "Luz"
      }
     ],
     "Niveles_clase": [
      {
       "Id_clase": "5",
       "Clase": "druida",
       "Nivel": "1",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "244",
       "Clase": "Chamán espiritual",
       "Nivel": "1",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "309",
       "Clase": "Shugenja",
       "Nivel": "1",
       "Espontaneo": "0"
      }
     ],
     "Niveles_dominio": [
      {
       "Id_dominio": "143",
       "Dominio": "Luna",
       "Nivel": "1",
       "Espontaneo": "0"
      }
     ],
     "Niveles_disciplina": [],
     "Componentes": [
      {
       "Id_componente": "1",
       "Componente": "Verbal"
      },
      {
       "Id_componente": "2",
       "Componente": "Somático"
      },
      {
       "Id_componente": "5",
       "Componente": "Foco divino"
      }
     ],
     "Coste_material": null,
     "Coste_px": null,
     "Oficial": true
    },
    "Nivel_lanzador": 0,
    "Usos_diarios": "1/día",
    "Descripcion": null
   },
   {
    "Conjuro": {
     "Id": 85,
     "Nombre": "Oscuridad",
     "Descripcion": "Este conjuro hace que un objeto irradie oscuridad en un radi",
     "Tiempo_lanzamiento": "1 acción estándar",
     "Alcance": "Toque",
     "Escuela": {
      "Id": 5,
      "Nombre": "Evocación",
      "Nombre_esp": "Evocador",
      "Prohibible": true,
      "Especializable": true,
      "Prohibidas_al_especializarse": 2,
      "Oficial": true
     },
     "Disciplina": null,
     "Manual": "Manual del jugador 1, Página: 269",
     "Objetivo": "Objeto tocado",
     "Efecto": "",
     "Area": "",
     "Arcano": true,
     "Divino": true,
     "Psionico": false,
     "Duracion": "10 min./nivel (D)",
     "Tipo_salvacion": "Ninguno",
     "Resistencia_conjuros": false,
     "Resistencia_poderes": false,
     "Descripcion_componentes": "Componentes materiales arcanos: un poco de pelo de murciélag",
     "Permanente": false,
     "Puntos_poder": 0,
     "Descripcion_aumentos": "",
     "Descriptores": [
      {
       "Id": "32",
       "Nombre": "Oscuridad"
      }
     ],
     "Niveles_clase": [
      {
       "Id_clase": "3",
       "Clase": "bardo",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "4",
       "Clase": "clérigo",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "8",
       "Clase": "hechicero",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "9",
       "Clase": "mago",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "32",
       "Clase": "Filo aojador",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "33",
       "Clase": "Asesino",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "34",
       "Clase": "Guardia negro",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "240",
       "Clase": "Alma predilecta",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "241",
       "Clase": "Asolador",
       "Nivel": "2",
       "Espontaneo": "0"
      },
      {
       "Id_clase": "256",
       "Clase": "Protosacerdote",
       "Nivel": "2",
       "Espontaneo": "0"
      }
     ],
     "Niveles_dominio": [],
     "Niveles_disciplina": [],
     "Componentes": [
      {
       "Id_componente": "1",
       "Componente": "Verbal"
      },
      {
       "Id_componente": "7",
       "Componente": "Material o Foco divino"
      }
     ],
     "Coste_material": null,
     "Coste_px": null,
     "Oficial": true
    },
    "Nivel_lanzador": 0,
    "Usos_diarios": "1/día",
    "Descripcion": null
   }
  ],
  "ali": {
   "Id": 133,
   "Basico": null,
   "Ley": {
    "Id_ley": 10,
    "Nombre": "Ninguna preferencia"
   },
   "Moral": {
    "Id_moral": 16,
    "Nombre": "Tendencia a ser maligno"
   },
   "Prioridad": {
    "Id_prioridad": 1,
    "Nombre": "Debe tenerse en cuenta"
   },
   "Descripcion": "La mayoría de personajes deben seguir estas pautas, pero no "
  },
  "dotes": [],
  "rac": [
   {
    "Id": 81,
    "Nombre": "Visión en la oscuridad 120'",
    "Descripcion": "La visión en la oscuridad solo te permite ver en blanco y ne",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 3097,
    "Nombre": "Inmunidad a conjuros de sueño (drow)",
    "Descripcion": "Es inmune a los conjuros y efectos de sueño, y tiene +2 de V",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [
     {
      "Id_salvacion": 3,
      "Salvacion": "Voluntad",
      "Cantidad": 2,
      "Condicion": "Contra conjuros, aptitudes sortílegas y efectos de encantami"
     }
    ],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 3835,
    "Nombre": "Ceguera por luz (drow)",
    "Descripcion": "Queda cegado 1 asalto ante luz intensa y sufre -1 a ataques,",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 4268,
    "Nombre": "Sentidos agudos (drow)",
    "Descripcion": "Al pasar a 5 pies de una puerta secreta u oculta, puede hace",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 34,
    "Nombre": "Aspecto de dragón (Corazón)",
    "Descripcion": "Una prole de bahamut que ha elegido corazón como su aspecto ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [
      {
       "Id_habilidad": 6,
       "Habilidad": "Avistar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 7,
       "Habilidad": "Buscar",
       "Id_caracteristica": 4,
       "Caracteristica": "Inteligencia",
       "Descripcion": "Puedes encontrar puertas secretas, trampas sencillas, compar",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 17,
       "Habilidad": "Escuchar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      }
     ],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 38,
    "Nombre": "Aspecto de dragón (Mente)",
    "Descripcion": "Una prole de bahamut que ha elegido la mente como aspecto, a",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 41,
    "Nombre": "Aspecto de dragón (Alas)",
    "Descripcion": "Una prole de bahamut que ha elegido alas como aspecto porta ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 168,
    "Nombre": "Inmunidad a presencia pavorosa (prole de bahamut)",
    "Descripcion": "Los proles de bahamut son inmunes a la habilidad presencia p",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": true,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   }
  ],
  "Habilidades": {
   "Base": [
    {
     "Id_habilidad": 6,
     "Habilidad": "Avistar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 7,
     "Habilidad": "Buscar",
     "Id_caracteristica": 4,
     "Caracteristica": "Inteligencia",
     "Descripcion": "Puedes encontrar puertas secretas, trampas sencillas, compar",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    },
    {
     "Id_habilidad": 17,
     "Habilidad": "Escuchar",
     "Id_caracteristica": 5,
     "Caracteristica": "Sabiduría",
     "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
     "Soporta_extra": false,
     "Entrenada": false,
     "Id_extra": null,
     "Extra": null,
     "Cantidad": 2,
     "Varios": null,
     "Cantidad_condicional": 0,
     "Condicion": null,
     "Extra_comodin": null
    }
   ],
   "Custom": []
  },
  "Idiomas": [
   {
    "Id": 1,
    "Nombre": "Común",
    "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 2,
    "Nombre": "Infracomún",
    "Descripcion": "Idioma hablado por las criaturas de la infraoscuridad",
    "Secreto": false,
    "Oficial": true
   },
   {
    "Id": 8,
    "Nombre": "Élfico",
    "Descripcion": "Idioma hablado por los elfos",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "subtipos": [
   {
    "Id": 63,
    "Nombre": "Elfo"
   },
   {
    "Id": 3,
    "Nombre": "Sangre de dragón"
   }
  ],
  "Plantillas_por_subtipo": [],
  "Mutada": true,
  "Mutacion": {
   "Es_mutada": true,
   "Tamano_dependiente": true,
   "Tiene_prerrequisitos": true
  },
  "Categorias_edad": [],
  "Pasos_edad": [],
  "Lanzamiento": null,
  "Clase_predilecta_comodin": null,
  "Comodin": null
 },
 "26": {
  "i": 21,
  "n": "Prole de bahamut",
  "m": {
   "Fuerza": 0,
   "Destreza": -2,
   "Constitucion": 2,
   "Inteligencia": 0,
   "Sabiduria": 0,
   "Carisma": 0
  },
  "aju": 1,
  "ma": "Razas del dragón, Página: 8",
  "c": "Guerrero",
  "o": false,
  "an": null,
  "t": {
   "Id": 6,
   "Nombre": "Grande",
   "Modificador": -1,
   "Modificador_presa": 4,
   "Modificador_esconderse": -4
  },
  "dg": {
   "Cantidad": 0,
   "Dado": "",
   "Tipo_criatura": "",
   "Ataque_base": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0
  },
  "Dotes_adicionales": 0,
  "Puntos_habilidad_extra_primer_nivel": 0,
  "Puntos_habilidad_extra_por_nivel": 0,
  "Cuadrupedo": false,
  "Idiomas_adicionales_cualquiera": true,
  "Idiomas_adicionales": [],
  "Competencias": {
   "Armas": [],
   "Armaduras": [],
   "Grupos_arma": [],
   "Grupos_armadura": []
  },
  "Armas_naturales": [],
  "Descripcion": "Las proles de bahamut son una raza única por qué no nacen; r",
  "Nombre_original": null,
  "Traducido": false,
  "Id_clase_predilecta": 7,
  "Edad_maxima_dados": 0,
  "Edad_maxima_caras": 0,
  "Edad_inicial_dados_1": 0,
  "Edad_inicial_caras_1": 0,
  "Edad_inicial_dados_2": 0,
  "Edad_inicial_caras_2": 0,
  "Edad_inicial_dados_3": 0,
  "Edad_inicial_caras_3": 0,
  "Vd": null,
  "Vd_mod_clases_pj": null,
  "Vd_mod_clases_pnj": null,
  "Clases_asociadas": [],
  "Manual": {
   "Id": 34,
   "Nombre": "Razas del dragón",
   "Pagina": 8
  },
  "Clase_predilecta": {
   "Id": 7,
   "Nombre": "Guerrero"
  },
  "Dgs_raciales": {
   "Cantidad": 0,
   "Id_dado": 0,
   "Dado": "elegir",
   "Id_tipo_criatura": 0,
   "Tipo_criatura": "Cualquiera",
   "Ataque_base": 0,
   "Fortaleza": 0,
   "Reflejos": 0,
   "Voluntad": 0,
   "Dotes_extra": 0,
   "Puntos_habilidad": 0,
   "Multiplicador_puntos_habilidad": 0,
   "Dado_comodin": "elegir"
  },
  "rd": null,
  "rc": null,
  "re": null,
  "mu": true,
  "tmd": true,
  "pr": {
   "tipo_criatura": [
    {
     "id_tipo_criatura": 11,
     "tipo_criatura": "Humanoide",
     "opcional": 0,
     "tipo_criatura_comodin": null,
     "Frase": "Criatura de tipo humanoide"
    }
   ]
  },
  "prf": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "Prerrequisitos_flags": {
   "actitud_prohibido": false,
   "actitud_requerido": false,
   "alineamiento_prohibido": false,
   "alineamiento_requerido": false,
   "tipo_criatura": true
  },
  "ant": 0,
  "va": 2,
  "co": 30,
  "na": 0,
  "vo": 0,
  "man": null,
  "tr": 0,
  "ex": 0,
  "ari": 2.4,
  "ars": 3,
  "pri": 250,
  "prs": 350,
  "ea": 150,
  "em": 200,
  "ev": 300,
  "eve": 400,
  "esp": 10,
  "alc": 10,
  "tc": {
   "Id": 11,
   "Nombre": "Humanoide",
   "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
   "Manual": "Manual de monstruos 1, Página: 316",
   "Id_tipo_dado": 3,
   "Tipo_dado": "d8",
   "Id_ataque": 2,
   "Id_fortaleza": 1,
   "Id_reflejos": 1,
   "Id_voluntad": 1,
   "Id_puntos_habilidad": 1,
   "Puntos_habilidad": 2,
   "Come": true,
   "Respira": true,
   "Duerme": true,
   "Recibe_críticos": false,
   "Puede_ser_flanqueado": false,
   "Pierde_constitucion": false,
   "Limite_inteligencia": -1,
   "Tesoro": null,
   "Id_alineamiento": 2,
   "Rasgos": [],
   "Oficial": true,
   "Tipo_dado_comodin": null
  },
  "sor": [],
  "ali": {
   "Id": 2,
   "Basico": null,
   "Ley": {
    "Id_ley": 10,
    "Nombre": "Ninguna preferencia"
   },
   "Moral": {
    "Id_moral": 10,
    "Nombre": "Ninguna preferencia"
   },
   "Prioridad": null,
   "Descripcion": "Generalmente para alineamientos basados en preferencias dond"
  },
  "dotes": [
   {
    "Dote": {
     "Id": 63,
     "Nombre": "Resistencia al calor",
     "Descripcion": "Dote general que mejora la resistencia al calor: otorga +2 a",
     "Beneficio": "- +2 de bonificador a las tiradas de salvación contra efecto",
     "Normal": null,
     "Especial": null,
     "Manual": {
      "Id": 69,
      "Nombre": "Tormenta de arena",
      "Pagina": 50
     },
     "Tipos": [
      {
       "Id": 1,
       "Nombre": "General",
       "Usado": 1
      }
     ],
     "Repetible": 0,
     "Repetible_distinto_extra": 0,
     "Repetible_comb": 0,
     "Comp_arma": 0,
     "Oficial": true,
     "Extras_soportados": {
      "Extra_arma": 0,
      "Extra_armadura": 0,
      "Extra_armadura_armaduras": 0,
      "Extra_armadura_escudos": 0,
      "Extra_escuela": 0,
      "Extra_habilidad": 0,
      "Extra_chakra": 0,
      "Extra_fusion": 0
     },
     "Extras_disponibles": {
      "Armas": [],
      "Armaduras": [],
      "Escuelas": [],
      "Habilidades": [],
      "Chakras": [],
      "Fusiones": []
     },
     "Modificadores": {
      "Pg_a_n": 0,
      "Pg_a": 0,
      "Caracteristica": 0,
      "Fuerza": 0,
      "Destreza": 0,
      "Constitucion": 0,
      "Inteligencia": 0,
      "Sabiduria": 0,
      "Carisma": 0,
      "Ca": 0,
      "Toque": 0,
      "Desprevenido": 0,
      "Armadura_natural": 0,
      "Ataque_base": 0,
      "Presa": 0,
      "Iniciativa": 0,
      "Fortaleza": 0,
      "Reflejos": 0,
      "Voluntad": 0,
      "Espacio": 0,
      "Alcance": 0,
      "Correr": 0,
      "Nadar": 0,
      "Volar": 0,
      "Trepar": 0,
      "Excavar": 0,
      "Habilidad": 0
     },
     "Incarnum": {
      "Esencia_reserva": 0,
      "Esencia_reserva_moldeador": null,
      "Receptaculo": false,
      "Capacidad": null,
      "Abre_chakra": false,
      "Divisor_nivel_moldeador": null,
      "Caracteristica_cd_fusion": null,
      "Sustituye_caracteristica": null,
      "Pg_por_esencia": 0,
      "Pg_por_dote": null,
      "Descriptores_sin_alineamiento": []
     },
     "Habilidades_otorgadas": [],
     "Competencias_otorgadas": {
      "Armas": [],
      "Grupos_arma": []
     },
     "Salvaciones_condicionales": [],
     "Prerrequisitos": {
      "salvacion_minimo": [
       {
        "Fortaleza": 2,
        "Reflejos": 0,
        "Voluntad": 0,
        "Opcional": 0,
        "Frase": "Salvación base de Fortaleza +2"
       }
      ],
      "poder_seleccionar_companero": [],
      "poder_seleccionar_familiar": [],
      "lanz_espontaneo": [],
      "conjuros_escuela": [],
      "dg": [],
      "armas_naturales": [],
      "alineamiento_requerido": [],
      "alineamiento_prohibido": [],
      "actitud_requerido": [],
      "actitud_prohibido": [],
      "lanzar_conjuros_arcanos_nivel": [],
      "lanzar_conjuros_divinos_nivel": [],
      "tamano_minimo": [],
      "tamano_maximo": [],
      "limite_tipo_dote": [],
      "tipo_criatura": [],
      "lanzador_arcano": [],
      "lanzador_divino": [],
      "lanzador_psionico": [],
      "aptitud_especial": [],
      "clase_especial": [],
      "competencia_armadura": [],
      "competencia_arma": [],
      "competencia_grupo_armadura": [],
      "competencia_grupo_arma": [],
      "escuela_nivel": [],
      "dote": [],
      "ataque_base": [],
      "caracteristica": [],
      "dominio": [],
      "nivel": [],
      "nivel_max": [],
      "tipo_dote": [],
      "region": [],
      "habilidad": [],
      "idioma": [],
      "nivel_de_clase": [],
      "raza": [],
      "esencia_minima": [],
      "sin_esencia": [],
      "nivel_moldeador": [],
      "fusiones_minimas": [],
      "vinculo_chakra": [],
      "vinculos_minimos": [],
      "reserva_psionica": [],
      "lanzar_poder_psionico_nivel": []
     },
     "Extras_de_todo_el_catalogo": {
      "Armas": false,
      "Armaduras": false,
      "Escuelas": false,
      "Habilidades": false,
      "Chakras": false,
      "Fusiones": false
     },
     "Cuenta_como": []
    },
    "Contexto": {
     "Entidad": "raza",
     "Id_raza": 26,
     "Id_extra": null,
     "Extra": null,
     "Extra_comodin": null
    }
   }
  ],
  "rac": [
   {
    "Id": 43,
    "Nombre": "Olfato",
    "Descripcion": "Esta aptitud permite a la criatura detectar a individuos que",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 175,
    "Nombre": "Adaptación al desierto",
    "Descripcion": "Aguanta hasta 3 días sin beber agua.",
    "Oficial": false,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": true,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   },
   {
    "Id": 34,
    "Nombre": "Aspecto de dragón (Corazón)",
    "Descripcion": "Una prole de bahamut que ha elegido corazón como su aspecto ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [
      {
       "Id_habilidad": 6,
       "Habilidad": "Avistar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 7,
       "Habilidad": "Buscar",
       "Id_caracteristica": 4,
       "Caracteristica": "Inteligencia",
       "Descripcion": "Puedes encontrar puertas secretas, trampas sencillas, compar",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      },
      {
       "Id_habilidad": 17,
       "Habilidad": "Escuchar",
       "Id_caracteristica": 5,
       "Caracteristica": "Sabiduría",
       "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
       "Soporta_extra": false,
       "Entrenada": false,
       "Id_extra": null,
       "Extra": null,
       "Rangos": 1,
       "Se_considera_clasea": false,
       "Condicion": "Siempre",
       "Extra_comodin": null
      }
     ],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 38,
    "Nombre": "Aspecto de dragón (Mente)",
    "Descripcion": "Una prole de bahamut que ha elegido la mente como aspecto, a",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 41,
    "Nombre": "Aspecto de dragón (Alas)",
    "Descripcion": "Una prole de bahamut que ha elegido alas como aspecto porta ",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": false,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 1
   },
   {
    "Id": 168,
    "Nombre": "Inmunidad a presencia pavorosa (prole de bahamut)",
    "Descripcion": "Los proles de bahamut son inmunes a la habilidad presencia p",
    "Oficial": true,
    "Caracteristica_cd": null,
    "Dotes": [],
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Caracteristicas": [],
    "Salvaciones": [],
    "Sortilegas": [],
    "Ataques": [],
    "Prerrequisitos_flags": {
     "raza": true,
     "caracteristica_minima": false
    },
    "Prerrequisitos": {
     "raza": [],
     "caracteristica": []
    },
    "Esencia": {
     "Reserva": 0,
     "Receptaculo": false,
     "Habilidades_por_fusiones": []
    },
    "Opcional": 0
   }
  ],
  "Habilidades": {
   "Base": [],
   "Custom": []
  },
  "Idiomas": [
   {
    "Id": 1,
    "Nombre": "Común",
    "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
    "Secreto": false,
    "Oficial": true
   }
  ],
  "subtipos": [
   {
    "Id": 85,
    "Nombre": "Jacquar"
   },
   {
    "Id": 3,
    "Nombre": "Sangre de dragón"
   }
  ],
  "Plantillas_por_subtipo": [],
  "Mutada": true,
  "Mutacion": {
   "Es_mutada": true,
   "Tamano_dependiente": true,
   "Tiene_prerrequisitos": true
  },
  "Categorias_edad": [],
  "Pasos_edad": [],
  "Lanzamiento": null,
  "Clase_predilecta_comodin": null,
  "Comodin": null
 }
};
