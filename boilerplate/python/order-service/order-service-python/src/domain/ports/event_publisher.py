from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, List


class EventPublisher(ABC):
    """Event publisher port for publishing domain events.

    ABC = zero framework dependencies.
    Infrastructure adapters (e.g., Kafka, RabbitMQ) implement this.
    """

    @abstractmethod
    def publish(self, event: Dict[str, Any]) -> None:
        """Publish a single event."""
        ...

    @abstractmethod
    def publish_batch(self, events: List[Dict[str, Any]]) -> None:
        """Publish multiple events in a batch."""
        ...
