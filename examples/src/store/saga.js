import { eventChannel } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";
import { actions } from "./reducer";

function websocketInitChannel(connection) {
  return eventChannel(emitter => {
    connection.onmessage = e => {
      return emitter(actions.storeReceivedMessage(e.data));
    };
    return () => {
      // unsubscribe function
      connection.close();
    };
  });
}

function* sendMessage(connection) {
  while (true) {
    const { payload } = yield take(actions.send);
    yield put(actions.storeSentMessage(payload));
    yield call([connection, connection.send], payload);
  }
}

function* disconnect(channel) {
  yield take(actions.disconnect);
  channel.close();
}

export default function* saga() {
  const connection = new WebSocket(`ws://${window.location.hostname}:8080`);
  const channel = yield call(websocketInitChannel, connection);
  yield fork(sendMessage, connection);
  yield fork(disconnect, channel);
  while (true) {
    const action = yield take(channel);
    yield put(action);
  }
}
