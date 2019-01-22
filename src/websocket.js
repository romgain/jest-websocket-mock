import { Server } from "mock-socket";
import Queue from "./queue";

const identity = x => x;

export default class WS {
  static instances = [];
  messages = [];
  messagesToConsume = new Queue();

  static clean() {
    WS.instances.forEach(instance => {
      instance.close();
      instance.messages = [];
    });
    WS.instances = [];
  }

  constructor(url, { jsonProtocol = false } = {}) {
    WS.instances.push(this);

    this.serializer = jsonProtocol ? JSON.stringify : identity;
    this.deserializer = jsonProtocol ? JSON.parse : identity;

    let connectionResolver, closedResolver;
    this.connected = new Promise(done => (connectionResolver = done));
    this.closed = new Promise(done => (closedResolver = done));

    this.server = new Server(url);

    this.server.on("close", closedResolver);

    this.server.on("connection", socket => {
      connectionResolver();

      socket.on("message", message => {
        const parsedMessage = this.deserializer(message);
        this.messages.push(parsedMessage);
        this.messagesToConsume.put(parsedMessage);
      });
    });
  }

  get nextMessage() {
    return this.messagesToConsume.get();
  }

  send(message) {
    this.server.emit("message", this.serializer(message));
  }

  close() {
    this.server.emit("close");
    this.server.stop();
    this.server.close();
  }

  error() {
    this.server.emit("error");
    this.server.close();
  }
}
