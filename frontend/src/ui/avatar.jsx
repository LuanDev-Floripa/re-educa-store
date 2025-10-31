import React from "react";

export const Avatar = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const AvatarImage = ({ ...props }) => <img {...props} />;

export const AvatarFallback = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
