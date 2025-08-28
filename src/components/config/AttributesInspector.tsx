import React, { useState, useCallback, useEffect, useRef } from "react";
import { ConnectionState } from "livekit-client";
import { AttributeItem } from "@/lib/types";
import { Button } from "@/components/button/Button";
import { useLocalParticipant } from "@livekit/components-react";
import { AttributeRow } from "./AttributeRow";

interface AttributesInspectorProps {
  attributes: AttributeItem[];
  onAttributesChange: (attributes: AttributeItem[]) => void;
  themeColor: string;
  disabled?: boolean;
  connectionState?: ConnectionState;
  metadata?: string;
  onMetadataChange?: (metadata: string) => void;
}

export const AttributesInspector: React.FC<AttributesInspectorProps> = ({
  attributes,
  onAttributesChange,
  themeColor,
  disabled = false,
  connectionState,
  metadata,
  onMetadataChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [localAttributes, setLocalAttributes] =
    useState<AttributeItem[]>(attributes);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSyncFlash, setShowSyncFlash] = useState(false);
  const { localParticipant } = useLocalParticipant();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncFlashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local attributes when props change
  useEffect(() => {
    setLocalAttributes(attributes);
  }, [attributes]);

  const syncAttributesWithRoom = useCallback(() => {
    if (!localParticipant || connectionState !== ConnectionState.Connected)
      return;

    const attributesMap = localAttributes.reduce(
      (acc, attr) => {
        if (attr.key && attr.key.trim() !== "") {
          acc[attr.key] = attr.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    localParticipant.setAttributes(attributesMap);
    setHasUnsavedChanges(false);
    setShowSyncFlash(true);
    if (syncFlashTimeoutRef.current) {
      clearTimeout(syncFlashTimeoutRef.current);
    }
    syncFlashTimeoutRef.current = setTimeout(
      () => setShowSyncFlash(false),
      1000,
    );
  }, [localAttributes, localParticipant, connectionState]);

  // Handle debounced sync
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (connectionState === ConnectionState.Connected && localParticipant) {
        syncAttributesWithRoom();
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    hasUnsavedChanges,
    syncAttributesWithRoom,
    connectionState,
    localParticipant,
  ]);

  const handleKeyChange = (id: string, newKey: string) => {
    const updatedAttributes = localAttributes.map((attr) =>
      attr.id === id ? { ...attr, key: newKey } : attr,
    );
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected && newKey.trim() !== "") {
      setHasUnsavedChanges(true);
    }
  };

  const handleValueChange = (id: string, newValue: string) => {
    const updatedAttributes = localAttributes.map((attr) =>
      attr.id === id ? { ...attr, value: newValue } : attr,
    );
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveAttribute = (id: string) => {
    const updatedAttributes = localAttributes.filter((attr) => attr.id !== id);
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  const handleAddAttribute = () => {
    const newId = `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updatedAttributes = [
      ...localAttributes,
      { id: newId, key: "", value: "" },
    ];
    setLocalAttributes(updatedAttributes);
    onAttributesChange(updatedAttributes);
    if (connectionState === ConnectionState.Connected) {
      setHasUnsavedChanges(true);
    }
  };

  return (
    <div>
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-sm text-gray-500">Attributes</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {isExpanded && (
        <div className="p-3 mb-2 border border-gray-800 rounded-sm bg-gray-900/30">
          {disabled ? (
            localAttributes.length === 0 ? (
              <div className="font-sans text-sm text-gray-400">
                No attributes set
              </div>
            ) : (
              localAttributes.map((attribute) => (
                <AttributeRow
                  key={attribute.id}
                  attribute={attribute}
                  onKeyChange={handleKeyChange}
                  onValueChange={handleValueChange}
                  disabled={true}
                />
              ))
            )
          ) : (
            <>
              {localAttributes.map((attribute) => (
                <AttributeRow
                  key={attribute.id}
                  attribute={attribute}
                  onKeyChange={handleKeyChange}
                  onValueChange={handleValueChange}
                  onRemove={handleRemoveAttribute}
                  disabled={disabled}
                />
              ))}
              <div className="flex items-center justify-between">
                <Button
                  accentColor={themeColor}
                  onClick={handleAddAttribute}
                  className="flex items-center gap-1 text-xs"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Attribute
                </Button>
                {showSyncFlash && (
                  <div className="text-xs text-gray-400 animate-fade-in-out">
                    Changes saved
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      <>
        <div
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
        >
          <div className="text-sm text-gray-500">Metadata</div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-gray-500 transition-transform ${isMetadataExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {isMetadataExpanded &&
          (disabled || connectionState === ConnectionState.Connected ? (
            <div className="border border-gray-800 rounded-sm bg-gray-900/30 px-3 py-2 mb-4 min-h-[40px] flex items-center">
              {metadata ? (
                <pre className="w-full p-0 m-0 font-mono text-xs text-gray-400 break-words whitespace-pre-wrap bg-transparent border-0">
                  {metadata}
                </pre>
              ) : (
                <div className="w-full font-sans text-sm text-left text-gray-400">
                  No metadata set
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={metadata}
              onChange={(e) => onMetadataChange?.(e.target.value)}
              className="w-full px-3 py-2 mb-4 font-mono text-sm text-gray-400 bg-transparent border border-gray-800 rounded-sm"
              placeholder="Enter metadata..."
              rows={3}
            />
          ))}
      </>
    </div>
  );
};
