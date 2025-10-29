import React from 'react';

export const Badge = ({ children, ...props }) => (
  <span {...props}>
    {children}
  </span>
);