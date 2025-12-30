window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug

// 修改后的版本：支持文件下载功能
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector('head base[target="_blank"]')
    
    console.log('origin', origin, isBaseTargetBlank)
    
    // 检查是否是下载链接（有download属性）
    const isDownloadLink = origin && origin.hasAttribute('download')
    
    // 检查是否是Blob URL（文件下载）
    const isBlobUrl = origin && origin.href && origin.href.startsWith('blob:')
    
    // 检查是否是数据URL（base64编码的文件）
    const isDataUrl = origin && origin.href && origin.href.startsWith('data:')
    
    // 如果是下载链接、Blob URL或数据URL，不拦截，允许正常下载
    if (isDownloadLink || isBlobUrl || isDataUrl) {
        console.log('允许下载链接:', origin.href)
        return // 不阻止默认行为，允许文件下载
    }
    
    // 如果不是下载链接，按原逻辑处理
    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}

// 重写window.open，但排除下载相关的打开
window.open = function (url, target, features) {
    console.log('open', url, target, features)
    
    // 如果是Blob URL或数据URL，可能是下载，尝试创建a标签下载
    if (url && (url.startsWith('blob:') || url.startsWith('data:'))) {
        console.log('检测到文件下载，尝试通过a标签下载')
        
        try {
            const a = document.createElement('a')
            a.href = url
            a.download = 'file' // 可以设置默认文件名
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            return null
        } catch (error) {
            console.error('下载失败:', error)
        }
    }
    
    // 否则按原逻辑跳转
    location.href = url
    return null
}

// 添加全局文件下载助手函数
window.downloadFile = function(filename, content, type = 'application/octet-stream') {
    try {
        // 创建Blob
        const blob = new Blob([content], { type: type })
        const url = URL.createObjectURL(blob)
        
        // 创建下载链接
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.style.display = 'none'
        
        // 添加到文档并点击
        document.body.appendChild(a)
        a.click()
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }, 100)
        
        console.log('文件下载已触发:', filename)
        return true
    } catch (error) {
        console.error('下载文件失败:', error)
        return false
    }
}

// 添加Excel导出助手
window.exportExcel = function(data, filename) {
    try {
        // 检查xlsx库是否可用
        if (typeof XLSX === 'undefined') {
            console.error('XLSX库未加载')
            return false
        }
        
        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '数据')
        
        // 生成Excel文件
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        
        // 下载文件
        return window.downloadFile(filename, wbout, 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    } catch (error) {
        console.error('导出Excel失败:', error)
        return false
    }
}

// 监听所有a标签的创建，为下载链接添加download属性
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'A' && node.href && 
                (node.href.startsWith('blob:') || node.href.startsWith('data:'))) {
                if (!node.hasAttribute('download')) {
                    node.setAttribute('download', '')
                }
            }
        })
    })
})

// 开始监听body下的所有子节点变化
observer.observe(document.body, {
    childList: true,
    subtree: true
})

// 添加事件监听器
document.addEventListener('click', hookClick, { capture: true })

console.log('Pakeplus脚本已加载，文件下载功能已启用')