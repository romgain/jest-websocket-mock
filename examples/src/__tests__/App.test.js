import React from "react";
import renderer from "react-test-renderer";
import App from "../App";

jest.mock("../Messages", () => "Messages");
jest.mock("../MessageInput", () => "MessageInput");

describe("The App component", () => {
  it("renders the app skeleton", () => {
    const component = renderer.create(<App />);
    expect(component).toMatchSnapshot();
  });
});
