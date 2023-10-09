const main = async () => {

  const domComboCounter = document.querySelector('.combo-counter');
  const domGrid = document.querySelector('.grid');
  const gridStyle = getComputedStyle(domGrid);
  const gridWidth = gridStyle.getPropertyValue('--col-size');
  const gridHeight = gridStyle.getPropertyValue('--row-size');
  const sleep = async (duration) => (await new Promise(r => setTimeout(r, duration)));
  let animating = false;
  const colors = [
    //'#473335',
    //'#b0413e',
    '#c84639',
    //'#ce763b',
    '#e2af47',
    '#e9d6af',
    '#6bb4b1',
    '#32687a'
  ];
  let colorsTemp = colors.slice();
  let lastColor = 0;

  const particlesShowPoint = (domSlot) => {
    const slotStyle = getComputedStyle(domSlot);
    const pointElem = document.createElement('div');
    pointElem.classList.add('points');
    pointElem.style.left = slotStyle.getPropertyValue('left');
    pointElem.style.top = slotStyle.getPropertyValue('top');
    pointElem.style.borderColor = domSlot.style.background;
    console.log(domSlot.style.top);
    console.log(domSlot.style.left);
    domGrid.appendChild(pointElem);
    setTimeout(() => {
      pointElem.remove()
    }, 1000);
  }

  const randomColor = () => {

    if (Math.random() >= .25) {
      return colors[Math.floor(Math.random() * colors.length)];
    }
    if (lastColor < colors.length - 1) {
      lastColor += 1;
    } else {
      colorsTemp = colorsTemp.reverse();
      lastColor = 0;
    }
    return colors[lastColor]
  }

  const getDomSlots = () => {
    return document.querySelectorAll('.grid .slot');
  }

  const domSlotGetPos = (domSlot) => {
    const computedStyle = getComputedStyle(domSlot);
    const posX = parseInt(computedStyle.getPropertyValue('--slot-pos-x'));
    const posY = parseInt(computedStyle.getPropertyValue('--slot-pos-y'));
    return { posX, posY }
  }

  const domSlotSetPos = (domSlot, { posX, posY }) => {
    domSlot.style.opacity = (posY >= 0) ? 1 : 0;
    domSlot.style.setProperty('--slot-pos-x', posX);
    domSlot.style.setProperty('--slot-pos-y', posY);
  }

  const getSlotAt = (domSlots, { posX, posY }) => {
    const positions = Array.from(domSlots).map(domSlot => (domSlotGetPos(domSlot)));
    for (let [positionIndex, position] of positions.entries()) {
      if (position.posX == posX && position.posY == posY) {
        return domSlots[positionIndex]
      }
    }
    return null;
  }

  const slotsGetGlowNeighbours = (domSlots, domSlot, neighbours = []) => {
    if (!neighbours.includes(domSlot)) neighbours.push(domSlot)
    const shines = [];
    const glows = [];
    for (const slot of domSlots) {
      const _shine = slot.classList.contains('shine');
      const _glow = slot.classList.contains('glow');
      if (slot.style.background == domSlot.style.background && !neighbours.includes(slot)) {
        if (_shine && !_glow) {
          shines.push(slot);
        } else if (_glow) {
          glows.push(slot);
        } else {
          neighbours.push(slot);
        }
      }
    }
    for (const shine of shines) {
      neighbours.concat(slotsGetShineNeighbours(domSlots, shine, neighbours));
    }
    for (const glow of glows) {
      neighbours.concat(slotsGetGlowNeighbours(domSlots, glow, neighbours));
    }
    return neighbours;
  }

  const slotsGetShineNeighbours = (domSlots, domSlot, neighbours = []) => {
    if (!neighbours.includes(domSlot)) neighbours.push(domSlot)
    const { posX, posY } = domSlotGetPos(domSlot);
    const shines = [];
    const glows = [];
    for (const slot of domSlots) {
      const _pos = domSlotGetPos(slot);
      const _shine = slot.classList.contains('shine');
      const _glow = slot.classList.contains('glow');
      if (posX == _pos.posX || posY == _pos.posY) {
        if (!neighbours.includes(slot)) {
          if (_glow) {
            glows.push(slot);
          } else if (_shine) {
            shines.push(slot);
          } else {
            neighbours.push(slot);
          }
        }
      }
    }
    for (const shine of shines) {
      neighbours.concat(slotsGetShineNeighbours(domSlots, shine, neighbours));
    }
    for (const glow of glows) {
      neighbours.concat(slotsGetGlowNeighbours(domSlots, glow, neighbours));
    }

    return neighbours;
  }

  const slotsGetNeighbours = (domSlots, domSlot, neighbours = []) => {
    const { posX, posY } = domSlotGetPos(domSlot);
    const background = domSlot.style.background;
    const closest = [];
    const _validNeighbour = (n) => (n && n.style.background == background && !n.classList.contains('shine') && !n.classList.contains('glow'));

    const left = getSlotAt(domSlots, { posX: posX - 1, posY });
    if (_validNeighbour(left)) closest.push(left);

    const right = getSlotAt(domSlots, { posX: posX + 1, posY });
    if (_validNeighbour(right)) closest.push(right);

    const top = getSlotAt(domSlots, { posX, posY: posY - 1 });
    if (_validNeighbour(top)) closest.push(top);

    const bottom = getSlotAt(domSlots, { posX, posY: posY + 1 });
    if (_validNeighbour(bottom)) closest.push(bottom)


    if (!neighbours.includes(domSlot)) {
      neighbours.push(domSlot);
    }

    const additionalNeighbours = [];
    for (slot of closest) {
      if (!neighbours.includes(slot)) {
        neighbours.push(slot);
        const _neighbours = slotsGetNeighbours(domSlots, slot, neighbours);
        additionalNeighbours.concat(_neighbours);
      }
    }

    neighbours.concat(additionalNeighbours);

    return neighbours;
  }


  const slotsFall = () => {
    let fell = false;
    const domSlots = getDomSlots();
    domSlots.forEach(domSlot => {
      let { posX, posY } = domSlotGetPos(domSlot);
      domSlot.style.opacity = (posY >= 0) ? 1 : 0;
      if (posY < gridHeight - 1 && getSlotAt(domSlots, { posX, posY: posY + 1 }) == null) {
        posY += 1;
        fell = true;
      }
      domSlotSetPos(domSlot, { posX, posY });
    })
    return fell;
  }

  const domUpdateComboCounter = (value) => {
    domComboCounter.innerHTML = `${value}x`;
    const size = 20 + (Math.floor(value * 20 / 50));
    const classValue = Math.floor(value / 10).toString();
    domComboCounter.style.fontSize = `${size}px`
    domComboCounter.classList.remove('combo-1')
    domComboCounter.classList.remove('combo-2')
    domComboCounter.classList.remove('combo-3')
    domComboCounter.classList.remove('combo-4')
    domComboCounter.classList.add(`combo-${classValue}`)
  }

  const domInit = () => {
    let index = 0;
    while (domGrid.childElementCount <= (gridWidth * gridHeight) + 1) {
      const row = Math.floor(index / gridWidth);
      const col = index - (row * gridWidth);
      const domSlot = document.createElement('div');
      domSlot.classList.add('slot');
      domSlot.style.setProperty('--slot-pos-y', row);
      domSlot.style.setProperty('--slot-pos-x', col);
      domSlot.style.background = randomColor();
      domSlot.addEventListener('click', async () => {
        if (animating) return;
        animating = true;
        const isShine = domSlot.classList.contains('shine');
        const isGlow = domSlot.classList.contains('glow');
        const neighbours = (isShine ? slotsGetShineNeighbours(getDomSlots(), domSlot) : (isGlow ? slotsGetGlowNeighbours(getDomSlots(), domSlot) : slotsGetNeighbours(getDomSlots(), domSlot).reverse()));
        if (neighbours.length < 3) return animating = false;
        let combo = 0;
        for (slot of neighbours) {
          if (slot == domSlot && !isShine && !isGlow && neighbours.length >= 6) {
            slot.classList.add('glow');
          } else if (slot == domSlot && !isShine && !isGlow && neighbours.length >= 4) {
            slot.classList.add('shine');
          } else {
            const { posX } = domSlotGetPos(slot);
            slot.style.transform = 'scale(0)';
            particlesShowPoint(slot);
            await sleep(50);
            domSlotSetPos(slot, { posX, posY: -2 });
            slot.style.transform = 'scale(1)'
            slot.style.background = randomColor();
            slot.classList.remove('shine');
            slot.classList.remove('glow');


          }
          combo += 1;
          domUpdateComboCounter(combo);
        }

        await sleep(125);
        while (slotsFall()) {
          await sleep(25);
        }
        animating = false;
      });
      domGrid.appendChild(domSlot);
      index += 1;
    }
  }

  const handleComboCounterClick = async () => {
    let combo = parseInt(domComboCounter.innerHTML.replace('x', ''))
    const slots = Array.from(getDomSlots());
    let sleepTime = 500;
    if (combo >= 20) {
      combo = Math.floor(combo / 2);
      animating = true;
      domGrid.classList.add('super');
      const colors = slots.map(s => (s.style.background));
      const color = colors[Math.floor(Math.random() * colors.length)];
      while (combo > 0) {
        const slot = slots[Math.floor(Math.random() * slots.length)];
        const glow = slot.classList.contains('glow');
        const shine = slot.classList.contains('shine');
        const validSlot = (slot.style.background != color) && !glow && !shine
        if (validSlot) {
          combo -= 1;
          slot.style.transform = 'scale(1)'
          slot.style.background = color;
          slot.classList.remove('shine');
          slot.classList.remove('glow');
          domUpdateComboCounter(combo);
          await sleep(25);
          sleepTime -= 25;
        }
      }
      if (sleepTime > 0) await sleep(sleepTime);
      domGrid.classList.remove('super');
      animating = false;
    }
  }

  domComboCounter.addEventListener('click', () => {
    handleComboCounterClick();
  });

  domInit();
}

window.addEventListener('load', () => {
  main();
});