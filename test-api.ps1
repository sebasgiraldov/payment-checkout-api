# Test API Script

Write-Host "Testing Payment Checkout API" -ForegroundColor Green
Write-Host ""

# 1. Test Health Endpoint
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -UseBasicParsing
Write-Host "   Status: $($health.status)" -ForegroundColor Green
Write-Host ""

# 2. Get All Products
Write-Host "2. Getting All Products..." -ForegroundColor Cyan
$products = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products" -Method GET -UseBasicParsing
Write-Host "   Found $($products.data.Count) products" -ForegroundColor Green
$firstProduct = $products.data[0]
Write-Host "   First Product: $($firstProduct.name) - Price: $($firstProduct.price) $($firstProduct.currency)" -ForegroundColor Green
Write-Host ""

# 3. Create Transaction
Write-Host "3. Creating Transaction..." -ForegroundColor Cyan
$transactionBody = @{
    productId = $firstProduct.id
    customerName = "John Doe"
    customerEmail = "john.doe@example.com"
    customerPhone = "+573001234567"
    deliveryAddress = "Calle 123 #45-67"
    deliveryCity = "Bogota"
    deliveryState = "Cundinamarca"
    deliveryCountry = "Colombia"
    deliveryPostalCode = "110111"
    baseFee = 5.00
    deliveryFee = 10.00
    currency = $firstProduct.currency
    paymentMethod = "CARD"
} | ConvertTo-Json

try {
    $transaction = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/transactions" -Method POST -Body $transactionBody -ContentType "application/json" -UseBasicParsing
    Write-Host "   Transaction ID: $($transaction.data.id)" -ForegroundColor Green
    Write-Host "   Status: $($transaction.data.status)" -ForegroundColor Green
    Write-Host "   Total Amount: $($transaction.data.totalAmount) $($transaction.data.currency)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
