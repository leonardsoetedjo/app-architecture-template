package com.example.orderservice.archunit;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaAccess;
import com.tngtech.archunit.core.domain.JavaMethodCall;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

/**
 * ArchUnit tests enforcing MDC logging hygiene rules.
 *
 * Rules:
 *   1. No call to MDC.clear() anywhere in application code.
 *      Rationale: MDC.clear() wipes ALL context keys (traceId, userId, etc.)
 *      set by other filters/aspects on the same request. Use MDC.remove(key)
 *      for per-key cleanup only.
 *
 *   2. MDC keys owned by a class MUST be removed in the same class's finally
 *      block (cannot be verified statically; use grep + code review).
 *
 * @see <a href="https://github.com/leonardsoetedjo/app-architecture-template/blob/main/docs/01-agnostic/01-standards/32-logging-standards.md">Backend Logging Standard</a>
 */
class MdcHygieneRulesTest {

    private static final String BASE = "com.example.orderservice";

    @Test
    void noClassMayCallMdcClear() {
        DescribedPredicate<JavaAccess<?>> callsMdcClear = new DescribedPredicate<>("call MDC.clear()") {
            @Override
            public boolean test(JavaAccess<?> access) {
                if (!(access instanceof JavaMethodCall)) {
                    return false;
                }
                JavaMethodCall call = (JavaMethodCall) access;
                String targetName = call.getTarget().getName();
                String targetOwner = call.getTarget().getOwner().getFullName();
                return "org.slf4j.MDC".equals(targetOwner) && "clear".equals(targetName);
            }
        };

        ArchCondition<com.tngtech.archunit.core.domain.JavaClass> notCallMdcClear =
            new ArchCondition<>("not call MDC.clear()") {
                @Override
                public void check(com.tngtech.archunit.core.domain.JavaClass clazz, ConditionEvents events) {
                    for (JavaMethodCall call : clazz.getMethodCallsFromSelf()) {
                        String targetName = call.getTarget().getName();
                        String targetOwner = call.getTarget().getOwner().getFullName();
                        if ("org.slf4j.MDC".equals(targetOwner) && "clear".equals(targetName)) {
                            events.add(SimpleConditionEvent.violated(call,
                                String.format("Class '%s' calls MDC.clear() at %s.%s:%d. " +
                                    "MDC.clear() wipes ALL context keys (traceId, userId) and breaks distributed tracing. " +
                                    "Use MDC.remove(key) for per-key cleanup instead.",
                                    clazz.getFullName(),
                                    call.getOrigin().getFullName(),
                                    call.getName(),
                                    call.getLineNumber())));
                        }
                    }
                }
            };

        ArchRule rule = classes()
            .that().resideInAPackage(BASE + "..")
            .should(notCallMdcClear);

        rule.check(new ClassFileImporter().importPackages(BASE));
    }
}
