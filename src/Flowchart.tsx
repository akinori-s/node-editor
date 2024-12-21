import React, { useCallback, useState } from "react";
import ReactFlow, {
	addEdge,
	Background,
	Connection,
	Edge,
	MarkerType,
	MiniMap,
	Node,
	useEdgesState,
	useNodesState,
	OnConnectStartParams,
	OnConnect,
	OnEdgesDelete,
	OnNodesDelete,
	OnNodesChange,
	OnEdgesChange,
	OnConnectEnd
} from "reactflow";
import "reactflow/dist/style.css";

import { useStore } from "./store";
import { getUpstreamAndDownstream } from "./graphUtils";
import NodeEditor from "./NodeEditor";
import { FlowNodeData } from "./types";

/**
 * Flowchart component that displays the React Flow canvas.
 * Users can:
 *  - Drag the canvas to pan
 *  - Mouse wheel (or pinch) to zoom
 *  - Connect edges by dragging from a node handle
 *  - Double-click a node to rename
 *  - Single-click a node to highlight upstream/downstream
 *  - Press Delete to remove selected node(s) or edge(s)
 */
export default function Flowchart() {
	const {
		nodes,
		edges,
		setNodes,
		setEdges,
		onAddNode,
		selectedNodeId,
		setSelectedNodeId,
		setHighlightedElements,
		highlightedNodes,
		highlightedEdges,
	} = useStore();

	const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

	const [nodesState, onNodesChange] = useNodesState(nodes);
	const [edgesState, onEdgesChange] = useEdgesState(edges);

	// Keep store and local state in sync
	const handleNodesChange: OnNodesChange = useCallback(
		(changes) => {
			onNodesChange(changes);
			setNodes(nodesState);
		},
		[onNodesChange, setNodes, nodesState]
	);

	const handleEdgesChange: OnEdgesChange = useCallback(
		(changes) => {
			onEdgesChange(changes);
			setEdges(edgesState);
		},
		[onEdgesChange, setEdges, edgesState]
	);

	const handleConnect: OnConnect = useCallback(
		(connection: Connection) => {
			const newEdge: Edge = {
				id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
				source: connection.source ?? "",
				target: connection.target ?? "",
				markerEnd: {
					type: MarkerType.ArrowClosed,
				},
			};
			const updatedEdges = addEdge(newEdge, edgesState);
			setEdges(updatedEdges);
		},
		[edgesState, setEdges]
	);

	const handleNodesDelete: OnNodesDelete = (deleted) => {
		// Update store
		const deletedIds = deleted.map((n) => n.id);
		// Clean up edges from these nodes as well
		setEdges((eds) => eds.filter((edge) => !deletedIds.includes(edge.source) && !deletedIds.includes(edge.target)));
	};

	const handleEdgesDelete: OnEdgesDelete = (deleted) => {
		// Nothing else needed if you're using useEdgesState
	};

	/**
	 * On single-click of a node, highlight it and all its upstream/downstream nodes/edges.
	 */
	const onNodeClick = useCallback(
		(_: React.MouseEvent, node: Node<FlowNodeData>) => {
			setSelectedNodeId(node.id);

			// find all upstream/downstream node ids & edges
			const { allUpstreamNodeIds, allDownstreamNodeIds, allUpstreamEdges, allDownstreamEdges } = getUpstreamAndDownstream(node.id);

			setHighlightedElements({
				nodes: new Set([...allUpstreamNodeIds, node.id, ...allDownstreamNodeIds]),
				edges: new Set([...allUpstreamEdges, ...allDownstreamEdges]),
			});
		},
		[setSelectedNodeId, setHighlightedElements]
	);

	/**
	 * On double-click of a node, open the node-editor overlay (handled by NodeEditor).
	 */
	const onNodeDoubleClick = useCallback(
		(_: React.MouseEvent, node: Node<FlowNodeData>) => {
			// Trigger store to open editor for the node
			useStore.setState({ isEditingNodeId: node.id });
		},
		[]
	);

	/**
	 * Keydown handler for shortcuts, e.g. Delete to remove selected elements
	 */
	const onKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Delete") {
				if (selectedNodeId) {
					// Remove selected node
					setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
					// Remove edges associated
					setEdges((eds) => eds.filter((ed) => ed.source !== selectedNodeId && ed.target !== selectedNodeId));
					useStore.setState({ selectedNodeId: null, highlightedNodes: new Set(), highlightedEdges: new Set() });
				} else {
					// or if an edge is selected in future
				}
			}
		},
		[selectedNodeId, setNodes, setEdges]
	);

	/**
	 * Add a node at a random position in the visible area, for demonstration.
	 */
	const addNewNode = useCallback(() => {
		if (!reactFlowInstance) return;
		onAddNode(reactFlowInstance.project({ x: 200, y: 100 })); // Adjust position
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
				nodes={nodesState.map((n) => ({
					...n,
					style: highlightedNodes.has(n.id)
						? {
							outline: "2px solid #ff0000",
							backgroundColor: "#ffe5e5",
						}
						: {},
				}))}
				edges={edgesState.map((e) => ({
					...e,
					style: highlightedEdges.has(e.id)
						? { stroke: "#ff0000", strokeWidth: 2 }
						: {},
				}))}
				onNodesChange={handleNodesChange}
				onEdgesChange={handleEdgesChange}
				onConnect={handleConnect}
				onNodesDelete={handleNodesDelete}
				onEdgesDelete={handleEdgesDelete}
				onNodeClick={onNodeClick}
				onNodeDoubleClick={onNodeDoubleClick}
				onInit={setReactFlowInstance}
				fitView
				fitViewOptions={{ padding: 0.2 }}
				snapToGrid
				snapGrid={[15, 15]}
				panOnDrag
				multiSelectionKeyCode={["ShiftLeft", "ShiftRight"]}
				nodesDraggable
				nodesConnectable
			>
				<MiniMap />
				<Background />
			</ReactFlow>

			{/* Modal for editing node name */}
			<NodeEditor />
		</div>
	);
}
