/**
 * Sistema de Tipografia - RE-EDUCA Store
 * 
 * Define hierarquia tipográfica padronizada para toda a aplicação.
 */

export const typography = {
  // Títulos
  h1: "text-4xl md:text-5xl font-bold tracking-tight text-foreground",
  h2: "text-3xl md:text-4xl font-semibold tracking-tight text-foreground",
  h3: "text-2xl md:text-3xl font-semibold text-foreground",
  h4: "text-xl md:text-2xl font-semibold text-foreground",
  h5: "text-lg md:text-xl font-medium text-foreground",
  h6: "text-base md:text-lg font-medium text-foreground",
  
  // Texto corpo
  body: "text-base leading-relaxed text-foreground",
  bodyLarge: "text-lg leading-relaxed text-foreground",
  bodySmall: "text-sm leading-relaxed text-foreground",
  
  // Especial
  caption: "text-xs text-muted-foreground",
  lead: "text-xl text-muted-foreground leading-relaxed",
  muted: "text-sm text-muted-foreground",
  
  // Links
  link: "text-primary hover:text-primary/80 underline-offset-4 hover:underline",
  
  // Labels
  label: "text-sm font-medium text-foreground",
  labelSmall: "text-xs font-medium text-muted-foreground",
};
