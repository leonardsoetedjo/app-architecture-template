package com.example.orderservice.infrastructure.batch.config;

import com.example.orderservice.infrastructure.batch.tasklets.SampleTasklet;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * Configuration for sample batch job demonstrating business status tracking.
 */
@Configuration
@RequiredArgsConstructor
public class SampleBatchConfig {
    
    private final SampleTasklet sampleTasklet;
    private final PlatformTransactionManager transactionManager;
    
    /**
     * Sample step using the tasklet.
     */
    @Bean
    public Step sampleStep(JobRepository jobRepository) {
        return new StepBuilder("sampleStep", jobRepository)
            .tasklet(sampleTasklet, transactionManager)
            .build();
    }
    
    /**
     * Sample job orchestrating the step.
     */
    @Bean
    public Job sampleJob(JobRepository jobRepository, Step sampleStep) {
        return new JobBuilder("sampleJob", jobRepository)
            .start(sampleStep)
            .build();
    }
}
