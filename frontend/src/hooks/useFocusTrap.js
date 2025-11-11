import { useEffect, useRef } from 'react';

/**
 * Hook para Focus Trap em modais - RE-EDUCA Store
 * 
 * Mantém o foco dentro do modal e permite navegação por Tab.
 * Restaura o foco ao elemento anterior quando o modal é fechado.
 * 
 * @param {boolean} isOpen - Se o modal está aberto
 * @param {Function} onClose - Função para fechar o modal (opcional)
 * @returns {React.RefObject} - Ref para o container do modal
 */
export function useFocusTrap(isOpen, onClose) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Salvar elemento que tinha foco antes de abrir modal
    previousFocusRef.current = document.activeElement;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab (navegação reversa)
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (navegação normal)
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    // Focar primeiro elemento quando modal abrir
    firstElement?.focus();

    // Event listeners
    container.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);

    return () => {
      container.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
      
      // Restaurar foco ao elemento anterior
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return containerRef;
}
