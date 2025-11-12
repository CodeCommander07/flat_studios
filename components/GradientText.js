export default function GradientText({
  children,
  className = '',
  colors = ['#ffaa40', '#9c40ff', '#ffaa40'],
  animationSpeed = 8,
  showBorder = false,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    backgroundSize: '300% 100%',
    backgroundPosition: '0% 50%',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center px-4 py-2 rounded-[1.25rem] font-semibold transition-shadow duration-500 overflow-hidden ${className}`}
    >
      {/* Optional animated gradient border */}
      {showBorder && (
        <div
          className="absolute inset-0 rounded-[1.25rem] animate-gradient"
          style={{
            ...gradientStyle,
            animationDuration: `${animationSpeed}s`,
          }}
        ></div>
      )}

      {/* Inner mask if border is shown */}
      {showBorder && (
        <div className="absolute inset-[2px] bg-[#0b0b0b] rounded-[1.1rem] z-0"></div>
      )}

      {/* Animated text */}
      <span
        className="relative z-10 text-transparent bg-clip-text animate-gradient"
        style={{
          ...gradientStyle,
          WebkitBackgroundClip: 'text',
          animationDuration: `${animationSpeed}s`,
        }}
      >
        {children}
      </span>
    </div>
  );
}
