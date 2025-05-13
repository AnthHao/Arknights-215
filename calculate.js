const characterEl = document.getElementById('character');
const defenseEl   = document.getElementById('defense');
const resultEl    = document.getElementById('result');

let characters = [];

// 1. 加载角色数据
fetch('data/characters.json')
  .then(res => res.json())
  .then(data => {
    characters = data;
    populateCharacterSelect();
    updateResult();
  })
  .catch(err => {
    console.error('加载角色数据失败：', err);
    resultEl.innerHTML = '<p>角色数据加载失败，请检查控制台。</p>';
  });

// 2. 填充下拉菜单
function populateCharacterSelect() {
  characterEl.innerHTML = characters
    .map(ch => `<option value="${ch.id}">${ch.label}</option>`)
    .join('');
}

// 3. 计算并更新结果
function updateResult() {
  const charId = characterEl.value;
  const def = parseFloat(defenseEl.value) || 0;
  const duration = 30;
  const interval = 1.2;
  const attackCount = Math.floor(duration / interval);

  const char = characters.find(c => c.id === charId);
  if (!char) return;

  let totalPhys = 0;
  let totalTrue = 0;
  let lastDPH = 0;

  if (char.type === 'nervous') {
    const atk = char.baseAtk * char.atkMultiplier;
    const effAtk = atk * char.comboMultiplier;
    let cumNerve = 0;
    let nextNerveTime = 0;

    for (let i = 0; i < attackCount; i++) {
      const t = i * interval;
      const dphSingle = Math.max(effAtk - def, 0.05 * effAtk) * char.comboCount;
      totalPhys += dphSingle;
      lastDPH = dphSingle;

      // 神经损伤逻辑
      if (t >= nextNerveTime) {
        cumNerve += char.nerveRate * dphSingle;
        if (cumNerve >= char.nerveThreshold) {
          totalTrue += char.trueDamageValue;
          cumNerve = 0;
          nextNerveTime = t + char.nerveCooldown;
        }
      }
    }

  } else if (char.type === 'simple') {
    const totalMultiplier = char.atkMultipliers.reduce((a,b) => a*b, 1);
    const atk = char.baseAtk * totalMultiplier;
    const dphSingle = Math.max(atk - def, 0.05 * atk) * char.comboCount;
    lastDPH = dphSingle;
    totalPhys = dphSingle * attackCount;
  }

  const total = totalPhys + totalTrue;
  const dps = total / duration;

  resultEl.innerHTML = `
    <p><strong>总伤害：</strong> ${total.toFixed(1)}</p>
    <p><strong>物理伤害：</strong> ${totalPhys.toFixed(1)}</p>
    <p><strong>元素伤害：</strong> ${totalTrue.toFixed(1)}</p>
    <p><strong>DPS：</strong> ${dps.toFixed(2)}</p>
    <p><strong>DPH：</strong> ${lastDPH.toFixed(2)}</p>
  `;
}

// 4. 绑定事件
characterEl.addEventListener('change', updateResult);
defenseEl.addEventListener('input', updateResult);
