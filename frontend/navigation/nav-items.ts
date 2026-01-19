import { NavItem, NavSection } from "./types";

/**
 * Items principales de navegación
 */
export const mainNavItems: NavItem[] = [
    {
        href: "/",
        label: "Inicio",
        icon: "home",
        description: "Panel principal con métricas y resúmenes",
    },
    {
        href: "/proyectos",
        label: "Proyectos",
        icon: "folder",
        description: "Gestión de proyectos viales",
    },
    {
        href: "/prediccion",
        label: "Nueva Predicción",
        icon: "add_circle",
        description: "Crear nueva predicción de deterioro",
    },
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: "dashboard",
        description: "Panel de control con gráficos y tablas",
    },
];

/**
 * Items de navegación secundaria (pie del sidebar)
 */
export const secondaryNavItems: NavItem[] = [];

/**
 * Todas las secciones de navegación organizadas
 */
export const navSections: NavSection[] = [
    {
        title: "Principal",
        items: mainNavItems,
    },
    {
        title: "Configuración",
        items: secondaryNavItems,
    },
];

/**
 * Todos los items de navegación (útil para búsquedas y validaciones)
 */
export const allNavItems: NavItem[] = [...mainNavItems, ...secondaryNavItems];
