/**
 * Las razas del ensayo de los bonificadores condicionales y las habilidades de un rasgo (roadmap `FINALIZADO_razas-mutadas`,
 * 2026-11-12), como las da la API de la rama `mutadas/condicionales` del backend contra `rol_dev` (con
 * `raciales_bonificadores_condicionales_esquema.sql` y `_datos.sql`): `GET /razas/4` (gnomo), `/razas/3` (enano),
 * `/razas/25` (humano), `/razas/21/sobre/25` (la prole de Bahamut sobre el humano) y, de `GET /habilidades`, Artesanía 1,
 * Avistar, Buscar, Escuchar, Saltar y Tasación. Los textos de más de 60 caracteres, recortados.
 */
/* eslint-disable */
export const GNOMO_API: any = {
 "Armas_naturales": [],
 "Cambios_mutacion": [],
 "Categorias_edad": [],
 "Clase_de_monstruo": null,
 "Clase_predilecta": {
  "Id": 3,
  "Nombre": "Bardo"
 },
 "Clase_predilecta_comodin": null,
 "Clases_asociadas": [],
 "Clases_multiclase_libre": [],
 "Clases_predilectas_extra": [],
 "Comodin": null,
 "Competencias": {
  "Armaduras": [],
  "Armas": [],
  "Grupos_arma": [],
  "Grupos_armadura": []
 },
 "Cuadrupedo": false,
 "Descripcion": "Los gnomos son criaturas pequeñas y muy juguetonas, se les s",
 "Dgs_raciales": {
  "Ataque_base": 0,
  "Cantidad": 0,
  "Dado": "elegir",
  "Dado_comodin": "elegir",
  "Dotes_extra": 0,
  "Fortaleza": 0,
  "Id_dado": 0,
  "Id_tipo_criatura": 0,
  "Multiplicador_puntos_habilidad": 0,
  "Puntos_habilidad": 0,
  "Reflejos": 0,
  "Tipo_criatura": "Cualquiera",
  "Voluntad": 0
 },
 "Dotes_adicionales": 0,
 "Edad_inicial_caras_1": 6,
 "Edad_inicial_caras_2": 6,
 "Edad_inicial_caras_3": 6,
 "Edad_inicial_dados_1": 4,
 "Edad_inicial_dados_2": 6,
 "Edad_inicial_dados_3": 9,
 "Edad_maxima_caras": 100,
 "Edad_maxima_dados": 3,
 "Habilidades": {
  "Base": [
   {
    "Cantidad": 2,
    "Cantidad_condicional": 0,
    "Caracteristica": "Inteligencia",
    "Condicion": null,
    "Descripcion": "Estás cualificado en una disciplina de artes y oficios o una",
    "Entrenada": false,
    "Extra": "Alquimia",
    "Extra_comodin": null,
    "Habilidad": "Artesanía 1",
    "Id_caracteristica": 4,
    "Id_extra": 2,
    "Id_habilidad": 2,
    "Soporta_extra": true,
    "Varios": null
   },
   {
    "Cantidad": 2,
    "Cantidad_condicional": 0,
    "Caracteristica": "Sabiduría",
    "Condicion": null,
    "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
    "Entrenada": false,
    "Extra": null,
    "Extra_comodin": null,
    "Habilidad": "Escuchar",
    "Id_caracteristica": 5,
    "Id_extra": null,
    "Id_habilidad": 17,
    "Soporta_extra": false,
    "Varios": null
   }
  ],
  "Custom": []
 },
 "Id_clase_predilecta": 3,
 "Idiomas": [
  {
   "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
   "Id": 1,
   "Nombre": "Común",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Descripcion": "Idioma hablado por los gnomos",
   "Id": 15,
   "Nombre": "Gnomo",
   "Oficial": true,
   "Secreto": false
  }
 ],
 "Idiomas_adicionales": [
  {
   "Id": 7,
   "Nombre": "Dracónico",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 8,
   "Nombre": "Élfico",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 12,
   "Nombre": "Enano",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 13,
   "Nombre": "Gigante",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 17,
   "Nombre": "Orco",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 19,
   "Nombre": "Trasgo",
   "Oficial": true,
   "Secreto": false
  }
 ],
 "Idiomas_adicionales_cualquiera": false,
 "Lanzamiento": null,
 "Manual": {
  "Id": 54,
  "Nombre": "Manual del jugador 1",
  "Pagina": 17
 },
 "Mutada": false,
 "Nombre_original": null,
 "Pasos_edad": [],
 "Plantillas_por_subtipo": [],
 "Puntos_habilidad_extra_por_nivel": 0,
 "Puntos_habilidad_extra_primer_nivel": 0,
 "Traducido": false,
 "Vd": null,
 "Vd_mod_clases_pj": null,
 "Vd_mod_clases_pnj": null,
 "aju": "0",
 "alc": "5",
 "ali": {
  "Basico": null,
  "Descripcion": "Se debe respetar pero existe la posibilidad de individuos fu",
  "Id": "35",
  "Ley": {
   "Id_ley": "10",
   "Nombre": "Ninguna preferencia"
  },
  "Moral": {
   "Id_moral": "1",
   "Nombre": "Casi siempre Bueno"
  },
  "Prioridad": {
   "Id_prioridad": "2",
   "Nombre": "Importante"
  }
 },
 "an": null,
 "ant": "0",
 "ari": "0.91",
 "ars": "1.12",
 "c": "Bardo",
 "co": "20",
 "dg": {
  "Ataque_base": 0,
  "Cantidad": 0,
  "Dado": "",
  "Dotes_extra": 0,
  "Multiplicador_puntos_habilidad": 0,
  "Puntos_habilidad": 0,
  "Tipo_criatura": ""
 },
 "dotes": [],
 "ea": "40",
 "em": "100",
 "esp": "5",
 "ev": "150",
 "eve": "200",
 "ex": "0",
 "i": "4",
 "m": {
  "Carisma": "0",
  "Constitucion": "2",
  "Destreza": "0",
  "Fuerza": "-2",
  "Inteligencia": "0",
  "Sabiduria": "0"
 },
 "ma": "Manual del jugador 1, Página: 17",
 "man": null,
 "n": "Gnomo",
 "na": "0",
 "o": true,
 "pr": {},
 "pri": "16.78",
 "prs": "21.77",
 "rac": [
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "Puedes usar el arma martillo ganchudo gnomo como si fuera ma",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 1,
   "Nombre": "Familiaridad con armas (gnomo)",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": true
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "Puedes ver el doble de bien que las razas que no ven en la p",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 18,
   "Nombre": "Visión en la penumbra",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 19,
   "Nombre": "+2 racial contra ilusiones",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [
    {
     "Cantidad": 2,
     "Condicion": "Contra ilusiones",
     "Id_salvacion": 1,
     "Salvacion": "Fortaleza"
    },
    {
     "Cantidad": 2,
     "Condicion": "Contra ilusiones",
     "Id_salvacion": 2,
     "Salvacion": "Reflejos"
    },
    {
     "Cantidad": 2,
     "Condicion": "Contra ilusiones",
     "Id_salvacion": 3,
     "Salvacion": "Voluntad"
    }
   ],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 20,
   "Nombre": "+1 a la CD en los TS de sus conjuros de ilusión",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [
    {
     "Cantidad": 1,
     "Condicion": "Contra kóbolds y trasgoides",
     "Contra": [
      {
       "Catalogo": "raza",
       "Id": 14,
       "Nombre": "Kóbold"
      },
      {
       "Catalogo": "raza",
       "Id": 957,
       "Nombre": "Kóbold de tierra"
      },
      {
       "Catalogo": "raza",
       "Id": 976,
       "Nombre": "Kóbold acuático"
      },
      {
       "Catalogo": "raza",
       "Id": 977,
       "Nombre": "Kóbold ártico"
      },
      {
       "Catalogo": "raza",
       "Id": 978,
       "Nombre": "Kóbold desértico"
      },
      {
       "Catalogo": "raza",
       "Id": 979,
       "Nombre": "Kóbold selvático"
      },
      {
       "Catalogo": "subtipo",
       "Id": 61,
       "Nombre": "Trasgoide"
      }
     ],
     "Frase": "Ataque +1 (racial) contra kóbolds y trasgoides",
     "Id": 3,
     "Objetivo": {
      "Id": 2,
      "Nombre": "Ataque"
     },
     "Tipo_bonificador": {
      "Id": 14,
      "Nombre": "Racial"
     }
    }
   ],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 21,
   "Nombre": "+1 al ataque contra kóbolds y trasgoides",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [
    {
     "Cantidad": 4,
     "Condicion": "Contra gigantes",
     "Contra": [
      {
       "Catalogo": "tipo_criatura",
       "Id": 10,
       "Nombre": "Gigante"
      }
     ],
     "Frase": "CA +4 (esquiva) contra gigantes",
     "Id": 4,
     "Objetivo": {
      "Id": 1,
      "Nombre": "CA"
     },
     "Tipo_bonificador": {
      "Id": 8,
      "Nombre": "Esquiva"
     }
    }
   ],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 22,
   "Nombre": "+4 de esquiva contra gigantes",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [
     {
      "Caracteristica": "Inteligencia",
      "Condicion": null,
      "Descripcion": "Estás cualificado en una disciplina de artes y oficios o una",
      "Entrenada": false,
      "Extra": "Alquimia",
      "Extra_comodin": null,
      "Habilidad": "Artesanía 1",
      "Id_caracteristica": 4,
      "Id_extra": 2,
      "Id_habilidad": 2,
      "Rangos": 2,
      "Se_considera_clasea": false,
      "Soporta_extra": true
     }
    ],
    "Custom": []
   },
   "Id": 24,
   "Nombre": "+2 a artesanía alquimia",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 25,
   "Nombre": "1/día hablar con los animales",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": [
    {
     "Conjuro": {
      "Alcance": "Personal",
      "Arcano": true,
      "Area": "",
      "Componentes": [
       {
        "Componente": "Verbal",
        "Id_componente": "1"
       },
       {
        "Componente": "Somático",
        "Id_componente": "2"
       }
      ],
      "Coste_material": null,
      "Coste_px": null,
      "Descripcion": "Te permite comprender a los animales y comunicarte con ellos",
      "Descripcion_aumentos": "",
      "Descripcion_componentes": "",
      "Descriptores": [],
      "Disciplina": null,
      "Divino": true,
      "Duracion": "1 min/nivel",
      "Efecto": "",
      "Escuela": {
       "Especializable": true,
       "Id": "2",
       "Nombre": "Adivinación",
       "Nombre_esp": "Adivinador",
       "Oficial": true,
       "Prohibible": false,
       "Prohibidas_al_especializarse": 1
      },
      "Id": "64",
      "Manual": "Manual del jugador 1, Página: 248",
      "Niveles_clase": [
       {
        "Clase": "bardo",
        "Espontaneo": "0",
        "Id_clase": "3",
        "Nivel": "3"
       },
       {
        "Clase": "druida",
        "Espontaneo": "0",
        "Id_clase": "5",
        "Nivel": "1"
       },
       {
        "Clase": "explorador",
        "Espontaneo": "0",
        "Id_clase": "6",
        "Nivel": "1"
       },
       {
        "Clase": "Cazador consagrado",
        "Espontaneo": "0",
        "Id_clase": "243",
        "Nivel": "1"
       },
       {
        "Clase": "Chamán espiritual",
        "Espontaneo": "0",
        "Id_clase": "244",
        "Nivel": "1"
       },
       {
        "Clase": "Shugenja",
        "Espontaneo": "0",
        "Id_clase": "309",
        "Nivel": "1"
       },
       {
        "Clase": "Vigilante",
        "Espontaneo": "0",
        "Id_clase": "382",
        "Nivel": "3"
       }
      ],
      "Niveles_disciplina": [],
      "Niveles_dominio": [],
      "Nombre": "Hablar con los animales",
      "Objetivo": "Tú",
      "Oficial": true,
      "Permanente": false,
      "Psionico": false,
      "Puntos_poder": "0",
      "Resistencia_conjuros": false,
      "Resistencia_poderes": false,
      "Tiempo_lanzamiento": "1 acción estándar",
      "Tipo_salvacion": null
     },
     "Nivel_lanzador": "Revisar en el manual",
     "Usos_diarios": "1/día"
    }
   ]
  }
 ],
 "rc": null,
 "rd": null,
 "re": null,
 "sor": [
  {
   "Conjuro": {
    "Alcance": "Intermedio",
    "Arcano": true,
    "Area": "",
    "Componentes": [
     {
      "Componente": "Verbal",
      "Id_componente": "1"
     },
     {
      "Componente": "Somático",
      "Id_componente": "2"
     }
    ],
    "Coste_material": null,
    "Coste_px": null,
    "Descripcion": "Dependiendo de la versión por la que te inclines, creas hast",
    "Descripcion_aumentos": "",
    "Descripcion_componentes": "",
    "Descriptores": [
     {
      "Id": "30",
      "Nombre": "Luz"
     }
    ],
    "Disciplina": null,
    "Divino": false,
    "Duracion": "1 minuto (D)",
    "Efecto": "Hasta cuatro luces ilusorias, todas ellas en un área de 10' ",
    "Escuela": {
     "Especializable": true,
     "Id": "5",
     "Nombre": "Evocación",
     "Nombre_esp": "Evocador",
     "Oficial": true,
     "Prohibible": true,
     "Prohibidas_al_especializarse": 2
    },
    "Id": "24",
    "Manual": "Manual del jugador 1, Página: 258",
    "Niveles_clase": [
     {
      "Clase": "bardo",
      "Espontaneo": "0",
      "Id_clase": "3",
      "Nivel": "0"
     },
     {
      "Clase": "hechicero",
      "Espontaneo": "0",
      "Id_clase": "8",
      "Nivel": "0"
     },
     {
      "Clase": "mago",
      "Espontaneo": "0",
      "Id_clase": "9",
      "Nivel": "0"
     },
     {
      "Clase": "Wu jen",
      "Espontaneo": "0",
      "Id_clase": "31",
      "Nivel": "0"
     },
     {
      "Clase": "Shugenja",
      "Espontaneo": "0",
      "Id_clase": "309",
      "Nivel": "0"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [],
    "Nombre": "Luces danzantes",
    "Objetivo": "",
    "Oficial": true,
    "Permanente": true,
    "Psionico": false,
    "Puntos_poder": "0",
    "Resistencia_conjuros": false,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "1 acción estándar",
    "Tipo_salvacion": "Ninguna"
   },
   "Descripcion": "Si tienes al menos 10 de carisma",
   "Nivel_lanzador": "0",
   "Usos_diarios": "1/día"
  },
  {
   "Conjuro": {
    "Alcance": "10",
    "Arcano": true,
    "Area": "",
    "Componentes": [
     {
      "Componente": "Verbal",
      "Id_componente": "1"
     },
     {
      "Componente": "Somático",
      "Id_componente": "2"
     }
    ],
    "Coste_material": null,
    "Coste_px": null,
    "Descripcion": "Las prestidigitaciones son trucos menores que los lanzadores",
    "Descripcion_aumentos": "",
    "Descripcion_componentes": "",
    "Descriptores": [],
    "Disciplina": null,
    "Divino": false,
    "Duracion": "1 hora",
    "Efecto": "",
    "Escuela": {
     "Especializable": false,
     "Id": "9",
     "Nombre": "Universal",
     "Nombre_esp": "",
     "Oficial": true,
     "Prohibible": false,
     "Prohibidas_al_especializarse": 0
    },
    "Id": "28",
    "Manual": "Manual del jugador 1, Página: 275",
    "Niveles_clase": [
     {
      "Clase": "bardo",
      "Espontaneo": "0",
      "Id_clase": "3",
      "Nivel": "0"
     },
     {
      "Clase": "hechicero",
      "Espontaneo": "0",
      "Id_clase": "8",
      "Nivel": "0"
     },
     {
      "Clase": "mago",
      "Espontaneo": "0",
      "Id_clase": "9",
      "Nivel": "0"
     },
     {
      "Clase": "Wu jen",
      "Espontaneo": "0",
      "Id_clase": "31",
      "Nivel": "0"
     },
     {
      "Clase": "Filo aojador",
      "Espontaneo": "0",
      "Id_clase": "32",
      "Nivel": "1"
     },
     {
      "Clase": "Vigilante",
      "Espontaneo": "0",
      "Id_clase": "382",
      "Nivel": "1"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [],
    "Nombre": "Prestidigitación",
    "Objetivo": "Ver texto",
    "Oficial": true,
    "Permanente": false,
    "Psionico": false,
    "Puntos_poder": "0",
    "Resistencia_conjuros": false,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "1 acción estándar",
    "Tipo_salvacion": "Ver texto"
   },
   "Descripcion": "Si tienes al menos 10 de carisma",
   "Nivel_lanzador": "0",
   "Usos_diarios": "1/día"
  },
  {
   "Conjuro": {
    "Alcance": "Corto",
    "Arcano": true,
    "Area": "",
    "Componentes": [
     {
      "Componente": "Verbal",
      "Id_componente": "1"
     },
     {
      "Componente": "Somático",
      "Id_componente": "2"
     },
     {
      "Componente": "Material",
      "Id_componente": "3"
     }
    ],
    "Coste_material": null,
    "Coste_px": null,
    "Descripcion": "*Sonido fantasma* te permite crear un volumen de sonido que ",
    "Descripcion_aumentos": "",
    "Descripcion_componentes": "",
    "Descriptores": [
     {
      "Id": "31",
      "Nombre": "Quimera"
     }
    ],
    "Disciplina": null,
    "Divino": false,
    "Duracion": "1 asalto/nivel (D)",
    "Efecto": "Sonidos ilusorios",
    "Escuela": {
     "Especializable": true,
     "Id": "6",
     "Nombre": "Ilusión",
     "Nombre_esp": "Ilusionista",
     "Oficial": true,
     "Prohibible": true,
     "Prohibidas_al_especializarse": 2
    },
    "Id": "31",
    "Manual": "Manual del jugador 1, Página: 292",
    "Niveles_clase": [
     {
      "Clase": "bardo",
      "Espontaneo": "0",
      "Id_clase": "3",
      "Nivel": "0"
     },
     {
      "Clase": "hechicero",
      "Espontaneo": "0",
      "Id_clase": "8",
      "Nivel": "0"
     },
     {
      "Clase": "mago",
      "Espontaneo": "0",
      "Id_clase": "9",
      "Nivel": "0"
     },
     {
      "Clase": "Wu jen",
      "Espontaneo": "0",
      "Id_clase": "31",
      "Nivel": "0"
     },
     {
      "Clase": "Asesino",
      "Espontaneo": "0",
      "Id_clase": "33",
      "Nivel": "1"
     },
     {
      "Clase": "Arcanamach suelio",
      "Espontaneo": "0",
      "Id_clase": "228",
      "Nivel": "0"
     },
     {
      "Clase": "Asolador",
      "Espontaneo": "0",
      "Id_clase": "241",
      "Nivel": "0"
     },
     {
      "Clase": "Shugenja",
      "Espontaneo": "0",
      "Id_clase": "309",
      "Nivel": "0"
     },
     {
      "Clase": "Robaconjuros",
      "Espontaneo": "0",
      "Id_clase": "376",
      "Nivel": "0"
     },
     {
      "Clase": "Vigilante",
      "Espontaneo": "0",
      "Id_clase": "382",
      "Nivel": "1"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [],
    "Nombre": "Sonido fantasma",
    "Objetivo": "",
    "Oficial": true,
    "Permanente": true,
    "Psionico": false,
    "Puntos_poder": "0",
    "Resistencia_conjuros": false,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "1 acción estándar",
    "Tipo_salvacion": "Voluntad descree (si se interacciona con el conjuro)"
   },
   "Descripcion": "Si tienes al menos 10 de carisma",
   "Nivel_lanzador": "0",
   "Usos_diarios": "1/día"
  },
  {
   "Conjuro": {
    "Alcance": "Personal",
    "Arcano": true,
    "Area": "",
    "Componentes": [
     {
      "Componente": "Verbal",
      "Id_componente": "1"
     },
     {
      "Componente": "Somático",
      "Id_componente": "2"
     }
    ],
    "Coste_material": null,
    "Coste_px": null,
    "Descripcion": "Te permite comprender a los animales y comunicarte con ellos",
    "Descripcion_aumentos": "",
    "Descripcion_componentes": "",
    "Descriptores": [],
    "Disciplina": null,
    "Divino": true,
    "Duracion": "1 min/nivel",
    "Efecto": "",
    "Escuela": {
     "Especializable": true,
     "Id": "2",
     "Nombre": "Adivinación",
     "Nombre_esp": "Adivinador",
     "Oficial": true,
     "Prohibible": false,
     "Prohibidas_al_especializarse": 1
    },
    "Id": "64",
    "Manual": "Manual del jugador 1, Página: 248",
    "Niveles_clase": [
     {
      "Clase": "bardo",
      "Espontaneo": "0",
      "Id_clase": "3",
      "Nivel": "3"
     },
     {
      "Clase": "druida",
      "Espontaneo": "0",
      "Id_clase": "5",
      "Nivel": "1"
     },
     {
      "Clase": "explorador",
      "Espontaneo": "0",
      "Id_clase": "6",
      "Nivel": "1"
     },
     {
      "Clase": "Cazador consagrado",
      "Espontaneo": "0",
      "Id_clase": "243",
      "Nivel": "1"
     },
     {
      "Clase": "Chamán espiritual",
      "Espontaneo": "0",
      "Id_clase": "244",
      "Nivel": "1"
     },
     {
      "Clase": "Shugenja",
      "Espontaneo": "0",
      "Id_clase": "309",
      "Nivel": "1"
     },
     {
      "Clase": "Vigilante",
      "Espontaneo": "0",
      "Id_clase": "382",
      "Nivel": "3"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [],
    "Nombre": "Hablar con los animales",
    "Objetivo": "Tú",
    "Oficial": true,
    "Permanente": false,
    "Psionico": false,
    "Puntos_poder": "0",
    "Resistencia_conjuros": false,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "1 acción estándar",
    "Tipo_salvacion": null
   },
   "Descripcion": "Solo con animales que vivan en madrigueras.",
   "Nivel_lanzador": "0",
   "Usos_diarios": "1/día"
  }
 ],
 "subtipos": [
  {
   "Id": 65,
   "Nombre": "Gnomo"
  }
 ],
 "t": {
  "Id": 4,
  "Modificador": 1,
  "Modificador_esconderse": 4,
  "Modificador_presa": -4,
  "Nombre": "Pequeño"
 },
 "tc": {
  "Come": true,
  "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
  "Duerme": true,
  "Id": "11",
  "Id_alineamiento": "2",
  "Id_ataque": "2",
  "Id_fortaleza": "1",
  "Id_puntos_habilidad": "1",
  "Id_reflejos": "1",
  "Id_tipo_dado": "3",
  "Id_voluntad": "1",
  "Limite_inteligencia": "-1",
  "Manual": "Manual de monstruos 1, Página: 316",
  "Nombre": "Humanoide",
  "Oficial": true,
  "Pierde_constitucion": false,
  "Puede_ser_flanqueado": false,
  "Puntos_habilidad": 2,
  "Rasgos": [],
  "Recibe_críticos": false,
  "Respira": true,
  "Tesoro": null,
  "Tipo_dado": "d8",
  "Tipo_dado_comodin": null
 },
 "tr": "0",
 "va": "0",
 "vo": "0"
};

export const ENANO_API: any = {
 "Armas_naturales": [],
 "Cambios_mutacion": [],
 "Categorias_edad": [],
 "Clase_de_monstruo": null,
 "Clase_predilecta": {
  "Id": 7,
  "Nombre": "Guerrero"
 },
 "Clase_predilecta_comodin": null,
 "Clases_asociadas": [],
 "Clases_multiclase_libre": [],
 "Clases_predilectas_extra": [],
 "Comodin": null,
 "Competencias": {
  "Armaduras": [],
  "Armas": [],
  "Grupos_arma": [],
  "Grupos_armadura": []
 },
 "Cuadrupedo": false,
 "Descripcion": "Pequeñas y gruñonas criaturas que miden en el mejor de los c",
 "Dgs_raciales": {
  "Ataque_base": 0,
  "Cantidad": 0,
  "Dado": "elegir",
  "Dado_comodin": "elegir",
  "Dotes_extra": 0,
  "Fortaleza": 0,
  "Id_dado": 0,
  "Id_tipo_criatura": 0,
  "Multiplicador_puntos_habilidad": 0,
  "Puntos_habilidad": 0,
  "Reflejos": 0,
  "Tipo_criatura": "Cualquiera",
  "Voluntad": 0
 },
 "Dotes_adicionales": 0,
 "Edad_inicial_caras_1": 6,
 "Edad_inicial_caras_2": 6,
 "Edad_inicial_caras_3": 6,
 "Edad_inicial_dados_1": 3,
 "Edad_inicial_dados_2": 5,
 "Edad_inicial_dados_3": 7,
 "Edad_maxima_caras": 100,
 "Edad_maxima_dados": 2,
 "Habilidades": {
  "Base": [],
  "Custom": []
 },
 "Id_clase_predilecta": 7,
 "Idiomas": [
  {
   "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
   "Id": 1,
   "Nombre": "Común",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Descripcion": "Idioma hablado por los enanos",
   "Id": 12,
   "Nombre": "Enano",
   "Oficial": true,
   "Secreto": false
  }
 ],
 "Idiomas_adicionales": [
  {
   "Id": 13,
   "Nombre": "Gigante",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 15,
   "Nombre": "Gnomo",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 2,
   "Nombre": "Infracomún",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 17,
   "Nombre": "Orco",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 18,
   "Nombre": "Térraro",
   "Oficial": true,
   "Secreto": false
  },
  {
   "Id": 19,
   "Nombre": "Trasgo",
   "Oficial": true,
   "Secreto": false
  }
 ],
 "Idiomas_adicionales_cualquiera": false,
 "Lanzamiento": null,
 "Manual": {
  "Id": 54,
  "Nombre": "Manual del jugador 1",
  "Pagina": 15
 },
 "Mutada": false,
 "Nombre_original": null,
 "Pasos_edad": [],
 "Plantillas_por_subtipo": [],
 "Puntos_habilidad_extra_por_nivel": 0,
 "Puntos_habilidad_extra_primer_nivel": 0,
 "Traducido": false,
 "Vd": null,
 "Vd_mod_clases_pj": null,
 "Vd_mod_clases_pnj": null,
 "aju": "0",
 "alc": "5",
 "ali": {
  "Basico": null,
  "Descripcion": "La mayoría de personajes deben seguir estas pautas, pero no ",
  "Id": "34",
  "Ley": {
   "Id_ley": "17",
   "Nombre": "Tendencia a no ser legal"
  },
  "Moral": {
   "Id_moral": "17",
   "Nombre": "Tendencia a no ser bueno"
  },
  "Prioridad": {
   "Id_prioridad": "1",
   "Nombre": "Debe tenerse en cuenta"
  }
 },
 "an": null,
 "ant": "0",
 "ari": "1.14",
 "ars": "1.37",
 "c": "Guerrero",
 "co": "20",
 "dg": {
  "Ataque_base": 0,
  "Cantidad": 0,
  "Dado": "",
  "Dotes_extra": 0,
  "Multiplicador_puntos_habilidad": 0,
  "Puntos_habilidad": 0,
  "Tipo_criatura": ""
 },
 "dotes": [],
 "ea": "40",
 "em": "125",
 "esp": "5",
 "ev": "188",
 "eve": "250",
 "ex": "0",
 "i": "3",
 "m": {
  "Carisma": "-2",
  "Constitucion": "2",
  "Destreza": "0",
  "Fuerza": "0",
  "Inteligencia": "0",
  "Sabiduria": "0"
 },
 "ma": "Manual del jugador 1, Página: 15",
 "man": null,
 "n": "Enano",
 "na": "0",
 "o": true,
 "pr": {},
 "pri": "47.17",
 "prs": "102.51",
 "rac": [
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "La visión en la oscuridad solo te permite ver en blanco y ne",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 8,
   "Nombre": "Visión en la oscuridad 60'",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "Leer en manual del jugador página 16",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 9,
   "Nombre": "Afinidad con la piedra.",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "Pueden usar el hacha de guerra enana y el urgrosh enano como",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 10,
   "Nombre": "Familiaridad con armas (enano)",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": true
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "+4 en las tiradas de característica para resistir ataques de",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 11,
   "Nombre": "Estabilidad",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 12,
   "Nombre": "+2 en las TS contra veneno",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [
    {
     "Cantidad": 2,
     "Condicion": "Contra veneno",
     "Id_salvacion": 1,
     "Salvacion": "Fortaleza"
    },
    {
     "Cantidad": 2,
     "Condicion": "Contra veneno",
     "Id_salvacion": 2,
     "Salvacion": "Reflejos"
    },
    {
     "Cantidad": 2,
     "Condicion": "Contra veneno",
     "Id_salvacion": 3,
     "Salvacion": "Voluntad"
    }
   ],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 13,
   "Nombre": "+2 a las TS contra conjuros y efectos sortílegos",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [
    {
     "Cantidad": 2,
     "Condicion": "Contra conjuros y efectos sortílegos",
     "Id_salvacion": 1,
     "Salvacion": "Fortaleza"
    },
    {
     "Cantidad": 2,
     "Condicion": "Contra conjuros y efectos sortílegos",
     "Id_salvacion": 2,
     "Salvacion": "Reflejos"
    },
    {
     "Cantidad": 2,
     "Condicion": "Contra conjuros y efectos sortílegos",
     "Id_salvacion": 3,
     "Salvacion": "Voluntad"
    }
   ],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [
    {
     "Cantidad": 1,
     "Condicion": "Contra orcos y trasgoides",
     "Contra": [
      {
       "Catalogo": "subtipo",
       "Id": 61,
       "Nombre": "Trasgoide"
      },
      {
       "Catalogo": "subtipo",
       "Id": 68,
       "Nombre": "Orco"
      }
     ],
     "Frase": "Ataque +1 (racial) contra orcos y trasgoides",
     "Id": 1,
     "Objetivo": {
      "Id": 2,
      "Nombre": "Ataque"
     },
     "Tipo_bonificador": {
      "Id": 14,
      "Nombre": "Racial"
     }
    }
   ],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 14,
   "Nombre": "+1 de ataque contra orcos y trasgoides",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [
    {
     "Cantidad": 4,
     "Condicion": "Contra gigantes",
     "Contra": [
      {
       "Catalogo": "tipo_criatura",
       "Id": 10,
       "Nombre": "Gigante"
      }
     ],
     "Frase": "CA +4 (esquiva) contra gigantes",
     "Id": 2,
     "Objetivo": {
      "Id": 1,
      "Nombre": "CA"
     },
     "Tipo_bonificador": {
      "Id": 8,
      "Nombre": "Esquiva"
     }
    }
   ],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 15,
   "Nombre": "+4 de esquiva a la ca contra gigantes",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [
     {
      "Caracteristica": "Inteligencia",
      "Condicion": "Objetos de piedra y/o metal",
      "Descripcion": "Esta habilidad se utiliza para localizar una antigüedad en m",
      "Entrenada": false,
      "Extra": null,
      "Extra_comodin": null,
      "Habilidad": "Tasación",
      "Id_caracteristica": 4,
      "Id_extra": null,
      "Id_habilidad": 40,
      "Rangos": 2,
      "Se_considera_clasea": false,
      "Soporta_extra": false
     }
    ],
    "Custom": []
   },
   "Id": 16,
   "Nombre": "+2 a tasación de objetos de piedra y/o metal",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [
     {
      "Caracteristica": "Inteligencia",
      "Condicion": "Objetos de piedra y/o metal",
      "Descripcion": "Estás cualificado en una disciplina de artes y oficios o una",
      "Entrenada": false,
      "Extra": "Elegir",
      "Extra_comodin": "elegir",
      "Habilidad": "Artesanía 1",
      "Id_caracteristica": 4,
      "Id_extra": 0,
      "Id_habilidad": 2,
      "Rangos": 2,
      "Se_considera_clasea": false,
      "Soporta_extra": true
     }
    ],
    "Custom": []
   },
   "Id": 17,
   "Nombre": "+2 a artesanía con objetos de piedra y/o metal",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  }
 ],
 "rc": null,
 "rd": null,
 "re": null,
 "sor": [],
 "subtipos": [
  {
   "Id": 62,
   "Nombre": "Enano"
  }
 ],
 "t": {
  "Id": 5,
  "Modificador": 0,
  "Modificador_esconderse": 0,
  "Modificador_presa": 0,
  "Nombre": "Mediano"
 },
 "tc": {
  "Come": true,
  "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
  "Duerme": true,
  "Id": "11",
  "Id_alineamiento": "2",
  "Id_ataque": "2",
  "Id_fortaleza": "1",
  "Id_puntos_habilidad": "1",
  "Id_reflejos": "1",
  "Id_tipo_dado": "3",
  "Id_voluntad": "1",
  "Limite_inteligencia": "-1",
  "Manual": "Manual de monstruos 1, Página: 316",
  "Nombre": "Humanoide",
  "Oficial": true,
  "Pierde_constitucion": false,
  "Puede_ser_flanqueado": false,
  "Puntos_habilidad": 2,
  "Rasgos": [],
  "Recibe_críticos": false,
  "Respira": true,
  "Tesoro": null,
  "Tipo_dado": "d8",
  "Tipo_dado_comodin": null
 },
 "tr": "0",
 "va": "0",
 "vo": "0"
};

export const HUMANO_API: any = {
 "Armas_naturales": [],
 "Cambios_mutacion": [],
 "Categorias_edad": [],
 "Clase_de_monstruo": null,
 "Clase_predilecta": {
  "Id": 0,
  "Nombre": "Cualquiera"
 },
 "Clase_predilecta_comodin": "cualquiera",
 "Clases_asociadas": [],
 "Clases_multiclase_libre": [],
 "Clases_predilectas_extra": [],
 "Comodin": null,
 "Competencias": {
  "Armaduras": [],
  "Armas": [],
  "Grupos_arma": [],
  "Grupos_armadura": []
 },
 "Cuadrupedo": false,
 "Descripcion": "La mayoría de los humanos son descendientes de pioneros, con",
 "Dgs_raciales": {
  "Ataque_base": 0,
  "Cantidad": 0,
  "Dado": "elegir",
  "Dado_comodin": "elegir",
  "Dotes_extra": 0,
  "Fortaleza": 0,
  "Id_dado": 0,
  "Id_tipo_criatura": 0,
  "Multiplicador_puntos_habilidad": 0,
  "Puntos_habilidad": 0,
  "Reflejos": 0,
  "Tipo_criatura": "Cualquiera",
  "Voluntad": 0
 },
 "Dotes_adicionales": 1,
 "Edad_inicial_caras_1": 4,
 "Edad_inicial_caras_2": 6,
 "Edad_inicial_caras_3": 6,
 "Edad_inicial_dados_1": 1,
 "Edad_inicial_dados_2": 1,
 "Edad_inicial_dados_3": 2,
 "Edad_maxima_caras": 20,
 "Edad_maxima_dados": 2,
 "Habilidades": {
  "Base": [],
  "Custom": []
 },
 "Id_clase_predilecta": 0,
 "Idiomas": [
  {
   "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
   "Id": 1,
   "Nombre": "Común",
   "Oficial": true,
   "Secreto": false
  }
 ],
 "Idiomas_adicionales": [],
 "Idiomas_adicionales_cualquiera": true,
 "Lanzamiento": null,
 "Manual": {
  "Id": 54,
  "Nombre": "Manual del jugador 1",
  "Pagina": 12
 },
 "Mutada": false,
 "Nombre_original": null,
 "Pasos_edad": [],
 "Plantillas_por_subtipo": [],
 "Puntos_habilidad_extra_por_nivel": 1,
 "Puntos_habilidad_extra_primer_nivel": 4,
 "Traducido": false,
 "Vd": null,
 "Vd_mod_clases_pj": null,
 "Vd_mod_clases_pnj": null,
 "aju": "0",
 "alc": "5",
 "ali": {},
 "an": null,
 "ant": "0",
 "ari": "1.40",
 "ars": "1.98",
 "c": "Cualquiera",
 "co": "30",
 "dg": {
  "Ataque_base": 0,
  "Cantidad": 0,
  "Dado": "",
  "Dotes_extra": 0,
  "Multiplicador_puntos_habilidad": 0,
  "Puntos_habilidad": 0,
  "Tipo_criatura": ""
 },
 "dotes": [],
 "ea": "15",
 "em": "35",
 "esp": "5",
 "ev": "53",
 "eve": "70",
 "ex": "0",
 "i": "25",
 "m": {
  "Carisma": "0",
  "Constitucion": "0",
  "Destreza": "0",
  "Fuerza": "0",
  "Inteligencia": "0",
  "Sabiduria": "0"
 },
 "ma": "Manual del jugador 1, Página: 12",
 "man": null,
 "n": "Humano",
 "na": "0",
 "o": true,
 "pr": {},
 "pri": "40.37",
 "prs": "127.01",
 "rac": [],
 "rc": null,
 "rd": null,
 "re": null,
 "sor": [],
 "subtipos": [
  {
   "Id": 67,
   "Nombre": "Humano"
  }
 ],
 "t": {
  "Id": 5,
  "Modificador": 0,
  "Modificador_esconderse": 0,
  "Modificador_presa": 0,
  "Nombre": "Mediano"
 },
 "tc": {
  "Come": true,
  "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
  "Duerme": true,
  "Id": "11",
  "Id_alineamiento": "2",
  "Id_ataque": "2",
  "Id_fortaleza": "1",
  "Id_puntos_habilidad": "1",
  "Id_reflejos": "1",
  "Id_tipo_dado": "3",
  "Id_voluntad": "1",
  "Limite_inteligencia": "-1",
  "Manual": "Manual de monstruos 1, Página: 316",
  "Nombre": "Humanoide",
  "Oficial": true,
  "Pierde_constitucion": false,
  "Puede_ser_flanqueado": false,
  "Puntos_habilidad": 2,
  "Rasgos": [],
  "Recibe_críticos": false,
  "Respira": true,
  "Tesoro": null,
  "Tipo_dado": "d8",
  "Tipo_dado_comodin": null
 },
 "tr": "0",
 "va": "0",
 "vo": "0"
};

export const PROLE_SOBRE_HUMANO_API: any = {
 "Armas_naturales": [],
 "Cambios_mutacion": [
  {
   "Campo": "Modificadores",
   "Elementos": [],
   "Frase": "Ajustes de característica: lo de la mutación sumado a lo de ",
   "Nombre": "Ajustes de característica",
   "Operacion": "sumar",
   "Valor": null
  },
  {
   "Campo": "Ajuste_nivel",
   "Elementos": [],
   "Frase": "Ajuste de nivel: lo de la raza base",
   "Nombre": "Ajuste de nivel",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Tamano",
   "Elementos": [],
   "Frase": "Tamaño: lo de la raza base",
   "Nombre": "Tamaño",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Tipo_criatura",
   "Elementos": [],
   "Frase": "Tipo de criatura: lo de la raza base",
   "Nombre": "Tipo de criatura",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Clase_predilecta",
   "Elementos": [],
   "Frase": "Clase predilecta: lo de las dos",
   "Nombre": "Clase predilecta",
   "Operacion": "unir",
   "Valor": null
  },
  {
   "Campo": "Dgs_adicionales",
   "Elementos": [],
   "Frase": "DG raciales: lo de la raza base",
   "Nombre": "DG raciales",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Armadura_natural",
   "Elementos": [],
   "Frase": "Armadura natural: lo de la mutación, aunque no tenga",
   "Nombre": "Armadura natural",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Varios_armadura",
   "Elementos": [],
   "Frase": "Otros bonificadores a la CA: lo de la mutación, aunque no te",
   "Nombre": "Otros bonificadores a la CA",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Correr",
   "Elementos": [],
   "Frase": "Velocidad: lo de la raza base",
   "Nombre": "Velocidad",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Nadar",
   "Elementos": [],
   "Frase": "Velocidad de nado: lo de la raza base",
   "Nombre": "Velocidad de nado",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Volar",
   "Elementos": [],
   "Frase": "Velocidad de vuelo: lo de la raza base",
   "Nombre": "Velocidad de vuelo",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Maniobrabilidad",
   "Elementos": [],
   "Frase": "Maniobrabilidad: lo de la raza base",
   "Nombre": "Maniobrabilidad",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Trepar",
   "Elementos": [],
   "Frase": "Velocidad de trepar: lo de la raza base",
   "Nombre": "Velocidad de trepar",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Excavar",
   "Elementos": [],
   "Frase": "Velocidad de excavar: lo de la raza base",
   "Nombre": "Velocidad de excavar",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Espacio",
   "Elementos": [],
   "Frase": "Espacio: lo de la raza base",
   "Nombre": "Espacio",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Alcance",
   "Elementos": [],
   "Frase": "Alcance: lo de la raza base",
   "Nombre": "Alcance",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Ataques_naturales",
   "Elementos": [],
   "Frase": "Ataques naturales (descripción): lo de la mutación, aunque n",
   "Nombre": "Ataques naturales (descripción)",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Armas_naturales",
   "Elementos": [],
   "Frase": "Armas naturales: lo de la mutación, aunque no tenga",
   "Nombre": "Armas naturales",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Reduccion_dano",
   "Elementos": [],
   "Frase": "Reducción del daño: lo de la mutación, aunque no tenga",
   "Nombre": "Reducción del daño",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Resistencia_magica",
   "Elementos": [],
   "Frase": "Resistencia a conjuros: lo de la mutación, aunque no tenga",
   "Nombre": "Resistencia a conjuros",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Resistencia_energia",
   "Elementos": [],
   "Frase": "Resistencia a la energía: lo de la mutación, aunque no tenga",
   "Nombre": "Resistencia a la energía",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Altura_rango_inf",
   "Elementos": [],
   "Frase": "Altura mínima: lo de la raza base",
   "Nombre": "Altura mínima",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Altura_rango_sup",
   "Elementos": [],
   "Frase": "Altura máxima: lo de la raza base",
   "Nombre": "Altura máxima",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Peso_rango_inf",
   "Elementos": [],
   "Frase": "Peso mínimo: lo de la raza base",
   "Nombre": "Peso mínimo",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Peso_rango_sup",
   "Elementos": [],
   "Frase": "Peso máximo: lo de la raza base",
   "Nombre": "Peso máximo",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Dotes_adicionales",
   "Elementos": [],
   "Frase": "Dotes adicionales: lo de la mutación, aunque no tenga",
   "Nombre": "Dotes adicionales",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Puntos_habilidad_extra_primer_nivel",
   "Elementos": [],
   "Frase": "Puntos de habilidad extra a 1.er nivel: lo de la mutación, a",
   "Nombre": "Puntos de habilidad extra a 1.er nivel",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Puntos_habilidad_extra_por_nivel",
   "Elementos": [],
   "Frase": "Puntos de habilidad extra por nivel: lo de la mutación, aunq",
   "Nombre": "Puntos de habilidad extra por nivel",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Raciales",
   "Elementos": [],
   "Frase": "Rasgos raciales: lo de la mutación, aunque no tenga",
   "Nombre": "Rasgos raciales",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Sortilegas",
   "Elementos": [],
   "Frase": "Aptitudes sortílegas: lo de la mutación, aunque no tenga",
   "Nombre": "Aptitudes sortílegas",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Dotes",
   "Elementos": [],
   "Frase": "Dotes raciales: lo de la mutación, aunque no tenga",
   "Nombre": "Dotes raciales",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Idiomas_adicionales",
   "Elementos": [],
   "Frase": "Idiomas adicionales: lo de la raza base",
   "Nombre": "Idiomas adicionales",
   "Operacion": "heredar",
   "Valor": null
  },
  {
   "Campo": "Habilidades",
   "Elementos": [],
   "Frase": "Bonificadores raciales de habilidad: lo de la mutación, aunq",
   "Nombre": "Bonificadores raciales de habilidad",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Competencias",
   "Elementos": [],
   "Frase": "Competencias: lo de la mutación, aunque no tenga",
   "Nombre": "Competencias",
   "Operacion": "sustituir",
   "Valor": null
  },
  {
   "Campo": "Lanzamiento",
   "Elementos": [],
   "Frase": "Lanzamiento racial: lo de la mutación, aunque no tenga",
   "Nombre": "Lanzamiento racial",
   "Operacion": "sustituir",
   "Valor": null
  }
 ],
 "Categorias_edad": [],
 "Clase_de_monstruo": null,
 "Clase_predilecta": {
  "Id": 0,
  "Nombre": "Cualquiera"
 },
 "Clase_predilecta_comodin": "cualquiera",
 "Clases_asociadas": [],
 "Clases_multiclase_libre": [
  {
   "Id": 11,
   "Nombre": "Paladín"
  }
 ],
 "Clases_predilectas_extra": [
  {
   "Id": 7,
   "Nombre": "Guerrero"
  }
 ],
 "Comodin": null,
 "Competencias": {
  "Armaduras": [],
  "Armas": [],
  "Grupos_arma": [],
  "Grupos_armadura": []
 },
 "Cuadrupedo": false,
 "Descripcion": "Humanoide de otra raza que respondió a la llamada de Bahamut",
 "Dgs_raciales": {
  "Ataque_base": 0,
  "Cantidad": 0,
  "Dado": "elegir",
  "Dado_comodin": "elegir",
  "Dotes_extra": 0,
  "Fortaleza": 0,
  "Id_dado": 0,
  "Id_tipo_criatura": 0,
  "Multiplicador_puntos_habilidad": 0,
  "Puntos_habilidad": 0,
  "Reflejos": 0,
  "Tipo_criatura": "Cualquiera",
  "Voluntad": 0
 },
 "Dotes_adicionales": 0,
 "Edad_inicial_caras_1": 4,
 "Edad_inicial_caras_2": 6,
 "Edad_inicial_caras_3": 6,
 "Edad_inicial_dados_1": 1,
 "Edad_inicial_dados_2": 1,
 "Edad_inicial_dados_3": 2,
 "Edad_maxima_caras": 100,
 "Edad_maxima_dados": 2,
 "Habilidades": {
  "Base": [],
  "Custom": []
 },
 "Id_clase_predilecta": 0,
 "Idiomas": [
  {
   "Descripcion": "Idioma de los humanos, es conocido por la mayoría de razas",
   "Id": 1,
   "Nombre": "Común",
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
 "Idiomas_adicionales": [],
 "Idiomas_adicionales_cualquiera": true,
 "Lanzamiento": null,
 "Manual": {
  "Id": 34,
  "Nombre": "Razas del dragón",
  "Pagina": 8
 },
 "Mutada": true,
 "Nombre_original": "Dragonborn of Bahamut",
 "Pasos_edad": [],
 "Plantillas_por_subtipo": [],
 "Puntos_habilidad_extra_por_nivel": 0,
 "Puntos_habilidad_extra_primer_nivel": 0,
 "Traducido": true,
 "Vd": null,
 "Vd_mod_clases_pj": null,
 "Vd_mod_clases_pnj": null,
 "aju": 0,
 "alc": 5,
 "ali": {},
 "an": null,
 "ant": 0,
 "ari": 1.4,
 "ars": 1.98,
 "c": "Cualquiera",
 "co": 30,
 "dg": {
  "Ataque_base": 0,
  "Cantidad": 0,
  "Dado": "",
  "Dotes_extra": 0,
  "Multiplicador_puntos_habilidad": 0,
  "Puntos_habilidad": 0,
  "Tipo_criatura": ""
 },
 "dotes": [],
 "ea": 15,
 "em": 200,
 "esp": 5,
 "ev": 300,
 "eve": 400,
 "ex": 0,
 "i": 21,
 "m": {
  "Carisma": 0,
  "Constitucion": 2,
  "Destreza": -2,
  "Fuerza": 0,
  "Inteligencia": 0,
  "Sabiduria": 0
 },
 "ma": "Razas del dragón, Página: 8",
 "man": null,
 "n": "Prole de Bahamut",
 "na": 0,
 "o": true,
 "pr": {
  "actitud_prohibido": [
   {
    "Cantidad": null,
    "Frase": "Cualquier alineamiento no maligno",
    "Id": 10,
    "Id_referencia": 5,
    "Opcional": 0,
    "Referencia": "Maligno",
    "Sujeto": "personaje",
    "Texto": null,
    "Tipo": "actitud_prohibido"
   }
  ],
  "caracteristica": [
   {
    "Cantidad": 3,
    "Frase": "Inteligencia 3",
    "Id": 11,
    "Id_referencia": 4,
    "Opcional": 0,
    "Referencia": "Inteligencia",
    "Sujeto": "personaje",
    "Texto": null,
    "Tipo": "caracteristica"
   }
  ],
  "tipo_criatura": [
   {
    "Cantidad": null,
    "Frase": "Criatura de tipo humanoide",
    "Id": 1,
    "Id_referencia": 11,
    "Opcional": 0,
    "Referencia": "Humanoide",
    "Sujeto": "raza_base",
    "Texto": null,
    "Tipo": "tipo_criatura"
   }
  ]
 },
 "pri": 40.37,
 "prs": 127.01,
 "rac": [
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "Aptitud sobrenatural. Arma de aliento en línea de 5' por DG ",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 34,
   "Nombre": "Aspecto dracónico (corazón)",
   "Oficial": true,
   "Opcional": 1,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [
    {
     "Desde": 1,
     "Frase": "A 1 DG: pasa a 1d8.",
     "Gana": null,
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": "1d8",
     "Velocidad": null
    },
    {
     "Desde": 3,
     "Frase": "A los 3 DG: pasa a 2d8.",
     "Gana": null,
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": "2d8",
     "Velocidad": null
    },
    {
     "Desde": 6,
     "Frase": "A los 6 DG: pasa a 3d8.",
     "Gana": null,
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": "3d8",
     "Velocidad": null
    },
    {
     "Desde": 9,
     "Frase": "A los 9 DG: pasa a 4d8.",
     "Gana": null,
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": "4d8",
     "Velocidad": null
    },
    {
     "Desde": 12,
     "Frase": "A los 12 DG: pasa a 5d8.",
     "Gana": null,
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": "5d8",
     "Velocidad": null
    },
    {
     "Desde": 15,
     "Frase": "A los 15 DG: pasa a 6d8.",
     "Gana": null,
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": "6d8",
     "Velocidad": null
    },
    {
     "Desde": 18,
     "Frase": "A los 18 DG: pasa a 7d8.",
     "Gana": null,
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": "7d8",
     "Velocidad": null
    }
   ],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "Aptitud extraordinaria. Inmunidad a la parálisis y al sueño ",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [
     {
      "Caracteristica": "Sabiduría",
      "Condicion": null,
      "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
      "Entrenada": false,
      "Extra": null,
      "Extra_comodin": null,
      "Habilidad": "Avistar",
      "Id_caracteristica": 5,
      "Id_extra": null,
      "Id_habilidad": 6,
      "Rangos": 2,
      "Se_considera_clasea": false,
      "Soporta_extra": false
     },
     {
      "Caracteristica": "Inteligencia",
      "Condicion": null,
      "Descripcion": "Puedes encontrar puertas secretas, trampas sencillas, compar",
      "Entrenada": false,
      "Extra": null,
      "Extra_comodin": null,
      "Habilidad": "Buscar",
      "Id_caracteristica": 4,
      "Id_extra": null,
      "Id_habilidad": 7,
      "Rangos": 2,
      "Se_considera_clasea": false,
      "Soporta_extra": false
     },
     {
      "Caracteristica": "Sabiduría",
      "Condicion": null,
      "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
      "Entrenada": false,
      "Extra": null,
      "Extra_comodin": null,
      "Habilidad": "Escuchar",
      "Id_caracteristica": 5,
      "Id_extra": null,
      "Id_habilidad": 17,
      "Rangos": 2,
      "Se_considera_clasea": false,
      "Soporta_extra": false
     }
    ],
    "Custom": []
   },
   "Id": 38,
   "Nombre": "Aspecto dracónico (mente)",
   "Oficial": true,
   "Opcional": 1,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [
    {
     "Desde": 1,
     "Frase": "A 1 DG: gana Visión en la penumbra.",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "Puedes ver el doble de bien que las razas que no ven en la p",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 18,
      "Nombre": "Visión en la penumbra",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": null
    },
    {
     "Desde": 1,
     "Frase": "A 1 DG: gana Visión en la oscuridad 30'.",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "Ve en la oscuridad total hasta 30'. La visión en la oscurida",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 4947,
      "Nombre": "Visión en la oscuridad 30'",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": null
    },
    {
     "Desde": 6,
     "Frase": "A los 6 DG: gana Visión en la oscuridad 60' en lugar de Visi",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "La visión en la oscuridad solo te permite ver en blanco y ne",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 8,
      "Nombre": "Visión en la oscuridad 60'",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": {
      "Id": 4947,
      "Nombre": "Visión en la oscuridad 30'"
     },
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": null
    },
    {
     "Desde": 9,
     "Frase": "A los 9 DG: gana Visión en la oscuridad 90' en lugar de Visi",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "Ve en la oscuridad total hasta 90'. La visión en la oscurida",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 4948,
      "Nombre": "Visión en la oscuridad 90'",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": {
      "Id": 8,
      "Nombre": "Visión en la oscuridad 60'"
     },
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": null
    },
    {
     "Desde": 9,
     "Frase": "A los 9 DG: gana Visión en la penumbra triple en lugar de Vi",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "Ve tres veces más lejos que un humano a la luz de las estrel",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 4950,
      "Nombre": "Visión en la penumbra triple",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": {
      "Id": 18,
      "Nombre": "Visión en la penumbra"
     },
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": null
    },
    {
     "Desde": 12,
     "Frase": "A los 12 DG: gana Visión en la oscuridad 120' en lugar de Vi",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "La visión en la oscuridad solo te permite ver en blanco y ne",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 81,
      "Nombre": "Visión en la oscuridad 120'",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": {
      "Id": 4948,
      "Nombre": "Visión en la oscuridad 90'"
     },
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": null
    },
    {
     "Desde": 12,
     "Frase": "A los 12 DG: gana Visión en la penumbra cuádruple en lugar d",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "Ve cuatro veces más lejos que un humano a la luz de las estr",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 4949,
      "Nombre": "Visión en la penumbra cuádruple",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": {
      "Id": 4950,
      "Nombre": "Visión en la penumbra triple"
     },
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": null
    },
    {
     "Desde": 15,
     "Frase": "A los 15 DG: gana Sentido ciego 30'.",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "Aptitud extraordinaria. Percibe y localiza a las criaturas a",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 4944,
      "Nombre": "Sentido ciego 30'",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": null
    }
   ],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "Aptitud extraordinaria. +10 racial a Saltar y la capacidad d",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [
     {
      "Caracteristica": "Fuerza",
      "Condicion": null,
      "Descripcion": "Utiliza esta habilidad para saltar por encima de un pozo, un",
      "Entrenada": false,
      "Extra": null,
      "Extra_comodin": null,
      "Habilidad": "Saltar",
      "Id_caracteristica": 1,
      "Id_extra": null,
      "Id_habilidad": 37,
      "Rangos": 10,
      "Se_considera_clasea": false,
      "Soporta_extra": false
     }
    ],
    "Custom": []
   },
   "Id": 41,
   "Nombre": "Aspecto dracónico (alas)",
   "Oficial": true,
   "Opcional": 1,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [
    {
     "Desde": 6,
     "Frase": "A los 6 DG: gana Vuelo (aspecto dracónico de las alas); velo",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "Aptitud extraordinaria. Desde los 6 DG, la prole de Bahamut ",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 4951,
      "Nombre": "Vuelo (aspecto dracónico de las alas)",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": {
      "Maniobrabilidad": {
       "Id": 3,
       "Nombre": "Regular"
      },
      "Pies": 30,
      "Tipo": "Volar"
     }
    },
    {
     "Desde": 12,
     "Frase": "A los 12 DG: gana Vuelo incansable (aspecto dracónico de las",
     "Gana": {
      "Ataques": [],
      "Bonificadores_condicionales": [],
      "Caracteristica_cd": null,
      "Caracteristicas": [],
      "Descripcion": "Aptitud extraordinaria. Desde los 12 DG, la prole de Bahamut",
      "Dotes": [],
      "Esencia": {
       "Habilidades_por_fusiones": [],
       "Receptaculo": false,
       "Reserva": 0
      },
      "Habilidades": {
       "Base": [],
       "Custom": []
      },
      "Id": 4952,
      "Nombre": "Vuelo incansable (aspecto dracónico de las alas)",
      "Oficial": true,
      "Prerrequisitos": {
       "caracteristica": [],
       "raza": []
      },
      "Prerrequisitos_flags": {
       "caracteristica_minima": false,
       "raza": false
      },
      "Progresion": [],
      "Salvaciones": [],
      "Sortilegas": []
     },
     "Medida": "dg",
     "Sustituye": null,
     "Tipo_dote": null,
     "Valor": null,
     "Velocidad": null
    }
   ],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "Inmune a la presencia pavorosa de los dragones, como si fuer",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 168,
   "Nombre": "Inmunidad a la presencia pavorosa (prole de Bahamut)",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": true
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  },
  {
   "Ataques": [],
   "Bonificadores_condicionales": [
    {
     "Cantidad": 2,
     "Condicion": "Contra criaturas del tipo dragón",
     "Contra": [
      {
       "Catalogo": "tipo_criatura",
       "Id": 7,
       "Nombre": "Dragón"
      }
     ],
     "Frase": "CA +2 (esquiva) contra criaturas del tipo dragón",
     "Id": 28,
     "Objetivo": {
      "Id": 1,
      "Nombre": "CA"
     },
     "Tipo_bonificador": {
      "Id": 8,
      "Nombre": "Esquiva"
     }
    }
   ],
   "Caracteristica_cd": null,
   "Caracteristicas": [],
   "Descripcion": "+2 de esquiva a la CA contra criaturas del tipo dragón; se p",
   "Dotes": [],
   "Esencia": {
    "Habilidades_por_fusiones": [],
    "Receptaculo": false,
    "Reserva": 0
   },
   "Habilidades": {
    "Base": [],
    "Custom": []
   },
   "Id": 4745,
   "Nombre": "Esquiva contra dragones (prole de Bahamut)",
   "Oficial": true,
   "Opcional": 0,
   "Prerrequisitos": {
    "caracteristica": [],
    "raza": []
   },
   "Prerrequisitos_flags": {
    "caracteristica_minima": false,
    "raza": false
   },
   "Progresion": [],
   "Salvaciones": [],
   "Sortilegas": []
  }
 ],
 "rc": null,
 "rd": null,
 "re": null,
 "sor": [],
 "subtipos": [
  {
   "Id": 67,
   "Nombre": "Humano"
  },
  {
   "Id": 3,
   "Nombre": "Sangre de dragón"
  }
 ],
 "t": {
  "Id": 5,
  "Modificador": 0,
  "Modificador_esconderse": 0,
  "Modificador_presa": 0,
  "Nombre": "Mediano"
 },
 "tc": {
  "Come": true,
  "Descripcion": "Un humanoide suele tener dos brazos, dos piernas y una cabez",
  "Duerme": true,
  "Id": 11,
  "Id_alineamiento": 2,
  "Id_ataque": 2,
  "Id_fortaleza": 1,
  "Id_puntos_habilidad": 1,
  "Id_reflejos": 1,
  "Id_tipo_dado": 3,
  "Id_voluntad": 1,
  "Limite_inteligencia": -1,
  "Manual": "Manual de monstruos 1, Página: 316",
  "Nombre": "Humanoide",
  "Oficial": true,
  "Pierde_constitucion": false,
  "Puede_ser_flanqueado": false,
  "Puntos_habilidad": 2,
  "Rasgos": [],
  "Recibe_críticos": false,
  "Respira": true,
  "Tesoro": null,
  "Tipo_dado": "d8",
  "Tipo_dado_comodin": null
 },
 "tr": 0,
 "va": 0,
 "vo": 0
};

export const HABILIDADES_API: any = [
 {
  "Caracteristica": "Inteligencia",
  "Comodin": null,
  "Descripcion": "Estás cualificado en una disciplina de artes y oficios o una",
  "Entrenada": false,
  "Extras": [
   {
    "Descripcion": "",
    "Extra": "Alfarería",
    "Extra_comodin": null,
    "Id_extra": 1
   },
   {
    "Descripcion": "",
    "Extra": "Alquimia",
    "Extra_comodin": null,
    "Id_extra": 2
   },
   {
    "Descripcion": "",
    "Extra": "Armería",
    "Extra_comodin": null,
    "Id_extra": 3
   },
   {
    "Descripcion": "",
    "Extra": "Caligrafía",
    "Extra_comodin": null,
    "Id_extra": 4
   },
   {
    "Descripcion": "",
    "Extra": "Carpintería",
    "Extra_comodin": null,
    "Id_extra": 5
   },
   {
    "Descripcion": "",
    "Extra": "Cerrajería",
    "Extra_comodin": null,
    "Id_extra": 6
   },
   {
    "Descripcion": "",
    "Extra": "Cestería",
    "Extra_comodin": null,
    "Id_extra": 7
   },
   {
    "Descripcion": "",
    "Extra": "Construcción naval",
    "Extra_comodin": null,
    "Id_extra": 8
   },
   {
    "Descripcion": "",
    "Extra": "Costura",
    "Extra_comodin": null,
    "Id_extra": 9
   },
   {
    "Descripcion": "",
    "Extra": "Curtido",
    "Extra_comodin": null,
    "Id_extra": 10
   },
   {
    "Descripcion": "",
    "Extra": "Encuadernación",
    "Extra_comodin": null,
    "Id_extra": 11
   },
   {
    "Descripcion": "",
    "Extra": "Escultura",
    "Extra_comodin": null,
    "Id_extra": 12
   },
   {
    "Descripcion": "",
    "Extra": "Fabricación de trampas",
    "Extra_comodin": null,
    "Id_extra": 13
   },
   {
    "Descripcion": "",
    "Extra": "Herrería",
    "Extra_comodin": null,
    "Id_extra": 14
   },
   {
    "Descripcion": "",
    "Extra": "Mampostería",
    "Extra_comodin": null,
    "Id_extra": 15
   },
   {
    "Descripcion": "",
    "Extra": "Pintura",
    "Extra_comodin": null,
    "Id_extra": 16
   },
   {
    "Descripcion": "",
    "Extra": "Talla de gemas",
    "Extra_comodin": null,
    "Id_extra": 17
   },
   {
    "Descripcion": "",
    "Extra": "Zapatería",
    "Extra_comodin": null,
    "Id_extra": 18
   }
  ],
  "Id_caracteristica": 4,
  "Id_habilidad": 2,
  "Modificador_tamano": false,
  "Nombre": "Artesanía 1",
  "Penalizador_armadura": 0,
  "Sinergias": [
   {
    "Bonificador": 2,
    "Condicion": "Con objetos de esa artesanía",
    "Habilidad_destino": "Tasación",
    "Habilidad_origen": "Artesanía",
    "Id_extra_destino": -1,
    "Id_extra_origen": -1,
    "Id_habilidad_destino": 40,
    "Id_habilidad_origen": 2,
    "Rangos_minimos": 5
   }
  ],
  "Soporta_extra": true
 },
 {
  "Caracteristica": "Sabiduría",
  "Comodin": null,
  "Descripcion": "Utiliza esta habilidad para detectar a unos bandidos embosca",
  "Entrenada": false,
  "Extras": [],
  "Id_caracteristica": 5,
  "Id_habilidad": 6,
  "Modificador_tamano": false,
  "Nombre": "Avistar",
  "Penalizador_armadura": 0,
  "Sinergias": [],
  "Soporta_extra": false
 },
 {
  "Caracteristica": "Inteligencia",
  "Comodin": null,
  "Descripcion": "Puedes encontrar puertas secretas, trampas sencillas, compar",
  "Entrenada": false,
  "Extras": [],
  "Id_caracteristica": 4,
  "Id_habilidad": 7,
  "Modificador_tamano": false,
  "Nombre": "Buscar",
  "Penalizador_armadura": 0,
  "Sinergias": [
   {
    "Bonificador": 2,
    "Condicion": "Para seguir rastros",
    "Habilidad_destino": "Supervivencia",
    "Habilidad_origen": "Buscar",
    "Id_extra_destino": -1,
    "Id_extra_origen": -1,
    "Id_habilidad_destino": 39,
    "Id_habilidad_origen": 7,
    "Rangos_minimos": 5
   }
  ],
  "Soporta_extra": false
 },
 {
  "Caracteristica": "Sabiduría",
  "Comodin": null,
  "Descripcion": "Utiliza esta habilidad para oír acercarse a enemigos, detect",
  "Entrenada": false,
  "Extras": [],
  "Id_caracteristica": 5,
  "Id_habilidad": 17,
  "Modificador_tamano": false,
  "Nombre": "Escuchar",
  "Penalizador_armadura": 0,
  "Sinergias": [],
  "Soporta_extra": false
 },
 {
  "Caracteristica": "Fuerza",
  "Comodin": null,
  "Descripcion": "Utiliza esta habilidad para saltar por encima de un pozo, un",
  "Entrenada": false,
  "Extras": [],
  "Id_caracteristica": 1,
  "Id_habilidad": 37,
  "Modificador_tamano": false,
  "Nombre": "Saltar",
  "Penalizador_armadura": 1,
  "Sinergias": [
   {
    "Bonificador": 2,
    "Condicion": null,
    "Habilidad_destino": "Piruetas",
    "Habilidad_origen": "Saltar",
    "Id_extra_destino": -1,
    "Id_extra_origen": -1,
    "Id_habilidad_destino": 30,
    "Id_habilidad_origen": 37,
    "Rangos_minimos": 5
   }
  ],
  "Soporta_extra": false
 },
 {
  "Caracteristica": "Inteligencia",
  "Comodin": null,
  "Descripcion": "Esta habilidad se utiliza para localizar una antigüedad en m",
  "Entrenada": false,
  "Extras": [],
  "Id_caracteristica": 4,
  "Id_habilidad": 40,
  "Modificador_tamano": false,
  "Nombre": "Tasación",
  "Penalizador_armadura": 0,
  "Sinergias": [],
  "Soporta_extra": false
 }
];
