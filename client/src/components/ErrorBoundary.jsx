import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="text-center py-10 text-sm text-gray-400">
            Something went wrong rendering this section.
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
