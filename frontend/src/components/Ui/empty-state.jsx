import React from "react";
import { Package, Inbox, Search, ShoppingCart, Heart, MessageSquare, FileText, Users, Bell, FolderOpen } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

/**
 * EmptyState Component - RE-EDUCA Store
 * 
 * Componente padronizado para estados vazios (quando não há dados para exibir)
 */
export function EmptyState({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action,
  actionLabel,
  className,
  ...props
}) {
  const IconComponent = Icon;
  return (
    <Card className={cn("flex flex-col items-center justify-center p-12 text-center", className)} {...props}>
      <CardContent className="flex flex-col items-center">
        <IconComponent className="w-12 h-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        {description && (
          <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        )}
        {action && actionLabel && (
          <Button onClick={action}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}

// Variantes pré-definidas
export function EmptyProducts() {
  return (
    <EmptyState
      icon={Package}
      title="Nenhum produto encontrado"
      description="Não há produtos disponíveis no momento. Tente novamente mais tarde."
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      icon={Search}
      title="Nenhum resultado encontrado"
      description="Tente ajustar seus filtros ou buscar por termos diferentes."
    />
  );
}

export function EmptyCart() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Seu carrinho está vazio"
      description="Adicione produtos ao seu carrinho para continuar comprando."
      actionLabel="Ver produtos"
    />
  );
}

export function EmptyFavorites() {
  return (
    <EmptyState
      icon={Heart}
      title="Nenhum favorito ainda"
      description="Adicione produtos aos seus favoritos para vê-los aqui."
      actionLabel="Explorar produtos"
    />
  );
}

export function EmptyMessages() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Nenhuma mensagem"
      description="Você ainda não tem mensagens. Comece uma conversa!"
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon={FileText}
      title="Nenhum pedido encontrado"
      description="Você ainda não fez nenhum pedido. Explore nossa loja e comece a comprar!"
      actionLabel="Ver produtos"
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="Nenhuma notificação"
      description="Você está em dia! Não há notificações no momento."
    />
  );
}

export function EmptyUsers() {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum usuário encontrado"
      description="Não há usuários correspondentes aos filtros selecionados."
    />
  );
}

export function EmptyFolder() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Pasta vazia"
      description="Esta pasta não contém nenhum arquivo ou item."
    />
  );
}
