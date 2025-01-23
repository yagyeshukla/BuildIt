import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FolderTree,
  ListTodo,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Code,
  Eye,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { BACKEND_URL } from "../config";

const BuilderPage = () => {
  const location = useLocation();
  const { prompt } = location.state || { prompt: "" };
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");

  // Mock steps for demonstration
  const steps = [
    "Initialize project structure",
    "Set up development environment",
    "Create main layout components",
    "Implement responsive design",
    "Add interactive features",
    "Optimize for performance",
  ];

  // Mock file structure with content
  const files = [
    {
      name: "index.html",
      type: "file",
      content:
        '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>My Website</title>\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>',
    },
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "App.tsx",
          type: "file",
          content:
            'import React from "react";\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;',
        },
        { name: "components", type: "folder", children: [] },
        { name: "styles", type: "folder", children: [] },
      ],
    },
    { name: "public", type: "folder", children: [] },
  ];

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const getFileContent = (name: string) => {
    const findContent = (items: any[]): string | null => {
      for (const item of items) {
        if (item.type === "file" && item.name === name) {
          return item.content || "No content available";
        }
        if (item.children) {
          const content = findContent(item.children);
          if (content) return content;
        }
      }
      return null;
    };
    return findContent(files);
  };

  const getFileLanguage = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "html":
        return "html";
      case "css":
        return "css";
      case "js":
        return "javascript";
      case "jsx":
        return "javascript";
      case "ts":
        return "typescript";
      case "tsx":
        return "typescript";
      case "json":
        return "json";
      default:
        return "plaintext";
    }
  };

  const renderFileTree = (items: any[], path = "") => {
    return items.map((item, index) => {
      const currentPath = `${path}/${item.name}`;
      const isExpanded = expandedFolders.includes(currentPath);

      return (
        <div key={currentPath}>
          <div
            className={`py-1 flex items-center space-x-1 hover:bg-gray-800 rounded px-2 cursor-pointer ${
              selectedFile === item.name ? "bg-gray-800" : ""
            }`}
            onClick={() => {
              if (item.type === "folder") {
                toggleFolder(currentPath);
              } else {
                setSelectedFile(item.name);
                setActiveTab("code");
              }
            }}
          >
            {item.type === "folder" && (
              <span className="text-gray-400">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            )}
            <span className="text-indigo-400">
              {item.type === "folder" ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </span>
            <span className="text-gray-300">{item.name}</span>
          </div>
          {item.type === "folder" && isExpanded && (
            <div style={{ marginLeft: "20px" }}>
              {renderFileTree(item.children, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const TabButton = ({
    tab,
    icon: Icon,
    label,
  }: {
    tab: "code" | "preview";
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
        activeTab === tab
          ? "bg-indigo-600 text-white"
          : "text-gray-400 hover:bg-gray-800"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  async function init() {
    try {
      const { data } = await axios.post(`${BACKEND_URL}/template`, {
        prompt: prompt.trim(),
      });
      const { prompts, uiPrompts } = data;
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...prompts, prompt].map((text) => ({
          role: "user",
          parts: [
            {
              text,
            },
          ],
        })),
      });
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Steps Sidebar */}
      <div className="w-1/4 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto h-screen">
        <div className="flex items-center space-x-2 mb-6">
          <ListTodo className="h-6 w-6 text-indigo-400" />
          <h2 className="text-xl font-semibold text-gray-100">Build Steps</h2>
        </div>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-900 text-indigo-400 flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <span className="text-gray-300">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* File Explorer */}
        <div className="w-1/3 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto h-screen">
          <div className="flex items-center space-x-2 mb-6">
            <FolderTree className="h-6 w-6 text-indigo-400" />
            <h2 className="text-xl font-semibold text-gray-100">
              File Explorer
            </h2>
          </div>
          <div className="font-mono text-sm">{renderFileTree(files)}</div>
        </div>

        {/* Code Editor / Preview */}
        <div className="w-2/3 p-6 overflow-y-auto h-screen">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              Building Your Website
            </h1>
            <p className="text-gray-400">Based on prompt: "{prompt}"</p>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-semibold text-gray-100">
                  {selectedFile || "Select a file"}
                </h2>
              </div>
              <div className="flex space-x-2">
                <TabButton tab="code" icon={Code} label="Code" />
                <TabButton tab="preview" icon={Eye} label="Preview" />
              </div>
            </div>

            {selectedFile ? (
              activeTab === "code" ? (
                <div className="h-[calc(100vh-300px)] rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage={getFileLanguage(selectedFile)}
                    value={getFileContent(selectedFile) || ""}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      readOnly: false,
                      wordWrap: "on",
                    }}
                  />
                </div>
              ) : (
                <div className="h-[calc(100vh-300px)] bg-white rounded-lg">
                  <iframe
                    src="/preview"
                    className="w-full h-full rounded-lg"
                    title="Website Preview"
                  />
                </div>
              )
            ) : (
              <div className="h-[calc(100vh-300px)] flex items-center justify-center text-gray-500">
                Select a file to view its contents
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;
