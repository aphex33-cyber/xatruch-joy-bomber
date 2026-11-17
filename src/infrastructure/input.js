export class InputHandler {
  constructor(onDrop, onSelectNext, onSelectPrev, onSelectIndex, onActionTrigger, onCanvasClick) {
    this.onDrop = onDrop;
    this.onSelectNext = onSelectNext;
    this.onSelectPrev = onSelectPrev;
    this.onSelectIndex = onSelectIndex;
    this.onActionTrigger = onActionTrigger;
    this.onCanvasClick = onCanvasClick;

    this.state = {
      speedUp: false,
      slowDown: false
    };

    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Velocidad continua (A / D o Flechas Arriba / Abajo) sí puede mantenerse presionada
      if (e.code === 'KeyD' || e.code === 'ArrowUp') {
        this.state.speedUp = true;
        return;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowDown') {
        this.state.slowDown = true;
        return;
      }

      // Evitar trampa/glitch por mantener presionada la barra espaciadora u otras teclas de acción
      if (e.repeat) return;

      if (e.code === 'Space') {
        this.onActionTrigger();
      } else if (e.key === '1') {
        this.onSelectIndex(0);
      } else if (e.key === '2') {
        this.onSelectIndex(1);
      } else if (e.key === '3') {
        this.onSelectIndex(2);
      } else if (e.key === '4') {
        this.onSelectIndex(3);
      } else if (e.key === '5') {
        this.onSelectIndex(4);
      } else if (e.code === 'KeyQ' || e.code === 'ArrowLeft') {
        this.onSelectPrev();
      } else if (e.code === 'KeyE' || e.code === 'ArrowRight') {
        this.onSelectNext();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyD' || e.code === 'ArrowUp') {
        this.state.speedUp = false;
      } else if (e.code === 'KeyA' || e.code === 'ArrowDown') {
        this.state.slowDown = false;
      }
    });
  }

  attachCanvasEvents(canvas, getCarouselHitboxes = () => []) {
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Permitir manejo personalizado (ej. tarjetas del menú de inicio)
      if (this.onCanvasClick && this.onCanvasClick(clickX, clickY)) {
        return;
      }

      // Verificar si tocó algún slot del carrusel (vertical izquierdo o inferior)
      const hitboxes = getCarouselHitboxes() || [];
      for (const hb of hitboxes) {
        if (clickX >= hb.x && clickX <= hb.x + hb.w && clickY >= hb.y && clickY <= hb.y + hb.h) {
          this.onSelectIndex(hb.idx);
          return;
        }
      }

      this.onActionTrigger();
    });
  }
}
