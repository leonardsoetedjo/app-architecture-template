package com.example.orderservice.application.services.batch;

import com.example.orderservice.domain.models.batch.BatchJobStatus;
import org.quartz.Trigger;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting scheduler statuses to business statuses.
 * 
 * This component translates technical scheduler states (Quartz TriggerState)
 * into business-friendly statuses for reporting and user interfaces.
 */
@Component
public class SchedulerStatusMapper {
    
    /**
     * Map Quartz TriggerState to business status.
     * 
     * @param quartzStatus the Quartz trigger state
     * @return the corresponding business status
     */
    public BatchJobStatus mapQuartzToBusiness(Trigger.TriggerState quartzStatus) {
        if (quartzStatus == null) {
            return BatchJobStatus.FAILED;
        }
        
        return switch (quartzStatus) {
            case NORMAL -> BatchJobStatus.PROCESSING;
            case COMPLETE -> BatchJobStatus.COMPLETED;
            case ERROR -> BatchJobStatus.FAILED;
            case PAUSED -> BatchJobStatus.CANCELLED;
            case NONE -> BatchJobStatus.SCHEDULED;
            case BLOCKED -> BatchJobStatus.PROCESSING;
        };
    }
}
