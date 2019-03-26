import { Server } from "mock-socket";
import Queue from "./queue";

const identity = (x: string) => x;
interface WSOptions {
  jsonProtocol?: boolean;
}
export type DeserializedMessage = string | Object;

export default class WS {
  server: Server;
  connected: Promise<{}>;
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

    let connectionResolver: () => void, closedResolver!: () => void;
    this.connected = new Promise(done => (connectionResolver = done));
    this.closed = new Promise(done => (closedResolver = done));

    this.server = new Server(url);

    this.server.on("close", closedResolver);

    this.server.on("connection", socket => {
      connectionResolver();

      socket.on("message", (message: string) => {
        const parsedMessage = this.deserializer(message);
        this.messages.push(parsedMessage);
        this.messagesToConsume.put(parsedMessage);
      });
    });
  }

  get nextMessage() {
    return this.messagesToConsume.get();
  }

  send(message: DeserializedMessage) {
    this.server.emit("message", this.serializer(message));
  }

  close() {
    this.server.emit("close", null);
    this.server.stop();
    this.server.close();
  }

  error() {
    this.server.emit("error", null);
    this.server.close();
  }
}
