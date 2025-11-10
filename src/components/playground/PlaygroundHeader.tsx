/* eslint-disable @next/next/no-img-element */

import { ConnectionState } from "livekit-client";
import type { ReactNode } from "react";
import { Button } from "@/components/button/Button";
import { LoadingSVG } from "@/components/button/LoadingSVG";
import { SettingsDropdown } from "@/components/playground/SettingsDropdown";
import { useConfig } from "@/hooks/useConfig";

type PlaygroundHeader = {
	logo?: ReactNode;
	title?: ReactNode;
	githubLink?: string;
	height: number;
	accentColor: string;
	connectionState: ConnectionState;
	onConnectClicked: () => void;
};

export const PlaygroundHeader = ({
	logo,
	title,
	githubLink,
	accentColor,
	height,
	onConnectClicked,
	connectionState,
}: PlaygroundHeader) => {
	const { config } = useConfig();
	return (
		<div
			className={`flex gap-4 pt-4 text-${accentColor}-500 justify-between items-center shrink-0`}
			style={{
				height: `${height}px`,
			}}
		>
			<div className="flex items-center gap-3 basis-2/3">
				<div className="flex lg:basis-1/2">
					<img src="/logo.png" alt="logo" className="size-10" />
				</div>
				<div className="text-xs text-white lg:basis-1/2 lg:text-center lg:text-base lg:font-semibold">
					{title}
				</div>
			</div>
			<div className="flex items-center justify-end gap-2 basis-1/3">
				{config.settings.editable && <SettingsDropdown />}
				<Button
					accentColor={
						connectionState === ConnectionState.Connected ? "red" : accentColor
					}
					disabled={connectionState === ConnectionState.Connecting}
					onClick={() => {
						onConnectClicked();
					}}
				>
					{connectionState === ConnectionState.Connecting ? (
						<LoadingSVG />
					) : connectionState === ConnectionState.Connected ? (
						"Disconnect"
					) : (
						"Connect"
					)}
				</Button>
			</div>
		</div>
	);
};
