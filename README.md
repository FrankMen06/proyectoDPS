# Hola Bienvendido!, aquí encontraras algunos pasos para ocupar este proyecto 
## Para levantar el Proyecto

Para levantar el proyecto
```bash

npm

npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


## Requisitos Previos

Debes instalar JSON Server de manera global antes de correr el proyecto:

```bash
npm install -g json-server@0.17.4
```

**Nota:** Usa la versión específica 0.17.4 para evitar problemas de compatibilidad.

## Levantar la API (JSON Server)

**IMPORTANTE:** Debes ejecutar este comando desde el directorio del proyecto donde está el archivo `db.json`:

```bash
cd proyectoDPS
npx json-server@0.17.4 --watch db.json --port 3001
```

O alternativamente, con la ruta completa:

```bash
npx json-server@0.17.4 --watch "C:\ruta\completa\al\proyecto\db.json" --port 3001
```

Esto iniciará la API en `http://localhost:3001` con los siguientes endpoints:
- `http://localhost:3001/users` - Gestión de usuarios
- `http://localhost:3001/projects` - Gestión de proyectos  
- `http://localhost:3001/tasks` - Gestión de tareas
- `http://localhost:3001/notifications` - Notificaciones
- `http://localhost:3001/sessions` - Sesiones de usuario

## Instalación y Configuración

1. **Clonar el repositorio:**
```bash
git clone https://github.com/FrankMen06/proyectoDPS.git
cd proyectoDPS
```

2. **Instalar dependencias del proyecto:**
```bash
npm install
```

3. **Instalar JSON Server globalmente:**
```bash
npm install -g json-server@0.17.4
```

## Ejecutar el Proyecto

### 1. Iniciar el Backend (JSON Server)
**Desde el directorio del proyecto:**
```bash
npx json-server@0.17.4 --watch db.json --port 3001
```

### 2. Iniciar el Frontend (Next.js)
**En una nueva terminal, desde el directorio del proyecto:**
```bash
npm run dev
```

El proyecto estará disponible en:
- **Frontend:** `http://localhost:3000`
- **API Backend:** `http://localhost:3001`

## Usuarios de Prueba

- **Gerente:** 
  - Email: `juan@example.com`
  - Contraseña: `123456`
  
- **Usuario:** 
  - Email: `maria@example.com` 
  - Contraseña: `123456`

## Funcionalidades

### Gerente puede:
- ✅ Crear, editar y eliminar proyectos
- ✅ Crear, editar y eliminar tareas
- ✅ Asignar usuarios a proyectos y tareas
- ✅ Ver todos los proyectos y tareas
- ✅ Cambiar estados y progreso

### Usuario puede:
- ✅ Ver proyectos asignados
- ✅ Ver y actualizar sus tareas asignadas
- ✅ Cambiar progreso y estado de sus tareas
- ✅ Ver detalles de proyectos donde participa
