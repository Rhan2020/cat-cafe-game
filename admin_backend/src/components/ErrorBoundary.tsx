import React from 'react';
import { Result, Button } from 'antd';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('错误边界捕获到错误:', error, errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo
    });

    // 在生产环境中，可以将错误发送到错误监控服务
    if (process.env.NODE_ENV === 'production') {
      // 例如发送到 Sentry
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReload = () => {
    window.location.reload();
  }

  handleGoHome = () => {
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <Result
            status="error"
            title="应用程序出现了错误"
            subTitle="很抱歉，应用程序遇到了意外错误。请尝试刷新页面或联系技术支持。"
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                刷新页面
              </Button>,
              <Button key="home" onClick={this.handleGoHome}>
                返回首页
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && (
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <h4>错误详情 (仅开发环境显示):</h4>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '300px'
                }}>
                  {this.state.error?.stack}
                </pre>
                
                {this.state.errorInfo && (
                  <>
                    <h4>组件堆栈:</h4>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}