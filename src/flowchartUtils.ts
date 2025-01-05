import { Node, Edge, Position, MarkerType } from 'reactflow';
import { v4 as uuid } from "uuid";
import { MultiLabelNodeProps } from "./MultiLabelNode";

interface FlowData {
	nodes: Node[];
	edges: Edge[];
}

type NodeType = 'defaultNode' | 'multiLabelNode';

const createNode = (nodeData: any, type: NodeType): Node => {
	const baseNode = {
		id: uuid(),
		position: nodeData.position,
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
		type: type
	};

	switch (type) {
		case 'multiLabelNode':
			return {
				...baseNode,
				data: {
					label: nodeData.label,
					sublabel1: nodeData.sublabel1 || '',
					sublabel2: nodeData.sublabel2 || ''
				}
			};
		default:
			return {
				...baseNode,
				data: { label: nodeData.label }
			};
	}
};

export const importFlowData = (jsonData: any): FlowData => {
	const newNodes: Node[] = [];
	const newEdges: Edge[] = [];

	// Create nodes
	jsonData.forEach((nodeData: any) => {
		const type = nodeData.type as NodeType ?? 'defaultNode';
		const newNode = createNode(nodeData, type);
		newNodes.push(newNode);
	});

	// Create edges
	jsonData.forEach((nodeData: any) => {
		nodeData.downstream?.forEach((targetLabel: string) => {
			const sourceNode = newNodes.find((n: Node) => n.data?.label === nodeData.label);
			const targetNode = newNodes.find((n: Node) => n.data?.label === targetLabel);

			if (sourceNode && targetNode) {
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

export const generateExportData = (nodes: Node[], edges: Edge[]) => {
	return nodes.map(node => {
		const downstreamNodes = edges
			.filter(edge => edge.source === node.id)
			.map(edge => nodes.find(n => n.id === edge.target)?.data?.label);

		const baseData = {
			type: node.type,
			label: node.data?.label,
			position: node.position,
			downstream: downstreamNodes,
		};

		// Add type-specific data
		if (node.type === 'multiLabelNode') {
			return {
				...baseData,
				sublabel1: (node.data as MultiLabelNodeProps).sublabel1,
				sublabel2: (node.data as MultiLabelNodeProps).sublabel2,
			};
		}

		return baseData;
	});
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
