/**
 * La ida y vuelta de «Modificar dote» y «Modificar conjuro» (hito 4 del roadmap de inserciones, 2026-10-31): respuestas
 * reales de `GET /dotes/<id>` y `GET /conjuros/<id>` de `rol_dev` y, para cada una, el cuerpo con el que `PUT` devolvió
 * el mismo GET (la comprobación del backend con todas las dotes y los conjuros, en transacciones deshechas). Las pruebas
 * de `nueva-dote` y `nueva-conjuro` comprueban que el formulario, cargado con el GET, manda ese mismo cuerpo.
 *
 * Generado desde la comprobación del backend; no se edita a mano.
 */
import type { IdaYVuelta } from './cuerpo-de-catalogo';

export const IDA_Y_VUELTA: { dotes: IdaYVuelta[]; conjuros: IdaYVuelta[]; } = {
 "conjuros": [
  {
   "cuerpo": {
    "componentes": [
     1,
     2,
     4
    ],
    "conjuro": {
     "arcano": false,
     "area": "",
     "descripcion": "Un brillante resplandor divino rodea a los receptores, protegiéndolos contra los ataques, concediéndoles resistencia a los conjuros lanzados por criaturas malignas y cegando a las criaturas de este alineamiento que alcancen a los receptores con sus ataques. Esta abjuración tiene cuatro efectos:\n\nEn primer lugar, las criaturas custodiadas obtienen un bonificador +4 de desvío a la CA y un bonificador +4 de resistencia en sus TS. Al contrario que sucede con *protección contra el mal*, este beneficio se aplica contra todos los ataques, no sólo contra los procedentes de criaturas malignas.\n\nEn segundo lugar, las criaturas custodiadas ganan RC 25 contra los conjuros malignos y los sortilegios ejecutados por criaturas malignas.\n\nEn tercer lugar, la abjuración bloquea la posesión y la influencia mental del mismo modo que *protección contra el mal*.\n\nPor último, las criaturas malignas que logren alcanzar con un ataque a un defensor custodiado por el conjuro quedan cegadas en el acto (Fortaleza niega, igual que *ceguera/sordera*, pero con la CD de salvación del *aura sagrada*).\n\nFoco: un pequeño relicario que contenga una reliquia sagrada, como un jirón de la túnica de un santo o un fragmento de pergamino de un texto sagrado. El relicario costará 500 po como mínimo.",
     "descripcion_componentes": "",
     "divino": true,
     "duracion": "1 asalto/nivel (D)",
     "efecto": "",
     "id_alcance": 7,
     "id_escuela": 1,
     "id_manual": 54,
     "id_tiempo_lanz": 1,
     "nombre": "Aura sagrada",
     "objetivo": "Una criatura/nivel en una explosión de 20' de radio, centrada en ti",
     "oficial": true,
     "pagina": 204,
     "permanente": false,
     "resistencia_conjuros": true,
     "tipo_salvacion": "Ver texto",
     "variante": "base"
    },
    "descriptores": [
     14
    ],
    "niveles_clase": [
     {
      "espontaneo": false,
      "id_clase": 4,
      "nivel": 8
     },
     {
      "espontaneo": false,
      "id_clase": 240,
      "nivel": 8
     },
     {
      "espontaneo": false,
      "id_clase": 256,
      "nivel": 8
     }
    ],
    "niveles_dominio": [
     {
      "espontaneo": false,
      "id_dominio": 5,
      "nivel": 8
     },
     {
      "espontaneo": false,
      "id_dominio": 78,
      "nivel": 8
     },
     {
      "espontaneo": false,
      "id_dominio": 160,
      "nivel": 8
     }
    ]
   },
   "get": {
    "Alcance": "20",
    "Arcano": false,
    "Area": "",
    "Comodin": null,
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
      "Componente": "Foco",
      "Id_componente": "4"
     }
    ],
    "Coste_material": null,
    "Coste_px": null,
    "Descripcion": "Un brillante resplandor divino rodea a los receptores, protegiéndolos contra los ataques, concediéndoles resistencia a los conjuros lanzados por criaturas malignas y cegando a las criaturas de este alineamiento que alcancen a los receptores con sus ataques. Esta abjuración tiene cuatro efectos:\n\nEn primer lugar, las criaturas custodiadas obtienen un bonificador +4 de desvío a la CA y un bonificador +4 de resistencia en sus TS. Al contrario que sucede con *protección contra el mal*, este beneficio se aplica contra todos los ataques, no sólo contra los procedentes de criaturas malignas.\n\nEn segundo lugar, las criaturas custodiadas ganan RC 25 contra los conjuros malignos y los sortilegios ejecutados por criaturas malignas.\n\nEn tercer lugar, la abjuración bloquea la posesión y la influencia mental del mismo modo que *protección contra el mal*.\n\nPor último, las criaturas malignas que logren alcanzar con un ataque a un defensor custodiado por el conjuro quedan cegadas en el acto (Fortaleza niega, igual que *ceguera/sordera*, pero con la CD de salvación del *aura sagrada*).\n\nFoco: un pequeño relicario que contenga una reliquia sagrada, como un jirón de la túnica de un santo o un fragmento de pergamino de un texto sagrado. El relicario costará 500 po como mínimo.",
    "Descripcion_aumentos": "",
    "Descripcion_componentes": "",
    "Descriptores": [
     {
      "Id": "14",
      "Nombre": "Bueno"
     }
    ],
    "Disciplina": null,
    "Divino": true,
    "Duracion": "1 asalto/nivel (D)",
    "Efecto": "",
    "Escuela": {
     "Especializable": true,
     "Id": "1",
     "Nombre": "Abjuración",
     "Nombre_esp": "Abjurador",
     "Oficial": true,
     "Prohibible": true,
     "Prohibidas_al_especializarse": 2
    },
    "Id": "2",
    "Id_alcance": 7,
    "Id_manual": 54,
    "Id_subdisciplina": 0,
    "Id_tiempo_lanzamiento": 1,
    "Manual": "Manual del jugador 1, Página: 204",
    "Niveles_clase": [
     {
      "Clase": "clérigo",
      "Espontaneo": "0",
      "Id_clase": "4",
      "Nivel": "8"
     },
     {
      "Clase": "Alma predilecta",
      "Espontaneo": "0",
      "Id_clase": "240",
      "Nivel": "8"
     },
     {
      "Clase": "Protosacerdote",
      "Espontaneo": "0",
      "Id_clase": "256",
      "Nivel": "8"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [
     {
      "Dominio": "Bien",
      "Espontaneo": "0",
      "Id_dominio": "5",
      "Nivel": "8"
     },
     {
      "Dominio": "Misticismo",
      "Espontaneo": "0",
      "Id_dominio": "78",
      "Nivel": "8"
     },
     {
      "Dominio": "Elíseo",
      "Espontaneo": "0",
      "Id_dominio": "160",
      "Nivel": "8"
     }
    ],
    "Nombre": "Aura sagrada",
    "Objetivo": "Una criatura/nivel en una explosión de 20' de radio, centrada en ti",
    "Oficial": true,
    "Pagina": 204,
    "Permanente": false,
    "Psionico": false,
    "Puntos_poder": "0",
    "Resistencia_conjuros": true,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "1 acción estándar",
    "Tipo_salvacion": "Ver texto"
   },
   "id": 2,
   "nombre": "Aura sagrada"
  },
  {
   "cuerpo": {
    "componentes": [
     9
    ],
    "conjuro": {
     "area": "No especifica",
     "descripcion": "Una ráfaga de poder mental empuja 5' hacia atrás al enemigo tocado, si hay sitio detrás. **Como trampa:** puede dejarse en un objeto con la misma acción y el mismo coste; queda oculta hasta 1 día y salta cuando alguien toca el objeto. Señal del cazador brujo: poder psiónico de nivel 1, acción rápida, como mucho una señal por asalto y 1 PP más el aumento (nunca más PP que su nivel de manifestador).",
     "descripcion_aumentos": "+1 a la CD por cada PP; +5' de empuje por cada 2 PP; con 5 PP o más de aumento, además queda derribado.",
     "descripcion_componentes": "Se escuchará como una fuerte ráfaga de viento que emana de tu mano.",
     "duracion": "Instantánea",
     "efecto": "No especifica",
     "id_alcance": 5,
     "id_disciplina": 3,
     "id_manual": 65,
     "id_subdisciplina": 0,
     "id_tiempo_lanz": 11,
     "nombre": "Aard",
     "objetivo": "Un enemigo (ataque de toque cuerpo a cuerpo)",
     "oficial": false,
     "pagina": 61,
     "permanente": false,
     "puntos_poder": 1,
     "resistencia_poderes": false,
     "tipo_salvacion": "Fortaleza niega (CD 10 + 1 + mod. Int, más el aumento)",
     "variante": "psionico"
    },
    "descriptores": [],
    "niveles_clase": [
     {
      "espontaneo": false,
      "id_clase": 13,
      "nivel": 1
     }
    ],
    "niveles_disciplina": []
   },
   "get": {
    "Alcance": "Toque",
    "Arcano": false,
    "Area": null,
    "Comodin": null,
    "Componentes": [
     {
      "Componente": "Auditivo",
      "Id_componente": "9"
     }
    ],
    "Coste_material": null,
    "Coste_px": null,
    "Descripcion": "Una ráfaga de poder mental empuja 5' hacia atrás al enemigo tocado, si hay sitio detrás. **Como trampa:** puede dejarse en un objeto con la misma acción y el mismo coste; queda oculta hasta 1 día y salta cuando alguien toca el objeto. Señal del cazador brujo: poder psiónico de nivel 1, acción rápida, como mucho una señal por asalto y 1 PP más el aumento (nunca más PP que su nivel de manifestador).",
    "Descripcion_aumentos": "+1 a la CD por cada PP; +5' de empuje por cada 2 PP; con 5 PP o más de aumento, además queda derribado.",
    "Descripcion_componentes": "Se escuchará como una fuerte ráfaga de viento que emana de tu mano.",
    "Descriptores": [],
    "Disciplina": {
     "Id": "3",
     "Nombre": "Psicosinesis",
     "Nombre_esp": "Cineticista",
     "Subdisciplinas": []
    },
    "Divino": false,
    "Duracion": "Instantánea",
    "Efecto": null,
    "Escuela": null,
    "Id": "46",
    "Id_alcance": 5,
    "Id_manual": 65,
    "Id_subdisciplina": 0,
    "Id_tiempo_lanzamiento": 11,
    "Manual": "Rol mapa mundi, Página: 61",
    "Niveles_clase": [
     {
      "Clase": "Cazador brujo",
      "Espontaneo": "0",
      "Id_clase": "13",
      "Nivel": "1"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [],
    "Nombre": "Aard",
    "Objetivo": "Un enemigo (ataque de toque cuerpo a cuerpo)",
    "Oficial": false,
    "Pagina": 61,
    "Permanente": false,
    "Psionico": true,
    "Puntos_poder": "1",
    "Resistencia_conjuros": false,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "Acción rápida",
    "Tipo_salvacion": "Fortaleza niega (CD 10 + 1 + mod. Int, más el aumento)"
   },
   "id": 46,
   "nombre": "Aard"
  },
  {
   "cuerpo": {
    "componentes": [
     11,
     12
    ],
    "conjuro": {
     "area": "Cono de 10'",
     "descripcion": "Un chorro de ascuas sale de su mano: 1d4 de daño de fuego a cada criatura del cono, y prende lo inflamable. **Como trampa:** puede dejarse en un objeto con la misma acción y el mismo coste; queda oculta hasta 1 día y salta cuando alguien toca el objeto. Señal del cazador brujo: poder psiónico de nivel 1, acción rápida, como mucho una señal por asalto y 1 PP más el aumento (nunca más PP que su nivel de manifestador).",
     "descripcion_aumentos": "+1d4 de daño por cada PP; +1 a la CD por cada 2 PP; con 20 PP o más de aumento, los dados pasan a d6.",
     "descripcion_componentes": "Se percibe claramente olor a quemado y las ascuas que emanan de la mano.",
     "duracion": "Instantánea",
     "efecto": "No especifica",
     "id_alcance": 6,
     "id_disciplina": 2,
     "id_manual": 65,
     "id_subdisciplina": 2,
     "id_tiempo_lanz": 11,
     "nombre": "Igni",
     "objetivo": "No especifica",
     "oficial": false,
     "pagina": 61,
     "permanente": false,
     "puntos_poder": 1,
     "resistencia_poderes": false,
     "tipo_salvacion": "Reflejos niega (CD 10 + 1 + mod. Int, más el aumento)",
     "variante": "psionico"
    },
    "descriptores": [
     16
    ],
    "niveles_clase": [
     {
      "espontaneo": false,
      "id_clase": 13,
      "nivel": 1
     }
    ],
    "niveles_disciplina": []
   },
   "get": {
    "Alcance": "10",
    "Arcano": false,
    "Area": "Cono de 10'",
    "Comodin": null,
    "Componentes": [
     {
      "Componente": "Olfavito",
      "Id_componente": "11"
     },
     {
      "Componente": "Visual",
      "Id_componente": "12"
     }
    ],
    "Coste_material": null,
    "Coste_px": null,
    "Descripcion": "Un chorro de ascuas sale de su mano: 1d4 de daño de fuego a cada criatura del cono, y prende lo inflamable. **Como trampa:** puede dejarse en un objeto con la misma acción y el mismo coste; queda oculta hasta 1 día y salta cuando alguien toca el objeto. Señal del cazador brujo: poder psiónico de nivel 1, acción rápida, como mucho una señal por asalto y 1 PP más el aumento (nunca más PP que su nivel de manifestador).",
    "Descripcion_aumentos": "+1d4 de daño por cada PP; +1 a la CD por cada 2 PP; con 20 PP o más de aumento, los dados pasan a d6.",
    "Descripcion_componentes": "Se percibe claramente olor a quemado y las ascuas que emanan de la mano.",
    "Descriptores": [
     {
      "Id": "16",
      "Nombre": "Fuego"
     }
    ],
    "Disciplina": {
     "Id": "2",
     "Nombre": "Metacreatividad",
     "Nombre_esp": "Formador",
     "Subdisciplinas": [
      "Creación"
     ]
    },
    "Divino": false,
    "Duracion": "Instantánea",
    "Efecto": null,
    "Escuela": null,
    "Id": "48",
    "Id_alcance": 6,
    "Id_manual": 65,
    "Id_subdisciplina": 2,
    "Id_tiempo_lanzamiento": 11,
    "Manual": "Rol mapa mundi, Página: 61",
    "Niveles_clase": [
     {
      "Clase": "Cazador brujo",
      "Espontaneo": "0",
      "Id_clase": "13",
      "Nivel": "1"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [],
    "Nombre": "Igni",
    "Objetivo": null,
    "Oficial": false,
    "Pagina": 61,
    "Permanente": false,
    "Psionico": true,
    "Puntos_poder": "1",
    "Resistencia_conjuros": false,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "Acción rápida",
    "Tipo_salvacion": "Reflejos niega (CD 10 + 1 + mod. Int, más el aumento)"
   },
   "id": 48,
   "nombre": "Igni"
  },
  {
   "cuerpo": {
    "componentes": [
     1,
     2,
     3
    ],
    "conjuro": {
     "arcano": true,
     "area": "Expansión de 20' de radio",
     "descripcion": "Un conjuro de *bola de fuego* es una explosión de llamas que detona con un estampido grave e inflige 1d6 puntos de daño por fuego por nivel de lanzador (máximo 10d6) a todas las criaturas que haya en el área. Los objetos no atendidos por ninguna criatura (portados, puestos, etc.) también sufrirán el daño. El efecto apenas genera presión.\n\nSólo tienes que señalar con el dedo y decidir a qué alcance (tanto en distancia como en altura) deseas que explote la *bola de fuego*. Una cuenta, brillante y del tamaño de un guisante, surgirá de tu dedo y explotará formando una bola de fuego al llegar a su punto de origen, siempre y cuando no golpee contra un cuerpo material o una barrera sólida antes de cubrir la distancia elegida (un impacto prematuro dará lugar a una explosión prematura). Si intentas enviar la cuenta a través de un paso estrecho (como una saetera), deberás “alcanzar” la abertura en cuestión con un ataque de toque a distancia; si fallas esta tirada, la cuenta golpeará contra la barrera y detonará prematuramente.\n\nLa *bola de fuego* incendiará todo lo que sea combustible y causará daño a los objetos que haya en el área. Puede fundir metales con un punto de fusión bajo, como el plomo, el oro, el cobre, la plata o el bronce. Si el daño causado a una barrera interpuesta la rompe o pasa a través de ella, la *bola de fuego* podrá continuar más allá, siempre que su área se lo permita; de lo contrario, se detendrá al llegar a la barrera, igual que haría cualquier otro efecto de conjuro.",
     "descripcion_componentes": "Componente material: una pequeña bola de guano de murciélago y azufre.",
     "divino": false,
     "duracion": "Instantánea",
     "efecto": "",
     "id_alcance": 3,
     "id_escuela": 5,
     "id_manual": 54,
     "id_tiempo_lanz": 1,
     "nombre": "Bola de fuego",
     "objetivo": "",
     "oficial": true,
     "pagina": 206,
     "permanente": false,
     "resistencia_conjuros": true,
     "tipo_salvacion": "Reflejos mitad",
     "variante": "base"
    },
    "descriptores": [
     16
    ],
    "niveles_clase": [
     {
      "espontaneo": false,
      "id_clase": 8,
      "nivel": 3
     },
     {
      "espontaneo": false,
      "id_clase": 9,
      "nivel": 3
     },
     {
      "espontaneo": false,
      "id_clase": 30,
      "nivel": 3
     },
     {
      "espontaneo": false,
      "id_clase": 31,
      "nivel": 3
     }
    ],
    "niveles_dominio": []
   },
   "get": {
    "Alcance": "Largo",
    "Arcano": true,
    "Area": "Expansión de 20' de radio",
    "Comodin": null,
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
    "Descripcion": "Un conjuro de *bola de fuego* es una explosión de llamas que detona con un estampido grave e inflige 1d6 puntos de daño por fuego por nivel de lanzador (máximo 10d6) a todas las criaturas que haya en el área. Los objetos no atendidos por ninguna criatura (portados, puestos, etc.) también sufrirán el daño. El efecto apenas genera presión.\n\nSólo tienes que señalar con el dedo y decidir a qué alcance (tanto en distancia como en altura) deseas que explote la *bola de fuego*. Una cuenta, brillante y del tamaño de un guisante, surgirá de tu dedo y explotará formando una bola de fuego al llegar a su punto de origen, siempre y cuando no golpee contra un cuerpo material o una barrera sólida antes de cubrir la distancia elegida (un impacto prematuro dará lugar a una explosión prematura). Si intentas enviar la cuenta a través de un paso estrecho (como una saetera), deberás “alcanzar” la abertura en cuestión con un ataque de toque a distancia; si fallas esta tirada, la cuenta golpeará contra la barrera y detonará prematuramente.\n\nLa *bola de fuego* incendiará todo lo que sea combustible y causará daño a los objetos que haya en el área. Puede fundir metales con un punto de fusión bajo, como el plomo, el oro, el cobre, la plata o el bronce. Si el daño causado a una barrera interpuesta la rompe o pasa a través de ella, la *bola de fuego* podrá continuar más allá, siempre que su área se lo permita; de lo contrario, se detendrá al llegar a la barrera, igual que haría cualquier otro efecto de conjuro.",
    "Descripcion_aumentos": "",
    "Descripcion_componentes": "Componente material: una pequeña bola de guano de murciélago y azufre.",
    "Descriptores": [
     {
      "Id": "16",
      "Nombre": "Fuego"
     }
    ],
    "Disciplina": null,
    "Divino": false,
    "Duracion": "Instantánea",
    "Efecto": "",
    "Escuela": {
     "Especializable": true,
     "Id": "5",
     "Nombre": "Evocación",
     "Nombre_esp": "Evocador",
     "Oficial": true,
     "Prohibible": true,
     "Prohibidas_al_especializarse": 2
    },
    "Id": "467",
    "Id_alcance": 3,
    "Id_manual": 54,
    "Id_subdisciplina": 0,
    "Id_tiempo_lanzamiento": 1,
    "Manual": "Manual del jugador 1, Página: 206",
    "Niveles_clase": [
     {
      "Clase": "hechicero",
      "Espontaneo": "0",
      "Id_clase": "8",
      "Nivel": "3"
     },
     {
      "Clase": "mago",
      "Espontaneo": "0",
      "Id_clase": "9",
      "Nivel": "3"
     },
     {
      "Clase": "Mágico de guerra",
      "Espontaneo": "0",
      "Id_clase": "30",
      "Nivel": "3"
     },
     {
      "Clase": "Wu jen",
      "Espontaneo": "0",
      "Id_clase": "31",
      "Nivel": "3"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [],
    "Nombre": "Bola de fuego",
    "Objetivo": "",
    "Oficial": true,
    "Pagina": 206,
    "Permanente": false,
    "Psionico": false,
    "Puntos_poder": "0",
    "Resistencia_conjuros": true,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "1 acción estándar",
    "Tipo_salvacion": "Reflejos mitad"
   },
   "id": 467,
   "nombre": "Bola de fuego"
  },
  {
   "cuerpo": {
    "componentes": [
     1,
     2,
     5
    ],
    "conjuro": {
     "arcano": true,
     "area": "",
     "descripcion": "Esta abjuración otorga a una criatura una protección limitada contra el daño de uno de los cinco tipos de energía: ácido, electricidad, frío, fuego o sonido. El objetivo obtiene resistencia a la energía 10 contra el tipo seleccionado, lo cual quiere decir que cada vez que reciba este tipo de daño (sea de una fuente natural o mágica), ese daño se reducirá en 10 puntos antes de aplicarse a los puntos de golpe de la criatura. El valor de la resistencia a la energía proporcionada aumenta a 20 puntos a nivel 7.º y hasta un máximo de 30 puntos a nivel 11.º. El conjuro protege también al equipo del receptor.\n\n*Resistir energía* sólo absorbe daño, pero el receptor sigue pudiendo sufrir otros efectos nocivos adicionales, como ahogarse en ácido (ya que la asfixia viene de la falta de oxígeno) o quedar atrapado en el hielo.\n\nNota: *resistir energía* se solapa (y, por tanto, no se apila) con *protección contra la energía*. Si un personaje está bajo los efectos de *protección contra la energía* y *resistir energía*, el conjuro de protección absorbe daño hasta que su poder quede agotado.",
     "descripcion_componentes": "",
     "divino": true,
     "duracion": "10 min/nivel",
     "efecto": "",
     "id_alcance": 5,
     "id_escuela": 1,
     "id_manual": 54,
     "id_tiempo_lanz": 1,
     "nombre": "Resistir energía",
     "objetivo": "Criatura tocada",
     "oficial": true,
     "pagina": 284,
     "permanente": false,
     "resistencia_conjuros": true,
     "tipo_salvacion": "Fortaleza niega (inofensivo)",
     "variante": "base"
    },
    "descriptores": [],
    "niveles_clase": [
     {
      "espontaneo": false,
      "id_clase": 4,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 5,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 6,
      "nivel": 1
     },
     {
      "espontaneo": false,
      "id_clase": 8,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 9,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 11,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 31,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 32,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 228,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 240,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 241,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 243,
      "nivel": 1
     },
     {
      "espontaneo": false,
      "id_clase": 244,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 256,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 259,
      "nivel": 3
     },
     {
      "espontaneo": false,
      "id_clase": 263,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 267,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 309,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 353,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 376,
      "nivel": 2
     }
    ],
    "niveles_dominio": [
     {
      "espontaneo": false,
      "id_dominio": 15,
      "nivel": 3
     },
     {
      "espontaneo": false,
      "id_dominio": 131,
      "nivel": 2
     }
    ]
   },
   "get": {
    "Alcance": "Toque",
    "Arcano": true,
    "Area": "",
    "Comodin": null,
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
      "Componente": "Foco divino",
      "Id_componente": "5"
     }
    ],
    "Coste_material": null,
    "Coste_px": null,
    "Descripcion": "Esta abjuración otorga a una criatura una protección limitada contra el daño de uno de los cinco tipos de energía: ácido, electricidad, frío, fuego o sonido. El objetivo obtiene resistencia a la energía 10 contra el tipo seleccionado, lo cual quiere decir que cada vez que reciba este tipo de daño (sea de una fuente natural o mágica), ese daño se reducirá en 10 puntos antes de aplicarse a los puntos de golpe de la criatura. El valor de la resistencia a la energía proporcionada aumenta a 20 puntos a nivel 7.º y hasta un máximo de 30 puntos a nivel 11.º. El conjuro protege también al equipo del receptor.\n\n*Resistir energía* sólo absorbe daño, pero el receptor sigue pudiendo sufrir otros efectos nocivos adicionales, como ahogarse en ácido (ya que la asfixia viene de la falta de oxígeno) o quedar atrapado en el hielo.\n\nNota: *resistir energía* se solapa (y, por tanto, no se apila) con *protección contra la energía*. Si un personaje está bajo los efectos de *protección contra la energía* y *resistir energía*, el conjuro de protección absorbe daño hasta que su poder quede agotado.",
    "Descripcion_aumentos": "",
    "Descripcion_componentes": "",
    "Descriptores": [],
    "Disciplina": null,
    "Divino": true,
    "Duracion": "10 min/nivel",
    "Efecto": "",
    "Escuela": {
     "Especializable": true,
     "Id": "1",
     "Nombre": "Abjuración",
     "Nombre_esp": "Abjurador",
     "Oficial": true,
     "Prohibible": true,
     "Prohibidas_al_especializarse": 2
    },
    "Id": "821",
    "Id_alcance": 5,
    "Id_manual": 54,
    "Id_subdisciplina": 0,
    "Id_tiempo_lanzamiento": 1,
    "Manual": "Manual del jugador 1, Página: 284",
    "Niveles_clase": [
     {
      "Clase": "clérigo",
      "Espontaneo": "0",
      "Id_clase": "4",
      "Nivel": "2"
     },
     {
      "Clase": "druida",
      "Espontaneo": "0",
      "Id_clase": "5",
      "Nivel": "2"
     },
     {
      "Clase": "explorador",
      "Espontaneo": "0",
      "Id_clase": "6",
      "Nivel": "1"
     },
     {
      "Clase": "hechicero",
      "Espontaneo": "0",
      "Id_clase": "8",
      "Nivel": "2"
     },
     {
      "Clase": "mago",
      "Espontaneo": "0",
      "Id_clase": "9",
      "Nivel": "2"
     },
     {
      "Clase": "paladín",
      "Espontaneo": "0",
      "Id_clase": "11",
      "Nivel": "2"
     },
     {
      "Clase": "Wu jen",
      "Espontaneo": "0",
      "Id_clase": "31",
      "Nivel": "2"
     },
     {
      "Clase": "Filo aojador",
      "Espontaneo": "0",
      "Id_clase": "32",
      "Nivel": "2"
     },
     {
      "Clase": "Arcanamach suelio",
      "Espontaneo": "0",
      "Id_clase": "228",
      "Nivel": "2"
     },
     {
      "Clase": "Alma predilecta",
      "Espontaneo": "0",
      "Id_clase": "240",
      "Nivel": "2"
     },
     {
      "Clase": "Asolador",
      "Espontaneo": "0",
      "Id_clase": "241",
      "Nivel": "2"
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
      "Nivel": "2"
     },
     {
      "Clase": "Protosacerdote",
      "Espontaneo": "0",
      "Id_clase": "256",
      "Nivel": "2"
     },
     {
      "Clase": "Saqueador de templos de Olidammara",
      "Espontaneo": "0",
      "Id_clase": "259",
      "Nivel": "3"
     },
     {
      "Clase": "Templario pío",
      "Espontaneo": "0",
      "Id_clase": "263",
      "Nivel": "2"
     },
     {
      "Clase": "Caballero del Cáliz",
      "Espontaneo": "0",
      "Id_clase": "267",
      "Nivel": "2"
     },
     {
      "Clase": "Shugenja",
      "Espontaneo": "0",
      "Id_clase": "309",
      "Nivel": "2"
     },
     {
      "Clase": "Libertador sagrado",
      "Espontaneo": "0",
      "Id_clase": "353",
      "Nivel": "2"
     },
     {
      "Clase": "Robaconjuros",
      "Espontaneo": "0",
      "Id_clase": "376",
      "Nivel": "2"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [
     {
      "Dominio": "Fuego",
      "Espontaneo": "0",
      "Id_dominio": "15",
      "Nivel": "3"
     },
     {
      "Dominio": "Dragón",
      "Espontaneo": "0",
      "Id_dominio": "131",
      "Nivel": "2"
     }
    ],
    "Nombre": "Resistir energía",
    "Objetivo": "Criatura tocada",
    "Oficial": true,
    "Pagina": 284,
    "Permanente": false,
    "Psionico": false,
    "Puntos_poder": "0",
    "Resistencia_conjuros": true,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "1 acción estándar",
    "Tipo_salvacion": "Fortaleza niega (inofensivo)"
   },
   "id": 821,
   "nombre": "Resistir energía"
  },
  {
   "cuerpo": {
    "componentes": [
     1,
     2,
     3,
     6
    ],
    "conjuro": {
     "arcano": true,
     "area": "",
     "coste_material": 100,
     "coste_px": 1000,
     "descripcion": "Este conjuro crea un doble ilusorio de cualquier criatura, que será parcialmente real pero también tendrá parte de hielo o nieve. El doble parecerá ser exactamente igual que el original, pero existirán varias diferencias: el simulacro sólo tendrá la mitad de los DG (y los correspondientes puntos de golpe, dotes, rangos de habilidades y aptitudes especiales para una criatura de ese nivel o DG). No puedes crear un simulacro de una criatura cuyos DG excedan el doble de tu nivel de lanzador. Debes realizar una prueba de Disfrazarse cuando lances el conjuro, para determinar lo bueno que es el parecido. Una criatura familiar con el original puede detectar el engaño con una prueba de Avistar con éxito (enfrentada a la prueba de Disfrazarse del lanzador) o con una prueba de Averiguar intenciones (CD 20).\n\nEl simulacro estará bajo tu control absoluto en todo momento. Sin embargo, al no existir vínculo telepático alguno, deberás ejercer este control de alguna otra forma. El simulacro no podrá hacerse más poderoso, por lo que no puede aumentar su nivel o aptitudes. Si es reducido a 0 puntos de golpe o destruido de algún otro modo, revierte a nieve y se derrite instantáneamente sin que quede nada. Un complicado procedimiento (que exigirá, como mínimo, 24 horas de trabajo, 100 po por punto de golpe y un laboratorio mágico completamente equipado) podrá reparar el daño sufrido por el simulacro.",
     "descripcion_componentes": "Componente material: el conjuro se lanza sobre el hielo o la nieve, en cuyo interior debe colocarse algún fragmento de la criatura a duplicar (cabello, uñas, etc.). Además, el conjuro requerirá polvo de rubí por valor de 100 po por DG del simulacro que se vaya a crear. Coste en PX: 100 PX por DG del simulacro que se vaya a crear (mínimo 1.000 PX).",
     "divino": false,
     "duracion": "Instantánea",
     "efecto": "Una criatura duplicada",
     "id_alcance": 15,
     "id_escuela": 6,
     "id_manual": 54,
     "id_tiempo_lanz": 20,
     "nombre": "Simulacro",
     "objetivo": "",
     "oficial": true,
     "pagina": 291,
     "permanente": false,
     "resistencia_conjuros": false,
     "tipo_salvacion": "Ninguno",
     "variante": "base"
    },
    "descriptores": [
     18
    ],
    "niveles_clase": [
     {
      "espontaneo": false,
      "id_clase": 8,
      "nivel": 7
     },
     {
      "espontaneo": false,
      "id_clase": 9,
      "nivel": 7
     },
     {
      "espontaneo": false,
      "id_clase": 225,
      "nivel": 7
     },
     {
      "espontaneo": false,
      "id_clase": 228,
      "nivel": 7
     }
    ],
    "niveles_dominio": [
     {
      "espontaneo": false,
      "id_dominio": 132,
      "nivel": 8
     }
    ]
   },
   "get": {
    "Alcance": "0",
    "Arcano": true,
    "Area": "",
    "Comodin": null,
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
     },
     {
      "Componente": "Experiencia",
      "Id_componente": "6"
     }
    ],
    "Coste_material": 100,
    "Coste_px": 1000,
    "Descripcion": "Este conjuro crea un doble ilusorio de cualquier criatura, que será parcialmente real pero también tendrá parte de hielo o nieve. El doble parecerá ser exactamente igual que el original, pero existirán varias diferencias: el simulacro sólo tendrá la mitad de los DG (y los correspondientes puntos de golpe, dotes, rangos de habilidades y aptitudes especiales para una criatura de ese nivel o DG). No puedes crear un simulacro de una criatura cuyos DG excedan el doble de tu nivel de lanzador. Debes realizar una prueba de Disfrazarse cuando lances el conjuro, para determinar lo bueno que es el parecido. Una criatura familiar con el original puede detectar el engaño con una prueba de Avistar con éxito (enfrentada a la prueba de Disfrazarse del lanzador) o con una prueba de Averiguar intenciones (CD 20).\n\nEl simulacro estará bajo tu control absoluto en todo momento. Sin embargo, al no existir vínculo telepático alguno, deberás ejercer este control de alguna otra forma. El simulacro no podrá hacerse más poderoso, por lo que no puede aumentar su nivel o aptitudes. Si es reducido a 0 puntos de golpe o destruido de algún otro modo, revierte a nieve y se derrite instantáneamente sin que quede nada. Un complicado procedimiento (que exigirá, como mínimo, 24 horas de trabajo, 100 po por punto de golpe y un laboratorio mágico completamente equipado) podrá reparar el daño sufrido por el simulacro.",
    "Descripcion_aumentos": "",
    "Descripcion_componentes": "Componente material: el conjuro se lanza sobre el hielo o la nieve, en cuyo interior debe colocarse algún fragmento de la criatura a duplicar (cabello, uñas, etc.). Además, el conjuro requerirá polvo de rubí por valor de 100 po por DG del simulacro que se vaya a crear. Coste en PX: 100 PX por DG del simulacro que se vaya a crear (mínimo 1.000 PX).",
    "Descriptores": [
     {
      "Id": "18",
      "Nombre": "Sombra"
     }
    ],
    "Disciplina": null,
    "Divino": false,
    "Duracion": "Instantánea",
    "Efecto": "Una criatura duplicada",
    "Escuela": {
     "Especializable": true,
     "Id": "6",
     "Nombre": "Ilusión",
     "Nombre_esp": "Ilusionista",
     "Oficial": true,
     "Prohibible": true,
     "Prohibidas_al_especializarse": 2
    },
    "Id": "856",
    "Id_alcance": 15,
    "Id_manual": 54,
    "Id_subdisciplina": 0,
    "Id_tiempo_lanzamiento": 20,
    "Manual": "Manual del jugador 1, Página: 291",
    "Niveles_clase": [
     {
      "Clase": "hechicero",
      "Espontaneo": "0",
      "Id_clase": "8",
      "Nivel": "7"
     },
     {
      "Clase": "mago",
      "Espontaneo": "0",
      "Id_clase": "9",
      "Nivel": "7"
     },
     {
      "Clase": "Acorde sublime",
      "Espontaneo": "0",
      "Id_clase": "225",
      "Nivel": "7"
     },
     {
      "Clase": "Arcanamach suelio",
      "Espontaneo": "0",
      "Id_clase": "228",
      "Nivel": "7"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [
     {
      "Dominio": "Envidia",
      "Espontaneo": "0",
      "Id_dominio": "132",
      "Nivel": "8"
     }
    ],
    "Nombre": "Simulacro",
    "Objetivo": "",
    "Oficial": true,
    "Pagina": 291,
    "Permanente": false,
    "Psionico": false,
    "Puntos_poder": "0",
    "Resistencia_conjuros": false,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "12 horas",
    "Tipo_salvacion": "Ninguno"
   },
   "id": 856,
   "nombre": "Simulacro"
  },
  {
   "cuerpo": {
    "componentes": [
     1,
     2,
     5,
     17
    ],
    "conjuro": {
     "arcano": true,
     "area": "",
     "descripcion": "La criatura tocada recibe el alma de un gran lanzador del pasado. Cuando quiera, con una acción inmediata, la activa durante 1 minuto: +1 introspectivo al nivel de lanzador y +2 introspectivo a Voluntad, Concentración y pruebas de Inteligencia y de habilidades basadas en ella; después el conjuro acaba. Nadie puede tener dos a la vez: el segundo se pierde sin efecto. Esencia: cada punto sube en 1 esos +2 (no el nivel de lanzador).",
     "descripcion_componentes": "",
     "divino": true,
     "duracion": "1 hora/nivel o hasta descargarse",
     "efecto": "",
     "id_alcance": 5,
     "id_escuela": 2,
     "id_manual": 31,
     "id_tiempo_lanz": 1,
     "nombre": "Espíritu del adepto",
     "objetivo": "Criatura tocada",
     "oficial": true,
     "pagina": 98,
     "permanente": false,
     "resistencia_conjuros": true,
     "tipo_salvacion": "Voluntad niega (inofensivo)",
     "variante": "base"
    },
    "descriptores": [
     39
    ],
    "niveles_clase": [
     {
      "espontaneo": false,
      "id_clase": 4,
      "nivel": 2
     },
     {
      "espontaneo": false,
      "id_clase": 8,
      "nivel": 3
     },
     {
      "espontaneo": false,
      "id_clase": 9,
      "nivel": 3
     }
    ],
    "niveles_dominio": []
   },
   "get": {
    "Alcance": "Toque",
    "Arcano": true,
    "Area": "",
    "Comodin": null,
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
      "Componente": "Foco divino",
      "Id_componente": "5"
     },
     {
      "Componente": "Esencia",
      "Id_componente": "17"
     }
    ],
    "Coste_material": null,
    "Coste_px": null,
    "Descripcion": "La criatura tocada recibe el alma de un gran lanzador del pasado. Cuando quiera, con una acción inmediata, la activa durante 1 minuto: +1 introspectivo al nivel de lanzador y +2 introspectivo a Voluntad, Concentración y pruebas de Inteligencia y de habilidades basadas en ella; después el conjuro acaba. Nadie puede tener dos a la vez: el segundo se pierde sin efecto. Esencia: cada punto sube en 1 esos +2 (no el nivel de lanzador).",
    "Descripcion_aumentos": "",
    "Descripcion_componentes": "",
    "Descriptores": [
     {
      "Id": "39",
      "Nombre": "Incarnum"
     }
    ],
    "Disciplina": null,
    "Divino": true,
    "Duracion": "1 hora/nivel o hasta descargarse",
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
    "Id": "3627",
    "Id_alcance": 5,
    "Id_manual": 31,
    "Id_subdisciplina": 0,
    "Id_tiempo_lanzamiento": 1,
    "Manual": "Magia del incarnum, Página: 98",
    "Niveles_clase": [
     {
      "Clase": "clérigo",
      "Espontaneo": "0",
      "Id_clase": "4",
      "Nivel": "2"
     },
     {
      "Clase": "hechicero",
      "Espontaneo": "0",
      "Id_clase": "8",
      "Nivel": "3"
     },
     {
      "Clase": "mago",
      "Espontaneo": "0",
      "Id_clase": "9",
      "Nivel": "3"
     }
    ],
    "Niveles_disciplina": [],
    "Niveles_dominio": [],
    "Nombre": "Espíritu del adepto",
    "Objetivo": "Criatura tocada",
    "Oficial": true,
    "Pagina": 98,
    "Permanente": false,
    "Psionico": false,
    "Puntos_poder": "0",
    "Resistencia_conjuros": true,
    "Resistencia_poderes": false,
    "Tiempo_lanzamiento": "1 acción estándar",
    "Tipo_salvacion": "Voluntad niega (inofensivo)"
   },
   "id": 3627,
   "nombre": "Espíritu del adepto"
  }
 ],
 "dotes": [
  {
   "cuerpo": {
    "dote": {
     "beneficio": "Obtienes un bonificador +1 a todas las tiradas de ataque cuando uses el arma elegida.",
     "comp_arma": true,
     "descripcion": "Elige un tipo de arma, como gran hacha, en cuyo uso serás especialmente bueno. Nada te impide adquirir esta dote eligiendo “impacto sin armas” o “presa” como tipo de arma. Si eres lanzador de conjuros, podrás elegir ‘rayo’ (como los producidos por el conjuro *rayo de escarcha*), en cuyo caso serás especialmente bueno lanzándolos.",
     "especial": "Puedes adquirir esta dote varias veces. Cada vez que lo hagas, el beneficio se aplicará a un arma diferente.\n\nUn guerrero puede elegir Soltura con un arma como una de sus dotes adicionales (ver la pág. 41). Todo guerrero debe poseer Soltura con un arma antes de poder adquirir la correspondiente Especialización en armas.",
     "extra_arma": true,
     "extra_armadura_armaduras": false,
     "extra_armadura_escudos": false,
     "extra_escuela": false,
     "extra_habilidad": false,
     "id_manual": 54,
     "id_tipo": 1,
     "id_tipo2": 2,
     "nombre": "Soltura con un arma",
     "normal": "No especifica",
     "oficial": true,
     "pagina": 102,
     "repetible": false,
     "repetible_comb": false,
     "repetible_distinto_extra": true
    },
    "extras_disponibles": {
     "armaduras": [],
     "armas": [
      0
     ],
     "escuelas": [],
     "habilidades": []
    },
    "habilidades_otorgadas": [],
    "modificadores": {},
    "prerrequisitos": {
     "ataque_base": [
      {
       "Cantidad": 1
      }
     ],
     "competencia_arma": [
      {
       "Id_arma": 0
      }
     ]
    }
   },
   "get": {
    "Beneficio": "Obtienes un bonificador +1 a todas las tiradas de ataque cuando uses el arma elegida.",
    "Comodin": null,
    "Comp_arma": 1,
    "Competencias_otorgadas": {
     "Armas": [],
     "Grupos_arma": []
    },
    "Cuenta_como": [],
    "Descripcion": "Elige un tipo de arma, como gran hacha, en cuyo uso serás especialmente bueno. Nada te impide adquirir esta dote eligiendo “impacto sin armas” o “presa” como tipo de arma. Si eres lanzador de conjuros, podrás elegir ‘rayo’ (como los producidos por el conjuro *rayo de escarcha*), en cuyo caso serás especialmente bueno lanzándolos.",
    "Especial": "Puedes adquirir esta dote varias veces. Cada vez que lo hagas, el beneficio se aplicará a un arma diferente.\n\nUn guerrero puede elegir Soltura con un arma como una de sus dotes adicionales (ver la pág. 41). Todo guerrero debe poseer Soltura con un arma antes de poder adquirir la correspondiente Especialización en armas.",
    "Extras_de_todo_el_catalogo": {
     "Armaduras": false,
     "Armas": true,
     "Chakras": false,
     "Escuelas": false,
     "Fusiones": false,
     "Habilidades": false
    },
    "Extras_disponibles": {
     "Armaduras": [],
     "Armas": [
      {
       "Id": 0,
       "Nombre": "Elegir"
      }
     ],
     "Chakras": [],
     "Escuelas": [],
     "Fusiones": [],
     "Habilidades": []
    },
    "Extras_soportados": {
     "Extra_arma": 1,
     "Extra_armadura": 0,
     "Extra_armadura_armaduras": 0,
     "Extra_armadura_escudos": 0,
     "Extra_chakra": 0,
     "Extra_escuela": 0,
     "Extra_fusion": 0,
     "Extra_habilidad": 0
    },
    "Habilidades_otorgadas": [],
    "Id": 4,
    "Incarnum": {
     "Abre_chakra": false,
     "Capacidad": null,
     "Caracteristica_cd_fusion": null,
     "Descriptores_sin_alineamiento": [],
     "Divisor_nivel_moldeador": null,
     "Esencia_reserva": 0,
     "Esencia_reserva_moldeador": null,
     "Pg_por_dote": null,
     "Pg_por_esencia": 0,
     "Receptaculo": false,
     "Sustituye_caracteristica": null
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 102
    },
    "Modificadores": {
     "Alcance": 0,
     "Armadura_natural": 0,
     "Ataque_base": 0,
     "Ca": 0,
     "Caracteristica": 0,
     "Carisma": 0,
     "Constitucion": 0,
     "Correr": 0,
     "Desprevenido": 0,
     "Destreza": 0,
     "Espacio": 0,
     "Excavar": 0,
     "Fortaleza": 0,
     "Fuerza": 0,
     "Habilidad": 0,
     "Iniciativa": 0,
     "Inteligencia": 0,
     "Nadar": 0,
     "Pg_a": 0,
     "Pg_a_n": 0,
     "Presa": 0,
     "Reflejos": 0,
     "Sabiduria": 0,
     "Toque": 0,
     "Trepar": 0,
     "Volar": 0,
     "Voluntad": 0
    },
    "Nombre": "Soltura con un arma",
    "Normal": null,
    "Oficial": true,
    "Prerrequisitos": {
     "actitud_prohibido": [],
     "actitud_requerido": [],
     "alineamiento_prohibido": [],
     "alineamiento_requerido": [],
     "aptitud_especial": [],
     "ataque_base": [
      {
       "Ataque_base": 1,
       "Frase": "Ataque base +1",
       "Opcional": 0
      }
     ],
     "caracteristica": [],
     "clase_especial": [],
     "competencia_arma": [
      {
       "Arma": "Elegir",
       "Arma_comodin": "elegir",
       "Frase": "Competencia con el arma elegida",
       "Id_arma": 0,
       "Opcional": 0
      }
     ],
     "competencia_armadura": [],
     "competencia_grupo_arma": [],
     "competencia_grupo_armadura": [],
     "conjuros_escuela": [],
     "dg": [],
     "dominio": [],
     "dote": [],
     "escuela_nivel": [],
     "esencia_minima": [],
     "fusiones_minimas": [],
     "habilidad": [],
     "idioma": [],
     "lanz_espontaneo": [],
     "lanzador_arcano": [],
     "lanzador_divino": [],
     "lanzador_psionico": [],
     "lanzar_conjuros_arcanos_nivel": [],
     "lanzar_conjuros_divinos_nivel": [],
     "lanzar_poder_psionico_nivel": [],
     "limite_tipo_dote": [],
     "nivel": [],
     "nivel_de_clase": [],
     "nivel_max": [],
     "nivel_moldeador": [],
     "poder_seleccionar_companero": [],
     "poder_seleccionar_familiar": [],
     "raza": [],
     "region": [],
     "reserva_psionica": [],
     "salvacion_minimo": [],
     "sin_esencia": [],
     "tamano_maximo": [],
     "tamano_minimo": [],
     "tipo_criatura": [],
     "tipo_dote": [],
     "vinculo_chakra": [],
     "vinculos_minimos": []
    },
    "Repetible": 0,
    "Repetible_comb": 0,
    "Repetible_distinto_extra": 1,
    "Salvaciones_condicionales": [],
    "Tipos": [
     {
      "Id": 1,
      "Nombre": "General",
      "Usado": 1
     },
     {
      "Id": 2,
      "Nombre": "Guerrero",
      "Usado": 1
     }
    ]
   },
   "id": 4,
   "nombre": "Soltura con un arma"
  },
  {
   "cuerpo": {
    "dote": {
     "beneficio": "Cuando utilizas el arma que has seleccionado, realizas +1d6 puntos de daño bonificado en un impacto crítico que tenga éxito. Si el multiplicador por crítico del armas es x3, añade en su lugar +2d6 de daño bonificador, y si el multiplicador por crítico del arma es x4, añade en su lugar +3d6 puntos de daño bonificado.",
     "comp_arma": true,
     "descripcion": "Elige un tipo de arma cuerpo a cuerpo, como una garra o mordisco. Con esa arma realizas más daño en un impacto crítico.",
     "especial": "Las criaturas inmunes a los impactos críticos son inmunes a esta dote.",
     "extra_arma": true,
     "extra_armadura_armaduras": false,
     "extra_armadura_escudos": false,
     "extra_escuela": false,
     "extra_habilidad": false,
     "id_manual": 6,
     "id_tipo": 7,
     "id_tipo2": 0,
     "nombre": "Crítico arrollador",
     "normal": "No especifica",
     "oficial": true,
     "pagina": 45,
     "repetible": false,
     "repetible_comb": false,
     "repetible_distinto_extra": true
    },
    "extras_disponibles": {
     "armaduras": [],
     "armas": [
      0
     ],
     "escuelas": [],
     "habilidades": []
    },
    "habilidades_otorgadas": [],
    "modificadores": {},
    "prerrequisitos": {
     "caracteristica": [
      {
       "Cantidad": 25,
       "Id_caracteristica": 1
      }
     ],
     "dote": [
      {
       "Id_dote_prerrequisito": 2,
       "Id_extra": -1,
       "Repetido": 0
      },
      {
       "Id_dote_prerrequisito": 6,
       "Id_extra": 0,
       "Repetido": 0
      },
      {
       "Id_dote_prerrequisito": 5,
       "Id_extra": -1,
       "Repetido": 0
      },
      {
       "Id_dote_prerrequisito": 3,
       "Id_extra": -1,
       "Repetido": 0
      },
      {
       "Id_dote_prerrequisito": 4,
       "Id_extra": 0,
       "Repetido": 0
      }
     ]
    }
   },
   "get": {
    "Beneficio": "Cuando utilizas el arma que has seleccionado, realizas +1d6 puntos de daño bonificado en un impacto crítico que tenga éxito. Si el multiplicador por crítico del armas es x3, añade en su lugar +2d6 de daño bonificador, y si el multiplicador por crítico del arma es x4, añade en su lugar +3d6 puntos de daño bonificado.",
    "Comodin": null,
    "Comp_arma": 1,
    "Competencias_otorgadas": {
     "Armas": [],
     "Grupos_arma": []
    },
    "Cuenta_como": [],
    "Descripcion": "Elige un tipo de arma cuerpo a cuerpo, como una garra o mordisco. Con esa arma realizas más daño en un impacto crítico.",
    "Especial": "Las criaturas inmunes a los impactos críticos son inmunes a esta dote.",
    "Extras_de_todo_el_catalogo": {
     "Armaduras": false,
     "Armas": true,
     "Chakras": false,
     "Escuelas": false,
     "Fusiones": false,
     "Habilidades": false
    },
    "Extras_disponibles": {
     "Armaduras": [],
     "Armas": [
      {
       "Id": 0,
       "Nombre": "Elegir"
      }
     ],
     "Chakras": [],
     "Escuelas": [],
     "Fusiones": [],
     "Habilidades": []
    },
    "Extras_soportados": {
     "Extra_arma": 1,
     "Extra_armadura": 0,
     "Extra_armadura_armaduras": 0,
     "Extra_armadura_escudos": 0,
     "Extra_chakra": 0,
     "Extra_escuela": 0,
     "Extra_fusion": 0,
     "Extra_habilidad": 0
    },
    "Habilidades_otorgadas": [],
    "Id": 7,
    "Incarnum": {
     "Abre_chakra": false,
     "Capacidad": null,
     "Caracteristica_cd_fusion": null,
     "Descriptores_sin_alineamiento": [],
     "Divisor_nivel_moldeador": null,
     "Esencia_reserva": 0,
     "Esencia_reserva_moldeador": null,
     "Pg_por_dote": null,
     "Pg_por_esencia": 0,
     "Receptaculo": false,
     "Sustituye_caracteristica": null
    },
    "Manual": {
     "Id": 6,
     "Nombre": "Compendio de dotes",
     "Pagina": 45
    },
    "Modificadores": {
     "Alcance": 0,
     "Armadura_natural": 0,
     "Ataque_base": 0,
     "Ca": 0,
     "Caracteristica": 0,
     "Carisma": 0,
     "Constitucion": 0,
     "Correr": 0,
     "Desprevenido": 0,
     "Destreza": 0,
     "Espacio": 0,
     "Excavar": 0,
     "Fortaleza": 0,
     "Fuerza": 0,
     "Habilidad": 0,
     "Iniciativa": 0,
     "Inteligencia": 0,
     "Nadar": 0,
     "Pg_a": 0,
     "Pg_a_n": 0,
     "Presa": 0,
     "Reflejos": 0,
     "Sabiduria": 0,
     "Toque": 0,
     "Trepar": 0,
     "Volar": 0,
     "Voluntad": 0
    },
    "Nombre": "Crítico arrollador",
    "Normal": null,
    "Oficial": true,
    "Prerrequisitos": {
     "actitud_prohibido": [],
     "actitud_requerido": [],
     "alineamiento_prohibido": [],
     "alineamiento_requerido": [],
     "aptitud_especial": [],
     "ataque_base": [],
     "caracteristica": [
      {
       "Cantidad": 25,
       "Caracteristica": "Fuerza",
       "Frase": "Fuerza 25",
       "Id_caracteristica": 1,
       "Opcional": 0
      }
     ],
     "clase_especial": [],
     "competencia_arma": [],
     "competencia_armadura": [],
     "competencia_grupo_arma": [],
     "competencia_grupo_armadura": [],
     "conjuros_escuela": [],
     "dg": [],
     "dominio": [],
     "dote": [
      {
       "Dote_prerrequisito": "Ataque poderoso",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Ataque poderoso",
       "Id_dote_prerrequisito": 2,
       "Id_extra": -1,
       "Opcional": 0,
       "Repetido": 0
      },
      {
       "Dote_prerrequisito": "Crítico mejorado",
       "Extra": null,
       "Extra_comodin": "elegir",
       "Frase": "Crítico mejorado (el arma elegida)",
       "Id_dote_prerrequisito": 6,
       "Id_extra": 0,
       "Opcional": 0,
       "Repetido": 0
      },
      {
       "Dote_prerrequisito": "Gran hendedura",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Gran hendedura",
       "Id_dote_prerrequisito": 5,
       "Id_extra": -1,
       "Opcional": 0,
       "Repetido": 0
      },
      {
       "Dote_prerrequisito": "Hendedura",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Hendedura",
       "Id_dote_prerrequisito": 3,
       "Id_extra": -1,
       "Opcional": 0,
       "Repetido": 0
      },
      {
       "Dote_prerrequisito": "Soltura con un arma",
       "Extra": null,
       "Extra_comodin": "elegir",
       "Frase": "Soltura con un arma (el arma elegida)",
       "Id_dote_prerrequisito": 4,
       "Id_extra": 0,
       "Opcional": 0,
       "Repetido": 0
      }
     ],
     "escuela_nivel": [],
     "esencia_minima": [],
     "fusiones_minimas": [],
     "habilidad": [],
     "idioma": [],
     "lanz_espontaneo": [],
     "lanzador_arcano": [],
     "lanzador_divino": [],
     "lanzador_psionico": [],
     "lanzar_conjuros_arcanos_nivel": [],
     "lanzar_conjuros_divinos_nivel": [],
     "lanzar_poder_psionico_nivel": [],
     "limite_tipo_dote": [],
     "nivel": [],
     "nivel_de_clase": [],
     "nivel_max": [],
     "nivel_moldeador": [],
     "poder_seleccionar_companero": [],
     "poder_seleccionar_familiar": [],
     "raza": [],
     "region": [],
     "reserva_psionica": [],
     "salvacion_minimo": [],
     "sin_esencia": [],
     "tamano_maximo": [],
     "tamano_minimo": [],
     "tipo_criatura": [],
     "tipo_dote": [],
     "vinculo_chakra": [],
     "vinculos_minimos": []
    },
    "Repetible": 0,
    "Repetible_comb": 0,
    "Repetible_distinto_extra": 1,
    "Salvaciones_condicionales": [],
    "Tipos": [
     {
      "Id": 7,
      "Nombre": "Épica",
      "Usado": 1
     }
    ]
   },
   "id": 7,
   "nombre": "Crítico arrollador"
  },
  {
   "cuerpo": {
    "dote": {
     "beneficio": "Obtienes un +2 en las pruebas de Avistar y Escuchar.",
     "comp_arma": false,
     "descripcion": "Posees unos sentidos muy agudos.",
     "especial": "El amo de un familiar (consulta la barra lateral 'Familiares', pág. 44) obtendrá los beneficios de la dote Alerta siempre que tenga al familiar al alcance de la mano.",
     "extra_arma": false,
     "extra_armadura_armaduras": false,
     "extra_armadura_escudos": false,
     "extra_escuela": false,
     "extra_habilidad": false,
     "id_manual": 54,
     "id_tipo": 1,
     "id_tipo2": 0,
     "nombre": "Alerta",
     "normal": "No especifica",
     "oficial": true,
     "pagina": 89,
     "repetible": false,
     "repetible_comb": false,
     "repetible_distinto_extra": false
    },
    "extras_disponibles": {
     "armaduras": [],
     "armas": [],
     "escuelas": [],
     "habilidades": []
    },
    "habilidades_otorgadas": [
     {
      "custom": false,
      "id_habilidad": 6,
      "rangos": 2
     },
     {
      "custom": false,
      "id_habilidad": 17,
      "rangos": 2
     }
    ],
    "modificadores": {},
    "prerrequisitos": {}
   },
   "get": {
    "Beneficio": "Obtienes un +2 en las pruebas de Avistar y Escuchar.",
    "Comodin": null,
    "Comp_arma": 0,
    "Competencias_otorgadas": {
     "Armas": [],
     "Grupos_arma": []
    },
    "Cuenta_como": [],
    "Descripcion": "Posees unos sentidos muy agudos.",
    "Especial": "El amo de un familiar (consulta la barra lateral 'Familiares', pág. 44) obtendrá los beneficios de la dote Alerta siempre que tenga al familiar al alcance de la mano.",
    "Extras_de_todo_el_catalogo": {
     "Armaduras": false,
     "Armas": false,
     "Chakras": false,
     "Escuelas": false,
     "Fusiones": false,
     "Habilidades": false
    },
    "Extras_disponibles": {
     "Armaduras": [],
     "Armas": [],
     "Chakras": [],
     "Escuelas": [],
     "Fusiones": [],
     "Habilidades": []
    },
    "Extras_soportados": {
     "Extra_arma": 0,
     "Extra_armadura": 0,
     "Extra_armadura_armaduras": 0,
     "Extra_armadura_escudos": 0,
     "Extra_chakra": 0,
     "Extra_escuela": 0,
     "Extra_fusion": 0,
     "Extra_habilidad": 0
    },
    "Habilidades_otorgadas": [
     {
      "Custom": false,
      "Extra": null,
      "Extra_comodin": null,
      "Habilidad": "Avistar",
      "Id_extra": null,
      "Id_habilidad": 6,
      "Rangos": 2
     },
     {
      "Custom": false,
      "Extra": null,
      "Extra_comodin": null,
      "Habilidad": "Escuchar",
      "Id_extra": null,
      "Id_habilidad": 17,
      "Rangos": 2
     }
    ],
    "Id": 17,
    "Incarnum": {
     "Abre_chakra": false,
     "Capacidad": null,
     "Caracteristica_cd_fusion": null,
     "Descriptores_sin_alineamiento": [],
     "Divisor_nivel_moldeador": null,
     "Esencia_reserva": 0,
     "Esencia_reserva_moldeador": null,
     "Pg_por_dote": null,
     "Pg_por_esencia": 0,
     "Receptaculo": false,
     "Sustituye_caracteristica": null
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 89
    },
    "Modificadores": {
     "Alcance": 0,
     "Armadura_natural": 0,
     "Ataque_base": 0,
     "Ca": 0,
     "Caracteristica": 0,
     "Carisma": 0,
     "Constitucion": 0,
     "Correr": 0,
     "Desprevenido": 0,
     "Destreza": 0,
     "Espacio": 0,
     "Excavar": 0,
     "Fortaleza": 0,
     "Fuerza": 0,
     "Habilidad": 0,
     "Iniciativa": 0,
     "Inteligencia": 0,
     "Nadar": 0,
     "Pg_a": 0,
     "Pg_a_n": 0,
     "Presa": 0,
     "Reflejos": 0,
     "Sabiduria": 0,
     "Toque": 0,
     "Trepar": 0,
     "Volar": 0,
     "Voluntad": 0
    },
    "Nombre": "Alerta",
    "Normal": null,
    "Oficial": true,
    "Prerrequisitos": {
     "actitud_prohibido": [],
     "actitud_requerido": [],
     "alineamiento_prohibido": [],
     "alineamiento_requerido": [],
     "aptitud_especial": [],
     "ataque_base": [],
     "caracteristica": [],
     "clase_especial": [],
     "competencia_arma": [],
     "competencia_armadura": [],
     "competencia_grupo_arma": [],
     "competencia_grupo_armadura": [],
     "conjuros_escuela": [],
     "dg": [],
     "dominio": [],
     "dote": [],
     "escuela_nivel": [],
     "esencia_minima": [],
     "fusiones_minimas": [],
     "habilidad": [],
     "idioma": [],
     "lanz_espontaneo": [],
     "lanzador_arcano": [],
     "lanzador_divino": [],
     "lanzador_psionico": [],
     "lanzar_conjuros_arcanos_nivel": [],
     "lanzar_conjuros_divinos_nivel": [],
     "lanzar_poder_psionico_nivel": [],
     "limite_tipo_dote": [],
     "nivel": [],
     "nivel_de_clase": [],
     "nivel_max": [],
     "nivel_moldeador": [],
     "poder_seleccionar_companero": [],
     "poder_seleccionar_familiar": [],
     "raza": [],
     "region": [],
     "reserva_psionica": [],
     "salvacion_minimo": [],
     "sin_esencia": [],
     "tamano_maximo": [],
     "tamano_minimo": [],
     "tipo_criatura": [],
     "tipo_dote": [],
     "vinculo_chakra": [],
     "vinculos_minimos": []
    },
    "Repetible": 0,
    "Repetible_comb": 0,
    "Repetible_distinto_extra": 0,
    "Salvaciones_condicionales": [],
    "Tipos": [
     {
      "Id": 1,
      "Nombre": "General",
      "Usado": 1
     }
    ]
   },
   "id": 17,
   "nombre": "Alerta"
  },
  {
   "cuerpo": {
    "dote": {
     "beneficio": "Al optar por la acción de ataque completo, puedes renunciar a tus ataques normales y, en su lugar, asestar un golpe de cuerpo a cuerpo con tu ataque base completo a todos los oponentes dentro de tu alcance. Cuando usas la dote Ataque de torbellino pierdes cualquier ataque adicional proporcionado por otras dotes o aptitudes (como la dote Hendedura o el conjuro acelerar).",
     "comp_arma": false,
     "descripcion": "Puedes golpear a los oponentes cercanos con un asombroso ataque giratorio.",
     "especial": "Un guerrero puede elegir Ataque de torbellino como una de sus dotes adicionales (ver la pág. 41).",
     "extra_arma": false,
     "extra_armadura_armaduras": false,
     "extra_armadura_escudos": false,
     "extra_escuela": false,
     "extra_habilidad": false,
     "id_manual": 54,
     "id_tipo": 1,
     "id_tipo2": 2,
     "nombre": "Ataque de torbellino",
     "normal": "No especifica",
     "oficial": true,
     "pagina": 89,
     "repetible": false,
     "repetible_comb": false,
     "repetible_distinto_extra": false
    },
    "extras_disponibles": {
     "armaduras": [],
     "armas": [],
     "escuelas": [],
     "habilidades": []
    },
    "habilidades_otorgadas": [],
    "modificadores": {},
    "prerrequisitos": {
     "ataque_base": [
      {
       "Cantidad": 4
      }
     ],
     "caracteristica": [
      {
       "Cantidad": 13,
       "Id_caracteristica": 2
      },
      {
       "Cantidad": 13,
       "Id_caracteristica": 4
      }
     ],
     "dote": [
      {
       "Id_dote_prerrequisito": 293,
       "Id_extra": 0,
       "Repetido": 0
      },
      {
       "Id_dote_prerrequisito": 21,
       "Id_extra": 0,
       "Repetido": 0
      },
      {
       "Id_dote_prerrequisito": 347,
       "Id_extra": 0,
       "Repetido": 0
      },
      {
       "Id_dote_prerrequisito": 9,
       "Id_extra": 0,
       "Repetido": 0
      }
     ]
    }
   },
   "get": {
    "Beneficio": "Al optar por la acción de ataque completo, puedes renunciar a tus ataques normales y, en su lugar, asestar un golpe de cuerpo a cuerpo con tu ataque base completo a todos los oponentes dentro de tu alcance. Cuando usas la dote Ataque de torbellino pierdes cualquier ataque adicional proporcionado por otras dotes o aptitudes (como la dote Hendedura o el conjuro acelerar).",
    "Comodin": null,
    "Comp_arma": 0,
    "Competencias_otorgadas": {
     "Armas": [],
     "Grupos_arma": []
    },
    "Cuenta_como": [],
    "Descripcion": "Puedes golpear a los oponentes cercanos con un asombroso ataque giratorio.",
    "Especial": "Un guerrero puede elegir Ataque de torbellino como una de sus dotes adicionales (ver la pág. 41).",
    "Extras_de_todo_el_catalogo": {
     "Armaduras": false,
     "Armas": false,
     "Chakras": false,
     "Escuelas": false,
     "Fusiones": false,
     "Habilidades": false
    },
    "Extras_disponibles": {
     "Armaduras": [],
     "Armas": [],
     "Chakras": [],
     "Escuelas": [],
     "Fusiones": [],
     "Habilidades": []
    },
    "Extras_soportados": {
     "Extra_arma": 0,
     "Extra_armadura": 0,
     "Extra_armadura_armaduras": 0,
     "Extra_armadura_escudos": 0,
     "Extra_chakra": 0,
     "Extra_escuela": 0,
     "Extra_fusion": 0,
     "Extra_habilidad": 0
    },
    "Habilidades_otorgadas": [],
    "Id": 292,
    "Incarnum": {
     "Abre_chakra": false,
     "Capacidad": null,
     "Caracteristica_cd_fusion": null,
     "Descriptores_sin_alineamiento": [],
     "Divisor_nivel_moldeador": null,
     "Esencia_reserva": 0,
     "Esencia_reserva_moldeador": null,
     "Pg_por_dote": null,
     "Pg_por_esencia": 0,
     "Receptaculo": false,
     "Sustituye_caracteristica": null
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 89
    },
    "Modificadores": {
     "Alcance": 0,
     "Armadura_natural": 0,
     "Ataque_base": 0,
     "Ca": 0,
     "Caracteristica": 0,
     "Carisma": 0,
     "Constitucion": 0,
     "Correr": 0,
     "Desprevenido": 0,
     "Destreza": 0,
     "Espacio": 0,
     "Excavar": 0,
     "Fortaleza": 0,
     "Fuerza": 0,
     "Habilidad": 0,
     "Iniciativa": 0,
     "Inteligencia": 0,
     "Nadar": 0,
     "Pg_a": 0,
     "Pg_a_n": 0,
     "Presa": 0,
     "Reflejos": 0,
     "Sabiduria": 0,
     "Toque": 0,
     "Trepar": 0,
     "Volar": 0,
     "Voluntad": 0
    },
    "Nombre": "Ataque de torbellino",
    "Normal": null,
    "Oficial": true,
    "Prerrequisitos": {
     "actitud_prohibido": [],
     "actitud_requerido": [],
     "alineamiento_prohibido": [],
     "alineamiento_requerido": [],
     "aptitud_especial": [],
     "ataque_base": [
      {
       "Ataque_base": 4,
       "Frase": "Ataque base +4",
       "Opcional": 0
      }
     ],
     "caracteristica": [
      {
       "Cantidad": 13,
       "Caracteristica": "Destreza",
       "Frase": "Destreza 13",
       "Id_caracteristica": 2,
       "Opcional": 0
      },
      {
       "Cantidad": 13,
       "Caracteristica": "Inteligencia",
       "Frase": "Inteligencia 13",
       "Id_caracteristica": 4,
       "Opcional": 0
      }
     ],
     "clase_especial": [],
     "competencia_arma": [],
     "competencia_armadura": [],
     "competencia_grupo_arma": [],
     "competencia_grupo_armadura": [],
     "conjuros_escuela": [],
     "dg": [],
     "dominio": [],
     "dote": [
      {
       "Dote_prerrequisito": "Ataque elástico",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Ataque elástico",
       "Id_dote_prerrequisito": 293,
       "Id_extra": 0,
       "Opcional": 0,
       "Repetido": 0
      },
      {
       "Dote_prerrequisito": "Esquiva",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Esquiva",
       "Id_dote_prerrequisito": 21,
       "Id_extra": 0,
       "Opcional": 0,
       "Repetido": 0
      },
      {
       "Dote_prerrequisito": "Movilidad",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Movilidad",
       "Id_dote_prerrequisito": 347,
       "Id_extra": 0,
       "Opcional": 0,
       "Repetido": 0
      },
      {
       "Dote_prerrequisito": "Pericia en combate",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Pericia en combate",
       "Id_dote_prerrequisito": 9,
       "Id_extra": 0,
       "Opcional": 0,
       "Repetido": 0
      }
     ],
     "escuela_nivel": [],
     "esencia_minima": [],
     "fusiones_minimas": [],
     "habilidad": [],
     "idioma": [],
     "lanz_espontaneo": [],
     "lanzador_arcano": [],
     "lanzador_divino": [],
     "lanzador_psionico": [],
     "lanzar_conjuros_arcanos_nivel": [],
     "lanzar_conjuros_divinos_nivel": [],
     "lanzar_poder_psionico_nivel": [],
     "limite_tipo_dote": [],
     "nivel": [],
     "nivel_de_clase": [],
     "nivel_max": [],
     "nivel_moldeador": [],
     "poder_seleccionar_companero": [],
     "poder_seleccionar_familiar": [],
     "raza": [],
     "region": [],
     "reserva_psionica": [],
     "salvacion_minimo": [],
     "sin_esencia": [],
     "tamano_maximo": [],
     "tamano_minimo": [],
     "tipo_criatura": [],
     "tipo_dote": [],
     "vinculo_chakra": [],
     "vinculos_minimos": []
    },
    "Repetible": 0,
    "Repetible_comb": 0,
    "Repetible_distinto_extra": 0,
    "Salvaciones_condicionales": [],
    "Tipos": [
     {
      "Id": 1,
      "Nombre": "General",
      "Usado": 1
     },
     {
      "Id": 2,
      "Nombre": "Guerrero",
      "Usado": 1
     }
    ]
   },
   "id": 292,
   "nombre": "Ataque de torbellino"
  },
  {
   "cuerpo": {
    "dote": {
     "beneficio": "Puedes realizar los componentes verbales y somáticos de un conjuro estando en una forma salvaje. Por ejemplo, en forma de halcón puedes utilizar chirridos y gestos de tus garras como sustitutos de los componentes verbales y somáticos normales de un conjuro. También puedes utilizar cualquier componente material o foco que poseas, incluso si estos objetos se han fundido en la forma. Esta dote no permite el uso de objetos mágicos mientras estés en una forma que normalmente no permitiría su uso, y tampoco te proporciona la aptitud de hablar mientras estés en forma salvaje.",
     "comp_arma": false,
     "descripcion": "Puedes lanzar conjuros estando en una forma salvaje.",
     "especial": "No especifica",
     "extra_arma": false,
     "extra_armadura_armaduras": false,
     "extra_armadura_escudos": false,
     "extra_escuela": false,
     "extra_habilidad": false,
     "id_manual": 54,
     "id_tipo": 1,
     "id_tipo2": 0,
     "nombre": "Conjuros naturales",
     "normal": "No especifica",
     "oficial": true,
     "pagina": 94,
     "repetible": false,
     "repetible_comb": false,
     "repetible_distinto_extra": false
    },
    "extras_disponibles": {
     "armaduras": [],
     "armas": [],
     "escuelas": [],
     "habilidades": []
    },
    "habilidades_otorgadas": [],
    "modificadores": {},
    "prerrequisitos": {
     "caracteristica": [
      {
       "Cantidad": 13,
       "Id_caracteristica": 5
      }
     ],
     "clase_especial": [
      {
       "Id_especial": 34,
       "Id_extra": 14
      }
     ]
    }
   },
   "get": {
    "Beneficio": "Puedes realizar los componentes verbales y somáticos de un conjuro estando en una forma salvaje. Por ejemplo, en forma de halcón puedes utilizar chirridos y gestos de tus garras como sustitutos de los componentes verbales y somáticos normales de un conjuro. También puedes utilizar cualquier componente material o foco que poseas, incluso si estos objetos se han fundido en la forma. Esta dote no permite el uso de objetos mágicos mientras estés en una forma que normalmente no permitiría su uso, y tampoco te proporciona la aptitud de hablar mientras estés en forma salvaje.",
    "Comodin": null,
    "Comp_arma": 0,
    "Competencias_otorgadas": {
     "Armas": [],
     "Grupos_arma": []
    },
    "Cuenta_como": [],
    "Descripcion": "Puedes lanzar conjuros estando en una forma salvaje.",
    "Especial": null,
    "Extras_de_todo_el_catalogo": {
     "Armaduras": false,
     "Armas": false,
     "Chakras": false,
     "Escuelas": false,
     "Fusiones": false,
     "Habilidades": false
    },
    "Extras_disponibles": {
     "Armaduras": [],
     "Armas": [],
     "Chakras": [],
     "Escuelas": [],
     "Fusiones": [],
     "Habilidades": []
    },
    "Extras_soportados": {
     "Extra_arma": 0,
     "Extra_armadura": 0,
     "Extra_armadura_armaduras": 0,
     "Extra_armadura_escudos": 0,
     "Extra_chakra": 0,
     "Extra_escuela": 0,
     "Extra_fusion": 0,
     "Extra_habilidad": 0
    },
    "Habilidades_otorgadas": [],
    "Id": 312,
    "Incarnum": {
     "Abre_chakra": false,
     "Capacidad": null,
     "Caracteristica_cd_fusion": null,
     "Descriptores_sin_alineamiento": [],
     "Divisor_nivel_moldeador": null,
     "Esencia_reserva": 0,
     "Esencia_reserva_moldeador": null,
     "Pg_por_dote": null,
     "Pg_por_esencia": 0,
     "Receptaculo": false,
     "Sustituye_caracteristica": null
    },
    "Manual": {
     "Id": 54,
     "Nombre": "Manual del jugador 1",
     "Pagina": 94
    },
    "Modificadores": {
     "Alcance": 0,
     "Armadura_natural": 0,
     "Ataque_base": 0,
     "Ca": 0,
     "Caracteristica": 0,
     "Carisma": 0,
     "Constitucion": 0,
     "Correr": 0,
     "Desprevenido": 0,
     "Destreza": 0,
     "Espacio": 0,
     "Excavar": 0,
     "Fortaleza": 0,
     "Fuerza": 0,
     "Habilidad": 0,
     "Iniciativa": 0,
     "Inteligencia": 0,
     "Nadar": 0,
     "Pg_a": 0,
     "Pg_a_n": 0,
     "Presa": 0,
     "Reflejos": 0,
     "Sabiduria": 0,
     "Toque": 0,
     "Trepar": 0,
     "Volar": 0,
     "Voluntad": 0
    },
    "Nombre": "Conjuros naturales",
    "Normal": null,
    "Oficial": true,
    "Prerrequisitos": {
     "actitud_prohibido": [],
     "actitud_requerido": [],
     "alineamiento_prohibido": [],
     "alineamiento_requerido": [],
     "aptitud_especial": [],
     "ataque_base": [],
     "caracteristica": [
      {
       "Cantidad": 13,
       "Caracteristica": "Sabiduría",
       "Frase": "Sabiduría 13",
       "Id_caracteristica": 5,
       "Opcional": 0
      }
     ],
     "clase_especial": [
      {
       "Especial": "Forma salvaje",
       "Extra": "1/día",
       "Extra_comodin": null,
       "Frase": "Forma salvaje (1/día)",
       "Id_especial": 34,
       "Id_extra": 14,
       "Opcional": 0
      }
     ],
     "competencia_arma": [],
     "competencia_armadura": [],
     "competencia_grupo_arma": [],
     "competencia_grupo_armadura": [],
     "conjuros_escuela": [],
     "dg": [],
     "dominio": [],
     "dote": [],
     "escuela_nivel": [],
     "esencia_minima": [],
     "fusiones_minimas": [],
     "habilidad": [],
     "idioma": [],
     "lanz_espontaneo": [],
     "lanzador_arcano": [],
     "lanzador_divino": [],
     "lanzador_psionico": [],
     "lanzar_conjuros_arcanos_nivel": [],
     "lanzar_conjuros_divinos_nivel": [],
     "lanzar_poder_psionico_nivel": [],
     "limite_tipo_dote": [],
     "nivel": [],
     "nivel_de_clase": [],
     "nivel_max": [],
     "nivel_moldeador": [],
     "poder_seleccionar_companero": [],
     "poder_seleccionar_familiar": [],
     "raza": [],
     "region": [],
     "reserva_psionica": [],
     "salvacion_minimo": [],
     "sin_esencia": [],
     "tamano_maximo": [],
     "tamano_minimo": [],
     "tipo_criatura": [],
     "tipo_dote": [],
     "vinculo_chakra": [],
     "vinculos_minimos": []
    },
    "Repetible": 0,
    "Repetible_comb": 0,
    "Repetible_distinto_extra": 0,
    "Salvaciones_condicionales": [],
    "Tipos": [
     {
      "Id": 1,
      "Nombre": "General",
      "Usado": 1
     }
    ]
   },
   "id": 312,
   "nombre": "Conjuros naturales"
  },
  {
   "cuerpo": {
    "dote": {
     "beneficio": "Una vez por asalto, cuando te alcance un ataque de un oponente que has designado como el objetivo de tu dote de Esquiva, automáticamente evitas todo el daño de éste.",
     "comp_arma": false,
     "descripcion": "Eres capaz de evitar ataques con agilidad excepcional.",
     "especial": "No especifica",
     "extra_arma": false,
     "extra_armadura_armaduras": false,
     "extra_armadura_escudos": false,
     "extra_escuela": false,
     "extra_habilidad": false,
     "id_manual": 71,
     "id_tipo": 7,
     "id_tipo2": 0,
     "nombre": "Esquiva épica",
     "normal": "No especifica",
     "oficial": true,
     "pagina": 192,
     "repetible": false,
     "repetible_comb": false,
     "repetible_distinto_extra": false
    },
    "extras_disponibles": {
     "armaduras": [],
     "armas": [],
     "escuelas": [],
     "habilidades": []
    },
    "habilidades_otorgadas": [],
    "modificadores": {},
    "prerrequisitos": {
     "caracteristica": [
      {
       "Cantidad": 25,
       "Id_caracteristica": 2
      }
     ],
     "clase_especial": [
      {
       "Id_especial": 57,
       "Id_extra": 0
      },
      {
       "Id_especial": 2265,
       "Id_extra": 0
      }
     ],
     "dote": [
      {
       "Id_dote_prerrequisito": 21,
       "Id_extra": 0,
       "Repetido": 0
      }
     ],
     "habilidad": [
      {
       "Cantidad": 30,
       "Id_habilidad": 30,
       "Requiere_extra": false
      }
     ]
    }
   },
   "get": {
    "Beneficio": "Una vez por asalto, cuando te alcance un ataque de un oponente que has designado como el objetivo de tu dote de Esquiva, automáticamente evitas todo el daño de éste.",
    "Comodin": null,
    "Comp_arma": 0,
    "Competencias_otorgadas": {
     "Armas": [],
     "Grupos_arma": []
    },
    "Cuenta_como": [],
    "Descripcion": "Eres capaz de evitar ataques con agilidad excepcional.",
    "Especial": null,
    "Extras_de_todo_el_catalogo": {
     "Armaduras": false,
     "Armas": false,
     "Chakras": false,
     "Escuelas": false,
     "Fusiones": false,
     "Habilidades": false
    },
    "Extras_disponibles": {
     "Armaduras": [],
     "Armas": [],
     "Chakras": [],
     "Escuelas": [],
     "Fusiones": [],
     "Habilidades": []
    },
    "Extras_soportados": {
     "Extra_arma": 0,
     "Extra_armadura": 0,
     "Extra_armadura_armaduras": 0,
     "Extra_armadura_escudos": 0,
     "Extra_chakra": 0,
     "Extra_escuela": 0,
     "Extra_fusion": 0,
     "Extra_habilidad": 0
    },
    "Habilidades_otorgadas": [],
    "Id": 525,
    "Incarnum": {
     "Abre_chakra": false,
     "Capacidad": null,
     "Caracteristica_cd_fusion": null,
     "Descriptores_sin_alineamiento": [],
     "Divisor_nivel_moldeador": null,
     "Esencia_reserva": 0,
     "Esencia_reserva_moldeador": null,
     "Pg_por_dote": null,
     "Pg_por_esencia": 0,
     "Receptaculo": false,
     "Sustituye_caracteristica": null
    },
    "Manual": {
     "Id": 71,
     "Nombre": "El aventurero completo",
     "Pagina": 192
    },
    "Modificadores": {
     "Alcance": 0,
     "Armadura_natural": 0,
     "Ataque_base": 0,
     "Ca": 0,
     "Caracteristica": 0,
     "Carisma": 0,
     "Constitucion": 0,
     "Correr": 0,
     "Desprevenido": 0,
     "Destreza": 0,
     "Espacio": 0,
     "Excavar": 0,
     "Fortaleza": 0,
     "Fuerza": 0,
     "Habilidad": 0,
     "Iniciativa": 0,
     "Inteligencia": 0,
     "Nadar": 0,
     "Pg_a": 0,
     "Pg_a_n": 0,
     "Presa": 0,
     "Reflejos": 0,
     "Sabiduria": 0,
     "Toque": 0,
     "Trepar": 0,
     "Volar": 0,
     "Voluntad": 0
    },
    "Nombre": "Esquiva épica",
    "Normal": null,
    "Oficial": true,
    "Prerrequisitos": {
     "actitud_prohibido": [],
     "actitud_requerido": [],
     "alineamiento_prohibido": [],
     "alineamiento_requerido": [],
     "aptitud_especial": [],
     "ataque_base": [],
     "caracteristica": [
      {
       "Cantidad": 25,
       "Caracteristica": "Destreza",
       "Frase": "Destreza 25",
       "Id_caracteristica": 2,
       "Opcional": 0
      }
     ],
     "clase_especial": [
      {
       "Especial": "Evasión mejorada",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Evasión mejorada",
       "Id_especial": 57,
       "Id_extra": null,
       "Opcional": 0
      },
      {
       "Especial": "Rodar a la defensiva",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Rodar a la defensiva",
       "Id_especial": 2265,
       "Id_extra": null,
       "Opcional": 0
      }
     ],
     "competencia_arma": [],
     "competencia_armadura": [],
     "competencia_grupo_arma": [],
     "competencia_grupo_armadura": [],
     "conjuros_escuela": [],
     "dg": [],
     "dominio": [],
     "dote": [
      {
       "Dote_prerrequisito": "Esquiva",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Esquiva",
       "Id_dote_prerrequisito": 21,
       "Id_extra": 0,
       "Opcional": 0,
       "Repetido": 0
      }
     ],
     "escuela_nivel": [],
     "esencia_minima": [],
     "fusiones_minimas": [],
     "habilidad": [
      {
       "Cantidad": 30,
       "Extras": [],
       "Frase": "Piruetas 30 rangos",
       "Habilidad": "Piruetas",
       "Id_habilidad": 30,
       "Opcional": 0,
       "Requiere_extra": 0
      }
     ],
     "idioma": [],
     "lanz_espontaneo": [],
     "lanzador_arcano": [],
     "lanzador_divino": [],
     "lanzador_psionico": [],
     "lanzar_conjuros_arcanos_nivel": [],
     "lanzar_conjuros_divinos_nivel": [],
     "lanzar_poder_psionico_nivel": [],
     "limite_tipo_dote": [],
     "nivel": [],
     "nivel_de_clase": [],
     "nivel_max": [],
     "nivel_moldeador": [],
     "poder_seleccionar_companero": [],
     "poder_seleccionar_familiar": [],
     "raza": [],
     "region": [],
     "reserva_psionica": [],
     "salvacion_minimo": [],
     "sin_esencia": [],
     "tamano_maximo": [],
     "tamano_minimo": [],
     "tipo_criatura": [],
     "tipo_dote": [],
     "vinculo_chakra": [],
     "vinculos_minimos": []
    },
    "Repetible": 0,
    "Repetible_comb": 0,
    "Repetible_distinto_extra": 0,
    "Salvaciones_condicionales": [],
    "Tipos": [
     {
      "Id": 7,
      "Nombre": "Épica",
      "Usado": 1
     }
    ]
   },
   "id": 525,
   "nombre": "Esquiva épica"
  },
  {
   "cuerpo": {
    "dote": {
     "beneficio": "Puedes lanzar de forma espontánea conjuros de *convocar aliado natural* (de la lista de conjuros de tu clase) igual que un druida. Puedes usar esta aptitud un número total de veces por día igual a tu modificador de Sabiduría.",
     "comp_arma": false,
     "descripcion": "No especifica",
     "especial": "No especifica",
     "extra_arma": false,
     "extra_armadura_armaduras": false,
     "extra_armadura_escudos": false,
     "extra_escuela": false,
     "extra_habilidad": false,
     "id_manual": 15,
     "id_tipo": 1,
     "id_tipo2": 0,
     "nombre": "Convocación espontánea",
     "normal": "No especifica",
     "oficial": true,
     "pagina": 82,
     "repetible": false,
     "repetible_comb": false,
     "repetible_distinto_extra": false
    },
    "extras_disponibles": {
     "armaduras": [],
     "armas": [],
     "escuelas": [],
     "habilidades": []
    },
    "habilidades_otorgadas": [],
    "modificadores": {},
    "prerrequisitos": {
     "caracteristica": [
      {
       "Cantidad": 13,
       "Id_caracteristica": 5
      }
     ]
    }
   },
   "get": {
    "Beneficio": "Puedes lanzar de forma espontánea conjuros de *convocar aliado natural* (de la lista de conjuros de tu clase) igual que un druida. Puedes usar esta aptitud un número total de veces por día igual a tu modificador de Sabiduría.",
    "Comodin": null,
    "Comp_arma": 0,
    "Competencias_otorgadas": {
     "Armas": [],
     "Grupos_arma": []
    },
    "Cuenta_como": [],
    "Descripcion": null,
    "Especial": null,
    "Extras_de_todo_el_catalogo": {
     "Armaduras": false,
     "Armas": false,
     "Chakras": false,
     "Escuelas": false,
     "Fusiones": false,
     "Habilidades": false
    },
    "Extras_disponibles": {
     "Armaduras": [],
     "Armas": [],
     "Chakras": [],
     "Escuelas": [],
     "Fusiones": [],
     "Habilidades": []
    },
    "Extras_soportados": {
     "Extra_arma": 0,
     "Extra_armadura": 0,
     "Extra_armadura_armaduras": 0,
     "Extra_armadura_escudos": 0,
     "Extra_chakra": 0,
     "Extra_escuela": 0,
     "Extra_fusion": 0,
     "Extra_habilidad": 0
    },
    "Habilidades_otorgadas": [],
    "Id": 582,
    "Incarnum": {
     "Abre_chakra": false,
     "Capacidad": null,
     "Caracteristica_cd_fusion": null,
     "Descriptores_sin_alineamiento": [],
     "Divisor_nivel_moldeador": null,
     "Esencia_reserva": 0,
     "Esencia_reserva_moldeador": null,
     "Pg_por_dote": null,
     "Pg_por_esencia": 0,
     "Receptaculo": false,
     "Sustituye_caracteristica": null
    },
    "Manual": {
     "Id": 15,
     "Nombre": "El divino completo",
     "Pagina": 82
    },
    "Modificadores": {
     "Alcance": 0,
     "Armadura_natural": 0,
     "Ataque_base": 0,
     "Ca": 0,
     "Caracteristica": 0,
     "Carisma": 0,
     "Constitucion": 0,
     "Correr": 0,
     "Desprevenido": 0,
     "Destreza": 0,
     "Espacio": 0,
     "Excavar": 0,
     "Fortaleza": 0,
     "Fuerza": 0,
     "Habilidad": 0,
     "Iniciativa": 0,
     "Inteligencia": 0,
     "Nadar": 0,
     "Pg_a": 0,
     "Pg_a_n": 0,
     "Presa": 0,
     "Reflejos": 0,
     "Sabiduria": 0,
     "Toque": 0,
     "Trepar": 0,
     "Volar": 0,
     "Voluntad": 0
    },
    "Nombre": "Convocación espontánea",
    "Normal": null,
    "Oficial": true,
    "Prerrequisitos": {
     "actitud_prohibido": [],
     "actitud_requerido": [],
     "alineamiento_prohibido": [],
     "alineamiento_requerido": [],
     "aptitud_especial": [],
     "ataque_base": [],
     "caracteristica": [
      {
       "Cantidad": 13,
       "Caracteristica": "Sabiduría",
       "Frase": "Sabiduría 13",
       "Id_caracteristica": 5,
       "Opcional": 0
      }
     ],
     "clase_especial": [],
     "competencia_arma": [],
     "competencia_armadura": [],
     "competencia_grupo_arma": [],
     "competencia_grupo_armadura": [],
     "conjuros_escuela": [],
     "dg": [],
     "dominio": [],
     "dote": [],
     "escuela_nivel": [],
     "esencia_minima": [],
     "fusiones_minimas": [],
     "habilidad": [],
     "idioma": [],
     "lanz_espontaneo": [],
     "lanzador_arcano": [],
     "lanzador_divino": [],
     "lanzador_psionico": [],
     "lanzar_conjuros_arcanos_nivel": [],
     "lanzar_conjuros_divinos_nivel": [],
     "lanzar_poder_psionico_nivel": [],
     "limite_tipo_dote": [],
     "nivel": [],
     "nivel_de_clase": [],
     "nivel_max": [],
     "nivel_moldeador": [],
     "poder_seleccionar_companero": [],
     "poder_seleccionar_familiar": [],
     "raza": [],
     "region": [],
     "reserva_psionica": [],
     "salvacion_minimo": [],
     "sin_esencia": [],
     "tamano_maximo": [],
     "tamano_minimo": [],
     "tipo_criatura": [],
     "tipo_dote": [],
     "vinculo_chakra": [],
     "vinculos_minimos": []
    },
    "Repetible": 0,
    "Repetible_comb": 0,
    "Repetible_distinto_extra": 0,
    "Salvaciones_condicionales": [],
    "Tipos": [
     {
      "Id": 1,
      "Nombre": "General",
      "Usado": 1
     }
    ]
   },
   "id": 582,
   "nombre": "Convocación espontánea"
  },
  {
   "cuerpo": {
    "dote": {
     "beneficio": "Receptáculo: una vez al día le asignas esencia, que queda fija 24 horas. Por cada punto invertido, +1 introspectivo a Engañar, Escuchar, Averiguar intenciones, Avistar y Supervivencia contra tus enemigos predilectos, y +1 introspectivo al daño con armas contra ellos. Suma 1 punto a tu reserva de esencia.",
     "comp_arma": false,
     "descripcion": "Tu odio a los enemigos predilectos asoma como un destello azul en la mirada.",
     "especial": "No especifica",
     "extra_arma": false,
     "extra_armadura_armaduras": false,
     "extra_armadura_escudos": false,
     "extra_escuela": false,
     "extra_habilidad": false,
     "id_manual": 31,
     "id_tipo": 37,
     "id_tipo2": 0,
     "nombre": "Enemistad azur",
     "normal": "No especifica",
     "oficial": true,
     "pagina": 34,
     "repetible": false,
     "repetible_comb": false,
     "repetible_distinto_extra": false
    },
    "extras_disponibles": {
     "armaduras": [],
     "armas": [],
     "escuelas": [],
     "habilidades": []
    },
    "habilidades_otorgadas": [],
    "modificadores": {},
    "prerrequisitos": {
     "caracteristica": [
      {
       "Cantidad": 13,
       "Id_caracteristica": 3
      }
     ],
     "clase_especial": [
      {
       "Id_especial": 38,
       "Id_extra": 0
      }
     ]
    }
   },
   "get": {
    "Beneficio": "Receptáculo: una vez al día le asignas esencia, que queda fija 24 horas. Por cada punto invertido, +1 introspectivo a Engañar, Escuchar, Averiguar intenciones, Avistar y Supervivencia contra tus enemigos predilectos, y +1 introspectivo al daño con armas contra ellos. Suma 1 punto a tu reserva de esencia.",
    "Comodin": null,
    "Comp_arma": 0,
    "Competencias_otorgadas": {
     "Armas": [],
     "Grupos_arma": []
    },
    "Cuenta_como": [],
    "Descripcion": "Tu odio a los enemigos predilectos asoma como un destello azul en la mirada.",
    "Especial": null,
    "Extras_de_todo_el_catalogo": {
     "Armaduras": false,
     "Armas": false,
     "Chakras": false,
     "Escuelas": false,
     "Fusiones": false,
     "Habilidades": false
    },
    "Extras_disponibles": {
     "Armaduras": [],
     "Armas": [],
     "Chakras": [],
     "Escuelas": [],
     "Fusiones": [],
     "Habilidades": []
    },
    "Extras_soportados": {
     "Extra_arma": 0,
     "Extra_armadura": 0,
     "Extra_armadura_armaduras": 0,
     "Extra_armadura_escudos": 0,
     "Extra_chakra": 0,
     "Extra_escuela": 0,
     "Extra_fusion": 0,
     "Extra_habilidad": 0
    },
    "Habilidades_otorgadas": [],
    "Id": 1084,
    "Incarnum": {
     "Abre_chakra": false,
     "Capacidad": null,
     "Caracteristica_cd_fusion": null,
     "Descriptores_sin_alineamiento": [],
     "Divisor_nivel_moldeador": null,
     "Esencia_reserva": 1,
     "Esencia_reserva_moldeador": null,
     "Pg_por_dote": null,
     "Pg_por_esencia": 0,
     "Receptaculo": true,
     "Sustituye_caracteristica": null
    },
    "Manual": {
     "Id": 31,
     "Nombre": "Magia del incarnum",
     "Pagina": 34
    },
    "Modificadores": {
     "Alcance": 0,
     "Armadura_natural": 0,
     "Ataque_base": 0,
     "Ca": 0,
     "Caracteristica": 0,
     "Carisma": 0,
     "Constitucion": 0,
     "Correr": 0,
     "Desprevenido": 0,
     "Destreza": 0,
     "Espacio": 0,
     "Excavar": 0,
     "Fortaleza": 0,
     "Fuerza": 0,
     "Habilidad": 0,
     "Iniciativa": 0,
     "Inteligencia": 0,
     "Nadar": 0,
     "Pg_a": 0,
     "Pg_a_n": 0,
     "Presa": 0,
     "Reflejos": 0,
     "Sabiduria": 0,
     "Toque": 0,
     "Trepar": 0,
     "Volar": 0,
     "Voluntad": 0
    },
    "Nombre": "Enemistad azur",
    "Normal": null,
    "Oficial": true,
    "Prerrequisitos": {
     "actitud_prohibido": [],
     "actitud_requerido": [],
     "alineamiento_prohibido": [],
     "alineamiento_requerido": [],
     "aptitud_especial": [],
     "ataque_base": [],
     "caracteristica": [
      {
       "Cantidad": 13,
       "Caracteristica": "Constitución",
       "Frase": "Constitución 13",
       "Id_caracteristica": 3,
       "Opcional": 0
      }
     ],
     "clase_especial": [
      {
       "Especial": "Enemigo predilecto",
       "Extra": null,
       "Extra_comodin": null,
       "Frase": "Enemigo predilecto",
       "Id_especial": 38,
       "Id_extra": null,
       "Opcional": 0
      }
     ],
     "competencia_arma": [],
     "competencia_armadura": [],
     "competencia_grupo_arma": [],
     "competencia_grupo_armadura": [],
     "conjuros_escuela": [],
     "dg": [],
     "dominio": [],
     "dote": [],
     "escuela_nivel": [],
     "esencia_minima": [],
     "fusiones_minimas": [],
     "habilidad": [],
     "idioma": [],
     "lanz_espontaneo": [],
     "lanzador_arcano": [],
     "lanzador_divino": [],
     "lanzador_psionico": [],
     "lanzar_conjuros_arcanos_nivel": [],
     "lanzar_conjuros_divinos_nivel": [],
     "lanzar_poder_psionico_nivel": [],
     "limite_tipo_dote": [],
     "nivel": [],
     "nivel_de_clase": [],
     "nivel_max": [],
     "nivel_moldeador": [],
     "poder_seleccionar_companero": [],
     "poder_seleccionar_familiar": [],
     "raza": [],
     "region": [],
     "reserva_psionica": [],
     "salvacion_minimo": [],
     "sin_esencia": [],
     "tamano_maximo": [],
     "tamano_minimo": [],
     "tipo_criatura": [],
     "tipo_dote": [],
     "vinculo_chakra": [],
     "vinculos_minimos": []
    },
    "Repetible": 0,
    "Repetible_comb": 0,
    "Repetible_distinto_extra": 0,
    "Salvaciones_condicionales": [],
    "Tipos": [
     {
      "Id": 37,
      "Nombre": "Incarnum",
      "Usado": 1
     }
    ]
   },
   "id": 1084,
   "nombre": "Enemistad azur"
  },
  {
   "cuerpo": {
    "dote": {
     "beneficio": "Receptáculo: una vez al día le asignas esencia, que queda fija 24 horas. Pagas con esencia el ajuste de nivel de una dote metamágica que conozcas (mínimo 1 punto) para aplicarla a conjuros que sepas, y tengas preparados si preparas: la próxima vez que lances cada uno tendrá ese efecto sin subir de nivel ni de tiempo de lanzamiento. Puedes afectar tantos conjuros como te permitan tu esencia y tu capacidad, y la esencia vuelve a la reserva al lanzarlos. Suma 1 punto a tu reserva de esencia.",
     "comp_arma": false,
     "descripcion": "Tus manos brillan de azul oscuro al lanzar el conjuro alterado.",
     "especial": "No especifica",
     "extra_arma": false,
     "extra_armadura_armaduras": false,
     "extra_armadura_escudos": false,
     "extra_escuela": false,
     "extra_habilidad": false,
     "id_manual": 31,
     "id_tipo": 37,
     "id_tipo2": 0,
     "nombre": "Metamagia de medianoche",
     "normal": "No especifica",
     "oficial": true,
     "pagina": 39,
     "repetible": false,
     "repetible_comb": false,
     "repetible_distinto_extra": false
    },
    "extras_disponibles": {
     "armaduras": [],
     "armas": [],
     "escuelas": [],
     "habilidades": []
    },
    "habilidades_otorgadas": [],
    "modificadores": {},
    "prerrequisitos": {
     "caracteristica": [
      {
       "Cantidad": 13,
       "Id_caracteristica": 3
      }
     ],
     "lanzar_conjuros_arcanos_nivel": [
      {
       "Nivel": 1,
       "Opcional": 90
      }
     ],
     "lanzar_conjuros_divinos_nivel": [
      {
       "Nivel": 1,
       "Opcional": 90
      }
     ],
     "tipo_dote": [
      {
       "Id_tipo": 4
      }
     ]
    }
   },
   "get": {
    "Beneficio": "Receptáculo: una vez al día le asignas esencia, que queda fija 24 horas. Pagas con esencia el ajuste de nivel de una dote metamágica que conozcas (mínimo 1 punto) para aplicarla a conjuros que sepas, y tengas preparados si preparas: la próxima vez que lances cada uno tendrá ese efecto sin subir de nivel ni de tiempo de lanzamiento. Puedes afectar tantos conjuros como te permitan tu esencia y tu capacidad, y la esencia vuelve a la reserva al lanzarlos. Suma 1 punto a tu reserva de esencia.",
    "Comodin": null,
    "Comp_arma": 0,
    "Competencias_otorgadas": {
     "Armas": [],
     "Grupos_arma": []
    },
    "Cuenta_como": [],
    "Descripcion": "Tus manos brillan de azul oscuro al lanzar el conjuro alterado.",
    "Especial": null,
    "Extras_de_todo_el_catalogo": {
     "Armaduras": false,
     "Armas": false,
     "Chakras": false,
     "Escuelas": false,
     "Fusiones": false,
     "Habilidades": false
    },
    "Extras_disponibles": {
     "Armaduras": [],
     "Armas": [],
     "Chakras": [],
     "Escuelas": [],
     "Fusiones": [],
     "Habilidades": []
    },
    "Extras_soportados": {
     "Extra_arma": 0,
     "Extra_armadura": 0,
     "Extra_armadura_armaduras": 0,
     "Extra_armadura_escudos": 0,
     "Extra_chakra": 0,
     "Extra_escuela": 0,
     "Extra_fusion": 0,
     "Extra_habilidad": 0
    },
    "Habilidades_otorgadas": [],
    "Id": 1112,
    "Incarnum": {
     "Abre_chakra": false,
     "Capacidad": null,
     "Caracteristica_cd_fusion": null,
     "Descriptores_sin_alineamiento": [],
     "Divisor_nivel_moldeador": null,
     "Esencia_reserva": 1,
     "Esencia_reserva_moldeador": null,
     "Pg_por_dote": null,
     "Pg_por_esencia": 0,
     "Receptaculo": true,
     "Sustituye_caracteristica": null
    },
    "Manual": {
     "Id": 31,
     "Nombre": "Magia del incarnum",
     "Pagina": 39
    },
    "Modificadores": {
     "Alcance": 0,
     "Armadura_natural": 0,
     "Ataque_base": 0,
     "Ca": 0,
     "Caracteristica": 0,
     "Carisma": 0,
     "Constitucion": 0,
     "Correr": 0,
     "Desprevenido": 0,
     "Destreza": 0,
     "Espacio": 0,
     "Excavar": 0,
     "Fortaleza": 0,
     "Fuerza": 0,
     "Habilidad": 0,
     "Iniciativa": 0,
     "Inteligencia": 0,
     "Nadar": 0,
     "Pg_a": 0,
     "Pg_a_n": 0,
     "Presa": 0,
     "Reflejos": 0,
     "Sabiduria": 0,
     "Toque": 0,
     "Trepar": 0,
     "Volar": 0,
     "Voluntad": 0
    },
    "Nombre": "Metamagia de medianoche",
    "Normal": null,
    "Oficial": true,
    "Prerrequisitos": {
     "actitud_prohibido": [],
     "actitud_requerido": [],
     "alineamiento_prohibido": [],
     "alineamiento_requerido": [],
     "aptitud_especial": [],
     "ataque_base": [],
     "caracteristica": [
      {
       "Cantidad": 13,
       "Caracteristica": "Constitución",
       "Frase": "Constitución 13",
       "Id_caracteristica": 3,
       "Opcional": 0
      }
     ],
     "clase_especial": [],
     "competencia_arma": [],
     "competencia_armadura": [],
     "competencia_grupo_arma": [],
     "competencia_grupo_armadura": [],
     "conjuros_escuela": [],
     "dg": [],
     "dominio": [],
     "dote": [],
     "escuela_nivel": [],
     "esencia_minima": [],
     "fusiones_minimas": [],
     "habilidad": [],
     "idioma": [],
     "lanz_espontaneo": [],
     "lanzador_arcano": [],
     "lanzador_divino": [],
     "lanzador_psionico": [],
     "lanzar_conjuros_arcanos_nivel": [
      {
       "Frase": "Lanzar conjuros arcanos de nivel 1",
       "Nivel": 1,
       "Opcional": 90
      }
     ],
     "lanzar_conjuros_divinos_nivel": [
      {
       "Frase": "Lanzar conjuros divinos de nivel 1",
       "Nivel": 1,
       "Opcional": 90
      }
     ],
     "lanzar_poder_psionico_nivel": [],
     "limite_tipo_dote": [],
     "nivel": [],
     "nivel_de_clase": [],
     "nivel_max": [],
     "nivel_moldeador": [],
     "poder_seleccionar_companero": [],
     "poder_seleccionar_familiar": [],
     "raza": [],
     "region": [],
     "reserva_psionica": [],
     "salvacion_minimo": [],
     "sin_esencia": [],
     "tamano_maximo": [],
     "tamano_minimo": [],
     "tipo_criatura": [],
     "tipo_dote": [
      {
       "Frase": "Una dote de tipo metamágica",
       "Id_tipo_dote": 4,
       "Opcional": 0,
       "Tipo_dote": "Metamágica",
       "Tipo_dote_comodin": null
      }
     ],
     "vinculo_chakra": [],
     "vinculos_minimos": []
    },
    "Repetible": 0,
    "Repetible_comb": 0,
    "Repetible_distinto_extra": 0,
    "Salvaciones_condicionales": [],
    "Tipos": [
     {
      "Id": 37,
      "Nombre": "Incarnum",
      "Usado": 1
     }
    ]
   },
   "id": 1112,
   "nombre": "Metamagia de medianoche"
  }
 ]
};
