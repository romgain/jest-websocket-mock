import { Server } from "mock-socket";

const identity = x => x;

export default class WS {
  static instances = [];
  messages = [];

  static clean() {
    WS.instances.forEach(instance => {
      instance.server.stop();
      instance.server.close();
      instance.messages = [];
    });
    WS.instances = [];
  }

  constructor(url, { jsonProtocol = false } = {}) {
    WS.instances.push(this);

    this.serializer = jsonProtocol ? JSON.stringify : identity;
    this.deserializer = jsonProtocol ? JSON.parse : identity;

    let connectionResolver, nextMessageResolver, closedResolver;
    this.connected = new Promise(done => (connectionResolver = done));
    this.nextMessage = new Promise(done => (nextMessageResolver = done));
    this.closed = new Promise(done => (closedResolver = done));

    this.server = new Server(url);

    this.server.on("close", closedResolver);

    this.server.on("connection", socket => {
      connectionResolver();

      socket.on("message", message => {
        const parsedMessage = this.deserializer(message);
        nextMessageResolver(parsedMessage);
        this.nextMessage = new Promise(done => (nextMessageResolver = done));
        this.messages.push(parsedMessage);
      });
    });
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
