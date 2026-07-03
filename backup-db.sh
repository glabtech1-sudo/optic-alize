#!/bin/bash

# =========================================================
# Optic Alizé SaaS - Planification des Sauvegardes SQL Rotatives
# =========================================================

set -e

# Configuration
BACKUP_DIR="./backups/db"
KEEP_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="opticalize_prod_${TIMESTAMP}.sql.gz"

# ANSI colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Lancement de la sauvegarde de la base de données PostgreSQL...${NC}"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Execute pg_dump inside container and compress output on host
if docker exec opticalize_db pg_dump -U admin_optic -d opticalize_prod | gzip > "${BACKUP_DIR}/${BACKUP_NAME}"; then
  echo -e "${GREEN}✓ Sauvegarde réussie : ${BACKUP_DIR}/${BACKUP_NAME}${NC}"
else
  echo "Erreur lors de la sauvegarde de la base de données !" >&2
  exit 1
fi

# Clean up backups older than X days
echo -e "${BLUE}Nettoyage des archives obsolètes (plus de ${KEEP_DAYS} jours)...${NC}"
find "${BACKUP_DIR}" -name "opticalize_prod_*.sql.gz" -mtime +${KEEP_DAYS} -delete

echo -e "${GREEN}✓ Nettoyage terminé.${NC}"
