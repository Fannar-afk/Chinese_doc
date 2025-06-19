// server.js - 后端主文件，处理API请求和体质分析
const express = require('express');
const mysql = require('mysql2/promise');
//const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
//app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// 托管前端静态文件（假设前端文件在frontend文件夹）
app.use(express.static(path.join(__dirname, '../frontend')));

// 数据库连接池配置
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Kexuejishu01!',
  database: '体质测试数据库',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 启动时测试数据库连接
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL 连接成功！');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL 连接失败：', err);
    process.exit(1); // 连接失败则退出程序
  }
})();

// 体质判定规则（完整9种体质）
const constitutionRules = {
  平和质: (data) => {
    const hasDeficiency = 
      data.fatigueScore >= 3 || 
      data.coldHandsFeetScore >= 3 || 
      data.dryMouthScore >= 3 || 
      (data.weight > 80 || data.weight < 45);
    const hasExcess = 
      data.tongueColor.includes('红') || 
      data.tongueCoating.includes('黄') || 
      data.pulse.includes('数');
    return !hasDeficiency && !hasExcess;
  },
  
  气虚质: (data) => {
    return (
      data.fatigueScore >= 3 &&
      data.sleepTime && data.sleepTime.includes('不足') &&
      data.exerciseFreq && data.exerciseFreq.includes('不运动') &&
      (data.tongueShape.includes('齿痕') || data.pulse.includes('弱'))
    );
  },
  
  阳虚质: (data) => {
    return (
      data.coldHandsFeetScore >= 3 &&
      data.preferHotFood === '是' &&
      data.stoolType.includes('溏稀') &&
      (data.tongueColor.includes('淡') || data.pulse.includes('迟'))
    );
  },
  
  阴虚质: (data) => {
    return (
      data.dryMouthScore >= 3 &&
      data.sleepQuality.includes('多梦') &&
      data.bodyHeat.includes('手足心热') &&
      (data.tongueColor.includes('红') && data.tongueCoating.includes('少'))
    );
  },
  
  痰湿质: (data) => {
    return (
      (data.weight > 80 || data.bmi > 28) &&
      data.mouthFeeling.includes('黏腻') &&
      data.stoolType.includes('黏滞') &&
      data.tongueCoating.includes('厚腻')
    );
  },
  
  湿热质: (data) => {
    return (
      data.mouthTaste.includes('苦') &&
      data.mouthOdor.includes('口臭') &&
      data.tongueColor.includes('红') &&
      data.tongueCoating.includes('黄') &&
      data.pulse.includes('数')
    );
  },
  
  血瘀质: (data) => {
    return (
      data.skinCondition.includes('干燥') &&
      data.skinColor.includes('晦暗') &&
      (data.menstrualDisorder === '是' || data.painCharacter.includes('刺痛'))
    );
  },
  
  气郁质: (data) => {
    return (
      data.chestDiscomfort === '是' &&
      (data.emotionalStatus.includes('抑郁') || data.emotionalStatus.includes('焦虑')) &&
      data.pulse.includes('弦')
    );
  },
  
  特禀质: (data) => {
    return (
      data.allergyHistory === '是' ||
      data.familyAllergyHistory === '是' ||
      (data.skinReaction && data.skinReaction.length > 0) ||
      (data.respiratorySymptoms && data.respiratorySymptoms.length > 0)
    );
  }
};

// 体质调养建议（完整9种体质）
const constitutionAdvice = {
  平和质: {
    体质特征: "阴阳气血调和，以体态适中、面色红润、精力充沛等为主要特征。",
    饮食建议: "饮食均衡，多吃五谷杂粮、蔬菜瓜果，少食过冷过热、肥甘厚味等食物。",
    运动建议: "适合各种运动，如散步、慢跑、太极拳、八段锦等，保持适量运动。",
    生活习惯: "作息规律，保持充足睡眠，避免过度劳累，保持心态平和。",
    中药调理: "一般无需特殊调理，可偶尔食用一些平和的药膳，如山药粥、莲子羹等。"
  },
  
  气虚质: {
    体质特征: "元气不足，以疲乏、气短、自汗等气虚表现为主要特征。",
    饮食建议: "宜食具有益气健脾作用的食物，如小米、粳米、山药、土豆、香菇、鸡肉等。",
    运动建议: "适合低强度、温和的运动，如散步、太极拳、瑜伽等，避免过度劳累。",
    生活习惯: "作息规律，避免熬夜和过度消耗体力，注意保暖，避免受寒。",
    中药调理: "可服用一些补气的中药，如黄芪、党参、白术、茯苓等，可煮成药膳食用。"
  },
  
  阳虚质: {
    体质特征: "阳气不足，以畏寒怕冷、手足不温等虚寒表现为主要特征。",
    饮食建议: "宜食温阳散寒的食物，如羊肉、牛肉、韭菜、生姜、辣椒、桂圆等。",
    运动建议: "适合在阳光充足的时候进行户外运动，如慢跑、爬山、太极拳等。",
    生活习惯: "注意保暖，尤其是背部和下肢，避免长时间处于阴冷潮湿的环境。",
    中药调理: "可服用一些温阳的中药，如附子、肉桂、干姜、鹿茸等，需在医生指导下使用。"
  },
  
  阴虚质: {
    体质特征: "阴液亏少，以口燥咽干、手足心热等虚热表现为主要特征。",
    饮食建议: "宜食滋阴润燥的食物，如银耳、百合、雪梨、莲子、黑芝麻、蜂蜜等。",
    运动建议: "适合温和的运动，如太极拳、瑜伽、游泳等，避免在高温环境下运动。",
    生活习惯: "作息规律，避免熬夜，保持心情舒畅，避免情绪激动。",
    中药调理: "可服用一些滋阴的中药，如麦冬、天冬、沙参、玉竹、石斛等，可煮成药膳食用。"
  },
  
  痰湿质: {
    体质特征: "痰湿凝聚，以形体肥胖、腹部肥满、口黏苔腻等痰湿表现为主要特征。",
    饮食建议: "宜食健脾利湿、化痰祛湿的食物，如薏米、赤小豆、冬瓜、荷叶、白萝卜等。",
    运动建议: "适合中等强度的运动，如慢跑、游泳、爬山、羽毛球等，有助于减肥和祛湿。",
    生活习惯: "作息规律，避免熬夜，保持居住环境干燥，避免潮湿。",
    中药调理: "可服用一些健脾祛湿的中药，如茯苓、白术、泽泻、薏苡仁等，可煮成药膳食用。"
  },
  
  湿热质: {
    体质特征: "湿热内蕴，以面垢油光、口苦、苔黄腻等湿热表现为主要特征。",
    饮食建议: "宜食清热利湿的食物，如绿豆、苦瓜、黄瓜、芹菜、薏米、莲子等。",
    运动建议: "适合高强度的运动，如跑步、游泳、打篮球等，有助于清热利湿。",
    生活习惯: "作息规律，避免熬夜，保持皮肤清洁，避免食用辛辣、油腻、甜食等食物。",
    中药调理: "可服用一些清热利湿的中药，如黄连、黄芩、黄柏、栀子等，需在医生指导下使用。"
  },
  
  血瘀质: {
    体质特征: "血行不畅，以肤色晦黯、舌质紫黯等血瘀表现为主要特征。",
    饮食建议: "宜食活血化瘀的食物，如黑木耳、红枣、桃仁、红花、当归等。",
    运动建议: "适合中等强度的运动，如慢跑、游泳、太极拳、八段锦等，有助于促进血液循环。",
    生活习惯: "作息规律，避免熬夜，保持心情舒畅，避免情绪压抑。",
    中药调理: "可服用一些活血化瘀的中药，如丹参、川芎、桃仁、红花等，需在医生指导下使用。"
  },
  
  气郁质: {
    体质特征: "气机郁滞，以神情抑郁、忧虑脆弱等气郁表现为主要特征。",
    饮食建议: "宜食疏肝理气的食物，如玫瑰花、茉莉花、菊花、陈皮、柠檬等。",
    运动建议: "适合户外运动，如散步、慢跑、爬山、瑜伽等，有助于缓解压力和情绪。",
    生活习惯: "作息规律，避免熬夜，保持心情舒畅，多参加社交活动，避免独处。",
    中药调理: "可服用一些疏肝理气的中药，如柴胡、郁金、香附、佛手等，可泡成茶饮。"
  },
  
  特禀质: {
    体质特征: "先天失常，以生理缺陷、过敏反应等为主要特征。",
    饮食建议: "宜食清淡、均衡的食物，避免食用辛辣、油腻、海鲜等易引起过敏的食物。",
    运动建议: "适合低强度的运动，如散步、太极拳、瑜伽等，避免在花粉、灰尘较多的环境运动。",
    生活习惯: "作息规律，避免熬夜，保持居住环境清洁，避免接触过敏原。",
    中药调理: "可服用一些抗过敏的中药，如防风、黄芪、白术、蝉蜕等，需在医生指导下使用。"
  }
};

// 体质分析核心函数
function analyzeConstitution(formData) {
  for (const constitution in constitutionRules) {
    if (constitutionRules[constitution](formData)) {
      return {
        type: constitution,
        advice: constitutionAdvice[constitution]
      };
    }
  }
  return {
    type: '平和质',
    advice: constitutionAdvice['平和质']
  };
}

// 体质测试提交接口
app.post('/api/submit-test', async (req, res) => {
  try {
    const formData = req.body;
    console.log('接收到的表单数据：', formData); // 新增日志，方便调试
    
    // 分析体质
    const { type, advice } = analyzeConstitution(formData);
    
    // 插入数据库（字段与表结构完全匹配）
    const query = `
      INSERT INTO new_test_records 
      (name, age, gender, height, weight, bmi, sleep_time, sleep_quality, exercise_freq, 
       work_stress, diet_pref, prefer_hot_food, fatigue_score, cold_hands_feet_score, 
       dry_mouth_score, body_heat, stool_type, mouth_feeling, mouth_taste, mouth_odor, 
       tongue_color, tongue_shape, tongue_coating, pulse, skin_condition, skin_color, 
       menstrual_disorder, pain_character, chest_discomfort, emotional_status, 
       allergy_history, family_allergy_history, skin_reaction, respiratory_symptoms, 
       body_type, advice, other_symptoms,create_time ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, NOW())
    `;
    
   // 修正后的参数数组，确保与 SQL 占位符严格对应
const values = [
  formData.name || null,
  formData.age || null,
  formData.gender || null,
  formData.height || null,
  formData.weight || null,
  formData.bmi ? parseFloat(formData.bmi) : null,
  formData.sleepTime || null,
  formData.sleepQuality || null,
  formData.exerciseFreq || null,
  formData.workStress || null,
  formData.dietPref || null,
  formData.preferHotFood || null,
  formData.fatigueScore || null,
  formData.coldHandsFeetScore || null,
  formData.dryMouthScore || null,
  formData.bodyHeat || null,
  formData.stoolType || null,
  formData.mouthFeeling || null,
  formData.mouthTaste || null,
  formData.mouthOdor || null,
  formData.tongueColor || null,
  formData.tongueShape || null,
  formData.tongueCoating || null,
  formData.pulse || null,
  formData.skinCondition || null,
  formData.skinColor || null,
  formData.menstrualDisorder || null,
  formData.painCharacter || null,
  formData.chestDiscomfort || null,
  formData.emotionalStatus || null,
  formData.allergyHistory || null,
  formData.familyAllergyHistory || null,
  formData.skinReaction || null,
  formData.respiratorySymptoms || null,
 type,
  JSON.stringify(advice), // 体质建议，正确位置
  formData.otherSymptoms || null
];
    
    await pool.execute(query, values);
    
    // 返回结果给前端
    res.json({ 
      success: true, 
      bodyType: type, 
      advice: advice 
    });
    
  } catch (error) {
    console.error('提交失败：', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 处理表单数据的路由
app.post('/analyze', function(req, res) {
    const formData = req.body;
    const result = analyzeConstitution(formData);
    res.json(result);
});




// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});