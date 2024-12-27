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
	OnSelectionChangeParams,
	SelectionMode,
} from "reactflow";
import "reactflow/dist/style.css";

import { useStore } from "./store";
import { getUpstreamAndDownstream } from "./graphUtils";
import NodeEditor from "./NodeEditor";
import { FlowNodeData } from "./types";
import { importFlowData, exportToFile } from './flowchartUtils';

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
		onDeleteSelected,
		selectedNodeIds,
		selectedEdgeIds,
		setSelectedNodeIds,
		setSelectedEdgeIds,
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
			id: `edge-${connection.source}-${connection.target}`,
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
		if (!reactFlowInstance) return;
		const position = reactFlowInstance.screenToFlowPosition({ x: 1000, y: 500 });
		onAddNode(position);
	}, [onAddNode, reactFlowInstance]);

	// --- Selection Change Handler ---
	const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
		const nodeIds = params.nodes.map(node => node.id);
		const edgeIds = params.edges.map(edge => edge.id);

		setSelectedNodeIds(nodeIds);
		setSelectedEdgeIds(edgeIds);
		console.log(edgeIds);
		// Update single selection state for backwards compatibility
		setSelectedNodeId(nodeIds.length === 1 ? nodeIds[0] : null);
		setSelectedEdgeId(edgeIds.length === 1 ? edgeIds[0] : null);
	}, [setSelectedNodeIds, setSelectedEdgeIds, setSelectedNodeId, setSelectedEdgeId]);

	const handleExport = () => {
		try {
			exportToFile(nodes, edges);
		} catch (error) {
			console.error('Export failed:', error);
			alert(`Export failed: ${error}`);
			// Add error notification if you have a notification system
		}
	};

	const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		event.target.value = '';

		// Show confirmation dialog if there are existing nodes/edges
		if (nodes.length > 0 || edges.length > 0) {
			const confirmed = window.confirm(
				'Warning: Importing will overwrite all existing nodes and connections. Do you want to proceed?'
			);
			if (!confirmed) return;
		}

		try {
			const reader = new FileReader();
			reader.onload = (event) => {
				const jsonData = JSON.parse(event.target?.result as string);
				const { nodes: newNodes, edges: newEdges } = importFlowData(jsonData);
				setNodes(() => newNodes);
				setEdges(() => newEdges);
			};
			reader.readAsText(file);
		} catch (error) {
			console.error('Import failed:', error);
			alert(`Import failed:' ${error}`);
			// Add error notification if you have a notification system
		}
	};

	return (
		<div className="w-full h-full" onKeyDown={onKeyDown} tabIndex={0}>
			{/* Button to add a node */}
			<div className="absolute top-2 right-2 z-10 flex gap-2">
				<button
					onClick={handleExport}
					className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
				>
					Export
				</button>
				<input
					type="file"
					id="import-json"
					className="hidden"
					accept=".json"
					onChange={handleImport}
				/>

				<button
					onClick={() => document.getElementById('import-json')?.click()}
					className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
				>
					Import
				</button>

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
				onSelectionChange={onSelectionChange}
				selectionMode={SelectionMode.Full}
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
