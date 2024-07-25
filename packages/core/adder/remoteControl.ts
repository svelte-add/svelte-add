let remoteControlled = false;

export type RemoteControlOptions = {
	workingDirectory: string;
	isTesting: boolean;
	adderOptions: Record<string, Record<string, unknown>>;
};

export function enable() {
	remoteControlled = true;
}

export function isRemoteControlled() {
	return remoteControlled;
}

export function disable() {
	remoteControlled = false;
}
