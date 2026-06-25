interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white';
}

export default function Spinner({ size = 'md', color = 'blue' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div
      className={`inline-block border-4 rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
    />
  );
}
