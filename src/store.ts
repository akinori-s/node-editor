import create from "zustand";
import { Edge, Node, XYPosition } from "reactflow";
import { v4 as uuid } from "uuid";
import { FlowNodeData } from "./types";

/**
 * We'll use Zustand for simple state management.
 * This store holds:
 *  - all nodes
 *  - all edges
 *  - currently selected node ID
 *  - which node is being edited
 *  - sets for highlighted nodes/edges
 */
interface AppState {
	nodes: Node<FlowNodeData>[];
	edges: Edge[];
	selectedNodeId: string | null;
	isEditingNodeId: string | null;
	highlightedNodes: Set<string>;
	highlightedEdges: Set<string>;

	setNodes: (setter: (nodes: Node<FlowNodeData>[]) => Node<FlowNodeData>[] | void) => void;
	setEdges: (setter: (edges: Edge[]) => Edge[] | void) => void;
	setSelectedNodeId: (nodeId: string | null) => void;
	setIsEditingNodeId: (nodeId: string | null) => void;
	setHighlightedElements: (payload: { nodes: Set<string>; edges: Set<string> }) => void;

	onAddNode: (position: XYPosition) => void;
}

export const useStore = create<AppState>((set, get) => ({
	nodes: [],
	edges: [],
	selectedNodeId: null,
	isEditingNodeId: null,
	highlightedNodes: new Set(),
	highlightedEdges: new Set(),

	setNodes: (setter) =>
		set((state) => {
			const newNodes = setter([...state.nodes]);
			return newNodes ? { nodes: newNodes } : {};
		}),

	setEdges: (setter) =>
		set((state) => {
			const newEdges = setter([...state.edges]);
			return newEdges ? { edges: newEdges } : {};
		}),

	setSelectedNodeId: (nodeId) => set(() => ({ selectedNodeId: nodeId })),

	setIsEditingNodeId: (nodeId) => set(() => ({ isEditingNodeId: nodeId })),

	setHighlightedElements: ({ nodes, edges }) =>
		set(() => ({
			highlightedNodes: nodes,
			highlightedEdges: edges,
		})),

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
