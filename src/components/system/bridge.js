import { useStore } from '../../store/useStore'

// ---------------------------------------------------------------------------
// The thin link between the HTML overlay and the 3D scene. It has no three.js
// import, so the page (text, navbar, overlay) can load and paint before the
// 3D engine arrives in its own lazy chunk.
// ---------------------------------------------------------------------------

// HTML label elements registered by the overlay: id -> HTMLElement
export const labelEls = new Map()

// Hovered body (drives the shader rim highlight, label highlight and cursor)
export const hoverState = {
  id: null,
  set(id) {
    if (id && useStore.getState().mode !== 'system') id = null
    if (this.id === id) return
    this.id = id
    document.documentElement.classList.toggle('is-pointing', !!id)
    labelEls.forEach((el, k) => el.classList.toggle('is-hover', k === id))
  },
}

// Camera controls for the overlay buttons. The camera rig fills these in once
// the 3D scene has loaded; until then they safely do nothing.
export const systemApi = {
  zoomBy() {},
  overview() {},
}
