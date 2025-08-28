import { ReactNode } from "react";

type NameValueRowProps = {
  name: string;
  value?: ReactNode;
  valueColor?: string;
};

export const NameValueRow: React.FC<NameValueRowProps> = ({
  name,
  value,
  valueColor = "gray-700",
}) => {
  return (
    <div className="flex flex-row items-baseline w-full text-sm">
      <div className="text-gray-500 grow shrink-0">{name}</div>
      <div className={`text-xs shrink text-${valueColor} text-right`}>
        {value}
      </div>
    </div>
  );
};

type EditableNameValueRowProps = {
  name: string;
  value: string;
  valueColor?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  editable: boolean;
};

export const EditableNameValueRow: React.FC<EditableNameValueRowProps> = ({
  name,
  value,
  valueColor = "gray-700",
  onValueChange,
  placeholder,
  editable,
}) => {
  if (editable && onValueChange) {
    return (
      <div className="flex flex-row items-baseline w-full text-sm">
        <div className="text-gray-500 grow shrink-0">{name}</div>
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={`text-xs shrink text-${valueColor} text-right bg-transparent border-b border-gray-800 focus:outline-none focus:border-gray-600 px-2 py-0`}
          placeholder={placeholder}
        />
      </div>
    );
  }
  return <NameValueRow name={name} value={value} valueColor={valueColor} />;
};
