export default function WavyName({ progress }) {
  const text = "CHIRAG GAJARE ✦ ".repeat(30)

  const pathData = "M -400 900 C 400 1400, 1000 200, 2400 200"

  // SECTION_COUNT is 12, so scrollIndex ranges from 0 to 11.
  // WavyName is at index 1 (Between Hero at 0 and ElevatorPitch at 2).
  // We map the scrollIndex from 0 to 2 into an offset from 4000 to -2000.
  const scrollIndex = (progress || 0) * 11;
  const offset = 4000 - (scrollIndex - 0) * 3000;

  // Fade it out so it doesn't leak into ElevatorPitch (2)
  let opacity = 0;
  if (scrollIndex > 0.2 && scrollIndex < 0.8) {
    opacity = (scrollIndex - 0.2) / 0.6;
  } else if (scrollIndex >= 0.8 && scrollIndex <= 1.8) {
    opacity = 1;
  } else if (scrollIndex > 1.8 && scrollIndex < 2.2) {
    opacity = (2.2 - scrollIndex) / 0.4;
  }

  return (
    <div className="wavy-name-container" style={{ opacity }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <path id="wavy-path" d={pathData} fill="none" stroke="none" />
        <text className="wavy-svg-text">
          <textPath href="#wavy-path" startOffset={offset}>
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  )
}
