import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2 } from "lucide-react";

const LandingPage = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate("/builder", { state: { prompt } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Wand2 className="h-16 w-16 text-indigo-400" />
          </div>
          <h1 className="text-5xl font-bold mb-6 text-gray-100">
            Create Your Dream Website
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            Describe your perfect website, and we'll help you bring it to life.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your website... (e.g., 'Create a modern portfolio website with a dark theme')"
                className="w-full p-4 h-32 text-lg bg-gray-800 text-gray-100 border-2 border-indigo-500 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 transition-all duration-200 resize-none placeholder-gray-500"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
            >
              Generate Website
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
