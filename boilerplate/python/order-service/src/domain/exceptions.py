"""Domain exceptions module.

Contains domain-specific exceptions, independent of framework concerns.
"""


class DomainException(Exception):
    """Base exception for all domain-related errors."""

    def __init__(self, message: str, code: str = "DOMAIN_ERROR"):
        super().__init__(message)
        self.code = code
        self.message = message


class InvalidOrderException(DomainException):
    """Exception raised when an order is invalid."""

    def __init__(self, message: str, code: str = "INVALID_ORDER"):
        super().__init__(message, code)


class IllegalStateException(DomainException):
    """Exception raised when an operation is not allowed in the current state."""

    def __init__(self, message: str, code: str = "ILLEGAL_STATE"):
        super().__init__(message, code)
