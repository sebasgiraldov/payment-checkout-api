import { Prisma } from '@prisma/client';
import { Result } from '../../shared/result';
import { RepositoryError } from '../../domain/errors/repository.error';
import { Customer, CustomerProps } from '../../domain/entities/customer.entity';
import { ICustomerRepository } from '../../domain/repositories/customer.repository';
import { PrismaService } from '../database/prisma.service';

/**
 * Customer Repository Adapter (Prisma Implementation)
 *
 * Implements the ICustomerRepository port using Prisma ORM.
 * Handles mapping between Prisma models and domain entities.
 *
 * **Validates: Requirements 3.1, 3.4, 3.5, 18.4**
 */
export class CustomerRepositoryAdapter implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a customer by their unique identifier
   *
   * @param id - The customer UUID
   * @returns Result containing the Customer or RepositoryError
   */
  async findById(id: string): Promise<Result<Customer, RepositoryError>> {
    try {
      const customerModel = await this.prisma.customer.findUnique({
        where: { id },
      });

      if (!customerModel) {
        return Result.fail(new RepositoryError(`Customer with id ${id} not found`, { id }));
      }

      return this.mapToDomain(customerModel);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to find customer: ${(error as Error).message}`, {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Finds a customer by their email address
   *
   * @param email - The customer email
   * @returns Result containing the Customer or null if not found
   */
  async findByEmail(email: string): Promise<Result<Customer | null, RepositoryError>> {
    try {
      const customerModel = await this.prisma.customer.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!customerModel) {
        return Result.ok(null);
      }

      const customerResult = this.mapToDomain(customerModel);
      if (customerResult.isFailure) {
        return Result.fail(customerResult.error);
      }

      return Result.ok(customerResult.value);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to find customer by email: ${(error as Error).message}`, {
          email,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Persists a new customer to the database
   *
   * @param customer - The Customer entity to save
   * @returns Result containing the saved Customer or RepositoryError
   */
  async save(customer: Customer): Promise<Result<Customer, RepositoryError>> {
    try {
      const customerModel = await this.prisma.customer.create({
        data: {
          id: customer.id,
          name: customer.name,
          email: customer.email.value,
          phone: customer.phone.value,
          createdAt: customer.createdAt,
        },
      });

      return this.mapToDomain(customerModel);
    } catch (error) {
      // Handle unique constraint violation for email
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return Result.fail(
            new RepositoryError(`Customer with email ${customer.email.value} already exists`, {
              customerId: customer.id,
              email: customer.email.value,
            })
          );
        }
      }

      return Result.fail(
        new RepositoryError(`Failed to save customer: ${(error as Error).message}`, {
          customerId: customer.id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Finds an existing customer by email or creates a new one if not found
   *
   * This method implements the find-or-create pattern using Prisma's upsert.
   *
   * @param props - Customer properties for creation if not found
   * @returns Result containing the found or created Customer
   */
  async findOrCreate(props: CustomerProps): Promise<Result<Customer, RepositoryError>> {
    try {
      // First, try to create the customer entity to validate the data
      const customerResult = Customer.create(props);
      if (customerResult.isFailure) {
        return Result.fail(
          new RepositoryError(`Invalid customer data: ${customerResult.error.message}`, {
            email: props.email,
          })
        );
      }

      const customer = customerResult.value;

      // Use upsert to find or create
      const customerModel = await this.prisma.customer.upsert({
        where: { email: customer.email.value },
        update: {}, // Don't update if exists
        create: {
          id: customer.id,
          name: customer.name,
          email: customer.email.value,
          phone: customer.phone.value,
          createdAt: customer.createdAt,
        },
      });

      return this.mapToDomain(customerModel);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to find or create customer: ${(error as Error).message}`, {
          email: props.email,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Maps a Prisma Customer model to a domain Customer entity
   *
   * @param model - The Prisma customer model
   * @returns Result containing Customer entity or RepositoryError
   */
  private mapToDomain(model: {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: Date;
  }): Result<Customer, RepositoryError> {
    const customerResult = Customer.create({
      id: model.id,
      name: model.name,
      email: model.email,
      phone: model.phone,
      createdAt: model.createdAt,
    });

    if (customerResult.isFailure) {
      return Result.fail(
        new RepositoryError(`Failed to create Customer entity: ${customerResult.error.message}`, {
          customerId: model.id,
        })
      );
    }

    return Result.ok(customerResult.value);
  }
}
