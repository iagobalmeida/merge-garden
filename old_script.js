const newElem = (tagName, properties) => (Object.assign(document.createElement(tagName), properties));

const domQuery = (query) => (document.querySelector(query));

const domQueryAll = (query) => (document.querySelectorAll(query));

// 1,2,3,5,6
const foodNames = [
  'corn',
  'wheat',
  'tomatoe',
  'pepper',
  'carrot',
  'potatoe',
  'beet',
  'pumpkim',
  'bean',
  'sunflower'
]
const possibilities = [2, 6, 8];
const rand = (max, min = 0) => (possibilities[Math.floor(Math.random() * possibilities.length)]);

const sleep = async (duration) => (await new Promise(r => setTimeout(r, duration)))

const onlyUnique = (value, index, array) => (array.indexOf(value) === index);

let usingHoe = false;
let usingHose = false;
let animating = false;
let animSpeeds = {
  'slowest': 500,
  'slow': 375,
  'default': 250,
  'fast': 125
};

class Food {
  constructor(stage = 1) {
    this.food = rand(3, 7);
    this.stage = stage;
  }
  set(food, stage = 1) {
    this.food = food;
    this.stage = stage;
  }
}

class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.domElem = domQuery('.grid');
    this.gold = 0;
    this.points = possibilities.map(p => (0));
    this.foods = [];
    while (this.foods.length < width * height) {
      const food = new Food();
      this.foods.push(food);
    }
    this.domInit();
    this.domInitCounters();
    this.domUpdateAll();
  }
  validIndex(index) {
    return (index < 0 || index >= this.foods.length) ? false : true;
  }
  validRowCol(row, col) {
    return (row < 0 || row >= this.height || col < 0 || col >= this.width) ? false : [row, col];
  }
  rowColIndex(row, col) {
    if (!this.validRowCol(row, col)) return -1;
    return (col) + (row * this.width);
  }
  indexRowCol(index) {
    const { width } = this;
    const row = Math.floor(index / width);
    const col = index - (row * width);
    return [row, col]
  }
  getStage(index) {
    return this.validIndex(index) ? this.foods[index].stage : 0;
  }
  getFood(index) {
    return this.validIndex(index) ? this.foods[index].food : null;
  }
  setFood(index, value, stage = 1) {
    return this.validIndex(index) ? this.foods[index].set(value, stage) : false;
  };
  domUpdateGold() {
    const domElem = domQuery('[data-gold]');
    domElem.innerHTML = this.gold;
  }
  domUpdateFood(index) {
    const food = this.getFood(index);
    const stage = (food == 0 ? 0 : this.getStage(index));
    const elem = domQueryAll('.grid .food')[index];
    elem.classList = `food ${!food ? 'food-empty' : ''} food-${food} stage-${stage}`;
  }
  domUpdateCounter(food) {
    const foodIndex = possibilities.indexOf(food);
    if (food == 0) return;
    const domCounter = domQuery(`[data-counter="${food}"]`);
    if (domCounter) {
      domCounter.innerHTML = this.points[foodIndex]
    }
  }
  async domUpdateAll() {
    this.foods.forEach((_, fi) => {
      this.domUpdateFood(fi)
    });
    possibilities.forEach((p) => {
      this.domUpdateCounter(p)
    });
    this.domUpdateGold();
  }
  domInitCounters() {
    const wrapper = domQuery('#counters-wrap');
    possibilities.forEach(p => {
      if (p == 0) return;
      const domElem = newElem('div', {
        classList: ['counter']
      });
      const domIcon = newElem('div', {
        classList: [`food food-${p} stage-4`]
      });
      const domContent = newElem('div', {
        classList: ['content']
      });
      const name = foodNames[p-1];
      domContent.innerHTML = `<p>${name}</p><p data-counter="${p}"></p><a>Sell +2 ⛃</a>`;
      domContent.querySelector('a').addEventListener('click', (ev) => {
        this.sellPoints(p);
      })
      domElem.appendChild(domIcon);
      domElem.appendChild(domContent);
      wrapper.appendChild(domElem);
    });
  }
  domInit() {
    const { width, height, domElem } = this;
    domElem.innerHTML = "";
    this.foods.forEach((food, foodIndex) => {
      const foodId = food.food;
      const domFood = newElem('div', {
        classList: foodId ? [`food food-${foodId}`] : [`food food-empty`]
      });
      domFood.addEventListener('click', () => {
        if (animating) return;
        if (usingHose) this.useHose(foodIndex);
        else if (usingHoe) this.useHoe(foodIndex);
        else this.verifyFood(foodIndex);
      });
      domElem.appendChild(domFood);
    });
    domElem.style.gridTemplateColumns = 'auto '.repeat(width);
    domElem.style.gridTemplateRows = 'auto '.repeat(height);
  }
  firstNonEmpty(row, col) {
    for (let _row = row; _row >= 0; _row--) {
      const food = this.getFood(this.rowColIndex(_row, col));
      if (food) return this.rowColIndex(_row, col);
    }
    return false;
  }
  async fallFood() {
    let foodsReverse = this.foods.slice().reverse();
    let animLastRow = null;
    for (let fi = 0; fi < foodsReverse.length; fi++) {
      const i = this.foods.length - fi - 1;
      const f = this.getFood(i);
      if (f == null) {
        const [row, col] = this.indexRowCol(i);
        const upperIndex = this.firstNonEmpty(row, col);

        if (row == 0 || row != 0 && upperIndex == false) {
          this.setFood(i, rand(3, 7));
        } else {
          this.setFood(i, this.getFood(upperIndex), this.getStage(upperIndex));
          this.setFood(upperIndex, null)
        }

        if (row != animLastRow) {
          animLastRow = row;
          await sleep(animSpeeds.fast);
        }
      }
      this.domUpdateAll();
    }
  }
  getCombinations(index, value = null, combinations = []) {
    value = (value == null) ? this.getFood(index) : value;
    const [row, col] = this.indexRowCol(index);
    const nexts = [];

    const up = this.rowColIndex(row - 1, col);
    if (up >= 0 && this.getFood(up) == value && !combinations.includes(up)) {
      combinations.push(up);
      nexts.push(up);
    }

    const down = this.rowColIndex(row + 1, col);
    if (down >= 0 && this.getFood(down) == value && !combinations.includes(down)) {
      combinations.push(down);
      nexts.push(down);
    }

    const left = this.rowColIndex(row, col - 1);
    if (left >= 0 && this.getFood(left) == value && !combinations.includes(left)) {
      combinations.push(left);
      nexts.push(left);
    }

    const right = this.rowColIndex(row, col + 1);
    if (right >= 0 && this.getFood(right) == value && !combinations.includes(right)) {
      combinations.push(right);
      nexts.push(right);
    }

    for (const next of nexts) {
      const _combinations = this.getCombinations(next, value, combinations);
      combinations.concat(_combinations);
    }

    return combinations;
  }
  async animatePoints(index, points) {
    const originRect = domQueryAll('.grid .food')[index].getBoundingClientRect();
    const domPoint = newElem('p', {
      innerHTML: points
    });
    domPoint.classList = ['points'];
    domPoint.style.setProperty('--point-origin-x', `${originRect.left + 8}px`);
    domPoint.style.setProperty('--point-origin-y', `${originRect.top + 8}px`);
    domQuery('body').appendChild(domPoint);
    await sleep(animSpeeds.slowest);
    domPoint.remove();
  }
  async sellPoints(food) {
    const pointIndex = possibilities.indexOf(food);
    const points = this.points[pointIndex];
    if(points >= 1) {
      this.points[pointIndex] -= 1;
      this.gold += 2;
    }
    this.domUpdateAll();
  }
  async addPoints(index, points) {
    const food = this.getFood(index);
    const pointIndex = possibilities.indexOf(food);
    this.points[pointIndex] += points;
    await this.animatePoints(index, `${points * 100}%`);
  }
  async verifyFood(index) {
    animating = true;
    const food = this.getFood(index);
    
    if (food == null) return;
    const combinations = this.getCombinations(index).filter(onlyUnique);
    let stageMax = -1;
    const stageSum = combinations.reduce((acc, i) => {
      const _stage = this.getStage(i);
      acc += _stage;
      stageMax = _stage > stageMax ? _stage : stageMax;
      return acc;
    }, 0);

    const nextStage = Math.min(5, stageMax + Math.floor(stageSum / 3));

    if (combinations.length >= 3) {
      combinations.forEach(i => {
        if (i == index && food != 0) {
          if(nextStage != 5) this.animatePoints(index, `${(nextStage - 1) * 20}%`);
          this.setFood(food, nextStage);
        } else {
          this.setFood(null);
        }
      });
    }
    this.domUpdateAll();
    await sleep(animSpeeds.fast);

    if (this.getStage(index) >= 5) {
      this.addPoints(index, 1);
      domQueryAll('.grid .food')[index].classList.add('completed');
      await sleep(animSpeeds.slowest);
      domQueryAll('.grid .food')[index].classList.remove('completed');
      await this.useHoe(index);
    }

    this.domUpdateAll();
    await sleep(animSpeeds.fast);
    await this.fallFood();
    this.domUpdateAll();
    animating = false;
  }
  async useHoe(index) {
    animating = true;
    this.setFood(index, null);
    this.domUpdateAll();

    await sleep(animSpeeds.fast);

    await this.fallFood();
    animating = false;
  }
  async useHose(index) {
    animating = true;
    this.setFood(index, this.getFood(index), Math.min(4, this.getStage(index) + 1));

    await sleep(animSpeeds.fast);
    this.domUpdateAll();

    if (this.getStage(index) >= 5) {
      this.addPoints(index, 1);
      domQueryAll('.grid .food')[index].classList.add('completed');
      await sleep(animSpeeds.slowest);
      domQueryAll('.grid .food')[index].classList.remove('completed');
      await this.useHoe(index);
    }

    this.domUpdateAll();
    await sleep(animSpeeds.default);
    await this.fallFood();
    this.domUpdateAll();
    animating = false;
  }
}

window.addEventListener('load', () => {
  window.grid = new Grid(5, 5);

  const domToggleHoe = domQuery('#toggle-hoe');
  const domToggleHose = domQuery('#toggle-hose');
  
  domToggleHoe.addEventListener('change', (ev) => {
    usingHose = false;
    domToggleHose.checked = false;
    usingHoe = domToggleHoe.checked;
  });

  domToggleHose.addEventListener('change', (ev) => {
    usingHoe = false;
    domToggleHoe.checked = false;
    usingHose = domToggleHose.checked;
  });
});