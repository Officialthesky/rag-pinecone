import { X, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import React, { useState, useRef, useEffect } from "react";
import { FcBusinessman, FcAssistant } from "react-icons/fc";
import { IoIosSend } from "react-icons/io";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const FileUpload = () => {
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isIndexing, setIsIndexing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const fileInputRef = useRef(null);

  const [topics, setTopics] = useState([
    { id: 1, name: "Customer Support Agent", messages: [] }
  ]);

  const [currentTopicId] = useState(1);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const currentTopic = topics.find((t) => t.id === currentTopicId);

  const API_URL = "http://localhost:3002/api/sendMessage";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentTopic?.messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setTopics((prevTopics) =>
      prevTopics.map((topic) => {
        if (topic.id === currentTopicId) {
          return {
            ...topic,
            messages: [...topic.messages, { sender: "user", text: input }]
          };
        }
        return topic;
      })
    );

    setInput("");
    setIsLoading(true);
    setError(null);

    const history = currentTopic.messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    history.push({
      role: "user",
      parts: [{ text: input }]
    });

    const requestBody = {
      message: input,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from the server");
      }

      const data = await response.json();

      setTopics((prevTopics) =>
        prevTopics.map((topic) => {
          if (topic.id === currentTopicId) {
            return {
              ...topic,
              messages: [
                ...topic.messages,
                { sender: "model", text: data.response }
              ]
            };
          }
          return topic;
        })
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Sorry, something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

    // Custom renderer for code blocks
    const CodeBlock = ({ language, value }) => {
      return (
        <SyntaxHighlighter
          language={language}
          style={materialDark}
          PreTag="div"
          className="rounded-lg bg-gray-800 text-gray-200 p-4 overflow-auto"
        >
          {String(value).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    };

  // Message component with markdown support
  const Message = ({ message }) => {
    return (
      <div className="prose prose-sm max-w-none text-left">
        <ReactMarkdown
          components={{
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              return !inline ? (
                <CodeBlock language={language} value={String(children)} />
              ) : (
                <code className="px-1 py-0.5 rounded-md bg-gray-100 font-mono text-sm">
                  {children}
                </code>
              );
            },
          }}
        >
          {message}
        </ReactMarkdown>
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
    else return (bytes / 1048576).toFixed(1) + 'MB';
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsIndexing(true);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        setPreviewData(jsonData);

        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsIndexing(false);
        setIsReady(true);
      } catch (err) {
        setError('Failed to read Excel file');
        setIsIndexing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = async (file) => {
    if (file.size > 200 * 1024 * 1024) {
      setError('File size exceeds 200MB limit');
      return;
    }

    try {
      setError(null);
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));

      readExcelFile(file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3002/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    }
  };

  const handleClear = () => {
    setError(null);
    setPreviewData(null);
    setFileName('');
    setFileSize('');
    setIsReady(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="w-80 bg-gray-800/50 p-6 border-r border-gray-700">
        <div className="mb-4">
          <h3 className="text-white text-lg font-semibold mb-2">Add your documents!</h3>

          {!previewData ? (
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/80 p-6 
                         transition-all duration-200 cursor-pointer hover:border-gray-500
                         flex flex-col items-center justify-center min-h-[200px]"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                  handleFileUpload(file);
                } else {
                  setError('Please upload an Excel file (.xlsx)');
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                accept=".xlsx"
                className="hidden"
              />

              <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-400 text-center mb-1">
                Drag and drop file here
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Limit 200MB per file • XLSX
              </p>
              <button className="px-4 py-2 bg-gray-700 text-sm text-gray-300 rounded-md
                               hover:bg-gray-600 transition-colors duration-200">
                Browse files
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-800/80 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="w-6 h-6 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-300 font-medium truncate max-w-[180px]">
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-500">{fileSize}</p>
                    </div>
                  </div>
                  <button onClick={handleClear}
                    className="text-gray-500 hover:text-gray-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isIndexing && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Indexing your document...</p>
                </div>
              )}

              {isReady && (
                <div className="bg-green-800/20 rounded-lg p-4">
                  <p className="text-sm text-green-400">Ready to Chat!</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm text-gray-400 font-medium">Excel Preview</h4>
                <div className="bg-gray-800/80 rounded-lg">
                  <div className="max-h-[400px] overflow-auto">
                    <div className="min-w-full inline-block align-middle">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-700/50 sticky top-0">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-xs font-medium text-gray-400 text-left whitespace-nowrap">
                                #
                              </th>
                              {previewData[0] && Object.keys(previewData[0]).map((header) => (
                                <th
                                  key={header}
                                  scope="col"
                                  className="px-4 py-2 text-xs font-medium text-gray-400 text-left whitespace-nowrap"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700 bg-gray-800/40">
                            {previewData.map((row, index) => (
                              <tr key={index} className="hover:bg-gray-700/30">
                                <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                                  {index}
                                </td>
                                {Object.values(row).map((cell, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className="px-4 py-2 text-xs text-gray-300 whitespace-nowrap"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-800/20 rounded-lg p-4 flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex h-screen">
          <div className="flex-1 flex flex-col" style={{ backgroundColor: '#f3f6f7', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto space-y-4">
                {currentTopic?.messages.length === 0 ? (
                  <div className="flex justify-center items-center w-full">
                    <p className="text-lg font-semibold text-gray-600">Ask anything related sheet</p>
                  </div>
                ) : (
                  currentTopic?.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start w-full`}
                    >
                      {msg.sender === "model" && (
                        <div className="flex-shrink-0 mr-2 mt-1">
                          <FcAssistant size={30} />
                        </div>
                      )}
                      <div
                        className={`${msg.sender === "user"
                          ? "bg-gray-100 text-gray-800 ml-auto"
                          : "bg-gray-300 text-gray-800 mr-auto"
                          } p-4 rounded-lg max-w-[70%]`}
                      >
                        <Message message={msg.text} sender={msg.sender} />
                      </div>
                      {msg.sender === "user" && (
                        <div className="flex-shrink-0 ml-2 mt-1">
                          <FcBusinessman size={30} />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start items-start w-full">
                    <div className="flex-shrink-0 mr-2">
                      <FcAssistant size={30} />
                    </div>
                    <div className="bg-gray-300 text-gray-800 p-4 rounded-lg mr-auto max-w-[70%]">
                      <div className="animate-pulse text-left">...</div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-start items-start w-full">
                    <div className="flex-shrink-0 mr-2">
                      <FcAssistant size={30} />
                    </div>
                    <div className="bg-red-200 text-red-800 p-4 rounded-lg mr-auto max-w-[70%]">
                      <div className="text-left">{error}</div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>



            <div className="p-4 border-t">
              <div className="max-w-4xl mx-auto flex items-center">
                <input
                  type="text"
                  className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-0"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="ml-4 px-6 py-3 text-gray-800 font-weight-bold border-gray-700 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <IoIosSend size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
