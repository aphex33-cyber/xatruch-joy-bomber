/**
 * DOMINIO: Internacionalización (ES / EN)
 * Soporta detección automática vía window.__PORTAL_LANG__ (ej. CrazyGames en inglés)
 * o preferencia manual en localStorage.
 */

const STORAGE_KEY = 'xatruch_lang_v2';

const detectInitialLang = () => {
  if (typeof window !== 'undefined') {
    if (window.__PORTAL_LANG__ === 'en' || window.__PORTAL_LANG__ === 'es') {
      return window.__PORTAL_LANG__;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }
  return 'en';
};

let currentLang = detectInitialLang();

export const getLang = () => currentLang;

export const setLang = (lang) => {
  if (lang !== 'es' && lang !== 'en') return;
  currentLang = lang;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignorar
    }
  }
};

export const toggleLang = () => {
  setLang(currentLang === 'es' ? 'en' : 'es');
  return currentLang;
};

const DICT = {
  es: {
    // Header & Touch controls
    'ui.menu': '🏠 Menú',
    'ui.pause': '⏸️ Pausa',
    'ui.resume': '▶️ Seguir',
    'ui.fullscreen': '⛶ Pantalla',
    'ui.audioOn': '🔊 Audio: ON',
    'ui.audioOff': '🔇 Audio: OFF',
    'ui.prev': '◀ [Q] Anterior',
    'ui.next': '[E] Siguiente ▶',
    'ui.drop': '🚀 SOLTAR [ESPACIO]',
    'ui.jump': '⬆️ SALTAR [ESPACIO]',
    'ui.modeStory': '📖 Modo: Historia',
    'ui.modeCity': '🏙️ Modo: Ciudad',
    'ui.modeGeometry': '📐 Modo: Geometría',
    'ui.modeHighway': '🏃 Modo: Carretera',

    // Difficulties
    'diff.EASY': 'Fácil',
    'diff.NORMAL': 'Normal',
    'diff.HARD': 'Difícil',

    // Intro & Story Map & Pause
    'intro.quote1':
      'Para mi ventura propia y desventura de mis enemigos, me ha revivido la IA; tomo como destino a bien traer felicidad a mi pueblo, que ha sido abandonado a su suerte y de la cual, veo con tristeza, no goza.',
    'intro.quote2':
      'Se me entrega este corcel, que he de cabalgar por estos cielos de límpido azul.',
    'intro.continue': '▶ TOCA O PRESIONA [ESPACIO] PARA CONTINUAR',
    'map.title': '🗺️ MAPA DE HONDURAS — MODO HISTORIA',
    'map.takeoff': 'TOCA UNA CIUDAD DESBLOQUEADA O PRESIONA [ESPACIO] PARA DESPEGAR',
    'map.comingSoon': '🚧 {city} llega en la próxima actualización',
    'map.locked': '🔒 Vence la ciudad anterior para desbloquear {city}',
    'pause.title': '⏸️ JUEGO EN PAUSA',
    'pause.continue': '▶ TOCA O PRESIONA [ESPACIO] / [P] PARA CONTINUAR',
    'pause.hint': 'Usa "🏠 Menú" arriba para volver al inicio',

    // Start Screen
    'start.subtitle': 'El General Xatruch lleva esperanza desde los cielos de Honduras',
    'start.stats': '⭐ {stars}/12  •  DIF: {diff}  •  {plane}',
    'start.modeStory': '📖 MODO HISTORIA',
    'start.modeCity': '🏙️ CIUDAD LIBRE',
    'start.modeGeo': '📐 GEOMETRÍA',
    'start.modeHwy': '🏃 EN CARRETERA',
    'start.cta': '▶ TOCA UN MODO O PRESIONA [ESPACIO] PARA DESPEGAR',
    'start.cStorySub': 'Ciudades → Geometría + Rescate',
    'start.cStoryCta': 'TOCA PARA CAMPAÑA',
    'start.cCitySub': 'Tegucigalpa & SPS • 5 cargas',
    'start.cCityCta': 'TOCA PARA VOLAR',
    'start.cGeoSub': 'Figuras de precisión arcade',
    'start.cGeoCta': 'TOCA PARA JUGAR',
    'start.cHwySub': 'Guacamayas, Venados & Mareros',
    'start.cHwyCta': 'TOCA PARA CORRER',
    'start.dStoryTitle': '📖 HISTORIA',
    'start.dStorySub': '4 Capítulos',
    'start.dStory1': 'Ciudades → Geometría',
    'start.dStory2': '¡Incluye Rescate!',
    'start.dStoryCta': '[1] CAMPAÑA',
    'start.dCityTitle': '🏙️ CIUDAD',
    'start.dCitySub': 'TGU & SPS',
    'start.dCity1': 'Apunta a la gente,',
    'start.dCity2': 'fuegos y laderas.',
    'start.dCityCta': '[2] VOLAR',
    'start.dGeoTitle': '📐 FIGURAS',
    'start.dGeoSub': 'Precisión',
    'start.dGeo1': 'Encaja piezas en',
    'start.dGeo2': 'bases neón.',
    'start.dGeoCta': '[3] JUGAR',
    'start.dHwyTitle': '🏃 CARRETERA',
    'start.dHwySub': 'Tegucigalpa',
    'start.dHwy1': 'Guacamayas, venados',
    'start.dHwy2': 'y mareros.',
    'start.dHwyCta': '[4] CORRER',
    'start.footerHint': 'Presiona [1]-[4] o clic en tarjeta • Usa "✈️ Hangar" arriba para cambiar de avión',
    'intro.continueModes': '▶ TOCA O PRESIONA [ESPACIO] PARA VER MODOS DE JUEGO',
    'hwy.titleShort': '🏃 SALTO EN CARRETERA',
    'hwy.titleLong': '🏃 SALTO EN CARRETERA • [ESPACIO] SALTAR / DOBLE SALTO',
    'hwy.rescueHud': '🚑 RESCATE: {cur}/{goal} SUMINISTROS',
    'hwy.velRecord': 'VEL: {spd} KM/H  |  RÉCORD: {rec}',
    'hud.goalMobile': '{emoji} {biome} • META: {score}/{target}',
    'hud.speedDesktop': 'VELOCIDAD: {spd} KT  |  META: {score}/{target} (JOY ≥ {minJoy}%)',
    'hud.windBanner': '💨 VIENTO {dir} {str} KT',
    'rescue.bannerTitle': '🆘 ¡ATERRIZAJE DE EMERGENCIA!',
    'rescue.bannerSub': 'El Joy-O-Meter cayó a 0%, pero tienes una segunda oportunidad:',
    'rescue.bannerMode': '🏃 MISIÓN DE RESCATE EN CARRETERA',
    'rescue.bannerLine1': 'Recoge 8 suministros esquivando guacamayas, venados y mareros',
    'rescue.bannerLine2': 'para recargar 50% de Joy y continuar donde quedaste.',
    'rescue.bannerCta': '▶ TOCA O PRESIONA [ESPACIO] PARA CORRER EL RESCATE',
    'lvl.titleBanner': '🎉 ¡{title} COMPLETADO!',
    'lvl.scoreStars': 'SCORE: {score}  |  ESTRELLAS TOTALES: ⭐ {stars}',
    'lvl.nextChapter': '▶ PRESIONA [ESPACIO] O TOCA PARA EL SIGUIENTE CAPÍTULO',
    'vic.heroTitle': '🏆 ¡MISIÓN CUMPLIDA, GENERAL!',
    'vic.heroSub': 'Llevaste alegría máxima a todo el territorio.',
    'vic.nextDiffBtn': '▶ PRESIONA [ESPACIO] O TOCA PARA SUBIR A DIFICULTAD {diff}',
    'vic.menuBtn': '🔄 PRESIONA [ESPACIO] O TOCA PARA VOLVER AL MENÚ',
    'go.noLives': 'Te quedaste sin vidas en la carretera.',
    'go.noJoy': 'El Joy-O-Meter cayó a 0%.',

    // HUD & Gameplay
    'hud.lives': 'VIDAS: {hearts}',
    'hud.score': 'SCORE: {score}',
    'hud.stars': '⭐ {stars}/10  ({diff})',
    'hud.high': '🏆 HIGH: {high}',
    'hud.joy': '💖 JOY:',
    'hud.joyFull': '💖 JOY-O-METER:',
    'hud.combo': 'COMBO x{combo}! 🔥',
    'hud.goal': 'META {lvl}: {score} / {target}',
    'hud.speed': '⚡ {speed} kt | 🌬️ VIENTO {wind}',
    'hud.stunt': '✨ ¡PIRUETA DE VICTORIA! ✨',
    'hud.ready': '🎯 LISTO!',
    'hud.safe': '✓ SALVO',
    'hud.perfect': '★ PERFECT',
    'hud.ok': '✓ OK',
    'hud.near': '¡Cerca! Apunta directo a la gente',
    'hud.perfectFit': '¡ENCAJE PERFECTO!',
    'hud.goodShot': '¡BUEN TIRO!',
    'hud.dropJoy': '+{pts} JOY!',
    'hud.dropError': '¡ERROR! -JOY',
    'hud.tutorial': '💡 Entrega lo que piden: [1-5] o [Q/E] cambiar • [ESPACIO] / Toca para soltar',
    'hud.askedFor': '¡Pidió {icon}, no eso!',
    'hud.missedSlot': '¡FALLASTE LA BASE!',
    'hud.slotFilled': '¡ESA BASE YA ESTÁ LLENA!',
    'hud.wrongShape': '¡FIGURA INCORRECTA!',

    // Rescue / Level Complete / Victory / Game Over
    'rescue.title': '🔥 ¡RESCATE DE EMERGENCIA!',
    'rescue.desc': 'El Joy-O-Meter llegó a cero. ¡Apaga el incendio antes que se pierda el barrio!',
    'rescue.cta': '💧 PRESIONA [ESPACIO] O TOCA PARA INICIAR RESCATE',
    'rescue.success': '✈️ ¡RESCATE EXITOSO!',
    'lvl.complete': '🎉 ¡NIVEL COMPLETADO!',
    'lvl.score': 'SCORE: {score} | COMBO MÁX: x{combo}',
    'lvl.cta': '▶ TOCA O PRESIONA [ESPACIO] PARA CONTINUAR',
    'vic.title': '🏆 ¡VICTORIA TOTAL! 🏆',
    'vic.subtitle': '¡Completaste toda la campaña y llenaste de alegría al pueblo!',
    'vic.finalScore': 'SCORE FINAL: {score}',
    'vic.highScore': '🏆 HIGH SCORE: {high}',
    'vic.maxCombo': 'MÁXIMO COMBO: x{combo}',
    'vic.nextDiff': '🔥 TOCA O PRESIONA [ESPACIO] PARA SUBIR A {diff}',
    'vic.backMenu': '🎉 ¡ERES UNA LEYENDA! PRESIONA [ESPACIO] PARA VOLVER AL MENÚ',
    'go.title': '💔 MISIÓN TERMINADA',
    'go.newRecord': '🌟 ¡NUEVO RÉCORD EN ESTE MODO! 🌟',
    'go.perfectShots': 'TIROS PERFECTOS: {count}',
    'go.retry': '🔄 PRESIONA [ESPACIO] O TOCA PARA REINTENTAR',

    // Boss Fight
    'boss.hintSps': '💡 USA AGUA Y HIELO (¡FUEGO Y BALAS LO ENCIENDEN!)',
    'boss.enrageText': '🔥 ¡SE ENCIENDE MÁS! +HP',
    'boss.enrageSub': '¡Usa Agua o Hielo!',
    'boss.hit': '💥 ¡IMPACTO!',
    'boss.defeated': '🏆 ¡JEFE DERROTADO!',
    'boss.weapon.BULLET': 'Balas',
    'boss.weapon.FIRE': 'Fuego',
    'boss.weapon.WATER': 'Agua',
    'boss.weapon.ICE': 'Hielo',
    'boss.TEGUCIGALPA.name': 'Monstruo del Tráfico Capitalino',
    'boss.TEGUCIGALPA.victory':
      '¡Oh serpiente de mil cabezas e igual número de colas, criatura mítica de humo y hierro! Para tu deshonra caes bajo la espada de este general caído que se levanta; ¡habitantes de esta villa, sean libres!',
    'boss.SPS.name': 'Titán de Fuego y Calor',
    'boss.SPS.victory':
      'Apagóse el fuego de tus entrañas, ciudad de los zorzales y de la gente que goza del trabajo.',
    'boss.COPAN.name': 'Quetzalcóatl, Serpiente Emplumada',
    'boss.COPAN.victory':
      'Monstruo precolombino, agitador del espíritu, Prometeo mesoamericano, te venzo y reconozco tu grandeza, pero son otros tiempos; ¡liberada queda la Copán de mi gente!',

    // Story stages
    'story.0.title': 'Cap. 1: Tegucigalpa',
    'story.0.sub': 'Lleva alegría a Juana Laínez, Centro Cívico, Estadio y Catedral',
    'story.1.title': 'Cap. 2: San Pedro Sula',
    'story.1.sub': 'Vuela sobre el Merendón, Estadio Olímpico y Los Bordos',
    'story.2.title': 'Cap. 3: Copán Ruinas',
    'story.2.sub': 'Templo Rosalila, Pirámides Mayas, Cafetales y Aldeas',
    'story.3.title': 'Cap. 4: Reconstrucción I',
    'story.3.sub': 'Encaja las estructuras básicas para reconstruir plazas',
    'story.4.title': 'Cap. 5: Reconstrucción II',
    'story.4.sub': 'Gran Final: encaja las figuras complejas de precisión',

    // Planes
    'plane.CLASSIC': 'Biplano Xatruch',
    'plane.AZUL_BLANCO': 'Halcón Azul-Blanco',
    'plane.DORADO': 'Águila Dorada',
    'plane.LEYENDA': 'Relámpago Neón',

    // Items
    'item.WATER.name': 'Bomba de Agua',
    'item.WATER.short': 'Agua',
    'item.FOOD.name': 'Canasta de Comida',
    'item.FOOD.short': 'Comida',
    'item.MONEY.name': 'Apoyo Económico',
    'item.MONEY.short': 'Dinero',
    'item.BIBLE.name': 'Biblia / Sabiduría',
    'item.BIBLE.short': 'Biblia',
    'item.TOY.name': 'Caja de Regalos',
    'item.TOY.short': 'Regalos',
    'item.TRIANGLE.name': 'Prisma Triangular',
    'item.TRIANGLE.short': 'Triángulo',
    'item.SQUARE.name': 'Cubo Neón',
    'item.SQUARE.short': 'Cuadrado',
    'item.CIRCLE.name': 'Esfera Solar',
    'item.CIRCLE.short': 'Círculo',
    'item.STAR.name': 'Estrella Estelar',
    'item.STAR.short': 'Estrella',
    'item.HEXAGON.name': 'Hexágono',
    'item.HEXAGON.short': 'Hexágono',
    'item.DIAMOND.name': 'Rombo Diamante',
    'item.DIAMOND.short': 'Rombo',
    'item.CROSS.name': 'Cruz Táctica',
    'item.CROSS.short': 'Cruz',
    'item.CRESCENT.name': 'Media Luna',
    'item.CRESCENT.short': 'Luna',

    // Biomes
    'biome.POVERTY_BELT.name': 'Cinturón de Pobreza',
    'biome.POVERTY_BELT.happy': '¡Justo lo que necesitaba esta familia!',
    'biome.POVERTY_BELT.unhappy': '¡Eso no es lo que pidió esta persona!',
    'biome.RICH_DISTRICT.name': 'Centro Cívico / Zona Moderna',
    'biome.RICH_DISTRICT.happy': '¡Paz espiritual en medio de la ciudad!',
    'biome.RICH_DISTRICT.unhappy': '¡Aquí buscan paz espiritual, no eso!',
    'biome.FAVELA.name': 'Barrio Popular / Laderas',
    'biome.FAVELA.happy': '¡Alegría y esperanza para el barrio!',
    'biome.FAVELA.unhappy': '¡Fíjate en el globo de lo que piden!',
    'biome.FIRE_EMERGENCY.name': '¡Incendio Activo!',
    'biome.FIRE_EMERGENCY.happy': '¡Fuego sofocado! ¡Nos salvaron!',
    'biome.FIRE_EMERGENCY.unhappy': '¡Necesitamos AGUA, se nos quema todo!',
    'biome.GEOMETRY_ZONE.name': 'Fábrica de Precisión',
    'biome.GEOMETRY_ZONE.happy': '¡Encaje perfecto!',
    'biome.GEOMETRY_ZONE.unhappy': '¡Fallo de precisión!',
    'biome.COPAN_CROPS.name': 'Cafetales de Copán',
    'biome.COPAN_CROPS.happy': '¡Los cafetales florecen con agua fresca!',
    'biome.COPAN_CROPS.unhappy': '¡Los cultivos necesitan agua!',
    'biome.COPAN_TEMPLES.name': 'Templos Mayas / Rosalila',
    'biome.COPAN_TEMPLES.happy': '¡Sabiduría y paz junto a los templos!',
    'biome.COPAN_TEMPLES.unhappy': '¡Cerca de los templos piden Biblia / Sabiduría!',
    'biome.COPAN_VILLAGE.name': 'Aldea Pintoresca de Copán',
    'biome.COPAN_VILLAGE.happy': '¡Alegría y pan en la aldea!',
    'biome.COPAN_VILLAGE.unhappy': '¡Fíjate si piden pan o regalos!',

    // Levels
    'level.CITY.0.title': 'Nivel 1: Tegucigalpa',
    'level.CITY.0.sub': 'Juana Laínez, Centro Cívico, Estadio Nacional y Catedral',
    'level.CITY.1.title': 'Nivel 2: San Pedro Sula',
    'level.CITY.1.sub': 'Cordillera del Merendón, Estadio Olímpico y Los Bordos',
    'level.CITY.2.title': 'Nivel 3: Copán Ruinas',
    'level.CITY.2.sub': 'Templo Rosalila, Pirámides Mayas, Cafetales y Aldeas',
    'level.GEOMETRY.0.title': 'Nivel 1: Figuras Básicas',
    'level.GEOMETRY.0.sub': 'Triángulo, Cuadrado, Círculo y Estrella',
    'level.GEOMETRY.1.title': 'Nivel 2: Figuras Complejas',
    'level.GEOMETRY.1.sub': 'Hexágono, Rombo, Cruz Táctica y Media Luna',
    'level.HIGHWAY.0.title': 'Salto en Carretera (Tegucigalpa)',
    'level.HIGHWAY.0.sub': '¡El General Xatruch salta obstáculos y recoge suministros!',

    // Sprites / Landmarks
    'sprite.woof': '¡GUAU!',
    'sprite.boo': '¡UUUHHH! 👻',
    'landmark.EL_PICACHO': 'EL PICACHO',
    'landmark.JUANA_LAINEZ': 'CERRO JUANA LAÍNEZ',
    'landmark.ESTADIO_NACIONAL': 'ESTADIO NACIONAL',
    'landmark.CENTRO_CIVICO': 'CENTRO CÍVICO',
    'landmark.CATEDRAL': 'CATEDRAL DE TEGUCIGALPA',
    'landmark.MERENDON': 'MERENDÓN',
    'landmark.CORDILLERA_MERENDON': 'CORDILLERA DEL MERENDÓN',
    'landmark.ESTADIO_OLIMPICO': 'ESTADIO OLÍMPICO',
    'landmark.LOS_BORDOS': 'LOS BORDOS',
    'landmark.FUENTE_LUMINOSA': 'FUENTE LUMINOSA',
    'landmark.ROSALILA': 'TEMPLO ROSALILA',
    'landmark.PIRAMIDES_COPAN': 'PIRÁMIDES DE COPÁN',
    'landmark.CAFETALES': 'CAFETALES DE COPÁN',
    'landmark.ESTELA_MAYA': 'ESTELA MAYA'
  },
  en: {
    // Header & Touch controls
    'ui.menu': '🏠 Menu',
    'ui.pause': '⏸️ Pause',
    'ui.resume': '▶️ Resume',
    'ui.fullscreen': '⛶ Fullscreen',
    'ui.audioOn': '🔊 Audio: ON',
    'ui.audioOff': '🔇 Audio: OFF',
    'ui.prev': '◀ [Q] Prev',
    'ui.next': '[E] Next ▶',
    'ui.drop': '🚀 DROP [SPACE]',
    'ui.jump': '⬆️ JUMP [SPACE]',
    'ui.modeStory': '📖 Mode: Story',
    'ui.modeCity': '🏙️ Mode: City',
    'ui.modeGeometry': '📐 Mode: Geometry',
    'ui.modeHighway': '🏃 Mode: Highway',

    // Difficulties
    'diff.EASY': 'Easy',
    'diff.NORMAL': 'Normal',
    'diff.HARD': 'Hard',

    // Intro & Story Map & Pause
    'intro.quote1':
      'For my own fortune and my enemies\' misfortune, AI has revived me; I take as my destiny to bring happiness to my people, who have been abandoned to their fate and, I see with sorrow, have none.',
    'intro.quote2':
      'This steed is entrusted to me, to ride across these skies of crystal blue.',
    'intro.continue': '▶ TAP OR PRESS [SPACE] TO CONTINUE',
    'map.title': '🗺️ MAP OF HONDURAS — STORY MODE',
    'map.takeoff': 'TAP AN UNLOCKED CITY OR PRESS [SPACE] TO TAKE OFF',
    'map.comingSoon': '🚧 {city} arrives in the next update',
    'map.locked': '🔒 Beat the previous city to unlock {city}',
    'pause.title': '⏸️ GAME PAUSED',
    'pause.continue': '▶ TAP OR PRESS [SPACE] / [P] TO CONTINUE',
    'pause.hint': 'Use "🏠 Menu" above to return home',

    // Start Screen
    'start.subtitle': 'General Xatruch brings hope from the skies of Honduras',
    'start.stats': '⭐ {stars}/12  •  DIFF: {diff}  •  {plane}',
    'start.modeStory': '📖 STORY MODE',
    'start.modeCity': '🏙️ FREE CITY',
    'start.modeGeo': '📐 GEOMETRY',
    'start.modeHwy': '🏃 HIGHWAY',
    'start.cta': '▶ TAP A MODE OR PRESS [SPACE] TO TAKE OFF',
    'start.cStorySub': 'Cities → Geometry + Rescue',
    'start.cStoryCta': 'TAP FOR CAMPAIGN',
    'start.cCitySub': 'Tegucigalpa & SPS • 5 drops',
    'start.cCityCta': 'TAP TO FLY',
    'start.cGeoSub': 'Arcade precision shapes',
    'start.cGeoCta': 'TAP TO PLAY',
    'start.cHwySub': 'Macaws, Deer & Street Gangs',
    'start.cHwyCta': 'TAP TO RUN',
    'start.dStoryTitle': '📖 STORY',
    'start.dStorySub': '4 Chapters',
    'start.dStory1': 'Cities → Geometry',
    'start.dStory2': 'Includes Rescue!',
    'start.dStoryCta': '[1] CAMPAIGN',
    'start.dCityTitle': '🏙️ CITY',
    'start.dCitySub': 'TGU & SPS',
    'start.dCity1': 'Aim at citizens,',
    'start.dCity2': 'fires & hillsides.',
    'start.dCityCta': '[2] FLY',
    'start.dGeoTitle': '📐 SHAPES',
    'start.dGeoSub': 'Precision',
    'start.dGeo1': 'Fit shapes into',
    'start.dGeo2': 'neon slots.',
    'start.dGeoCta': '[3] PLAY',
    'start.dHwyTitle': '🏃 HIGHWAY',
    'start.dHwySub': 'Tegucigalpa',
    'start.dHwy1': 'Macaws, deer',
    'start.dHwy2': 'and street gangs.',
    'start.dHwyCta': '[4] RUN',
    'start.footerHint': 'Press [1]-[4] or click a card • Use "✈️ Hangar" above to switch planes',
    'intro.continueModes': '▶ TAP OR PRESS [SPACE] TO VIEW GAME MODES',
    'hwy.titleShort': '🏃 HIGHWAY JUMP',
    'hwy.titleLong': '🏃 HIGHWAY JUMP • [SPACE] JUMP / DOUBLE JUMP',
    'hwy.rescueHud': '🚑 RESCUE: {cur}/{goal} SUPPLIES',
    'hwy.velRecord': 'SPD: {spd} KM/H  |  BEST: {rec}',
    'hud.goalMobile': '{emoji} {biome} • GOAL: {score}/{target}',
    'hud.speedDesktop': 'SPEED: {spd} KT  |  GOAL: {score}/{target} (JOY ≥ {minJoy}%)',
    'hud.windBanner': '💨 WIND {dir} {str} KT',
    'rescue.bannerTitle': '🆘 EMERGENCY LANDING!',
    'rescue.bannerSub': 'The Joy-O-Meter hit 0%, but you have a second chance:',
    'rescue.bannerMode': '🏃 HIGHWAY RESCUE MISSION',
    'rescue.bannerLine1': 'Collect 8 supplies while dodging macaws, deer and gangs',
    'rescue.bannerLine2': 'to restore 50% Joy and continue where you left off.',
    'rescue.bannerCta': '▶ TAP OR PRESS [SPACE] TO START RESCUE',
    'lvl.titleBanner': '🎉 {title} COMPLETE!',
    'lvl.scoreStars': 'SCORE: {score}  |  TOTAL STARS: ⭐ {stars}',
    'lvl.nextChapter': '▶ PRESS [SPACE] OR TAP FOR NEXT CHAPTER',
    'vic.heroTitle': '🏆 MISSION ACCOMPLISHED, GENERAL!',
    'vic.heroSub': 'You brought maximum joy across the entire nation.',
    'vic.nextDiffBtn': '▶ PRESS [SPACE] OR TAP TO ADVANCE TO {diff}',
    'vic.menuBtn': '🔄 PRESS [SPACE] OR TAP FOR MAIN MENU',
    'go.noLives': 'You ran out of lives on the highway.',
    'go.noJoy': 'The Joy-O-Meter dropped to 0%.',

    // HUD & Gameplay
    'hud.lives': 'LIVES: {hearts}',
    'hud.score': 'SCORE: {score}',
    'hud.stars': '⭐ {stars}/10  ({diff})',
    'hud.high': '🏆 HIGH: {high}',
    'hud.joy': '💖 JOY:',
    'hud.joyFull': '💖 JOY-O-METER:',
    'hud.combo': 'COMBO x{combo}! 🔥',
    'hud.goal': 'GOAL {lvl}: {score} / {target}',
    'hud.speed': '⚡ {speed} kt | 🌬️ WIND {wind}',
    'hud.stunt': '✨ VICTORY BARREL ROLL! ✨',
    'hud.ready': '🎯 READY!',
    'hud.safe': '✓ SAFE',
    'hud.perfect': '★ PERFECT',
    'hud.ok': '✓ OK',
    'hud.near': 'Close! Aim directly at the people',
    'hud.perfectFit': 'PERFECT FIT!',
    'hud.goodShot': 'GREAT SHOT!',
    'hud.dropJoy': '+{pts} JOY!',
    'hud.dropError': 'MISS! -JOY',
    'hud.tutorial': '💡 Match their bubble: [1-5] or [Q/E] switch • [SPACE] / Tap to drop',
    'hud.askedFor': 'They asked for {icon}, not that!',
    'hud.missedSlot': 'MISSED THE SLOT!',
    'hud.slotFilled': 'SLOT ALREADY FILLED!',
    'hud.wrongShape': 'WRONG SHAPE!',

    // Rescue / Level Complete / Victory / Game Over
    'rescue.title': '🔥 EMERGENCY RESCUE!',
    'rescue.desc': 'The Joy-O-Meter hit zero. Put out the fire before the neighborhood is lost!',
    'rescue.cta': '💧 PRESS [SPACE] OR TAP TO START RESCUE',
    'rescue.success': '✈️ RESCUE SUCCESSFUL!',
    'lvl.complete': '🎉 LEVEL COMPLETE!',
    'lvl.score': 'SCORE: {score} | MAX COMBO: x{combo}',
    'lvl.cta': '▶ TAP OR PRESS [SPACE] TO CONTINUE',
    'vic.title': '🏆 TOTAL VICTORY! 🏆',
    'vic.subtitle': 'You completed the entire campaign and filled the people with joy!',
    'vic.finalScore': 'FINAL SCORE: {score}',
    'vic.highScore': '🏆 HIGH SCORE: {high}',
    'vic.maxCombo': 'MAX COMBO: x{combo}',
    'vic.nextDiff': '🔥 TAP OR PRESS [SPACE] TO ADVANCE TO {diff}',
    'vic.backMenu': '🎉 YOU ARE A LEGEND! PRESS [SPACE] FOR MAIN MENU',
    'go.title': '💔 MISSION OVER',
    'go.newRecord': '🌟 NEW RECORD IN THIS MODE! 🌟',
    'go.perfectShots': 'PERFECT DROPS: {count}',
    'go.retry': '🔄 PRESS [SPACE] OR TAP TO RETRY',

    // Boss Fight
    'boss.hintSps': '💡 USE WATER & ICE (FIRE & BULLETS ENRAGE IT!)',
    'boss.enrageText': '🔥 ENRAGED! +HP',
    'boss.enrageSub': 'Use Water or Ice!',
    'boss.hit': '💥 HIT!',
    'boss.defeated': '🏆 BOSS DEFEATED!',
    'boss.weapon.BULLET': 'Bullets',
    'boss.weapon.FIRE': 'Fire',
    'boss.weapon.WATER': 'Water',
    'boss.weapon.ICE': 'Ice',
    'boss.TEGUCIGALPA.name': 'Capital Traffic Monster',
    'boss.TEGUCIGALPA.victory':
      'Oh serpent of a thousand heads and as many tails, mythical beast of smoke and iron! To your disgrace you fall beneath the blade of this risen general; citizens of this town, be free!',
    'boss.SPS.name': 'Titan of Fire and Heat',
    'boss.SPS.victory':
      'The fire within your core has been quenched, city of thrushes and hard-working people.',
    'boss.COPAN.name': 'Quetzalcoatl, Feathered Serpent',
    'boss.COPAN.victory':
      'Pre-Columbian giant, stirrer of spirits, Mesoamerican Prometheus, I defeat you and honor your greatness, yet these are new times; Copán is freed for my people!',

    // Story stages
    'story.0.title': 'Ch. 1: Tegucigalpa',
    'story.0.sub': 'Bring joy to Juana Laínez, Civic Center, Stadium & Cathedral',
    'story.1.title': 'Ch. 2: San Pedro Sula',
    'story.1.sub': 'Fly over Merendón, Olympic Stadium & Los Bordos',
    'story.2.title': 'Ch. 3: Copán Ruins',
    'story.2.sub': 'Rosalila Temple, Mayan Pyramids, Coffee Farms & Villages',
    'story.3.title': 'Ch. 4: Reconstruction I',
    'story.3.sub': 'Fit the basic structures to rebuild town plazas',
    'story.4.title': 'Ch. 5: Reconstruction II',
    'story.4.sub': 'Grand Finale: fit the complex precision shapes',

    // Planes
    'plane.CLASSIC': 'Xatruch Biplane',
    'plane.AZUL_BLANCO': 'Blue-White Falcon',
    'plane.DORADO': 'Golden Eagle',
    'plane.LEYENDA': 'Neon Lightning',

    // Items
    'item.WATER.name': 'Water Bomb',
    'item.WATER.short': 'Water',
    'item.FOOD.name': 'Food Basket',
    'item.FOOD.short': 'Food',
    'item.MONEY.name': 'Financial Aid',
    'item.MONEY.short': 'Money',
    'item.BIBLE.name': 'Bible / Wisdom',
    'item.BIBLE.short': 'Bible',
    'item.TOY.name': 'Gift Box',
    'item.TOY.short': 'Gifts',
    'item.TRIANGLE.name': 'Triangle Prism',
    'item.TRIANGLE.short': 'Triangle',
    'item.SQUARE.name': 'Neon Cube',
    'item.SQUARE.short': 'Square',
    'item.CIRCLE.name': 'Solar Sphere',
    'item.CIRCLE.short': 'Circle',
    'item.STAR.name': 'Stellar Star',
    'item.STAR.short': 'Star',
    'item.HEXAGON.name': 'Hexagon',
    'item.HEXAGON.short': 'Hexagon',
    'item.DIAMOND.name': 'Diamond',
    'item.DIAMOND.short': 'Diamond',
    'item.CROSS.name': 'Tactical Cross',
    'item.CROSS.short': 'Cross',
    'item.CRESCENT.name': 'Crescent Moon',
    'item.CRESCENT.short': 'Moon',

    // Biomes
    'biome.POVERTY_BELT.name': 'Low-Income Belt',
    'biome.POVERTY_BELT.happy': 'Just what this family needed!',
    'biome.POVERTY_BELT.unhappy': 'That is not what they asked for!',
    'biome.RICH_DISTRICT.name': 'Civic Center / Modern District',
    'biome.RICH_DISTRICT.happy': 'Spiritual peace in the heart of the city!',
    'biome.RICH_DISTRICT.unhappy': 'They seek spiritual peace here, not that!',
    'biome.FAVELA.name': 'Hillside Neighborhood',
    'biome.FAVELA.happy': 'Joy and hope for the neighborhood!',
    'biome.FAVELA.unhappy': 'Check the bubble for what they need!',
    'biome.FIRE_EMERGENCY.name': 'Active Wildfire!',
    'biome.FIRE_EMERGENCY.happy': 'Fire extinguished! You saved us!',
    'biome.FIRE_EMERGENCY.unhappy': 'We need WATER, everything is burning!',
    'biome.GEOMETRY_ZONE.name': 'Precision Factory',
    'biome.GEOMETRY_ZONE.happy': 'Perfect fit!',
    'biome.GEOMETRY_ZONE.unhappy': 'Precision miss!',
    'biome.COPAN_CROPS.name': 'Copán Coffee Farms',
    'biome.COPAN_CROPS.happy': 'The coffee crops bloom with fresh water!',
    'biome.COPAN_CROPS.unhappy': 'The crops need water!',
    'biome.COPAN_TEMPLES.name': 'Mayan Temples / Rosalila',
    'biome.COPAN_TEMPLES.happy': 'Wisdom and peace by the temples!',
    'biome.COPAN_TEMPLES.unhappy': 'Near the temples they ask for Bible / Wisdom!',
    'biome.COPAN_VILLAGE.name': 'Scenic Copán Village',
    'biome.COPAN_VILLAGE.happy': 'Joy and bread in the village!',
    'biome.COPAN_VILLAGE.unhappy': 'Check if they ask for food or gifts!',

    // Levels
    'level.CITY.0.title': 'Level 1: Tegucigalpa',
    'level.CITY.0.sub': 'Juana Laínez, Civic Center, National Stadium & Cathedral',
    'level.CITY.1.title': 'Level 2: San Pedro Sula',
    'level.CITY.1.sub': 'Merendón Range, Olympic Stadium & Los Bordos',
    'level.CITY.2.title': 'Level 3: Copán Ruins',
    'level.CITY.2.sub': 'Rosalila Temple, Mayan Pyramids, Coffee Farms & Villages',
    'level.GEOMETRY.0.title': 'Level 1: Basic Shapes',
    'level.GEOMETRY.0.sub': 'Triangle, Square, Circle & Star',
    'level.GEOMETRY.1.title': 'Level 2: Complex Shapes',
    'level.GEOMETRY.1.sub': 'Hexagon, Diamond, Tactical Cross & Crescent',
    'level.HIGHWAY.0.title': 'Highway Jump (Tegucigalpa)',
    'level.HIGHWAY.0.sub': 'General Xatruch leaps over obstacles and collects supplies!',

    // Sprites / Landmarks
    'sprite.woof': 'WOOF!',
    'sprite.boo': 'BOOOO! 👻',
    'landmark.EL_PICACHO': 'EL PICACHO',
    'landmark.JUANA_LAINEZ': 'JUANA LAÍNEZ HILL',
    'landmark.ESTADIO_NACIONAL': 'NATIONAL STADIUM',
    'landmark.CENTRO_CIVICO': 'CIVIC CENTER',
    'landmark.CATEDRAL': 'TEGUCIGALPA CATHEDRAL',
    'landmark.MERENDON': 'MERENDÓN',
    'landmark.CORDILLERA_MERENDON': 'MERENDÓN MOUNTAIN RANGE',
    'landmark.ESTADIO_OLIMPICO': 'OLYMPIC STADIUM',
    'landmark.LOS_BORDOS': 'LOS BORDOS',
    'landmark.FUENTE_LUMINOSA': 'LUMINOUS FOUNTAIN',
    'landmark.ROSALILA': 'ROSALILA TEMPLE',
    'landmark.PIRAMIDES_COPAN': 'COPÁN PYRAMIDS',
    'landmark.CAFETALES': 'COPÁN COFFEE FARMS',
    'landmark.ESTELA_MAYA': 'MAYAN STELE'
  }
};

export const t = (key, params = null) => {
  const table = DICT[currentLang] || DICT.es;
  let str = table[key] ?? DICT.es[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
};

export const tBossAttacks = (bossId) => {
  if (currentLang === 'en') {
    if (bossId === 'TEGUCIGALPA') return ['BEEP BEEP! 📢', 'MOVE IT! 🤬', '2 HRS IN TRAFFIC!', 'ROAD BLOCKED! 🚗'];
    if (bossId === 'SPS') return ['☀️ HEAT RAY!', '🔥 VALLEY FURY!', '🥵 TOTAL HEATWAVE!', '💥 FLARE UP!'];
    if (bossId === 'COPAN') return ['🐍 MAYAN FURY!', '🐆 JAGUAR ROAR!', '🌊 SACRED TORRENT!'];
  }
  if (bossId === 'TEGUCIGALPA') return ['¡PIIIP! 📢', '¡MUEVE PUES! 🤬', '¡2 HORAS EN EL ANILLO!', '¡NO HAY PASO! 🚗'];
  if (bossId === 'SPS') return ['☀️ ¡RAYO DE CALOR!', '🔥 ¡FURIA DEL VALLE!', '🥵 ¡SOFOCO TOTAL!', '💥 ¡LLAMARADA!'];
  return ['🐍 ¡FURIA MAYA!', '🐆 ¡RUGIDO DEL JAGUAR!', '🌊 ¡TORRENTE SAGRADO!'];
};

export const tHighwayHonks = () => {
  if (currentLang === 'en') {
    return ['BEEP BEEP! 📢', 'Ring Road 🐢', 'Traffic jam!', 'See you tomorrow!', 'Move it! 😤', 'Endless traffic!'];
  }
  return ['¡PIIIP! 📢', 'Anillo Periférico 🐢', '¡Tráfico pesado!', '¡Llegamos mañana!', '¡Mueve pues! 😤', '¡Tráfico eterno!'];
};
