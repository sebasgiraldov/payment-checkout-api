#!/bin/bash

# Script para verificar la configuración de Railway
# Uso: ./check-railway-config.sh

echo "🔍 Verificando configuración para Railway..."
echo ""

# 1. Verificar que .env NO esté en git
echo "1️⃣ Verificando que .env NO esté en git..."
if git ls-files | grep -q "^.env$"; then
    echo "❌ ERROR: .env está siendo trackeado por git"
    echo "   Solución: git rm --cached .env && git commit -m 'chore: remove .env from git'"
else
    echo "✅ .env NO está en git (correcto)"
fi
echo ""

# 2. Verificar que .env esté en .gitignore
echo "2️⃣ Verificando .gitignore..."
if grep -q "^\.env$" .gitignore; then
    echo "✅ .env está en .gitignore (correcto)"
else
    echo "❌ ERROR: .env NO está en .gitignore"
    echo "   Solución: Agrega '.env' a .gitignore"
fi
echo ""

# 3. Verificar que .env esté en .dockerignore
echo "3️⃣ Verificando .dockerignore..."
if grep -q "\.env" .dockerignore; then
    echo "✅ .env está en .dockerignore (correcto)"
else
    echo "❌ ERROR: .env NO está en .dockerignore"
    echo "   Solución: Agrega '.env' a .dockerignore"
fi
echo ""

# 4. Verificar contenido de .env local
echo "4️⃣ Verificando .env local..."
if [ -f .env ]; then
    if grep -q "localhost" .env; then
        echo "⚠️  ADVERTENCIA: .env contiene 'localhost'"
        echo "   Esto es correcto para desarrollo local"
        echo "   Pero NO debe subirse a Railway"
    fi
    
    if grep -q "DATABASE_URL" .env; then
        echo "✅ .env tiene DATABASE_URL (para desarrollo local)"
    else
        echo "❌ .env NO tiene DATABASE_URL"
    fi
else
    echo "⚠️  .env no existe (esto está bien si ya lo eliminaste)"
fi
echo ""

# 5. Verificar Dockerfile
echo "5️⃣ Verificando Dockerfile..."
if grep -q "COPY --from=builder.*\.prisma" Dockerfile; then
    echo "✅ Dockerfile copia Prisma Client desde builder (correcto)"
else
    echo "❌ ERROR: Dockerfile no copia Prisma Client correctamente"
    echo "   Verifica que tenga: COPY --from=builder /app/node_modules/.prisma"
fi
echo ""

# 6. Verificar que no haya archivos .env en el repo
echo "6️⃣ Verificando archivos .env en el repositorio..."
ENV_FILES=$(git ls-files | grep "\.env" | grep -v "\.env\.example" | grep -v "\.env\.staging\.example" | grep -v "\.env\.production\.example")
if [ -z "$ENV_FILES" ]; then
    echo "✅ No hay archivos .env en el repositorio (correcto)"
else
    echo "❌ ERROR: Archivos .env encontrados en el repositorio:"
    echo "$ENV_FILES"
    echo "   Solución: git rm --cached <archivo> para cada uno"
fi
echo ""

# Resumen
echo "📊 RESUMEN:"
echo "─────────────────────────────────────────────────────────"

ERRORS=0
WARNINGS=0

if git ls-files | grep -q "^.env$"; then
    echo "❌ .env está en git - DEBE corregirse"
    ERRORS=$((ERRORS + 1))
fi

if ! grep -q "^\.env$" .gitignore; then
    echo "❌ .env NO está en .gitignore - DEBE corregirse"
    ERRORS=$((ERRORS + 1))
fi

if ! grep -q "\.env" .dockerignore; then
    echo "❌ .env NO está en .dockerignore - DEBE corregirse"
    ERRORS=$((ERRORS + 1))
fi

if ! grep -q "COPY --from=builder.*\.prisma" Dockerfile; then
    echo "❌ Dockerfile incorrecto - DEBE corregirse"
    ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "✅ Configuración correcta para Railway"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "1. Asegúrate de que DATABASE_URL esté configurado en Railway"
    echo "2. Commit y push: git push origin develop"
    echo "3. Espera el redeploy automático en Railway"
    echo "4. Verifica los logs en Railway dashboard"
else
    echo "❌ Hay $ERRORS error(es) que deben corregirse"
    echo ""
    echo "🔧 Revisa el archivo RAILWAY_DATABASE_SETUP.md para soluciones"
fi

echo ""
