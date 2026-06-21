"""Event publisher port for publishing domain events.

ABC = zero framework dependencies.
Infrastructure adapters (e.g., Kafka, RabbitMQ) implement this.
"""

from abc import ABC, abstractmethod


class EventPublisher(ABC):
    """Domain event publisher port.

    Accepts raw objects so domain events can pass across the port
    without forcing the domain to depend on serialization frameworks.
    """

    @abstractmethod
    def publish(self, event: object) -> None:
        """Publish a single domain event."""
        ...
