// src/lib/utils/PureComponent.js
// This module defines a PureComponent that implements a shallow comparison for props, state, and context to optimize rendering in React applications.
// PureComponent.js

import React from "react";
import shallowEqual from "./shallowEqual";

class PureComponent extends React.Component {
	shouldComponentUpdate(nextProps, nextState, nextContext) {
		return !shallowEqual(this.props, nextProps)
			|| !shallowEqual(this.state, nextState)
			|| !shallowEqual(this.context, nextContext);
	}
}

export default PureComponent;
