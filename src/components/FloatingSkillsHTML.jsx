import { useMemo } from 'react'

const SKILLS = [
  "React.js", "Next.js", "Node.js", "Express.js", "MongoDB",
  "PostgreSQL", "Supabase", "Docker", "AWS", "Google Gemini API",
  "Socket.io", "Y.js", "Monaco Editor", "Tailwind CSS",
  "Material UI", "Vite", "MongoDB Atlas", "ImageKit",
  "GitHub", "Postman"
]

export default function FloatingSkillsHTML({ progress }) {
  const skillsData = useMemo(() => {
    return SKILLS.map((skill, i) => {
      const z = 1000 + Math.random() * 2200;
      
      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + Math.random() * 45;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.7;

      return {
        text: skill,
        x,
        y,
        z,
        scale: 0.8 + (i % 3) * 0.2
      }
    })
  }, [])

  // scrollIndex goes from 0 to 11.
  const scrollIndex = progress * 11;
  
  // Starts at scrollIndex 3.5 (after About section is passed)
  const cameraZ = Math.max(0, (scrollIndex - 3.5) * 1200);

  const isVisible = scrollIndex > 3.2 && scrollIndex < 6.5;

  let containerOpacity = 0;
  if (scrollIndex > 3.2 && scrollIndex < 3.8) {
    containerOpacity = (scrollIndex - 3.2) / 0.6;
  } else if (scrollIndex >= 3.8 && scrollIndex <= 6.2) {
    containerOpacity = 1;
  } else if (scrollIndex > 6.2 && scrollIndex < 6.5) {
    containerOpacity = (6.5 - scrollIndex) / 0.3;
  }

  if (!isVisible) return null;

  return (
    <div 
      className="floating-skills-container"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        perspective: '1000px',
        zIndex: 5,
        overflow: 'hidden',
        opacity: containerOpacity,
        willChange: 'opacity'
      }}
    >
      <div
        className="floating-skills-scene"
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: `translateZ(${cameraZ}px)`,
          willChange: 'transform'
        }}
      >
        {skillsData.map((data, i) => {
          const distToCamera = data.z - cameraZ;
          let opacity = 1;
          if (distToCamera > 3000) opacity = 0;
          else if (distToCamera < 100) opacity = Math.max(0, distToCamera / 100);

          // Skip rendering elements that are completely invisible
          if (opacity <= 0) return null;

          const closeness = Math.max(0, Math.min(1, 1 - (distToCamera - 500) / 1500));
          
          const saturation = closeness * 80;
          const lightness = 100 - (closeness * 25);
          
          const color = `hsl(270, ${saturation | 0}%, ${lightness | 0}%)`;

          return (
             <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate3d(calc(-50% + ${data.x}vw), calc(-50% + ${data.y}vh), -${data.z}px) scale(${data.scale})`,
                color: color,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: '2.5rem',
                whiteSpace: 'nowrap',
                opacity: opacity,
                willChange: 'transform, opacity',
                // Removed drop-shadow filter — it's the #1 GPU performance killer
                textShadow: closeness > 0.3 ? `0 0 ${closeness * 20 | 0}px hsla(270, ${saturation | 0}%, ${lightness | 0}%, ${closeness * 0.4})` : 'none',
              }}
            >
              {data.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}
