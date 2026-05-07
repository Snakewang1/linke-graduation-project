import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">!</span>
            </div>
            <h3 className="text-lg font-bold text-slate-700">页面加载异常</h3>
            <p className="text-sm text-slate-500">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm"
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
