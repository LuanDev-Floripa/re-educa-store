import React from "react";
/**
 * Popup da Calculadora de IMC.
 * - Exibe `IMCCalculatorWidget` em modal com backdrop clic?vel
 */
import { Button } from "@/components/Ui/button";
import { X } from "lucide-react";
import IMCCalculatorWidget from "./IMCCalculatorWidget";

const IMCCalculatorPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popup Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Calculadora de IMC
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Calculator Content */}
          <div className="p-6">
            <IMCCalculatorWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IMCCalculatorPopup;
