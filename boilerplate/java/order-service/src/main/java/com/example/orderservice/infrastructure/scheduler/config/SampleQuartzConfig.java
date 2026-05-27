package com.example.orderservice.infrastructure.scheduler.config;

import com.example.orderservice.infrastructure.scheduler.jobs.SampleQuartzJob;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for sample Quartz scheduled job.
 */
@Configuration
public class SampleQuartzConfig {
    
    /**
     * Job detail for sample scheduled job.
     */
    @Bean
    public JobDetail sampleJobDetail() {
        return JobBuilder.newJob(SampleQuartzJob.class)
            .withIdentity("sampleJob", "DEFAULT")
            .withDescription("Sample scheduled job - every 5 minutes")
            .storeDurably()
            .build();
    }
    
    /**
     * Trigger for sample job - runs every 5 minutes.
     */
    @Bean
    public Trigger sampleTrigger(JobDetail sampleJobDetail) {
        return TriggerBuilder.newTrigger()
            .forJob(sampleJobDetail)
            .withIdentity("sampleTrigger", "DEFAULT")
            .withSchedule(
                CronScheduleBuilder.cronSchedule("0 */5 * * * ?")
            )
            .build();
    }
}
