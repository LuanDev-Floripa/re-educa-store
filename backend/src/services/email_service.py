"""
Serviço de Email RE-EDUCA Store.

Gerencia envio de emails incluindo:
- Emails transacionais (confirmação, recuperação)
- Emails de notificação
- Templates HTML personalizados
- Sistema de retentativas
- Conexão SMTP segura
- Fallback para indisponibilidade
"""

import logging
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from services.base_service import BaseService
from services.queue_service import QueueNames, async_task

logger = logging.getLogger(__name__)


class EmailService(BaseService):
    """
    Service para envio de emails via SMTP.
    
    Herda de BaseService para padronização e logging consistente.
    """

    def __init__(self):
        """Inicializa o serviço de email com configurações SMTP."""
        super().__init__()
        self.smtp_server = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_username = os.environ.get("SMTP_USERNAME")
        self.smtp_password = os.environ.get("SMTP_PASSWORD")
        self.from_email = os.environ.get("FROM_EMAIL", "noreply@re-educa.com")
        self.from_name = os.environ.get("FROM_NAME", "RE-EDUCA Store")
        self.use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"

        # Verifica se as configurações estão presentes
        self.is_configured = all([self.smtp_username, self.smtp_password, self.smtp_server, self.smtp_port])

    def _create_connection(self):
        """
        Cria conexão SMTP segura com TLS.

        Returns:
            smtplib.SMTP: Conexão SMTP ou None se não configurado.
        """
        if not self.is_configured:
            logger.warning("Configurações SMTP não encontradas. Email não será enviado.")
            return None

        try:
            context = ssl.create_default_context()
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)

            if self.use_tls:
                server.starttls(context=context)

            server.login(self.smtp_username, self.smtp_password)
            return server
        except Exception as e:
            logger.error(f"Erro ao conectar SMTP: {str(e)}")
            raise

    def _send_email_internal(self, to_email: str, subject: str, html_content: str, text_content: str = None):
        """
        Método interno para envio de email (chamado pelo worker).

        Args:
            to_email: Email do destinatário
            subject: Assunto do email
            html_content: Conteúdo HTML
            text_content: Conteúdo texto (opcional)

        Returns:
            Dict com resultado do envio
        """
        if not self.is_configured:
            logger.warning(f"Email não enviado para {to_email}: Configurações SMTP não encontradas")
            return {"success": False, "error": "Configurações SMTP não encontradas"}

        try:
            server = self._create_connection()
            if not server:
                return {"success": False, "error": "Falha ao conectar com servidor SMTP"}

            msg = MIMEMultipart("alternative")
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject

            # Adiciona conteúdo texto
            if text_content:
                text_part = MIMEText(text_content, "plain", "utf-8")
                msg.attach(text_part)

            # Adiciona conteúdo HTML
            html_part = MIMEText(html_content, "html", "utf-8")
            msg.attach(html_part)

            server.send_message(msg)
            server.quit()

            logger.info(f"Email enviado com sucesso para {to_email}")
            return {"success": True, "message": f"Email enviado para {to_email}"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao enviar email: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    @async_task(queue_name=QueueNames.NOTIFICATIONS, priority=2)
    def _send_email_async(self, to_email: str, subject: str, html_content: str, text_content: str = None):
        """
        Método assíncrono para envio de email, enfileirado para processamento posterior.

        Este método será enfileirado e processado pelo worker.
        """
        return self._send_email_internal(to_email, subject, html_content, text_content)

    def _send_email(
        self, to_email: str, subject: str, html_content: str, text_content: str = None, use_queue: bool = True
    ):
        """
        Envia email de forma síncrona ou assíncrona via queue.

        Args:
            to_email: Email do destinatário
            subject: Assunto do email
            html_content: Conteúdo HTML
            text_content: Conteúdo texto (opcional)
            use_queue: Se deve usar queue (padrão: True)

        Returns:
            Dict com resultado do envio ou task_id se enfileirado
        """
        if use_queue:
            # Enfileira o email para processamento assíncrono
            try:
                result = self._send_email_async(to_email, subject, html_content, text_content)
                return result
            except (ValueError, KeyError) as e:
                logger.warning(f"Erro de validação: {str(e)}")
                # Tratamento específico pode ser adicionado aqui
            except Exception as e:
                logger.error(f"Erro ao enfileirar email: {str(e)}", exc_info=True)
                # Fallback: tenta enviar diretamente
                return self._send_email_internal(to_email, subject, html_content, text_content)
        else:
            # Envia diretamente (síncrono)
            return self._send_email_internal(to_email, subject, html_content, text_content)

    def send_verification_email(self, user_email: str, user_name: str, verification_token: str):
        """Envia email de verificação"""
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
        verification_url = f"{frontend_url}/verify-email?token={verification_token}"

        subject = "Verifique seu email - RE-EDUCA Store"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verificação de Email</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg,
                    #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌟 RE-EDUCA Store</h1>
                    <p>Verificação de Email</p>
                </div>
                <div class="content">
                    <h2>Olá, {user_name}!</h2>
                    <p>Obrigado por se cadastrar na RE-EDUCA Store! Para ativar sua conta e começar sua jornada de saúde, clique no botão abaixo:</p>

                    <div style="text-align: center;">
                        <a href="{verification_url}" class="button">Verificar Email</a>
                    </div>

                    <p>Ou copie e cole este link no seu navegador:</p>
                    <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">{verification_url}</p>

                    <p><strong>Importante:</strong> Este link expira em 24 horas por motivos de segurança.</p>

                    <p>Se você não se cadastrou na RE-EDUCA Store, pode ignorar este email.</p>

                    <p>Bem-vindo à revolução da saúde digital!</p>
                    <p>Equipe RE-EDUCA</p>
                </div>
                <div class="footer">
                    <p>© 2025 RE-EDUCA Store. Todos os direitos reservados.</p>
                    <p>Este é um email automático, não responda.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Olá, {user_name}!

        Obrigado por se cadastrar na RE-EDUCA Store!

        Para ativar sua conta, acesse o link abaixo:
        {verification_url}

        Este link expira em 24 horas.

        Se você não se cadastrou, ignore este email.

        Equipe RE-EDUCA
        """

        return self._send_email(user_email, subject, html_content, text_content)

    def send_password_reset_email(self, user_email: str, user_name: str, reset_token: str):
        """Envia email de reset de senha"""
        reset_url = f"{os.environ.get('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token={reset_token}"

        subject = "Redefinir sua senha - RE-EDUCA Store"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redefinir Senha</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg,
                    #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                .warning {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 RE-EDUCA Store</h1>
                    <p>Redefinir Senha</p>
                </div>
                <div class="content">
                    <h2>Olá, {user_name}!</h2>
                    <p>Recebemos uma solicitação para redefinir a senha da sua conta na RE-EDUCA Store.</p>

                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Redefinir Senha</a>
                    </div>

                    <p>Ou copie e cole este link no seu navegador:</p>
                    <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">{reset_url}</p>

                    <div class="warning">
                        <strong>⚠️ Importante:</strong>
                        <ul>
                            <li>Este link expira em 1 hora por motivos de segurança</li>
                            <li>Se você não solicitou esta redefinição, ignore este email</li>
                            <li>Sua senha atual permanece inalterada até que você crie uma nova</li>
                        </ul>
                    </div>

                    <p>Se você não solicitou esta redefinição, pode ignorar este email com segurança.</p>

                    <p>Equipe RE-EDUCA</p>
                </div>
                <div class="footer">
                    <p>© 2025 RE-EDUCA Store. Todos os direitos reservados.</p>
                    <p>Este é um email automático, não responda.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Olá, {user_name}!

        Recebemos uma solicitação para redefinir sua senha.

        Para redefinir sua senha, acesse:
        {reset_url}

        Este link expira em 1 hora.

        Se você não solicitou esta redefinição, ignore este email.

        Equipe RE-EDUCA
        """

        return self._send_email(user_email, subject, html_content, text_content)

    def send_new_password_email(self, user_email: str, user_name: str, new_password: str):
        """
        Envia email com nova senha (usado por admin para resetar senha).
        
        Args:
            user_email: Email do usuário
            user_name: Nome do usuário
            new_password: Nova senha gerada
        """
        subject = "Nova Senha - RE-EDUCA Store"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nova Senha</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .password-box {{ background: #fff; border: 2px solid #ff6b6b; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }}
                .warning {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 RE-EDUCA Store</h1>
                    <p>Nova Senha Gerada</p>
                </div>
                <div class="content">
                    <h2>Olá, {user_name}!</h2>
                    <p>Uma nova senha foi gerada para sua conta na RE-EDUCA Store.</p>

                    <div class="password-box">
                        <p style="margin: 0; color: #ff6b6b;">Sua nova senha:</p>
                        <p style="margin: 10px 0; font-family: monospace; letter-spacing: 2px;">{new_password}</p>
                    </div>

                    <div class="warning">
                        <strong>⚠️ Importante:</strong>
                        <ul>
                            <li>Altere esta senha após o primeiro login por segurança</li>
                            <li>Não compartilhe sua senha com ninguém</li>
                            <li>Se você não solicitou esta alteração, entre em contato conosco imediatamente</li>
                        </ul>
                    </div>

                    <p>Equipe RE-EDUCA</p>
                </div>
                <div class="footer">
                    <p>© 2025 RE-EDUCA Store. Todos os direitos reservados.</p>
                    <p>Este é um email automático, não responda.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Olá, {user_name}!

        Uma nova senha foi gerada para sua conta na RE-EDUCA Store.

        Sua nova senha: {new_password}

        IMPORTANTE:
        - Altere esta senha após o primeiro login
        - Não compartilhe sua senha com ninguém
        - Se você não solicitou esta alteração, entre em contato conosco

        Equipe RE-EDUCA
        """

        return self._send_email(user_email, subject, html_content, text_content)

    def send_welcome_email(self, user_email: str, user_name: str):
        """Envia email de boas-vindas"""
        subject = "Bem-vindo à RE-EDUCA Store! 🎉"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg,
                    #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .feature {{ background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Bem-vindo à RE-EDUCA Store!</h1>
                    <p>Sua jornada de saúde começa agora</p>
                </div>
                <div class="content">
                    <h2>Olá, {user_name}!</h2>
                    <p>Parabéns! Sua conta foi verificada com sucesso e você agora faz parte da comunidade RE-EDUCA.</p>

                    <h3>🚀 O que você pode fazer agora:</h3>

                    <div class="feature">
                        <h4>📊 Calculadora IMC</h4>
                        <p>Calcule seu IMC e acompanhe sua evolução com gráficos detalhados.</p>
                    </div>

                    <div class="feature">
                        <h4>🍎 Diário Alimentar</h4>
                        <p>Registre suas refeições e acompanhe sua nutrição com dados da USDA.</p>
                    </div>

                    <div class="feature">
                        <h4>🛒 Loja de Produtos</h4>
                        <p>Descubra produtos cuidadosamente selecionados para sua saúde.</p>
                    </div>

                    <div class="feature">
                        <h4>🤖 Assistente IA</h4>
                        <p>Tenha um assistente personalizado para suas dúvidas sobre saúde.</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{os.environ.get('FRONTEND_URL', 'http://localhost:5173')}/dashboard"
                           style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                            Começar Agora
                        </a>
                    </div>

                    <p>Se você tiver alguma dúvida, nossa equipe de suporte está sempre pronta para ajudar!</p>

                    <p>Bem-vindo à revolução da saúde digital!</p>
                    <p>Equipe RE-EDUCA</p>
                </div>
                <div class="footer">
                    <p>© 2025 RE-EDUCA Store. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Olá, {user_name}!

        Parabéns! Sua conta foi verificada com sucesso.

        O que você pode fazer agora:
        - Calcular seu IMC
        - Registrar refeições
        - Explorar produtos
        - Usar o assistente IA

        Acesse: {os.environ.get('FRONTEND_URL', 'http://localhost:5173')}/dashboard

        Equipe RE-EDUCA
        """

        return self._send_email(user_email, subject, html_content, text_content)

    def send_report_email(self, recipient_email: str, report_name: str, report_file: bytes, format_type: str = 'pdf'):
        """
        Envia relatório por email com anexo.
        
        Args:
            recipient_email: Email do destinatário
            report_name: Nome do relatório
            report_file: Arquivo do relatório (bytes)
            format_type: Formato do arquivo (pdf, csv, json)
        """
        from email.mime.base import MIMEBase
        from email import encoders
        
        subject = f"Relatório: {report_name} - RE-EDUCA Store"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Relatório Gerado</h1>
                </div>
                <div class="content">
                    <h2>Olá!</h2>
                    <p>O relatório <strong>{report_name}</strong> foi gerado com sucesso e está anexado a este email.</p>
                    <p>Formato: {format_type.upper()}</p>
                    <p>Equipe RE-EDUCA</p>
                </div>
                <div class="footer">
                    <p>© 2025 RE-EDUCA Store. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Olá!
        
        O relatório {report_name} foi gerado com sucesso e está anexado a este email.
        Formato: {format_type.upper()}
        
        Equipe RE-EDUCA
        """
        
        # Criar mensagem multipart
        msg = MIMEMultipart()
        msg['From'] = f"{self.from_name} <{self.from_email}>"
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        # Adicionar corpo do email
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        # Adicionar anexo
        attachment = MIMEBase('application', 'octet-stream')
        attachment.set_payload(report_file)
        encoders.encode_base64(attachment)
        attachment.add_header(
            'Content-Disposition',
            f'attachment; filename= "{report_name}.{format_type}"'
        )
        msg.attach(attachment)
        
        return self._send_email_raw(msg)
    
    def _send_email_raw(self, msg):
        """Envia email usando mensagem MIME já formatada."""
        if not self.is_configured:
            logger.warning("SMTP não configurado, email não enviado")
            return False
        
        try:
            with self._create_connection() as server:
                server.send_message(msg)
                logger.info(f"Email enviado para {msg['To']}")
                return True
        except Exception as e:
            logger.error(f"Erro ao enviar email: {e}", exc_info=True)
            return False
