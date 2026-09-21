# Senderia Chile - Turismo

Proyecto del ramo Ingeniería Web y Móvil.

## Integrantes

* Rigoberto Canales
* Benjamín Pizarro
* Joaquín Muñoz
* Simón Vera
---
## Índice

1. [Justificación del problema](#1-justificación-del-problema)
2. [Usuarios objetivo](#2-usuarios-objetivo)
3. [Roles del sistema](#3-roles-del-sistema)
4. [Proto-personas](#4-proto-personas)
5. [Requerimientos](#5-requerimientos)
6. [Arquitectura de la Información / UX](#6-arquitectura-de-la-información--ux)
7. [Diferenciación por roles](#7-diferenciación-de-acceso-según-roles)
8. [Flujos principales de tareas](#8-flujos-principales-de-tareas)
9. [Puntos críticos de interacción](#9-puntos-críticos-de-interacción)
10. [Justificación técnica](#10-justificación-técnica)

---

## 1. Justificación del problema

Chile posee una amplia diversidad de destinos turísticos distribuidos a lo largo de su territorio, que abarca desde el desierto de Atacama hasta la Patagonia y la Isla de Pascua. Sin embargo, la información sobre estos destinos se encuentra fragmentada en múltiples fuentes: sitios web institucionales, blogs de viajeros, redes sociales, guías impresas y aplicaciones de mapas genéricas. Esta dispersión dificulta que un turista —ya sea nacional o extranjero— pueda acceder de forma centralizada, organizada y confiable a la información necesaria para planificar o enriquecer su experiencia de viaje.

Una de las dificultades existentes corresponde a que los usuarios deben consultar múltiples plataformas para obtener datos básicos como la ubicación exacta de un lugar, las categorías de destinos disponibles en una zona, los horarios de acceso o las condiciones particulares de visita. Las aplicaciones de mapas genéricas (como Google Maps) proporcionan información geográfica pero carecen de una curación orientada específicamente al turismo, mientras que los sitios web turísticos rara vez integran funcionalidades de geolocalización interactiva.

Además, en contextos donde los usuarios utilizan tanto computadores como dispositivos móviles — especialmente durante los desplazamientos —, existe la necesidad de disponer de una plataforma responsiva que ofrezca una experiencia fluida en ambos formatos. El acceso móvil es particularmente relevante cuando el turista se encuentra en terreno y necesita consultar información de forma inmediata.

En este contexto, el problema abordado por el proyecto corresponde a la **necesidad de centralizar, organizar y presentar información turística de Chile** de manera accesible, geolocalizada y categorizada, permitiendo que los usuarios puedan explorar destinos en un mapa interactivo, buscar lugares por categoría y acceder a información detallada de cada destino.

Para ello, se propone el desarrollo de una **aplicación web y móvil** que integre la **API de Google Maps** para la visualización geográfica de los destinos, complementada con un sistema de gestión de contenido que permita a un administrador registrar, clasificar y mantener actualizada la información de los lugares turísticos.

La plataforma no pretende reemplazar las fuentes de información existentes, sino ofrecer un punto de acceso unificado que facilite la exploración turística de Chile de forma intuitiva, visual y adaptable a diferentes dispositivos.

Por lo tanto, el desarrollo de esta plataforma permitiría centralizar la información turística, facilitar la consulta desde diferentes dispositivos y proporcionar una experiencia de interacción diferenciada entre turistas y administradores del contenido.

---

## 2. Usuarios objetivo

La aplicación considera principalmente dos grupos de usuarios: **turistas** (usuarios finales) y **administradores** del sistema. 

### Turistas

Los turistas corresponden a los principales usuarios de la plataforma. Se considera que constituyen un grupo diverso respecto de sus características, motivaciones, niveles de experiencia tecnológica y contextos de uso.

Dentro de este grupo pueden existir usuarios que:

- viajan solos, en pareja, en familia o en grupo;
- son turistas nacionales que buscan conocer destinos dentro de Chile;
- son turistas extranjeros que requieren información clara y accesible sobre destinos desconocidos;
- tienen diferentes niveles de familiaridad con aplicaciones web y móviles;
- consultan la plataforma antes del viaje (planificación) o durante el viaje (consulta en terreno);
- utilizan diferentes dispositivos para acceder a la información (computador, teléfono móvil, tablet);
- buscan destinos por categoría específica (playas, montañas, museos, parques nacionales, etc.);
- necesitan información geolocalizada para orientarse o calcular distancias;
- prefieren explorar de forma visual mediante un mapa interactivo;
- requieren datos prácticos como horarios, costos de entrada o condiciones de acceso;
- pueden tener conectividad limitada en zonas rurales o remotas.

#### Necesidades principales

Entre las necesidades identificadas para este grupo se encuentran:

- acceder a información turística centralizada y organizada;
- explorar destinos de forma visual mediante un mapa interactivo;
- buscar y filtrar lugares por categoría (playas, montañas, museos, parques, patrimonio, etc.);
- consultar información detallada de cada lugar (descripción, fotos, horarios, ubicación, condiciones de acceso);
- visualizar la ubicación exacta de un destino en el mapa;
- acceder a la plataforma desde dispositivos móviles y computadores;
- disponer de una navegación intuitiva y consistente;
- obtener resultados de búsqueda relevantes y bien organizados;
- no requerir registro obligatorio para consultar información básica;
- disponer de una interfaz que se adapte al tamaño de su pantalla.

### Administradores

Los administradores constituyen el segundo grupo de usuarios del sistema. Su función principal será gestionar el contenido turístico disponible en la plataforma y administrar los parámetros generales del sistema.

A diferencia del turista, el administrador tendrá acceso a funcionalidades relacionadas con la creación, modificación, eliminación y clasificación de destinos turísticos.

---

## 3. Roles del sistema

| Rol | Descripción |
|-----|-------------|
| **Turista Invitado** | Usuario no registrado. Puede explorar el mapa interactivo, buscar destinos y consultar información detallada. No tiene acceso a funciones de guardado o administración. |
| **Turista Registrado** | Usuario autenticado. Tiene las mismas funciones de exploración que el invitado, pero desbloquea la capacidad de guardar destinos en su lista de "Mis Favoritos" y gestionar su perfil. |
| **Administrador** | Usuario encargado de la gestión general de la plataforma. Puede crear, modificar, eliminar y clasificar destinos turísticos, además de gestionar cuentas. Requiere autenticación con credenciales específicas. |

### Definición de conceptos

- **Rol**: Define qué puede hacer un usuario dentro del sistema.
- **Proto-persona**: Describe quién podría ser ese usuario, sus características, necesidades, objetivos, dificultades y contexto de uso.

**Ejemplo:**
- **Rol**: Turista Registrado
- **Proto-persona**: Viajero nacional de 28 años que planifica un viaje al sur de Chile desde su teléfono móvil, busca destinos por categoría, los guarda en sus favoritos y necesita ver la ubicación exacta de cada lugar en el mapa para organizar su ruta.
---
## 4. Proto-personas

Las siguientes proto-personas corresponden a perfiles hipotéticos construidos a partir del análisis del problema y de las características esperadas de los usuarios de la plataforma. No representan resultados obtenidos directamente de usuarios reales, sino una caracterización preliminar utilizada para orientar las decisiones de diseño y desarrollo.

### Proto-persona 1: Turista nacional planificador

**Nombre ficticio:** Valentina  
**Tipo de usuario o rol:** Turista Registrado

#### Características generales

Valentina tiene 28 años, es profesional y vive en Santiago. Le gusta viajar por Chile durante sus vacaciones y fines de semana largos. Utiliza habitualmente su teléfono móvil para buscar información y planificar actividades. Tiene experiencia con aplicaciones de mapas y redes sociales, pero encuentra frustrante tener que consultar múltiples sitios web para obtener información completa sobre un destino.

Suele investigar destinos con anticipación y le interesa descubrir lugares menos conocidos. Valora la información práctica como horarios, condiciones de acceso y la posibilidad de ver la ubicación exacta en un mapa.

#### Necesidades principales

- Explorar destinos turísticos de diferentes regiones de Chile desde un mapa interactivo.
- Filtrar destinos por categoría (playas, montañas, termas, parques nacionales, etc.).
- Consultar información detallada antes de decidir visitar un lugar.
- Visualizar la ubicación geográfica exacta de cada destino.
- Acceder desde su teléfono móvil con una experiencia fluida.
- Guardar los lugares que más le gustan en una lista de favoritos.

#### Objetivos de uso

Utilizar la plataforma para descubrir y evaluar destinos turísticos en Chile, comparar opciones dentro de una misma zona o categoría, y disponer de información práctica que le permita planificar sus viajes de forma autónoma.

#### Dificultades o puntos de frustración

Puede presentar dificultades cuando:

- la información de un destino está incompleta o desactualizada;
- el mapa tarda demasiado en cargar los marcadores;
- la interfaz no se adapta bien a la pantalla de su teléfono;
- no puede filtrar resultados por zona geográfica o categoría;
- la búsqueda no arroja resultados relevantes;
- las fotos de los destinos no cargan o son de baja calidad;
- no puede distinguir fácilmente entre diferentes tipos de destinos en el mapa.

#### Funcionalidades de la aplicación que utilizaría

- Mapa interactivo con marcadores de destinos turísticos.
- Búsqueda y filtrado por categoría.
- Vista de detalle de un destino (fotos, descripción, horarios, ubicación).
- Navegación por regiones o zonas de Chile.
- Gestión de "Mis Favoritos".

#### Dispositivo y contexto probable de acceso

Utilizaría principalmente un teléfono móvil durante la fase de planificación (en casa, en el transporte) y durante el viaje (en terreno). Ocasionalmente usaría un computador portátil para exploraciones más detalladas.

---

### Proto-persona 2: Turista extranjero en terreno

**Nombre ficticio:** Thomas  
**Tipo de usuario o rol:** Turista Invitado

#### Características generales

Thomas tiene 35 años, es de origen europeo y se encuentra visitando Chile por primera vez. Tiene un nivel básico de español y depende de herramientas digitales para orientarse y encontrar actividades. Utiliza su teléfono móvil como herramienta principal de navegación y consulta durante el viaje.

Se encuentra ya en Chile y busca destinos cercanos a su ubicación actual. No conoce las regiones del país y necesita una forma visual e intuitiva de explorar las opciones disponibles. Valora las fotos, las ubicaciones en mapa y la información concreta.

#### Necesidades principales

- Explorar destinos cercanos a su ubicación actual en el mapa.
- Ver fotos e información visual de los destinos.
- Acceder a información práctica (horarios, costo, cómo llegar).
- Disponer de una interfaz intuitiva que no requiera conocimiento previo del país.
- Poder utilizar la aplicación de forma rápida sin necesidad de registrarse obligatoriamente.
- Que la interfaz sea clara y comprensible incluso con conocimiento básico de español.

#### Objetivos de uso

Utilizar la plataforma como herramienta de apoyo durante su estadía en Chile, descubriendo destinos turísticos cercanos y accediendo a la información necesaria para visitarlos.

#### Dificultades o puntos de frustración

Puede experimentar dificultades frente a:

- textos demasiado extensos o con vocabulario complejo;
- ausencia de elementos visuales (fotos, iconos, mapa);
- necesidad de registrarse para consultar información básica;
- mapa que no permite centrar en su ubicación actual;
- información sin estructura clara (todo mezclado en un solo bloque);
- interfaz que no funcione bien con conexión a internet limitada.

#### Funcionalidades de la aplicación que utilizaría

- Mapa interactivo con geolocalización.
- Marcadores de destinos con iconos por categoría.
- Vista de detalle con fotos y datos prácticos.
- Búsqueda por categoría.

#### Dispositivo y contexto probable de acceso

Utilizaría exclusivamente un teléfono móvil durante sus desplazamientos por Chile. Podría acceder con conexión móvil variable (buena en ciudades, limitada en zonas rurales).

---

### Proto-persona 3: Administrador de contenido turístico

**Nombre ficticio:** Carolina  
**Tipo de usuario o rol:** Administrador

#### Características generales

Carolina tiene 40 años y trabaja en la gestión de contenidos de la plataforma. Tiene experiencia con sistemas de gestión de contenido (CMS) y plataformas web. Trabaja habitualmente desde un computador de escritorio y necesita herramientas eficientes para registrar y mantener actualizada la información de los destinos turísticos.

Gestiona una cantidad considerable de destinos y necesita poder encontrar, editar y organizar la información de forma ágil. Valora la claridad de la interfaz administrativa y la retroalimentación del sistema ante cada operación.

#### Necesidades principales

- Crear nuevos registros de destinos turísticos con información completa.
- Modificar la información de destinos existentes.
- Eliminar destinos que ya no son relevantes o están duplicados.
- Clasificar destinos por categoría, región y tipo.
- Subir fotografías asociadas a cada destino.
- Gestionar las coordenadas geográficas de cada lugar.
- Consultar el listado de destinos registrados con opciones de búsqueda y filtrado.
- Gestionar usuarios del sistema.

#### Objetivos de uso

Mantener actualizada y organizada la base de datos de destinos turísticos de la plataforma, asegurando que la información disponible para los turistas sea precisa, completa y relevante.

#### Dificultades o puntos de frustración

Puede presentar frustración cuando:

- crear un destino requiere demasiados pasos;
- no puede encontrar rápidamente un destino existente;
- debe ingresar coordenadas manualmente sin asistencia visual;
- la plataforma no muestra confirmación clara de que una operación fue realizada;
- no puede previsualizar cómo se verá el destino desde la perspectiva del turista;
- la carga de imágenes es lenta o falla sin retroalimentación;
- la clasificación por categorías no es clara o está desorganizada.

#### Funcionalidades de la aplicación que utilizaría

- Panel de administración.
- CRUD de destinos turísticos (crear, consultar, modificar, eliminar).
- Carga y gestión de imágenes.
- Selección de ubicación en mapa para obtener coordenadas.
- Clasificación por categoría y región.
- Gestión de usuarios.
- Gestión de categorías.

#### Dispositivo y contexto probable de acceso

Utilizaría principalmente un computador de escritorio o portátil durante su horario laboral]. Las tareas de gestión se realizarían desde el panel de administración web; no se espera que utilice la versión móvil para tareas administrativas complejas.

---

## 5. Requerimientos

### 5.1 Requerimientos funcionales por rol

| ID | Requerimiento funcional | Rol |
|----|------------------------|-----|
| RF-01 | El sistema deberá permitir al turista explorar destinos turísticos de Chile mediante un mapa interactivo integrado con la API de Google Maps, mostrando marcadores geolocalizados de los lugares registrados. | Turista |
| RF-02 | El sistema deberá permitir al turista buscar y filtrar destinos turísticos por categoría (playas, montañas, museos, parques nacionales, patrimonio, termas, etc.) y por región de Chile. | Turista |
| RF-03 | El sistema deberá permitir al turista consultar la información detallada de un destino turístico, incluyendo su nombre, descripción, fotografías, categoría, región, horarios de acceso, condiciones de visita y ubicación geográfica en el mapa. | Turista |
| RF-04 | El sistema deberá permitir al administrador gestionar los destinos turísticos, incluyendo su creación, consulta, modificación y eliminación, así como la carga de fotografías y la asignación de coordenadas geográficas. | Administrador |
| RF-05 | El sistema deberá permitir al administrador clasificar cada destino turístico según su categoría, región y tipo, facilitando la organización y posterior filtrado por parte del turista. | Administrador |
| RF-06 | El sistema deberá permitir al administrador gestionar las categorías de destinos turísticos disponibles en la plataforma (crear, modificar y eliminar categorías). | Administrador |
| RF-07 | El sistema deberá permitir al administrador gestionar las cuentas de usuario del sistema, incluyendo la consulta de usuarios registrados y la modificación de roles o estados. | Administrador |
| RF-08 | El sistema deberá permitir al turista registrado guardar y administrar destinos de interés en una sección personalizada de "Mis Favoritos", funcionalidad que estará bloqueada para usuarios invitados. | Turista Registrado |

### 5.2 Funcionalidades transversales

Las siguientes funcionalidades son necesarias para el funcionamiento general de la aplicación, pero no forman parte de los siete requerimientos funcionales principales del dominio.

| ID | Funcionalidad transversal |
|----|--------------------------|
| FT-01 | El sistema deberá permitir el registro de usuarios (turistas y administradores). |
| FT-02 | El sistema deberá permitir a los usuarios iniciar sesión mediante sus credenciales. |
| FT-03 | El sistema deberá permitir cerrar una sesión activa. |
| FT-04 | El sistema deberá restringir las funcionalidades de administración de acuerdo con el rol del usuario autenticado. |
| FT-05 | El turista invitado podrá acceder a las funcionalidades de exploración y consulta sin necesidad de registrarse o iniciar sesión. |

### 5.3 Requerimientos no funcionales

Los requerimientos no funcionales establecen condiciones de calidad que deberá cumplir la plataforma.

#### UX y Usabilidad

| ID | Requerimiento |
|----|--------------|
| RNF-UX-01 — Diseño adaptable | La interfaz deberá adaptarse a dispositivos móviles y de escritorio, manteniendo accesibles las funcionalidades principales y evitando pérdida de información o funcionalidad. |
| RNF-UX-02 — Navegación consistente | La aplicación deberá mantener patrones de navegación consistentes y predecibles entre sus diferentes vistas, evitando cambios innecesarios en la ubicación o comportamiento de los controles principales. |
| RNF-UX-03 — Reducción de carga cognitiva | Las interfaces deberán evitar presentar cantidades excesivas de información simultáneamente y deberán organizar los contenidos utilizando secciones, jerarquías visuales y tarjetas de contenido claramente diferenciadas. |
| RNF-UX-04 — Retroalimentación al usuario | Las acciones realizadas por el usuario deberán proporcionar retroalimentación visual clara sobre su estado, incluyendo operaciones exitosas, errores, procesos en ejecución y cargas de contenido. |
| RNF-UX-05 — Exploración visual prioritaria | La plataforma deberá priorizar la exploración visual mediante el mapa interactivo y el uso de fotografías, permitiendo que el turista descubra destinos de forma intuitiva sin depender exclusivamente de búsquedas textuales. |

#### Accesibilidad

| ID | Requerimiento |
|----|--------------|
| RNF-ACC-01 — Claridad del contenido | Los textos, instrucciones y descripciones de la aplicación deberán utilizar lenguaje claro, directo y comprensible, evitando jerga técnica innecesaria. |
| RNF-ACC-02 — Jerarquía visual | Las interfaces deberán mantener una jerarquía visual clara mediante títulos, subtítulos, agrupación de información y diferenciación de los elementos interactivos. |
| RNF-ACC-03 — Alternativas visuales | Las fotografías deberán complementarse con textos descriptivos. La información relevante no deberá depender exclusivamente de elementos visuales. |
| RNF-ACC-04 — Interacción comprensible | Los botones, formularios, menús, marcadores del mapa y demás controles interactivos deberán estar claramente identificados y mantener un comportamiento consistente en toda la aplicación. |

#### Seguridad

| ID | Requerimiento |
|----|--------------|
| RNF-SEG-01 — Protección de contraseñas | Las contraseñas deberán almacenarse utilizando un mecanismo seguro de hash y nunca deberán ser almacenadas en texto plano. |
| RNF-SEG-02 — Autenticación | El acceso a funcionalidades de gestión (administrador) y de guardado (turista registrado) deberá requerir que el usuario se encuentre correctamente autenticado. |
| RNF-SEG-03 — Autorización por roles | El sistema deberá verificar el rol del usuario antes de permitir el acceso a funcionalidades restringidas. Un turista no podrá acceder a las funcionalidades de gestión exclusivas del administrador. |
| RNF-SEG-04 — Validación de datos | Los datos ingresados desde la interfaz de administración deberán ser validados tanto en el frontend como en el backend antes de ser procesados o almacenados. |
| RNF-SEG-05 — Protección de claves API | Las credenciales, claves de API (incluyendo la clave de Google Maps), secretos y configuraciones sensibles no deberán almacenarse directamente en el código fuente ni publicarse en el repositorio. |

#### Rendimiento

| ID | Requerimiento |
|----|--------------|
| RNF-REN-01 — Rendimiento de consulta | Las operaciones habituales de consulta (búsqueda de destinos, carga del mapa, filtrado por categoría) deberán ejecutarse de manera fluida, sin provocar bloqueos de la interfaz. |
| RNF-REN-02 — Carga del mapa | La carga del mapa interactivo y sus marcadores no deberá bloquear la navegación ni impedir la interacción con las demás funcionalidades de la aplicación. |
| RNF-REN-03 — Optimización de imágenes | Las fotografías de los destinos deberán cargarse de forma progresiva o diferida (lazy loading), evitando que la carga de múltiples imágenes afecte el rendimiento general de la página. |
| RNF-REN-04 — Transferencia de información | La aplicación deberá solicitar al backend únicamente los datos necesarios para la funcionalidad o vista utilizada por el usuario. |

#### Compatibilidad

| ID | Requerimiento |
|----|--------------|
| RNF-COMP-01 | El sistema deberá funcionar correctamente en los siguientes navegadores: Google Chrome (última versión), Mozilla Firefox, Microsoft Edge y Safari. |
| RNF-COMP-02 | La aplicación móvil deberá funcionar mediante Ionic, permitiendo su ejecución como aplicación web progresiva y potencialmente como aplicación nativa. |

#### Escalabilidad

| ID | Requerimiento |
|----|--------------|
| RNF-ESC-01 | El sistema deberá utilizar una arquitectura modular que permita incrementar el volumen de destinos, categorías y usuarios, facilitando futuras mejoras sin modificar la lógica principal de la aplicación. |

---
## 6. Arquitectura de la Información / UX

### 6.1 Rutas principales y secundarias

La aplicación considera rutas públicas (accesibles sin autenticación) y rutas protegidas (que requieren autenticación como administrador o turista registrado).

#### Rutas públicas (Invitados)

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/` | Inicio / Landing | Presenta la plataforma, acceso directo al mapa interactivo y a las categorías destacadas. |
| `/explorar` | Mapa interactivo | Permite explorar destinos turísticos mediante el mapa de Google Maps con marcadores geolocalizados. |
| `/destinos` | Catálogo de destinos | Presenta los destinos turísticos con opciones de búsqueda y filtrado por categoría y región. |
| `/destinos/:id` | Detalle de destino | Permite visualizar la información completa de un destino turístico seleccionado. |
| `/categorias/:slug` | Destinos por categoría | Presenta los destinos filtrados por una categoría específica. |
| `/login` | Inicio de sesión | Permite ingresar al sistema mediante sus credenciales. |
| `/registro` | Registro | Permite crear una nueva cuenta en la plataforma. |

#### Rutas protegidas (Usuarios Logueados / Administrador)

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/favoritos` | Mis Favoritos | Permite al turista registrado visualizar y gestionar sus destinos guardados. |
| `/admin/inicio` | Panel de administración | Presenta un resumen general y accesos a las funcionalidades de gestión. |
| `/admin/destinos` | Gestión de destinos | Permite consultar, buscar y gestionar los destinos turísticos registrados. |
| `/admin/destinos/nuevo` | Crear destino | Permite registrar un nuevo destino turístico con toda su información. |
| `/admin/destinos/:id/editar` | Editar destino | Permite modificar la información de un destino existente. |
| `/admin/categorias` | Gestión de categorías | Permite consultar y gestionar las categorías de destinos. |
| `/admin/usuarios` | Gestión de usuarios | Permite consultar y administrar los usuarios registrados del sistema. |

### 6.2 Relaciones jerárquicas entre vistas

La aplicación se organiza mediante una estructura jerárquica en la que las funcionalidades disponibles dependen del contexto del usuario.

```
Aplicación
│
├── Rutas públicas (Turista Invitado)
│   ├── Inicio / Landing
│   ├── Explorar (Mapa interactivo)
│   ├── Destinos
│   │   ├── Filtrado por categoría
│   │   ├── Filtrado por región
│   │   └── Detalle del destino
│   ├── Login
│   └── Registro
│
├── Rutas privadas (Turista Registrado)
│   └── Mis Favoritos
│
└── Rutas protegidas (Administrador)
├── Panel de administración
├── Gestión de destinos
│   ├── Listar
│   ├── Crear
│   └── Editar
├── Gestión de categorías
│   ├── Listar
│   ├── Crear
│   └── Editar
└── Gestión de usuarios
```

---

## 7. Diferenciación de acceso según roles

La aplicación deberá controlar el acceso a las diferentes funcionalidades de acuerdo con el contexto del usuario. Esta diferenciación permitirá que cada tipo de usuario visualice y utilice únicamente las funciones asociadas a sus responsabilidades dentro del sistema.

### Acceso del Turista Invitado

El turista no registrado tendrá acceso a todas las funcionalidades de exploración y consulta **sin necesidad de autenticación**. Podrá navegar por el mapa, buscar destinos por filtros y ver información detallada de los lugares. Sin embargo, si intenta guardar un destino o acceder a la pestaña "Mis Favoritos", el sistema lo redirigirá obligatoriamente a la pantalla de Inicio de Sesión o Registro.

### Acceso del Turista Registrado

El turista autenticado mantendrá los permisos básicos de exploración y desbloqueará el uso del botón "Corazón" (Guardar) y la pestaña de "Mis Favoritos" en la barra de navegación inferior, permitiéndole armar su propia lista de destinos. También tendrá acceso a un apartado de perfil.

### Acceso del Administrador

El administrador será responsable de la gestión del contenido turístico y de las funciones generales del sistema. Solo él verá el botón de "Acceso Admin" que redirige al panel de control protegido, desde donde podrá gestionar el CRUD completo de la plataforma.

### Matriz de acceso por rol

| Funcionalidad | Turista Invitado | Turista Registrado | Administrador |
|---------------|------------------|--------------------|---------------|
| Explorar mapa y catálogo | ✓ | ✓ | ✓ |
| Ver detalle de un destino | ✓ | ✓ | ✓ |
| **Guardar en Favoritos** | **Bloqueado (Login)** | **✓** | **✓** |
| Acceder a Perfil de Usuario | Bloqueado | ✓ | ✓ |
| Panel de Administración | Oculto | Oculto | ✓ |
| Crear/Editar/Eliminar destinos | Bloqueado | Bloqueado | ✓ |

---

---
## Bocetos UI/UX
[Figma - Prototipo de UI/UX](https://www.figma.com/design/yRcGT1RLb30dPo94QykQva/Senderia-chile?node-id=0-1&t=yAZn8pyTL7C6l2ac-1)

El diseño actual muestra una interfaz consolidada para fines de demostración, pero el comportamiento real del sistema dependerá del estado de autenticación y el rol del usuario. Debido a que un wireframe es una representación estática, la pantalla principal agrupa todos los accesos posibles en una sola vista, lo que genera esta superposición temporal de elementos.
### Lógica de Acceso y Condicionales del Sistema:
- **Modo Invitado (Sin sesión):** Cualquier persona puede explorar el mapa y el catálogo de destinos de forma abierta. En este estado, hacer clic en el ícono de perfil redirige obligatoriamente a la pantalla de Inicio de Sesión o Registro.

- **Modo Turista (Sesión iniciada):** Una vez que el turista se autentica, el sistema actualiza la interfaz. Al presionar el ícono de perfil, el usuario ya no será llevado al login, sino a un apartado personal (configuración de cuenta y preferencias, pendiente de diseño). Además, el botón "Acceso Admin" desaparece completamente de la vista, ya que el turista tiene el acceso restringido a las funcionalidades de gestión.

- **Modo Administrador:** Si el usuario inicia sesión con credenciales institucionales, el sistema valida su rol. Solo bajo esta condición el botón "Acceso Admin" permanece visible y operativo, permitiendo saltar a las rutas protegidas para gestionar el contenido turístico.

La presencia simultánea del botón "Acceso Admin" y el avatar de perfil en la pantalla web sirve exclusivamente para documentar dónde estarán ubicados los puntos de entrada para cada tipo de usuario. 
En el desarrollo final con React, el código verificara si el usuario está logueado y qué rol tiene para ocultar o mostrar estos botones automáticamente.

---
## Librerías y Tecnologías Usadas

### Estilos y Maquetación
- **Utilidades CSS de Ionic:** Uso de clases nativas del framework (ej. `ion-padding`, `ion-text-center`) para estructurar las vistas sin necesidad de librerías externas.
- **CSS estándar / Estilos en línea:** Para ajustes visuales específicos de los componentes.

### Librerías principales

| Librería | Propósito |
|---|---|
| `react` | Construcción de la interfaz mediante componentes. |
| `react-dom` | Renderizado de los componentes React en el navegador. |
| `@ionic/react` | Proporciona los componentes de interfaz de Ionic utilizados en las vistas (ej. `IonPage`, `IonContent`, `IonCard`, `IonTabs`). |
| `@ionic/react-router` | Integración de la navegación de Ionic con React Router. |
| `react-router-dom` | Definición y gestión de rutas (v6), redirecciones y rutas protegidas entre las diferentes vistas de la aplicación. |
| `ionicons` | Biblioteca de iconos nativos utilizada para la barra de navegación inferior (Tabs) y la interfaz en general. |

### Tecnologías
- **Ionic Framework**
- **React**
- **TypeScript**
- **Vite** (Empaquetador y servidor de desarrollo local)
---

## 8. Flujos principales de tareas

Los flujos de tareas (task flows) representan la secuencia de acciones que realiza un usuario para completar una actividad específica dentro de la aplicación.

### Task Flow 1: Exploración y consulta de destinos turísticos

**Rol:** Turista  
**Objetivo:** Explorar destinos turísticos en Chile y acceder a información detallada de un lugar de interés.

```
Acceso a la aplicación (sin login)
        ↓
Página de inicio
        ↓
¿Cómo desea explorar?
  ↓              ↓
Mapa         Catálogo
  ↓              ↓
Explorar       Buscar/filtrar
mapa           por categoría
interactivo    o región
   ↓              ↓
Visualizar     Visualizar
marcadores     listado de
en el mapa     destinos
   ↓              ↓
Seleccionar    Seleccionar
marcador       destino
   ↓              ↓
Ver info       ─────┐
resumida            │
   ↓                ↓
"Ver más"      Vista de detalle
    ↓          del destino
    └──────→   (fotos, descripción,
                horarios, mapa,
                ubicación)
```

### Task Flow 2: Creación y gestión de un destino turístico

**Rol:** Administrador  
**Objetivo:** Registrar un nuevo destino turístico en la plataforma para que pueda ser consultado por los turistas.

```
Inicio de sesión
        ↓
Panel de administración
        ↓
Gestión de destinos
        ↓
Consultar destinos existentes
        ↓
Seleccionar "Nuevo destino"
        ↓
Ingresar información del destino

    -Nombre
    -Descripción
    -Categoría
    -Región
    -Horarios

Condiciones de acceso
        ↓
Subir fotografías
        ↓
Seleccionar ubicación en mapa
(clic en mapa para obtener coordenadas)
        ↓
Revisar información
        ↓
Guardar destino
        ↓
¿Datos válidos?
    ↓          ↓
    No         Sí
    ↓           ↓
  Mostrar      Registrar
  errores      destino
   de            ↓
validación   Mostrar confirmación
    ↓
Volver al listado
de destinos
```

---

## 9. Puntos críticos de interacción

Los puntos críticos de interacción corresponden a aquellas acciones o momentos del sistema en los que una interfaz poco clara, una validación insuficiente o una navegación compleja puede afectar significativamente la experiencia del usuario.

### Para el Turista

**Carga inicial del mapa interactivo:** El mapa constituye el elemento central de la experiencia del turista. La API de Google Maps deberá cargar de forma fluida, mostrando un estado de carga visible mientras los marcadores se posicionan. Si la carga falla (por problemas de conexión o de la API), el sistema deberá informar al usuario y ofrecer una alternativa (por ejemplo, acceder al catálogo de destinos sin mapa).

**Interacción con marcadores del mapa:** Al hacer clic en un marcador, el usuario deberá recibir retroalimentación inmediata (popup o tarjeta con información resumida del destino). La información deberá ser legible, concisa y permitir acceder al detalle completo del destino. En dispositivos móviles, la interacción táctil con marcadores pequeños puede resultar difícil, por lo que el diseño deberá considerar áreas de toque adecuadas.

**Búsqueda y filtrado de destinos:** Los filtros por categoría y región deberán ser fáciles de aplicar y combinar. El sistema deberá informar cuando no existan resultados para los filtros seleccionados y sugerir alternativas (ampliar la búsqueda, cambiar la categoría). La actualización de resultados deberá ser fluida y sin recargas innecesarias de la página.

**Visualización de información detallada:** La vista de detalle de un destino deberá presentar la información de forma organizada y jerarquizada, evitando un bloque extenso de texto. Las fotografías deberán cargar progresivamente. La ubicación del destino deberá mostrarse en un mapa integrado en la misma vista. La información práctica (horarios, condiciones de acceso) deberá ser fácilmente identificable.

**Gestión de Favoritos (Navegación Protegida):** Si un usuario invitado intenta agregar un lugar a sus favoritos, se debe garantizar que tras redirigirlo al inicio de sesión y completar el login, sea devuelto al destino que quería guardar, evitando que pierda el progreso de su búsqueda.

### Para el Administrador

**Inicio de sesión y acceso al panel:** El sistema deberá informar claramente cuando las credenciales ingresadas sean incorrectas y, una vez autenticado, deberá redirigir automáticamente al panel de administración. Deberá impedir el acceso a rutas administrativas sin autenticación válida.

**Creación de destinos turísticos:** El formulario de creación deberá guiar al administrador de forma clara, indicando qué campos son obligatorios. La selección de ubicación mediante clic en mapa es un punto crítico: deberá ser intuitiva, mostrar las coordenadas seleccionadas y permitir ajustarlas. La carga de imágenes deberá mostrar progreso y confirmar cuando la operación se complete exitosamente.

**Gestión de categorías:** La creación y modificación de categorías deberá reflejar los cambios de forma inmediata en la plataforma. Si se intenta eliminar una categoría que tiene destinos asociados, el sistema deberá advertir al administrador y solicitar confirmación.

**Validación y retroalimentación:** Cada operación de creación, modificación o eliminación deberá proporcionar retroalimentación clara: confirmación de éxito, detalle de errores de validación, o advertencia antes de operaciones destructivas (eliminar un destino o categoría).

---
