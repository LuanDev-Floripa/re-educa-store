"""
Service de Relatórios Avançados RE-EDUCA Store.

Gerencia geração de relatórios incluindo:
- Templates pré-configurados
- Relatórios customizados
- Agendamento de relatórios
- Geração de PDF
- Exportação em múltiplos formatos
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from repositories.report_repository import ReportRepository
from services.analytics_service import AnalyticsService
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class ReportService(BaseService):
    """
    Service para geração de relatórios avançados.
    
    Utiliza AnalyticsService para obter dados e gera relatórios
    em múltiplos formatos com templates personalizáveis.
    """

    def __init__(self):
        """Inicializa o serviço de relatórios."""
        super().__init__()
        self.repo = ReportRepository()
        self.analytics_service = AnalyticsService()

    # ================================
    # TEMPLATES DE RELATÓRIOS
    # ================================

    def get_report_templates(self) -> List[Dict[str, Any]]:
        """
        Retorna templates de relatórios disponíveis.
        
        Returns:
            Lista de templates com configurações
        """
        return [
            {
                "id": "sales_daily",
                "name": "Relatório Diário de Vendas",
                "description": "Vendas do dia com detalhamento por produto",
                "type": "sales",
                "period": "today",
                "sections": ["summary", "products", "categories"],
                "format": ["pdf", "csv", "json"],
            },
            {
                "id": "sales_weekly",
                "name": "Relatório Semanal de Vendas",
                "description": "Análise semanal de vendas e tendências",
                "type": "sales",
                "period": "week",
                "sections": ["summary", "daily_breakdown", "products", "categories", "comparison"],
                "format": ["pdf", "csv", "json"],
            },
            {
                "id": "sales_monthly",
                "name": "Relatório Mensal de Vendas",
                "description": "Relatório completo mensal com análises",
                "type": "sales",
                "period": "month",
                "sections": ["summary", "daily_breakdown", "products", "categories", "comparison", "forecast"],
                "format": ["pdf", "csv", "json", "excel"],
            },
            {
                "id": "users_growth",
                "name": "Relatório de Crescimento de Usuários",
                "description": "Análise de novos usuários e engajamento",
                "type": "users",
                "period": "month",
                "sections": ["summary", "growth", "activity", "segments"],
                "format": ["pdf", "csv", "json"],
            },
            {
                "id": "products_performance",
                "name": "Relatório de Performance de Produtos",
                "description": "Análise de vendas e estoque de produtos",
                "type": "products",
                "period": "month",
                "sections": ["summary", "top_products", "low_stock", "categories"],
                "format": ["pdf", "csv", "json", "excel"],
            },
            {
                "id": "comprehensive",
                "name": "Relatório Completo",
                "description": "Relatório consolidado com todas as métricas",
                "type": "all",
                "period": "month",
                "sections": ["summary", "sales", "users", "products", "recommendations"],
                "format": ["pdf", "csv", "json", "excel"],
            },
        ]

    def get_template_by_id(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        Retorna template específico por ID.
        
        Args:
            template_id: ID do template
            
        Returns:
            Template ou None se não encontrado
        """
        templates = self.get_report_templates()
        return next((t for t in templates if t["id"] == template_id), None)

    # ================================
    # GERAÇÃO DE RELATÓRIOS
    # ================================

    def generate_report(
        self,
        report_type: str,
        period: str = "month",
        template_id: Optional[str] = None,
        sections: Optional[List[str]] = None,
        custom_filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Gera relatório completo com dados e metadados.
        
        Args:
            report_type: Tipo de relatório (sales, users, products, all)
            period: Período (today, week, month, quarter, year)
            template_id: ID do template (opcional)
            sections: Seções específicas a incluir (opcional)
            custom_filters: Filtros customizados (opcional)
            
        Returns:
            Dict com dados do relatório
        """
        try:
            # Obter template se fornecido
            template = None
            if template_id:
                template = self.get_template_by_id(template_id)
                if template:
                    report_type = template.get("type", report_type)
                    period = template.get("period", period)
                    if not sections:
                        sections = template.get("sections", [])

            # Gerar dados baseado no tipo
            report_data = {
                "report_type": report_type,
                "period": period,
                "generated_at": datetime.now().isoformat(),
                "template": template_id,
                "sections": sections or [],
            }

            if report_type == "sales" or report_type == "all":
                sales_data = self.analytics_service.get_sales_analytics(period)
                report_data["sales"] = sales_data

            if report_type == "users" or report_type == "all":
                users_data = self.analytics_service.get_users_analytics(period)
                report_data["users"] = users_data

            if report_type == "products" or report_type == "all":
                products_data = self.analytics_service.get_products_analytics(period)
                report_data["products"] = products_data

            # Aplicar filtros customizados se fornecidos
            if custom_filters:
                report_data["filters"] = custom_filters
                report_data = self._apply_custom_filters(report_data, custom_filters)

            # Adicionar recomendações se solicitado
            if sections and "recommendations" in sections:
                report_data["recommendations"] = self._generate_recommendations(report_data)

            return {"success": True, "report": report_data}

        except Exception as e:
            self.logger.error(f"Erro ao gerar relatório: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _apply_custom_filters(self, report_data: Dict[str, Any], filters: Dict[str, Any]) -> Dict[str, Any]:
        """Aplica filtros customizados aos dados do relatório."""
        # Implementar filtros específicos conforme necessário
        # Por exemplo: filtrar por categoria, faixa de preço, etc.
        return report_data

    def _generate_recommendations(self, report_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Gera recomendações baseadas nos dados do relatório."""
        recommendations = []

        # Analisar vendas
        if "sales" in report_data:
            sales = report_data["sales"]
            metrics = sales.get("metrics", {})
            
            # Recomendação de estoque baixo
            if metrics.get("cancelled_orders", 0) > metrics.get("completed_orders", 0) * 0.1:
                recommendations.append({
                    "type": "warning",
                    "title": "Alta taxa de cancelamento",
                    "message": f"Taxa de cancelamento está em {metrics.get('cancelled_orders', 0)} pedidos. Considere revisar processos.",
                })

            # Recomendação de produtos
            top_products = sales.get("top_products", [])
            if top_products:
                recommendations.append({
                    "type": "info",
                    "title": "Produtos em destaque",
                    "message": f"{len(top_products)} produtos estão entre os mais vendidos. Considere aumentar estoque.",
                })

        # Analisar usuários
        if "users" in report_data:
            users = report_data["users"]
            metrics = users.get("metrics", {})
            
            if metrics.get("new_users", 0) > 0:
                growth_rate = metrics.get("growth_rate", 0)
                if growth_rate > 20:
                    recommendations.append({
                        "type": "success",
                        "title": "Crescimento forte",
                        "message": f"Crescimento de {growth_rate}% no período. Continue investindo em marketing.",
                    })

        return recommendations

    # ================================
    # AGENDAMENTO DE RELATÓRIOS
    # ================================

    def schedule_report(
        self,
        template_id: str,
        frequency: str,
        recipients: List[str],
        format: str = "pdf",
        start_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Agenda relatório para envio automático.
        
        Args:
            template_id: ID do template
            frequency: Frequência (daily, weekly, monthly)
            recipients: Lista de emails para receber
            format: Formato do relatório (pdf, csv, json)
            start_date: Data de início (opcional, padrão: hoje)
            
        Returns:
            Dict com confirmação do agendamento
        """
        try:
            template = self.get_template_by_id(template_id)
            if not template:
                return {"success": False, "error": "Template não encontrado"}

            schedule_data = {
                "template_id": template_id,
                "frequency": frequency,
                "recipients": recipients,
                "format": format,
                "start_date": start_date or datetime.now().isoformat(),
                "is_active": True,
                "created_at": datetime.now().isoformat(),
            }

            scheduled = self.repo.create_schedule(schedule_data)

            if scheduled:
                return {"success": True, "schedule": scheduled, "message": "Relatório agendado com sucesso"}
            else:
                return {"success": False, "error": "Erro ao agendar relatório"}

        except Exception as e:
            self.logger.error(f"Erro ao agendar relatório: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_scheduled_reports(self) -> List[Dict[str, Any]]:
        """Retorna todos os relatórios agendados."""
        try:
            return self.repo.find_all_schedules()
        except Exception as e:
            self.logger.error(f"Erro ao buscar relatórios agendados: {e}", exc_info=True)
            return []

    def cancel_scheduled_report(self, schedule_id: str) -> Dict[str, Any]:
        """Cancela relatório agendado."""
        try:
            updated = self.repo.update_schedule(schedule_id, {"is_active": False})
            if updated:
                return {"success": True, "message": "Agendamento cancelado com sucesso"}
            else:
                return {"success": False, "error": "Agendamento não encontrado"}
        except Exception as e:
            self.logger.error(f"Erro ao cancelar agendamento: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    # ================================
    # GERAÇÃO DE PDF
    # ================================

    def generate_pdf(self, report_data: Dict[str, Any]) -> bytes:
        """
        Gera PDF do relatório.
        
        Args:
            report_data: Dados do relatório
            
        Returns:
            Bytes do PDF
        """
        try:
            # Usar biblioteca de PDF (reportlab ou weasyprint)
            # Por enquanto, retornar placeholder
            # TODO: Implementar geração real de PDF
            
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
            import io

            buffer = io.BytesIO()
            p = canvas.Canvas(buffer, pagesize=letter)

            # Título
            p.setFont("Helvetica-Bold", 16)
            p.drawString(100, 750, f"Relatório: {report_data.get('report_type', 'N/A').upper()}")

            # Data
            p.setFont("Helvetica", 12)
            generated_at = report_data.get("generated_at", "")
            if generated_at:
                date_str = datetime.fromisoformat(generated_at.replace("Z", "+00:00")).strftime("%d/%m/%Y %H:%M")
                p.drawString(100, 730, f"Gerado em: {date_str}")

            # Seções
            y = 700
            p.setFont("Helvetica-Bold", 14)
            p.drawString(100, y, "Resumo Executivo")
            y -= 30

            # Adicionar dados do relatório
            if "sales" in report_data:
                sales = report_data["sales"]
                metrics = sales.get("metrics", {})
                p.setFont("Helvetica", 10)
                p.drawString(100, y, f"Receita Total: R$ {metrics.get('total_revenue', 0):.2f}")
                y -= 20
                p.drawString(100, y, f"Total de Pedidos: {metrics.get('total_orders', 0)}")
                y -= 20

            p.save()
            buffer.seek(0)
            return buffer.getvalue()

        except ImportError:
            # Se reportlab não estiver instalado, retornar erro
            self.logger.warning("reportlab não instalado, PDF não disponível")
            raise Exception("Biblioteca de PDF não disponível")
        except Exception as e:
            self.logger.error(f"Erro ao gerar PDF: {e}", exc_info=True)
            raise
