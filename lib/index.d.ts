declare type layout2pagesFuncType = (
/** @param {*} content 被布局的内容 */
content: string, 
/** @param {*} container 页面容器 */
container: string, 
/** @param {Object} nodes : {
 *  detachable: Array,  表示所有的 可拆分元素
 *  sticky: Map,        表示 可拆分元素 之间的 粘黏 关系，粘黏 意味着 两个 可拆分元素 始终会出现在同一个页面中，
 *                      对于 Map 而言，key 位置的 可拆分元素 会粘在 value 位置的 可拆分元素上，此时，这些粘在一起的 可拆分元素 可以看成 一个 大可拆分元素，
 *                      这个 大可拆分元素 的 shell 被认为是 最后一个 被粘黏 的 可拆分元素 的 shell
 *  shell: Map({ key: value({ entry, html }) })
 *                      表示 可拆分元素 在加入 inner 时必须包裹一层 外壳 （shell）
 *                      不是所有 有 shell 的 可拆分元素 添加进 inner 时都要包一层 shell，一个 shell 会尽可能包裹所有需要该 shell 的 可拆分元素
 * } */
nodes: {
    detachable: string[];
    sticky?: Map<string, string>;
    shell?: Map<string, {
        entry: string;
        html: string;
    }>;
}, 
/** @param {*} maxHeight 页面最大容许高度 */
maxHeight?: number, 
/** @param {*} inner :{
 *  entry: String,
 *  html: String
 * } 表示一个页面的 html */
inner?: {
    entry: string;
    html: string;
}, 
/** @param {*} divider 页面间的分隔线 */
divider?: string) => void;
/**
 * 将 HTML 页面 布局 成 PDF 的一页页 页面
 */
export declare const layout2pages: layout2pagesFuncType;
export {};
