import { create } from "zustand";
import { Edge, Node, XYPosition, Position } from "reactflow";
import { v4 as uuid } from "uuid";
import { FlowNodeData } from "./types";

interface AppState {
	nodes: Node<FlowNodeData>[];
	edges: Edge[];
	selectedNodeId: string | null;
	selectedEdgeId: string | null;
	isEditingNodeId: string | null;
	highlightedNodes: Set<string>;
	highlightedEdges: Set<string>;
	selectedNodeIds: string[];
	selectedEdgeIds: string[];

	setNodes: (setter: (nodes: Node<FlowNodeData>[]) => Node<FlowNodeData>[] | void) => void;
	setEdges: (setter: (edges: Edge[]) => Edge[] | void) => void;
	setSelectedNodeId: (nodeId: string | null) => void;
	setSelectedEdgeId: (edgeId: string | null) => void;
	setIsEditingNodeId: (nodeId: string | null) => void;
	setSelectedNodeIds: (nodeIds: string[] ) => void;
	setSelectedEdgeIds: (edgeIds: string[] ) => void;
	setHighlightedElements: (payload: { nodes: Set<string>; edges: Set<string> }) => void;

	onAddNode: (position: XYPosition) => void;
	onDeleteSelected: () => void;
}

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
		const newNode: Node<FlowNodeData> = {
			id: uuid(),
			position,
			data: {
				label: "New Node",
			},
			type: "default",
			sourcePosition: Position.Right,
			targetPosition: Position.Left,
		};
		set((state) => ({
			nodes: [...state.nodes, newNode],
		}));
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
}));
