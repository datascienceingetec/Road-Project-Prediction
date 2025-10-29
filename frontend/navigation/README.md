# Módulo de Navegación

Este módulo centraliza toda la configuración y componentes de navegación de la aplicación.

## Estructura

```
navigation/
├── types.ts                    # Tipos TypeScript para navegación
├── nav-items.ts               # Configuración de items de navegación
├── index.ts                   # Exports del módulo
└── components/
    ├── sidebar-nav.tsx        # Navegación vertical (sidebar)
    ├── top-nav.tsx           # Navegación horizontal (topnav)
    └── index.ts              # Exports de componentes
```

## Uso

### Importar items de navegación

```typescript
import { mainNavItems, secondaryNavItems, allNavItems } from '@/navigation';
```

### Importar componentes

```typescript
import { SidebarNav, TopNav } from '@/navigation/components';
```

### Agregar nuevos items de navegación

Edita `nav-items.ts`:

```typescript
export const mainNavItems: NavItem[] = [
  // ... items existentes
  {
    href: '/nueva-ruta',
    label: 'Nueva Página',
    icon: 'add',
    description: 'Descripción para tooltip'
  }
];
```

## Componentes

### SidebarNav

Barra de navegación lateral vertical con las siguientes características:

- **Colapsable**: 256px (expandido) → 64px (colapsado)
- **Items dinámicos**: Lee desde `nav-items.ts`
- **Detección de ruta activa**: Resalta automáticamente la página actual
- **Tooltips**: Muestra descripción al pasar el mouse (cuando está colapsado)

### TopNav

Barra de navegación horizontal superior con las siguientes características:

- **Navegación horizontal**: Para layouts de desktop
- **Items dinámicos**: Lee desde `nav-items.ts`
- **Detección de ruta activa**: Resalta automáticamente la página actual
- **Responsive**: Se oculta en mobile (md breakpoint)

## Tipos

### NavItem

```typescript
interface NavItem {
  href: string;           // Ruta de destino
  label: string;          // Etiqueta visible
  icon: string;           // Icono (Material Symbols)
  description?: string;   // Descripción para tooltips
}
```

### NavSection

```typescript
interface NavSection {
  title?: string;         // Título de la sección
  items: NavItem[];       // Items de navegación
}
```

## Iconos

Los componentes usan **Material Symbols** de Google. Para agregar un nuevo icono, usa el nombre del símbolo:

```typescript
icon: 'dashboard'        // ✓ Correcto
icon: 'material-dashboard'  // ✗ Incorrecto
```

Catálogo completo: https://fonts.google.com/icons
