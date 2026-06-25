import { ReactNode, Component, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-dark-base">
          <div className={clsx(
            'bg-surface-dark-elevated rounded-lg border border-outline-dark shadow-elevated',
            'p-lg max-w-md w-full mx-md'
          )}>
            <div className={clsx(
              'flex items-center justify-center w-12 h-12 mx-auto',
              'bg-error/20 rounded-full mb-lg'
            )}>
              <AlertTriangle className="w-6 h-6 text-error" />
            </div>

            <h1 className="text-center text-title-md font-semibold text-on-surface-dark mb-sm font-inter">
              Something went wrong
            </h1>

            <p className="text-center text-outline mb-lg text-body-md font-inter">
              We encountered an unexpected error. Please refresh the page to try again.
            </p>

            {this.state.error && (
              <div className="bg-error/20 border border-error rounded-md p-md mb-lg">
                <p className="text-xs font-mono text-on-surface-dark break-words font-geist">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className={clsx(
                'w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-md rounded-md',
                'transition-colors duration-200'
              )}
            >
              Refresh Page
            </button>

            <button
              onClick={() => window.history.back()}
              className={clsx(
                'w-full mt-md text-primary-400 hover:text-primary-300 font-semibold py-md',
                'transition-colors duration-200'
              )}
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
