import AceEditor, { type IAceEditorProps } from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

const JsonEditor = ({ value, onChange }: IAceEditorProps) => {
	return (
		<AceEditor
			mode="json"
			theme="monokai"
			name="json_editor"
			value={value}
			onChange={onChange}
			width="100%"
			height="200px"
		/>
	);
};

export default JsonEditor;
