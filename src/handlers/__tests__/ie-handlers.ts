import * as assert from "power-assert";
import { ensureHandler, inputHandler, waitHandler } from "../ie-handlers";

describe("inputHandler", () => {
  test("input.value", done => {
    return inputHandler(
      {
        findElement: async () => {
          return {
            sendKeys: async value => {
              assert.strictEqual(value, "test");
              done();
            }
          };
        }
      } as any,
      {
        action: {
          form: {
            value: "test"
          }
        }
      } as any
    );
  });

  test("input.value.faker", done => {
    return inputHandler(
      {
        findElement: async () => {
          return {
            sendKeys: async value => {
              assert(value, "test");
              done();
            }
          };
        }
      } as any,
      {
        action: {
          form: {
            value: {
              faker: "name.lastName"
            }
          }
        }
      } as any
    );
  });

  test("input.value.date", done => {
    return inputHandler(
      {
        findElement: async () => {
          return {
            sendKeys: async value => {
              assert(value, "test");
              done();
            }
          };
        }
      } as any,
      {
        action: {
          form: {
            value: {
              date: "2016/01/02"
            }
          }
        }
      } as any
    );
  });

  test("input.constraint.regexp", done => {
    return inputHandler(
      {
        findElement: async () => {
          return {
            sendKeys: async value => {
              assert(value, "test");
              done();
            }
          };
        }
      } as any,
      {
        action: {
          form: {
            constrains: {
              regexp: /test/
            }
          }
        }
      } as any
    );
  });
});

describe("waitHandler", () => {
  test("duration", done => {
    return waitHandler(
      {
        sleep: async duration => {
          assert.strictEqual(duration, 5000);
          done();
        }
      } as any,
      {
        action: {
          duration: 5000
        }
      } as any
    );
  });
});

describe("ensureHandler", () => {
  test("location.value", () => {
    return ensureHandler(
      {
        getCurrentUrl: async () => {
          return "http://test.com";
        }
      } as any,
      {
        action: {
          location: "http://test.com"
        }
      } as any
    );
  });

  test("location.regexp", () => {
    return ensureHandler(
      {
        getCurrentUrl: async () => {
          return "http://test.com/123";
        }
      } as any,
      {
        action: {
          location: {
            regexp: /http:\/\/test.com\/[0-9]+/
          }
        }
      } as any
    );
  });
});
