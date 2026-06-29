// test/unit/domain/order-id.value-object.spec.ts
import { DomainException } from "../../../src/domain/exceptions/domain.exception";
import { OrderId } from "../../../src/domain/models/order-id.value-object";

describe("OrderId Value Object", () => {
  it("should create with valid value", () => {
    const id = new OrderId("valid-id");
    expect(id.value).toBe("valid-id");
  });

  it("should throw on empty value", () => {
    expect(() => new OrderId("")).toThrow(DomainException);
  });

  it("should throw on null value", () => {
    expect(() => new OrderId(null as unknown as string)).toThrow(
      DomainException,
    );
  });

  it("should be equal to identical OrderId", () => {
    const a = new OrderId("same");
    const b = new OrderId("same");
    expect(a.equals(b)).toBe(true);
  });
});
