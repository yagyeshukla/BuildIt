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
  CheckCircle,
  Circle,
  Clock,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { Step, FileItem, StepType } from "../types/index";
import { parseXml } from "../steps";
import { useWebContainer } from "../hooks/useWebContainer";
import { FileNode, WebContainer } from "@webcontainer/api";
import { PreviewFrame } from "../components/PreviewFrame";
import { TabView } from "../components/TabView";
import { CodeEditor } from "../components/CodeEditor";

const BuilderPage = () => {
  const location = useLocation();
  const { prompt } = location.state || { prompt: "" };
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const webcontainer = useWebContainer();

  console.log("STEPS :", steps);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps
      .filter(({ status }) => status === "pending")
      .map((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
          let currentFileStructure = [...originalFiles]; // {}
          let finalAnswerRef = currentFileStructure;

          let currentFolder = "";
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              // final file
              let file = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "file",
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              /// in a folder
              let folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
                // create the folder
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "folder",
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder
              )!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => {
          return {
            ...s,
            status: "completed",
          };
        })
      );
    }
    console.log(files);
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processFile = (file: FileItem, isRootFolder: boolean) => {
        if (file.type === "folder") {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children
              ? Object.fromEntries(
                  file.children.map((child) => [
                    child.name,
                    processFile(child, false),
                  ])
                )
              : {},
          };
        } else if (file.type === "file") {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || "",
              },
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || "",
              },
            };
          }
        }

        return mountStructure[file.name];
      };

      // Process each top-level file/folder
      files.forEach((file) => processFile(file, true));

      return mountStructure;
    };

    const mountStructure = createMountStructure(files);

    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  // Mock steps for demonstration

  // Mock file structure with content

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
              selectedFile?.name === item.name ? "bg-gray-800" : ""
            }`}
            onClick={() => {
              if (item.type === "folder") {
                toggleFolder(currentPath);
              } else {
                setSelectedFile({
                  name: item.name,
                  type: "file",
                  path: item.path,
                  content: item.content,
                  children: item.children,
                });
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
      const stepsArr: Step[] = parseXml(uiPrompts[0]);
      setSteps(stepsArr.map((step) => ({ ...step, status: "pending" })));
      console.log(steps);
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
      console.log("CHAT DATA :", stepsResponse.data.response);
      setSteps((s) => [
        ...s,
        ...parseXml(stepsResponse.data.response).map((x) => ({
          ...x,
          status: "pending" as "pending",
        })),
      ]);
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
        <div className="space-y-0">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700"
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                <div className="flex items-center gap-2">
                  {step.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : step.status === "in-progress" ? (
                    <Clock className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>
              <span className="text-gray-300">{step.title}</span>
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
                  {selectedFile?.name || "Select a file"}
                </h2>
              </div>
              <div className="flex space-x-2">
                <TabButton tab="code" icon={Code} label="Code" />
                <TabButton tab="preview" icon={Eye} label="Preview" />
              </div>
            </div>

            {/* {activeTab === "code" ? (
              <div className="h-[calc(100vh-300px)] rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage={getFileLanguage(selectedFile as string)}
                  value={getFileContent(selectedFile as string) || ""}
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
              <PreviewFrame
                webContainer={webcontainer as WebContainer}
                files={files}
              />
            )} */}

            <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
              <TabView activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="h-[calc(100%-4rem)]">
                {activeTab === "code" ? (
                  <CodeEditor file={selectedFile} />
                ) : (
                  webcontainer && (
                    <PreviewFrame webContainer={webcontainer} files={files} />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;
