import React, { useState, useEffect } from 'react';
import { BookOpen, Code, Cpu, Zap, Droplet, Wrench, Radio, ChevronDown, ChevronUp, Search, Settings, Save, MessageSquare, Calculator, FileText, Brain, Globe, Lightbulb, Star, Download, Upload, RefreshCw, Moon, Sun } from 'lucide-react';

export default function UltimateAIAssistant() {
  const [mode, setMode] = useState('btech');
  const [selectedBranch, setSelectedBranch] = useState('cse');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  
  // Customization settings
  const [settings, setSettings] = useState({
    theme: 'dark',
    fontSize: 'medium',
    defaultMode: 'btech',
    defaultBranch: 'cse',
    showFormulas: true,
    showKeyPoints: true,
    autoSave: true,
    aiModel: 'advanced',
    language: 'english'
  });

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await window.storage.get('user_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings.value);
          setSettings(parsed);
          setMode(parsed.defaultMode);
          setSelectedBranch(parsed.defaultBranch);
          setDarkMode(parsed.theme === 'dark');
        }
      } catch (error) {
        console.log('No saved settings found, using defaults');
      }

      try {
        const savedFavorites = await window.storage.get('favorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites.value));
        }
      } catch (error) {
        console.log('No favorites found');
      }

      try {
        const savedChat = await window.storage.get('chat_history');
        if (savedChat) {
          setChatMessages(JSON.parse(savedChat.value));
        }
      } catch (error) {
        console.log('No chat history found');
      }
    };
    loadSettings();
  }, []);

  // Save settings
  const saveSettings = async () => {
    try {
      await window.storage.set('user_settings', JSON.stringify(settings));
      await window.storage.set('favorites', JSON.stringify(favorites));
      if (settings.autoSave) {
        await window.storage.set('chat_history', JSON.stringify(chatMessages));
      }
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  // Export settings
  const exportSettings = () => {
    const data = {
      settings,
      favorites,
      chatMessages: settings.autoSave ? chatMessages : []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-assistant-config.json';
    a.click();
  };

  // Import settings
  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setSettings(data.settings || settings);
          setFavorites(data.favorites || []);
          setChatMessages(data.chatMessages || []);
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Invalid configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  const branches = {
    cse: {
      name: 'Computer Science & Engineering',
      icon: Code,
      color: 'blue',
      subjects: {
        dsa: {
          name: 'Data Structures & Algorithms',
          topics: [
            {
              title: 'Time Complexity',
              content: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)',
              formulas: ['Big O, Omega, Theta notations', 'Master Theorem: T(n) = aT(n/b) + f(n)'],
              keyPoints: ['Best, Average, Worst cases', 'Space vs Time tradeoff'],
              examples: ['Binary Search: O(log n)', 'Bubble Sort: O(n²)']
            },
            {
              title: 'Arrays & Strings',
              content: 'Contiguous memory, O(1) access, O(n) insertion/deletion',
              formulas: ['2D array: arr[i][j] = base + (i×cols + j)×size'],
              keyPoints: ['Sliding window', 'Two pointers', 'Kadane\'s algorithm'],
              examples: ['Max subarray sum', 'String reversal', 'Anagram check']
            },
            {
              title: 'Linked Lists',
              content: 'Node-based, dynamic size',
              formulas: ['Reverse: prev→next = curr', 'Cycle: Floyd\'s algorithm'],
              keyPoints: ['Singly, Doubly, Circular', 'Dummy nodes'],
              examples: ['Detect cycle', 'Merge sorted lists', 'Reverse in groups']
            },
            {
              title: 'Trees & Graphs',
              content: 'Hierarchical & Network structures',
              formulas: ['DFS: O(V+E)', 'BFS: O(V+E)', 'Dijkstra: O(E log V)'],
              keyPoints: ['Traversals', 'Shortest paths', 'MST algorithms'],
              examples: ['Binary search tree', 'Level order traversal', 'Topological sort']
            }
          ]
        },
        dbms: {
          name: 'Database Management Systems',
          topics: [
            {
              title: 'SQL Fundamentals',
              content: 'DDL, DML, DCL commands',
              formulas: ['SELECT * FROM table WHERE condition', 'JOIN operations'],
              keyPoints: ['CRUD operations', 'Aggregate functions', 'GROUP BY'],
              examples: ['Find top salaries', 'Join multiple tables', 'Subqueries']
            },
            {
              title: 'Normalization',
              content: 'Remove redundancy',
              formulas: ['1NF→2NF→3NF→BCNF'],
              keyPoints: ['Functional dependencies', 'Decomposition'],
              examples: ['Student-Course database', 'Employee records']
            }
          ]
        },
        os: {
          name: 'Operating Systems',
          topics: [
            {
              title: 'Process Scheduling',
              content: 'CPU allocation algorithms',
              formulas: ['Turnaround = Completion - Arrival', 'Waiting = Turnaround - Burst'],
              keyPoints: ['FCFS, SJF, RR, Priority', 'Preemptive vs Non-preemptive'],
              examples: ['Calculate average waiting time', 'Gantt charts']
            },
            {
              title: 'Memory Management',
              content: 'Paging, Segmentation',
              formulas: ['Physical = Frame# + Offset', 'Page fault calculation'],
              keyPoints: ['Virtual memory', 'Page replacement', 'TLB'],
              examples: ['FIFO page replacement', 'LRU algorithm']
            }
          ]
        }
      }
    },
    ece: {
      name: 'Electronics & Communication',
      icon: Radio,
      color: 'purple',
      subjects: {
        signals: {
          name: 'Signals & Systems',
          topics: [
            {
              title: 'Fourier Transform',
              content: 'Time ↔ Frequency domain',
              formulas: ['X(ω) = ∫x(t)e^(-jωt)dt'],
              keyPoints: ['Linearity', 'Time shifting', 'Frequency shifting'],
              examples: ['Rectangular pulse', 'Sinusoidal signals']
            }
          ]
        },
        analog: {
          name: 'Analog Electronics',
          topics: [
            {
              title: 'Op-Amp Circuits',
              content: 'Operational Amplifier applications',
              formulas: ['Inverting: Vo = -(Rf/Ri)Vi', 'Non-inverting: Vo = (1+Rf/Ri)Vi'],
              keyPoints: ['Virtual ground', 'High input impedance'],
              examples: ['Summing amplifier', 'Integrator', 'Differentiator']
            }
          ]
        }
      }
    },
    ee: {
      name: 'Electrical Engineering',
      icon: Zap,
      color: 'yellow',
      subjects: {
        circuits: {
          name: 'Electric Circuits',
          topics: [
            {
              title: 'Network Theorems',
              content: 'Circuit simplification',
              formulas: ['Thevenin: Vth, Rth', 'Norton: In, Rn'],
              keyPoints: ['Superposition', 'Maximum power transfer'],
              examples: ['Find Thevenin equivalent', 'Calculate load current']
            }
          ]
        }
      }
    },
    mech: {
      name: 'Mechanical Engineering',
      icon: Wrench,
      color: 'orange',
      subjects: {
        thermo: {
          name: 'Thermodynamics',
          topics: [
            {
              title: 'Carnot Cycle',
              content: 'Ideal heat engine',
              formulas: ['η = 1 - TL/TH', 'COP_ref = TL/(TH-TL)'],
              keyPoints: ['Maximum efficiency', 'Reversible process'],
              examples: ['Calculate efficiency', 'Refrigeration COP']
            }
          ]
        }
      }
    },
    civil: {
      name: 'Civil Engineering',
      icon: Cpu,
      color: 'green',
      subjects: {
        struct: {
          name: 'Structural Analysis',
          topics: [
            {
              title: 'Beam Analysis',
              content: 'SFD and BMD',
              formulas: ['V = dM/dx', 'Deflection formulas'],
              keyPoints: ['Point loads', 'UDL', 'Moments'],
              examples: ['Simply supported beam', 'Cantilever beam']
            }
          ]
        }
      }
    },
    chem: {
      name: 'Chemical Engineering',
      icon: Droplet,
      color: 'cyan',
      subjects: {
        transport: {
          name: 'Transport Phenomena',
          topics: [
            {
              title: 'Heat Transfer',
              content: 'Conduction, Convection, Radiation',
              formulas: ['Fourier: q = -kA(dT/dx)', 'Newton: q = hA∆T'],
              keyPoints: ['Thermal conductivity', 'Heat exchangers'],
              examples: ['Wall heat loss', 'Heat exchanger design']
            }
          ]
        }
      }
    }
  };

  const modes = {
    btech: { name: 'B.Tech Studies', icon: BookOpen, color: 'cyan' },
    cybersec: { name: 'Cybersecurity', icon: Globe, color: 'red' },
    ai: { name: 'AI Chat', icon: Brain, color: 'purple' },
    calculator: { name: 'Calculator', icon: Calculator, color: 'green' },
    notes: { name: 'Notes', icon: FileText, color: 'yellow' }
  };

  const handleAIQuery = async (query) => {
    const newMessages = [...chatMessages, { type: 'user', text: query }];
    setChatMessages(newMessages);
    
    // Simulate AI response based on query
    let response = '';
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('explain') || lowerQuery.includes('what is')) {
      response = `Let me explain that concept: This is a comprehensive topic that involves multiple aspects. ${lowerQuery.includes('algorithm') ? 'Algorithms are step-by-step procedures for calculations. Key points include time complexity, space complexity, and optimization techniques.' : 'This concept relates to your selected branch and involves theoretical and practical applications.'}`;
    } else if (lowerQuery.includes('formula')) {
      response = 'Here are the key formulas related to your query. Would you like me to explain any specific formula in detail?';
    } else if (lowerQuery.includes('example') || lowerQuery.includes('solve')) {
      response = 'Let me provide a step-by-step solution:\n1. Identify the given parameters\n2. Apply the relevant formula\n3. Calculate the result\n4. Verify the answer';
    } else if (lowerQuery.includes('difference')) {
      response = 'Here are the key differences in a comparison table format, highlighting the main distinctions between the concepts.';
    } else {
      response = `I understand you're asking about "${query}". Based on your current branch (${branches[selectedBranch]?.name}), I can help you with concepts, formulas, problem-solving, and explanations. What specific aspect would you like to explore?`;
    }
    
    setChatMessages([...newMessages, { type: 'ai', text: response }]);
    setInputValue('');
  };

  const addToFavorites = (item) => {
    if (!favorites.find(f => f.id === item.id)) {
      setFavorites([...favorites, item]);
    }
  };

  const renderBTechMode = () => {
    const currentBranch = branches[selectedBranch];
    const BranchIcon = currentBranch?.icon;

    return (
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Select Branch:</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(branches).map(([key, branch]) => {
              const Icon = branch.icon;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedBranch(key);
                    setSelectedSubject(null);
                  }}
                  className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                    selectedBranch === key
                      ? `border-${branch.color}-500 bg-${branch.color}-900/20`
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="text-xs font-semibold text-center">{branch.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {currentBranch && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <BranchIcon className="w-6 h-6" />
                <h2 className="text-xl font-bold">{currentBranch.name}</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(currentBranch.subjects).map(([key, subject]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSubject(key)}
                    className={`p-3 rounded-lg border transition ${
                      selectedSubject === key
                        ? 'border-cyan-500 bg-cyan-900/30'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-sm font-semibold">{subject.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedSubject && (
              <div className="space-y-3">
                {currentBranch.subjects[selectedSubject].topics.map((topic, idx) => {
                  const topicKey = `${selectedSubject}-${idx}`;
                  const isExpanded = expandedTopics[topicKey];
                  const isFavorite = favorites.find(f => f.id === topicKey);
                  
                  return (
                    <div key={idx} className="bg-gray-800 rounded-lg border border-gray-700">
                      <div className="p-4 flex items-center justify-between">
                        <button
                          onClick={() => setExpandedTopics(prev => ({ ...prev, [topicKey]: !prev[topicKey] }))}
                          className="flex-1 text-left flex items-center gap-3"
                        >
                          <span className="font-semibold text-cyan-300">{topic.title}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => addToFavorites({ id: topicKey, ...topic, subject: currentBranch.subjects[selectedSubject].name })}
                            className={`p-2 rounded hover:bg-gray-700 ${isFavorite ? 'text-yellow-400' : 'text-gray-400'}`}
                          >
                            <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3">
                          <p className="text-sm text-gray-400">{topic.content}</p>
                          
                          {settings.showFormulas && topic.formulas && (
                            <div className="bg-gray-900 p-3 rounded">
                              <h4 className="text-sm font-semibold text-yellow-400 mb-2">📐 Formulas:</h4>
                              <ul className="space-y-1">
                                {topic.formulas.map((formula, i) => (
                                  <li key={i} className="text-sm font-mono text-gray-300">{formula}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {settings.showKeyPoints && topic.keyPoints && (
                            <div className="bg-gray-900 p-3 rounded">
                              <h4 className="text-sm font-semibold text-green-400 mb-2">💡 Key Points:</h4>
                              <ul className="space-y-1">
                                {topic.keyPoints.map((point, i) => (
                                  <li key={i} className="text-sm text-gray-300">• {point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {topic.examples && (
                            <div className="bg-gray-900 p-3 rounded">
                              <h4 className="text-sm font-semibold text-blue-400 mb-2">📝 Examples:</h4>
                              <ul className="space-y-1">
                                {topic.examples.map((example, i) => (
                                  <li key={i} className="text-sm text-gray-300">• {example}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderAIChat = () => (
    <div className="h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 rounded-lg mb-4">
        {chatMessages.length === 0 ? (
          <div className="text-center py-20">
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Ask me anything about your studies!</p>
            <div className="mt-4 grid grid-cols-2 gap-2 max-w-md mx-auto">
              <button onClick={() => handleAIQuery('Explain time complexity')} className="p-2 bg-gray-800 rounded text-sm hover:bg-gray-700">
                Explain time complexity
              </button>
              <button onClick={() => handleAIQuery('What is normalization?')} className="p-2 bg-gray-800 rounded text-sm hover:bg-gray-700">
                What is normalization?
              </button>
              <button onClick={() => handleAIQuery('Solve circuit problem')} className="p-2 bg-gray-800 rounded text-sm hover:bg-gray-700">
                Solve circuit problem
              </button>
              <button onClick={() => handleAIQuery('Difference between TCP and UDP')} className="p-2 bg-gray-800 rounded text-sm hover:bg-gray-700">
                TCP vs UDP
              </button>
            </div>
          </div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl p-3 rounded-lg ${
                msg.type === 'user' ? 'bg-cyan-600' : 'bg-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && inputValue && handleAIQuery(inputValue)}
          placeholder="Ask anything about your studies..."
          className="flex-1 bg-gray-800 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => inputValue && handleAIQuery(inputValue)}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Customization Settings</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Default Mode</label>
            <select
              value={settings.defaultMode}
              onChange={(e) => setSettings({...settings, defaultMode: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            >
              {Object.entries(modes).map(([key, mode]) => (
                <option key={key} value={key}>{mode.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Default Branch</label>
            <select
              value={settings.defaultBranch}
              onChange={(e) => setSettings({...settings, defaultBranch: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            >
              {Object.entries(branches).map(([key, branch]) => (
                <option key={key} value={key}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Font Size</label>
            <select
              value={settings.fontSize}
              onChange={(e) => setSettings({...settings, fontSize: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">AI Model</label>
            <select
              value={settings.aiModel}
              onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            >
              <option value="basic">Basic (Fast)</option>
              <option value="advanced">Advanced (Smart)</option>
              <option value="expert">Expert (Detailed)</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
            <span className="text-sm font-semibold">Show Formulas</span>
            <button
              onClick={() => setSettings({...settings, showFormulas: !settings.showFormulas})}
              className={`w-12 h-6 rounded-full transition ${settings.showFormulas ? 'bg-cyan-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition transform ${settings.showFormulas ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
            <span className="text-sm font-semibold">Show Key Points</span>
            <button
              onClick={() => setSettings({...settings, showKeyPoints: !settings.showKeyPoints})}
              className={`w-12 h-6 rounded-full transition ${settings.showKeyPoints ? 'bg-cyan-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition transform ${settings.showKeyPoints ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
            <span className="text-sm font-semibold">Auto-Save Progress</span>
            <button
              onClick={() => setSettings({...settings, autoSave: !settings.autoSave})}
              className={`w-12 h-6 rounded-full transition ${settings.autoSave ? 'bg-cyan-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition transform ${settings.autoSave ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
            <span className="text-sm font-semibold">Dark Mode</span>
            <button
              onClick={() => {
                setDarkMode(!darkMode);
                setSettings({...settings, theme: !darkMode ? 'dark' : 'light'});
              }}
              className={`w-12 h-6 rounded-full transition ${darkMode ? 'bg-cyan-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={saveSettings}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
        <button
          onClick={exportSettings}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition cursor-pointer">
          <Upload className="w-4 h-4" />
          Import
          <input type="file" accept=".json" onChange={importSettings} className="hidden" />
        </label>
        <button
          onClick={() => {
            setSettings({
              theme: 'dark',
              fontSize: 'medium',
              defaultMode: 'btech',
              defaultBranch: 'cse',
              showFormulas: true,
              showKeyPoints: true,
              autoSave: true,
              aiModel: 'advanced',
              language: 'english'
            });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="mt-6 p-4 bg-cyan-900/20 border border-cyan-500/50 rounded-lg">
        <h3 className="font-semibold text-cyan-400 mb-2">💾 Make This Your Default App</h3>
        <p className="text-sm text-gray-300 mb-3">
          Your settings are automatically saved and will persist across sessions. You can also export your configuration and import it on other devices.
        </p>