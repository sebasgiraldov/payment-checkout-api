#!/bin/bash

# Script de verificación para deployment en Railway
# Uso: ./verify-railway.sh https://tu-app.up.railway.app

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la URL de tu app en Railway"
    echo "Uso: ./verify-railway.sh https://tu-app.up.railway.app"
    exit 1
fi

APP_URL=$1

echo "🔍 Verificando deployment en Railway..."
echo "URL: $APP_URL"
echo ""

# 1. Verificar Health Check
echo "1️⃣ Verificando Health Check..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$APP_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo "✅ Health check OK (200)"
    echo "$HEALTH_BODY" | jq '.' 2>/dev/null || echo "$HEALTH_BODY"
else
    echo "❌ Health check FAILED ($HEALTH_CODE)"
    echo "$HEALTH_BODY"
fi
echo ""

# 2. Verificar endpoint de productos
echo "2️⃣ Verificando endpoint de productos..."
PRODUCTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$APP_URL/api/v1/products")
PRODUCTS_CODE=$(echo "$PRODUCTS_RESPONSE" | tail -n1)
PRODUCTS_BODY=$(echo "$PRODUCTS_RESPONSE" | head -n-1)

if [ "$PRODUCTS_CODE" = "200" ]; then
    echo "✅ Productos endpoint OK (200)"
    PRODUCT_COUNT=$(echo "$PRODUCTS_BODY" | jq '.data | length' 2>/dev/null)
    if [ ! -z "$PRODUCT_COUNT" ]; then
        echo "📦 Productos encontrados: $PRODUCT_COUNT"
    fi
else
    echo "❌ Productos endpoint FAILED ($PRODUCTS_CODE)"
    echo "$PRODUCTS_BODY"
fi
echo ""

# 3. Resumen
echo "📊 RESUMEN:"
echo "─────────────────────────────────────"
if [ "$HEALTH_CODE" = "200" ] && [ "$PRODUCTS_CODE" = "200" ]; then
    echo "✅ Deployment EXITOSO"
    echo "✅ Base de datos conectada"
    echo "✅ API funcionando correctamente"
    echo ""
    echo "🎉 Tu aplicación está lista en Railway!"
else
    echo "❌ Hay problemas con el deployment"
    echo ""
    echo "🔧 Pasos para solucionar:"
    echo "1. Verifica los logs en Railway dashboard"
    echo "2. Confirma que DATABASE_URL esté configurado"
    echo "3. Verifica que las migraciones se hayan ejecutado"
    echo "4. Revisa el archivo RAILWAY_DEPLOYMENT_FIX.md"
fi
echo ""
