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

interface FlowSnapshot {
	nodes: Node<DefaultNodeProps | MultiLabelNodeProps>[];
	edges: Edge[];
}

interface AppState {
	history: FlowSnapshot[];
	historyIndex: number;
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

	pushToHistory: (nodes: Node<DefaultNodeProps | MultiLabelNodeProps>[], edges: Edge[]) => void;
	undo: () => void;
	redo: () => void;

	setNodes: (setter: (
		nodes: Node<DefaultNodeProps | MultiLabelNodeProps>[]
	) => Node<DefaultNodeProps | MultiLabelNodeProps>[], isSetHistory: boolean) => void;
	setEdges: (setter: (edges: Edge[]) => Edge[], isSetHistory: boolean) => void;
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
	setNodeData: (nodeId: string, nodeData: any) => void;
}

const getNextNodeName = (nodes: Node<DefaultNodeProps | MultiLabelNodeProps>[]): string => {
	const baseLabel = "New Node";
	const existingLabels = new Set(nodes.map((node) => node.data.label));

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
	persist((set, get) => ({
		history: [
			{
				nodes: [],
				edges: [],
			},
		],
		historyIndex: 0,

		get nodes() {
			const { history, historyIndex } = get();
			if (historyIndex < 0 || historyIndex >= history.length) return [];
			return history[historyIndex].nodes;
		},
		get edges() {
			const { history, historyIndex } = get();
			if (historyIndex < 0 || historyIndex >= history.length) return [];
			return history[historyIndex].edges;
		},

		selectedNodeId: null,
		selectedEdgeId: null,
		isEditingNodeId: null,
		highlightedNodes: new Set(),
		highlightedEdges: new Set(),
		selectedNodeIds: [],
		selectedEdgeIds: [],

		newNodeType: NodeTypeNames.Default,

		pushToHistory: (nodes, edges) => {
			set((state) => {
				const truncated = state.history.slice(0, state.historyIndex + 1);
				const newSnapshot: FlowSnapshot = {
					nodes: [...nodes],
					edges: [...edges],
				};

				const newHistory = [...truncated, newSnapshot];
				return {
					nodes: [...nodes],
					edges: [...edges],
					history: newHistory,
					historyIndex: newHistory.length - 1,
				};
			});
		},

		undo: () => {
			set((state) => {
				if (state.historyIndex > 0) {
					const newHistoryIndex = state.historyIndex - 1;
					return {
						historyIndex: newHistoryIndex,
						nodes: state.history[newHistoryIndex].nodes,
						edges: state.history[newHistoryIndex].edges,
					};
				}
				return {};
			});
		},

		// WIP: try handling only position changes for history in onNodesChange.
		redo: () => {
			set((state) => {
				if (state.historyIndex < state.history.length - 1) {
					const newHistoryIndex = state.historyIndex + 1;
					return {
						historyIndex: newHistoryIndex,
						nodes: state.history[newHistoryIndex].nodes,
						edges: state.history[newHistoryIndex].edges,
					};
				}
				return {};
			});
		},

		setNodes: (setter, isSetHistory) => {
			const { nodes, edges, pushToHistory } = get();
			const newNodes = setter([...nodes]);
			if (isSetHistory) {
				pushToHistory(newNodes, edges);
			} else {
				set({ nodes: newNodes });
			}
		},

		setEdges: (setter, isSetHistory) => {
			const { nodes, edges, pushToHistory } = get();
			const newEdges = setter([...edges]);
			if (isSetHistory) {
				pushToHistory(nodes, newEdges);
			} else {
				set({ edges: newEdges });
			}
		},

		setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

		setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId }),

		setIsEditingNodeId: (nodeId) => set({ isEditingNodeId: nodeId }),

		setSelectedNodeIds: (ids: string[]) => set({ selectedNodeIds: ids }),

		setSelectedEdgeIds: (ids: string[]) => set({ selectedEdgeIds: ids }),

		setHighlightedElements: ({ nodes, edges }) =>
			set({
				highlightedNodes: nodes,
				highlightedEdges: edges,
			}),

		setNewNodeType: (nodeType) => set({ newNodeType: nodeType }),

		onAddNode: (nodeType: string, position: XYPosition) => {
			set((state) => {
				const { nodes } = get();
				const nodeLabel = getNextNodeName(nodes);
				const createNode = nodeFactories[nodeType];

				if (!createNode) {
					console.warn(`Unknown node type: ${nodeType}`);
					return {};
				}

				const newNode = createNode(position, nodeLabel);
				return {
					nodes: [...state.nodes, newNode],
				};
			});
			// DO NOT pushToHistory here
		},

		onDeleteSelected: () => {
			set((state) => {
				const { nodes, edges, pushToHistory } = get();
				const remainingNodes = nodes.filter(
					(node) => !state.selectedNodeIds.includes(node.id)
				);
				const remainingEdges = edges.filter(
					(edge) =>
						!state.selectedEdgeIds.includes(edge.id) &&
						!state.selectedNodeIds.includes(edge.source) &&
						!state.selectedNodeIds.includes(edge.target)
				);
				pushToHistory(remainingNodes, remainingEdges);

				return {
					selectedNodeIds: [],
					selectedEdgeIds: [],
					selectedNodeId: null,
					selectedEdgeId: null,
					highlightedNodes: new Set(),
					highlightedEdges: new Set(),
				};
			});
		},

		isLabelDuplicate: (nodes: Node[], label: string, excludeNodeId?: string) => {
			return nodes.some((node) => node.data.label === label && node.id !== excludeNodeId);
		},

		setNodeData: (nodeId: string, nodeData: any) => {
			const { nodes, edges, pushToHistory } = get();
			const updatedNodes = nodes.map((node) =>
				node.id === nodeId
					? {
						...node,
						data: { ...nodeData },
					}
					: node
			);
			pushToHistory(updatedNodes, edges);
		},
	}),
		{
			name: 'flowchart-storage',
			storage: createJSONStorage(() => localStorage),
			// Only persist these fields if you want to keep them across reloads
			partialize: (state) => ({
				history: state.history,
				historyIndex: state.historyIndex,
			}),
		})
);
