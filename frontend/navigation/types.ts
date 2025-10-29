/**
 * Tipos para los elementos de navegación
 */

export interface NavItem {
  /** Ruta de destino */
  href: string;
  /** Etiqueta a mostrar */
  label: string;
  /** Nombre del icono (Material Symbols) */
  icon: string;
  /** Descripción opcional para tooltips */
  description?: string;
}

export interface NavSection {
  /** Título de la sección (opcional) */
  title?: string;
  /** Items de navegación */
  items: NavItem[];
}
