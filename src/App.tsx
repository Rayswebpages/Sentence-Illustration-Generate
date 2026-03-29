/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Image as ImageIcon, 
  Type, 
  Sparkles, 
  Trash2, 
  Download, 
  Settings2,
  ChevronRight,
  Loader2,
  Plus
} from 'lucide-react';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface GeneratedItem {
  id: string;
  sentence: string;
  imageUrl: string;
  loading: boolean;
  error?: string;
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [showSentences, setShowSentences] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [style, setStyle] = useState('irasutoya'); // 'irasutoya' or 'modern'

  const generateImages = async () => {
    if (!inputText.trim()) return;

    const sentences = inputText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length === 0) return;

    setIsGenerating(true);
    
    // Create placeholders for new items
    const newItems: GeneratedItem[] = sentences.map((sentence, index) => ({
      id: `${Date.now()}-${index}`,
      sentence,
      imageUrl: '',
      loading: true
    }));

    setItems(prev => [...newItems, ...prev]);
    setInputText('');

    // Process each sentence
    for (const item of newItems) {
      try {
        const prompt = style === 'irasutoya' 
          ? `A cute Japanese illustration in the style of Irasutoya (flat design, simple colors, rounded characters) depicting: ${item.sentence}. The image must NOT contain any text, letters, or words.`
          : `A high-quality modern digital illustration depicting: ${item.sentence}. The image must NOT contain any text, letters, or words.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        let imageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        if (imageUrl) {
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, imageUrl, loading: false } : i));
        } else {
          throw new Error('No image generated');
        }
      } catch (error) {
        console.error('Generation error:', error);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, loading: false, error: 'Failed to generate image' } : i));
      }
    }

    setIsGenerating(false);
  };

  const clearAll = () => {
    setItems([]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sentence Illustrator</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">AI Powered Visuals</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-full p-1">
              <button 
                onClick={() => setShowSentences(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!showSentences ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ImageIcon size={16} className="inline mr-2" />
                Pure Grid
              </button>
              <button 
                onClick={() => setShowSentences(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${showSentences ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Type size={16} className="inline mr-2" />
                With Text
              </button>
            </div>
            
            <button 
              onClick={clearAll}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear All"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Input Section */}
        <section className="mb-12">
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <Plus size={16} className="text-blue-500" />
                  Enter Sentences
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Style:</span>
                  <select 
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="text-xs font-bold bg-gray-50 border-none rounded-lg px-2 py-1 focus:ring-0 cursor-pointer"
                  >
                    <option value="irasutoya">Irasutoya Style</option>
                    <option value="modern">Modern Style</option>
                  </select>
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your sentences here... (One per line)&#10;Example:&#10;A cat drinking coffee&#10;A robot dancing in the rain"
                className="w-full h-40 p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all resize-none text-lg outline-none placeholder:text-gray-300"
              />
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-4">
              <p className="text-xs text-gray-400 italic">
                {inputText.split('\n').filter(s => s.trim()).length} sentences detected
              </p>
              <button
                onClick={generateImages}
                disabled={isGenerating || !inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                Generate Illustrations
              </button>
            </div>
          </div>
        </section>

        {/* Results Grid */}
        <section>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <ImageIcon size={48} />
              </div>
              <p className="text-xl font-medium">Your generated illustrations will appear here</p>
              <p className="text-sm mt-2">Start by typing some sentences above</p>
            </div>
          ) : (
            <div className={`grid gap-8 ${showSentences ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}>
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className={`group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 ${!showSentences ? 'aspect-square' : ''}`}
                  >
                    {/* Image Container */}
                    <div className={`relative bg-gray-50 overflow-hidden ${showSentences ? 'aspect-square' : 'h-full'}`}>
                      {item.loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <Loader2 className="animate-spin text-blue-500" size={32} />
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Creating...</span>
                        </div>
                      ) : item.error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                            <Settings2 size={24} />
                          </div>
                          <p className="text-sm font-bold text-red-500">{item.error}</p>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 underline"
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <>
                          <img 
                            src={item.imageUrl} 
                            alt={item.sentence}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <a 
                              href={item.imageUrl} 
                              download={`illustration-${item.id}.png`}
                              className="p-3 bg-white rounded-full text-gray-900 hover:bg-blue-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0"
                            >
                              <Download size={20} />
                            </a>
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="p-3 bg-white rounded-full text-gray-900 hover:bg-red-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 delay-75"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Text Content */}
                    {showSentences && (
                      <div className="p-5">
                        <p className="text-sm font-medium text-gray-800 line-clamp-3 leading-relaxed">
                          {item.sentence}
                        </p>
                      </div>
                    )}
                    
                    {/* Quick Label for Pure Grid */}
                    {!showSentences && !item.loading && !item.error && (
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/20 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-900 truncate uppercase tracking-tight">
                            {item.sentence}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 mt-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Powered by Gemini 2.5 Flash</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Inspired by Irasutoya Style Illustrations
          </p>
        </div>
      </footer>
    </div>
  );
}
