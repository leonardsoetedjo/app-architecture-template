package com.example.orderservice.archunit;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;
import org.junit.jupiter.api.Test;

/**
 * ArchUnit tests enforcing Clean Architecture layer dependency rules.
 *
 * Layer Rules:
 *   - domain: pure business logic, no Spring, no JPA, no Jakarta, no infrastructure
 *   - application: use cases + DTOs, no HTTP, no Spring annotations (except @Validated etc)
 *   - infrastructure: Spring, JPA, controllers, adapters
 *
 * Dependencies may only point inward (infrastructure → application → domain).
 */
class CleanArchitectureRulesTest {

    private static final String BASE = "com.example.orderservice";

    @Test
    void domainLayerMustNotDependOnSpring() {
        ArchRuleDefinition.noClasses()
            .that().resideInAPackage(BASE + ".domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage(
                "org.springframework..",
                "jakarta.persistence..",
                "jakarta.validation..",
                "org.hibernate.."
            )
            .check(new ClassFileImporter().importPackages(BASE));
    }

    @Test
    void applicationLayerMustNotDependOnHttp() {
        ArchRuleDefinition.noClasses()
            .that().resideInAPackage(BASE + ".application..")
            .should().dependOnClassesThat()
            .resideInAnyPackage(
                "org.springframework.web..",
                "jakarta.servlet..",
                "org.springframework.http.."
            )
            .check(new ClassFileImporter().importPackages(BASE));
    }

    @Test
    void applicationLayerMustNotDependOnInfrastructure() {
        ArchRuleDefinition.noClasses()
            .that().resideInAPackage(BASE + ".application..")
            .should().dependOnClassesThat()
            .resideInAPackage(BASE + ".infrastructure..")
            .check(new ClassFileImporter().importPackages(BASE));
    }

    @Test
    void domainLayerMustNotDependOnApplicationOrInfrastructure() {
        ArchRuleDefinition.noClasses()
            .that().resideInAPackage(BASE + ".domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage(
                BASE + ".application..",
                BASE + ".infrastructure.."
            )
            .check(new ClassFileImporter().importPackages(BASE));
    }
}
