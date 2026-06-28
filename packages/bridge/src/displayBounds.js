function findDisplayBounds(displays, selected) {
  if (selected === undefined || selected === null || !displays?.length) {
    return null
  }
  const match = displays.find(
    (d, i) =>
      d.id === selected ||
      String(d.id) === String(selected) ||
      i === selected ||
      String(i) === String(selected),
  )
  if (!match) return null
  const left = match.left ?? 0
  const top = match.top ?? 0
  const width = match.width ?? 0
  const height = match.height ?? 0
  return { left, top, right: left + width, bottom: top + height }
}

function windowCenterOnDisplay(win, bounds) {
  const cx = (win.left + win.right) / 2
  const cy = (win.top + win.bottom) / 2
  return (
    cx >= bounds.left &&
    cx < bounds.right &&
    cy >= bounds.top &&
    cy < bounds.bottom
  )
}

module.exports = { findDisplayBounds, windowCenterOnDisplay }
