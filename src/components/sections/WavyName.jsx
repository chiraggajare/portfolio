import { useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'

export default function WavyName() {
  const containerRef = useRef(null)
  const textPathRef = useRef(null)

  const text = "CHIRAG GAJARE ✦ ".repeat(30)

  const pathData = "M -400 900 C 400 1400, 1000 200, 2400 200"

  useEffect(() => {
    const updateUI = (state) => {
      const progress = state.progress;
      const scrollIndex = progress * 12;
      const offset = 4000 - (scrollIndex - 0) * 3000;

      let opacity = 0;
      if (scrollIndex > 0.2 && scrollIndex < 0.8) {
        opacity = (scrollIndex - 0.2) / 0.6;
      } else if (scrollIndex >= 0.8 && scrollIndex <= 1.8) {
        opacity = 1;
      } else if (scrollIndex > 1.8 && scrollIndex < 2.2) {
        opacity = (2.2 - scrollIndex) / 0.4;
      }

      if (containerRef.current) containerRef.current.style.opacity = opacity.toString();
      if (textPathRef.current) textPathRef.current.setAttribute('startOffset', offset.toString());
    };

    const unsubscribe = useStore.subscribe(updateUI);
    updateUI(useStore.getState());

    return () => unsubscribe();
  }, []);

  return (
    <div ref={containerRef} className="wavy-name-container" style={{ opacity: 0 }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <path id="wavy-path" d={pathData} fill="none" stroke="none" />
        <text className="wavy-svg-text">
          <textPath ref={textPathRef} href="#wavy-path" startOffset="4000">
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  )
}
