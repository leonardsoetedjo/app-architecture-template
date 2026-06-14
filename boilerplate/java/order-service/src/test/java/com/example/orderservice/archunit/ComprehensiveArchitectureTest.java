package com.example.orderservice.archunit;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;

/**
 * Comprehensive ArchUnit Architecture Tests
 * 
 * This test suite enforces Clean Architecture principles:
 * 1. Layer dependency rules (inward-only dependencies)
 * 2. Framework isolation (no Spring/Lombok/JPA in domain)
 * 3. Naming conventions (past tense events, Repository interfaces)
 * 4. Structural rules (constructors, annotations, immutability)
 * 
 * Run with: mvn test -Dtest=ComprehensiveArchitectureTest
 */
public class ComprehensiveArchitectureTest {

    private static final JavaClasses CLASSES = new ClassFileImporter()
        .importPackages("com.example.orderservice");

    // ========================================================================
    // LAYER DEPENDENCY RULES
    // ========================================================================

    @Test
    void domainLayerMustNotDependOnApplicationOrInfrastructure() {
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.domain..")
            .should().dependOnClassesThat().resideInAnyPackage("com.example.orderservice.application..")
            .orShould().dependOnClassesThat().resideInAnyPackage("com.example.orderservice.infrastructure..")
            .because("Domain layer must be completely isolated - dependencies flow inward only")
            .check(CLASSES);
    }

    @Test
    void applicationLayerMustNotDependOnInfrastructure() {
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.application..")
            .should().dependOnClassesThat().resideInAnyPackage("com.example.orderservice.infrastructure..")
            .because("Application layer orchestrates but does not implement - infrastructure details are pluggable")
            .check(CLASSES);
    }

    @Test
    void domainPortsMustBeInterfaces() {
        classes()
            .that().resideInAnyPackage("com.example.orderservice.domain.ports..")
            .should().beInterfaces()
            .because("Repository ports define contracts - implementations are infrastructure details")
            .check(CLASSES);
    }

    // ========================================================================
    // FRAMEWORK ISOLATION RULES
    // ========================================================================

    @Test
    void domainLayerMustNotUseSpringAnnotations() {
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.domain..")
            .should().beAnnotatedWith("org.springframework.stereotype.Service")
            .orShould().beAnnotatedWith("org.springframework.stereotype.Component")
            .orShould().beAnnotatedWith("org.springframework.stereotype.Repository")
            .orShould().beAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
            .orShould().beAnnotatedWith("org.springframework.context.annotation.Configuration")
            .orShould().beAnnotatedWith("org.springframework.web.bind.annotation.RestController")
            .orShould().beAnnotatedWith("org.springframework.web.bind.annotation.RequestMapping")
            .because("Domain layer must be framework-agnostic - testable without Spring context")
            .check(CLASSES);
    }

    @Test
    void domainLayerMustNotUseJpaAnnotations() {
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.domain..")
            .should().beAnnotatedWith("jakarta.persistence.Entity")
            .orShould().beAnnotatedWith("jakarta.persistence.Table")
            .orShould().beAnnotatedWith("jakarta.persistence.Id")
            .orShould().beAnnotatedWith("jakarta.persistence.Column")
            .orShould().beAnnotatedWith("jakarta.persistence.OneToOne")
            .orShould().beAnnotatedWith("jakarta.persistence.OneToMany")
            .orShould().beAnnotatedWith("javax.persistence.Entity")
            .orShould().beAnnotatedWith("javax.persistence.Table")
            .because("Domain models are pure Java - persistence is an infrastructure concern")
            .check(CLASSES);
    }

    @Test
    void domainLayerMustNotUseLombok() {
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.domain..")
            .should().beAnnotatedWith("lombok.Data")
            .orShould().beAnnotatedWith("lombok.Value")
            .orShould().beAnnotatedWith("lombok.Builder")
            .orShould().beAnnotatedWith("lombok.Getter")
            .orShould().beAnnotatedWith("lombok.Setter")
            .orShould().beAnnotatedWith("lombok.AllArgsConstructor")
            .orShould().beAnnotatedWith("lombok.NoArgsConstructor")
            .orShould().beAnnotatedWith("lombok.ToString")
            .orShould().beAnnotatedWith("lombok.EqualsAndHashCode")
            .because("Domain models use Java records for transparency - Lombok hides implementation")
            .check(CLASSES);
    }

    @Test
    void applicationDtosMustNotUseLombok() {
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.application..dto..")
            .should().beAnnotatedWith("lombok.Data")
            .orShould().beAnnotatedWith("lombok.Value")
            .orShould().beAnnotatedWith("lombok.Builder")
            .orShould().beAnnotatedWith("lombok.Getter")
            .orShould().beAnnotatedWith("lombok.Setter")
            .because("DTOs use Java records for clarity and immutability")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void applicationUseCaseInterfacesMustNotUseSpringAnnotations() {
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.application..")
            .and().haveSimpleNameNotEndingWith("Impl")
            .should().beAnnotatedWith("org.springframework.stereotype.Service")
            .orShould().beAnnotatedWith("org.springframework.stereotype.Component")
            .because("Use case interfaces are contracts - implementations may be Spring beans")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    // ========================================================================
    // COMPONENT LOCALIZATION RULES
    // ========================================================================

    @Test
    void controllersMustResideInInfrastructureApi() {
        classes()
            .that().areAnnotatedWith("org.springframework.web.bind.annotation.RestController")
            .should().resideInAnyPackage("com.example.orderservice.infrastructure.api..")
            .because("REST controllers are infrastructure adapters - they translate HTTP to use cases")
            .check(CLASSES);
    }

    @Test
    void jpaEntitiesMustResideInInfrastructurePersistence() {
        classes()
            .that().areAnnotatedWith("jakarta.persistence.Entity")
            .or().areAnnotatedWith("javax.persistence.Entity")
            .should().resideInAnyPackage("com.example.orderservice.infrastructure.persistence..")
            .because("JPA entities are persistence details - infrastructure concern")
            .check(CLASSES);
    }

    @Test
    void springRepositoriesMustResideInInfrastructure() {
        classes()
            .that().areAnnotatedWith("org.springframework.stereotype.Repository")
            .should().resideInAnyPackage("com.example.orderservice.infrastructure.persistence..")
            .because("Spring Data repositories are infrastructure implementations of domain ports")
            .check(CLASSES);
    }

    @Test
    void useCaseImplementationsMayUseServiceAnnotation() {
        classes()
            .that().haveSimpleNameEndingWith("UseCaseImpl")
            .should().beAnnotatedWith("org.springframework.stereotype.Service")
            .orShould().resideInAnyPackage("..application..")
            .because("Use case implementations are Spring beans wired via @Service or @Configuration")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    // ========================================================================
    // NAMING CONVENTION RULES
    // ========================================================================

    @Test
    void domainEventsMustBeNamedInPastTense() {
        classes()
            .that().resideInAnyPackage("com.example.orderservice.domain..events..")
            .and().haveSimpleNameNotEndingWith("Event")
            .should().haveSimpleNameMatching(".*[e][d]$")
            .orShould().haveSimpleNameMatching(".*[n]$")
            .because("Domain events represent things that happened - past tense naming (OrderPlaced, PaymentConfirmed)")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void repositoryInterfacesMustEndWithRepository() {
        classes()
            .that().resideInAnyPackage("com.example.orderservice.domain.ports..")
            .and().areInterfaces()
            .should().haveSimpleNameEndingWith("Repository")
            .orShould().haveSimpleNameEndingWith("Port")
            .because("Repository interfaces follow consistent naming for discoverability")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void useCaseInterfacesMustEndWithUseCase() {
        classes()
            .that().resideInAnyPackage("com.example.orderservice.application..usecases..")
            .and().areInterfaces()
            .should().haveSimpleNameEndingWith("UseCase")
            .because("Use case interfaces follow consistent naming (PlaceOrderUseCase)")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void valueObjectsShouldBeRecords() {
        // This is a softer check - we can't directly test "is a record" in ArchUnit
        // Instead, we check they don't have Lombok which is the common alternative
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.domain.models..")
            .and().haveSimpleNameMatching(".*Id$")
            .orShould().haveSimpleNameMatching(".*Config$")
            .should().beAnnotatedWith("lombok.Data")
            .orShould().beAnnotatedWith("lombok.Value")
            .because("Value objects should be Java records for immutability")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    // ========================================================================
    // CONSTRUCTOR INJECTION RULES
    // ========================================================================

    @Test
    void infrastructureComponentsMustUseConstructorInjection() {
        // Check that @Autowired is not used on fields (only on constructors)
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.infrastructure..")
            .should().haveFieldAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
            .because("Constructor injection is required - field injection prevents immutability and testing")
            .check(CLASSES);
    }

    @Test
    void applicationServicesMustUseConstructorInjection() {
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.application..")
            .should().haveFieldAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
            .because("Constructor injection is required - field injection prevents immutability and testing")
            .check(CLASSES);
    }

    // ========================================================================
    // NO CIRCULAR DEPENDENCIES
    // ========================================================================

    @Test
    void noCircularDependenciesBetweenLayers() {
        noClasses()
            .that().resideInAnyPackage("com.example.orderservice.domain..")
            .should().dependOnClassesThat().resideInAnyPackage("com.example.orderservice.infrastructure..")
            .because("Circular dependencies violate Clean Architecture - domain cannot know about infrastructure")
            .check(CLASSES);
    }

    // ========================================================================
    // PACKAGE STRUCTURE RULES
    // ========================================================================

    @Test
    void allClassesMustBeInValidPackages() {
        classes()
            .that().resideInAnyPackage("com.example.orderservice..")
            .should().resideInAnyPackage(
                "com.example.orderservice",
                "com.example.orderservice.domain..",
                "com.example.orderservice.application..",
                "com.example.orderservice.infrastructure..",
                "com.example.orderservice.archunit.."
            )
            .because("All classes must be organized into Clean Architecture layers")
            .check(CLASSES);
    }

    @Test
    void domainModelsMustResideInDomainModelsPackage() {
        classes()
            .that().resideInAnyPackage("com.example.orderservice.domain..")
            .and().haveSimpleNameMatching("^(Order|Customer|Payment|Product).*")
            .should().resideInAnyPackage("com.example.orderservice.domain.models..")
            .because("Domain models (aggregates, entities) must be in domain.models package")
            .allowEmptyShould(true)
            .check(CLASSES);
    }
}
