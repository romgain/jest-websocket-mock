# Jest websocket mock
[![Build Status](https://travis-ci.org/romgain/jest-websocket-mock.svg?branch=master)](https://travis-ci.org/romgain/jest-websocket-mock)
[![npm version](https://badge.fury.io/js/jest-websocket-mock.svg)](https://badge.fury.io/js/jest-websocket-mock)

A set of utilities and Jest matchers to help testing complex websocket interactions.

## Install
[Mock Socket](https://github.com/thoov/mock-socket) is a peer dependency and
needs to be installed alongside `jest-websocket-mock`:

```bash
npm install --save-dev jest-websocket-mock mock-socket
```

## Usage
`jest-websocket-mock` offers various utilities to mock out websocket servers
and run assertions on the received messages.

### Read messages as they are received by the mock server
```js
import WS from "jest-websocket-mock";

test("the server keeps track of received messages, and yields them as they come in", async () => {
  const server = new WS("ws://localhost:1234");
  const client = new WebSocket("ws://localhost:1234");

  await server.connected;
  client.send("hello");
  const message = await server.nextMessage;
  expect(message).toBe("hello");
  expect(server.messages).toEqual(["hello"]);
});
```

### Send messages to the connected clients
```js
import WS from "jest-websocket-mock";

test("the mock server sends messages to connected clients", async () => {
  const server = new WS("ws://localhost:1234");
  const client1 = new WebSocket("ws://localhost:1234");
  await server.connected;
  const client2 = new WebSocket("ws://localhost:1234");
  await server.connected;

  const messages = { client1: [], client2: [] };
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
```

### JSON protocols support
`jest-websocket-mock` can also automatically serialize and deserialize
JSON message:

```js
import WS from "jest-websocket-mock";

test("the mock server seamlessly handles JSON protocols", async () => {
  const server = new WS("ws://localhost:1234", { jsonProtocol: true });
  const client = new WebSocket("ws://localhost:1234");

  await server.connected;
  client.send(`{ "type": "GREETING", "payload": "hello" }`);
  const received = await server.nextMessage;
  expect(received).toEqual({ type: "GREETING", payload: "hello" });
  expect(server.messages).toEqual([{ type: "GREETING", payload: "hello" }]);

  let message = null;
  client.onmessage = e => {
    message = e.data;
  };

  server.send({ type: "CHITCHAT", payload: "Nice weather today" });
  expect(message).toEqual(
    `{"type":"CHITCHAT","payload":"Nice weather today"}`
  );
});
```

### Sending errors
```js
import WS from "jest-websocket-mock";

test("the mock server sends errors to connected clients", async () => {
  const server = new WS("ws://localhost:1234");
  const client = new WebSocket("ws://localhost:1234");
  await server.connected;

  let disconnected = false;
  let error = null;
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
```

### Environment set up and tear down between tests
You can set up a mock server and tear it down between test:
```js
import WS from "jest-websocket-mock";

beforeEach(async () => {
  ws = new WS("ws://localhost:1234");
  await ws.connected;
  ws.send("Connected!");
});

afterEach(() => {
  WS.clean();
});
```
