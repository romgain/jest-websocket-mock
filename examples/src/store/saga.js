import { eventChannel } from "redux-saga";
import { call, fork, put, take, takeEvery } from "redux-saga/effects";
import { actions } from "./reducer";

function websocketInitChannel(connection) {
  return eventChannel(emitter => {
    connection.onmessage = e => {
      return emitter(actions.storeReceivedMessage(e.data));
    };
    return () => {
      // unsubscribe function
    };
  });
}

function* sendWebsocketMessages(connection) {
  while (true) {
    const { payload } = yield take(actions.sendToWebsocket);
    yield call([connection, connection.send], payload);
  }
}

function* disconnect(connection) {
  while (true) {
    yield take(actions.disconnect);
    yield call([connection, connection.close]);
  }
}

function* websocketSagas() {
  const connection = new WebSocket(`ws://${window.location.hostname}:8080`);
  const channel = yield call(websocketInitChannel, connection);
  yield fork(sendWebsocketMessages, connection);
  yield fork(disconnect, connection);
  while (true) {
    const action = yield take(channel);
    yield put(action);
  }
}

function* sendMessage({ payload }) {
  yield put(actions.storeSentMessage(payload));
  yield put(actions.sendToWebsocket(payload));
}

export default function* saga() {
  yield takeEvery(actions.send, sendMessage);
  yield fork(websocketSagas);
}
