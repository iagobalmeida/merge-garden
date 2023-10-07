const main = async () => {
    const domGrid = document.querySelector('.grid');
    const gridStyle = getComputedStyle(domGrid);
    const gridWidth = gridStyle.getPropertyValue('--col-size');
    const gridHeight = gridStyle.getPropertyValue('--row-size');

    const randomRow = () => {
        return Math.floor(Math.random()*gridHeight)
    }

    const randomCol = () => {
        return Math.floor(Math.random()*gridWidth)
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
        for(let [positionIndex, position] of positions.entries()) {
            if(position.posX == posX && position.posY == posY) {
                return domSlots[positionIndex]
            }
        }
        return null;
    }


    const slotsFall = () => {
        const domSlots = getDomSlots();
        domSlots.forEach(domSlot => {
            let { posX, posY } = domSlotGetPos(domSlot); 
            domSlot.style.opacity = (posY >= 0) ? 1 : 0;
            if(posY < gridHeight - 1 && getSlotAt(domSlots, { posX, posY: posY + 1}) == null) {
                posY += 1;
            }
            domSlotSetPos(domSlot, { posX, posY });
        })
    }

    getDomSlots().forEach(domSlot => {
        domSlot.addEventListener('click', () => {
            domSlotSetPos(domSlot, { posX: randomCol(), posY: -3 });
        })
    })

    setInterval(() => {
        slotsFall();
    }, 250)
}

window.addEventListener('load', () => {
    main();
});