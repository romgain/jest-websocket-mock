import { createActions, handleActions, combineActions } from "redux-actions";

const defaultState = {
  messages: [],
};

export const actions = createActions({
  STORE_SENT_MESSAGE: text => ({ text, side: "sent" }),
  STORE_RECEIVED_MESSAGE: text => ({ text, side: "received" }),
  SEND: undefined,
  DISCONNECT: undefined,
});

const reducer = handleActions(
  {
    [combineActions(actions.storeReceivedMessage, actions.storeSentMessage)]: (
      state,
      { payload }
    ) => ({ ...state, messages: [...state.messages, payload] }),
  },
  defaultState
);

export default reducer;
