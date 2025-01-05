import { create } from "zustand";
import { Edge, Node, XYPosition, Position } from "reactflow";
import { DefaultNodeProps } from "./DefaultNode";
import { MultiLabelNodeProps } from "./MultiLabelNode";
import { v4 as uuid } from "uuid";
import { persist, createJSONStorage } from 'zustand/middleware';

export const NodeTypeNames = {
	Default: "defaultNode",
	MultiLabel: "multiLabelNode",
};

interface AppState {
	nodes: Node<DefaultNodeProps | MultiLabelNodeProps>[];
	edges: Edge[];
	selectedNodeId: string | null;
	selectedEdgeId: string | null;
	isEditingNodeId: string | null;
	highlightedNodes: Set<string>;
	highlightedEdges: Set<string>;
	selectedNodeIds: string[];
	selectedEdgeIds: string[];

	newNodeType: string;

	setNodes: (setter: (nodes: Node<DefaultNodeProps | MultiLabelNodeProps>[]) => Node<DefaultNodeProps | MultiLabelNodeProps>[] | void) => void;
	setEdges: (setter: (edges: Edge[]) => Edge[] | void) => void;
	setSelectedNodeId: (nodeId: string | null) => void;
	setSelectedEdgeId: (edgeId: string | null) => void;
	setIsEditingNodeId: (nodeId: string | null) => void;
	setSelectedNodeIds: (nodeIds: string[]) => void;
	setSelectedEdgeIds: (edgeIds: string[]) => void;
	setHighlightedElements: (payload: { nodes: Set<string>; edges: Set<string> }) => void;

	setNewNodeType: (nodeType: string) => void;

	onAddNode: (nodeType: string, position: XYPosition) => void;
	onDeleteSelected: () => void;
	isLabelDuplicate: (nodes: Node[], label: string, excludeNodeId?: string) => boolean;
	setNodeData: (nodeId: string, nodeLabel: any) => void;
}

const getNextNodeName = (nodes: Node<DefaultNodeProps | MultiLabelNodeProps>[]): string => {
	const baseLabel = "New Node";
	const existingLabels = new Set(nodes.map(node => node.data.label));

	if (!existingLabels.has(baseLabel)) return baseLabel;

	let counter = 2;
	while (existingLabels.has(`${baseLabel} ${counter}`)) {
		counter++;
	}
	return `${baseLabel} ${counter}`;
};

type NodeCreator = (position: XYPosition, nodeType: string) => Node<any>;

const nodeFactories: Record<string, NodeCreator> = {
	[NodeTypeNames.Default]: (position: XYPosition, label: string): Node<DefaultNodeProps> => ({
		id: uuid(),
		position,
		data: { label },
		type: NodeTypeNames.Default,
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	}),

	[NodeTypeNames.MultiLabel]: (position: XYPosition, label: string): Node<MultiLabelNodeProps> => ({
		id: uuid(),
		position,
		data: {
			label,
			sublabel1: "",
			sublabel2: "",
		},
		type: NodeTypeNames.MultiLabel,
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	}),
};

export const useStore = create<AppState>()(
	persist((set) => ({
		nodes: [],
		edges: [],
		selectedNodeId: null,
		selectedEdgeId: null,
		isEditingNodeId: null,
		highlightedNodes: new Set(),
		highlightedEdges: new Set(),
		selectedNodeIds: [],
		selectedEdgeIds: [],

		newNodeType: NodeTypeNames.Default,

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

		setNewNodeType: (nodeType) => set({ newNodeType: nodeType }),

		// Add a new node at a given position
		onAddNode: (nodeType: string, position: XYPosition) => {
			set((state) => {
				const nodeLabel = getNextNodeName(state.nodes);
				const createNode = nodeFactories[nodeType];

				if (!createNode) {
					console.warn(`Unknown node type: ${nodeType}`);
					return state;
				}

				const newNode = createNode(position, nodeLabel);
				return {
					nodes: [...state.nodes, newNode]
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
	}),
		{
			name: 'flowchart-storage',
			storage: createJSONStorage(() => localStorage),
			// Only persist these fields:
			partialize: (state) => ({
				nodes: state.nodes,
				edges: state.edges,
			}),
		}
	)
);
