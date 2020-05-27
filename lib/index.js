"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.layout2pages = void 0;
var jquery_1 = __importDefault(require("jquery"));
/**
 * 将 HTML 页面 布局 成 PDF 的一页页 页面
 */
exports.layout2pages = function (content, container, nodes, maxHeight, inner, divider) {
    if (maxHeight === void 0) { maxHeight = 1149; }
    if (inner === void 0) { inner = {
        entry: '[name="default-inner-entry"]',
        html: "<div style=\"\n            padding: 20px; width: 841px; height: 1189px; box-sizing: border-box; \n            background-color: #fff; margin: 0 auto;\n            -webkit-box-shadow: 2px 3px 5px 0px rgba(153,153,153,1);\n            -moz-box-shadow: 2px 3px 5px 0px rgba(153,153,153,1);\n            box-shadow: 2px 3px 5px 0px rgba(153,153,153,1);\" name=\"default-inner-entry\"></div>",
    }; }
    if (divider === void 0) { divider = '<hr></hr>'; }
    if (typeof nodes.sticky === 'undefined') {
        nodes.sticky = {};
    }
    if (typeof nodes.shell === 'undefined') {
        nodes.shell = {};
    }
    var html = jquery_1.default(content)[0];
    var pages = jquery_1.default(container);
    // html --> pages
    var NODE_QUEUE = findDetachableNodes(html, nodes.detachable);
    var STICKY_STACK = [];
    // 初始化第一个页面
    var LAST_H = createPage(pages, inner, maxHeight);
    while (NODE_QUEUE.length > 0) {
        var node = NODE_QUEUE.shift();
        var computedNodes = [];
        // 1. 将有 粘黏关系 的元素 粘黏 在一起计算
        // 永远是 向下 粘黏
        // 若 粘黏栈 中有值
        if (STICKY_STACK.length > 0) {
            var stickyNode = STICKY_STACK[STICKY_STACK.length - 1];
            // 如果可以 粘 住
            // 将 node 放入 粘黏栈
            if (nodes.sticky[stickyNode.className] === node.className) {
                STICKY_STACK.push(node);
            }
            // 如果不能 粘 住
            // 将 粘黏栈 中的 元素全部拿出来一起计算
            else {
                sequenceMove(STICKY_STACK, computedNodes);
                // 把 node 放进 粘黏栈
                STICKY_STACK.push(node);
            }
        }
        else
            STICKY_STACK.push(node);
        // 若 NODE_QUEUE == [], STICKY_STACK == [something]
        // 则不需要 粘黏 元素了
        if (NODE_QUEUE.length === 0) {
            // 若 computedNodes 有内容，说明 node 不能与 computedNodes 内的元素粘黏
            if (computedNodes.length === 0)
                sequenceMove(STICKY_STACK, computedNodes);
            // 将 node 从 粘黏栈 塞回 队列 中
            else
                NODE_QUEUE.unshift(STICKY_STACK.pop());
        }
        // 2. 将 元素组 加入页面
        if (computedNodes.length > 0) {
            var nodeH = computedNodes.reduce(function (acc, computedNode) {
                acc += computedNode.offsetHeight;
                return acc;
            }, 0);
            if (nodeH > maxHeight) {
                console.error('页面高度不够');
            }
            // 若 元素高度 大于 剩余高度
            // 新建一个页面 page
            if (nodeH > LAST_H) {
                pages.append(divider);
                LAST_H = createPage(pages, inner, maxHeight);
            }
            // 若 元素高度 小于等于 剩余高度
            else {
                LAST_H -= nodeH;
            }
            try {
                appendToCurrentPage(computedNodes, pages, inner, nodes.shell);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    // 遍历完成
};
function createPage(pages, inner, maxHeight) {
    pages.append(inner.html);
    return maxHeight;
}
function appendToCurrentPage(computedNodes, pages, inner, shellMap) {
    var inners = pages.find(inner.entry);
    var currPage = inners.eq(inners.length - 1);
    var children = currPage.children();
    var lastChildOfInner = children.eq(children.length - 1);
    var shell = shellMap[computedNodes[computedNodes.length - 1].className];
    if (shell === undefined) {
        currPage.append(computedNodes);
    }
    // 有 shell 的 可拆分元素
    else {
        var currShell = void 0;
        // 先判断是不是自己
        var shells = currPage.children(shell.entry);
        if (shells.eq(shells.length - 1).is(lastChildOfInner)) {
            currShell = lastChildOfInner;
        }
        // 搜索子元素
        else
            currShell = lastChildOfInner.find(shell.entry);
        // 若 页面 最后子节点 是 computedNodes 的 shell
        if (currShell.length !== 0) {
            if (currShell.length === 1) {
                currShell.eq(0).append(computedNodes);
            }
            else {
                throw Error('shell 内不能包含 shell');
            }
        }
        // 若 页面 最后子节点 不是 computedNodes 的 shell
        else {
            currPage.append(shell.html);
            shells = currPage.find(shell.entry);
            currShell = shells.eq(shells.length - 1);
            currShell.append(computedNodes);
        }
    }
}
function sequenceMove(from, to) {
    while (from.length > 0) {
        to.push(from.shift());
    }
}
function findDetachableNodes(html, detachableNodes) {
    var queue = [];
    var items = html.children;
    for (var i = 0; i < items.length; i++) {
        var child = items.item(i);
        if (detachableNodes.includes(child.className)) {
            queue.push(child);
        }
        else {
            queue = queue.concat(findDetachableNodes(child, detachableNodes));
        }
    }
    return queue;
}
