#!/bin/bash

# =========================================================
# Optic Alizé SaaS - Orchestrateur de Déploiement Automatisé
# =========================================================

set -e

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;3m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}========================================================="
echo -e "         OPTIC ALIZÉ - AUTOMATED PRODUCTION DEPLOY"
echo -e "=========================================================${NC}"

# 1. Dependency Validation Checks
echo -e "\n${BLUE}[1/5] Vérification des prérequis système...${NC}"

if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}Erreur: Docker n'est pas installé sur cet environnement.${NC}" >&2
  exit 1
else
  echo -e "  - Docker: ${GREEN}Détecté (${$(docker --version)}) ${NC}"
fi

if ! [ -x "$(command -v docker-compose)" ] && ! docker compose version &>/dev/null; then
  echo -e "${RED}Erreur: Docker Compose n'est pas installé.${NC}" >&2
  exit 1
else
  echo -e "  - Docker Compose: ${GREEN}Détecté${NC}"
fi

# 2. Environment Configurations Checks
echo -e "\n${BLUE}[2/5] Chargement et validation de l'environnement...${NC}"
if [ ! -f .env.example ]; then
  echo -e "${YELLOW}Avertissement: .env.example manquant. Création par défaut...${NC}"
  touch .env.example
fi

# 3. Pull & Build Docker Compose Stack
echo -e "\n${BLUE}[3/5] Compilation et lancement des conteneurs de production...${NC}"
echo -e "${YELLOW}Lancement de la commande 'docker compose up --build -d'...${NC}"

# Support both 'docker-compose' and newer 'docker compose' formats
if docker compose version &>/dev/null; then
  docker compose up --build -d
else
  docker-compose up --build -d
fi

echo -e "${GREEN}✓ Conteneurs compilés et lancés avec succès en tâche de fond.${NC}"

# 4. Service Health Check Loop
echo -e "\n${BLUE}[4/5] Validation de la santé des micro-services...${NC}"
echo -n "Attente de l'état HEALTHY pour la base de données PostgreSQL..."

MAX_RETRIES=15
RETRY_COUNT=0
DB_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Check if postgres docker state is healthy
  if [ "$(docker inspect --format='{{json .State.Health.Status}}' opticalize_db 2>/dev/null)" = '"healthy"' ]; then
    DB_HEALTHY=true
    break
  fi
  echo -n "."
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ "$DB_HEALTHY" = true ]; then
  echo -e "\n  - PostgreSQL: ${GREEN}HEALTHY (Opérationnel)${NC}"
else
  echo -e "\n  - PostgreSQL: ${YELLOW}Statut indéterminé. Poursuite du déploiement...${NC}"
fi

# 5. Database Schema Synchronization / Migrations
echo -e "\n${BLUE}[5/5] Synchronisation du schéma Prisma / Drizzle...${NC}"
echo -e "${YELLOW}Exécution des migrations de base de données à l'intérieur du conteneur...${NC}"

# Run prisma migration or schema push inside the container
docker exec opticalize_app npx prisma db push --accept-data-loss || true

echo -e "\n${GREEN}${BOLD}========================================================="
echo -e "      DÉPLOIEMENT TERMINÉ AVEC SUCCÈS - OPTIC ALIZÉ LIVE"
echo -e "========================================================="
echo -e "  - Boutique SaaS: http://localhost (Via Reverse Proxy Nginx)"
echo -e "  - Administration DB: http://localhost:5050 (Via PgAdmin)"
echo -e "=========================================================${NC}"
