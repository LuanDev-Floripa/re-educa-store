import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Ui/card';
import { Button } from '../Ui/button';
import { Input } from '../Ui/input';
import { Label } from '../Ui/label';
import { Textarea } from '../Ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Ui/select';
import { Checkbox } from '../Ui/checkbox';
import { Badge } from '../Ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../Ui/avatar';
import { 
  Image, 
  Video, 
  MapPin, 
  Smile, 
  Hash, 
  Users, 
  X, 
  Upload,
  Camera,
  FileText,
  Trophy,
  Dumbbell,
  Utensils,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const CreatePostModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currentUser,
  onImageUpload 
}) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mentions, setMentions] = useState([]);
  const [mentionInput, setMentionInput] = useState('');
  const [mood, setMood] = useState('');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const postTypes = [
    { value: 'text', label: 'Texto', icon: FileText, color: 'bg-blue-100 text-blue-800' },
    { value: 'image', label: 'Imagem', icon: Image, color: 'bg-green-100 text-green-800' },
    { value: 'video', label: 'Vídeo', icon: Video, color: 'bg-purple-100 text-purple-800' },
    { value: 'achievement', label: 'Conquista', icon: Trophy, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'workout', label: 'Treino', icon: Dumbbell, color: 'bg-red-100 text-red-800' },
    { value: 'meal', label: 'Refeição', icon: Utensils, color: 'bg-orange-100 text-orange-800' },
    { value: 'progress', label: 'Progresso', icon: TrendingUp, color: 'bg-indigo-100 text-indigo-800' }
  ];

  const moods = [
    { value: 'happy', label: '😊 Feliz', color: 'text-yellow-500' },
    { value: 'excited', label: '🤩 Empolgado', color: 'text-pink-500' },
    { value: 'motivated', label: '💪 Motivado', color: 'text-green-500' },
    { value: 'proud', label: '🏆 Orgulhoso', color: 'text-purple-500' },
    { value: 'grateful', label: '🙏 Grato', color: 'text-blue-500' },
    { value: 'focused', label: '🎯 Focado', color: 'text-indigo-500' },
    { value: 'relaxed', label: '😌 Relaxado', color: 'text-teal-500' },
    { value: 'determined', label: '🔥 Determinado', color: 'text-red-500' }
  ];

  const handleAddHashtag = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const hashtag = hashtagInput.trim().replace('#', '');
      if (hashtag && !hashtags.includes(hashtag)) {
        setHashtags([...hashtags, hashtag]);
        setHashtagInput('');
      }
    }
  };

  const handleRemoveHashtag = (hashtagToRemove) => {
    setHashtags(hashtags.filter(hashtag => hashtag !== hashtagToRemove));
  };

  const handleAddMention = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const mention = mentionInput.trim().replace('@', '');
      if (mention && !mentions.includes(mention)) {
        setMentions([...mentions, mention]);
        setMentionInput('');
      }
    }
  };

  const handleRemoveMention = (mentionToRemove) => {
    setMentions(mentions.filter(mention => mention !== mentionToRemove));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isImage && !isVideo) {
        toast.error('Apenas imagens e vídeos são permitidos');
        return false;
      }
      if (!isValidSize) {
        toast.error('Arquivo muito grande. Máximo 10MB');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setMediaFiles([...mediaFiles, ...validFiles]);
      
      // Criar previews
      const newPreviews = validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video'
      }));
      setPreviewUrls([...previewUrls, ...newPreviews]);
    }
  };

  const handleRemoveMedia = (index) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    // Revogar URL do objeto para liberar memória
    URL.revokeObjectURL(previewUrls[index].url);
    
    setMediaFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Escreva algo ou adicione uma mídia');
      return;
    }

    setIsSubmitting(true);
    
    // Usar onImageUpload se disponível
    if (onImageUpload && mediaFiles.length > 0) {
      onImageUpload(mediaFiles[0]);
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const formData = new FormData();
      formData.append('content', content);
      formData.append('post_type', postType);
      formData.append('hashtags', JSON.stringify(hashtags));
      formData.append('mentions', JSON.stringify(mentions));
      formData.append('mood', mood);
      formData.append('location', location);
      formData.append('is_public', isPublic);

      // Adicionar arquivos de mídia
      mediaFiles.forEach((file, index) => {
        formData.append(`media_${index}`, file);
      });

      // Criar post via API
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        handleClose();
        toast.success('Post criado com sucesso!');
        
        if (onSubmit) {
          onSubmit(formData);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar post');
      }
      
      // Reset form
      setContent('');
      setHashtags([]);
      setMentions([]);
      setMood('');
      setLocation('');
      setMediaFiles([]);
      setPreviewUrls([]);
      setHashtagInput('');
      setMentionInput('');
      
      toast.success('Post criado com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao criar post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Limpar previews ao fechar
    previewUrls.forEach(preview => URL.revokeObjectURL(preview.url));
    setPreviewUrls([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Criar Nova Postagem</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* User info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser?.avatar_url} />
              <AvatarFallback>
                {currentUser?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{currentUser?.name || 'Usuário'}</p>
              <p className="text-sm text-gray-500">
                {isPublic ? 'Público' : 'Apenas amigos'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de post */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de Post</Label>
              <div className="grid grid-cols-4 gap-2">
                {postTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      type="button"
                      variant={postType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPostType(type.value)}
                      className={`justify-start ${postType === type.value ? type.color : ''}`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Conteúdo */}
            <div>
              <Label htmlFor="content" className="text-sm font-medium mb-2 block">
                O que você está pensando?
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Compartilhe seus pensamentos, conquistas, treinos..."
                className="min-h-[100px] resize-none"
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {content.length}/2000 caracteres
                </span>
              </div>
            </div>

            {/* Mídia */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Mídia</Label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar Mídia
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                
                {/* Preview das mídias */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {previewUrls.map((preview, index) => (
                      <div key={index} className="relative group">
                        {preview.type === 'image' ? (
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={preview.url}
                            className="w-full h-32 object-cover rounded-lg"
                            controls
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveMedia(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Hashtags</Label>
              <div className="space-y-2">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={handleAddHashtag}
                  placeholder="Digite hashtags (pressione Enter ou Espaço)"
                  className="text-sm"
                />
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hashtags.map((hashtag) => (
                      <Badge key={hashtag} variant="secondary" className="text-xs">
                        #{hashtag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0"
                          onClick={() => handleRemoveHashtag(hashtag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Menções */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Menções</Label>
              <div className="space-y-2">
                <Input
                  value={mentionInput}
                  onChange={(e) => setMentionInput(e.target.value)}
                  onKeyDown={handleAddMention}
                  placeholder="Mencione usuários (pressione Enter ou Espaço)"
                  className="text-sm"
                />
                {mentions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mentions.map((mention) => (
                      <Badge key={mention} variant="outline" className="text-xs">
                        @{mention}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0"
                          onClick={() => handleRemoveMention(mention)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Humor e Localização */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Humor</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger>
                    <SelectValue placeholder="Como você está se sentindo?" />
                  </SelectTrigger>
                  <SelectContent>
                    {moods.map((moodOption) => (
                      <SelectItem key={moodOption.value} value={moodOption.value}>
                        <span className={moodOption.color}>
                          {moodOption.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Localização</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Onde você está?"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Configurações de privacidade */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="isPublic" className="text-sm">
                Post público (visível para todos)
              </Label>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
              >
                {isSubmitting ? 'Criando...' : 'Publicar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePostModal;
