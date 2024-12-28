import { useMemo, useState } from "react";
import { useStore } from "./store";
import { getUpstreamAndDownstream } from "./graphUtils";
import { ArrowDownUp, Command, Settings } from "lucide-react"
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarFooter,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
	Input,
} from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

/**
 * Sidebar lists all nodes. Filtered by search query and
 * optionally sorted by alphabetical order or creation order.
 */
export default function AppSidebar() {
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
	const [searchQuery, setSearchQuery] = useState("");
	const [sortMethod, setSortMethod] = useState<"default" | "alphabetical">("default");

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
		<Sidebar>
			<SidebarHeader>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu className="flex flex-row">
							<SidebarMenuItem>
								<Input
									type="text"
									placeholder="Search"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Select value={sortMethod} onValueChange={(e: any) => setSortMethod(e.target.value)} >
									<SelectTrigger className="w-8 h-8 p-0 flex items-center justify-center">
										<SelectValue placeholder={<ArrowDownUp size={16} />} />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="default">Created Order</SelectItem>
											<SelectItem value="alphabetical">Alphabetical</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>

							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Nodes</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{sortedNodes.map((node) => (
								<SidebarMenuItem
									key={node.id}
								>
									<SidebarMenuButton
										asChild
										className={`${node.id === selectedNodeId ? "bg-blue-200 hover:bg-blue-200" : ""}`}
										onClick={() => handleNodeClick(node.id)}
										onDoubleClick={() => handleDoubleClick(node.id, node.data?.label)}
									>
										<div className="flex items-center">
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
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<div>
								<Command />
								<span>Shortcuts</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<div>
								<Settings />
								<span>Settings</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar >
	);
}
