import diff from "jest-diff";
import WS from "./websocket";

const WAIT_DELAY = 1000;
const TIMEOUT = Symbol("timoeut");

expect.extend({
  async toReceiveMessage(ws, expected) {
    const isWS = ws instanceof WS;

    if (!isWS) {
      return {
        pass: this.isNot, // always fail
        message: () =>
          this.utils.matcherHint(
            this.isNot ? ".not.toReceiveMessage" : ".toReceiveMessage",
            "WS",
            "expected"
          ) +
          "\n\n" +
          `Expected the websocket object to be a valid WS mock.\n` +
          `Received: ${typeof ws}\n` +
          `  ${this.utils.printReceived(ws)}`,
      };
    }

    const messageOrTimeout = await Promise.race([
      ws.nextMessage,
      new Promise(resolve => setTimeout(() => resolve(TIMEOUT), WAIT_DELAY)),
    ]);

    if (messageOrTimeout === TIMEOUT) {
      return {
        pass: this.isNot, // always fail
        message: () =>
          this.utils.matcherHint(
            this.isNot ? ".not.toReceiveMessage" : ".toReceiveMessage",
            "WS",
            "expected"
          ) +
          "\n\n" +
          `Expected the websocket server to receive a message,\n` +
          `but it didn't receive anything in ${WAIT_DELAY}ms.`,
      };
    }
    const received = messageOrTimeout;

    const pass = this.equals(received, expected);

    const message = pass
      ? () =>
          this.utils.matcherHint(".not.toReceiveMessage", "WS", "expected") +
          "\n\n" +
          `Expected the next received message to not equal:\n` +
          `  ${this.utils.printExpected(expected)}\n` +
          `Received:\n` +
          `  ${this.utils.printReceived(received)}`
      : () => {
          const diffString = diff(expected, received, { expand: this.expand });
          return (
            this.utils.matcherHint(".toReceiveMessage", "WS", "expected") +
            "\n\n" +
            `Expected the next received message to equal:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(received)}\n\n` +
            `Difference:\n\n${diffString}`
          );
        };

    return {
      actual: received,
      expected,
      message,
      name: "toReceiveMessage",
      pass,
    };
  },
});
