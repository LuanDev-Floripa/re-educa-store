/**
 * UnifiedAIAssistant - Componente Unificado de IA e Carrinho
 * 
 * Componente que unifica:
 * - Chat com IA Predativa
 * - Carrinho de compras
 * 
 * Funcionalidades:
 * - Bot?o flutuante ?nico
 * - Popup com abas (IA Chat / Carrinho)
 * - Badge com quantidade de itens
 * - Interface moderna e responsiva
 * 
 * @component
 * @returns {JSX.Element} Interface unificada de IA e carrinho
 */
import React, { useState } from "react";
import { Bot, ShoppingCart, X, Sparkles } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import AIChat from "./AIChat";
import { CartPopup } from "../cart/CartPopup";
import { Badge } from "../Ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Ui/tabs";
import { Button } from "../Ui/button";

const UnifiedAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const { itemCount } = useCart();

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        aria-label="Abrir assistente IA e carrinho"
        title="Assistente IA & Carrinho"
      >
        <div className="relative">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 group-hover:animate-pulse" />
            {itemCount > 0 && (
              <Badge className="absolute -top-3 -right-3 bg-destructive text-white border-2 border-white min-w-[24px] h-6 flex items-center justify-center px-1.5 rounded-full text-xs font-bold animate-pulse">
                {itemCount > 99 ? "99+" : itemCount}
              </Badge>
            )}
          </div>
        </div>
      </button>

      {/* Unified Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-lg shadow-2xl m-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Assistente IA & Carrinho
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="w-full justify-start rounded-none border-b p-0 h-auto bg-transparent">
                <TabsTrigger
                  value="chat"
                  className="flex items-center gap-2 px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Bot className="w-4 h-4" />
                  <span>Assistente IA</span>
                </TabsTrigger>
                <TabsTrigger
                  value="cart"
                  className="flex items-center gap-2 px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none relative"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Carrinho</span>
                  {itemCount > 0 && (
                    <Badge className="ml-1 bg-destructive text-white text-xs px-1.5 py-0.5 rounded-full">
                      {itemCount > 99 ? "99+" : itemCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab Contents */}
              <div className="flex-1 overflow-hidden">
                <TabsContent
                  value="chat"
                  className="m-0 h-full overflow-hidden"
                >
                  <div className="h-full overflow-auto">
                    <AIChat />
                  </div>
                </TabsContent>

                <TabsContent
                  value="cart"
                  className="m-0 h-full overflow-hidden"
                >
                  <div className="h-full overflow-auto">
                    <CartPopup
                      isOpen={true}
                      onClose={() => {
                        // N?o fecha o popup principal, apenas permite navega??o
                      }}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedAIAssistant;
