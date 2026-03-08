#!/bin/bash

# Script para verificar que el Dockerfile no copie archivos .env
# Uso: ./verify-docker-build.sh

echo "🔍 Verificando configuración de Docker..."
echo ""

# 1. Verificar Dockerfile
echo "1️⃣ Verificando Dockerfile..."
if grep -q "COPY \. \." Dockerfile; then
    echo "❌ ERROR: Dockerfile usa 'COPY . .' que copia TODO"
    echo "   Esto incluye archivos .env"
    echo "   Solución: Usa 'COPY src ./src' en su lugar"
else
    echo "✅ Dockerfile NO usa 'COPY . .'"
fi

if grep -q "COPY src ./src" Dockerfile; then
    echo "✅ Dockerfile copia solo src/ (correcto)"
else
    echo "⚠️  Dockerfile no copia src/ explícitamente"
fi
echo ""

# 2. Verificar .dockerignore
echo "2️⃣ Verificando .dockerignore..."
if grep -q "\.env\*" .dockerignore; then
    echo "✅ .dockerignore excluye .env* (correcto)"
else
    echo "❌ ERROR: .dockerignore NO excluye .env*"
    echo "   Solución: Agrega '.env*' a .dockerignore"
fi

if grep -q "\.env\.example" .dockerignore; then
    echo "✅ .dockerignore excluye .env.example (correcto)"
else
    echo "⚠️  .dockerignore no excluye .env.example explícitamente"
fi
echo ""

# 3. Verificar archivos .env en el repo
echo "3️⃣ Verificando archivos .env en git..."
ENV_IN_GIT=$(git ls-files | grep "\.env" | grep -v "\.env\..*\.example" | grep -v "\.dockerignore")
if [ -z "$ENV_IN_GIT" ]; then
    echo "✅ No hay archivos .env en git (correcto)"
else
    echo "❌ ERROR: Archivos .env encontrados en git:"
    echo "$ENV_IN_GIT"
    echo "   Solución: git rm --cached <archivo>"
fi
echo ""

# 4. Test de build local (opcional)
echo "4️⃣ ¿Quieres hacer un test de build local? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🔨 Construyendo imagen Docker..."
    docker build -t test-payment-api . 2>&1 | tee /tmp/docker-build.log
    
    echo ""
    echo "🔍 Verificando si .env fue copiado..."
    docker run --rm test-payment-api ls -la | grep ".env" && \
        echo "❌ ERROR: Archivos .env encontrados en la imagen" || \
        echo "✅ No hay archivos .env en la imagen (correcto)"
    
    echo ""
    echo "🧹 Limpiando imagen de prueba..."
    docker rmi test-payment-api
fi
echo ""

# Resumen
echo "📊 RESUMEN:"
echo "─────────────────────────────────────────────────────────"

ERRORS=0

if grep -q "COPY \. \." Dockerfile; then
    echo "❌ Dockerfile copia TODO (incluye .env)"
    ERRORS=$((ERRORS + 1))
fi

if ! grep -q "\.env\*" .dockerignore; then
    echo "❌ .dockerignore no excluye .env*"
    ERRORS=$((ERRORS + 1))
fi

if [ ! -z "$ENV_IN_GIT" ]; then
    echo "❌ Archivos .env en git"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "✅ Configuración correcta"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "1. Commit y push:"
    echo "   git add Dockerfile .dockerignore"
    echo "   git commit -m 'fix: prevent .env files from being copied to Docker'"
    echo "   git push origin develop"
    echo ""
    echo "2. Configura DATABASE_URL en Railway"
    echo "3. Espera el redeploy automático"
    echo "4. Verifica los logs"
else
    echo "❌ Hay $ERRORS error(es) que deben corregirse"
    echo ""
    echo "📖 Revisa SOLUCION_URGENTE.md para más detalles"
fi

echo ""
