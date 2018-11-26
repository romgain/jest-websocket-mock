import React from "react";
import renderer from "react-test-renderer";
import makeStore from "../store";
import { actions } from "../store/reducer";
import Messages from "../Messages";

describe("The Messages component", () => {
  it("renders the list of sent and received messages", () => {
    const store = makeStore();
    store.dispatch(actions.storeReceivedMessage("ping"));
    store.dispatch(actions.storeSentMessage("pong "));
    store.dispatch(actions.storeReceivedMessage("Oh hi Mark"));
    const component = renderer.create(<Messages store={store} />);
    expect(component).toMatchSnapshot();
  });
});
