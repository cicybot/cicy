import type { TreeDataNode } from 'antd';
import { XMLParser } from 'fast-xml-parser';

export interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface XmlNode {
    index?: string;
    nodeKey?: string;
    text?: string;
    'resource-id'?: string;
    class?: string;
    package?: string;
    'content-desc'?: string;
    checkable?: string;
    checked?: string;
    clickable?: string;
    enabled?: string;
    focusable?: string;
    focused?: string;
    scrollable?: string;
    'long-clickable'?: string;
    password?: string;
    selected?: string;
    bounds?: string;
}

export interface TreeConversionResult {
    treeData: TreeDataNode[];
    nodesMap: Record<string, XmlNode>;
    nodeBoundsMap: Record<string, Rect>;
}

/**
 * 根据节点 key 获取所有需要展开的父节点 key
 * @param nodeKey 当前节点的 key（例如 '0-1-2-3-4'）
 * @returns 需要展开的父节点 key 数组（例如 ['0', '0-1', '0-1-2', '0-1-2-3']）
 */
export function getExpandKeys(nodeKey: string): string[] {
    // 如果节点 key 为空，返回空数组
    if (!nodeKey) return [];

    // 将节点 key 按 '-' 分割成数组
    const parts = nodeKey.split('-');

    // 生成所有父节点 key
    const expandKeys: string[] = [];
    let currentKey = '';

    // 遍历所有部分（除了最后一部分）
    for (let i = 0; i < parts.length - 1; i++) {
        // 构建当前层级的 key
        currentKey = currentKey ? `${currentKey}-${parts[i]}` : parts[i];
        expandKeys.push(currentKey);
    }

    return expandKeys;
}

export async function convertXmlToTreeData(xmlString: string): Promise<TreeConversionResult> {
    const parser = new XMLParser({
        attributeNamePrefix: '',
        ignoreAttributes: false,
        isArray: (name: string, jpath: string) => {
            return name === 'node' && jpath.split('.').filter(p => p === 'node').length > 1;
        },
        trimValues: true,
        preserveOrder: true,
        processEntities: false
    });

    const parsed = parser.parse(xmlString);
    const hierarchy = parsed[1].hierarchy[0];
    return processXml(hierarchy);
}

export function parseBounds(boundsStr?: string): Rect | null {
    if (!boundsStr) return null;

    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match || match.length < 5) return null;

    return {
        left: parseInt(match[1]),
        top: parseInt(match[2]),
        right: parseInt(match[3]),
        bottom: parseInt(match[4])
    };
}

export async function processXml(hierarchy: any): Promise<TreeConversionResult> {
    try {
        const nodesMap: Record<string, XmlNode> = {};
        const nodeBoundsMap: Record<string, Rect> = {}; // 存储解析后的边界信息

        let keyCounter = 0;

        function processNode(xmlNode: any, parentKey: string = ''): TreeDataNode {
            const currentKey = parentKey ? `${parentKey}-${keyCounter++}` : `${keyCounter++}`;

            const attrs = xmlNode[':@'] ? xmlNode[':@'] : {};
            const attributes: XmlNode = {
                index: attrs.index,
                nodeKey: currentKey,
                text: attrs.text,
                'resource-id': attrs['resource-id'],
                class: attrs.class,
                package: attrs.package,
                'content-desc': attrs['content-desc'],
                checkable: attrs.checkable,
                checked: attrs.checked,
                clickable: attrs.clickable,
                enabled: attrs.enabled,
                focusable: attrs.focusable,
                focused: attrs.focused,
                scrollable: attrs.scrollable,
                'long-clickable': attrs['long-clickable'],
                password: attrs.password,
                selected: attrs.selected,
                bounds: attrs.bounds
            };

            nodesMap[currentKey] = attributes;

            // 解析边界信息
            const bounds = parseBounds(attrs.bounds);
            if (bounds) {
                nodeBoundsMap[currentKey] = bounds;
            }
            let title;
            if (attrs.text) {
                title = attrs.text;
            } else if (attrs['resource-id']) {
                title = attrs['resource-id'];
            } else {
                title = attrs.class;
            }
            const treeNode: TreeDataNode = {
                key: currentKey,
                title,
                children: []
            };

            // Process child nodes
            const childNodes = xmlNode.node;
            if (childNodes) {
                const childrenArray = Array.isArray(childNodes) ? childNodes : [childNodes];
                treeNode.children = childrenArray.map((child: any) =>
                    processNode(child, currentKey)
                );
            }

            return treeNode;
        }

        const rootNode = hierarchy;
        const treeData = [processNode(rootNode)];
        return { treeData, nodesMap, nodeBoundsMap };
    } catch (err) {
        console.error('XML parsing error:', err);
        throw new Error(`Failed to parse XML: ${err instanceof Error ? err.message : String(err)}`);
    }
}
