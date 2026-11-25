import React from 'react';

export const FireLogo = ({
  className = 'w-6 h-6',
  outerColor = 'var(--color-primary)',
  innerColor = '#FFFFFF',
  hasEyes = false,
  animatedEyes = false,
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
      {hasEyes && (
        <defs>
          <style>{`
            @keyframes fireEyeBlink {
              0%, 76%, 84%, 92%, 100% {
                transform: scaleY(1);
              }
              80% {
                transform: scaleY(0.06);
              }
              82% {
                transform: scaleY(1.08);
              }
              88% {
                transform: scaleY(0.06);
              }
              90% {
                transform: scaleY(1.06);
              }
            }
            .fire-eye-animated-left {
              transform-origin: 9.2px 13.0px;
              transform-box: fill-box;
              animation: fireEyeBlink 3.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
            }
            .fire-eye-animated-right {
              transform-origin: 14.8px 13.0px;
              transform-box: fill-box;
              animation: fireEyeBlink 3.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}</style>
        </defs>
      )}

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

      {/* Animated Expressive Eyes */}
      {hasEyes && (
        <g className="fire-mascot-face">
          {/* Left Eye */}
          <g className={animatedEyes ? 'fire-eye-animated-left' : ''}>
            {/* White Sclera with fine dark rim */}
            <ellipse
              cx="9.2"
              cy="13.0"
              rx="1.45"
              ry="2.1"
              fill="#FFFFFF"
              stroke="#0C0D11"
              strokeWidth="0.4"
            />
            {/* Dark Pupil */}
            <ellipse cx="9.4" cy="13.1" rx="0.95" ry="1.35" fill="#0C0D11" />
            {/* Main Sparkle Reflection */}
            <circle cx="9.8" cy="12.4" r="0.45" fill="#FFFFFF" />
            {/* Secondary tiny gleam */}
            <circle cx="8.9" cy="13.8" r="0.22" fill="#FFFFFF" />
          </g>

          {/* Right Eye */}
          <g className={animatedEyes ? 'fire-eye-animated-right' : ''}>
            {/* White Sclera with fine dark rim */}
            <ellipse
              cx="14.8"
              cy="13.0"
              rx="1.45"
              ry="2.1"
              fill="#FFFFFF"
              stroke="#0C0D11"
              strokeWidth="0.4"
            />
            {/* Dark Pupil */}
            <ellipse cx="14.6" cy="13.1" rx="0.95" ry="1.35" fill="#0C0D11" />
            {/* Main Sparkle Reflection */}
            <circle cx="15.2" cy="12.4" r="0.45" fill="#FFFFFF" />
            {/* Secondary tiny gleam */}
            <circle cx="14.3" cy="13.8" r="0.22" fill="#FFFFFF" />
          </g>

          {/* Subtle mascot smile */}
          <path
            d="M11.1 16.6C11.5 17.2 12.5 17.2 12.9 16.6"
            stroke="#0C0D11"
            strokeWidth="0.5"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
};

export default FireLogo;
