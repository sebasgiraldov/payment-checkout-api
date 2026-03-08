# Design Document: Payment Checkout API

## Overview

The Payment Checkout API is a production-grade backend system that orchestrates the complete payment flow for e-commerce transactions. Built with NestJS and TypeScript, it implements Hexagonal Architecture with Clean Architecture principles and Domain Driven Design patterns. The system manages product inventory, processes customer payments through a third-party payment gateway, handles delivery information, and maintains transactional consistency across all operations. It uses Railway Oriented Programming (Result/Either pattern) for explicit error handling and ensures idempotent payment processing with state recovery capabilities.

The architecture separates concerns into distinct layers: Domain (entities, value objects, business rules), Application (use cases, DTOs), Infrastructure (database, payment gateway adapters), and Interfaces (HTTP controllers). This separation enables testability, maintainability, and flexibility to swap implementations without affecting business logic.

## Architecture

### System Context Diagram

```mermaid
graph TB
    Client[Web Client/Frontend]
    API[Payment Checkout API]
    DB[(PostgreSQL Database)]
    Gateway[Payment Gateway<br/>Wompi Sandbox]
    
    Client -->|HTTP/REST| API
    API -->|Prisma ORM| DB
    API -->|HTTPS| Gateway
    
    style API fill:#4A90E2
    style DB fill:#50C878
    style Gateway fill:#FFB347
```

### High-Level Architecture Layers

```mermaid
graph TD
    subgraph "Interfaces Layer"
        Controllers[HTTP Controllers]
        DTOs[Request/Response DTOs]
    end
    
    subgraph "Application Layer"
        UseCases[Use Cases]
        AppDTOs[Application DTOs]
    end
    
    subgraph "Domain Layer"
        Entities[Domain Entities]
        ValueObjects[Value Objects]
        Ports[Repository Ports]
        DomainServices[Domain Services]
        BusinessRules[Business Rules]
    end
    
    subgraph "Infrastructure Layer"
        Adapters[Repository Adapters]
        PaymentAdapter[Payment Gateway Adapter]
        DatabaseConfig[Database Configuration]
    end
    
    Controllers --> UseCases
    UseCases --> DomainServices
    UseCases --> Ports
    DomainServices --> Entities
    DomainServices --> ValueObjects
    Ports -.implements.- Adapters
    Adapters --> DatabaseConfig
    UseCases --> PaymentAdapter
    
    style Controllers fill:#E8F4F8
    style UseCases fill:#D4E6F1
    style Entities fill:#A9DFBF
    style Adapters fill:#F9E79F
```

### Component Architecture

```mermaid
graph LR
    subgraph "Product Context"
        PC[Product Controller]
        PUC[Product Use Cases]
        PE[Product Entity]
        PR[Product Repository]
    end
    
    subgraph "Transaction Context"
        TC[Transaction Controller]
        TUC[Transaction Use Cases]
        TE[Transaction Entity]
        TR[Transaction Repository]
    end
    
    subgraph "Payment Context"
        PayC[Payment Controller]
        PayUC[Payment Use Cases]
        PayAdapter[Payment Gateway Adapter]
    end
    
    subgraph "Customer Context"
        CE[Customer Entity]
        CR[Customer Repository]
    end
    
    subgraph "Delivery Context"
        DE[Delivery Entity]
        DR[Delivery Repository]
    end
    
    PC --> PUC --> PE
    PUC --> PR
    TC --> TUC --> TE
    TUC --> TR
    PayC --> PayUC --> PayAdapter
    TUC --> CR
    TUC --> DR
    TUC --> PR
    TUC --> PayAdapter
    
    TE -.references.- PE
    TE -.references.- CE
    TE -.references.- DE
```

## Main Payment Processing Workflow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant UseCase
    participant Domain
    participant PaymentAdapter
    participant Repository
    participant Database
    participant PaymentGateway
    
    Client->>Controller: POST /payments/process
    Controller->>Controller: Validate DTO
    Controller->>UseCase: processPayment(paymentData)
    
    UseCase->>Domain: Create Transaction Entity (PENDING)
    UseCase->>Repository: saveTransaction(transaction)
    Repository->>Database: INSERT transaction
    Database-->>Repository: transaction saved
    Repository-->>UseCase: Result<Transaction>
    
    UseCase->>PaymentAdapter: processPayment(paymentDetails)
    PaymentAdapter->>PaymentGateway: POST /transactions
    PaymentGateway-->>PaymentAdapter: payment response
    PaymentAdapter-->>UseCase: Result<PaymentResult>
    
    alt Payment Approved
        UseCase->>Domain: Update Transaction (APPROVED)
        UseCase->>Domain: Assign Product to Customer
        UseCase->>Domain: Decrease Product Stock
        UseCase->>Repository: updateTransaction(transaction)
        UseCase->>Repository: updateProductStock(productId, newStock)
        Repository->>Database: UPDATE in transaction
        Database-->>Repository: success
        Repository-->>UseCase: Result<Success>
        UseCase-->>Controller: Result<PaymentSuccess>
        Controller-->>Client: 200 OK {status: APPROVED}
    else Payment Declined/Failed
        UseCase->>Domain: Update Transaction (DECLINED/FAILED)
        UseCase->>Repository: updateTransaction(transaction)
        Repository->>Database: UPDATE transaction
        Database-->>Repository: success
        Repository-->>UseCase: Result<Transaction>
        UseCase-->>Controller: Result<PaymentFailure>
        Controller-->>Client: 200 OK {status: DECLINED}
    end
```

## Components and Interfaces

### Component 1: Product Management

**Purpose**: Manages product catalog, inventory, and stock operations

**Domain Entity**:
```typescript
// domain/entities/product.entity.ts
export class Product {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    private _price: Money,
    private _stock: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(props: ProductProps): Result<Product, DomainError> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError('Product name is required'));
    }
    if (props.stock < 0) {
      return Result.fail(new ValidationError('Stock cannot be negative'));
    }
    return Result.ok(new Product(
      props.id || generateId(),
      props.name,
      props.description,
      props.price,
      props.stock,
      props.createdAt || new Date(),
      props.updatedAt || new Date()
    ));
  }

  get price(): Money {
    return this._price;
  }

  get stock(): number {
    return this._stock;
  }

  hasStock(quantity: number): boolean {
    return this._stock >= quantity;
  }

  decreaseStock(quantity: number): Result<void, DomainError> {
    if (quantity <= 0) {
      return Result.fail(new ValidationError('Quantity must be positive'));
    }
    if (!this.hasStock(quantity)) {
      return Result.fail(new InsufficientStockError(this.id, this._stock, quantity));
    }
    this._stock -= quantity;
    return Result.ok(undefined);
  }

  increaseStock(quantity: number): Result<void, DomainError> {
    if (quantity <= 0) {
      return Result.fail(new ValidationError('Quantity must be positive'));
    }
    this._stock += quantity;
    return Result.ok(undefined);
  }
}
```

**Repository Port**:
```typescript
// domain/repositories/product.repository.ts
export interface IProductRepository {
  findById(id: string): Promise<Result<Product, RepositoryError>>;
  findAll(): Promise<Result<Product[], RepositoryError>>;
  save(product: Product): Promise<Result<Product, RepositoryError>>;
  update(product: Product): Promise<Result<Product, RepositoryError>>;
  updateStock(productId: string, newStock: number): Promise<Result<void, RepositoryError>>;
}
```

**Use Case**:
```typescript
// application/use-cases/get-product-by-id.use-case.ts
export class GetProductByIdUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(productId: string): Promise<Result<ProductDto, ApplicationError>> {
    const productResult = await this.productRepository.findById(productId);
    
    if (productResult.isFailure) {
      return Result.fail(new ProductNotFoundError(productId));
    }
    
    const product = productResult.value;
    return Result.ok(ProductDto.fromEntity(product));
  }
}
```

**Controller**:
```typescript
// interfaces/controllers/product.controller.ts
@Controller('products')
export class ProductController {
  constructor(
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly getAllProductsUseCase: GetAllProductsUseCase
  ) {}

  @Get()
  async getAllProducts(): Promise<ProductDto[]> {
    const result = await this.getAllProductsUseCase.execute();
    
    if (result.isFailure) {
      throw new InternalServerErrorException(result.error.message);
    }
    
    return result.value;
  }

  @Get(':id')
  async getProductById(@Param('id') id: string): Promise<ProductDto> {
    const result = await this.getProductByIdUseCase.execute(id);
    
    if (result.isFailure) {
      throw new NotFoundException(result.error.message);
    }
    
    return result.value;
  }
}
```

**Responsibilities**:
- Validate product data integrity
- Enforce stock constraints
- Provide stock availability checks
- Manage product lifecycle

### Component 2: Transaction Management

**Purpose**: Orchestrates payment transactions with state management and consistency guarantees

**Domain Entity**:
```typescript
// domain/entities/transaction.entity.ts
export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  FAILED = 'FAILED'
}

export class Transaction {
  private constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly customerId: string,
    public readonly deliveryId: string,
    private _amount: Money,
    private _baseFee: Money,
    private _deliveryFee: Money,
    private _totalAmount: Money,
    private _status: TransactionStatus,
    public readonly paymentMethod: string,
    private _externalPaymentId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(props: TransactionProps): Result<Transaction, DomainError> {
    const totalAmount = props.amount.add(props.baseFee).add(props.deliveryFee);
    
    if (!props.productId || !props.customerId || !props.deliveryId) {
      return Result.fail(new ValidationError('Missing required references'));
    }
    
    return Result.ok(new Transaction(
      props.id || generateId(),
      props.productId,
      props.customerId,
      props.deliveryId,
      props.amount,
      props.baseFee,
      props.deliveryFee,
      totalAmount,
      TransactionStatus.PENDING,
      props.paymentMethod,
      null,
      props.createdAt || new Date(),
      props.updatedAt || new Date()
    ));
  }

  get status(): TransactionStatus {
    return this._status;
  }

  get totalAmount(): Money {
    return this._totalAmount;
  }

  get externalPaymentId(): string | null {
    return this._externalPaymentId;
  }

  approve(externalPaymentId: string): Result<void, DomainError> {
    if (this._status !== TransactionStatus.PENDING) {
      return Result.fail(new InvalidStateTransitionError(this._status, TransactionStatus.APPROVED));
    }
    this._status = TransactionStatus.APPROVED;
    this._externalPaymentId = externalPaymentId;
    return Result.ok(undefined);
  }

  decline(externalPaymentId: string): Result<void, DomainError> {
    if (this._status !== TransactionStatus.PENDING) {
      return Result.fail(new InvalidStateTransitionError(this._status, TransactionStatus.DECLINED));
    }
    this._status = TransactionStatus.DECLINED;
    this._externalPaymentId = externalPaymentId;
    return Result.ok(undefined);
  }

  fail(reason: string): Result<void, DomainError> {
    if (this._status !== TransactionStatus.PENDING) {
      return Result.fail(new InvalidStateTransitionError(this._status, TransactionStatus.FAILED));
    }
    this._status = TransactionStatus.FAILED;
    return Result.ok(undefined);
  }

  isPending(): boolean {
    return this._status === TransactionStatus.PENDING;
  }

  isApproved(): boolean {
    return this._status === TransactionStatus.APPROVED;
  }
}
```

**Repository Port**:
```typescript
// domain/repositories/transaction.repository.ts
export interface ITransactionRepository {
  findById(id: string): Promise<Result<Transaction, RepositoryError>>;
  save(transaction: Transaction): Promise<Result<Transaction, RepositoryError>>;
  update(transaction: Transaction): Promise<Result<Transaction, RepositoryError>>;
  findByExternalPaymentId(externalId: string): Promise<Result<Transaction | null, RepositoryError>>;
}
```

**Use Case**:
```typescript
// application/use-cases/create-transaction.use-case.ts
export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly productRepository: IProductRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly deliveryRepository: IDeliveryRepository
  ) {}

  async execute(dto: CreateTransactionDto): Promise<Result<TransactionDto, ApplicationError>> {
    // Validate product exists and has stock
    const productResult = await this.productRepository.findById(dto.productId);
    if (productResult.isFailure) {
      return Result.fail(new ProductNotFoundError(dto.productId));
    }
    
    const product = productResult.value;
    if (!product.hasStock(1)) {
      return Result.fail(new InsufficientStockError(product.id, product.stock, 1));
    }
    
    // Create or get customer
    const customerResult = await this.customerRepository.findOrCreate({
      name: dto.customerName,
      email: dto.customerEmail,
      phone: dto.customerPhone
    });
    if (customerResult.isFailure) {
      return Result.fail(new CustomerCreationError(customerResult.error.message));
    }
    
    // Create delivery
    const deliveryResult = await this.deliveryRepository.create({
      customerId: customerResult.value.id,
      address: dto.deliveryAddress,
      city: dto.deliveryCity,
      state: dto.deliveryState,
      country: dto.deliveryCountry,
      postalCode: dto.deliveryPostalCode,
      deliveryFee: dto.deliveryFee
    });
    if (deliveryResult.isFailure) {
      return Result.fail(new DeliveryCreationError(deliveryResult.error.message));
    }
    
    // Create transaction
    const transactionResult = Transaction.create({
      productId: product.id,
      customerId: customerResult.value.id,
      deliveryId: deliveryResult.value.id,
      amount: product.price,
      baseFee: dto.baseFee,
      deliveryFee: dto.deliveryFee,
      paymentMethod: dto.paymentMethod
    });
    
    if (transactionResult.isFailure) {
      return Result.fail(new TransactionCreationError(transactionResult.error.message));
    }
    
    // Save transaction
    const savedResult = await this.transactionRepository.save(transactionResult.value);
    if (savedResult.isFailure) {
      return Result.fail(new TransactionCreationError(savedResult.error.message));
    }
    
    return Result.ok(TransactionDto.fromEntity(savedResult.value));
  }
}
```

**Responsibilities**:
- Manage transaction lifecycle and state transitions
- Enforce valid state transitions (PENDING → APPROVED/DECLINED/FAILED)
- Calculate total amounts including fees
- Link transactions to products, customers, and deliveries
- Provide idempotency through external payment ID tracking

### Component 3: Payment Processing

**Purpose**: Integrates with external payment gateway and handles payment operations

**Payment Gateway Adapter Interface**:
```typescript
// domain/services/payment-gateway.interface.ts
export interface IPaymentGateway {
  processPayment(request: PaymentRequest): Promise<Result<PaymentResponse, PaymentError>>;
  getPaymentStatus(transactionId: string): Promise<Result<PaymentStatus, PaymentError>>;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  customerEmail: string;
  reference: string;
  idempotencyKey: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'APPROVED' | 'DECLINED' | 'PENDING';
  authorizationCode?: string;
  message: string;
}
```

**Payment Gateway Adapter Implementation**:
```typescript
// infrastructure/payment/wompi-payment.adapter.ts
export class WompiPaymentAdapter implements IPaymentGateway {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  constructor(config: WompiConfig) {
    this.baseUrl = config.baseUrl;
    this.publicKey = config.publicKey;
    this.privateKey = config.privateKey;
    this.integrityKey = config.integrityKey;
  }

  async processPayment(request: PaymentRequest): Promise<Result<PaymentResponse, PaymentError>> {
    try {
      // Step 1: Tokenize card
      const tokenResult = await this.tokenizeCard({
        number: request.cardNumber,
        cvc: request.cvv,
        exp_month: request.expiryMonth,
        exp_year: request.expiryYear,
        card_holder: request.cardHolder
      });

      if (tokenResult.isFailure) {
        return Result.fail(tokenResult.error);
      }

      // Step 2: Create payment source
      const sourceResult = await this.createPaymentSource({
        type: 'CARD',
        token: tokenResult.value.id,
        customer_email: request.customerEmail,
        acceptance_token: await this.getAcceptanceToken()
      });

      if (sourceResult.isFailure) {
        return Result.fail(sourceResult.error);
      }

      // Step 3: Create transaction
      const transactionResult = await this.createTransaction({
        amount_in_cents: request.amount * 100,
        currency: request.currency,
        customer_email: request.customerEmail,
        payment_method: {
          type: 'CARD',
          installments: 1
        },
        payment_source_id: sourceResult.value.id,
        reference: request.reference,
        redirect_url: null
      }, request.idempotencyKey);

      if (transactionResult.isFailure) {
        return Result.fail(transactionResult.error);
      }

      return Result.ok({
        transactionId: transactionResult.value.id,
        status: this.mapStatus(transactionResult.value.status),
        authorizationCode: transactionResult.value.authorization_code,
        message: transactionResult.value.status_message
      });
    } catch (error) {
      return Result.fail(new PaymentGatewayError(error.message));
    }
  }

  async getPaymentStatus(transactionId: string): Promise<Result<PaymentStatus, PaymentError>> {
    try {
      const response = await this.httpClient.get(`${this.baseUrl}/transactions/${transactionId}`);
      return Result.ok({
        status: this.mapStatus(response.data.status),
        message: response.data.status_message
      });
    } catch (error) {
      return Result.fail(new PaymentGatewayError(error.message));
    }
  }

  private mapStatus(wompiStatus: string): 'APPROVED' | 'DECLINED' | 'PENDING' {
    const statusMap = {
      'APPROVED': 'APPROVED',
      'DECLINED': 'DECLINED',
      'PENDING': 'PENDING',
      'VOIDED': 'DECLINED',
      'ERROR': 'DECLINED'
    };
    return statusMap[wompiStatus] || 'DECLINED';
  }
}
```

**Use Case**:
```typescript
// application/use-cases/process-payment.use-case.ts
export class ProcessPaymentUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly productRepository: IProductRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly databaseTransaction: IDatabaseTransaction
  ) {}

  async execute(dto: ProcessPaymentDto): Promise<Result<PaymentResultDto, ApplicationError>> {
    // Start database transaction for atomicity
    return await this.databaseTransaction.execute(async () => {
      // 1. Get transaction
      const transactionResult = await this.transactionRepository.findById(dto.transactionId);
      if (transactionResult.isFailure) {
        return Result.fail(new TransactionNotFoundError(dto.transactionId));
      }
      
      const transaction = transactionResult.value;
      
      // 2. Check idempotency - if already processed, return existing result
      if (!transaction.isPending()) {
        return Result.ok(PaymentResultDto.fromEntity(transaction));
      }
      
      // 3. Get product and verify stock
      const productResult = await this.productRepository.findById(transaction.productId);
      if (productResult.isFailure) {
        return Result.fail(new ProductNotFoundError(transaction.productId));
      }
      
      const product = productResult.value;
      if (!product.hasStock(1)) {
        const failResult = transaction.fail('Insufficient stock');
        if (failResult.isFailure) {
          return Result.fail(new TransactionUpdateError(failResult.error.message));
        }
        await this.transactionRepository.update(transaction);
        return Result.fail(new InsufficientStockError(product.id, product.stock, 1));
      }
      
      // 4. Process payment with gateway
      const paymentRequest: PaymentRequest = {
        amount: transaction.totalAmount.amount,
        currency: transaction.totalAmount.currency,
        cardNumber: dto.cardNumber,
        cardHolder: dto.cardHolder,
        expiryMonth: dto.expiryMonth,
        expiryYear: dto.expiryYear,
        cvv: dto.cvv,
        customerEmail: dto.customerEmail,
        reference: transaction.id,
        idempotencyKey: dto.idempotencyKey || transaction.id
      };
      
      const paymentResult = await this.paymentGateway.processPayment(paymentRequest);
      
      if (paymentResult.isFailure) {
        const failResult = transaction.fail(paymentResult.error.message);
        if (failResult.isFailure) {
          return Result.fail(new TransactionUpdateError(failResult.error.message));
        }
        await this.transactionRepository.update(transaction);
        return Result.fail(new PaymentProcessingError(paymentResult.error.message));
      }
      
      const paymentResponse = paymentResult.value;
      
      // 5. Update transaction based on payment result
      if (paymentResponse.status === 'APPROVED') {
        const approveResult = transaction.approve(paymentResponse.transactionId);
        if (approveResult.isFailure) {
          return Result.fail(new TransactionUpdateError(approveResult.error.message));
        }
        
        // 6. Decrease product stock
        const stockResult = product.decreaseStock(1);
        if (stockResult.isFailure) {
          return Result.fail(new StockUpdateError(stockResult.error.message));
        }
        
        await this.transactionRepository.update(transaction);
        await this.productRepository.update(product);
        
        return Result.ok(PaymentResultDto.fromEntity(transaction));
      } else {
        const declineResult = transaction.decline(paymentResponse.transactionId);
        if (declineResult.isFailure) {
          return Result.fail(new TransactionUpdateError(declineResult.error.message));
        }
        
        await this.transactionRepository.update(transaction);
        return Result.ok(PaymentResultDto.fromEntity(transaction));
      }
    });
  }
}
```

**Controller**:
```typescript
// interfaces/controllers/payment.controller.ts
@Controller('payments')
export class PaymentController {
  constructor(private readonly processPaymentUseCase: ProcessPaymentUseCase) {}

  @Post('process')
  @HttpCode(200)
  async processPayment(@Body() dto: ProcessPaymentRequestDto): Promise<PaymentResultDto> {
    const result = await this.processPaymentUseCase.execute(dto);
    
    if (result.isFailure) {
      const error = result.error;
      if (error instanceof TransactionNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof InsufficientStockError) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }
    
    return result.value;
  }
}
```

**Responsibilities**:
- Tokenize credit card data securely
- Create payment sources with gateway
- Process payment transactions
- Handle idempotency with idempotency keys
- Map gateway responses to domain status
- Provide payment status polling

### Component 4: Customer Management

**Purpose**: Manages customer information and ensures data consistency

**Domain Entity**:
```typescript
// domain/entities/customer.entity.ts
export class Customer {
  private constructor(
    public readonly id: string,
    private _name: string,
    private _email: Email,
    private _phone: Phone,
    public readonly createdAt: Date
  ) {}

  static create(props: CustomerProps): Result<Customer, DomainError> {
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error);
    }
    
    const phoneResult = Phone.create(props.phone);
    if (phoneResult.isFailure) {
      return Result.fail(phoneResult.error);
    }
    
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new ValidationError('Customer name is required'));
    }
    
    return Result.ok(new Customer(
      props.id || generateId(),
      props.name,
      emailResult.value,
      phoneResult.value,
      props.createdAt || new Date()
    ));
  }

  get name(): string {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }

  get phone(): Phone {
    return this._phone;
  }
}
```

**Repository Port**:
```typescript
// domain/repositories/customer.repository.ts
export interface ICustomerRepository {
  findById(id: string): Promise<Result<Customer, RepositoryError>>;
  findByEmail(email: string): Promise<Result<Customer | null, RepositoryError>>;
  save(customer: Customer): Promise<Result<Customer, RepositoryError>>;
  findOrCreate(props: CustomerProps): Promise<Result<Customer, RepositoryError>>;
}
```

**Responsibilities**:
- Validate customer data (email, phone)
- Ensure unique customer identification
- Support find-or-create pattern for checkout flow

### Component 5: Delivery Management

**Purpose**: Manages delivery addresses and calculates delivery fees

**Domain Entity**:
```typescript
// domain/entities/delivery.entity.ts
export class Delivery {
  private constructor(
    public readonly id: string,
    public readonly customerId: string,
    private _address: Address,
    private _deliveryFee: Money,
    public readonly createdAt: Date
  ) {}

  static create(props: DeliveryProps): Result<Delivery, DomainError> {
    const addressResult = Address.create({
      street: props.address,
      city: props.city,
      state: props.state,
      country: props.country,
      postalCode: props.postalCode
    });
    
    if (addressResult.isFailure) {
      return Result.fail(addressResult.error);
    }
    
    if (!props.customerId) {
      return Result.fail(new ValidationError('Customer ID is required'));
    }
    
    return Result.ok(new Delivery(
      props.id || generateId(),
      props.customerId,
      addressResult.value,
      props.deliveryFee,
      props.createdAt || new Date()
    ));
  }

  get address(): Address {
    return this._address;
  }

  get deliveryFee(): Money {
    return this._deliveryFee;
  }
}
```

**Repository Port**:
```typescript
// domain/repositories/delivery.repository.ts
export interface IDeliveryRepository {
  findById(id: string): Promise<Result<Delivery, RepositoryError>>;
  save(delivery: Delivery): Promise<Result<Delivery, RepositoryError>>;
  findByCustomerId(customerId: string): Promise<Result<Delivery[], RepositoryError>>;
}
```

**Responsibilities**:
- Validate delivery addresses
- Store delivery fee information
- Link deliveries to customers

## Data Models

### Value Objects

#### Money Value Object
```typescript
// domain/value-objects/money.value-object.ts
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}

  static create(amount: number, currency: string): Result<Money, DomainError> {
    if (amount < 0) {
      return Result.fail(new ValidationError('Amount cannot be negative'));
    }
    if (!currency || currency.length !== 3) {
      return Result.fail(new ValidationError('Invalid currency code'));
    }
    return Result.ok(new Money(amount, currency.toUpperCase()));
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

#### Email Value Object
```typescript
// domain/value-objects/email.value-object.ts
export class Email {
  private constructor(public readonly value: string) {}

  static create(email: string): Result<Email, DomainError> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Result.fail(new ValidationError('Invalid email format'));
    }
    return Result.ok(new Email(email.toLowerCase()));
  }
}
```

#### Phone Value Object
```typescript
// domain/value-objects/phone.value-object.ts
export class Phone {
  private constructor(public readonly value: string) {}

  static create(phone: string): Result<Phone, DomainError> {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      return Result.fail(new ValidationError('Invalid phone number'));
    }
    return Result.ok(new Phone(cleaned));
  }
}
```

#### Address Value Object
```typescript
// domain/value-objects/address.value-object.ts
export class Address {
  private constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly state: string,
    public readonly country: string,
    public readonly postalCode: string
  ) {}

  static create(props: AddressProps): Result<Address, DomainError> {
    if (!props.street || props.street.trim().length === 0) {
      return Result.fail(new ValidationError('Street is required'));
    }
    if (!props.city || props.city.trim().length === 0) {
      return Result.fail(new ValidationError('City is required'));
    }
    if (!props.country || props.country.trim().length === 0) {
      return Result.fail(new ValidationError('Country is required'));
    }
    return Result.ok(new Address(
      props.street,
      props.city,
      props.state,
      props.country,
      props.postalCode
    ));
  }

  toString(): string {
    return `${this.street}, ${this.city}, ${this.state}, ${this.country} ${this.postalCode}`;
  }
}
```

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma
model Product {
  id          String        @id @default(uuid())
  name        String
  description String
  price       Decimal       @db.Decimal(10, 2)
  currency    String        @db.VarChar(3)
  stock       Int
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  transactions Transaction[]

  @@map("products")
}

model Customer {
  id        String        @id @default(uuid())
  name      String
  email     String        @unique
  phone     String
  createdAt DateTime      @default(now()) @map("created_at")
  transactions Transaction[]
  deliveries Delivery[]

  @@map("customers")
}

model Delivery {
  id          String        @id @default(uuid())
  customerId  String        @map("customer_id")
  address     String
  city        String
  state       String?
  country     String
  postalCode  String        @map("postal_code")
  deliveryFee Decimal       @db.Decimal(10, 2) @map("delivery_fee")
  createdAt   DateTime      @default(now()) @map("created_at")
  customer    Customer      @relation(fields: [customerId], references: [id])
  transaction Transaction?

  @@map("deliveries")
}

model Transaction {
  id                String            @id @default(uuid())
  productId         String            @map("product_id")
  customerId        String            @map("customer_id")
  deliveryId        String            @unique @map("delivery_id")
  amount            Decimal           @db.Decimal(10, 2)
  baseFee           Decimal           @db.Decimal(10, 2) @map("base_fee")
  deliveryFee       Decimal           @db.Decimal(10, 2) @map("delivery_fee")
  totalAmount       Decimal           @db.Decimal(10, 2) @map("total_amount")
  status            TransactionStatus
  paymentMethod     String            @map("payment_method")
  externalPaymentId String?           @unique @map("external_payment_id")
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")
  product           Product           @relation(fields: [productId], references: [id])
  customer          Customer          @relation(fields: [customerId], references: [id])
  delivery          Delivery          @relation(fields: [deliveryId], references: [id])

  @@index([productId])
  @@index([customerId])
  @@index([status])
  @@index([externalPaymentId])
  @@map("transactions")
}

enum TransactionStatus {
  PENDING
  APPROVED
  DECLINED
  FAILED
}
```

**Validation Rules**:

- Product: name non-empty, price >= 0, stock >= 0, currency 3-letter code
- Customer: name non-empty, email valid format and unique, phone 10-15 digits
- Delivery: address non-empty, city non-empty, country non-empty, deliveryFee >= 0
- Transaction: all amounts >= 0, totalAmount = amount + baseFee + deliveryFee, valid status transitions

## Key Functions with Formal Specifications

### Function 1: Transaction.create()

```typescript
static create(props: TransactionProps): Result<Transaction, DomainError>
```

**Preconditions:**
- `props.productId` is non-null and non-empty UUID
- `props.customerId` is non-null and non-empty UUID
- `props.deliveryId` is non-null and non-empty UUID
- `props.amount` is valid Money object with amount >= 0
- `props.baseFee` is valid Money object with amount >= 0
- `props.deliveryFee` is valid Money object with amount >= 0
- All Money objects have same currency

**Postconditions:**
- Returns Result.ok(Transaction) with status = PENDING
- `transaction.totalAmount = props.amount + props.baseFee + props.deliveryFee`
- `transaction.externalPaymentId = null`
- `transaction.createdAt` and `transaction.updatedAt` are set to current timestamp
- OR returns Result.fail(ValidationError) if preconditions violated

**Loop Invariants:** N/A (no loops)

### Function 2: Product.decreaseStock()

```typescript
decreaseStock(quantity: number): Result<void, DomainError>
```

**Preconditions:**
- `quantity > 0`
- `this._stock >= quantity` (sufficient stock available)

**Postconditions:**
- If successful: `this._stock = old(this._stock) - quantity` and returns Result.ok(undefined)
- If quantity <= 0: returns Result.fail(ValidationError)
- If insufficient stock: returns Result.fail(InsufficientStockError) and stock unchanged
- No other properties of Product are modified

**Loop Invariants:** N/A (no loops)

### Function 3: Transaction.approve()

```typescript
approve(externalPaymentId: string): Result<void, DomainError>
```

**Preconditions:**
- `this._status === TransactionStatus.PENDING`
- `externalPaymentId` is non-null and non-empty string

**Postconditions:**
- If successful: `this._status = TransactionStatus.APPROVED` and `this._externalPaymentId = externalPaymentId` and returns Result.ok(undefined)
- If status not PENDING: returns Result.fail(InvalidStateTransitionError) and no state change
- State transition is atomic (both status and externalPaymentId updated together)

**Loop Invariants:** N/A (no loops)

### Function 4: ProcessPaymentUseCase.execute()

```typescript
async execute(dto: ProcessPaymentDto): Promise<Result<PaymentResultDto, ApplicationError>>
```

**Preconditions:**
- `dto.transactionId` exists in database
- Transaction with `dto.transactionId` has status PENDING (for first call)
- Product referenced by transaction exists and has stock >= 1
- `dto.cardNumber`, `dto.cvv`, `dto.expiryMonth`, `dto.expiryYear`, `dto.cardHolder` are valid
- Database transaction mechanism is available

**Postconditions:**
- If payment approved: Transaction status = APPROVED, product stock decreased by 1, externalPaymentId set, returns Result.ok(PaymentResultDto)
- If payment declined: Transaction status = DECLINED, product stock unchanged, externalPaymentId set, returns Result.ok(PaymentResultDto)
- If payment fails: Transaction status = FAILED, product stock unchanged, returns Result.fail(PaymentProcessingError)
- If insufficient stock: Transaction status = FAILED, returns Result.fail(InsufficientStockError)
- If transaction not found: returns Result.fail(TransactionNotFoundError)
- Idempotency: Multiple calls with same transactionId return same result without re-processing
- All database operations are atomic (wrapped in database transaction)

**Loop Invariants:** N/A (no loops, but database transaction ensures atomicity)

## Algorithmic Pseudocode

### Main Payment Processing Algorithm

```typescript
ALGORITHM processPayment(dto: ProcessPaymentDto)
INPUT: dto containing transactionId, card details, customer email, idempotency key
OUTPUT: Result<PaymentResultDto, ApplicationError>

BEGIN
  // Precondition checks
  ASSERT dto.transactionId is valid UUID
  ASSERT dto.cardNumber matches credit card format
  ASSERT dto.cvv is 3-4 digits
  
  // Start atomic database transaction
  BEGIN_DATABASE_TRANSACTION
  
  TRY
    // Step 1: Retrieve transaction
    transaction ← transactionRepository.findById(dto.transactionId)
    IF transaction is NULL THEN
      ROLLBACK_DATABASE_TRANSACTION
      RETURN Result.fail(TransactionNotFoundError)
    END IF
    
    // Step 2: Check idempotency
    IF transaction.status ≠ PENDING THEN
      COMMIT_DATABASE_TRANSACTION
      RETURN Result.ok(PaymentResultDto.fromEntity(transaction))
    END IF
    
    // Step 3: Verify product and stock
    product ← productRepository.findById(transaction.productId)
    IF product is NULL THEN
      transaction.status ← FAILED
      transactionRepository.update(transaction)
      ROLLBACK_DATABASE_TRANSACTION
      RETURN Result.fail(ProductNotFoundError)
    END IF
    
    IF product.stock < 1 THEN
      transaction.status ← FAILED
      transactionRepository.update(transaction)
      COMMIT_DATABASE_TRANSACTION
      RETURN Result.fail(InsufficientStockError)
    END IF
    
    // Step 4: Process payment with gateway
    paymentRequest ← {
      amount: transaction.totalAmount.amount,
      currency: transaction.totalAmount.currency,
      cardNumber: dto.cardNumber,
      cardHolder: dto.cardHolder,
      expiryMonth: dto.expiryMonth,
      expiryYear: dto.expiryYear,
      cvv: dto.cvv,
      customerEmail: dto.customerEmail,
      reference: transaction.id,
      idempotencyKey: dto.idempotencyKey OR transaction.id
    }
    
    paymentResult ← paymentGateway.processPayment(paymentRequest)
    
    IF paymentResult is FAILURE THEN
      transaction.status ← FAILED
      transactionRepository.update(transaction)
      ROLLBACK_DATABASE_TRANSACTION
      RETURN Result.fail(PaymentProcessingError)
    END IF
    
    // Step 5: Update transaction and stock based on payment result
    IF paymentResult.status = 'APPROVED' THEN
      transaction.status ← APPROVED
      transaction.externalPaymentId ← paymentResult.transactionId
      product.stock ← product.stock - 1
      
      transactionRepository.update(transaction)
      productRepository.update(product)
      
      COMMIT_DATABASE_TRANSACTION
      RETURN Result.ok(PaymentResultDto.fromEntity(transaction))
    ELSE
      transaction.status ← DECLINED
      transaction.externalPaymentId ← paymentResult.transactionId
      
      transactionRepository.update(transaction)
      
      COMMIT_DATABASE_TRANSACTION
      RETURN Result.ok(PaymentResultDto.fromEntity(transaction))
    END IF
    
  CATCH error
    ROLLBACK_DATABASE_TRANSACTION
    RETURN Result.fail(ApplicationError(error.message))
  END TRY
END
```

**Preconditions:**
- dto contains valid transaction ID and payment details
- Database connection is available
- Payment gateway is accessible

**Postconditions:**
- Transaction status updated to APPROVED, DECLINED, or FAILED
- If APPROVED: product stock decreased by 1
- All database changes are atomic (committed or rolled back together)
- Idempotent: same input produces same result

**Loop Invariants:** N/A (sequential algorithm, no loops)

### Stock Management Algorithm

```typescript
ALGORITHM decreaseProductStock(productId: string, quantity: number)
INPUT: productId (UUID), quantity (positive integer)
OUTPUT: Result<void, DomainError>

BEGIN
  ASSERT quantity > 0
  
  product ← productRepository.findById(productId)
  
  IF product is NULL THEN
    RETURN Result.fail(ProductNotFoundError)
  END IF
  
  IF product.stock < quantity THEN
    RETURN Result.fail(InsufficientStockError(productId, product.stock, quantity))
  END IF
  
  product.stock ← product.stock - quantity
  
  updateResult ← productRepository.update(product)
  
  IF updateResult is FAILURE THEN
    RETURN Result.fail(RepositoryError)
  END IF
  
  RETURN Result.ok(undefined)
END
```

**Preconditions:**
- quantity > 0
- productId is valid UUID
- Product exists in database

**Postconditions:**
- If successful: product.stock = old(product.stock) - quantity
- If insufficient stock: product.stock unchanged, returns error
- Database updated atomically

**Loop Invariants:** N/A

### Transaction State Transition Algorithm

```typescript
ALGORITHM transitionTransactionState(transaction: Transaction, newStatus: TransactionStatus, externalId: string)
INPUT: transaction entity, target status, external payment ID
OUTPUT: Result<void, DomainError>

BEGIN
  currentStatus ← transaction.status
  
  // Validate state transition
  IF currentStatus ≠ PENDING THEN
    RETURN Result.fail(InvalidStateTransitionError(currentStatus, newStatus))
  END IF
  
  // Valid transitions from PENDING
  validTransitions ← {APPROVED, DECLINED, FAILED}
  
  IF newStatus NOT IN validTransitions THEN
    RETURN Result.fail(InvalidStateTransitionError(currentStatus, newStatus))
  END IF
  
  // Apply transition
  IF newStatus = APPROVED THEN
    transaction.status ← APPROVED
    transaction.externalPaymentId ← externalId
  ELSE IF newStatus = DECLINED THEN
    transaction.status ← DECLINED
    transaction.externalPaymentId ← externalId
  ELSE IF newStatus = FAILED THEN
    transaction.status ← FAILED
  END IF
  
  RETURN Result.ok(undefined)
END
```

**Preconditions:**
- transaction is in PENDING state
- newStatus is one of {APPROVED, DECLINED, FAILED}
- externalId is non-null for APPROVED and DECLINED

**Postconditions:**
- transaction.status updated to newStatus
- If APPROVED or DECLINED: transaction.externalPaymentId set
- State transition is valid and atomic

**Loop Invariants:** N/A

## Example Usage

### Example 1: Complete Payment Flow

```typescript
// Step 1: Get product information
const productResult = await getProductByIdUseCase.execute('product-uuid');
if (productResult.isFailure) {
  throw new Error('Product not found');
}
const product = productResult.value;

// Step 2: Create transaction
const createTransactionDto: CreateTransactionDto = {
  productId: product.id,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+1234567890',
  deliveryAddress: '123 Main St',
  deliveryCity: 'New York',
  deliveryState: 'NY',
  deliveryCountry: 'USA',
  deliveryPostalCode: '10001',
  baseFee: Money.create(5, 'USD').value,
  deliveryFee: Money.create(10, 'USD').value,
  paymentMethod: 'CARD'
};

const transactionResult = await createTransactionUseCase.execute(createTransactionDto);
if (transactionResult.isFailure) {
  throw new Error('Transaction creation failed');
}
const transaction = transactionResult.value;

// Step 3: Process payment
const processPaymentDto: ProcessPaymentDto = {
  transactionId: transaction.id,
  cardNumber: '4242424242424242',
  cardHolder: 'JOHN DOE',
  expiryMonth: '12',
  expiryYear: '2025',
  cvv: '123',
  customerEmail: 'john@example.com',
  idempotencyKey: `payment-${transaction.id}-${Date.now()}`
};

const paymentResult = await processPaymentUseCase.execute(processPaymentDto);
if (paymentResult.isFailure) {
  console.error('Payment failed:', paymentResult.error.message);
  // Handle payment failure
} else {
  const payment = paymentResult.value;
  if (payment.status === 'APPROVED') {
    console.log('Payment approved!', payment);
    // Redirect to success page
  } else {
    console.log('Payment declined:', payment.message);
    // Show decline message
  }
}
```

### Example 2: Idempotent Payment Retry

```typescript
// First attempt
const idempotencyKey = `payment-${transactionId}-attempt-1`;
const firstAttempt = await processPaymentUseCase.execute({
  transactionId,
  ...paymentDetails,
  idempotencyKey
});

// Network error occurs, retry with same key
const retryAttempt = await processPaymentUseCase.execute({
  transactionId,
  ...paymentDetails,
  idempotencyKey // Same key ensures idempotency
});

// Both attempts return the same result
assert(firstAttempt.value.status === retryAttempt.value.status);
```

### Example 3: Stock Validation

```typescript
// Check stock before creating transaction
const product = await productRepository.findById(productId);
if (product.isFailure || !product.value.hasStock(1)) {
  return Result.fail(new InsufficientStockError(productId, product.value.stock, 1));
}

// Proceed with transaction creation
const transaction = await createTransactionUseCase.execute(dto);
```

### Example 4: Error Handling with Railway Oriented Programming

```typescript
const result = await processPaymentUseCase.execute(dto);

result
  .map(payment => {
    // Success path
    logger.info('Payment processed successfully', { transactionId: payment.id });
    return payment;
  })
  .mapError(error => {
    // Error path
    if (error instanceof InsufficientStockError) {
      logger.warn('Insufficient stock', { productId: error.productId });
      return new UserFacingError('Product out of stock');
    }
    if (error instanceof PaymentProcessingError) {
      logger.error('Payment gateway error', { message: error.message });
      return new UserFacingError('Payment processing failed');
    }
    return error;
  });
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Transaction State Consistency

For any transaction, the status must be one of the valid states, and the external payment ID must be set if and only if the transaction is approved or declined.

**Validates: Requirements 5.1, 5.8, 6.7, 8.1, 8.2, 8.3**

### Property 2: Stock Non-Negativity

For any product at any time, the stock level must be non-negative.

**Validates: Requirements 1.4, 2.1, 2.4**

### Property 3: Transaction Amount Correctness

For any transaction, the total amount must equal the sum of product amount, base fee, and delivery fee, and all components must be non-negative.

**Validates: Requirements 4.4, 5.2, 10.1, 10.2**

### Property 4: Payment Idempotency

For any two payment requests with the same idempotency key, processing them must produce identical results.

**Validates: Requirements 7.1, 7.2, 7.4**

### Property 5: Stock Decrease Only on Approval

For any transaction, product stock decreases by the purchased quantity if and only if the payment is approved. Stock remains unchanged for declined or failed payments.

**Validates: Requirements 2.2, 2.3, 6.4, 6.5**

### Property 6: Valid State Transitions

For any transaction, only valid state transitions are allowed: PENDING can transition to APPROVED, DECLINED, or FAILED, and terminal states (APPROVED, DECLINED, FAILED) cannot transition to any other state.

**Validates: Requirements 8.2, 8.3, 8.4**

### Property 7: Atomicity of Payment Processing

For any payment operation, either all database updates succeed and are committed together, or all fail and are rolled back together, ensuring no partial updates.

**Validates: Requirements 6.8, 6.9, 11.6, 18.1, 18.2**

### Property 8: Unique External Payment IDs

For any two distinct transactions with non-null external payment IDs, the external payment IDs must be different.

**Validates: Requirements 18.4**

### Property 9: Product Retrieval Completeness

For any product that exists in the system, retrieving it by ID returns all required fields: id, name, description, price, currency, and stock.

**Validates: Requirements 1.1, 1.2, 1.5**

### Property 10: Transaction Retrieval Completeness

For any transaction that exists in the system, retrieving it returns all required fields including status, amounts, payment method, timestamps, and related product, customer, and delivery information.

**Validates: Requirements 9.1, 9.2, 9.4, 10.5**

### Property 11: Email Validation

For any customer creation or update, the email address must conform to standard email format (contains @ symbol and valid domain).

**Validates: Requirements 3.2, 12.3**

### Property 12: Phone Validation

For any customer creation or update, the phone number must contain only digits and be between 10 and 15 characters long.

**Validates: Requirements 3.3, 12.4**

### Property 13: Customer Find-or-Create Idempotency

For any email address, creating a customer with that email multiple times returns the same customer record.

**Validates: Requirements 3.4**

### Property 14: Delivery Information Validation

For any delivery creation, the address, city, and country fields must be non-empty strings.

**Validates: Requirements 4.2**

### Property 15: Delivery-Customer Relationship

For any delivery, it must be linked to exactly one customer via the customer ID foreign key.

**Validates: Requirements 4.3, 18.3**

### Property 16: Transaction Creation Validation

For any transaction creation attempt, the system must verify the product exists and has sufficient stock before creating the transaction with PENDING status.

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 17: Unique Transaction Identifiers

For any two distinct transactions, their identifiers must be different.

**Validates: Requirements 5.6**

### Property 18: Payment Method Preservation

For any transaction, the payment method specified during creation is preserved and returned in all subsequent retrievals.

**Validates: Requirements 5.7**

### Property 19: Transaction Status on Payment Failure

For any payment processing that fails due to system error, the transaction status must be updated to FAILED.

**Validates: Requirements 6.6**

### Property 20: Currency Consistency

For any transaction, all monetary amounts (product amount, base fee, delivery fee, total amount) must use the same currency.

**Validates: Requirements 10.3**

### Property 21: Amount Precision

For any transaction, all monetary amounts must be stored and retrieved with exactly two decimal places of precision.

**Validates: Requirements 10.4**

### Property 22: Input Validation Before Processing

For any request, all DTO validation must complete successfully before any business logic processing occurs.

**Validates: Requirements 12.1, 12.2**

### Property 23: Currency Code Validation

For any monetary amount, the currency code must be exactly 3 uppercase letters.

**Validates: Requirements 12.5**

### Property 24: UUID Format Validation

For any identifier field that uses UUIDs, the value must conform to standard UUID format.

**Validates: Requirements 12.6**

### Property 25: Validation Error Detail

For any validation failure, the error response must include detailed messages describing which fields failed validation and why.

**Validates: Requirements 12.7**

### Property 26: Payment Gateway Status Mapping

For any payment gateway response status, it must be correctly mapped to one of the internal transaction statuses (APPROVED, DECLINED, or FAILED).

**Validates: Requirements 13.3**

### Property 27: Input Sanitization

For any user input, malicious content (SQL injection, XSS attempts) must be rejected or sanitized before processing.

**Validates: Requirements 14.4**

### Property 28: Rate Limiting

For any client making requests to payment endpoints, the number of requests within a time window must not exceed the configured rate limit.

**Validates: Requirements 14.6**

### Property 29: Payment Attempt Logging

For any payment processing attempt, a log entry with a correlation ID must be created.

**Validates: Requirements 17.1**

### Property 30: Error Logging Completeness

For any error that occurs, a log entry must be created that includes full context and stack trace.

**Validates: Requirements 11.5, 17.2**

### Property 31: Foreign Key Constraint Enforcement

For any transaction, the product ID, customer ID, and delivery ID must reference existing records in their respective tables.

**Validates: Requirements 18.3**

### Property 32: Unique Email Constraint

For any two distinct customers, their email addresses must be different.

**Validates: Requirements 18.4**

## Error Handling

### Error Scenario 1: Insufficient Stock

**Condition**: User attempts to purchase product with stock = 0

**Response**: 
- Transaction created with status PENDING
- Payment processing detects insufficient stock
- Transaction status updated to FAILED
- Product stock remains unchanged

**Recovery**: 
- Return error to client with message "Product out of stock"
- Client displays error and suggests alternative products
- User can retry with different product

### Error Scenario 2: Payment Gateway Timeout

**Condition**: Payment gateway does not respond within timeout period

**Response**:
- Transaction remains in PENDING state
- Error logged with correlation ID
- Database transaction rolled back
- Return error to client

**Recovery**:
- Client can retry payment with same idempotency key
- System checks transaction status before re-processing
- If already processed, return existing result
- If still pending, retry payment gateway call

### Error Scenario 3: Payment Declined by Gateway

**Condition**: Payment gateway declines transaction (insufficient funds, invalid card, etc.)

**Response**:
- Transaction status updated to DECLINED
- External payment ID stored for reference
- Product stock remains unchanged
- Return result to client with decline reason

**Recovery**:
- Client displays decline message to user
- User can retry with different payment method
- New transaction created for retry attempt

### Error Scenario 4: Database Connection Failure

**Condition**: Database becomes unavailable during transaction

**Response**:
- All pending database operations rolled back
- Error logged with full context
- Return 503 Service Unavailable to client

**Recovery**:
- Client implements exponential backoff retry
- System health check detects database issue
- Operations resume when database reconnects
- No data corruption due to transaction rollback

### Error Scenario 5: Invalid Input Data

**Condition**: Client sends malformed request (invalid email, negative amount, etc.)

**Response**:
- DTO validation fails at controller layer
- Return 400 Bad Request with validation errors
- No database operations performed

**Recovery**:
- Client displays validation errors to user
- User corrects input and resubmits
- Validation prevents invalid data from reaching domain layer

### Error Scenario 6: Duplicate External Payment ID

**Condition**: Payment gateway returns payment ID that already exists

**Response**:
- Database constraint violation detected
- Transaction rolled back
- Error logged as critical issue

**Recovery**:
- System alerts monitoring team
- Manual investigation required
- Likely indicates payment gateway issue or replay attack

## Testing Strategy

### Unit Testing Approach

**Scope**: Test individual domain entities, value objects, and use cases in isolation

**Key Test Cases**:

1. **Domain Entity Tests**:
   - Product.decreaseStock() with valid quantity
   - Product.decreaseStock() with quantity > stock (should fail)
   - Product.decreaseStock() with negative quantity (should fail)
   - Transaction.create() with valid data
   - Transaction.approve() from PENDING state
   - Transaction.approve() from non-PENDING state (should fail)
   - Customer.create() with valid email
   - Customer.create() with invalid email (should fail)

2. **Value Object Tests**:
   - Money.create() with valid amount and currency
   - Money.create() with negative amount (should fail)
   - Money.add() with same currency
   - Money.add() with different currencies (should throw)
   - Email.create() with valid format
   - Email.create() with invalid format (should fail)
   - Phone.create() with valid number
   - Phone.create() with invalid length (should fail)

3. **Use Case Tests**:
   - CreateTransactionUseCase with valid data
   - CreateTransactionUseCase with non-existent product
   - CreateTransactionUseCase with insufficient stock
   - ProcessPaymentUseCase with approved payment
   - ProcessPaymentUseCase with declined payment
   - ProcessPaymentUseCase with gateway timeout
   - ProcessPaymentUseCase idempotency (same key returns same result)

**Mocking Strategy**:
- Mock repository interfaces for use case tests
- Mock payment gateway interface for payment tests
- Use in-memory implementations for integration tests
- No mocking for domain entity tests (pure logic)

**Coverage Goal**: 80% minimum, 90% target for domain and application layers

### Property-Based Testing Approach

**Property Test Library**: fast-check (TypeScript/JavaScript)

**Key Properties to Test**:

1. **Stock Non-Negativity Property**:
```typescript
// Property: Stock never goes negative
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 100 }), // initial stock
    fc.array(fc.integer({ min: 1, max: 5 })), // decrease operations
    (initialStock, decreases) => {
      const product = Product.create({ stock: initialStock, ...validProps }).value;
      
      for (const decrease of decreases) {
        product.decreaseStock(decrease);
      }
      
      return product.stock >= 0;
    }
  )
);
```

2. **Transaction Amount Calculation Property**:
```typescript
// Property: Total always equals sum of components
fc.assert(
  fc.property(
    fc.float({ min: 0, max: 10000 }), // amount
    fc.float({ min: 0, max: 100 }), // base fee
    fc.float({ min: 0, max: 50 }), // delivery fee
    (amount, baseFee, deliveryFee) => {
      const transaction = Transaction.create({
        amount: Money.create(amount, 'USD').value,
        baseFee: Money.create(baseFee, 'USD').value,
        deliveryFee: Money.create(deliveryFee, 'USD').value,
        ...validProps
      }).value;
      
      const expected = amount + baseFee + deliveryFee;
      return Math.abs(transaction.totalAmount.amount - expected) < 0.01;
    }
  )
);
```

3. **State Transition Property**:
```typescript
// Property: Only valid state transitions occur
fc.assert(
  fc.property(
    fc.constantFrom('APPROVED', 'DECLINED', 'FAILED'),
    (targetStatus) => {
      const transaction = Transaction.create(validProps).value;
      const initialStatus = transaction.status; // PENDING
      
      const result = transaction[targetStatus.toLowerCase()](externalId);
      
      return result.isSuccess && 
             initialStatus === 'PENDING' && 
             transaction.status === targetStatus;
    }
  )
);
```

4. **Idempotency Property**:
```typescript
// Property: Same idempotency key produces same result
fc.assert(
  fc.property(
    fc.uuid(), // idempotency key
    fc.record({ /* payment details */ }),
    async (idempotencyKey, paymentDetails) => {
      const result1 = await processPaymentUseCase.execute({
        ...paymentDetails,
        idempotencyKey
      });
      
      const result2 = await processPaymentUseCase.execute({
        ...paymentDetails,
        idempotencyKey
      });
      
      return JSON.stringify(result1) === JSON.stringify(result2);
    }
  )
);
```

5. **Money Operations Property**:
```typescript
// Property: Money addition is commutative
fc.assert(
  fc.property(
    fc.float({ min: 0, max: 10000 }),
    fc.float({ min: 0, max: 10000 }),
    (a, b) => {
      const money1 = Money.create(a, 'USD').value;
      const money2 = Money.create(b, 'USD').value;
      
      const sum1 = money1.add(money2);
      const sum2 = money2.add(money1);
      
      return sum1.equals(sum2);
    }
  )
);
```

### Integration Testing Approach

**Scope**: Test complete flows with real database and mocked external services

**Key Integration Tests**:

1. **Complete Payment Flow**:
   - Create product → Create transaction → Process payment → Verify stock decreased
   - Test with approved payment
   - Test with declined payment
   - Verify database state after each step

2. **Concurrent Stock Updates**:
   - Multiple simultaneous purchases of same product
   - Verify stock decreases correctly
   - Verify no overselling occurs

3. **Database Transaction Rollback**:
   - Simulate failure during payment processing
   - Verify all changes rolled back
   - Verify no partial updates

4. **Payment Gateway Integration**:
   - Test with mock gateway returning various responses
   - Test timeout handling
   - Test retry logic

**Test Database**: Use test database with migrations, reset between tests

**Coverage Goal**: Cover all critical user journeys end-to-end

## Performance Considerations

### Database Optimization

1. **Indexing Strategy**:
   - Index on `transactions.product_id` for product lookup
   - Index on `transactions.customer_id` for customer history
   - Index on `transactions.external_payment_id` for idempotency checks
   - Index on `transactions.status` for status queries
   - Unique index on `customers.email` for fast lookup

2. **Query Optimization**:
   - Use Prisma's `select` to fetch only needed fields
   - Implement pagination for list endpoints
   - Use database transactions for atomic operations
   - Consider read replicas for high read volume

3. **Connection Pooling**:
   - Configure Prisma connection pool size based on load
   - Monitor connection usage and adjust limits
   - Implement connection timeout handling

### API Performance

1. **Response Time Targets**:
   - GET /products: < 100ms (p95)
   - GET /products/:id: < 50ms (p95)
   - POST /transactions: < 200ms (p95)
   - POST /payments/process: < 2000ms (p95) - includes external gateway call

2. **Caching Strategy**:
   - Cache product catalog with short TTL (5 minutes)
   - Cache customer data for session duration
   - No caching for transaction data (always fresh)

3. **Rate Limiting**:
   - Implement per-IP rate limiting (100 requests/minute)
   - Implement per-user rate limiting (50 requests/minute)
   - Stricter limits on payment endpoints (10 requests/minute)

### Payment Gateway Optimization

1. **Timeout Configuration**:
   - Set reasonable timeout for gateway calls (10 seconds)
   - Implement circuit breaker pattern
   - Fallback to queued processing if gateway slow

2. **Retry Strategy**:
   - Exponential backoff for transient failures
   - Maximum 3 retry attempts
   - Use idempotency keys for safe retries

## Security Considerations

### OWASP Top 10 Mitigations

1. **Injection Prevention**:
   - Use Prisma ORM (parameterized queries)
   - Validate all input with class-validator
   - Sanitize user input before processing

2. **Authentication & Authorization**:
   - Implement JWT-based authentication
   - Validate tokens on protected endpoints
   - Use role-based access control (RBAC)

3. **Sensitive Data Exposure**:
   - NEVER store credit card data in database
   - Use HTTPS for all communications
   - Encrypt sensitive data at rest
   - Mask card numbers in logs (show only last 4 digits)

4. **XML External Entities (XXE)**:
   - Not applicable (JSON API)

5. **Broken Access Control**:
   - Verify user owns transaction before allowing access
   - Implement resource-level authorization
   - Validate user permissions on every request

6. **Security Misconfiguration**:
   - Use environment variables for secrets
   - Disable debug mode in production
   - Keep dependencies updated
   - Use security headers (helmet middleware)

7. **Cross-Site Scripting (XSS)**:
   - Validate and sanitize all input
   - Use Content-Security-Policy headers
   - Encode output data

8. **Insecure Deserialization**:
   - Validate DTO structure with class-validator
   - Use TypeScript for type safety
   - Reject unexpected properties

9. **Using Components with Known Vulnerabilities**:
   - Regular dependency audits (npm audit)
   - Automated security scanning in CI/CD
   - Keep all dependencies updated

10. **Insufficient Logging & Monitoring**:
    - Log all payment attempts with correlation IDs
    - Log authentication failures
    - Monitor for suspicious patterns
    - Alert on critical errors

### Payment Security

1. **PCI DSS Compliance**:
   - Never store CVV
   - Never store full card number
   - Use payment gateway tokenization
   - Minimize card data handling

2. **Fraud Prevention**:
   - Implement velocity checks (max transactions per time period)
   - Monitor for suspicious patterns
   - Validate card BIN against expected ranges
   - Implement 3D Secure for high-value transactions

3. **API Security**:
   - Use API keys for gateway authentication
   - Rotate keys regularly
   - Store keys in secure vault (environment variables)
   - Implement request signing for integrity

### Data Protection

1. **Encryption**:
   - TLS 1.3 for data in transit
   - Encrypt sensitive fields at rest
   - Use strong encryption algorithms (AES-256)

2. **Privacy**:
   - Implement data retention policies
   - Support GDPR right to deletion
   - Anonymize logs and analytics data
   - Obtain consent for data processing

## Dependencies

### Core Dependencies

1. **Framework & Runtime**:
   - Node.js (v18+)
   - NestJS (v10+)
   - TypeScript (v5+)

2. **Database**:
   - PostgreSQL (v14+)
   - Prisma ORM (v5+)
   - Prisma Client

3. **Validation & Transformation**:
   - class-validator
   - class-transformer

4. **HTTP Client**:
   - axios (for payment gateway integration)

5. **Testing**:
   - Jest
   - @nestjs/testing
   - fast-check (property-based testing)
   - supertest (integration testing)

6. **Security**:
   - helmet (security headers)
   - @nestjs/throttler (rate limiting)
   - bcrypt (password hashing if needed)

7. **Logging**:
   - winston or pino
   - nest-winston

8. **Documentation**:
   - @nestjs/swagger
   - swagger-ui-express

9. **Configuration**:
   - @nestjs/config
   - dotenv

### External Services

1. **Payment Gateway**:
   - Wompi Sandbox API (https://api-sandbox.co.uat.wompi.dev/v1)
   - Requires: PUBLIC_KEY, PRIVATE_KEY, EVENTS_KEY, INTEGRITY_KEY

2. **Database**:
   - PostgreSQL instance (cloud or self-hosted)
   - Connection string in environment variables

### Development Dependencies

1. **Code Quality**:
   - ESLint
   - Prettier
   - Husky (git hooks)
   - lint-staged

2. **Build Tools**:
   - @nestjs/cli
   - ts-node
   - tsconfig-paths

3. **Type Definitions**:
   - @types/node
   - @types/jest
   - @types/express

## Deployment Configuration

### Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Payment Gateway (Wompi)
WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
WOMPI_EVENTS_KEY=test_events_xxxxx
WOMPI_INTEGRITY_KEY=test_integrity_xxxxx

# Security
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

### Health Check Endpoint

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    const checks = {
      database: await this.checkDatabase(),
      paymentGateway: await this.checkPaymentGateway()
    };

    const isHealthy = Object.values(checks).every(check => check.status === 'up');

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', responseTime: 0 };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  private async checkPaymentGateway(): Promise<HealthCheck> {
    try {
      // Implement gateway health check
      return { status: 'up', responseTime: 0 };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }
}
```

### Deployment Platforms

**Compatible with**:
- Railway (recommended for quick deployment)
- Render
- AWS (ECS, Lambda, EC2)
- Google Cloud (Cloud Run, GKE)
- Azure (App Service, Container Instances)
- Vercel (with serverless functions)
- Heroku
- DigitalOcean App Platform

**Database Hosting**:
- Railway PostgreSQL
- Render PostgreSQL
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- Supabase
- Neon
- PlanetScale (with PostgreSQL compatibility)

---

## Summary

This design document provides a comprehensive technical specification for a production-grade Payment Checkout API system. The architecture follows Hexagonal Architecture principles with clear separation between domain logic, application use cases, and infrastructure concerns. The system uses Railway Oriented Programming for explicit error handling, implements idempotent payment processing, and ensures transactional consistency through database transactions.

Key architectural decisions include:
- Domain-driven design with rich domain entities
- Repository pattern for data access abstraction
- Payment gateway adapter for external service integration
- Result/Either pattern for functional error handling
- Formal specifications with preconditions, postconditions, and loop invariants
- Comprehensive testing strategy including property-based testing
- Security-first approach with OWASP compliance
- Production-ready deployment configuration

The system is designed to be resilient, maintainable, testable, and scalable for production use.
