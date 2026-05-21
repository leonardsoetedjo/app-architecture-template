"""No-op domain event publisher for dev / test.

In production, inject Kafka / RabbitMQ adapter.
"""

from __future__ import annotations

from typing import Any

from domain.ports.event_publisher import EventPublisher


class NoOpEventPublisher(EventPublisher):
    """Development event publisher that discards events silently."""

    def publish(self, event: object) -> None:
        pass

    def publish_batch(self, events: list[Any]) -> None:
        for _ in events:
            pass
