"""Mapper for converting Prefect states to business statuses.

This module provides translation between technical orchestrator states
(Prefect StateType) and business-friendly statuses for reporting and UIs.
"""
from typing import TYPE_CHECKING

from domain.models.workflows.workflow_status import WorkflowStatus

# Make Prefect import optional for testing
try:
    from prefect.states import State, StateType
    PREFECT_AVAILABLE = True
except ImportError:
    PREFECT_AVAILABLE = False
    State = None
    StateType = None


class PrefectStatusMapper:
    """Mapper for converting Prefect states to business statuses.
    
    This class translates Prefect's technical state types into business
    statuses that are meaningful for end users and reporting dashboards.
    
    Example:
        ```python
        from prefect.states import Completed, Running
        
        mapper = PrefectStatusMapper()
        
        # Map a completed state
        business_status = mapper.map_prefect_to_business(Completed())
        assert business_status == WorkflowStatus.COMPLETED
        
        # Map a running state
        business_status = mapper.map_prefect_to_business(Running())
        assert business_status == WorkflowStatus.PROCESSING
        ```
    """
    
    @staticmethod
    def map_prefect_to_business(state: "State") -> WorkflowStatus:
        """Map Prefect State to business status.
        
        Args:
            state: Prefect state object.
        
        Returns:
            Corresponding business status.
        
        Raises:
            ImportError: If Prefect is not installed.
        """
        if not PREFECT_AVAILABLE:
            raise ImportError(
                "Prefect is required for status mapping. "
                "Install with: pip install prefect"
            )
        
        if state is None:
            return WorkflowStatus.FAILED
        
        return {
            StateType.RUNNING: WorkflowStatus.PROCESSING,
            StateType.COMPLETED: WorkflowStatus.COMPLETED,
            StateType.FAILED: WorkflowStatus.FAILED,
            StateType.CANCELLED: WorkflowStatus.CANCELLED,
            StateType.CRASHED: WorkflowStatus.FAILED,
            StateType.PENDING: WorkflowStatus.SCHEDULED,
            StateType.SCHEDULED: WorkflowStatus.SCHEDULED,
            StateType.PAUSED: WorkflowStatus.CANCELLED,
        }.get(state.type, WorkflowStatus.FAILED)
    
    @staticmethod
    def map_prefect_type_to_business(state_type: "StateType") -> WorkflowStatus:
        """Map Prefect StateType enum to business status.
        
        Args:
            state_type: Prefect StateType enum value.
        
        Returns:
            Corresponding business status.
        """
        if not PREFECT_AVAILABLE:
            raise ImportError("Prefect is required for status mapping")
        
        return {
            StateType.RUNNING: WorkflowStatus.PROCESSING,
            StateType.COMPLETED: WorkflowStatus.COMPLETED,
            StateType.FAILED: WorkflowStatus.FAILED,
            StateType.CANCELLED: WorkflowStatus.CANCELLED,
            StateType.CRASHED: WorkflowStatus.FAILED,
            StateType.PENDING: WorkflowStatus.SCHEDULED,
            StateType.SCHEDULED: WorkflowStatus.SCHEDULED,
            StateType.PAUSED: WorkflowStatus.CANCELLED,
        }.get(state_type, WorkflowStatus.FAILED)
