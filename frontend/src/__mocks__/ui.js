// Mocks para componentes UI
import React from 'react';

export const Button = ({ children, onClick, ...props }) => (
  <button onClick={onClick} {...props}>
    {children}
  </button>
);

export const Input = ({ ...props }) => (
  <input {...props} />
);

export const Card = ({ children, ...props }) => (
  <div {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, ...props }) => (
  <div {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, ...props }) => (
  <h3 {...props}>
    {children}
  </h3>
);

export const CardContent = ({ children, ...props }) => (
  <div {...props}>
    {children}
  </div>
);

export const CardDescription = ({ children, ...props }) => (
  <p {...props}>
    {children}
  </p>
);

export const Progress = ({ value, max, ...props }) => (
  <progress value={value} max={max} {...props} />
);

export const Badge = ({ children, ...props }) => (
  <span {...props}>
    {children}
  </span>
);

export const Select = ({ children, ...props }) => (
  <select {...props}>
    {children}
  </select>
);

export const SelectContent = ({ children, ...props }) => (
  <div {...props}>
    {children}
  </div>
);

export const SelectItem = ({ children, ...props }) => (
  <option {...props}>
    {children}
  </option>
);

export const SelectTrigger = ({ children, ...props }) => (
  <div {...props}>
    {children}
  </div>
);

export const SelectValue = ({ children, ...props }) => (
  <span {...props}>
    {children}
  </span>
);

export const Label = ({ children, ...props }) => (
  <label {...props}>
    {children}
  </label>
);

export const Textarea = ({ ...props }) => (
  <textarea {...props} />
);

export const Checkbox = ({ ...props }) => (
  <input type="checkbox" {...props} />
);