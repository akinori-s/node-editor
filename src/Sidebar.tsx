import { useMemo } from "react";
import { useStore } from "./store";
import { NodeData } from "./types";

interface SidebarProps {
	searchQuery: string;
	sortMethod: "default" | "alphabetical";
}

/**
 * Sidebar lists all nodes. Filtered by search query and
 * optionally sorted by alphabetical order or creation order.
 */
export default function Sidebar({ searchQuery, sortMethod }: SidebarProps) {
	const { nodes, selectedNodeId, setSelectedNodeId, setHighlightedElements } = useStore();

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

		// Clear highlight for others. Actual highlighting is done in Flowchart's onNodeClick,
		// so we can re-run that logic here OR we can dispatch a custom event. For simplicity,
		// let's do a minimal highlight reset here. The actual BFS highlight is triggered in Flowchart
		// on a "real" node click. If you want to mimic that logic here, you could import & reuse 
		// getUpstreamAndDownstream as well.
		setHighlightedElements({
			nodes: new Set([nodeId]),
			edges: new Set(),
		});
	};

	return (
		<div className="flex-1 overflow-y-auto">
			{sortedNodes.map((node) => (
				<div
					key={node.id}
					className={`p-2 cursor-pointer border-b border-gray-200 ${node.id === selectedNodeId ? "bg-blue-200" : "hover:bg-gray-200"
						}`}
					onClick={() => handleNodeClick(node.id)}
				>
					{node.data?.label}
				</div>
			))}
		</div>
	);
}
