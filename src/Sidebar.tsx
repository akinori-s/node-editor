import { useMemo, useState } from "react";
import { useStore } from "./store";
import { getUpstreamAndDownstream } from "./graphUtils";
import { importFlowData, exportToFile } from './flowchartUtils';
import {
	Command as CommandIcon, FolderInput, FolderOutput, PanelRightOpen, Settings,
	SquareChevronRight, SquareMinus, ClockArrowDown, ArrowDownAZ, Undo, Redo
} from "lucide-react"
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
	SidebarSeparator,
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
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "@/components/ui/command"

/**
 * Sidebar lists all nodes. Filtered by search query and
 * optionally sorted by alphabetical order or creation order.
 */
export default function AppSidebar() {
	const {
		nodes,
		edges,
		setNodes,
		setEdges,
		selectedNodeId,
		setSelectedNodeId,
		setSelectedEdgeId,
		setHighlightedElements,
		isLabelDuplicate,
		setNodeData,
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

	// Helper for sort icons
	const sortIcons = {
		default: <ClockArrowDown size={16} />,
		alphabetical: <ArrowDownAZ size={16} />
	};

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
			const node = nodes.find((n) => n.id === editingNodeId);
			setNodeData(editingNodeId, { ...node?.data, label: editValue });
			setEditingNodeId(null);
			setErrorNodeID("");
		}
	};

	const handleCancel = () => {
		setEditingNodeId(null);
		setEditValue("");
	};

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
		<Sidebar>
			<SidebarHeader>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu className="flex flex-row gap-2">
							<SidebarMenuItem className="flex-1">
								<Input
									type="text"
									placeholder="Search"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<Select value={sortMethod} onValueChange={(value) => setSortMethod(value as "default" | "alphabetical")}>
									<SelectTrigger>
										<SelectValue>
											{sortIcons[sortMethod]}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="default">
												<div className="flex items-center gap-2">
													{sortIcons.default}
													<span>Created Order</span>
												</div>
											</SelectItem>
											<SelectItem value="alphabetical">
												<div className="flex items-center gap-2">
													{sortIcons.alphabetical}
													<span>Alphabetical</span>
												</div>
											</SelectItem>
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
							<button onClick={() => document.getElementById('import-json')?.click()}>
								<FolderInput />
								<span>Import</span>
							</button>
						</SidebarMenuButton>
						<input
							type="file"
							id="import-json"
							className="hidden"
							accept=".json"
							onChange={handleImport}
						/>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<button onClick={handleExport}>
								<FolderOutput />
								<span>Export</span>
							</button>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				<SidebarSeparator />
				<SidebarMenu>
					<HoverCard>
						<HoverCardTrigger asChild>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<div>
										<CommandIcon />
										<span>Shortcuts</span>
									</div>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</HoverCardTrigger>
						<HoverCardContent className="p-0 shadow-none border-none">
							<Command className="rounded-lg border shadow-md md:min-w-[450px]">
								<CommandList>
									<CommandGroup heading="Shortcuts">
										<CommandItem>
											<PanelRightOpen />
											<span>Open and close sidebar</span>
											<CommandShortcut>⌘Ctrl + b</CommandShortcut>
										</CommandItem>
										<CommandItem>
											<SquareChevronRight />
											<span>Save node changes</span>
											<CommandShortcut>⌘Enter</CommandShortcut>
										</CommandItem>
										<CommandItem>
											<SquareMinus />
											<span>Cancel node changes</span>
											<CommandShortcut>⌘Esc</CommandShortcut>
										</CommandItem>
										<CommandItem>
											<Undo />
											<span>Undo</span>
											<CommandShortcut>⌘Ctrl + z</CommandShortcut>
										</CommandItem>
										<CommandItem>
											<Redo />
											<span>Redo</span>
											<CommandShortcut>⌘Ctrl + y</CommandShortcut>
										</CommandItem>
									</CommandGroup>
								</CommandList>
							</Command>
						</HoverCardContent>
					</HoverCard>
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
