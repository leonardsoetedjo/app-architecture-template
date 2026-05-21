package com.example.orderservice.archunit;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * ArchUnit test for Clean Architecture layer dependencies.
 * Ensures dependencies flow inward (infrastructure -> application -> domain).
 */
public class CleanArchitectureLayersTest {

    private static final JavaClasses CLASSES = new ClassFileImporter()
        .importPackages("com.example.orderservice");

    @Test
    void domainLayerShouldNotAccessApplicationOrInfrastructure() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                "com.example.orderservice.application..",
                "com.example.orderservice.infrastructure.."
            )
            .because("Domain layer must not depend on application or infrastructure layers")
            .check(CLASSES);
    }

    @Test
    void applicationLayerShouldNotAccessInfrastructure() {
        noClasses()
            .that()
            .resideInAnyPackage("com.example.orderservice.application..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("com.example.orderservice.infrastructure..")
            .because("Application layer must not depend on infrastructure layer")
            .check(CLASSES);
    }
}
