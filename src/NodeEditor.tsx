import { useState, useCallback, useRef } from "react";
import { useStore } from "./store";

export default function NodeEditor() {
	const {
		isEditingNodeId,
		setIsEditingNodeId,
		nodes,
		setNodes,
		isLabelDuplicate,
		setNodeLabel,
	} = useStore();
	const inputRef = useRef<HTMLInputElement>(null);
	const [errorNodeID, setErrorNodeID] = useState("");

	if (!isEditingNodeId) {
		return null;
	}

	const nodeToEdit = nodes.find((n) => n.id === isEditingNodeId);
	if (!nodeToEdit) {
		return null;
	}

	// On confirm, update the node label
	const handleConfirm = useCallback(() => {
		if (!inputRef.current) return;
		const newLabel = inputRef.current.value;
		if (isLabelDuplicate(nodes, newLabel, isEditingNodeId)) {
			setErrorNodeID(isEditingNodeId);
			return;
		}
		setNodeLabel(isEditingNodeId, newLabel);
		setIsEditingNodeId(null);
		setErrorNodeID("");
	}, [isEditingNodeId, setNodes, setIsEditingNodeId]);

	// On cancel, just close
	const handleCancel = useCallback(() => {
		setIsEditingNodeId(null);
	}, [setIsEditingNodeId]);

	return (
		<div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-20">
			<div
				className="absolute inset-0 bg-black opacity-50"
				onClick={handleCancel}
			/>
			<div className="relative bg-white p-4 rounded shadow-lg max-w-sm w-full">
				<h2 className="font-bold mb-2">Edit Node Label</h2>
				<input
					className="w-full border border-gray-300 rounded px-2 py-1 mb-2"
					defaultValue={nodeToEdit.data?.label}
					ref={inputRef}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleConfirm();
						} else if (e.key === "Escape") {
							handleCancel();
						}
					}}
				/>
				{errorNodeID === isEditingNodeId && (
					<div className="text-red-500 text-sm mb-2">Duplicate label</div>
				)}
				<div className="flex justify-end space-x-2">
					<button
						onClick={handleCancel}
						className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
					>
						Cancel
					</button>
					<button
						onClick={handleConfirm}
						className="px-3 py-1 border rounded bg-blue-600 text-white hover:bg-blue-700"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}
