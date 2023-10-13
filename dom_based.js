Element.prototype.getStyleProperty = function(...properties) {
  const computedStyle = getComputedStyle(this);
  return properties.map(p => (computedStyle.getPropertyValue(p)));
}

const main = async () => {
  const sleep = async (duration) => await new Promise((r) => setTimeout(r, duration));
  const domComboCounter = document.querySelector(".combo-counter");
  const domPointsCounter = document.querySelector(".points-counter");
  const domGrid = document.querySelector(".grid");
  const [width, height] = domGrid.getStyleProperty(['--col-size', '--row-size']);
  const gridWidth = width || 7;
  const gridHeight = height || 7;
  const colors = [
    "#c84639",
    "#e2af47",
    "#e9d6af",
    "#6bb4b1",
    "#32687a",
  ];

  let points = 0;
  let animating = false;

  const particlesShowPoint = (domSlot) => {
    const pointElem = document.createElement("div");
    pointElem.classList.add("points");
    const [left, top] = domSlot.getStyleProperty('left', 'top');
    pointElem.style.left = left;
    pointElem.style.top = top;
    pointElem.style.borderColor = domSlot.style.background;
    domGrid.appendChild(pointElem);
    setTimeout(() => {
      pointElem.remove();
    }, 1000);
  };

  const randomColor = (posX) => {
    const random = colors[Math.floor(Math.random() * colors.length)];
    const topSlot = getSlotAt({ posX: posX, posY: 0});
    if (Math.random() >= 0.25) return random;
    return topSlot ? topSlot.style.background : random;
  };

  const getDomSlots = () => (document.querySelectorAll(".grid .slot"));

  const domSlotGetPos = (domSlot) => {
    const [posX, posY] = domSlot.getStyleProperty('--slot-pos-x', '--slot-pos-y');
    return { posX: parseInt(posX), posY: parseInt(posY) };
  };

  const domSlotSetPos = (domSlot, { posX, posY }) => {
    domSlot.style.opacity = posY >= 0 ? 1 : 0;
    domSlot.style.setProperty("--slot-pos-x", posX);
    domSlot.style.setProperty("--slot-pos-y", posY);
    domSlot.setAttribute('pos-x', posX);
    domSlot.setAttribute('pos-y', posY);
  };

  const getSlotAt = ({ posX, posY }) => {
    const domSlot = domGrid.querySelector(`[pos-x="${posX}"][pos-y="${posY}"]`);
    return domSlot;
  };

  const slotsGetConditional = (domSlots, domSlot, filterCallback, neighbours=[]) => {
    if (!neighbours.includes(domSlot)) neighbours.push(domSlot);
    const shines = [];
    for (const slot of domSlots) {
      const _shine = slot.classList.contains("shine");
      if (filterCallback(slot) && !neighbours.includes(slot)) {
        if (_shine) {
          shines.push(slot);
        } else {
          neighbours.push(slot);
        }
      }
    }
    for (const shine of shines) {
      neighbours.concat(slotsGetShineNeighbours(domSlots, shine, neighbours));
    }
    return neighbours;
  };

  const slotsGetGlowNeighbours = (domSlots, domSlot, neighbours = []) => {
    const callback = (slot) => (slot.style.background == domSlot.style.background);
    return slotsGetConditional(domSlots, domSlot, callback, neighbours);
  };

  const slotsDistances = (slotA, slotB) => {
    const slotAPos = domSlotGetPos(slotA);
    const slotBPos = domSlotGetPos(slotB);
    return Math.sqrt(Math.pow(Math.abs(slotAPos.posX-slotBPos.posX),2)+Math.pow(Math.abs(slotAPos.posY-slotBPos.posY),2));
  }

  const slotsGetShineNeighbours = (domSlots, domSlot, neighbours = []) => {
    const { posX, posY } = domSlotGetPos(domSlot);
    const callback = (slot) => {
      const _pos = domSlotGetPos(slot);
      return (posX == _pos.posX || posY == _pos.posY)
    }
    const slots = slotsGetConditional(domSlots, domSlot, callback, neighbours);
    slots.sort((a,b) => slotsDistances(domSlot, a) - slotsDistances(domSlot, b));
    return slots
  };

  const slotsGetNeighbours = (domSlots, domSlot, neighbours = []) => {
    const { posX, posY } = domSlotGetPos(domSlot);
    const background = domSlot.style.background;
    const closest = [];
    const _validNeighbour = (n) =>
      n &&
      n.style.background == background &&
      !n.classList.contains("shine") &&
      !n.classList.contains("glow");

    const directions = [
      {x:-1,y:0},
      {x:0,y:-1},
      {x:+1,y:0},
      {x:0,y:+1},
    ]

    directions.forEach(d => {
      const _slot = getSlotAt({posX:posX+d.x, posY:posY+d.y});
      if(_validNeighbour(_slot)) closest.push(_slot);
    });

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
  };

  const slotsFall = () => {
    let fell = false;
    const domSlots = getDomSlots();
    domSlots.forEach((domSlot) => {
      let { posX, posY } = domSlotGetPos(domSlot);
      domSlot.style.opacity = posY >= 0 ? 1 : 0;
      if (
        posY < gridHeight - 1 &&
        getSlotAt({ posX, posY: posY + 1 }) == null
      ) {
        posY += 1;
        fell = true;
      }
      domSlotSetPos(domSlot, { posX, posY });
    });
    return fell;
  };

  const domUpdateComboCounter = (value) => {
    domComboCounter.innerHTML = `${value}x`;
    const size = 20 + Math.floor((value * 20) / 50);
    const classValue = Math.min(5, Math.floor(value / 10).toString());
    domComboCounter.style.fontSize = `${size}px`;
    domComboCounter.classList.remove("combo-1", "combo-2", "combo-3", "combo-4", "combo-5");
    domComboCounter.classList.add(`combo-${classValue}`);
  };


  const domUpdatePointsCounter = (value) => {
    points += value;
    domPointsCounter.innerHTML = `${points.toFixed(2)}`;
  }

  const handleClickGetNeighbours = (domSlot) => {
    const domSlots = getDomSlots();
    const isShine = domSlot.classList.contains("shine");
    const isGlow = domSlot.classList.contains("glow");
    if(isGlow) return slotsGetGlowNeighbours(domSlots, domSlot);
    if(isShine) return slotsGetShineNeighbours(domSlots, domSlot);
    return slotsGetNeighbours(domSlots, domSlot).reverse();
  }

  const handleClickSlot = async (domSlot, combo = 0) => {
    if (animating) return;
    animating = true;
    const isShine = domSlot.classList.contains("shine");
    const isGlow = domSlot.classList.contains("glow");
    const neighbours = handleClickGetNeighbours(domSlot);
    if (neighbours.length < 3) return (animating = false);
    const glows = [];
    for (const slot of neighbours) {
      if(slot == domSlot && !isShine && !isGlow && neighbours.length >= 8) {
          slot.classList.add("glow");
      } else if(slot == domSlot && !isShine && !isGlow && neighbours.length >= 4) {
        slot.classList.add("shine");
      } else if (slot != domSlot && slot.classList.contains("glow")) {
        glows.push(slot);
      } else {
        const { posX } = domSlotGetPos(slot);
        slot.style.transform = "scale(0)";
        particlesShowPoint(slot);
        await sleep(50);
        domSlotSetPos(slot, { posX, posY: -2 });
        slot.style.transform = "scale(1)";
        slot.style.background = randomColor(posX);
        slot.classList.remove("shine", "glow");
      }
      combo += 1;
      domUpdatePointsCounter(combo);
      domUpdateComboCounter(combo);
    }

    await sleep(175);
    while (slotsFall()) {
      await sleep(25);
    }
    await sleep(50);
    animating = false;
    for (const slot of glows) {
      const _combo = await handleClickSlot(slot, combo);
      combo = _combo;
    }
    return combo;
  };

  const domInit = () => {
    let index = 0;
    while (domGrid.childElementCount <= gridWidth * gridHeight + 1) {
      const row = Math.floor(index / gridWidth);
      const col = index - row * gridWidth;
      const domSlot = document.createElement("div");
      domSlot.classList.add("slot");
      domSlot.style.setProperty("--slot-pos-y", row);
      domSlot.style.setProperty("--slot-pos-x", col);
      domSlot.setAttribute('pos-y', row);
      domSlot.setAttribute('pos-x', col);
      domSlot.style.background = randomColor(col);
      domSlot.addEventListener("click", async () => {
        handleClickSlot(domSlot);
      });
      domGrid.appendChild(domSlot);
      index += 1;
    }
  };

  const handleComboCounterClick = async () => {
    let combo = parseInt(domComboCounter.innerHTML.replace("x", ""));
    const slots = Array.from(getDomSlots());
    let sleepTime = 500;
    let changes = 0;
    if (combo >= 20) {
      combo = Math.floor(combo / 2);
      animating = true;
      domGrid.classList.add("super");
      const colors = slots.map((s) => s.style.background);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const validSlots = slots.filter(
        (s) =>
          s.style.background != color &&
          !s.classList.contains("glow") &&
          !s.classList.contains("shine")
      );
      while (combo > 0 && changes < validSlots.length) {
        const slot = validSlots[Math.floor(Math.random() * validSlots.length)];
        combo -= 1;
        changes += 1;
        slot.style.transform = "scale(1)";
        slot.style.background = color;
        slot.classList.remove("shine", "glow");
        domUpdateComboCounter(combo);
        await sleep(25);
        sleepTime -= 25;
      }
      if (sleepTime > 0) await sleep(sleepTime);
      domUpdateComboCounter(0);
      domGrid.classList.remove("super");
      animating = false;
    }
  };
  domComboCounter.addEventListener("click", async () => {
    await handleComboCounterClick();
  });

  domInit();
};

window.addEventListener("load", () => {
  main();
});