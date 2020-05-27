# Layout to Pages `.beta`

> beta 版已移动端 beta 分支

[Demo](https://guitenbay.github.io/layout2pages/example/src/index.html)

## 描述

    这是一个能将完整的 HTML 页面转化为一个个类似 PDF 页面的函数

## 依赖

    jQuery 3.4.1 及以上版本

## 使用方法

### 0x00
    这里有两个版本的 函数文件：
    - layout2pages.beta.html.js     # 直接用在 html 文件中，用 <script> 标签引入
    - layout2pages.beta.common.js   # 符合 CommonJS 标准，用 require() 方式引入函数

> 可以查看 index.html 中的引入方法

### 0x01

函数有 6 个参数：

- `content` （必须）
    
        被布局的内容 -> 一个可用于 jQuery 查找的字符串值，包含供匹配当前元素集合的选择器表达式

- `container` （必须）
        
        页面容器，能包容 page 的容器 -> 一个可用于 jQuery 查找的字符串值，包含供匹配当前元素集合的选择器表达式
    
- `nodes` （必须）

        元素的必要属性值
        
    - `detachable`: Array
    
            表示所有的 可拆卸元素，仅支持 class 字符串数组
    
    - `sticky`: Object
    
            [ '粘粘元素' : '被粘粘元素' ] 

            仅支持 class 字符串

            表示 可拆卸元素 之间的 粘黏 关系，粘黏 意味着 两个 可拆卸元素 始终会成对得出现在同一个页面中。
            
            对于 Object 而言，key 位置的 可拆卸元素 会粘在 value 位置的 可拆卸元素 上。
            
            此时，这些粘在一起的 可拆卸元素 可以看成 一个 大可拆卸元素，这个 大可拆卸元素 的 shell 被认为是 最后一个 被粘黏 的 可拆卸元素 的 shell
    
    - `shell`: Object 
    
            { 
                key: { 
                    entry: String, 
                    html: String
                }
            }

            entry: 一个可用于 jQuery 查找的字符串值，包含供匹配当前元素集合的选择器表达式
            html: 一段 HTML 代码，表示包裹 可拆卸元素 的外壳

            表示 可拆卸元素 在加入 inner 时必须包裹一层 外壳 （shell）
            
            说明：不是所有 有 shell 的 可拆卸元素 添加进 inner 时都要包一层 shell，一个 shell 会尽可能包裹所有需要该 shell 的 可拆卸元素

- `maxHeight`

        Number

        表示一个页面最大容许高度

- `inner`
        表示一个页面（page）

        {
            entry: String,
            html: String
        }

        entry: 一个可用于 jQuery 查找的字符串值，包含供匹配当前元素集合的选择器表达式
        html: 一段 HTML 代码，表示一页页面

- `divider`

        一段 HTML 代码
        
        表示页面间的分隔线

### 0x02 

具体使用

    引入函数之后，我们需要先确定 content, container, nodes 这三个参数
    
> 由于该函数是转化函数，于是需要先在 content 所对应的元素下写下需要在页面显示的 HTML，并确定 nodes.detachable (可拆卸元素)，nodes.sticky (可拆卸元素之间的粘粘关系) 和 nodes.shell (可拆卸元素需要包裹的外壳 HTML)，例如：

**对于 index.html**

```html
<div name="resource">
    要转化的 html
</div>
<div name="pages">
    转化到的位置
</div>
```

**对于 app.js**

```js
let content = '[name="resource"]';
let pages = '[name="pages"]';
let nodes = {
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
// 在这里调用转化函数
layout2pages(content, pages, nodes);
```

## 示例

你可以下载本仓库
```bash
$ git clone <url>
```
打开 example/src 文件夹
```bash
$ cd example/src
```
然后在浏览器打开 `index.html` 文件查看示例

## 注意要点

*特别注意*

当需要连续放置两个有同样 shell 的可拆卸元素，且不希望它们被放进同一个 shell 时，可以在它们之间插入一个没有该 shell 的可拆卸元素，它可以没有任何意义（唯一的意义可能是作为拆卸标志 : )

1. shell 中的 元素在纵向上不能有 padding 和 margin, 因为这部分的高度不在计算范围内，却能在页面显示，会出现元素溢出

2. margin 的高度无法获取，在这个函数中会被忽略，所以 可拆卸元素 的 margin 必须为 0

3. divider 允许为空，当为空时，直接使用 `<hr></hr>`

4. inner 允许为空，inner 为空时，maxHeight 字段会无效，默认 inner 宽高为 841px * 1189px，padding 为 20px, maxHeight 高度为 1149px

5. inner 自定义时，宽高需要自己设置，maxHeight 的值应该比 inner 的高度小一些

> 以上，希望大家用得开心 ; )
