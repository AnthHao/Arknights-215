const characterEl = document.getElementById('character');
const defenseEl   = document.getElementById('defense');
const resultEl    = document.getElementById('result');

let characters = [];

// 加载角色数据
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

// 填充下拉菜单
function populateCharacterSelect() {
  characterEl.innerHTML = characters
    .map(ch => `<option value="${ch.id}">${ch.label}</option>`)
    .join('');
}

// 计算并更新结果
function updateResult() {
  const charId = characterEl.value;
  const def = parseFloat(defenseEl.value) || 0;

  // 找到选中的角色配置
  const char = characters.find(c => c.id === charId);
  if (!char) return;

  // 从 JSON 中读取
  const { duration, interval, comboCount, baseAtk, plusBuff, mulBuff } = char;
  const attackCount = Math.floor(duration / interval);

  // 计算 Buff
  const plusBuffTotal = char.plusBuff.reduce((sum, b) => sum + b, 1);
  const mulBuffTotal = char.mulBuff.reduce((prod, m) => prod * m, 1);
  const buffTotal = plusBuffTotal * mulBuffTotal;
  const atkTotal = char.baseAtk * buffTotal;

  let totalPhys = 0;
  let totalTrue = 0;
  let dph = 0;

  if (char.type === 'nervous') {
    let cumNerve      = 0;
    let nextNerveTime = 0;

    for (let i = 0; i < attackCount; i++) {
      const t = i * interval;
      dph = Math.max(atkTotal - def, 0.05 * atkTotal);
      damagePerAtk =  dph * comboCount;
      totalPhys += damagePerAtk;

      // 神经损伤逻辑
      if (t >= nextNerveTime) {
        cumNerve += char.nerveRate * damagePerAtk;
        if (cumNerve >= char.nerveThreshold) {
          totalTrue += char.trueDamageValue;
          cumNerve = 0;
          nextNerveTime = t + char.nerveCooldown;
        }
      }
    }

  } else if (char.type === 'simple') {
    dph = Math.max(atkTotal - def, 0.05 * atkTotal);
    totalPhys = dph * comboCount * attackCount;
  }

  const total = totalPhys + totalTrue;
  const dps   = total / duration;

  resultEl.innerHTML = `
    <p><strong>总伤害：</strong> ${total.toFixed(1)}</p>
    <p><strong>物理伤害：</strong> ${totalPhys.toFixed(1)}</p>
    <p><strong>元素伤害：</strong> ${totalTrue.toFixed(1)}</p>
    <p><strong>DPS：</strong> ${dps.toFixed(2)}</p>
    <p><strong>DPH：</strong> ${dph.toFixed(2)}</p>
  `;
}

// 绑定事件
characterEl.addEventListener('change', updateResult);
defenseEl.addEventListener('input', updateResult);
