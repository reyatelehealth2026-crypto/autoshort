import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './AppLayout'

const ToolsHub = lazy(() => import('./pages/ToolsHub'))
const ShortsCreator = lazy(() => import('./pages/ShortsCreator'))
const TrendsDashboard = lazy(() => import('./pages/TrendsDashboard'))
const SocialPostGenerator = lazy(() => import('./pages/SocialPostGenerator'))
const LongVideoScript = lazy(() => import('./pages/LongVideoScript'))
const PodcastScript = lazy(() => import('./pages/PodcastScript'))
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'))
const YouTubeIntegration = lazy(() => import('./pages/YouTubeIntegration'))
const ComingSoon = lazy(() => import('./pages/ComingSoon'))
const AutomationPipeline = lazy(() => import('./pages/AutomationPipeline'))

function LazyPage({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="page-loading"><div className="loading-spinner" /><p>กำลังโหลด...</p></div>}>
            {children}
        </Suspense>
    )
}

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,
        children: [
            { index: true, element: <LazyPage><ToolsHub /></LazyPage> },
            { path: 'create', element: <LazyPage><ShortsCreator /></LazyPage> },
            { path: 'trends', element: <LazyPage><TrendsDashboard /></LazyPage> },
            { path: 'studio', element: <LazyPage><ShortsCreator /></LazyPage> },
            { path: 'long-video', element: <LazyPage><LongVideoScript /></LazyPage> },
            { path: 'podcast', element: <LazyPage><PodcastScript /></LazyPage> },
            { path: 'social', element: <LazyPage><SocialPostGenerator /></LazyPage> },
            { path: 'analytics', element: <LazyPage><AnalyticsDashboard /></LazyPage> },
            { path: 'youtube', element: <LazyPage><YouTubeIntegration /></LazyPage> },
            { path: 'automation', element: <LazyPage><AutomationPipeline /></LazyPage> },
        ]
    }
])
