const characterEl = document.getElementById('character');
const defenseEl   = document.getElementById('defense');
const bossBtn     = document.getElementById('bossBtn');
const resultEl    = document.getElementById('result');

let characters = [];
let nerveData  = {};
let isBossMode = false;

// 加载角色数据
Promise.all([
  fetch('data/characters.json').then(r => r.json()),
  fetch('data/element.json').then(r => r.json())
]).then(([chars, element]) => {
  characters = chars;
  elementData  = element;
  populateCharacterSelect();
  characterEl.dispatchEvent(new Event('change'));
}).catch(err => {
  console.error('加载失败：', err);
  resultEl.innerHTML = '<p>数据加载失败，请检查控制台。</p>';
});

// 填充下拉菜单
function populateCharacterSelect() {
  characterEl.innerHTML = characters
    .map(ch => `<option value="${ch.id}">${ch.label}</option>`)
    .join('');
}

// 监听角色变化：显示/隐藏勾选框，重置状态，并计算结果
characterEl.addEventListener('change', () => {
  const char = characters.find(c => c.id === characterEl.value);
  if (char && char.type === 'nervous') {
    bossContainer.style.display = 'block';
  } else {
    bossContainer.style.display = 'none';
    bossCheckbox.checked = false;
  }
  updateResult();
});

// 监听勾选框变化：切换 Boss 模式
bossCheckbox.addEventListener('change', () => {
  isBossMode = bossCheckbox.checked;
  updateResult();
});

// 防御值变化时也要更新结果
defenseEl.addEventListener('input', updateResult);

// 计算并更新结果
function updateResult() {
  const charId = characterEl.value;
  const def = parseFloat(defenseEl.value) || 0;

  // 找到选中的角色配置
  const char = characters.find(c => c.id === charId);
  if (!char) return;

  // 从 JSON 中读取
  const { duration, interval, comboCount, baseAtk, plusBuff, mulBuff } = char;
  const attackCount = Math.round(duration / interval);

  // 计算 Buff
  const plusBuffTotal = plusBuff.reduce((sum, b) => sum + b, 1);
  const mulBuffTotal = mulBuff.reduce((prod, m) => prod * m, 1);
  const buffTotal = plusBuffTotal * mulBuffTotal;
  const atkTotal = baseAtk * buffTotal;

  let totalPhys = 0;
  let totalElement = 0;
  let dph = 0;

  if (char.type === 'nervous') {
    const threshold = isBossMode
      ? elementData.bossThreshold
      : elementData.normalThreshold;
    let cumNerve = 0, nextNerveTime = 0;

    for (let i = 0; i < attackCount; i++) {
      const t = i * interval;
      dph = Math.max(atkTotal - def, 0.05 * atkTotal);
      damagePerAttack = dph * char.comboCount;
      totalPhys += damagePerAttack;

      if (t >= nextNerveTime) {
        cumNerve += char.nerveRate * damagePerAttack;
        if (cumNerve >= threshold) {
          totalElement += elementData.nerveDamageValue;
          cumNerve = 0;
          nextNerveTime = t + elementData.nerveCooldown;
        }
      }
    }

  } else if (char.type === 'simple') {
    dph = Math.max(atkTotal - def, 0.05 * atkTotal);
    totalPhys = dph * comboCount * attackCount;
  }

  const total = totalPhys + totalElement;
  const dps   = total / duration;

  resultEl.innerHTML = `
    <p><strong>总伤害：</strong> ${total.toFixed(1)}</p>
    <p><strong>物理伤害：</strong> ${totalPhys.toFixed(1)}</p>
    <p><strong>元素伤害：</strong> ${totalElement.toFixed(1)}</p>
    <p><strong>DPS：</strong> ${dps.toFixed(2)}</p>
    <p><strong>DPH：</strong> ${dph.toFixed(2)}</p>
  `;
}

// 绑定事件
characterEl.addEventListener('change', updateResult);
defenseEl.addEventListener('input', updateResult);
