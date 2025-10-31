/**
 * FloatingThemeControls Component - RE-EDUCA Store
 * 
 * Componente de controle flutuante para alternar entre tema claro e escuro.
 * 
 * Funcionalidades:
 * - Bot?o fixo no canto inferior esquerdo
 * - Alterna entre tema light e dark
 * - ?cone din?mico (sol/lua) baseado no tema atual
 * - Suporte a acessibilidade (aria-label, title)
 * - Anima??es suaves de transi??o
 * - Adapta??o visual ao tema (cores mudam dinamicamente)
 * 
 * @component
 * @returns {JSX.Element} Bot?o flutuante de controle de tema
 */
import React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/Ui/button";
import { Sun, Moon } from "lucide-react";

const FloatingThemeControls = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className={`w-10 h-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
          theme === "light"
            ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
            : "bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
        }`}
        title={
          theme === "light"
            ? "Alternar para tema escuro"
            : "Alternar para tema claro"
        }
        aria-label={
          theme === "light" ? "Alternar para tema escuro" : "Alternar para tema claro"
        }
      >
        {theme === "light" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default FloatingThemeControls;
