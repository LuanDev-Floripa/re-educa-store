import React from "react";

export const Progress = ({ value, max, ...props }) => (
  <progress value={value} max={max} {...props} />
);
