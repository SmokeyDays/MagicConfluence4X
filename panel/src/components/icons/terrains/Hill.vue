<template>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#2a1a0f;stop-opacity:1" /> <!-- Darker Orange/Brown Mix -->
      <stop offset="100%" style="stop-color:#0d0616;stop-opacity:1" />
    </radialGradient>
  </defs>

  <!-- Hex Base -->
  <polygon points="100,5 182,52 182,148 100,195 18,148 18,52" fill="url(#bgGrad)" stroke="#d4af37" stroke-width="2" stroke-opacity="0.4"/>

  <!-- Icon: Hills (Rolling Curves) -->
  <g transform="translate(100, 110)" stroke="#e67e22" stroke-width="3" fill="rgba(230, 126, 34, 0.1)" stroke-linecap="round">
     <!-- Main Hill -->
     <path d="M-50,20 Q0,-40 50,20" />
     
     <!-- Back Hill Left -->
     <path d="M-70,20 Q-30,-20 0,0" fill="none" />
     
     <!-- Back Hill Right -->
     <path d="M70,20 Q30,-30 0,0" fill="none" />
     
     <!-- Foreground Detail -->
     <path d="M-20,20 Q0,10 20,20" fill="none" stroke-width="2" opacity="0.7"/>
  </g>
</svg>
</template>