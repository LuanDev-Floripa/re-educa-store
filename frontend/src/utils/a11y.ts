/**
 * Utilitários de Acessibilidade (a11y) RE-EDUCA Store
 * 
 * Utilitários para melhorar acessibilidade do sistema
 */

/**
 * Gera IDs únicos para associar labels com inputs
 */
export const generateA11yId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Props padrão de acessibilidade para botões
 */
export const getButtonA11yProps = (label: string, options?: {
  disabled?: boolean;
  expanded?: boolean;
  controls?: string;
}): Record<string, string | boolean> => {
  const props: Record<string, string | boolean> = {
    'aria-label': label,
  };

  if (options?.disabled) {
    props['aria-disabled'] = true;
  }

  if (options?.expanded !== undefined) {
    props['aria-expanded'] = options.expanded;
  }

  if (options?.controls) {
    props['aria-controls'] = options.controls;
  }

  return props;
};

/**
 * Props padrão de acessibilidade para inputs
 */
export const getInputA11yProps = (
  label: string,
  required: boolean = false,
  error?: string
): Record<string, string | boolean> => {
  const props: Record<string, string | boolean> = {
    'aria-label': label,
    'aria-required': required,
  };

  if (error) {
    props['aria-invalid'] = true;
    props['aria-describedby'] = `${label}-error`;
  }

  return props;
};

/**
 * Props padrão de acessibilidade para modais/dialogs
 */
export const getModalA11yProps = (
  title: string,
  isOpen: boolean
): Record<string, string | boolean> => {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': `${title}-title`,
    'aria-hidden': !isOpen,
  };
};

/**
 * Props padrão de acessibilidade para imagens
 */
export const getImageA11yProps = (alt: string, decorative: boolean = false): Record<string, string> => {
  if (decorative) {
    return {
      alt: '',
      role: 'presentation',
      'aria-hidden': 'true',
    } as Record<string, string>;
  }

  return {
    alt,
  };
};

/**
 * Props padrão de acessibilidade para links
 */
export const getLinkA11yProps = (
  label: string,
  isExternal?: boolean
): Record<string, string> => {
  const props: Record<string, string> = {
    'aria-label': label,
  };

  if (isExternal) {
    props['aria-label'] = `${label} (abre em nova aba)`;
    props.target = '_blank';
    props.rel = 'noopener noreferrer';
  }

  return props;
};

/**
 * Props padrão de acessibilidade para listas
 */
export const getListA11yProps = (
  label?: string
): Record<string, string> => {
  const props: Record<string, string> = {
    role: 'list',
  };

  if (label) {
    props['aria-label'] = label;
  }

  return props;
};

/**
 * Props padrão de acessibilidade para itens de lista
 */
export const getListItemA11yProps = (): Record<string, string> => {
  return {
    role: 'listitem',
  };
};

/**
 * Props padrão de acessibilidade para regiões/landmarks
 */
export const getLandmarkA11yProps = (
  label: string,
  role: 'banner' | 'navigation' | 'main' | 'complementary' | 'contentinfo' | 'search' | 'form' = 'region'
): Record<string, string> => {
  return {
    role,
    'aria-label': label,
  };
};

/**
 * Props padrão de acessibilidade para alertas
 */
export const getAlertA11yProps = (
  level: 'success' | 'error' | 'warning' | 'info' = 'info'
): Record<string, string> => {
  const roleMap: Record<string, string> = {
    error: 'alert',
    warning: 'alert',
    success: 'status',
    info: 'status',
  };

  return {
    role: roleMap[level],
    'aria-live': level === 'error' || level === 'warning' ? 'assertive' : 'polite',
  };
};

/**
 * Atalho de teclado para navegação
 */
export const handleKeyboardNavigation = (
  e: React.KeyboardEvent,
  callbacks: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onTab?: () => void;
  }
): void => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      callbacks.onEnter?.();
      break;
    case 'Escape':
      callbacks.onEscape?.();
      break;
    case 'ArrowUp':
      e.preventDefault();
      callbacks.onArrowUp?.();
      break;
    case 'ArrowDown':
      e.preventDefault();
      callbacks.onArrowDown?.();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      callbacks.onArrowLeft?.();
      break;
    case 'ArrowRight':
      e.preventDefault();
      callbacks.onArrowRight?.();
      break;
    case 'Tab':
      callbacks.onTab?.();
      break;
  }
};
