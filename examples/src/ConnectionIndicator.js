import React from "react";
import { connect } from "react-redux";

const ConnectionIndicator = ({ connected }) => (
  <div
    className={
      connected
        ? "ConnectionIndicator ConnectionIndicator--connected"
        : "ConnectionIndicator ConnectionIndicator--disconnected"
    }
  />
);

export default connect(state => ({ connected: state.connected }))(
  ConnectionIndicator
);
