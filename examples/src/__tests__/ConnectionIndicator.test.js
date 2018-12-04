import React from "react";
import renderer from "react-test-renderer";
import makeStore from "../store";
import { actions } from "../store/reducer";
import ConnectionIndicator from "../ConnectionIndicator";

describe("The ConnectionIndicator component", () => {
  it("renders a green dot when successfully connected", () => {
    const store = makeStore();
    store.dispatch(actions.connectionSuccess());
    const component = renderer.create(<ConnectionIndicator store={store} />);
    expect(component).toMatchSnapshot();
  });

  it("renders a red dot when not connected", () => {
    const store = makeStore();
    store.dispatch(actions.connectionLost());
    const component = renderer.create(<ConnectionIndicator store={store} />);
    expect(component).toMatchSnapshot();
  });
});
