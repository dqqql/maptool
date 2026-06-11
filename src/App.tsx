import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './routes/HomePage';
import { EditorPage } from './routes/EditorPage';

/**
 * 全局 SVG 滤镜：手绘抖动描边。
 * 通过 feTurbulence + feDisplacementMap 让边框产生轻微手抖位移。
 */
function SketchFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <filter id="sketch" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="sketch-strong" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

export function App() {
  return (
    <>
      <SketchFilters />
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/world/:id" element={<EditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </>
  );
}
