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
---
## Bocetos UI/UX
[Figma - Prototipo de UI/UX](https://www.figma.com/design/yRcGT1RLb30dPo94QykQva/Senderia-chile?node-id=0-1&t=yAZn8pyTL7C6l2ac-1)
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
