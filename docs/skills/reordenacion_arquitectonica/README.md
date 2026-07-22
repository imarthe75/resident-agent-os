# Toolkit de Reorganización Arquitectónica para Agentes de IA

Este directorio ha sido diseñado específicamente para que el equipo de desarrollo de tu organización pueda suministrárselo a un **Agente de IA Coding Assistant** (como Antigravity, Github Copilot Enterprise, etc.) y ordenar por completo un proyecto de Angular que se encuentre desorganizado, aplicando el modelo arquitectónico robusto, moderno y premium del **CRM Inmobiliario**.

---

## 📂 Contenido del Toolkit

El directorio se organiza de la siguiente manera:

```txt
reordenacion_arquitectonica/
├── README.md                           # Esta guía maestra de uso y orquestación.
└── skills/                             # Instrucciones de especialización (Agent Skills)
    ├── 1-mapeo_y_migracion.md          # Instrucciones para el escaneo, mapeo y movimiento de archivos desordenados.
    ├── 2-modernizacion_angular.md      # Reglas para transformar componentes viejos a Standalone, Signals e inject().
    ├── 3-centralizacion_http.md        # Guía para erradicar HttpClient directo y migrar a ApiService.
    └── 4-seguridad_y_rutas.md          # Reglas para limpiar la navegación, guards y control de localStorage.
```

---

## 🤖 Cómo Suministrar esto a tu Agente de IA

Para lograr una refactorización exitosa sin introducir errores de compilación, te sugerimos seguir estos pasos con tu agente:

### Paso 1: Establecer Contexto Inicial
Carga el contenido de este directorio en el contexto del agente de IA y dale la siguiente instrucción de inicialización:

```txt
"Actúa como un Arquitecto de Software Experto en Angular. He cargado en tu espacio de trabajo la carpeta 'reordenacion_arquitectonica/'. Tu meta es reorganizar por completo la arquitectura desordenada de mi proyecto actual para llevarla a un modelo limpio basado en Features (Feature-Based Simple Architecture), tal como se especifica en los skills adjuntos. 

Por favor, lee detalladamente los archivos:
1. reordenacion_arquitectonica/skills/1-mapeo_y_migracion.md
2. reordenacion_arquitectonica/skills/2-modernizacion_angular.md
3. reordenacion_arquitectonica/skills/3-centralizacion_http.md
4. reordenacion_arquitectonica/skills/4-seguridad_y_rutas.md

Confírmame que comprendes las reglas y espera mis instrucciones para iniciar la Fase de Escaneo y Mapeo."
```

### Paso 2: Ejecución Faseada (Muy Recomendado)
No le pidas al agente que refactore todo el proyecto de un solo golpe, ya que las limitaciones de contexto o memoria pueden causar alucinaciones. En su lugar, ordénale ejecutar el plan en fases estrictas:

1. **Fase de Escaneo e Inventario**: Pídele al agente que examine tu código actual y genere una tabla de mapeo (dónde están los archivos hoy y dónde deberían estar según `1-mapeo_y_migracion.md`). **Revisa esta tabla antes de proceder.**
2. **Fase de Creación del Core**: Pídele al agente que configure la base del core (`ApiService`, `TokenStorageService`, interceptores, constantes globales de rutas y endpoints).
3. **Fase de Migración Módulo por Módulo (Verticales)**: Migra una sola característica a la vez (ej: primero el login/auth, luego clientes, luego productos). Para cada módulo, aplica de forma rigurosa la modernización a Standalone y Signals.
4. **Fase de Limpieza**: Pídele al agente eliminar los archivos antiguos huérfanos y realizar la compilación de prueba para asegurar que el proyecto compile sin errores.
