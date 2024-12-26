import React, { useCallback, useState } from "react";
import ReactFlow, {
	applyNodeChanges,
	applyEdgeChanges,
	addEdge,
	Background,
	Connection,
	Edge,
	MarkerType,
	MiniMap,
	Node,
	OnConnect,
	OnEdgesDelete,
	OnNodesDelete,
	OnNodesChange,
	OnEdgesChange,
	reconnectEdge,
	ReactFlowInstance,
	Controls,
} from "reactflow";
import "reactflow/dist/style.css";

import { useStore } from "./store";
import { getUpstreamAndDownstream } from "./graphUtils";
import NodeEditor from "./NodeEditor";
import { FlowNodeData } from "./types";

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
		isEditingNodeId,
		highlightedNodes,
		highlightedEdges,
		setIsEditingNodeId,
		setHighlightedElements,
	} = useStore();

	const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

	// --- Node & Edge Change Handlers ---

	const onNodesChange: OnNodesChange = useCallback((changes) => {
		setNodes((prevNodes) => applyNodeChanges(changes, prevNodes));
	}, [setNodes]);

	const onEdgesChange: OnEdgesChange = useCallback((changes) => {
		setEdges((prevEdges) => applyEdgeChanges(changes, prevEdges));
	}, [setEdges]);

	const onConnect: OnConnect = useCallback((connection: Connection) => {
		const newEdge: Edge = {
			id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
			source: connection.source ?? "",
			target: connection.target ?? "",
			markerEnd: { type: MarkerType.ArrowClosed },
			type: 'smoothstep',
		};
		setEdges((prevEdges) => addEdge(newEdge, prevEdges));
	}, [setEdges]);

	const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
		setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
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
		if (e.key === "Delete") {
			if (selectedNodeId) {
				// Remove the node from store
				setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
				// Remove edges associated with that node
				setEdges((eds) => eds.filter((ed) => ed.source !== selectedNodeId && ed.target !== selectedNodeId));
				// Clear node highlight & selection
				setSelectedNodeId(null);
				setHighlightedElements({ nodes: new Set(), edges: new Set() });
			} else if (selectedEdgeId) {
				// Remove edges associated with that node
				setEdges((eds) => eds.filter((ed) => ed.id !== selectedEdgeId));
				// Clear edge selection
				setSelectedEdgeId(null);
			}
		}
	}, [selectedNodeId, selectedEdgeId, setNodes, setEdges, setSelectedNodeId, setSelectedEdgeId, setHighlightedElements]);

	// --- Add Node ---
	const addNewNode = useCallback(() => {
		if (!reactFlowInstance) return;
		const position = reactFlowInstance.screenToFlowPosition({ x: 1000, y: 500 });
		onAddNode(position);
	}, [onAddNode, reactFlowInstance]);

	return (
		<div className="w-full h-full" onKeyDown={onKeyDown} tabIndex={0}>
			{/* Button to add a node */}
			<div className="absolute top-2 right-2 z-10">
				<button
					onClick={addNewNode}
					className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
				>
					Add Node
				</button>
			</div>

			<ReactFlow
				nodes={nodes.map((n) => ({
					...n,
					style: selectedNodeId == n.id
						? { outline: "2px solid #ffaf57", backgroundColor: "#fff5e6" }
						: (highlightedNodes.has(n.id)
							? { outline: "2px solid #ffde85" }
							: {}
						),
				}))}
				edges={edges.map((e) => ({
					...e,
					style: selectedEdgeId == e.id
						? { stroke: "#ffaf57", strokeWidth: 2 }
						: (highlightedEdges.has(e.id)
							? { stroke: "#ffde85", strokeWidth: 2 }
							: {}
						),
				}))}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onReconnect={onReconnect}
				onNodesDelete={onNodesDelete}
				onEdgesDelete={onEdgesDelete}
				onNodeClick={handleNodeClick}
				onEdgeClick={handleEdgeClick}
				onNodeDoubleClick={handleNodeDoubleClick}
				onInit={setReactFlowInstance}
				fitView
				fitViewOptions={{ padding: 0.2 }}
				snapToGrid
				snapGrid={[20, 20]}
				panOnDrag
				multiSelectionKeyCode={["ShiftLeft", "ShiftRight"]}
				nodesDraggable
				nodesConnectable
			>
				<MiniMap />
				<Background />
				<Controls />
			</ReactFlow>

			{/* Editor Modal if isEditingNodeId is set */}
			{isEditingNodeId !== null && <NodeEditor />}
		</div>
	);
}
