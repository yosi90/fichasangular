/**
 * La ida y vuelta de «Modificar tipo de criatura», «… subtipo», «… deidad» y «… manual» (hito 9 del roadmap de
 * inserciones, 2026-11-05): las respuestas reales de `GET /tiposCriatura/<id>`, `/subtipos/<id>`, `/deidades/<id>` y
 * `/manuales/<id>` de **todas** las entradas de `rol_dev` y, para cada una, el cuerpo con el que `PUT` (las banderas del
 * `PATCH`, en los manuales) devolvió el mismo GET (la comprobación del backend, en transacciones deshechas). Las pruebas de
 * cada formulario comprueban que, cargado con el GET, manda ese mismo cuerpo.
 *
 * Generado desde la comprobación del backend; no se edita a mano.
 */
import type { IdaYVuelta } from './cuerpo-de-catalogo';

export const IDA_Y_VUELTA_CRIATURAS_MUNDO: {
    tipos: IdaYVuelta[]; deidades: IdaYVuelta[]; subtipos: IdaYVuelta[]; manuales: IdaYVuelta[];
} = {
 "deidades": [
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     1,
     2
    ],
    "deidad": {
     "descripcion": "El gran dragón de platino, símbolo de la justicia y la nobleza. Bahamut observa el mundo mortal con paciencia infinita, interviniendo solo cuando el mal amenaza con romper el equilibrio.",
     "id_alineamiento": 4,
     "id_arma": 73,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Bahamut",
     "oficial": true,
     "pagina": 58
    },
    "dominios": [
     2,
     5,
     27,
     32
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 4,
     "Id_basico": 1,
     "Nombre": "Legal bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 1,
      "Nombre": "Dragones buenos"
     },
     {
      "Id": 2,
      "Nombre": "Viento"
     }
    ],
    "Arma": {
     "Id": 73,
     "Nombre": "Garra"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "El gran dragón de platino, símbolo de la justicia y la nobleza. Bahamut observa el mundo mortal con paciencia infinita, interviniendo solo cuando el mal amenaza con romper el equilibrio.",
    "Dominios": [
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 1,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 58
    },
    "Nombre": "Bahamut",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 1,
   "nombre": "Bahamut"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     3,
     4,
     5,
     6
    ],
    "deidad": {
     "descripcion": "El dios de la magia pura, distante y desapegado. Boccob no juzga el uso del poder arcano; simplemente existe como su guardián, observando sin intervenir.",
     "id_alineamiento": 8,
     "id_arma": 14,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Boccob",
     "oficial": true,
     "pagina": 60
    },
    "dominios": [
     22,
     29,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 3,
      "Nombre": "Magia"
     },
     {
      "Id": 4,
      "Nombre": "Conocimiento arcano"
     },
     {
      "Id": 5,
      "Nombre": "Prudencia"
     },
     {
      "Id": 6,
      "Nombre": "Equilibrio"
     }
    ],
    "Arma": {
     "Id": 14,
     "Nombre": "Bastón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "El dios de la magia pura, distante y desapegado. Boccob no juzga el uso del poder arcano; simplemente existe como su guardián, observando sin intervenir.",
    "Dominios": [
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 2,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 60
    },
    "Nombre": "Boccob",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 2,
   "nombre": "Boccob"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     3,
     7,
     9,
     10,
     11
    ],
    "deidad": {
     "descripcion": "El eterno patrón de los elfos, artista y guerrero divino. Corellon encarna la gracia, la magia y la eterna lucha contra las fuerzas que buscan corromper la belleza.",
     "id_alineamiento": 10,
     "id_arma": 30,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Corellon Larethian",
     "oficial": true,
     "pagina": 62
    },
    "dominios": [
     5,
     6,
     18,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 3,
      "Nombre": "Magia"
     },
     {
      "Id": 7,
      "Nombre": "Elfos"
     },
     {
      "Id": 9,
      "Nombre": "Artes y oficios"
     },
     {
      "Id": 10,
      "Nombre": "Música"
     },
     {
      "Id": 11,
      "Nombre": "Guerra"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "El eterno patrón de los elfos, artista y guerrero divino. Corellon encarna la gracia, la magia y la eterna lucha contra las fuerzas que buscan corromper la belleza.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 3,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 62
    },
    "Nombre": "Corellon Larethian",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 3,
   "nombre": "Corellon Larethian"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     12,
     13,
     14,
     15
    ],
    "deidad": {
     "descripcion": "Guardiana de los bosques y de la vida salvaje, Ehlonna protege todo lo que crece libre bajo el sol. Su ira es tan silenciosa como letal para quienes dañan la naturaleza.",
     "id_alineamiento": 7,
     "id_arma": 30,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Ehlonna",
     "oficial": true,
     "pagina": 64
    },
    "dominios": [
     3,
     5,
     31,
     35
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 12,
      "Nombre": "Bosques"
     },
     {
      "Id": 13,
      "Nombre": "Selvas"
     },
     {
      "Id": 14,
      "Nombre": "Flora y fauna"
     },
     {
      "Id": 15,
      "Nombre": "Fertilidad"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Guardiana de los bosques y de la vida salvaje, Ehlonna protege todo lo que crece libre bajo el sol. Su ira es tan silenciosa como letal para quienes dañan la naturaleza.",
    "Dominios": [
     {
      "Id": 3,
      "Nombre": "Animal",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 31,
      "Nombre": "Sol",
      "Oficial": true
     },
     {
      "Id": 35,
      "Nombre": "Vegetal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 4,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 64
    },
    "Nombre": "Ehlonna",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 4,
   "nombre": "Ehlonna"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     16,
     17,
     18,
     19,
     20,
     21
    ],
    "deidad": {
     "descripcion": "Dios del odio, la violencia y la destrucción sin sentido. Erythnul no busca conquista ni orden: solo sangre, caos y el placer de la matanza.",
     "id_alineamiento": 12,
     "id_arma": 11,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Erythnul",
     "oficial": true,
     "pagina": 66
    },
    "dominios": [
     6,
     18,
     23,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 12,
     "Id_basico": 9,
     "Nombre": "Caótico maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 16,
      "Nombre": "Odio"
     },
     {
      "Id": 17,
      "Nombre": "Envidia"
     },
     {
      "Id": 18,
      "Nombre": "Malicia"
     },
     {
      "Id": 19,
      "Nombre": "Pánico"
     },
     {
      "Id": 20,
      "Nombre": "Ferocidad"
     },
     {
      "Id": 21,
      "Nombre": "Matanza"
     }
    ],
    "Arma": {
     "Id": 11,
     "Nombre": "Maza de armas"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Dios del odio, la violencia y la destrucción sin sentido. Erythnul no busca conquista ni orden: solo sangre, caos y el placer de la matanza.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 5,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 66
    },
    "Nombre": "Erythnul",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 5,
   "nombre": "Erythnul"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     22,
     23,
     24,
     25
    ],
    "deidad": {
     "descripcion": "Señor de los caminos, el horizonte y la distancia. Fharlanghn bendice a quienes nunca dejan de avanzar, pues para sus fieles el viaje importa más que cualquier destino.",
     "id_alineamiento": 8,
     "id_arma": 14,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Fharlanghn",
     "oficial": true,
     "pagina": 67
    },
    "dominios": [
     27,
     32,
     36
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 22,
      "Nombre": "Horizontes"
     },
     {
      "Id": 23,
      "Nombre": "Distancia"
     },
     {
      "Id": 24,
      "Nombre": "Viajar"
     },
     {
      "Id": 25,
      "Nombre": "Caminos"
     }
    ],
    "Arma": {
     "Id": 14,
     "Nombre": "Bastón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Señor de los caminos, el horizonte y la distancia. Fharlanghn bendice a quienes nunca dejan de avanzar, pues para sus fieles el viaje importa más que cualquier destino.",
    "Dominios": [
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     },
     {
      "Id": 36,
      "Nombre": "Viaje",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 6,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 67
    },
    "Nombre": "Fharlanghn",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 6,
   "nombre": "Fharlanghn"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     26,
     27,
     28,
     29,
     30,
     31
    ],
    "deidad": {
     "descripcion": "Garl del Oro Luminosa es el patrón jovial y astuto de los gnomos, amante del ingenio, la risa y la inventiva. Bajo su aparente ligereza se esconde una mente aguda, siempre lista para burlar a enemigos más grandes y pomposos.",
     "id_alineamiento": 7,
     "id_arma": 32,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Garl del oro luminoso",
     "oficial": true,
     "pagina": 69
    },
    "dominios": [
     5,
     27,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 26,
      "Nombre": "Gnomos"
     },
     {
      "Id": 27,
      "Nombre": "Humor"
     },
     {
      "Id": 28,
      "Nombre": "Ingenio"
     },
     {
      "Id": 29,
      "Nombre": "Ilusión"
     },
     {
      "Id": 30,
      "Nombre": "Talla de gemas"
     },
     {
      "Id": 31,
      "Nombre": "Joyería"
     }
    ],
    "Arma": {
     "Id": 32,
     "Nombre": "Hacha de batalla"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Garl del Oro Luminosa es el patrón jovial y astuto de los gnomos, amante del ingenio, la risa y la inventiva. Bajo su aparente ligereza se esconde una mente aguda, siempre lista para burlar a enemigos más grandes y pomposos.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 7,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 69
    },
    "Nombre": "Garl del oro luminoso",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 7,
   "nombre": "Garl del oro luminoso"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     32,
     33
    ],
    "deidad": {
     "descripcion": "Gruumsh, el tuerto, guía a los orcos con furia incansable y orgullo herido. Su culto enseña que el mundo se conquista arrancándole a la fuerza lo que nunca quiso conceder.",
     "id_alineamiento": 12,
     "id_arma": 15,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Gruumsh",
     "oficial": true,
     "pagina": 71
    },
    "dominios": [
     6,
     16,
     18,
     23
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 12,
     "Id_basico": 9,
     "Nombre": "Caótico maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 32,
      "Nombre": "Orcos"
     },
     {
      "Id": 33,
      "Nombre": "Territorio"
     }
    ],
    "Arma": {
     "Id": 15,
     "Nombre": "Lanza"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Gruumsh, el tuerto, guía a los orcos con furia incansable y orgullo herido. Su culto enseña que el mundo se conquista arrancándole a la fuerza lo que nunca quiso conceder.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 8,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 71
    },
    "Nombre": "Gruumsh",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 8,
   "nombre": "Gruumsh"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     34,
     35,
     36,
     37,
     38
    ],
    "deidad": {
     "descripcion": "Dios de la guerra justa y del valor sin tacha. Heironeus representa la batalla librada con honor, la disciplina del héroe y la negativa a ceder ante el mal.",
     "id_alineamiento": 4,
     "id_arma": 30,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Heironeus",
     "oficial": true,
     "pagina": 72
    },
    "dominios": [
     5,
     18,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 4,
     "Id_basico": 1,
     "Nombre": "Legal bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 34,
      "Nombre": "Valor"
     },
     {
      "Id": 35,
      "Nombre": "Caballería"
     },
     {
      "Id": 36,
      "Nombre": "Justicia"
     },
     {
      "Id": 37,
      "Nombre": "Honor"
     },
     {
      "Id": 38,
      "Nombre": "Osadía"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Dios de la guerra justa y del valor sin tacha. Heironeus representa la batalla librada con honor, la disciplina del héroe y la negativa a ceder ante el mal.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 9,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 72
    },
    "Nombre": "Heironeus",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 9,
   "nombre": "Heironeus"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     39,
     40,
     41,
     42,
     43
    ],
    "deidad": {
     "descripcion": "Señor de la tiranía, la guerra cruel y la opresión. Hextor enseña que el poder solo se conserva cuando el miedo lo sostiene.",
     "id_alineamiento": 6,
     "id_arma": 33,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Hextor",
     "oficial": true,
     "pagina": 75
    },
    "dominios": [
     12,
     18,
     20,
     23
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 6,
     "Id_basico": 3,
     "Nombre": "Legal maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 39,
      "Nombre": "Tiranía"
     },
     {
      "Id": 40,
      "Nombre": "Discordia"
     },
     {
      "Id": 41,
      "Nombre": "Masacres"
     },
     {
      "Id": 42,
      "Nombre": "Conflicto"
     },
     {
      "Id": 43,
      "Nombre": "Salud"
     }
    ],
    "Arma": {
     "Id": 33,
     "Nombre": "Mangual"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Señor de la tiranía, la guerra cruel y la opresión. Hextor enseña que el poder solo se conserva cuando el miedo lo sostiene.",
    "Dominios": [
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 10,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 75
    },
    "Nombre": "Hextor",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 10,
   "nombre": "Hextor"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     44,
     45,
     46,
     47,
     48
    ],
    "deidad": {
     "descripcion": "Kord celebra la fuerza, el coraje y el desafío lanzado de frente. Es dios de la tormenta, del combate recio y de la gloria ganada a pulso.",
     "id_alineamiento": 10,
     "id_arma": 40,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Kord",
     "oficial": true,
     "pagina": 77
    },
    "dominios": [
     5,
     6,
     16,
     32
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 44,
      "Nombre": "Fuerza"
     },
     {
      "Id": 45,
      "Nombre": "Atletismo"
     },
     {
      "Id": 46,
      "Nombre": "Deportes"
     },
     {
      "Id": 47,
      "Nombre": "Pelea"
     },
     {
      "Id": 48,
      "Nombre": "Coraje"
     }
    ],
    "Arma": {
     "Id": 40,
     "Nombre": "Espadón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Kord celebra la fuerza, el coraje y el desafío lanzado de frente. Es dios de la tormenta, del combate recio y de la gloria ganada a pulso.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 11,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 77
    },
    "Nombre": "Kord",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 11,
   "nombre": "Kord"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     49,
     50,
     51
    ],
    "deidad": {
     "descripcion": "Patrón de los kobolds y enemigo rencoroso de los gnomos, Kurtulmak es una deidad de trampas, emboscadas y supervivencia mezquina. Sus fieles prosperan allí donde la cobardía y la astucia valen más que el honor.",
     "id_alineamiento": 6,
     "id_arma": 15,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Kurtulmak",
     "oficial": true,
     "pagina": 79
    },
    "dominios": [
     20,
     23,
     32,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 6,
     "Id_basico": 3,
     "Nombre": "Legal maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 49,
      "Nombre": "Kobolds"
     },
     {
      "Id": 50,
      "Nombre": "Constructores de trampas"
     },
     {
      "Id": 51,
      "Nombre": "Minería"
     }
    ],
    "Arma": {
     "Id": 15,
     "Nombre": "Lanza"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Patrón de los kobolds y enemigo rencoroso de los gnomos, Kurtulmak es una deidad de trampas, emboscadas y supervivencia mezquina. Sus fieles prosperan allí donde la cobardía y la astucia valen más que el honor.",
    "Dominios": [
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 12,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 79
    },
    "Nombre": "Kurtulmak",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 12,
   "nombre": "Kurtulmak"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     52,
     53,
     54,
     55
    ],
    "deidad": {
     "descripcion": "La Reina Araña reina sobre la ambición, la traición y la crueldad refinada. Lolth premia la astucia despiadada y hunde sin remordimientos a quienes fracasan.",
     "id_alineamiento": 12,
     "id_arma": 58,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Lolth",
     "oficial": true,
     "pagina": 81
    },
    "dominios": [
     6,
     12,
     23,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 12,
     "Id_basico": 9,
     "Nombre": "Caótico maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 52,
      "Nombre": "Drows"
     },
     {
      "Id": 53,
      "Nombre": "Arañas"
     },
     {
      "Id": 54,
      "Nombre": "Mal"
     },
     {
      "Id": 55,
      "Nombre": "Oscuridad"
     }
    ],
    "Arma": {
     "Id": 58,
     "Nombre": "Látigo"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "La Reina Araña reina sobre la ambición, la traición y la crueldad refinada. Lolth premia la astucia despiadada y hunde sin remordimientos a quienes fracasan.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 13,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 81
    },
    "Nombre": "Lolth",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 13,
   "nombre": "Lolth"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     56,
     57,
     58,
     59
    ],
    "deidad": {
     "descripcion": "Moradin, el Forjador de Almas, modeló a los enanos con fuego, metal y voluntad inquebrantable. Es patrón de artesanos, clanes y fortalezas levantadas para resistir el paso de los siglos.",
     "id_alineamiento": 4,
     "id_arma": 34,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Moradin",
     "oficial": true,
     "pagina": 83
    },
    "dominios": [
     5,
     20,
     27,
     34
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 4,
     "Id_basico": 1,
     "Nombre": "Legal bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 56,
      "Nombre": "Enanos"
     },
     {
      "Id": 57,
      "Nombre": "Creación"
     },
     {
      "Id": 58,
      "Nombre": "Herrería"
     },
     {
      "Id": 59,
      "Nombre": "Ingeniería"
     }
    ],
    "Arma": {
     "Id": 34,
     "Nombre": "Martillo de guerra"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Moradin, el Forjador de Almas, modeló a los enanos con fuego, metal y voluntad inquebrantable. Es patrón de artesanos, clanes y fortalezas levantadas para resistir el paso de los siglos.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 14,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 83
    },
    "Nombre": "Moradin",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 14,
   "nombre": "Moradin"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     55,
     60,
     61,
     62
    ],
    "deidad": {
     "descripcion": "Dios de la muerte, la oscuridad y el ocaso final. Nerull es la sombra silenciosa que aguarda al término de toda vida.",
     "id_alineamiento": 9,
     "id_arma": 43,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Nerull",
     "oficial": true,
     "pagina": 84
    },
    "dominios": [
     23,
     24,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 55,
      "Nombre": "Oscuridad"
     },
     {
      "Id": 60,
      "Nombre": "Muerte"
     },
     {
      "Id": 61,
      "Nombre": "Asesinato"
     },
     {
      "Id": 62,
      "Nombre": "Inframundo"
     }
    ],
    "Arma": {
     "Id": 43,
     "Nombre": "Guadaña"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Dios de la muerte, la oscuridad y el ocaso final. Nerull es la sombra silenciosa que aguarda al término de toda vida.",
    "Dominios": [
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 24,
      "Nombre": "Muerte",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 15,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 84
    },
    "Nombre": "Nerull",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 15,
   "nombre": "Nerull"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     13,
     63,
     64,
     65,
     66
    ],
    "deidad": {
     "descripcion": "Obad-Hai encarna la naturaleza en su forma más pura e indiferente. No protege el bosque por bondad, sino porque todo ser vivo debe ocupar su lugar dentro del ciclo salvaje.",
     "id_alineamiento": 8,
     "id_arma": 14,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Obad-hai",
     "oficial": true,
     "pagina": 86
    },
    "dominios": [
     1,
     2,
     3,
     15,
     34,
     35
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 13,
      "Nombre": "Selvas"
     },
     {
      "Id": 63,
      "Nombre": "Naturaleza"
     },
     {
      "Id": 64,
      "Nombre": "Libertad"
     },
     {
      "Id": 65,
      "Nombre": "Caza"
     },
     {
      "Id": 66,
      "Nombre": "Bestias"
     }
    ],
    "Arma": {
     "Id": 14,
     "Nombre": "Bastón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Obad-Hai encarna la naturaleza en su forma más pura e indiferente. No protege el bosque por bondad, sino porque todo ser vivo debe ocupar su lugar dentro del ciclo salvaje.",
    "Dominios": [
     {
      "Id": 1,
      "Nombre": "Agua",
      "Oficial": true
     },
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 3,
      "Nombre": "Animal",
      "Oficial": true
     },
     {
      "Id": 15,
      "Nombre": "Fuego",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     },
     {
      "Id": 35,
      "Nombre": "Vegetal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 16,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 86
    },
    "Nombre": "Obad-hai",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 16,
   "nombre": "Obad-hai"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     10,
     27,
     67,
     68,
     69,
     70
    ],
    "deidad": {
     "descripcion": "Señor de los ladrones, las bromas y el vino compartido al borde del desastre. Olidammara vive en la carcajada insolente, en la mentira elegante y en la libertad de quien no se deja encadenar.",
     "id_alineamiento": 11,
     "id_arma": 31,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Olidammara",
     "oficial": true,
     "pagina": 88
    },
    "dominios": [
     6,
     32,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 11,
     "Id_basico": 8,
     "Nombre": "Caótico neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 10,
      "Nombre": "Música"
     },
     {
      "Id": 27,
      "Nombre": "Humor"
     },
     {
      "Id": 67,
      "Nombre": "Pícaros"
     },
     {
      "Id": 68,
      "Nombre": "Diversión"
     },
     {
      "Id": 69,
      "Nombre": "Vino"
     },
     {
      "Id": 70,
      "Nombre": "Engaños"
     }
    ],
    "Arma": {
     "Id": 31,
     "Nombre": "Estoque"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Señor de los ladrones, las bromas y el vino compartido al borde del desastre. Olidammara vive en la carcajada insolente, en la mentira elegante y en la libertad de quien no se deja encadenar.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 17,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 88
    },
    "Nombre": "Olidammara",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 17,
   "nombre": "Olidammara"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     44,
     71,
     72,
     73
    ],
    "deidad": {
     "descripcion": "Pelor es la luz del sol al amanecer, el calor que devuelve la vida y la esperanza que resiste a la noche. Sus fieles lo veneran como protector de los débiles y enemigo eterno de la oscuridad.",
     "id_alineamiento": 7,
     "id_arma": 8,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Pelor",
     "oficial": true,
     "pagina": 90
    },
    "dominios": [
     5,
     10,
     16,
     31
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 44,
      "Nombre": "Fuerza"
     },
     {
      "Id": 71,
      "Nombre": "Sol"
     },
     {
      "Id": 72,
      "Nombre": "Luz"
     },
     {
      "Id": 73,
      "Nombre": "Curación"
     }
    ],
    "Arma": {
     "Id": 8,
     "Nombre": "Maza ligera"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Pelor es la luz del sol al amanecer, el calor que devuelve la vida y la esperanza que resiste a la noche. Sus fieles lo veneran como protector de los débiles y enemigo eterno de la oscuridad.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 10,
      "Nombre": "Curación",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 31,
      "Nombre": "Sol",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 18,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 90
    },
    "Nombre": "Pelor",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 18,
   "nombre": "Pelor"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [
     1,
     2
    ],
    "ambitos": [
     74,
     75,
     76,
     77,
     78,
     79,
     80
    ],
    "deidad": {
     "descripcion": "San Cuthbert castiga la necedad con la misma firmeza con la que recompensa la disciplina y la rectitud. Es una deidad severa, práctica y poco dada a tolerar tonterías.",
     "id_alineamiento": 5,
     "id_arma": 8,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "San Cuthbert",
     "oficial": true,
     "pagina": 91
    },
    "dominios": [
     12,
     16,
     20,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 5,
     "Id_basico": 2,
     "Nombre": "Legal neutral"
    },
    "Alineamientos_devotos": [
     {
      "Id": 1,
      "Nombre": "Legal bueno"
     },
     {
      "Id": 2,
      "Nombre": "Legal neutral"
     }
    ],
    "Ambitos": [
     {
      "Id": 74,
      "Nombre": "Justo castigo"
     },
     {
      "Id": 75,
      "Nombre": "Sentido común"
     },
     {
      "Id": 76,
      "Nombre": "Sabiduría"
     },
     {
      "Id": 77,
      "Nombre": "Entusiasmo"
     },
     {
      "Id": 78,
      "Nombre": "Honestidad"
     },
     {
      "Id": 79,
      "Nombre": "Verdad"
     },
     {
      "Id": 80,
      "Nombre": "Disciplina"
     }
    ],
    "Arma": {
     "Id": 8,
     "Nombre": "Maza ligera"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "San Cuthbert castiga la necedad con la misma firmeza con la que recompensa la disciplina y la rectitud. Es una deidad severa, práctica y poco dada a tolerar tonterías.",
    "Dominios": [
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 19,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 91
    },
    "Nombre": "San Cuthbert",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 19,
   "nombre": "San Cuthbert"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     81,
     82
    ],
    "deidad": {
     "descripcion": "La reina dragón de cinco cabezas es la encarnación de la codicia, la supremacía y el dominio despiadado. Tiamat concede poder a sus siervos, pero jamás sin exigir sumisión absoluta.",
     "id_alineamiento": 6,
     "id_arma": 73,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Tiamat",
     "oficial": true,
     "pagina": 93
    },
    "dominios": [
     12,
     20,
     23,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 6,
     "Id_basico": 3,
     "Nombre": "Legal maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 81,
      "Nombre": "Dragones malignos"
     },
     {
      "Id": 82,
      "Nombre": "Conquista"
     }
    ],
    "Arma": {
     "Id": 73,
     "Nombre": "Garra"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "La reina dragón de cinco cabezas es la encarnación de la codicia, la supremacía y el dominio despiadado. Tiamat concede poder a sus siervos, pero jamás sin exigir sumisión absoluta.",
    "Dominios": [
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 20,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 93
    },
    "Nombre": "Tiamat",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 20,
   "nombre": "Tiamat"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     83,
     84
    ],
    "deidad": {
     "descripcion": "Vecna, señor de los secretos prohibidos, enseña que el conocimiento oculto vale más que cualquier reino. Susurros, traición y saber vedado son los peldaños de su ascenso eterno.",
     "id_alineamiento": 9,
     "id_arma": 5,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Vecna",
     "oficial": true,
     "pagina": 94
    },
    "dominios": [
     22,
     23,
     29
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 83,
      "Nombre": "Secretos"
     },
     {
      "Id": 84,
      "Nombre": "Intriga"
     }
    ],
    "Arma": {
     "Id": 5,
     "Nombre": "Daga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Vecna, señor de los secretos prohibidos, enseña que el conocimiento oculto vale más que cualquier reino. Susurros, traición y saber vedado son los peldaños de su ascenso eterno.",
    "Dominios": [
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 21,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 94
    },
    "Nombre": "Vecna",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 21,
   "nombre": "Vecna"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     3,
     8,
     60,
     85
    ],
    "deidad": {
     "descripcion": "Wee Jas gobierna la magia y la muerte bajo un severo sentido del orden. No es una diosa del caos funerario, sino de la inevitabilidad, el rito y el poder bien encauzado.",
     "id_alineamiento": 5,
     "id_arma": 5,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Wee jas",
     "oficial": true,
     "pagina": 96
    },
    "dominios": [
     20,
     22,
     24
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 5,
     "Id_basico": 2,
     "Nombre": "Legal neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 3,
      "Nombre": "Magia"
     },
     {
      "Id": 8,
      "Nombre": "Vanidad"
     },
     {
      "Id": 60,
      "Nombre": "Muerte"
     },
     {
      "Id": 85,
      "Nombre": "Ley"
     }
    ],
    "Arma": {
     "Id": 5,
     "Nombre": "Daga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Wee Jas gobierna la magia y la muerte bajo un severo sentido del orden. No es una diosa del caos funerario, sino de la inevitabilidad, el rito y el poder bien encauzado.",
    "Dominios": [
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     },
     {
      "Id": 24,
      "Nombre": "Muerte",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 22,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 96
    },
    "Nombre": "Wee jas",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 22,
   "nombre": "Wee jas"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     15,
     86,
     87
    ],
    "deidad": {
     "descripcion": "Yondalla protege a los suyos con paciencia, sensatez y una férrea voluntad de supervivencia. Bajo su apariencia amable se alza una guardiana que jamás subestima el peligro.",
     "id_alineamiento": 4,
     "id_arma": 23,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 1,
     "nombre": "Yondalla",
     "oficial": true,
     "pagina": 97
    },
    "dominios": [
     5,
     20,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 4,
     "Id_basico": 1,
     "Nombre": "Legal bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 15,
      "Nombre": "Fertilidad"
     },
     {
      "Id": 86,
      "Nombre": "Medianos"
     },
     {
      "Id": 87,
      "Nombre": "Protección"
     }
    ],
    "Arma": {
     "Id": 23,
     "Nombre": "Espada corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Yondalla protege a los suyos con paciencia, sensatez y una férrea voluntad de supervivencia. Bajo su apariencia amable se alza una guardiana que jamás subestima el peligro.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 23,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 97
    },
    "Nombre": "Yondalla",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 23,
   "nombre": "Yondalla"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     88,
     89,
     90,
     91,
     92
    ],
    "deidad": {
     "descripcion": "Rey de los dioses y señor del trueno. Zeus impone su voluntad desde las alturas con autoridad soberana, orgullo inmenso y una presencia tan majestuosa como temible.",
     "id_alineamiento": 10,
     "id_arma": 13,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Zeus",
     "oficial": true,
     "pagina": 101
    },
    "dominios": [
     2,
     5,
     6,
     7,
     16,
     25
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 88,
      "Nombre": "Cielo"
     },
     {
      "Id": 89,
      "Nombre": "Aire"
     },
     {
      "Id": 90,
      "Nombre": "Tormentas"
     },
     {
      "Id": 91,
      "Nombre": "Destino"
     },
     {
      "Id": 92,
      "Nombre": "Nobleza"
     }
    ],
    "Arma": {
     "Id": 13,
     "Nombre": "Lanza corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Rey de los dioses y señor del trueno. Zeus impone su voluntad desde las alturas con autoridad soberana, orgullo inmenso y una presencia tan majestuosa como temible.",
    "Dominios": [
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 7,
      "Nombre": "Clima",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 25,
      "Nombre": "Nobleza",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 24,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 101
    },
    "Nombre": "Zeus",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 24,
   "nombre": "Zeus"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     93,
     94
    ],
    "deidad": {
     "descripcion": "Afrodita es la fuerza irresistible del deseo, la belleza y la fascinación. Allí donde posa la mirada nacen pasiones capaces de ennoblecer o arruinar a los mortales.",
     "id_alineamiento": 10,
     "id_arma": 5,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Afrodita",
     "oficial": true,
     "pagina": 103
    },
    "dominios": [
     5,
     6,
     13
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 93,
      "Nombre": "Amor"
     },
     {
      "Id": 94,
      "Nombre": "Belleza"
     }
    ],
    "Arma": {
     "Id": 5,
     "Nombre": "Daga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Afrodita es la fuerza irresistible del deseo, la belleza y la fascinación. Allí donde posa la mirada nacen pasiones capaces de ennoblecer o arruinar a los mortales.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 13,
      "Nombre": "Encanto",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 25,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 103
    },
    "Nombre": "Afrodita",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 25,
   "nombre": "Afrodita"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     10,
     72,
     73,
     95
    ],
    "deidad": {
     "descripcion": "Apolo ilumina el mundo con música, razón y profecía. Es señor de la armonía y de las verdades que ciegan tanto como esclarecen.",
     "id_alineamiento": 10,
     "id_arma": 51,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Apolo",
     "oficial": true,
     "pagina": 105
    },
    "dominios": [
     5,
     9,
     22,
     29,
     31
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 10,
      "Nombre": "Música"
     },
     {
      "Id": 72,
      "Nombre": "Luz"
     },
     {
      "Id": 73,
      "Nombre": "Curación"
     },
     {
      "Id": 95,
      "Nombre": "Profecías"
     }
    ],
    "Arma": {
     "Id": 51,
     "Nombre": "Arco largo compuesto"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Apolo ilumina el mundo con música, razón y profecía. Es señor de la armonía y de las verdades que ciegan tanto como esclarecen.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 9,
      "Nombre": "Creación",
      "Oficial": true
     },
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     },
     {
      "Id": 31,
      "Nombre": "Sol",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 26,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 105
    },
    "Nombre": "Apolo",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 26,
   "nombre": "Apolo"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     40,
     61
    ],
    "deidad": {
     "descripcion": "Ares personifica la guerra desatada, la furia del combate y la violencia sin barniz heroico. Donde se le venera, el estruendo de las armas vale más que cualquier discurso.",
     "id_alineamiento": 12,
     "id_arma": 13,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Ares",
     "oficial": true,
     "pagina": 107
    },
    "dominios": [
     6,
     12,
     18,
     23
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 12,
     "Id_basico": 9,
     "Nombre": "Caótico maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 40,
      "Nombre": "Discordia"
     },
     {
      "Id": 61,
      "Nombre": "Asesinato"
     }
    ],
    "Arma": {
     "Id": 13,
     "Nombre": "Lanza corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Ares personifica la guerra desatada, la furia del combate y la violencia sin barniz heroico. Donde se le venera, el estruendo de las armas vale más que cualquier discurso.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 27,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 107
    },
    "Nombre": "Ares",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 27,
   "nombre": "Ares"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     65,
     96,
     97,
     98
    ],
    "deidad": {
     "descripcion": "Artemisa recorre los bosques bajo la luz de la luna, indómita e inaccesible. Es diosa de la caza, de la pureza salvaje y del arco que no falla.",
     "id_alineamiento": 7,
     "id_arma": 23,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Artemisa",
     "oficial": true,
     "pagina": 108
    },
    "dominios": [
     3,
     5,
     31,
     35
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 65,
      "Nombre": "Caza"
     },
     {
      "Id": 96,
      "Nombre": "Bestias salvajes"
     },
     {
      "Id": 97,
      "Nombre": "Parto"
     },
     {
      "Id": 98,
      "Nombre": "Danza"
     }
    ],
    "Arma": {
     "Id": 23,
     "Nombre": "Espada corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Artemisa recorre los bosques bajo la luz de la luna, indómita e inaccesible. Es diosa de la caza, de la pureza salvaje y del arco que no falla.",
    "Dominios": [
     {
      "Id": 3,
      "Nombre": "Animal",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 31,
      "Nombre": "Sol",
      "Oficial": true
     },
     {
      "Id": 35,
      "Nombre": "Vegetal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 28,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 108
    },
    "Nombre": "Artemisa",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 28,
   "nombre": "Artemisa"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     9,
     11,
     76,
     99
    ],
    "deidad": {
     "descripcion": "Atenea encarna la sabiduría lúcida, la estrategia y la victoria lograda mediante inteligencia y disciplina. Su guerra no es brutal: es precisa.",
     "id_alineamiento": 4,
     "id_arma": 13,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Atenea",
     "oficial": true,
     "pagina": 110
    },
    "dominios": [
     4,
     5,
     8,
     18,
     20,
     29
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 4,
     "Id_basico": 1,
     "Nombre": "Legal bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 9,
      "Nombre": "Artes y oficios"
     },
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 76,
      "Nombre": "Sabiduría"
     },
     {
      "Id": 99,
      "Nombre": "Civilización"
     }
    ],
    "Arma": {
     "Id": 13,
     "Nombre": "Lanza corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Atenea encarna la sabiduría lúcida, la estrategia y la victoria lograda mediante inteligencia y disciplina. Su guerra no es brutal: es precisa.",
    "Dominios": [
     {
      "Id": 4,
      "Nombre": "Artífice",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 8,
      "Nombre": "Comunidad",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 29,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 110
    },
    "Nombre": "Atenea",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 29,
   "nombre": "Atenea"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     100
    ],
    "deidad": {
     "descripcion": "Deméter custodia las cosechas, la fertilidad de la tierra y los ciclos que sostienen la vida mortal. Su favor trae abundancia; su ausencia, hambre.",
     "id_alineamiento": 8,
     "id_arma": 15,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Demeter",
     "oficial": true,
     "pagina": 112
    },
    "dominios": [
     27,
     34,
     35
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 100,
      "Nombre": "Agricultura"
     }
    ],
    "Arma": {
     "Id": 15,
     "Nombre": "Lanza"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Deméter custodia las cosechas, la fertilidad de la tierra y los ciclos que sostienen la vida mortal. Su favor trae abundancia; su ausencia, hambre.",
    "Dominios": [
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     },
     {
      "Id": 35,
      "Nombre": "Vegetal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 30,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 112
    },
    "Nombre": "Demeter",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 30,
   "nombre": "Demeter"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     15,
     69,
     101,
     102,
     103
    ],
    "deidad": {
     "descripcion": "Dionisio rompe cadenas con vino, éxtasis y locura sagrada. Su culto celebra la libertad de los instintos, aunque a menudo arrastre a sus fieles más allá de la razón.",
     "id_alineamiento": 11,
     "id_arma": 14,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Dionisio",
     "oficial": true,
     "pagina": 114
    },
    "dominios": [
     6,
     12,
     21
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 11,
     "Id_basico": 8,
     "Nombre": "Caótico neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 15,
      "Nombre": "Fertilidad"
     },
     {
      "Id": 69,
      "Nombre": "Vino"
     },
     {
      "Id": 101,
      "Nombre": "Alegría"
     },
     {
      "Id": 102,
      "Nombre": "Locura"
     },
     {
      "Id": 103,
      "Nombre": "Teatro"
     }
    ],
    "Arma": {
     "Id": 14,
     "Nombre": "Bastón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Dionisio rompe cadenas con vino, éxtasis y locura sagrada. Su culto celebra la libertad de los instintos, aunque a menudo arrastre a sus fieles más allá de la razón.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 21,
      "Nombre": "Locura",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 31,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 114
    },
    "Nombre": "Dionisio",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 31,
   "nombre": "Dionisio"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     60,
     62,
     104,
     105
    ],
    "deidad": {
     "descripcion": "Hades gobierna el reino de los muertos con autoridad sombría e inexorable. No es un tirano caprichoso, sino el guardián de un dominio del que nadie regresa igual.",
     "id_alineamiento": 9,
     "id_arma": 30,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Hades",
     "oficial": true,
     "pagina": 115
    },
    "dominios": [
     23,
     24,
     34
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 60,
      "Nombre": "Muerte"
     },
     {
      "Id": 62,
      "Nombre": "Inframundo"
     },
     {
      "Id": 104,
      "Nombre": "Tierra"
     },
     {
      "Id": 105,
      "Nombre": "Riqueza"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hades gobierna el reino de los muertos con autoridad sombría e inexorable. No es un tirano caprichoso, sino el guardián de un dominio del que nadie regresa igual.",
    "Dominios": [
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 24,
      "Nombre": "Muerte",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 32,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 115
    },
    "Nombre": "Hades",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 32,
   "nombre": "Hades"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     3,
     106,
     107,
     108
    ],
    "deidad": {
     "descripcion": "Hécate guarda los cruces de caminos, la brujería y los misterios de la noche. Su saber es antiguo, lunar y peligroso para quien lo busca con ligereza.",
     "id_alineamiento": 9,
     "id_arma": 5,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Hécate",
     "oficial": true,
     "pagina": 117
    },
    "dominios": [
     9,
     22,
     23,
     29
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 3,
      "Nombre": "Magia"
     },
     {
      "Id": 106,
      "Nombre": "Luna"
     },
     {
      "Id": 107,
      "Nombre": "Abundancia"
     },
     {
      "Id": 108,
      "Nombre": "Muertos vivientes"
     }
    ],
    "Arma": {
     "Id": 5,
     "Nombre": "Daga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hécate guarda los cruces de caminos, la brujería y los misterios de la noche. Su saber es antiguo, lunar y peligroso para quien lo busca con ligereza.",
    "Dominios": [
     {
      "Id": 9,
      "Nombre": "Creación",
      "Oficial": true
     },
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 33,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 117
    },
    "Nombre": "Hécate",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 33,
   "nombre": "Hécate"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     9,
     58
    ],
    "deidad": {
     "descripcion": "Hefesto es el artesano divino que arranca maravillas al fuego y al metal. Su obra no nace de la gracia, sino del esfuerzo, la paciencia y el dominio absoluto de la forja.",
     "id_alineamiento": 7,
     "id_arma": 34,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Hefesto",
     "oficial": true,
     "pagina": 119
    },
    "dominios": [
     4,
     5,
     8,
     15,
     34
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 9,
      "Nombre": "Artes y oficios"
     },
     {
      "Id": 58,
      "Nombre": "Herrería"
     }
    ],
    "Arma": {
     "Id": 34,
     "Nombre": "Martillo de guerra"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hefesto es el artesano divino que arranca maravillas al fuego y al metal. Su obra no nace de la gracia, sino del esfuerzo, la paciencia y el dominio absoluto de la forja.",
    "Dominios": [
     {
      "Id": 4,
      "Nombre": "Artífice",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 8,
      "Nombre": "Comunidad",
      "Oficial": true
     },
     {
      "Id": 15,
      "Nombre": "Fuego",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 34,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 119
    },
    "Nombre": "Hefesto",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 34,
   "nombre": "Hefesto"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     84,
     109,
     110
    ],
    "deidad": {
     "descripcion": "Hera vela por la realeza, el matrimonio y la dignidad del poder legítimo. Su favor sostiene juramentos; su ira cae sobre la traición y la humillación.",
     "id_alineamiento": 8,
     "id_arma": 8,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Hera",
     "oficial": true,
     "pagina": 120
    },
    "dominios": [
     8,
     25,
     27,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 84,
      "Nombre": "Intriga"
     },
     {
      "Id": 109,
      "Nombre": "Matrimonio"
     },
     {
      "Id": 110,
      "Nombre": "Mujeres"
     }
    ],
    "Arma": {
     "Id": 8,
     "Nombre": "Maza ligera"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hera vela por la realeza, el matrimonio y la dignidad del poder legítimo. Su favor sostiene juramentos; su ira cae sobre la traición y la humillación.",
    "Dominios": [
     {
      "Id": 8,
      "Nombre": "Comunidad",
      "Oficial": true
     },
     {
      "Id": 25,
      "Nombre": "Nobleza",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 35,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 120
    },
    "Nombre": "Hera",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 35,
   "nombre": "Hera"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     44,
     111
    ],
    "deidad": {
     "descripcion": "Hércules representa la fuerza heroica llevada hasta lo legendario. Sus gestas hablan de resistencia, gloria y del precio terrible que acompaña a los grandes nombres.",
     "id_alineamiento": 10,
     "id_arma": 41,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Hércules",
     "oficial": true,
     "pagina": 122
    },
    "dominios": [
     5,
     6,
     16,
     32
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 44,
      "Nombre": "Fuerza"
     },
     {
      "Id": 111,
      "Nombre": "Aventura"
     }
    ],
    "Arma": {
     "Id": 41,
     "Nombre": "Gran clava"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hércules representa la fuerza heroica llevada hasta lo legendario. Sus gestas hablan de resistencia, gloria y del precio terrible que acompaña a los grandes nombres.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 36,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 122
    },
    "Nombre": "Hércules",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 36,
   "nombre": "Hércules"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     24,
     112,
     113,
     114,
     115
    ],
    "deidad": {
     "descripcion": "Hermes se mueve entre dioses, mortales y muertos con la misma facilidad. Es patrón de viajeros, mensajeros, comerciantes y embaucadores con sonrisa rápida.",
     "id_alineamiento": 10,
     "id_arma": 14,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Hermes",
     "oficial": true,
     "pagina": 123
    },
    "dominios": [
     5,
     6,
     32,
     33,
     36
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 24,
      "Nombre": "Viajar"
     },
     {
      "Id": 112,
      "Nombre": "Comercio"
     },
     {
      "Id": 113,
      "Nombre": "Ladrones"
     },
     {
      "Id": 114,
      "Nombre": "Juego"
     },
     {
      "Id": 115,
      "Nombre": "Velocidad"
     }
    ],
    "Arma": {
     "Id": 14,
     "Nombre": "Bastón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hermes se mueve entre dioses, mortales y muertos con la misma facilidad. Es patrón de viajeros, mensajeros, comerciantes y embaucadores con sonrisa rápida.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     },
     {
      "Id": 36,
      "Nombre": "Viaje",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 37,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 123
    },
    "Nombre": "Hermes",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 37,
   "nombre": "Hermes"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     116,
     117,
     118
    ],
    "deidad": {
     "descripcion": "Hestia es el fuego del hogar, la paz doméstica y la estabilidad que da cobijo frente al caos del mundo. Su poder rara vez hace ruido, pero sostiene civilizaciones enteras.",
     "id_alineamiento": 7,
     "id_arma": 5,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Hestia",
     "oficial": true,
     "pagina": 125
    },
    "dominios": [
     5,
     8,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 116,
      "Nombre": "Vivienda"
     },
     {
      "Id": 117,
      "Nombre": "Hogar de la chimenea"
     },
     {
      "Id": 118,
      "Nombre": "Familia"
     }
    ],
    "Arma": {
     "Id": 5,
     "Nombre": "Daga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hestia es el fuego del hogar, la paz doméstica y la estabilidad que da cobijo frente al caos del mundo. Su poder rara vez hace ruido, pero sostiene civilizaciones enteras.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 8,
      "Nombre": "Comunidad",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 38,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 125
    },
    "Nombre": "Hestia",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 38,
   "nombre": "Hestia"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     119
    ],
    "deidad": {
     "descripcion": "Niké personifica la victoria, ese instante decisivo en el que el esfuerzo se convierte en triunfo. Es menos una reina del combate que la promesa de coronarlo con éxito.",
     "id_alineamiento": 5,
     "id_arma": 8,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Niké",
     "oficial": true,
     "pagina": 126
    },
    "dominios": [
     18,
     20,
     25
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 5,
     "Id_basico": 2,
     "Nombre": "Legal neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 119,
      "Nombre": "Victoria"
     }
    ],
    "Arma": {
     "Id": 8,
     "Nombre": "Maza ligera"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Niké personifica la victoria, ese instante decisivo en el que el esfuerzo se convierte en triunfo. Es menos una reina del combate que la promesa de coronarlo con éxito.",
    "Dominios": [
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 25,
      "Nombre": "Nobleza",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 39,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 126
    },
    "Nombre": "Niké",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 39,
   "nombre": "Niké"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     63,
     120,
     121,
     122
    ],
    "deidad": {
     "descripcion": "Pan es dios de pastores, rebaños, flautas y parajes salvajes donde aún manda lo primitivo. Su presencia mezcla alegría rústica, deseo y un terror súbito que sacude el corazón.",
     "id_alineamiento": 11,
     "id_arma": 1,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Pan",
     "oficial": true,
     "pagina": 127
    },
    "dominios": [
     3,
     6,
     35
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 11,
     "Id_basico": 8,
     "Nombre": "Caótico neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 63,
      "Nombre": "Naturaleza"
     },
     {
      "Id": 120,
      "Nombre": "Pasión"
     },
     {
      "Id": 121,
      "Nombre": "Pastores"
     },
     {
      "Id": 122,
      "Nombre": "Montañas"
     }
    ],
    "Arma": {
     "Id": 1,
     "Nombre": "Impacto sin arma"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Pan es dios de pastores, rebaños, flautas y parajes salvajes donde aún manda lo primitivo. Su presencia mezcla alegría rústica, deseo y un terror súbito que sacude el corazón.",
    "Dominios": [
     {
      "Id": 3,
      "Nombre": "Animal",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 35,
      "Nombre": "Vegetal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 40,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 127
    },
    "Nombre": "Pan",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 40,
   "nombre": "Pan"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     123,
     124,
     125
    ],
    "deidad": {
     "descripcion": "Poseidón reina sobre mares, terremotos y tempestades. Las aguas bajo su dominio pueden alimentar imperios o tragárselos sin dejar rastro.",
     "id_alineamiento": 11,
     "id_arma": 36,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Poseidon",
     "oficial": true,
     "pagina": 129
    },
    "dominios": [
     1,
     6,
     34
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 11,
     "Id_basico": 8,
     "Nombre": "Caótico neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 123,
      "Nombre": "Mar"
     },
     {
      "Id": 124,
      "Nombre": "Rios"
     },
     {
      "Id": 125,
      "Nombre": "Terremotos"
     }
    ],
    "Arma": {
     "Id": 36,
     "Nombre": "Tridente"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Poseidón reina sobre mares, terremotos y tempestades. Las aguas bajo su dominio pueden alimentar imperios o tragárselos sin dejar rastro.",
    "Dominios": [
     {
      "Id": 1,
      "Nombre": "Agua",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 41,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 129
    },
    "Nombre": "Poseidon",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 41,
   "nombre": "Poseidon"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     126
    ],
    "deidad": {
     "descripcion": "Tiqué reparte fortuna y desgracia con la arbitrariedad propia del azar. Los mortales la invocan con esperanza, aunque nadie pueda confiar del todo en su favor.",
     "id_alineamiento": 8,
     "id_arma": 23,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 2,
     "nombre": "Tiqué",
     "oficial": true,
     "pagina": 130
    },
    "dominios": [
     27,
     32,
     36
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 126,
      "Nombre": "Buena suerte"
     }
    ],
    "Arma": {
     "Id": 23,
     "Nombre": "Espada corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Tiqué reparte fortuna y desgracia con la arbitrariedad propia del azar. Los mortales la invocan con esperanza, aunque nadie pueda confiar del todo en su favor.",
    "Dominios": [
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     },
     {
      "Id": 36,
      "Nombre": "Viaje",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 42,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 130
    },
    "Nombre": "Tiqué",
    "Oficial": true,
    "Pabellon": {
     "Id": 2,
     "Nombre": "Romano"
    }
   },
   "id": 42,
   "nombre": "Tiqué"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     71,
     92,
     127,
     128
    ],
    "deidad": {
     "descripcion": "Ra-Horajti es la manifestación solar del poder divino, señor del cielo diurno y juez desde las alturas. Su mirada ilumina y consume, pues donde llega la luz no puede ocultarse nada.",
     "id_alineamiento": 4,
     "id_arma": 74,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Ra-horajti",
     "oficial": true,
     "pagina": 138
    },
    "dominios": [
     5,
     17,
     18,
     20,
     25,
     31
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 4,
     "Id_basico": 1,
     "Nombre": "Legal bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 71,
      "Nombre": "Sol"
     },
     {
      "Id": 92,
      "Nombre": "Nobleza"
     },
     {
      "Id": 127,
      "Nombre": "Supremo"
     },
     {
      "Id": 128,
      "Nombre": "Venganza"
     }
    ],
    "Arma": {
     "Id": 74,
     "Nombre": "Khopesh"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Ra-Horajti es la manifestación solar del poder divino, señor del cielo diurno y juez desde las alturas. Su mirada ilumina y consume, pues donde llega la luz no puede ocultarse nada.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 17,
      "Nombre": "Gloria",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 25,
      "Nombre": "Nobleza",
      "Oficial": true
     },
     {
      "Id": 31,
      "Nombre": "Sol",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 43,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 138
    },
    "Nombre": "Ra-horajti",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 43,
   "nombre": "Ra-horajti"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     129,
     130
    ],
    "deidad": {
     "descripcion": "Anubis guía a los muertos en su tránsito final, guardián de tumbas y pesador de almas. Su juicio es frío, preciso y absolutamente inevitable.",
     "id_alineamiento": 5,
     "id_arma": 8,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Anubis",
     "oficial": true,
     "pagina": 140
    },
    "dominios": [
     11,
     20,
     22
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 5,
     "Id_basico": 2,
     "Nombre": "Legal neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 129,
      "Nombre": "Juicio"
     },
     {
      "Id": 130,
      "Nombre": "Suerte"
     }
    ],
    "Arma": {
     "Id": 8,
     "Nombre": "Maza ligera"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Anubis guía a los muertos en su tránsito final, guardián de tumbas y pesador de almas. Su juicio es frío, preciso y absolutamente inevitable.",
    "Dominios": [
     {
      "Id": 11,
      "Nombre": "Descanso",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 44,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 140
    },
    "Nombre": "Anubis",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 44,
   "nombre": "Anubis"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     54,
     131,
     132
    ],
    "deidad": {
     "descripcion": "Apofis es la serpiente del caos primigenio, enemiga eterna del orden y de la luz. No busca gobernar el mundo, sino devorarlo.",
     "id_alineamiento": 9,
     "id_arma": 35,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Apofis",
     "oficial": true,
     "pagina": 141
    },
    "dominios": [
     14,
     15,
     23
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 54,
      "Nombre": "Mal"
     },
     {
      "Id": 131,
      "Nombre": "Fuego"
     },
     {
      "Id": 132,
      "Nombre": "Serpientes"
     }
    ],
    "Arma": {
     "Id": 35,
     "Nombre": "Pico pesado"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Apofis es la serpiente del caos primigenio, enemiga eterna del orden y de la luz. No busca gobernar el mundo, sino devorarlo.",
    "Dominios": [
     {
      "Id": 14,
      "Nombre": "Escamoso",
      "Oficial": true
     },
     {
      "Id": 15,
      "Nombre": "Fuego",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 45,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 141
    },
    "Nombre": "Apofis",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 45,
   "nombre": "Apofis"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     87,
     128,
     133,
     134
    ],
    "deidad": {
     "descripcion": "Bastet protege el hogar, la fertilidad y los secretos que se esconden tras la apariencia tranquila. Es tan suave como mortal cuando se la provoca.",
     "id_alineamiento": 10,
     "id_arma": 75,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Bastet",
     "oficial": true,
     "pagina": 143
    },
    "dominios": [
     6,
     12,
     16,
     18,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 87,
      "Nombre": "Protección"
     },
     {
      "Id": 128,
      "Nombre": "Venganza"
     },
     {
      "Id": 133,
      "Nombre": "Gatos"
     },
     {
      "Id": 134,
      "Nombre": "Castigo"
     }
    ],
    "Arma": {
     "Id": 75,
     "Nombre": "Garras de tigre"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Bastet protege el hogar, la fertilidad y los secretos que se esconden tras la apariencia tranquila. Es tan suave como mortal cuando se la provoca.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 46,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 143
    },
    "Nombre": "Bastet",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 46,
   "nombre": "Bastet"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     10,
     87,
     130
    ],
    "deidad": {
     "descripcion": "Bes es un protector de lo cotidiano, de los niños, del hogar y de la risa. Su aspecto grotesco oculta una naturaleza feroz contra cualquier amenaza.",
     "id_alineamiento": 11,
     "id_arma": 23,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Bes",
     "oficial": true,
     "pagina": 144
    },
    "dominios": [
     27,
     32,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 11,
     "Id_basico": 8,
     "Nombre": "Caótico neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 10,
      "Nombre": "Música"
     },
     {
      "Id": 87,
      "Nombre": "Protección"
     },
     {
      "Id": 130,
      "Nombre": "Suerte"
     }
    ],
    "Arma": {
     "Id": 23,
     "Nombre": "Espada corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Bes es un protector de lo cotidiano, de los niños, del hogar y de la risa. Su aspecto grotesco oculta una naturaleza feroz contra cualquier amenaza.",
    "Dominios": [
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 47,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 144
    },
    "Nombre": "Bes",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 47,
   "nombre": "Bes"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     10,
     91,
     93,
     98,
     106,
     135
    ],
    "deidad": {
     "descripcion": "Hathor encarna la alegría, el amor y la celebración de la vida. Su influencia puede ser dulce o abrumadora, como una emoción que no conoce límites.",
     "id_alineamiento": 4,
     "id_arma": 30,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Hathor",
     "oficial": true,
     "pagina": 145
    },
    "dominios": [
     5,
     8,
     32
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 4,
     "Id_basico": 1,
     "Nombre": "Legal bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 10,
      "Nombre": "Música"
     },
     {
      "Id": 91,
      "Nombre": "Destino"
     },
     {
      "Id": 93,
      "Nombre": "Amor"
     },
     {
      "Id": 98,
      "Nombre": "Danza"
     },
     {
      "Id": 106,
      "Nombre": "Luna"
     },
     {
      "Id": 135,
      "Nombre": "Maternidad"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hathor encarna la alegría, el amor y la celebración de la vida. Su influencia puede ser dulce o abrumadora, como una emoción que no conoce límites.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 8,
      "Nombre": "Comunidad",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 48,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 145
    },
    "Nombre": "Hathor",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 48,
   "nombre": "Hathor"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     9,
     136
    ],
    "deidad": {
     "descripcion": "Imhotep es símbolo de conocimiento, arquitectura y sabiduría aplicada. Representa la mente que transforma ideas en legado eterno.",
     "id_alineamiento": 7,
     "id_arma": 14,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Imhotep",
     "oficial": true,
     "pagina": 146
    },
    "dominios": [
     4,
     10,
     29
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 9,
      "Nombre": "Artes y oficios"
     },
     {
      "Id": 136,
      "Nombre": "Medicina"
     }
    ],
    "Arma": {
     "Id": 14,
     "Nombre": "Bastón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Imhotep es símbolo de conocimiento, arquitectura y sabiduría aplicada. Representa la mente que transforma ideas en legado eterno.",
    "Dominios": [
     {
      "Id": 4,
      "Nombre": "Artífice",
      "Oficial": true
     },
     {
      "Id": 10,
      "Nombre": "Curación",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 49,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 146
    },
    "Nombre": "Imhotep",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 49,
   "nombre": "Imhotep"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     3,
     15,
     109
    ],
    "deidad": {
     "descripcion": "Isis es la gran madre y hechicera suprema, protectora y restauradora. Su poder reside tanto en la magia como en la devoción inquebrantable.",
     "id_alineamiento": 7,
     "id_arma": 14,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Isis",
     "oficial": true,
     "pagina": 148
    },
    "dominios": [
     1,
     5,
     22,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 3,
      "Nombre": "Magia"
     },
     {
      "Id": 15,
      "Nombre": "Fertilidad"
     },
     {
      "Id": 109,
      "Nombre": "Matrimonio"
     }
    ],
    "Arma": {
     "Id": 14,
     "Nombre": "Bastón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Isis es la gran madre y hechicera suprema, protectora y restauradora. Su poder reside tanto en la magia como en la devoción inquebrantable.",
    "Dominios": [
     {
      "Id": 1,
      "Nombre": "Agua",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 50,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 148
    },
    "Nombre": "Isis",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 50,
   "nombre": "Isis"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     60,
     137
    ],
    "deidad": {
     "descripcion": "Neftis camina entre la vida y la muerte, protectora de almas y guardiana de lo oculto. Su presencia es silenciosa, pero constante.",
     "id_alineamiento": 10,
     "id_arma": 8,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Neftis",
     "oficial": true,
     "pagina": 149
    },
    "dominios": [
     5,
     6,
     11,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 60,
      "Nombre": "Muerte"
     },
     {
      "Id": 137,
      "Nombre": "Aflicción"
     }
    ],
    "Arma": {
     "Id": 8,
     "Nombre": "Maza ligera"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Neftis camina entre la vida y la muerte, protectora de almas y guardiana de lo oculto. Su presencia es silenciosa, pero constante.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 11,
      "Nombre": "Descanso",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 51,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 149
    },
    "Nombre": "Neftis",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 51,
   "nombre": "Neftis"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     62,
     63,
     138
    ],
    "deidad": {
     "descripcion": "Osiris reina sobre el más allá como símbolo de muerte y renacimiento. Su juicio no es cruel, pero sí definitivo.",
     "id_alineamiento": 4,
     "id_arma": 33,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Osiris",
     "oficial": true,
     "pagina": 151
    },
    "dominios": [
     2,
     5,
     11,
     20,
     34,
     35
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 4,
     "Id_basico": 1,
     "Nombre": "Legal bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 62,
      "Nombre": "Inframundo"
     },
     {
      "Id": 63,
      "Nombre": "Naturaleza"
     },
     {
      "Id": 138,
      "Nombre": "Cosecha"
     }
    ],
    "Arma": {
     "Id": 33,
     "Nombre": "Mangual"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Osiris reina sobre el más allá como símbolo de muerte y renacimiento. Su juicio no es cruel, pero sí definitivo.",
    "Dominios": [
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 11,
      "Nombre": "Descanso",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     },
     {
      "Id": 35,
      "Nombre": "Vegetal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 52,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 151
    },
    "Nombre": "Osiris",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 52,
   "nombre": "Osiris"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     9,
     24,
     83,
     139
    ],
    "deidad": {
     "descripcion": "Ptah es el creador a través de la palabra y el pensamiento, un dios que moldea la realidad antes de que exista. Su poder reside en la concepción misma del mundo.",
     "id_alineamiento": 5,
     "id_arma": 8,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Ptath",
     "oficial": true,
     "pagina": 152
    },
    "dominios": [
     9,
     20,
     29,
     36
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 5,
     "Id_basico": 2,
     "Nombre": "Legal neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 9,
      "Nombre": "Artes y oficios"
     },
     {
      "Id": 24,
      "Nombre": "Viajar"
     },
     {
      "Id": 83,
      "Nombre": "Secretos"
     },
     {
      "Id": 139,
      "Nombre": "Conocimiento"
     }
    ],
    "Arma": {
     "Id": 8,
     "Nombre": "Maza ligera"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Ptah es el creador a través de la palabra y el pensamiento, un dios que moldea la realidad antes de que exista. Su poder reside en la concepción misma del mundo.",
    "Dominios": [
     {
      "Id": 9,
      "Nombre": "Creación",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     },
     {
      "Id": 36,
      "Nombre": "Viaje",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 53,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 152
    },
    "Nombre": "Ptath",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 53,
   "nombre": "Ptath"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     54,
     55,
     140,
     141,
     142
    ],
    "deidad": {
     "descripcion": "Seth representa la tormenta, la violencia y el caos necesario para romper el orden. Es tanto destructor como fuerza de cambio inevitable.",
     "id_alineamiento": 12,
     "id_arma": 15,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Seth",
     "oficial": true,
     "pagina": 154
    },
    "dominios": [
     2,
     6,
     12,
     16,
     23,
     26
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 12,
     "Id_basico": 9,
     "Nombre": "Caótico maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 54,
      "Nombre": "Mal"
     },
     {
      "Id": 55,
      "Nombre": "Oscuridad"
     },
     {
      "Id": 140,
      "Nombre": "Noche"
     },
     {
      "Id": 141,
      "Nombre": "Tormentas desérticas"
     },
     {
      "Id": 142,
      "Nombre": "Sequía"
     }
    ],
    "Arma": {
     "Id": 15,
     "Nombre": "Lanza"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Seth representa la tormenta, la violencia y el caos necesario para romper el orden. Es tanto destructor como fuerza de cambio inevitable.",
    "Dominios": [
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 26,
      "Nombre": "Oscuridad",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 54,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 154
    },
    "Nombre": "Seth",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 54,
   "nombre": "Seth"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     143,
     144,
     145,
     146
    ],
    "deidad": {
     "descripcion": "Sobek gobierna las aguas salvajes y la fuerza depredadora. Es la brutalidad de la naturaleza que no pide permiso.",
     "id_alineamiento": 6,
     "id_arma": 13,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Sobek",
     "oficial": true,
     "pagina": 155
    },
    "dominios": [
     1,
     3,
     23
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 6,
     "Id_basico": 3,
     "Nombre": "Legal maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 143,
      "Nombre": "Agua"
     },
     {
      "Id": 144,
      "Nombre": "Peligros fluviales"
     },
     {
      "Id": 145,
      "Nombre": "Cocodrilos"
     },
     {
      "Id": 146,
      "Nombre": "Marismas"
     }
    ],
    "Arma": {
     "Id": 13,
     "Nombre": "Lanza corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Sobek gobierna las aguas salvajes y la fuerza depredadora. Es la brutalidad de la naturaleza que no pide permiso.",
    "Dominios": [
     {
      "Id": 1,
      "Nombre": "Agua",
      "Oficial": true
     },
     {
      "Id": 3,
      "Nombre": "Animal",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 55,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 155
    },
    "Nombre": "Sobek",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 55,
   "nombre": "Sobek"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     76,
     139,
     147
    ],
    "deidad": {
     "descripcion": "Thot es el señor del conocimiento, la escritura y la verdad medida. Cada palabra y cada número caen bajo su dominio.",
     "id_alineamiento": 8,
     "id_arma": 14,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 3,
     "nombre": "Thot",
     "oficial": true,
     "pagina": 156
    },
    "dominios": [
     19,
     22,
     29
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 76,
      "Nombre": "Sabiduría"
     },
     {
      "Id": 139,
      "Nombre": "Conocimiento"
     },
     {
      "Id": 147,
      "Nombre": "Aprendizaje"
     }
    ],
    "Arma": {
     "Id": 14,
     "Nombre": "Bastón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Thot es el señor del conocimiento, la escritura y la verdad medida. Cada palabra y cada número caen bajo su dominio.",
    "Dominios": [
     {
      "Id": 19,
      "Nombre": "Inscripción",
      "Oficial": true
     },
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 56,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 156
    },
    "Nombre": "Thot",
    "Oficial": true,
    "Pabellon": {
     "Id": 3,
     "Nombre": "Egipcio"
    }
   },
   "id": 56,
   "nombre": "Thot"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     3,
     11,
     127,
     139
    ],
    "deidad": {
     "descripcion": "Odín es el padre de todo, buscador incansable de conocimiento y sacrificio. Su sabiduría siempre tiene un precio, y él ha pagado más que nadie.",
     "id_alineamiento": 7,
     "id_arma": 13,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Odín",
     "oficial": true,
     "pagina": 168
    },
    "dominios": [
     2,
     18,
     22,
     29,
     33,
     36
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 3,
      "Nombre": "Magia"
     },
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 127,
      "Nombre": "Supremo"
     },
     {
      "Id": 139,
      "Nombre": "Conocimiento"
     }
    ],
    "Arma": {
     "Id": 13,
     "Nombre": "Lanza corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Odín es el padre de todo, buscador incansable de conocimiento y sacrificio. Su sabiduría siempre tiene un precio, y él ha pagado más que nadie.",
    "Dominios": [
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     },
     {
      "Id": 36,
      "Nombre": "Viaje",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 57,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 168
    },
    "Nombre": "Odín",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 57,
   "nombre": "Odín"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     90,
     123
    ],
    "deidad": {
     "descripcion": "Aegir gobierna los mares profundos desde una perspectiva ancestral y distante. Sus dominios son vastos, oscuros y ajenos a la voluntad mortal.",
     "id_alineamiento": 9,
     "id_arma": 41,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Aegir",
     "oficial": true,
     "pagina": 170
    },
    "dominios": [
     1,
     12,
     16,
     23,
     24
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 90,
      "Nombre": "Tormentas"
     },
     {
      "Id": 123,
      "Nombre": "Mar"
     }
    ],
    "Arma": {
     "Id": 41,
     "Nombre": "Gran clava"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Aegir gobierna los mares profundos desde una perspectiva ancestral y distante. Sus dominios son vastos, oscuros y ajenos a la voluntad mortal.",
    "Dominios": [
     {
      "Id": 1,
      "Nombre": "Agua",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 24,
      "Nombre": "Muerte",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 58,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 170
    },
    "Nombre": "Aegir",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 58,
   "nombre": "Aegir"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     10,
     72,
     94,
     148,
     149
    ],
    "deidad": {
     "descripcion": "Bálder es la luz, la pureza y la promesa de un mundo mejor. Su caída simboliza la fragilidad de incluso lo más perfecto.",
     "id_alineamiento": 7,
     "id_arma": 40,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Bálder",
     "oficial": true,
     "pagina": 171
    },
    "dominios": [
     5,
     10,
     29
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 10,
      "Nombre": "Música"
     },
     {
      "Id": 72,
      "Nombre": "Luz"
     },
     {
      "Id": 94,
      "Nombre": "Belleza"
     },
     {
      "Id": 148,
      "Nombre": "Poesía"
     },
     {
      "Id": 149,
      "Nombre": "Renacimiento"
     }
    ],
    "Arma": {
     "Id": 40,
     "Nombre": "Espadón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Bálder es la luz, la pureza y la promesa de un mundo mejor. Su caída simboliza la fragilidad de incluso lo más perfecto.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 10,
      "Nombre": "Curación",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 59,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 171
    },
    "Nombre": "Bálder",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 59,
   "nombre": "Bálder"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     36,
     85
    ],
    "deidad": {
     "descripcion": "Forseti encarna la justicia, la mediación y la resolución de conflictos. Bajo su juicio, incluso los dioses encuentran equilibrio.",
     "id_alineamiento": 8,
     "id_arma": 30,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Forseti",
     "oficial": true,
     "pagina": 173
    },
    "dominios": [
     16,
     27,
     29
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 36,
      "Nombre": "Justicia"
     },
     {
      "Id": 85,
      "Nombre": "Ley"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Forseti encarna la justicia, la mediación y la resolución de conflictos. Bajo su juicio, incluso los dioses encuentran equilibrio.",
    "Dominios": [
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 60,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 173
    },
    "Nombre": "Forseti",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 60,
   "nombre": "Forseti"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     15,
     71,
     100,
     138
    ],
    "deidad": {
     "descripcion": "Frey es dios de la fertilidad, la prosperidad y la abundancia. Su bendición se manifiesta en campos fértiles y vidas plenas.",
     "id_alineamiento": 7,
     "id_arma": 40,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Frey",
     "oficial": true,
     "pagina": 174
    },
    "dominios": [
     2,
     5,
     31,
     35
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 15,
      "Nombre": "Fertilidad"
     },
     {
      "Id": 71,
      "Nombre": "Sol"
     },
     {
      "Id": 100,
      "Nombre": "Agricultura"
     },
     {
      "Id": 138,
      "Nombre": "Cosecha"
     }
    ],
    "Arma": {
     "Id": 40,
     "Nombre": "Espadón"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Frey es dios de la fertilidad, la prosperidad y la abundancia. Su bendición se manifiesta en campos fértiles y vidas plenas.",
    "Dominios": [
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 31,
      "Nombre": "Sol",
      "Oficial": true
     },
     {
      "Id": 35,
      "Nombre": "Vegetal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 61,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 174
    },
    "Nombre": "Frey",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 61,
   "nombre": "Frey"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     3,
     8,
     15,
     93
    ],
    "deidad": {
     "descripcion": "Freya domina el amor, la belleza y la magia más sutil. Es tan poderosa en la guerra como en el deseo.",
     "id_alineamiento": 7,
     "id_arma": 30,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Freya",
     "oficial": true,
     "pagina": 176
    },
    "dominios": [
     2,
     5,
     13,
     22
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 3,
      "Nombre": "Magia"
     },
     {
      "Id": 8,
      "Nombre": "Vanidad"
     },
     {
      "Id": 15,
      "Nombre": "Fertilidad"
     },
     {
      "Id": 93,
      "Nombre": "Amor"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Freya domina el amor, la belleza y la magia más sutil. Es tan poderosa en la guerra como en el deseo.",
    "Dominios": [
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 13,
      "Nombre": "Encanto",
      "Oficial": true
     },
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 62,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 176
    },
    "Nombre": "Freya",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 62,
   "nombre": "Freya"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     15,
     93,
     150
    ],
    "deidad": {
     "descripcion": "Frigga observa los destinos desde una posición silenciosa. Conoce el futuro, pero rara vez interviene en él.",
     "id_alineamiento": 8,
     "id_arma": 0,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Frigga",
     "oficial": true,
     "pagina": 177
    },
    "dominios": [
     2,
     3,
     8,
     29
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 15,
      "Nombre": "Fertilidad"
     },
     {
      "Id": 93,
      "Nombre": "Amor"
     },
     {
      "Id": 150,
      "Nombre": "Nacimiento"
     }
    ],
    "Arma": {
     "Id": 0,
     "Nombre": "Elegir"
    },
    "Arma_comodin": "elegir",
    "Comodin": null,
    "Descripcion": "Frigga observa los destinos desde una posición silenciosa. Conoce el futuro, pero rara vez interviene en él.",
    "Dominios": [
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 3,
      "Nombre": "Animal",
      "Oficial": true
     },
     {
      "Id": 8,
      "Nombre": "Comunidad",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 63,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 177
    },
    "Nombre": "Frigga",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 63,
   "nombre": "Frigga"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     151,
     152,
     153,
     154
    ],
    "deidad": {
     "descripcion": "Heimdall es el vigilante eterno, guardián de los límites entre mundos. Nada escapa a sus sentidos.",
     "id_alineamiento": 4,
     "id_arma": 30,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Heimdall",
     "oficial": true,
     "pagina": 179
    },
    "dominios": [
     5,
     18,
     20
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 4,
     "Id_basico": 1,
     "Nombre": "Legal bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 151,
      "Nombre": "Vigilancia"
     },
     {
      "Id": 152,
      "Nombre": "Vista"
     },
     {
      "Id": 153,
      "Nombre": "Oído"
     },
     {
      "Id": 154,
      "Nombre": "Lealtad"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Heimdall es el vigilante eterno, guardián de los límites entre mundos. Nada escapa a sus sentidos.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 64,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 179
    },
    "Nombre": "Heimdall",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 64,
   "nombre": "Heimdall"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     60,
     62
    ],
    "deidad": {
     "descripcion": "Hela gobierna sobre los muertos olvidados, aquellos sin gloria ni honor. Su reino es frío, pero justo en su propia lógica.",
     "id_alineamiento": 9,
     "id_arma": 30,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Hela",
     "oficial": true,
     "pagina": 180
    },
    "dominios": [
     12,
     23,
     24
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 60,
      "Nombre": "Muerte"
     },
     {
      "Id": 62,
      "Nombre": "Inframundo"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hela gobierna sobre los muertos olvidados, aquellos sin gloria ni honor. Su reino es frío, pero justo en su propia lógica.",
    "Dominios": [
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 24,
      "Nombre": "Muerte",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 65,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 180
    },
    "Nombre": "Hela",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 65,
   "nombre": "Hela"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     64,
     130,
     155
    ],
    "deidad": {
     "descripcion": "Hermod es el mensajero veloz entre mundos, símbolo de lealtad y determinación. Su valor se mide en acciones, no en palabras.",
     "id_alineamiento": 11,
     "id_arma": 31,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Hermod",
     "oficial": true,
     "pagina": 182
    },
    "dominios": [
     6,
     32,
     36
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 11,
     "Id_basico": 8,
     "Nombre": "Caótico neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 64,
      "Nombre": "Libertad"
     },
     {
      "Id": 130,
      "Nombre": "Suerte"
     },
     {
      "Id": 155,
      "Nombre": "Comunicación"
     }
    ],
    "Arma": {
     "Id": 31,
     "Nombre": "Estoque"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Hermod es el mensajero veloz entre mundos, símbolo de lealtad y determinación. Su valor se mide en acciones, no en palabras.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     },
     {
      "Id": 36,
      "Nombre": "Viaje",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 66,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 182
    },
    "Nombre": "Hermod",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 66,
   "nombre": "Hermod"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     70,
     113,
     156
    ],
    "deidad": {
     "descripcion": "Loki es el engaño hecho dios, cambiante, impredecible y peligrosamente inteligente. Su ingenio es tan útil como destructivo.",
     "id_alineamiento": 12,
     "id_arma": 5,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Loki",
     "oficial": true,
     "pagina": 183
    },
    "dominios": [
     6,
     12,
     23,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 12,
     "Id_basico": 9,
     "Nombre": "Caótico maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 70,
      "Nombre": "Engaños"
     },
     {
      "Id": 113,
      "Nombre": "Ladrones"
     },
     {
      "Id": 156,
      "Nombre": "Homicidio"
     }
    ],
    "Arma": {
     "Id": 5,
     "Nombre": "Daga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Loki es el engaño hecho dios, cambiante, impredecible y peligrosamente inteligente. Su ingenio es tan útil como destructivo.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 67,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 183
    },
    "Nombre": "Loki",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 67,
   "nombre": "Loki"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     2,
     112,
     123
    ],
    "deidad": {
     "descripcion": "Njord gobierna los mares, el viento y la riqueza que llega por el comercio. Su favor trae prosperidad a quienes dependen del agua.",
     "id_alineamiento": 7,
     "id_arma": 16,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Njord",
     "oficial": true,
     "pagina": 184
    },
    "dominios": [
     1,
     2,
     5
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 2,
      "Nombre": "Viento"
     },
     {
      "Id": 112,
      "Nombre": "Comercio"
     },
     {
      "Id": 123,
      "Nombre": "Mar"
     }
    ],
    "Arma": {
     "Id": 16,
     "Nombre": "Lanza larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Njord gobierna los mares, el viento y la riqueza que llega por el comercio. Su favor trae prosperidad a quienes dependen del agua.",
    "Dominios": [
     {
      "Id": 1,
      "Nombre": "Agua",
      "Oficial": true
     },
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 68,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 184
    },
    "Nombre": "Njord",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 68,
   "nombre": "Njord"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     24,
     71,
     72
    ],
    "deidad": {
     "descripcion": "Odur es una figura envuelta en misterio, asociado al amor y a la ausencia. Su historia se define tanto por su presencia como por su pérdida.",
     "id_alineamiento": 10,
     "id_arma": 56,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Odur",
     "oficial": true,
     "pagina": 186
    },
    "dominios": [
     6,
     15,
     31
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 24,
      "Nombre": "Viajar"
     },
     {
      "Id": 71,
      "Nombre": "Sol"
     },
     {
      "Id": 72,
      "Nombre": "Luz"
     }
    ],
    "Arma": {
     "Id": 56,
     "Nombre": "Espada bastarda"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Odur es una figura envuelta en misterio, asociado al amor y a la ausencia. Su historia se define tanto por su presencia como por su pérdida.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 15,
      "Nombre": "Fuego",
      "Oficial": true
     },
     {
      "Id": 31,
      "Nombre": "Sol",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 69,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 186
    },
    "Nombre": "Odur",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 69,
   "nombre": "Odur"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     157
    ],
    "deidad": {
     "descripcion": "Sif representa la fertilidad, la tierra cultivada y la estabilidad del hogar. Su imagen es la de una abundancia protegida.",
     "id_alineamiento": 10,
     "id_arma": 30,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Sif",
     "oficial": true,
     "pagina": 187
    },
    "dominios": [
     5,
     6,
     18
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 157,
      "Nombre": "Duelos"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Sif representa la fertilidad, la tierra cultivada y la estabilidad del hogar. Su imagen es la de una abundancia protegida.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 70,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 187
    },
    "Nombre": "Sif",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 70,
   "nombre": "Sif"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     104,
     122
    ],
    "deidad": {
     "descripcion": "Skadi es la diosa del invierno, la caza y la supervivencia en lo inhóspito. Su dominio es frío, implacable y hermoso.",
     "id_alineamiento": 8,
     "id_arma": 42,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Skadi",
     "oficial": true,
     "pagina": 189
    },
    "dominios": [
     12,
     16,
     34
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 104,
      "Nombre": "Tierra"
     },
     {
      "Id": 122,
      "Nombre": "Montañas"
     }
    ],
    "Arma": {
     "Id": 42,
     "Nombre": "Gran hacha"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Skadi es la diosa del invierno, la caza y la supervivencia en lo inhóspito. Su dominio es frío, implacable y hermoso.",
    "Dominios": [
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 71,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 189
    },
    "Nombre": "Skadi",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 71,
   "nombre": "Skadi"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     131
    ],
    "deidad": {
     "descripcion": "Surtur es el fuego destructor que marcará el final de los tiempos. No crea, no negocia: solo consume.",
     "id_alineamiento": 6,
     "id_arma": 30,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Surtur",
     "oficial": true,
     "pagina": 190
    },
    "dominios": [
     7,
     15,
     16,
     18,
     20,
     23
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 6,
     "Id_basico": 3,
     "Nombre": "Legal maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 131,
      "Nombre": "Fuego"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Surtur es el fuego destructor que marcará el final de los tiempos. No crea, no negocia: solo consume.",
    "Dominios": [
     {
      "Id": 7,
      "Nombre": "Clima",
      "Oficial": true
     },
     {
      "Id": 15,
      "Nombre": "Fuego",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 72,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 190
    },
    "Nombre": "Surtur",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 72,
   "nombre": "Surtur"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     90,
     158
    ],
    "deidad": {
     "descripcion": "Thor es la tormenta hecha carne, protector de los mortales y enemigo de los gigantes. Su fuerza es directa, brutal y fiable.",
     "id_alineamiento": 10,
     "id_arma": 34,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Thor",
     "oficial": true,
     "pagina": 192
    },
    "dominios": [
     5,
     6,
     16,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 90,
      "Nombre": "Tormentas"
     },
     {
      "Id": 158,
      "Nombre": "Trueno"
     }
    ],
    "Arma": {
     "Id": 34,
     "Nombre": "Martillo de guerra"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Thor es la tormenta hecha carne, protector de los mortales y enemigo de los gigantes. Su fuerza es directa, brutal y fiable.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 73,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 192
    },
    "Nombre": "Thor",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 73,
   "nombre": "Thor"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     11,
     159,
     160
    ],
    "deidad": {
     "descripcion": "Thyrm es un gigante de hielo ligado al desafío y la confrontación. Representa la amenaza constante contra el orden establecido.",
     "id_alineamiento": 12,
     "id_arma": 42,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Thyrm",
     "oficial": true,
     "pagina": 194
    },
    "dominios": [
     6,
     16,
     18,
     23,
     34
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 12,
     "Id_basico": 9,
     "Nombre": "Caótico maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 11,
      "Nombre": "Guerra"
     },
     {
      "Id": 159,
      "Nombre": "Frio"
     },
     {
      "Id": 160,
      "Nombre": "Gigantes"
     }
    ],
    "Arma": {
     "Id": 42,
     "Nombre": "Gran hacha"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Thyrm es un gigante de hielo ligado al desafío y la confrontación. Representa la amenaza constante contra el orden establecido.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 74,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 194
    },
    "Nombre": "Thyrm",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 74,
   "nombre": "Thyrm"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     48,
     161,
     162,
     163,
     164
    ],
    "deidad": {
     "descripcion": "Tyr es el dios del valor, el sacrificio y la justicia. Su honor se demuestra en lo que está dispuesto a perder.",
     "id_alineamiento": 5,
     "id_arma": 30,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Tyr",
     "oficial": true,
     "pagina": 196
    },
    "dominios": [
     18,
     20,
     27
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 5,
     "Id_basico": 2,
     "Nombre": "Legal neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 48,
      "Nombre": "Coraje"
     },
     {
      "Id": 161,
      "Nombre": "Confianza"
     },
     {
      "Id": 162,
      "Nombre": "Estrategia"
     },
     {
      "Id": 163,
      "Nombre": "Táctica"
     },
     {
      "Id": 164,
      "Nombre": "Escritura"
     }
    ],
    "Arma": {
     "Id": 30,
     "Nombre": "Espada larga"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Tyr es el dios del valor, el sacrificio y la justicia. Su honor se demuestra en lo que está dispuesto a perder.",
    "Dominios": [
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 75,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 196
    },
    "Nombre": "Tyr",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 75,
   "nombre": "Tyr"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     65,
     165,
     166
    ],
    "deidad": {
     "descripcion": "Uller domina el arco, la caza y el combate en terrenos helados. Es un dios silencioso, preciso y letal.",
     "id_alineamiento": 11,
     "id_arma": 50,
     "id_genero": 1,
     "id_manual": 9,
     "id_pabellon": 4,
     "nombre": "Uller",
     "oficial": true,
     "pagina": 197
    },
    "dominios": [
     6,
     27,
     36
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 11,
     "Id_basico": 8,
     "Nombre": "Caótico neutral"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 65,
      "Nombre": "Caza"
     },
     {
      "Id": 165,
      "Nombre": "Arqueros"
     },
     {
      "Id": 166,
      "Nombre": "Invierno"
     }
    ],
    "Arma": {
     "Id": 50,
     "Nombre": "Arco largo"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Uller domina el arco, la caza y el combate en terrenos helados. Es un dios silencioso, preciso y letal.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 36,
      "Nombre": "Viaje",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 76,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 197
    },
    "Nombre": "Uller",
    "Oficial": true,
    "Pabellon": {
     "Id": 4,
     "Nombre": "Nórdico"
    }
   },
   "id": 76,
   "nombre": "Uller"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     57,
     60,
     167,
     168
    ],
    "deidad": {
     "descripcion": "Taiia representa aspectos duales de la divinidad, manifestándose en formas distintas según el contexto. Su naturaleza es cambiante y difícil de definir.",
     "id_alineamiento": 8,
     "id_arma": 36,
     "id_genero": 2,
     "id_manual": 9,
     "id_pabellon": 5,
     "nombre": "Taiia 1",
     "oficial": true,
     "pagina": 203
    },
    "dominios": [
     2,
     5,
     6,
     10,
     20,
     22,
     27,
     29,
     30,
     32,
     34,
     36
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 8,
     "Id_basico": 5,
     "Nombre": "Neutral auténtico"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 57,
      "Nombre": "Creación"
     },
     {
      "Id": 60,
      "Nombre": "Muerte"
     },
     {
      "Id": 167,
      "Nombre": "Destrucción"
     },
     {
      "Id": 168,
      "Nombre": "Vida mortal"
     }
    ],
    "Arma": {
     "Id": 36,
     "Nombre": "Tridente"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Taiia representa aspectos duales de la divinidad, manifestándose en formas distintas según el contexto. Su naturaleza es cambiante y difícil de definir.",
    "Dominios": [
     {
      "Id": 2,
      "Nombre": "Aire",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 10,
      "Nombre": "Curación",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 22,
      "Nombre": "Magia",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     },
     {
      "Id": 30,
      "Nombre": "Sal",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     },
     {
      "Id": 36,
      "Nombre": "Viaje",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 77,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 203
    },
    "Nombre": "Taiia 1",
    "Oficial": true,
    "Pabellon": {
     "Id": 5,
     "Nombre": "La fe del sol"
    }
   },
   "id": 77,
   "nombre": "Taiia 1"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     57,
     60,
     167,
     168
    ],
    "deidad": {
     "descripcion": "Esta segunda manifestación de Taiia refleja su faceta más distante y abstracta, menos accesible para la comprensión mortal.",
     "id_alineamiento": null,
     "id_arma": 32,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 5,
     "nombre": "Taiia 2",
     "oficial": true,
     "pagina": 203
    },
    "dominios": [
     1,
     6,
     12,
     15,
     16,
     18,
     20,
     23,
     24,
     33
    ]
   },
   "get": {
    "Alineamiento": null,
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 57,
      "Nombre": "Creación"
     },
     {
      "Id": 60,
      "Nombre": "Muerte"
     },
     {
      "Id": 167,
      "Nombre": "Destrucción"
     },
     {
      "Id": 168,
      "Nombre": "Vida mortal"
     }
    ],
    "Arma": {
     "Id": 32,
     "Nombre": "Hacha de batalla"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Esta segunda manifestación de Taiia refleja su faceta más distante y abstracta, menos accesible para la comprensión mortal.",
    "Dominios": [
     {
      "Id": 1,
      "Nombre": "Agua",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 15,
      "Nombre": "Fuego",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 20,
      "Nombre": "Ley",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 24,
      "Nombre": "Muerte",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 78,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 203
    },
    "Nombre": "Taiia 2",
    "Oficial": true,
    "Pabellon": {
     "Id": 5,
     "Nombre": "La fe del sol"
    }
   },
   "id": 78,
   "nombre": "Taiia 2"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     72,
     95,
     169
    ],
    "deidad": {
     "descripcion": "Elishar es una deidad ligada a conceptos elevados de orden y propósito, venerada por quienes buscan sentido en lo trascendente.",
     "id_alineamiento": 7,
     "id_arma": 29,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 6,
     "nombre": "Elishar",
     "oficial": true,
     "pagina": 206
    },
    "dominios": [
     5,
     10,
     27,
     29,
     31,
     32
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 72,
      "Nombre": "Luz"
     },
     {
      "Id": 95,
      "Nombre": "Profecías"
     },
     {
      "Id": 169,
      "Nombre": "Energía positiva"
     }
    ],
    "Arma": {
     "Id": 29,
     "Nombre": "Cimitarra"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Elishar es una deidad ligada a conceptos elevados de orden y propósito, venerada por quienes buscan sentido en lo trascendente.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 10,
      "Nombre": "Curación",
      "Oficial": true
     },
     {
      "Id": 27,
      "Nombre": "Protección",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     },
     {
      "Id": 31,
      "Nombre": "Sol",
      "Oficial": true
     },
     {
      "Id": 32,
      "Nombre": "Suerte",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 79,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 206
    },
    "Nombre": "Elishar",
    "Oficial": true,
    "Pabellon": {
     "Id": 6,
     "Nombre": "Los seguidores de la luz"
    }
   },
   "id": 79,
   "nombre": "Elishar"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     55,
     167,
     170
    ],
    "deidad": {
     "descripcion": "Toldoth encarna la herencia, la transmisión del conocimiento y la continuidad de las generaciones.",
     "id_alineamiento": 9,
     "id_arma": 32,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 6,
     "nombre": "Toldoth",
     "oficial": true,
     "pagina": 210
    },
    "dominios": [
     12,
     16,
     18,
     23,
     24,
     33
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 55,
      "Nombre": "Oscuridad"
     },
     {
      "Id": 167,
      "Nombre": "Destrucción"
     },
     {
      "Id": 170,
      "Nombre": "Energía negativa"
     }
    ],
    "Arma": {
     "Id": 32,
     "Nombre": "Hacha de batalla"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Toldoth encarna la herencia, la transmisión del conocimiento y la continuidad de las generaciones.",
    "Dominios": [
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 16,
      "Nombre": "Fuerza",
      "Oficial": true
     },
     {
      "Id": 18,
      "Nombre": "Guerra",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 24,
      "Nombre": "Muerte",
      "Oficial": true
     },
     {
      "Id": 33,
      "Nombre": "Superchería",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 80,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 210
    },
    "Nombre": "Toldoth",
    "Oficial": true,
    "Pabellon": {
     "Id": 6,
     "Nombre": "Los seguidores de la luz"
    }
   },
   "id": 80,
   "nombre": "Toldoth"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     104,
     171,
     172
    ],
    "deidad": {
     "descripcion": "Dennari representa la autoridad, la estructura y el poder organizado. Su culto valora la jerarquía y la estabilidad.",
     "id_alineamiento": 10,
     "id_arma": 34,
     "id_genero": 4,
     "id_manual": 9,
     "id_pabellon": 7,
     "nombre": "Dennari",
     "oficial": true,
     "pagina": 211
    },
    "dominios": [
     5,
     6,
     28,
     34,
     35
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 10,
     "Id_basico": 7,
     "Nombre": "Caótico bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 104,
      "Nombre": "Tierra"
     },
     {
      "Id": 171,
      "Nombre": "Redención"
     },
     {
      "Id": 172,
      "Nombre": "Sufrimiento"
     }
    ],
    "Arma": {
     "Id": 34,
     "Nombre": "Martillo de guerra"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Dennari representa la autoridad, la estructura y el poder organizado. Su culto valora la jerarquía y la estabilidad.",
    "Dominios": [
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 28,
      "Nombre": "Redención",
      "Oficial": true
     },
     {
      "Id": 34,
      "Nombre": "Tierra",
      "Oficial": true
     },
     {
      "Id": 35,
      "Nombre": "Vegetal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 81,
    "Manual": {
     "Id": 9,
     "Nombre": "Dioses y semidioses",
     "Pagina": 211
    },
    "Nombre": "Dennari",
    "Oficial": true,
    "Pabellon": {
     "Id": 7,
     "Nombre": "Sin panteón o panteones menores"
    }
   },
   "id": 81,
   "nombre": "Dennari"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     71,
     73,
     173,
     174
    ],
    "deidad": {
     "descripcion": "Skerrit es un espíritu salvaje de los bosques profundos, protector de lo natural y enemigo de la intrusión civilizada.",
     "id_alineamiento": 7,
     "id_arma": 15,
     "id_genero": 1,
     "id_manual": 8,
     "id_pabellon": 1,
     "nombre": "Skerrit",
     "oficial": true,
     "pagina": 95
    },
    "dominios": [
     3,
     5,
     35
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 7,
     "Id_basico": 4,
     "Nombre": "Neutral bueno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 71,
      "Nombre": "Sol"
     },
     {
      "Id": 73,
      "Nombre": "Curación"
     },
     {
      "Id": 173,
      "Nombre": "Animal"
     },
     {
      "Id": 174,
      "Nombre": "Vegetal"
     }
    ],
    "Arma": {
     "Id": 15,
     "Nombre": "Lanza"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Skerrit es un espíritu salvaje de los bosques profundos, protector de lo natural y enemigo de la intrusión civilizada.",
    "Dominios": [
     {
      "Id": 3,
      "Nombre": "Animal",
      "Oficial": true
     },
     {
      "Id": 5,
      "Nombre": "Bien",
      "Oficial": true
     },
     {
      "Id": 35,
      "Nombre": "Vegetal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 82,
    "Manual": {
     "Id": 8,
     "Nombre": "Defensores de la fe",
     "Pagina": 95
    },
    "Nombre": "Skerrit",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 82,
   "nombre": "Skerrit"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     167,
     226,
     227
    ],
    "deidad": {
     "descripcion": "El Paciente es una deidad neutral maligna, también llamada el Vigilante oscuro, que aguarda en la sombra y ataca cuando llega su hora. Su culto, con dominios de Corrupción, Mal y Oscuridad, atrae sobre todo a aberraciones como contempladores y azotamentes.",
     "id_alineamiento": 9,
     "id_arma": 33,
     "id_genero": 4,
     "id_manual": 41,
     "id_pabellon": 1,
     "nombre": "El Paciente",
     "oficial": true,
     "pagina": 11
    },
    "dominios": [
     23,
     26,
     180
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 167,
      "Nombre": "Destrucción"
     },
     {
      "Id": 226,
      "Nombre": "Espera en la oscuridad"
     },
     {
      "Id": 227,
      "Nombre": "Consumo de todo a su paso"
     }
    ],
    "Arma": {
     "Id": 33,
     "Nombre": "Mangual"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "El Paciente es una deidad neutral maligna, también llamada el Vigilante oscuro, que aguarda en la sombra y ataca cuando llega su hora. Su culto, con dominios de Corrupción, Mal y Oscuridad, atrae sobre todo a aberraciones como contempladores y azotamentes.",
    "Dominios": [
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 26,
      "Nombre": "Oscuridad",
      "Oficial": true
     },
     {
      "Id": 180,
      "Nombre": "Corrupción",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 101,
    "Manual": {
     "Id": 41,
     "Nombre": "Libro de oscuridad vil",
     "Pagina": 11
    },
    "Nombre": "El Paciente",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 101,
   "nombre": "El Paciente"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     228,
     229,
     230,
     231
    ],
    "deidad": {
     "descripcion": "El Xammux es una potencia neutral maligna formada por varios seres a la vez, patrona de quienes buscan saber sin escrúpulos. Su clero estudia la biología y la resistencia de criaturas vivas con total frialdad, y concede los dominios de Mal, Oscuridad y Saber.",
     "id_alineamiento": 9,
     "id_arma": 23,
     "id_genero": 4,
     "id_manual": 41,
     "id_pabellon": 1,
     "nombre": "El Xammux",
     "oficial": true,
     "pagina": 12
    },
    "dominios": [
     23,
     26,
     29
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 228,
      "Nombre": "Pensamiento frío y analítico"
     },
     {
      "Id": 229,
      "Nombre": "Indiferencia absoluta"
     },
     {
      "Id": 230,
      "Nombre": "Conocimiento prohibido"
     },
     {
      "Id": 231,
      "Nombre": "Experimentación"
     }
    ],
    "Arma": {
     "Id": 23,
     "Nombre": "Espada corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "El Xammux es una potencia neutral maligna formada por varios seres a la vez, patrona de quienes buscan saber sin escrúpulos. Su clero estudia la biología y la resistencia de criaturas vivas con total frialdad, y concede los dominios de Mal, Oscuridad y Saber.",
    "Dominios": [
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 26,
      "Nombre": "Oscuridad",
      "Oficial": true
     },
     {
      "Id": 29,
      "Nombre": "Saber",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 4,
     "Nombre": "Sin genero"
    },
    "Id": 102,
    "Manual": {
     "Id": 41,
     "Nombre": "Libro de oscuridad vil",
     "Pagina": 12
    },
    "Nombre": "El Xammux",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 102,
   "nombre": "El Xammux"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     66,
     232,
     233,
     234
    ],
    "deidad": {
     "descripcion": "Karaan, el dios Bestia, es una deidad caótica maligna de la violencia salvaje, la destrucción sin sentido y los licántropos. Patrón de gnolls, osgos y otras criaturas bestiales, sus clérigos desprecian la civilización y empuñan la gran clava en su nombre.",
     "id_alineamiento": 12,
     "id_arma": 41,
     "id_genero": 1,
     "id_manual": 41,
     "id_pabellon": 1,
     "nombre": "Karaan",
     "oficial": true,
     "pagina": 11
    },
    "dominios": [
     6,
     12,
     179
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 12,
     "Id_basico": 9,
     "Nombre": "Caótico maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 66,
      "Nombre": "Bestias"
     },
     {
      "Id": 232,
      "Nombre": "Salvajismo"
     },
     {
      "Id": 233,
      "Nombre": "Destrucción sin sentido"
     },
     {
      "Id": 234,
      "Nombre": "Licántropos"
     }
    ],
    "Arma": {
     "Id": 41,
     "Nombre": "Gran clava"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Karaan, el dios Bestia, es una deidad caótica maligna de la violencia salvaje, la destrucción sin sentido y los licántropos. Patrón de gnolls, osgos y otras criaturas bestiales, sus clérigos desprecian la civilización y empuñan la gran clava en su nombre.",
    "Dominios": [
     {
      "Id": 6,
      "Nombre": "Caos",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 179,
      "Nombre": "Bestial",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 103,
    "Manual": {
     "Id": 41,
     "Nombre": "Libro de oscuridad vil",
     "Pagina": 11
    },
    "Nombre": "Karaan",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 103,
   "nombre": "Karaan"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     61,
     235,
     236
    ],
    "deidad": {
     "descripcion": "Rallaster, dios caótico maligno de las Cuchillas y de los hombres locos, patrón del asesinato, la tortura y la psicopatía. Sus clérigos son asesinos solitarios que a menudo ocultan su culto tras una vida corriente, con santuarios secretos.",
     "id_alineamiento": 12,
     "id_arma": 23,
     "id_genero": 1,
     "id_manual": 41,
     "id_pabellon": 1,
     "nombre": "Rallaster",
     "oficial": true,
     "pagina": 11
    },
    "dominios": [
     12,
     23,
     183
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 12,
     "Id_basico": 9,
     "Nombre": "Caótico maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 61,
      "Nombre": "Asesinato"
     },
     {
      "Id": 235,
      "Nombre": "Tortura"
     },
     {
      "Id": 236,
      "Nombre": "Comportamiento psicopático"
     }
    ],
    "Arma": {
     "Id": 23,
     "Nombre": "Espada corta"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Rallaster, dios caótico maligno de las Cuchillas y de los hombres locos, patrón del asesinato, la tortura y la psicopatía. Sus clérigos son asesinos solitarios que a menudo ocultan su culto tras una vida corriente, con santuarios secretos.",
    "Dominios": [
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 183,
      "Nombre": "Dolor",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 104,
    "Manual": {
     "Id": 41,
     "Nombre": "Libro de oscuridad vil",
     "Pagina": 11
    },
    "Nombre": "Rallaster",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 104,
   "nombre": "Rallaster"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     235,
     237,
     238,
     239
    ],
    "deidad": {
     "descripcion": "Scahrossar, el Ama del dolor exquisito, es una deidad legal maligna de la crueldad y la tortura, con látigo como arma y los dominios de Dolor, Mal y Muerte. Sus clérigos, ocultos tras máscaras, torturan a sus víctimas durante días en templos disimulados tras tiendas corrientes.",
     "id_alineamiento": 6,
     "id_arma": 58,
     "id_genero": 2,
     "id_manual": 41,
     "id_pabellon": 1,
     "nombre": "Scahrossar",
     "oficial": true,
     "pagina": 11
    },
    "dominios": [
     23,
     24,
     183
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 6,
     "Id_basico": 3,
     "Nombre": "Legal maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 235,
      "Nombre": "Tortura"
     },
     {
      "Id": 237,
      "Nombre": "Dolor exquisito"
     },
     {
      "Id": 238,
      "Nombre": "Sadismo"
     },
     {
      "Id": 239,
      "Nombre": "Crueldad"
     }
    ],
    "Arma": {
     "Id": 58,
     "Nombre": "Látigo"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Scahrossar, el Ama del dolor exquisito, es una deidad legal maligna de la crueldad y la tortura, con látigo como arma y los dominios de Dolor, Mal y Muerte. Sus clérigos, ocultos tras máscaras, torturan a sus víctimas durante días en templos disimulados tras tiendas corrientes.",
    "Dominios": [
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     },
     {
      "Id": 24,
      "Nombre": "Muerte",
      "Oficial": true
     },
     {
      "Id": 183,
      "Nombre": "Dolor",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 2,
     "Nombre": "Hembra"
    },
    "Id": 105,
    "Manual": {
     "Id": 41,
     "Nombre": "Libro de oscuridad vil",
     "Pagina": 11
    },
    "Nombre": "Scahrossar",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 105,
   "nombre": "Scahrossar"
  },
  {
   "cuerpo": {
    "alineamientos_devotos": [],
    "ambitos": [
     123,
     240,
     241,
     242
    ],
    "deidad": {
     "descripcion": "Yeathan es un dios neutral maligno de las profundidades marinas al que rinden culto abolez, kuo-toas y algunos sajuaguín; empuña el tridente y concede los dominios de Agua, Destrucción y Mal.",
     "id_alineamiento": 9,
     "id_arma": 36,
     "id_genero": 1,
     "id_manual": 41,
     "id_pabellon": 1,
     "nombre": "Yeathan",
     "oficial": true,
     "pagina": 12
    },
    "dominios": [
     1,
     12,
     23
    ]
   },
   "get": {
    "Alineamiento": {
     "Id": 9,
     "Id_basico": 6,
     "Nombre": "Neutral maligno"
    },
    "Alineamientos_devotos": [],
    "Ambitos": [
     {
      "Id": 123,
      "Nombre": "Mar"
     },
     {
      "Id": 240,
      "Nombre": "Profundidades malignas"
     },
     {
      "Id": 241,
      "Nombre": "Oscuridad profunda"
     },
     {
      "Id": 242,
      "Nombre": "Último aliento"
     }
    ],
    "Arma": {
     "Id": 36,
     "Nombre": "Tridente"
    },
    "Arma_comodin": null,
    "Comodin": null,
    "Descripcion": "Yeathan es un dios neutral maligno de las profundidades marinas al que rinden culto abolez, kuo-toas y algunos sajuaguín; empuña el tridente y concede los dominios de Agua, Destrucción y Mal.",
    "Dominios": [
     {
      "Id": 1,
      "Nombre": "Agua",
      "Oficial": true
     },
     {
      "Id": 12,
      "Nombre": "Destrucción",
      "Oficial": true
     },
     {
      "Id": 23,
      "Nombre": "Mal",
      "Oficial": true
     }
    ],
    "Genero": {
     "Id": 1,
     "Nombre": "Macho"
    },
    "Id": 106,
    "Manual": {
     "Id": 41,
     "Nombre": "Libro de oscuridad vil",
     "Pagina": 12
    },
    "Nombre": "Yeathan",
    "Oficial": true,
    "Pabellon": {
     "Id": 1,
     "Nombre": "D&d"
    }
   },
   "id": 106,
   "nombre": "Yeathan"
  }
 ],
 "manuales": [
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 1,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Aguas profundas",
    "Oficial": true
   },
   "id": 1,
   "nombre": "Aguas profundas"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 2,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Arcanos desenterados",
    "Oficial": true
   },
   "id": 2,
   "nombre": "Arcanos desenterados"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 3,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Armas de leyenda",
    "Oficial": true
   },
   "id": 3,
   "nombre": "Armas de leyenda"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 4,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Aventuras orientales",
    "Oficial": true
   },
   "id": 4,
   "nombre": "Aventuras orientales"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": true,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 5,
    "Incluye_clases": 0,
    "Incluye_conjuros": 1,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Compendio de conjuros",
    "Oficial": true
   },
   "id": 5,
   "nombre": "Compendio de conjuros"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 6,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Compendio de dotes",
    "Oficial": true
   },
   "id": 6,
   "nombre": "Compendio de dotes"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 7,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Compendio de objetos mágicos",
    "Oficial": true
   },
   "id": 7,
   "nombre": "Compendio de objetos mágicos"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 8,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Defensores de la fe",
    "Oficial": true
   },
   "id": 8,
   "nombre": "Defensores de la fe"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 9,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Dioses y semidioses",
    "Oficial": true
   },
   "id": 9,
   "nombre": "Dioses y semidioses"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 10,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Draconomicón",
    "Oficial": true
   },
   "id": 10,
   "nombre": "Draconomicón"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": true,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 11,
    "Incluye_clases": 1,
    "Incluye_conjuros": 1,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El arcano completo",
    "Oficial": true
   },
   "id": 11,
   "nombre": "El arcano completo"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": true,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 12,
    "Incluye_clases": 1,
    "Incluye_conjuros": 1,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El combatiente completo",
    "Oficial": true
   },
   "id": 12,
   "nombre": "El combatiente completo"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 13,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El este inaccesible",
    "Oficial": true
   },
   "id": 13,
   "nombre": "El este inaccesible"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 14,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Fes y panteones",
    "Oficial": true
   },
   "id": 14,
   "nombre": "Fes y panteones"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": true,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 15,
    "Incluye_clases": 1,
    "Incluye_conjuros": 1,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El divino completo",
    "Oficial": true
   },
   "id": 15,
   "nombre": "El divino completo"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 16,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El libro de las nueve espadas",
    "Oficial": true
   },
   "id": 16,
   "nombre": "El libro de las nueve espadas"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 17,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El sur radiante",
    "Oficial": true
   },
   "id": 17,
   "nombre": "El sur radiante"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 18,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Entornos urbanos",
    "Oficial": true
   },
   "id": 18,
   "nombre": "Entornos urbanos"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": true,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 19,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 1,
    "Incluye_tipos": 0,
    "Nombre": "Escenario de campaña (Eberron)",
    "Oficial": true
   },
   "id": 19,
   "nombre": "Escenario de campaña (Eberron)"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": true,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 20,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 1,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Escenario de campaña (faerun)",
    "Oficial": true
   },
   "id": 20,
   "nombre": "Escenario de campaña (faerun)"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 21,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Especies salvajes",
    "Oficial": true
   },
   "id": 21,
   "nombre": "Especies salvajes"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 22,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Guia de armas y equipos",
    "Oficial": true
   },
   "id": 22,
   "nombre": "Guia de armas y equipos"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 23,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Guia del constructor de fortalezas",
    "Oficial": true
   },
   "id": 23,
   "nombre": "Guia del constructor de fortalezas"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 24,
    "Incluye_clases": 1,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Guia del dungeon master 1",
    "Oficial": true
   },
   "id": 24,
   "nombre": "Guia del dungeon master 1"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 25,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Guia del dungeon master 2",
    "Oficial": true
   },
   "id": 25,
   "nombre": "Guia del dungeon master 2"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 26,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Guia del jugador (faerun)",
    "Oficial": true
   },
   "id": 26,
   "nombre": "Guia del jugador (faerun)"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 27,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Heroes de guerra",
    "Oficial": true
   },
   "id": 27,
   "nombre": "Heroes de guerra"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 28,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El mago completo",
    "Oficial": true
   },
   "id": 28,
   "nombre": "El mago completo"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 29,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El sin verguenza completo",
    "Oficial": true
   },
   "id": 29,
   "nombre": "El sin verguenza completo"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 30,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Magia dracónica",
    "Oficial": true
   },
   "id": 30,
   "nombre": "Magia dracónica"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": true,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": true,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 31,
    "Incluye_clases": 1,
    "Incluye_conjuros": 1,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 1,
    "Incluye_tipos": 0,
    "Nombre": "Magia del incarnum",
    "Oficial": true
   },
   "id": 31,
   "nombre": "Magia del incarnum"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 32,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Razas del destino",
    "Oficial": true
   },
   "id": 32,
   "nombre": "Razas del destino"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 33,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Razas de la piedra",
    "Oficial": true
   },
   "id": 33,
   "nombre": "Razas de la piedra"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": false,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": true,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 34,
    "Incluye_clases": 1,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 1,
    "Incluye_tipos": 0,
    "Nombre": "Razas del dragón",
    "Oficial": true
   },
   "id": 34,
   "nombre": "Razas del dragón"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": true,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 35,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 1,
    "Incluye_tipos": 0,
    "Nombre": "Razas de lo salvaje",
    "Oficial": true
   },
   "id": 35,
   "nombre": "Razas de lo salvaje"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 36,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "La historia de los reinos",
    "Oficial": true
   },
   "id": 36,
   "nombre": "La historia de los reinos"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 37,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "La infraoscuridad",
    "Oficial": true
   },
   "id": 37,
   "nombre": "La infraoscuridad"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 38,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "La senda de los fantasmas",
    "Oficial": true
   },
   "id": 38,
   "nombre": "La senda de los fantasmas"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 39,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Libris mortis",
    "Oficial": true
   },
   "id": 39,
   "nombre": "Libris mortis"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": true,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 40,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 1,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Libro de obras elevadas",
    "Oficial": true
   },
   "id": 40,
   "nombre": "Libro de obras elevadas"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": true,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 41,
    "Incluye_clases": 0,
    "Incluye_conjuros": 1,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Libro de oscuridad vil",
    "Oficial": true
   },
   "id": 41,
   "nombre": "Libro de oscuridad vil"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 42,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Los imperios perdidos de faerun",
    "Oficial": true
   },
   "id": 42,
   "nombre": "Los imperios perdidos de faerun"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 43,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Los poderes de faerun",
    "Oficial": true
   },
   "id": 43,
   "nombre": "Los poderes de faerun"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 44,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Magia de faerun",
    "Oficial": true
   },
   "id": 44,
   "nombre": "Magia de faerun"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 45,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual de los planos",
    "Oficial": true
   },
   "id": 45,
   "nombre": "Manual de los planos"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 46,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual de miniaturas",
    "Oficial": true
   },
   "id": 46,
   "nombre": "Manual de miniaturas"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": true,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": true,
    "Incluye_tipos": true
   },
   "get": {
    "Comodin": null,
    "Id": 47,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 1,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 1,
    "Incluye_tipos": 1,
    "Nombre": "Manual de monstruos 1",
    "Oficial": true
   },
   "id": 47,
   "nombre": "Manual de monstruos 1"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": true,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 48,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 1,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual de monstruos 2",
    "Oficial": true
   },
   "id": 48,
   "nombre": "Manual de monstruos 2"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 49,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual de monstruos 3",
    "Oficial": true
   },
   "id": 49,
   "nombre": "Manual de monstruos 3"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 50,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual de monstruos 4",
    "Oficial": true
   },
   "id": 50,
   "nombre": "Manual de monstruos 4"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 51,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Razas de eberrón",
    "Oficial": true
   },
   "id": 51,
   "nombre": "Razas de eberrón"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 52,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual de monstruos 5",
    "Oficial": true
   },
   "id": 52,
   "nombre": "Manual de monstruos 5"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 53,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual de niveles épicos",
    "Oficial": true
   },
   "id": 53,
   "nombre": "Manual de niveles épicos"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": true,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 54,
    "Incluye_clases": 1,
    "Incluye_conjuros": 1,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual del jugador 1",
    "Oficial": true
   },
   "id": 54,
   "nombre": "Manual del jugador 1"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 55,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual del jugador 2",
    "Oficial": true
   },
   "id": 55,
   "nombre": "Manual del jugador 2"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 56,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manual planario",
    "Oficial": true
   },
   "id": 56,
   "nombre": "Manual planario"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 57,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Manuscrito infernal",
    "Oficial": true
   },
   "id": 57,
   "nombre": "Manuscrito infernal"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 58,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Monstruos de faerun",
    "Oficial": true
   },
   "id": 58,
   "nombre": "Monstruos de faerun"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": true,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 59,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 1,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Razas de faerun",
    "Oficial": true
   },
   "id": 59,
   "nombre": "Razas de faerun"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 60,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Recopilación de clases de prestigio",
    "Oficial": true
   },
   "id": 60,
   "nombre": "Recopilación de clases de prestigio"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 61,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Recopilación de dotes",
    "Oficial": true
   },
   "id": 61,
   "nombre": "Recopilación de dotes"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 62,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Recopilación de monstruos",
    "Oficial": true
   },
   "id": 62,
   "nombre": "Recopilación de monstruos"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 63,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Recopilación de objetos mágicos",
    "Oficial": true
   },
   "id": 63,
   "nombre": "Recopilación de objetos mágicos"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 64,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Reinos serpentinos",
    "Oficial": true
   },
   "id": 64,
   "nombre": "Reinos serpentinos"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": true,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": true,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 65,
    "Incluye_clases": 1,
    "Incluye_conjuros": 1,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 1,
    "Incluye_tipos": 0,
    "Nombre": "Rol mapa mundi",
    "Oficial": false
   },
   "id": 65,
   "nombre": "Rol mapa mundi"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 66,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Señores de la oscuridad",
    "Oficial": true
   },
   "id": 66,
   "nombre": "Señores de la oscuridad"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 67,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Guia del jugador en eberron",
    "Oficial": true
   },
   "id": 67,
   "nombre": "Guia del jugador en eberron"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": true,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": true,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 68,
    "Incluye_clases": 1,
    "Incluye_conjuros": 1,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 1,
    "Incluye_tipos": 0,
    "Nombre": "Manual de psiónica expandido",
    "Oficial": true
   },
   "id": 68,
   "nombre": "Manual de psiónica expandido"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 69,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Tormenta de arena",
    "Oficial": true
   },
   "id": 69,
   "nombre": "Tormenta de arena"
  },
  {
   "cuerpo": {
    "Incluye_clases": true,
    "Incluye_conjuros": false,
    "Incluye_dotes": true,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 71,
    "Incluye_clases": 1,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 1,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El aventurero completo",
    "Oficial": true
   },
   "id": 71,
   "nombre": "El aventurero completo"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 78,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El campeón completo",
    "Oficial": true
   },
   "id": 78,
   "nombre": "El campeón completo"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 79,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "El psiónico completo",
    "Oficial": true
   },
   "id": 79,
   "nombre": "El psiónico completo"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 80,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Los drow de la Infraoscuridad",
    "Oficial": true
   },
   "id": 80,
   "nombre": "Los drow de la Infraoscuridad"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 81,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Paisajes de mazmorra",
    "Oficial": true
   },
   "id": 81,
   "nombre": "Paisajes de mazmorra"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 82,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Fes de Eberron",
    "Oficial": true
   },
   "id": 82,
   "nombre": "Fes de Eberron"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 83,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Escarcha ardiente",
    "Oficial": true
   },
   "id": 83,
   "nombre": "Escarcha ardiente"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 92,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Héroes del horror",
    "Oficial": true
   },
   "id": 92,
   "nombre": "Héroes del horror"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 93,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Señores de la locura",
    "Oficial": true
   },
   "id": 93,
   "nombre": "Señores de la locura"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 94,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Campeones de la ruina",
    "Oficial": true
   },
   "id": 94,
   "nombre": "Campeones de la ruina"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 95,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Naufragio en la tormenta",
    "Oficial": true
   },
   "id": 95,
   "nombre": "Naufragio en la tormenta"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 96,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Dragones de Faerûn",
    "Oficial": true
   },
   "id": 96,
   "nombre": "Dragones de Faerûn"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 97,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Males primordiales",
    "Oficial": true
   },
   "id": 97,
   "nombre": "Males primordiales"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 98,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Cormyr: el desgarro del Tejido",
    "Oficial": true
   },
   "id": 98,
   "nombre": "Cormyr: el desgarro del Tejido"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": true,
    "Incluye_razas": false,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 99,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 1,
    "Incluye_razas": 0,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Valle Sombrío: la devastación de la tierra",
    "Oficial": true
   },
   "id": 99,
   "nombre": "Valle Sombrío: la devastación de la tierra"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 103,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Anauroch",
    "Oficial": true
   },
   "id": 103,
   "nombre": "Anauroch"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 104,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Fiendish Codex II: Tyrants of the Nine Hells",
    "Oficial": true
   },
   "id": 104,
   "nombre": "Fiendish Codex II: Tyrants of the Nine Hells"
  },
  {
   "cuerpo": {
    "Incluye_clases": false,
    "Incluye_conjuros": false,
    "Incluye_dotes": false,
    "Incluye_monstruos": false,
    "Incluye_plantillas": false,
    "Incluye_razas": true,
    "Incluye_subtipos": false,
    "Incluye_tipos": false
   },
   "get": {
    "Comodin": null,
    "Id": 105,
    "Incluye_clases": 0,
    "Incluye_conjuros": 0,
    "Incluye_dotes": 0,
    "Incluye_monstruos": 0,
    "Incluye_plantillas": 0,
    "Incluye_razas": 1,
    "Incluye_subtipos": 0,
    "Incluye_tipos": 0,
    "Nombre": "Magia de Eberron",
    "Oficial": true
   },
   "id": 105,
   "nombre": "Magia de Eberron"
  }
 ],
 "subtipos": [
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": "Las criaturas incorporales carecen de armadura natural, pero poseen un bonificador de desvío igual a su modificador de carisma (siempre con un mínimo de + 1, aun cuando la puntuación de carisma de la criatura no conceda normalmente tal bonificador).",
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Las criaturas incorporales carecen de cuerpo físico. Sólo pueden infligirles daño otras criaturas incorporales, las armas mágicas o criaturas que golpeen como armas mágicas y los conjuros y aptitudes sortílegas o sobrenaturales. Son inmunes a todo tipo de ataques no mágicos. Incluso cuando son alcanzadas por conjuros o armas mágicas, tienen un 50% de ignorar todo el daño infligido por esa fuente corporal (exceptuando los efectos de fuerza, como el proyectil mágico, la energía positiva o negativa o los ataques de las armas con la aptitud fantasmal. Aunque el agua bendita no es un ataque mágico, puede afectar a los muertos vivientes incorporales, pero un impacto con agua bendita tiene un 50% de que no afecte a una criatura incorporal.\r\n\r\nLas criaturas incorporales pueden entrar en objetos sólidos o atravesarlos a voluntad, pero deben permanecer adyacentes al exterior del objeto, y por ello no puede atravesar un objeto cuyo espacio sea más voluminoso que ellas mismas. Pueden sentir la presencia de criaturas y objetos en una casilla adyacente a su localización real, pero los enemigos poseen ocultación total (50% de posibilidad de fallo) contra una criatura incorporal que se encuentre dentro de\r\nun objeto. Para ser capaz de ver más allá del objeto en el que está dentro y atacar con normalidad, la criatura incorporal debe emerger. Una criatura incorporal dentro de un objeto posee cobertura total, pero cuando ataque a una criatura fuera del objeto solamente tendrá cobertura, por lo que una criatura en el exterior con una acción preparada puede golpear mientras la ataca. Una criatura incorporal no puede atravesar efectos de fuerza.\r\nSus ataques atraviesan (ignoran) las armaduras, escudos y armaduras naturales, aunque los bonificadores de desvío y los efectos de fuerza (como una armadura de mago), funcionan perfectamente contra ellas. Las criaturas incorporales pueden atravesar y actuar en el agua con la misma facilidad con que lo hacen en el aire y no pueden caer o sufrir daño por caída. No pueden derribar o efectuar ataques de presa, ni pueden ser derribadas o sufrir un ataque de presa. De hecho, no pueden efectuar cualquier acción física que implique mover o manipular un oponente o su equipo, ni tampoco pueden verse sujetas a tales acciones. Las criaturas incorporales no tienen peso y no activan trampas que se disparen por peso.\r\nUna criatura incorporal se mueve en silencio y, si no lo quiere, no puede ser oída mediante pruebas de escuchar. Carece de puntuación de fuerza, por lo que su modificador de destreza se aplica tanto a sus ataques cuerpo a cuerpo como a distancia. Los sentidos no visuales, tales como el olfato o vista ciega, no son efectivos, o lo son solamente de forma parcial, contra criaturas incorporales. Éstas tienen un sentido innato de la dirección y pueden moverse a máxima velocidad incluso cuando no puedan ver.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": false,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Incorporal",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": "Las criaturas incorporales carecen de armadura natural, pero poseen un bonificador de desvío igual a su modificador de carisma (siempre con un mínimo de + 1, aun cuando la puntuación de carisma de la criatura no conceda normalmente tal bonificador).",
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Las criaturas incorporales carecen de cuerpo físico. Sólo pueden infligirles daño otras criaturas incorporales, las armas mágicas o criaturas que golpeen como armas mágicas y los conjuros y aptitudes sortílegas o sobrenaturales. Son inmunes a todo tipo de ataques no mágicos. Incluso cuando son alcanzadas por conjuros o armas mágicas, tienen un 50% de ignorar todo el daño infligido por esa fuente corporal (exceptuando los efectos de fuerza, como el proyectil mágico, la energía positiva o negativa o los ataques de las armas con la aptitud fantasmal. Aunque el agua bendita no es un ataque mágico, puede afectar a los muertos vivientes incorporales, pero un impacto con agua bendita tiene un 50% de que no afecte a una criatura incorporal.\r\n\r\nLas criaturas incorporales pueden entrar en objetos sólidos o atravesarlos a voluntad, pero deben permanecer adyacentes al exterior del objeto, y por ello no puede atravesar un objeto cuyo espacio sea más voluminoso que ellas mismas. Pueden sentir la presencia de criaturas y objetos en una casilla adyacente a su localización real, pero los enemigos poseen ocultación total (50% de posibilidad de fallo) contra una criatura incorporal que se encuentre dentro de\r\nun objeto. Para ser capaz de ver más allá del objeto en el que está dentro y atacar con normalidad, la criatura incorporal debe emerger. Una criatura incorporal dentro de un objeto posee cobertura total, pero cuando ataque a una criatura fuera del objeto solamente tendrá cobertura, por lo que una criatura en el exterior con una acción preparada puede golpear mientras la ataca. Una criatura incorporal no puede atravesar efectos de fuerza.\r\nSus ataques atraviesan (ignoran) las armaduras, escudos y armaduras naturales, aunque los bonificadores de desvío y los efectos de fuerza (como una armadura de mago), funcionan perfectamente contra ellas. Las criaturas incorporales pueden atravesar y actuar en el agua con la misma facilidad con que lo hacen en el aire y no pueden caer o sufrir daño por caída. No pueden derribar o efectuar ataques de presa, ni pueden ser derribadas o sufrir un ataque de presa. De hecho, no pueden efectuar cualquier acción física que implique mover o manipular un oponente o su equipo, ni tampoco pueden verse sujetas a tales acciones. Las criaturas incorporales no tienen peso y no activan trampas que se disparen por peso.\r\nUna criatura incorporal se mueve en silencio y, si no lo quiere, no puede ser oída mediante pruebas de escuchar. Carece de puntuación de fuerza, por lo que su modificador de destreza se aplica tanto a sus ataques cuerpo a cuerpo como a distancia. Los sentidos no visuales, tales como el olfato o vista ciega, no son efectivos, o lo son solamente de forma parcial, contra criaturas incorporales. Éstas tienen un sentido innato de la dirección y pueden moverse a máxima velocidad incluso cuando no puedan ver.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": false,
    "Id": 1,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Incorporal",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 1,
   "nombre": "Incorporal"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [
     4,
     5,
     7
    ],
    "plantillas": [
     1
    ],
    "rasgos": [
     1,
     2,
     3,
     4,
     5,
     6,
     7
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Los arcontes son celestiales originarios del plano de celestia. Se encargan ellos mismos de la protección del plano, y también se consideran guardianes de todos aquellos que son inocentes o están libres de todo mal. Son los enemigos naturales de los infernales (las criaturas de los planos inferiores), especialmente de los demonios.\r\nEstas criaturas hablan celestial, infernal y dracónico, pero pueden comunicarse con casi cualquier criatura gracias a su aptitud de don de lenguas.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Arconte",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Los arcontes son celestiales originarios del plano de celestia. Se encargan ellos mismos de la protección del plano, y también se consideran guardianes de todos aquellos que son inocentes o están libres de todo mal. Son los enemigos naturales de los infernales (las criaturas de los planos inferiores), especialmente de los demonios.\r\nEstas criaturas hablan celestial, infernal y dracónico, pero pueden comunicarse con casi cualquier criatura gracias a su aptitud de don de lenguas.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 2,
    "Idiomas": [
     {
      "Descripcion": "Es el idioma hablado por los ajenos buenos",
      "Id": 4,
      "Nombre": "Celestial",
      "Oficial": true,
      "Secreto": false
     },
     {
      "Descripcion": "Idioma hablado por los demonios",
      "Id": 5,
      "Nombre": "Infernal",
      "Oficial": true,
      "Secreto": false
     },
     {
      "Descripcion": "Idioma hablado por los dragones",
      "Id": 7,
      "Nombre": "Dracónico",
      "Oficial": true,
      "Secreto": false
     }
    ],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Arconte",
    "Oficial": true,
    "Plantillas": [
     {
      "Descripcion": "Celestial: plantilla heredada de las criaturas de los planos del bien. Da visión en la oscuridad de 60 pies, resistencias a la energía y reducción del daño que crecen con los DG, y una resistencia a conjuros de DG + 5. Ajuste de nivel +2.",
      "Id": 1,
      "Nombre": "Celestial"
     }
    ],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Un aura de justicia rodea a los arcontes que combaten o se enfurecen. Toda criatura hostil en un radio de 20' del arconte debe tener éxito en una salvación de voluntad para resistirse a este efecto. La cd de la salvación varía con cada tipo de arconte, utilize el bonificador de carisma e incluya un bonificador racial de +2. Quienes fallen sufrirán un penalizador -2 en los ataques, la ca y los ts durante 24 horas o hasta que logren golpear con éxito al arconte que genere el aura. Toda criatura que resiste el efecto o lo rompa no volverá a resultar afectada durante 24 horas por el aura de ese arconte",
      "Id": 1,
      "Nombre": "Aura amenazadora",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": 2,
      "Nombre": "Bonificador racial +4 a las salvaciones contra venenos.",
      "Oficial": true
     },
     {
      "Descripcion": "Los arcontes siempre están rodeados por un efecto de círculo mágico contra el mal, idéntico al conjuro del mismo nombre lanzado por un lanzador de conjuros de nivel equivalente a los dg del arconte.",
      "Id": 3,
      "Nombre": "Círculo mágico contra el mal",
      "Oficial": true
     },
     {
      "Descripcion": "Todos los arcontes pueden hablar con cualquier criatura que tenga un idioma como si usaran el conjuro don de lenguas lanzado por un lanzador de conjuros de nivel 14. Esta aptitud siempre está activa.",
      "Id": 4,
      "Nombre": "Don de lenguas",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": 5,
      "Nombre": "Inmunidad a la electricidad y la petrificación.",
      "Oficial": true
     },
     {
      "Descripcion": "Los arcontes pueden teleportarse sin error a voluntad como lo haría un lanzador de conjuros de nivel 14. Exceptuando que la criatura sólo puede transportarse a sí misma junto a 50 lb. De objetos como máximo.",
      "Id": 6,
      "Nombre": "Teleportar",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": 7,
      "Nombre": "Visión en la oscuridad hasta 60' y visión en la penumbra.",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 2,
   "nombre": "Arconte"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [
     7
    ],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Si una raza posee el subtipo sangre de dragón, entonces tendrá una fuerte afinidad con los dragones, lo que significa que hechizos, efectos, poderes y habilidades que afecten o hagan objetivo a dragones también le afectarán. El subtipo otorga la capacidad de usar objetos mágicos que normalmente solo pueden ser usados por dragones, y la capacidad de obtener dotes con el prerrequisito de sangre de dragón. El subtipo sangre de dragón no confiere el tipo dragón ni sus rasgos, ni tampoco su presencia pavorosa.\r\nLos dragones pueden acceder automáticamente a cualquier clase, clase de prestigio, rasgo racial, dote, poder o hechizo que requiera el subtipo sangre de dragón.\r\nUna criatura que obtenga el tipo dragón perderá el subtipo sangre de dragón.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 34,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Sangre de dragón",
     "oficial": true,
     "pagina": 4,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Si una raza posee el subtipo sangre de dragón, entonces tendrá una fuerte afinidad con los dragones, lo que significa que hechizos, efectos, poderes y habilidades que afecten o hagan objetivo a dragones también le afectarán. El subtipo otorga la capacidad de usar objetos mágicos que normalmente solo pueden ser usados por dragones, y la capacidad de obtener dotes con el prerrequisito de sangre de dragón. El subtipo sangre de dragón no confiere el tipo dragón ni sus rasgos, ni tampoco su presencia pavorosa.\r\nLos dragones pueden acceder automáticamente a cualquier clase, clase de prestigio, rasgo racial, dote, poder o hechizo que requiera el subtipo sangre de dragón.\r\nUna criatura que obtenga el tipo dragón perderá el subtipo sangre de dragón.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 3,
    "Idiomas": [
     {
      "Descripcion": "Idioma hablado por los dragones",
      "Id": 7,
      "Nombre": "Dracónico",
      "Oficial": true,
      "Secreto": false
     }
    ],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 34,
     "Nombre": "Razas del dragón",
     "Pagina": 4
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Sangre de dragón",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 3,
   "nombre": "Sangre de dragón"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Lo tiene toda criatura con poderes de incarnum: con reserva de esencia, con fusiones moldeadas de forma innata o creada con incarnum. No da rasgos propios; solo la señala ante los efectos que afectan a las criaturas de incarnum.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": false,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 31,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Incarnum",
     "oficial": true,
     "pagina": 169,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Lo tiene toda criatura con poderes de incarnum: con reserva de esencia, con fusiones moldeadas de forma innata o creada con incarnum. No da rasgos propios; solo la señala ante los efectos que afectan a las criaturas de incarnum.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": false,
    "Id": 8,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 31,
     "Nombre": "Magia del incarnum",
     "Pagina": 169
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Incarnum",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 8,
   "nombre": "Incarnum"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     61
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Criatura del agua: siempre tiene velocidad de nadar, se mueve por el agua sin pruebas de Nadar y respira bajo el agua; solo respira aire si es anfibia.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Acuático",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Criatura del agua: siempre tiene velocidad de nadar, se mueve por el agua sin pruebas de Nadar y respira bajo el agua; solo respira aire si es anfibia.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 40,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Acuático",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Respira bajo el agua y se mueve por ella sin pruebas de Nadar.",
      "Id": 61,
      "Nombre": "Respiración acuática",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 40,
   "nombre": "Acuático"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Lo recibe la criatura cuyo tipo cambia (por una plantilla, por ejemplo). Va con su tipo original: tiene los rasgos del tipo nuevo, pero los aspectos del original.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": false,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Agrandado",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Lo recibe la criatura cuyo tipo cambia (por una plantilla, por ejemplo). Va con su tipo original: tiene los rasgos del tipo nuevo, pero los aspectos del original.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": false,
    "Id": 41,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Agrandado",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 41,
   "nombre": "Agrandado"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     61
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Ajenos y elementales unidos al plano elemental del Agua: siempre nadan sin pruebas de Nadar y respiran bajo el agua; casi siempre también respiran aire.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Agua",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Ajenos y elementales unidos al plano elemental del Agua: siempre nadan sin pruebas de Nadar y respiran bajo el agua; casi siempre también respiran aire.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 42,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Agua",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Respira bajo el agua y se mueve por ella sin pruebas de Nadar.",
      "Id": 61,
      "Nombre": "Respiración acuática",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 42,
   "nombre": "Agua"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Ajenos y elementales unidos al plano elemental del Aire: tienen velocidad de vuelo, casi siempre con maniobrabilidad perfecta.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Aire",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Ajenos y elementales unidos al plano elemental del Aire: tienen velocidad de vuelo, casi siempre con maniobrabilidad perfecta.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 43,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Aire",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 43,
   "nombre": "Aire"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     2,
     4,
     7,
     62,
     63,
     64
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Celestiales, ajenos buenos de los planos Exteriores del bien, con aura protectora, don de lenguas y defensas contra el ácido, el frío, la petrificación, la electricidad, el fuego y los venenos.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Ángel",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Celestiales, ajenos buenos de los planos Exteriores del bien, con aura protectora, don de lenguas y defensas contra el ácido, el frío, la petrificación, la electricidad, el fuego y los venenos.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 44,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Ángel",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "",
      "Id": 2,
      "Nombre": "Bonificador racial +4 a las salvaciones contra venenos.",
      "Oficial": true
     },
     {
      "Descripcion": "Todos los arcontes pueden hablar con cualquier criatura que tenga un idioma como si usaran el conjuro don de lenguas lanzado por un lanzador de conjuros de nivel 14. Esta aptitud siempre está activa.",
      "Id": 4,
      "Nombre": "Don de lenguas",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": 7,
      "Nombre": "Visión en la oscuridad hasta 60' y visión en la penumbra.",
      "Oficial": true
     },
     {
      "Descripcion": "Aura de 20 pies que da +4 de desvío a la CA y +4 de resistencia a las salvaciones contra criaturas malignas, y actúa como círculo mágico contra el mal y globo de invulnerabilidad menor.",
      "Id": 62,
      "Nombre": "Aura protectora",
      "Oficial": true
     },
     {
      "Descripcion": "No le afectan el ácido, el frío ni la petrificación.",
      "Id": 63,
      "Nombre": "Inmunidad al ácido, al frío y a la petrificación",
      "Oficial": true
     },
     {
      "Descripcion": "Resta 10 al daño de electricidad y al de fuego que recibe.",
      "Id": 64,
      "Nombre": "Resistencia a la electricidad 10 y al fuego 10",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 44,
   "nombre": "Ángel"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     65,
     66,
     67,
     68,
     69
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Diablos, ajenos malignos de la raza de los baatezu: convocan a otros de su raza, se comunican por telepatía, ven en cualquier oscuridad y resisten el fuego, el veneno, el ácido y el frío.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Baatezu",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Diablos, ajenos malignos de la raza de los baatezu: convocan a otros de su raza, se comunican por telepatía, ven en cualquier oscuridad y resisten el fuego, el veneno, el ácido y el frío.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 45,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Baatezu",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Puede intentar convocar a otros de su raza; la probabilidad y lo que acude los da la ficha de cada criatura.",
      "Id": 65,
      "Nombre": "Convocar a los de su raza",
      "Oficial": true
     },
     {
      "Descripcion": "No le afectan el fuego ni el veneno.",
      "Id": 66,
      "Nombre": "Inmunidad al fuego y al veneno",
      "Oficial": true
     },
     {
      "Descripcion": "Resta 10 al daño de ácido y al de frío que recibe.",
      "Id": 67,
      "Nombre": "Resistencia al ácido 10 y al frío 10",
      "Oficial": true
     },
     {
      "Descripcion": "Se comunica por telepatía con cualquier criatura que tenga un idioma, dentro del alcance de su ficha (habitualmente 100 pies).",
      "Id": 68,
      "Nombre": "Telepatía",
      "Oficial": true
     },
     {
      "Descripcion": "Ve perfectamente en cualquier oscuridad, también la mágica de oscuridad profunda.",
      "Id": 69,
      "Nombre": "Ver en la oscuridad",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 45,
   "nombre": "Baatezu"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     70
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Ajenos de los planos Exteriores buenos. Los efectos de alineamiento lo tratan como bueno, aunque cambie su alineamiento, y sus armas superan la reducción del daño como si fueran buenas.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Bueno",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Ajenos de los planos Exteriores buenos. Los efectos de alineamiento lo tratan como bueno, aunque cambie su alineamiento, y sus armas superan la reducción del daño como si fueran buenas.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 46,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Bueno",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Sus armas naturales y las que empuña superan la reducción del daño como si tuvieran el alineamiento de su subtipo.",
      "Id": 70,
      "Nombre": "Armas alineadas",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 46,
   "nombre": "Bueno"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     71
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Criatura que puede cambiar de forma por una aptitud sobrenatural. Es competente con sus armas naturales, las armas sencillas y las armas y armaduras que lleve en su ficha.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Cambiaformas",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Criatura que puede cambiar de forma por una aptitud sobrenatural. Es competente con sus armas naturales, las armas sencillas y las armas y armaduras que lleve en su ficha.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 47,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Cambiaformas",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Competente con sus armas naturales, las armas sencillas y las armas que da su ficha; con las armaduras que lleve en su ficha (y las más ligeras) y, entonces, con los escudos.",
      "Id": 71,
      "Nombre": "Competencias del cambiaformas",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 47,
   "nombre": "Cambiaformas"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     70
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Ajenos de los planos Exteriores caóticos. Los efectos de alineamiento lo tratan como caótico, aunque cambie su alineamiento, y sus armas superan la reducción del daño como si fueran caóticas.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Caótico",
     "oficial": true,
     "pagina": 311,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Ajenos de los planos Exteriores caóticos. Los efectos de alineamiento lo tratan como caótico, aunque cambie su alineamiento, y sus armas superan la reducción del daño como si fueran caóticas.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 48,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 311
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Caótico",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Sus armas naturales y las que empuña superan la reducción del daño como si tuvieran el alineamiento de su subtipo.",
      "Id": 70,
      "Nombre": "Armas alineadas",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 48,
   "nombre": "Caótico"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     4,
     5,
     7,
     72
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Celestiales de los claros boscosos de Arbórea, con don de lenguas, inmunes a la electricidad y a la petrificación y resistentes al frío y al fuego.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Eladrín",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Celestiales de los claros boscosos de Arbórea, con don de lenguas, inmunes a la electricidad y a la petrificación y resistentes al frío y al fuego.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 49,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Eladrín",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Todos los arcontes pueden hablar con cualquier criatura que tenga un idioma como si usaran el conjuro don de lenguas lanzado por un lanzador de conjuros de nivel 14. Esta aptitud siempre está activa.",
      "Id": 4,
      "Nombre": "Don de lenguas",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": 5,
      "Nombre": "Inmunidad a la electricidad y la petrificación.",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": 7,
      "Nombre": "Visión en la oscuridad hasta 60' y visión en la penumbra.",
      "Oficial": true
     },
     {
      "Descripcion": "Resta 10 al daño de frío y al de fuego que recibe.",
      "Id": 72,
      "Nombre": "Resistencia al frío 10 y al fuego 10",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 49,
   "nombre": "Eladrín"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "La criatura que está en un plano que no es el suyo. Se gana o se pierde al cambiar de plano; nadie lo tiene en un plano de transición (el Astral, el Etéreo y el de la Sombra).",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": false,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Extraplanario",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "La criatura que está en un plano que no es el suyo. Se gana o se pierde al cambiar de plano; nadie lo tiene en un plano de transición (el Astral, el Etéreo y el de la Sombra).",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": false,
    "Id": 50,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Extraplanario",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 50,
   "nombre": "Extraplanario"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     73,
     74
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Criatura inmune al frío y vulnerable al fuego, que le hace la mitad más de daño.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Frío",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Criatura inmune al frío y vulnerable al fuego, que le hace la mitad más de daño.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 51,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Frío",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "No le afecta el frío.",
      "Id": 73,
      "Nombre": "Inmunidad al frío",
      "Oficial": true
     },
     {
      "Descripcion": "Recibe la mitad más del daño de fuego, haya o no salvación y la supere o no.",
      "Id": 74,
      "Nombre": "Vulnerabilidad al fuego",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 51,
   "nombre": "Frío"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     75,
     76
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Criatura inmune al fuego y vulnerable al frío, que le hace la mitad más de daño.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Fuego",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Criatura inmune al fuego y vulnerable al frío, que le hace la mitad más de daño.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 52,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Fuego",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "No le afecta el fuego.",
      "Id": 75,
      "Nombre": "Inmunidad al fuego",
      "Oficial": true
     },
     {
      "Descripcion": "Recibe la mitad más del daño de frío, haya o no salvación y la supere o no.",
      "Id": 76,
      "Nombre": "Vulnerabilidad al frío",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 52,
   "nombre": "Fuego"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     2,
     5,
     7,
     77,
     78,
     79
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Celestiales de los campos del Elíseo: imponen las manos, hablan con los animales por telepatía y resisten la electricidad, la petrificación, el frío, el sonido y los venenos.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Guardinal",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Celestiales de los campos del Elíseo: imponen las manos, hablan con los animales por telepatía y resisten la electricidad, la petrificación, el frío, el sonido y los venenos.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 53,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Guardinal",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "",
      "Id": 2,
      "Nombre": "Bonificador racial +4 a las salvaciones contra venenos.",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": 5,
      "Nombre": "Inmunidad a la electricidad y la petrificación.",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": 7,
      "Nombre": "Visión en la oscuridad hasta 60' y visión en la penumbra.",
      "Oficial": true
     },
     {
      "Descripcion": "Cura cada día, como la imposición de manos del paladín, tantos puntos de golpe como su total.",
      "Id": 77,
      "Nombre": "Imposición de manos del guardinal",
      "Oficial": true
     },
     {
      "Descripcion": "Resta 10 al daño de frío y al de sonido que recibe.",
      "Id": 78,
      "Nombre": "Resistencia al frío 10 y al sonido 10",
      "Oficial": true
     },
     {
      "Descripcion": "Habla mentalmente con los animales como acción gratuita, como el conjuro hablar con los animales de nivel 8.",
      "Id": 79,
      "Nombre": "Telepatía animal",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 53,
   "nombre": "Guardinal"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     70
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Ajenos de los planos Exteriores legales. Los efectos de alineamiento lo tratan como legal, aunque cambie su alineamiento, y sus armas superan la reducción del daño como si fueran legales.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Legal",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Ajenos de los planos Exteriores legales. Los efectos de alineamiento lo tratan como legal, aunque cambie su alineamiento, y sus armas superan la reducción del daño como si fueran legales.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 54,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Legal",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Sus armas naturales y las que empuña superan la reducción del daño como si tuvieran el alineamiento de su subtipo.",
      "Id": 70,
      "Nombre": "Armas alineadas",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 54,
   "nombre": "Legal"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     70
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Ajenos de los planos Exteriores malignos (los infernales). Los efectos de alineamiento lo tratan como maligno, aunque cambie su alineamiento, y sus armas superan la reducción del daño como si fueran malignas.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Maligno",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Ajenos de los planos Exteriores malignos (los infernales). Los efectos de alineamiento lo tratan como maligno, aunque cambie su alineamiento, y sus armas superan la reducción del daño como si fueran malignas.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 55,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Maligno",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Sus armas naturales y las que empuña superan la reducción del daño como si tuvieran el alineamiento de su subtipo.",
      "Id": 70,
      "Nombre": "Armas alineadas",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 55,
   "nombre": "Maligno"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Ajenos con antepasados mortales o muy unidos al plano Material, del que son nativos: comen y duermen, y se les puede revivir, resucitar o reencarnar como a cualquier criatura viva.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Nativo",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Ajenos con antepasados mortales o muy unidos al plano Material, del que son nativos: comen y duermen, y se les puede revivir, resucitar o reencarnar como a cualquier criatura viva.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 56,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Nativo",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 56,
   "nombre": "Nativo"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     80
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Una multitud de criaturas Diminutas o Menudas que actúa como una sola: un total de DG y de puntos de golpe, una iniciativa, una velocidad, una CA y unas salvaciones.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Plaga",
     "oficial": true,
     "pagina": 312,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Una multitud de criaturas Diminutas o Menudas que actúa como una sola: un total de DG y de puntos de golpe, una iniciativa, una velocidad, una CA y unas salvaciones.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 57,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 312
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Plaga",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Ocupa su espacio como una sola criatura; no se le puede flanquear ni hacer críticos; las armas le hacen poco daño y las áreas, más; su contacto distrae a quien la sufre.",
      "Id": 80,
      "Nombre": "Rasgos de la plaga",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 57,
   "nombre": "Plaga"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Un grupo de razas humanoides escamosas, casi siempre de sangre fría; no lo tienen los animales ni los monstruos que son reptiles verdaderos.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Reptiliano",
     "oficial": true,
     "pagina": 313,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Un grupo de razas humanoides escamosas, casi siempre de sangre fría; no lo tienen los animales ni los monstruos que son reptiles verdaderos.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 58,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 313
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Reptiliano",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 58,
   "nombre": "Reptiliano"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     65,
     68,
     81,
     82
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Demonios, ajenos malignos de la raza de los tanar'ri: convocan a otros de su raza, se comunican por telepatía y resisten la electricidad, el veneno, el ácido, el frío y el fuego.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Tanar'ri",
     "oficial": true,
     "pagina": 313,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Demonios, ajenos malignos de la raza de los tanar'ri: convocan a otros de su raza, se comunican por telepatía y resisten la electricidad, el veneno, el ácido, el frío y el fuego.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 59,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 313
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Tanar'ri",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Puede intentar convocar a otros de su raza; la probabilidad y lo que acude los da la ficha de cada criatura.",
      "Id": 65,
      "Nombre": "Convocar a los de su raza",
      "Oficial": true
     },
     {
      "Descripcion": "Se comunica por telepatía con cualquier criatura que tenga un idioma, dentro del alcance de su ficha (habitualmente 100 pies).",
      "Id": 68,
      "Nombre": "Telepatía",
      "Oficial": true
     },
     {
      "Descripcion": "No le afectan la electricidad ni el veneno.",
      "Id": 81,
      "Nombre": "Inmunidad a la electricidad y al veneno",
      "Oficial": true
     },
     {
      "Descripcion": "Resta 10 al daño de ácido, al de frío y al de fuego que recibe.",
      "Id": 82,
      "Nombre": "Resistencia al ácido 10, al frío 10 y al fuego 10",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 59,
   "nombre": "Tanar'ri"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Ajenos y elementales unidos al plano elemental de la Tierra: casi siempre tienen velocidad de excavar y muchos atraviesan la roca sólida.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Tierra",
     "oficial": true,
     "pagina": 313,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Ajenos y elementales unidos al plano elemental de la Tierra: casi siempre tienen velocidad de excavar y muchos atraviesan la roca sólida.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 60,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 313
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Tierra",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 60,
   "nombre": "Tierra"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [
     19
    ],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Humanoides sigilosos que viven de la caza y de las incursiones; todos hablan trasgo.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Trasgoide",
     "oficial": true,
     "pagina": 313,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Humanoides sigilosos que viven de la caza y de las incursiones; todos hablan trasgo.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 61,
    "Idiomas": [
     {
      "Descripcion": "Idioma hablado por los trasgos",
      "Id": 19,
      "Nombre": "Trasgo",
      "Oficial": true,
      "Secreto": false
     }
    ],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 313
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Trasgoide",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 61,
   "nombre": "Trasgoide"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los humanoides enanos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Enano",
     "oficial": true,
     "pagina": 316,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los humanoides enanos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 62,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 316
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Enano",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 62,
   "nombre": "Enano"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los humanoides elfos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Elfo",
     "oficial": true,
     "pagina": 316,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los humanoides elfos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 63,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 316
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Elfo",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 63,
   "nombre": "Elfo"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los gnolls; todo humanoide tiene un subtipo que dice de qué raza es.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Gnoll",
     "oficial": true,
     "pagina": 316,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los gnolls; todo humanoide tiene un subtipo que dice de qué raza es.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 64,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 316
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Gnoll",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 64,
   "nombre": "Gnoll"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los humanoides gnomos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Gnomo",
     "oficial": true,
     "pagina": 316,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los humanoides gnomos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 65,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 316
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Gnomo",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 65,
   "nombre": "Gnomo"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los humanoides medianos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Mediano",
     "oficial": true,
     "pagina": 316,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los humanoides medianos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 66,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 316
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Mediano",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 66,
   "nombre": "Mediano"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los humanos y de los humanoides de su linaje; todo humanoide tiene un subtipo que dice de qué raza es.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Humano",
     "oficial": true,
     "pagina": 316,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los humanos y de los humanoides de su linaje; todo humanoide tiene un subtipo que dice de qué raza es.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 67,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 316
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Humano",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 67,
   "nombre": "Humano"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los humanoides orcos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 47,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Orco",
     "oficial": true,
     "pagina": 316,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los humanoides orcos y de sus parientes; todo humanoide tiene un subtipo que dice de qué raza es.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 68,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 47,
     "Nombre": "Manual de monstruos 1",
     "Pagina": 316
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Orco",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 68,
   "nombre": "Orco"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Lo tiene toda criatura con poderes psiónicos: con reserva de puntos de poder, que manifiesta poderes o con aptitudes psíquicas. Se puede tener de nacimiento u obtener después.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": false,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 68,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Psiónico",
     "oficial": true,
     "pagina": 183,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Lo tiene toda criatura con poderes psiónicos: con reserva de puntos de poder, que manifiesta poderes o con aptitudes psíquicas. Se puede tener de nacimiento u obtener después.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": false,
    "Id": 69,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 68,
     "Nombre": "Manual de psiónica expandido",
     "Pagina": 183
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Psiónico",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 69,
   "nombre": "Psiónico"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [
     83
    ],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Constructos con consciencia y libre albedrío que reúnen aspectos de constructo y de criatura viva: tienen Constitución, no comen, no duermen ni respiran y se les puede revivir; los conjuros de curación les sirven a medias.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 19,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Constructo viviente",
     "oficial": true,
     "pagina": 17,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Constructos con consciencia y libre albedrío que reúnen aspectos de constructo y de criatura viva: tienen Constitución, no comen, no duermen ni respiran y se les puede revivir; los conjuros de curación les sirven a medias.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 70,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 19,
     "Nombre": "Escenario de campaña (Eberron)",
     "Pagina": 17
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Constructo viviente",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [
     {
      "Descripcion": "Tiene Constitución; inmune al veneno, al sueño, a la parálisis, a la enfermedad, a las náuseas, a la fatiga, al agotamiento y a la consunción de energía; no se cura solo y la curación mágica le sirve a medias; se le puede revivir; no come, no duerme ni respira.",
      "Id": 83,
      "Nombre": "Rasgos del constructo viviente",
      "Oficial": true
     }
    ],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 70,
   "nombre": "Constructo viviente"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los félidos; todo humanoide tiene un subtipo que dice de qué raza es.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 35,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Félido",
     "oficial": true,
     "pagina": 94,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los félidos; todo humanoide tiene un subtipo que dice de qué raza es.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 72,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 35,
     "Nombre": "Razas de lo salvaje",
     "Pagina": 94
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Félido",
    "Oficial": true,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 72,
   "nombre": "Félido"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los jacquar de Rol mapa mundi.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 65,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Jacquar",
     "oficial": false,
     "pagina": 0,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los jacquar de Rol mapa mundi.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 85,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 0
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Jacquar",
    "Oficial": false,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 85,
   "nombre": "Jacquar"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los vrykolakas de Rol mapa mundi.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 65,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Vrykolaka",
     "oficial": false,
     "pagina": 0,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los vrykolakas de Rol mapa mundi.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 86,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 0
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Vrykolaka",
    "Oficial": false,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 86,
   "nombre": "Vrykolaka"
  },
  {
   "cuerpo": {
    "dotes": [],
    "habilidades": [],
    "idiomas": [],
    "plantillas": [],
    "rasgos": [],
    "sortilegas": [],
    "subtipo": {
     "ajuste_nivel": 0,
     "ataque_base": 0,
     "ca": null,
     "carisma": 0,
     "cd": null,
     "constitucion": 0,
     "correr": 0,
     "descripcion": "Subtipo de los etheri de Rol mapa mundi.",
     "destreza": 0,
     "excavar": 0,
     "fortaleza": 0,
     "fuerza": 0,
     "heredada": true,
     "id_alineamiento": 2,
     "id_maniobrabilidad": null,
     "id_manual": 65,
     "iniciativa": 0,
     "inteligencia": 0,
     "min_carisma": 0,
     "min_constitucion": 0,
     "min_destreza": 0,
     "min_fuerza": 0,
     "min_inteligencia": 0,
     "min_sabiduria": 0,
     "nadar": 0,
     "nombre": "Etheri",
     "oficial": false,
     "pagina": 0,
     "presa": 0,
     "rc": null,
     "rd": null,
     "re": null,
     "reflejos": 0,
     "sabiduria": 0,
     "tesoro": null,
     "trepar": 0,
     "volar": 0,
     "voluntad": 0
    }
   },
   "get": {
    "Ajuste_nivel": 0,
    "Alineamiento": {
     "Basico": null,
     "Descripcion": "Generalmente para alineamientos basados en preferencias donde estas son Ninguna preferencia.",
     "Id": 2,
     "Ley": {
      "Id_ley": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Moral": {
      "Id_moral": 10,
      "Nombre": "Ninguna preferencia"
     },
     "Prioridad": null
    },
    "Ataque_base": 0,
    "Ca": null,
    "Cd": null,
    "Comodin": null,
    "Descripcion": "Subtipo de los etheri de Rol mapa mundi.",
    "Dotes": [],
    "Fortaleza": 0,
    "Habilidades": {
     "Base": [],
     "Custom": []
    },
    "Heredada": true,
    "Id": 87,
    "Idiomas": [],
    "Iniciativa": 0,
    "Maniobrabilidad": null,
    "Manual": {
     "Id": 65,
     "Nombre": "Rol mapa mundi",
     "Pagina": 0
    },
    "Minimos_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Modificadores_caracteristicas": {
     "Carisma": 0,
     "Constitucion": 0,
     "Destreza": 0,
     "Fuerza": 0,
     "Inteligencia": 0,
     "Sabiduria": 0
    },
    "Movimientos": {
     "Correr": 0,
     "Excavar": 0,
     "Nadar": 0,
     "Trepar": 0,
     "Volar": 0
    },
    "Nombre": "Etheri",
    "Oficial": false,
    "Plantillas": [],
    "Presa": 0,
    "Rasgos": [],
    "Rc": null,
    "Rd": null,
    "Re": null,
    "Reflejos": 0,
    "Sortilegas": [],
    "Tesoro": null,
    "Voluntad": 0
   },
   "id": 87,
   "nombre": "Etheri"
  }
 ],
 "tipos": [
  {
   "cuerpo": {
    "rasgos": [
     9
    ],
    "tipo": {
     "come": true,
     "criticos": false,
     "descripcion": "Una aberración tiene una anatomía extravagante, aptitudes insólitas, y propósitos extraños, o cualquier combinación de las tres.",
     "duerme": true,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 2,
     "id_fortaleza": 2,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 2,
     "id_tipo_dado": 3,
     "id_voluntad": 1,
     "limite_inteligencia": -1,
     "nombre": "Aberración",
     "oficial": true,
     "pagina": 314,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": false,
    "d": "Una aberración tiene una anatomía extravagante, aptitudes insólitas, y propósitos extraños, o cualquier combinación de las tres.",
    "du": true,
    "f": false,
    "i": "1",
    "ia": "2",
    "ial": "2",
    "ift": "2",
    "im": 47,
    "iph": "1",
    "ir": "2",
    "itd": "3",
    "iv": "1",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 314",
    "n": "Aberración",
    "ntd": "D8",
    "o": true,
    "pc": false,
    "pg": 314,
    "ph": 2,
    "r": true,
    "ra": [
     {
      "Descripcion": "",
      "Id": "9",
      "Nombre": "Visión en la oscuridad 60'",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 1,
   "nombre": "Aberración"
  },
  {
   "cuerpo": {
    "rasgos": [
     9,
     13
    ],
    "tipo": {
     "come": false,
     "criticos": false,
     "descripcion": "Un ajeno está compuesto al menos en parte de la esencia (pero no necesariamente de la materia) de algún otro plano que no es el plano material. Algunas criaturas empiezan siendo de otro tipo y se convierten en ajenos cuando alcanzan un estado de existencia espiritual más elevado (o más bajo).",
     "duerme": false,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 1,
     "id_fortaleza": 1,
     "id_manual": 47,
     "id_puntos_habilidad": 4,
     "id_reflejos": 1,
     "id_tipo_dado": 3,
     "id_voluntad": 1,
     "limite_inteligencia": -1,
     "nombre": "Ajeno",
     "oficial": true,
     "pagina": 314,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": false,
    "cr": false,
    "d": "Un ajeno está compuesto al menos en parte de la esencia (pero no necesariamente de la materia) de algún otro plano que no es el plano material. Algunas criaturas empiezan siendo de otro tipo y se convierten en ajenos cuando alcanzan un estado de existencia espiritual más elevado (o más bajo).",
    "du": false,
    "f": false,
    "i": "2",
    "ia": "1",
    "ial": "2",
    "ift": "1",
    "im": 47,
    "iph": "4",
    "ir": "1",
    "itd": "3",
    "iv": "1",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 314",
    "n": "Ajeno",
    "ntd": "D8",
    "o": true,
    "pc": false,
    "pg": 314,
    "ph": 8,
    "r": true,
    "ra": [
     {
      "Descripcion": "",
      "Id": "9",
      "Nombre": "Visión en la oscuridad 60'",
      "Oficial": true
     },
     {
      "Descripcion": "Al contrario que la mayoría de criaturas vivas, un ajeno no posee una naturaleza dual, sino que su cuerpo y alma forman una unidad. Cuando muere un ajeno, no se libera alma alguna. Los conjuros que devuelven el alma a los cuerpos, tales como revivir a los muertos, reencarnar y resurreccción, no funcionan en un ajeno. Se necesita un efecto mágico diferente, tal como deseo, deseo limitado, milagro o resurrección verdadera, para devolverlo a la vida. Un ajeno con el subtipo 'nativo' (consulta manual de monstruos 1 página 312) puede ser revivido, reencarnado o resucitado de igual forma que lo puede ser cualquier otra criatura viva.",
      "Id": "13",
      "Nombre": "Sin alma (ajenos)",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 2,
   "nombre": "Ajeno"
  },
  {
   "cuerpo": {
    "rasgos": [],
    "tipo": {
     "come": true,
     "criticos": false,
     "descripcion": "Un animal es una criatura viva, no humanoide, por lo general un vertebrado sin aptitudes mágicas y sin capacidad innata para tener un idioma o una cultura.",
     "duerme": true,
     "flanqueado": false,
     "id_alineamiento": 26,
     "id_ataque": 2,
     "id_fortaleza": 1,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 1,
     "id_tipo_dado": 3,
     "id_voluntad": 2,
     "limite_inteligencia": 2,
     "nombre": "Animal",
     "oficial": true,
     "pagina": 314,
     "pierde_cons": false,
     "respira": true,
     "tesoro": "ninguno"
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": false,
    "d": "Un animal es una criatura viva, no humanoide, por lo general un vertebrado sin aptitudes mágicas y sin capacidad innata para tener un idioma o una cultura.",
    "du": true,
    "f": false,
    "i": "3",
    "ia": "2",
    "ial": "26",
    "ift": "1",
    "im": 47,
    "iph": "1",
    "ir": "1",
    "itd": "3",
    "iv": "2",
    "li": "2",
    "ma": "Manual de monstruos 1, Página: 314",
    "n": "Animal",
    "ntd": "D8",
    "o": true,
    "pc": false,
    "pg": 314,
    "ph": 2,
    "r": true,
    "ra": [],
    "t": "ninguno"
   },
   "id": 3,
   "nombre": "Animal"
  },
  {
   "cuerpo": {
    "rasgos": [
     7
    ],
    "tipo": {
     "come": true,
     "criticos": false,
     "descripcion": "Una bestia mágica es parecida a un animal, pero puede tener puntuación de inteligencia superior a 2. Normalmente, las bestias mágicas poseen aptitudes sobrenaturales o extraordinarias, pero algunas veces sencillamente tienen una apariencia o costumbres extrañas.",
     "duerme": true,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 1,
     "id_fortaleza": 1,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 1,
     "id_tipo_dado": 4,
     "id_voluntad": 2,
     "limite_inteligencia": -1,
     "nombre": "Bestia mágica",
     "oficial": true,
     "pagina": 315,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": false,
    "d": "Una bestia mágica es parecida a un animal, pero puede tener puntuación de inteligencia superior a 2. Normalmente, las bestias mágicas poseen aptitudes sobrenaturales o extraordinarias, pero algunas veces sencillamente tienen una apariencia o costumbres extrañas.",
    "du": true,
    "f": false,
    "i": "4",
    "ia": "1",
    "ial": "2",
    "ift": "1",
    "im": 47,
    "iph": "1",
    "ir": "1",
    "itd": "4",
    "iv": "2",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 315",
    "n": "Bestia mágica",
    "ntd": "D10",
    "o": true,
    "pc": false,
    "pg": 315,
    "ph": 2,
    "r": true,
    "ra": [
     {
      "Descripcion": "",
      "Id": "7",
      "Nombre": "Visión en la oscuridad hasta 60' y visión en la penumbra.",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 4,
   "nombre": "Bestia mágica"
  },
  {
   "cuerpo": {
    "rasgos": [
     15,
     16,
     17,
     18,
     19,
     20,
     21,
     22,
     23
    ],
    "tipo": {
     "come": true,
     "criticos": true,
     "descripcion": "Un cieno es una criatura amorfa o mutante, por lo general descerebrada.",
     "duerme": false,
     "flanqueado": true,
     "id_alineamiento": 2,
     "id_ataque": 2,
     "id_fortaleza": 2,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 2,
     "id_tipo_dado": 4,
     "id_voluntad": 2,
     "limite_inteligencia": 0,
     "nombre": "Cieno",
     "oficial": true,
     "pagina": 315,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": true,
    "d": "Un cieno es una criatura amorfa o mutante, por lo general descerebrada.",
    "du": false,
    "f": true,
    "i": "5",
    "ia": "2",
    "ial": "2",
    "ift": "2",
    "im": 47,
    "iph": "1",
    "ir": "2",
    "itd": "4",
    "iv": "2",
    "li": "0",
    "ma": "Manual de monstruos 1, Página: 315",
    "n": "Cieno",
    "ntd": "D10",
    "o": true,
    "pc": false,
    "pg": 315,
    "ph": 2,
    "r": true,
    "ra": [
     {
      "Descripcion": "No tiene puntuación de inteligencia y posee inmunidad a todos los efectos enajenadores (compulsiones, fantasmagorías, hechizos, pautas y efectos de moral).",
      "Id": "15",
      "Nombre": "Descerebrado (cienos)",
      "Oficial": true
     },
     {
      "Descripcion": "Algo ciego no puede ver pero posee inmunidad a los ataques de mirada, efectos visuales, y otras formas de ataque que impliquen la vista.",
      "Id": "16",
      "Nombre": "Ciego",
      "Oficial": true
     },
     {
      "Descripcion": "Esta aptitud es parecida al sentido ciego, pero mucho más perspicaz. Mediante la utilización de sentidos no visuales, como la sensivilidad a las vibraciones, un olfato agudo, un oído fino o la ubicación por eco, la criatura con vista ciega puede maniobrar y atacar igual de bien que una criatura vidente. La invisibilidad y la oscuridad y la mayoría de ocultaciones resultarán irrelevantes para ella, aunque la criatura debe tener una línea de influencia hasta la criatura u objeto para ser capaz de discernirlos. El alcance de la aptitud se especificará en la descripción. Por lo general, la criatura no necesitará realizar pruebas de avistar ni escuchar para advertir la presencia de criaturas dentro del alcance de su vista ciega. \r\nSalvo que se diga lo contrario, la vista ciega actúa de forma continua, y la criatura no necesita hacer nada para utilizarla. Sin embargo, algunas formas de vista ciega deben ser activadas mediante una acción gratuita. Cuando este sea el caso, figurará anotado en la descripción del monstruo. Si una criatura debe activar su aptitud de vista ciega, obtiene los beneficios de esta aptitud solamente durante su turno.",
      "Id": "17",
      "Nombre": "Vista ciega",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "18",
      "Nombre": "Inmunidad al veneno",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "19",
      "Nombre": "Inmunidad a la parálisis",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "20",
      "Nombre": "Inmunidad al aturdimiento",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "21",
      "Nombre": "Inmunidad a las enfermedades",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "22",
      "Nombre": "Inmunidad a los efectos de dormir",
      "Oficial": true
     },
     {
      "Descripcion": "Algunos cienos poseen la aptitud de infligir daño por ácido a objetos.\r\nEn tales casos, la cantidad de daño es igual a 10 + 1/2 de los dgs del cieno + mod constitución del cieno por asalto completo de contacto.",
      "Id": "23",
      "Nombre": "Daño por ácido (cienos)",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 5,
   "nombre": "Cieno"
  },
  {
   "cuerpo": {
    "rasgos": [
     7,
     18,
     19,
     20,
     21,
     22,
     24,
     25,
     26,
     27,
     28,
     29,
     30,
     31,
     32
    ],
    "tipo": {
     "come": false,
     "criticos": true,
     "descripcion": "Un constructo es un objeto animado o una criatura construida de manera artificial.",
     "duerme": false,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 2,
     "id_fortaleza": 2,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 2,
     "id_tipo_dado": 4,
     "id_voluntad": 2,
     "limite_inteligencia": -1,
     "nombre": "Constructo",
     "oficial": true,
     "pagina": 315,
     "pierde_cons": true,
     "respira": false,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": false,
    "cr": true,
    "d": "Un constructo es un objeto animado o una criatura construida de manera artificial.",
    "du": false,
    "f": false,
    "i": "6",
    "ia": "2",
    "ial": "2",
    "ift": "2",
    "im": 47,
    "iph": "1",
    "ir": "2",
    "itd": "4",
    "iv": "2",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 315",
    "n": "Constructo",
    "ntd": "D10",
    "o": true,
    "pc": true,
    "pg": 315,
    "ph": 2,
    "r": false,
    "ra": [
     {
      "Descripcion": "",
      "Id": "7",
      "Nombre": "Visión en la oscuridad hasta 60' y visión en la penumbra.",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "18",
      "Nombre": "Inmunidad al veneno",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "19",
      "Nombre": "Inmunidad a la parálisis",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "20",
      "Nombre": "Inmunidad al aturdimiento",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "21",
      "Nombre": "Inmunidad a las enfermedades",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "22",
      "Nombre": "Inmunidad a los efectos de dormir",
      "Oficial": true
     },
     {
      "Descripcion": "Compulsiones, fantasmagorías, hechizos, pautas y efectos de moral.",
      "Id": "24",
      "Nombre": "Inmunidad a todos los efectos enajenadores",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "25",
      "Nombre": "Inmunidad a efectos de muerte",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "26",
      "Nombre": "Inmunidad a efectos necrománticos",
      "Oficial": true
     },
     {
      "Descripcion": "Los contructos no pueden recuperarse del daño por sí mismos, aunque a menudo sí pueden ser sanados, mediante la exposición a ciertos efectos, o mediante la utilización de la dote de fabricar constructo. Un constructo que posea la cualidad especial de curación rápida seguirá beneficiándose de tal facultad.",
      "Id": "27",
      "Nombre": "Recuperacion de vida (constructos)",
      "Oficial": true
     },
     {
      "Descripcion": "Los constructos no resultan afectados por los golpes críticos, el daño no letal, el daño de característica, la fatiga, el agotamiento o las consunciones de característica/energia.",
      "Id": "28",
      "Nombre": "Resistencia a golpes (constructos)",
      "Oficial": true
     },
     {
      "Descripcion": "Las criaturas con este rasgo son inmunes a cualquier efecto que provoque una salvación de fortaleza, a menos que tal efecto funcione en objetos o que sea inofensivo.",
      "Id": "29",
      "Nombre": "Inmunidad a efectos con salvación por fortaleza",
      "Oficial": true
     },
     {
      "Descripcion": "Los constructos no pueden morir debido a efectos de daño masivo, pero cuando su vida llega a 0 o menos, resultan destruidos de manera inmediata.",
      "Id": "30",
      "Nombre": "Causas de muerte (constructos)",
      "Oficial": true
     },
     {
      "Descripcion": "Al no haber estado vivo jamás, un constructo no puede ser revivido ni resucitado.",
      "Id": "31",
      "Nombre": "Incapacidad de revivir (constructos)",
      "Oficial": true
     },
     {
      "Descripcion": "Debido a que su cuerpo es una masa de materia inerte, un cosntructo es dificil de destruir. Obtiene puntos de golpe adicionales según su tamaño.\r\nMinúsculo, diminuto y menudo: 0\r\npequeño: +10\r\nmediano: +20\r\ngrande: +30\r\nenorme: +40\r\ngargantuesco: +60\r\ncolosal: +80",
      "Id": "32",
      "Nombre": "Dgs adicionales según tamaño (constructos)",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 6,
   "nombre": "Constructo"
  },
  {
   "cuerpo": {
    "rasgos": [
     7,
     19,
     22
    ],
    "tipo": {
     "come": true,
     "criticos": false,
     "descripcion": "Un dragón es una criatura reptiliana, habitualmente alada, con aptitudes mágicas o insólitas.",
     "duerme": true,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 1,
     "id_fortaleza": 1,
     "id_manual": 47,
     "id_puntos_habilidad": 3,
     "id_reflejos": 1,
     "id_tipo_dado": 5,
     "id_voluntad": 1,
     "limite_inteligencia": -1,
     "nombre": "Dragón",
     "oficial": true,
     "pagina": 315,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": false,
    "d": "Un dragón es una criatura reptiliana, habitualmente alada, con aptitudes mágicas o insólitas.",
    "du": true,
    "f": false,
    "i": "7",
    "ia": "1",
    "ial": "2",
    "ift": "1",
    "im": 47,
    "iph": "3",
    "ir": "1",
    "itd": "5",
    "iv": "1",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 315",
    "n": "Dragón",
    "ntd": "D12",
    "o": true,
    "pc": false,
    "pg": 315,
    "ph": 6,
    "r": true,
    "ra": [
     {
      "Descripcion": "",
      "Id": "7",
      "Nombre": "Visión en la oscuridad hasta 60' y visión en la penumbra.",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "19",
      "Nombre": "Inmunidad a la parálisis",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "22",
      "Nombre": "Inmunidad a los efectos de dormir",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 7,
   "nombre": "Dragón"
  },
  {
   "cuerpo": {
    "rasgos": [
     9,
     18,
     19,
     20,
     22,
     33
    ],
    "tipo": {
     "come": false,
     "criticos": true,
     "descripcion": "Un elemental es un ser compuesto de uno de los cuatro elementos clásicos: aire, agua, fuego y tierra.",
     "duerme": false,
     "flanqueado": true,
     "id_alineamiento": 2,
     "id_ataque": 2,
     "id_fortaleza": 1,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 1,
     "id_tipo_dado": 3,
     "id_voluntad": 1,
     "limite_inteligencia": -1,
     "nombre": "Elemental",
     "oficial": true,
     "pagina": 316,
     "pierde_cons": false,
     "respira": false,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": false,
    "cr": true,
    "d": "Un elemental es un ser compuesto de uno de los cuatro elementos clásicos: aire, agua, fuego y tierra.",
    "du": false,
    "f": true,
    "i": "8",
    "ia": "2",
    "ial": "2",
    "ift": "1",
    "im": 47,
    "iph": "1",
    "ir": "1",
    "itd": "3",
    "iv": "1",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 316",
    "n": "Elemental",
    "ntd": "D8",
    "o": true,
    "pc": false,
    "pg": 316,
    "ph": 2,
    "r": false,
    "ra": [
     {
      "Descripcion": "",
      "Id": "9",
      "Nombre": "Visión en la oscuridad 60'",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "18",
      "Nombre": "Inmunidad al veneno",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "19",
      "Nombre": "Inmunidad a la parálisis",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "20",
      "Nombre": "Inmunidad al aturdimiento",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "22",
      "Nombre": "Inmunidad a los efectos de dormir",
      "Oficial": true
     },
     {
      "Descripcion": "Al contrario que la mayoría de criaturas vivas, un elemental no posee una naturaleza dual, sino que su cuerpo y alma forman una unidad. Cuando muere un elemental, no se libera alma alguna. Los conjuros que devuelven el alma a los cuerpos, tales como revivir a los muertos, reencarnar y resurreccción, no funcionan en un ajeno. Se necesita un efecto mágico diferente, tal como deseo, deseo limitado, milagro o resurrección verdadera, para devolverlo a la vida. Un ajeno con el subtipo 'nativo' (consulta manual de monstruos 1 página 312) puede ser revivido, reencarnado o resucitado de igual forma que lo puede ser cualquier otra criatura viva.",
      "Id": "33",
      "Nombre": "Sin alma (elementales)",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 8,
   "nombre": "Elemental"
  },
  {
   "cuerpo": {
    "rasgos": [
     14
    ],
    "tipo": {
     "come": true,
     "criticos": false,
     "descripcion": "Una fata es una criatura con aptitudes sobrenaturales y vínculos con la naturaleza, o alguna otra fuerza o lugar. Por lo general, las fatas tienen forma humanoide.",
     "duerme": true,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 3,
     "id_fortaleza": 2,
     "id_manual": 47,
     "id_puntos_habilidad": 3,
     "id_reflejos": 1,
     "id_tipo_dado": 2,
     "id_voluntad": 1,
     "limite_inteligencia": -1,
     "nombre": "Fata",
     "oficial": true,
     "pagina": 316,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": false,
    "d": "Una fata es una criatura con aptitudes sobrenaturales y vínculos con la naturaleza, o alguna otra fuerza o lugar. Por lo general, las fatas tienen forma humanoide.",
    "du": true,
    "f": false,
    "i": "9",
    "ia": "3",
    "ial": "2",
    "ift": "2",
    "im": 47,
    "iph": "3",
    "ir": "1",
    "itd": "2",
    "iv": "1",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 316",
    "n": "Fata",
    "ntd": "D6",
    "o": true,
    "pc": false,
    "pg": 316,
    "ph": 6,
    "r": true,
    "ra": [
     {
      "Descripcion": "Puedes ver el doble de bien que las razas que no ven en la penumbra, a la luz de las estrellas, de la luna, de una antorcha, y demás situaciones en que haya una escasa iluminación. Además en estas circunstancias conservan la capacidad de ver en color y percibir detalles.",
      "Id": "14",
      "Nombre": "Visión en la penumbra",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 9,
   "nombre": "Fata"
  },
  {
   "cuerpo": {
    "rasgos": [
     14
    ],
    "tipo": {
     "come": true,
     "criticos": false,
     "descripcion": "Un gigante es una criatura humanoide, dotada de gran fuerza que, como mínimo, suele ser de tamaño grande.",
     "duerme": true,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 2,
     "id_fortaleza": 1,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 2,
     "id_tipo_dado": 3,
     "id_voluntad": 2,
     "limite_inteligencia": -1,
     "nombre": "Gigante",
     "oficial": true,
     "pagina": 316,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": false,
    "d": "Un gigante es una criatura humanoide, dotada de gran fuerza que, como mínimo, suele ser de tamaño grande.",
    "du": true,
    "f": false,
    "i": "10",
    "ia": "2",
    "ial": "2",
    "ift": "1",
    "im": 47,
    "iph": "1",
    "ir": "2",
    "itd": "3",
    "iv": "2",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 316",
    "n": "Gigante",
    "ntd": "D8",
    "o": true,
    "pc": false,
    "pg": 316,
    "ph": 2,
    "r": true,
    "ra": [
     {
      "Descripcion": "Puedes ver el doble de bien que las razas que no ven en la penumbra, a la luz de las estrellas, de la luna, de una antorcha, y demás situaciones en que haya una escasa iluminación. Además en estas circunstancias conservan la capacidad de ver en color y percibir detalles.",
      "Id": "14",
      "Nombre": "Visión en la penumbra",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 10,
   "nombre": "Gigante"
  },
  {
   "cuerpo": {
    "rasgos": [],
    "tipo": {
     "come": true,
     "criticos": false,
     "descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabeza, o bien, torso, brazos y cabeza de aspecto humano. Poseen escasas aptitudes sobrenaturales o extraordinarias (o ninguna, 0), pero la mayoría pueden hablar y habitualmente tienen sociedades bien desarrolladas. Por lo general son pequeños o medianos. Toda criatura humanoide también posee un subtipo, tales como elfo, reptiliano o trasgoide.\r\nLos humanoides con 1 dg cambian los aspectos de su dg racial por los rasgos de clase de una clase de pj. Presentamos a los humanoides de este tipo como combatientes de primer nivel, lo que significa que poseen una habilidad de combate regular y ts pobres.\r\nLos humanoides con más de 1 dg (por ejemplo, los gnols y los osgos) son los únicos humanoides que utilizan los aspectos del tipo humanoide.",
     "duerme": true,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 2,
     "id_fortaleza": 1,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 1,
     "id_tipo_dado": 3,
     "id_voluntad": 1,
     "limite_inteligencia": -1,
     "nombre": "Humanoide",
     "oficial": true,
     "pagina": 316,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": false,
    "d": "Un humanoide suele tener dos brazos, dos piernas y una cabeza, o bien, torso, brazos y cabeza de aspecto humano. Poseen escasas aptitudes sobrenaturales o extraordinarias (o ninguna, 0), pero la mayoría pueden hablar y habitualmente tienen sociedades bien desarrolladas. Por lo general son pequeños o medianos. Toda criatura humanoide también posee un subtipo, tales como elfo, reptiliano o trasgoide.\r\nLos humanoides con 1 dg cambian los aspectos de su dg racial por los rasgos de clase de una clase de pj. Presentamos a los humanoides de este tipo como combatientes de primer nivel, lo que significa que poseen una habilidad de combate regular y ts pobres.\r\nLos humanoides con más de 1 dg (por ejemplo, los gnols y los osgos) son los únicos humanoides que utilizan los aspectos del tipo humanoide.",
    "du": true,
    "f": false,
    "i": "11",
    "ia": "2",
    "ial": "2",
    "ift": "1",
    "im": 47,
    "iph": "1",
    "ir": "1",
    "itd": "3",
    "iv": "1",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 316",
    "n": "Humanoide",
    "ntd": "D8",
    "o": true,
    "pc": false,
    "pg": 316,
    "ph": 2,
    "r": true,
    "ra": [],
    "t": null
   },
   "id": 11,
   "nombre": "Humanoide"
  },
  {
   "cuerpo": {
    "rasgos": [
     9
    ],
    "tipo": {
     "come": true,
     "criticos": false,
     "descripcion": "Los humanoides monstruosos son parecidos a los humanoides, pero están dotados de rasgos animales o monstruosos. A menudo también poseen aptitudes sobrenaturales.",
     "duerme": true,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 1,
     "id_fortaleza": 2,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 1,
     "id_tipo_dado": 3,
     "id_voluntad": 1,
     "limite_inteligencia": -1,
     "nombre": "Humanoide monstruoso",
     "oficial": true,
     "pagina": 316,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": false,
    "d": "Los humanoides monstruosos son parecidos a los humanoides, pero están dotados de rasgos animales o monstruosos. A menudo también poseen aptitudes sobrenaturales.",
    "du": true,
    "f": false,
    "i": "12",
    "ia": "1",
    "ial": "2",
    "ift": "2",
    "im": 47,
    "iph": "1",
    "ir": "1",
    "itd": "3",
    "iv": "1",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 316",
    "n": "Humanoide monstruoso",
    "ntd": "D8",
    "o": true,
    "pc": false,
    "pg": 316,
    "ph": 2,
    "r": true,
    "ra": [
     {
      "Descripcion": "",
      "Id": "9",
      "Nombre": "Visión en la oscuridad 60'",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 12,
   "nombre": "Humanoide monstruoso"
  },
  {
   "cuerpo": {
    "rasgos": [
     9,
     18,
     19,
     20,
     21,
     22,
     24,
     25,
     29,
     34,
     35,
     36
    ],
    "tipo": {
     "come": false,
     "criticos": true,
     "descripcion": "Un muerto viviente es una criatura, viva en su día, que despues de morir ha sido reanimada mediante fuerzas espirituales o sobrenaturales.",
     "duerme": false,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 3,
     "id_fortaleza": 2,
     "id_manual": 47,
     "id_puntos_habilidad": 2,
     "id_reflejos": 2,
     "id_tipo_dado": 5,
     "id_voluntad": 1,
     "limite_inteligencia": -1,
     "nombre": "Muerto viviente",
     "oficial": true,
     "pagina": 316,
     "pierde_cons": true,
     "respira": false,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": false,
    "cr": true,
    "d": "Un muerto viviente es una criatura, viva en su día, que despues de morir ha sido reanimada mediante fuerzas espirituales o sobrenaturales.",
    "du": false,
    "f": false,
    "i": "13",
    "ia": "3",
    "ial": "2",
    "ift": "2",
    "im": 47,
    "iph": "2",
    "ir": "2",
    "itd": "5",
    "iv": "1",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 316",
    "n": "Muerto viviente",
    "ntd": "D12",
    "o": true,
    "pc": true,
    "pg": 316,
    "ph": 4,
    "r": false,
    "ra": [
     {
      "Descripcion": "",
      "Id": "9",
      "Nombre": "Visión en la oscuridad 60'",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "18",
      "Nombre": "Inmunidad al veneno",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "19",
      "Nombre": "Inmunidad a la parálisis",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "20",
      "Nombre": "Inmunidad al aturdimiento",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "21",
      "Nombre": "Inmunidad a las enfermedades",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "22",
      "Nombre": "Inmunidad a los efectos de dormir",
      "Oficial": true
     },
     {
      "Descripcion": "Compulsiones, fantasmagorías, hechizos, pautas y efectos de moral.",
      "Id": "24",
      "Nombre": "Inmunidad a todos los efectos enajenadores",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "25",
      "Nombre": "Inmunidad a efectos de muerte",
      "Oficial": true
     },
     {
      "Descripcion": "Las criaturas con este rasgo son inmunes a cualquier efecto que provoque una salvación de fortaleza, a menos que tal efecto funcione en objetos o que sea inofensivo.",
      "Id": "29",
      "Nombre": "Inmunidad a efectos con salvación por fortaleza",
      "Oficial": true
     },
     {
      "Descripcion": "No corren peligro de muerte como consecuencia del daño masivo, pero resultan destruidos de manera inmediata en cuanto sus puntos de golpe quedan reducidos a 0 o menos.",
      "Id": "34",
      "Nombre": "Causas de muerte (no muertos)",
      "Oficial": true
     },
     {
      "Descripcion": "Si no tienen puntuación de inteligencia no pueden recuperarse del daño por sí mismos, aunque pueden ser curados. La energía negativa puede curar las heridas a las criaturas muertas vivientes. La cualidad especial de curación rápida funciona sin tener en cuenta la puntuación de inteligencia de la criatura.",
      "Id": "35",
      "Nombre": "Recuperación de vida (no muertos)",
      "Oficial": true
     },
     {
      "Descripcion": "No resultan afectados por los golpes críticos, el daño no letal y las consunciones de característica o energía. Son inmunes al daño de característica de sus puntuaciones físicas (fuerza, destreza, constitución), así como a los efectos de la fatiga y el agotamiento.",
      "Id": "36",
      "Nombre": "Resistencia a golpes (no muertos)",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 13,
   "nombre": "Muerto viviente"
  },
  {
   "cuerpo": {
    "rasgos": [
     14,
     18,
     19,
     20,
     22,
     24,
     37
    ],
    "tipo": {
     "come": true,
     "criticos": true,
     "descripcion": "Este tipo incluye las criaturas vegetales. Ten en cuenta que las plantas normales, como las que crecen en jardines y en el campo, carecen de puntuaciones de sabiduría y de carisma y por ello no son criaturas, sino objetos, aunque estén vivas.",
     "duerme": false,
     "flanqueado": false,
     "id_alineamiento": 2,
     "id_ataque": 2,
     "id_fortaleza": 1,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 2,
     "id_tipo_dado": 3,
     "id_voluntad": 2,
     "limite_inteligencia": -1,
     "nombre": "Planta",
     "oficial": true,
     "pagina": 317,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": true,
    "d": "Este tipo incluye las criaturas vegetales. Ten en cuenta que las plantas normales, como las que crecen en jardines y en el campo, carecen de puntuaciones de sabiduría y de carisma y por ello no son criaturas, sino objetos, aunque estén vivas.",
    "du": false,
    "f": false,
    "i": "14",
    "ia": "2",
    "ial": "2",
    "ift": "1",
    "im": 47,
    "iph": "1",
    "ir": "2",
    "itd": "3",
    "iv": "2",
    "li": "-1",
    "ma": "Manual de monstruos 1, Página: 317",
    "n": "Planta",
    "ntd": "D8",
    "o": true,
    "pc": false,
    "pg": 317,
    "ph": 2,
    "r": true,
    "ra": [
     {
      "Descripcion": "Puedes ver el doble de bien que las razas que no ven en la penumbra, a la luz de las estrellas, de la luna, de una antorcha, y demás situaciones en que haya una escasa iluminación. Además en estas circunstancias conservan la capacidad de ver en color y percibir detalles.",
      "Id": "14",
      "Nombre": "Visión en la penumbra",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "18",
      "Nombre": "Inmunidad al veneno",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "19",
      "Nombre": "Inmunidad a la parálisis",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "20",
      "Nombre": "Inmunidad al aturdimiento",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "22",
      "Nombre": "Inmunidad a los efectos de dormir",
      "Oficial": true
     },
     {
      "Descripcion": "Compulsiones, fantasmagorías, hechizos, pautas y efectos de moral.",
      "Id": "24",
      "Nombre": "Inmunidad a todos los efectos enajenadores",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "37",
      "Nombre": "Inmunidad al polimorfismo",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 14,
   "nombre": "Planta"
  },
  {
   "cuerpo": {
    "rasgos": [
     8,
     9
    ],
    "tipo": {
     "come": true,
     "criticos": false,
     "descripcion": "Este tipo incluye a insectos, arácnidos, artópodos, gusanos e invertebrados similares.",
     "duerme": true,
     "flanqueado": false,
     "id_alineamiento": 1,
     "id_ataque": 2,
     "id_fortaleza": 1,
     "id_manual": 47,
     "id_puntos_habilidad": 1,
     "id_reflejos": 2,
     "id_tipo_dado": 3,
     "id_voluntad": 2,
     "limite_inteligencia": 0,
     "nombre": "Sabandija",
     "oficial": true,
     "pagina": 317,
     "pierde_cons": false,
     "respira": true,
     "tesoro": null
    }
   },
   "get": {
    "Comodin": null,
    "c": true,
    "cr": false,
    "d": "Este tipo incluye a insectos, arácnidos, artópodos, gusanos e invertebrados similares.",
    "du": true,
    "f": false,
    "i": "15",
    "ia": "2",
    "ial": "1",
    "ift": "1",
    "im": 47,
    "iph": "1",
    "ir": "2",
    "itd": "3",
    "iv": "2",
    "li": "0",
    "ma": "Manual de monstruos 1, Página: 317",
    "n": "Sabandija",
    "ntd": "D8",
    "o": true,
    "pc": false,
    "pg": 317,
    "ph": 2,
    "r": true,
    "ra": [
     {
      "Descripcion": "Las sabandijas no tienen puntuación de inteligencia y poseen inmunidad a todos los efectos enajenadores.",
      "Id": "8",
      "Nombre": "Descerebrada (sabandijas)",
      "Oficial": true
     },
     {
      "Descripcion": "",
      "Id": "9",
      "Nombre": "Visión en la oscuridad 60'",
      "Oficial": true
     }
    ],
    "t": null
   },
   "id": 15,
   "nombre": "Sabandija"
  }
 ]
};
