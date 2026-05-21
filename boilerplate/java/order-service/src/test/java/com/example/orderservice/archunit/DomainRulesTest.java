package com.example.orderservice.archunit;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * ArchUnit test for domain-specific rules.
 * Ensures domain layer follows domain-specific constraints (no Lombok, no frameworks).
 */
public class DomainRulesTest {

    private static final JavaClasses CLASSES = new ClassFileImporter()
        .importPackages("com.example.orderservice");

    @Test
    void domainClassesShouldNotUseLombok() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.domain..")
            .should()
            .beAnnotatedWith("lombok.Data")
            .orShould()
            .beAnnotatedWith("lombok.Value")
            .orShould()
            .beAnnotatedWith("lombok.Builder")
            .orShould()
            .beAnnotatedWith("lombok.NoArgsConstructor")
            .orShould()
            .beAnnotatedWith("lombok.AllArgsConstructor")
            .orShould()
            .beAnnotatedWith("lombok.Getter")
            .orShould()
            .beAnnotatedWith("lombok.Setter")
            .because("Domain layer should use Java records, not Lombok")
            .check(CLASSES);
    }

    @Test
    void noSpringAnnotationsInDomain() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.domain..")
            .should()
            .beAnnotatedWith("org.springframework.stereotype.Service")
            .orShould()
            .beAnnotatedWith("org.springframework.stereotype.Component")
            .orShould()
            .beAnnotatedWith("org.springframework.stereotype.Repository")
            .orShould()
            .beAnnotatedWith("org.springframework.web.bind.annotation.RestController")
            .orShould()
            .beAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
            .orShould()
            .beAnnotatedWith("jakarta.persistence.Entity")
            .orShould()
            .beAnnotatedWith("jakarta.persistence.Table")
            .orShould()
            .beAnnotatedWith("jakarta.persistence.Id")
            .because("Domain layer should be framework-agnostic")
            .check(CLASSES);
    }

    @Test
    void noFrameworkImportsInDomain() {
        // Only check for concrete Spring/Lombok/JPA types, not java.lang (which is allowed)
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.domain..")
            .should()
            .beAnnotatedWith("org.springframework.stereotype.Service")
            .orShould()
            .beAnnotatedWith("org.springframework.stereotype.Component")
            .orShould()
            .beAnnotatedWith("org.springframework.stereotype.Repository")
            .orShould()
            .beAnnotatedWith("org.springframework.web.bind.annotation.RestController")
            .orShould()
            .beAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
            .orShould()
            .beAnnotatedWith("jakarta.persistence.Entity")
            .orShould()
            .beAnnotatedWith("jakarta.persistence.Table")
            .orShould()
            .beAnnotatedWith("jakarta.persistence.Transient")
            .orShould()
            .beAnnotatedWith("lombok.Data")
            .orShould()
            .beAnnotatedWith("lombok.Builder")
            .orShould()
            .beAnnotatedWith("lombok.Getter")
            .orShould()
            .beAnnotatedWith("lombok.Setter")
            .because("Domain layer should be completely framework-agnostic")
            .check(CLASSES);
    }

    @Test
    void domainPortsShouldDefineContracts() {
        classes()
            .that()
            .resideInAnyPackage("com.example.orderservice.domain.ports..")
            .should()
            .beInterfaces()
            .because("Repository ports should be interfaces")
            .check(CLASSES);
    }

    @Test
    void noSpringAnnotationsInApplication() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.application..")
            .should()
            .beAnnotatedWith("org.springframework.stereotype.Service")
            .orShould()
            .beAnnotatedWith("org.springframework.stereotype.Component")
            .orShould()
            .beAnnotatedWith("org.springframework.stereotype.Repository")
            .because("Application layer interfaces should be framework-agnostic")
            .check(CLASSES);
    }

    @Test
    void noLombokInDomainModels() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.domain.models..")
            .should()
            .beAnnotatedWith("lombok.Data")
            .orShould()
            .beAnnotatedWith("lombok.Value")
            .orShould()
            .beAnnotatedWith("lombok.Builder")
            .because("Domain models should use records, not Lombok")
            .check(CLASSES);
    }

    @Test
    void noLombokInApplicationDtos() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.application..dto..")
            .should()
            .beAnnotatedWith("lombok.Data")
            .orShould()
            .beAnnotatedWith("lombok.Value")
            .orShould()
            .beAnnotatedWith("lombok.Builder")
            .orShould()
            .beAnnotatedWith("lombok.NoArgsConstructor")
            .orShould()
            .beAnnotatedWith("lombok.AllArgsConstructor")
            .because("Application DTOs should use records, not Lombok")
            .allowEmptyShould(true)
            .check(CLASSES);
    }
}
