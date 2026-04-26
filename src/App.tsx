import { Component, ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Verification from './pages/Verification'
import RemoteIDMonitor from './pages/RemoteIDMonitor'
import DroneRegistration from './pages/DroneRegistration'
import BroadcastSimulator from './pages/BroadcastSimulator'
import DroneExplorer from './pages/DroneExplorer'
import DroneDetail from './pages/DroneDetail'
import FlightLogger from './pages/FlightLogger'
import AuthorityPortal from './pages/AuthorityPortal'
import ViolationSystem from './pages/ViolationSystem'
import OwnershipTransfer from './pages/OwnershipTransfer'
import QRScanner from './pages/QRScanner'
import Analytics from './pages/Analytics'

class RouteErrorBoundary extends Component<
  { children: ReactNode; label: string },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(`[${this.props.label}] render error`, error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0a0f1a',
            color: '#F9FAFB',
            padding: '40px 24px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          <h1 style={{ color: '#EF4444', fontSize: 18, marginBottom: 12 }}>
            {this.props.label} crashed
          </h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#fca5a5' }}>
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#F9FAFB',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/monitor"
          element={
            <RouteErrorBoundary label="RemoteIDMonitor">
              <RemoteIDMonitor />
            </RouteErrorBoundary>
          }
        />
        <Route path="/register" element={<DroneRegistration />} />
        <Route
          path="/broadcast"
          element={
            <RouteErrorBoundary label="BroadcastSimulator">
              <BroadcastSimulator />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/explorer"
          element={
            <RouteErrorBoundary label="DroneExplorer">
              <DroneExplorer />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/drone/:id"
          element={
            <RouteErrorBoundary label="DroneDetail">
              <DroneDetail />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/flights"
          element={
            <RouteErrorBoundary label="FlightLogger">
              <FlightLogger />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/authority"
          element={
            <RouteErrorBoundary label="AuthorityPortal">
              <AuthorityPortal />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/violations"
          element={
            <RouteErrorBoundary label="ViolationSystem">
              <ViolationSystem />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/transfer"
          element={
            <RouteErrorBoundary label="OwnershipTransfer">
              <OwnershipTransfer />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/scan"
          element={
            <RouteErrorBoundary label="QRScanner">
              <QRScanner />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/analytics"
          element={
            <RouteErrorBoundary label="Analytics">
              <Analytics />
            </RouteErrorBoundary>
          }
        />
        <Route path="/verification" element={<Verification />} />
      </Routes>
    </BrowserRouter>
  )
}
