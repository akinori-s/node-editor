import { create } from "zustand";
import { Edge, Node, XYPosition, Position } from "reactflow";
import { DefaultNodeProps } from "./DefaultNode";
import { MultiLabelNodeProps } from "./MultiLabelNode";
import { v4 as uuid } from "uuid";

export const NodeTypeNames = {
	Default: "defaultNode",
	MultiLabel: "multiLabelNode",
};

interface AppState {
	nodes: Node<MultiLabelNodeProps>[];
	edges: Edge[];
	selectedNodeId: string | null;
	selectedEdgeId: string | null;
	isEditingNodeId: string | null;
	highlightedNodes: Set<string>;
	highlightedEdges: Set<string>;
	selectedNodeIds: string[];
	selectedEdgeIds: string[];

	setNodes: (setter: (nodes: Node<MultiLabelNodeProps>[]) => Node<MultiLabelNodeProps>[] | void) => void;
	setEdges: (setter: (edges: Edge[]) => Edge[] | void) => void;
	setSelectedNodeId: (nodeId: string | null) => void;
	setSelectedEdgeId: (edgeId: string | null) => void;
	setIsEditingNodeId: (nodeId: string | null) => void;
	setSelectedNodeIds: (nodeIds: string[]) => void;
	setSelectedEdgeIds: (edgeIds: string[]) => void;
	setHighlightedElements: (payload: { nodes: Set<string>; edges: Set<string> }) => void;

	onAddNode: (position: XYPosition) => void;
	onDeleteSelected: () => void;
	isLabelDuplicate: (nodes: Node[], label: string, excludeNodeId?: string) => boolean;
	setNodeData: (nodeId: string, nodeLabel: any) => void;
}

const getNextNodeName = (nodes: Node<MultiLabelNodeProps>[]): string => {
	const baseLabel = "New Node";
	const existingLabels = new Set(nodes.map(node => node.data.label));

	if (!existingLabels.has(baseLabel)) return baseLabel;

	let counter = 2;
	while (existingLabels.has(`${baseLabel} ${counter}`)) {
		counter++;
	}
	return `${baseLabel} ${counter}`;
};

export const useStore = create<AppState>((set) => ({
	nodes: [],
	edges: [],
	selectedNodeId: null,
	selectedEdgeId: null,
	isEditingNodeId: null,
	highlightedNodes: new Set(),
	highlightedEdges: new Set(),
	selectedNodeIds: [],
	selectedEdgeIds: [],

	setNodes: (setter) => set((state) => {
		const newNodes = setter([...state.nodes]);
		return newNodes ? { nodes: newNodes } : {};
	}),

	setEdges: (setter) => set((state) => {
		const newEdges = setter([...state.edges]);
		return newEdges ? { edges: newEdges } : {};
	}),

	setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

	setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId }),

	setIsEditingNodeId: (nodeId) => set({ isEditingNodeId: nodeId }),

	setSelectedNodeIds: (ids: string[]) => set({ selectedNodeIds: ids }),

	setSelectedEdgeIds: (ids: string[]) => set({ selectedEdgeIds: ids }),

	setHighlightedElements: ({ nodes, edges }) => set({
		highlightedNodes: nodes,
		highlightedEdges: edges,
	}),

	// Add a new node at a given position
	onAddNode: (position: XYPosition) => {
		set((state) => {
			const nodeLabel = getNextNodeName(state.nodes);
			const newNode: Node<MultiLabelNodeProps> = {
				id: uuid(),
				position,
				data: {
					label: nodeLabel,
					sublabel1: "sub-label 1",
					sublabel2: "sub-label 2",
				},
				type: "multiLabelNode",
				sourcePosition: Position.Right,
				targetPosition: Position.Left,
			};
			return {
				nodes: [...state.nodes, newNode],
			};
		});
	},

	onDeleteSelected: () => set((state) => {
		const remainingNodes = state.nodes.filter(
			node => !state.selectedNodeIds.includes(node.id)
		);
		const remainingEdges = state.edges.filter(
			edge => !state.selectedEdgeIds.includes(edge.id) &&
				!state.selectedNodeIds.includes(edge.source) &&
				!state.selectedNodeIds.includes(edge.target)
		);

		return {
			nodes: remainingNodes,
			edges: remainingEdges,
			selectedNodeIds: [],
			selectedEdgeIds: [],
			selectedNodeId: null,
			selectedEdgeId: null,
			highlightedNodes: new Set(),
			highlightedEdges: new Set()
		};
	}),

	isLabelDuplicate: (nodes: Node[], label: string, excludeNodeId?: string) => {
		return nodes.some(node =>
			node.data.label === label && node.id !== excludeNodeId
		);
	},

	setNodeData: (nodeId: string, nodeData: any) => {
		set((state) => {
			const updatedNodes = state.nodes.map(node =>
				node.id === nodeId
					? {
						...node,
						data: { ...nodeData }
					}
					: node
			);
			return { nodes: updatedNodes };
		});
	},
}));
