import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Ui/card';
import { Button } from '../Ui/button';
import { Input } from '../Ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../Ui/avatar';
import { Badge } from '../Ui/badge';
import { Progress } from '../Ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Ui/tabs';
import {
  Shield, CheckCircle, XCircle, Clock, AlertCircle, Upload, Camera, 
  FileText, User, Mail, Phone, MapPin, Calendar, Award, Star, Crown,
  X, Check, Eye, Edit, Trash2, Flag, MoreHorizontal, Settings, Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const AccountVerification = ({ 
  currentUser, 
  onSubmitVerification, 
  onUpdateVerification,
  onApproveVerification,
  onRejectVerification,
  onRequestReview
}) => {
  // Implementar funcionalidades reais
  const handleUpdateVerification = async (verificationData) => {
    try {
      if (onUpdateVerification) {
        await onUpdateVerification(verificationData);
        toast.success('Verificação atualizada com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar verificação');
    }
  };
  
  const handleRequestReview = async () => {
    try {
      if (onRequestReview) {
        await onRequestReview();
        toast.success('Solicitação de revisão enviada!');
      }
    } catch (error) {
      toast.error('Erro ao solicitar revisão');
    }
  };
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [verificationData, setVerificationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    documentType: 'cpf',
    documentNumber: '',
    documentFront: null,
    documentBack: null,
    selfie: null,
    additionalDocuments: [],
    category: 'fitness',
    description: '',
    socialMedia: {
      instagram: '',
      youtube: '',
      tiktok: '',
      twitter: ''
    },
    achievements: [],
    references: []
  });
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Implementar funcionalidades reais para modais
  const handleOpenSubmitModal = () => {
    setShowSubmitModal(true);
  };
  
  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
  };
  
  const handleOpenReviewModal = () => {
    setShowReviewModal(true);
  };
  
  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
  };
  
  // Implementar funcionalidade real para submit
  const handleSubmitVerification = async (formData) => {
    try {
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setVerificationStatus('pending');
        toast.success('Verificação enviada com sucesso!');
        handleCloseSubmitModal();
      } else {
        throw new Error('Erro ao enviar verificação');
      }
    } catch (error) {
      toast.error('Erro ao enviar verificação');
    }
  };
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Carregar verificações pendentes da API
  useEffect(() => {
    const loadPendingVerifications = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const response = await fetch('/api/social/verification/pending', {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPendingVerifications(data.verifications || data.data || []);
        } else {
          setPendingVerifications([]);
        }
      } catch (error) {
        console.error('Erro ao carregar verificações pendentes:', error);
        setPendingVerifications([]);
      }
    };

    loadPendingVerifications();
  }, []);

  const handleSubmitVerificationData = async () => {
    if (!verificationData.fullName || !verificationData.email || !verificationData.documentNumber) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Enviar verificação via API
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(verificationData)
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus('pending');
        setShowSubmitModal(false);
        toast.success('Solicitação de verificação enviada!');
        
        if (onSubmitVerification) {
          onSubmitVerification(verificationData);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar verificação');
      }
    } catch (error) {
      console.error('Erro ao enviar verificação:', error);
      toast.error(error.message || 'Erro ao enviar solicitação');
    }
  };

  const handleApproveVerification = async (verificationId) => {
    try {
      await onApproveVerification(verificationId);
      setPendingVerifications(prev => prev.filter(v => v.id !== verificationId));
      toast.success('Verificação aprovada!');
    } catch (error) {
      toast.error('Erro ao aprovar verificação');
    }
  };

  const handleRejectVerification = async (verificationId, reason) => {
    try {
      await onRejectVerification(verificationId, reason);
      setPendingVerifications(prev => prev.filter(v => v.id !== verificationId));
      toast.success('Verificação rejeitada');
    } catch (error) {
      toast.error('Erro ao rejeitar verificação');
    }
  };

  const handleFileUpload = async (file, type) => {
    try {
      setUploadProgress(0);
      
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('user_id', currentUser?.id || '');
      
      // Fazer upload real via API
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const xhr = new XMLHttpRequest();
      
      // Monitorar progresso do upload
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });
      
      // Tratar resposta
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setVerificationData(prev => ({
            ...prev,
            [type]: response.url || response.file_url || response.data?.url
          }));
          toast.success('Arquivo enviado com sucesso!');
          setUploadProgress(100);
        } else {
          throw new Error('Erro no upload');
        }
      });
      
      xhr.addEventListener('error', () => {
        toast.error('Erro ao fazer upload do arquivo');
        setUploadProgress(0);
      });
      
      // Tentar endpoint de upload de verificação, ou genérico de storage
      xhr.open('POST', '/api/social/verification/upload');
      xhr.setRequestHeader('Authorization', token ? `Bearer ${token}` : '');
      xhr.send(formData);
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
      setUploadProgress(0);
    }
  };

  const categories = [
    { value: 'fitness', label: 'Fitness', icon: '💪' },
    { value: 'nutrition', label: 'Nutrição', icon: '🥗' },
    { value: 'yoga', label: 'Yoga', icon: '🧘' },
    { value: 'running', label: 'Corrida', icon: '🏃' },
    { value: 'cycling', label: 'Ciclismo', icon: '🚴' },
    { value: 'swimming', label: 'Natação', icon: '🏊' },
    { value: 'dance', label: 'Dança', icon: '💃' },
    { value: 'other', label: 'Outros', icon: '🎯' }
  ];

  const documentTypes = [
    { value: 'cpf', label: 'CPF' },
    { value: 'rg', label: 'RG' },
    { value: 'cnh', label: 'CNH' },
    { value: 'passport', label: 'Passaporte' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verificação de Contas
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Verifique sua identidade e credenciais profissionais
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={verificationStatus === 'approved' ? 'default' : 'secondary'} className="flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span>
              {verificationStatus === 'approved' ? 'Verificado' : 
               verificationStatus === 'rejected' ? 'Rejeitado' : 'Pendente'}
            </span>
          </Badge>
        </div>
      </div>

      {/* Status da Verificação */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${getStatusColor(verificationStatus)}`}>
                {getStatusIcon(verificationStatus)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Status da Verificação
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {verificationStatus === 'approved' ? 'Sua conta foi verificada com sucesso!' :
                   verificationStatus === 'rejected' ? 'Sua verificação foi rejeitada. Envie uma nova solicitação.' :
                   'Sua verificação está sendo analisada. Aguarde o resultado.'}
                </p>
              </div>
            </div>
            {verificationStatus !== 'approved' && (
              <Button onClick={() => setShowSubmitModal(true)}>
                <Shield className="w-4 h-4 mr-2" />
                {verificationStatus === 'rejected' ? 'Nova Solicitação' : 'Atualizar Dados'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="my-verification" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-verification">Minha Verificação</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
        </TabsList>

        {/* Minha Verificação */}
        <TabsContent value="my-verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Verificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  <Input
                    value={verificationData.fullName}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Digite seu nome completo"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    value={verificationData.email}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Digite seu email"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefone
                  </label>
                  <Input
                    value={verificationData.phone}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Digite seu telefone"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Nascimento
                  </label>
                  <Input
                    type="date"
                    value={verificationData.birthDate}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria Profissional
                </label>
                <select
                  value={verificationData.category}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição Profissional
                </label>
                <textarea
                  value={verificationData.description}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva sua experiência e credenciais profissionais..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Redes Sociais
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    value={verificationData.socialMedia.instagram}
                    onChange={(e) => setVerificationData(prev => ({ 
                      ...prev, 
                      socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                    }))}
                    placeholder="Instagram (@usuario)"
                    className="w-full"
                  />
                  <Input
                    value={verificationData.socialMedia.youtube}
                    onChange={(e) => setVerificationData(prev => ({ 
                      ...prev, 
                      socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                    }))}
                    placeholder="YouTube (Canal)"
                    className="w-full"
                  />
                  <Input
                    value={verificationData.socialMedia.tiktok}
                    onChange={(e) => setVerificationData(prev => ({ 
                      ...prev, 
                      socialMedia: { ...prev.socialMedia, tiktok: e.target.value }
                    }))}
                    placeholder="TikTok (@usuario)"
                    className="w-full"
                  />
                  <Input
                    value={verificationData.socialMedia.twitter}
                    onChange={(e) => setVerificationData(prev => ({ 
                      ...prev, 
                      socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                    }))}
                    placeholder="Twitter (@usuario)"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    value={verificationData.documentType}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, documentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número do Documento
                  </label>
                  <Input
                    value={verificationData.documentNumber}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, documentNumber: e.target.value }))}
                    placeholder="Digite o número do documento"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frente do Documento
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {verificationData.documentFront ? (
                      <div className="space-y-2">
                        <img src={verificationData.documentFront} alt="Frente" className="w-full h-32 object-cover rounded" />
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Alterar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">Clique para enviar</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'documentFront')}
                          className="hidden"
                          id="documentFront"
                        />
                        <label htmlFor="documentFront" className="cursor-pointer">
                          <Button size="sm" variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Enviar
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Verso do Documento
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {verificationData.documentBack ? (
                      <div className="space-y-2">
                        <img src={verificationData.documentBack} alt="Verso" className="w-full h-32 object-cover rounded" />
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Alterar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">Clique para enviar</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'documentBack')}
                          className="hidden"
                          id="documentBack"
                        />
                        <label htmlFor="documentBack" className="cursor-pointer">
                          <Button size="sm" variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Enviar
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selfie
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {verificationData.selfie ? (
                      <div className="space-y-2">
                        <img src={verificationData.selfie} alt="Selfie" className="w-full h-32 object-cover rounded" />
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Alterar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">Clique para enviar</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'selfie')}
                          className="hidden"
                          id="selfie"
                        />
                        <label htmlFor="selfie" className="cursor-pointer">
                          <Button size="sm" variant="outline">
                            <Camera className="w-4 h-4 mr-2" />
                            Enviar
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Enviando arquivo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verificações Pendentes */}
        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {pendingVerifications.map(verification => (
              <Card key={verification.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={verification.user.avatar} />
                        <AvatarFallback>{verification.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {verification.user.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{verification.user.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Pendente</span>
                      </Badge>
                      <Button
                        onClick={() => setSelectedVerification(verification)}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Categoria: {categories.find(c => c.value === verification.category)?.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {verification.description}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Redes Sociais
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(verification.socialMedia).map(([platform, handle]) => (
                        handle && (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}: {handle}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Conquistas
                    </h4>
                    <ul className="space-y-1">
                      {verification.achievements.map((achievement, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                          <Award className="w-3 h-3 text-yellow-500" />
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Enviado em {formatDistanceToNow(verification.submittedAt, { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleApproveVerification(verification.id)}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleRejectVerification(verification.id, 'Documentos insuficientes')}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Verificações Aprovadas */}
        <TabsContent value="approved" className="space-y-4">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Contas Verificadas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Lista de contas que foram verificadas com sucesso
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Verificação */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedVerification.user.avatar} />
                  <AvatarFallback>{selectedVerification.user.name[0]}</AvatarFallback>
                </Avatar>
                <span>Verificação de {selectedVerification.user.name}</span>
              </CardTitle>
              <Button
                onClick={() => setSelectedVerification(null)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do Usuário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Informações Pessoais
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Nome:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {selectedVerification.user.name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Email:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {selectedVerification.user.email}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Categoria:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {categories.find(c => c.value === selectedVerification.category)?.label}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Documentos
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <img
                        src={selectedVerification.documents.front}
                        alt="Frente do documento"
                        className="w-full h-32 object-cover rounded border"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Frente do Documento
                      </p>
                    </div>
                    <div>
                      <img
                        src={selectedVerification.documents.back}
                        alt="Verso do documento"
                        className="w-full h-32 object-cover rounded border"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Verso do Documento
                      </p>
                    </div>
                    <div>
                      <img
                        src={selectedVerification.documents.selfie}
                        alt="Selfie"
                        className="w-full h-32 object-cover rounded border"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Selfie
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Redes Sociais */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Redes Sociais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedVerification.socialMedia).map(([platform, handle]) => (
                    handle && (
                      <div key={platform} className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {platform}:
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">{handle}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
              
              {/* Conquistas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Conquistas e Credenciais
                </h3>
                <ul className="space-y-2">
                  {selectedVerification.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-900 dark:text-white">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Ações */}
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleApproveVerification(selectedVerification.id)}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar Verificação
                </Button>
                <Button
                  onClick={() => handleRejectVerification(selectedVerification.id, 'Documentos insuficientes')}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar Verificação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AccountVerification;