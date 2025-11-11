import React, { useState, useRef } from "react";
import logger from "@/utils/logger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Ui/avatar";
import { Button } from "@/components/Ui/button";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "../../services/apiClient";

/**
 * Componente para upload de foto de perfil
 */
const AvatarUpload = ({ 
  currentAvatarUrl, 
  userName, 
  userEmail,
  onUploadSuccess,
  size = "w-24 h-24",
  editable = true 
}) => {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não permitido. Use JPG, PNG ou WebP');
      return;
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Selecione uma imagem primeiro');
      return;
    }

    try {
      setUploading(true);

      // Criar FormData
      const formData = new FormData();
      formData.append('avatar', file);

      // Fazer upload
      const response = await apiClient.request('/api/users/profile/avatar', {
        method: 'POST',
        body: formData,
        includeAuth: true,
      });

      if (response.success || response.avatar_url) {
        toast.success('Foto de perfil atualizada com sucesso!');
        setPreview(null);
        
        // Chamar callback se fornecido
        if (onUploadSuccess) {
          onUploadSuccess(response.avatar_url || response.data?.avatar_url);
        }
        
        // Limpar input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(response.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      logger.error('Erro ao fazer upload:', error);
      toast.error(error.message || 'Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      
      const response = await apiClient.request('/api/users/profile/avatar', {
        method: 'DELETE',
      });

      if (response.success) {
        toast.success('Foto de perfil removida');
        setPreview(null);
        
        if (onUploadSuccess) {
          onUploadSuccess(null);
        }
      } else {
        throw new Error(response.error || 'Erro ao remover foto');
      }
    } catch (error) {
      logger.error('Erro ao remover foto:', error);
      toast.error('Erro ao remover foto de perfil');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const avatarUrl = preview || currentAvatarUrl;
  const showActions = preview && editable;

  return (
    <div className="relative inline-block">
      <Avatar className={`${size} border-2 border-border`}>
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className="text-2xl">
          {userName?.charAt(0) || userEmail?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <>
          {/* Botão de upload */}
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-2 -right-2 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
            title="Alterar foto"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </label>

          <input
            id="avatar-upload"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {/* Ações quando há preview */}
          {showActions && (
            <div className="absolute top-0 left-0 right-0 -mt-12 flex items-center justify-center gap-2 bg-white dark:bg-background p-2 rounded-lg shadow-lg">
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={uploading}
                className="text-xs"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-1" />
                    Salvar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={uploading}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
            </div>
          )}

          {/* Botão remover se há foto atual */}
          {currentAvatarUrl && !preview && editable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRemove}
              disabled={uploading}
              className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 bg-destructive hover:bg-destructive/90 text-white"
              title="Remover foto"
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default AvatarUpload;
