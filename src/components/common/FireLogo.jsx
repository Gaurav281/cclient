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
      {/* Outer Flame */}
      <path
        d="M12 2C10.2 4.8 9.2 7.2 9.2 9.6C9.2 10.4 9.5 11.1 9.9 11.7C8.1 10.6 7 8.7 7 6.6C5.1 8.9 4 11.8 4 15C4 19.4 7.6 23 12 23C16.4 23 20 19.4 20 15C20 11.2 17.6 7.8 15 4.5C13.8 3 12.8 1.8 12 2Z"
        fill={outerColor}
      />
      {/* Inner Flame Core */}
      <path
        d="M12 13C11 14.5 9.8 16 9.8 17.4C9.8 19.1 10.8 20.2 12 20.2C13.2 20.2 14.2 19.1 14.2 17.4C14.2 16 13 14.5 12 13Z"
        fill={innerColor}
      />
    </svg>
  );
};

export default FireLogo;
