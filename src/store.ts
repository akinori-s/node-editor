import { create } from "zustand";
import { Edge, Node, XYPosition } from "reactflow";
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

	setNodes: (setter: (nodes: Node<FlowNodeData>[]) => Node<FlowNodeData>[] | void) => void;
	setEdges: (setter: (edges: Edge[]) => Edge[] | void) => void;
	setSelectedNodeId: (nodeId: string | null) => void;
	setSelectedEdgeId: (edgeId: string | null) => void;
	setIsEditingNodeId: (nodeId: string | null) => void;
	setHighlightedElements: (payload: { nodes: Set<string>; edges: Set<string> }) => void;

	onAddNode: (position: XYPosition) => void;
}

export const useStore = create<AppState>((set) => ({
	nodes: [],
	edges: [],
	selectedNodeId: null,
	selectedEdgeId: null,
	isEditingNodeId: null,
	highlightedNodes: new Set(),
	highlightedEdges: new Set(),

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
		};
		set((state) => ({
			nodes: [...state.nodes, newNode],
		}));
	},
}));
