import { useMemo, useState } from "react";
import { useStore } from "./store";
import { getUpstreamAndDownstream } from "./graphUtils";

interface SidebarProps {
	searchQuery: string;
	sortMethod: "default" | "alphabetical";
}

/**
 * Sidebar lists all nodes. Filtered by search query and
 * optionally sorted by alphabetical order or creation order.
 */
export default function Sidebar({ searchQuery, sortMethod }: SidebarProps) {
	const {
		nodes,
		selectedNodeId,
		setSelectedNodeId,
		setSelectedEdgeId,
		setHighlightedElements,
		isLabelDuplicate,
		setNodeLabel,
	} = useStore();
	const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [errorNodeID, setErrorNodeID] = useState("");

	// Filter nodes by the search query:
	const filteredNodes = useMemo(() => {
		return nodes.filter((n) =>
			n.data?.label.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}, [nodes, searchQuery]);

	// Sort nodes either by creation (their internal order in the array)
	// or by alphabetical (label).
	const sortedNodes = useMemo(() => {
		if (sortMethod === "alphabetical") {
			return [...filteredNodes].sort((a, b) => (a.data?.label ?? "").localeCompare(b.data?.label ?? ""));
		}
		// "default" creation order is simply the order in which they appear in nodes
		return filteredNodes;
	}, [filteredNodes, sortMethod]);

	/**
	 * Handler for clicking a node in the sidebar
	 */
	const handleNodeClick = (nodeId: string) => {
		// Programmatically set the selected node in the store,
		// so it highlights in the Flowchart.
		setSelectedNodeId(nodeId);
		setSelectedEdgeId(null);
		const { allUpstreamNodeIds, allDownstreamNodeIds, allUpstreamEdges, allDownstreamEdges } =
			getUpstreamAndDownstream(nodeId);

		setHighlightedElements({
			nodes: new Set([...allUpstreamNodeIds, nodeId, ...allDownstreamNodeIds]),
			edges: new Set([...allUpstreamEdges, ...allDownstreamEdges]),
		});
	};

	const handleEditValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditValue(e.target.value);
		setErrorNodeID("");
	}

	const handleDoubleClick = (nodeId: string, currentLabel: string) => {
		setEditingNodeId(nodeId);
		setEditValue(currentLabel);
	};

	const handleSave = () => {
		if (editingNodeId) {
			if (isLabelDuplicate(nodes, editValue, editingNodeId)) {
				setErrorNodeID(editingNodeId);
				return;
			}
			setNodeLabel(editingNodeId, editValue);
			setEditingNodeId(null);
			setErrorNodeID("");
		}
	};

	const handleCancel = () => {
		setEditingNodeId(null);
		setEditValue("");
	};

	return (
		<div className="flex-1 overflow-y-auto">
			{sortedNodes.map((node) => (
				<div
					key={node.id}
					className={`p-2 cursor-pointer border-b border-gray-200 ${node.id === selectedNodeId ? "bg-blue-200" : "hover:bg-gray-200"
						}`}
					onClick={() => handleNodeClick(node.id)}
					onDoubleClick={() => handleDoubleClick(node.id, node.data?.label)}
				>
					{editingNodeId === node.id ? (
						<input
							type="text"
							value={editValue}
							onChange={handleEditValueChange}
							onBlur={handleSave}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleSave();
								} else if (e.key === "Escape") {
									handleCancel();
								}
							}}
							autoFocus
							className="w-full px-1 bg-white"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						node.data?.label
					)}
					{errorNodeID === node.id && <div className="text-red-500 text-sm">Duplicate label</div>}
				</div>
			))}
		</div>
	);
}
