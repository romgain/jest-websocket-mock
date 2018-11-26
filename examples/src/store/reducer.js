import { createActions, handleActions, combineActions } from "redux-actions";

const defaultState = {
  messages: [
    { text: "hello", side: "received" },
    { text: "how are you?", side: "received" }
  ]
};

export const actions = createActions({
  STORE_SENT_MESSAGE: text => ({ text, side: "sent" }),
  STORE_RECEIVED_MESSAGE: text => ({ text, side: "received" }),
  SEND: undefined,
  RECEIVE: undefined
});

const reducer = handleActions(
  {
    [combineActions(actions.storeReceivedMessage, actions.storeSentMessage)]: (
      state,
      { payload }
    ) => ({ ...state, messages: [...state.messages, payload] })
  },
  defaultState
);

export default reducer;
