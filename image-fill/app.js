// 全局状态
const state = {
    templateImage: null,
    templateImageUrl: null,
    excelData: [],
    excelColumns: [],
    fields: [],
    generatedImages: []
};

// DOM 元素
const elements = {
    imageUpload: document.getElementById('imageUpload'),
    imageInput: document.getElementById('imageInput'),
    excelUpload: document.getElementById('excelUpload'),
    excelInput: document.getElementById('excelInput'),
    excelPreview: document.getElementById('excelPreview'),
    dataTable: document.getElementById('dataTable'),
    dataCount: document.getElementById('dataCount'),
    configStep: document.getElementById('configStep'),
    templatePreview: document.getElementById('templatePreview'),
    previewImage: document.getElementById('previewImage'),
    configPanel: document.getElementById('configPanel'),
    generateStep: document.getElementById('generateStep'),
    generateBtn: document.getElementById('generateBtn'),
    progressArea: document.getElementById('progressArea'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    resultArea: document.getElementById('resultArea')
};

// 初始化
function init() {
    bindEvents();
}

// 绑定事件
function bindEvents() {
    // 图片上传
    elements.imageUpload.addEventListener('click', () => elements.imageInput.click());
    elements.imageInput.addEventListener('change', handleImageUpload);
    elements.imageUpload.addEventListener('dragover', handleDragOver);
    elements.imageUpload.addEventListener('dragleave', handleDragLeave);
    elements.imageUpload.addEventListener('drop', (e) => handleDrop(e, 'image'));

    // Excel上传
    elements.excelUpload.addEventListener('click', () => elements.excelInput.click());
    elements.excelInput.addEventListener('change', handleExcelUpload);
    elements.excelUpload.addEventListener('dragover', handleDragOver);
    elements.excelUpload.addEventListener('dragleave', handleDragLeave);
    elements.excelUpload.addEventListener('drop', (e) => handleDrop(e, 'excel'));

    // 生成按钮
    elements.generateBtn.addEventListener('click', generateImages);
}

// 拖拽事件处理
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('active');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('active');
}

function handleDrop(e, type) {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
    const file = e.dataTransfer.files[0];
    if (type === 'image') {
        processImageFile(file);
    } else {
        processExcelFile(file);
    }
}

// 处理图片上传
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) processImageFile(file);
}

function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        state.templateImageUrl = e.target.result;
        
        const img = new Image();
        img.onload = () => {
            state.templateImage = img;
            elements.imageUpload.innerHTML = `
                <div class="upload-icon">✅</div>
                <div class="upload-text">${file.name}</div>
                <div class="upload-hint">${img.width} x ${img.height} 像素</div>
            `;
            checkShowConfigStep();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 处理Excel上传
function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (file) processExcelFile(file);
}

function processExcelFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                alert('Excel文件为空');
                return;
            }

            state.excelData = jsonData;
            state.excelColumns = Object.keys(jsonData[0]);

            // 更新上传区域显示
            elements.excelUpload.innerHTML = `
                <div class="upload-icon">✅</div>
                <div class="upload-text">${file.name}</div>
                <div class="upload-hint">共 ${jsonData.length} 条数据</div>
            `;

            // 显示数据预览
            showDataPreview();
            checkShowConfigStep();
        } catch (error) {
            alert('Excel文件解析失败：' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// 显示数据预览
function showDataPreview() {
    const previewData = state.excelData.slice(0, 5);
    
    let tableHtml = '<table class="data-table"><thead><tr>';
    state.excelColumns.forEach(col => {
        tableHtml += `<th>${col}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    
    previewData.forEach(row => {
        tableHtml += '<tr>';
        state.excelColumns.forEach(col => {
            tableHtml += `<td>${row[col] || ''}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';

    elements.dataTable.innerHTML = tableHtml;
    elements.dataCount.textContent = `共 ${state.excelData.length} 条数据`;
    elements.excelPreview.style.display = 'block';
}

// 检查是否显示配置步骤
function checkShowConfigStep() {
    if (state.templateImage && state.excelData.length > 0) {
        elements.configStep.style.display = 'block';
        elements.generateStep.style.display = 'block';
        elements.previewImage.src = state.templateImageUrl;
        renderConfigPanel();
        renderFileNameConfig();
        initOutputSettings();
    }
}

// 初始化输出设置（根据原图格式设置默认值）
function initOutputSettings() {
    const format = detectImageFormat();
    const formatSelect = document.getElementById('outputFormat');
    if (formatSelect) {
        formatSelect.value = format;
    }
    updateOutputSettings();
}

// 检测原图格式
function detectImageFormat() {
    if (!state.templateImageUrl) return 'jpeg';
    
    const dataUrl = state.templateImageUrl;
    if (dataUrl.startsWith('data:image/png')) return 'png';
    if (dataUrl.startsWith('data:image/webp')) return 'webp';
    if (dataUrl.startsWith('data:image/gif')) return 'png'; // GIF转PNG保持透明
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'jpeg';
    
    // 默认返回jpeg
    return 'jpeg';
}

// 更新输出设置（格式变化时调用）
function updateOutputSettings() {
    updateNamingExtension();
    updateEstimatedSize();
}

// 更新文件扩展名预览
function updateNamingExtension() {
    const extPreview = document.getElementById('namingExtPreview');
    if (extPreview) {
        extPreview.textContent = getFileExtension();
    }
}

// 计算并显示预估文件大小
function updateEstimatedSize() {
    const sizeEl = document.getElementById('estimatedSize');
    if (!sizeEl || !state.templateImage) {
        if (sizeEl) sizeEl.textContent = '--';
        return;
    }
    
    const format = getOutputFormat();
    const quality = getOutputQuality();
    const width = state.templateImage.width;
    const height = state.templateImage.height;
    const pixels = width * height;
    
    // 根据格式和质量估算文件大小（经验公式）
    let estimatedBytes;
    
    if (format === 'png') {
        // PNG无损，大小主要取决于图片复杂度，这里用保守估计
        estimatedBytes = pixels * 2.5; // 约2.5字节/像素
    } else if (format === 'webp') {
        // WebP压缩效率高
        estimatedBytes = pixels * quality * 0.8;
    } else {
        // JPEG
        estimatedBytes = pixels * quality * 1.2;
    }
    
    // 格式化显示
    if (estimatedBytes < 1024) {
        sizeEl.textContent = `约 ${Math.round(estimatedBytes)} B`;
    } else if (estimatedBytes < 1024 * 1024) {
        sizeEl.textContent = `约 ${(estimatedBytes / 1024).toFixed(1)} KB`;
    } else {
        sizeEl.textContent = `约 ${(estimatedBytes / 1024 / 1024).toFixed(1)} MB`;
    }
}

// 渲染文件命名配置
function renderFileNameConfig() {
    const columnCheckboxes = document.getElementById('columnCheckboxes');
    const filePrefix = document.getElementById('filePrefix');
    const fileSuffix = document.getElementById('fileSuffix');
    const columnSeparator = document.getElementById('columnSeparator');
    const addRandomSuffix = document.getElementById('addRandomSuffix');
    const randomLength = document.getElementById('randomLength');
    
    // 生成列复选框
    let checkboxHtml = '';
    state.excelColumns.forEach((col, index) => {
        const checked = index === 0 ? 'checked' : '';
        const selectedClass = index === 0 ? 'selected' : '';
        checkboxHtml += `
            <label class="column-checkbox-item ${selectedClass}" data-column="${col}">
                <input type="checkbox" value="${col}" ${checked}>
                ${col}
            </label>
        `;
    });
    columnCheckboxes.innerHTML = checkboxHtml;
    
    // 绑定复选框点击事件
    columnCheckboxes.querySelectorAll('.column-checkbox-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const checkbox = item.querySelector('input');
            checkbox.checked = !checkbox.checked;
            item.classList.toggle('selected', checkbox.checked);
            updateNamingPreview();
        });
    });
    
    // 绑定预览更新事件
    filePrefix.addEventListener('input', updateNamingPreview);
    fileSuffix.addEventListener('input', updateNamingPreview);
    columnSeparator.addEventListener('input', updateNamingPreview);
    addRandomSuffix.addEventListener('change', updateNamingPreview);
    randomLength.addEventListener('input', updateNamingPreview);
    
    updateNamingPreview();
}

// 获取选中的列
function getSelectedColumns() {
    const checkboxes = document.querySelectorAll('#columnCheckboxes input:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// 生成随机字符串
function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 更新命名预览
function updateNamingPreview() {
    const prefix = document.getElementById('filePrefix').value;
    const suffix = document.getElementById('fileSuffix').value;
    const separator = document.getElementById('columnSeparator').value;
    const addRandom = document.getElementById('addRandomSuffix').checked;
    const randomLen = parseInt(document.getElementById('randomLength').value) || 4;
    
    const selectedColumns = getSelectedColumns();
    
    let sampleName = '';
    if (selectedColumns.length > 0 && state.excelData.length > 0) {
        const parts = selectedColumns.map(col => state.excelData[0][col] || '');
        sampleName = parts.join(separator);
    } else {
        sampleName = '001';
    }
    
    let fullName = `${prefix}${sampleName}${suffix}`;
    if (addRandom) {
        fullName += `_${generateRandomString(randomLen)}`;
    }
    
    document.getElementById('namingPreview').textContent = fullName;
    updateNamingExtension();
}

// 获取文件名
function getFileName(rowData, index) {
    const prefix = document.getElementById('filePrefix').value;
    const suffix = document.getElementById('fileSuffix').value;
    const separator = document.getElementById('columnSeparator').value;
    const addRandom = document.getElementById('addRandomSuffix').checked;
    const randomLen = parseInt(document.getElementById('randomLength').value) || 4;
    
    const selectedColumns = getSelectedColumns();
    
    let mainName = '';
    if (selectedColumns.length > 0) {
        const parts = selectedColumns.map(col => String(rowData[col] || ''));
        mainName = parts.join(separator);
    }
    
    // 如果没有选择列或值为空，使用序号
    if (!mainName.trim()) {
        mainName = String(index + 1).padStart(3, '0');
    }
    
    // 清理文件名中的非法字符
    mainName = mainName.replace(/[\\/:*?"<>|]/g, '_');
    
    let fullName = `${prefix}${mainName}${suffix}`;
    
    // 添加随机数防重名
    if (addRandom) {
        fullName += `_${generateRandomString(randomLen)}`;
    }
    
    return fullName;
}

// 渲染配置面板
function renderConfigPanel() {
    // 如果没有字段，默认添加两个
    if (state.fields.length === 0) {
        state.fields = [
            { id: 1, column: state.excelColumns[0] || '', defaultValue: '', x: 100, y: 100, fontSize: 24, color: '#333333', bgColor: '', fontFamily: 'sans-serif' },
            { id: 2, column: state.excelColumns[1] || '', defaultValue: '', x: 100, y: 150, fontSize: 24, color: '#333333', bgColor: '', fontFamily: 'sans-serif' }
        ];
    }

    let html = '';
    state.fields.forEach((field, index) => {
        html += createFieldConfigHtml(field, index);
    });

    html += `<button class="add-field-btn" onclick="addField()">+ 添加字段</button>`;
    
    elements.configPanel.innerHTML = html;
    updateMarkers();
}


// 创建字段配置HTML
function createFieldConfigHtml(field, index) {
    const columnOptions = state.excelColumns.map(col => 
        `<option value="${col}" ${field.column === col ? 'selected' : ''}>${col}</option>`
    ).join('');

    return `
        <div class="field-config" data-field-id="${field.id}">
            <h4>
                <span>📍 字段 ${index + 1}</span>
                ${state.fields.length > 1 ? `<button class="remove-field-btn" onclick="removeField(${field.id})">删除</button>` : ''}
            </h4>
            
            <label>选择Excel列</label>
            <select onchange="updateField(${field.id}, 'column', this.value)">
                <option value="">-- 请选择 --</option>
                ${columnOptions}
            </select>
            
            <label>默认值（当Excel数据为空时使用）</label>
            <input type="text" value="${field.defaultValue || ''}" placeholder="留空则不显示"
                   onchange="updateField(${field.id}, 'defaultValue', this.value)">
            
            <label>位置坐标</label>
            <div class="position-inputs">
                <div>
                    <input type="number" value="${field.x}" placeholder="X坐标" 
                           onchange="updateField(${field.id}, 'x', parseInt(this.value))">
                </div>
                <div>
                    <input type="number" value="${field.y}" placeholder="Y坐标"
                           onchange="updateField(${field.id}, 'y', parseInt(this.value))">
                </div>
            </div>
            
            <label>字体大小</label>
            <input type="number" value="${field.fontSize}" min="12" max="200"
                   onchange="updateField(${field.id}, 'fontSize', parseInt(this.value))">
            
            <label>文字颜色</label>
            <div class="color-row">
                <input type="color" value="${field.color}" 
                       onchange="updateField(${field.id}, 'color', this.value)">
                <input type="text" value="${field.color}" 
                       onchange="updateField(${field.id}, 'color', this.value)">
            </div>
            
            <label>背景色 <small style="color:#999">(取消勾选透明后选择颜色)</small></label>
            <div class="color-row">
                <input type="color" value="${field.bgColor || '#ffffff'}" 
                       onchange="updateField(${field.id}, 'bgColor', this.value); this.parentElement.querySelector('input[type=checkbox]').checked = false;">
                <input type="text" value="${field.bgColor || ''}" placeholder="输入颜色值"
                       onchange="updateField(${field.id}, 'bgColor', this.value)">
                <label style="display:flex;align-items:center;gap:5px;margin:0;white-space:nowrap;">
                    <input type="checkbox" ${!field.bgColor ? 'checked' : ''} 
                           onchange="updateField(${field.id}, 'bgColor', this.checked ? '' : (this.parentElement.parentElement.querySelector('input[type=color]').value || '#ffffff'))"> 透明
                </label>
            </div>
            
            <label>字体</label>
            <select onchange="updateField(${field.id}, 'fontFamily', this.value)">
                <option value="sans-serif" ${field.fontFamily === 'sans-serif' ? 'selected' : ''}>默认无衬线</option>
                <option value="serif" ${field.fontFamily === 'serif' ? 'selected' : ''}>衬线字体</option>
                <option value="Microsoft YaHei" ${field.fontFamily === 'Microsoft YaHei' ? 'selected' : ''}>微软雅黑</option>
                <option value="SimHei" ${field.fontFamily === 'SimHei' ? 'selected' : ''}>黑体</option>
                <option value="SimSun" ${field.fontFamily === 'SimSun' ? 'selected' : ''}>宋体</option>
                <option value="KaiTi" ${field.fontFamily === 'KaiTi' ? 'selected' : ''}>楷体</option>
            </select>
        </div>
    `;
}

// 更新字段
function updateField(id, key, value) {
    const field = state.fields.find(f => f.id === id);
    if (field) {
        field[key] = value;
        updateMarkers();
    }
}

// 添加字段
function addField() {
    const newId = Math.max(...state.fields.map(f => f.id), 0) + 1;
    state.fields.push({
        id: newId,
        column: '',
        defaultValue: '',
        x: 100,
        y: 100 + state.fields.length * 50,
        fontSize: 24,
        color: '#333333',
        bgColor: '',
        fontFamily: 'sans-serif'
    });
    renderConfigPanel();
}

// 删除字段
function removeField(id) {
    state.fields = state.fields.filter(f => f.id !== id);
    renderConfigPanel();
}

// 更新位置标记
function updateMarkers() {
    // 移除旧标记
    document.querySelectorAll('.position-marker').forEach(el => el.remove());

    // 获取图片实际显示尺寸与原始尺寸的比例
    const img = elements.previewImage;
    const scaleX = img.clientWidth / state.templateImage.width;
    const scaleY = img.clientHeight / state.templateImage.height;

    // 添加新标记
    state.fields.forEach(field => {
        if (field.column) {
            const marker = document.createElement('div');
            marker.className = 'position-marker';
            marker.textContent = field.column;
            marker.style.left = (field.x * scaleX) + 'px';
            marker.style.top = (field.y * scaleY) + 'px';
            marker.dataset.fieldId = field.id;
            
            // 根据字段配置设置标记样式（按比例缩放字体大小）
            const scaledFontSize = Math.max(10, Math.round(field.fontSize * scaleX));
            marker.style.fontSize = scaledFontSize + 'px';
            marker.style.color = field.color;
            marker.style.fontFamily = field.fontFamily;
            marker.style.backgroundColor = field.bgColor || 'rgba(255, 255, 255, 0.85)';
            marker.style.border = `2px solid ${field.color}`;
            marker.style.padding = '2px 8px';
            
            // 拖拽功能
            marker.addEventListener('mousedown', startDrag);
            
            elements.templatePreview.appendChild(marker);
        }
    });
}

// 拖拽标记
let dragState = { isDragging: false, marker: null, offsetX: 0, offsetY: 0 };

function startDrag(e) {
    dragState.isDragging = true;
    dragState.marker = e.target;
    dragState.offsetX = e.offsetX;
    dragState.offsetY = e.offsetY;
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    if (!dragState.isDragging) return;
    
    const preview = elements.templatePreview;
    const rect = preview.getBoundingClientRect();
    const img = elements.previewImage;
    
    let x = e.clientX - rect.left - dragState.offsetX;
    let y = e.clientY - rect.top - dragState.offsetY;
    
    // 限制在图片范围内
    x = Math.max(0, Math.min(x, img.clientWidth - 50));
    y = Math.max(0, Math.min(y, img.clientHeight - 20));
    
    dragState.marker.style.left = x + 'px';
    dragState.marker.style.top = y + 'px';
    
    // 更新字段坐标
    const fieldId = parseInt(dragState.marker.dataset.fieldId);
    const field = state.fields.find(f => f.id === fieldId);
    if (field) {
        const scaleX = state.templateImage.width / img.clientWidth;
        const scaleY = state.templateImage.height / img.clientHeight;
        field.x = Math.round(x * scaleX);
        field.y = Math.round(y * scaleY);
        
        // 更新输入框
        renderConfigPanel();
    }
}

function stopDrag() {
    dragState.isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// 点击图片设置位置
elements.previewImage.addEventListener('click', (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = state.templateImage.width / e.target.clientWidth;
    const scaleY = state.templateImage.height / e.target.clientHeight;
    
    // 找到第一个没有设置位置的字段，或者更新最后一个字段
    const field = state.fields.find(f => !f.column) || state.fields[state.fields.length - 1];
    if (field) {
        field.x = Math.round(x * scaleX);
        field.y = Math.round(y * scaleY);
        renderConfigPanel();
    }
});

// 生成图片
async function generateImages() {
    const validFields = state.fields.filter(f => f.column);
    if (validFields.length === 0) {
        alert('请至少配置一个字段');
        return;
    }

    elements.generateBtn.disabled = true;
    elements.progressArea.style.display = 'block';
    state.generatedImages = [];
    
    // 先显示结果区域的框架
    elements.resultArea.innerHTML = `
        <div class="result-grid" id="resultGrid"></div>
        <button class="download-all-btn" onclick="downloadAll()" disabled>📦 打包下载全部</button>
    `;

    const total = state.excelData.length;
    const resultGrid = document.getElementById('resultGrid');
    const startTime = Date.now();
    
    for (let i = 0; i < total; i++) {
        const row = state.excelData[i];
        const imageData = await generateSingleImage(row, validFields);
        const fileName = getFileName(row, i);
        
        state.generatedImages.push({
            name: fileName,
            data: imageData
        });

        // 更新进度
        const progress = Math.round(((i + 1) / total) * 100);
        elements.progressBar.style.width = progress + '%';
        
        // 计算预估剩余时间
        const elapsed = Date.now() - startTime;
        const avgTime = elapsed / (i + 1);
        const remaining = Math.round((total - i - 1) * avgTime / 1000);
        const remainingText = remaining > 0 ? `，预计剩余 ${remaining}秒` : '';
        elements.progressText.textContent = `正在生成... ${i + 1}/${total} (${progress}%)${remainingText}`;
        
        // 实时添加生成的图片到结果区域
        const itemHtml = `
            <div class="result-item" style="animation: fadeIn 0.3s ease">
                <img src="${imageData}" alt="${fileName}" onclick="openPreviewModal(${i})">
                <div class="item-info">
                    <span class="item-name">${fileName}</span>
                    <button class="download-btn" onclick="downloadImage(${i})">下载</button>
                </div>
            </div>
        `;
        resultGrid.insertAdjacentHTML('beforeend', itemHtml);
        
        // 让浏览器有机会更新UI
        await new Promise(r => setTimeout(r, 0));
    }

    elements.progressText.textContent = `✅ 生成完成！共 ${total} 张图片`;
    elements.generateBtn.disabled = false;
    
    // 启用打包下载按钮
    document.querySelector('.download-all-btn').disabled = false;
}

// 生成单张图片
function generateSingleImage(rowData, fields) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = state.templateImage.width;
        canvas.height = state.templateImage.height;
        
        // 绘制背景图
        ctx.drawImage(state.templateImage, 0, 0);
        
        // 绘制文字
        fields.forEach(field => {
            // 如果Excel数据为空，使用默认值
            let text = rowData[field.column];
            if (text === undefined || text === null || text === '') {
                text = field.defaultValue || '';
            }
            text = String(text);
            
            if (!text) return; // 如果文字为空，跳过
            
            ctx.font = `${field.fontSize}px ${field.fontFamily}`;
            ctx.textBaseline = 'top';
            
            // 如果有背景色，先绘制背景
            if (field.bgColor) {
                const textMetrics = ctx.measureText(text);
                const padding = 4;
                const bgHeight = field.fontSize + padding * 2;
                const bgWidth = textMetrics.width + padding * 2;
                
                ctx.fillStyle = field.bgColor;
                ctx.fillRect(field.x - padding, field.y - padding, bgWidth, bgHeight);
            }
            
            // 绘制文字
            ctx.fillStyle = field.color;
            ctx.fillText(text, field.x, field.y);
        });
        
        resolve(canvas.toDataURL(`image/${getOutputFormat()}`, getOutputQuality()));
    });
}

// 获取输出格式
function getOutputFormat() {
    return document.getElementById('outputFormat')?.value || 'jpeg';
}

// 获取输出质量
function getOutputQuality() {
    const quality = parseInt(document.getElementById('outputQuality')?.value || '90');
    return quality / 100;
}

// 获取文件扩展名
function getFileExtension() {
    const format = getOutputFormat();
    return format === 'jpeg' ? 'jpg' : format;
}

// 显示结果
function showResults() {
    let html = '<div class="result-grid">';
    
    state.generatedImages.forEach((img, index) => {
        html += `
            <div class="result-item">
                <img src="${img.data}" alt="${img.name}" onclick="openPreviewModal(${index})">
                <div class="item-info">
                    <span class="item-name">${img.name}</span>
                    <button class="download-btn" onclick="downloadImage(${index})">下载</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    html += `<button class="download-all-btn" onclick="downloadAll()">📦 打包下载全部</button>`;
    
    elements.resultArea.innerHTML = html;
}

// 当前预览的图片索引
let currentPreviewIndex = 0;

// 打开预览弹窗
function openPreviewModal(index) {
    currentPreviewIndex = index;
    const modal = document.getElementById('previewModal');
    const modalImage = document.getElementById('modalImage');
    const modalFileName = document.getElementById('modalFileName');
    const modalDownloadBtn = document.getElementById('modalDownloadBtn');
    
    const img = state.generatedImages[index];
    modalImage.src = img.data;
    modalFileName.textContent = img.name + '.' + getFileExtension();
    modalDownloadBtn.onclick = () => downloadImage(index);
    
    updateImageCounter();
    modal.classList.add('show');
    
    // 绑定键盘事件
    document.addEventListener('keydown', handleModalKeydown);
}

// 关闭预览弹窗
function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    modal.classList.remove('show');
    document.removeEventListener('keydown', handleModalKeydown);
}

// 显示上一张
function showPrevImage() {
    if (currentPreviewIndex > 0) {
        openPreviewModal(currentPreviewIndex - 1);
    }
}

// 显示下一张
function showNextImage() {
    if (currentPreviewIndex < state.generatedImages.length - 1) {
        openPreviewModal(currentPreviewIndex + 1);
    }
}

// 更新图片计数器
function updateImageCounter() {
    const counter = document.getElementById('imageCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    counter.textContent = `${currentPreviewIndex + 1} / ${state.generatedImages.length}`;
    prevBtn.disabled = currentPreviewIndex === 0;
    nextBtn.disabled = currentPreviewIndex === state.generatedImages.length - 1;
}

// 键盘事件处理
function handleModalKeydown(e) {
    if (e.key === 'Escape') {
        closePreviewModal();
    } else if (e.key === 'ArrowLeft') {
        showPrevImage();
    } else if (e.key === 'ArrowRight') {
        showNextImage();
    }
}

// 下载单张图片
function downloadImage(index) {
    const img = state.generatedImages[index];
    const link = document.createElement('a');
    link.download = `${img.name}.${getFileExtension()}`;
    link.href = img.data;
    link.click();
}

// 打包下载全部（ZIP压缩包）
async function downloadAll() {
    const downloadBtn = document.querySelector('.download-all-btn');
    downloadBtn.disabled = true;
    downloadBtn.textContent = '📦 正在打包...';
    
    try {
        const zip = new JSZip();
        const folder = zip.folder('images');
        
        // 将所有图片添加到压缩包
        for (let i = 0; i < state.generatedImages.length; i++) {
            const img = state.generatedImages[i];
            // 从 base64 数据中提取实际的图片数据
            const base64Data = img.data.split(',')[1];
            folder.file(`${img.name}.${getFileExtension()}`, base64Data, { base64: true });
        }
        
        // 生成压缩包并下载
        const content = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        // 使用 FileSaver 下载
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const imageCount = state.generatedImages.length;
        saveAs(content, `批量图片_${timestamp}_共${imageCount}张.zip`);
        
        downloadBtn.textContent = '📦 打包下载全部';
    } catch (error) {
        console.error('打包失败:', error);
        alert('打包失败: ' + error.message);
        downloadBtn.textContent = '📦 打包下载全部';
    } finally {
        downloadBtn.disabled = false;
    }
}

// 初始化
init();
