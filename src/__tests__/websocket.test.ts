import WS from "../websocket";

describe("The WS helper", () => {
  afterEach(() => {
    WS.clean();
  });

  it("keeps track of received messages, and yields them as they come in", async () => {
    const server = new WS("ws://localhost:1234");
    const client = new WebSocket("ws://localhost:1234");

    await server.connected;
    client.send("hello");
    const message = await server.nextMessage;
    expect(message).toBe("hello");
    expect(server.messages).toEqual(["hello"]);
  });

  it("cleans up connected clients and messages on 'clean'", async () => {
    const server = new WS("ws://localhost:1234");
    const client1 = new WebSocket("ws://localhost:1234");
    await server.connected;
    const client2 = new WebSocket("ws://localhost:1234");
    await server.connected;

    const connections = { client1: true, client2: true };
    const onclose = (name: "client1" | "client2") => () => {
      connections[name] = false;
    };
    client1.onclose = onclose("client1");
    client2.onclose = onclose("client2");

    client1.send("hello 1");
    await server.nextMessage;
    client2.send("hello 2");
    await server.nextMessage;
    expect(server.messages).toEqual(["hello 1", "hello 2"]);

    WS.clean();
    expect(WS.instances).toEqual([]);
    expect(server.messages).toEqual([]);
    expect(connections).toEqual({ client1: false, client2: false });
  });

  it("handles messages received in a quick succession", async () => {
    expect.hasAssertions();
    const server = new WS("ws://localhost:1234");
    const client = new WebSocket("ws://localhost:1234");
    await server.connected;

    "abcdef".split("").forEach(client.send.bind(client));

    let waitedEnough: () => void;
    const waitABit = new Promise(done => (waitedEnough = done));

    setTimeout(async () => {
      await server.nextMessage;
      await server.nextMessage;
      await server.nextMessage;
      await server.nextMessage;
      await server.nextMessage;
      await server.nextMessage;

      "xyz".split("").forEach(client.send.bind(client));
      await server.nextMessage;
      await server.nextMessage;
      await server.nextMessage;
      waitedEnough();
    }, 500);

    await waitABit;
    expect(server.messages).toEqual("abcdefxyz".split(""));
  });

  it("sends messages to connected clients", async () => {
    const server = new WS("ws://localhost:1234");
    const client1 = new WebSocket("ws://localhost:1234");
    await server.connected;
    const client2 = new WebSocket("ws://localhost:1234");
    await server.connected;

    interface Messages {
      client1: Array<string>;
      client2: Array<string>;
    }
    const messages: Messages = { client1: [], client2: [] };
    client1.onmessage = e => {
      messages.client1.push(e.data);
    };
    client2.onmessage = e => {
      messages.client2.push(e.data);
    };

    server.send("hello everyone");
    expect(messages).toEqual({
      client1: ["hello everyone"],
      client2: ["hello everyone"],
    });
  });

  it("seamlessly handles JSON protocols", async () => {
    const server = new WS("ws://localhost:1234", { jsonProtocol: true });
    const client = new WebSocket("ws://localhost:1234");

    await server.connected;
    client.send(`{ "type": "GREETING", "payload": "hello" }`);
    const received = await server.nextMessage;
    expect(server.messages).toEqual([{ type: "GREETING", payload: "hello" }]);
    expect(received).toEqual({ type: "GREETING", payload: "hello" });

    let message = null;
    client.onmessage = e => {
      message = e.data;
    };

    server.send({ type: "CHITCHAT", payload: "Nice weather today" });
    expect(message).toEqual(
      `{"type":"CHITCHAT","payload":"Nice weather today"}`
    );
  });

  it("closes the connection", async () => {
    const server = new WS("ws://localhost:1234");
    const client = new WebSocket("ws://localhost:1234");
    await server.connected;

    let disconnected = false;
    client.onclose = () => {
      disconnected = true;
    };

    server.send("hello everyone");
    server.close();
    expect(disconnected).toBe(true);

    // ensure that the WebSocket mock set up by mock-socket is still present
    expect(WebSocket).toBeDefined();
  });

  it("sends errors to connected clients", async () => {
    const server = new WS("ws://localhost:1234");
    const client = new WebSocket("ws://localhost:1234");
    await server.connected;

    let disconnected = false;
    let error: any; // bad types in MockSockets
    client.onclose = () => {
      disconnected = true;
    };
    client.onerror = e => {
      error = e;
    };

    server.send("hello everyone");
    server.error();
    expect(disconnected).toBe(true);
    expect(error.origin).toBe("ws://localhost:1234/");
    expect(error.type).toBe("error");
  });

  it("resolves the client socket that connected", async () => {
    const server = new WS("ws://localhost:1234");
    const client = new WebSocket("ws://localhost:1234");

    const socket = await server.connected;

    expect(socket).toStrictEqual(client);
  });
});
