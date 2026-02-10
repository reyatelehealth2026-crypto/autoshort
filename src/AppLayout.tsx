import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import ApiKeyModal from './components/ApiKeyModal'
import ArtStyleModal from './components/ArtStyleModal'
import ErrorBoundary from './components/ErrorBoundary'
import { useSettingsStore } from './stores/useSettingsStore'
import { useUIStore } from './stores/useUIStore'
import { useProjectStore } from './stores/useProjectStore'

export default function AppLayout() {
    const { apiKey, setApiKey } = useSettingsStore()
    const { showApiKeyModal, setShowApiKeyModal, showArtModal, setShowArtModal, sidebarOpen, setSidebarOpen } = useUIStore()
    const { formData, setFormData } = useProjectStore()

    return (
        <div className="app-container">
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
            <Sidebar
                onOpenApiKey={() => setShowApiKeyModal(true)}
                hasApiKey={!!apiKey}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <main className="main-content">
                <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="เปิดเมนู">
                    <span /><span /><span />
                </button>
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>

            {showApiKeyModal && (
                <ApiKeyModal
                    apiKey={apiKey}
                    onSave={(key) => { setApiKey(key); setShowApiKeyModal(false) }}
                    onClose={() => setShowApiKeyModal(false)}
                />
            )}

            {showArtModal && (
                <ArtStyleModal
                    selectedStyle={formData.artStyle}
                    onSelect={(s) => { setFormData({ ...formData, artStyle: s }); setShowArtModal(false) }}
                    onClose={() => setShowArtModal(false)}
                />
            )}

            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
                    duration: 3000
                }}
            />
        </div>
    )
}
