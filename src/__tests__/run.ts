import { default as produce } from "immer";
import * as assert from "power-assert";
import { handleAction } from "../run";

describe("handleAction", () => {
  test("reduce context", async () => {
    const result = await handleAction(
      0,
      {} as any,
      {
        action1: async (page, action, { context }) => {
          assert.deepStrictEqual(context, {
            currentIteration: 0,
            steps: []
          });
          return { value: "action1" };
        },
        action2: async (page, action, { context }) => {
          assert.deepStrictEqual(context, {
            currentIteration: 0,
            steps: [{ value: "action1" }]
          });
          return { value: "action2" };
        },
        action3: async (page, action, { context }) => {
          assert.deepStrictEqual(context, {
            currentIteration: 0,
            steps: [{ value: "action1" }, { value: "action2" }]
          });
          return { value: "action3" };
        }
      } as any,
      [
        { action: { type: "action1" } },
        { action: { type: "action2" } },
        { action: { type: "action3" } }
      ] as any,
      {
        context: {
          currentIteration: 0,
          steps: []
        }
      } as any,
      (ctx, res) => {
        return produce(ctx, draft => {
          draft.steps.push(res);
        });
      }
    );

    assert.deepStrictEqual(result, {
      currentIteration: 0,
      steps: [{ value: "action1" }, { value: "action2" }, { value: "action3" }]
    });
  });
});
