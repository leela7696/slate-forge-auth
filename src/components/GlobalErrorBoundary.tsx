import React from "react";
import Error500 from "@/pages/Error500";

interface GlobalErrorBoundaryState {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class GlobalErrorBoundary extends React.Component<React.PropsWithChildren, GlobalErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Unhandled UI error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      return <Error500 message={this.state.error.message} onTryAgain={this.handleReset} />;
    }
    return this.props.children as React.ReactElement;
  }
}

