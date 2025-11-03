# -*- coding: utf-8 -*-
"""
Mocks de Repositórios para Testes RE-EDUCA Store.

Fornece mocks completos dos repositórios para uso em testes unitários.
"""
from unittest.mock import Mock, MagicMock
from typing import Dict, Any, List, Optional


class MockHealthRepository:
    """Mock do HealthRepository para testes"""
    
    def __init__(self):
        self.data = {
            'imc': [],
            'calories': [],
            'biological_age': [],
            'food_entries': [],
            'exercise_entries': []
        }
    
    def save_imc_calculation(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        entry = {'id': 'calc-123', 'user_id': user_id, **data}
        self.data['imc'].append(entry)
        return entry
    
    def get_imc_history(self, user_id: str, page: int = 1, per_page: int = 20, 
                       start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        calculations = [c for c in self.data['imc'] if c['user_id'] == user_id]
        total = len(calculations)
        start = (page - 1) * per_page
        end = start + per_page
        
        return {
            'calculations': calculations[start:end],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page if total > 0 else 0
            }
        }
    
    def save_calorie_calculation(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        entry = {'id': 'cal-123', 'user_id': user_id, **data}
        self.data['calories'].append(entry)
        return entry
    
    def save_biological_age_calculation(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        entry = {'id': 'bio-123', 'user_id': user_id, **data}
        self.data['biological_age'].append(entry)
        return entry
    
    def get_biological_age_history(self, user_id: str, page: int = 1, per_page: int = 20,
                                  start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        calculations = [c for c in self.data['biological_age'] if c['user_id'] == user_id]
        total = len(calculations)
        start = (page - 1) * per_page
        end = start + per_page
        
        return {
            'calculations': calculations[start:end],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page if total > 0 else 0
            }
        }
    
    def add_food_entry(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        entry = {'id': 'food-123', 'user_id': user_id, **data}
        self.data['food_entries'].append(entry)
        return entry
    
    def get_food_entries(self, user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        entries = [e for e in self.data['food_entries'] if e['user_id'] == user_id]
        if date:
            entries = [e for e in entries if e.get('entry_date') == date]
        start = (page - 1) * per_page
        end = start + per_page
        return entries[start:end]
    
    def add_exercise_entry(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        entry = {'id': 'ex-123', 'user_id': user_id, **data}
        self.data['exercise_entries'].append(entry)
        return entry
    
    def get_exercise_entries(self, user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20) -> List[Dict[str, Any]]:
        entries = [e for e in self.data['exercise_entries'] if e['user_id'] == user_id]
        if date:
            entries = [e for e in entries if e.get('entry_date') == date]
        start = (page - 1) * per_page
        end = start + per_page
        return entries[start:end]


class MockUserRepository:
    """Mock do UserRepository para testes"""
    
    def __init__(self):
        self.data = {}
    
    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        return self.data.get(id)
    
    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        for user in self.data.values():
            if user.get('email') == email:
                return user
        return None
    
    def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if user_id in self.data:
            self.data[user_id].update(profile_data)
            return self.data[user_id]
        return None


class MockProductRepository:
    """Mock do ProductRepository para testes"""
    
    def __init__(self):
        self.data = []
    
    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        for product in self.data:
            if product.get('id') == id:
                return product
        return None
    
    def find_recommended(self, limit: int = 10) -> List[Dict[str, Any]]:
        sorted_products = sorted(self.data, key=lambda x: x.get('rating', 0), reverse=True)
        return sorted_products[:limit]
    
    def find_trending(self, limit: int = 10) -> List[Dict[str, Any]]:
        sorted_products = sorted(self.data, key=lambda x: x.get('sales_count', 0), reverse=True)
        return sorted_products[:limit]


class MockOrderRepository:
    """Mock do OrderRepository para testes"""
    
    def __init__(self):
        self.data = []
    
    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        for order in self.data:
            if order.get('id') == id:
                return order
        return None
    
    def find_by_user(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        user_orders = [o for o in self.data if o.get('user_id') == user_id]
        total = len(user_orders)
        start = (page - 1) * per_page
        end = start + per_page
        
        return {
            'orders': user_orders[start:end],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page if total > 0 else 0
            }
        }