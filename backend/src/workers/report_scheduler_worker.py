"""
Worker para Processamento de Relatórios Agendados RE-EDUCA Store.

Processa relatórios agendados automaticamente incluindo:
- Geração de relatórios periódicos
- Envio de relatórios por email
- Execução de relatórios agendados
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from repositories.base_repository import BaseRepository
from services.email_service import EmailService
from services.analytics_service import AnalyticsService
from config.database_local import get_supabase_client

logger = logging.getLogger(__name__)


class ReportSchedulerWorker:
    """
    Worker para processar relatórios agendados.
    
    Verifica periodicamente relatórios agendados e os executa.
    """

    def __init__(self):
        """Inicializa o worker de relatórios agendados."""
        self.running = False
        self.check_interval = 300  # 5 minutos
        self.db = get_supabase_client()
        self.email_service = EmailService()
        self.analytics_service = AnalyticsService()
        self.reports_repo = BaseRepository("scheduled_reports")

    def start(self):
        """Inicia o worker."""
        self.running = True
        logger.info("ReportSchedulerWorker iniciado")
        
        while self.running:
            try:
                self._process_scheduled_reports()
            except Exception as e:
                logger.error(f"Erro ao processar relatórios agendados: {e}", exc_info=True)
            
            time.sleep(self.check_interval)

    def stop(self):
        """Para o worker."""
        self.running = False
        logger.info("ReportSchedulerWorker parado")

    def _process_scheduled_reports(self):
        """Processa relatórios agendados que estão prontos para execução."""
        try:
            # Buscar relatórios agendados que devem ser executados
            now = datetime.utcnow()
            
            # Buscar relatórios ativos que devem ser executados
            result = self.db.table("scheduled_reports").select("*").eq("is_active", True).lte("next_run_at", now.isoformat()).execute()
            
            scheduled_reports = result.data if result.data else []
            
            logger.info(f"Encontrados {len(scheduled_reports)} relatórios para processar")
            
            for report_schedule in scheduled_reports:
                try:
                    self._execute_scheduled_report(report_schedule)
                except Exception as e:
                    logger.error(f"Erro ao executar relatório agendado {report_schedule.get('id')}: {e}", exc_info=True)
                    # Atualizar status para erro
                    self._update_schedule_status(report_schedule.get('id'), 'error', str(e))
        
        except Exception as e:
            logger.error(f"Erro ao buscar relatórios agendados: {e}", exc_info=True)

    def _execute_scheduled_report(self, schedule: Dict):
        """Executa um relatório agendado."""
        schedule_id = schedule.get('id')
        template_id = schedule.get('template_id')
        filters = schedule.get('filters', {})
        recipients = schedule.get('recipients', [])
        format_type = schedule.get('format', 'pdf')
        frequency = schedule.get('frequency')  # daily, weekly, monthly
        
        logger.info(f"Executando relatório agendado {schedule_id}")
        
        try:
            # Gerar relatório usando AnalyticsService
            report_data = self._generate_report(template_id, filters)
            
            # Exportar relatório no formato solicitado
            report_file = self._export_report(report_data, format_type, template_id)
            
            # Enviar por email se houver destinatários
            if recipients:
                self._send_report_email(recipients, report_file, format_type, schedule.get('name', 'Relatório'))
            
            # Atualizar próxima execução
            next_run = self._calculate_next_run(datetime.utcnow(), frequency)
            self._update_schedule_status(schedule_id, 'completed', None, next_run)
            
            logger.info(f"Relatório agendado {schedule_id} executado com sucesso")
        
        except Exception as e:
            logger.error(f"Erro ao executar relatório agendado {schedule_id}: {e}", exc_info=True)
            raise

    def _generate_report(self, template_id: str, filters: Dict) -> Dict:
        """Gera dados do relatório baseado no template."""
        # Buscar template
        template_result = self.db.table("report_templates").select("*").eq("id", template_id).single().execute()
        template = template_result.data if template_result.data else None
        
        if not template:
            raise ValueError(f"Template {template_id} não encontrado")
        
        report_type = template.get('type')  # sales, users, products
        
        # Gerar dados baseado no tipo
        if report_type == 'sales':
            return self.analytics_service.get_sales_analytics(filters)
        elif report_type == 'users':
            return self.analytics_service.get_user_analytics(filters)
        elif report_type == 'products':
            return self.analytics_service.get_product_analytics(filters)
        else:
            raise ValueError(f"Tipo de relatório desconhecido: {report_type}")

    def _export_report(self, report_data: Dict, format_type: str, template_id: str) -> bytes:
        """Exporta relatório no formato solicitado."""
        # Por enquanto, retorna JSON serializado
        # Em produção, implementar geração de PDF/CSV
        import json
        
        if format_type == 'json':
            return json.dumps(report_data, indent=2, default=str).encode('utf-8')
        elif format_type == 'csv':
            # Implementar conversão para CSV
            return json.dumps(report_data, default=str).encode('utf-8')
        elif format_type == 'pdf':
            # Implementar geração de PDF (usar biblioteca como reportlab)
            return json.dumps(report_data, default=str).encode('utf-8')
        else:
            raise ValueError(f"Formato não suportado: {format_type}")

    def _send_report_email(self, recipients: List[str], report_file: bytes, format_type: str, report_name: str):
        """Envia relatório por email."""
        for recipient in recipients:
            try:
                self.email_service.send_report_email(
                    recipient,
                    report_name,
                    report_file,
                    format_type
                )
                logger.info(f"Relatório enviado para {recipient}")
            except Exception as e:
                logger.error(f"Erro ao enviar relatório para {recipient}: {e}")

    def _calculate_next_run(self, current_time: datetime, frequency: str) -> datetime:
        """Calcula próxima execução baseado na frequência."""
        if frequency == 'daily':
            return current_time + timedelta(days=1)
        elif frequency == 'weekly':
            return current_time + timedelta(weeks=1)
        elif frequency == 'monthly':
            return current_time + timedelta(days=30)
        else:
            raise ValueError(f"Frequência desconhecida: {frequency}")

    def _update_schedule_status(self, schedule_id: str, status: str, error: Optional[str] = None, next_run: Optional[datetime] = None):
        """Atualiza status do agendamento."""
        update_data = {
            'last_run_at': datetime.utcnow().isoformat(),
            'last_status': status,
        }
        
        if error:
            update_data['last_error'] = error
        
        if next_run:
            update_data['next_run_at'] = next_run.isoformat()
        
        self.db.table("scheduled_reports").update(update_data).eq("id", schedule_id).execute()


def run_worker():
    """Função principal para executar o worker."""
    worker = ReportSchedulerWorker()
    try:
        worker.start()
    except KeyboardInterrupt:
        logger.info("Interrompendo worker...")
        worker.stop()


if __name__ == "__main__":
    run_worker()
