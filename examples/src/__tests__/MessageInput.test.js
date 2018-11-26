import React from "react";
import renderer from "react-test-renderer";
import makeStore from "../store";
import { actions } from "../store/reducer";
import MessageInput from "../MessageInput";

describe("The MessageInput component", () => {
  it("renders a form", () => {
    const store = makeStore();
    const component = renderer.create(<MessageInput store={store} />);
    expect(component).toMatchSnapshot();
  });

  it("sends the message when submitting the form", () => {
    const store = makeStore();
    jest.spyOn(store, "dispatch").mockImplementation(jest.fn());
    const component = renderer.create(<MessageInput store={store} />);
    component.root
      .findByType("input")
      .props.onChange({ target: { value: "Hello there" } });
    component.root.findByType("form").props.onSubmit(new Event("submit"));
    expect(store.dispatch).toHaveBeenCalledWith(actions.send("Hello there"));
  });
});
