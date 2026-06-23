import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
// Self-hosted Inter font (DSGVO-konform, keine externe Google-Fonts-Anfrage)
// Nur das Latin-Subset – deckt Deutsch inkl. Umlauten/ß ab und vermeidet
// unnötige Cyrillic/Greek/Vietnamese-Schriftdateien im Build.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './index.css'
import App from './App.tsx'
// import { initTouchHandling } from './utils/touchUtils'

// Initialize touch handling for mobile devices
// initTouchHandling(); // DISABLED: Caused click issues

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
