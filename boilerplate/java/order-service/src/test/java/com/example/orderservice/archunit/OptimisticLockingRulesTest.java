package com.example.orderservice.archunit;

import com.tngtech.archunit.core.domain.JavaField;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import jakarta.persistence.Version;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;

/**
 * ArchUnit tests enforcing optimistic locking rules.
 *
 * Rule: Any entity field annotated with @Version MUST use a wrapper type
 * (Integer or Long), never a primitive (int or long).
 *
 * Rationale: Hibernate uses the version field's unsaved-value to distinguish
 * transient entities from detached ones. For primitives, the JVM default (0)
 * is indistinguishable from a saved entity with version 0, causing Hibernate
 * to treat loaded entities as new and attempt INSERT instead of UPDATE.
 *
 * With wrapper types (Integer/Long), null is the unsaved marker, and 0 is a
 * valid saved version — the distinction is unambiguous.
 *
 * @see <a href="https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#locking-optimistic-version">Hibernate Optimistic Locking Docs</a>
 */
class OptimisticLockingRulesTest {

    private static final String DOMAIN_PACKAGE = "com.example.orderservice";

    @Test
    void versionFieldsMustUseWrapperTypes() {
        ArchRule rule = fields()
            .that().areAnnotatedWith(Version.class)
            .should(notHavePrimitiveType());

        rule.check(new ClassFileImporter().importPackages(DOMAIN_PACKAGE));
    }

    private static ArchCondition<JavaField> notHavePrimitiveType() {
        return new ArchCondition<>("not have primitive type (int or long)") {
            @Override
            public void check(JavaField field, ConditionEvents events) {
                String typeName = field.getRawType().getName();
                boolean isPrimitive = "int".equals(typeName) || "long".equals(typeName);
                if (isPrimitive) {
                    events.add(SimpleConditionEvent.violated(field,
                        String.format("Field '%s' in '%s' is annotated with @Version but uses primitive type '%s'. " +
                            "Use Integer or Long wrapper type instead to avoid Hibernate unsaved-value detection issues.",
                            field.getName(), field.getOwner().getFullName(), typeName)));
                }
            }
        };
    }
}
