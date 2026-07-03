#!/bin/bash

# =========================================================
# Optic Alizé SaaS - Arrêt Sécurisé de l'Environnement
# =========================================================

set -e

# ANSI Color Codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}Arrêt de la stack de production Optic Alizé...${NC}"

if docker compose version &>/dev/null; then
  docker compose down
else
  docker-compose down
fi

echo -e "${GREEN}✓ Tous les conteneurs et réseaux ont été arrêtés avec succès.${NC}"
