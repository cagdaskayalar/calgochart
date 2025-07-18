// src/lib/helper/TypeChooser.js
// This module provides a TypeChooser component that allows users to select between different chart types (e.g., SVG or hybrid).
// TypeChooser.js

import React, { useState } from "react";
import PropTypes from "prop-types";

function TypeChooser({ type: initialType, children, style }) {
  const [type, setType] = useState(initialType);

  function handleTypeChange(e) {
    setType(e.target.value);
  }

  return (
    <div>
      <label htmlFor="type">Type: </label>
      <select name="type" id="type" onChange={handleTypeChange} value={type}>
        <option value="svg">svg</option>
        <option value="hybrid">canvas + svg</option>
      </select>
      <div style={style}>
        {children(type)}
      </div>
    </div>
  );
}

TypeChooser.propTypes = {
  type: PropTypes.oneOf(["svg", "hybrid"]),
  children: PropTypes.func.isRequired,
  style: PropTypes.object,
};

TypeChooser.defaultProps = {
  type: "hybrid",
  style: {},
};

export default TypeChooser;
