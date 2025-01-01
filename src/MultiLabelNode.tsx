import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";

interface MultiLabelNodeProps extends NodeProps<{
	label: string;
	sublabel1: string;
	sublabel2: string;
}> { }

function MultiLabelNode({ data }: MultiLabelNodeProps) {

	return (
		<div className="flex flex-col px-2 py-1 min-w-48 max-w-96 bg-white border border-black rounded-md text-black">
			{/* The default “label” field */}
			<div className="text-xs text-slate-400 text-left">{data.sublabel1 || "N/A"}</div>

			{/* Additional fields */}
			<div className="text-sm text-center">{data.label || "N/A"}</div>
			<div className="text-sm text-center">{data.sublabel2 || "N/A"}</div>

			{/* Example: add default handles for edges */}
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

export default memo(MultiLabelNode);
