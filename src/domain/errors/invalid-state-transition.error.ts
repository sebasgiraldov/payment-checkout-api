import { DomainError } from './domain.error';

/**
 * InvalidStateTransitionError represents an attempt to transition an entity
 * to an invalid state
 */
export class InvalidStateTransitionError extends DomainError {
  constructor(
    public readonly currentState: string,
    public readonly targetState: string
  ) {
    super(`Invalid state transition from ${currentState} to ${targetState}`, {
      currentState,
      targetState,
    });
  }
}
