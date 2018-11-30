import { Server } from "mock-socket";

export default class WS {
  static instances = [];
  messages = [];

  static clean() {
    WS.instances.forEach(instance => {
      instance.server.stop();
      instance.server.close();
    });
  }

  constructor(url) {
    WS.instances.push(this);

    let connectionResolver, nextMessageResolver, closedResolver;
    this.connected = new Promise(done => (connectionResolver = done));
    this.nextMessage = new Promise(done => (nextMessageResolver = done));
    this.closed = new Promise(done => (closedResolver = done));

    this.server = new Server(url);

    this.server.on("connection", socket => {
      socket.send("Hello there");
      connectionResolver();

      socket.on("message", message => {
        nextMessageResolver();
        this.nextMessage = new Promise(done => (nextMessageResolver = done));
        this.messages.push(message);
      });

      socket.on("close", closedResolver);
    });
  }

  send(message) {
    this.server.emit("message", message);
  }
}
