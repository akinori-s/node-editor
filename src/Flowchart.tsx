import React, { useCallback } from "react";
import ReactFlow, {
	addEdge,
	applyNodeChanges,
	applyEdgeChanges,
	reconnectEdge,
	Background,
	MarkerType,
	MiniMap,
	Controls,
	OnSelectionChangeParams,
	SelectionMode,
	type XYPosition,
	type Node,
	type Edge,
	type Connection,
	type OnConnect,
	type OnEdgesDelete,
	type OnNodesDelete,
	type OnNodesChange,
	type OnEdgesChange,
} from "reactflow";
import "reactflow/dist/style.css";

import { NodeTypeNames, useStore } from "./store";
import { getUpstreamAndDownstream } from "./graphUtils";
import MultiLabelNode from "./MultiLabelNode";
import { FlowNodeData } from "./types";
import { v4 as uuid } from "uuid";
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

const SELECTED_BG = "#eceefa";
const SELECTED_COLOR = "#2f4eff";
const SELECTED_ZINDEX = 2;
const HIGHLIGHTED_COLOR = "#838cff";
const HIGHLIGHTED_ZINDEX = 1;
const BASE_ZINDEX = 0;
const baseMarker = { type: MarkerType.ArrowClosed };

const nodeStyles = {
	base: { className: "rounded-md" },
	selected: {
		outline: `2px solid ${SELECTED_COLOR}`,
		backgroundColor: SELECTED_BG,
		zIndex: SELECTED_ZINDEX
	},
	highlighted: {
		outline: `2px solid ${HIGHLIGHTED_COLOR}`,
		zIndex: HIGHLIGHTED_ZINDEX
	}
};
const edgeStyles = {
	base: { strokeWidth: 2 },
	selected: { stroke: SELECTED_COLOR, strokeWidth: 4 },
	highlighted: { stroke: HIGHLIGHTED_COLOR, strokeWidth: 3 }
};

const nodeTypes = {
	multiLabelNode: MultiLabelNode,
};

export default function Flowchart() {
	const {
		nodes,
		edges,
		setNodes,
		setEdges,
		onAddNode,
		selectedNodeId,
		setSelectedNodeId,
		selectedEdgeId,
		setSelectedEdgeId,
		highlightedNodes,
		highlightedEdges,
		setIsEditingNodeId,
		setHighlightedElements,
		onDeleteSelected,
		selectedNodeIds,
		selectedEdgeIds,
		setSelectedNodeIds,
		setSelectedEdgeIds,

		newNodeType,
		setNewNodeType,
	} = useStore();

	// --- Node & Edge Change Handlers ---

	const onNodesChange: OnNodesChange = useCallback((changes) => {
		setNodes((prevNodes) => applyNodeChanges(changes, prevNodes));
	}, [setNodes]);

	const onEdgesChange: OnEdgesChange = useCallback((changes) => {
		setEdges((prevEdges) => applyEdgeChanges(changes, prevEdges));
	}, [setEdges]);

	const onConnect: OnConnect = useCallback((connection: Connection) => {
		if (selectedNodeIds.length > 1) {
			const newEdges = selectedNodeIds
				.filter((nodeId) => nodeId !== connection.target)
				.map((nodeId) => ({
					id: uuid(),
					source: nodeId,
					target: connection.target ?? "",
					markerEnd: { type: MarkerType.ArrowClosed },
					type: 'smoothstep',
				}));
			setEdges((prevEdges) => [...prevEdges, ...newEdges]);
			return;
		} else {
			const newEdge: Edge = {
				id: uuid(),
				source: connection.source ?? "",
				target: connection.target ?? "",
				markerEnd: { type: MarkerType.ArrowClosed },
				type: 'smoothstep',
			};
			setEdges((prevEdges) => addEdge(newEdge, prevEdges));
		}
	}, [selectedNodeIds, setEdges]);

	const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
		setEdges((edges) => reconnectEdge(oldEdge, newConnection, edges));
	}, [setEdges]);

	// --- Node & Edge Delete Handlers ---
	const onNodesDelete: OnNodesDelete = useCallback((deletedNodes) => {
		const deletedIds = deletedNodes.map((n) => n.id);
		// Remove edges connected to these deleted nodes:
		setEdges((prevEdges) =>
			prevEdges.filter((edge) => !deletedIds.includes(edge.source) && !deletedIds.includes(edge.target))
		);
	}, [setEdges]);

	const onEdgesDelete: OnEdgesDelete = useCallback((_deletedEdges) => {
		// If you want to do something special on edge deletion, do it here.
		// By default, React Flow + applyEdgeChanges will remove them from the state anyway.
	}, []);

	// --- Click Handlers ---
	const handleNodeClick = useCallback((_: any, node: Node<FlowNodeData>) => {
		setSelectedNodeId(node.id);
		setSelectedEdgeId(null);
		const { allUpstreamNodeIds, allDownstreamNodeIds, allUpstreamEdges, allDownstreamEdges } =
			getUpstreamAndDownstream(node.id);

		setHighlightedElements({
			nodes: new Set([...allUpstreamNodeIds, node.id, ...allDownstreamNodeIds]),
			edges: new Set([...allUpstreamEdges, ...allDownstreamEdges]),
		});
	}, [setSelectedNodeId, setSelectedEdgeId, setHighlightedElements]);

	const handleEdgeClick = useCallback((_: any, edge: Edge) => {
		setSelectedEdgeId(edge.id);
		setSelectedNodeId(null);
		setHighlightedElements({
			nodes: new Set([edge.source, edge.target]),
			edges: new Set(),
		});
	}, [setSelectedEdgeId, setSelectedNodeId, setHighlightedElements]);

	const handleNodeDoubleClick = useCallback((_: any, node: Node<FlowNodeData>) => {
		// Open editor for that node
		setIsEditingNodeId(node.id);
	}, [setIsEditingNodeId]);

	// --- Keyboard (Delete Key) ---
	const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
		const { isEditingNodeId } = useStore.getState();
		if (isEditingNodeId) {
			return;
		}
		if (e.key === "Delete") {
			if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
				onDeleteSelected();
			} else if (selectedNodeId) {
				setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
				setEdges((eds) => eds.filter((ed) =>
					ed.source !== selectedNodeId && ed.target !== selectedNodeId
				));
				setSelectedNodeId(null);
				setHighlightedElements({ nodes: new Set(), edges: new Set() });
			} else if (selectedEdgeId) {
				setEdges((eds) => eds.filter((ed) => ed.id !== selectedEdgeId));
				setSelectedEdgeId(null);
			}
		}
	}, [selectedNodeIds, selectedEdgeIds, selectedNodeId, selectedEdgeId,
		onDeleteSelected, setNodes, setEdges, setSelectedNodeId,
		setSelectedEdgeId, setHighlightedElements]);

	// --- Add Node ---
	const addNewNode = useCallback(() => {
		const position: XYPosition = { x: 1000, y: 500 };
		const nodeType = useStore.getState().newNodeType;
		onAddNode(nodeType, position);
	}, [onAddNode]);

	const handleNodeTypeChange = useCallback((nodeType: string) => () => {
		setNewNodeType(nodeType);
		addNewNode();
	}, [setNewNodeType, addNewNode]);

	// --- Selection Change Handler ---
	const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
		const nodeIds = params.nodes.map(node => node.id);
		const edgeIds = params.edges.map(edge => edge.id);

		setSelectedNodeIds(nodeIds);
		setSelectedEdgeIds(edgeIds);
		if (params.edges.length === 0 && params.nodes.length === 0) {
			setIsEditingNodeId(null);
			setHighlightedElements({ nodes: new Set(), edges: new Set() });
		}
		// Update single selection state for backwards compatibility
		setSelectedNodeId(nodeIds.length === 1 ? nodeIds[0] : null);
		setSelectedEdgeId(edgeIds.length === 1 ? edgeIds[0] : null);
	}, [setSelectedNodeIds, setSelectedEdgeIds, setSelectedNodeId, setSelectedEdgeId]);

	return (
		<div className="w-full h-full" onKeyDown={onKeyDown} tabIndex={0}>
			<div className="absolute top-4 right-4 z-10 flex gap-1">
				<Button
					onClick={addNewNode}
				>
					Add Node
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild className="flex flex-col items-center">
						<Button
							onClick={addNewNode}
							className="px-3"
						>
							<ChevronDown />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuRadioGroup value={newNodeType} onValueChange={setNewNodeType}>
							<DropdownMenuRadioItem value={NodeTypeNames.Default} onClick={handleNodeTypeChange(NodeTypeNames.Default)}>
								Default Node
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value={NodeTypeNames.MultiLabel} onClick={handleNodeTypeChange(NodeTypeNames.MultiLabel)}>
								Multi Label Node
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<ReactFlow
				nodes={nodes.map((n) => ({
					...n,
					...nodeStyles.base,
					style: selectedNodeId === n.id
						? nodeStyles.selected
						: highlightedNodes.has(n.id)
							? nodeStyles.highlighted
							: {}
				}))}
				edges={edges.map((e) => ({
					...e,
					style: {
						...edgeStyles.base,
						...(selectedEdgeId === e.id
							? edgeStyles.selected
							: highlightedEdges.has(e.id)
								? edgeStyles.highlighted
								: {})
					},
					markerEnd: {
						...baseMarker,
						...(selectedEdgeId === e.id || highlightedEdges.has(e.id) ? {
							color: selectedEdgeId === e.id ? SELECTED_COLOR : HIGHLIGHTED_COLOR
						} : {})
					},
					zIndex: (selectedEdgeId === e.id || highlightedEdges.has(e.id)) ? (
						selectedEdgeId === e.id) ? SELECTED_ZINDEX : HIGHLIGHTED_ZINDEX
						: BASE_ZINDEX
				}))}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onReconnect={onReconnect}
				onNodesDelete={onNodesDelete}
				onEdgesDelete={onEdgesDelete}
				onNodeClick={handleNodeClick}
				onEdgeClick={handleEdgeClick}
				onNodeDoubleClick={handleNodeDoubleClick}
				onSelectionChange={onSelectionChange}
				selectionMode={SelectionMode.Full}
				fitView
				fitViewOptions={{ padding: 0.2 }}
				snapToGrid
				snapGrid={[10, 10]}
				panOnDrag
				multiSelectionKeyCode={["ShiftLeft", "ShiftRight"]}
				nodesDraggable
				nodesConnectable
			>
				<MiniMap />
				<Background />
				<Controls />
			</ReactFlow>
		</div >
	);
}
