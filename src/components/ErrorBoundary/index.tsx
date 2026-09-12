import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Result } from 'antd';

import Button from 'components/Button';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <Result
            status="error"
            title="Something went wrong"
            subTitle="Try refreshing the page. If the problem continues, come back later."
            extra={
              <Button
                type="button"
                status="primary"
                onClick={() => {
                  this.setState({ error: null });
                  window.location.reload();
                }}
              >
                Refresh page
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
