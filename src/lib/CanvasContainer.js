import React, { forwardRef, useRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import { isDefined, getLogger } from "./utils";

const log = getLogger("CanvasContainer");

const CanvasContainer = forwardRef((props, ref) => {
  const { width, height, type, zIndex, ratio } = props;
  const drawCanvas = useRef({});

  // Ref'lenen node'ları sakla veya temizle
  const setDrawCanvas = node => {
    if (node) {
      drawCanvas.current[node.id] = node.getContext("2d");
    } else {
      drawCanvas.current = {};
    }
  };

  // Ebeveynden erişilmek üzere getCanvasContexts fonksiyonunu sağlayın
  useImperativeHandle(ref, () => ({
    getCanvasContexts: () => {
      if (isDefined(drawCanvas.current.axes)) {
        return drawCanvas.current;
      }
    }
  }));

  if (type === "svg") return null;

  log("using ratio", ratio);

  return (
    <div style={{ position: "absolute", zIndex }}>
      <canvas
        id="bg"
        ref={setDrawCanvas}
        width={width * ratio}
        height={height * ratio}
        style={{ position: "absolute", width, height }}
      />
      <canvas
        id="axes"
        ref={setDrawCanvas}
        width={width * ratio}
        height={height * ratio}
        style={{ position: "absolute", width, height }}
      />
      <canvas
        id="mouseCoord"
        ref={setDrawCanvas}
        width={width * ratio}
        height={height * ratio}
        style={{ position: "absolute", width, height }}
      />
    </div>
  );
});

CanvasContainer.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  zIndex: PropTypes.number,
  ratio: PropTypes.number.isRequired,
};

export default CanvasContainer;
