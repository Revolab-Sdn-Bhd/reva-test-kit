import type React from "react";
import type { AttributeItem } from "@/lib/types";

interface AttributeRowProps {
	attribute: AttributeItem;
	onKeyChange: (id: string, newKey: string) => void;
	onValueChange: (id: string, newValue: string) => void;
	onRemove?: (id: string) => void;
	disabled?: boolean;
}

export const AttributeRow: React.FC<AttributeRowProps> = ({
	attribute,
	onKeyChange,
	onValueChange,
	onRemove,
	disabled = false,
}) => {
	return (
		<div className="flex items-center gap-2 mb-2">
			<input
				value={attribute.key}
				onChange={(e) => onKeyChange(attribute.id, e.target.value)}
				className="flex-1 min-w-0 px-3 py-1 font-mono text-sm text-gray-400 bg-transparent border border-gray-800 rounded-sm"
				placeholder="Name"
				disabled={disabled}
			/>
			<input
				value={attribute.value}
				onChange={(e) => onValueChange(attribute.id, e.target.value)}
				className="flex-1 min-w-0 px-3 py-1 font-mono text-sm text-gray-400 bg-transparent border border-gray-800 rounded-sm"
				placeholder="Value"
				disabled={disabled}
			/>
			{onRemove && (
				<button
					onClick={() => onRemove(attribute.id)}
					className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-gray-400 hover:text-white"
					disabled={disabled}
					style={{ display: disabled ? "none" : "flex" }}
					type="button"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="w-4 h-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			)}
		</div>
	);
};
