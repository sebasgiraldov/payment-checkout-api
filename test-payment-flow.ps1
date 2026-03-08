# Complete Payment Flow Test Script

Write-Host "=== Payment Checkout API - Complete Flow Test ===" -ForegroundColor Green
Write-Host ""

# 1. Health Check
Write-Host "1. Health Check" -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -UseBasicParsing
Write-Host "   Status: $($health.status)" -ForegroundColor Green
Write-Host ""

# 2. Get Products
Write-Host "2. Get All Products" -ForegroundColor Cyan
$products = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products" -Method GET -UseBasicParsing
Write-Host "   Found $($products.data.Count) products" -ForegroundColor Green
$product = $products.data[0]
Write-Host "   Selected: $($product.name) - $($product.price) $($product.currency)" -ForegroundColor Yellow
Write-Host ""

# 3. Create Transaction
Write-Host "3. Create Transaction" -ForegroundColor Cyan
$transactionBody = @{
    productId = $product.id
    customerName = "Jane Smith"
    customerEmail = "jane.smith@example.com"
    customerPhone = "+573009876543"
    deliveryAddress = "Carrera 7 #32-16"
    deliveryCity = "Bogota"
    deliveryState = "Cundinamarca"
    deliveryCountry = "Colombia"
    deliveryPostalCode = "110231"
    baseFee = 5.00
    deliveryFee = 10.00
    currency = $product.currency
    paymentMethod = "CARD"
} | ConvertTo-Json

try {
    $transaction = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/transactions" -Method POST -Body $transactionBody -ContentType "application/json" -UseBasicParsing
    Write-Host "   Transaction ID: $($transaction.data.id)" -ForegroundColor Green
    Write-Host "   Status: $($transaction.data.status)" -ForegroundColor Green
    Write-Host "   Total: $($transaction.data.totalAmount) $($transaction.data.currency)" -ForegroundColor Green
    $transactionId = $transaction.data.id
    Write-Host ""
    
    # 4. Process Payment
    Write-Host "4. Process Payment (Wompi Sandbox)" -ForegroundColor Cyan
    $paymentBody = @{
        transactionId = $transactionId
        cardNumber = "4242424242424242"
        cardHolder = "Jane Smith"
        expiryMonth = "12"
        expiryYear = "2028"
        cvv = "123"
        customerEmail = "jane.smith@example.com"
    } | ConvertTo-Json
    
    try {
        $payment = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/payments/process" -Method POST -Body $paymentBody -ContentType "application/json" -UseBasicParsing
        Write-Host "   Payment Status: $($payment.data.status)" -ForegroundColor Green
        Write-Host "   Message: $($payment.data.message)" -ForegroundColor Green
        Write-Host "   External Payment ID: $($payment.data.externalPaymentId)" -ForegroundColor Green
    } catch {
        Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Error Message: $($errorDetails.message)" -ForegroundColor Red
        }
    }
    Write-Host ""
    
    # 5. Get Transaction Status
    Write-Host "5. Get Transaction Status" -ForegroundColor Cyan
    $updatedTransaction = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/transactions/$transactionId" -Method GET -UseBasicParsing
    Write-Host "   Transaction Status: $($updatedTransaction.data.status)" -ForegroundColor Green
    Write-Host "   External Payment ID: $($updatedTransaction.data.externalPaymentId)" -ForegroundColor Green
    
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
