const domQuery = (q) => (document.querySelector(q));
const domQueryAll = (q) => (document.querySelectorAll(q));
const domCreateElem = (t, a) => (Object.assign(document.createElement(t), a));
const sleep = async (duration) => (await new Promise(r => setTimeout(r, duration)))

SLOT_BASE_CLASS = 'food';

class SlotType {
    constructor(typeId, name) {
        this.typeId = typeId;
        this.name = name;
    }
    getClassList(stage=0) {
        const { typeId } = this;
        const completed = stage >= 5 ? 'completed' : '';
        if(typeId == 0) return [`${SLOT_BASE_CLASS} ${SLOT_BASE_CLASS}-empty`];
        return [`${SLOT_BASE_CLASS} ${SLOT_BASE_CLASS}-${typeId} stage-${stage} ${completed}`];
    }
}

const SLOT_TYPES = [
    new SlotType(0, 'empty'),
    new SlotType(1, 'corn'),
    new SlotType(2, 'wheat'),
    new SlotType(3, 'tomatoe'),
    new SlotType(4, 'pepper'),
    new SlotType(5, 'carrot'),
    new SlotType(6, 'potatoe'),
    new SlotType(7, 'beet'),
    new SlotType(8, 'pumpkin'),
    new SlotType(9, 'bean'),
    new SlotType(10, 'sunflower')
];

class Slot {
    constructor(domParent, type=null, stage=1, domInit=true) {
        this.type = type;
        this.stage = stage;
        this.domParent = domParent;
        if(domInit) return this.domInit();
    }
    domInit() {
        const { type, stage, domParent } = this;
        const classList = type.getClassList(stage);
        const domElem = domCreateElem('div', { classList });
        domParent.appendChild(domElem);
        this.domElem = domElem;
    }
    addEventListener(event, callback) {
        this.domElem.addEventListener(event, (ev) => {
            callback(ev, this);
        });
    }
    update() {
        const { type, stage } = this;
        this.domElem.classList = type.getClassList(stage);
    }
    setStage(newValue, update=false) {
        this.stage = Math.min(5, newValue);
        if(update) this.update();
    }
    set(type, stage=1, update=false) {
        this.type = type;
        this.stage = stage;
        if(update) this.update();
    }
    copy(slot) {
        this.type = slot.type;
        this.stage = slot.stage;
    }
}

class Grid {
    constructor(width, height, types, domInit=true) {
        this.width = width;
        this.height = height;
        this.domElem = domQuery('.grid');
        this.slotTypes = types;
        this.slots = [];
        this.tool = 'default';
        this.combineCallback = (slot) => {console.log(slot)}
        if(domInit) this.domInit();
    }
    __validSlot(index) {
        return (index < 0 || index >= this.slots.length) ? false : true;
    }
    __randomType() {
        return this.slotTypes[1 + Math.floor(Math.random()*(this.slotTypes.length-1))]
    }
    domInit() {
        const { domElem,  width, height } = this;
        while(this.slots.length < width * height) {
            const type = this.__randomType();
            const slot = new Slot(domElem, type);
            const slotIndex = this.slots.length;
            slot.addEventListener('click', () => {
                this.handleSlotClick(slotIndex);
            });
            this.slots.push(slot);
        }
        domElem.style.gridTemplateColumns = 'auto '.repeat(width);
        domElem.style.gridTemplateRows = 'auto '.repeat(height);
    }
    async domUpdateSlot(slotIndex) {
        this.slots[slotIndex].update();
    }
    async domUpdateAll() {
        for(let slotIndex = 0; slotIndex < this.slots.length; slotIndex++) {
            this.domUpdateSlot(slotIndex)
        }
    }
    slotsGetCombinations(slotIndex, slotType=null, combinations=[]) {
        const { width, height } = this;
        slotType = (slotType == null) ? this.slots[slotIndex].type : slotType;
        const row = Math.floor(slotIndex / width);
        const col = slotIndex - (row * width);

        const nexts = [];

        if(row > 0){
            const up = (slotIndex - (row * width)) + ((row - 1) * width);
            if(this.slots[up] !== undefined && this.slots[up].type.name == slotType.name && !combinations.includes(up)) {
                combinations.push(up);
                nexts.push(up);
            }
        }

        if(row < height - 1) {
            const down = (slotIndex - (row * width)) + ((row + 1) * width);
            if(this.slots[down] !== undefined && this.slots[down].type.name == slotType.name && !combinations.includes(down)) {
                combinations.push(down);
                nexts.push(down);
            }
        }

        if(col > 0){
            const left = (slotIndex - (row * width) - 1) + ((row) * width);
            if(this.slots[left] !== undefined && this.slots[left].type.name == slotType.name && !combinations.includes(left)) {
                combinations.push(left);
                nexts.push(left);
            }
        }

        if(col < width - 1) {
            const right = (slotIndex - (row * width) + 1) + ((row) * width);
            if(this.slots[right] !== undefined && this.slots[right].type.name == slotType.name && !combinations.includes(right)) {
                combinations.push(right);
                nexts.push(right);
            }
        }

        for(const next of nexts){
            const _combinations = this.slotsGetCombinations(next, slotType, combinations);
            combinations.concat(_combinations);
        }

        return combinations;        
    }
    slotsGetFirstAbove(slotIndex) {
        const { width } = this;
        let ret = false;
        let row = Math.floor(slotIndex / width);
        const col = slotIndex - (row * width);

        while(row > 0) {
            const _row = row - 1;
            const aboveIndex = col + ((_row) * width);
            const slot = this.slots[aboveIndex]
            if(slot && slot.type.name != 'empty') return aboveIndex;
            row -= 1;
        }

        return ret;
    }
    async slotsFall() {
        const { width, slotTypes } = this;
        const reversed = this.slots.slice().reverse();
        let sleepDuration = 250;

        for(let revIndex = 0; revIndex < reversed.length; revIndex++) {
            const slotIndex = reversed.length - revIndex - 1;
            const row = Math.floor(slotIndex / width);
            const slot = this.slots[slotIndex];
            if(slot.type.name == 'empty') {
                const slotAboveIndex = this.slotsGetFirstAbove(slotIndex);

                if(row == 0 || row != 0 && slotAboveIndex == false) {
                    this.slots[slotIndex].set(this.__randomType(), 1, true);
                    await sleep(25);
                    sleepDuration -= 25;
                } else {
                    this.slots[slotIndex].copy(this.slots[slotAboveIndex]);
                    this.slots[slotAboveIndex].set(slotTypes[0], 1, true);
                    await sleep(25);
                    sleepDuration -= 25;
                    this.slots[slotIndex].update()
                }
                await sleep(25);
                sleepDuration -= 25;
            }
        }
        await sleep(sleepDuration);
        this.domUpdateAll();
    }
    async handleCombineSlot(slotIndex) {
        const { slotTypes } = this;
        const slotType = this.slots[slotIndex].type;

        if(slotType.name == 'empty') return;

        const combinations = this.slotsGetCombinations(slotIndex, slotType, []);

        let sleepDuration = 125;

        if(combinations.length >= 3) {
            const nextStage = combinations.reduce((sum, slotIndex) => {
                sum += this.slots[slotIndex].stage;
                return sum;
            }, - 1);
            
            for(const _slotIndex of combinations) {
                if(_slotIndex == slotIndex) {
                    this.slots[_slotIndex].setStage(nextStage, true);
                    if(this.slots[slotIndex].stage >= 5) sleepDuration = 500;
                } else {
                    this.slots[_slotIndex].set(slotTypes[0], 1, true);
                }
                await sleep(25);
                sleepDuration -= 25;
            }
        }

        await sleep(sleepDuration);

        if(this.slots[slotIndex].stage >= 5) {
            this.combineCallback(this.slots[slotIndex]);
            this.slots[slotIndex].set(slotTypes[0], 1);
        }

        await this.slotsFall();
    }
    async handleHoeSlot(slotIndex) {
        const { slotTypes } = this;
        this.slots[slotIndex].set(slotTypes[0], 1);
        await this.slotsFall();
    }
    async handleHoseSlot(slotIndex) {
        const { slotTypes } = this;
        const nextStage = Math.min(5, this.slots[slotIndex].stage + 1);
        this.slots[slotIndex].setStage(nextStage, true);

        if(this.slots[slotIndex].stage >= 5) {
            await sleep(250);
            this.combineCallback(this.slots[slotIndex]);
            this.slots[slotIndex].set(slotTypes[0], 1);
        }
        await this.slotsFall();

    }
    async handleSlotClick(slotIndex) {
        switch(this.tool) {
            case 'hoe':
                await this.handleHoeSlot(slotIndex);
            break;
            case 'hose':
                await this.handleHoseSlot(slotIndex);
            break;
            default:
                await this.handleCombineSlot(slotIndex);
            break;
        }
    }
}

class InventoryItem {
    constructor(domParent, type, ammount, value, domInit=true) {
        this.type = type;
        this.ammount = ammount;
        this.value = value;
        this.domParent = domParent;
        this.domWrapper = null;
        this.domContent = null;
        if(domInit) return this.domInit();
    }
    domInit() {
        const { type, ammount, value, domParent } = this;
        const { name } = type;
        const iconClassList = type.getClassList(4);

        const domWrapper = domCreateElem('div', { classList: ['counter'] });
        const domIcon = domCreateElem('div', { classList: iconClassList });
        const domContent = domCreateElem('div', { classList: ['content'] });

        domContent.innerHTML = `<p>${name}</p><p data-inventory-type="${name}">${ammount}</p><a>Sell +${value} ⛃</a>`;

        domWrapper.appendChild(domIcon)
        domWrapper.appendChild(domContent)

        domParent.appendChild(domWrapper);
        this.domWrapper = domWrapper;
        this.domContent = domContent;
    }
    update() {
        const { type, ammount, value } = this;
        const { name } = type;
        this.domContent.innerHTML = `<p>${name}</p><p data-inventory-type="${name}">${ammount}</p><a>Sell +${value} ⛃</a>`
    }
    incrementAmmount(ammount, domUpdate=true) {
        this.ammount += ammount;
        if(domUpdate) this.update();
    }
}

class Game {
    constructor(gold, inventory, gridWidth=5, gridHeight=5, slotTypes=SLOT_TYPES) {
        this.gold = gold;
        this.inventory = inventory;
        this.slotTypes = slotTypes;
        this.grid = new Grid(gridWidth, gridHeight, slotTypes);
        this.grid.combineCallback = (slot) => {
            this.combineCallback(slot);
        }
        this.domInventoryParent = domQuery('#counters-wrap');
        this.inventoryInit();
    }
    inventoryInit() {
        const { domInventoryParent } = this;
        this.slotTypes.forEach(slotType => {
            if(slotType.name == 'empty') return;
            this.inventory[slotType.name] = new InventoryItem(domInventoryParent, slotType, 0, 2);
        });
    }
    inventoryAdd(slotType) {
        const { domInventoryParent } = this;
        if(!(slotType.name in this.inventory)) this.inventory[slotType.name] = new InventoryItem(domInventoryParent, slotType, 0, 2);
        this.inventory[slotType.name].incrementAmmount(1);
    }
    combineCallback(slot){
        this.inventoryAdd(slot.type);
        console.log(this.inventory);
    }
}

window.addEventListener('load', () => {
    const types = [
        SLOT_TYPES[0],
        SLOT_TYPES[4],
        SLOT_TYPES[7],
        SLOT_TYPES[2]
    ]
    const game = new Game(0, {}, 4, 4, types);
    window.game = game;

    domQueryAll('input[name="tool"]').forEach(el => el.addEventListener('change', () => {
        const currentTool = domQuery('input[name="tool"]:checked').value;
        window.game.grid.tool = currentTool;
    }))
});