/**
 * 将 HTML 页面 布局 成 PDF 的一页页 页面
 * @param {*} content   // 被布局的内容
 * @param {*} container // 页面容器
 * @param {Object} nodes : { 
 *  detachable: Array,  // 表示所有的 可拆分元素
 *  sticky: Map,        // 表示 可拆分元素 之间的 粘黏 关系，粘黏 意味着 两个 可拆分元素 始终会出现在同一个页面中，
 *                      // 对于 Map 而言，key 位置的 可拆分元素 会粘在 value 位置的 可拆分元素上，此时，这些粘在一起的 可拆分元素 可以看成 一个 大可拆分元素，
 *                      // 这个 大可拆分元素 的 shell 被认为是 最后一个 被粘黏 的 可拆分元素 的 shell
 *  shell: Map({ key: value({ entry, html }) })                  
 *                      // 表示 可拆分元素 在加入 inner 时必须包裹一层 外壳 （shell）
 *                      // 不是所有 有 shell 的 可拆分元素 添加进 inner 时都要包一层 shell，一个 shell 会尽可能包裹所有需要该 shell 的 可拆分元素
 * } 
 * @param {*} inner :{
 *  entry: String,
 *  html: String
 * }    // 表示一个页面
 * @param {*} divider   // 页面间的分隔线
 * @param {*} maxHeight // 页面最大容许高度
 */
function layout2pages(content, container, nodes, maxHeight, inner, divider) {
    let html = $(content)[0];
    let pages = $(container);
    // html --> pages
    let _queue_ = findDetachableNodes(html, nodes.detachable);
    let _stickyStack_ = [];
    if (typeof inner === 'undefined') {
        inner = {
            entry: '[name="default-inner-entry"]',
            html: `<div style="
                    padding: 20px; width: 841px; height: 1189px; box-sizing: border-box; 
                    background-color: #fff; margin: 0 auto;
                    -webkit-box-shadow: 2px 3px 5px 0px rgba(153,153,153,1);
                    -moz-box-shadow: 2px 3px 5px 0px rgba(153,153,153,1);
                    box-shadow: 2px 3px 5px 0px rgba(153,153,153,1);" name="default-inner-entry"></div>`
        }
        maxHeight = 1149;
    }
    // 初始化第一个页面
    let _last_H_ = createPage(pages, inner, maxHeight);
    while (_queue_.length > 0) {
        let node = _queue_.shift();
        let computedNodes = [];
        // 1. 将有 粘黏关系 的元素 粘黏 在一起计算
        // 永远是 向下 粘黏
        // 若 粘黏栈 中有值
        if (_stickyStack_.length > 0) {
            let stickyNode = _stickyStack_[_stickyStack_.length-1];
            // 如果可以 粘 住
            // 将 node 放入 粘黏栈
            if (nodes.sticky[stickyNode.className] === node.className) {
                _stickyStack_.push(node);
            }
            // 如果不能 粘 住
            // 将 粘黏栈 中的 元素全部拿出来一起计算
            else {
                sequenceMove(_stickyStack_, computedNodes);
                // 把 node 放进 粘黏栈
                _stickyStack_.push(node);
            }
        } else _stickyStack_.push(node);
        // 若 _queue_ == [], _stickyStack_ == [something]
        // 则不需要 粘黏 元素了
        if (_queue_.length === 0) {
            // 若 computedNodes 有内容，说明 node 不能与 computedNodes 内的元素粘黏 
            if (computedNodes.length === 0) sequenceMove(_stickyStack_, computedNodes);
            // 将 node 从 粘黏栈 塞回 队列 中
            else _queue_.unshift(_stickyStack_.pop())
        }

        // 2. 将 元素组 加入页面
        if (computedNodes.length > 0) {
            let nodeH = computedNodes.reduce((acc, node) => {
                acc += node.offsetHeight;
                return acc
            }, 0);
            if (nodeH > maxHeight) {
                console.error('页面高度不够');
            }
            // 若 元素高度 大于 剩余高度
            // 新建一个页面 page
            if (nodeH > _last_H_) {
                typeof divider === 'undefined' ? pages.append('<hr></hr>') : pages.append(divider);
                _last_H_ = createPage(pages, inner, maxHeight);
            }
            // 若 元素高度 小于等于 剩余高度
            else {
                _last_H_ -= nodeH;
            }
            try {
                appendToCurrentPage(computedNodes, pages, inner, nodes.shell);
            } catch(e) { console.error(e) }
        }
    }
    // 遍历完成
}

function createPage(pages, inner, maxHeight){
    pages.append(inner.html);
    return maxHeight;
}

function appendToCurrentPage(computedNodes, pages, inner, shellMap) {
    let inners = pages.find(inner.entry);
    let currPage = inners.eq(inners.length - 1);
    let children = currPage.children();
    let lastChildOfInner = children.eq(children.length-1);
    let shell = shellMap[computedNodes[computedNodes.length-1].className];
    if (shell === undefined) {
        currPage.append(computedNodes);
    } 
    // 有 shell 的 可拆分元素
    else {
        let currShell;
        // 先判断是不是自己
        let shells = currPage.children(shell.entry);
        if (shells.eq(shells.length-1).is(lastChildOfInner)) {
            currShell = lastChildOfInner;
        }
        // 搜索子元素
        else currShell = lastChildOfInner.find(shell.entry);
        
        // 若 页面 最后子节点 是 computedNodes 的 shell
        if (currShell.length !== 0) {
            if (currShell.length === 1) {
                currShell.eq(0).append(computedNodes);
            } else {
                throw Error('shell 内不能包含 shell');
            }
        } 
        // 若 页面 最后子节点 不是 computedNodes 的 shell
        else {
            currPage.append(shell.html);
            let shells = currPage.find(shell.entry);
            currShell = shells.eq(shells.length-1);
            currShell.append(computedNodes);
        }
    }
}

function sequenceMove(from, to) {
    while(from.length > 0) {
        to.push(from.shift());
    }
}

function findDetachableNodes(html, detachableNodes) {
    let queue = [];
    for (let child of html.children) {
        if (detachableNodes.includes(child.className)) {
            queue.push(child);
        } else {
            let childQueue = findDetachableNodes(child, detachableNodes);
            for (let node of childQueue) {
                queue.push(node);
            }
        }
    }
    return queue;
}

module.exports = layout2pages;