import WS from "../../../src";
import makeStore from "../store";
import { actions } from "../store/reducer";

let ws, store;
beforeEach(async () => {
  ws = new WS("ws://localhost:8080");
  store = makeStore();
  await ws.connected;
});
afterEach(() => {
  WS.clean();
});

describe("The saga", () => {
  it("connects to the websocket server", () => {
    expect(store.getState().messages).toEqual([
      { side: "received", text: "Hello there" },
    ]);
  });

  it("stores new messages", () => {
    ws.send("how you doin?");
    expect(store.getState().messages).toEqual([
      { side: "received", text: "Hello there" },
      { side: "received", text: "how you doin?" },
    ]);
  });

  it("sends messages", async () => {
    store.dispatch(actions.send("oh hi Mark"));
    await ws.nextMessage;

    expect(ws.messages).toEqual(["oh hi Mark"]);
    expect(store.getState().messages).toEqual([
      { side: "received", text: "Hello there" },
      { side: "sent", text: "oh hi Mark" },
    ]);
  });

  it("cleanly disconnects from the websocket server", async () => {
    store.dispatch(actions.disconnect());
    await ws.closed;
  });
});
