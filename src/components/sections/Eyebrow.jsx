// Chapter label: catalogue number, title, and the world in the star system that holds it.
export default function Eyebrow({ num, children, world }) {
  return (
    <p className="eyebrow">
      <span className="eyebrow-num">{num}</span>
      <span className="eyebrow-rule" />
      <span>{children}</span>
      {world && <span className="eyebrow-world">· {world}</span>}
    </p>
  )
}
