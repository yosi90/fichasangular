/**
 * La ida y vuelta de «Modificar rasgo», «… ventaja», «… desventaja», «… fusión» y «… chakra» (hito 8 del roadmap de
 * inserciones, 2026-11-05): respuestas reales de `GET /rasgos/<id>`, `/ventajas/<id>`, `/desventajas/<id>`,
 * `/incarnum/fusiones/<id>` e `/incarnum/chakras/<id>` de `rol_dev` y, para cada una, el cuerpo con el que `PUT` devolvió el
 * mismo GET (la comprobación del backend con todas las entradas, en transacciones deshechas). Las pruebas de cada
 * formulario comprueban que, cargado con el GET, manda ese mismo cuerpo.
 *
 * Generado desde la comprobación del backend; no se edita a mano.
 */
import type { IdaYVuelta } from './cuerpo-de-catalogo';

export const IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM: {
    rasgos: IdaYVuelta[]; ventajas: IdaYVuelta[]; desventajas: IdaYVuelta[]; fusiones: IdaYVuelta[]; chakras: IdaYVuelta[];
} = {
 "chakras": [
  {
   "cuerpo": {
    "chakra": {
     "descripcion": "Chakra mínimo de la cabeza. Vincularle una fusión cierra la ranura de diademas, sombreros, yelmos y filacterias.",
     "id_categoria": 19,
     "id_ranura": 1,
     "nombre": "Corona",
     "nombre_original": "Crown",
     "oficial": true,
     "orden": 1,
     "traducido": true
    }
   },
   "get": {
    "Categoria": {
     "Id": 19,
     "Nombre": "Mínimo",
     "Nombre_original": "Least",
     "Orden": 1,
     "Traducido": true
    },
    "Clases": [
     {
      "Id": 405,
      "Nivel": 2,
      "Nombre": "Encarnado"
     },
     {
      "Id": 407,
      "Nivel": 5,
      "Nombre": "Totemista"
     },
     {
      "Id": 406,
      "Nivel": 8,
      "Nombre": "Nacido del alma"
     }
    ],
    "Descripcion": "Chakra mínimo de la cabeza. Vincularle una fusión cierra la ranura de diademas, sombreros, yelmos y filacterias.",
    "Fusiones": [
     {
      "Id": 335,
      "Nombre": "Corona de shedu",
      "Nombre_original": "Shedu Crown",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 339,
      "Nombre": "Diadema de la voz del alma",
      "Nombre_original": "Soulspeaker Circlet",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 285,
      "Nombre": "Diadema de luz pura",
      "Nombre_original": "Diadem of Purelight",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 319,
      "Nombre": "Diadema de necrocarnum",
      "Nombre_original": "Necrocarnum Circlet",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 300,
      "Nombre": "Diadema del cazador",
      "Nombre_original": "Hunter's Circlet",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 276,
      "Nombre": "Diadema del domador de bestias",
      "Nombre_original": "Beast Tamer Circlet",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 338,
      "Nombre": "Familiar chispa de alma",
      "Nombre_original": "Soulspark Familiar",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 345,
      "Nombre": "Máscara triple de la quimera",
      "Nombre_original": "Threefold Mask of the Chimera",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 284,
      "Nombre": "Yelmo de cristal",
      "Nombre_original": "Crystal Helm",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 294,
      "Nombre": "Yelmo de escarcha",
      "Nombre_original": "Frost Helm",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 290,
      "Nombre": "Yelmo del enigma",
      "Nombre_original": "Enigma Helm",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     }
    ],
    "Id": 34,
    "Nombre": "Corona",
    "Nombre_original": "Crown",
    "Oficial": true,
    "Orden": 1,
    "Ranura": {
     "Id": 1,
     "Nombre": "Cabeza"
    },
    "Traducido": true
   },
   "id": 34,
   "nombre": "Corona"
  },
  {
   "cuerpo": {
    "chakra": {
     "descripcion": "Chakra propio del totemista, unido a las almas de las bestias mágicas y a ninguna parte del cuerpo: ninguna fusión lo ocupa, pero cualquiera puede vincularse a él sin cerrar ranuras de objeto.",
     "id_categoria": 24,
     "id_ranura": null,
     "nombre": "Tótem",
     "nombre_original": "Totem",
     "oficial": true,
     "orden": 11,
     "traducido": true
    }
   },
   "get": {
    "Categoria": {
     "Id": 24,
     "Nombre": "Tótem",
     "Nombre_original": "Totem",
     "Orden": 6,
     "Traducido": true
    },
    "Clases": [
     {
      "Id": 407,
      "Nivel": 2,
      "Nombre": "Totemista"
     }
    ],
    "Descripcion": "Chakra propio del totemista, unido a las almas de las bestias mágicas y a ninguna parte del cuerpo: ninguna fusión lo ocupa, pero cualquiera puede vincularse a él sin cerrar ranuras de objeto.",
    "Fusiones": [
     {
      "Id": 347,
      "Nombre": "Avatar del tótem",
      "Nombre_original": "Totem Avatar",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 311,
      "Nombre": "Botas de tiburón de tierra",
      "Nombre_original": "Landshark Boots",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 332,
      "Nombre": "Brazales del jinete",
      "Nombre_original": "Riding Bracers",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 295,
      "Nombre": "Brazos de girallon",
      "Nombre_original": "Girallon Arms",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 278,
      "Nombre": "Camisa intermitente",
      "Nombre_original": "Blink Shirt",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 327,
      "Nombre": "Capa de fase",
      "Nombre_original": "Phase Cloak",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 326,
      "Nombre": "Capa de pegaso",
      "Nombre_original": "Pegasus Cloak",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 289,
      "Nombre": "Caparazón pavoroso",
      "Nombre_original": "Dread Carapace",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 355,
      "Nombre": "Cinturón de cola de gusano",
      "Nombre_original": "Wormtail Belt",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 309,
      "Nombre": "Cinturón de lamia",
      "Nombre_original": "Lamia Belt",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 316,
      "Nombre": "Cinturón de mantícora",
      "Nombre_original": "Manticore Belt",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 328,
      "Nombre": "Cinturón del fénix",
      "Nombre_original": "Phoenix Belt",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 271,
      "Nombre": "Coraza de ankheg",
      "Nombre_original": "Ankheg Breastplate",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 299,
      "Nombre": "Corazón de fuego",
      "Nombre_original": "Heart of Fire",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 335,
      "Nombre": "Corona de shedu",
      "Nombre_original": "Shedu Crown",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 349,
      "Nombre": "Cuerno de unicornio",
      "Nombre_original": "Unicorn Horn",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 300,
      "Nombre": "Diadema del cazador",
      "Nombre_original": "Hunter's Circlet",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 276,
      "Nombre": "Diadema del domador de bestias",
      "Nombre_original": "Beast Tamer Circlet",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 341,
      "Nombre": "Garras de esfinge",
      "Nombre_original": "Sphinx Claws",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 331,
      "Nombre": "Garras de furia",
      "Nombre_original": "Rageclaws",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 308,
      "Nombre": "Garras de kruthik",
      "Nombre_original": "Kruthik Claws",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 279,
      "Nombre": "Garras sangrientas",
      "Nombre_original": "Bloodtalons",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 277,
      "Nombre": "Gola de behir",
      "Nombre_original": "Behir Gorget",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 350,
      "Nombre": "Grebas de urskan",
      "Nombre_original": "Urskan Greaves",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 287,
      "Nombre": "Manto de bestia trémula",
      "Nombre_original": "Displacer Mantle",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 310,
      "Nombre": "Manto de lamasu",
      "Nombre_original": "Lammasu Mantle",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 334,
      "Nombre": "Manto de sombras",
      "Nombre_original": "Shadow Mantle",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 306,
      "Nombre": "Manto del kraken",
      "Nombre_original": "Kraken Mantle",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 275,
      "Nombre": "Máscara de basilisco",
      "Nombre_original": "Basilisk Mask",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 297,
      "Nombre": "Máscara de gorgona",
      "Nombre_original": "Gorgon Mask",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 307,
      "Nombre": "Máscara de krénshar",
      "Nombre_original": "Krenshar Mask",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 298,
      "Nombre": "Máscara de la gran rapaz",
      "Nombre_original": "Great Raptor Mask",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 356,
      "Nombre": "Máscara de yrthak",
      "Nombre_original": "Yrthak Mask",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 286,
      "Nombre": "Máscara desencantadora",
      "Nombre_original": "Disenchanter Mask",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 353,
      "Nombre": "Máscara invernal",
      "Nombre_original": "Winter Mask",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 345,
      "Nombre": "Máscara triple de la quimera",
      "Nombre_original": "Threefold Mask of the Chimera",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 282,
      "Nombre": "Melena de latón",
      "Nombre_original": "Brass Mane",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 354,
      "Nombre": "Piel de huargo",
      "Nombre_original": "Worg Pelt",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Id": 294,
      "Nombre": "Yelmo de escarcha",
      "Nombre_original": "Frost Helm",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     }
    ],
    "Id": 44,
    "Nombre": "Tótem",
    "Nombre_original": "Totem",
    "Oficial": true,
    "Orden": 11,
    "Ranura": null,
    "Traducido": true
   },
   "id": 44,
   "nombre": "Tótem"
  }
 ],
 "desventajas": [
  {
   "cuerpo": {
    "desventaja": {
     "aumenta_oro": false,
     "caracteristica": false,
     "carisma": false,
     "constitucion": false,
     "coste": 5,
     "descripcion": "Te mareas al ver sangre.",
     "destreza": false,
     "disipable": false,
     "duplica_oro": false,
     "fortaleza": false,
     "fuerza": false,
     "id_habilidad": null,
     "id_idioma": null,
     "id_manual": 65,
     "id_rasgo": null,
     "idioma_extra": false,
     "iniciativa": false,
     "inteligencia": false,
     "mejora": 0,
     "nombre": "Delicado",
     "pagina": 35,
     "reflejos": false,
     "sabiduria": false,
     "voluntad": false
    }
   },
   "get": {
    "Aumenta_oro": false,
    "Caracteristica": false,
    "Carisma": false,
    "Constitucion": false,
    "Coste": 5,
    "Descripcion": "Te mareas al ver sangre.",
    "Destreza": false,
    "Disipable": false,
    "Duplica_oro": false,
    "Fortaleza": false,
    "Fuerza": false,
    "Habilidad": null,
    "Id": 22,
    "Idioma": null,
    "Idioma_extra": false,
    "Iniciativa": false,
    "Inteligencia": false,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 35
    },
    "Mejora": 0,
    "Nombre": "Delicado",
    "Rasgo": null,
    "Reflejos": false,
    "Sabiduria": false,
    "Voluntad": false
   },
   "id": 22,
   "nombre": "Delicado"
  },
  {
   "cuerpo": {
    "desventaja": {
     "aumenta_oro": false,
     "caracteristica": false,
     "carisma": false,
     "constitucion": false,
     "coste": 3,
     "descripcion": "Te resulta más difícil que al resto cosas tan simples como hacer sumas.",
     "destreza": false,
     "disipable": false,
     "duplica_oro": false,
     "fortaleza": false,
     "fuerza": false,
     "id_habilidad": null,
     "id_idioma": null,
     "id_manual": 65,
     "id_rasgo": null,
     "idioma_extra": false,
     "iniciativa": false,
     "inteligencia": true,
     "mejora": -1,
     "nombre": "Cortito",
     "pagina": 35,
     "reflejos": false,
     "sabiduria": false,
     "voluntad": false
    }
   },
   "get": {
    "Aumenta_oro": false,
    "Caracteristica": false,
    "Carisma": false,
    "Constitucion": false,
    "Coste": 3,
    "Descripcion": "Te resulta más difícil que al resto cosas tan simples como hacer sumas.",
    "Destreza": false,
    "Disipable": false,
    "Duplica_oro": false,
    "Fortaleza": false,
    "Fuerza": false,
    "Habilidad": null,
    "Id": 26,
    "Idioma": null,
    "Idioma_extra": false,
    "Iniciativa": false,
    "Inteligencia": true,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 35
    },
    "Mejora": -1,
    "Nombre": "Cortito",
    "Rasgo": null,
    "Reflejos": false,
    "Sabiduria": false,
    "Voluntad": false
   },
   "id": 26,
   "nombre": "Cortito"
  },
  {
   "cuerpo": {
    "desventaja": {
     "aumenta_oro": false,
     "caracteristica": false,
     "carisma": false,
     "constitucion": false,
     "coste": 1,
     "descripcion": "Te falta un ojo.",
     "destreza": false,
     "disipable": false,
     "duplica_oro": false,
     "fortaleza": false,
     "fuerza": false,
     "id_habilidad": 6,
     "id_idioma": null,
     "id_manual": 65,
     "id_rasgo": null,
     "idioma_extra": false,
     "iniciativa": false,
     "inteligencia": false,
     "mejora": -3,
     "nombre": "Tuerto",
     "pagina": 35,
     "reflejos": false,
     "sabiduria": false,
     "voluntad": false
    }
   },
   "get": {
    "Aumenta_oro": false,
    "Caracteristica": false,
    "Carisma": false,
    "Constitucion": false,
    "Coste": 1,
    "Descripcion": "Te falta un ojo.",
    "Destreza": false,
    "Disipable": false,
    "Duplica_oro": false,
    "Fortaleza": false,
    "Fuerza": false,
    "Habilidad": {
     "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos emboscados, para ver a un pícaro acechando en las sombras, para ver a traves de un disfraz, para leer los labios o para advertir la presencia de un cienpiés gigante en un monton de basura.",
     "Id": 6,
     "Nombre": "Avistar"
    },
    "Id": 32,
    "Idioma": null,
    "Idioma_extra": false,
    "Iniciativa": false,
    "Inteligencia": false,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 35
    },
    "Mejora": -3,
    "Nombre": "Tuerto",
    "Rasgo": null,
    "Reflejos": false,
    "Sabiduria": false,
    "Voluntad": false
   },
   "id": 32,
   "nombre": "Tuerto"
  }
 ],
 "fusiones": [
  {
   "cuerpo": {
    "chakras": [
     {
      "efecto_vinculo": "Una vez por minuto, como acción estándar, escupes una línea de ácido de 5 pies (+5 pies por punto de esencia) que hace 2d6 de ácido (+1d6 por punto). Salvación de Reflejos para la mitad.",
      "id_chakra": 40,
      "ocupa": true,
      "vinculo": true
     },
     {
      "efecto_vinculo": "Te salen mandíbulas de insecto: un mordisco de 1d8, como ataque principal o secundario (−5 y la mitad de la Fuerza). Cada punto de esencia le suma 1d4 de ácido.",
      "id_chakra": 44,
      "ocupa": false,
      "vinculo": true
     }
    ],
    "clases": [
     407
    ],
    "descriptores": [
     15
    ],
    "fusion": {
     "alineado_portador": false,
     "descripcion": "Un peto de quitina verde, como el caparazón de un ankheg.",
     "efecto_basico": "Bonificador +2 de armadura a la CA, que no se suma a otro bonificador de armadura (vale el mayor). No tiene Destreza máxima, penalizador de armadura ni fallo de conjuro arcano, y cuenta como armadura ligera.",
     "efecto_esencia": "Cada punto de esencia sube el bonificador de armadura en 1.",
     "id_manual": 31,
     "nombre": "Coraza de ankheg",
     "nombre_original": "Ankheg Breastplate",
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 56,
     "salvacion": {
      "efecto": "Ver texto",
      "tipo": null
     },
     "traducido": true
    }
   },
   "get": {
    "Alineado_portador": false,
    "Chakras": [
     {
      "Datos_vinculo": {
       "accion": "standard",
       "area": {
        "forma": "line",
        "pies": 5,
        "por_essentia_pies": 5
       },
       "dano": [
        {
         "dados": "2d6",
         "por_essentia_dados": "1d6",
         "tipo": "acid"
        }
       ],
       "salvacion": {
        "efecto": "half",
        "tipo": "Reflex"
       },
       "usos": {
        "cantidad": 1,
        "periodo": "minute"
       }
      },
      "Efecto_vinculo": "Una vez por minuto, como acción estándar, escupes una línea de ácido de 5 pies (+5 pies por punto de esencia) que hace 2d6 de ácido (+1d6 por punto). Salvación de Reflejos para la mitad.",
      "Id": 40,
      "Nombre": "Garganta",
      "Nombre_original": "Throat",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     },
     {
      "Datos_vinculo": {
       "ataques_naturales": [
        {
         "cantidad": 1,
         "dano": "1d8",
         "extra": {
          "dados": "1d4",
          "por_essentia": true,
          "tipo": "acid"
         },
         "tipo": "bite"
        }
       ]
      },
      "Efecto_vinculo": "Te salen mandíbulas de insecto: un mordisco de 1d8, como ataque principal o secundario (−5 y la mitad de la Fuerza). Cada punto de esencia le suma 1d4 de ácido.",
      "Id": 44,
      "Nombre": "Tótem",
      "Nombre_original": "Totem",
      "Ocupa": false,
      "Traducido": true,
      "Vinculo": true
     }
    ],
    "Clases": [
     {
      "Id": 407,
      "Nombre": "Totemista"
     }
    ],
    "Datos_basico": {
     "bonos": [
      {
       "categoria": "ca",
       "tipo": "armor",
       "valor": 2
      }
     ],
     "etiquetas": [
      "light armor"
     ]
    },
    "Datos_esencia": {
     "bonos": [
      {
       "categoria": "ca",
       "por_essentia": 1,
       "tipo": "armor"
      }
     ]
    },
    "Descripcion": "Un peto de quitina verde, como el caparazón de un ankheg.",
    "Descriptores": [
     {
      "Actitud": null,
      "Id": 15,
      "Nombre": "Ácido"
     }
    ],
    "Efecto_basico": "Bonificador +2 de armadura a la CA, que no se suma a otro bonificador de armadura (vale el mayor). No tiene Destreza máxima, penalizador de armadura ni fallo de conjuro arcano, y cuenta como armadura ligera.",
    "Efecto_esencia": "Cada punto de esencia sube el bonificador de armadura en 1.",
    "Id": 271,
    "Manual": {
     "Id": 31,
     "Nombre": "Magia del incarnum",
     "Pagina": 56
    },
    "Nombre": "Coraza de ankheg",
    "Nombre_original": "Ankheg Breastplate",
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Salvacion": {
     "Efecto": "Ver texto",
     "Tipo": null
    },
    "Traducido": true
   },
   "id": 271,
   "nombre": "Coraza de ankheg"
  },
  {
   "cuerpo": {
    "chakras": [
     {
      "efecto_vinculo": "Contra los ataques de muertos vivientes, la esencia invertida se suma a tu CA y a tus salvaciones como bonificador introspectivo.",
      "id_chakra": 37,
      "ocupa": true,
      "vinculo": true
     }
    ],
    "clases": [
     405,
     406
    ],
    "descriptores": [
     14
    ],
    "fusion": {
     "alineado_portador": false,
     "descripcion": "Brazales plateados de reflejos azules que lanzan chispas a los muertos vivientes que tocas.",
     "efecto_basico": "Una vez por asalto, un ataque de toque cuerpo a cuerpo contra un muerto viviente le hace 1d6 de daño. Hay que anunciarlo antes de atacar; si fallas, se pierde ese asalto.",
     "efecto_esencia": "Cada punto de esencia suma 1d6 a ese daño.",
     "id_manual": 31,
     "nombre": "Guardabrazos disruptores",
     "nombre_original": "Armguards of Disruption",
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 59,
     "salvacion": null,
     "traducido": true
    }
   },
   "get": {
    "Alineado_portador": false,
    "Chakras": [
     {
      "Datos_vinculo": {
       "bonos": [
        {
         "categoria": "ca",
         "condicion": "vs undead attacks",
         "por_essentia": 1,
         "tipo": "insight"
        },
        {
         "categoria": "salvacion",
         "condicion": "vs undead attacks",
         "por_essentia": 1,
         "tipo": "insight"
        }
       ]
      },
      "Efecto_vinculo": "Contra los ataques de muertos vivientes, la esencia invertida se suma a tu CA y a tus salvaciones como bonificador introspectivo.",
      "Id": 37,
      "Nombre": "Brazos",
      "Nombre_original": "Arms",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     }
    ],
    "Clases": [
     {
      "Id": 405,
      "Nombre": "Encarnado"
     },
     {
      "Id": 406,
      "Nombre": "Nacido del alma"
     }
    ],
    "Datos_basico": {
     "dano": [
      {
       "dados": "1d6",
       "tipo": null
      }
     ],
     "etiquetas": [
      "melee touch",
      "vs undead"
     ],
     "usos": {
      "cantidad": 1,
      "periodo": "round"
     }
    },
    "Datos_esencia": {
     "dano": [
      {
       "por_essentia_dados": "1d6",
       "tipo": null
      }
     ]
    },
    "Descripcion": "Brazales plateados de reflejos azules que lanzan chispas a los muertos vivientes que tocas.",
    "Descriptores": [
     {
      "Actitud": {
       "Id": 4,
       "Nombre": "Bueno"
      },
      "Id": 14,
      "Nombre": "Bueno"
     }
    ],
    "Efecto_basico": "Una vez por asalto, un ataque de toque cuerpo a cuerpo contra un muerto viviente le hace 1d6 de daño. Hay que anunciarlo antes de atacar; si fallas, se pierde ese asalto.",
    "Efecto_esencia": "Cada punto de esencia suma 1d6 a ese daño.",
    "Id": 274,
    "Manual": {
     "Id": 31,
     "Nombre": "Magia del incarnum",
     "Pagina": 59
    },
    "Nombre": "Guardabrazos disruptores",
    "Nombre_original": "Armguards of Disruption",
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Salvacion": null,
    "Traducido": true
   },
   "id": 274,
   "nombre": "Guardabrazos disruptores"
  },
  {
   "cuerpo": {
    "chakras": [
     {
      "efecto_vinculo": "El veneno también hace tanto daño de Fuerza como de Sabiduría; la misma salvación evita los dos.",
      "id_chakra": 36,
      "ocupa": true,
      "vinculo": true
     }
    ],
    "clases": [
     406
    ],
    "descriptores": [
     12
    ],
    "fusion": {
     "alineado_portador": false,
     "descripcion": "Guantes verdes y lustrosos que parecen húmedos, aunque son secos al tacto.",
     "efecto_basico": "Una vez por asalto, un ataque de toque cuerpo a cuerpo envenena al objetivo: 1 punto de daño de Sabiduría al momento y otro al cabo de 1 minuto, y cada uno se evita con una salvación de Fortaleza. Una misma criatura solo puede sufrirlo una vez cada 24 horas.",
     "efecto_esencia": "Cada punto de esencia suma 1 al daño de Sabiduría, tanto al inicial como al secundario.",
     "id_manual": 31,
     "nombre": "Guantes del alma envenenada",
     "nombre_original": "Gloves of the Poisoned Soul",
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 68,
     "salvacion": {
      "efecto": "Niega",
      "tipo": "Fortaleza"
     },
     "traducido": true
    }
   },
   "get": {
    "Alineado_portador": false,
    "Chakras": [
     {
      "Datos_vinculo": {
       "etiquetas": [
        "Strength damage equals Wisdom damage"
       ]
      },
      "Efecto_vinculo": "El veneno también hace tanto daño de Fuerza como de Sabiduría; la misma salvación evita los dos.",
      "Id": 36,
      "Nombre": "Manos",
      "Nombre_original": "Hands",
      "Ocupa": true,
      "Traducido": true,
      "Vinculo": true
     }
    ],
    "Clases": [
     {
      "Id": 406,
      "Nombre": "Nacido del alma"
     }
    ],
    "Datos_basico": {
     "etiquetas": [
      "poison",
      "melee touch",
      "1 Wisdom damage initial",
      "1 Wisdom damage secondary",
      "once per 24 hours"
     ],
     "usos": {
      "cantidad": 1,
      "periodo": "round"
     }
    },
    "Datos_esencia": {
     "etiquetas": [
      "+1 Wisdom damage per essentia"
     ]
    },
    "Descripcion": "Guantes verdes y lustrosos que parecen húmedos, aunque son secos al tacto.",
    "Descriptores": [
     {
      "Actitud": {
       "Id": 5,
       "Nombre": "Maligno"
      },
      "Id": 12,
      "Nombre": "Maligno"
     }
    ],
    "Efecto_basico": "Una vez por asalto, un ataque de toque cuerpo a cuerpo envenena al objetivo: 1 punto de daño de Sabiduría al momento y otro al cabo de 1 minuto, y cada uno se evita con una salvación de Fortaleza. Una misma criatura solo puede sufrirlo una vez cada 24 horas.",
    "Efecto_esencia": "Cada punto de esencia suma 1 al daño de Sabiduría, tanto al inicial como al secundario.",
    "Id": 296,
    "Manual": {
     "Id": 31,
     "Nombre": "Magia del incarnum",
     "Pagina": 68
    },
    "Nombre": "Guantes del alma envenenada",
    "Nombre_original": "Gloves of the Poisoned Soul",
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Salvacion": {
     "Efecto": "Niega",
     "Tipo": "Fortaleza"
    },
    "Traducido": true
   },
   "id": 296,
   "nombre": "Guantes del alma envenenada"
  }
 ],
 "rasgos": [
  {
   "cuerpo": {
    "rasgo": {
     "descripcion": "Un aura de justicia rodea a los arcontes que combaten o se enfurecen. Toda criatura hostil en un radio de 20' del arconte debe tener éxito en una salvación de voluntad para resistirse a este efecto. La cd de la salvación varía con cada tipo de arconte, utilize el bonificador de carisma e incluya un bonificador racial de +2. Quienes fallen sufrirán un penalizador -2 en los ataques, la ca y los ts durante 24 horas o hasta que logren golpear con éxito al arconte que genere el aura. Toda criatura que resiste el efecto o lo rompa no volverá a resultar afectada durante 24 horas por el aura de ese arconte",
     "nombre": "Aura amenazadora",
     "oficial": true
    }
   },
   "get": {
    "d": "Un aura de justicia rodea a los arcontes que combaten o se enfurecen. Toda criatura hostil en un radio de 20' del arconte debe tener éxito en una salvación de voluntad para resistirse a este efecto. La cd de la salvación varía con cada tipo de arconte, utilize el bonificador de carisma e incluya un bonificador racial de +2. Quienes fallen sufrirán un penalizador -2 en los ataques, la ca y los ts durante 24 horas o hasta que logren golpear con éxito al arconte que genere el aura. Toda criatura que resiste el efecto o lo rompa no volverá a resultar afectada durante 24 horas por el aura de ese arconte",
    "i": 1,
    "n": "Aura amenazadora",
    "o": true
   },
   "id": 1,
   "nombre": "Aura amenazadora"
  },
  {
   "cuerpo": {
    "rasgo": {
     "descripcion": "",
     "nombre": "Bonificador racial +4 a las salvaciones contra venenos.",
     "oficial": true
    }
   },
   "get": {
    "d": "",
    "i": 2,
    "n": "Bonificador racial +4 a las salvaciones contra venenos.",
    "o": true
   },
   "id": 2,
   "nombre": "Bonificador racial +4 a las salvaciones contra venenos."
  },
  {
   "cuerpo": {
    "rasgo": {
     "descripcion": "Respira bajo el agua y se mueve por ella sin pruebas de Nadar.",
     "nombre": "Respiración acuática",
     "oficial": true
    }
   },
   "get": {
    "d": "Respira bajo el agua y se mueve por ella sin pruebas de Nadar.",
    "i": 61,
    "n": "Respiración acuática",
    "o": true
   },
   "id": 61,
   "nombre": "Respiración acuática"
  }
 ],
 "ventajas": [
  {
   "cuerpo": {
    "ventaja": {
     "aumenta_oro": false,
     "caracteristica": false,
     "carisma": false,
     "constitucion": false,
     "coste": -4,
     "descripcion": "Eres igual de diestro con cualquiera de tus manos.",
     "destreza": false,
     "disipable": false,
     "duplica_oro": false,
     "fortaleza": false,
     "fuerza": false,
     "id_habilidad": null,
     "id_idioma": null,
     "id_manual": 65,
     "id_rasgo": 10,
     "idioma_extra": false,
     "iniciativa": false,
     "inteligencia": false,
     "mejora": 0,
     "nombre": "Ambidiestro",
     "pagina": 35,
     "reflejos": false,
     "sabiduria": false,
     "voluntad": false
    }
   },
   "get": {
    "Aumenta_oro": false,
    "Caracteristica": false,
    "Carisma": false,
    "Constitucion": false,
    "Coste": -4,
    "Descripcion": "Eres igual de diestro con cualquiera de tus manos.",
    "Destreza": false,
    "Disipable": false,
    "Duplica_oro": false,
    "Fortaleza": false,
    "Fuerza": false,
    "Habilidad": null,
    "Id": 1,
    "Idioma": null,
    "Idioma_extra": false,
    "Iniciativa": false,
    "Inteligencia": false,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 35
    },
    "Mejora": 0,
    "Nombre": "Ambidiestro",
    "Rasgo": {
     "Descripcion": "Eres igual de diestro en el uso de cualquiera de tus manos, ya tengas 2, 3, 4 o más.",
     "Id": 10,
     "Nombre": "Ambidestrismo"
    },
    "Reflejos": false,
    "Sabiduria": false,
    "Voluntad": false
   },
   "id": 1,
   "nombre": "Ambidiestro"
  },
  {
   "cuerpo": {
    "ventaja": {
     "aumenta_oro": false,
     "caracteristica": false,
     "carisma": false,
     "constitucion": false,
     "coste": -1,
     "descripcion": "Tu aspecto y semblante perturba a las personas.",
     "destreza": false,
     "disipable": false,
     "duplica_oro": false,
     "fortaleza": false,
     "fuerza": false,
     "id_habilidad": 22,
     "id_idioma": null,
     "id_manual": 65,
     "id_rasgo": null,
     "idioma_extra": false,
     "iniciativa": false,
     "inteligencia": false,
     "mejora": 3,
     "nombre": "Inquietante",
     "pagina": 35,
     "reflejos": false,
     "sabiduria": false,
     "voluntad": false
    }
   },
   "get": {
    "Aumenta_oro": false,
    "Caracteristica": false,
    "Carisma": false,
    "Constitucion": false,
    "Coste": -1,
    "Descripcion": "Tu aspecto y semblante perturba a las personas.",
    "Destreza": false,
    "Disipable": false,
    "Duplica_oro": false,
    "Fortaleza": false,
    "Fuerza": false,
    "Habilidad": {
     "Descripcion": "Utiliza esta habilidad para que un matón se lo piense dos veces antes de meterse contigo o para conseguir que un prisionero te dé la información que deseas.",
     "Id": 22,
     "Nombre": "Intimidar"
    },
    "Id": 5,
    "Idioma": null,
    "Idioma_extra": false,
    "Iniciativa": false,
    "Inteligencia": false,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 35
    },
    "Mejora": 3,
    "Nombre": "Inquietante",
    "Rasgo": null,
    "Reflejos": false,
    "Sabiduria": false,
    "Voluntad": false
   },
   "id": 5,
   "nombre": "Inquietante"
  },
  {
   "cuerpo": {
    "ventaja": {
     "aumenta_oro": false,
     "caracteristica": false,
     "carisma": false,
     "constitucion": false,
     "coste": -10,
     "descripcion": "Recibes una gran fortuna en herencia (Dobla tu oro inicial).",
     "destreza": false,
     "disipable": false,
     "duplica_oro": true,
     "fortaleza": false,
     "fuerza": false,
     "id_habilidad": null,
     "id_idioma": null,
     "id_manual": 65,
     "id_rasgo": null,
     "idioma_extra": false,
     "iniciativa": false,
     "inteligencia": false,
     "mejora": 0,
     "nombre": "Gran fortuna",
     "pagina": 35,
     "reflejos": false,
     "sabiduria": false,
     "voluntad": false
    }
   },
   "get": {
    "Aumenta_oro": false,
    "Caracteristica": false,
    "Carisma": false,
    "Constitucion": false,
    "Coste": -10,
    "Descripcion": "Recibes una gran fortuna en herencia (Dobla tu oro inicial).",
    "Destreza": false,
    "Disipable": false,
    "Duplica_oro": true,
    "Fortaleza": false,
    "Fuerza": false,
    "Habilidad": null,
    "Id": 13,
    "Idioma": null,
    "Idioma_extra": false,
    "Iniciativa": false,
    "Inteligencia": false,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 35
    },
    "Mejora": 0,
    "Nombre": "Gran fortuna",
    "Rasgo": null,
    "Reflejos": false,
    "Sabiduria": false,
    "Voluntad": false
   },
   "id": 13,
   "nombre": "Gran fortuna"
  },
  {
   "cuerpo": {
    "ventaja": {
     "aumenta_oro": false,
     "caracteristica": false,
     "carisma": false,
     "constitucion": false,
     "coste": -1,
     "descripcion": "Tu arduo estudio te ha convertido en un gran hablante de un idioma nuevo.",
     "destreza": false,
     "disipable": false,
     "duplica_oro": false,
     "fortaleza": false,
     "fuerza": false,
     "id_habilidad": null,
     "id_idioma": null,
     "id_manual": 65,
     "id_rasgo": null,
     "idioma_extra": true,
     "iniciativa": false,
     "inteligencia": false,
     "mejora": 1,
     "nombre": "Idioma",
     "pagina": 35,
     "reflejos": false,
     "sabiduria": false,
     "voluntad": false
    }
   },
   "get": {
    "Aumenta_oro": false,
    "Caracteristica": false,
    "Carisma": false,
    "Constitucion": false,
    "Coste": -1,
    "Descripcion": "Tu arduo estudio te ha convertido en un gran hablante de un idioma nuevo.",
    "Destreza": false,
    "Disipable": false,
    "Duplica_oro": false,
    "Fortaleza": false,
    "Fuerza": false,
    "Habilidad": null,
    "Id": 16,
    "Idioma": null,
    "Idioma_extra": true,
    "Iniciativa": false,
    "Inteligencia": false,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 35
    },
    "Mejora": 1,
    "Nombre": "Idioma",
    "Rasgo": null,
    "Reflejos": false,
    "Sabiduria": false,
    "Voluntad": false
   },
   "id": 16,
   "nombre": "Idioma"
  }
 ]
};
