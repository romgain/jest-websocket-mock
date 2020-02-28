import { Server, WebSocket, CloseOptions } from "mock-socket";
import Queue from "./queue";

const identity = (x: string) => x;
interface WSOptions {
  jsonProtocol?: boolean;
}
export type DeserializedMessage<TMessage = object> = string | TMessage;

// The WebSocket object passed to the `connection` callback is actually
// a WebSocket proxy that overrides the signature of the `close` method.
// To work around this inconsistency, we need to override the WebSocket
// interface. See https://github.com/romgain/jest-websocket-mock/issues/26#issuecomment-571579567
interface MockWebSocket extends Omit<WebSocket, "close"> {
  close(options?: CloseOptions): void;
}

export default class WS {
  server: Server;
  connected: Promise<WebSocket>;
  closed: Promise<{}>;
  serializer: (deserializedMessage: DeserializedMessage) => string;
  deserializer: (message: string) => DeserializedMessage;

  static instances: Array<WS> = [];
  messages: Array<DeserializedMessage> = [];
  messagesToConsume = new Queue();

  static clean() {
    WS.instances.forEach(instance => {
      instance.close();
      instance.messages = [];
    });
    WS.instances = [];
  }

  constructor(url: string, { jsonProtocol = false }: WSOptions = {}) {
    WS.instances.push(this);

    this.serializer = jsonProtocol ? JSON.stringify : identity;
    this.deserializer = jsonProtocol ? JSON.parse : identity;

    let connectionResolver: (socket: WebSocket) => void,
      closedResolver!: () => void;
    this.connected = new Promise(done => (connectionResolver = done));
    this.closed = new Promise(done => (closedResolver = done));

    this.server = new Server(url);

    this.server.on("close", closedResolver);

    this.server.on("connection", (socket: WebSocket) => {
      connectionResolver(socket);

      socket.on("message", message => {
        const parsedMessage = this.deserializer(message as string);
        this.messages.push(parsedMessage);
        this.messagesToConsume.put(parsedMessage);
      });
    });
  }

  on(
    eventName: "connection" | "message" | "close",
    callback: (socket: MockWebSocket) => void
  ): void {
    // @ts-ignore https://github.com/romgain/jest-websocket-mock/issues/26#issuecomment-571579567
    this.server.on(eventName, callback);
  }

  get nextMessage() {
    return this.messagesToConsume.get();
  }

  send(message: DeserializedMessage) {
    this.server.emit("message", this.serializer(message));
  }

  close(options?: CloseOptions) {
    this.server.close(options);
  }

  error() {
    this.server.emit("error", null);
    this.server.close();
  }
}
