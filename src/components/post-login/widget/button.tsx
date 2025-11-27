import type { ButtonWidget } from "@/lib/useWebSocket";

const ButtonWidgetComponent = ({ widget }: { widget: ButtonWidget }) => {
	return (
		<div className="p-2 bg-blue-900 rounded-full">
			{widget.type === "BUTTON" && (
				<div className="text-sm text-gray-200">
					{widget.buttons.map((b, i) => (
						<span key={`${b.label}-button-${i}`} className="block">
							{b.label}
						</span>
					))}
				</div>
			)}
		</div>
	);
};

export default ButtonWidgetComponent;
