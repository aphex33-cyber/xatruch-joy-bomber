export class InputHandler {
  constructor(onDrop, onSelectNext, onSelectPrev, onSelectIndex, onActionTrigger) {
    this.onDrop = onDrop;
    this.onSelectNext = onSelectNext;
    this.onSelectPrev = onSelectPrev;
    this.onSelectIndex = onSelectIndex;
    this.onActionTrigger = onActionTrigger;

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
      } else if (e.code === 'KeyQ' || e.code === 'ArrowLeft') {
        this.onSelectPrev();
      } else if (e.code === 'KeyE' || e.code === 'ArrowRight') {
        this.onSelectNext();
      } else if (e.code === 'KeyD' || e.code === 'ArrowUp') {
        this.state.speedUp = true;
      } else if (e.code === 'KeyA' || e.code === 'ArrowDown') {
        this.state.slowDown = true;
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

  attachCanvasEvents(canvas) {
    canvas.addEventListener('pointerdown', (e) => {
      // Si el clic es en la parte inferior (carrusel)
      const rect = canvas.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const clickX = e.clientX - rect.left;

      if (clickY > canvas.height - 60) {
        // Clic en el carrusel
        const slotSize = 46;
        const gap = 10;
        const totalW = 4 * slotSize + 3 * gap;
        const startX = (canvas.width - totalW) / 2;

        if (clickX >= startX && clickX <= startX + totalW) {
          const index = Math.floor((clickX - startX) / (slotSize + gap));
          if (index >= 0 && index < 4) {
            this.onSelectIndex(index);
            return;
          }
        }
      }

      // Si no es el carrusel, es acción principal (Drop o Start)
      this.onActionTrigger();
    });
  }
}
