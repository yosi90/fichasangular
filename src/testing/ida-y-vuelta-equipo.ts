/**
 * La ida y vuelta de «Modificar arma» y «Modificar armadura» (hito 7 del roadmap de inserciones, 2026-10-31): respuestas
 * reales de `GET /armas/<id>` y `GET /armaduras/<id>` de `rol_dev` y, para cada una, el cuerpo con el que `PUT` devolvió
 * el mismo GET (la comprobación del backend con todas las armas y armaduras, en transacciones deshechas). Las pruebas de
 * `nuevo-equipo` comprueban que el formulario, cargado con el GET, manda ese mismo cuerpo.
 *
 * Generado desde la comprobación del backend; no se edita a mano.
 */
import type { IdaYVuelta } from './cuerpo-de-catalogo';

export const IDA_Y_VUELTA_EQUIPO: { armas: IdaYVuelta[]; armaduras: IdaYVuelta[]; } = {
 "armaduras": [
  {
   "cuerpo": {
    "armadura": {
     "bon_des": 8,
     "ca": 1,
     "correr_multiplicador": 4,
     "descripcion": "Armadura ligera de tela gruesa rellena, la más básica y barata. Apenas estorba el movimiento y ofrece una protección modesta.",
     "es_escudo": false,
     "fallo_arcano": 5,
     "id_manual": 54,
     "id_material": 13,
     "id_peso_armadura": 1,
     "id_tamano": 5,
     "id_tipo_escudo": null,
     "nombre": "Acolchada",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 123,
     "penalizador": 0,
     "peso": 10,
     "precio": 5,
     "tiempo_poner": null,
     "tiempo_poner_rapido": null,
     "tiempo_quitar": null,
     "traducido": false,
     "velocidad_20": 20,
     "velocidad_30": 30
    }
   },
   "get": {
    "Bon_des": 8,
    "Ca": 1,
    "Comodin": null,
    "Correr_multiplicador": 4,
    "Descripcion": "Armadura ligera de tela gruesa rellena, la más básica y barata. Apenas estorba el movimiento y ofrece una protección modesta.",
    "Es_escudo": false,
    "Fallo_arcano": 5,
    "Id": 1,
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 123
    },
    "Material": {
     "Id": 13,
     "Nombre": "Cuero"
    },
    "Nombre": "Acolchada",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Penalizador": 0,
    "Peso": 10,
    "Peso_armadura": {
     "Id": 1,
     "Nombre": "Ligera"
    },
    "Precio": 5,
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tiempo_poner": null,
    "Tiempo_poner_rapido": null,
    "Tiempo_quitar": null,
    "Tipo_escudo": null,
    "Traducido": false,
    "Velocidad_20": 20,
    "Velocidad_30": 30
   },
   "id": 1,
   "nombre": "Acolchada"
  },
  {
   "cuerpo": {
    "armadura": {
     "bon_des": null,
     "ca": 6,
     "correr_multiplicador": 3,
     "descripcion": "Armadura pesada de láminas metálicas horizontales unidas por correas. Muy protectora, pero impide casi por completo aprovechar la Destreza y entorpece mucho el movimiento.",
     "es_escudo": false,
     "fallo_arcano": 40,
     "id_manual": 54,
     "id_material": 4,
     "id_peso_armadura": 3,
     "id_tamano": 5,
     "id_tipo_escudo": null,
     "nombre": "Armadura laminada",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 123,
     "penalizador": -7,
     "peso": 45,
     "precio": 200,
     "tiempo_poner": null,
     "tiempo_poner_rapido": null,
     "tiempo_quitar": null,
     "traducido": false,
     "velocidad_20": 15,
     "velocidad_30": 20
    }
   },
   "get": {
    "Bon_des": null,
    "Ca": 6,
    "Comodin": null,
    "Correr_multiplicador": 3,
    "Descripcion": "Armadura pesada de láminas metálicas horizontales unidas por correas. Muy protectora, pero impide casi por completo aprovechar la Destreza y entorpece mucho el movimiento.",
    "Es_escudo": false,
    "Fallo_arcano": 40,
    "Id": 9,
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 123
    },
    "Material": {
     "Id": 4,
     "Nombre": "Acero"
    },
    "Nombre": "Armadura laminada",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Penalizador": -7,
    "Peso": 45,
    "Peso_armadura": {
     "Id": 3,
     "Nombre": "Pesada"
    },
    "Precio": 200,
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tiempo_poner": null,
    "Tiempo_poner_rapido": null,
    "Tiempo_quitar": null,
    "Tipo_escudo": null,
    "Traducido": false,
    "Velocidad_20": 15,
    "Velocidad_30": 20
   },
   "id": 9,
   "nombre": "Armadura laminada"
  },
  {
   "cuerpo": {
    "armadura": {
     "bon_des": 1,
     "ca": 8,
     "correr_multiplicador": 3,
     "descripcion": "La armadura más protectora, un conjunto de placas metálicas que cubre todo el cuerpo. Es carísima y exige entrenamiento y ayuda para ponérsela.",
     "es_escudo": false,
     "fallo_arcano": 35,
     "id_manual": 54,
     "id_material": 4,
     "id_peso_armadura": 3,
     "id_tamano": 5,
     "id_tipo_escudo": null,
     "nombre": "Armadura completa",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 123,
     "penalizador": -6,
     "peso": 50,
     "precio": 1500,
     "tiempo_poner": null,
     "tiempo_poner_rapido": null,
     "tiempo_quitar": null,
     "traducido": false,
     "velocidad_20": 15,
     "velocidad_30": 20
    }
   },
   "get": {
    "Bon_des": 1,
    "Ca": 8,
    "Comodin": null,
    "Correr_multiplicador": 3,
    "Descripcion": "La armadura más protectora, un conjunto de placas metálicas que cubre todo el cuerpo. Es carísima y exige entrenamiento y ayuda para ponérsela.",
    "Es_escudo": false,
    "Fallo_arcano": 35,
    "Id": 12,
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 123
    },
    "Material": {
     "Id": 4,
     "Nombre": "Acero"
    },
    "Nombre": "Armadura completa",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Penalizador": -6,
    "Peso": 50,
    "Peso_armadura": {
     "Id": 3,
     "Nombre": "Pesada"
    },
    "Precio": 1500,
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tiempo_poner": null,
    "Tiempo_poner_rapido": null,
    "Tiempo_quitar": null,
    "Tipo_escudo": null,
    "Traducido": false,
    "Velocidad_20": 15,
    "Velocidad_30": 20
   },
   "id": 12,
   "nombre": "Armadura completa"
  },
  {
   "cuerpo": {
    "armadura": {
     "bon_des": null,
     "ca": 1,
     "correr_multiplicador": null,
     "descripcion": "El broquel es un escudo diminuto que se ata al antebrazo, de modo que la mano de ese brazo queda libre para empuñar un arma, sostener un objeto o lanzar conjuros con mayor comodidad. A cambio de esa soltura, la protección que ofrece es escasa. Resulta una opción práctica para quien prioriza la movilidad y el uso de las manos sobre la defensa.",
     "es_escudo": true,
     "fallo_arcano": 5,
     "id_manual": 54,
     "id_material": 4,
     "id_peso_armadura": null,
     "id_tamano": 5,
     "id_tipo_escudo": 1,
     "nombre": "Rodela",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 123,
     "penalizador": -1,
     "peso": 5,
     "precio": 15,
     "tiempo_poner": null,
     "tiempo_poner_rapido": null,
     "tiempo_quitar": null,
     "traducido": false,
     "velocidad_20": null,
     "velocidad_30": null
    }
   },
   "get": {
    "Bon_des": null,
    "Ca": 1,
    "Comodin": null,
    "Correr_multiplicador": null,
    "Descripcion": "El broquel es un escudo diminuto que se ata al antebrazo, de modo que la mano de ese brazo queda libre para empuñar un arma, sostener un objeto o lanzar conjuros con mayor comodidad. A cambio de esa soltura, la protección que ofrece es escasa. Resulta una opción práctica para quien prioriza la movilidad y el uso de las manos sobre la defensa.",
    "Es_escudo": true,
    "Fallo_arcano": 5,
    "Id": 14,
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 123
    },
    "Material": {
     "Id": 4,
     "Nombre": "Acero"
    },
    "Nombre": "Rodela",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Penalizador": -1,
    "Peso": 5,
    "Peso_armadura": null,
    "Precio": 15,
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tiempo_poner": null,
    "Tiempo_poner_rapido": null,
    "Tiempo_quitar": null,
    "Tipo_escudo": {
     "Id": 1,
     "Nombre": "Broquel"
    },
    "Traducido": false,
    "Velocidad_20": null,
    "Velocidad_30": null
   },
   "id": 14,
   "nombre": "Rodela"
  },
  {
   "cuerpo": {
    "armadura": {
     "bon_des": 2,
     "ca": 4,
     "correr_multiplicador": null,
     "descripcion": "Enorme escudo que cubre casi todo el cuerpo y concede cobertura a quien se resguarda tras él. Es muy pesado y entorpece mucho al portador.",
     "es_escudo": true,
     "fallo_arcano": 50,
     "id_manual": 54,
     "id_material": 14,
     "id_peso_armadura": null,
     "id_tamano": 5,
     "id_tipo_escudo": 4,
     "nombre": "Escudo pavés",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 123,
     "penalizador": -10,
     "peso": 45,
     "precio": 30,
     "tiempo_poner": null,
     "tiempo_poner_rapido": null,
     "tiempo_quitar": null,
     "traducido": false,
     "velocidad_20": null,
     "velocidad_30": null
    }
   },
   "get": {
    "Bon_des": 2,
    "Ca": 4,
    "Comodin": null,
    "Correr_multiplicador": null,
    "Descripcion": "Enorme escudo que cubre casi todo el cuerpo y concede cobertura a quien se resguarda tras él. Es muy pesado y entorpece mucho al portador.",
    "Es_escudo": true,
    "Fallo_arcano": 50,
    "Id": 19,
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 123
    },
    "Material": {
     "Id": 14,
     "Nombre": "Madera"
    },
    "Nombre": "Escudo pavés",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Penalizador": -10,
    "Peso": 45,
    "Peso_armadura": null,
    "Precio": 30,
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tiempo_poner": null,
    "Tiempo_poner_rapido": null,
    "Tiempo_quitar": null,
    "Tipo_escudo": {
     "Id": 4,
     "Nombre": "Pavés"
    },
    "Traducido": false,
    "Velocidad_20": null,
    "Velocidad_30": null
   },
   "id": 19,
   "nombre": "Escudo pavés"
  },
  {
   "cuerpo": {
    "armadura": {
     "bon_des": 7,
     "ca": 2,
     "correr_multiplicador": null,
     "descripcion": "Armadura ligera confeccionada con hojas de árboles de madera broncínea, que un tratamiento alquímico endurece hasta igualar la resistencia del cuero sin perder su flexibilidad. Resulta mucho más liviana y cómoda de llevar que la mayoría de armaduras de su categoría.",
     "es_escudo": false,
     "fallo_arcano": 5,
     "id_manual": 19,
     "id_material": null,
     "id_peso_armadura": 1,
     "id_tamano": 5,
     "id_tipo_escudo": null,
     "nombre": "Tejido foliar",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 120,
     "penalizador": 0,
     "peso": 15,
     "precio": 750,
     "tiempo_poner": null,
     "tiempo_poner_rapido": null,
     "tiempo_quitar": null,
     "traducido": false,
     "velocidad_20": 20,
     "velocidad_30": 30
    }
   },
   "get": {
    "Bon_des": 7,
    "Ca": 2,
    "Comodin": null,
    "Correr_multiplicador": null,
    "Descripcion": "Armadura ligera confeccionada con hojas de árboles de madera broncínea, que un tratamiento alquímico endurece hasta igualar la resistencia del cuero sin perder su flexibilidad. Resulta mucho más liviana y cómoda de llevar que la mayoría de armaduras de su categoría.",
    "Es_escudo": false,
    "Fallo_arcano": 5,
    "Id": 41,
    "Manual": {
     "Id": 19,
     "Nombre": "Escenario de campaña (Eberron)",
     "Pagina": 120
    },
    "Material": null,
    "Nombre": "Tejido foliar",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Penalizador": 0,
    "Peso": 15,
    "Peso_armadura": {
     "Id": 1,
     "Nombre": "Ligera"
    },
    "Precio": 750,
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tiempo_poner": null,
    "Tiempo_poner_rapido": null,
    "Tiempo_quitar": null,
    "Tipo_escudo": null,
    "Traducido": false,
    "Velocidad_20": 20,
    "Velocidad_30": 30
   },
   "id": 41,
   "nombre": "Tejido foliar"
  },
  {
   "cuerpo": {
    "armadura": {
     "bon_des": null,
     "ca": 2,
     "correr_multiplicador": null,
     "descripcion": "El Broquel-escarabajo es un escudo ligero de tipo broquel, pensado para quien necesita una protección discreta sin cargar con demasiado peso. Aporta una mejora modesta a la clase de armadura, aunque impone un pequeño penalizador a las pruebas con armadura y un ligero riesgo de fallo en los conjuros arcanos. Se maneja como cualquier otro broquel y deja la mano casi libre para otras acciones.",
     "es_escudo": true,
     "fallo_arcano": 5,
     "id_manual": 22,
     "id_material": null,
     "id_peso_armadura": null,
     "id_tamano": 5,
     "id_tipo_escudo": 1,
     "nombre": "Broquel-escarabajo",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 14,
     "penalizador": -1,
     "peso": 5,
     "precio": 6600,
     "tiempo_poner": null,
     "tiempo_poner_rapido": null,
     "tiempo_quitar": null,
     "traducido": false,
     "velocidad_20": null,
     "velocidad_30": null
    }
   },
   "get": {
    "Bon_des": null,
    "Ca": 2,
    "Comodin": null,
    "Correr_multiplicador": null,
    "Descripcion": "El Broquel-escarabajo es un escudo ligero de tipo broquel, pensado para quien necesita una protección discreta sin cargar con demasiado peso. Aporta una mejora modesta a la clase de armadura, aunque impone un pequeño penalizador a las pruebas con armadura y un ligero riesgo de fallo en los conjuros arcanos. Se maneja como cualquier otro broquel y deja la mano casi libre para otras acciones.",
    "Es_escudo": true,
    "Fallo_arcano": 5,
    "Id": 47,
    "Manual": {
     "Id": 22,
     "Nombre": "Guia de armas y equipos",
     "Pagina": 14
    },
    "Material": null,
    "Nombre": "Broquel-escarabajo",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Penalizador": -1,
    "Peso": 5,
    "Peso_armadura": null,
    "Precio": 6600,
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tiempo_poner": null,
    "Tiempo_poner_rapido": null,
    "Tiempo_quitar": null,
    "Tipo_escudo": {
     "Id": 1,
     "Nombre": "Broquel"
    },
    "Traducido": false,
    "Velocidad_20": null,
    "Velocidad_30": null
   },
   "id": 47,
   "nombre": "Broquel-escarabajo"
  }
 ],
 "armas": [
  {
   "cuerpo": {
    "arma": {
     "a_distancia": false,
     "alcance": null,
     "arrojadiza": false,
     "critico_multiplicador": null,
     "critico_multiplicador_2": null,
     "critico_rango": null,
     "dano_mediano": null,
     "dano_pequeno": null,
     "descripcion": "",
     "doble": false,
     "id_manejo": 1,
     "id_manual": 54,
     "id_material": 15,
     "id_municion": null,
     "id_tamano": 0,
     "id_tipo_arma": 4,
     "id_tipo_dano": 0,
     "incremento_distancia": 0,
     "indice_fuerza_coste": null,
     "nombre": "Presa",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 0,
     "peso": 0,
     "precio": 0,
     "traducido": false
    },
    "propiedades": []
   },
   "get": {
    "A_distancia": false,
    "Alcance": null,
    "Arrojadiza": false,
    "Comodin": null,
    "Critico": null,
    "Critico_multiplicador": null,
    "Critico_multiplicador_2": null,
    "Critico_rango": null,
    "Dano": null,
    "Dano_mediano": null,
    "Dano_pequeno": null,
    "Descripcion": "",
    "Doble": false,
    "Id": 2,
    "Incremento_distancia": 0,
    "Indice_fuerza_coste": null,
    "Manejo": {
     "Id": 1,
     "Nombre": "Sin armas"
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 0
    },
    "Material": {
     "Id": 15,
     "Nombre": "Especial"
    },
    "Municion": null,
    "Nombre": "Presa",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 0,
    "Precio": 0,
    "Propiedades": [],
    "Tamano": {
     "Id": 0,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Depende"
    },
    "Tipo_arma": {
     "Id": 4,
     "Nombre": "Especial"
    },
    "Tipo_dano": {
     "Id": 0,
     "Nombre": "Elegir"
    },
    "Tipo_dano_comodin": "elegir",
    "Traducido": false
   },
   "id": 2,
   "nombre": "Presa"
  },
  {
   "cuerpo": {
    "arma": {
     "a_distancia": false,
     "alcance": null,
     "arrojadiza": false,
     "critico_multiplicador": 2,
     "critico_multiplicador_2": null,
     "critico_rango": 19,
     "dano_mediano": "1d8",
     "dano_pequeno": "1d6",
     "descripcion": "Espada de una mano clásica y equilibrada, de hoja recta con buen alcance de amenaza de crítico. Es una de las armas marciales más versátiles y comunes.",
     "doble": false,
     "id_manejo": 3,
     "id_manual": 54,
     "id_material": 1,
     "id_municion": null,
     "id_tamano": 5,
     "id_tipo_arma": 2,
     "id_tipo_dano": 3,
     "incremento_distancia": 0,
     "indice_fuerza_coste": null,
     "nombre": "Espada larga",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 116,
     "peso": 4,
     "precio": 15,
     "traducido": false
    },
    "propiedades": []
   },
   "get": {
    "A_distancia": false,
    "Alcance": null,
    "Arrojadiza": false,
    "Comodin": null,
    "Critico": "19-20/x2",
    "Critico_multiplicador": 2,
    "Critico_multiplicador_2": null,
    "Critico_rango": 19,
    "Dano": "1d8",
    "Dano_mediano": "1d8",
    "Dano_pequeno": "1d6",
    "Descripcion": "Espada de una mano clásica y equilibrada, de hoja recta con buen alcance de amenaza de crítico. Es una de las armas marciales más versátiles y comunes.",
    "Doble": false,
    "Id": 30,
    "Incremento_distancia": 0,
    "Indice_fuerza_coste": null,
    "Manejo": {
     "Id": 3,
     "Nombre": "A una mano"
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 116
    },
    "Material": {
     "Id": 1,
     "Nombre": "Hierro"
    },
    "Municion": null,
    "Nombre": "Espada larga",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 4,
    "Precio": 15,
    "Propiedades": [],
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tipo_arma": {
     "Id": 2,
     "Nombre": "Marcial"
    },
    "Tipo_dano": {
     "Id": 3,
     "Nombre": "Cortante"
    },
    "Tipo_dano_comodin": null,
    "Traducido": false
   },
   "id": 30,
   "nombre": "Espada larga"
  },
  {
   "cuerpo": {
    "arma": {
     "a_distancia": true,
     "alcance": null,
     "arrojadiza": false,
     "critico_multiplicador": 3,
     "critico_multiplicador_2": null,
     "critico_rango": 20,
     "dano_mediano": "1d6",
     "dano_pequeno": "1d4",
     "descripcion": "Arco corto reforzado con capas de materiales que le dan más alcance. Dispara flechas.",
     "doble": false,
     "id_manejo": 4,
     "id_manual": 54,
     "id_material": 1,
     "id_municion": 1,
     "id_tamano": 5,
     "id_tipo_arma": 2,
     "id_tipo_dano": 2,
     "incremento_distancia": 70,
     "indice_fuerza_coste": 75,
     "nombre": "Arco corto compuesto",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 117,
     "peso": 2,
     "precio": 75,
     "traducido": false
    },
    "propiedades": []
   },
   "get": {
    "A_distancia": true,
    "Alcance": null,
    "Arrojadiza": false,
    "Comodin": null,
    "Critico": "x3",
    "Critico_multiplicador": 3,
    "Critico_multiplicador_2": null,
    "Critico_rango": 20,
    "Dano": "1d6",
    "Dano_mediano": "1d6",
    "Dano_pequeno": "1d4",
    "Descripcion": "Arco corto reforzado con capas de materiales que le dan más alcance. Dispara flechas.",
    "Doble": false,
    "Id": 49,
    "Incremento_distancia": 70,
    "Indice_fuerza_coste": 75,
    "Manejo": {
     "Id": 4,
     "Nombre": "A dos manos"
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 117
    },
    "Material": {
     "Id": 1,
     "Nombre": "Hierro"
    },
    "Municion": {
     "Id": 1,
     "Nombre": "Flechas"
    },
    "Nombre": "Arco corto compuesto",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 2,
    "Precio": 75,
    "Propiedades": [],
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tipo_arma": {
     "Id": 2,
     "Nombre": "Marcial"
    },
    "Tipo_dano": {
     "Id": 2,
     "Nombre": "Perforante"
    },
    "Tipo_dano_comodin": null,
    "Traducido": false
   },
   "id": 49,
   "nombre": "Arco corto compuesto"
  },
  {
   "cuerpo": {
    "arma": {
     "a_distancia": false,
     "alcance": 15,
     "arrojadiza": false,
     "critico_multiplicador": 2,
     "critico_multiplicador_2": null,
     "critico_rango": 20,
     "dano_mediano": "1d3",
     "dano_pequeno": "1d2",
     "descripcion": "Larga tira flexible que restalla con alcance, pensada para enredar o castigar más que para herir de gravedad. Su daño es atenuado.",
     "doble": false,
     "id_manejo": 3,
     "id_manual": 54,
     "id_material": 1,
     "id_municion": null,
     "id_tamano": 5,
     "id_tipo_arma": 3,
     "id_tipo_dano": 3,
     "incremento_distancia": 0,
     "indice_fuerza_coste": null,
     "nombre": "Látigo",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 117,
     "peso": 2,
     "precio": 1,
     "traducido": false
    },
    "propiedades": [
     {
      "id_propiedad": 1,
      "valor": null
     },
     {
      "id_propiedad": 2,
      "valor": null
     },
     {
      "id_propiedad": 4,
      "valor": null
     },
     {
      "id_propiedad": 11,
      "valor": null
     }
    ]
   },
   "get": {
    "A_distancia": false,
    "Alcance": 15,
    "Arrojadiza": false,
    "Comodin": null,
    "Critico": "x2",
    "Critico_multiplicador": 2,
    "Critico_multiplicador_2": null,
    "Critico_rango": 20,
    "Dano": "1d3",
    "Dano_mediano": "1d3",
    "Dano_pequeno": "1d2",
    "Descripcion": "Larga tira flexible que restalla con alcance, pensada para enredar o castigar más que para herir de gravedad. Su daño es atenuado.",
    "Doble": false,
    "Id": 58,
    "Incremento_distancia": 0,
    "Indice_fuerza_coste": null,
    "Manejo": {
     "Id": 3,
     "Nombre": "A una mano"
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 117
    },
    "Material": {
     "Id": 1,
     "Nombre": "Hierro"
    },
    "Municion": null,
    "Nombre": "Látigo",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 2,
    "Precio": 1,
    "Propiedades": [
     {
      "Descripcion": "Se puede usar para hacer ataques de derribo; si el intento falla, puedes soltar el arma para no ser derribado.",
      "Id": 1,
      "Nombre": "Derribo",
      "Valor": null
     },
     {
      "Descripcion": "Bonificador a las tiradas enfrentadas para desarmar (también para no ser desarmado); el valor es el bonificador.",
      "Id": 2,
      "Nombre": "Desarmar",
      "Valor": null
     },
     {
      "Descripcion": "Hace daño no letal.",
      "Id": 4,
      "Nombre": "Daño no letal",
      "Valor": null
     },
     {
      "Descripcion": "Se lanza para enredar al objetivo con un ataque de toque a distancia.",
      "Id": 11,
      "Nombre": "Enredar",
      "Valor": null
     }
    ],
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tipo_arma": {
     "Id": 3,
     "Nombre": "Exótica"
    },
    "Tipo_dano": {
     "Id": 3,
     "Nombre": "Cortante"
    },
    "Tipo_dano_comodin": null,
    "Traducido": false
   },
   "id": 58,
   "nombre": "Látigo"
  },
  {
   "cuerpo": {
    "arma": {
     "a_distancia": false,
     "alcance": null,
     "arrojadiza": false,
     "critico_multiplicador": 2,
     "critico_multiplicador_2": 2,
     "critico_rango": 20,
     "dano_mediano": "1d8/1d8",
     "dano_pequeno": "1d6/1d6",
     "descripcion": "Arma doble con una cabeza de mangual en cada extremo del mango. Permite atacar con ambos lados como con dos armas.",
     "doble": true,
     "id_manejo": 4,
     "id_manual": 54,
     "id_material": 1,
     "id_municion": null,
     "id_tamano": 5,
     "id_tipo_arma": 3,
     "id_tipo_dano": 1,
     "incremento_distancia": 0,
     "indice_fuerza_coste": null,
     "nombre": "Mangual doble",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 117,
     "peso": 10,
     "precio": 90,
     "traducido": false
    },
    "propiedades": [
     {
      "id_propiedad": 1,
      "valor": null
     },
     {
      "id_propiedad": 2,
      "valor": 2
     }
    ]
   },
   "get": {
    "A_distancia": false,
    "Alcance": null,
    "Arrojadiza": false,
    "Comodin": null,
    "Critico": "x2/x2",
    "Critico_multiplicador": 2,
    "Critico_multiplicador_2": 2,
    "Critico_rango": 20,
    "Dano": "1d8/1d8",
    "Dano_mediano": "1d8/1d8",
    "Dano_pequeno": "1d6/1d6",
    "Descripcion": "Arma doble con una cabeza de mangual en cada extremo del mango. Permite atacar con ambos lados como con dos armas.",
    "Doble": true,
    "Id": 62,
    "Incremento_distancia": 0,
    "Indice_fuerza_coste": null,
    "Manejo": {
     "Id": 4,
     "Nombre": "A dos manos"
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 117
    },
    "Material": {
     "Id": 1,
     "Nombre": "Hierro"
    },
    "Municion": null,
    "Nombre": "Mangual doble",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 10,
    "Precio": 90,
    "Propiedades": [
     {
      "Descripcion": "Se puede usar para hacer ataques de derribo; si el intento falla, puedes soltar el arma para no ser derribado.",
      "Id": 1,
      "Nombre": "Derribo",
      "Valor": null
     },
     {
      "Descripcion": "Bonificador a las tiradas enfrentadas para desarmar (también para no ser desarmado); el valor es el bonificador.",
      "Id": 2,
      "Nombre": "Desarmar",
      "Valor": 2
     }
    ],
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tipo_arma": {
     "Id": 3,
     "Nombre": "Exótica"
    },
    "Tipo_dano": {
     "Id": 1,
     "Nombre": "Contundente"
    },
    "Tipo_dano_comodin": null,
    "Traducido": false
   },
   "id": 62,
   "nombre": "Mangual doble"
  },
  {
   "cuerpo": {
    "arma": {
     "a_distancia": false,
     "alcance": null,
     "arrojadiza": false,
     "critico_multiplicador": 3,
     "critico_multiplicador_2": 3,
     "critico_rango": 20,
     "dano_mediano": "1d8/1d6",
     "dano_pequeno": "1d6/1d4",
     "descripcion": "Arma doble enana con un hacha en un extremo y una lanza en el otro. Permite elegir entre cortar o perforar según la cabeza que se use.",
     "doble": true,
     "id_manejo": 4,
     "id_manual": 54,
     "id_material": 1,
     "id_municion": null,
     "id_tamano": 5,
     "id_tipo_arma": 3,
     "id_tipo_dano": 4,
     "incremento_distancia": 0,
     "indice_fuerza_coste": null,
     "nombre": "Urgrosh enano",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 117,
     "peso": 12,
     "precio": 50,
     "traducido": false
    },
    "propiedades": []
   },
   "get": {
    "A_distancia": false,
    "Alcance": null,
    "Arrojadiza": false,
    "Comodin": null,
    "Critico": "x3/x3",
    "Critico_multiplicador": 3,
    "Critico_multiplicador_2": 3,
    "Critico_rango": 20,
    "Dano": "1d8/1d6",
    "Dano_mediano": "1d8/1d6",
    "Dano_pequeno": "1d6/1d4",
    "Descripcion": "Arma doble enana con un hacha en un extremo y una lanza en el otro. Permite elegir entre cortar o perforar según la cabeza que se use.",
    "Doble": true,
    "Id": 64,
    "Incremento_distancia": 0,
    "Indice_fuerza_coste": null,
    "Manejo": {
     "Id": 4,
     "Nombre": "A dos manos"
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 117
    },
    "Material": {
     "Id": 1,
     "Nombre": "Hierro"
    },
    "Municion": null,
    "Nombre": "Urgrosh enano",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 12,
    "Precio": 50,
    "Propiedades": [],
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tipo_arma": {
     "Id": 3,
     "Nombre": "Exótica"
    },
    "Tipo_dano": {
     "Id": 4,
     "Nombre": "Cortante o perforante"
    },
    "Tipo_dano_comodin": null,
    "Traducido": false
   },
   "id": 64,
   "nombre": "Urgrosh enano"
  },
  {
   "cuerpo": {
    "arma": {
     "a_distancia": true,
     "alcance": 10,
     "arrojadiza": true,
     "critico_multiplicador": null,
     "critico_multiplicador_2": null,
     "critico_rango": null,
     "dano_mediano": null,
     "dano_pequeno": null,
     "descripcion": "Red lanzable para inmovilizar o enredar a un objetivo cercano. No causa daño por sí misma.",
     "doble": false,
     "id_manejo": 3,
     "id_manual": 54,
     "id_material": 1,
     "id_municion": null,
     "id_tamano": 5,
     "id_tipo_arma": 3,
     "id_tipo_dano": 1,
     "incremento_distancia": 10,
     "indice_fuerza_coste": null,
     "nombre": "Red",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 117,
     "peso": 6,
     "precio": 20,
     "traducido": false
    },
    "propiedades": [
     {
      "id_propiedad": 11,
      "valor": null
     }
    ]
   },
   "get": {
    "A_distancia": true,
    "Alcance": 10,
    "Arrojadiza": true,
    "Comodin": null,
    "Critico": null,
    "Critico_multiplicador": null,
    "Critico_multiplicador_2": null,
    "Critico_rango": null,
    "Dano": null,
    "Dano_mediano": null,
    "Dano_pequeno": null,
    "Descripcion": "Red lanzable para inmovilizar o enredar a un objetivo cercano. No causa daño por sí misma.",
    "Doble": false,
    "Id": 69,
    "Incremento_distancia": 10,
    "Indice_fuerza_coste": null,
    "Manejo": {
     "Id": 3,
     "Nombre": "A una mano"
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 117
    },
    "Material": {
     "Id": 1,
     "Nombre": "Hierro"
    },
    "Municion": null,
    "Nombre": "Red",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 6,
    "Precio": 20,
    "Propiedades": [
     {
      "Descripcion": "Se lanza para enredar al objetivo con un ataque de toque a distancia.",
      "Id": 11,
      "Nombre": "Enredar",
      "Valor": null
     }
    ],
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tipo_arma": {
     "Id": 3,
     "Nombre": "Exótica"
    },
    "Tipo_dano": {
     "Id": 1,
     "Nombre": "Contundente"
    },
    "Tipo_dano_comodin": null,
    "Traducido": false
   },
   "id": 69,
   "nombre": "Red"
  },
  {
   "cuerpo": {
    "arma": {
     "a_distancia": true,
     "alcance": null,
     "arrojadiza": true,
     "critico_multiplicador": 2,
     "critico_multiplicador_2": null,
     "critico_rango": 20,
     "dano_mediano": "1d2",
     "dano_pequeno": null,
     "descripcion": "Estrellas metálicas de lanzamiento, ligeras y fáciles de ocultar. Se venden en lotes de cinco.",
     "doble": false,
     "id_manejo": 2,
     "id_manual": 54,
     "id_material": 1,
     "id_municion": null,
     "id_tamano": 5,
     "id_tipo_arma": 3,
     "id_tipo_dano": 2,
     "incremento_distancia": 10,
     "indice_fuerza_coste": null,
     "nombre": "Shuriken",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 117,
     "peso": 0.5,
     "precio": 1,
     "traducido": false
    },
    "propiedades": [
     {
      "id_propiedad": 5,
      "valor": null
     }
    ]
   },
   "get": {
    "A_distancia": true,
    "Alcance": null,
    "Arrojadiza": true,
    "Comodin": null,
    "Critico": "x2",
    "Critico_multiplicador": 2,
    "Critico_multiplicador_2": null,
    "Critico_rango": 20,
    "Dano": "1d2",
    "Dano_mediano": "1d2",
    "Dano_pequeno": null,
    "Descripcion": "Estrellas metálicas de lanzamiento, ligeras y fáciles de ocultar. Se venden en lotes de cinco.",
    "Doble": false,
    "Id": 70,
    "Incremento_distancia": 10,
    "Indice_fuerza_coste": null,
    "Manejo": {
     "Id": 2,
     "Nombre": "Ligera"
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 117
    },
    "Material": {
     "Id": 1,
     "Nombre": "Hierro"
    },
    "Municion": null,
    "Nombre": "Shuriken",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 0.5,
    "Precio": 1,
    "Propiedades": [
     {
      "Descripcion": "El monje puede usarla en una ráfaga de golpes.",
      "Id": 5,
      "Nombre": "Arma especial de monje",
      "Valor": null
     }
    ],
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tipo_arma": {
     "Id": 3,
     "Nombre": "Exótica"
    },
    "Tipo_dano": {
     "Id": 2,
     "Nombre": "Perforante"
    },
    "Tipo_dano_comodin": null,
    "Traducido": false
   },
   "id": 70,
   "nombre": "Shuriken"
  },
  {
   "cuerpo": {
    "arma": {
     "a_distancia": true,
     "alcance": null,
     "arrojadiza": false,
     "critico_multiplicador": 2,
     "critico_multiplicador_2": null,
     "critico_rango": 20,
     "dano_mediano": "1",
     "dano_pequeno": "1",
     "descripcion": "Tubo largo por el que se sopla para lanzar dardos pequeños a cierta distancia. Es un arma sencilla a distancia que se maneja con una mano y hace un daño mínimo, por lo que se suele combinar con dardos envenenados.",
     "doble": false,
     "id_manejo": 3,
     "id_manual": 24,
     "id_material": null,
     "id_municion": 26,
     "id_tamano": 5,
     "id_tipo_arma": 1,
     "id_tipo_dano": 2,
     "incremento_distancia": 10,
     "indice_fuerza_coste": null,
     "nombre": "Cerbatana",
     "nombre_original": null,
     "oficial": true,
     "origen_descripcion": "propia",
     "pagina": 144,
     "peso": 2,
     "precio": 1,
     "traducido": false
    },
    "propiedades": []
   },
   "get": {
    "A_distancia": true,
    "Alcance": null,
    "Arrojadiza": false,
    "Comodin": null,
    "Critico": "x2",
    "Critico_multiplicador": 2,
    "Critico_multiplicador_2": null,
    "Critico_rango": 20,
    "Dano": "1",
    "Dano_mediano": "1",
    "Dano_pequeno": "1",
    "Descripcion": "Tubo largo por el que se sopla para lanzar dardos pequeños a cierta distancia. Es un arma sencilla a distancia que se maneja con una mano y hace un daño mínimo, por lo que se suele combinar con dardos envenenados.",
    "Doble": false,
    "Id": 125,
    "Incremento_distancia": 10,
    "Indice_fuerza_coste": null,
    "Manejo": {
     "Id": 3,
     "Nombre": "A una mano"
    },
    "Manual": {
     "Id": 24,
     "Nombre": "Guia del dungeon master 1",
     "Pagina": 144
    },
    "Material": null,
    "Municion": {
     "Id": 26,
     "Nombre": "Dardos de cerbatana"
    },
    "Nombre": "Cerbatana",
    "Nombre_original": null,
    "Oficial": true,
    "Origen_descripcion": "propia",
    "Peso": 2,
    "Precio": 1,
    "Propiedades": [],
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tipo_arma": {
     "Id": 1,
     "Nombre": "Sencilla"
    },
    "Tipo_dano": {
     "Id": 2,
     "Nombre": "Perforante"
    },
    "Tipo_dano_comodin": null,
    "Traducido": false
   },
   "id": 125,
   "nombre": "Cerbatana"
  },
  {
   "cuerpo": {
    "arma": {
     "a_distancia": true,
     "alcance": null,
     "arrojadiza": false,
     "critico_multiplicador": 3,
     "critico_multiplicador_2": null,
     "critico_rango": 20,
     "dano_mediano": "2d6",
     "dano_pequeno": "1d10",
     "descripcion": "Arma de vapor de una mano con un cargador de 2 perdigones. Las armas de vapor son un invento de los magiingenieros humanos: una pequeña explosión de vapor dispara perdigones de adamantita, y por eso el arma también es de adamantita (alguna, de madera oscura). Llenar el cargador con perdigones de la bolsa es una acción de asalto completo (de movimiento con la dote Recarga de vapor). Más allá de su incremento de distancia sufre -2 al ataque y al daño por cada 5' de más (no -2 por incremento, como las demás armas a distancia).",
     "doble": false,
     "id_manejo": 3,
     "id_manual": 65,
     "id_material": 7,
     "id_municion": 67,
     "id_tamano": 5,
     "id_tipo_arma": 3,
     "id_tipo_dano": 2,
     "incremento_distancia": 30,
     "indice_fuerza_coste": null,
     "nombre": "Pistola de vapor",
     "nombre_original": null,
     "oficial": false,
     "origen_descripcion": "propia",
     "pagina": 60,
     "peso": 3,
     "precio": 250,
     "traducido": false
    },
    "propiedades": []
   },
   "get": {
    "A_distancia": true,
    "Alcance": null,
    "Arrojadiza": false,
    "Comodin": null,
    "Critico": "x3",
    "Critico_multiplicador": 3,
    "Critico_multiplicador_2": null,
    "Critico_rango": 20,
    "Dano": "2d6",
    "Dano_mediano": "2d6",
    "Dano_pequeno": "1d10",
    "Descripcion": "Arma de vapor de una mano con un cargador de 2 perdigones. Las armas de vapor son un invento de los magiingenieros humanos: una pequeña explosión de vapor dispara perdigones de adamantita, y por eso el arma también es de adamantita (alguna, de madera oscura). Llenar el cargador con perdigones de la bolsa es una acción de asalto completo (de movimiento con la dote Recarga de vapor). Más allá de su incremento de distancia sufre -2 al ataque y al daño por cada 5' de más (no -2 por incremento, como las demás armas a distancia).",
    "Doble": false,
    "Id": 189,
    "Incremento_distancia": 30,
    "Indice_fuerza_coste": null,
    "Manejo": {
     "Id": 3,
     "Nombre": "A una mano"
    },
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 60
    },
    "Material": {
     "Id": 7,
     "Nombre": "Adamantita"
    },
    "Municion": {
     "Id": 67,
     "Nombre": "Perdigones"
    },
    "Nombre": "Pistola de vapor",
    "Nombre_original": null,
    "Oficial": false,
    "Origen_descripcion": "propia",
    "Peso": 3,
    "Precio": 250,
    "Propiedades": [],
    "Tamano": {
     "Id": 5,
     "Modificador": 0,
     "Modificador_presa": 0,
     "Nombre": "Mediano"
    },
    "Tipo_arma": {
     "Id": 3,
     "Nombre": "Exótica"
    },
    "Tipo_dano": {
     "Id": 2,
     "Nombre": "Perforante"
    },
    "Tipo_dano_comodin": null,
    "Traducido": false
   },
   "id": 189,
   "nombre": "Pistola de vapor"
  }
 ]
};
