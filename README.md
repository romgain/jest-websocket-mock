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

## Mock a websocket server
### The `WS` constructor

`jest-websocket-mock` exposes a `WS` class that can instantiate mock websocket
servers that keep track of the messages they receive, and in turn
can send messages to connected clients.

```js
import WS from "jest-websocket-mock";

// create a WS instance, listening to port 1234 on localhost
const server = new WS("ws://localhost:1234");

// real clients can connect
const client = new WebSocket("ws://localhost:1234");
await server.connected; // wait for the server to have established the connection

// the mock websocket server will record all the messages it receives
client.send("hello");

// the mock websocket server can also send messages to all connected clients
server.send("hello everyone");

// ...simulate an error and close the connection
server.error();

// ...or gracefully close the connection
server.close();

// The WS class also has a static "clean" method to gracefully close all open connections,
// particularly useful to reset the environment between test runs.
WS.clean();
```

The `WS` constructor also accepts an optional options object as second argument.
The only supported option is `jsonProtocol: true`, to tell the mock websocket
server to automatically serialize and deserialize JSON messages:

```js
const server = new WS("ws://localhost:1234", { jsonProtocol: true });
server.send({ type: "GREETING", payload: "hello" });
```
### Attributes of a `WS` instance
A `WS` instance has the following attributes:

* `connected`: a Promise that resolves every time the `WS` instance receives a
new connection.
* `closed`: a Promise that resolves every time a connection to a `WS` instance
is closed.
* `nextMessage`: a Promise that resolves every time a `WS` instance receives a
new message. The resolved value is the received message (deserialized as a
JavaScript Object if the `WS` was instantiated with the `{ jsonProtocol: true }`
option).

### Methods on a `WS` instance
* `send`: send a message to all connected clients. (The message will be
serialized from a JavaScript Object to a JSON string if the `WS` was
instantiated with the `{ jsonProtocol: true }` option).
* `close`: gracefully closes all opened connections.
* `error`: sends an error message to all connected clients and closes all
opened connections.


## Run assertions on received messages
`jest-websocket-mock` registers custom jest matchers to make assertions
on received messages easier:

* `.toReceiveMessage`: async matcher that waits for the next message received
by the the mock websocket server, and asserts its content. It will time out
with a helpful message after 1000ms.
* `.toHaveReceivedMessages`: synchronous matcher that checks that all the
expected messages have been received by the mock websocket server.


### Run assertions on messages as they are received by the mock server
```js
test("the server keeps track of received messages, and yields them as they come in", async () => {
  const server = new WS("ws://localhost:1234");
  const client = new WebSocket("ws://localhost:1234");

  await server.connected;
  client.send("hello");
  await expect(server).toReceiveMessage("hello");
  expect(server).toHaveReceivedMessages(["hello"]);
});
```

### Send messages to the connected clients
```js
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
JSON messages:

```js
test("the mock server seamlessly handles JSON protocols", async () => {
  const server = new WS("ws://localhost:1234", { jsonProtocol: true });
  const client = new WebSocket("ws://localhost:1234");

  await server.connected;
  client.send(`{ "type": "GREETING", "payload": "hello" }`);
  await expect(server).toReceiveMessage({ type: "GREETING", payload: "hello" });
  expect(server).toHaveReceivedMessages([{ type: "GREETING", payload: "hello" }]);

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
beforeEach(async () => {
  ws = new WS("ws://localhost:1234");
  await ws.connected;
  ws.send("Connected!");
});

afterEach(() => {
  WS.clean();
});
```

## Examples
For a real life example, see the
[examples directory](https://github.com/romgain/jest-websocket-mock/tree/master/examples),
and in particular the saga tests.
