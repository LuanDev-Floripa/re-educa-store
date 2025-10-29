import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/Ui/dialog';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Alert, AlertDescription } from '@/components/Ui/alert';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

const AIConfigTestModal = ({ config, onTest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const result = await onTest(config.id);
      setTestResult(result);
      toast.success('Teste executado com sucesso!');
      
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
      toast.error('Erro ao executar teste: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'connected_mock':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'connected_mock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProviderIcon = (provider) => {
    const icons = {
      gemini: '🧠',
      perplexity: '🔍',
      openai: '🤖',
      claude: '🧬'
    };
    return icons[provider] || '⚙️';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TestTube className="h-4 w-4 mr-2" />
          Testar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="text-2xl">{getProviderIcon(config.provider)}</span>
            <span>Testar Configuração</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações da Configuração */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Provider:</span>
              <Badge variant="outline">{config.provider.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Serviço:</span>
              <span className="text-sm">{config.service_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Modelo:</span>
              <span className="text-sm">{config.model_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={config.is_active ? "default" : "destructive"}>
                {config.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            {config.is_mock && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Modo:</span>
                <Badge variant="secondary">
                  <TestTube className="h-3 w-3 mr-1" />
                  Mock
                </Badge>
              </div>
            )}
          </div>

          {/* Resultado do Teste */}
          {testResult && (
            <Alert className={getStatusColor(testResult.success ? 'connected' : 'error')}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(testResult.success ? 'connected' : 'error')}
                <AlertDescription>
                  {testResult.success ? (
                    <div>
                      <p className="font-medium">Teste bem-sucedido!</p>
                      <p className="text-sm mt-1">
                        Status: {testResult.data?.status || 'Conectado'}
                      </p>
                      {testResult.data?.response && (
                        <p className="text-sm mt-1">
                          Resposta: {testResult.data.response.substring(0, 100)}...
                        </p>
                      )}
                      {testResult.data?.tested_at && (
                        <p className="text-xs mt-1 opacity-75">
                          Testado em: {new Date(testResult.data.tested_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Teste falhou</p>
                      <p className="text-sm mt-1">{testResult.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Botões de Ação */}
          <div className="flex space-x-2">
            <Button 
              onClick={handleTest} 
              disabled={testing}
              className="flex-1"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Executar Teste
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </div>

          {/* Informações Adicionais */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• O teste verifica a conectividade com a API</p>
            <p>• Em modo mock, o teste é simulado</p>
            <p>• Em produção, o teste usa a chave real</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIConfigTestModal;