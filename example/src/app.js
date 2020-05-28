/**
 * 几点要求：
 * 1. shell 中的 元素在纵向上不能有 padding 和 margin, 因为这部分的高度不在计算范围内，却能在页面显示，会出现元素溢出
 * 2. margin 的高度无法获取，在这个函数中会被忽略，所以 可拆分元素 的 margin 必须为 0
 * 3. divider 允许为空，当为空时，直接使用 `<hr></hr>`
 * 4. inner 允许为空，inner 为空时，maxHeight 字段会无效，默认 inner 宽高为 841px x 1189px，padding 为 20px, maxHeigt 高度为 1149px
 * 5. inner 自定义时，宽高需要自己设置，maxHeight 的值应该比 inner 的高度小一些
 */
const layout2pages = require('../../index').layout2pages;

const content = '[name="resource"]';
const pages = '[name="pages"]';
const nodes = {
    detachable: [
        'h1', 'h2', 'desc', 'li', 'th', 'tr'
    ],
    sticky: {
        'th': 'tr'
    },
    shell: {
        'tr': {
            entry: '[name="tr-entry"]',
            html: '<table name="tr-entry" rules=none></table>'
        },
        'li': {
            entry: '[name="li-entry"]',
            html: '<ul name="li-entry"></ul>'
        }
    }
}

const transformBtn = document.querySelector('button#transform');
transformBtn.onclick = function() {
    layout2pages(content, pages, nodes);
    this.setAttribute('disabled', 'true');
    this.innerHTML = '转化成功！'
}
