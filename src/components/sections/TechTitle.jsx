export default function TechTitle() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'baseline', 
      justifyContent: 'center', 
      pointerEvents: 'none' 
    }}>
      <h2 style={{
        background: 'linear-gradient(135deg, #fff, #06b6d4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: 'clamp(2rem, 5vw, 4rem)',
        margin: 0,
        display: 'inline-block'
      }}>
        Tech I've built with
      </h2>
      <span className="animated-dots" style={{ 
        color: '#06b6d4', 
        fontSize: 'clamp(2rem, 5vw, 4rem)', 
        fontWeight: 'bold',
        marginLeft: '4px'
      }}>
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  )
}
