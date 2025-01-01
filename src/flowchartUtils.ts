import { Node, Edge, Position, MarkerType } from 'reactflow';
import { v4 as uuid } from "uuid";

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
			type: node.type,
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
		const newNode: Node = {
			id: uuid(),
			position: node.position,
			data: { label: node.label },
			type: node.type ?? 'default',
			sourcePosition: Position.Right,
			targetPosition: Position.Left
		}
		newNodes.push(newNode);
	});
	jsonData.forEach((node: any, _index: number) => {
		node.downstream?.forEach((targetLabel: string) => {
			const sourceNode = newNodes.find((n: Node) => n.data?.label === node.label);
			const targetNode = newNodes.find((n: Node) => n.data?.label === targetLabel);
			if (sourceNode !== undefined && targetNode !== undefined) {
				newEdges.push({
					id: uuid(),
					source: sourceNode.id,
					target: targetNode.id,
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
	a.remove();
};
