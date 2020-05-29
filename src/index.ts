import $ from 'jquery';

type EntryHTML = {
    /** @param {string} entry - 入口 */
    entry: string,
    /** @param {string} html - html 语句 */
    html: string
}

type LayoutNodes = {
    /** @param {Array} detachable - 表示所有的 可拆分元素 */
    detachable: string[],
    /** @param {Map} sticky - 表示 可拆分元素 之间的 粘黏 关系，粘黏 意味着 两个 可拆分元素 始终会出现在同一个页面中，
     *                      对于 Map 而言，key 位置的 可拆分元素 会粘在 value 位置的 可拆分元素上，此时，这些粘在一起的 可拆分元素 可以看成 一个 大可拆分元素，
     *                      这个 大可拆分元素 的 shell 被认为是 最后一个 被粘黏 的 可拆分元素 的 shell
     */
    sticky?: Map<string, string>,
    /** @param {Map} shell - 外壳映射，表示 可拆分元素 在加入 inner 时必须包裹一层 外壳 （shell）
     *                     不是所有 有 shell 的 可拆分元素 添加进 inner 时都要包一层 shell，一个 shell 会尽可能包裹所有需要该 shell 的 可拆分元素
     */
    shell?: Map<string, EntryHTML>
}

type layout2pagesFuncType = (
    /** @param {string} content - 被布局的内容 */
    content: string,
    /** @param {string} container - 页面容器 */
    container: string,
    /** @param {Object} nodes - 元素设置 */
    nodes: LayoutNodes,
    /** @param {number} maxHeight 页面最大容许高度 */
    maxHeight?: number,
    /** @param {EntryHTML} inner - 表示一个页面的 html */
    inner?: EntryHTML,
    /** @param {string} divider 页面间的分隔线 */
    divider?: string,
) => void;

/**
 * 将 HTML 页面 布局 成 PDF 的一页页 页面
 */
export const layout2pages: layout2pagesFuncType = (
    content: string,
    container: string,
    nodes: {
        detachable: string[]
        sticky?: Map<string, string>
        shell?: Map<
            string,
            {
                entry: string
                html: string
            }
        >
    },
    maxHeight: number = 1149,
    inner: {
        entry: string
        html: string
    } = {
        entry: '[name="default-inner-entry"]',
        html: `<div style="
            padding: 20px; width: 841px; height: 1189px; box-sizing: border-box; 
            background-color: #fff; margin: 0 auto;
            -webkit-box-shadow: 2px 3px 5px 0px rgba(153,153,153,1);
            -moz-box-shadow: 2px 3px 5px 0px rgba(153,153,153,1);
            box-shadow: 2px 3px 5px 0px rgba(153,153,153,1);" name="default-inner-entry"></div>`,
    },
    divider: string = '<hr></hr>',
): void => {
    if (typeof nodes.sticky === 'undefined') {
        nodes.sticky = {} as Map<string, string>
    }
    if (typeof nodes.shell === 'undefined') {
        nodes.shell = {} as Map<string, { entry: string; html: string }>
    }
    const html: HTMLElement = $(content)[0]
    const pages: JQuery<HTMLElement> = $(container)
    // html --> pages
    const NODE_QUEUE: Element[] = findDetachableNodes(html, nodes.detachable)
    const STICKY_STACK: HTMLElement[] = []
    // 初始化第一个页面
    let LAST_H = createPage(pages, inner, maxHeight)
    while (NODE_QUEUE.length > 0) {
        const node = NODE_QUEUE.shift() as HTMLElement
        const computedNodes: HTMLElement[] = []
        // 1. 将有 粘黏关系 的元素 粘黏 在一起计算
        // 永远是 向下 粘黏
        // 若 粘黏栈 中有值
        if (STICKY_STACK.length > 0) {
            const stickyNode: HTMLElement = STICKY_STACK[STICKY_STACK.length - 1]
            // 如果可以 粘 住
            // 将 node 放入 粘黏栈
            if (nodes.sticky[stickyNode.className] === node.className) {
                STICKY_STACK.push(node)
            }
            // 如果不能 粘 住
            // 将 粘黏栈 中的 元素全部拿出来一起计算
            else {
                sequenceMove(STICKY_STACK, computedNodes)
                // 把 node 放进 粘黏栈
                STICKY_STACK.push(node)
            }
        } else STICKY_STACK.push(node)
        // 若 NODE_QUEUE == [], STICKY_STACK == [something]
        // 则不需要 粘黏 元素了
        if (NODE_QUEUE.length === 0) {
            // 若 computedNodes 有内容，说明 node 不能与 computedNodes 内的元素粘黏
            if (computedNodes.length === 0) sequenceMove(STICKY_STACK, computedNodes)
            // 将 node 从 粘黏栈 塞回 队列 中
            else NODE_QUEUE.unshift(STICKY_STACK.pop() as HTMLElement)
        }

        // 2. 将 元素组 加入页面
        if (computedNodes.length > 0) {
            const nodeH = computedNodes.reduce((acc, computedNode: HTMLElement) => {
                acc += computedNode.offsetHeight
                return acc
            }, 0)
            if (nodeH > maxHeight) {
                console.error('页面高度不够')
            }
            // 若 元素高度 大于 剩余高度
            // 新建一个页面 page
            if (nodeH > LAST_H) {
                pages.append(divider)
                LAST_H = createPage(pages, inner, maxHeight)
            }
            // 若 元素高度 小于等于 剩余高度
            else {
                LAST_H -= nodeH
            }
            try {
                appendToCurrentPage(computedNodes, pages, inner, nodes.shell)
            } catch (e) {
                console.error(e)
            }
        }
    }
    // 遍历完成
}

function createPage(pages: JQuery<HTMLElement>, inner: { entry: string; html: string }, maxHeight: number) {
    pages.append(inner.html)
    return maxHeight
}

function appendToCurrentPage(
    computedNodes: HTMLElement[],
    pages: JQuery<HTMLElement>,
    inner: { entry: string; html: string },
    shellMap: Map<string, { entry: string; html: string }>,
) {
    const inners = pages.find(inner.entry)
    const currPage = inners.eq(inners.length - 1)
    const children = currPage.children()
    const lastChildOfInner = children.eq(children.length - 1)
    const shell = shellMap[computedNodes[computedNodes.length - 1].className]
    if (shell === undefined) {
        currPage.append(computedNodes)
    }
    // 有 shell 的 可拆分元素
    else {
        let currShell: JQuery<HTMLElement>
        // 先判断是不是自己
        let shells = currPage.children(shell.entry)
        if (shells.eq(shells.length - 1).is(lastChildOfInner)) {
            currShell = lastChildOfInner
        }
        // 搜索子元素
        else currShell = lastChildOfInner.find(shell.entry)

        // 若 页面 最后子节点 是 computedNodes 的 shell
        if (currShell.length !== 0) {
            if (currShell.length === 1) {
                currShell.eq(0).append(computedNodes)
            } else {
                throw Error('shell 内不能包含 shell')
            }
        }
        // 若 页面 最后子节点 不是 computedNodes 的 shell
        else {
            currPage.append(shell.html)
            shells = currPage.find(shell.entry)
            currShell = shells.eq(shells.length - 1)
            currShell.append(computedNodes)
        }
    }
}

function sequenceMove(from: HTMLElement[], to: HTMLElement[]) {
    while (from.length > 0) {
        to.push(from.shift() as HTMLElement)
    }
}

function findDetachableNodes(html: Element, detachableNodes: string[]): Element[] {
    let queue: Element[] = []
    const items = html.children;
    for (let i=0; i<items.length; i++) {
        const child: Element = items.item(i) as Element;
        if (detachableNodes.includes(child.className)) {
            queue.push(child)
        } else {
            queue = queue.concat(findDetachableNodes(child, detachableNodes))
        }
    }
    return queue
}
