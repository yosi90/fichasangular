# API Endpoints (Programa de fichas - Backend)

Fecha de generacion: 2026-03-10

Resumen
- Base URL (local): `http://127.0.0.1:5000`
- Prefijos registrados: `/verify`, `/usuarios`, `/personajes`, `/razas`, `/razas/raciales`, `/subtipos`, `/campanas`, `/tramas`, `/subtramas`, `/manuales`, `/manuales/asociados`, `/monstruos`, `/familiares`, `/companeros`, `/tiposCriatura`, `/rasgos`, `/conjuros`, `/escuelas`, `/disciplinas`, `/alineamientos`, `/habilidades`, `/idiomas`, `/enemigos-predilectos`, `/extras`, `/tamanos`, `/armas`, `/armaduras`, `/grupos-armas`, `/grupos-armaduras`, `/dominios`, `/ambitos`, `/pabellones`, `/deidades`, `/dotes`, `/clases`, `/clases/habilidades`, `/plantillas`, `/ventajas`, `/desventajas`
- Autenticacion: la vertical de usuarios, campañas y personajes ya usa `Authorization: Bearer <id_token>` de Firebase en lectura actor-scoped y en operaciones admin. Parte del catálogo legacy de creación sigue pendiente de endurecimiento.
- Content-Type esperado: `application/json`, `multipart/form-data` en `POST /usuarios/me/avatar`, `application/zip` en `GET /usuarios/backup` e `image/webp` en `GET /media/avatars/<uid>/<filename>`
- CORS habilitado para: `https://rol.yosiftware.es/`, `https://www.rol.yosiftware.es/`, `https://62.43.222.28`, `http://192.168.0.34`
- Metodos usados: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` (preflight en varias rutas).
- Errores: los endpoints legacy siguen sin estandarizacion completa; la vertical nueva de perfil usa `{ "code": "...", "message": "..." }`.

Cambios clave 2026-03-10
- Se elimina cualquier dependencia API de `jugadores`, `jugador_personaje`, `campañas_tramas` y `tramas_subtramas`.
- El rol base pasa a ser `jugador`. El catalogo global queda en `jugador | master | colaborador | admin`.
- La autoria de personajes ya no se resuelve por email ni por tablas legacy: ahora sale de `personajes.OwnerUserId -> AppUser`.
- La pertenencia a campaña se resuelve en `CampanaUsuario`.
- `CampanaUsuario` queda modelada con dos dimensiones:
  - `CampaignRoleCode`: `master | jugador`
  - `MembershipStatusCode`: `activo | inactivo | expulsado`
- Las tramas pertenecen directamente a una campaña y las subtramas pertenecen directamente a una trama.
- El frontend debe dejar de esperar `legacyPlayer`, `idJugador` o sincronizacion con `jugadores`.
- Nuevas capacidades de campañas:
  - crear campaña
  - editar campaña
  - añadir o quitar jugadores
  - transferir master conservando al anterior como `jugador` o dejándolo `inactivo`
  - crear y editar tramas y subtramas desde endpoints específicos
- Nuevas capacidades de usuarios:
  - solicitudes de rol sobre `UserRequest`
  - flujo soportado: `jugador -> master` y `master -> colaborador`
  - alias legacy de `master-request` mantenidos temporalmente
- Visibilidad actor-scoped:
  - `GET /campanas` solo devuelve campañas activas del actor, salvo `admin`
  - `GET /personajes`, `GET /personajes/simplificados` y `GET /personajes/<id>` aplican autorización por actor
  - en campañas, los personajes públicos solo los ven miembros activos de esa campaña y `admin`

Scripts SQL relevantes
- `docs/1.-Consulta creación base datos rol.sql`: esquema base principal.
- `docs/2.-Consulta creación sistema de usuarios.sql`: `AppUser`, ACL, permisos, `CampanaUsuario` y objetos de usuarios.
- `docs/12.-Procedimientos personajes.sql`: procedimientos `dbo.rol_get_personajes` y `dbo.rol_get_personajes_simplificados`.

Orden recomendado al recrear la base
1. `docs/1.-Consulta creación base datos rol.sql`
2. `docs/2.-Consulta creación sistema de usuarios.sql`
3. `docs/12.-Procedimientos personajes.sql`

Lista de endpoints
| Metodo | Path | Descripcion | Estado |
| --- | --- | --- | --- |
| GET | /verify | Verifica conexion DB | Implementado |
| GET | /usuarios | Lista de usuarios (admin panel) | Implementado |
| GET | /usuarios/backup | Descarga backup SQL completo en ZIP (solo admin) | Implementado |
| GET | /usuarios/acl/<uid> | ACL bootstrap por Firebase UID | Implementado |
| GET | /usuarios/me | Perfil privado del usuario autenticado | Implementado |
| PATCH | /usuarios/me | Actualizar displayName del usuario autenticado | Implementado |
| GET | /usuarios/me/role-request | Estado actual de solicitud de rol del usuario autenticado | Implementado |
| POST | /usuarios/me/role-request | Crear solicitud de rol del usuario autenticado | Implementado |
| GET | /usuarios/me/master-request | Alias legado para consultar solicitud a master | Implementado |
| POST | /usuarios/me/master-request | Alias legado para solicitar rol master | Implementado |
| GET | /usuarios/me/settings | Recuperar settings del usuario autenticado | Implementado |
| PUT | /usuarios/me/settings | Reemplazar settings del usuario autenticado | Implementado |
| POST | /usuarios/me/avatar | Subir o reemplazar avatar | Implementado |
| DELETE | /usuarios/me/avatar | Eliminar avatar | Implementado |
| GET | /usuarios/role-requests | Listado admin de solicitudes de rol | Implementado |
| PATCH | /usuarios/role-requests/<id> | Resolver una solicitud de rol | Implementado |
| GET | /usuarios/master-requests | Alias admin para solicitudes a master | Implementado |
| GET | /usuarios/search | Búsqueda pública básica de usuarios | Implementado |
| GET | /usuarios/<uid>/public | Perfil público resumido por Firebase UID | Implementado |
| POST | /usuarios | Upsert usuario + ACL sobre `AppUser` | Implementado |
| GET | /media/avatars/<uid>/<filename> | Recuperar avatar público servido por la API | Implementado |
| GET | /personajes | Lista detallada de personajes visible para el actor | Implementado |
| GET | /personajes/<id_personaje> | Detalle de personaje visible para el actor | Implementado |
| GET | /personajes/simplificados | Lista simplificada visible para el actor | Implementado |
| POST | /personajes/add | Crear personaje | Implementado |
| PATCH | /personajes/<id_personaje>/visible | Actualizar visibilidad de personaje | Implementado |
| GET | /razas | Lista completa de razas | Implementado |
| GET | /razas/raciales | Lista de raciales | Implementado |
| GET | /razas/raciales/<id_racial> | Racial por id | Implementado |
| GET | /subtipos | Lista de subtipos | Implementado |
| GET | /subtipos/<id_subtipo> | Subtipo completo por id | Implementado |
| POST | /razas/add | Crear raza | No implementado (funcion `pass`) |
| GET | /campanas | Lista de campañas visibles para el actor | Implementado |
| POST | /campanas | Crear campana | Implementado |
| POST | /campanas/add | Alias legacy para crear campana | Implementado |
| PATCH | /campanas/<id_campana> | Editar campaña | Implementado |
| POST | /campanas/<id_campana>/jugadores | Añadir jugador a campaña | Implementado |
| GET | /campanas/<id_campana>/jugadores | Listar miembros de campaña | Implementado |
| DELETE | /campanas/<id_campana>/jugadores/<uid> | Retirar jugador de campaña | Implementado |
| PATCH | /campanas/<id_campana>/master | Transferir master de campaña | Implementado |
| GET | /tramas | Lista de tramas | Implementado |
| GET | /tramas/campana/<id_campana> | Tramas por campana | Implementado |
| POST | /tramas/campana/<id_campana> | Crear trama dentro de campaña | Implementado |
| POST | /tramas/add | Alias legacy para crear trama | Implementado |
| PATCH | /tramas/<id_trama> | Editar trama | Implementado |
| GET | /subtramas | Lista de subtramas | Implementado |
| GET | /subtramas/trama/<id_trama> | Subtramas por trama | Implementado |
| POST | /subtramas/trama/<id_trama> | Crear subtrama dentro de trama | Implementado |
| POST | /subtramas/add | Alias legacy para crear subtrama | Implementado |
| PATCH | /subtramas/<id_subtrama> | Editar subtrama | Implementado |
| GET | /manuales | Lista de manuales | Implementado |
| GET | /manuales/<id_manual> | Manual por id | Implementado |
| PATCH | /manuales/<id_manual> | Actualizar flags de contenido de un manual | Implementado |
| GET | /manuales/asociados | Lista de manuales con asociados | Implementado |
| GET | /manuales/asociados/<id_manual> | Manual con asociados por id | Implementado |
| POST | /manuales/add | Crear manual | No implementado (funcion `pass`) |
| GET | /monstruos | Lista completa de monstruos | Implementado |
| GET | /monstruos/<id_monstruo> | Monstruo completo por id | Implementado |
| GET | /familiares | Lista completa de familiares mergeados | Implementado |
| GET | /familiares/<id_familiar> | Familiar mergeado por id | Implementado |
| GET | /familiares/personaje/<id_personaje> | Familiares de un personaje | Implementado |
| GET | /companeros | Lista completa de companeros mergeados | Implementado |
| GET | /companeros/<id_companero> | Companero mergeado por id | Implementado |
| GET | /companeros/personaje/<id_personaje> | Companeros de un personaje | Implementado |
| GET | /tiposCriatura | Lista de tipos de criatura | Implementado |
| POST | /tiposCriatura/add | Crear tipo de criatura | No implementado (funcion `pass`) |
| GET | /rasgos | Lista de rasgos | Implementado |
| POST | /rasgos/add | Crear rasgo | No implementado (funcion `pass`) |
| GET | /conjuros | Lista de conjuros | Implementado |
| POST | /conjuros/add | Crear conjuro | Implementado |
| GET | /componentes-conjuros | Lista de componentes de conjuro | Implementado |
| GET | /tiempos-lanzamiento | Lista de tiempos de lanzamiento | Implementado |
| GET | /alcances-conjuros | Lista de alcances de conjuro | Implementado |
| GET | /descriptores | Lista de descriptores de conjuro | Implementado |
| GET | /subdisciplinas | Lista de subdisciplinas de conjuro | Implementado |
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
| GET | /enemigos-predilectos | Lista de enemigos predilectos | Implementado |
| GET | /extras | Lista de extras | Implementado |
| GET | /extras/<id_extra> | Extra por id | Implementado |
| GET | /tamanos | Lista de tamaños | Implementado |
| GET | /tamanos/<id_tamano> | Tamaño por id | Implementado |
| GET | /armas | Lista completa de armas | Implementado |
| GET | /armas/<id_arma> | Arma por id | Implementado |
| GET | /armaduras | Lista completa de armaduras | Implementado |
| GET | /armaduras/<id_armadura> | Armadura por id | Implementado |
| GET | /grupos-armas | Lista de grupos de armas | Implementado |
| GET | /grupos-armas/<id_grupo_arma> | Grupo de arma por id | Implementado |
| GET | /grupos-armaduras | Lista de grupos de armaduras | Implementado |
| GET | /grupos-armaduras/<id_grupo_armadura> | Grupo de armadura por id | Implementado |
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
| POST | /dotes/add | Crear dote | Implementado |
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

Endpoint: GET /usuarios
Descripcion: Lista de usuarios para panel admin. Requiere `Authorization: Bearer <id_token>` y rol `admin`.

Acceso
- Solo admins autenticados.
- Si el usuario autenticado está baneado, responde `403`.

Respuesta: array de `UsuarioListadoItem`

UsuarioListadoItem
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| userId | string (uuid) | Id interno de `AppUser` |
| uid | string | Firebase UID |
| displayName | string/null | Nombre visible |
| email | string/null | Email |
| authProvider | string | `correo` \| `google` \| `otro` |
| role | string | `jugador` \| `master` \| `colaborador` \| `admin` |
| admin | boolean | `true` cuando `role=admin` |
| banned | boolean | Estado de baneo |
| updatedAtUtc | string/null | Fecha UTC de ultima actualizacion ACL |
| updatedByUserId | string/null | UUID del actor que actualizo ACL |
| permissionsCreate | array | Lista `{ resource, allowed }` |

Endpoint: GET /usuarios/backup
Descripcion: Genera un ZIP en memoria con scripts SQL de insercion para todas las tablas de usuario de la base `rol`.

Acceso
- Solo admins.
- Requiere `Authorization: Bearer <id_token>`.

Respuesta 200
- `Content-Type`: `application/zip`
- `Content-Disposition`: `attachment; filename=rol-backup-YYYYMMDD-HHMMSS.zip`
- Contenido del ZIP:
  - `000_manifest.json`
  - `000_pre_restore.sql`
  - entre 7 y 17 ficheros `.sql` de datos, cada uno agrupando varias tablas en orden de restauracion
  - `999_post_restore.sql`

Errores esperados
- `401`: token ausente o invalido.
- `403`: usuario baneado o no admin.
- `500`: error generando el backup o consultando la base.

Endpoint: GET /usuarios/acl/<uid>
Descripcion: Recupera la ACL de un usuario concreto por Firebase UID. Requiere `Authorization: Bearer <id_token>` y rol `admin`.

Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| uid | string | Firebase UID |

Respuesta 200: `UsuarioAclResponse`
```json
{
  "uid": "firebase-uid",
  "role": "jugador",
  "admin": false,
  "banned": false,
  "permissionsCreate": [
    { "resource": "personajes", "allowed": true },
    { "resource": "conjuros", "allowed": false }
  ]
}
```

Respuesta 404 (ejemplo)
```json
{
  "error": "Usuario no encontrado.",
  "uid": "firebase-uid"
}
```

Endpoint: POST /usuarios
Descripcion: Upsert transaccional en `AppUser` + ACL opcional. Ya no replica datos en tablas legacy. Requiere `Authorization: Bearer <id_token>` y rol `admin`.

Body (`application/json`)
```json
{
  "uid": "firebase-uid",
  "displayName": "Nombre",
  "email": "mail@dominio.com",
  "authProvider": "correo",
  "role": "colaborador",
  "banned": false,
  "permissionsCreate": [
    { "resource": "conjuros", "allowed": true }
  ]
}
```

Reglas de validacion
- `uid` o `firebaseUid`: obligatorio.
- `displayName`: obligatorio, maximo 150.
- `email`: obligatorio, maximo 320.
- `authProvider`: `correo|google|otro`.
- `role`: `jugador|master|colaborador|admin`.
- `permissionsCreate`: array de `{ resource, allowed }`.
- `permissionsCreate` solo tiene efecto real cuando el usuario no es `admin`.
- `actorUserId` ya no se acepta desde cliente; el actor sale del token autenticado.

Respuesta 201/200 (ejemplo)
```json
{
  "status": "created",
  "userId": "00000000-0000-0000-0000-000000000000",
  "uid": "firebase-uid",
  "acl": {
    "uid": "firebase-uid",
    "role": "jugador",
    "admin": false,
    "banned": false,
    "permissionsCreate": [
      { "resource": "personajes", "allowed": true }
    ]
  }
}
```

Endpoint: GET /usuarios/me
Descripcion: Recupera el perfil privado del usuario autenticado mediante `Authorization: Bearer <id_token>` de Firebase. Si el `AppUser` no existe, la API lo bootstrappea junto con `UserAcl`, `AppUserProfile` y `AppUserSettings`.

Respuesta 200 (ejemplo)
```json
{
  "uid": "firebase-uid",
  "displayName": "Perfil API",
  "email": "perfil@test.com",
  "emailVerified": true,
  "authProvider": "correo",
  "photoUrl": null,
  "photoThumbUrl": null,
  "createdAt": "2026-03-09T12:00:00.000Z",
  "lastSeenAt": "2026-03-09T12:00:00.000Z",
  "role": "jugador",
  "permissions": {
    "personajes": { "create": true },
    "campanas": { "create": false },
    "conjuros": { "create": false }
  }
}
```

Errores esperados
- `401`: `UNAUTHORIZED`, `TOKEN_INVALID`.
- `409`: `PROFILE_EMAIL_REQUIRED`.
- `500`: error interno o configuración inválida de Firebase.

Endpoint: PATCH /usuarios/me
Descripcion: Actualiza exclusivamente `displayName` del usuario autenticado.

Body (`application/json`)
```json
{
  "displayName": "Nuevo nombre"
}
```

Errores esperados
- `400`: `PROFILE_NAME_INVALID`, `PROFILE_NAME_TOO_LONG`.
- `401`: `UNAUTHORIZED`, `TOKEN_INVALID`.
- `403`: `PROFILE_READ_ONLY_FOR_BANNED`.
- `409`: `PROFILE_EMAIL_REQUIRED` si el bootstrap del usuario no puede completarse.

Endpoint: GET /usuarios/me/settings
Descripcion: Devuelve el documento de settings V1 del usuario autenticado. Si no existe, la API genera el default y lo persiste.

Endpoint: PUT /usuarios/me/settings
Descripcion: Reemplaza por completo el documento de settings V1.

Shape V1
```json
{
  "version": 1,
  "nuevo_personaje": {
    "generador_config": {
      "minimoSeleccionado": 0,
      "tablasPermitidas": 0,
      "updatedAt": 0
    },
    "preview_minimizada": {
      "version": 1,
      "side": "right",
      "top": 0,
      "updatedAt": 0
    },
    "preview_restaurada": {
      "version": 1,
      "left": 0,
      "top": 0,
      "width": 0,
      "height": 0,
      "updatedAt": 0
    }
  },
  "perfil": {
    "visibilidadPorDefectoPersonajes": false,
    "mostrarPerfilPublico": true
  }
}
```

Notas de contrato
- `nuevo_personaje.preview_minimizada` puede ser `null` si el usuario no tiene layout minimizado guardado.
- `nuevo_personaje.preview_restaurada` puede ser `null` si el usuario no tiene layout restaurado guardado.

Errores esperados
- `400`: `SETTINGS_INVALID`, `SETTINGS_VERSION_UNSUPPORTED`.
- `401`: `UNAUTHORIZED`, `TOKEN_INVALID`.
- `403`: `PROFILE_READ_ONLY_FOR_BANNED`.
- `409`: `PROFILE_EMAIL_REQUIRED`.

Endpoint: POST /usuarios/me/avatar
Descripcion: Sube o reemplaza el avatar del usuario autenticado. Acepta `image/jpeg`, `image/png` o `image/webp`, máximo `5 MB`, y re-encodea a `webp`.

Respuesta 200 (ejemplo)
```json
{
  "photoUrl": "http://127.0.0.1:5000/media/avatars/firebase-uid/original-aaaaaaaaaaaa.webp",
  "photoThumbUrl": "http://127.0.0.1:5000/media/avatars/firebase-uid/thumb-aaaaaaaaaaaa.webp"
}
```

Endpoint: DELETE /usuarios/me/avatar
Descripcion: Elimina el avatar del usuario autenticado. Es idempotente y responde `204`.

Errores esperados
- `400`: `AVATAR_FILE_TOO_LARGE`, `AVATAR_FILE_TYPE_INVALID`, `AVATAR_IMAGE_INVALID`.
- `401`: `UNAUTHORIZED`, `TOKEN_INVALID`.
- `403`: `PROFILE_READ_ONLY_FOR_BANNED`.
- `409`: `PROFILE_EMAIL_REQUIRED`.

Endpoint: GET /usuarios/me/role-request
Descripcion: Devuelve el estado actual de la solicitud de rol del usuario autenticado. Usa `Authorization: Bearer <id_token>` de Firebase.

Respuesta 200 (ejemplo)
```json
{
  "currentRole": "jugador",
  "requestedRole": "master",
  "status": "pending",
  "blockedUntilUtc": null,
  "requestId": 17,
  "requestedAtUtc": "2026-03-10T18:00:00.000Z",
  "resolvedAtUtc": null,
  "eligible": false,
  "reasonCode": "REQUEST_PENDING",
  "currentRoleAtRequest": "jugador",
  "adminComment": null
}
```

Notas
- El flujo soportado es `jugador -> master` y `master -> colaborador`.
- Si el usuario no tiene ninguna solicitud previa, `status` vale `none`.

Endpoint: POST /usuarios/me/role-request
Descripcion: Crea una solicitud de cambio de rol en `UserRequest`.

Body (ejemplo)
```json
{
  "requestedRole": "master"
}
```

Notas
- `jugador` solo puede solicitar `master`.
- `master` solo puede solicitar `colaborador`.
- `colaborador` y `admin` no pueden solicitar cambios.
- Si hay una pendiente o un bloqueo vigente, responde `409`.

Endpoint: GET /usuarios/me/master-request
Descripcion: Alias temporal de `GET /usuarios/me/role-request` con `requestedRole=master`.

Endpoint: POST /usuarios/me/master-request
Descripcion: Alias temporal de `POST /usuarios/me/role-request` para solicitudes a `master`.

Endpoint: GET /usuarios/role-requests
Descripcion: Listado admin de solicitudes de rol.

Autorización
- Solo `admin`, autenticado con `Authorization: Bearer <id_token>`.

Query params
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| status | string | `pending`, `approved` o `rejected` |
| requestedRole | string | `master` o `colaborador` |

Endpoint: PATCH /usuarios/role-requests/<id>
Descripcion: Resuelve una solicitud de rol existente.

Body (ejemplo)
```json
{
  "decision": "reject",
  "blockedUntilUtc": "2026-04-10T00:00:00.000Z",
  "adminComment": "Necesitamos más experiencia de dirección."
}
```

Notas
- `decision=approve` promociona automáticamente el rol global con `usp_SetUserRole`.
- `decision=reject` exige `blockedUntilUtc`.
- Si el rol actual del usuario ya no coincide con `CurrentRoleCodeAtRequest`, responde `409`.
- Autorización: solo `admin`, autenticado con `Authorization: Bearer <id_token>`.

Endpoint: GET /usuarios/master-requests
Descripcion: Alias admin de `GET /usuarios/role-requests` filtrado a `requestedRole=master`.

Endpoint: GET /usuarios/search
Descripcion: Búsqueda pública básica de usuarios para autocompletar, invitaciones a campaña y futuras funciones sociales. No requiere autenticación.

Query params
- `q`: obligatorio, string, mínimo 2 caracteres.
- `limit`: opcional, entero, default `10`, máximo `20`.

Reglas
- Busca por coincidencia por contenido en `displayName`.
- Si `q` coincide exactamente con `uid`, ese resultado se prioriza.
- Excluye usuarios baneados.
- Incluye usuarios activos aunque `perfil.mostrarPerfilPublico=false`.
- Solo devuelve datos básicos: `uid`, `displayName`, `photoThumbUrl`.

Respuesta 200 (ejemplo)
```json
[
  {
    "uid": "firebase-uid-exacto",
    "displayName": "Alberto",
    "photoThumbUrl": "http://127.0.0.1:5000/media/avatars/firebase-uid-exacto/thumb.webp"
  },
  {
    "uid": "firebase-uid-otro",
    "displayName": "Calisto",
    "photoThumbUrl": "http://127.0.0.1:5000/media/avatars/firebase-uid-otro/original.webp"
  }
]
```

Errores esperados
- `400`: falta `q`, `q` tiene menos de 2 caracteres o `limit` es inválido.
- `500`: error interno o de base de datos.

Endpoint: GET /usuarios/<uid>/public
Descripcion: Recupera el perfil público mínimo por `FirebaseUid`. Si el usuario no existe o `perfil.mostrarPerfilPublico=false`, devuelve el mismo `404`. Las estadísticas se calculan por `personajes.OwnerUserId`.

Respuesta 200 (ejemplo)
```json
{
  "uid": "firebase-uid",
  "displayName": "Perfil API",
  "photoThumbUrl": "http://127.0.0.1:5000/media/avatars/firebase-uid/thumb-aaaaaaaaaaaa.webp",
  "memberSince": "2026-03-09T12:00:00.000Z",
  "stats": {
    "totalPersonajes": 2,
    "publicos": 1
  }
}
```

Errores esperados
- `404`: `PUBLIC_PROFILE_NOT_FOUND`.

Endpoint: GET /media/avatars/<uid>/<filename>
Descripcion: Sirve el fichero público del avatar en formato `image/webp`. Solo admite nombres internos generados por la API (`original-<token>.webp`, `thumb-<token>.webp`).

Nota de alcance
- En esta iteración no existe `POST /usuarios/me/password`; el frontend debe usar Firebase Client SDK para reautenticar y cambiar contraseña.

Endpoint: GET /personajes
Descripcion: Lista detallada actor-scoped. Requiere `Authorization: Bearer <id_token>`.
Respuesta: array de `PersonajeDetalle`

PersonajeDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id del personaje |
| n | string | Nombre |
| ownerUid | string/null | Firebase UID del creador (AppUser relacionado) |
| ownerDisplayName | string/null | Nombre visible del creador. Se expone aunque el perfil publico esté oculto |
| id_region | number | Id de region de origen (`0` = Sin región) |
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
| visible_otros_usuarios | boolean | Si otros usuarios pueden ver este personaje |
| dg | number | DGS extra totales |
| cla | string | Lista serializada "Clase;Nivel" separada por `| ` |
| dom | string | Lista serializada de dominios separada por `| ` |
| stc | string | Lista serializada de subtipos separada por `| ` |
| subtipos | array | Lista de `SubtipoRef` (`{ Id, Nombre }`) |
| competencia_arma | array | Competencias directas del personaje sobre armas: `{ Id, Nombre }` |
| competencia_armadura | array | Competencias directas del personaje sobre armaduras/escudos: `{ Id, Nombre, Es_escudo }` |
| competencia_grupo_arma | array | Competencias directas del personaje sobre grupos de armas: `{ Id, Nombre }` |
| competencia_grupo_armadura | array | Competencias directas del personaje sobre grupos de armaduras: `{ Id, Nombre }` |
| familiares | array | Lista de `FamiliarMonstruoDetalle` asociados al personaje |
| companeros | array | Lista de `CompaneroMonstruoDetalle` asociados al personaje |
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
| ju | string | Nombre visible del creador |
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
Descripcion: Lista simplificada actor-scoped. Requiere `Authorization: Bearer <id_token>`.
Respuesta: array de `PersonajeSimplificado`

PersonajeSimplificado
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id del personaje |
| n | string | Nombre |
| ownerUid | string/null | Firebase UID del creador (AppUser relacionado) |
| ownerDisplayName | string/null | Nombre visible del creador. Se expone aunque el perfil publico esté oculto |
| id_region | number | Id de region de origen (`0` = Sin región) |
| r | object | `RazaSimplificada` |
| c | string | Lista serializada "Clase Nivel" separada por `, ` |
| p | string | Descripcion de personalidad |
| co | string | Descripcion de historia |
| ca | string | Campana |
| t | string | Trama |
| s | string | Subtrama |
| a | number | Archivado (0/1) |
| visible_otros_usuarios | boolean | Si otros usuarios pueden ver este personaje |

Reglas de visibilidad actor-scoped para listados y detalle
- `admin`: ve todo.
- El owner siempre ve sus propios personajes.
- Sin campaña: un personaje solo es visible si es propio o público.
- En campaña: un `master` activo ve todos los personajes de su campaña.
- En campaña: un miembro activo no-master ve sus personajes y los públicos de esa campaña.
- Un usuario ajeno a una campaña no ve personajes de esa campaña aunque sean públicos.

Endpoint: GET /personajes/<id_personaje>
Descripcion: Devuelve el mismo `PersonajeDetalle` del listado, pero para un único personaje y con la misma autorización actor-scoped.

Endpoint: POST /personajes/add
Descripcion: Crea personaje completo en una transacción y lo vincula al `AppUser` autenticado mediante `personajes.OwnerUserId`.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body minimo (ejemplo)
```json
{
  "uid": "firebase-uid",
  "personaje": {
    "nombre": "Nombre",
    "ataqueBase": "0",
    "idRaza": 1,
    "idTipoCriatura": 1,
    "idRegion": 0,
    "visible_otros_usuarios": false,
    "oficial": true
  },
  "caracteristicas": {
    "fuerza": { "valor": 10, "minimo": 0, "perdido": false },
    "destreza": { "valor": 10, "minimo": 0, "perdido": false },
    "constitucion": { "valor": 10, "minimo": 0, "perdido": false },
    "inteligencia": { "valor": 10, "minimo": 0, "perdido": false },
    "sabiduria": { "valor": 10, "minimo": 0, "perdido": false },
    "carisma": { "valor": 10, "minimo": 0, "perdido": false }
  },
  "tamano": { "idTamano": 0, "origen": "API" }
}
```

Colecciones soportadas adicionales
- `colecciones.competencia_arma`: array de ids o de objetos con `idArma`/`id_arma`.
- `colecciones.competencia_armadura`: array de ids o de objetos con `idArmadura`/`id_armadura`.
- `colecciones.competencia_grupo_arma`: array de ids o de objetos con `idGrupoArma`, `id_grupo_arma` o `id_grupo`.
- `colecciones.competencia_grupo_armadura`: array de ids o de objetos con `idGrupoArmadura`, `id_grupo_armadura` o `id_grupo`.

Validaciones relevantes
- `personaje.idRegion` (o `personaje.id_region`) es obligatorio y debe existir en `regiones`.
- Se permite `idRegion=0` para "Sin región".
- Forma canónica de crear un personaje sin campaña: omitir `campana`, `trama` y `subtrama`.
- Por compatibilidad también se aceptan las tres propiedades a `null`, pero el frontend nuevo no debería enviarlas así.
- Si se indica historia, deben enviarse conjuntamente `campana`, `trama` y `subtrama`, y todas deben existir.
- La `trama` debe pertenecer a la `campana`.
- La `subtrama` debe pertenecer a la `trama`.
- El actor debe tener permiso `personajes.create`.
- Si se indica campaña, el actor debe pertenecer a ella con membresía `activa` como `jugador` o `master`, salvo `admin`.

Respuesta 201
```json
{
  "message": "Personaje creado exitosamente",
  "idPersonaje": 123,
  "ownerUserId": "00000000-0000-0000-0000-000000000000",
  "uid": "firebase-uid"
}
```

Errores esperados
- `404`: AppUser no encontrado para `uid`.
- `403`: usuario baneado o sin `personajes.create`.
- `400`: payload invalido o conflicto de integridad de datos.

Endpoint: PATCH /personajes/<id_personaje>/visible
Descripcion: Actualiza exclusivamente la flag `visible_otros_usuarios` de un personaje.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body (ejemplo)
```json
{
  "uid": "firebase-uid",
  "visible_otros_usuarios": true
}
```

Respuesta 200
```json
{
  "message": "Visibilidad actualizada correctamente",
  "idPersonaje": 123,
  "visible_otros_usuarios": true,
  "uid": "firebase-uid"
}
```

Errores esperados
- `400`: body invalido o `visible_otros_usuarios` no booleano.
- `403`: usuario baneado o no propietario (si no es admin).
- `404`: AppUser no encontrado o personaje inexistente.
- `500`: error interno no controlado.

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
Descripcion: Lista actor-scoped de campañas visibles. Requiere `Authorization: Bearer <id_token>`.

Autorización
- `admin`: ve todas las campañas.
- resto: solo campañas donde tenga membresía `activa`.

Respuesta
```json
[
  {
    "i": 1,
    "n": "Nombre de campana",
    "campaignRole": "jugador",
    "membershipStatus": "activo"
  }
]
```

Endpoint: POST /campanas
Descripcion: Crea una campaña y añade automáticamente al actor como `master` de la campaña.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body
```json
{
  "uid": "firebase-uid",
  "nombre": "La costa de las nieblas"
}
```

Respuesta 201
```json
{
  "message": "Campaña creada correctamente",
  "idCampana": 7,
  "nombre": "La costa de las nieblas",
  "masterUid": "firebase-uid"
}
```

Notas
- Requiere `campanas.create`.
- El actor puede ser `master`, `colaborador` o `admin`.

Endpoint: POST /campanas/add
Descripcion: Alias legacy de `POST /campanas`. El frontend nuevo debería usar la ruta canónica.

Endpoint: PATCH /campanas/<id_campana>
Descripcion: Renombra una campaña existente.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body
```json
{
  "uid": "firebase-uid",
  "nombre": "Nuevo nombre"
}
```

Notas
- Solo `admin` o el `master` de esa campaña.

Endpoint: POST /campanas/<id_campana>/jugadores
Descripcion: Añade un usuario a la campaña con rol de campaña fijo `jugador`.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body
```json
{
  "uid": "firebase-uid",
  "targetUid": "firebase-uid-destino"
}
```

Respuesta 201
```json
{
  "message": "Jugador añadido a la campaña",
  "idCampana": 7,
  "targetUid": "firebase-uid-destino",
  "campaignRole": "jugador",
  "membershipStatus": "activo"
}
```

Notas
- Aunque el usuario destino tenga rol global `master`, aquí entra como `jugador`.
- Si ya pertenecía, la API lo fuerza igualmente a `jugador`.
- Si estaba `inactivo` o `expulsado`, el alta lo reactiva como `jugador`.

Endpoint: GET /campanas/<id_campana>/jugadores
Descripcion: Lista los miembros de una campaña. Por defecto devuelve solo los miembros con `membershipStatus=activo`. Si el frontend necesita histórico, puede pedir también `inactivo` y `expulsado`.

Autorización
- `admin`
- cualquier miembro activo de la campaña (`master` o `jugador`)
- siempre mediante `Authorization: Bearer <id_token>`

Query params
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| includeInactive | boolean | Si vale `true`, incluye también `inactivo` y `expulsado` |

Ejemplo
`GET /campanas/7/jugadores?includeInactive=true`

Respuesta 200
```json
[
  {
    "userId": "00000000-0000-0000-0000-000000000001",
    "uid": "firebase-master",
    "displayName": "Master actual",
    "email": "master@test.com",
    "campaignRole": "master",
    "membershipStatus": "activo",
    "isActive": true,
    "addedAtUtc": "2026-03-10T15:10:00.000Z",
    "addedByUserId": "00000000-0000-0000-0000-000000000001"
  },
  {
    "userId": "00000000-0000-0000-0000-000000000002",
    "uid": "firebase-expulsado",
    "displayName": "Jugador expulsado",
    "email": "expulsado@test.com",
    "campaignRole": "jugador",
    "membershipStatus": "expulsado",
    "isActive": false,
    "addedAtUtc": "2026-03-10T15:20:00.000Z",
    "addedByUserId": "00000000-0000-0000-0000-000000000001"
  }
]
```

Valores posibles de `campaignRole`
- `master`
- `jugador`

Valores posibles de `membershipStatus`
- `activo`
- `inactivo`
- `expulsado`

Endpoint: DELETE /campanas/<id_campana>/jugadores/<uid>
Descripcion: Retira a un usuario de la campaña sin borrar el registro histórico.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body
```json
{
  "uid": "firebase-uid",
  "status": "expulsado"
}
```

Notas
- Solo `admin` o el `master` de esa campaña.
- No permite eliminar al `master` actual desde esta ruta.
- Si no se indica `status`, la API usa `expulsado`.
- `status` admite `inactivo` o `expulsado`.

Respuesta 200
```json
{
  "message": "Jugador retirado de la campaña",
  "idCampana": 7,
  "targetUid": "firebase-uid-destino",
  "campaignRole": "jugador",
  "membershipStatus": "expulsado"
}
```

Endpoint: PATCH /campanas/<id_campana>/master
Descripcion: Transfiere el master de la campaña a otro usuario.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body
```json
{
  "uid": "firebase-uid-master-actual",
  "targetUid": "firebase-uid-nuevo-master",
  "keepPreviousAsPlayer": true
}
```

Respuesta 200
```json
{
  "message": "Master de campaña transferido correctamente",
  "idCampana": 7,
  "newMasterUid": "firebase-uid-nuevo-master",
  "previousMasterDisposition": "jugador"
}
```

Notas
- `keepPreviousAsPlayer=true`: el master saliente queda como `jugador`.
- `keepPreviousAsPlayer=false`: el master saliente queda como `inactivo`.
- Solo `admin` o el `master` actual.

Endpoint: GET /tramas
Respuesta
```json
[
  { "i": 1, "n": "Nombre de trama", "idCampana": 7 }
]
```

Endpoint: GET /tramas/campana/<id_campana>
Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_campana | number | Id de campana |

Respuesta: array de objetos `{ i, n }`.

Endpoint: POST /tramas/campana/<id_campana>
Descripcion: Crea una trama dentro de la campaña indicada.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body
```json
{
  "uid": "firebase-uid",
  "nombre": "Los barcos negros"
}
```

Respuesta 201
```json
{
  "message": "Trama creada correctamente",
  "idTrama": 11,
  "idCampana": 7,
  "nombre": "Los barcos negros"
}
```

Endpoint: POST /tramas/add
Descripcion: Alias legacy. Requiere `idCampana` en el body.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body mínimo
```json
{
  "uid": "firebase-uid",
  "idCampana": 7,
  "nombre": "Los barcos negros"
}
```

Endpoint: PATCH /tramas/<id_trama>
Descripcion: Renombra una trama existente. Solo `admin` o el `master` de la campaña a la que pertenece.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Endpoint: GET /subtramas
Respuesta
```json
[
  { "i": 1, "n": "Nombre de subtrama", "idTrama": 11 }
]
```

Endpoint: GET /subtramas/trama/<id_trama>
Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_trama | number | Id de trama |

Respuesta: array de objetos `{ i, n }`.

Endpoint: POST /subtramas/trama/<id_trama>
Descripcion: Crea una subtrama dentro de la trama indicada.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body
```json
{
  "uid": "firebase-uid",
  "nombre": "La torre hundida"
}
```

Respuesta 201
```json
{
  "message": "Subtrama creada correctamente",
  "idSubtrama": 21,
  "idTrama": 11,
  "idCampana": 7,
  "nombre": "La torre hundida"
}
```

Endpoint: POST /subtramas/add
Descripcion: Alias legacy. Requiere `idTrama` en el body.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

Body mínimo
```json
{
  "uid": "firebase-uid",
  "idTrama": 11,
  "nombre": "La torre hundida"
}
```

Endpoint: PATCH /subtramas/<id_subtrama>
Descripcion: Renombra una subtrama existente. Solo `admin` o el `master` de la campaña a la que pertenece su trama.

Autorización
- Requiere `Authorization: Bearer <id_token>`.
- Si el body incluye `uid` o `firebaseUid` por compatibilidad legacy, debe coincidir con el usuario autenticado.

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

Endpoint: PATCH /manuales/<id_manual>
Descripcion: Actualiza de forma parcial las flags de contenido del manual. Este endpoint solo permite cambiar las flags de contenido; no admite cambios de `id`, `nombre` ni `oficial`.

Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_manual | number | Id de manual |

Body (ejemplo)
```json
{
  "Incluye_dotes": true,
  "Incluye_razas": 1,
  "Incluye_tipos": false
}
```

Campos admitidos en body
- `Incluye_dotes` o alias `dote`
- `Incluye_conjuros` o alias `conjuro`
- `Incluye_plantillas` o alias `plantilla`
- `Incluye_monstruos` o alias `monstruo`
- `Incluye_razas` o alias `raza`
- `Incluye_clases` o alias `clase`
- `Incluye_tipos` o alias `tipo`
- `Incluye_subtipos` o alias `subtipo`

Valores admitidos por flag
- boolean: `true` / `false`
- number: `1` / `0`
- string: `true`, `false`, `si`, `sí`, `no`, `yes`, `1`, `0`

Respuesta 200
```json
{
  "Id": 7,
  "Nombre": "Manual de prueba",
  "Incluye_dotes": 1,
  "Incluye_conjuros": 1,
  "Incluye_plantillas": 0,
  "Incluye_monstruos": 1,
  "Incluye_razas": 1,
  "Incluye_clases": 1,
  "Incluye_tipos": 0,
  "Incluye_subtipos": 1,
  "Oficial": true
}
```

Errores esperados
- `400`: body invalido, sin flags, con flags no permitidas o con tipos no booleanos.
- `404`: manual no encontrado.
- `500`: error de base de datos o error interno no controlado.

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

Endpoint: GET /monstruos
Respuesta: array de `MonstruoDetalle`

Endpoint: GET /monstruos/<id_monstruo>
Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_monstruo | number | Id de monstruo |

Respuesta: objeto `MonstruoDetalle`

Respuesta 404 (ejemplo)
```json
{
  "error": "Monstruo no encontrado",
  "id_monstruo": 123
}
```

Endpoint: GET /familiares
Respuesta: array de `FamiliarMonstruoDetalle`

Endpoint: GET /familiares/<id_familiar>
Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_familiar | number | Id de familiar |

Respuesta: objeto `FamiliarMonstruoDetalle`

Respuesta 404 (ejemplo)
```json
{
  "error": "Familiar no encontrado",
  "id_familiar": 123
}
```

Endpoint: GET /familiares/personaje/<id_personaje>
Respuesta: array de `FamiliarMonstruoDetalle` filtrado por personaje.
En este endpoint, `Personajes` solo contiene el personaje solicitado.

Endpoint: GET /companeros
Respuesta: array de `CompaneroMonstruoDetalle`

Endpoint: GET /companeros/<id_companero>
Parametros de path
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| id_companero | number | Id de companero |

Respuesta: objeto `CompaneroMonstruoDetalle`

Respuesta 404 (ejemplo)
```json
{
  "error": "Companero no encontrado",
  "id_companero": 123
}
```

Endpoint: GET /companeros/personaje/<id_personaje>
Respuesta: array de `CompaneroMonstruoDetalle` filtrado por personaje.
En este endpoint, `Personajes` solo contiene el personaje solicitado.

MonstruoDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id del monstruo |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Manual | object | `{ Id, Nombre, Pagina }` |
| Tipo | object | `{ Id, Nombre, Descripcion, Oficial }` |
| Tamano | object | `{ Id, Nombre, Modificador, Modificador_presa }` |
| Dados_golpe | object | `{ Cantidad, Tipo_dado, Suma }` |
| Movimientos | object | `{ Correr, Nadar, Volar, Trepar, Escalar }` |
| Maniobrabilidad | object | Detalle de maniobrabilidad de vuelo |
| Alineamiento | object | `AlineamientoDetalle` |
| Iniciativa | number | Modificador de iniciativa |
| Defensa | object | `{ Ca, Toque, Desprevenido, Armadura_natural, Reduccion_dano, Resistencia_conjuros, Resistencia_elemental }` |
| Ataque | object | `{ Ataque_base, Presa, Ataques, Ataque_completo }` |
| Espacio | number | Espacio |
| Alcance | number | Alcance |
| Salvaciones | object | `{ Fortaleza, Reflejos, Voluntad }` |
| Caracteristicas | object | `{ Fuerza, Destreza, Constitucion, Inteligencia, Sabiduria, Carisma }` |
| Cd_sortilegas | string | CD de sortilegas |
| Valor_desafio | string | Valor de desafio |
| Tesoro | string | Tesoro |
| Familiar | boolean | Puede actuar como familiar |
| Companero | boolean | Puede actuar como companero |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |
| Idiomas | array | Lista de `IdiomaDetalle` |
| Alineamientos_requeridos | object | `{ Familiar: [AlineamientoBasicoRef], Companero: [AlineamientoBasicoRef] }` |
| Sortilegas | array | Lista de `MonstruoSortilega` |
| Habilidades | array | Lista de `MonstruoHabilidad` |
| Dotes | array | Lista de `DoteContextual` |
| Niveles_clase | array | Lista de `MonstruoNivelClase` |
| Subtipos | array | Lista de `ReferenciaCorta` (subtipo) |
| Raciales | array | Lista de `RacialDetalle` |
| Ataques_especiales | array | Lista de `RacialDetalle` |
| Familiares | array | Lista de `FamiliarMonstruoDetalle` |
| Companeros | array | Lista de `CompaneroMonstruoDetalle` |
| Personajes_relacionados | object | Backrefs por familiar/companero (`PersonajeRefMonstruo`) |

AlineamientoBasicoRef
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de alineamiento basico |
| Nombre | string | Nombre |

MonstruoSortilega
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Conjuro | object | `ConjuroDetalle` |
| Nivel_lanzador | number | Nivel de lanzador |
| Usos_diarios | string | Usos diarios |

MonstruoHabilidad
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id_habilidad | number | Id de habilidad |
| Habilidad | string | Nombre |
| Id_caracteristica | number | Id de caracteristica |
| Caracteristica | string | Nombre de caracteristica |
| Descripcion | string | Descripcion |
| Soporta_extra | boolean | Si soporta extra |
| Entrenada | boolean | Si requiere entrenamiento |
| Id_extra | number | Id de extra (si aplica) |
| Extra | string | Nombre de extra |
| Rangos | number | Rangos |

MonstruoNivelClase
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Clase | object | `{ Id, Nombre }` |
| Nivel | number | Nivel en esa clase |
| Plantilla | object | `{ Id, Nombre }` |
| Preferencia_legal | object | `{ Id, Nombre }` |
| Preferencia_moral | object | `{ Id, Nombre }` |
| Dote | object | `{ Id, Nombre }` |

FamiliarMonstruoDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| *Base* | object | Es una ficha final mergeada: `MonstruoDetalle` + sobreescrituras de `familiares` |
| Monstruo_origen | object | `{ Id, Nombre }` del monstruo base usado para el merge |
| Id_familiar | number | Id de familiar |
| Vida | number | Vida |
| Plantilla | object | `{ Id, Nombre }` |
| Personajes | array | Lista de `PersonajeRefMonstruo` |
| Especiales | array | Lista de objetos con `Especial` + `Contexto` |

Sobrescrituras de escalares en familiar
- `Nombre`
- `Ataque.Ataque_base`
- `Salvaciones.Fortaleza`, `Salvaciones.Reflejos`, `Salvaciones.Voluntad`
- `Defensa.Armadura_natural`
- `Caracteristicas.Inteligencia`
- `Defensa.Resistencia_conjuros` (desde `rc`)

Merge de colecciones (base + derivadas, con deduplicacion)
- `Habilidades` por (`Id_habilidad`, `Id_extra`)
- `Dotes` por (`Dote.Id`, `Contexto.Id_extra`)
- `Especiales` por (`Especial.Id`, `Contexto.Id_extra`)
- `Raciales` por (`Id`)
- `Sortilegas` por (`Conjuro.Id`, `Nivel_lanzador`, `Usos_diarios`)

CompaneroMonstruoDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| *Base* | object | Es una ficha final mergeada: `MonstruoDetalle` + sobreescrituras de `companeros` |
| Monstruo_origen | object | `{ Id, Nombre }` del monstruo base usado para el merge |
| Id_companero | number | Id de companero |
| Vida | number | Vida |
| Dg_adi | number | Dados de golpe adicionales |
| Trucos_adi | number | Trucos adicionales |
| Plantilla | object | `{ Id, Nombre }` |
| Personajes | array | Lista de `PersonajeRefMonstruo` |
| Especiales | array | Lista de objetos con `Especial` + `Contexto` |

Sobrescrituras de escalares en companero
- `Nombre`
- `Defensa.Armadura_natural`
- `Caracteristicas.Fuerza`, `Caracteristicas.Destreza`, `Caracteristicas.Inteligencia`

Merge de colecciones (base + derivadas, con deduplicacion)
- `Habilidades` por (`Id_habilidad`, `Id_extra`)
- `Dotes` por (`Dote.Id`, `Contexto.Id_extra`)
- `Especiales` por (`Especial.Id`, `Contexto.Id_extra`)
- `Raciales` por (`Id`)
- `Sortilegas` por (`Conjuro.Id`, `Nivel_lanzador`, `Usos_diarios`)

PersonajeRefMonstruo
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id_personaje | number | Id de personaje |
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

Endpoint: POST /conjuros/add
Descripcion: Crea un conjuro en transaccion (`conjuros` + componentes + descriptores + niveles por clase + niveles por dominio o disciplina), con ACL obligatoria por `uid`/`firebaseUid`.

Body (estructura canonica)
```json
{
  "uid": "firebase-uid",
  "conjuro": {
    "variante": "base",
    "nombre": "Manos ardientes",
    "descripcion": "Texto",
    "id_manual": 1,
    "pagina": 10,
    "id_tiempo_lanz": 1,
    "id_alcance": 1,
    "objetivo": "",
    "efecto": "Llama en cono",
    "area": "",
    "duracion": "Instantánea",
    "tipo_salvacion": "Reflejos mitad",
    "descripcion_componentes": "V, S",
    "permanente": false,
    "oficial": true,
    "arcano": true,
    "divino": false,
    "id_escuela": 1,
    "resistencia_conjuros": true
  },
  "componentes": [1, { "id_componente": 2 }],
  "descriptores": [1],
  "niveles_clase": [
    { "id_clase": 1, "nivel": 1, "espontaneo": false }
  ],
  "niveles_dominio": [
    { "id_dominio": 1, "nivel": 1, "espontaneo": true }
  ]
}
```

Variante `base`
- Requiere `arcano` y/o `divino`; al menos uno debe ser `true`.
- Requiere `id_escuela > 0`.
- Requiere `resistencia_conjuros`.
- Acepta `niveles_dominio`.
- Rechaza `id_disciplina`, `id_subdisciplina`, `puntos_poder`, `descripcion_aumentos` y `niveles_disciplina`.
- Guarda `id_disciplina=0`, `id_subdisciplina=0`, `psionico=0`, `alma=0`, `resistencia_poderes=0`, `puntos_poder=0`.

Variante `psionico`
- Requiere `id_disciplina > 0`.
- `id_subdisciplina` es opcional; si se envía debe pertenecer a la disciplina indicada.
- Requiere `puntos_poder`.
- Requiere `resistencia_poderes`.
- Acepta `niveles_disciplina`.
- Rechaza `id_escuela` y `niveles_dominio`.
- Guarda `id_escuela=0`, `arcano=0`, `divino=0`, `alma=0`, `resistencia_conjuros=0`.

Validaciones clave
- `uid` (o alias `firebaseUid`) es obligatorio.
- AppUser debe existir, no estar baneado y tener permiso `create` en recurso `conjuros`.
- `conjuro.variante` solo admite `base` o `psionico`; `alma` se rechaza explícitamente.
- Validación fuerte de FKs en ids referenciados.
- `componentes` y `descriptores` aceptan ids sueltos u objetos con el id correspondiente.
- `componentes` determina automáticamente el bit `conjuros.componente`.
- Las listas relacionales se deduplican por clave primaria lógica; si la misma clave llega con datos distintos, responde `400`.
- `objetivo`, `efecto` y `area` se guardan como cadena vacía si se omiten.

Respuesta 201
```json
{
  "message": "Conjuro creado exitosamente",
  "idConjuro": 123,
  "uid": "firebase-uid"
}
```

Errores esperados
- `400`: payload inválido, variante no soportada, FK inexistente o mezcla inconsistente entre `base` y `psionico`.
- `403`: usuario baneado o sin permiso de creación en `conjuros`.
- `404`: AppUser no encontrado para el `uid`.
- `409`: conflicto de negocio (ej. nombre de conjuro ya existente).
- `500`: error interno no controlado.

Endpoint: GET /componentes-conjuros
Respuesta: array de `IdNombre`

Endpoint: GET /tiempos-lanzamiento
Respuesta: array de `IdNombre`

Endpoint: GET /alcances-conjuros
Respuesta: array de `IdNombre`

Endpoint: GET /descriptores
Respuesta: array de `IdNombre`

Endpoint: GET /subdisciplinas
Respuesta: array de `SubdisciplinaCatalogo`

SubdisciplinaCatalogo
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| i | number | Id de subdisciplina |
| n | string | Nombre |
| id_disciplina | number | Disciplina a la que pertenece la fila |

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

Endpoint: GET /enemigos-predilectos
Respuesta: array de `EnemigoPredilectoDetalle`

EnemigoPredilectoDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de enemigo predilecto |
| Nombre | string | Nombre |

Endpoint: GET /extras
Respuesta: array de `ExtraDetalle`

Endpoint: GET /extras/<id_extra>
Respuesta: objeto `ExtraDetalle`
Respuesta 404
```json
{
  "error": "Extra no encontrado",
  "id_extra": 123
}
```

ExtraDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de extra |
| Nombre | string | Nombre |

Endpoint: GET /tamanos
Respuesta: array de `TamanoRef`

Endpoint: GET /tamanos/<id_tamano>
Respuesta: objeto `TamanoRef`
Respuesta 404
```json
{
  "error": "Tamaño no encontrado",
  "id_tamano": 123
}
```

TamanoRef
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de tamaño |
| Nombre | string | Nombre |
| Modificador | number | Modificador de tamaño |
| Modificador_presa | number | Modificador de presa por tamaño |

Endpoint: GET /armas
Respuesta: array de `ArmaDetalle`

Endpoint: GET /armas/<id_arma>
Respuesta: objeto `ArmaDetalle`
Respuesta 404
```json
{
  "error": "Arma no encontrada",
  "id_arma": 123
}
```

ArmaDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de arma |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Manual | object | `{ Id, Nombre, Pagina }` |
| Dano | string | Dano del arma |
| Tipo_dano | object | `{ Id, Nombre }` |
| Tipo_arma | object | `{ Id, Nombre }` |
| Precio | number | Precio |
| Material | object | `{ Id, Nombre }` |
| Tamano | object | `{ Id, Nombre, Modificador, Modificador_presa }` |
| Peso | number | Peso |
| Critico | string | Rango/multiplicador de critico |
| Incremento_distancia | number | Incremento de distancia |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |
| Encantamientos | array | Lista de encantamientos `{ Id, Nombre, Descripcion, Modificador, Coste, Tipo }` |

Endpoint: GET /armaduras
Respuesta: array de `ArmaduraDetalle`

Endpoint: GET /armaduras/<id_armadura>
Respuesta: objeto `ArmaduraDetalle`
Respuesta 404
```json
{
  "error": "Armadura no encontrada",
  "id_armadura": 123
}
```

ArmaduraDetalle
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id de armadura |
| Nombre | string | Nombre |
| Descripcion | string | Descripcion |
| Manual | object | `{ Id, Nombre, Pagina }` |
| Ca | number | Bonificador de CA |
| Bon_des | number | Maximo bonificador de destreza |
| Penalizador | number | Penalizador de armadura |
| Tipo_armadura | object | `{ Id, Nombre }` |
| Precio | number | Precio |
| Material | object | `{ Id, Nombre }` |
| Peso_armadura | object | `{ Id, Nombre }` |
| Peso | number | Peso |
| Tamano | object | `{ Id, Nombre, Modificador, Modificador_presa }` |
| Fallo_arcano | number | Probabilidad de fallo arcano |
| Es_escudo | boolean | `true` si la entrada referencia a un escudo |
| Oficial | boolean | Oficial (true=oficial, false=homebrew) |
| Encantamientos | array | Lista de encantamientos `{ Id, Nombre, Descripcion, Modificador, Coste, Tipo }` |

Endpoint: GET /grupos-armas
Respuesta: array de `GrupoCompetencia`

Endpoint: GET /grupos-armas/<id_grupo_arma>
Respuesta: objeto `GrupoCompetencia`
Respuesta 404
```json
{
  "error": "Grupo de arma no encontrado",
  "id_grupo_arma": 123
}
```

Endpoint: GET /grupos-armaduras
Respuesta: array de `GrupoCompetencia`

Endpoint: GET /grupos-armaduras/<id_grupo_armadura>
Respuesta: objeto `GrupoCompetencia`
Respuesta 404
```json
{
  "error": "Grupo de armadura no encontrado",
  "id_grupo_armadura": 123
}
```

GrupoCompetencia
| Campo | Tipo | Descripcion |
| --- | --- | --- |
| Id | number | Id del grupo |
| Nombre | string | Nombre del grupo |

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
| Extras_soportados | object | Banderas: { Extra_arma, Extra_armadura, Extra_armadura_armaduras, Extra_armadura_escudos, Extra_escuela, Extra_habilidad } |
| Extras_disponibles | object | Catalogos validos: { Armas, Armaduras, Escuelas, Habilidades }. Cada item de `Armaduras` incluye `Es_escudo` |
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

Endpoint: POST /dotes/add
Descripcion: Crea una dote en transaccion (`dotes` + extras + `dotes_habilidades` + todas las familias `dote_prerrequisito_*`), con ACL obligatoria por `uid`/`firebaseUid`.

Body (estructura canonica)
```json
{
  "uid": "firebase-uid",
  "dote": {
    "nombre": "Nombre de dote",
    "beneficio": "Texto",
    "descripcion": "Texto",
    "normal": "Texto",
    "especial": "Texto",
    "id_manual": 1,
    "pagina": 123,
    "id_tipo": 1,
    "id_tipo2": 2,
    "oficial": true,
    "repetible": false,
    "repetible_distinto_extra": false,
    "repetible_comb": false,
    "comp_arma": false,
    "extra_arma": false,
    "extra_armadura_armaduras": false,
    "extra_armadura_escudos": false,
    "extra_escuela": false,
    "extra_habilidad": false
  },
  "modificadores": {},
  "habilidades_otorgadas": [],
  "extras_disponibles": {
    "armas": [],
    "armaduras": [],
    "escuelas": [],
    "habilidades": []
  },
  "prerrequisitos": {}
}
```

Validaciones clave
- `uid` (o alias `firebaseUid`) es obligatorio.
- AppUser debe existir, no estar baneado y tener permiso `create` en recurso `dotes`.
- `dote.id_tipo` y `dote.id_tipo2` no pueden ser iguales.
- Solo uno de `repetible`, `repetible_distinto_extra`, `repetible_comb` puede estar activo.
- Solo una familia de extra puede estar activa entre `extra_arma`, `extra_armadura_*`, `extra_escuela`, `extra_habilidad`.
- `extra_armadura_armaduras` y `extra_armadura_escudos` pueden estar activos a la vez.
- Si un `extra_*` está activo, su lista en `extras_disponibles` debe traer al menos un id.
- Si `extra_armadura_armaduras` o `extra_armadura_escudos` están activos, `extras_disponibles.armaduras` debe incluir ids del tipo correspondiente.
- Si se envían listas de `extras_disponibles` sin su flag correspondiente, responde `400`.
- Campos omitidos en `modificadores` se guardan como `0`.
- `prerrequisitos.opcional` default `0`.
- En `prerrequisitos.clase_especial`, `id_extra` solo es obligatorio si el especial seleccionado usa extras.
- Si el especial no usa extras, la API acepta omitir `id_extra` y resuelve internamente el extra canónico `No aplica`.
- En `prerrequisitos.dote`, `id_extra` solo es obligatorio si la dote prerrequisito soporta extras; si no los soporta, la API acepta omitirlo y guarda `0` como valor de "no aplica".
- En `prerrequisitos.habilidad`, `requiere_extra` y `extras` solo aplican si la habilidad seleccionada usa extras; si no los usa, la API asume automáticamente que no aplica extra.
- `dotes.prerrequisitos` se guarda a `1` cuando existe al menos una fila en cualquier familia; en caso contrario `0`.
- Validación fuerte de FKs en ids referenciados.
- Dedupe por clave primaria por tabla; si hay colisión con datos distintos, responde `400`.
- Compatibilidad: `dote.extra_armadura` todavía se acepta como alias legado y activa ambos flags nuevos.

Motivo del cambio
- El backend ahora infiere si un extra aplica desde los datos maestros (`especiales.extra`, flags `extra_*` de `dotes`, `habilidades.extra`) para evitar que el front tenga que enviar sentinelas artificiales como `-1` o `0` cuando realmente no existe selección posible.

Respuesta 201
```json
{
  "message": "Dote creada exitosamente",
  "idDote": 123,
  "uid": "firebase-uid"
}
```

Errores esperados
- `400`: payload inválido, FK inexistente o integridad de datos.
- `403`: usuario baneado o sin permiso de creación en `dotes`.
- `404`: AppUser no encontrado para el `uid`.
- `409`: conflicto de negocio (ej. nombre de dote ya existente).
- `500`: error interno no controlado.

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
| puede_elegir_especialidad | boolean | Puede elegir especialidad |
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
| nivel_max_poder_accesible_nivel_lanzadorPsionico | number | Nivel maximo de poder accesible segun nivel de lanzador psionico (`-1` por defecto) |
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
