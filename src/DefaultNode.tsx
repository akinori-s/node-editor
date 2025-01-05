import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useStore } from "./store";

export interface DefaultNodeProps {
	label: string;
}

function DefaultNode({ id, data }: NodeProps<DefaultNodeProps>) {
	const nodeContainerRef = useRef<HTMLDivElement>(null);
	const [errorNodeID, setErrorNodeID] = useState("");
	const [values, setValues] = useState({
		label: data.label,
	});
	const {
		isEditingNodeId,
		setIsEditingNodeId,
		nodes,
		setNodes,
		isLabelDuplicate,
		setNodeData,
	} = useStore();

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			// If click is NOT inside our node container...
			if (
				nodeContainerRef.current &&
				!nodeContainerRef.current.contains(e.target as Node)
			) {
				// ... then exit editing mode
				if (!isEditingNodeId) return;
				if (isLabelDuplicate(nodes, values.label, isEditingNodeId)) {
					setErrorNodeID(isEditingNodeId);
					return;
				}
				setNodeData(isEditingNodeId, values);
				setIsEditingNodeId(null);
				setErrorNodeID("");
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [id, isEditingNodeId, setIsEditingNodeId]);

	const handleDoubleClick = () => {
		setIsEditingNodeId(id);
	};

	const handleChange = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!isEditingNodeId) return;
		setValues(prev => ({ ...prev, [field]: e.target.value }));
		if (isLabelDuplicate(nodes, e.target.value, isEditingNodeId)) {
			setErrorNodeID(isEditingNodeId);
			return;
		}
		setNodeData(id, { ...values, [field]: e.target.value });
		setErrorNodeID("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		e.stopPropagation();
		if (e.key === 'Enter') {
			handleConfirm();
		}
	};

	// On confirm, update the node label
	const handleConfirm = useCallback(() => {
		if (!isEditingNodeId) return;
		if (isLabelDuplicate(nodes, values.label, isEditingNodeId)) {
			setErrorNodeID(isEditingNodeId);
			return;
		}
		setNodeData(isEditingNodeId, values);
		setIsEditingNodeId(null);
		setErrorNodeID("");
	}, [values, isEditingNodeId, setNodes, setNodeData, setIsEditingNodeId]);

	return (
		<div
			className="flex flex-col px-3 py-2 min-w-40 max-w-96 bg-white border border-black rounded-md text-black"
			ref={nodeContainerRef}
			onDoubleClick={handleDoubleClick}
		>
			{id === isEditingNodeId ? (
				<>
					<input
						className="break-words text-sm text-center border border-slate-300 rounded focus:outline-none"
						value={values.label}
						onChange={handleChange('label')}
						onKeyDown={handleKeyDown}
					/>
					{errorNodeID === isEditingNodeId && (
						<div className="text-center text-red-500 text-xs">Duplicate label</div>
					)}
				</>
			) : (
				<>
					<div
						className={`break-words text-sm text-center
						${!data.label ? "text-slate-400" : ""}
						`}
					>
						{data.label || "label"}
					</div>
				</>
			)}
			<Handle
				type="target"
				position={Position.Left}
				style={{ background: "#555" }}
			/>
			<Handle
				type="source"
				position={Position.Right}
				style={{ background: "#555" }}
			/>
		</div>
	);
}

export default memo(DefaultNode);
