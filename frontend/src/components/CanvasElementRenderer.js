import React from "react";
import { useRuntimeProps } from "../hooks/useRuntimeProps";

export default function CanvasElementRenderer({
  Component,
  element,
  binding
}) {

  const props =
    useRuntimeProps(
      element.props || {}
    );


  return (
    <Component
      id={element.id}
      {...props}
      binding={binding}
    />
  );
}