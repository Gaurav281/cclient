import React from 'react';

export const FireLogo = ({
  className = 'w-6 h-6',
  outerColor = 'var(--color-primary)',
  innerColor = '#FFFFFF',
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer Flame Contour */}
      <path
        d="M12 2C10.2 4.8 9.2 7.2 9.2 9.6C9.2 10.4 9.5 11.1 9.9 11.7C8.1 10.6 7 8.7 7 6.6C5.1 8.9 4 11.8 4 15C4 19.4 7.6 23 12 23C16.4 23 20 19.4 20 15C20 11.2 17.6 7.8 15 4.5C13.8 3 12.8 1.8 12 2Z"
        fill={outerColor}
      />

      {/* Mid Flame Aerodynamic Accent */}
      <path
        d="M12 6.5C11.1 8.2 10.2 9.8 10.2 11.8C10.2 13.0 10.8 13.8 11.6 14.2C10.7 13.0 10.6 11.6 11.2 10.2C11.6 9.2 12 8.0 12 6.5Z"
        fill="rgba(255, 255, 255, 0.22)"
      />

      {/* Inner Radiant Core Flame */}
      <path
        d="M12 12.2C10.8 13.8 9.8 15.3 9.8 16.9C9.8 18.7 10.8 20.2 12 20.2C13.2 20.2 14.2 18.7 14.2 16.9C14.2 15.3 13.2 13.8 12 12.2Z"
        fill={innerColor}
      />
    </svg>
  );
};

export default FireLogo;
