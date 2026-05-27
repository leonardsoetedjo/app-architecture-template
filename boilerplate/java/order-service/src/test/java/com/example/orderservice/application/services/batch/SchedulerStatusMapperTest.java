package com.example.orderservice.application.services.batch;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.quartz.Trigger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for SchedulerStatusMapper.
 */
class SchedulerStatusMapperTest {
    
    private final SchedulerStatusMapper mapper = new SchedulerStatusMapper();
    
    @Test
    @DisplayName("should map NORMAL to PROCESSING")
    void shouldMapNormalToProcessing() {
        assertThat(mapper.mapQuartzToBusiness(Trigger.TriggerState.NORMAL))
            .isEqualTo(BatchJobStatus.PROCESSING);
    }
    
    @Test
    @DisplayName("should map COMPLETE to COMPLETED")
    void shouldMapCompleteToCompleted() {
        assertThat(mapper.mapQuartzToBusiness(Trigger.TriggerState.COMPLETE))
            .isEqualTo(BatchJobStatus.COMPLETED);
    }
    
    @Test
    @DisplayName("should map ERROR to FAILED")
    void shouldMapErrorToFailed() {
        assertThat(mapper.mapQuartzToBusiness(Trigger.TriggerState.ERROR))
            .isEqualTo(BatchJobStatus.FAILED);
    }
    
    @Test
    @DisplayName("should map PAUSED to CANCELLED")
    void shouldMapPausedToCancelled() {
        assertThat(mapper.mapQuartzToBusiness(Trigger.TriggerState.PAUSED))
            .isEqualTo(BatchJobStatus.CANCELLED);
    }
    
    @Test
    @DisplayName("should map NONE to SCHEDULED")
    void shouldMapNoneToScheduled() {
        assertThat(mapper.mapQuartzToBusiness(Trigger.TriggerState.NONE))
            .isEqualTo(BatchJobStatus.SCHEDULED);
    }
    
    @Test
    @DisplayName("should map BLOCKED to PROCESSING")
    void shouldMapBlockedToProcessing() {
        assertThat(mapper.mapQuartzToBusiness(Trigger.TriggerState.BLOCKED))
            .isEqualTo(BatchJobStatus.PROCESSING);
    }
    
    @Test
    @DisplayName("should map null to FAILED")
    void shouldMapNullToFailed() {
        assertThat(mapper.mapQuartzToBusiness(null))
            .isEqualTo(BatchJobStatus.FAILED);
    }
}
