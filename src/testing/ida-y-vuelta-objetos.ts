/**
 * La ida y vuelta de «Modificar» munición, material especial, aptitud especial, objeto y conjunto de objetos (segunda
 * parte del hito 7 del roadmap de inserciones, 2026-11-05): respuestas reales de su `GET` en `rol_dev` y, para cada una,
 * el cuerpo con el que `PUT` devolvió el mismo GET (la comprobación del backend con todas las entradas de los cinco
 * catálogos, en transacciones deshechas). Las pruebas de `nuevo-equipo` y `nuevo-objeto` comprueban que el formulario,
 * cargado con el GET, manda ese mismo cuerpo.
 *
 * Generado desde la comprobación del backend; no se edita a mano. Excepción: el 2026-11-07 se añadió `Cargas_se_recuperan`
 * (y `cargas_se_recuperan` en el cuerpo), con el valor que da `rol_dev` tras `objetos_cargas_se_recuperan.sql` (los anillos
 * 48 y 91025, sí; los demás, no), porque el generador no está en el repositorio.
 */
import type { IdaYVuelta } from './cuerpo-de-catalogo';

export const IDA_Y_VUELTA_OBJETOS: {
    municiones: IdaYVuelta[]; materiales: IdaYVuelta[]; encantamientos: IdaYVuelta[]; objetos: IdaYVuelta[]; conjuntos: IdaYVuelta[];
} = {
 "conjuntos": [
  {
   "cuerpo": {
    "bonificaciones": [
     {
      "descripcion": "Bonificador de circunstancia a Diplomacia e Intimidar contra criaturas malignas, mejores defensas frente a efectos específicos, aprecio de las sabandijas y mayor CD de salvación de sus conjuros malignos.",
      "piezas": 2
     },
     {
      "descripcion": "Mejora de varias características, daño infligido imbuido de esencia maligna y curación solo posible mediante magia lanzada en un área consagrada o sacralizada.",
      "piezas": 3
     }
    ],
    "conjunto": {
     "descripcion": "Trío de artefactos forjados por antiguos dioses de la oscuridad para dotar a un campeón del mal frente a los campeones del bien y la neutralidad. Cada pieza es poderosa por sí sola, y quien reúne varias obtiene ventajas sociales, defensivas y ofensivas crecientes. Los personajes que no son malignos sufren daño al intentar usarlos, y los buenos arriesgan además perder experiencia.",
     "id_manual": 22,
     "nombre": "La Regalía del mal",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 154,
     "traducido": false
    },
    "piezas": []
   },
   "get": {
    "Bonificaciones": [
     {
      "Descripcion": "Bonificador de circunstancia a Diplomacia e Intimidar contra criaturas malignas, mejores defensas frente a efectos específicos, aprecio de las sabandijas y mayor CD de salvación de sus conjuros malignos.",
      "Piezas": 2
     },
     {
      "Descripcion": "Mejora de varias características, daño infligido imbuido de esencia maligna y curación solo posible mediante magia lanzada en un área consagrada o sacralizada.",
      "Piezas": 3
     }
    ],
    "Descripcion": "Trío de artefactos forjados por antiguos dioses de la oscuridad para dotar a un campeón del mal frente a los campeones del bien y la neutralidad. Cada pieza es poderosa por sí sola, y quien reúne varias obtiene ventajas sociales, defensivas y ofensivas crecientes. Los personajes que no son malignos sufren daño al intentar usarlos, y los buenos arriesgan además perder experiencia.",
    "Id": 40,
    "Manual": {
     "Id": 22,
     "Nombre": "Guia de armas y equipos",
     "Pagina": 154
    },
    "Nombre": "La Regalía del mal",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Piezas": [],
    "Traducido": false
   },
   "id": 40,
   "nombre": "La Regalía del mal"
  },
  {
   "cuerpo": {
    "bonificaciones": [
     {
      "descripcion": "5/día RE 5 (fuego), solo contra ese ataque y de forma automática",
      "piezas": 2
     },
     {
      "descripcion": "5/día inmunidad al fuego, solo contra ese ataque y de forma automática; una vez gastados los cinco usos se activa la RE 5 (fuego)",
      "piezas": 3
     },
     {
      "descripcion": "1/día efecto de sanar (NL 11.º) automático si quedas reducido a entre 0 y -9 pg",
      "piezas": 4
     }
    ],
    "conjunto": {
     "descripcion": "La Regalía del fénix es un conjunto de cuatro piezas (corona de llamas, capa del fénix, cetro de garra y máscara de la rapaz), vinculadas a la leyenda del fénix y de su antigua reina. Al combinar varias de ellas, quien las porta gana protección frente al fuego, que se vuelve inmunidad cuando reúne más piezas y que funciona sola, sin que haya que invocarla. Con el conjunto completo, además, un golpe que deje al portador al borde de la muerte desencadena una curación automática. Cualquiera puede usarla, aunque hechiceros y brujos sacan más partido a sus rasgos, pues su magia depende del Carisma y el cetro les sirve como arma sencilla; completarla también permite lograr efectos parecidos a los de los conjuros de vuelo.",
     "id_manual": 7,
     "nombre": "Regalía del fénix",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 211,
     "traducido": false
    },
    "piezas": []
   },
   "get": {
    "Bonificaciones": [
     {
      "Descripcion": "5/día RE 5 (fuego), solo contra ese ataque y de forma automática",
      "Piezas": 2
     },
     {
      "Descripcion": "5/día inmunidad al fuego, solo contra ese ataque y de forma automática; una vez gastados los cinco usos se activa la RE 5 (fuego)",
      "Piezas": 3
     },
     {
      "Descripcion": "1/día efecto de sanar (NL 11.º) automático si quedas reducido a entre 0 y -9 pg",
      "Piezas": 4
     }
    ],
    "Descripcion": "La Regalía del fénix es un conjunto de cuatro piezas (corona de llamas, capa del fénix, cetro de garra y máscara de la rapaz), vinculadas a la leyenda del fénix y de su antigua reina. Al combinar varias de ellas, quien las porta gana protección frente al fuego, que se vuelve inmunidad cuando reúne más piezas y que funciona sola, sin que haya que invocarla. Con el conjunto completo, además, un golpe que deje al portador al borde de la muerte desencadena una curación automática. Cualquiera puede usarla, aunque hechiceros y brujos sacan más partido a sus rasgos, pues su magia depende del Carisma y el cetro les sirve como arma sencilla; completarla también permite lograr efectos parecidos a los de los conjuros de vuelo.",
    "Id": 22,
    "Manual": {
     "Id": 7,
     "Nombre": "Compendio de objetos mágicos",
     "Pagina": 211
    },
    "Nombre": "Regalía del fénix",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Piezas": [],
    "Traducido": false
   },
   "id": 22,
   "nombre": "Regalía del fénix"
  },
  {
   "cuerpo": {
    "bonificaciones": [],
    "conjunto": {
     "descripcion": "Armadura completa encantada, forjada con escamas de dragón desechadas, que concede resistencia a la energía del dragón de origen y un bonus a Montar cuando el portador va a lomos de uno. Si el jinete cae desde una altura superior a 5 pies, el conjunto funciona como caída de pluma, amortiguando el impacto.",
     "id_manual": 10,
     "nombre": "Armadura de cabalgar dragones",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 118,
     "traducido": false
    },
    "piezas": []
   },
   "get": {
    "Bonificaciones": [],
    "Descripcion": "Armadura completa encantada, forjada con escamas de dragón desechadas, que concede resistencia a la energía del dragón de origen y un bonus a Montar cuando el portador va a lomos de uno. Si el jinete cae desde una altura superior a 5 pies, el conjunto funciona como caída de pluma, amortiguando el impacto.",
    "Id": 33,
    "Manual": {
     "Id": 10,
     "Nombre": "Draconomicón",
     "Pagina": 118
    },
    "Nombre": "Armadura de cabalgar dragones",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Piezas": [],
    "Traducido": false
   },
   "id": 33,
   "nombre": "Armadura de cabalgar dragones"
  }
 ],
 "encantamientos": [
  {
   "cuerpo": {
    "aura_escuelas": [
     8
    ],
    "danos": [],
    "encantamiento": {
     "aplica_arma_cc": true,
     "aplica_arma_distancia": false,
     "aplica_armadura": false,
     "aplica_escudo": false,
     "aplica_municion": false,
     "coste": 0,
     "descripcion": "Este encantamiento dobla el rango de amenaza de un arma.\r\nSólo armas cortantes y/o perforantes pueden ser encantadas para ser afiladas.\r\nEste beneficio no se apila con ningún otro efecto mágico que amplíe el rango de amenaza de un arma.",
     "es_plantilla": false,
     "id_encantamiento_base": null,
     "id_intensidad_aura": 2,
     "id_manual": 24,
     "modificador": 1,
     "nivel_lanzador": 10,
     "nombre": "Afilada",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "srd",
     "pagina": 223,
     "traducido": false
    },
    "modificadores": [],
    "requisitos": {
     "conjuros": [
      {
       "id_conjuro": 1,
       "opcional": 0
      }
     ],
     "dotes": [
      332
     ]
    },
    "tipos_dano": [
     2,
     3,
     4
    ]
   },
   "get": {
    "Aplica_a": {
     "Arma_a_distancia": false,
     "Arma_cuerpo_a_cuerpo": true,
     "Armadura": false,
     "Escudo": false,
     "Municion": false
    },
    "Aura": {
     "Escuelas": [
      {
       "Id": 8,
       "Nombre": "Transmutación"
      }
     ],
     "Intensidad": {
      "Id": 2,
      "Nombre": "Moderada"
     }
    },
    "Coste": 0,
    "Danos": [],
    "Descripcion": "Este encantamiento dobla el rango de amenaza de un arma.\r\nSólo armas cortantes y/o perforantes pueden ser encantadas para ser afiladas.\r\nEste beneficio no se apila con ningún otro efecto mágico que amplíe el rango de amenaza de un arma.",
    "Encantamiento_base": null,
    "Es_plantilla": false,
    "Id": 1,
    "Manual": {
     "Id": 24,
     "Nombre": "Guia del dungeon master 1",
     "Pagina": 223
    },
    "Modificador": 1,
    "Modificadores": [],
    "Nivel_lanzador": 10,
    "Nombre": "Afilada",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "srd",
    "Requisitos": {
     "Conjuros": [
      {
       "Id": 1,
       "Nombre": "Afiladura",
       "Opcional": 0
      }
     ],
     "Dotes": [
      {
       "Id": 332,
       "Nombre": "Fabricar armas y armaduras mágicas"
      }
     ]
    },
    "Tipos_dano_requeridos": [
     {
      "Id": 2,
      "Nombre": "Perforante"
     },
     {
      "Id": 3,
      "Nombre": "Cortante"
     },
     {
      "Id": 4,
      "Nombre": "Cortante o perforante"
     }
    ],
    "Traducido": false
   },
   "id": 1,
   "nombre": "Afilada"
  },
  {
   "cuerpo": {
    "aura_escuelas": [
     8
    ],
    "danos": [],
    "encantamiento": {
     "aplica_arma_cc": false,
     "aplica_arma_distancia": false,
     "aplica_armadura": true,
     "aplica_escudo": false,
     "aplica_municion": false,
     "coste": 0,
     "descripcion": "Es una versión reforzada de la aptitud anclante, que exige que la armadura ya la tenga. Funciona igual, pero el bonificador a las pruebas para resistir embestidas, arrollamientos y derribos es mucho mayor.",
     "es_plantilla": false,
     "id_encantamiento_base": 503,
     "id_intensidad_aura": 2,
     "id_manual": 7,
     "modificador": 1,
     "nivel_lanzador": 10,
     "nombre": "Anclante mayor",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 7,
     "traducido": false
    },
    "modificadores": [],
    "requisitos": {
     "conjuros": [],
     "dotes": []
    },
    "tipos_dano": []
   },
   "get": {
    "Aplica_a": {
     "Arma_a_distancia": false,
     "Arma_cuerpo_a_cuerpo": false,
     "Armadura": true,
     "Escudo": false,
     "Municion": false
    },
    "Aura": {
     "Escuelas": [
      {
       "Id": 8,
       "Nombre": "Transmutación"
      }
     ],
     "Intensidad": {
      "Id": 2,
      "Nombre": "Moderada"
     }
    },
    "Coste": 0,
    "Danos": [],
    "Descripcion": "Es una versión reforzada de la aptitud anclante, que exige que la armadura ya la tenga. Funciona igual, pero el bonificador a las pruebas para resistir embestidas, arrollamientos y derribos es mucho mayor.",
    "Encantamiento_base": {
     "Id": 503,
     "Nombre": "Anclante"
    },
    "Es_plantilla": false,
    "Id": 502,
    "Manual": {
     "Id": 7,
     "Nombre": "Compendio de objetos mágicos",
     "Pagina": 7
    },
    "Modificador": 1,
    "Modificadores": [],
    "Nivel_lanzador": 10,
    "Nombre": "Anclante mayor",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Requisitos": {
     "Conjuros": [],
     "Dotes": []
    },
    "Tipos_dano_requeridos": [],
    "Traducido": false
   },
   "id": 502,
   "nombre": "Anclante mayor"
  },
  {
   "cuerpo": {
    "aura_escuelas": [
     8
    ],
    "danos": [
     {
      "condicion": "En una carga con éxito, a lomos de una montura",
      "dados": "2d6",
      "id_tipo_dano": null
     }
    ],
    "encantamiento": {
     "aplica_arma_cc": true,
     "aplica_arma_distancia": false,
     "aplica_armadura": false,
     "aplica_escudo": false,
     "aplica_municion": false,
     "coste": 0,
     "descripcion": "Mientras el portador va a lomos de una montura, el arma inflige un daño extra considerable cuando impacta en una carga. Fuera de ese caso no aporta ningún beneficio especial.",
     "es_plantilla": false,
     "id_encantamiento_base": null,
     "id_intensidad_aura": 2,
     "id_manual": 7,
     "modificador": 1,
     "nivel_lanzador": 8,
     "nombre": "De carga",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 32,
     "traducido": false
    },
    "modificadores": [],
    "requisitos": {
     "conjuros": [
      {
       "id_conjuro": 1,
       "opcional": 0
      }
     ],
     "dotes": [
      298,
      332
     ]
    },
    "tipos_dano": []
   },
   "get": {
    "Aplica_a": {
     "Arma_a_distancia": false,
     "Arma_cuerpo_a_cuerpo": true,
     "Armadura": false,
     "Escudo": false,
     "Municion": false
    },
    "Aura": {
     "Escuelas": [
      {
       "Id": 8,
       "Nombre": "Transmutación"
      }
     ],
     "Intensidad": {
      "Id": 2,
      "Nombre": "Moderada"
     }
    },
    "Coste": 0,
    "Danos": [
     {
      "Condicion": "En una carga con éxito, a lomos de una montura",
      "Dados": "2d6",
      "Tipo_dano": null
     }
    ],
    "Descripcion": "Mientras el portador va a lomos de una montura, el arma inflige un daño extra considerable cuando impacta en una carga. Fuera de ese caso no aporta ningún beneficio especial.",
    "Encantamiento_base": null,
    "Es_plantilla": false,
    "Id": 26,
    "Manual": {
     "Id": 7,
     "Nombre": "Compendio de objetos mágicos",
     "Pagina": 32
    },
    "Modificador": 1,
    "Modificadores": [],
    "Nivel_lanzador": 8,
    "Nombre": "De carga",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Requisitos": {
     "Conjuros": [
      {
       "Id": 1,
       "Nombre": "Afiladura",
       "Opcional": 0
      }
     ],
     "Dotes": [
      {
       "Id": 298,
       "Nombre": "Carga impetuosa"
      },
      {
       "Id": 332,
       "Nombre": "Fabricar armas y armaduras mágicas"
      }
     ]
    },
    "Tipos_dano_requeridos": [],
    "Traducido": false
   },
   "id": 26,
   "nombre": "De carga"
  },
  {
   "cuerpo": {
    "aura_escuelas": [
     4
    ],
    "danos": [],
    "encantamiento": {
     "aplica_arma_cc": false,
     "aplica_arma_distancia": false,
     "aplica_armadura": true,
     "aplica_escudo": true,
     "aplica_municion": false,
     "coste": 3000,
     "descripcion": "Al activarla, la armadura o el escudo protege tu mente contra conjuros y aptitudes de enajenación. Te da un fuerte bonificador a las salvaciones de Voluntad contra ellos hasta el inicio de tu siguiente turno. Se puede usar tres veces al día.",
     "es_plantilla": false,
     "id_encantamiento_base": null,
     "id_intensidad_aura": 1,
     "id_manual": 7,
     "modificador": 0,
     "nivel_lanzador": 5,
     "nombre": "De armadura mental",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 7,
     "traducido": false
    },
    "modificadores": [
     {
      "condicion": "Contra conjuros y aptitudes de enajenación, tras activarla, hasta el inicio de tu siguiente turno",
      "id_caracteristica": null,
      "id_habilidad": null,
      "id_objetivo": 7,
      "id_tipo_bonificador": 19,
      "id_tipo_dano": null,
      "valor": 5
     }
    ],
    "requisitos": {
     "conjuros": [
      {
       "id_conjuro": 649,
       "opcional": 1
      },
      {
       "id_conjuro": 3393,
       "opcional": 1
      }
     ],
     "dotes": [
      332
     ]
    },
    "tipos_dano": []
   },
   "get": {
    "Aplica_a": {
     "Arma_a_distancia": false,
     "Arma_cuerpo_a_cuerpo": false,
     "Armadura": true,
     "Escudo": true,
     "Municion": false
    },
    "Aura": {
     "Escuelas": [
      {
       "Id": 4,
       "Nombre": "Encantamiento"
      }
     ],
     "Intensidad": {
      "Id": 1,
      "Nombre": "Débil"
     }
    },
    "Coste": 3000,
    "Danos": [],
    "Descripcion": "Al activarla, la armadura o el escudo protege tu mente contra conjuros y aptitudes de enajenación. Te da un fuerte bonificador a las salvaciones de Voluntad contra ellos hasta el inicio de tu siguiente turno. Se puede usar tres veces al día.",
    "Encantamiento_base": null,
    "Es_plantilla": false,
    "Id": 521,
    "Manual": {
     "Id": 7,
     "Nombre": "Compendio de objetos mágicos",
     "Pagina": 7
    },
    "Modificador": 0,
    "Modificadores": [
     {
      "Caracteristica": null,
      "Condicion": "Contra conjuros y aptitudes de enajenación, tras activarla, hasta el inicio de tu siguiente turno",
      "Habilidad": null,
      "Objetivo": {
       "Id": 7,
       "Nombre": "Voluntad"
      },
      "Tipo_bonificador": {
       "Apila": true,
       "Id": 19,
       "Nombre": "Sin tipo"
      },
      "Tipo_dano": null,
      "Valor": 5
     }
    ],
    "Nivel_lanzador": 5,
    "Nombre": "De armadura mental",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Requisitos": {
     "Conjuros": [
      {
       "Id": 649,
       "Nombre": "Heroísmo",
       "Opcional": 1
      },
      {
       "Id": 3393,
       "Nombre": "Vacío mental",
       "Opcional": 1
      }
     ],
     "Dotes": [
      {
       "Id": 332,
       "Nombre": "Fabricar armas y armaduras mágicas"
      }
     ]
    },
    "Tipos_dano_requeridos": [],
    "Traducido": false
   },
   "id": 521,
   "nombre": "De armadura mental"
  }
 ],
 "materiales": [
  {
   "cuerpo": {
    "costes": [],
    "material": {
     "bon_des_mas": null,
     "categoria_mas_ligera": false,
     "cuenta_como_gran_calidad": false,
     "dano_mod": null,
     "descripcion": "",
     "dureza": null,
     "fallo_arcano_menos": null,
     "id_manual": null,
     "nombre": "Plata",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": null,
     "penalizador_menos": null,
     "peso_multiplicador": null,
     "pg_por_pulgada": null,
     "supera_rd": false,
     "traducido": false
    }
   },
   "get": {
    "Costes": [],
    "Cuenta_como_gran_calidad": false,
    "Descripcion": null,
    "Dureza": null,
    "Efectos": {
     "Bon_des_mas": null,
     "Categoria_mas_ligera": false,
     "Dano_mod": null,
     "Fallo_arcano_menos": null,
     "Penalizador_menos": null,
     "Peso_multiplicador": null
    },
    "Id": 2,
    "Manual": null,
    "Nombre": "Plata",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Pg_por_pulgada": null,
    "Supera_rd": false,
    "Traducido": false
   },
   "id": 2,
   "nombre": "Plata"
  },
  {
   "cuerpo": {
    "costes": [
     {
      "coste": 3000,
      "coste_encantar": null,
      "coste_por_libra": null,
      "id_aplicacion": 1,
      "multiplicador_precio": null
     },
     {
      "coste": 60,
      "coste_encantar": null,
      "coste_por_libra": null,
      "id_aplicacion": 5,
      "multiplicador_precio": null
     },
     {
      "coste": 5000,
      "coste_encantar": null,
      "coste_por_libra": null,
      "id_aplicacion": 6,
      "multiplicador_precio": null
     },
     {
      "coste": 10000,
      "coste_encantar": null,
      "coste_por_libra": null,
      "id_aplicacion": 7,
      "multiplicador_precio": null
     },
     {
      "coste": 15000,
      "coste_encantar": null,
      "coste_por_libra": null,
      "id_aplicacion": 8,
      "multiplicador_precio": null
     }
    ],
    "material": {
     "bon_des_mas": null,
     "categoria_mas_ligera": false,
     "cuenta_como_gran_calidad": true,
     "dano_mod": null,
     "descripcion": "Metal de extraordinaria dureza, más resistente que el mithril y con más puntos de golpe. Las armas de adamantita superan la reducción de daño por adamantita y la dureza de los objetos menor que 20; las armaduras de adamantita dan reducción de daño. Siempre son de gran calidad, y su elevado precio la reserva para las piezas más valiosas.",
     "dureza": 20,
     "fallo_arcano_menos": null,
     "id_manual": 24,
     "nombre": "Adamantita",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": null,
     "penalizador_menos": null,
     "peso_multiplicador": null,
     "pg_por_pulgada": 40,
     "supera_rd": true,
     "traducido": false
    }
   },
   "get": {
    "Costes": [
     {
      "Aplicacion": {
       "Id": 1,
       "Nombre": "Arma"
      },
      "Coste": 3000,
      "Coste_encantar": null,
      "Coste_por_libra": null,
      "Multiplicador_precio": null
     },
     {
      "Aplicacion": {
       "Id": 5,
       "Nombre": "Munición (por pieza)"
      },
      "Coste": 60,
      "Coste_encantar": null,
      "Coste_por_libra": null,
      "Multiplicador_precio": null
     },
     {
      "Aplicacion": {
       "Id": 6,
       "Nombre": "Armadura ligera"
      },
      "Coste": 5000,
      "Coste_encantar": null,
      "Coste_por_libra": null,
      "Multiplicador_precio": null
     },
     {
      "Aplicacion": {
       "Id": 7,
       "Nombre": "Armadura intermedia"
      },
      "Coste": 10000,
      "Coste_encantar": null,
      "Coste_por_libra": null,
      "Multiplicador_precio": null
     },
     {
      "Aplicacion": {
       "Id": 8,
       "Nombre": "Armadura pesada"
      },
      "Coste": 15000,
      "Coste_encantar": null,
      "Coste_por_libra": null,
      "Multiplicador_precio": null
     }
    ],
    "Cuenta_como_gran_calidad": true,
    "Descripcion": "Metal de extraordinaria dureza, más resistente que el mithril y con más puntos de golpe. Las armas de adamantita superan la reducción de daño por adamantita y la dureza de los objetos menor que 20; las armaduras de adamantita dan reducción de daño. Siempre son de gran calidad, y su elevado precio la reserva para las piezas más valiosas.",
    "Dureza": 20,
    "Efectos": {
     "Bon_des_mas": null,
     "Categoria_mas_ligera": false,
     "Dano_mod": null,
     "Fallo_arcano_menos": null,
     "Penalizador_menos": null,
     "Peso_multiplicador": null
    },
    "Id": 7,
    "Manual": {
     "Id": 24,
     "Nombre": "Guia del dungeon master 1",
     "Pagina": null
    },
    "Nombre": "Adamantita",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Pg_por_pulgada": 40,
    "Supera_rd": true,
    "Traducido": false
   },
   "id": 7,
   "nombre": "Adamantita"
  },
  {
   "cuerpo": {
    "costes": [
     {
      "coste": 20,
      "coste_encantar": null,
      "coste_por_libra": null,
      "id_aplicacion": 2,
      "multiplicador_precio": null
     },
     {
      "coste": 90,
      "coste_encantar": null,
      "coste_por_libra": null,
      "id_aplicacion": 3,
      "multiplicador_precio": null
     },
     {
      "coste": 180,
      "coste_encantar": null,
      "coste_por_libra": null,
      "id_aplicacion": 4,
      "multiplicador_precio": null
     },
     {
      "coste": 2,
      "coste_encantar": null,
      "coste_por_libra": null,
      "id_aplicacion": 5,
      "multiplicador_precio": null
     }
    ],
    "material": {
     "bon_des_mas": null,
     "categoria_mas_ligera": false,
     "cuenta_como_gran_calidad": false,
     "dano_mod": -1,
     "descripcion": "",
     "dureza": 8,
     "fallo_arcano_menos": null,
     "id_manual": 24,
     "nombre": "Plata alquímica",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": null,
     "penalizador_menos": null,
     "peso_multiplicador": null,
     "pg_por_pulgada": 10,
     "supera_rd": true,
     "traducido": false
    }
   },
   "get": {
    "Costes": [
     {
      "Aplicacion": {
       "Id": 2,
       "Nombre": "Arma ligera"
      },
      "Coste": 20,
      "Coste_encantar": null,
      "Coste_por_libra": null,
      "Multiplicador_precio": null
     },
     {
      "Aplicacion": {
       "Id": 3,
       "Nombre": "Arma a una mano"
      },
      "Coste": 90,
      "Coste_encantar": null,
      "Coste_por_libra": null,
      "Multiplicador_precio": null
     },
     {
      "Aplicacion": {
       "Id": 4,
       "Nombre": "Arma a dos manos"
      },
      "Coste": 180,
      "Coste_encantar": null,
      "Coste_por_libra": null,
      "Multiplicador_precio": null
     },
     {
      "Aplicacion": {
       "Id": 5,
       "Nombre": "Munición (por pieza)"
      },
      "Coste": 2,
      "Coste_encantar": null,
      "Coste_por_libra": null,
      "Multiplicador_precio": null
     }
    ],
    "Cuenta_como_gran_calidad": false,
    "Descripcion": null,
    "Dureza": 8,
    "Efectos": {
     "Bon_des_mas": null,
     "Categoria_mas_ligera": false,
     "Dano_mod": -1,
     "Fallo_arcano_menos": null,
     "Penalizador_menos": null,
     "Peso_multiplicador": null
    },
    "Id": 3,
    "Manual": {
     "Id": 24,
     "Nombre": "Guia del dungeon master 1",
     "Pagina": null
    },
    "Nombre": "Plata alquímica",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Pg_por_pulgada": 10,
    "Supera_rd": true,
    "Traducido": false
   },
   "id": 3,
   "nombre": "Plata alquímica"
  }
 ],
 "municiones": [
  {
   "cuerpo": {
    "municion": {
     "cantidad_por_precio": null,
     "descripcion": "Munición fabricada por los elfos acuáticos que no añade el bonificador de ataque habitual. Su utilidad está en permitir disparar con un arco largo acuático bajo el agua sin sufrir la penalización correspondiente, independientemente de la profundidad a la que se encuentre el tirador.",
     "id_manual": 59,
     "nombre": "Flecha marina",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 155,
     "peso": null,
     "precio": null,
     "traducido": false
    }
   },
   "get": {
    "Armas": [],
    "Cantidad_por_precio": null,
    "Descripcion": "Munición fabricada por los elfos acuáticos que no añade el bonificador de ataque habitual. Su utilidad está en permitir disparar con un arco largo acuático bajo el agua sin sufrir la penalización correspondiente, independientemente de la profundidad a la que se encuentre el tirador.",
    "Id": 28,
    "Manual": {
     "Id": 59,
     "Nombre": "Razas de faerun",
     "Pagina": 155
    },
    "Nombre": "Flecha marina",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": null,
    "Precio": null,
    "Traducido": false
   },
   "id": 28,
   "nombre": "Flecha marina"
  },
  {
   "cuerpo": {
    "municion": {
     "cantidad_por_precio": 10,
     "descripcion": "Proyectiles cortos y rígidos que disparan las ballestas, vendidos en lotes de diez. Son baratos y ligeros.",
     "id_manual": 54,
     "nombre": "Virote",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 116,
     "peso": 1,
     "precio": 1,
     "traducido": false
    }
   },
   "get": {
    "Armas": [],
    "Cantidad_por_precio": 10,
    "Descripcion": "Proyectiles cortos y rígidos que disparan las ballestas, vendidos en lotes de diez. Son baratos y ligeros.",
    "Id": 2,
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 116
    },
    "Nombre": "Virote",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 1,
    "Precio": 1,
    "Traducido": false
   },
   "id": 2,
   "nombre": "Virote"
  },
  {
   "cuerpo": {
    "municion": {
     "cantidad_por_precio": 10,
     "descripcion": "Esferas de plomo que se disparan con la honda y pesan bastante más que las piedras del mismo tamaño. Se venden en bolsas de diez y las que golpean su blanco quedan destruidas.",
     "id_manual": 54,
     "nombre": "Balas de honda",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 116,
     "peso": 5,
     "precio": 0.1,
     "traducido": false
    }
   },
   "get": {
    "Armas": [
     {
      "Id": 20,
      "Nombre": "Honda"
     }
    ],
    "Cantidad_por_precio": 10,
    "Descripcion": "Esferas de plomo que se disparan con la honda y pesan bastante más que las piedras del mismo tamaño. Se venden en bolsas de diez y las que golpean su blanco quedan destruidas.",
    "Id": 3,
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 116
    },
    "Nombre": "Balas de honda",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 5,
    "Precio": 0.1,
    "Traducido": false
   },
   "id": 3,
   "nombre": "Balas de honda"
  }
 ],
 "objetos": [
  {
   "cuerpo": {
    "activaciones": [],
    "aura_escuelas": [],
    "conjuros": [],
    "encantamientos": [
     {
      "cabeza": 1,
      "id_encantamiento": 1
     }
    ],
    "modificadores": [],
    "objeto": {
     "bonificador_mejora": 1,
     "bonificador_mejora_2": null,
     "cargas": null,
     "cargas_se_recuperan": false,
     "coste_creacion_po": null,
     "coste_creacion_px": null,
     "descripcion": "Arma de acero forjada en forma de hacha de batalla, con el filo cuidadosamente afilado. Su empuñadura y el metal le dan un aspecto robusto, y su punto fuerte es que causa estragos a criaturas de determinadas clases.",
     "dias_creacion": null,
     "es_generico_conjuro": false,
     "es_reliquia": false,
     "id_arma_base": 32,
     "id_armadura_base": null,
     "id_conjunto": null,
     "id_intensidad_aura": null,
     "id_manual": 59,
     "id_material": 4,
     "id_monstruo": null,
     "id_ranura": null,
     "id_tipo_objeto": 30,
     "inteligente": false,
     "maldito": false,
     "nivel_conjuro_maximo": null,
     "nivel_lanzador": null,
     "nivel_objeto": null,
     "nombre": "Hacha rajaenemigos",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 171,
     "peso": null,
     "precio": null,
     "precio_por_nivel_conjuro": null,
     "requisitos_otros": null,
     "requisitos_uso": null,
     "traducido": false,
     "usos_componente_caro": null,
     "usos_por_dia": null
    },
    "requisitos": {
     "conjuros": [],
     "dotes": []
    }
   },
   "get": {
    "Activaciones": [],
    "Arma_base": {
     "Id": 32,
     "Nombre": "Hacha de batalla"
    },
    "Armadura_base": null,
    "Aura": {
     "Escuelas": [],
     "Intensidad": null
    },
    "Bonificador_mejora": 1,
    "Bonificador_mejora_2": null,
    "Cargas": null,
    "Cargas_se_recuperan": false,
    "Conjunto": null,
    "Conjuros": [],
    "Creacion": {
     "Coste_po": null,
     "Coste_px": null,
     "Dias": null,
     "Otros_requisitos": null,
     "Requisitos": {
      "Conjuros": [],
      "Dotes": []
     }
    },
    "Descripcion": "Arma de acero forjada en forma de hacha de batalla, con el filo cuidadosamente afilado. Su empuñadura y el metal le dan un aspecto robusto, y su punto fuerte es que causa estragos a criaturas de determinadas clases.",
    "Encantamientos": [
     {
      "Cabeza": 1,
      "Coste": 0,
      "Descripcion": "Este encantamiento dobla el rango de amenaza de un arma.\r\nSólo armas cortantes y/o perforantes pueden ser encantadas para ser afiladas.\r\nEste beneficio no se apila con ningún otro efecto mágico que amplíe el rango de amenaza de un arma.",
      "Id": 1,
      "Modificador": 1,
      "Nombre": "Afilada",
      "Oficial": true
     }
    ],
    "Generico_conjuro": null,
    "Id": 92982,
    "Inteligente": false,
    "Maldito": false,
    "Manual": {
     "Id": 59,
     "Nombre": "Razas de faerun",
     "Pagina": 171
    },
    "Material": {
     "Id": 4,
     "Nombre": "Acero"
    },
    "Modificadores": [],
    "Monstruo": null,
    "Nivel_lanzador": null,
    "Nivel_objeto": null,
    "Nombre": "Hacha rajaenemigos",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": null,
    "Precio": null,
    "Ranura": null,
    "Reliquia": false,
    "Requisitos_uso": null,
    "Tipo": {
     "Categoria": "magico",
     "Id": 30,
     "Nombre": "Arma mágica específica"
    },
    "Traducido": false,
    "Usos_por_dia": null
   },
   "id": 92982,
   "nombre": "Hacha rajaenemigos"
  },
  {
   "cuerpo": {
    "activaciones": [],
    "aura_escuelas": [],
    "conjuros": [],
    "encantamientos": [],
    "modificadores": [],
    "objeto": {
     "bonificador_mejora": 1,
     "bonificador_mejora_2": null,
     "cargas": null,
     "cargas_se_recuperan": false,
     "coste_creacion_po": 436500,
     "coste_creacion_px": 18700,
     "descripcion": "Armadura completa de invulnerabilidad negadora +1 fabricada en adamantita, de modo que añade además un bonificador de mejora natural. Quien intenta disipar efectos sobre su portador sufre una penalización a esas pruebas.",
     "dias_creacion": null,
     "es_generico_conjuro": false,
     "es_reliquia": false,
     "id_arma_base": null,
     "id_armadura_base": 12,
     "id_conjunto": null,
     "id_intensidad_aura": null,
     "id_manual": 53,
     "id_material": null,
     "id_monstruo": null,
     "id_ranura": null,
     "id_tipo_objeto": 31,
     "inteligente": false,
     "maldito": false,
     "nivel_conjuro_maximo": null,
     "nivel_lanzador": 21,
     "nivel_objeto": null,
     "nombre": "Armadura antimágica",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 128,
     "peso": null,
     "precio": 871500,
     "precio_por_nivel_conjuro": null,
     "requisitos_otros": null,
     "requisitos_uso": null,
     "traducido": false,
     "usos_componente_caro": null,
     "usos_por_dia": null
    },
    "requisitos": {
     "conjuros": [
      {
       "id_conjuro": 927,
       "opcional": 0
      },
      {
       "id_conjuro": 545,
       "opcional": 1
      },
      {
       "id_conjuro": 719,
       "opcional": 1
      }
     ],
     "dotes": [
      332
     ]
    }
   },
   "get": {
    "Activaciones": [],
    "Arma_base": null,
    "Armadura_base": {
     "Id": 12,
     "Nombre": "Armadura completa"
    },
    "Aura": {
     "Escuelas": [],
     "Intensidad": null
    },
    "Bonificador_mejora": 1,
    "Bonificador_mejora_2": null,
    "Cargas": null,
    "Cargas_se_recuperan": false,
    "Conjunto": null,
    "Conjuros": [],
    "Creacion": {
     "Coste_po": 436500,
     "Coste_px": 18700,
     "Dias": null,
     "Otros_requisitos": null,
     "Requisitos": {
      "Conjuros": [
       {
        "Id": 927,
        "Nombre": "Piel pétrea",
        "Opcional": 0
       },
       {
        "Id": 545,
        "Nombre": "Deseo",
        "Opcional": 1
       },
       {
        "Id": 719,
        "Nombre": "Milagro",
        "Opcional": 1
       }
      ],
      "Dotes": [
       {
        "Id": 332,
        "Nombre": "Fabricar armas y armaduras mágicas"
       }
      ]
     }
    },
    "Descripcion": "Armadura completa de invulnerabilidad negadora +1 fabricada en adamantita, de modo que añade además un bonificador de mejora natural. Quien intenta disipar efectos sobre su portador sufre una penalización a esas pruebas.",
    "Encantamientos": [],
    "Generico_conjuro": null,
    "Id": 92543,
    "Inteligente": false,
    "Maldito": false,
    "Manual": {
     "Id": 53,
     "Nombre": "Manual de niveles épicos",
     "Pagina": 128
    },
    "Material": null,
    "Modificadores": [],
    "Monstruo": null,
    "Nivel_lanzador": 21,
    "Nivel_objeto": null,
    "Nombre": "Armadura antimágica",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": null,
    "Precio": 871500,
    "Ranura": null,
    "Reliquia": false,
    "Requisitos_uso": null,
    "Tipo": {
     "Categoria": "magico",
     "Id": 31,
     "Nombre": "Armadura mágica específica"
    },
    "Traducido": false,
    "Usos_por_dia": null
   },
   "id": 92543,
   "nombre": "Armadura antimágica"
  },
  {
   "cuerpo": {
    "activaciones": [],
    "aura_escuelas": [],
    "conjuros": [],
    "encantamientos": [],
    "modificadores": [],
    "objeto": {
     "bonificador_mejora": null,
     "bonificador_mejora_2": null,
     "cargas": null,
     "cargas_se_recuperan": false,
     "coste_creacion_po": null,
     "coste_creacion_px": null,
     "descripcion": "Un conjuro de nivel 3 o menos guardado en un líquido; quien la bebe recibe su efecto. Un solo uso.",
     "dias_creacion": null,
     "es_generico_conjuro": true,
     "es_reliquia": false,
     "id_arma_base": null,
     "id_armadura_base": null,
     "id_conjunto": null,
     "id_intensidad_aura": null,
     "id_manual": 24,
     "id_material": null,
     "id_monstruo": null,
     "id_ranura": null,
     "id_tipo_objeto": 19,
     "inteligente": false,
     "maldito": false,
     "nivel_conjuro_maximo": 3,
     "nivel_lanzador": null,
     "nivel_objeto": null,
     "nombre": "Poción",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 0,
     "peso": null,
     "precio": null,
     "precio_por_nivel_conjuro": 50,
     "requisitos_otros": null,
     "requisitos_uso": null,
     "traducido": false,
     "usos_componente_caro": 1,
     "usos_por_dia": null
    },
    "requisitos": {
     "conjuros": [],
     "dotes": []
    }
   },
   "get": {
    "Activaciones": [],
    "Arma_base": null,
    "Armadura_base": null,
    "Aura": {
     "Escuelas": [],
     "Intensidad": null
    },
    "Bonificador_mejora": null,
    "Bonificador_mejora_2": null,
    "Cargas": null,
    "Cargas_se_recuperan": false,
    "Conjunto": null,
    "Conjuros": [],
    "Creacion": {
     "Coste_po": null,
     "Coste_px": null,
     "Dias": null,
     "Otros_requisitos": null,
     "Requisitos": {
      "Conjuros": [],
      "Dotes": []
     }
    },
    "Descripcion": "Un conjuro de nivel 3 o menos guardado en un líquido; quien la bebe recibe su efecto. Un solo uso.",
    "Encantamientos": [],
    "Generico_conjuro": {
     "Nivel_maximo": 3,
     "Precio_por_nivel": 50,
     "Usos_componente_caro": 1
    },
    "Id": 1,
    "Inteligente": false,
    "Maldito": false,
    "Manual": {
     "Id": 24,
     "Nombre": "Guia del dungeon master 1",
     "Pagina": 0
    },
    "Material": null,
    "Modificadores": [],
    "Monstruo": null,
    "Nivel_lanzador": null,
    "Nivel_objeto": null,
    "Nombre": "Poción",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": null,
    "Precio": null,
    "Ranura": null,
    "Reliquia": false,
    "Requisitos_uso": null,
    "Tipo": {
     "Categoria": "magico",
     "Id": 19,
     "Nombre": "Poción o aceite"
    },
    "Traducido": false,
    "Usos_por_dia": null
   },
   "id": 1,
   "nombre": "Poción"
  },
  {
   "cuerpo": {
    "activaciones": [
     {
      "id_tipo_accion": null,
      "id_tipo_activacion": 1
     },
     {
      "id_tipo_accion": 1,
      "id_tipo_activacion": 2
     }
    ],
    "aura_escuelas": [
     3
    ],
    "conjuros": [],
    "encantamientos": [],
    "modificadores": [
     {
      "condicion": "A las pruebas de Fuerza para resistir ser embestido o derribado estando de pie sobre el suelo",
      "id_caracteristica": 1,
      "id_habilidad": null,
      "id_objetivo": 8,
      "id_tipo_bonificador": 19,
      "id_tipo_dano": null,
      "valor": 4
     }
    ],
    "objeto": {
     "bonificador_mejora": null,
     "bonificador_mejora_2": null,
     "cargas": null,
     "cargas_se_recuperan": false,
     "coste_creacion_po": 1000,
     "coste_creacion_px": 80,
     "descripcion": "Unas botas de aspecto rígido que no estorban al moverte. Te hacen más difícil de empujar o derribar mientras estás de pie en el suelo. Al activarlas, te permiten pasar un asalto sin pagar el coste extra de movimiento por terreno accidentado, un número limitado de veces al día.",
     "dias_creacion": 2,
     "es_generico_conjuro": false,
     "es_reliquia": false,
     "id_arma_base": null,
     "id_armadura_base": null,
     "id_conjunto": null,
     "id_intensidad_aura": 2,
     "id_manual": 7,
     "id_material": null,
     "id_monstruo": null,
     "id_ranura": 11,
     "id_tipo_objeto": 20,
     "inteligente": false,
     "maldito": false,
     "nivel_conjuro_maximo": null,
     "nivel_lanzador": 11,
     "nivel_objeto": 6,
     "nombre": "Botas pétreas",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 87,
     "peso": 1,
     "precio": 2000,
     "precio_por_nivel_conjuro": null,
     "requisitos_otros": null,
     "requisitos_uso": null,
     "traducido": false,
     "usos_componente_caro": null,
     "usos_por_dia": 5
    },
    "requisitos": {
     "conjuros": [
      {
       "id_conjuro": 691,
       "opcional": 1
      }
     ],
     "dotes": [
      335
     ]
    }
   },
   "get": {
    "Activaciones": [
     {
      "Accion": null,
      "Id": 1,
      "Nombre": "Uso o continuo"
     },
     {
      "Accion": {
       "Id": 1,
       "Nombre": "Gratuita"
      },
      "Id": 2,
      "Nombre": "Palabra de mando"
     }
    ],
    "Arma_base": null,
    "Armadura_base": null,
    "Aura": {
     "Escuelas": [
      {
       "Id": 3,
       "Nombre": "Conjuración"
      }
     ],
     "Intensidad": {
      "Id": 2,
      "Nombre": "Moderada"
     }
    },
    "Bonificador_mejora": null,
    "Bonificador_mejora_2": null,
    "Cargas": null,
    "Cargas_se_recuperan": false,
    "Conjunto": null,
    "Conjuros": [],
    "Creacion": {
     "Coste_po": 1000,
     "Coste_px": 80,
     "Dias": 2,
     "Otros_requisitos": null,
     "Requisitos": {
      "Conjuros": [
       {
        "Id": 691,
        "Nombre": "Ligadura de los planos",
        "Opcional": 1
       }
      ],
      "Dotes": [
       {
        "Id": 335,
        "Nombre": "Fabricar objeto maravilloso"
       }
      ]
     }
    },
    "Descripcion": "Unas botas de aspecto rígido que no estorban al moverte. Te hacen más difícil de empujar o derribar mientras estás de pie en el suelo. Al activarlas, te permiten pasar un asalto sin pagar el coste extra de movimiento por terreno accidentado, un número limitado de veces al día.",
    "Encantamientos": [],
    "Generico_conjuro": null,
    "Id": 91075,
    "Inteligente": false,
    "Maldito": false,
    "Manual": {
     "Id": 7,
     "Nombre": "Compendio de objetos mágicos",
     "Pagina": 87
    },
    "Material": null,
    "Modificadores": [
     {
      "Caracteristica": {
       "Id": 1,
       "Nombre": "Fuerza"
      },
      "Condicion": "A las pruebas de Fuerza para resistir ser embestido o derribado estando de pie sobre el suelo",
      "Habilidad": null,
      "Objetivo": {
       "Id": 8,
       "Nombre": "Característica"
      },
      "Tipo_bonificador": {
       "Apila": true,
       "Id": 19,
       "Nombre": "Sin tipo"
      },
      "Tipo_dano": null,
      "Valor": 4
     }
    ],
    "Monstruo": null,
    "Nivel_lanzador": 11,
    "Nivel_objeto": 6,
    "Nombre": "Botas pétreas",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 1,
    "Precio": 2000,
    "Ranura": {
     "Id": 11,
     "Nombre": "Pies"
    },
    "Reliquia": false,
    "Requisitos_uso": null,
    "Tipo": {
     "Categoria": "magico",
     "Id": 20,
     "Nombre": "Objeto maravilloso"
    },
    "Traducido": false,
    "Usos_por_dia": 5
   },
   "id": 91075,
   "nombre": "Botas pétreas"
  },
  {
   "cuerpo": {
    "activaciones": [
     {
      "id_tipo_accion": null,
      "id_tipo_activacion": 1
     },
     {
      "id_tipo_accion": 5,
      "id_tipo_activacion": 4
     }
    ],
    "aura_escuelas": [
     8
    ],
    "conjuros": [
     {
      "cargas_por_uso": null,
      "id_conjuro": 447,
      "nivel_lanzador": null,
      "usos_por_dia": 1
     }
    ],
    "encantamientos": [],
    "modificadores": [
     {
      "condicion": null,
      "id_caracteristica": null,
      "id_habilidad": 1,
      "id_objetivo": 9,
      "id_tipo_bonificador": 4,
      "id_tipo_dano": null,
      "valor": 5
     }
    ],
    "objeto": {
     "bonificador_mejora": null,
     "bonificador_mejora_2": null,
     "cargas": null,
     "cargas_se_recuperan": false,
     "coste_creacion_po": 1750,
     "coste_creacion_px": 140,
     "descripcion": "Un mecanismo de pequeñas piezas oculto bajo su piedra facilita enormemente abrir cerraduras de forma permanente. Además, una vez al día puede emplearse para provocar el efecto de un conjuro de abrir, siempre que se toque la puerta o el cierre afectado.",
     "dias_creacion": 4,
     "es_generico_conjuro": false,
     "es_reliquia": false,
     "id_arma_base": null,
     "id_armadura_base": null,
     "id_conjunto": null,
     "id_intensidad_aura": 1,
     "id_manual": 7,
     "id_material": null,
     "id_monstruo": null,
     "id_ranura": 9,
     "id_tipo_objeto": 13,
     "inteligente": false,
     "maldito": false,
     "nivel_conjuro_maximo": null,
     "nivel_lanzador": 3,
     "nivel_objeto": 8,
     "nombre": "Anillo de forzar cerraduras",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 76,
     "peso": null,
     "precio": 3500,
     "precio_por_nivel_conjuro": null,
     "requisitos_otros": null,
     "requisitos_uso": null,
     "traducido": false,
     "usos_componente_caro": null,
     "usos_por_dia": 1
    },
    "requisitos": {
     "conjuros": [
      {
       "id_conjuro": 447,
       "opcional": 0
      }
     ],
     "dotes": [
      339
     ]
    }
   },
   "get": {
    "Activaciones": [
     {
      "Accion": null,
      "Id": 1,
      "Nombre": "Uso o continuo"
     },
     {
      "Accion": {
       "Id": 5,
       "Nombre": "Estándar"
      },
      "Id": 4,
      "Nombre": "Manipulación"
     }
    ],
    "Arma_base": null,
    "Armadura_base": null,
    "Aura": {
     "Escuelas": [
      {
       "Id": 8,
       "Nombre": "Transmutación"
      }
     ],
     "Intensidad": {
      "Id": 1,
      "Nombre": "Débil"
     }
    },
    "Bonificador_mejora": null,
    "Bonificador_mejora_2": null,
    "Cargas": null,
    "Cargas_se_recuperan": false,
    "Conjunto": null,
    "Conjuros": [
     {
      "Cargas_por_uso": null,
      "Id": 447,
      "Nivel_lanzador": null,
      "Nombre": "Apertura",
      "Usos_por_dia": 1
     }
    ],
    "Creacion": {
     "Coste_po": 1750,
     "Coste_px": 140,
     "Dias": 4,
     "Otros_requisitos": null,
     "Requisitos": {
      "Conjuros": [
       {
        "Id": 447,
        "Nombre": "Apertura",
        "Opcional": 0
       }
      ],
      "Dotes": [
       {
        "Id": 339,
        "Nombre": "Forjar anillo"
       }
      ]
     }
    },
    "Descripcion": "Un mecanismo de pequeñas piezas oculto bajo su piedra facilita enormemente abrir cerraduras de forma permanente. Además, una vez al día puede emplearse para provocar el efecto de un conjuro de abrir, siempre que se toque la puerta o el cierre afectado.",
    "Encantamientos": [],
    "Generico_conjuro": null,
    "Id": 47,
    "Inteligente": false,
    "Maldito": false,
    "Manual": {
     "Id": 7,
     "Nombre": "Compendio de objetos mágicos",
     "Pagina": 76
    },
    "Material": null,
    "Modificadores": [
     {
      "Caracteristica": null,
      "Condicion": null,
      "Habilidad": {
       "Id": 1,
       "Nombre": "Abrir Cerraduras"
      },
      "Objetivo": {
       "Id": 9,
       "Nombre": "Habilidad"
      },
      "Tipo_bonificador": {
       "Apila": false,
       "Id": 4,
       "Nombre": "Capacidad"
      },
      "Tipo_dano": null,
      "Valor": 5
     }
    ],
    "Monstruo": null,
    "Nivel_lanzador": 3,
    "Nivel_objeto": 8,
    "Nombre": "Anillo de forzar cerraduras",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": null,
    "Precio": 3500,
    "Ranura": {
     "Id": 9,
     "Nombre": "Anillo"
    },
    "Reliquia": false,
    "Requisitos_uso": null,
    "Tipo": {
     "Categoria": "magico",
     "Id": 13,
     "Nombre": "Anillo"
    },
    "Traducido": false,
    "Usos_por_dia": 1
   },
   "id": 47,
   "nombre": "Anillo de forzar cerraduras"
  },
  {
   "cuerpo": {
    "activaciones": [
     {
      "id_tipo_accion": 5,
      "id_tipo_activacion": 2
     }
    ],
    "aura_escuelas": [
     5
    ],
    "conjuros": [
     {
      "cargas_por_uso": 1,
      "id_conjuro": 726,
      "nivel_lanzador": null,
      "usos_por_dia": null
     }
    ],
    "encantamientos": [],
    "modificadores": [],
    "objeto": {
     "bonificador_mejora": null,
     "bonificador_mejora_2": null,
     "cargas": 3,
     "cargas_se_recuperan": true,
     "coste_creacion_po": 2550,
     "coste_creacion_px": 204,
     "descripcion": "Esta sortija permite levantar una barrera vertical prácticamente impenetrable, equivalente al conjuro del mismo nombre, a corta distancia de quien la lleva. Cuantas más cargas se gasten en un uso, más tiempo permanece la barrera en pie. Las cargas se recuperan al amanecer de cada día.",
     "dias_creacion": 6,
     "es_generico_conjuro": false,
     "es_reliquia": false,
     "id_arma_base": null,
     "id_armadura_base": null,
     "id_conjunto": null,
     "id_intensidad_aura": 3,
     "id_manual": 7,
     "id_material": null,
     "id_monstruo": null,
     "id_ranura": 9,
     "id_tipo_objeto": 13,
     "inteligente": false,
     "maldito": false,
     "nivel_conjuro_maximo": null,
     "nivel_lanzador": 12,
     "nivel_objeto": 10,
     "nombre": "Anillo de muro de fuerza",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 80,
     "peso": null,
     "precio": 5100,
     "precio_por_nivel_conjuro": null,
     "requisitos_otros": null,
     "requisitos_uso": null,
     "traducido": false,
     "usos_componente_caro": null,
     "usos_por_dia": null
    },
    "requisitos": {
     "conjuros": [
      {
       "id_conjuro": 726,
       "opcional": 0
      }
     ],
     "dotes": [
      339
     ]
    }
   },
   "get": {
    "Activaciones": [
     {
      "Accion": {
       "Id": 5,
       "Nombre": "Estándar"
      },
      "Id": 2,
      "Nombre": "Palabra de mando"
     }
    ],
    "Arma_base": null,
    "Armadura_base": null,
    "Aura": {
     "Escuelas": [
      {
       "Id": 5,
       "Nombre": "Evocación"
      }
     ],
     "Intensidad": {
      "Id": 3,
      "Nombre": "Fuerte"
     }
    },
    "Bonificador_mejora": null,
    "Bonificador_mejora_2": null,
    "Cargas": 3,
    "Cargas_se_recuperan": true,
    "Conjunto": null,
    "Conjuros": [
     {
      "Cargas_por_uso": 1,
      "Id": 726,
      "Nivel_lanzador": null,
      "Nombre": "Muro de fuerza",
      "Usos_por_dia": null
     }
    ],
    "Creacion": {
     "Coste_po": 2550,
     "Coste_px": 204,
     "Dias": 6,
     "Otros_requisitos": null,
     "Requisitos": {
      "Conjuros": [
       {
        "Id": 726,
        "Nombre": "Muro de fuerza",
        "Opcional": 0
       }
      ],
      "Dotes": [
       {
        "Id": 339,
        "Nombre": "Forjar anillo"
       }
      ]
     }
    },
    "Descripcion": "Esta sortija permite levantar una barrera vertical prácticamente impenetrable, equivalente al conjuro del mismo nombre, a corta distancia de quien la lleva. Cuantas más cargas se gasten en un uso, más tiempo permanece la barrera en pie. Las cargas se recuperan al amanecer de cada día.",
    "Encantamientos": [],
    "Generico_conjuro": null,
    "Id": 91025,
    "Inteligente": false,
    "Maldito": false,
    "Manual": {
     "Id": 7,
     "Nombre": "Compendio de objetos mágicos",
     "Pagina": 80
    },
    "Material": null,
    "Modificadores": [],
    "Monstruo": null,
    "Nivel_lanzador": 12,
    "Nivel_objeto": 10,
    "Nombre": "Anillo de muro de fuerza",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": null,
    "Precio": 5100,
    "Ranura": {
     "Id": 9,
     "Nombre": "Anillo"
    },
    "Reliquia": false,
    "Requisitos_uso": null,
    "Tipo": {
     "Categoria": "magico",
     "Id": 13,
     "Nombre": "Anillo"
    },
    "Traducido": false,
    "Usos_por_dia": null
   },
   "id": 91025,
   "nombre": "Anillo de muro de fuerza"
  },
  {
   "cuerpo": {
    "activaciones": [
     {
      "id_tipo_accion": null,
      "id_tipo_activacion": 1
     },
     {
      "id_tipo_accion": 3,
      "id_tipo_activacion": 2
     }
    ],
    "aura_escuelas": [
     5
    ],
    "conjuros": [],
    "encantamientos": [],
    "modificadores": [
     {
      "condicion": "Gastando 1 carga: +2d6 de daño por fuego en el siguiente conjuro de fuego (2 cargas: +3d6; 3 cargas: +4d6)",
      "id_caracteristica": null,
      "id_habilidad": null,
      "id_objetivo": 3,
      "id_tipo_bonificador": 19,
      "id_tipo_dano": 11,
      "valor": 2
     },
     {
      "condicion": "Al lanzar conjuros con el descriptor fuego",
      "id_caracteristica": null,
      "id_habilidad": null,
      "id_objetivo": 15,
      "id_tipo_bonificador": 4,
      "id_tipo_dano": null,
      "valor": 1
     }
    ],
    "objeto": {
     "bonificador_mejora": null,
     "bonificador_mejora_2": null,
     "cargas": 3,
     "cargas_se_recuperan": true,
     "coste_creacion_po": 3750,
     "coste_creacion_px": 300,
     "descripcion": "Refuerza los conjuros de fuego de quien lo lleva, haciéndolos más potentes de forma continua. Además, almacena cargas diarias que se pueden gastar para añadir daño de fuego al siguiente conjuro de fuego que se lance en el mismo turno, con más daño cuantas más cargas se empleen.",
     "dias_creacion": 8,
     "es_generico_conjuro": false,
     "es_reliquia": false,
     "id_arma_base": null,
     "id_armadura_base": null,
     "id_conjunto": null,
     "id_intensidad_aura": 2,
     "id_manual": 7,
     "id_material": null,
     "id_monstruo": null,
     "id_ranura": 9,
     "id_tipo_objeto": 13,
     "inteligente": false,
     "maldito": false,
     "nivel_conjuro_maximo": null,
     "nivel_lanzador": 9,
     "nivel_objeto": 11,
     "nombre": "Anillo de fuego místico",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 76,
     "peso": null,
     "precio": 7500,
     "precio_por_nivel_conjuro": null,
     "requisitos_otros": null,
     "requisitos_uso": null,
     "traducido": false,
     "usos_componente_caro": null,
     "usos_por_dia": null
    },
    "requisitos": {
     "conjuros": [
      {
       "id_conjuro": 467,
       "opcional": 1
      },
      {
       "id_conjuro": 543,
       "opcional": 1
      }
     ],
     "dotes": [
      339
     ]
    }
   },
   "get": {
    "Activaciones": [
     {
      "Accion": null,
      "Id": 1,
      "Nombre": "Uso o continuo"
     },
     {
      "Accion": {
       "Id": 3,
       "Nombre": "Rápida"
      },
      "Id": 2,
      "Nombre": "Palabra de mando"
     }
    ],
    "Arma_base": null,
    "Armadura_base": null,
    "Aura": {
     "Escuelas": [
      {
       "Id": 5,
       "Nombre": "Evocación"
      }
     ],
     "Intensidad": {
      "Id": 2,
      "Nombre": "Moderada"
     }
    },
    "Bonificador_mejora": null,
    "Bonificador_mejora_2": null,
    "Cargas": 3,
    "Cargas_se_recuperan": true,
    "Conjunto": null,
    "Conjuros": [],
    "Creacion": {
     "Coste_po": 3750,
     "Coste_px": 300,
     "Dias": 8,
     "Otros_requisitos": null,
     "Requisitos": {
      "Conjuros": [
       {
        "Id": 467,
        "Nombre": "Bola de fuego",
        "Opcional": 1
       },
       {
        "Id": 543,
        "Nombre": "Descarga flamígera",
        "Opcional": 1
       }
      ],
      "Dotes": [
       {
        "Id": 339,
        "Nombre": "Forjar anillo"
       }
      ]
     }
    },
    "Descripcion": "Refuerza los conjuros de fuego de quien lo lleva, haciéndolos más potentes de forma continua. Además, almacena cargas diarias que se pueden gastar para añadir daño de fuego al siguiente conjuro de fuego que se lance en el mismo turno, con más daño cuantas más cargas se empleen.",
    "Encantamientos": [],
    "Generico_conjuro": null,
    "Id": 48,
    "Inteligente": false,
    "Maldito": false,
    "Manual": {
     "Id": 7,
     "Nombre": "Compendio de objetos mágicos",
     "Pagina": 76
    },
    "Material": null,
    "Modificadores": [
     {
      "Caracteristica": null,
      "Condicion": "Gastando 1 carga: +2d6 de daño por fuego en el siguiente conjuro de fuego (2 cargas: +3d6; 3 cargas: +4d6)",
      "Habilidad": null,
      "Objetivo": {
       "Id": 3,
       "Nombre": "Daño"
      },
      "Tipo_bonificador": {
       "Apila": true,
       "Id": 19,
       "Nombre": "Sin tipo"
      },
      "Tipo_dano": {
       "Id": 11,
       "Nombre": "Fuego"
      },
      "Tipo_dano_comodin": null,
      "Valor": 2
     },
     {
      "Caracteristica": null,
      "Condicion": "Al lanzar conjuros con el descriptor fuego",
      "Habilidad": null,
      "Objetivo": {
       "Id": 15,
       "Nombre": "Nivel de lanzador"
      },
      "Tipo_bonificador": {
       "Apila": false,
       "Id": 4,
       "Nombre": "Capacidad"
      },
      "Tipo_dano": null,
      "Valor": 1
     }
    ],
    "Monstruo": null,
    "Nivel_lanzador": 9,
    "Nivel_objeto": 11,
    "Nombre": "Anillo de fuego místico",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": null,
    "Precio": 7500,
    "Ranura": {
     "Id": 9,
     "Nombre": "Anillo"
    },
    "Reliquia": false,
    "Requisitos_uso": null,
    "Tipo": {
     "Categoria": "magico",
     "Id": 13,
     "Nombre": "Anillo"
    },
    "Traducido": false,
    "Usos_por_dia": null
   },
   "id": 48,
   "nombre": "Anillo de fuego místico"
  }
 ]
};
