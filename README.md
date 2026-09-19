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

---
## Bocetos UI/UX
[Figma - Prototipo de UI/UX](https://www.figma.com/design/yRcGT1RLb30dPo94QykQva/Senderia-chile?node-id=0-1&t=yAZn8pyTL7C6l2ac-1)
