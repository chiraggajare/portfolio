import { useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'

export default function WavyNameReverse() {
  const containerRef = useRef(null)
  const textPathRef = useRef(null)
  const text = "LET'S CONNECT ✦ ".repeat(30)

  // Starts Top-Left, ends Bottom-Right. Drawn Left-to-Right so text is upright.
  const pathData = "M -400 200 C 400 -300, 1000 900, 2400 900"

  useEffect(() => {
    const updateUI = (state) => {
      const progress = state.progress;
      const scrollIndex = progress * 13;
      const offset = -4000 + (scrollIndex - 12) * 3000;

      let opacity = 0;
      if (scrollIndex > 11.2 && scrollIndex < 11.8) {
        opacity = (scrollIndex - 11.2) / 0.6;
      } else if (scrollIndex >= 11.8 && scrollIndex <= 12.8) {
        opacity = 1;
      } else if (scrollIndex > 12.8 && scrollIndex < 13.2) {
        opacity = (13.2 - scrollIndex) / 0.4;
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
        <path id="wavy-path-2" d={pathData} fill="none" stroke="none" />
        <text className="wavy-svg-text">
          <textPath ref={textPathRef} href="#wavy-path-2" startOffset="-4000">
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  )
}
