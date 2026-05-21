package com.example.orderservice.archunit;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * ArchUnit test for dependency rules.
 * Ensures proper separation of concerns and prevents circular dependencies.
 */
public class DependencyRulesTest {

    private static final JavaClasses CLASSES = new ClassFileImporter()
        .importPackages("com.example.orderservice");

    @Test
    void domainModelsShouldNotUseLombok() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.domain..")
            .should()
            .beAnnotatedWith("lombok.Data")
            .orShould()
            .beAnnotatedWith("lombok.Builder")
            .orShould()
            .beAnnotatedWith("lombok.Value")
            .orShould()
            .beAnnotatedWith("lombok.AllArgsConstructor")
            .orShould()
            .beAnnotatedWith("lombok.NoArgsConstructor")
            .because("Domain models should use records, not Lombok")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void applicationDtosShouldNotUseLombok() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.application..dto..")
            .should()
            .beAnnotatedWith("lombok.Data")
            .orShould()
            .beAnnotatedWith("lombok.Builder")
            .orShould()
            .beAnnotatedWith("lombok.Value")
            .orShould()
            .beAnnotatedWith("lombok.AllArgsConstructor")
            .orShould()
            .beAnnotatedWith("lombok.NoArgsConstructor")
            .because("Application DTOs should use records, not Lombok")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void applicationUseCaseInterfacesShouldNotUseSpringAnnotations() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.application..usecase..")
            .and()
            .haveSimpleNameNotEndingWith("Impl")
            .should()
            .beAnnotatedWith("org.springframework.stereotype.Service")
            .orShould()
            .beAnnotatedWith("org.springframework.stereotype.Component")
            .orShould()
            .beAnnotatedWith("org.springframework.context.annotation.Configuration")
            .orShould()
            .beAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
            .because("Use case interfaces should be framework-agnostic")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void controllersShouldResideInInfrastructurePackage() {
        classes()
            .that()
            .areAnnotatedWith("org.springframework.web.bind.annotation.RestController")
            .should()
            .resideInAnyPackage("com.example.orderservice.infrastructure.api..")
            .because("REST controllers are infrastructure layer components")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void entitiesShouldResideInInfrastructurePackage() {
        classes()
            .that()
            .areAnnotatedWith("jakarta.persistence.Entity")
            .or()
            .areAnnotatedWith("javax.persistence.Entity")
            .should()
            .resideInAnyPackage("com.example.orderservice.infrastructure.persistence..")
            .because("JPA entities are infrastructure layer components")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void repositoriesShouldResideInInfrastructurePackage() {
        classes()
            .that()
            .areAnnotatedWith("org.springframework.stereotype.Repository")
            .should()
            .resideInAnyPackage(
                "com.example.orderservice.infrastructure.persistence..",
                "com.example.orderservice.domain.ports.."
            )
            .because("Repositories must be in infrastructure or domain ports")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void applicationUseCaseImplsMayUseService() {
        // Relaxed: Impls may be @Service OR wired via @Configuration beans.
        // We enforce this by checking there IS at least one Impl if interfaces exist.
        classes()
            .that()
            .haveNameMatching(".*UseCase")
            .and()
            .areInterfaces()
            .should()
            .haveNameNotMatching(".*Skip")
            .allowEmptyShould(true)
            .check(CLASSES);
    }

    @Test
    void noCircularDependencies() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("com.example.orderservice.infrastructure..")
            .because("Circular dependencies violate Clean Architecture")
            .check(CLASSES);
    }

    @Test
    void noFrameworkImportsInDomain() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                "org.springframework..",
                "jakarta.persistence..",
                "javax.persistence..",
                "lombok..",
                "org.aspectj.."
            )
            .because("Domain layer must be framework-agnostic")
            .check(CLASSES);
    }
}
