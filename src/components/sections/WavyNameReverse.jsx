export default function WavyNameReverse({ progress }) {
  const text = "READY TO COLLABORATE? ✦ LET'S TALK ✦ ".repeat(30)

  // Starts Top-Left, ends Bottom-Right. Drawn Left-to-Right so text is upright.
  const pathData = "M -400 200 C 400 -300, 1000 900, 2400 900"

  // SECTION_COUNT is 12, so scrollIndex ranges from 0 to 11.
  // WavyNameReverse is at index 10 (Between Projects at 9 and Contact at 11).
  const scrollIndex = (progress || 0) * 11;
  const offset = -4000 + (scrollIndex - 10) * 3000;

  let opacity = 0;
  if (scrollIndex > 9.2 && scrollIndex < 9.8) {
    opacity = (scrollIndex - 9.2) / 0.6;
  } else if (scrollIndex >= 9.8 && scrollIndex <= 10.8) {
    opacity = 1;
  } else if (scrollIndex > 10.8 && scrollIndex < 11.2) {
    opacity = (11.2 - scrollIndex) / 0.4;
  }

  return (
    <div className="wavy-name-container" style={{ opacity }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <path id="wavy-path-2" d={pathData} fill="none" stroke="none" />
        <text className="wavy-svg-text">
          <textPath href="#wavy-path-2" startOffset={offset}>
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  )
}
