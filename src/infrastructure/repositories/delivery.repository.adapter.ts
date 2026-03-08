import { Result } from '../../shared/result';
import { RepositoryError } from '../../domain/errors/repository.error';
import { Delivery, DeliveryProps } from '../../domain/entities/delivery.entity';
import { IDeliveryRepository } from '../../domain/repositories/delivery.repository';
import { PrismaService } from '../database/prisma.service';
import { Money } from '../../domain/value-objects/money.value-object';
import { Delivery as PrismaDelivery } from '@prisma/client';

/**
 * Delivery Repository Adapter (Prisma Implementation)
 *
 * Implements the IDeliveryRepository port using Prisma ORM.
 * Handles mapping between Prisma models and domain entities.
 *
 * **Validates: Requirements 4.1, 4.3, 4.5, 18.4**
 */
export class DeliveryRepositoryAdapter implements IDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a delivery by its unique identifier
   *
   * @param id - The delivery UUID
   * @returns Result containing the Delivery or RepositoryError
   *
   * **Validates: Requirements 4.1**
   */
  async findById(id: string): Promise<Result<Delivery, RepositoryError>> {
    try {
      const deliveryModel = await this.prisma.delivery.findUnique({
        where: { id },
      });

      if (!deliveryModel) {
        return Result.fail(new RepositoryError(`Delivery with id ${id} not found`, { id }));
      }

      return this.mapToDomain(deliveryModel);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to find delivery: ${(error as Error).message}`, {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Persists a new delivery to the database
   *
   * @param delivery - The Delivery entity to save
   * @returns Result containing the saved Delivery or RepositoryError
   *
   * **Validates: Requirements 4.5**
   */
  async save(delivery: Delivery): Promise<Result<Delivery, RepositoryError>> {
    try {
      const deliveryModel = await this.prisma.delivery.create({
        data: {
          id: delivery.id,
          customerId: delivery.customerId,
          address: delivery.address.street,
          city: delivery.address.city,
          state: delivery.address.state || '',
          country: delivery.address.country,
          postalCode: delivery.address.postalCode,
          deliveryFee: delivery.deliveryFee.amount,
          currency: delivery.deliveryFee.currency,
          createdAt: delivery.createdAt,
        },
      });

      return this.mapToDomain(deliveryModel);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to save delivery: ${(error as Error).message}`, {
          deliveryId: delivery.id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Finds all deliveries associated with a specific customer
   *
   * @param customerId - The customer UUID
   * @returns Result containing array of Deliveries or RepositoryError
   *
   * **Validates: Requirements 4.3**
   */
  async findByCustomerId(customerId: string): Promise<Result<Delivery[], RepositoryError>> {
    try {
      const deliveryModels = await this.prisma.delivery.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });

      const deliveries: Delivery[] = [];

      for (const model of deliveryModels) {
        const deliveryResult = this.mapToDomain(model);
        if (deliveryResult.isFailure) {
          return Result.fail(deliveryResult.error);
        }
        deliveries.push(deliveryResult.value);
      }

      return Result.ok(deliveries);
    } catch (error) {
      return Result.fail(
        new RepositoryError(`Failed to find deliveries for customer: ${(error as Error).message}`, {
          customerId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Maps a Prisma Delivery model to a domain Delivery entity
   *
   * @param model - Prisma delivery model
   * @returns Result containing Delivery entity or RepositoryError
   * @private
   */
  private mapToDomain(model: PrismaDelivery): Result<Delivery, RepositoryError> {
    const deliveryFeeResult = Money.create(Number(model.deliveryFee), model.currency);

    if (deliveryFeeResult.isFailure) {
      return Result.fail(
        new RepositoryError('Failed to map delivery fee to Money value object', {
          deliveryId: model.id,
          deliveryFee: model.deliveryFee,
          currency: model.currency,
        })
      );
    }

    const deliveryProps: DeliveryProps = {
      id: model.id,
      customerId: model.customerId,
      address: model.address,
      city: model.city,
      state: model.state || '',
      country: model.country,
      postalCode: model.postalCode,
      deliveryFee: deliveryFeeResult.value,
      createdAt: model.createdAt,
    };

    const deliveryResult = Delivery.create(deliveryProps);

    if (deliveryResult.isFailure) {
      return Result.fail(
        new RepositoryError('Failed to create Delivery entity from database model', {
          deliveryId: model.id,
          error: deliveryResult.error.message,
        })
      );
    }

    return Result.ok(deliveryResult.value);
  }
}
