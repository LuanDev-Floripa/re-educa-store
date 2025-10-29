import React from 'react';

export const Label = ({ children, ...props }) => (
  <label {...props}>
    {children}
  </label>
);