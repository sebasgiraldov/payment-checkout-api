# Dockerfile Fix - Explanation

## Issues Fixed

### 1. **Missing OpenSSL/libssl**
**Problem**: Prisma requires OpenSSL to function, but `node:18-alpine` doesn't include it by default.

**Solution**: Added `openssl` and `libc6-compat` packages in both builder and production stages:
```dockerfile
RUN apk add --no-cache openssl libc6-compat
```

### 2. **Prisma Engine Generation Permissions**
**Problem**: Prisma couldn't write to `/app/node_modules/@prisma/engines` due to permission issues.

**Solution**: 
- Generate Prisma Client in the production stage BEFORE switching to non-root user
- Run `npx prisma generate` while still as root user
- Then change ownership of all files to nodejs user
- Finally switch to non-root user

### 3. **Incorrect Prisma Client Copy**
**Problem**: Original Dockerfile tried to copy `.prisma` folder from builder, but this can cause version mismatches.

**Solution**: Generate Prisma Client fresh in the production stage instead of copying from builder. This ensures:
- Correct binary for the production environment
- No permission issues
- Proper engine detection

### 4. **File Ownership**
**Problem**: Files copied to production stage had root ownership, causing runtime permission issues.

**Solution**: Added explicit ownership change before switching users:
```dockerfile
RUN chown -R nodejs:nodejs /app
```

## Key Changes Summary

### Builder Stage:
1. ✅ Install OpenSSL and libc6-compat
2. ✅ Generate Prisma Client after npm ci
3. ✅ Build TypeScript application

### Production Stage:
1. ✅ Install OpenSSL and libc6-compat
2. ✅ Copy package files and prisma schema
3. ✅ Install production dependencies
4. ✅ Generate Prisma Client (while still root)
5. ✅ Copy built dist folder from builder
6. ✅ Change ownership of all files to nodejs user
7. ✅ Switch to non-root user
8. ✅ Run migrations and start app

## Security & Optimization

- ✅ Multi-stage build reduces final image size
- ✅ Non-root user (nodejs) for runtime security
- ✅ Only production dependencies in final image
- ✅ npm cache cleaned to reduce size
- ✅ Health check configured for container orchestration
- ✅ Proper file permissions for non-root execution

## Build & Deploy Commands

### Local Build:
```bash
docker build -t payment-checkout-api .
```

### Local Run:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e WOMPI_BASE_URL="https://sandbox.wompi.co/v1" \
  -e WOMPI_PUBLIC_KEY="your_key" \
  -e WOMPI_PRIVATE_KEY="your_key" \
  -e WOMPI_INTEGRITY_KEY="your_key" \
  payment-checkout-api
```

### Railway Deployment:
Railway will automatically detect the Dockerfile and build it. Ensure your environment variables are set in Railway dashboard.

## Verification

After deployment, verify:
1. Container starts successfully
2. Prisma migrations run: `npx prisma migrate deploy`
3. Health check responds: `curl http://localhost:3000/health`
4. Application logs show no Prisma errors

## Troubleshooting

If issues persist:

1. **Check OpenSSL version**:
   ```bash
   docker run --rm payment-checkout-api openssl version
   ```

2. **Verify Prisma Client**:
   ```bash
   docker run --rm payment-checkout-api ls -la node_modules/.prisma
   ```

3. **Check permissions**:
   ```bash
   docker run --rm payment-checkout-api ls -la /app
   ```

4. **View logs**:
   ```bash
   docker logs <container_id>
   ```
