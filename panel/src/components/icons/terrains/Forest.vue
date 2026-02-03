<template>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#1e3626;stop-opacity:1" /> <!-- Deep Forest Green -->
      <stop offset="100%" style="stop-color:#0d0616;stop-opacity:1" />
    </radialGradient>
  </defs>

  <!-- Hex Base -->
  <polygon points="100,5 182,52 182,148 100,195 18,148 18,52" fill="url(#bgGrad)" stroke="#d4af37" stroke-width="2" stroke-opacity="0.4"/>

  <!-- Icon: Forest (Trees) -->
  <g transform="translate(100, 110)">
    <!-- Back Trees (Darker) -->
    <path d="M-50,10 L-50,-20 L-60,-10 M-50,-20 L-40,-10" stroke="#1d8348" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M50,15 L50,-15 L40,-5 M50,-15 L60,-5" stroke="#1d8348" stroke-width="2" fill="none" opacity="0.6"/>
    
    <!-- Main Tree Center -->
    <g stroke="#2ecc71" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M0,35 L0,-30" /> <!-- Trunk -->
        <path d="M0,-30 L-20,5 M0,-30 L20,5" /> <!-- Top Branches -->
        <path d="M0,-5 L-25,20 M0,-5 L25,20" /> <!-- Mid Branches -->
        <path d="M0,15 L-20,30 M0,15 L20,30" /> <!-- Low Branches -->
    </g>

    <!-- Side Tree Left -->
     <g transform="translate(-35, 15) scale(0.8)" stroke="#27ae60" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M0,30 L0,-30" />
        <path d="M0,-30 L-15,-5 M0,-30 L15,-5" />
        <path d="M0,-5 L-20,15 M0,-5 L20,15" />
     </g>

    <!-- Side Tree Right -->
     <g transform="translate(35, 5) scale(0.85)" stroke="#27ae60" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M0,30 L0,-30" />
        <path d="M0,-30 L-15,-5 M0,-30 L15,-5" />
        <path d="M0,-5 L-20,15 M0,-5 L20,15" />
     </g>
  </g>
  
  <!-- Magic Motes -->
  <circle cx="90" cy="140" r="1.5" fill="#2ecc71" opacity="0.6" />
  <circle cx="120" cy="90" r="1.5" fill="#2ecc71" opacity="0.4" />
</svg>
</template>