const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const { isDate, isString, isArray } = require('lodash');

const app = express();
const port = 3000;

// 解析表单数据（支持 URL 编码和 JSON 格式）
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL 连接池配置（需替换为你的数据库信息）
const pool = mysql.createPool({
    host: 'localhost',        // 数据库主机，通常为 localhost
    user: 'root',             // 数据库用户名
    password: 'Kexuejishu01!', // 数据库密码（若未设置则留空）
    database: 'chinese_medicine_reservation', // 数据库名称
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 输入验证函数
function validateInput(data) {
    const { date, region, address, category, course, classInfo, contactName, contactPhone } = data;
    if (!isDate(new Date(date)) || 
        !isString(region) || region.trim() === '' ||
        !isString(address) || address.trim() === '' ||
        !isString(category) || category.trim() === '' ||
        (!isString(course) &&!isArray(course)) ||
        !isString(classInfo) || classInfo.trim() === '' ||
        !isString(contactName) || contactName.trim() === '' ||
        !isString(contactPhone) || contactPhone.trim() === ''
    ) {
        return false;
    }
    return true;
}

// 处理表单提交路由
app.post('/submit_reservation', async (req, res) => {
    try {
        // 输入验证
        if (!validateInput(req.body)) {
            return res.status(400).json({ 
                success: false, 
                error: '输入数据格式不正确，请检查后重新提交。' 
            });
        }

        // 从请求体中获取表单数据
        const { date, region, address, category, course, classInfo, contactName, contactPhone } = req.body;
        
        // 处理多选课程（将数组转为字符串存储）
        const courses = Array.isArray(course) ? course.join(', ') : course;
        
        // 从连接池获取连接并执行插入操作
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                'INSERT INTO reservations (date, region, address, category, courses, class_info, contact_name, contact_phone) VALUES (?,?,?,?,?,?,?,?)',
                [date, region, address, category, courses, classInfo, contactName, contactPhone]
            );
            
            // 返回成功响应
            res.status(200).json({ 
                success: true, 
                message: '预约提交成功！我们将尽快与您联系。',
                reservationId: result.insertId // 返回插入的记录ID
            });
        } catch (sqlError) {
            console.error('SQL 执行错误:', sqlError);
            res.status(500).json({ 
                success: false, 
                error: '数据库操作失败，请稍后再试。' 
            });
        } finally {
            // 释放连接回连接池
            connection.release();
        }
    } catch (error) {
        console.error('数据库连接错误:', error);
        res.status(500).json({ 
            success: false, 
            error: '提交预约失败，请稍后再试。' 
        });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`中医预约系统后端已启动，监听端口 ${port}`);
    console.log(`访问 http://localhost:${port}/submit_reservation 测试接口`);
});