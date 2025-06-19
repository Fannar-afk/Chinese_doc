// script.js - 前端逻辑，处理表单提交和结果展示
/*document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('testForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault(); // 阻止表单默认提交行为


 const formData = new FormData(form);

        // 发送表单数据到后端
        fetch('/analyze', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const bodyType = data.type;
            const advice = data.advice;
            displayResult(bodyType, advice);
        })
        .catch(error => console.error('Error:', error));
    });
});*/

  const submitBtn = document.getElementById('submitBtn');
  const resultContainer = document.getElementById('result-container');
  const genderSelect = document.getElementById('gender');
  const femaleSymptoms = document.getElementById('femaleSymptoms');
  
  // 根据性别显示/隐藏女性特有症状
  genderSelect.addEventListener('change', function() {
    if (this.value === '女') {
      femaleSymptoms.style.display = 'block';
    } else {
      femaleSymptoms.style.display = 'none';
    }
  });
  
// 更新进度条
  function updateProgressBar() {
    let completedSteps = 0;
    formGroups.forEach(group => {
      const inputs = group.querySelectorAll('input, select, textarea');
      let isGroupCompleted = true;
      inputs.forEach(input => {
        if (input.required && input.value === '') {
          isGroupCompleted = false;
        }
      });
      if (isGroupCompleted) {
        completedSteps++;
      }
    });
    const progress = (completedSteps / totalSteps) * 100;
    progressBar.style.width = progress + '%';
    progressBar.textContent = Math.round(progress) + '%';
  }

  // 监听表单输入事件，更新进度条
  const form = document.getElementById('testForm');
  form.addEventListener('input', updateProgressBar);
  
  submitBtn.addEventListener('click', async function() {
    // 收集表单数据
    const formData = {
      name: document.getElementById('name').value,
      age: parseInt(document.getElementById('age').value),
      gender: document.getElementById('gender').value,
      height: parseInt(document.getElementById('height').value),
      weight: parseInt(document.getElementById('weight').value),
      // 计算BMI
      bmi: calculateBMI(),
      sleepTime: document.getElementById('sleepTime').value,
      sleepQuality: document.getElementById('sleepQuality').value,
      exerciseFreq: document.getElementById('exerciseFreq').value,
      workStress: document.getElementById('workStress').value,
      dietPref: document.getElementById('dietPref').value,
      preferHotFood: document.querySelector('input[name="preferHotFood"]:checked')?.value,
      fatigueScore: parseInt(document.querySelector('input[name="fatigueScore"]:checked').value),
      coldHandsFeetScore: parseInt(document.querySelector('input[name="coldHandsFeetScore"]:checked').value),
      dryMouthScore: parseInt(document.querySelector('input[name="dryMouthScore"]:checked').value),
      bodyHeat: Array.from(document.getElementById('bodyHeat').selectedOptions)
                   .map(option => option.value)
                   .join(','),
      stoolType: document.getElementById('stoolType').value,
      mouthFeeling: document.getElementById('mouthFeeling').value,
      mouthTaste: document.getElementById('mouthTaste')?.value || '',
      mouthOdor: document.getElementById('mouthOdor').value,
      tongueColor: document.getElementById('tongueColor').value,
      tongueShape: document.getElementById('tongueShape').value,
      tongueCoating: document.getElementById('tongueCoating').value,
      pulse: document.getElementById('pulse').value,
      skinCondition: document.getElementById('skinCondition')?.value || '',
      skinColor: document.getElementById('skinColor')?.value || '',
      menstrualDisorder: document.getElementById('menstrualDisorder')?.value || '否',
      painCharacter: document.getElementById('painCharacter')?.value || '',
      chestDiscomfort: document.getElementById('chestDiscomfort')?.value || '否',
      emotionalStatus: document.getElementById('emotionalStatus')?.value || '',
      allergyHistory: document.getElementById('allergyHistory')?.value || '否',
      familyAllergyHistory: document.getElementById('familyAllergyHistory')?.value || '否',
      skinReaction: document.getElementById('skinReaction')?.value || '',
      respiratorySymptoms: document.getElementById('respiratorySymptoms')?.value || '',
      otherSymptoms: document.getElementById('otherSymptoms').value
    };
    
    // 验证必填字段
    if (!formData.name || !formData.age || !formData.gender || 
        !formData.height || !formData.weight || !formData.sleepTime ||
        !formData.exerciseFreq || !formData.preferHotFood ||
        !formData.fatigueScore || !formData.coldHandsFeetScore ||
        !formData.dryMouthScore || !formData.stoolType ||
        !formData.mouthFeeling || !formData.tongueColor ||
        !formData.tongueShape || !formData.tongueCoating || !formData.pulse) {
      alert('请填写所有必填项');
      return;
    }
    
    // 发送请求到后端
    try {
      const response = await fetch('http://localhost:3000/api/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 展示体质分析结果
        displayResult(data.bodyType, data.advice);
      } else {
        alert('提交失败：' + data.message);
      }
    } catch (error) {
      console.error('请求出错：', error);
      alert('提交过程中出现错误，请重试');
    }
  });
  
  // 计算BMI
  function calculateBMI() {
    const heightM = document.getElementById('height').value / 100;
    const weight = document.getElementById('weight').value;
    return (weight / (heightM * heightM)).toFixed(1);
  }
  



  
  // 展示结果
  function displayResult(bodyType, advice) {
    // 为不同体质类型设置不同的颜色
    let bodyTypeColor = '#333'; // 默认颜色
    if (bodyType === '平和质') bodyTypeColor = '#27ae60';
    else if (bodyType === '气虚质') bodyTypeColor = '#f39c12';
    else if (bodyType === '阳虚质') bodyTypeColor = '#e74c3c';
    else if (bodyType === '阴虚质') bodyTypeColor = '#9b59b6';
    else if (bodyType === '痰湿质') bodyTypeColor = '#3498db';
    else if (bodyType === '湿热质') bodyTypeColor = '#e67e22';
    else if (bodyType === '血瘀质') bodyTypeColor = '#c0392b';
    else if (bodyType === '气郁质') bodyTypeColor = '#2980b9';
    else if (bodyType === '特禀质') bodyTypeColor = '#8e44ad';
    
    resultContainer.innerHTML = `
      <h3>体质分析结果</h3>
      <div class="result-card">
        <div class="result-header" style="color: ${bodyTypeColor};">
          <h4>${bodyType}</h4>
        </div>
        <div class="result-body">
          <p><strong>体质特征：</strong>${advice.体质特征}</p>
          <p><strong>饮食建议：</strong>${advice.饮食建议}</p>
          <p><strong>运动建议：</strong>${advice.运动建议}</p>
          <p><strong>生活习惯：</strong>${advice.生活习惯}</p>
          <p><strong>中药调理：</strong>${advice.中药调理}</p>
        </div>
      </div>
    `;
  }
