/**
 * @copyright Romain Bertrand 2018
 */

import ReactDOM from "react-dom";
import "..";

jest.mock("react-dom");

describe("The index", () => {
  it("can be imported without errors", () => {
    expect(ReactDOM.render).toHaveBeenCalled();
  });
});
