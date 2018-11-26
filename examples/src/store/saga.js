import { put, takeEvery } from "redux-saga/effects";
import { actions } from "./reducer";

function* sendMessage({ payload }) {
  console.log("sending ", payload);
  yield put(actions.storeSentMessage(payload));
}

export default function* saga() {
  yield takeEvery(actions.send.toString(), sendMessage);
}
