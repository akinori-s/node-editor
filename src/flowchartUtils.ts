import { Node, Edge, Position, MarkerType } from 'reactflow';

interface FlowData {
    nodes: Node[];
    edges: Edge[];
}

export const generateExportData = (nodes: Node[], edges: Edge[]) => {
    return nodes.map(node => {
        const downstreamNodes = edges
            .filter(edge => edge.source === node.id)
            .map(edge => nodes.find(n => n.id === edge.target)?.data?.label);

        return {
            label: node.data?.label,
            position: node.position,
            downstream: downstreamNodes,
        };
    });
};

export const importFlowData = (jsonData: any): FlowData => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    jsonData.forEach((node: any, _index: number) => {
        newNodes.push({
            id: `node-${node.label}`,
            position: node.position,
            data: { label: node.label },
            type: 'default',
            sourcePosition: Position.Right,
            targetPosition: Position.Left
        });

        node.downstream?.forEach((targetLabel: string) => {
            const targetNode = jsonData.findIndex((n: any) => n.label === targetLabel);
            if (targetNode !== -1) {
                newEdges.push({
                    id: `edge-${node.label}-${targetLabel}`,
                    source: `node-${node.label}`,
                    target: `node-${targetLabel}`,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    type: 'smoothstep'
                });
            }
        });
    });
    return { nodes: newNodes, edges: newEdges };
};

export const exportToFile = (nodes: Node[], edges: Edge[]) => {
    const exportData = generateExportData(nodes, edges);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowchart.json';
    a.click();
    URL.revokeObjectURL(url);
};
