<template>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#0e1828;stop-opacity:1" /> <!-- Deep Blue -->
      <stop offset="100%" style="stop-color:#0d0616;stop-opacity:1" />
    </radialGradient>
    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#5dade2;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#a569bd;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Hex Base -->
  <polygon points="100,5 182,52 182,148 100,195 18,148 18,52" fill="url(#bgGrad)" stroke="#d4af37" stroke-width="2" stroke-opacity="0.4"/>

  <!-- Icon: Lake (Ripples) -->
  <g transform="translate(100, 90)" fill="none" stroke="url(#waterGrad)" stroke-width="2.5" stroke-linecap="round">
    <path d="M-50,-10 Q-25,10 0,-10 Q25,-30 50,-10" />
    <path d="M-40,15 Q-15,35 10,15 Q35,-5 60,15" opacity="0.8"/>
    <path d="M-60,35 Q-35,55 -10,35 Q15,15 40,35" opacity="0.6"/>
  </g>
  
  <!-- Reflection/Sparkle -->
  <path d="M80,60 L85,65 L80,70 L75,65 Z" fill="#d4af37" opacity="0.6"/>
</svg>
</template>