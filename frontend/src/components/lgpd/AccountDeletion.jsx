/**
 * AccountDeletion Component - RE-EDUCA Store
 * 
 * Componente para exclusão/anonymização de conta (LGPD).
 * 
 * @component
 * @returns {JSX.Element} Interface de exclusão de conta
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logger from "@/utils/logger";
import { removeAuthToken } from "@/utils/storage";
import { apiService } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import {
  AlertTriangle,
  Trash2,
  Shield,
  Info,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

export const AccountDeletion = () => {
  const navigate = useNavigate();
  const [deletionType, setDeletionType] = useState("anonymize");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const requiredConfirmText = "EXCLUIR MINHA CONTA";

  const handleDelete = async () => {
    if (confirmText !== requiredConfirmText) {
      toast.error("Confirmação incorreta. Digite exatamente: " + requiredConfirmText);
      return;
    }

    setIsDeleting(true);

    try {
      const data = await apiService.lgpd.deleteAccount({
        deletion_type: deletionType,
        reason: reason,
        confirm: true
      });

      if (data.success) {
        toast.success("Conta processada com sucesso");
        // Redirecionar para logout ou página inicial
        setTimeout(() => {
          removeAuthToken();
          navigate('/');
        }, 2000);
      } else {
        toast.error('Erro ao excluir conta: ' + (data.error || 'Erro desconhecido'));
        setIsDeleting(false);
      }
    } catch (error) {
      logger.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-destructive/20">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Excluir Conta</CardTitle>
              <CardDescription>
                Esta ação não pode ser desfeita
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Aviso */}
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">
                  Atenção: Esta ação é permanente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ao excluir sua conta, todos os seus dados serão {deletionType === 'full' ? 'permanentemente removidos' : 'anonimizados'}.
                  {deletionType === 'anonymize' && ' Alguns dados agregados podem ser mantidos para fins estatísticos.'}
                </p>
              </div>
            </div>
          </div>

          {/* Tipo de exclusão */}
          <div className="space-y-3">
            <Label>Tipo de Exclusão</Label>
            <div className="space-y-2">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  deletionType === 'anonymize'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setDeletionType('anonymize')}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Anonimização (Recomendado)</h3>
                    <p className="text-sm text-muted-foreground">
                      Seus dados pessoais serão removidos, mas dados agregados serão mantidos para estatísticas.
                    </p>
                  </div>
                  {deletionType === 'anonymize' && <Check className="w-5 h-5 text-primary" />}
                </div>
              </div>

              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  deletionType === 'full'
                    ? 'border-destructive bg-destructive/10'
                    : 'border-border hover:border-destructive/50'
                }`}
                onClick={() => setDeletionType('full')}
              >
                <div className="flex items-center space-x-3">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Exclusão Completa</h3>
                    <p className="text-sm text-muted-foreground">
                      Todos os seus dados serão permanentemente removidos do sistema.
                    </p>
                  </div>
                  {deletionType === 'full' && <Check className="w-5 h-5 text-destructive" />}
                </div>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (Opcional)</Label>
            <Input
              id="reason"
              placeholder="Por favor, compartilhe o motivo da exclusão..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Informações adicionais */}
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1 text-sm text-muted-foreground">
                <p className="mb-2"><strong>O que acontece:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Seu perfil será removido ou anonimizado</li>
                  <li>Seus dados de saúde serão excluídos</li>
                  <li>Seus pedidos serão anonimizados</li>
                  <li>Você não poderá mais acessar a plataforma</li>
                  {deletionType === 'anonymize' && <li>Dados agregados serão mantidos para análise</li>}
                </ul>
              </div>
            </div>
          </div>

          {!showConfirm ? (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Continuar com a Exclusão
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-muted rounded-lg border-2 border-destructive/20">
              <div>
                <Label htmlFor="confirm">
                  Para confirmar, digite: <strong>{requiredConfirmText}</strong>
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-2"
                  placeholder={requiredConfirmText}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                  }}
                  disabled={isDeleting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={confirmText !== requiredConfirmText || isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};