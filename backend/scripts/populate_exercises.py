#!/usr/bin/env python3
"""
Script para popular banco de exercícios.
Baseado na migration 16_create_workout_system.sql

Executa os INSERTs dos exercícios definidos na migration.
"""

import logging
import os
import sys

# Adicionar path do backend ao sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import supabase_client

# Configurar logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# 40+ Exercícios baseados na migration
EXERCISES_DATA = [
    # === PEITO ===
    {
        "name": "Supino Reto",
        "description": "Execução no banco horizontal com barra ou halteres",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["peitoral", "tríceps", "ombros"],
        "equipment": ["banco", "barra", "halteres"],
        "instructions": [
            "Deite-se no banco com os pés apoiados",
            "Segure a barra com pegada média",
            "Desça até quase tocar o peito",
            "Empurre com força para cima",
        ],
        "tips": ["Mantenha os ombros retraídos", "Não arquear a lombar excessivamente", "Controle o movimento"],
        "sets": 4,
        "reps": "8-12",
        "rest_seconds": 90,
    },
    {
        "name": "Supino Inclinado",
        "description": "Supino em banco inclinado a 30-45 graus",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["peitoral superior", "ombros"],
        "equipment": ["banco inclinado", "halteres"],
        "instructions": ["Ajuste o banco em 30-45 graus", "Segure os halteres", "Empurre para cima"],
        "tips": ["Foque no peitoral superior"],
        "sets": 3,
        "reps": "10-12",
        "rest_seconds": 60,
    },
    {
        "name": "Flexão de Braço",
        "description": "Exercício de peso corporal para peitoral",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["peitoral", "tríceps", "ombros", "core"],
        "equipment": ["peso corporal"],
        "instructions": [
            "Apoie mãos e pés no chão",
            "Mantenha corpo alinhado",
            "Desça até quase tocar o chão",
            "Empurre para cima",
        ],
        "tips": ["Mantenha o core contraído"],
        "sets": 3,
        "reps": "10-20",
        "rest_seconds": 60,
    },
    {
        "name": "Crucifixo",
        "description": "Exercício de isolamento para peitoral",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["peitoral"],
        "equipment": ["halteres", "banco"],
        "instructions": ["Deite-se no banco", "Abra os braços lateralmente", "Feche o movimento"],
        "tips": ["Controle a fase negativa"],
        "sets": 3,
        "reps": "12-15",
        "rest_seconds": 45,
    },
    # === COSTAS ===
    {
        "name": "Barra Fixa",
        "description": "Exercício completo para costas",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["costas", "bíceps"],
        "equipment": ["barra"],
        "instructions": [
            "Pegue a barra com pegada aberta",
            "Puxe o corpo até o queixo passar a barra",
            "Desça controladamente",
        ],
        "tips": ["Evite balancear"],
        "sets": 3,
        "reps": "6-12",
        "rest_seconds": 90,
    },
    {
        "name": "Remada Curvada",
        "description": "Exercício para desenvolvimento das costas",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["costas", "bíceps"],
        "equipment": ["barra", "halteres"],
        "instructions": ["Incline o tronco para frente", "Mantenha costas retas", "Puxe a barra até o abdômen"],
        "tips": ["Mantenha o core ativo"],
        "sets": 4,
        "reps": "8-10",
        "rest_seconds": 90,
    },
    {
        "name": "Puxada Frontal",
        "description": "Exercício em máquina para costas",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["costas", "bíceps"],
        "equipment": ["máquina"],
        "instructions": ["Sente-se na máquina", "Puxe a barra até o peito", "Controle a volta"],
        "tips": ["Varie a pegada"],
        "sets": 3,
        "reps": "10-12",
        "rest_seconds": 60,
    },
    {
        "name": "Remada Unilateral",
        "description": "Exercício unilateral para costas",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["costas"],
        "equipment": ["halteres", "banco"],
        "instructions": ["Apoie joelho e mão no banco", "Puxe o halter até o quadril", "Troque de lado"],
        "tips": ["Foque na contração"],
        "sets": 3,
        "reps": "10-12 cada lado",
        "rest_seconds": 60,
    },
    # === PERNAS ===
    {
        "name": "Agachamento",
        "description": "Rei dos exercícios para pernas",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["quadríceps", "glúteos", "posterior"],
        "equipment": ["peso corporal", "barra"],
        "instructions": [
            "Pés na largura dos ombros",
            "Desça até coxas paralelas ao chão",
            "Suba empurrando os calcanhares",
        ],
        "tips": ["Mantenha joelhos alinhados", "Coluna neutra"],
        "sets": 4,
        "reps": "10-15",
        "rest_seconds": 90,
    },
    {
        "name": "Agachamento com Salto",
        "description": "Exercício pliométrico",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["quadríceps", "glúteos"],
        "equipment": ["peso corporal"],
        "instructions": ["Agache profundamente", "Exploda para cima", "Aterre suavemente"],
        "tips": ["Controle o impacto"],
        "sets": 3,
        "reps": "8-12",
        "rest_seconds": 90,
    },
    {
        "name": "Leg Press",
        "description": "Exercício para pernas em máquina",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["quadríceps", "glúteos"],
        "equipment": ["máquina"],
        "instructions": ["Sente-se na máquina", "Coloque os pés na plataforma", "Empurre e retorne"],
        "tips": ["Não trave os joelhos"],
        "sets": 3,
        "reps": "12-15",
        "rest_seconds": 60,
    },
    {
        "name": "Afundo",
        "description": "Exercício unilateral para pernas",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["quadríceps", "glúteos"],
        "equipment": ["peso corporal", "halteres"],
        "instructions": ["Dê um passo grande à frente", "Desça a perna traseira", "Empurre para voltar"],
        "tips": ["Mantenha tronco ereto"],
        "sets": 3,
        "reps": "10-12 cada perna",
        "rest_seconds": 60,
    },
    {
        "name": "Elevação de Panturrilha",
        "description": "Exercício para panturrilhas",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["panturrilhas"],
        "equipment": ["peso corporal", "halteres"],
        "instructions": ["Fique na ponta dos pés", "Levante os calcanhares", "Desça controladamente"],
        "tips": ["Faça o movimento completo"],
        "sets": 3,
        "reps": "15-20",
        "rest_seconds": 30,
    },
    {
        "name": "Extensão de Pernas",
        "description": "Isolamento de quadríceps",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["quadríceps"],
        "equipment": ["máquina"],
        "instructions": ["Sente-se na máquina", "Estenda as pernas", "Controle a volta"],
        "tips": ["Não use impulso"],
        "sets": 3,
        "reps": "12-15",
        "rest_seconds": 45,
    },
    # === OMBROS ===
    {
        "name": "Desenvolvimento",
        "description": "Exercício para ombros com barra",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["ombros", "tríceps"],
        "equipment": ["barra", "halteres"],
        "instructions": ["Pegue a barra na altura dos ombros", "Empurre para cima", "Desça controladamente"],
        "tips": ["Mantenha core estável"],
        "sets": 3,
        "reps": "8-12",
        "rest_seconds": 90,
    },
    {
        "name": "Elevação Lateral",
        "description": "Isolamento de deltoides laterais",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["ombros"],
        "equipment": ["halteres"],
        "instructions": ["Segure halteres ao lado", "Levante até altura dos ombros", "Desça controladamente"],
        "tips": ["Não balance o corpo"],
        "sets": 3,
        "reps": "12-15",
        "rest_seconds": 45,
    },
    {
        "name": "Elevação Frontal",
        "description": "Isolamento de deltoides anteriores",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["ombros"],
        "equipment": ["halteres", "barra"],
        "instructions": ["Segure halteres à frente", "Levante até altura dos ombros", "Desça"],
        "tips": ["Mantenha tronco reto"],
        "sets": 3,
        "reps": "12-15",
        "rest_seconds": 45,
    },
    {
        "name": "Crucifixo Invertido",
        "description": "Exercício para deltoides posteriores",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["ombros", "costas"],
        "equipment": ["halteres"],
        "instructions": ["Incline o tronco", "Abra os braços", "Contraia os ombros"],
        "tips": ["Controle o movimento"],
        "sets": 3,
        "reps": "12-15",
        "rest_seconds": 45,
    },
    # === BRAÇOS ===
    {
        "name": "Rosca Direta",
        "description": "Exercício clássico para bíceps",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["bíceps"],
        "equipment": ["halteres", "barra"],
        "instructions": ["Segure os halteres", "Flexione os cotovelos", "Contraia o bíceps", "Desça controladamente"],
        "tips": ["Não balance o corpo"],
        "sets": 3,
        "reps": "10-12",
        "rest_seconds": 60,
    },
    {
        "name": "Tríceps Pulley",
        "description": "Exercício para tríceps em máquina",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["tríceps"],
        "equipment": ["máquina"],
        "instructions": ["Segure a barra", "Estenda os braços", "Mantenha cotovelos fixos"],
        "tips": ["Não balance o corpo"],
        "sets": 3,
        "reps": "12-15",
        "rest_seconds": 60,
    },
    {
        "name": "Tríceps Testa",
        "description": "Exercício deitado para tríceps",
        "category": "strength",
        "difficulty": "intermediate",
        "muscle_groups": ["tríceps"],
        "equipment": ["halteres", "barra"],
        "instructions": ["Deite-se no banco", "Flexione cotovelos", "Estenda os braços"],
        "tips": ["Mantenha cotovelos fixos"],
        "sets": 3,
        "reps": "10-12",
        "rest_seconds": 60,
    },
    {
        "name": "Rosca Martelo",
        "description": "Exercício para bíceps e antebraços",
        "category": "strength",
        "difficulty": "beginner",
        "muscle_groups": ["bíceps", "antebraços"],
        "equipment": ["halteres"],
        "instructions": ["Segure halteres com pegada neutra", "Flexione os cotovelos"],
        "tips": ["Mantenha pulso neutro"],
        "sets": 3,
        "reps": "10-12",
        "rest_seconds": 60,
    },
    # === CORE ===
    {
        "name": "Abdominal Reto",
        "description": "Exercício básico para abdominais",
        "category": "core",
        "difficulty": "beginner",
        "muscle_groups": ["abdominais"],
        "equipment": ["peso corporal"],
        "instructions": ["Deite-se de costas", "Flexione os joelhos", "Levante os ombros", "Contraia o abdômen"],
        "tips": ["Não puxe o pescoço"],
        "sets": 3,
        "reps": "15-20",
        "rest_seconds": 30,
    },
    {
        "name": "Prancha",
        "description": "Exercício isométrico para core",
        "category": "core",
        "difficulty": "beginner",
        "muscle_groups": ["core", "ombros"],
        "equipment": ["peso corporal"],
        "instructions": ["Apoie antebraços e pés", "Mantenha corpo alinhado", "Segure a posição"],
        "tips": ["Não deixe quadril cair"],
        "sets": 3,
        "reps": "30-60 segundos",
        "rest_seconds": 60,
    },
    {
        "name": "Abdominal Bicicleta",
        "description": "Exercício rotacional para core",
        "category": "core",
        "difficulty": "intermediate",
        "muscle_groups": ["abdominais", "oblíquos"],
        "equipment": ["peso corporal"],
        "instructions": ["Deite-se de costas", "Levante os ombros", "Faça movimento de pedalar"],
        "tips": ["Controle o movimento"],
        "sets": 3,
        "reps": "15-20 cada lado",
        "rest_seconds": 45,
    },
    {
        "name": "Russian Twist",
        "description": "Exercício rotacional com peso",
        "category": "core",
        "difficulty": "intermediate",
        "muscle_groups": ["oblíquos", "abdominais"],
        "equipment": ["peso corporal", "peso"],
        "instructions": ["Sente-se com joelhos flexionados", "Gire o tronco", "Toque o chão ao lado"],
        "tips": ["Mantenha costas retas"],
        "sets": 3,
        "reps": "20 cada lado",
        "rest_seconds": 45,
    },
    {
        "name": "Elevação de Pernas",
        "description": "Exercício avançado para core",
        "category": "core",
        "difficulty": "advanced",
        "muscle_groups": ["abdominais inferiores"],
        "equipment": ["peso corporal"],
        "instructions": ["Deite-se de costas", "Levante as pernas retas", "Desça controladamente"],
        "tips": ["Mantenha costas no chão"],
        "sets": 3,
        "reps": "10-15",
        "rest_seconds": 60,
    },
    {
        "name": "Prancha Lateral",
        "description": "Exercício para oblíquos",
        "category": "core",
        "difficulty": "intermediate",
        "muscle_groups": ["oblíquos", "core"],
        "equipment": ["peso corporal"],
        "instructions": ["Deite-se de lado", "Apoie antebraço e pés", "Mantenha corpo alinhado"],
        "tips": ["Não deixe quadril cair"],
        "sets": 3,
        "reps": "30-45 segundos cada lado",
        "rest_seconds": 45,
    },
    # === CARDIO ===
    {
        "name": "Corrida",
        "description": "Exercício cardiovascular",
        "category": "cardio",
        "difficulty": "beginner",
        "muscle_groups": ["pernas", "cardiovascular"],
        "equipment": ["nenhum"],
        "instructions": ["Aqueça 5 minutos", "Mantenha ritmo constante", "Resfrie 5 minutos"],
        "tips": ["Use tênis adequado"],
        "sets": 1,
        "reps": "20-30 minutos",
        "rest_seconds": 0,
    },
    {
        "name": "Ciclismo",
        "description": "Exercício cardiovascular de baixo impacto",
        "category": "cardio",
        "difficulty": "beginner",
        "muscle_groups": ["pernas", "cardiovascular"],
        "equipment": ["bicicleta"],
        "instructions": ["Ajuste a altura do selim", "Mantenha cadência constante"],
        "tips": ["Use capacete"],
        "sets": 1,
        "reps": "30-45 minutos",
        "rest_seconds": 0,
    },
    {
        "name": "Burpee",
        "description": "Exercício completo e intenso",
        "category": "hiit",
        "difficulty": "intermediate",
        "muscle_groups": ["pernas", "peitoral", "ombros", "core"],
        "equipment": ["peso corporal"],
        "instructions": ["Agache", "Pule para trás em prancha", "Faça flexão", "Pule para frente", "Salte"],
        "tips": ["Mantenha bom ritmo"],
        "sets": 3,
        "reps": "10-15",
        "rest_seconds": 60,
    },
    {
        "name": "Jumping Jacks",
        "description": "Aquecimento e cardio",
        "category": "cardio",
        "difficulty": "beginner",
        "muscle_groups": ["pernas", "ombros", "cardiovascular"],
        "equipment": ["peso corporal"],
        "instructions": ["Salte abrindo pernas e braços", "Volte à posição inicial"],
        "tips": ["Mantenha ritmo constante"],
        "sets": 3,
        "reps": "30-50",
        "rest_seconds": 45,
    },
    {
        "name": "Mountain Climber",
        "description": "Exercício de alta intensidade",
        "category": "hiit",
        "difficulty": "intermediate",
        "muscle_groups": ["core", "pernas", "ombros"],
        "equipment": ["peso corporal"],
        "instructions": ["Posição de flexão", "Alternando pernas", "Mantenha core firme"],
        "tips": ["Mantenha ritmo"],
        "sets": 3,
        "reps": "20-30 cada perna",
        "rest_seconds": 45,
    },
    {
        "name": "Escalador",
        "description": "Variação do mountain climber",
        "category": "hiit",
        "difficulty": "intermediate",
        "muscle_groups": ["core", "pernas"],
        "equipment": ["peso corporal"],
        "instructions": ["Posição de prancha", "Traga joelho ao peito", "Alternando pernas"],
        "tips": ["Controle a velocidade"],
        "sets": 3,
        "reps": "20 cada perna",
        "rest_seconds": 45,
    },
    # === FLEXIBILIDADE ===
    {
        "name": "Alongamento de Panturrilha",
        "description": "Alongamento para panturrilhas",
        "category": "flexibility",
        "difficulty": "beginner",
        "muscle_groups": ["panturrilhas"],
        "equipment": ["nenhum"],
        "instructions": ["Mantenha perna esticada", "Puxe o pé em direção ao corpo"],
        "tips": ["Sinta o alongamento"],
        "sets": 3,
        "reps": "30 segundos cada",
        "rest_seconds": 30,
    },
    {
        "name": "Alongamento de Quadríceps",
        "description": "Alongamento para parte frontal da coxa",
        "category": "flexibility",
        "difficulty": "beginner",
        "muscle_groups": ["quadríceps"],
        "equipment": ["nenhum"],
        "instructions": ["Segure o pé atrás", "Puxe em direção ao glúteo"],
        "tips": ["Mantenha joelhos juntos"],
        "sets": 3,
        "reps": "30 segundos cada",
        "rest_seconds": 30,
    },
    {
        "name": "Alongamento de Posterior",
        "description": "Alongamento para parte posterior da coxa",
        "category": "flexibility",
        "difficulty": "beginner",
        "muscle_groups": ["posterior"],
        "equipment": ["nenhum"],
        "instructions": ["Sente-se no chão", "Alcance os pés", "Mantenha pernas esticadas"],
        "tips": ["Não force demais"],
        "sets": 3,
        "reps": "30-60 segundos",
        "rest_seconds": 30,
    },
    {
        "name": "Alongamento de Peitoral",
        "description": "Alongamento para peitoral",
        "category": "flexibility",
        "difficulty": "beginner",
        "muscle_groups": ["peitoral", "ombros"],
        "equipment": ["parede"],
        "instructions": ["Encoste braço na parede", "Gire o corpo", "Sinta o alongamento"],
        "tips": ["Mantenha ombro relaxado"],
        "sets": 3,
        "reps": "30 segundos cada",
        "rest_seconds": 30,
    },
    # === YOGA/PILATES ===
    {
        "name": "Postura do Guerreiro",
        "description": "Postura de yoga para pernas",
        "category": "yoga",
        "difficulty": "beginner",
        "muscle_groups": ["pernas", "core"],
        "equipment": ["nenhum"],
        "instructions": ["Dê passo largo", "Gire pé da frente", "Flexione joelho", "Levante braços"],
        "tips": ["Mantenha joelho alinhado"],
        "sets": 3,
        "reps": "30-60 segundos cada lado",
        "rest_seconds": 30,
    },
    {
        "name": "Postura da Criança",
        "description": "Postura de relaxamento",
        "category": "yoga",
        "difficulty": "beginner",
        "muscle_groups": ["costas", "quadris"],
        "equipment": ["nenhum"],
        "instructions": ["Sente-se nos calcanhares", "Incline tronco à frente", "Estenda braços"],
        "tips": ["Relaxe completamente"],
        "sets": 3,
        "reps": "60 segundos",
        "rest_seconds": 30,
    },
    {
        "name": "Ponte",
        "description": "Exercício de glúteos e core",
        "category": "pilates",
        "difficulty": "beginner",
        "muscle_groups": ["glúteos", "core", "posterior"],
        "equipment": ["nenhum"],
        "instructions": ["Deite-se de costas", "Levante quadril", "Contraia glúteos"],
        "tips": ["Mantenha core ativo"],
        "sets": 3,
        "reps": "12-15",
        "rest_seconds": 45,
    },
    {
        "name": "Postura do Cachorro Olhando para Baixo",
        "description": "Postura clássica de yoga",
        "category": "yoga",
        "difficulty": "beginner",
        "muscle_groups": ["costas", "ombros", "posterior"],
        "equipment": ["nenhum"],
        "instructions": ["Posição de flexão invertida", "Forme triângulo", "Mantenha pernas retas"],
        "tips": ["Distribua peso igualmente"],
        "sets": 3,
        "reps": "30-60 segundos",
        "rest_seconds": 30,
    },
]


def populate_exercises():
    """Popula banco com exercícios padrão"""
    inserted = 0
    skipped = 0
    errors = 0

    logger.info(f"Iniciando população de {len(EXERCISES_DATA)} exercícios...")

    for exercise in EXERCISES_DATA:
        try:
            # Verificar se já existe
            existing = supabase_client.table("exercises").select("id").eq("name", exercise["name"]).execute()

            if existing.data and len(existing.data) > 0:
                logger.info(f"⏭️  Exercício '{exercise['name']}' já existe, pulando...")
                skipped += 1
                continue

            # Inserir
            result = supabase_client.table("exercises").insert(exercise).execute()

            if result.data and len(result.data) > 0:
                inserted += 1
                logger.info(f"✅ Exercício '{exercise['name']}' inserido (ID: {result.data[0]['id']})")
            else:
                errors += 1
                logger.error(f"❌ Erro ao inserir '{exercise['name']}': Sem dados retornados")

        except Exception as e:
            errors += 1
            logger.error(f"❌ Erro ao inserir '{exercise['name']}': {str(e)}")

    logger.info(f"\n{'='*50}")
    logger.info(f"=== RESUMO ===")
    logger.info(f"Inseridos: {inserted}")
    logger.info(f"Pulados: {skipped}")
    logger.info(f"Erros: {errors}")
    logger.info(f"Total processado: {len(EXERCISES_DATA)}")
    logger.info(f"{'='*50}")

    return {"inserted": inserted, "skipped": skipped, "errors": errors, "total": len(EXERCISES_DATA)}


if __name__ == "__main__":
    try:
        result = populate_exercises()

        if result["errors"] > 0:
            sys.exit(1)
        else:
            logger.info("\n✅ População concluída com sucesso!")
            sys.exit(0)

    except Exception as e:
        logger.error(f"❌ Erro fatal: {str(e)}")
        sys.exit(1)
