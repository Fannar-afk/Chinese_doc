const form = document.getElementById('reservation-form');

// 表单提交前验证
form.addEventListener('submit', (e) => {
    // 简单验证：多选至少选1个
    const checkboxes = document.querySelectorAll('input[name="course"]:checked');
    if (checkboxes.length === 0) {
        alert('请选择至少一个所需课堂名称！');
        e.preventDefault(); // 阻止提交
        return;
    }

    // 可在这里加“提交中...”提示（比如禁用按钮）
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';

    // 【新增】使用 fetch 以 POST 方式提交表单数据到后端
    const formData = new FormData(form);
    fetch('/submit_reservation', { 
        method: 'POST', 
        body: formData
    })
   .then(response => response.json())
   .then(data => {
        if (data.success) { 
            alert('预约提交成功！' + (data.message || ''));
            form.reset(); 
            submitBtn.disabled = false;
            submitBtn.textContent = '提交';
        } else {
            alert('提交失败：' + data.error);
            submitBtn.disabled = false;
            submitBtn.textContent = '提交';
        }
    })
   .catch(error => {
        alert('提交时发生网络错误：' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = '提交';
    });

    // 注意：如果没有上面的 fetch 提交逻辑，默认表单可能会以 GET 方式提交导致数据出现在地址栏
    // 这里因为我们自己用 fetch 处理了提交，下面可以注释掉或删掉默认的提交阻止（不过上面已经用 e.preventDefault 了，实际要结合情况看）
    // e.preventDefault(); 
});