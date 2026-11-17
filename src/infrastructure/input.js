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

  attachCanvasEvents(canvas, getSlotCount = () => 4) {
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

      // Si el clic es en la parte inferior (carrusel)
      const isNarrow = canvas.width < 440;
      const slotSize = isNarrow ? 38 : 48;
      const gap = isNarrow ? 6 : 10;
      if (clickY > canvas.height - (slotSize + 14)) {
        const count = getSlotCount();
        const totalW = count * slotSize + (count - 1) * gap;
        const startX = (canvas.width - totalW) / 2;

        if (clickX >= startX && clickX <= startX + totalW) {
          const index = Math.floor((clickX - startX) / (slotSize + gap));
          if (index >= 0 && index < count) {
            this.onSelectIndex(index);
            return;
          }
        }
      }

      this.onActionTrigger();
    });
  }
}
