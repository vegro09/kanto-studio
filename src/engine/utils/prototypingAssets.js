export const PROTOTYPING_ASSETS = [
  // 1. Rectangle
  {
    id: 'shape-rect',
    name: 'Rectangle',
    type: 'svg',
    svgCategory: 'shape',
    color: '#3b82f6',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 200,
    height: 140,
    renderSvg: (color = '#3b82f6', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 200 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="190" height="130" rx="4" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" opacity="1"/>
      </svg>
    `
  },
  // 2. Circle
  {
    id: 'shape-circle',
    name: 'Circle',
    type: 'svg',
    svgCategory: 'shape',
    color: '#ec4899',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 160,
    height: 160,
    renderSvg: (color = '#ec4899', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="80" r="72" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" opacity="1"/>
      </svg>
    `
  },
  // 3. Triangle
  {
    id: 'shape-triangle',
    name: 'Triangle',
    type: 'svg',
    svgCategory: 'shape',
    color: '#eab308',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 180,
    height: 160,
    renderSvg: (color = '#eab308', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 180 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="90,10 170,150 10,150" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 4. Hexagon
  {
    id: 'shape-hexagon',
    name: 'Hexagon',
    type: 'svg',
    svgCategory: 'shape',
    color: '#10b981',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 170,
    height: 160,
    renderSvg: (color = '#10b981', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 170 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="85,10 160,50 160,110 85,150 10,110 10,50" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 5. Star
  {
    id: 'shape-star',
    name: 'Star',
    type: 'svg',
    svgCategory: 'shape',
    color: '#f59e0b',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 170,
    height: 170,
    renderSvg: (color = '#f59e0b', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 170 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="85,10 107,60 160,65 120,102 133,155 85,127 37,155 50,102 10,65 63,60" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 6. Heart
  {
    id: 'shape-heart',
    name: 'Heart',
    type: 'svg',
    svgCategory: 'shape',
    color: '#ef4444',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 170,
    height: 160,
    renderSvg: (color = '#ef4444', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 170 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path d="M 85,145 C 85,145 15,100 15,50 C 15,25 35,10 55,10 C 70,10 80,20 85,30 C 90,20 100,10 115,10 C 135,10 155,25 155,50 C 155,100 85,145 85,145 Z" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 7. Arrow
  {
    id: 'shape-arrow',
    name: 'Arrow',
    type: 'svg',
    svgCategory: 'shape',
    color: '#8b5cf6',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 180,
    height: 140,
    renderSvg: (color = '#8b5cf6', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 180 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="10,50 110,50 110,20 170,70 110,120 110,90 10,90" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 8. Rounded Rectangle
  {
    id: 'shape-rounded-rect',
    name: 'Rounded Rectangle',
    type: 'svg',
    svgCategory: 'shape',
    color: '#06b6d4',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 200,
    height: 140,
    renderSvg: (color = '#06b6d4', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 200 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="190" height="130" rx="30" ry="30" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" opacity="1"/>
      </svg>
    `
  },
  // 9. Speech Bubble
  {
    id: 'shape-speech-bubble',
    name: 'Speech Bubble',
    type: 'svg',
    svgCategory: 'shape',
    color: '#6366f1',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 200,
    height: 150,
    renderSvg: (color = '#6366f1', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 200 150" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path d="M 15 10 L 185 10 A 10 10 0 0 1 195 20 L 195 105 A 10 10 0 0 1 185 115 L 60 115 L 30 145 L 35 115 L 15 115 A 10 10 0 0 1 5 105 L 5 20 A 10 10 0 0 1 15 10 Z" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 10. Cross
  {
    id: 'shape-cross',
    name: 'Cross',
    type: 'svg',
    svgCategory: 'shape',
    color: '#f43f5e',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 160,
    height: 160,
    renderSvg: (color = '#f43f5e', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="55,10 105,10 105,55 150,55 150,105 105,105 105,150 55,150 55,105 10,105 10,55 55,55" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 11. Checkmark
  {
    id: 'shape-checkmark',
    name: 'Checkmark',
    type: 'svg',
    svgCategory: 'shape',
    color: '#22c55e',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 170,
    height: 150,
    renderSvg: (color = '#22c55e', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 170 150" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="60,135 10,80 35,55 60,80 135,10 160,35" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 12. Diamond
  {
    id: 'shape-diamond',
    name: 'Diamond',
    type: 'svg',
    svgCategory: 'shape',
    color: '#0284c7',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 160,
    height: 160,
    renderSvg: (color = '#0284c7', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="80,10 150,80 80,150 10,80" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 13. Pentagon
  {
    id: 'shape-pentagon',
    name: 'Pentagon',
    type: 'svg',
    svgCategory: 'shape',
    color: '#a855f7',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 160,
    height: 160,
    renderSvg: (color = '#a855f7', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="80,10 155,65 125,150 35,150 5,65" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 14. Parallelogram
  {
    id: 'shape-parallelogram',
    name: 'Parallelogram',
    type: 'svg',
    svgCategory: 'shape',
    color: '#d97706',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 190,
    height: 140,
    renderSvg: (color = '#d97706', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 190 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,10 180,10 140,130 10,130" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 15. Cloud
  {
    id: 'shape-cloud',
    name: 'Cloud',
    type: 'svg',
    svgCategory: 'shape',
    color: '#38bdf8',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 190,
    height: 130,
    renderSvg: (color = '#38bdf8', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 190 130" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path d="M 40 110 C 20 110 10 95 10 80 C 10 65 25 50 45 52 C 55 30 80 20 105 30 C 120 15 150 20 160 40 C 175 42 185 58 180 75 C 185 95 170 110 150 110 Z" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 16. Lightning Bolt
  {
    id: 'shape-lightning',
    name: 'Lightning Bolt',
    type: 'svg',
    svgCategory: 'shape',
    color: '#eab308',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 140,
    height: 180,
    renderSvg: (color = '#eab308', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 140 180" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="80,5 15,95 70,95 45,175 125,75 75,75" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // 17. Plus Sign
  {
    id: 'shape-plus',
    name: 'Plus Sign',
    type: 'svg',
    svgCategory: 'shape',
    color: '#10b981',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 160,
    height: 160,
    renderSvg: (color = '#10b981', borderColor = '#ffffff', borderWidth = 3, hasBorder = false) => `
      <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <polygon points="60,10 100,10 100,60 150,60 150,100 100,100 100,150 60,150 60,100 10,100 10,60 60,60" fill="${color}" stroke="${hasBorder ? borderColor : 'none'}" stroke-width="${hasBorder ? borderWidth : 0}" stroke-linejoin="round" opacity="1"/>
      </svg>
    `
  },
  // Stickman Idle
  {
    id: 'stickman-idle',
    name: 'Stickman Idle',
    type: 'svg',
    svgCategory: 'stickman',
    color: '#38bdf8',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 140,
    height: 240,
    renderSvg: (color = '#38bdf8') => `
      <svg viewBox="0 0 100 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="30" r="20" fill="none" stroke="${color}" stroke-width="7"/>
        <line x1="50" y1="50" x2="50" y2="120" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="50" y1="70" x2="20" y2="100" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="50" y1="70" x2="80" y2="100" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="50" y1="120" x2="25" y2="185" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="50" y1="120" x2="75" y2="185" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
      </svg>
    `
  },
  // Stickman Walking
  {
    id: 'stickman-walking',
    name: 'Stickman Walking',
    type: 'svg',
    svgCategory: 'stickman',
    color: '#a855f7',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 150,
    height: 240,
    renderSvg: (color = '#a855f7') => `
      <svg viewBox="0 0 120 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="30" r="20" fill="none" stroke="${color}" stroke-width="7"/>
        <line x1="60" y1="50" x2="60" y2="115" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="60" y1="70" x2="25" y2="95" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="60" y1="70" x2="95" y2="105" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="60" y1="115" x2="25" y2="185" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="60" y1="115" x2="90" y2="175" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
      </svg>
    `
  },
  // Stickman Pointing
  {
    id: 'stickman-pointing',
    name: 'Stickman Pointing',
    type: 'svg',
    svgCategory: 'stickman',
    color: '#10b981',
    borderColor: '#ffffff',
    borderWidth: 3,
    hasBorder: false,
    opacity: 1.0,
    width: 160,
    height: 240,
    renderSvg: (color = '#10b981') => `
      <svg viewBox="0 0 130 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="30" r="20" fill="none" stroke="${color}" stroke-width="7"/>
        <line x1="50" y1="50" x2="50" y2="120" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="50" y1="65" x2="115" y2="65" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="50" y1="75" x2="20" y2="110" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="50" y1="120" x2="30" y2="185" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        <line x1="50" y1="120" x2="70" y2="185" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
      </svg>
    `
  }
];
