import React from 'react'

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <span className="error-icon">⚠️</span>
                        <h2>เกิดข้อผิดพลาด</h2>
                        <p className="error-msg">{this.state.error?.message}</p>
                        <button className="btn btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}
