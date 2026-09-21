import { useMemo, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

const SKILLS = [
  "React.js", "Next.js", "Node.js", "Express.js", "Python",
  "Django", "MongoDB", "PostgreSQL", "MySQL", "Supabase",
  "Docker", "AWS", "Google Cloud", "Firebase", "Git",
  "GitHub", "Postman", "Socket.io", "Y.js", "Monaco Editor",
  "Tailwind CSS", "Material UI", "Vite", "MongoDB Atlas", 
  "ImageKit", "Google Gemini API", "Hostinger Website Builder", 
  "REST APIs", "Cloudflare", "Google Stitch"
]

export default function FloatingSkillsHTML() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const skillsRefs = useRef([])

  const skillsData = useMemo(() => {
    return SKILLS.map((skill, i) => {
      const z = 1000 + Math.random() * 5000;
      
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

  useEffect(() => {
    const updateUI = (state) => {
      const progress = state.progress;
      const scrollIndex = progress * 12;
      
      const isVisible = scrollIndex > 4.2 && scrollIndex < 8.5;
      
      if (containerRef.current) {
        if (!isVisible) {
          containerRef.current.style.display = 'none';
          return;
        }
        containerRef.current.style.display = 'block';

        let containerOpacity = 0;
        if (scrollIndex > 4.2 && scrollIndex < 4.8) {
          containerOpacity = (scrollIndex - 4.2) / 0.6;
        } else if (scrollIndex >= 4.8 && scrollIndex <= 8.2) {
          containerOpacity = 1;
        } else if (scrollIndex > 8.2 && scrollIndex < 8.5) {
          containerOpacity = (8.5 - scrollIndex) / 0.3;
        }
        containerRef.current.style.opacity = containerOpacity.toString();
      }

      const cameraZ = Math.max(0, (scrollIndex - 3.5) * 1200);
      if (sceneRef.current) {
        sceneRef.current.style.transform = `translateZ(${cameraZ}px)`;
      }

      skillsRefs.current.forEach((el, i) => {
        if (!el) return;
        const data = skillsData[i];
        const distToCamera = data.z - cameraZ;
        
        let opacity = 1;
        if (distToCamera > 3000) opacity = 0;
        else if (distToCamera < 100) opacity = Math.max(0, distToCamera / 100);

        if (opacity <= 0) {
          el.style.opacity = '0';
          el.style.display = 'none';
          return;
        }

        const closeness = Math.max(0, Math.min(1, 1 - (distToCamera - 500) / 1500));
        const saturation = closeness * 80;
        const lightness = 100 - (closeness * 25);
        
        el.style.display = 'block';
        el.style.opacity = opacity.toString();
        
        // Optimize text shadow by only rendering when reasonably close
        if (closeness > 0.3) {
           el.style.textShadow = `0 0 ${closeness * 20 | 0}px hsla(270, ${saturation | 0}%, ${lightness | 0}%, ${closeness * 0.4})`;
        } else {
           el.style.textShadow = 'none';
        }
      });
    };

    const unsubscribe = useStore.subscribe(updateUI);
    updateUI(useStore.getState());

    return () => unsubscribe();
  }, [skillsData]);

  return (
    <div 
      ref={containerRef}
      className="floating-skills-container"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        perspective: '1000px',
        zIndex: 5,
        overflow: 'hidden',
        opacity: 0,
        display: 'none',
        willChange: 'opacity'
      }}
    >
      <div
        ref={sceneRef}
        className="floating-skills-scene"
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: 'translateZ(0px)',
          willChange: 'transform'
        }}
      >
        {skillsData.map((data, i) => {
          const closeness = 0; // initialize
          const saturation = closeness * 80;
          const lightness = 100 - (closeness * 25);
          const color = `hsl(270, ${saturation | 0}%, ${lightness | 0}%)`;

          return (
             <div
              key={i}
              ref={el => skillsRefs.current[i] = el}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate3d(calc(-50% + ${data.x}vw), calc(-50% + ${data.y}vh), -${data.z}px) scale(${data.scale})`,
                color: color,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 'clamp(1.2rem, 4vw, 2.5rem)',
                whiteSpace: 'nowrap',
                opacity: 0,
                display: 'none',
                willChange: 'transform, opacity',
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
