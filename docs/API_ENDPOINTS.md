# API Endpoints (Programa de fichas - Backend)

Fecha de generacion: 2026-02-09

Resumen
- Base URL (local): `http://127.0.0.1:5000`
- Prefijos registrados: `/verify`, `/personajes`, `/razas`, `/razas/raciales`, `/subtipos`, `/campanas`, `/tramas`, `/subtramas`, `/manuales`, `/manuales/asociados`, `/tiposCriatura`, `/rasgos`, `/conjuros`, `/escuelas`, `/disciplinas`, `/alineamientos`, `/habilidades`, `/idiomas`, `/dominios`, `/ambitos`, `/pabellones`, `/deidades`, `/dotes`, `/clases`, `/clases/habilidades`, `/plantillas`, `/ventajas`, `/desventajas`
- Autenticacion: no hay autenticacion en el backend.
- Content-Type esperado: `application/json`
- CORS habilitado para: `https://rol.yosiftware.es/`, `https://www.rol.yosiftware.es/`, `https://62.43.222.28`, `http://192.168.0.34`
- Metodos usados: `GET`, `POST`, `OPTIONS` (preflight en varias rutas).
- Errores: la mayoria de controladores retorna el error de `pyodbc` sin estandarizar.

Lista de endpoints
| Metodo | Path | Descripcion | Estado |
| --- | --- | --- | --- |
| GET | /verify | Verifica conexion DB | Implementado |
| GET | /personajes | Lista detallada de personajes | Implementado |
| GET | /personajes/simplificados | Lista simplificada de personajes | Implementado |
| POST | /personajes/add | Crear personaje | No implementado (funcion `pass`) |
| GET | /razas | Lista completa de razas | Implementado |
| GET | /razas/raciales | Lista de raciales | Implementado |
| GET | /razas/raciales/<id_racial> | Racial por id | Implementado |
| GET | /subtipos | Lista de subtipos | Implementado |
| GET | /subtipos/<id_subtipo> | Subtipo completo por id | Implementado |
| POST | /razas/add | Crear raza | No implementado (funcion `pass`) |
| GET | /campanas | Lista de campanas | Implementado |
| POST | /campanas/add | Crear campana | No implementado (funcion `pass`) |
| GET | /tramas | Lista de tramas | Implementado |
| GET | /tramas/campana/<id_campana> | Tramas por campana | Implementado |
| POST | /tramas/add | Crear trama | No implementado (funcion `pass`) |
| GET | /subtramas | Lista de subtramas | Implementado |
| GET | /subtramas/trama/<id_trama> | Subtramas por trama | Implementado |
| POST | /subtramas/add | Crear subtrama | No implementado (funcion `pass`) |
| GET | /manuales | Lista de manuales | Implementado |
| GET | /manuales/<id_manual> | Manual por id | Implementado |
| GET | /manuales/asociados | Lista de manuales con asociados | Implementado |
| GET | /manuales/asociados/<id_manual> | Manual con asociados por id | Implementado |
| POST | /manuales/add | Crear manual | No implementado (funcion `pass`) |
| GET | /tiposCriatura | Lista de tipos de criatura | Implementado |
| POST | /tiposCriatura/add | Crear tipo de criatura | No implementado (funcion `pass`) |
| GET | /rasgos | Lista de rasgos | Implementado |
| POST | /rasgos/add | Crear rasgo | No implementado (funcion `pass`) |
| GET | /conjuros | Lista de conjuros | Implementado |
| POST | /conjuros/add | Crear conjuro | No implementado (funcion `pass`) |
| GET | /escuelas | Lista de escuelas de conjuros | Implementado |
| GET | /disciplinas | Lista de disciplinas de conjuros | Implementado |
| GET | /alineamientos | Lista de alineamientos | Implementado |
| GET | /alineamientos/combinaciones | Lista semantica de combinaciones de alineamiento | Implementado |
| GET | /alineamientos/basicos | Lista de alineamientos basicos | Implementado |
| GET | /alineamientos/prioridades | Lista de prioridades de alineamiento | Implementado |
| GET | /alineamientos/preferencia-ley | Lista de preferencias de ley | Implementado |
| GET | /alineamientos/preferencia-moral | Lista de preferencias de moral | Implementado |
| GET | /habilidades | Lista de habilidades basicas (id > 0) | Implementado |
| GET | /habilidades/custom | Lista de habilidades custom (id > 0) | Implementado |
| GET | /idiomas | Lista de idiomas | Implementado |
| GET | /dominios | Lista de dominios | Implementado |
| GET | /dominios/<id_dominio> | Dominio por id | Implementado |
| GET | /ambitos | Lista de ambitos de poder | Implementado |
| GET | /ambitos/<id_ambito> | Ambito por id | Implementado |
| GET | /pabellones | Lista de pabellones | Implementado |
| GET | /pabellones/<id_pabellon> | Pabellon por id | Implementado |
| GET | /deidades | Lista completa de deidades | Implementado |
| GET | /deidades/<id_deidad> | Deidad por id | Implementado |
| GET | /deidades/pabellon/<id_pabellon> | Deidades por pabellon | Implementado |
| GET | /deidades/alineamiento/<id_alineamiento> | Deidades por alineamiento | Implementado |
| GET | /dotes | Lista de dotes completas | Implementado |
| GET | /dotes/<id_dote> | Dote completa por id | Implementado |
| GET | /ventajas | Lista de ventajas (coste negativo) | Implementado |
| GET | /ventajas/<id_ventaja> | Ventaja por id (coste negativo) | Implementado |
| GET | /desventajas | Lista de desventajas (coste positivo) | Implementado |
| GET | /desventajas/<id_ventaja> | Desventaja por id (coste positivo) | Implementado |
| GET | /clases | Lista completa de clases | Implementado |
| GET | /clases/<id_clase> | Clase completa por id | Implementado |
| GET | /clases/habilidades | Lista de habilidades claseas (especiales) | Implementado |
| GET | /clases/habilidades/<id_especial> | Habilidad clasea (especial) por id | Implementado |
| GET | /plantillas | Lista de plantillas | Implementado |
| GET | /plantillas/<id_plantilla> | Plantilla por id | Implementado |
| POST | /plantillas/add | Crear plantilla | No implementado (funcion `pass`) |

Notas generales
- Las respuestas suelen ser arrays JSON.
- En varios campos se usan listas serializadas como string con separador `| `.
- No hay paginacion en la API.
- Existen filtros puntuales en `GET /deidades/pabellon/<id_pabellon>` y `GET /deidades/alineamiento/<id_alineamiento>`.

Endpoint: GET /verify
Respuesta 200
```json
{
  "status": "success",
  "message": "Conexion establecida con exito"
}
```
Respuesta 500 (ejemplo)
```json
{
  "No pudo establecerse conexion con la base de datos": "<detalle pyodbc>"
}
```

Endpoint: GET /personajes
Respuesta: array de `PersonajeDetalle`

PersonajeDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id del personaje |
| n | string | Nombre |
| dcp | string | Descripcion de personalidad |
| dh | string | Descripcion de historia |
| a | number | Ataque base |
| ca | number | CA total (calculada) |
| an | number | Armadura natural |
| cd | number | CA por desvio |
| cv | number | Suma de modificadores de CA (varios) |
| ra | object | `RazaSimplificada` |
| tc | object | `TipoCriaturaDetalle` |
| f | number | Fuerza |
| mf | number | Modificador de Fuerza |
| d | number | Destreza |
| md | number | Modificador de Destreza |
| co | number | Constitucion |
| mco | number | Modificador de Constitucion |
| int | number | Inteligencia |
| mint | number | Modificador de Inteligencia |
| s | number | Sabiduria |
| ms | number | Modificador de Sabiduria |
| car | number | Carisma |
| mcar | number | Modificador de Carisma |
| de | string | Deidad |
| ali | string | Alineamiento basico (nombre) |
| g | string | Genero |
| ncam | string | Campana |
| ntr | string | Trama |
| nst | string | Subtrama |
| v | number | Puntos de golpe |
| cor | number | Velocidad correr |
| na | number | Velocidad nadar |
| vo | number | Velocidad volar |
| t | number | Velocidad trepar |
| e | number | Velocidad escalar |
| o | boolean | Oficial (true=oficial, false=homebrew) |
| dg | number | DGS extra totales |
| cla | string | Lista serializada "Clase;Nivel" separada por `| ` |
| dom | string | Lista serializada de dominios separada por `| ` |
| stc | string | Lista serializada de subtipos separada por `| ` |
| subtipos | array | Lista de `SubtipoRef` (`{ Id, Nombre }`) |
| pla | array | Lista de `PlantillaPersonaje` |
| con | array | Lista de `ConjuroDetalle` |
| esp | array | Lista de especiales (nombre) |
| espX | array | Lista de extras por especial (paralela a `esp`) |
| rac | array | Lista de `RacialDetalle` (contrato ampliado) |
| hab | array | Ids de habilidades (paralela al resto de `hab*`) |
| habN | array | Nombres de habilidades |
| habC | array | Booleano, es habilidad de clase |
| habCa | array | Caracteristica asociada (solo custom; vacio en las no custom) |
| habMc | array | Modificador de caracteristica |
| habR | array | Rangos |
| habRv | array | Rangos varios |
| habX | array | Extra (solo habilidades no custom) |
| habV | array | Modificadores varios |
| habCu | array | Booleano, habilidad custom |
| dotes | array | Lista de `DoteContextual` |
| ve | string | Lista serializada de ventajas separada por `| ` |
| idi | array | Lista de `Idioma` |
| sor | array | Lista de `SortilegioPersonaje` |
| ju | string | Jugador |
| pgl | number | PGS (lic) |
| ini_v | array | Modificadores de iniciativa: `{ Valor, Origen }` |
| pr_v | array | Modificadores de presa: `{ Valor, Origen }` |
| edad | number | Edad |
| alt | number | Altura |
| peso | number | Peso |
| salv | object | `Salvaciones` |
| rds | array | Lista de strings "RD;Origen" |
| rcs | array | Lista de strings "RC;Origen" |
| res | array | Lista de strings "RE;Origen" |
| ccl | number | Carga ligera |
| ccm | number | Carga media |
| ccp | number | Carga pesada |
| espa | string | Escuela arcana (nombre) |
| espan | string | Escuela arcana (nombre esp) |
| espp | string | Disciplina psi (nombre) |
| esppn | string | Disciplina psi (nombre esp) |
| disp | string | Disciplina prohibida (nombre) |
| ecp | string | Lista serializada de escuelas prohibidas separada por `| ` |

Endpoint: GET /personajes/simplificados
Respuesta: array de `PersonajeSimplificado`

PersonajeSimplificado
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id del personaje |
| n | string | Nombre |
| r | object | `RazaSimplificada` |
| c | string | Lista serializada "Clase Nivel" separada por `, ` |
| p | string | Descripcion de personalidad |
| co | string | Descripcion de historia |
| ca | string | Campana |
| t | string | Trama |
| s | string | Subtrama |
| a | number | Archivado (0/1) |

Endpoint: GET /razas
Respuesta: array de `RazaCompleta`

RazaCompleta
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id de raza |
| n | string | Nombre |
| m | object | Modificadores: { Fuerza, Destreza, Constitucion, Inteligencia, Sabiduria, Carisma } |
| aju | number | Ajuste de nivel |
| ma | string | Manual (con pagina) |
| c | string | Clase predilecta |
| o | boolean | Oficial (true=oficial, false=homebrew) |
| an | string | Ataques naturales |
| t | object | Tamano: { Id, Nombre, Modificador, Modificador_presa } |
| dg | object | DGS adicionales (ver abajo) |
| rd | string | Reduccion de dano |
| rc | string | Resistencia a conjuros |
| re | string | Resistencia elemental |
| he | number | Heredada (0/1) |
| mu | number | Mutada (valor DB) |
| Mutada | boolean | Flag enriquecido de raza mutada (true/false) |
| tmd | number | Tamano mutacion dependiente (0/1) |
| pr | object | Prerrequisitos (ver abajo) |
| prf | object | Flags de familias de prerrequisitos (ver abajo) |
| Prerrequisitos_flags | object | Alias de `prf` para compatibilidad |
| Mutacion | object | Resumen semantico de mutacion (ver abajo) |
| ant | number | Armadura natural |
| va | number | Varios armadura |
| co | number | Correr |
| na | number | Nadar |
| vo | number | Volar |
| man | object | Maniobrabilidad |
| tr | number | Trepar |
| es | number | Escalar |
| ari | number | Altura rango inferior |
| ars | number | Altura rango superior |
| pri | number | Peso rango inferior |
| prs | number | Peso rango superior |
| ea | number | Edad adulto |
| em | number | Edad mediana |
| ev | number | Edad viejo |
| eve | number | Edad venerable |
| esp | number | Espacio |
| alc | number | Alcance |
| tc | object | `TipoCriaturaDetalle` |
| sor | array | Lista de `SortilegioRaza` |
| ali | object | `AlineamientoDetalle` |
| dotes | array | Lista de `DoteContextual` |
| rac | array | Lista de `RacialDetalle` (contrato ampliado) |
| Habilidades | object | Habilidades que la raza otorga directamente: `{ Base[], Custom[] }` (`Base[]` incluye `Cantidad` y `Varios`; `Custom[]` incluye `Cantidad`) |
| Idiomas | array | Idiomas que el personaje obtiene automaticamente por pertenecer a esta raza (`IdiomaDetalle[]`) |
| subtipos | array | Lista de `SubtipoRef` (`{ Id, Nombre }`) |

DGS adicionales (RazaCompleta.dg)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Cantidad | number | Cantidad de dados |
| Dado | string | Tipo de dado |
| Tipo_criatura | string | Tipo de criatura asociado |
| Ataque_base | number | Ataque base extra |
| Dotes_extra | number | Dotes extra |
| Puntos_habilidad | number | Puntos de habilidad |
| Multiplicador_puntos_habilidad | number | Multiplicador |
| Fortaleza | number | Bonificacion fortaleza |
| Reflejos | number | Bonificacion reflejos |
| Voluntad | number | Bonificacion voluntad |

Prerrequisitos (RazaCompleta.pr)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| actitud_prohibido | array | Items: { id_actitud, actitud, opcional } |
| actitud_requerido | array | Items: { id_actitud, actitud, opcional } |
| alineamiento_prohibido | array | Items: { id_alineamiento, id_alineamiento_basico, alineamiento_basico, id_ley, ley, id_moral, moral } |
| alineamiento_requerido | array | Items: { id_alineamiento, id_alineamiento_basico, alineamiento_basico, id_ley, ley, id_moral, moral } |
| tipo_criatura | array | Items: { id_tipo_criatura, tipo_criatura, opcional } |

Prerrequisitos flags (RazaCompleta.prf / RazaCompleta.Prerrequisitos_flags)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| actitud_prohibido | boolean | Hay prerequisitos de actitud prohibida en `pres_r` |
| actitud_requerido | boolean | Hay prerequisitos de actitud requerida en `pres_r` |
| alineamiento_prohibido | boolean | Hay prerequisitos de alineamiento prohibido en `pres_r` |
| alineamiento_requerido | boolean | Hay prerequisitos de alineamiento requerido en `pres_r` |
| tipo_criatura | boolean | Hay prerequisitos de tipo de criatura en `pres_r` |

Mutacion (RazaCompleta.Mutacion)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Es_mutada | boolean | Estado final de raza mutada |
| Tamano_dependiente | boolean | El tamano depende de la mutacion |
| Tiene_prerrequisitos | boolean | La raza declara prerrequisitos |
| Heredada | boolean | La raza es heredada |

Endpoint: GET /subtipos
Respuesta: array de `SubtipoResumen`

SubtipoResumen
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de subtipo |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Manual | object | { Id, Nombre, Pagina } |
| Heredada | boolean | Si el subtipo es heredado |
| Oficial | boolean | Oficial (derivado de manual) |
| Idiomas | array | Idiomas que el personaje obtiene automaticamente por tener este subtipo (`IdiomaDetalle[]`) |

Endpoint: GET /subtipos/<id_subtipo>
Respuesta: objeto `SubtipoDetalle`
Respuesta 404
```json
{
  "error": "Subtipo no encontrado",
  "id_subtipo": 123
}
```

SubtipoDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de subtipo |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Manual | object | { Id, Nombre, Pagina } |
| Heredada | boolean | Si el subtipo es heredado |
| Oficial | boolean | Oficial (derivado de manual) |
| Modificadores_caracteristicas | object | { Fuerza, Destreza, Constitucion, Inteligencia, Sabiduria, Carisma } |
| Minimos_caracteristicas | object | { Fuerza, Destreza, Constitucion, Inteligencia, Sabiduria, Carisma } |
| Ajuste_nivel | number | Ajuste de nivel |
| Presa | number | Modificador a presa |
| Fortaleza | number | Modificador de fortaleza |
| Reflejos | number | Modificador de reflejos |
| Voluntad | number | Modificador de voluntad |
| Iniciativa | number | Modificador de iniciativa |
| Ataque_base | number | Modificador de ataque base |
| Ca | string | Modificador de CA |
| Rd | string | Reduccion de dano |
| Rc | string | Resistencia a conjuros |
| Re | string | Resistencia elemental |
| Cd | string | Modificador de CD |
| Tesoro | string | Ajuste de tesoro |
| Movimientos | object | { Correr, Nadar, Volar, Trepar, Escalar } |
| Maniobrabilidad | object | Mismo shape de `PlantillaDetalle.Maniobrabilidad` |
| Alineamiento | object | `AlineamientoDetalle` |
| Idiomas | array | Idiomas que el personaje obtiene automaticamente por tener este subtipo (`IdiomaDetalle[]`) |
| Dotes | array | Lista de `DoteContextual` |
| Habilidades | object | { Base: [], Custom: [] } |
| Sortilegas | array | Lista de sortilegas `{ Conjuro, Nivel_lanzador, Usos_diarios }` |
| Rasgos | array | Lista de `RasgoTipo` |
| Plantillas | array | Lista de `ReferenciaCorta` |

Endpoint: GET /campanas
Respuesta
```json
[
  { "i": 1, "n": "Nombre de campana" }
]
```

Endpoint: GET /tramas
Respuesta
```json
[
  { "i": 1, "n": "Nombre de trama" }
]
```

Endpoint: GET /tramas/campana/<id_campana>
Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_campana | number | Id de campana |

Respuesta igual a `/tramas`.

Endpoint: GET /subtramas
Respuesta
```json
[
  { "i": 1, "n": "Nombre de subtrama" }
]
```

Endpoint: GET /subtramas/trama/<id_trama>
Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_trama | number | Id de trama |

Respuesta igual a `/subtramas`.

Endpoint: GET /manuales
Respuesta: array de `ManualDetalle`

ManualDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Incluye_dotes | number | El manual contiene definiciones de dotes (0/1) |
| Incluye_conjuros | number | El manual contiene definiciones de conjuros (0/1) |
| Incluye_plantillas | number | El manual contiene definiciones de plantillas (0/1) |
| Incluye_monstruos | number | El manual contiene definiciones de monstruos (0/1) |
| Incluye_razas | number | El manual contiene definiciones de razas (0/1) |
| Incluye_clases | number | El manual contiene definiciones de clases (0/1) |
| Incluye_tipos | number | El manual contiene definiciones de tipos (0/1) |
| Incluye_subtipos | number | El manual contiene definiciones de subtipos (0/1) |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |

Endpoint: GET /manuales/<id_manual>
Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_manual | number | Id de manual |

Respuesta: objeto `ManualDetalle`

Respuesta 404 (ejemplo)
```json
{
  "error": "Manual no encontrado",
  "id_manual": 123
}
```

Endpoint: GET /manuales/asociados
Respuesta: array de `ManualAsociadoDetalle`

Endpoint: GET /manuales/asociados/<id_manual>
Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_manual | number | Id de manual |

Respuesta: objeto `ManualAsociadoDetalle`

Respuesta 404 (ejemplo)
```json
{
  "error": "Manual no encontrado",
  "id_manual": 123
}
```

ManualAsociadoDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Incluye_dotes | number | El manual contiene definiciones de dotes (0/1) |
| Incluye_conjuros | number | El manual contiene definiciones de conjuros (0/1) |
| Incluye_plantillas | number | El manual contiene definiciones de plantillas (0/1) |
| Incluye_monstruos | number | El manual contiene definiciones de monstruos (0/1) |
| Incluye_razas | number | El manual contiene definiciones de razas (0/1) |
| Incluye_clases | number | El manual contiene definiciones de clases (0/1) |
| Incluye_tipos | number | El manual contiene definiciones de tipos (0/1) |
| Incluye_subtipos | number | El manual contiene definiciones de subtipos (0/1) |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |
| Asociados | object | Colecciones resumidas asociadas al manual |

Asociados (ManualAsociadoDetalle.Asociados)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Dotes | array | Lista de `ReferenciaCorta` |
| Conjuros | array | Lista de `ReferenciaCorta` |
| Plantillas | array | Lista de `ReferenciaCorta` |
| Monstruos | array | Lista de `ReferenciaCorta` |
| Razas | array | Lista de `ReferenciaCorta` |
| Clases | array | Lista de `ReferenciaCorta` |
| Tipos | array | Lista de `ReferenciaCorta` |
| Subtipos | array | Lista de `ReferenciaCorta` |

ReferenciaCorta
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de la entidad |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion corta (si no aplica, vacio) |

SubtipoRef
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de subtipo |
| Nombre | string | Nombre |

Endpoint: GET /tiposCriatura
Respuesta: array de `TipoCriaturaResumen`

TipoCriaturaResumen
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id |
| n | string | Nombre |
| d | string | Descripcion |
| ma | string | Manual (con pagina) |
| itd | number | Id tipo de dado |
| ntd | string | Nombre tipo de dado |
| ia | number | Id ataque |
| ift | number | Id fortaleza |
| ir | number | Id reflejos |
| iv | number | Id voluntad |
| iph | number | Id puntos habilidad |
| c | number | Come (0/1) |
| r | number | Respira (0/1) |
| du | number | Duerme (0/1) |
| cr | number | Recibe criticos (0/1) |
| f | number | Puede ser flanqueado (0/1) |
| pc | number | Pierde constitucion (0/1) |
| li | number | Limite inteligencia |
| t | string | Tesoro |
| ial | number | Id alineamiento |
| ra | array | Rasgos: lista de `RasgoDetalle` |
| o | boolean | Oficial (true=oficial, false=homebrew) |

Endpoint: GET /rasgos
Respuesta: array de `RasgoDetalle`

RasgoDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id |
| n | string | Nombre |
| d | string | Descripcion |
| o | boolean | Oficial (true=oficial, false=homebrew) |

Endpoint: GET /conjuros
Respuesta: array de `ConjuroResumen`

ConjuroResumen
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id |
| n | string | Nombre |
| d | string | Descripcion |
| tl | string | Tiempo de lanzamiento |
| ac | string | Alcance |
| es | object | `EscuelaConjuro` |
| di | object | `DisciplinaConjuro` (filtrada por subdisciplina del conjuro) |
| m | string | Manual (con pagina) |
| ob | string | Objetivo |
| ef | string | Efecto |
| ar | string | Area |
| arc | number | Arcano (0/1) |
| div | number | Divino (0/1) |
| psi | number | Psionico (0/1) |
| alm | number | Alma (0/1) |
| com | number | Componente (0/1) |
| dur | string | Duracion |
| t_s | string | Tipo de salvacion |
| r_c | number | Resistencia conjuros (0/1) |
| r_p | number | Resistencia poderes (0/1) |
| d_c | string | Descripcion componentes |
| per | number | Permanente (0/1) |
| pp | number | Puntos de poder |
| da | string | Descripcion aumentos |
| des | array | Descriptores: { Id, Nombre } |
| ncl | array | Niveles por clase: { Id_clase, Clase, Nivel, Espontaneo } |
| nd | array | Niveles por dominio: { Id_dominio, Dominio, Nivel, Espontaneo } |
| ndis | array | Niveles por disciplina: { Id_disciplina, Disciplina, Nivel, Espontaneo } |
| coms | array | Componentes: { Id_componente, Componente } |
| o | boolean | Oficial (true=oficial, false=homebrew) |

Endpoint: GET /escuelas
Respuesta: array de `EscuelaConjuro`

EscuelaConjuro
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id |
| n | string | Nombre |
| ne | string | Nombre esp |
| p | number | Prohibible (0/1) |

Endpoint: GET /disciplinas
Respuesta: array de `DisciplinaConjuroResumen`

DisciplinaConjuroResumen
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id |
| n | string | Nombre |
| ne | string | Nombre esp |
| sd | array | Subdisciplinas (nombres) |

Endpoint: GET /alineamientos
Respuesta: array de `AlineamientoResumen`

AlineamientoResumen
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id |
| b | object | Basico: { Id_basico, Nombre } |
| l | object | Ley: { Id_ley, Nombre } |
| m | object | Moral: { Id_moral, Nombre } |
| p | object | Prioridad: { Id_prioridad, Nombre } |
| d | string | Descripcion |

Endpoint: GET /alineamientos/combinaciones
Respuesta: array de `AlineamientoCombinacion`

AlineamientoCombinacion
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de la combinacion |
| Basico | object | { Id, Nombre } |
| Ley | object | { Id, Nombre } |
| Moral | object | { Id, Nombre } |
| Prioridad | object | { Id, Nombre, Descripcion } |

Endpoint: GET /alineamientos/basicos
Respuesta: array de `AlineamientoBasico`

AlineamientoBasico
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de alineamiento basico |
| Nombre | string | Nombre |

Endpoint: GET /alineamientos/prioridades
Respuesta: array de `PrioridadAlineamiento`

PrioridadAlineamiento
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de prioridad |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |

Endpoint: GET /alineamientos/preferencia-ley
Respuesta: array de `PreferenciaLey`

PreferenciaLey
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de preferencia legal |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |

Endpoint: GET /alineamientos/preferencia-moral
Respuesta: array de `PreferenciaMoral`

PreferenciaMoral
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de preferencia moral |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |

Endpoint: GET /habilidades
Respuesta: array de `HabilidadBasicaDetalle`

HabilidadBasicaDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id_habilidad | number | Id de habilidad (solo > 0) |
| Nombre | string | Nombre |
| Id_caracteristica | number | Id de caracteristica asociada |
| Caracteristica | string | Nombre de caracteristica asociada |
| Descripcion | string | Descripcion |
| Soporta_extra | boolean | Si la habilidad soporta extra |
| Entrenada | boolean | Si requiere entrenamiento |
| Extras | array | Lista de extras disponibles para la habilidad (`HabilidadExtraRef`) |

HabilidadExtraRef
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id_extra | number | Id del extra |
| Extra | string | Nombre del extra |
| Descripcion | string | Descripcion del extra |

Endpoint: GET /habilidades/custom
Respuesta: array de `HabilidadBasicaDetalle`

Notas de este endpoint
- Fuente: tabla `habilidades_custom`.
- Mantiene el mismo contrato de `HabilidadBasicaDetalle`.
- Campos sin soporte en la tabla custom se devuelven por defecto:
  - `Descripcion = ""`
  - `Soporta_extra = false`
  - `Entrenada = false`
  - `Extras = []`

Endpoint: GET /idiomas
Respuesta: array de `IdiomaDetalle`

IdiomaDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de idioma |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Secreto | boolean | Marca de idioma secreto |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |

Endpoint: GET /dominios
Respuesta: array de `DominioDetalle`

DominioDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de dominio |
| Nombre | string | Nombre |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |

Endpoint: GET /dominios/<id_dominio>
Respuesta: objeto `DominioDetalle`
Respuesta 404
```json
{
  "error": "Dominio no encontrado",
  "id_dominio": 123
}
```

Endpoint: GET /ambitos
Respuesta: array de `AmbitoDetalle`

AmbitoDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de ambito |
| Nombre | string | Nombre |

Endpoint: GET /ambitos/<id_ambito>
Respuesta: objeto `AmbitoDetalle`
Respuesta 404
```json
{
  "error": "Ambito no encontrado",
  "id_ambito": 123
}
```

Endpoint: GET /pabellones
Respuesta: array de `PabellonDetalle`

PabellonDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de pabellon |
| Nombre | string | Nombre |

Endpoint: GET /pabellones/<id_pabellon>
Respuesta: objeto `PabellonDetalle`
Respuesta 404
```json
{
  "error": "Pabellon no encontrado",
  "id_pabellon": 123
}
```

Endpoint: GET /deidades
Respuesta: array de `DeidadDetalle`

Endpoint: GET /deidades/<id_deidad>
Respuesta: objeto `DeidadDetalle`
Respuesta 404
```json
{
  "error": "Deidad no encontrada",
  "id_deidad": 123
}
```

Endpoint: GET /deidades/pabellon/<id_pabellon>
Respuesta: array de `DeidadDetalle`

Endpoint: GET /deidades/alineamiento/<id_alineamiento>
Respuesta: array de `DeidadDetalle`

DeidadDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de deidad |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Manual | object | `{ Id, Nombre, Pagina }` |
| Alineamiento | object | `{ Id, Id_basico, Nombre }` |
| Arma | object | `{ Id, Nombre }` |
| Pabellon | object | `{ Id, Nombre }` |
| Genero | object | `{ Id, Nombre }` |
| Ambitos | array | Lista de `AmbitoDetalle` |
| Dominios | array | Lista de `DominioDetalle` |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |

Endpoint: GET /dotes
Respuesta: array de `DoteDetalle`

DoteDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de dote |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion completa |
| Beneficio | string | Beneficio |
| Normal | string | Campo normal |
| Especial | string | Campo especial |
| Manual | object | { Id, Nombre, Pagina } |
| Tipos | array | Tipos de dote: { Id, Nombre, Usado } |
| Repetible | number | Repetible (0/1) |
| Repetible_distinto_extra | number | Repetible con distinto extra (0/1) |
| Repetible_comb | number | Repetible en combinacion (0/1) |
| Comp_arma | number | Competencia de arma (0/1) |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |
| Extras_soportados | object | Banderas: { Extra_arma, Extra_armadura, Extra_escuela, Extra_habilidad } |
| Extras_disponibles | object | Catalogos validos: { Armas, Armaduras, Escuelas, Habilidades } |
| Modificadores | object | Modificadores numericos de la dote |
| Prerrequisitos | object | Todas las familias `dote_prerrequisito_*` (si no hay filas => `[]`) |

Endpoint: GET /dotes/<id_dote>
Respuesta: objeto `DoteDetalle`
Respuesta 404
```json
{
  "error": "Dote no encontrada",
  "id_dote": 123
}
```

Endpoint: GET /ventajas
Respuesta: array de `VentajaDetalle`

Endpoint: GET /ventajas/<id_ventaja>
Respuesta: objeto `VentajaDetalle`
Respuesta 404
```json
{
  "error": "Ventaja no encontrada",
  "id_ventaja": 123
}
```

Endpoint: GET /desventajas
Respuesta: array de `VentajaDetalle`

Endpoint: GET /desventajas/<id_ventaja>
Respuesta: objeto `VentajaDetalle`
Respuesta 404
```json
{
  "error": "Desventaja no encontrada",
  "id_ventaja": 123
}
```

Regla de clasificacion por coste
- `Coste < 0`: el registro aparece en `/ventajas`.
- `Coste > 0`: el registro aparece en `/desventajas`.
- `Coste = 0`: no aparece en ninguno de los dos recursos.

VentajaDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de ventaja |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Disipable | boolean | Indica si puede perderse durante el juego |
| Coste | number | Coste; se usa para clasificar ventaja/desventaja |
| Mejora | number | Valor de mejora |
| Caracteristica | boolean | Flag general de caracteristica |
| Fuerza | boolean | Flag de fuerza |
| Destreza | boolean | Flag de destreza |
| Constitucion | boolean | Flag de constitucion |
| Inteligencia | boolean | Flag de inteligencia |
| Sabiduria | boolean | Flag de sabiduria |
| Carisma | boolean | Flag de carisma |
| Fortaleza | boolean | Flag de fortaleza |
| Reflejos | boolean | Flag de reflejos |
| Voluntad | boolean | Flag de voluntad |
| Iniciativa | boolean | Flag de iniciativa |
| Duplica_oro | boolean | Flag duplica oro |
| Aumenta_oro | boolean | Flag aumenta oro |
| Idioma_extra | boolean | Flag idioma extra |
| Manual | object | { Id, Nombre, Pagina } |
| Rasgo | object | `ReferenciaCorta`: { Id, Nombre, Descripcion } |
| Idioma | object | `ReferenciaCorta`: { Id, Nombre, Descripcion } |
| Habilidad | object | `ReferenciaCorta`: { Id, Nombre, Descripcion } |

Endpoint: GET /clases
Respuesta: array de `ClaseDetalle`

Endpoint: GET /clases/<id_clase>
Respuesta: objeto `ClaseDetalle`
Respuesta 404
```json
{
  "error": "Clase no encontrada",
  "id_clase": 123
}
```

ClaseDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de clase |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Manual | object | { Id, Nombre, Pagina } |
| Tipo_dado | object | { Id, Nombre } |
| Puntos_habilidad | object | { Id, Valor } |
| Nivel_max_claseo | number | Nivel maximo de clase |
| Mod_salv_conjuros | string | Modificador de salvacion para conjuros |
| Conjuros | object | Configuracion de magia/poderes + `Clase_origen` + `Listado` |
| Roles | object | { Dps, Tanque, Support, Utilidad } |
| Aumenta_clase_lanzadora | boolean | Si aumenta clase lanzadora |
| Es_predilecta | boolean | Si puede ser clase predilecta |
| Prestigio | boolean | Si es clase de prestigio |
| Tiene_prerrequisitos | boolean | Flag de `clases.prerrequisitos` |
| Alineamiento | object | `AlineamientoDetalle` |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |
| Competencias | object | { Armas[], Armaduras[], Grupos_arma[], Grupos_armadura[] } |
| Habilidades | object | { Base[], Custom[] } |
| Idiomas | array | Idiomas que el personaje obtiene automaticamente por tener esta clase (`{ Id, Nombre, Descripcion, Secreto, Oficial }`) |
| Desglose_niveles | array | Lista de `ClaseNivelDetalle` (hasta 20 niveles) |
| Prerrequisitos_flags | object | Flags booleanos de `pres_c` |
| Prerrequisitos | object | Todas las familias de prerrequisitos (claves fijas; vacio=`[]`) |

Conjuros (ClaseDetalle.Conjuros)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Dependientes_alineamiento | boolean | Conjuros dependientes de alineamiento |
| Divinos | boolean | Usa conjuros divinos |
| Arcanos | boolean | Usa conjuros arcanos |
| Psionicos | boolean | Usa poderes psionicos |
| Alma | boolean | Usa magia de alma |
| Conocidos_total | boolean | Usa progresion de conocidos total |
| Conocidos_nivel_a_nivel | boolean | Usa progresion de conocidos por nivel |
| Dominio | boolean | Usa dominios |
| Escuela | boolean | Usa escuela |
| Lanzamiento_espontaneo | boolean | Lanza espontaneamente |
| Clase_origen | object | { Id, Nombre } |
| Listado | array | `ConjuroClaseRef[]` |

ConjuroClaseRef
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de conjuro |
| Nombre | string | Nombre de conjuro |
| Nivel | number | Nivel del conjuro para la clase |
| Espontaneo | boolean | Si entra por via espontanea |

ClaseNivelDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Nivel | number | Nivel de clase |
| Ataque_base | string | Progresion de ataque base en ese nivel |
| Salvaciones | object | { Fortaleza, Reflejos, Voluntad } |
| Nivel_max_conjuro | number | Nivel maximo de conjuro en ese nivel (`-1` por defecto) |
| Reserva_psionica | number | Reserva psionica acumulada (`0` por defecto) |
| Aumentos_clase_lanzadora | array | { Id, Nombre } |
| Conjuros_diarios | object | { Nivel_0..Nivel_9 } (`-1` por defecto) |
| Conjuros_conocidos_nivel_a_nivel | object | { Nivel_0..Nivel_9 } (`0` por defecto) |
| Conjuros_conocidos_total | number | Total de conocidos (`0` por defecto) |
| Dotes | array | `ClaseDoteNivel[]` |
| Especiales | array | `ClaseEspecialNivel[]` |

ClaseDoteNivel
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Dote | object | `DoteDetalle` completo |
| Nivel | number | Nivel de la clase |
| Id_extra | number | Id de extra seleccionado |
| Extra | string | Nombre de extra o "No aplica" |
| Opcional | number | Flag opcional (0/1) |
| Id_interno | number | Id interno de la relacion |
| Id_especial_requerido | number | Dependencia interna de especial |
| Id_dote_requerida | number | Dependencia interna de dote |

ClaseEspecialNivel
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Especial | object | Detalle base de especial y metadatos |
| Nivel | number | Nivel de la clase |
| Id_extra | number | Id de extra seleccionado |
| Extra | string | Nombre de extra o "No aplica" |
| Opcional | number | Flag opcional (0/1) |
| Id_interno | number | Id interno de la relacion |
| Id_especial_requerido | number | Dependencia interna de especial |
| Id_dote_requerida | number | Dependencia interna de dote |

Prerrequisitos (ClaseDetalle.Prerrequisitos) - claves fijas
| Clave |
| --- |
| subtipo |
| caracteristica |
| dg |
| dominio |
| nivel_escuela |
| ataque_base |
| reserva_psionica |
| lanzar_poder_psionico_nivel |
| conocer_poder_psionico |
| genero |
| competencia_arma |
| competencia_armadura |
| competencia_grupo_arma |
| competencia_grupo_armadura |
| dote_elegida |
| rangos_habilidad |
| idioma |
| alineamiento_requerido |
| alineamiento_prohibido |
| actitud_requerido |
| actitud_prohibido |
| lanzador_arcano |
| lanzador_divino |
| lanzar_conjuros_arcanos_nivel |
| lanzar_conjuros_divinos_nivel |
| conjuro_conocido |
| inherente |
| clase_especial |
| tamano_maximo |
| tamano_minimo |
| raza |
| no_raza |

Nota: `habilidad_clase` se mantiene como flag en `Prerrequisitos_flags`; no existe bloque dedicado en `Prerrequisitos`.

Endpoint: GET /clases/habilidades
Respuesta: array de `EspecialClaseDetalle`

Endpoint: GET /clases/habilidades/<id_especial>
Respuesta: objeto `EspecialClaseDetalle`
Respuesta 404
```json
{
  "error": "Especial no encontrado",
  "id_especial": 123
}
```

EspecialClaseDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de especial |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Extra | boolean | Si usa extra |
| Repetible | boolean | Si se puede repetir |
| Repite_mismo_extra | boolean | Si permite repetir mismo extra |
| Repite_combinacion | boolean | Si permite repetir combinacion |
| Activa_extra | boolean | Si activa extra |
| Caracteristica | object | { Id, Nombre } |
| Bonificadores | object | { Fuerza, Destreza, Constitucion, Inteligencia, Sabiduria, Carisma, CA, Armadura_natural, RD } |
| Flags_extra | object | { No_aplica, Da_CA, Da_armadura_natural, Da_RD, Da_velocidad } |
| Subtipo | object | { Id, Nombre } |
| Extras | array | Lista de `EspecialExtraRef` |
| Habilidades | array | Lista de `EspecialHabilidadRef` |

EspecialExtraRef
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id_extra | number | Id del extra |
| Extra | string | Nombre del extra |
| Orden | number | Orden definido para el especial |

EspecialHabilidadRef
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id_habilidad | number | Id de habilidad |
| Habilidad | string | Nombre de habilidad |
| Id_extra | number | Id del extra asociado |
| Extra | string | Nombre del extra asociado |
| Rangos | number | Rangos asociados |

Endpoint: GET /razas/raciales
Respuesta: array de `RacialDetalle`

Endpoint: GET /razas/raciales/<id_racial>
Respuesta: objeto `RacialDetalle`
Respuesta 404
```json
{
  "error": "Racial no encontrado",
  "id_racial": 123
}
```

RacialDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de racial |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Opcional | number | Flag de opcion en contexto de raza (`0` = siempre se obtiene; `>0` = elegir entre raciales con el mismo valor) |
| Dotes | array | Lista de dotes con `{ Id_dote, Dote, Id_extra, Extra }` |
| Habilidades | object | `{ Base: [], Custom: [] }` |
| Caracteristicas | array | Bonificadores de caracteristica |
| Salvaciones | array | Bonificadores de salvacion |
| Sortilegas | array | Lista de sortilegas con conjuro y metadatos |
| Ataques | array | Lista de ataques raciales |
| Prerrequisitos_flags | object | Flags booleanos (`raza`, `caracteristica_minima`) |
| Prerrequisitos | object | Bloques de prerrequisitos (`raza`, `caracteristica`) |

Endpoint: GET /plantillas
Respuesta: array de `PlantillaDetalle`

Endpoint: GET /plantillas/<id_plantilla>
Respuesta: objeto `PlantillaDetalle`
Respuesta 404
```json
{
  "error": "Plantilla no encontrada",
  "id_plantilla": 123
}
```

PlantillaDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Manual | object | { Id, Nombre, Pagina } |
| Tamano | object | { Id, Nombre, Modificador, Modificador_presa } |
| Tipo_dado | object | { Id_tipo_dado, Nombre } |
| Actualiza_dg | boolean | Actualiza dados de golpe |
| Modificacion_dg | object | { Id_paso_modificacion, Nombre } |
| Modificacion_tamano | object | { Id_paso_modificacion, Nombre } |
| Iniciativa | number | Iniciativa |
| Velocidades | string | Velocidades |
| Ca | string | CA |
| Ataque_base | number | Ataque base |
| Presa | number | Presa |
| Ataques | string | Ataques |
| Ataque_completo | string | Ataque completo |
| Reduccion_dano | string | Reduccion de dano |
| Resistencia_conjuros | string | Resistencia conjuros |
| Resistencia_elemental | string | Resistencia elemental |
| Fortaleza | number | Fortaleza |
| Reflejos | number | Reflejos |
| Voluntad | number | Voluntad |
| Modificadores_caracteristicas | object | { Fuerza, Destreza, Constitucion, Inteligencia, Sabiduria, Carisma } |
| Minimos_caracteristicas | object | { Fuerza, Destreza, Constitucion, Inteligencia, Sabiduria, Carisma } |
| Ajuste_nivel | number | Ajuste de nivel |
| Licantronia_dg | object | { Id_dado, Dado, Multiplicador, Suma } |
| Cd | number | CD |
| Puntos_habilidad | object | { Suma, Suma_fija } |
| Nacimiento | boolean | Nacimiento |
| Movimientos | object | { Correr, Nadar, Volar, Trepar, Escalar } |
| Maniobrabilidad | object | Maniobrabilidad (ver abajo) |
| Alineamiento | object | `AlineamientoDetalle` |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |
| Dotes | array | Lista de `DoteContextual` |
| Subtipos | array | Lista de `SubtipoRef` (`{ Id, Nombre }`) |
| Habilidades | array | Lista de `PlantillaHabilidadRef` |
| Sortilegas | array | Lista de `PlantillaSortilega` |
| Prerrequisitos_flags | object | Flags booleanos de `pres_p` |
| Prerrequisitos | object | Familias de prerrequisitos de plantilla |

Maniobrabilidad
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Velocidad_avance | string | Velocidad de avance |
| Flotar | number | Flotar (0/1) |
| Volar_atras | number | Volar atras (0/1) |
| Contramarcha | number | Contramarcha |
| Giro | string | Giro |
| Rotacion | string | Rotacion |
| Giro_max | string | Giro max |
| Angulo_ascenso | string | Angulo ascenso |
| Velocidad_ascenso | string | Velocidad ascenso |
| Angulo_descenso | string | Angulo descenso |
| Descenso_ascenso | number | Descenso ascenso |

PlantillaHabilidadRef
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id_habilidad | number | Id de habilidad |
| Habilidad | string | Nombre |
| Id_caracteristica | number | Id de caracteristica asociada |
| Caracteristica | string | Nombre de caracteristica |
| Descripcion | string | Descripcion de habilidad |
| Soporta_extra | boolean | Si la habilidad soporta extra |
| Entrenada | boolean | Si requiere entrenamiento |
| Id_extra | number | Id de extra seleccionado |
| Extra | string | Nombre de extra |
| Rangos | number | Rangos |
| Varios | string | Texto varios |

PlantillaSortilega
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Conjuro | object | `ConjuroDetalle` completo |
| Nivel_lanzador | number | Nivel lanzador |
| Usos_diarios | string | Usos diarios |
| Dg | number | DGS requeridos |

Prerrequisitos_flags (PlantillaDetalle.Prerrequisitos_flags)
| Campo |
| --- |
| actitud_requerido |
| actitud_prohibido |
| alineamiento_requerido |
| caracteristica |
| criaturas_compatibles |

Prerrequisitos (PlantillaDetalle.Prerrequisitos)
| Clave |
| --- |
| actitud_requerido |
| actitud_prohibido |
| alineamiento_requerido |
| caracteristica |
| criaturas_compatibles |

Esquemas usados por /personajes, /razas, /plantillas y /dotes

RazaSimplificada
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de raza |
| Nombre | string | Nombre |
| Modificadores | object | { Fuerza, Destreza, Constitucion, Inteligencia, Sabiduria, Carisma } |
| Ajuste_nivel | number | Ajuste de nivel |
| Manual | string | Manual (con pagina) |
| Clase_predilecta | string | Clase predilecta |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |
| Mutada | boolean | Indica si la raza es mutada |
| Tamano_mutacion_dependiente | boolean | El tamano depende de la mutacion |
| Prerrequisitos | boolean | La raza declara prerrequisitos |
| Mutacion | object | { Es_mutada, Tamano_dependiente, Tiene_prerrequisitos, Heredada } |
| Tamano | object | { Id, Nombre, Modificador, Modificador_presa } |
| Dgs_adicionales | object | { Cantidad, Dado, Tipo_criatura } |
| Tipo_criatura | object | `TipoCriaturaDetalle` |
| Subtipos | array | Lista de `SubtipoRef` (`{ Id, Nombre }`) |

TipoCriaturaDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Manual | string | Manual (con pagina) |
| Id_tipo_dado | number | Id tipo de dado |
| Tipo_dado | string | Nombre tipo de dado |
| Id_ataque | number | Id ataque |
| Id_fortaleza | number | Id fortaleza |
| Id_reflejos | number | Id reflejos |
| Id_voluntad | number | Id voluntad |
| Id_puntos_habilidad | number | Id puntos habilidad |
| Come | number | Come (0/1) |
| Respira | number | Respira (0/1) |
| Duerme | number | Duerme (0/1) |
| `Recibe_críticos` | number | Recibe criticos (0/1) |
| Puede_ser_flanqueado | number | Puede ser flanqueado (0/1) |
| Pierde_constitucion | number | Pierde constitucion (0/1) |
| Limite_inteligencia | number | Limite inteligencia |
| Tesoro | string | Tesoro |
| Id_alineamiento | number | Id alineamiento |
| Rasgos | array | Lista de `RasgoTipo` |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |

RasgoTipo
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |

AlineamientoDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Basico | object | { Id_basico, Nombre } |
| Ley | object | { Id_ley, Nombre } |
| Moral | object | { Id_moral, Nombre } |
| Prioridad | object | { Id_prioridad, Nombre } |
| Descripcion | string | Descripcion |

ConjuroDetalle (usado en /personajes.con, /personajes.sor, /razas.sor)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Tiempo_lanzamiento | string | Tiempo de lanzamiento |
| Alcance | string | Alcance |
| Escuela | object | `EscuelaConjuro` |
| Disciplina | object | `DisciplinaConjuro` |
| Manual | string | Manual (con pagina) |
| Objetivo | string | Objetivo |
| Efecto | string | Efecto |
| Area | string | Area |
| Arcano | number | Arcano (0/1) |
| Divino | number | Divino (0/1) |
| Psionico | number | Psionico (0/1) |
| alma | number | Alma (0/1) |
| Duracion | string | Duracion |
| Tipo_salvacion | string | Tipo de salvacion |
| Resistencia_conjuros | number | Resistencia conjuros (0/1) |
| Resistencia_poderes | number | Resistencia poderes (0/1) |
| Descripcion_componentes | string | Descripcion componentes |
| Permanente | number | Permanente (0/1) |
| Puntos_poder | number | Puntos de poder |
| Descripcion_aumentos | string | Descripcion aumentos |
| Descriptores | array | { Id, Nombre } |
| Niveles_clase | array | { Id_clase, Clase, Nivel, Espontaneo } |
| Niveles_dominio | array | { Id_dominio, Dominio, Nivel, Espontaneo } |
| Niveles_disciplina | array | { Id_disciplina, Disciplina, Nivel, Espontaneo } |
| Componentes | array | { Id_componente, Componente } |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |

DisciplinaConjuro (detalle)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Nombre_esp | string | Nombre esp |
| Subdisciplinas | array | Subdisciplinas (nombres) |

EscuelaConjuro (detalle)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Nombre_esp | string | Nombre esp |
| Prohibible | number | Prohibible (0/1) |

SortilegioRaza
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Conjuro | object | `ConjuroDetalle` |
| Nivel_lanzador | number | Nivel lanzador |
| Usos_diarios | string | Usos diarios |
| Descripcion | string | Descripcion |

SortilegioPersonaje
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Conjuro | object | `ConjuroDetalle` |
| Nivel_lanzador | number | Nivel lanzador |
| Usos_diarios | string | Usos diarios |
| Dgs_necesarios | number | DGS necesarios |
| Origen | string | Origen |

Idioma
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Secreto | number | Secreto (0/1) |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |

Salvaciones
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| fortaleza | object | { modsClaseos: array, modsVarios: array } |
| reflejos | object | { modsClaseos: array, modsVarios: array } |
| voluntad | object | { modsClaseos: array, modsVarios: array } |

Mods de salvacion
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| valor | number | Valor del modificador |
| origen | string | Origen |

PlantillaPersonaje (usada en /personajes.pla)
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id |
| Nombre | string | Nombre |
| Ataques | string | Ataques |
| Ataque_completo | string | Ataque completo |
| Id_tamano | number | Id tamano |
| Tamano | string | Tamano |
| Id_tamano_pasos | number | Id paso modificacion tamano |
| Tamano_pasos | string | Paso modificacion tamano |
| Id_dados_golpe | number | Id tipo de dado |
| Dados_golpe | string | Dado de golpe |
| Id_dados_golpe_pasos | number | Id paso modificacion DG |
| Dados_golpe_pasos | string | Paso modificacion DG |
| Actualiza_dgs | number | Actualiza DG (0/1) |
| Multiplicador_dgs_lic | number | Multiplicador DG lic |
| Tipo_dgs_lic | string | Tipo DG lic |
| Suma_dgs_lic | number | Suma DG lic |
| Correr | number | Correr |
| Nadar | number | Nadar |
| Volar | number | Volar |
| Maniobrabilidad | string | Maniobrabilidad |
| Trepar | number | Trepar |
| Escalar | number | Escalar |
| Ataque_base | number | Ataque base |
| Ca | string | CA |
| Resistencia_conjuros | string | Resistencia conjuros |
| Reduccion_dano | string | Reduccion dano |
| Resistencia_elemental | string | Resistencia elemental |
| Velocidades | string | Velocidades |
| Iniciativa | number | Iniciativa |
| Presa | number | Presa |
| Ajuste_nivel | number | Ajuste de nivel |
| Heredada | number | Heredada (0/1) |

DoteContextual
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Dote | object | `DoteDetalle` |
| Contexto | object | Metadatos de relacion con la entidad (personaje/raza/plantilla) |
