// test/archunit/structural-rules.spec.ts
import * as fs from "fs";
import * as path from "path";

function walk(
  dir: string,
  ext: string,
  callback: (file: string) => void,
): void {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      walk(full, ext, callback);
    } else if (full.endsWith(ext)) {
      callback(full);
    }
  }
}

describe("Architecture — Structural Rules", () => {
  const srcDir = path.join(__dirname, "../../src");

  describe("Domain Layer", () => {
    it("all domain models should be immutable (readonly or getter-only)", () => {
      const violations: string[] = [];
      const modelsDir = path.join(srcDir, "domain/models");
      if (fs.existsSync(modelsDir)) {
        walk(modelsDir, ".ts", (file) => {
          const content = fs.readFileSync(file, "utf8");
          const hasSetter = /\bset\s+\w+\s*\(/.test(content);
          const hasMutableField =
            /\b(public|protected)?\s*\w+\s*:\s*\w+\s*;/.test(content) &&
            !content.includes("readonly");
          if (hasSetter || hasMutableField) {
            violations.push(file);
          }
        });
      }
      expect(violations).toEqual([]);
    });

    it("all value object files should be named *.value-object.ts", () => {
      const violations: string[] = [];
      const modelsDir = path.join(srcDir, "domain/models");
      if (fs.existsSync(modelsDir)) {
        walk(modelsDir, ".ts", (file) => {
          const basename = path.basename(file);
          // Exclude enums and aggregates
          if (basename.includes(".enum.") || basename.includes(".aggregate."))
            return;
          if (!basename.includes(".value-object.")) {
            violations.push(file);
          }
        });
      }
      expect(violations).toEqual([]);
    });

    it("domain events should be in past tense", () => {
      const violations: string[] = [];
      const eventsDir = path.join(srcDir, "domain/events");
      if (fs.existsSync(eventsDir)) {
        for (const entry of fs.readdirSync(eventsDir)) {
          const name = path.basename(entry, ".ts");
          const eventClass = name.replace(/-/g, " ");
          const pastTenseWords = [
            "placed",
            "confirmed",
            "cancelled",
            "shipped",
            "delivered",
            "paid",
            "processed",
          ];
          const isPastTense = pastTenseWords.some((w) =>
            eventClass.toLowerCase().includes(w),
          );
          if (!isPastTense) violations.push(entry);
        }
      }
      expect(violations).toEqual([]);
    });
  });

  describe("Application Layer", () => {
    it("all use case interfaces should have execute or handle method", () => {
      const violations: string[] = [];
      const useCasesDir = path.join(srcDir, "application/usecases");
      if (fs.existsSync(useCasesDir)) {
        walk(useCasesDir, ".interface.ts", (file) => {
          const content = fs.readFileSync(file, "utf8");
          if (!/execute\s*\(/.test(content) && !/handle\s*\(/.test(content)) {
            violations.push(file);
          }
        });
      }
      expect(violations).toEqual([]);
    });
  });

  describe("Infrastructure Layer", () => {
    it("controllers should not import domain models directly", () => {
      const violations: string[] = [];
      const apiDir = path.join(srcDir, "infrastructure/api");
      if (fs.existsSync(apiDir)) {
        walk(apiDir, ".controller.ts", (file) => {
          const content = fs.readFileSync(file, "utf8");
          // Domain models should NOT appear in controllers — only DTOs
          const directDomainImport = /from\s+['"]@domain\/models/.test(content);
          if (directDomainImport) {
            violations.push(file);
          }
        });
      }
      expect(violations).toEqual([]);
    });
  });
});
