import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { typography } from "@/styles/typography";

/**
 * Componentes de Tipografia Reutilizáveis - RE-EDUCA Store
 * 
 * Componentes padronizados para manter hierarquia tipográfica consistente.
 */

export function H1({ className, children, ...props }) {
  return (
    <h1 className={cn(typography.h1, className)} {...props}>
      {children}
    </h1>
  );
}

export function H2({ className, children, ...props }) {
  return (
    <h2 className={cn(typography.h2, className)} {...props}>
      {children}
    </h2>
  );
}

export function H3({ className, children, ...props }) {
  return (
    <h3 className={cn(typography.h3, className)} {...props}>
      {children}
    </h3>
  );
}

export function H4({ className, children, ...props }) {
  return (
    <h4 className={cn(typography.h4, className)} {...props}>
      {children}
    </h4>
  );
}

export function H5({ className, children, ...props }) {
  return (
    <h5 className={cn(typography.h5, className)} {...props}>
      {children}
    </h5>
  );
}

export function H6({ className, children, ...props }) {
  return (
    <h6 className={cn(typography.h6, className)} {...props}>
      {children}
    </h6>
  );
}

export function Body({ className, children, as: Component = "p", ...props }) {
  const Tag = Component;
  return (
    <Tag className={cn(typography.body, className)} {...props}>
      {children}
    </Tag>
  );
}

export function BodyLarge({ className, children, as: Component = "p", ...props }) {
  const Tag = Component;
  return (
    <Tag className={cn(typography.bodyLarge, className)} {...props}>
      {children}
    </Tag>
  );
}

export function BodySmall({ className, children, as: Component = "p", ...props }) {
  const Tag = Component;
  return (
    <Tag className={cn(typography.bodySmall, className)} {...props}>
      {children}
    </Tag>
  );
}

export function Caption({ className, children, as: Component = "p", ...props }) {
  const Tag = Component;
  return (
    <Tag className={cn(typography.caption, className)} {...props}>
      {children}
    </Tag>
  );
}

export function Lead({ className, children, as: Component = "p", ...props }) {
  const Tag = Component;
  return (
    <Tag className={cn(typography.lead, className)} {...props}>
      {children}
    </Tag>
  );
}

export function Muted({ className, children, as: Component = "p", ...props }) {
  const Tag = Component;
  return (
    <Tag className={cn(typography.muted, className)} {...props}>
      {children}
    </Tag>
  );
}

export function TypographyLink({ className, children, href, to, ...props }) {
  // Se for URL externa (http/https) ou âncora (#), usar <a>
  // Caso contrário, usar <Link> do React Router
  const isExternal = href?.startsWith('http://') || href?.startsWith('https://') || href?.startsWith('mailto:') || href?.startsWith('#');
  const linkTo = to || href;
  
  if (isExternal || !linkTo) {
    return (
      <a href={href} className={cn(typography.link, className)} {...props}>
        {children}
      </a>
    );
  }
  
  return (
    <Link to={linkTo} className={cn(typography.link, className)} {...props}>
      {children}
    </Link>
  );
}

export function Label({ className, children, as: Component = "label", ...props }) {
  const Tag = Component;
  return (
    <Tag className={cn(typography.label, className)} {...props}>
      {children}
    </Tag>
  );
}

export function LabelSmall({ className, children, as: Component = "label", ...props }) {
  const Tag = Component;
  return (
    <Tag className={cn(typography.labelSmall, className)} {...props}>
      {children}
    </Tag>
  );
}
