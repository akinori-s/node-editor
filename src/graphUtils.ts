import { useStore } from "./store";

/**
 * Find all upstream and downstream node IDs given a node ID by traversing edges.
 * Return sets of node IDs and edge IDs for highlighting.
 *
 * This is a basic BFS approach. If your graph is large, you can optimize or memoize.
 */
export function getUpstreamAndDownstream(nodeId: string) {
	const { nodes, edges } = useStore.getState();

	const allUpstreamNodeIds = new Set<string>();
	const allDownstreamNodeIds = new Set<string>();
	const allUpstreamEdges = new Set<string>();
	const allDownstreamEdges = new Set<string>();

	// Build adjacency list
	const adjList: Record<string, { in: string[]; out: string[] }> = {};
	nodes.forEach((n) => {
		adjList[n.id] = { in: [], out: [] };
	});
	edges.forEach((e) => {
		if (adjList[e.source]) {
			adjList[e.source].out.push(e.target);
		}
		if (adjList[e.target]) {
			adjList[e.target].in.push(e.source);
		}
	});

	// BFS upstream
	const queueUp: string[] = [nodeId];
	const visitedUp = new Set<string>();
	while (queueUp.length) {
		const current = queueUp.shift()!;
		if (visitedUp.has(current)) continue;
		visitedUp.add(current);
		const inEdges = adjList[current]?.in || [];
		inEdges.forEach((parent) => {
			allUpstreamNodeIds.add(parent);
			// find the specific edge between parent and current
			const edge = edges.find((ed) => ed.source === parent && ed.target === current);
			if (edge) {
				allUpstreamEdges.add(edge.id);
			}
			queueUp.push(parent);
		});
	}

	// BFS downstream
	const queueDown: string[] = [nodeId];
	const visitedDown = new Set<string>();
	while (queueDown.length) {
		const current = queueDown.shift()!;
		if (visitedDown.has(current)) continue;
		visitedDown.add(current);
		const outEdges = adjList[current]?.out || [];
		outEdges.forEach((child) => {
			allDownstreamNodeIds.add(child);
			const edge = edges.find((ed) => ed.source === current && ed.target === child);
			if (edge) {
				allDownstreamEdges.add(edge.id);
			}
			queueDown.push(child);
		});
	}

	return {
		allUpstreamNodeIds,
		allDownstreamNodeIds,
		allUpstreamEdges,
		allDownstreamEdges,
	};
}
